import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireSupabaseUser } from "@/lib/apiAuth";
import {
  enforceAnonIpSafetyNet,
  enforceRateLimit,
} from "@/lib/rateLimit";
import { searchActivities, type ViatorSort, type ViatorSortOrder } from "@/lib/viator";

export const runtime = "nodejs";

const USER_HOURLY_LIMIT = 30;

type SearchBody = {
  /** City name (e.g. "Paris") or numeric Viator destinationId */
  destination?: string | number;
  /** Alias */
  dest?: string | number;
  startDate?: string | null;
  endDate?: string | null;
  /** Optional Viator category tag ids */
  tags?: number[];
  currency?: string;
  language?: string;
  sort?: ViatorSort;
  order?: ViatorSortOrder;
  /** Cap results (default 10, max 50) */
  limit?: number;
  count?: number;
};

async function gate(req: NextRequest): Promise<Response | null> {
  const auth = await requireSupabaseUser(req);
  if (!isAuthed(auth)) {
    const anonBlock = await enforceAnonIpSafetyNet(req, "viator");
    if (anonBlock) return anonBlock;
    return auth;
  }

  const limited = await enforceRateLimit({
    key: `user:${auth.user.id}`,
    limit: USER_HOURLY_LIMIT,
    window: "1 h",
    failMode: "closed",
    label: "viator-search",
    message:
      "Has alcanzado el límite de búsquedas de actividades por ahora, inténtalo en unos minutos.",
  });
  return limited;
}

/**
 * Affiliate product search via Viator Partner API (read-only — no bookings).
 * Requires Supabase session (Authorization: Bearer …).
 *
 * POST /api/viator/search-activities
 * Body: { destination, startDate?, endDate?, tags?, currency?, language?, limit? }
 *
 * GET  /api/viator/search-activities?destination=Paris&limit=5
 */
export async function POST(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  try {
    const body = (await req.json()) as SearchBody;
    return NextResponse.json(await runSearch(body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  try {
    const q = req.nextUrl.searchParams;
    const tagsRaw = q.get("tags");
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => Number(t.trim()))
          .filter((n) => Number.isFinite(n))
      : undefined;

    return NextResponse.json(
      await runSearch({
        destination: q.get("destination") ?? q.get("dest") ?? undefined,
        startDate: q.get("startDate"),
        endDate: q.get("endDate"),
        tags,
        currency: q.get("currency") ?? undefined,
        language: q.get("language") ?? undefined,
        sort: (q.get("sort") as ViatorSort) || undefined,
        order: (q.get("order") as ViatorSortOrder) || undefined,
        limit: q.get("limit") ? Number(q.get("limit")) : undefined,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

async function runSearch(body: SearchBody) {
  const destination = body.destination ?? body.dest;
  if (destination === undefined || destination === null || destination === "") {
    throw new ValidationError("destination is required (city name or Viator destinationId)");
  }

  const limitRaw = body.limit ?? body.count ?? 10;
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? Number(limitRaw) : 10));

  const result = await searchActivities({
    destination,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    tags: body.tags,
    currency: body.currency,
    language: body.language,
    sort: body.sort,
    order: body.order,
    count: limit,
  });

  return {
    ok: true,
    note: "Affiliate search only — bookings complete on viator.com via productUrl. Not wired to the itinerary UI yet.",
    search: {
      destinationInput: destination,
      destinationId: result.destination.destinationId,
      destinationName: result.destination.name,
      destinationType: result.destination.type,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      tags: body.tags ?? null,
      currency: result.currency,
      language: result.language,
    },
    totalCount: result.totalCount,
    count: result.activities.length,
    activities: result.activities,
  };
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const missingKey = message.includes("VIATOR_API_KEY is not set");
  const validation =
    error instanceof ValidationError ||
    message.includes("destination is required") ||
    message.includes("Could not resolve destination") ||
    message.includes("must be YYYY-MM-DD") ||
    message.includes("Unknown Viator destinationId");

  return NextResponse.json(
    {
      ok: false,
      error: message,
      hint: missingKey
        ? "Add VIATOR_API_KEY to .env.local (Viator Partner Platform → Tools → Affiliate API), then restart next dev."
        : undefined,
    },
    { status: validation ? 400 : missingKey ? 503 : 502 },
  );
}
