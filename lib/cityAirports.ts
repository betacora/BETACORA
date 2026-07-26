/**
 * City / place name → primary IATA airport code.
 * Used to bridge questionnaire free-text cities into Duffel offer search.
 * Not exhaustive — unknown cities return null.
 */

const CITY_TO_IATA: Record<string, string> = {
  // Spain / Portugal
  madrid: "MAD",
  barcelona: "BCN",
  valencia: "VLC",
  sevilla: "SVQ",
  seville: "SVQ",
  malaga: "AGP",
  bilbao: "BIO",
  alicante: "ALC",
  palma: "PMI",
  "palma de mallorca": "PMI",
  mallorca: "PMI",
  ibiza: "IBZ",
  tenerife: "TFS",
  "las palmas": "LPA",
  "gran canaria": "LPA",
  "santiago de compostela": "SCQ",
  lisboa: "LIS",
  lisbon: "LIS",
  porto: "OPO",
  oporto: "OPO",
  faro: "FAO",

  // Mexico / LatAm
  "ciudad de mexico": "MEX",
  "mexico city": "MEX",
  mexico: "MEX",
  guadalajara: "GDL",
  monterrey: "MTY",
  cancun: "CUN",
  "buenos aires": "EZE",
  cordoba: "COR",
  mendoza: "MDZ",
  "santiago de chile": "SCL",
  chile: "SCL",
  "sao paulo": "GRU",
  "rio de janeiro": "GIG",
  rio: "GIG",
  bogota: "BOG",
  medellin: "MDE",
  cartagena: "CTG",
  lima: "LIM",
  cusco: "CUZ",
  cuzco: "CUZ",
  quito: "UIO",
  "ciudad de panama": "PTY",
  panama: "PTY",
  "san jose": "SJO",
  "costa rica": "SJO",
  havana: "HAV",
  habana: "HAV",
  "la habana": "HAV",
  montevideo: "MVD",
  asuncion: "ASU",
  caracas: "CCS",
  "la paz": "LPB",
  "santa cruz": "VVI",
  "santa cruz de la sierra": "VVI",

  // US / Canada
  "new york": "JFK",
  "nueva york": "JFK",
  nyc: "JFK",
  "los angeles": "LAX",
  miami: "MIA",
  chicago: "ORD",
  "san francisco": "SFO",
  seattle: "SEA",
  boston: "BOS",
  washington: "IAD",
  "washington dc": "IAD",
  atlanta: "ATL",
  dallas: "DFW",
  houston: "IAH",
  denver: "DEN",
  "las vegas": "LAS",
  orlando: "MCO",
  toronto: "YYZ",
  montreal: "YUL",
  vancouver: "YVR",

  // Europe
  london: "LHR",
  londres: "LHR",
  paris: "CDG",
  rome: "FCO",
  roma: "FCO",
  milan: "MXP",
  milano: "MXP",
  venice: "VCE",
  venecia: "VCE",
  venezia: "VCE",
  florence: "FLR",
  florencia: "FLR",
  naples: "NAP",
  napoles: "NAP",
  amsterdam: "AMS",
  berlin: "BER",
  munich: "MUC",
  frankfurt: "FRA",
  hamburg: "HAM",
  cologne: "CGN",
  colonia: "CGN",
  vienna: "VIE",
  viena: "VIE",
  prague: "PRG",
  praga: "PRG",
  budapest: "BUD",
  warsaw: "WAW",
  varsovia: "WAW",
  krakow: "KRK",
  cracovia: "KRK",
  athens: "ATH",
  atenas: "ATH",
  istanbul: "IST",
  estambul: "IST",
  dublin: "DUB",
  edinburgh: "EDI",
  edimburgo: "EDI",
  manchester: "MAN",
  birmingham: "BHX",
  glasgow: "GLA",
  brussels: "BRU",
  bruselas: "BRU",
  bruxelles: "BRU",
  zurich: "ZRH",
  geneva: "GVA",
  ginebra: "GVA",
  copenhagen: "CPH",
  copenhague: "CPH",
  stockholm: "ARN",
  estocolmo: "ARN",
  oslo: "OSL",
  helsinki: "HEL",
  nice: "NCE",
  niza: "NCE",
  lyon: "LYS",
  marseille: "MRS",
  marsella: "MRS",
  bordeaux: "BOD",
  burdeos: "BOD",
  toulouse: "TLS",

  // Middle East / Africa / Asia / Oceania
  dubai: "DXB",
  "abu dhabi": "AUH",
  doha: "DOH",
  "tel aviv": "TLV",
  cairo: "CAI",
  "el cairo": "CAI",
  marrakech: "RAK",
  marrakesh: "RAK",
  casablanca: "CMN",
  "cape town": "CPT",
  "ciudad del cabo": "CPT",
  johannesburg: "JNB",
  nairobi: "NBO",
  tokyo: "NRT",
  tokio: "NRT",
  osaka: "KIX",
  seoul: "ICN",
  seul: "ICN",
  bangkok: "BKK",
  singapore: "SIN",
  singapur: "SIN",
  "hong kong": "HKG",
  shanghai: "PVG",
  beijing: "PEK",
  pekin: "PEK",
  delhi: "DEL",
  "nueva delhi": "DEL",
  mumbai: "BOM",
  bombay: "BOM",
  bali: "DPS",
  denpasar: "DPS",
  sydney: "SYD",
  sidney: "SYD",
  melbourne: "MEL",
  auckland: "AKL",
};

/** Normalize for lookup: lowercase, strip diacritics, collapse spaces. */
export function normalizePlaceKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a free-text city / place (or already-valid IATA) to a 3-letter code.
 * Accepts "Madrid", "Madrid, Spain", "MAD", etc.
 */
export function resolvePlaceToIata(
  place: string | null | undefined,
): string | null {
  if (!place || typeof place !== "string") return null;
  const trimmed = place.trim();
  if (!trimmed) return null;

  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  const candidates = [
    trimmed,
    parts[0] || "",
    trimmed.replace(/^(ciudad de|city of)\s+/i, ""),
    (parts[0] || "").replace(/^(ciudad de|city of)\s+/i, ""),
  ].filter(Boolean);

  for (const c of candidates) {
    const key = normalizePlaceKey(c);
    if (CITY_TO_IATA[key]) return CITY_TO_IATA[key];
  }

  const key = normalizePlaceKey(parts[0] || trimmed);
  const sorted = Object.keys(CITY_TO_IATA).sort((a, b) => b.length - a.length);
  for (const city of sorted) {
    if (key === city || key.includes(city) || city.includes(key)) {
      return CITY_TO_IATA[city];
    }
  }

  return null;
}

/** Resolve origin/destination that may already be IATA or a city name. */
export function resolveSearchAirports(
  origin: string,
  destination: string,
): { origin: string; destination: string } | { error: string } {
  const o = resolvePlaceToIata(origin);
  const d = resolvePlaceToIata(destination);
  if (!o && !d) {
    return {
      error: `Could not resolve airports for origin "${origin}" and destination "${destination}"`,
    };
  }
  if (!o) return { error: `Could not resolve origin airport for "${origin}"` };
  if (!d) {
    return {
      error: `Could not resolve destination airport for "${destination}"`,
    };
  }
  if (o === d) {
    return { error: "Origin and destination resolve to the same airport" };
  }
  return { origin: o, destination: d };
}
