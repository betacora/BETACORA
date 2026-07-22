import { City } from "country-state-city";
import {
  DEFAULT_LIMIT,
  MIN_QUERY_LEN,
  countries,
  getCountryByIso,
  localizedNameForIso,
  normalize,
  type CityEntry,
  type Lang,
} from "@/lib/geo";

/** Destinations missing from country-state-city (e.g. French Polynesia has 0 cities). */
const EXTRA_CITIES: { name: string; countryCode: string }[] = [
  { name: "Bora Bora", countryCode: "PF" },
  { name: "Papeete", countryCode: "PF" },
  { name: "Moorea", countryCode: "PF" },
  { name: "Tahiti", countryCode: "PF" },
];

/**
 * Accent-/language-insensitive aliases → canonical city in dataset.
 * Lets Spanish/French spellings find international city names.
 */
const CITY_ALIASES: Record<string, { name: string; countryCode: string }> = {
  reikiavik: { name: "Reykjavík", countryCode: "IS" },
  reykjavik: { name: "Reykjavík", countryCode: "IS" },
  katmandu: { name: "Kathmandu", countryCode: "NP" },
  "bora bora": { name: "Bora Bora", countryCode: "PF" },
  borabora: { name: "Bora Bora", countryCode: "PF" },
  ushuaia: { name: "Ushuaia", countryCode: "AR" },
  barbuda: { name: "Codrington", countryCode: "AG" },
};

type RawCity = { name: string; countryCode: string };

let cachedCities: RawCity[] | null = null;
let citiesByCountry: Map<string, RawCity[]> | null = null;

function allRawCities(): RawCity[] {
  if (cachedCities) return cachedCities;
  const seen = new Set<string>();
  const list: RawCity[] = [];
  const byCountry = new Map<string, RawCity[]>();

  for (const c of City.getAllCities()) {
    const key = `${c.name}|${c.countryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const raw = { name: c.name, countryCode: c.countryCode };
    list.push(raw);
    const bucket = byCountry.get(c.countryCode);
    if (bucket) bucket.push(raw);
    else byCountry.set(c.countryCode, [raw]);
  }
  for (const extra of EXTRA_CITIES) {
    const key = `${extra.name}|${extra.countryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(extra);
    const bucket = byCountry.get(extra.countryCode);
    if (bucket) bucket.push(extra);
    else byCountry.set(extra.countryCode, [extra]);
  }
  cachedCities = list;
  citiesByCountry = byCountry;
  return list;
}

function getCitiesByCountry(): Map<string, RawCity[]> {
  allRawCities();
  return citiesByCountry!;
}

function toCityEntry(raw: RawCity): CityEntry | null {
  const country = getCountryByIso(raw.countryCode);
  if (!country) {
    const name = localizedNameForIso(raw.countryCode, raw.countryCode);
    return {
      city: { es: raw.name, en: raw.name, fr: raw.name },
      country: name,
      flag: "",
      isoCode: raw.countryCode,
    };
  }
  return {
    city: { es: raw.name, en: raw.name, fr: raw.name },
    country: country.name,
    flag: country.flag,
    isoCode: raw.countryCode,
  };
}

function scoreCity(name: string, q: string): number | null {
  const n = normalize(name);
  if (!n.includes(q)) return null;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(` ${q}`)) return 2;
  return 3;
}

export function searchCities(
  query: string,
  limit = DEFAULT_LIMIT,
  _lang: Lang = "es"
): CityEntry[] {
  const q = normalize(query);
  if (q.length < MIN_QUERY_LEN) return [];

  const results: { entry: CityEntry; score: number }[] = [];
  const seen = new Set<string>();

  const alias = CITY_ALIASES[q];
  if (alias) {
    const entry = toCityEntry(alias);
    if (entry) {
      const key = `${alias.name}|${alias.countryCode}`;
      seen.add(key);
      results.push({ entry, score: -1 });
    }
  }

  // Pass 1: match city names
  for (const raw of allRawCities()) {
    const key = `${raw.name}|${raw.countryCode}`;
    if (seen.has(key)) continue;
    const score = scoreCity(raw.name, q);
    if (score === null) continue;
    const entry = toCityEntry(raw);
    if (!entry) continue;
    seen.add(key);
    results.push({ entry, score });
  }

  // Pass 2: fill from countries whose localized name matches
  if (results.length < limit) {
    for (const country of countries) {
      let cScore: number | null = null;
      for (const part of [country.name.es, country.name.en, country.name.fr]) {
        const n = normalize(part);
        if (!n.includes(q)) continue;
        const s = n === q ? 4 : n.startsWith(q) ? 5 : 6;
        cScore = cScore === null ? s : Math.min(cScore, s);
      }
      if (cScore === null) continue;

      const bucket = getCitiesByCountry().get(country.isoCode) || [];
      for (const raw of bucket) {
        const key = `${raw.name}|${raw.countryCode}`;
        if (seen.has(key)) continue;
        const entry = toCityEntry(raw);
        if (!entry) continue;
        seen.add(key);
        results.push({ entry, score: cScore });
        if (results.length >= limit * 3) break;
      }
      if (results.length >= limit * 3) break;
    }
  }

  results.sort(
    (a, b) =>
      a.score - b.score ||
      a.entry.city.en.localeCompare(b.entry.city.en) ||
      a.entry.country.en.localeCompare(b.entry.country.en)
  );

  return results.slice(0, limit).map((r) => r.entry);
}

/** Warm the city cache (optional; called from API on first request). */
export function warmCityCache(): number {
  return allRawCities().length;
}
