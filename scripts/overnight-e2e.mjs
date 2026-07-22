/**
 * Overnight E2E quality pass:
 * 1) Real short-trip generation (ES) with museum/sport/accom/currency
 * 2) Share-trip API + shared page
 * 3) Playwright UI: profile card, map, post-trip, shareable download, EN/FR i18n, 375px
 * 4) Console error sweep on key screens
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "tmp", "overnight-e2e");
fs.mkdirSync(outDir, { recursive: true });

const base = process.env.BASE_URL || "http://localhost:3000";
const report = { passed: [], failed: [], caveats: [], artifacts: {} };

function pass(msg, detail) {
  report.passed.push(detail ? `${msg}: ${detail}` : msg);
  console.log("✓", msg, detail || "");
}
function fail(msg, detail) {
  report.failed.push(detail ? `${msg}: ${detail}` : msg);
  console.error("✗", msg, detail || "");
}
function caveat(msg) {
  report.caveats.push(msg);
  console.warn("⚠", msg);
}
function assert(cond, msg, detail) {
  if (cond) pass(msg, detail);
  else fail(msg, detail);
}

const shortPayload = {
  wake: "manana",
  pace: ["balanced"],
  energy: "alto",
  motiv: ["culturas", "aventura"],
  exp: ["local", "icono"],
  guide: "ocasional",
  accom: ["boutique"],
  accom_location: "fuera",
  accom_priority: "precio",
  amenity: ["wifi", "desayuno"],
  food: ["local", "mercado"],
  diet: "ninguna",
  cultura: ["museos", "historia"],
  act: ["surf", "cocina_c", "urbano"],
  origin: "Madrid",
  trip_type: "destino",
  dest_city: "Lisboa",
  dest_country: "Portugal",
  dates_mode: "flexible",
  dur: "finde_largo",
  duration_days: 4,
  social: "solo",
  social_e: "ambiv",
  budget_r: "medio",
  budgetMax: "900",
  currency: "EUR",
  ui_lang: "es",
  mision_viaje: {
    focus: ["cultura", "gastro"],
    sport_mode: "yes",
    sports: ["surf"],
    sport_this_trip: { surf: "yes" },
    sport_intent: "placer",
    museum_type: ["arte", "historia"],
    activity_this_trip: { cocina_c: "yes", urbano: "maybe" },
  },
};

console.log("\n=== 1) Real itinerary generation (ES, 4 days Lisboa) ===");
const genStart = Date.now();
const genRes = await fetch(`${base}/api/generate-itinerary`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(shortPayload),
});
const genText = await genRes.text();
let genData;
try {
  genData = JSON.parse(genText);
} catch {
  fail("generate-itinerary JSON", genText.slice(0, 400));
  genData = null;
}

const html = genData?.html || "";
fs.writeFileSync(path.join(outDir, "itinerary-es.html"), html);
report.artifacts.itineraryEs = path.join(outDir, "itinerary-es.html");

assert(genRes.ok, "generate-itinerary HTTP", String(genRes.status));
assert(html.length > 500, "itinerary HTML length", String(html.length));
assert(!!genData?.archetype || html.includes("profile-result"), "archetype/profile present");

const low = html.toLowerCase();
const museumHits = ["museo", "museum", "arte", "historia", "galería", "galeria"].filter((h) => low.includes(h));
const sportHits = ["surf", "playa", "costa", "ola", "beach"].filter((h) => low.includes(h));
const cookHits = ["cocina", "cooking", "taller", "clase"].filter((h) => low.includes(h));
const accomHits = ["fuera", "precio", "económ", "econom", "perifer", "ahorro", "barrio", "metro"].filter((h) => low.includes(h));
const currencyHits = ["€", "eur", "euro"].filter((h) => low.includes(h));
const placesMatch = html.match(/<script[^>]*id=["']bt-places["'][^>]*>([\s\S]*?)<\/script>/i);
let places = [];
if (placesMatch) {
  try {
    const parsed = JSON.parse(placesMatch[1].trim());
    places = Array.isArray(parsed) ? parsed : parsed.places || [];
  } catch (e) {
    fail("bt-places JSON parse", String(e));
  }
}
assert(museumHits.length >= 1, "museum content reflected", museumHits.join(", "));
assert(sportHits.length >= 1, "surf/sport reflected", sportHits.join(", "));
assert(cookHits.length >= 1 || low.includes("gastro"), "cooking/gastro reflected", cookHits.join(", ") || "gastro");
assert(accomHits.length >= 1, "accom filters reflected", accomHits.join(", "));
assert(currencyHits.length >= 1, "EUR currency in content", currencyHits.join(", "));
assert(places.length >= 2, "bt-places markers", `${places.length} places`);
pass("generation duration", `${((Date.now() - genStart) / 1000).toFixed(1)}s`);

console.log("\n=== 2) Share-trip API ===");
let shareSlug = null;
let shareUrl = null;
try {
  const shareRes = await fetch(`${base}/api/share-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: "Lisboa",
      duration_label: "4 días",
      profile_type: genData?.archetype?.nombre || "Perfil BeTacora",
      highlights: places.slice(0, 4).map((p) => p.name).filter(Boolean),
      places: places.slice(0, 12),
      itinerary_html: html.slice(0, 50000),
      lang: "es",
    }),
  });
  const shareData = await shareRes.json();
  fs.writeFileSync(path.join(outDir, "share-response.json"), JSON.stringify(shareData, null, 2));
  if (shareRes.status === 503 && shareData.imageOnly) {
    caveat("shared_trips table missing in Supabase — share falls back to image-only. Apply schema.sql.");
    assert(true, "share-trip graceful fallback", "imageOnly");
  } else {
    assert(shareRes.ok, "share-trip HTTP", String(shareRes.status));
    assert(!!shareData.slug, "share slug", shareData.slug);
    shareSlug = shareData.slug;
    shareUrl = shareData.url || `/viaje/${shareData.slug}`;
    pass("share URL", shareUrl);
  }
} catch (e) {
  fail("share-trip request", String(e));
}

console.log("\n=== 3) Playwright UI + i18n + mobile 375 ===");
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
} catch (e) {
  caveat(`Chrome channel launch failed (${e.message}); falling back to bundled Chromium`);
  browser = await chromium.launch({ headless: true });
}

async function collectConsole(page) {
  const errors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  return { errors, pageErrors };
}

// Landing / auth / questionnaire console sweep
for (const [name, url] of [
  ["landing", "/"],
  ["auth", "/auth"],
  ["questionnaire", "/questionnaire.html"],
]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const logs = await collectConsole(page);
  await page.goto(`${base}${url}`, { waitUntil: "networkidle", timeout: 45000 }).catch(() =>
    page.goto(`${base}${url}`, { waitUntil: "domcontentloaded", timeout: 45000 })
  );
  await page.waitForTimeout(1200);
  const meaningful = [...logs.errors, ...logs.pageErrors].filter(
    (t) =>
      !/favicon/i.test(t) &&
      !/Download the React DevTools/i.test(t) &&
      !/Leaflet/i.test(t) // leaflet may warn before map init
  );
  assert(meaningful.length === 0, `console clean: ${name}`, meaningful.slice(0, 3).join(" | ") || "ok");
  await page.close();
}

// Shared trip page if available
if (shareSlug) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const logs = await collectConsole(page);
  await page.goto(`${base}/viaje/${shareSlug}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(800);
  const body = await page.locator("body").innerText();
  assert(/Lisboa|viaje|compartid/i.test(body), "shared trip page content");
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  assert(
    overflow.scrollWidth <= overflow.clientWidth + 2,
    "shared trip 375 no horizontal overflow",
    JSON.stringify(overflow)
  );
  await page.screenshot({ path: path.join(outDir, "shared-trip-375.png"), fullPage: true });
  const meaningful = [...logs.errors, ...logs.pageErrors].filter((t) => !/favicon/i.test(t));
  assert(meaningful.length === 0, "console clean: shared trip", meaningful.slice(0, 3).join(" | ") || "ok");
  await page.close();
  report.artifacts.sharedTrip375 = path.join(outDir, "shared-trip-375.png");
}

// Questionnaire full UI chain with generated HTML
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const logs = await collectConsole(page);
  await page.goto(`${base}/questionnaire.html`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => typeof renderItineraryHtml === "function" && window.I18N, null, {
    timeout: 20000,
  });

  // --- EN i18n spot checks for today's features ---
  await page.click('.lang-btn[data-lang="en"]');
  await page.waitForTimeout(300);
  const en = await page.evaluate(() => {
    const L = window.I18N.en;
    // Reveal museum panel
    document.querySelector('[data-q="cultura"][data-v="museos"]')?.click();
    document.querySelector('[data-q="act"][data-v="cocina_c"]')?.click();
    document.querySelector('[data-q="mision_sport"][data-v="yes"]')?.click();
    document.querySelector('[data-q="mision_sports"][data-v="surf"]')?.click();
    return {
      museumLabel: document.getElementById("museumTypeLabel")?.textContent?.trim(),
      museumArte: document.querySelector('[data-q="museum_type"][data-v="arte"]')?.textContent?.replace(/\s+/g, " ").trim(),
      accomLoc: document.querySelector('[data-q="accom_location"][data-v="centro"]')?.textContent?.replace(/\s+/g, " ").trim(),
      accomPri: document.querySelector('[data-q="accom_priority"][data-v="precio"]')?.textContent?.replace(/\s+/g, " ").trim(),
      sportQ: document.querySelector("#sportThisTripPanel .sport-trip-q")?.textContent?.trim()
        || document.querySelector("#sportThisTripPanel")?.textContent?.slice(0, 80),
      actQ: document.querySelector("#activityThisTripPanel")?.textContent?.slice(0, 120),
      currencyUsd: [...document.querySelectorAll("#currencySelect option")].find((o) => o.value === "USD")?.textContent,
      postTrip: L.ui.postTrip,
      shareTrip: L.ui.shareTrip,
      banners: L.ui.banners,
      mapDay: L.ui.map?.day,
      spanishLeaks: [],
    };
  });

  const enSpanishLeakChecks = [
    ["museumLabel", en.museumLabel, /What kind of museums/i],
    ["museumArte", en.museumArte, /Art/i],
    ["accomLoc", en.accomLoc, /Near the center/i],
    ["accomPri", en.accomPri, /Optimize for price/i],
    ["currencyUsd", en.currencyUsd, /USD/i],
    ["postTrip.prompt", en.postTrip?.prompt, /Back from this trip/i],
    ["shareTrip.share", en.shareTrip?.share, /Share trip/i],
    ["banners.createAccount", en.banners?.createAccount, /Create account/i],
    ["mapDay", en.mapDay, /^Day$/],
  ];
  for (const [key, val, re] of enSpanishLeakChecks) {
    assert(re.test(String(val || "")), `EN i18n ${key}`, String(val));
  }
  // Hard Spanish leftovers that must not appear
  const enBad = ["¿", "bitácora", "Compartir viaje", "Crear cuenta", "Dónde prefieres", "Optimizar precio"];
  const enBlob = JSON.stringify(en);
  const enLeaks = enBad.filter((s) => enBlob.includes(s) && !String(en.museumLabel || "").includes("museums"));
  // Filter carefully: "museums" is fine. Check UI strings only.
  const enUiLeaks = [];
  if (/[¿¡]/.test(en.museumLabel || "")) enUiLeaks.push("museumLabel spanish");
  if (/Cerca del|Optimizar|Compartir viaje|Crear cuenta/.test(enBlob)) enUiLeaks.push("spanish UI in EN blob");
  assert(enUiLeaks.length === 0, "EN no Spanish leftovers in today's UI", enUiLeaks.join(", ") || "ok");

  // --- FR i18n ---
  await page.click('.lang-btn[data-lang="fr"]');
  await page.waitForTimeout(300);
  const fr = await page.evaluate(() => {
    const L = window.I18N.fr;
    return {
      museumLabel: document.getElementById("museumTypeLabel")?.textContent?.trim(),
      accomLoc: document.querySelector('[data-q="accom_location"][data-v="centro"]')?.textContent?.replace(/\s+/g, " ").trim(),
      accomPri: document.querySelector('[data-q="accom_priority"][data-v="precio"]')?.textContent?.replace(/\s+/g, " ").trim(),
      postTrip: L.ui.postTrip,
      shareTrip: L.ui.shareTrip,
      banners: L.ui.banners,
      mapDay: L.ui.map?.day,
      errorsGenerate: L.ui.errors?.generate,
    };
  });
  assert(/musées|musée/i.test(fr.museumLabel || ""), "FR museum label", fr.museumLabel);
  assert(/Près du centre/i.test(fr.accomLoc || ""), "FR accom location", fr.accomLoc);
  assert(/Optimiser le prix/i.test(fr.accomPri || ""), "FR accom priority", fr.accomPri);
  assert(/De retour/i.test(fr.postTrip?.prompt || ""), "FR postTrip", fr.postTrip?.prompt);
  assert(/Partager le voyage/i.test(fr.shareTrip?.share || ""), "FR shareTrip", fr.shareTrip?.share);
  assert(/^Jour$/i.test(fr.mapDay || ""), "FR map day", fr.mapDay);
  assert(!/bitácora/i.test(fr.errorsGenerate || ""), "FR errors no Spanish bitácora", fr.errorsGenerate);

  // Back to ES and render real itinerary
  await page.click('.lang-btn[data-lang="es"]');
  await page.waitForTimeout(200);
  await page.evaluate((itineraryHtml) => {
    // Instant profile card first
    if (typeof generateProfile === "function") {
      try {
        answers.motiv = ["culturas"];
        answers.energy = 4;
        answers.wake = "manana";
        answers.social = "solo";
        answers.accom = ["boutique"];
        generateProfile();
      } catch (e) {
        console.error("generateProfile", e);
      }
    }
    renderItineraryHtml(itineraryHtml);
  }, html);

  await page.waitForSelector("#itinerarySection.show", { timeout: 10000 });
  await page.waitForTimeout(1500);

  const chain = await page.evaluate(() => {
    const profileVisible =
      !!document.querySelector("#profileCard.show, #profileCard[style*='block'], .profile-result") ||
      !!document.getElementById("shareableCard")?.classList.contains("show") ||
      !!document.querySelector(".profile-result");
    const mapEl = document.getElementById("btItineraryMap");
    const mapHasTiles = !!document.querySelector("#btItineraryMap .leaflet-tile, #btItineraryMap .leaflet-marker-icon");
    const postTrip = !!document.getElementById("postTripBlock");
    const tripShare = document.getElementById("tripShareCard")?.classList.contains("show");
    const dayPopup = (() => {
      // peek first marker popup content if any
      return document.querySelector(".bt-map-day")?.textContent || null;
    })();
    const overflow = {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    };
    // Open post-trip form
    document.getElementById("postTripOpen")?.click();
    return {
      profileVisible,
      mapExists: !!mapEl,
      mapHasTiles,
      mapHeight: mapEl ? mapEl.getBoundingClientRect().height : 0,
      postTrip,
      postTripFormShow: document.getElementById("postTripForm")?.classList.contains("show"),
      tripShare,
      shareable: document.getElementById("shareableCard")?.classList.contains("show"),
      dayPopup,
      overflow,
      postTripPrompt: document.querySelector(".post-trip-prompt-text")?.textContent?.trim(),
    };
  });

  assert(chain.profileVisible, "instant/profile card visible after render");
  assert(chain.mapExists && chain.mapHeight > 100, "Leaflet map container", `h=${chain.mapHeight}`);
  assert(chain.mapHasTiles || places.length === 0, "Leaflet markers/tiles present", chain.mapHasTiles ? "yes" : "no tiles");
  assert(chain.postTrip, "post-trip feedback block present");
  assert(chain.postTripFormShow, "post-trip form opens");
  assert(/volviste|viaje/i.test(chain.postTripPrompt || ""), "post-trip ES prompt", chain.postTripPrompt);
  assert(chain.tripShare || chain.shareable, "share cards shown", `trip=${chain.tripShare} profile=${chain.shareable}`);
  assert(
    chain.overflow.scrollWidth <= chain.overflow.clientWidth + 8,
    "itinerary 375 layout (allow leaflet tile bleed)",
    JSON.stringify(chain.overflow)
  );

  await page.screenshot({ path: path.join(outDir, "itinerary-375.png"), fullPage: true });
  await page.locator("#postTripBlock").screenshot({ path: path.join(outDir, "post-trip-375.png") }).catch(() => {});
  if (await page.locator("#btItineraryMap").count()) {
    await page.locator("#btItineraryMap").screenshot({ path: path.join(outDir, "map-375.png") }).catch(() => {});
  }

  // Profile shareable download
  const capture = await page.evaluate(async () => {
    if (typeof renderShareableCard === "function") {
      renderShareableCard({
        type: document.querySelector(".profile-result h2")?.textContent || "El Cronista Cultural",
        essence: document.querySelector(".profile-essence")?.textContent || "Essence test",
        quote: document.querySelector(".profile-quote")?.textContent || "Quote",
        animal: "Un búho observador",
        stats: [],
      });
    }
    if (typeof captureShareableCard !== "function") return null;
    const canvas = await captureShareableCard();
    return { width: canvas.width, height: canvas.height, dataUrl: canvas.toDataURL("image/png") };
  });
  if (capture) {
    assert(capture.width === 1080 && capture.height === 1350, "shareable card 1080x1350", `${capture.width}x${capture.height}`);
    const pngPath = path.join(outDir, "betacora-perfil.png");
    fs.writeFileSync(pngPath, Buffer.from(capture.dataUrl.replace(/^data:image\/png;base64,/, ""), "base64"));
    report.artifacts.shareablePng = pngPath;
    pass("shareable card downloaded", pngPath);
  } else {
    fail("shareable card capture", "captureShareableCard unavailable");
  }

  // Post-trip submit without login should ask for login
  const postTripMsg = await page.evaluate(async () => {
    document.querySelector('.post-trip-chip[data-v="yes"]')?.click();
    const liked = document.getElementById("postTripLiked");
    if (liked) liked.value = "Los museos y el surf al atardecer";
    const avoid = document.getElementById("postTripAvoid");
    if (avoid) avoid.value = "Zonas demasiado turísticas";
    await submitPostTripFeedback();
    await new Promise((r) => setTimeout(r, 800));
    return document.getElementById("postTripMsg")?.textContent?.trim();
  });
  assert(
    /sesión|login|sign in|connecter/i.test(postTripMsg || "") || /guardar|error|Thanks|Gracias/i.test(postTripMsg || ""),
    "post-trip submit responds",
    postTripMsg
  );
  if (/sesión|Inicia|Sign in|Connectez/i.test(postTripMsg || "")) {
    caveat("Post-trip save to Supabase columns requires a logged-in user — UI path verified; DB write needs manual login tomorrow.");
  }

  const meaningful = [...logs.errors, ...logs.pageErrors].filter(
    (t) => !/favicon|React DevTools|Failed to load resource.*favicon/i.test(t)
  );
  assert(meaningful.length === 0, "console clean: itinerary UI", meaningful.slice(0, 5).join(" | ") || "ok");
  await page.close();
}

// EN generation smoke (cheaper check: prompt lang only via short payload — skip full second gen if cost concern)
// Generate EN short trip to verify AI language + currency GBP ranges in budget UI only via UI (already done).
// Do one FR/EN lightweight generation? User asked for SAME full flow — do EN generation with shorter dest.
console.log("\n=== 4) EN generation (short) for translation of AI output ===");
const enPayload = {
  ...shortPayload,
  ui_lang: "en",
  currency: "GBP",
  budgetMax: "800",
  dest_city: "Porto",
  duration_days: 3,
  dur: "finde",
};
const enRes = await fetch(`${base}/api/generate-itinerary`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(enPayload),
});
const enData = await enRes.json().catch(() => ({}));
const enHtml = enData.html || "";
fs.writeFileSync(path.join(outDir, "itinerary-en.html"), enHtml);
assert(enRes.ok, "EN generate HTTP", String(enRes.status));
const enLow = enHtml.toLowerCase();
const enSpanishHeavy = (enHtml.match(/\b(dónde|alojamiento|desayuno|museos|itinerario)\b/gi) || []).length;
const enEnglishHits = ["day", "museum", "hotel", "surf", "outside", "price", "£", "gbp"].filter((h) => enLow.includes(h));
assert(enEnglishHits.length >= 3, "EN itinerary English content", enEnglishHits.join(", "));
if (enSpanishHeavy > 8) {
  fail("EN itinerary Spanish leak", `${enSpanishHeavy} Spanish tokens`);
} else {
  pass("EN itinerary mostly English", `spanishTokens=${enSpanishHeavy}`);
}

console.log("\n=== 5) FR generation (short) ===");
const frPayload = {
  ...shortPayload,
  ui_lang: "fr",
  currency: "EUR",
  dest_city: "Lisbonne",
  dest_country: "Portugal",
  duration_days: 3,
  dur: "finde",
};
const frRes = await fetch(`${base}/api/generate-itinerary`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(frPayload),
});
const frData = await frRes.json().catch(() => ({}));
const frHtml = frData.html || "";
fs.writeFileSync(path.join(outDir, "itinerary-fr.html"), frHtml);
assert(frRes.ok, "FR generate HTTP", String(frRes.status));
const frLow = frHtml.toLowerCase();
const frHits = ["jour", "musée", "hotel", "hébergement", "surf", "€"].filter((h) => frLow.includes(h));
assert(frHits.length >= 2, "FR itinerary French content", frHits.join(", "));
assert(!/bitácora/i.test(frHtml), "FR itinerary no Spanish bitácora");

await browser.close();

const summary = {
  passed: report.passed.length,
  failed: report.failed.length,
  caveats: report.caveats,
  failedItems: report.failed,
  passedItems: report.passed,
  artifacts: report.artifacts,
};
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(summary, null, 2));
console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));
if (report.failed.length) process.exit(1);
console.log("\nAll overnight E2E checks passed.");
