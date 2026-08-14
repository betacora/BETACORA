/**
 * Google Places API (Legacy) — Text Search (server-only).
 *
 * Uses the classic Places Text Search endpoint so it works with API keys that
 * are restricted to "Places API" (not only "Places API (New)").
 *
 * Auth: `key` query param on the *outbound server* request only — never sent
 * to the browser. Errors are scrubbed before returning JSON to the client.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/search-text
 *
 * Prefer Text Search over Autocomplete for Descubre: one call returns places with
 * name/address/rating/coords; Autocomplete only yields predictions and needs a
 * second Place Details round-trip for the same data.
 */

const TEXT_SEARCH_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 15;
const QUERY_MAX_LEN = 200;

export type PlacesSearchInput = {
  query: string;
  /** Places `language` param, e.g. "es", "en", "fr" */
  language?: string | null;
  /** Cap results (default 8, max 15) */
  limit?: number;
};

export type PlaceSearchResult = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  ratingCount: number | null;
  types: string[];
  mapsUrl: string | null;
};

export type PlacesSearchResponse = {
  query: string;
  language: string | null;
  count: number;
  places: PlaceSearchResult[];
};

export class PlacesConfigError extends Error {
  readonly code = "misconfigured" as const;
  constructor(message = "GOOGLE_PLACES_API_KEY is not set") {
    super(message);
    this.name = "PlacesConfigError";
  }
}

export class PlacesValidationError extends Error {
  readonly code = "validation_error" as const;
  constructor(message: string) {
    super(message);
    this.name = "PlacesValidationError";
  }
}

export class PlacesUpstreamError extends Error {
  readonly code = "places_upstream" as const;
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PlacesUpstreamError";
    this.status = status;
  }
}

function requireApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    throw new PlacesConfigError(
      "GOOGLE_PLACES_API_KEY is not set. Add it as a server-only env var (never NEXT_PUBLIC_*).",
    );
  }
  return key;
}

function normalizeQuery(raw: string): string {
  const q = raw.replace(/\s+/g, " ").trim();
  if (!q) {
    throw new PlacesValidationError("q is required (non-empty search text)");
  }
  if (q.length > QUERY_MAX_LEN) {
    throw new PlacesValidationError(
      `q is too long (max ${QUERY_MAX_LEN} characters)`,
    );
  }
  return q;
}

function clampLimit(raw: number | undefined): number {
  if (raw === undefined || !Number.isFinite(raw)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(raw)));
}

type GoogleLegacyPlace = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
};

type GoogleLegacyTextSearchResponse = {
  status?: string;
  error_message?: string;
  results?: GoogleLegacyPlace[];
};

/**
 * Strip anything that could echo the API key from upstream error text.
 * Legacy Text Search puts `key=` in the request URL; Google error bodies must
 * never be forwarded raw to the browser.
 */
export function scrubSecrets(text: string, apiKey?: string): string {
  let out = text;
  const key = apiKey ?? process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (key && key.length >= 8) {
    out = out.split(key).join("[redacted]");
  }
  out = out.replace(/([?&]key=)[^&\s"']+/gi, "$1[redacted]");
  out = out.replace(
    /(X-Goog-Api-Key["']?\s*[:=]\s*["']?)[^"'\s,]+/gi,
    "$1[redacted]",
  );
  return out;
}

function mapsUrlForPlace(placeId: string | null, name: string): string | null {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  }
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }
  return null;
}

function mapPlace(raw: GoogleLegacyPlace): PlaceSearchResult | null {
  const id =
    typeof raw.place_id === "string" && raw.place_id.trim()
      ? raw.place_id.trim()
      : "";
  const name =
    typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "";
  if (!id && !name) return null;

  const lat = raw.geometry?.location?.lat;
  const lng = raw.geometry?.location?.lng;

  return {
    id: id || name,
    name: name || id,
    address:
      typeof raw.formatted_address === "string" && raw.formatted_address.trim()
        ? raw.formatted_address.trim()
        : null,
    lat: typeof lat === "number" && Number.isFinite(lat) ? lat : null,
    lng: typeof lng === "number" && Number.isFinite(lng) ? lng : null,
    rating:
      typeof raw.rating === "number" && Number.isFinite(raw.rating)
        ? raw.rating
        : null,
    ratingCount:
      typeof raw.user_ratings_total === "number" &&
      Number.isFinite(raw.user_ratings_total)
        ? raw.user_ratings_total
        : null,
    types: Array.isArray(raw.types)
      ? raw.types.filter((t): t is string => typeof t === "string").slice(0, 8)
      : [],
    mapsUrl: mapsUrlForPlace(id || null, name),
  };
}

/**
 * Text Search (Legacy). API key is used only on the outbound server request.
 * Returned objects are a sanitized subset — never include the raw Google payload.
 */
export async function searchPlacesText(
  input: PlacesSearchInput,
): Promise<PlacesSearchResponse> {
  const apiKey = requireApiKey();
  const query = normalizeQuery(input.query);
  const limit = clampLimit(input.limit);
  const language =
    typeof input.language === "string" && input.language.trim()
      ? input.language.trim().slice(0, 16)
      : null;

  const url = new URL(TEXT_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  if (language) url.searchParams.set("language", language);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    const msg = scrubSecrets(
      err instanceof Error ? err.message : "Places network error",
      apiKey,
    );
    throw new PlacesUpstreamError(msg, 502);
  }

  const rawText = await res.text();
  const safeText = scrubSecrets(rawText, apiKey);

  let data: GoogleLegacyTextSearchResponse = {};
  try {
    data = rawText ? (JSON.parse(rawText) as GoogleLegacyTextSearchResponse) : {};
  } catch {
    throw new PlacesUpstreamError(
      `Places API returned non-JSON (HTTP ${res.status})`,
      res.status || 502,
    );
  }

  if (!res.ok) {
    throw new PlacesUpstreamError(
      scrubSecrets(
        data.error_message || safeText.slice(0, 240) || `Places API HTTP ${res.status}`,
        apiKey,
      ),
      502,
    );
  }

  const status = (data.status || "").toUpperCase();
  if (status && status !== "OK" && status !== "ZERO_RESULTS") {
    const upstreamMsg = scrubSecrets(
      data.error_message || `Places API status: ${status}`,
      apiKey,
    );
    throw new PlacesUpstreamError(upstreamMsg, 502);
  }

  const places = (Array.isArray(data.results) ? data.results : [])
    .map(mapPlace)
    .filter((p): p is PlaceSearchResult => p !== null)
    .slice(0, limit);

  return {
    query,
    language,
    count: places.length,
    places,
  };
}
