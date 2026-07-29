import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  checkMemoryRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import {
  sanitizeItineraryHtml,
  scanShareableContent,
} from "@/lib/sanitize-itinerary-html";

export const runtime = "nodejs";

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function makeSlug(len = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (let i = 0; i < len; i++) {
    out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return out;
}

function truncate(value: unknown, max: number): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function asStringArray(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => truncate(v, maxLen))
    .filter((v): v is string => !!v)
    .slice(0, maxItems);
}

type PlaceIn = {
  name?: unknown;
  day?: unknown;
  lat?: unknown;
  lng?: unknown;
  type?: unknown;
  note?: unknown;
};

function normalizePlaces(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 40)
    .map((p: PlaceIn) => {
      const lat = Number(p?.lat);
      const lng = Number(p?.lng);
      const name = truncate(p?.name, 120);
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const type = truncate(p?.type, 32) || "sight";
      const dayRaw = p?.day;
      const day =
        dayRaw == null || dayRaw === ""
          ? null
          : Number.isFinite(Number(dayRaw))
            ? Number(dayRaw)
            : truncate(dayRaw, 16);
      const note = truncate(p?.note, 160);
      return note
        ? { name, lat, lng, type, day, note }
        : { name, lat, lng, type, day };
    })
    .filter(Boolean);
}

/**
 * POST /api/share-trip
 * Creates a public read-only trip snapshot. Returns { slug, url }.
 * Gracefully fails if shared_trips table is not yet migrated.
 */
export async function POST(req: NextRequest) {
  const limited = checkMemoryRateLimit({
    key: `share-trip:${clientIp(req)}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "supabase_not_configured", imageOnly: true },
      { status: 503 }
    );
  }

  // Optional owner for GDPR account deletion (guest shares stay user_id null)
  let ownerUserId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    ownerUserId = user?.id ?? null;
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const destination = truncate(body.destination, 160);
  const durationLabel = truncate(body.duration_label, 80);
  const profileType = truncate(body.profile_type, 120);
  const lang = truncate(body.lang, 8) || "es";
  const highlights = asStringArray(body.highlights, 5, 140);
  const places = normalizePlaces(body.places);
  const rawHtml = truncate(body.itinerary_html, 500_000);
  const itineraryHtml = rawHtml
    ? sanitizeItineraryHtml(rawHtml, {
        keepPlacesScript: false,
        stripUntrustedUrlsInText: true,
      })
    : null;

  if (!destination && !itineraryHtml) {
    return NextResponse.json({ error: "empty_trip" }, { status: 400 });
  }

  const safety = scanShareableContent(
    destination,
    durationLabel,
    profileType,
    highlights.join("\n"),
    itineraryHtml,
    JSON.stringify(places),
  );
  if (!safety.ok) {
    return NextResponse.json(
      {
        error: "share_blocked",
        reason: safety.reason,
        detail: "Content failed public share safety scan",
        imageOnly: true,
      },
      { status: 422 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = makeSlug(10);
    const { error } = await supabase.from("shared_trips").insert({
      slug,
      destination,
      duration_label: durationLabel,
      profile_type: profileType,
      highlights,
      places,
      itinerary_html: itineraryHtml,
      lang,
      ...(ownerUserId ? { user_id: ownerUserId } : {}),
    });

    if (!error) {
      const origin = req.nextUrl.origin;
      return NextResponse.json({
        slug,
        url: `${origin}/viaje/${slug}`,
      });
    }

    lastError = error.message;
    // Unique violation — retry with a new slug
    if (error.code === "23505") continue;

    // Table missing / RLS not applied yet → image-only fallback
    const msg = (error.message || "").toLowerCase();
    if (
      msg.includes("shared_trips") ||
      msg.includes("schema cache") ||
      msg.includes("does not exist") ||
      error.code === "42P01" ||
      error.code === "42501"
    ) {
      return NextResponse.json(
        { error: "share_table_unavailable", imageOnly: true, detail: error.message },
        { status: 503 }
      );
    }

    break;
  }

  return NextResponse.json(
    { error: "share_failed", detail: lastError, imageOnly: true },
    { status: 500 }
  );
}
