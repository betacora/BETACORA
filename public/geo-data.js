/**
 * Client geo search for the questionnaire.
 * Backed by /api/geo/search (country-state-city, offline, no API key).
 */
(function (global) {
  var MIN_LEN = 2;
  var DEFAULT_LIMIT = 20;
  var DEBOUNCE_MS = 220;

  function normalizeLang(lang) {
    return lang === "en" || lang === "fr" ? lang : "es";
  }

  function localized(name, lang) {
    if (!name) return "";
    if (typeof name === "string") return name;
    var L = normalizeLang(lang);
    return name[L] || name.en || name.es || "";
  }

  async function fetchSearch(query, lang, type, limit) {
    var q = (query || "").trim();
    if (q.length < MIN_LEN) {
      return { countries: [], cities: [] };
    }
    var params = new URLSearchParams({
      q: q,
      lang: normalizeLang(lang),
      type: type || "all",
      limit: String(limit || DEFAULT_LIMIT),
    });
    var res = await fetch("/api/geo/search?" + params.toString());
    if (!res.ok) throw new Error("geo search failed");
    return res.json();
  }

  /**
   * @param {string} query
   * @param {string} [lang]
   * @param {number} [limit]
   */
  async function searchCountries(query, lang, limit) {
    var data = await fetchSearch(query, lang, "countries", limit || DEFAULT_LIMIT);
    return data.countries || [];
  }

  /**
   * @param {string} query
   * @param {string} [lang]
   * @param {number} [limit]
   */
  async function searchCities(query, lang, limit) {
    var data = await fetchSearch(query, lang, "cities", limit || DEFAULT_LIMIT);
    return data.cities || [];
  }

  /**
   * Combined dest search: countries + cities in one request.
   */
  async function searchPlaces(query, lang, limit) {
    return fetchSearch(query, lang, "all", limit || DEFAULT_LIMIT);
  }

  /** Simple debounce helper for inputs. */
  function debounce(fn, ms) {
    var t = null;
    return function debounced() {
      var ctx = this;
      var args = arguments;
      if (t) clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms == null ? DEBOUNCE_MS : ms);
    };
  }

  global.GEO = {
    MIN_LEN: MIN_LEN,
    DEFAULT_LIMIT: DEFAULT_LIMIT,
    DEBOUNCE_MS: DEBOUNCE_MS,
    localized: localized,
    searchCountries: searchCountries,
    searchCities: searchCities,
    searchPlaces: searchPlaces,
    debounce: debounce,
  };

  // Back-compat aliases expected by the migration brief
  global.searchCountries = searchCountries;
  global.searchCities = searchCities;
})(typeof window !== "undefined" ? window : globalThis);
