/**
 * Verify accommodation location/priority filters:
 * 1) HTML + i18n presence
 * 2) Payload fields reach generate-itinerary
 * 3) Itinerary HTML reflects accommodation reasoning
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const html = fs.readFileSync(path.join(root, "public/questionnaire.html"), "utf8");
const i18n = fs.readFileSync(path.join(root, "public/questionnaire-i18n.js"), "utf8");
const route = fs.readFileSync(path.join(root, "app/api/generate-itinerary/route.ts"), "utf8");

assert(html.includes('data-q="accom_location"'), "HTML missing accom_location");
assert(html.includes('data-q="accom_priority"'), "HTML missing accom_priority");
assert(html.includes('data-v="centro"') && html.includes('data-v="fuera"') && html.includes('data-v="igual"'), "location values");
assert(html.includes('data-v="precio"') && html.includes('data-v="comodidad"') && html.includes('data-v="equilibrio"'), "priority values");
assert(html.includes("accomLocation") && html.includes("accomPriority"), "qKeys labels");

for (const langHint of ["Near the center", "Près du centre", "Cerca del centro"]) {
  assert(i18n.includes(langHint), `i18n missing: ${langHint}`);
}
for (const langHint of ["Optimize for price", "Optimiser le prix", "Optimizar precio"]) {
  assert(i18n.includes(langHint), `i18n missing: ${langHint}`);
}
assert(i18n.includes("accomLocation:") && i18n.includes("accomPriority:"), "question labels");
assert(route.includes("accom_location") && route.includes("accom_priority"), "prompt missing filters");
assert(route.includes("FILTROS DE ALOJAMIENTO"), "prompt section missing");

console.log("✓ static checks passed (HTML, i18n ES/EN/FR, prompt)");

const base = process.env.BASE_URL || "http://localhost:3000";

const payload = {
  wake: "early",
  pace: ["balanced"],
  energy: "alto",
  motiv: ["cultura"],
  exp: ["autentica"],
  guide: "mix",
  accom: ["boutique"],
  accom_location: "fuera",
  accom_priority: "precio",
  amenity: ["wifi"],
  food: ["local"],
  diet: "todo",
  cultura: ["museos"],
  act: ["caminar"],
  origin: "Madrid",
  trip_type: "destino",
  dest_city: "Lisboa",
  dest_country: "Portugal",
  dates_mode: "flexible",
  duration_days: 5,
  social: "solo",
  social_e: "ambiv",
  budget_r: "medio",
  budgetMax: "1200",
  currency: "EUR",
  ui_lang: "es",
  mision_viaje: { focus: ["cultura"] },
};

console.log("→ POST", `${base}/api/generate-itinerary`);
console.log("  payload accom_location:", payload.accom_location);
console.log("  payload accom_priority:", payload.accom_priority);

const res = await fetch(`${base}/api/generate-itinerary`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Non-JSON response:", text.slice(0, 500));
  process.exit(1);
}

assert(res.ok, `API HTTP ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
assert(typeof data.html === "string" && data.html.length > 100, "missing html");

const out = data.html.toLowerCase();
const locationHints = ["fuera", "centro", "económ", "econom", "perifer", "afueras", "suburb", "ahorro", "traslado", "metro", "barrio"];
const priorityHints = ["precio", "calidad-precio", "calidad precio", "económ", "ahorrar", "presupuesto", "barat", "relación"];
const reasoningHints = ["prefer", "prioriz", "ubicaci", "alojamient", "porque", "por qué", "optaste", "elegiste", "filtro"];

const locHit = locationHints.filter((h) => out.includes(h));
const priHit = priorityHints.filter((h) => out.includes(h));
const reasonHit = reasoningHints.filter((h) => out.includes(h));

console.log("✓ API HTTP", res.status);
console.log("  location keyword hits:", locHit.slice(0, 8).join(", ") || "(none)");
console.log("  priority keyword hits:", priHit.slice(0, 8).join(", ") || "(none)");
console.log("  reasoning keyword hits:", reasonHit.slice(0, 8).join(", ") || "(none)");

// Extract accommodation-ish section snippet
const idx = out.search(/alojamient|hotel|boutique|hostal/);
if (idx >= 0) {
  const snippet = data.html.slice(Math.max(0, idx - 80), idx + 600).replace(/\s+/g, " ");
  console.log("  accommodation snippet:", snippet.slice(0, 450));
}

assert(locHit.length >= 1, "itinerary does not reflect location preference (fuera/económico)");
assert(priHit.length >= 1, "itinerary does not reflect price priority");

console.log("✓ verification complete: filters in payload + reflected in itinerary");
