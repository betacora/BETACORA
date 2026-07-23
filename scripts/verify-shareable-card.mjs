import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".tmp-shareable");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3000/questionnaire.html", {
  waitUntil: "domcontentloaded",
  timeout: 45000,
});
await page.waitForFunction(() => typeof renderShareableCard === "function", null, {
  timeout: 15000,
});

await page.click('.lang-btn[data-lang="es"]');

await page.evaluate(() => {
  renderShareableCard({
    type: "El Arqueólogo del Tiempo",
    essence:
      "Llegas a una ciudad y buscas la capa más antigua bajo el ruido moderno.",
    quote: "La historia no se repite, pero el pasado es prólogo.",
    animal: "Un búho: observas en silencio y ves lo que otros pasan de largo.",
    stats: [{ label: "Curiosidad", value: 88 }],
  });
});

await page.waitForSelector("#shareableCard.show", { timeout: 5000 });

const ui = await page.evaluate(() => {
  const card = document.getElementById("shareableCardInner");
  const cs = getComputedStyle(card);
  const rect = card.getBoundingClientRect();
  return {
    bg: cs.backgroundColor,
    type: document.getElementById("scType")?.textContent?.trim(),
    essence: document.getElementById("scEssence")?.textContent?.trim(),
    quote: document.getElementById("scQuote")?.textContent?.trim(),
    animalLabel: document.getElementById("scAnimalLabel")?.textContent?.trim(),
    animal: document.getElementById("scAnimal")?.textContent?.trim(),
    cta: document.getElementById("scCta")?.textContent?.trim(),
    logo: !!document.querySelector(".sc-logo .sc-tacora"),
    noStats: !document.getElementById("scStatsBars"),
    ratio: +(rect.width / rect.height).toFixed(3),
    shareLabel: document.getElementById("scShare")?.textContent?.trim(),
    downloadLabel: document.getElementById("scDownload")?.textContent?.trim(),
  };
});

await page.screenshot({
  path: path.join(outDir, "card-preview.png"),
  fullPage: false,
});
await page.locator("#shareableCardInner").screenshot({
  path: path.join(outDir, "card-element.png"),
});

const capture = await page.evaluate(async () => {
  const canvas = await captureShareableCard();
  return {
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL("image/png"),
  };
});

const pngPath = path.join(outDir, "betacora-perfil-1080x1350.png");
const b64 = capture.dataUrl.replace(/^data:image\/png;base64,/, "");
fs.writeFileSync(pngPath, Buffer.from(b64, "base64"));

// Desktop share fallback should download (no navigator.share in this Chromium setup usually)
const downloadPromise = page.waitForEvent("download", { timeout: 20000 }).catch(() => null);
await page.evaluate(() => {
  // Force desktop fallback path
  try {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  } catch (_) { /* ignore */ }
  try {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
  } catch (_) { /* ignore */ }
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
await page.waitForTimeout(150);
const en = await page.evaluate(() => ({
  eyebrow: document.getElementById("scEyebrow")?.textContent?.trim(),
  animalLabel: document.getElementById("scAnimalLabel")?.textContent?.trim(),
  share: document.getElementById("scShare")?.textContent?.trim(),
  cta: document.getElementById("scCta")?.textContent?.trim(),
}));

await page.click('.lang-btn[data-lang="fr"]');
await page.waitForTimeout(150);
const fr = await page.evaluate(() => ({
  eyebrow: document.getElementById("scEyebrow")?.textContent?.trim(),
  animalLabel: document.getElementById("scAnimalLabel")?.textContent?.trim(),
  share: document.getElementById("scShare")?.textContent?.trim(),
}));

const result = {
  ui,
  capture: { width: capture.width, height: capture.height, bytes: fs.statSync(pngPath).size },
  downloadedName,
  en,
  fr,
  pageErrors: errors.slice(0, 5),
  files: fs.readdirSync(outDir),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();

const ok =
  ui.type === "El Arqueólogo del Tiempo" &&
  ui.cta &&
  !/betacora\.app/i.test(ui.cta) &&
  ui.animalLabel === "Si fueras un animal" &&
  ui.logo &&
  ui.noStats &&
  Math.abs(ui.ratio - 1080 / 1350) < 0.03 &&
  capture.width === 1080 &&
  capture.height === 1350 &&
  capture.dataUrl.startsWith("data:image/png") &&
  en.animalLabel === "If you were an animal" &&
  en.share === "Share" &&
  fr.animalLabel === "Si vous étiez un animal" &&
  fr.share === "Partager" &&
  errors.length === 0;

process.exit(ok ? 0 : 1);
