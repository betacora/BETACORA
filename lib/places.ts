/**
 * Google Places API (New) — Text Search (server-only).
 *
 * Auth: header `X-Goog-Api-Key: <GOOGLE_PLACES_API_KEY>` (never query-string).
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Prefer Text Search over Autocomplete for Descubre: one call returns places with
 * name/address/rating/coords; Autocomplete only yields predictions and needs a
 * second Place Details round-trip for the same data.
 */

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";

/** Field mask — keep narrow to control cost (Places SKUs are field-based). */
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
  /** BCP-47 / Places languageCode, e.g. "es", "en", "fr" */
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

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  googleMapsUri?: string;
};

type GoogleSearchTextResponse = {
  places?: GooglePlace[];
  error?: { message?: string; status?: string; code?: number };
};

/**
 * Strip anything that could echo the API key from upstream error text.
 * Google occasionally includes request metadata in error payloads.
 */
export function scrubSecrets(text: string, apiKey?: string): string {
  let out = text;
  const key = apiKey ?? process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (key && key.length >= 8) {
    out = out.split(key).join("[redacted]");
  }
  // Common accidental patterns if a key were ever put in a URL
  out = out.replace(/([?&]key=)[^&\s"']+/gi, "$1[redacted]");
  out = out.replace(/(X-Goog-Api-Key["']?\s*[:=]\s*["']?)[^"'\s,]+/gi, "$1[redacted]");
  return out;
}

function mapPlace(raw: GooglePlace): PlaceSearchResult | null {
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
    rating: typeof raw.rating === "number" && Number.isFinite(raw.rating) ? raw.rating : null,
    ratingCount:
      typeof raw.userRatingCount === "number" && Number.isFinite(raw.userRatingCount)
        ? raw.userRatingCount
        : null,
    types: Array.isArray(raw.types)
      ? raw.types.filter((t): t is string => typeof t === "string").slice(0, 8)
      : [],
    mapsUrl:
      typeof raw.googleMapsUri === "string" && raw.googleMapsUri.trim()
        ? raw.googleMapsUri.trim()
        : null,
  };
}

/**
 * Text Search (New). Uses API key only in the outbound server request header.
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

  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: limit,
  };
  if (language) body.languageCode = language;

  let res: Response;
  try {
    res = await fetch(SEARCH_TEXT_URL, {
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
    const msg = scrubSecrets(
      err instanceof Error ? err.message : "Places network error",
      apiKey,
    );
    throw new PlacesUpstreamError(msg, 502);
  }

  const rawText = await res.text();
  const safeText = scrubSecrets(rawText, apiKey);

  let data: GoogleSearchTextResponse = {};
  try {
    data = rawText ? (JSON.parse(rawText) as GoogleSearchTextResponse) : {};
  } catch {
    throw new PlacesUpstreamError(
      `Places API returned non-JSON (HTTP ${res.status})`,
      res.status || 502,
    );
  }

  if (!res.ok) {
    const upstreamMsg =
      typeof data.error?.message === "string" && data.error.message.trim()
        ? scrubSecrets(data.error.message, apiKey)
        : safeText.slice(0, 240) || `Places API HTTP ${res.status}`;
    throw new PlacesUpstreamError(upstreamMsg, res.status);
  }

  const places = (Array.isArray(data.places) ? data.places : [])
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
