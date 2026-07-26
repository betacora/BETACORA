/**
 * Lightweight in-memory cache for geo search responses (cities/countries).
 * Dataset is static offline data — safe to cache across requests in this process.
 * Not for personalized or auth-gated endpoints.
 */

export type GeoSearchCachePayload = {
  q: string;
  lang: string;
  countries: unknown[];
  cities: unknown[];
};

type CacheEntry = {
  value: GeoSearchCachePayload;
  expiresAt: number;
};

const MAX_ENTRIES = 250;
/** 1 hour — city/country names rarely change within a deploy. */
const TTL_MS = 60 * 60 * 1000;

const store = new Map<string, CacheEntry>();

export function geoSearchCacheKey(parts: {
  q: string;
  type: string;
  lang: string;
  limit: number;
}): string {
  return [
    parts.q.trim().toLowerCase(),
    parts.type,
    parts.lang,
    String(parts.limit),
  ].join("|");
}

export function getGeoSearchCache(
  key: string,
): GeoSearchCachePayload | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  // Refresh LRU order
  store.delete(key);
  store.set(key, hit);
  return hit.value;
}

export function setGeoSearchCache(
  key: string,
  value: GeoSearchCachePayload,
): void {
  if (store.has(key)) store.delete(key);
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });

  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/** Cache-Control for public static geo JSON (browsers / CDN). */
export const GEO_SEARCH_CACHE_CONTROL =
  "public, max-age=3600, stale-while-revalidate=86400";
