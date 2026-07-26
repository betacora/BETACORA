import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/geo-cities";
import { DEFAULT_LIMIT, MIN_QUERY_LEN, searchCountries, type Lang } from "@/lib/geo";
import {
  GEO_SEARCH_CACHE_CONTROL,
  geoSearchCacheKey,
  getGeoSearchCache,
  setGeoSearchCache,
} from "@/lib/geo-search-cache";

export const runtime = "nodejs";

function parseLang(value: string | null): Lang {
  if (value === "en" || value === "fr" || value === "es") return value;
  return "es";
}

function jsonCached(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": GEO_SEARCH_CACHE_CONTROL,
    },
  });
}

/**
 * GET /api/geo/search?q=paris&type=cities|countries|all&lang=es&limit=20
 * Offline dataset via country-state-city (no external API key).
 * Public + cacheable — not personalized / not auth-gated.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const type = (searchParams.get("type") || "all").toLowerCase();
  const lang = parseLang(searchParams.get("lang"));
  const limitRaw = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(1, Math.floor(limitRaw)), 40)
    : DEFAULT_LIMIT;

  if (q.length < MIN_QUERY_LEN) {
    return jsonCached({ countries: [], cities: [], q, lang });
  }

  const cacheKey = geoSearchCacheKey({ q, type, lang, limit });
  const cached = getGeoSearchCache(cacheKey);
  if (cached) {
    return jsonCached(cached);
  }

  const wantCountries = type === "countries" || type === "all";
  const wantCities = type === "cities" || type === "all";

  // Destination UI shows a few countries then cities; allocate budget
  const countryLimit = type === "all" ? Math.min(5, limit) : limit;
  const cityLimit = type === "all" ? Math.min(20, Math.max(8, limit)) : limit;

  const payload = {
    q,
    lang,
    countries: wantCountries ? searchCountries(q, countryLimit, lang) : [],
    cities: wantCities ? searchCities(q, cityLimit, lang) : [],
  };

  setGeoSearchCache(cacheKey, payload);
  return jsonCached(payload);
}
