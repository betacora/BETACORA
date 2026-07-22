import { Country } from "country-state-city";
import { COUNTRY_NAMES } from "@/lib/geo-country-names";

export type LocalizedName = { es: string; en: string; fr: string };

export type CityEntry = {
  city: LocalizedName;
  country: LocalizedName;
  flag: string;
  isoCode?: string;
};

export type CountryEntry = {
  name: LocalizedName;
  flag: string;
  isoCode: string;
};

export type Lang = keyof LocalizedName;

const DEFAULT_LIMIT = 20;
const MIN_QUERY_LEN = 2;

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function localizedNameForIso(isoCode: string, englishName: string): LocalizedName {
  const tr = COUNTRY_NAMES[isoCode];
  return {
    en: englishName,
    es: tr?.es || englishName,
    fr: tr?.fr || englishName,
  };
}

function toCountryEntry(c: {
  isoCode: string;
  name: string;
  flag: string;
}): CountryEntry {
  return {
    isoCode: c.isoCode,
    flag: c.flag,
    name: localizedNameForIso(c.isoCode, c.name),
  };
}

/** All countries from country-state-city (~250 incl. territories), with ES/FR names. */
export const countries: CountryEntry[] = Country.getAllCountries()
  .map(toCountryEntry)
  .sort((a, b) => a.name.es.localeCompare(b.name.es, "es"));

const countryByIso = new Map(countries.map((c) => [c.isoCode, c]));

export function getCountryByIso(isoCode: string): CountryEntry | undefined {
  return countryByIso.get(isoCode);
}

export function localized(name: LocalizedName, lang: Lang = "es"): string {
  return name[lang] || name.es;
}

export function searchCountries(
  query: string,
  limit = DEFAULT_LIMIT,
  _lang: Lang = "es"
): CountryEntry[] {
  const q = normalize(query);
  if (q.length < MIN_QUERY_LEN) return [];

  const scored: { entry: CountryEntry; score: number }[] = [];
  for (const c of countries) {
    const es = normalize(c.name.es);
    const en = normalize(c.name.en);
    const fr = normalize(c.name.fr);
    const iso = c.isoCode.toLowerCase();
    if (!es.includes(q) && !en.includes(q) && !fr.includes(q) && iso !== q) {
      continue;
    }
    let score = 3;
    if (es === q || en === q || fr === q) score = 0;
    else if (es.startsWith(q) || en.startsWith(q) || fr.startsWith(q)) score = 1;
    else if (es.includes(` ${q}`) || en.includes(` ${q}`) || fr.includes(` ${q}`))
      score = 2;
    scored.push({ entry: c, score });
  }

  scored.sort((a, b) => a.score - b.score || a.entry.name.en.localeCompare(b.entry.name.en));
  return scored.slice(0, limit).map((s) => s.entry);
}

export { DEFAULT_LIMIT, MIN_QUERY_LEN, normalize, localizedNameForIso };
