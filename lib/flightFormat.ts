/** Shared display helpers for Duffel SimplifiedFlightOffer fields. */

/** ISO-8601 duration (e.g. PT5H30M) → "5h 30m" */
export function formatFlightDuration(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return iso;
  const h = m[1] ? Number(m[1]) : 0;
  const min = m[2] ? Number(m[2]) : 0;
  if (h && min) return `${h}h ${min}m`;
  if (h) return `${h}h`;
  if (min) return `${min}m`;
  return iso;
}

/** ISO datetime → local short time "14:35" */
export function formatFlightTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** ISO datetime → short date "23 jul" */
export function formatFlightDate(iso: string | null | undefined, lang = "es"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const locale = lang === "en" ? "en-GB" : lang === "fr" ? "fr-FR" : "es-ES";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function formatFlightPrice(
  amount: string | null | undefined,
  currency: string | null | undefined,
): string {
  const n = Number(amount);
  const cur = (currency || "USD").toUpperCase();
  if (!Number.isFinite(n)) return `${amount ?? "—"} ${cur}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toFixed(0)} ${cur}`;
  }
}

export function formatStops(stops: number, labels: { direct: string; stop: string; stops: string }): string {
  if (stops <= 0) return labels.direct;
  if (stops === 1) return labels.stop;
  return labels.stops.replace("{n}", String(stops));
}
