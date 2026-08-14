/**
 * Google Places — Text Search (server-only).
 *
 * Tries Places API (New) `places:searchText` first, then Legacy Text Search if
 * Google rejects the key for New. That covers keys restricted to either
 * "Places API (New)" or classic "Places API".
 *
 * The API key is used only on outbound server requests (header for New, query
 * param for Legacy) and is scrubbed from any client-facing JSON.
 *
 * Prefer Text Search over Autocomplete for Descubre: one call returns places with
 * name/address/rating/coords; Autocomplete only yields predictions and needs a
 * second Place Details round-trip for the same data.
 */

const SEARCH_TEXT_NEW_URL =
  "https://places.googleapis.com/v1/places:searchText";
const SEARCH_TEXT_LEGACY_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.googleMapsUri",
].join(",");

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 15;
const QUERY_MAX_LEN = 200;

export type PlacesSearchInput = {
  query: string;
  /** BCP-47 / Places language code, e.g. "es", "en", "fr" */
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
  /** Which Google endpoint produced the results */
  provider: "places_new" | "places_legacy";
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

/**
 * Strip anything that could echo the API key from upstream error text.
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

function isAuthRejection(message: string): boolean {
  return /not authorized|blocked|REQUEST_DENIED|API_KEY_HTTP_REFERRER_BLOCKED|API key/i.test(
    message,
  );
}

function mapsUrlForPlaceId(placeId: string | null, name: string): string | null {
  if (placeId) {
    const id = placeId.replace(/^places\//, "");
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(id)}`;
  }
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }
  return null;
}

type NewPlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  googleMapsUri?: string;
};

type LegacyPlace = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
};

function mapNewPlace(raw: NewPlace): PlaceSearchResult | null {
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "";
  const name =
    (typeof raw.displayName?.text === "string" && raw.displayName.text.trim()) ||
    (typeof raw.name === "string" && raw.name.trim()) ||
    "";
  if (!id && !name) return null;
  const lat = raw.location?.latitude;
  const lng = raw.location?.longitude;
  return {
    id: id || name,
    name: name || id,
    address:
      typeof raw.formattedAddress === "string" && raw.formattedAddress.trim()
        ? raw.formattedAddress.trim()
        : null,
    lat: typeof lat === "number" && Number.isFinite(lat) ? lat : null,
    lng: typeof lng === "number" && Number.isFinite(lng) ? lng : null,
    rating:
      typeof raw.rating === "number" && Number.isFinite(raw.rating)
        ? raw.rating
        : null,
    ratingCount:
      typeof raw.userRatingCount === "number" &&
      Number.isFinite(raw.userRatingCount)
        ? raw.userRatingCount
        : null,
    types: Array.isArray(raw.types)
      ? raw.types.filter((t): t is string => typeof t === "string").slice(0, 8)
      : [],
    mapsUrl:
      typeof raw.googleMapsUri === "string" && raw.googleMapsUri.trim()
        ? raw.googleMapsUri.trim()
        : mapsUrlForPlaceId(id || null, name),
  };
}

function mapLegacyPlace(raw: LegacyPlace): PlaceSearchResult | null {
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
    mapsUrl: mapsUrlForPlaceId(id || null, name),
  };
}

async function searchNew(
  apiKey: string,
  query: string,
  language: string | null,
  limit: number,
): Promise<PlaceSearchResult[]> {
  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: limit,
  };
  if (language) body.languageCode = language;

  let res: Response;
  try {
    res = await fetch(SEARCH_TEXT_NEW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    throw new PlacesUpstreamError(
      scrubSecrets(
        err instanceof Error ? err.message : "Places network error",
        apiKey,
      ),
      502,
    );
  }

  const rawText = await res.text();
  let data: {
    places?: NewPlace[];
    error?: { message?: string };
  } = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new PlacesUpstreamError(
      `Places API (New) returned non-JSON (HTTP ${res.status})`,
      502,
    );
  }

  if (!res.ok) {
    throw new PlacesUpstreamError(
      scrubSecrets(
        data.error?.message ||
          rawText.slice(0, 240) ||
          `Places API (New) HTTP ${res.status}`,
        apiKey,
      ),
      502,
    );
  }

  return (Array.isArray(data.places) ? data.places : [])
    .map(mapNewPlace)
    .filter((p): p is PlaceSearchResult => p !== null)
    .slice(0, limit);
}

async function searchLegacy(
  apiKey: string,
  query: string,
  language: string | null,
  limit: number,
): Promise<PlaceSearchResult[]> {
  const url = new URL(SEARCH_TEXT_LEGACY_URL);
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
    throw new PlacesUpstreamError(
      scrubSecrets(
        err instanceof Error ? err.message : "Places network error",
        apiKey,
      ),
      502,
    );
  }

  const rawText = await res.text();
  let data: {
    status?: string;
    error_message?: string;
    results?: LegacyPlace[];
  } = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new PlacesUpstreamError(
      `Places API (Legacy) returned non-JSON (HTTP ${res.status})`,
      502,
    );
  }

  if (!res.ok) {
    throw new PlacesUpstreamError(
      scrubSecrets(
        data.error_message ||
          rawText.slice(0, 240) ||
          `Places API (Legacy) HTTP ${res.status}`,
        apiKey,
      ),
      502,
    );
  }

  const status = (data.status || "").toUpperCase();
  if (status && status !== "OK" && status !== "ZERO_RESULTS") {
    throw new PlacesUpstreamError(
      scrubSecrets(
        data.error_message || `Places API (Legacy) status: ${status}`,
        apiKey,
      ),
      502,
    );
  }

  return (Array.isArray(data.results) ? data.results : [])
    .map(mapLegacyPlace)
    .filter((p): p is PlaceSearchResult => p !== null)
    .slice(0, limit);
}

/**
 * Text Search with New→Legacy fallback. API key never leaves the server.
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

  try {
    const places = await searchNew(apiKey, query, language, limit);
    return {
      query,
      language,
      count: places.length,
      places,
      provider: "places_new",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isAuthRejection(msg)) throw err;
    console.warn(
      "[places] New Text Search rejected by key restrictions — trying Legacy",
      scrubSecrets(msg, apiKey).slice(0, 160),
    );
  }

  const places = await searchLegacy(apiKey, query, language, limit);
  return {
    query,
    language,
    count: places.length,
    places,
    provider: "places_legacy",
  };
}
