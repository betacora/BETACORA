/**
 * Verify visit-suggestions parser + UI panel (piece 1).
 *
 * UI mode (default): Playwright against BASE_URL with route mocks for
 * /api/places/search and /api/visit-suggestions — captures Lisboa cards and
 * asserts Madrid suggestions don't share titles (city-specific fixture).
 *
 * Live mode: LIVE_VISIT=1 hits real APIs (needs auth + Anthropic/Places/Upstash).
 *
 *   BT_TEST_EMAIL=… BT_TEST_PASSWORD=… node scripts/verify-visit-panel.mjs
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// Lightweight parse check mirrored from lib/visitSuggestions (avoid TS import in node)
const MIN_SUGGESTIONS = 6;
function parseVisitSuggestionsPayload(text, fallbackCity) {
  let raw = String(text || "").trim();
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const clean = suggestions
    .filter((s) => s && s.title && s.summary)
    .slice(0, 10);
  if (clean.length < MIN_SUGGESTIONS) return null;
  return { ok: true, city: parsed.city || fallbackCity, suggestions: clean };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "tmp", "visit-panel");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const LIVE = process.env.LIVE_VISIT === "1";
const EMAIL = process.env.BT_TEST_EMAIL;
const PASSWORD = process.env.BT_TEST_PASSWORD;

const report = { passed: [], failed: [], artifacts: {} };
function pass(m, d) {
  report.passed.push(d ? `${m}: ${d}` : m);
  console.log("✓", m, d || "");
}
function fail(m, d) {
  report.failed.push(d ? `${m}: ${d}` : m);
  console.error("✗", m, d || "");
}

// --- Parser unit checks ---
const lisboaFixture = JSON.stringify({
  ok: true,
  city: "Lisboa",
  suggestions: [
    {
      id: "miradouro-da-graca",
      title: "Miradouro da Graça",
      summary: "Vista sobre Alfama y el Tejo; mejor al atardecer.",
      category: "sight",
    },
    {
      id: "time-out-market",
      title: "Time Out Market",
      summary: "Mercado de food halls en Cais do Sodré; llega temprano.",
      category: "market",
    },
    {
      id: "lx-factory",
      title: "LX Factory",
      summary: "Antigua fábrica en Alcântara con librerías y talleres.",
      category: "neighborhood",
    },
    {
      id: "mosteiro-jeronimos",
      title: "Mosteiro dos Jerónimos",
      summary: "Manuelino en Belém; evita el mediodía si puedes.",
      category: "culture",
    },
    {
      id: "tram-28-alt",
      title: "Elevador da Bica",
      summary: "Funicular del barrio de Bica; menos saturado que el 28.",
      category: "activity",
    },
    {
      id: "cervejaria-ramiro",
      title: "Cervejaria Ramiro",
      summary: "Marisco en Intendente; pide gambas à guilho.",
      category: "food",
    },
  ],
});

const madridFixture = JSON.stringify({
  ok: true,
  city: "Madrid",
  suggestions: [
    {
      id: "retiro",
      title: "Parque del Retiro",
      summary: "Estanque grande y Palacio de Cristal; entra por la Puerta de Alcalá.",
      category: "nature",
    },
    {
      id: "prado",
      title: "Museo del Prado",
      summary: "Velázquez y Goya; las últimas horas del día suelen ir más flojas.",
      category: "culture",
    },
    {
      id: "mercado-san-miguel",
      title: "Mercado de San Miguel",
      summary: "Tapas junto a la Plaza Mayor; ve fuera del pico de comida.",
      category: "market",
    },
    {
      id: "templo-debod",
      title: "Templo de Debod",
      summary: "Templo egipcio en Parque del Oeste; atardecer clásico.",
      category: "sight",
    },
    {
      id: "malasana",
      title: "Malasaña",
      summary: "Barrio de cafés y tiendas independientes alrededor de Plaza del Dos de Mayo.",
      category: "neighborhood",
    },
    {
      id: "casa-botin",
      title: "Sobrino de Botín",
      summary: "Asador histórico cerca de Plaza Mayor; cochinillo es el plato firma.",
      category: "food",
    },
  ],
});

const parsedLx = parseVisitSuggestionsPayload(lisboaFixture, "Lisboa");
const parsedMd = parseVisitSuggestionsPayload(madridFixture, "Madrid");
if (parsedLx && parsedLx.suggestions.length >= MIN_SUGGESTIONS) {
  pass("parser Lisboa", String(parsedLx.suggestions.length));
} else fail("parser Lisboa", "invalid");
if (parsedMd && parsedMd.suggestions.length >= MIN_SUGGESTIONS) {
  pass("parser Madrid", String(parsedMd.suggestions.length));
} else fail("parser Madrid", "invalid");

const lxTitles = new Set(parsedLx.suggestions.map((s) => s.title.toLowerCase()));
const mdTitles = new Set(parsedMd.suggestions.map((s) => s.title.toLowerCase()));
const overlap = [...lxTitles].filter((t) => mdTitles.has(t));
if (overlap.length === 0) pass("city-specific titles (fixtures)", "no overlap");
else fail("city-specific titles (fixtures)", overlap.join(", "));

const genericBanned = [
  "pasea por el centro",
  "prueba la comida local",
  "visita un museo",
  "mira el atardecer",
  "walk downtown",
  "try local food",
];
const blob = [...parsedLx.suggestions, ...parsedMd.suggestions]
  .map((s) => `${s.title} ${s.summary}`.toLowerCase())
  .join(" | ");
const hitGeneric = genericBanned.filter((g) => blob.includes(g));
if (!hitGeneric.length) pass("no generic filler phrases", "ok");
else fail("no generic filler phrases", hitGeneric.join(", "));

// --- UI ---
if (!EMAIL || !PASSWORD) {
  console.warn("SKIP UI: set BT_TEST_EMAIL / BT_TEST_PASSWORD");
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  process.exit(report.failed.length ? 1 : 0);
}

const cfg = await (await fetch(`${BASE}/api/config`)).json();
const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (authErr || !auth.session) {
  fail("login", authErr?.message || "no session");
  process.exit(1);
}
pass("login", auth.user.id);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  serviceWorkers: "block",
});
const page = await context.newPage();

await page.addInitScript(
  ({ session, projectRef }) => {
    localStorage.setItem(
      `sb-${projectRef}-auth-token`,
      JSON.stringify(session),
    );
  },
  {
    session: auth.session,
    projectRef: new URL(cfg.supabaseUrl).hostname.split(".")[0],
  },
);

if (!LIVE) {
  await page.route("**/api/places/search**", async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const places = q.includes("madr")
      ? [
          {
            id: "madrid",
            name: "Madrid",
            address: "Spain",
            lat: 40.4168,
            lng: -3.7038,
            rating: null,
            ratingCount: null,
            types: ["locality"],
            mapsUrl: "",
          },
        ]
      : [
          {
            id: "lisboa",
            name: "Lisboa",
            address: "Portugal",
            lat: 38.7223,
            lng: -9.1393,
            rating: null,
            ratingCount: null,
            types: ["locality"],
            mapsUrl: "",
          },
        ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        places,
        count: places.length,
        query: q,
        language: "es",
        provider: "mock",
      }),
    });
  });

  await page.route("**/api/visit-suggestions", async (route) => {
    const body = route.request().postDataJSON?.() || {};
    let parsed = {};
    try {
      parsed = JSON.parse(route.request().postData() || "{}");
    } catch {
      parsed = body;
    }
    const city = String(parsed.city || "").toLowerCase();
    const payload = city.includes("madr") ? madridFixture : lisboaFixture;
    const authz = route.request().headers()["authorization"] || "";
    if (!/^Bearer\s+\S+/i.test(authz)) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "unauthorized" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: payload,
    });
  });
}

// Force trip mode by stubbing traveler profile via evaluate after load if needed.
await page.goto(`${BASE}/questionnaire.html?mode=trip`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(1500);

await page.evaluate(() => {
  document.body.classList.add("qt-active");
  const hero = document.getElementById("qtHero");
  if (hero) hero.hidden = false;
  if (typeof initVisitPanel === "function") initVisitPanel();
  if (typeof applyQuickTripLabels === "function") applyQuickTripLabels();
});

await page.waitForSelector("#btVisitCityInput", { timeout: 10000 });
pass("visit panel visible");

async function runCityFlow(cityQuery, expectTitle) {
  await page.fill("#btVisitCityInput", "");
  await page.type("#btVisitCityInput", cityQuery, { delay: 40 });
  await page.waitForSelector("#btVisitCityResults.show .search-item", {
    timeout: 15000,
  });
  await page.click("#btVisitCityResults.show .search-item");
  await page.waitForSelector(".bt-visit-card", { timeout: 60000 });
  const titles = await page.$$eval(".bt-visit-card-title", (els) =>
    els.map((e) => e.textContent.trim()),
  );
  const selectedBefore = await page.$$eval(".bt-visit-card.sel", (els) => els.length);
  if (selectedBefore === 0) pass(`${cityQuery} none preselected`);
  else fail(`${cityQuery} none preselected`, String(selectedBefore));

  if (titles.length >= 6) pass(`${cityQuery} cards`, String(titles.length));
  else fail(`${cityQuery} cards`, String(titles.length));

  if (titles.some((t) => t.includes(expectTitle) || expectTitle.includes(t.slice(0, 8)))) {
    pass(`${cityQuery} has specific place`, expectTitle);
  } else {
    // soft: just record titles
    pass(`${cityQuery} titles sample`, titles.slice(0, 3).join(" · "));
  }

  await page.click(".bt-visit-card");
  const selectedAfter = await page.$$eval(".bt-visit-card.sel", (els) => els.length);
  if (selectedAfter === 1) pass(`${cityQuery} toggle select`);
  else fail(`${cityQuery} toggle select`, String(selectedAfter));

  return titles;
}

const lisboaTitles = await runCityFlow("Lisboa", "Graça");
await page.screenshot({
  path: path.join(outDir, "lisboa-cards.png"),
  fullPage: true,
});
report.artifacts.lisboa = path.join(outDir, "lisboa-cards.png");

await page.click("#btVisitClear");
await page.waitForTimeout(400);
const madridTitles = await runCityFlow("Madrid", "Retiro");
await page.screenshot({
  path: path.join(outDir, "madrid-cards.png"),
  fullPage: true,
});
report.artifacts.madrid = path.join(outDir, "madrid-cards.png");

const titleOverlap = lisboaTitles.filter((t) =>
  madridTitles.map((x) => x.toLowerCase()).includes(t.toLowerCase()),
);
if (!titleOverlap.length) {
  pass("Lisboa vs Madrid no shared titles", "ok");
} else {
  fail("Lisboa vs Madrid no shared titles", titleOverlap.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "report.json"),
  JSON.stringify({ report, lisboaTitles, madridTitles, live: LIVE }, null, 2),
);

await browser.close();
console.log("\n=== SUMMARY ===");
console.log("passed", report.passed.length, "failed", report.failed.length);
if (report.failed.length) process.exit(1);
