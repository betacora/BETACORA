/**
 * Visit-suggestion helpers — shared parse/normalize for /api/visit-suggestions.
 * Keeps model JSON shape small and safe for the Explorar trip panel (piece 1).
 */

export const VISIT_SUGGESTIONS_MIN = 6;
export const VISIT_SUGGESTIONS_MAX = 10;
export const CITY_MAX_LEN = 120;
export const BLURB_MAX_LEN = 280;
export const PRACTICAL_NOTE_MAX_LEN = 160;
export const NAME_MAX_LEN = 120;

export type VisitSuggestion = {
  id: string;
  name: string;
  blurb: string;
  /** Optional — only when model is reasonably sure (anti-invention). */
  practical_note: string | null;
};

function slugify(raw: string, fallback: string): string {
  const base = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base || fallback;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/**
 * Parse Claude JSON into 6–10 sanitized suggestions.
 * Tolerates fenced markdown and nested objects.
 */
export function parseVisitSuggestions(text: string): VisitSuggestion[] {
  let raw = text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return [];
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return [];
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [];
  }

  const list = (parsed as { suggestions?: unknown }).suggestions;
  if (!Array.isArray(list)) return [];

  const out: VisitSuggestion[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    if (out.length >= VISIT_SUGGESTIONS_MAX) break;
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name =
      typeof row.name === "string" ? row.name.replace(/\s+/g, " ").trim() : "";
    const blurb =
      typeof row.blurb === "string" ? row.blurb.replace(/\s+/g, " ").trim() : "";
    if (!name || !blurb) continue;
    if (name.length > NAME_MAX_LEN || blurb.length > BLURB_MAX_LEN * 2) continue;

    const idRaw =
      typeof row.id === "string" && row.id.trim()
        ? row.id.trim()
        : slugify(name, `s${out.length + 1}`);
    const id = slugify(idRaw, `s${out.length + 1}`);
    if (seen.has(id)) continue;
    seen.add(id);

    const practical =
      typeof row.practical_note === "string"
        ? row.practical_note.replace(/\s+/g, " ").trim()
        : "";

    out.push({
      id,
      name: truncate(name, NAME_MAX_LEN),
      blurb: truncate(blurb, BLURB_MAX_LEN),
      practical_note: practical
        ? truncate(practical, PRACTICAL_NOTE_MAX_LEN)
        : null,
    });
  }

  return out;
}
