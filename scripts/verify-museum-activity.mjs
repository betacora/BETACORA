import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3000/questionnaire.html", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForFunction(() => typeof collectAllAnswers === "function", null, { timeout: 15000 });

await page.click('.lang-btn[data-lang="es"]');
await page.locator('[data-q="cultura"][data-v="museos"]').click();
await page.waitForTimeout(100);
const museumPanelVisible = await page.evaluate(() => {
  const el = document.getElementById("museumTypePanel");
  return !!(el && el.classList.contains("show") && el.querySelectorAll('[data-q="museum_type"]').length >= 6);
});
await page.locator('[data-q="museum_type"][data-v="arte"]').click();
await page.locator('[data-q="museum_type"][data-v="historia"]').click();

await page.locator('[data-q="act"][data-v="safari"]').click();
await page.locator('[data-q="act"][data-v="nightlife"]').click();
await page.waitForTimeout(100);
const activityPanelVisible = await page.evaluate(() => {
  const el = document.getElementById("activityThisTripPanel");
  return !!(el && el.querySelectorAll(".sport-trip-row[data-act]").length >= 2);
});
await page.locator('[data-act="safari"][data-v="yes"]').click();
await page.locator('[data-act="nightlife"][data-v="maybe"]').click();

let postedBody = null;
await page.route("**/api/generate-itinerary", async (route) => {
  postedBody = route.request().postDataJSON();
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ html: "<div>ok</div>" }) });
});

const payload = await page.evaluate(async () => {
  const body = collectAllAnswers();
  await fetch("/api/generate-itinerary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return body;
});

const result = {
  museumPanelVisible,
  activityPanelVisible,
  museum_type: payload.mision_viaje?.museum_type,
  activity_this_trip: payload.mision_viaje?.activity_this_trip,
  posted_museum: postedBody?.mision_viaje?.museum_type,
  posted_activity: postedBody?.mision_viaje?.activity_this_trip,
  pageErrors: errors.slice(0, 5),
};
console.log(JSON.stringify(result, null, 2));
await browser.close();

const ok =
  museumPanelVisible &&
  activityPanelVisible &&
  Array.isArray(payload.mision_viaje?.museum_type) &&
  payload.mision_viaje.museum_type.includes("arte") &&
  payload.mision_viaje.museum_type.includes("historia") &&
  payload.mision_viaje.activity_this_trip?.safari === "yes" &&
  payload.mision_viaje.activity_this_trip?.nightlife === "maybe" &&
  postedBody?.mision_viaje?.museum_type &&
  postedBody?.mision_viaje?.activity_this_trip;
process.exit(ok ? 0 : 1);
