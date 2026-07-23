import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".tmp-travel-identity");
fs.mkdirSync(outDir, { recursive: true });

const sampleHtml = fs.readFileSync(
  path.join(__dirname, "..", "tmp/overnight-e2e/itinerary-es.html"),
  "utf8"
);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3000/questionnaire.html", {
  waitUntil: "domcontentloaded",
  timeout: 45000,
});
await page.waitForFunction(
  () => typeof renderShareableCard === "function" && window.BTTravelIdentity,
  null,
  { timeout: 15000 }
);

await page.click('.lang-btn[data-lang="es"]');

// Seed real-ish questionnaire answers + dates + mission
await page.evaluate(() => {
  answers.pace = ["balanced"];
  answers.social = "solo";
  answers.budget_r = "mid";
  answers.wake = "alba";
  answers.motiv = ["culturas", "historia"];
  answers.exp = ["local"];
  answers.dateFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  })();
  answers.duration_days = 3;
  answers.trip_type = "destino";
  misionViaje.focus = ["cultura", "gastro"];
  selectedDest.length = 0;
  selectedDest.push({
    kind: "city",
    city: "Lisboa",
    country: "Portugal",
    flag: "🇵🇹",
  });
  syncDestAnswers();
});

// Inject itinerary HTML into the section so anticipation slide can read it
await page.evaluate((html) => {
  const section = document.getElementById("itinerarySection");
  const { places, cleanHtml } = extractPlacesBlock(html);
  const { profile, itineraryHtml } = splitResponseHtml(cleanHtml);
  section.innerHTML = `<div class="bitacora-article">${itineraryHtml}</div>`;
  section.classList.add("show");
  lastItineraryHtml = itineraryHtml;
  lastTripPlaces = places;

  const enriched = {
    ...profile,
    modifiers: [
      "Tono equilibrado, espacio para improvisar",
      "Énfasis en autonomía y autoconocimiento",
    ],
  };
  // recompute modifiers from BTArchetypes if available
  try {
    const mods = window.BTArchetypes?.getModifiers?.(collectAllAnswers());
    if (mods?.length) enriched.modifiers = mods;
  } catch (_) {}
  renderShareableCard(enriched);
}, sampleHtml);

await page.waitForSelector("#shareableCard.show .ti-slide", { timeout: 8000 });

const info = await page.evaluate(async () => {
  const ids = BTTravelIdentity.getSlides().map((s) => s.id);
  const texts = [...document.querySelectorAll("#tiTrack .ti-slide")].map((el) =>
    el.innerText.replace(/\s+/g, " ").trim().slice(0, 180)
  );
  // Capture each slide
  const captures = [];
  for (let i = 0; i < ids.length; i++) {
    BTTravelIdentity.goTo(i);
    await new Promise((r) => setTimeout(r, 80));
    const canvas = await BTTravelIdentity.captureCurrent();
    captures.push({
      id: ids[i],
      w: canvas.width,
      h: canvas.height,
      dataUrl: canvas.toDataURL("image/png"),
    });
  }
  return {
    ids,
    texts,
    count: ids.length,
    hasCountdown: ids.includes("countdown"),
    hasAnticipation: ids.includes("anticipation"),
    hasDiscovery: ids.includes("discovery"),
    hasInvite: ids.includes("invite"),
    hasImpact: ids.includes("impact"),
    hasValidation: ids.includes("validation"),
    captures,
  };
});

// Save PNGs
for (const c of info.captures) {
  const b64 = c.dataUrl.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(path.join(outDir, `${c.id}-1080x1350.png`), Buffer.from(b64, "base64"));
}

// Swipe / nav — reset to first slide after capture loop
await page.evaluate(() => BTTravelIdentity.goTo(0));
await page.waitForTimeout(150);
await page.click("#tiNext");
await page.waitForTimeout(200);
const afterNext = await page.evaluate(() => BTTravelIdentity.getIndex());
await page.click("#tiPrev");
await page.waitForTimeout(200);
const afterPrev = await page.evaluate(() => BTTravelIdentity.getIndex());

// Desktop share fallback download
const downloadPromise = page.waitForEvent("download", { timeout: 20000 }).catch(() => null);
await page.evaluate(() => {
  try {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  } catch (_) {}
  try {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
  } catch (_) {}
});
await page.click("#scShare");
const download = await downloadPromise;
let downloadedName = null;
if (download) {
  downloadedName = download.suggestedFilename();
  await download.saveAs(path.join(outDir, "from-share-fallback.png"));
}

// EN labels
await page.click('.lang-btn[data-lang="en"]');
await page.waitForTimeout(200);
const enKicker = await page.evaluate(() => {
  BTTravelIdentity.goTo(0);
  return document.querySelector(".ti-impact .ti-kicker")?.textContent?.trim();
});

await page.click('.lang-btn[data-lang="fr"]');
await page.waitForTimeout(200);
const frKicker = await page.evaluate(() => {
  BTTravelIdentity.goTo(0);
  return document.querySelector(".ti-impact .ti-kicker")?.textContent?.trim();
});

// Invented-stats guard
const banned = /only\s+\d+%|solo\s+\d+%|147 people|personas desbloque|unlocked this/i;
const joined = info.texts.join(" | ");

const result = {
  slideIds: info.ids,
  slideCount: info.count,
  texts: info.texts,
  captureSizes: info.captures.map((c) => ({ id: c.id, w: c.w, h: c.h })),
  nav: { afterNext, afterPrev },
  downloadedName,
  enKicker,
  frKicker,
  bannedHit: banned.test(joined),
  pageErrors: errors.slice(0, 5),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();

const all1080 = info.captures.every((c) => c.w === 1080 && c.h === 1350);
const ok =
  info.hasImpact &&
  info.hasValidation &&
  info.hasDiscovery &&
  info.hasAnticipation &&
  info.hasCountdown &&
  info.hasInvite &&
  info.count >= 5 &&
  info.count <= 6 &&
  all1080 &&
  afterNext === 1 &&
  afterPrev === 0 &&
  enKicker === "Traveler identity unlocked" &&
  frKicker === "Identité voyageuse débloquée" &&
  !result.bannedHit &&
  errors.length === 0;

process.exit(ok ? 0 : 1);
