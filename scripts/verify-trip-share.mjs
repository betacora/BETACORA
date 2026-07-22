import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".tmp-trip-share");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3000/questionnaire.html", {
  waitUntil: "domcontentloaded",
  timeout: 45000,
});
await page.waitForFunction(() => typeof renderTripShareCard === "function", null, {
  timeout: 15000,
});

await page.click('.lang-btn[data-lang="es"]');

const sampleHtml = `
<div class="profile-result">
  <h2>El Cronista de Piedra</h2>
  <p class="profile-essence">Buscas capas de historia bajo el ruido moderno.</p>
  <p class="profile-quote">"El pasado es prólogo."</p>
</div>
<script id="bt-places" type="application/json">
[
  {"name":"Castillo de Wawel","day":1,"lat":50.054,"lng":19.935,"type":"sight"},
  {"name":"Kazimierz","day":2,"lat":50.052,"lng":19.945,"type":"activity"},
  {"name":"Zakopane","day":5,"lat":49.299,"lng":19.949,"type":"activity"}
]
</script>
<h2>🌍 Cracovia y los Tatras — Por qué este destino es para ti</h2>
<p>Un viaje de historia y montaña.</p>
<h2>📅 Duración y ritmo</h2>
<p>7 días desde Madrid.</p>
<h3>Día 1 — Casco antiguo</h3>
<p>Wawel al amanecer.</p>
<h3>Día 2 — Kazimierz</h3>
<p>Sinagogas y comida judía.</p>
`;

await page.evaluate((html) => {
  answers.duration_days = 7;
  answers.trip_type = "sorpresa";
  answers.origin = "Madrid";
  renderItineraryHtml(html);
}, sampleHtml);

await page.waitForSelector("#tripShareCard.show", { timeout: 8000 });
await page.waitForSelector("#itinerarySection.show", { timeout: 5000 });

const ui = await page.evaluate(() => {
  const card = document.getElementById("tripShareCardInner");
  const rect = card.getBoundingClientRect();
  return {
    dest: document.getElementById("tscDest")?.textContent?.trim(),
    duration: document.getElementById("tscDuration")?.textContent?.trim(),
    archetype: document.getElementById("tscArchetype")?.textContent?.trim(),
    highlights: [...document.querySelectorAll("#tscHighlights li")].map((li) =>
      li.textContent.trim()
    ),
    mapSvg: !!document.querySelector("#tscMap svg"),
    mapDots: document.querySelectorAll("#tscMap circle").length,
    shareLabel: document.getElementById("tscShare")?.textContent?.trim(),
    downloadLabel: document.getElementById("tscDownload")?.textContent?.trim(),
    copyVisible: document.getElementById("tscCopyLink")?.classList.contains("show"),
    ratio: +(rect.width / rect.height).toFixed(3),
    shareTripKeys: !!(window.I18N?.es?.ui?.shareTrip?.share),
  };
});

await page.locator("#tripShareCardInner").screenshot({
  path: path.join(outDir, "trip-card-es.png"),
});

const capture = await page.evaluate(async () => {
  const canvas = await captureTripShareCard();
  return {
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL("image/png"),
  };
});
fs.writeFileSync(
  path.join(outDir, "betacora-viaje-1080x1350.png"),
  Buffer.from(capture.dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
);

// i18n EN
await page.click('.lang-btn[data-lang="en"]');
await page.waitForTimeout(300);
const en = await page.evaluate(() => ({
  share: document.getElementById("tscShare")?.textContent?.trim(),
  download: document.getElementById("tscDownload")?.textContent?.trim(),
  eyebrow: document.getElementById("tscEyebrow")?.textContent?.trim(),
}));

// i18n FR
await page.click('.lang-btn[data-lang="fr"]');
await page.waitForTimeout(300);
const fr = await page.evaluate(() => ({
  share: document.getElementById("tscShare")?.textContent?.trim(),
  download: document.getElementById("tscDownload")?.textContent?.trim(),
  eyebrow: document.getElementById("tscEyebrow")?.textContent?.trim(),
}));

// Share API + download path (desktop fallback)
const shareResult = await page.evaluate(async () => {
  const before = lastTripShare ? { ...lastTripShare } : null;
  // ensureTripShareLink should fail gracefully without table
  const url = await ensureTripShareLink(lastTripShare);
  const canvas = await captureTripShareCard();
  return {
    shareUrl: url,
    hasCanvas: !!(canvas && canvas.width === 1080 && canvas.height === 1350),
    copyStillHidden: !document.getElementById("tscCopyLink")?.classList.contains("show"),
    beforeDest: before?.destination,
  };
});

// Download button shouldn't throw
await page.evaluate(async () => {
  // stub click download without navigating away
  const canvas = await captureTripShareCard();
  if (!canvas || canvas.width !== 1080) throw new Error("bad canvas");
});

const report = {
  ui,
  en,
  fr,
  capture: { width: capture.width, height: capture.height },
  shareResult,
  pageErrors: errors.slice(0, 8),
};

const fail =
  !ui.dest ||
  !ui.duration ||
  !ui.archetype ||
  ui.highlights.length < 2 ||
  !ui.mapSvg ||
  ui.shareLabel !== "Compartir viaje" ||
  en.share !== "Share trip" ||
  fr.share !== "Partager le voyage" ||
  capture.width !== 1080 ||
  capture.height !== 1350 ||
  shareResult.shareUrl !== null ||
  !shareResult.copyStillHidden ||
  errors.length > 0;

console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(fail ? 1 : 0);
