/**
 * Full UI E2E: generate itinerary → real Duffel offers on screen → select → flight_selections.
 *
 * Requires a local Next server with fixed questionnaire.html, preferably:
 *   E2E_PROXY_PROD_API=1 npm run build && E2E_PROXY_PROD_API=1 npm start
 *
 * Env:
 *   BASE_URL (default http://127.0.0.1:3000)
 *   BT_TEST_EMAIL / BT_TEST_PASSWORD — confirmed Supabase user
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "tmp", "e2e-flights-ui");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.BASE_URL || "https://www.beta-cora.com";
const EMAIL = process.env.BT_TEST_EMAIL;
const PASSWORD = process.env.BT_TEST_PASSWORD;
const LOCAL_QUESTIONNAIRE = path.join(root, "public", "questionnaire.html");

const report = { passed: [], failed: [], artifacts: {} };

function pass(msg, detail) {
  report.passed.push(detail ? `${msg}: ${detail}` : msg);
  console.log("✓", msg, detail || "");
}
function fail(msg, detail) {
  report.failed.push(detail ? `${msg}: ${detail}` : msg);
  console.error("✗", msg, detail || "");
}

if (!EMAIL || !PASSWORD) {
  console.error("Set BT_TEST_EMAIL and BT_TEST_PASSWORD");
  process.exit(1);
}

const cfgRes = await fetch(`${BASE}/api/config`);
const cfg = await cfgRes.json();
if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
  fail("api/config", JSON.stringify(cfg));
  process.exit(1);
}
pass("api/config", cfg.supabaseUrl);

const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (authErr || !auth.session) {
  fail("login", authErr?.message || "no session");
  process.exit(1);
}
const session = auth.session;
const userId = session.user.id;
pass("login", userId);

const dep = new Date();
dep.setDate(dep.getDate() + 45);
const ret = new Date(dep);
ret.setDate(ret.getDate() + 4);
const dateFrom = dep.toISOString().slice(0, 10);
const dateTo = ret.toISOString().slice(0, 10);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  // Ensure Playwright route() can override questionnaire.html (SW bypasses routes).
  serviceWorkers: "block",
});
const page = await context.newPage();

const apiLog = [];
page.on("response", async (res) => {
  const url = res.url();
  if (
    url.includes("/api/generate-itinerary") ||
    url.includes("/api/duffel/search-offers") ||
    url.includes("/api/flights/select")
  ) {
    let authHeader = "";
    try {
      authHeader = res.request().headers()["authorization"] || "";
    } catch {
      /* ignore */
    }
    apiLog.push({
      url,
      status: res.status(),
      hasBearer: /^Bearer\s+\S+/i.test(authHeader),
    });
  }
});

// Serve THIS branch's questionnaire.html (with Bearer fix) over production APIs.
if (fs.existsSync(LOCAL_QUESTIONNAIRE)) {
  const fixedHtml = fs.readFileSync(LOCAL_QUESTIONNAIRE);
  await page.route("**/questionnaire.html**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: fixedHtml,
    });
  });
  pass("questionnaire override", "local fixed file");
}

// Inject Supabase session before app scripts (storage key used by @supabase/ssr/js client)
await page.addInitScript(
  ({ session, projectRef }) => {
    const key = `sb-${projectRef}-auth-token`;
    localStorage.setItem(key, JSON.stringify(session));
    // Avoid stale production questionnaire from SW during this E2E.
    try {
      navigator.serviceWorker
        ?.getRegistrations?.()
        .then((regs) => regs.forEach((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  },
  {
    session,
    projectRef: new URL(cfg.supabaseUrl).hostname.split(".")[0],
  },
);

await page.goto(`${BASE}/explorar?mode=trip`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(2000);
await page.screenshot({
  path: path.join(outDir, "01-explorar.png"),
  fullPage: true,
});
report.artifacts.explorar = path.join(outDir, "01-explorar.png");

// Questionnaire is often in an iframe
let frame = page;
const iframe = page.locator('iframe[src*="questionnaire"]').first();
if (await iframe.count()) {
  const handle = await iframe.elementHandle();
  const f = await handle?.contentFrame();
  if (f) frame = f;
  pass("questionnaire iframe", "found");
} else {
  // Direct /questionnaire.html fallback
  await page.goto(`${BASE}/questionnaire.html?mode=trip`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  frame = page;
  pass("questionnaire direct", "/questionnaire.html?mode=trip");
}

await frame.waitForTimeout(1500);

// Prove the iframe is running THIS branch's Bearer fix (not cached prod HTML).
const fixProbe = await frame.evaluate(() => {
  const src = String(window.fillFlightOffersHost || "");
  return {
    hasFn: typeof window.fillFlightOffersHost === "function",
    mentionsBearerComment: src.includes("Omitting Bearer"),
    mentionsGetAccessToken: src.includes("getAccessToken"),
    btAuth: !!(window.btAuth && window.btAuth.getAccessToken),
  };
});
if (fixProbe.mentionsBearerComment || fixProbe.mentionsGetAccessToken) {
  pass("fix HTML loaded in iframe", JSON.stringify(fixProbe));
} else {
  fail("fix HTML loaded in iframe", JSON.stringify(fixProbe));
}

// Seed answers + trigger generate via the same client path as the UI
const genResult = await frame.evaluate(
  async ({ dateFrom, dateTo }) => {
    // Ensure auth ready
    if (window.btAuth?.init) await window.btAuth.init();
    const token =
      window.btAuth && typeof window.btAuth.getAccessToken === "function"
        ? await window.btAuth.getAccessToken()
        : null;
    if (!token) return { ok: false, error: "no_token" };

    // Populate in-memory answers used by getFlightSearchParamsFromAnswers / collectAllAnswers
    if (typeof answers === "object") {
      Object.assign(answers, {
        wake: "manana",
        pace: ["balanced"],
        energy: "alto",
        motiv: ["culturas"],
        exp: ["local"],
        guide: "ocasional",
        accom: ["boutique"],
        food: ["local"],
        diet: "ninguna",
        cultura: ["museos"],
        act: ["urbano"],
        origin: "Madrid",
        destinations: ["Lisboa"],
        dest_city: "Lisboa",
        dest_country: "Portugal",
        trip_type: "destino",
        dates_mode: "exactas",
        dateFrom,
        dateTo,
        dur: "finde_largo",
        duration_days: 4,
        social: "solo",
        budget_r: "medio",
        currency: "EUR",
        ui_lang: "es",
      });
    }
    if (typeof selectedOrigin !== "undefined") {
      selectedOrigin.length = 0;
      selectedOrigin.push({ city: "Madrid", country: "Spain" });
    }
    if (typeof selectedDest !== "undefined") {
      selectedDest.length = 0;
      selectedDest.push({ city: "Lisboa", country: "Portugal" });
    }

    if (typeof handleGenerate === "function") {
      await handleGenerate();
      return { ok: true, via: "handleGenerate" };
    }
    return { ok: false, error: "handleGenerate_missing" };
  },
  { dateFrom, dateTo },
);

if (!genResult?.ok) {
  fail("trigger generate", JSON.stringify(genResult));
} else {
  pass("trigger generate", genResult.via);
}

// Wait for itinerary + flight offers (generation can take 2+ min)
const offersSelector = ".bt-flight-offer";
const errorSelector = ".bt-flight-offers__status--err";
const deadline = Date.now() + 210000;
let offersVisible = false;
let errorText = "";

while (Date.now() < deadline) {
  const n = await frame.locator(offersSelector).count();
  if (n > 0) {
    offersVisible = true;
    break;
  }
  const errEl = frame.locator(errorSelector).first();
  if (await errEl.count()) {
    errorText = (await errEl.textContent()) || "";
    // Keep waiting a bit — error may flash during load; only break if itinerary present and stuck
    const hasItin = await frame.locator("#itinerarySection.show, .bitacora-article, .profile-result").count();
    if (hasItin && errorText && Date.now() > deadline - 30000) break;
  }
  await frame.waitForTimeout(2000);
}

await page.screenshot({
  path: path.join(outDir, "02-after-generate.png"),
  fullPage: true,
});
report.artifacts.afterGenerate = path.join(outDir, "02-after-generate.png");

const offerCount = await frame.locator(offersSelector).count();
if (offersVisible && offerCount > 0) {
  pass("flight offers on screen", String(offerCount));
} else {
  fail(
    "flight offers on screen",
    `count=${offerCount} err=${errorText.slice(0, 200)} apis=${JSON.stringify(apiLog)}`,
  );
}

// Click first offer
let selectOk = false;
if (offerCount > 0) {
  const first = frame.locator(offersSelector).first();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  await frame.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(outDir, "03-after-select.png"),
    fullPage: true,
  });
  report.artifacts.afterSelect = path.join(outDir, "03-after-select.png");

  const statusOk = frame.locator(".bt-flight-offers__status--ok");
  const statusText = ((await statusOk.textContent().catch(() => "")) || "").trim();
  const selected = await frame.locator(".bt-flight-offer.is-selected").count();
  if ((await statusOk.count()) > 0 || selected > 0) {
    selectOk = true;
    pass("offer selected / saved message", statusText || `selected=${selected}`);
  } else {
    const anyStatus = await frame.locator(".bt-flight-offers__status").allTextContents();
    fail("offer saved message", anyStatus.join(" | ") || "no status");
  }
}

// Confirm flight_selections row
const { data: selections, error: selErr } = await supabase
  .from("flight_selections")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(3);

if (selErr) {
  fail("flight_selections query", selErr.message);
} else if (selections?.length) {
  const latest = selections[0];
  const ageMs = Date.now() - new Date(latest.created_at).getTime();
  if (ageMs < 5 * 60 * 1000 && selectOk) {
    pass(
      "flight_selections row",
      `${latest.id} ${latest.airline} ${latest.price} ${latest.currency} offer=${latest.duffel_offer_id}`,
    );
    fs.writeFileSync(
      path.join(outDir, "selection.json"),
      JSON.stringify(latest, null, 2),
    );
  } else {
    fail(
      "flight_selections row",
      `selectOk=${selectOk} ageMs=${ageMs} latest=${latest.id} ${latest.created_at}`,
    );
  }
} else {
  fail("flight_selections row", "empty");
}

fs.writeFileSync(
  path.join(outDir, "report.json"),
  JSON.stringify({ report, apiLog, genResult, dateFrom, dateTo }, null, 2),
);

await browser.close();

console.log("\n=== SUMMARY ===");
console.log("passed:", report.passed.length);
console.log("failed:", report.failed.length);
if (report.failed.length) {
  report.failed.forEach((f) => console.log(" -", f));
  process.exit(1);
}
process.exit(0);
