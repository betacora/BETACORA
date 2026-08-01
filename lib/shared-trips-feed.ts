import { createClient } from "@supabase/supabase-js";
import {
  isExampleTripSlug,
  mergeDiscoverFeedWithExamples,
} from "@/lib/example-trips";

export type FeedTripPlace = {
  name: string;
  lat: number;
  lng: number;
  type?: string;
  day?: number | string | null;
};

/** Public feed card — never includes user_id, email, or full HTML. */
export type FeedTripCard = {
  slug: string;
  destination: string | null;
  duration_label: string | null;
  profile_type: string | null;
  highlights: string[];
  places: FeedTripPlace[];
  lang: string | null;
  created_at: string;
  /** Official BeTacora sample — show Ejemplo badge; not a real traveler. */
  is_example: boolean;
};

function asPlaces(value: unknown): FeedTripPlace[] {
  if (!Array.isArray(value)) return [];
  const out: FeedTripPlace[] = [];
  for (const p of value.slice(0, 12)) {
    if (!p || typeof p !== "object") continue;
    const row = p as Record<string, unknown>;
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    const name = String(row.name ?? "").trim().slice(0, 120);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      name,
      lat,
      lng,
      type: row.type != null ? String(row.type).slice(0, 32) : undefined,
      day: (row.day as FeedTripPlace["day"]) ?? null,
    });
  }
  return out;
}

function asHighlights(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((h) => String(h ?? "").trim().slice(0, 140))
    .filter(Boolean)
    .slice(0, 3);
}

/**
 * Public Descubre feed: only trips with explicit show_in_feed = true,
 * plus official BeTacora examples (is_example) so the feed is never empty
 * before organic opt-ins exist.
 * Does not return personal identity fields.
 */
export async function fetchDiscoverFeed(limit = 24): Promise<FeedTripCard[]> {
  const capped = Math.min(48, Math.max(1, limit));
  const fromDb = await fetchDiscoverFeedFromDb(capped);
  return mergeDiscoverFeedWithExamples(fromDb, capped);
}

async function fetchDiscoverFeedFromDb(capped: number): Promise<FeedTripCard[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("shared_trips")
    .select(
      "slug, destination, duration_label, profile_type, highlights, places, lang, created_at, is_example",
    )
    .eq("show_in_feed", true)
    .order("created_at", { ascending: false })
    .limit(capped);

  if (error || !data) {
    // Columns may be missing before migrations — try without is_example / show_in_feed
    if (error && /is_example|show_in_feed|schema cache|column/i.test(error.message || "")) {
      return fetchDiscoverFeedLegacy(supabase, capped);
    }
    console.warn("[descubre] feed query failed:", error?.message);
    return [];
  }

  return data
    .filter((row) => typeof row.slug === "string" && /^[a-z0-9]{6,16}$/.test(row.slug))
    .map((row) =>
      mapFeedRow(
        row,
        row.is_example === true || isExampleTripSlug(String(row.slug)),
      ),
    );
}

async function fetchDiscoverFeedLegacy(
  supabase: ReturnType<typeof createClient>,
  capped: number,
): Promise<FeedTripCard[]> {
  // Without show_in_feed, do not list arbitrary share links — only empty DB list;
  // official examples still come from mergeDiscoverFeedWithExamples.
  const { data, error } = await supabase
    .from("shared_trips")
    .select(
      "slug, destination, duration_label, profile_type, highlights, places, lang, created_at",
    )
    .eq("show_in_feed", true)
    .order("created_at", { ascending: false })
    .limit(capped);

  if (error || !data) {
    if (error) {
      console.warn("[descubre] feed query failed:", error.message);
    }
    return [];
  }

  return data
    .filter((row) => typeof row.slug === "string" && /^[a-z0-9]{6,16}$/.test(row.slug))
    .map((row) =>
      mapFeedRow(row, isExampleTripSlug(String(row.slug))),
    );
}

function mapFeedRow(
  row: Record<string, unknown>,
  isExample: boolean,
): FeedTripCard {
  return {
    slug: row.slug as string,
    destination:
      row.destination != null
        ? String(row.destination).trim().slice(0, 160) || null
        : null,
    duration_label:
      row.duration_label != null
        ? String(row.duration_label).trim().slice(0, 80) || null
        : null,
    profile_type:
      row.profile_type != null
        ? String(row.profile_type).trim().slice(0, 120) || null
        : null,
    highlights: asHighlights(row.highlights),
    places: asPlaces(row.places),
    lang: row.lang != null ? String(row.lang).slice(0, 8) : null,
    created_at: String(row.created_at ?? ""),
    is_example: isExample,
  };
}
