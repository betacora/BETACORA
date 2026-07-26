import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireSupabaseUser } from "@/lib/apiAuth";
import { resolveSearchAirports } from "@/lib/cityAirports";
import { searchFlights, type DuffelPassengerInput } from "@/lib/duffel";
import {
  enforceAnonIpSafetyNet,
  enforceRateLimit,
} from "@/lib/rateLimit";

export const runtime = "nodejs";

const USER_HOURLY_LIMIT = 30;

type SearchBody = {
  /** IATA code or city name (e.g. MAD or "Madrid") */
  origin?: string;
  /** IATA code or city name */
  destination?: string;
  departureDate?: string;
  /** Alias accepted for convenience */
  date?: string;
  returnDate?: string | null;
  passengers?: number | DuffelPassengerInput[];
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  /** Cap offers in the response (default 10, max 50) */
  limit?: number;
};

async function gate(req: NextRequest): Promise<Response | null> {
  const auth = await requireSupabaseUser(req);
  if (!isAuthed(auth)) {
    const anonBlock = await enforceAnonIpSafetyNet(req, "duffel");
    if (anonBlock) return anonBlock;
    return auth;
  }

  const limited = await enforceRateLimit({
    key: `user:${auth.user.id}`,
    limit: USER_HOURLY_LIMIT,
    window: "1 h",
    failMode: "closed",
    label: "duffel-search",
    message:
      "Has alcanzado el límite de búsquedas de vuelos por ahora, inténtalo en unos minutos.",
  });
  return limited;
}

/**
 * Sandbox-only flight offer search via Duffel (read-only — no orders/payments).
 * Requires Supabase session (Authorization: Bearer …).
 *
 * POST /api/duffel/search-offers
 * Body: { origin, destination, departureDate, returnDate?, passengers?, cabinClass? }
 *
 * GET  /api/duffel/search-offers?origin=MAD&destination=LIS&departureDate=2026-09-15&passengers=1
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
    const passengersRaw = q.get("passengers");
    const passengers = passengersRaw ? Number(passengersRaw) : 1;

    return NextResponse.json(
      await runSearch({
        origin: q.get("origin") ?? undefined,
        destination: q.get("destination") ?? undefined,
        departureDate: q.get("departureDate") ?? q.get("date") ?? undefined,
        returnDate: q.get("returnDate"),
        passengers: Number.isFinite(passengers) ? passengers : 1,
        cabinClass: (q.get("cabinClass") as SearchBody["cabinClass"]) || undefined,
        limit: q.get("limit") ? Number(q.get("limit")) : undefined,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

async function runSearch(body: SearchBody) {
  const originRaw = body.origin?.trim();
  const destinationRaw = body.destination?.trim();
  const departureDate = (body.departureDate || body.date)?.trim();

  if (!originRaw || !destinationRaw || !departureDate) {
    throw new ValidationError(
      "origin, destination, and departureDate (YYYY-MM-DD) are required",
    );
  }

  const resolved = resolveSearchAirports(originRaw, destinationRaw);
  if ("error" in resolved) {
    throw new ValidationError(resolved.error);
  }

  const { origin, destination } = resolved;

  const result = await searchFlights({
    origin,
    destination,
    departureDate,
    returnDate: body.returnDate || null,
    passengers: body.passengers ?? 1,
    cabinClass: body.cabinClass ?? "economy",
  });

  const limitRaw = body.limit ?? 10;
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 10));

  return {
    ok: true,
    mode: "sandbox",
    note: "Sandbox results often include Duffel Airways (ZZ). Unrealistic schedules/prices are normal in test mode. No orders or payments are created.",
    search: {
      origin,
      destination,
      originInput: originRaw,
      destinationInput: destinationRaw,
      departureDate,
      returnDate: body.returnDate || null,
      passengers: body.passengers ?? 1,
      cabinClass: body.cabinClass ?? "economy",
    },
    offerRequestId: result.offerRequestId,
    liveMode: result.liveMode,
    count: result.offers.length,
    offers: result.offers.slice(0, limit),
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
  const missingKey = message.includes("DUFFEL_API_KEY is not set");
  const badKey = message.includes("must be a test/sandbox token");
  const validation = error instanceof ValidationError;

  return NextResponse.json(
    {
      ok: false,
      mode: "sandbox",
      error: message,
      hint: missingKey
        ? "Add DUFFEL_API_KEY=duffel_test_... to .env.local (Duffel dashboard → test mode), then restart next dev."
        : badKey
          ? "Use a sandbox token that starts with duffel_test_."
          : undefined,
    },
    { status: validation ? 400 : missingKey || badKey ? 503 : 502 },
  );
}
