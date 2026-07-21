const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/questionnaire.html", {
    waitUntil: "networkidle",
  });

  // --- Order check ---
  const order = await page.evaluate(() => {
    const ids = ["datesBlock", "budgetBlock", "misionSection"];
    return ids.map((id) => {
      const el = document.getElementById(id);
      return { id, top: el ? el.getBoundingClientRect().top + window.scrollY : -1 };
    });
  });
  const orderOk =
    order[0].top < order[1].top && order[1].top < order[2].top;

  // --- Multilingual search ---
  async function searchDisplay(lang, query) {
    await page.click(`.lang-btn[data-lang="${lang}"]`);
    await page.waitForTimeout(200);
    await page.fill("#originSearch", "");
    await page.fill("#originSearch", query);
    await page.waitForTimeout(150);
    return page.evaluate(() => {
      const item = document.querySelector("#originResults .search-item .city-name");
      return item ? item.textContent.trim() : null;
    });
  }

  const parisEN = await searchDisplay("en", "Paris");
  const parisES = await searchDisplay("es", "Par");
  const parisFR = await searchDisplay("fr", "Paris");

  // Clear search dropdown
  await page.fill("#originSearch", "");
  await page.click("body");

  // --- Misión flow + collectAllAnswers ---
  await page.click('.lang-btn[data-lang="es"]');
  await page.waitForTimeout(100);

  // Select budget high to show luxury
  await page.locator('[data-q="budget_r"][data-v="high"]').click();
  await page.waitForTimeout(100);
  const luxuryVisible = await page.isVisible("#misionLuxuryBlock");

  // Focus max 2
  await page.locator('[data-q="mision_focus"][data-v="cultura"]').click();
  await page.locator('[data-q="mision_focus"][data-v="gastro"]').click();
  await page.locator('[data-q="mision_focus"][data-v="playa"]').click(); // should be ignored (max 2)
  const focusCount = await page.locator('[data-q="mision_focus"].sel').count();

  // Sport yes + surf + competir
  await page.locator('[data-q="mision_sport"][data-v="yes"]').click();
  await page.waitForTimeout(50);
  await page.locator('[data-q="mision_sports"][data-v="surf"]').click();
  await page.waitForTimeout(50);
  const intentVisible = await page.isVisible("#misionSportIntentBlock");
  await page.locator('[data-q="mision_sport_intent"][data-v="competir"]').click();
  await page.locator('[data-q="mision_luxury"][data-v="discretas"]').click();

  const payload = await page.evaluate(() => collectAllAnswers());

  // Intercept API body
  let postedBody = null;
  await page.route("**/api/generate-itinerary", async (route) => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ html: "<div>ok</div>" }),
    });
  });

  // Minimal required answers so generate doesn't bail early — call collect directly is enough;
  // also fire a fake fetch to confirm payload shape
  const fetched = await page.evaluate(async () => {
    const body = collectAllAnswers();
    const res = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, body };
  });

  console.log(JSON.stringify({
    orderOk,
    order,
    parisEN,
    parisES,
    parisFR,
    luxuryVisible,
    focusCount,
    intentVisible,
    mision_viaje: payload.mision_viaje,
    posted_mision: postedBody && postedBody.mision_viaje,
    fetchStatus: fetched.status,
    pageErrors: errors.slice(0, 5),
    geoLoaded: await page.evaluate(() => Array.isArray(window.GEO_CITIES) && GEO_CITIES.length),
  }, null, 2));

  await browser.close();

  const fail =
    !orderOk ||
    parisEN !== "Paris" ||
    parisES !== "París" ||
    parisFR !== "Paris" ||
    !luxuryVisible ||
    focusCount !== 2 ||
    !intentVisible ||
    !payload.mision_viaje ||
    !payload.mision_viaje.focus ||
    payload.mision_viaje.sport_intent !== "competir" ||
    !postedBody?.mision_viaje;
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
