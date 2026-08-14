/**
 * Sanitize AI-generated itinerary HTML for safe rendering.
 * Links must come only from our code (Google Maps / future Duffel–Viator embeds),
 * never from unconstrained model free text.
 */

/** Href prefixes we generate in-app (Maps, later Duffel/Viator checkout URLs). */
export const TRUSTED_HREF_PREFIXES = [
  "https://www.google.com/maps/dir/?",
  "https://www.google.com/maps/search/?",
  "https://www.google.com/maps/place/",
  "https://maps.google.com/maps?",
  // Future offer deep-links we construct server-side (never AI-invented):
  "https://www.duffel.com/",
  "https://api.duffel.com/",
  "https://www.viator.com/",
] as const;

const ALLOWED_TAGS = new Set([
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "div",
  "span",
  "br",
  "a",
]);

const ALLOWED_CLASSES = new Set([
  "day-meta",
  "profile-result",
  "profile-stats",
  "profile-stat",
  "section-card",
  "bt-take-me",
  "bt-take-me-icon",
  "price",
  "highlight",
]);

/** Patterns that suggest prompt-injection / XSS payloads in shareable content. */
const SUSPICIOUS_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /system\s*prompt/i,
  /you\s+are\s+now\s+DAN/i,
  /jailbreak/i,
  /<\s*script\b/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon\w+\s*=/i,
  /document\s*\.\s*cookie/i,
  /eval\s*\(/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /reveal\s+(your|the)\s+(system|hidden)\s+prompt/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i,
];

export type ShareSafetyResult =
  | { ok: true }
  | { ok: false; reason: string; matched: string };

export function isTrustedHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    // Only allow our own relative auth/app paths — not //evil.com
    return /^\/(auth|explorar|viaje|inicio|viajes|perfil)(\?|$|\/)/i.test(trimmed);
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return false;
    const absolute = url.href;
    return TRUSTED_HREF_PREFIXES.some((prefix) => absolute.startsWith(prefix));
  } catch {
    return false;
  }
}

function stripDangerousUrlText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, "")
    .replace(/\bwww\.[^\s<>"']+/gi, "")
    .replace(/\b[\w.-]+\.(com|net|org|io|co|ai|app|xyz)(\/[^\s<>"']*)?/gi, (m) => {
      // Keep common non-link words that look like domains in travel copy (rare)
      if (/^(e\.g|a\.m|p\.m)\b/i.test(m)) return m;
      return "";
    });
}

/**
 * Extract optional #bt-places script, sanitize body, optionally re-attach script
 * (re-attach only for internal pipeline — public pages should pass keepPlacesScript=false).
 */
export function sanitizeItineraryHtml(
  html: string,
  options: { keepPlacesScript?: boolean; stripUntrustedUrlsInText?: boolean } = {},
): string {
  if (!html || typeof html !== "string") return "";

  const keepPlaces = options.keepPlacesScript === true;
  const stripUrls = options.stripUntrustedUrlsInText !== false;

  let placesBlock = "";
  let body = html;
  const placesRe =
    /<script\b[^>]*\bid\s*=\s*["']bt-places["'][^>]*>[\s\S]*?(?:<\/script>|$)/i;
  const placesMatch = body.match(placesRe);
  if (placesMatch) {
    placesBlock = placesMatch[0];
    body = body.replace(placesRe, "");
  }

  // Drop all other scripts / dangerous containers early
  body = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|input|textarea|button|link|meta|base|svg)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|form|input|textarea|button|link|meta|base|svg)\b[^>]*\/?>/gi, "");

  // Remove event handlers and style attributes
  body = body.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  body = body.replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Rewrite / strip anchors
  body = body.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_full, attrs: string, inner: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "").trim();
    const classMatch = attrs.match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const className = (classMatch?.[2] ?? classMatch?.[3] ?? classMatch?.[4] ?? "").trim();
    const safeInner = stripUrls ? stripDangerousUrlText(inner) : inner;

    if (href && isTrustedHref(href)) {
      const safeClass = className
        .split(/\s+/)
        .filter((c) => ALLOWED_CLASSES.has(c))
        .join(" ");
      const classAttr = safeClass ? ` class="${safeClass}"` : "";
      return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer"${classAttr}>${safeInner}</a>`;
    }
    // Untrusted or missing href → keep visible text only
    return safeInner;
  });

  // Unwrap / drop disallowed tags while keeping text; preserve trusted <a> intact
  body = body.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, rawTag: string, rawAttrs = "") => {
    const tag = rawTag.toLowerCase();
    const closing = full.startsWith("</");
    if (tag === "a") {
      if (closing) return "</a>";
      const hrefMatch = String(rawAttrs).match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "").trim();
      if (!href || !isTrustedHref(href)) return "";
      const classMatch = String(rawAttrs).match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const className = (classMatch?.[2] ?? classMatch?.[3] ?? classMatch?.[4] ?? "").trim();
      const safeClass = className
        .split(/\s+/)
        .filter((c) => ALLOWED_CLASSES.has(c))
        .join(" ");
      const classAttr = safeClass ? ` class="${safeClass}"` : "";
      return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer"${classAttr}>`;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      return "";
    }
    if (tag === "br") return "<br/>";
    if (closing) return `</${tag}>`;

    let attrs = "";
    if (tag === "div" || tag === "p" || tag === "span") {
      const classMatch = String(rawAttrs).match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const className = (classMatch?.[2] ?? classMatch?.[3] ?? classMatch?.[4] ?? "").trim();
      const safeClass = className
        .split(/\s+/)
        .filter((c) => ALLOWED_CLASSES.has(c))
        .join(" ");
      if (safeClass) attrs += ` class="${safeClass}"`;
      // Placeholder for client-mounted Duffel offers (attribute only — no href)
      if (tag === "div" && /\bdata-bt-flight-offers\b/i.test(String(rawAttrs))) {
        attrs += " data-bt-flight-offers";
      }
    }
    return `<${tag}${attrs}>`;
  });

  if (stripUrls) {
    // Remove leftover bare URLs outside tags
    body = body.replace(/>([^<]+)</g, (_m, text: string) => `>${stripDangerousUrlText(text)}<`);
  }

  body = body.trim();
  if (keepPlaces && placesBlock) {
    // Re-attach only a cleaned places script (no executable JS beyond JSON)
    const jsonMatch = placesBlock.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
    const json = (jsonMatch?.[1] || "").trim();
    if (json.startsWith("{") && json.includes('"places"')) {
      body += `\n<script type="application/json" id="bt-places">${json}</script>`;
    }
  }
  return body;
}

export function scanShareableContent(...chunks: Array<string | null | undefined>): ShareSafetyResult {
  const haystack = chunks.filter(Boolean).join("\n");
  for (const re of SUSPICIOUS_PATTERNS) {
    const m = haystack.match(re);
    if (m) {
      return { ok: false, reason: "suspicious_pattern", matched: m[0].slice(0, 80) };
    }
  }
  return { ok: true };
}

/** Soft cap for free-text questionnaire fields before they reach the model. */
export const FREE_TEXT_MAX_LEN = 500;

/** Hard cap on serialized profile JSON sent to the model (bytes). */
export const MAX_PROFILE_JSON_BYTES = 32_000;

const FREE_TEXT_KEYS = new Set([
  "notes",
  "comment",
  "comments",
  "other",
  "description",
  "mission",
  "mision",
]);

/** Keys dropped entirely before the model (removed questionnaire free-text). */
const DROPPED_PROFILE_KEYS = new Set(["extra"]);

export function truncateFreeText(value: unknown, max = FREE_TEXT_MAX_LEN): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

function sanitizeProfileValue(value: unknown, depth: number): unknown {
  if (depth > 6) return undefined;
  if (value == null) return value;
  if (typeof value === "string") {
    return value.length > FREE_TEXT_MAX_LEN ? value.slice(0, FREE_TEXT_MAX_LEN) : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 40).map((v) => sanitizeProfileValue(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
      if (DROPPED_PROFILE_KEYS.has(k.toLowerCase())) {
        continue;
      }
      if (FREE_TEXT_KEYS.has(k.toLowerCase())) {
        const t = truncateFreeText(v);
        if (t) out[k] = t;
        continue;
      }
      const cleaned = sanitizeProfileValue(v, depth + 1);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return undefined;
}

/**
 * Prepare traveler profile for the model: truncate free text, bound size/depth.
 * Caller should still wrap the result in <user_data> as untrusted input.
 */
export function prepareProfileForModel(profile: Record<string, unknown>): Record<string, unknown> {
  const cleaned = sanitizeProfileValue(profile, 0);
  const out =
    cleaned && typeof cleaned === "object" && !Array.isArray(cleaned)
      ? (cleaned as Record<string, unknown>)
      : {};

  let json = JSON.stringify(out);
  if (json.length > MAX_PROFILE_JSON_BYTES) {
    // Prefer dropping leftover free-text if the payload is still huge
    for (const k of ["notes", "comment", "comments", "other", "description", "mission", "mision"]) {
      delete out[k];
    }
    json = JSON.stringify(out);
    if (json.length > MAX_PROFILE_JSON_BYTES) {
      return { truncated: true, trip_type: out.trip_type, ui_lang: out.ui_lang };
    }
  }
  return out;
}
