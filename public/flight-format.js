/** BeTacora — display helpers for Duffel SimplifiedFlightOffer fields (vanilla). */
(function (global) {
  "use strict";

  function formatFlightDuration(iso) {
    if (!iso) return "—";
    const m = String(iso).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (!m) return String(iso);
    const h = m[1] ? Number(m[1]) : 0;
    const min = m[2] ? Number(m[2]) : 0;
    if (h && min) return h + "h " + min + "m";
    if (h) return h + "h";
    if (min) return min + "m";
    return String(iso);
  }

  function formatFlightTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatFlightPrice(amount, currency) {
    const n = Number(amount);
    const cur = String(currency || "USD").toUpperCase();
    if (!Number.isFinite(n)) return (amount != null ? String(amount) : "—") + " " + cur;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cur,
        maximumFractionDigits: 0,
      }).format(n);
    } catch (e) {
      return n.toFixed(0) + " " + cur;
    }
  }

  function formatStops(stops, labels) {
    const n = Number(stops) || 0;
    if (n <= 0) return labels.direct;
    if (n === 1) return labels.stop;
    return String(labels.stops || "").replace("{n}", String(n));
  }

  global.BTFlightFormat = {
    formatFlightDuration: formatFlightDuration,
    formatFlightTime: formatFlightTime,
    formatFlightPrice: formatFlightPrice,
    formatStops: formatStops,
  };
})(typeof window !== "undefined" ? window : globalThis);
