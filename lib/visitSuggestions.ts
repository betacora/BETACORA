/**
 * Parse and sanitize Claude JSON for POST /api/visit-suggestions.
 * Structured output only — no HTML, no URLs in suggestion text.
 */

export const CITY_MAX_LEN = 120;
export const TITLE_MAX_LEN = 120;
export const SUMMARY_MAX_LEN = 420;
export const MIN_SUGGESTIONS = 6;
export const MAX_SUGGESTIONS = 10;
export const MAX_VISIT_BODY_BYTES = 48_000;

export const VISIT_SUGGESTION_CATEGORIES = [
  "sight",
  "food",
  "activity",
  "market",
  "neighborhood",
  "culture",
  "nature",
  "nightlife",
  "other",
] as const;

export type VisitSuggestionCategory =
  (typeof VISIT_SUGGESTION_CATEGORIES)[number];

export type VisitSuggestion = {
  id: string;
  title: string;
  summary: string;
  category?: VisitSuggestionCategory;
};

export type VisitSuggestionsPayload = {
  ok: true;
  city: string;
  suggestions: VisitSuggestion[];
};

const CATEGORY_SET = new Set<string>(VISIT_SUGGESTION_CATEGORIES);

function stripUrls(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, "")
    .replace(/\bwww\.[^\s<>"']+/gi, "")
    .replace(/\b[\w.-]+\.(com|net|org|io|co|ai|app|xyz)(\/[^\s<>"']*)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
}

function slugifyId(raw: string, fallback: string): string {
  const base = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base || fallback;
}

export function normalizeCity(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const city = raw.replace(/\s+/g, " ").trim();
  if (!city || city.length > CITY_MAX_LEN) return null;
  return city;
}

export function normalizePlace(
  raw: unknown,
): { name: string; address: string; lat?: number; lng?: number } | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const row = raw as Record<string, unknown>;
  const name =
    typeof row.name === "string" ? row.name.replace(/\s+/g, " ").trim() : "";
  const address =
    typeof row.address === "string"
      ? row.address.replace(/\s+/g, " ").trim()
      : "";
  if (!name || name.length > CITY_MAX_LEN) return undefined;
  const out: { name: string; address: string; lat?: number; lng?: number } = {
    name: name.slice(0, CITY_MAX_LEN),
    address: address.slice(0, 240),
  };
  if (typeof row.lat === "number" && Number.isFinite(row.lat)) {
    out.lat = row.lat;
  }
  if (typeof row.lng === "number" && Number.isFinite(row.lng)) {
    out.lng = row.lng;
  }
  return out;
}

function normalizeCategory(raw: unknown): VisitSuggestionCategory | undefined {
  if (typeof raw !== "string") return undefined;
  const key = raw.trim().toLowerCase();
  if (CATEGORY_SET.has(key)) return key as VisitSuggestionCategory;
  return undefined;
}

function normalizeSuggestion(
  raw: unknown,
  index: number,
  usedIds: Set<string>,
): VisitSuggestion | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;

  const titleRaw =
    typeof row.title === "string"
      ? row.title
      : typeof row.name === "string"
        ? row.name
        : "";
  const title = truncate(stripUrls(titleRaw.replace(/\s+/g, " ").trim()), TITLE_MAX_LEN);
  if (!title) return null;

  const summaryRaw =
    typeof row.summary === "string"
      ? row.summary
      : typeof row.description === "string"
        ? row.description
        : "";
  const summary = truncate(
    stripUrls(summaryRaw.replace(/\s+/g, " ").trim()),
    SUMMARY_MAX_LEN,
  );
  if (!summary) return null;

  let id =
    typeof row.id === "string" && row.id.trim()
      ? slugifyId(row.id.trim(), `place-${index + 1}`)
      : slugifyId(title, `place-${index + 1}`);
  if (usedIds.has(id)) {
    id = `${id}-${index + 1}`.slice(0, 64);
  }
  usedIds.add(id);

  const category = normalizeCategory(row.category);
  const item: VisitSuggestion = { id, title, summary };
  if (category) item.category = category;
  return item;
}

/**
 * Extract a JSON object from model text (tolerates optional markdown fences).
 */
export function extractJsonObject(text: string): unknown | null {
  let raw = text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    /* fall through */
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1)) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Validate Claude output into a safe VisitSuggestionsPayload.
 * Returns null if fewer than MIN_SUGGESTIONS valid items.
 */
export function parseVisitSuggestionsPayload(
  text: string,
  fallbackCity: string,
): VisitSuggestionsPayload | null {
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const row = parsed as Record<string, unknown>;
  const cityFromModel =
    typeof row.city === "string"
      ? row.city.replace(/\s+/g, " ").trim().slice(0, CITY_MAX_LEN)
      : "";
  const city = cityFromModel || fallbackCity;

  const listRaw = Array.isArray(row.suggestions)
    ? row.suggestions
    : Array.isArray(row.places)
      ? row.places
      : null;
  if (!listRaw) return null;

  const usedIds = new Set<string>();
  const suggestions: VisitSuggestion[] = [];
  for (const item of listRaw.slice(0, MAX_SUGGESTIONS + 4)) {
    const normalized = normalizeSuggestion(item, suggestions.length, usedIds);
    if (normalized) suggestions.push(normalized);
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }

  if (suggestions.length < MIN_SUGGESTIONS) return null;

  return {
    ok: true,
    city,
    suggestions,
  };
}
