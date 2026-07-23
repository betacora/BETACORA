import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const MOCK_PROFILE = {
  profile_type: "El Explorador Auténtico",
  profile_essence: "Curioso y flexible",
  traveler_answers: {
    wake: "manana",
    pace: ["balanced"],
    energy: 3,
    motiv: ["cultura"],
    exp: ["local"],
    guide: ["no"],
    accom: ["boutique"],
    accom_location: "centro",
    accom_priority: "equilibrio",
    amenity: ["wifi"],
    food: ["local"],
    diet: ["ninguna"],
    cultura: ["museos"],
    act: ["trekking"],
    social: "solo",
    social_e: "ambiv",
    splurge: ["exp"],
  },
  trip_defaults: { origin: ["Madrid"], currency: "EUR" },
  source: "profiles",
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // Discover mode first — avoid auth redirect; then enter trip mode manually
  await page.goto(
    "http://localhost:3000/questionnaire.html?mode=discover&cb=" + Date.now(),
    { waitUntil: "networkidle" },
  );

  await page.evaluate((profile) => {
    if (typeof enterTripMode !== "function") throw new Error("enterTripMode missing");
    enterTripMode(profile);
  }, MOCK_PROFILE);

  await page.waitForTimeout(300);

  // Ensure dest search is visible in hero
  await page.waitForSelector("#qtSearchSlot #destSearch", { state: "visible", timeout: 5000 });

  const ui = await page.evaluate(() => {
    const personalityVisible = [...document.querySelectorAll('[data-flow="personality"]')].some(
      (el) => !el.classList.contains("flow-hidden") && el.offsetParent !== null,
    );
    return {
      qtActive: document.body.classList.contains("qt-active"),
      heroVisible: !!document.getElementById("qtHero") && !document.getElementById("qtHero").hidden,
      heroTitle: document.getElementById("qtHeroTitle")?.textContent?.trim() || "",
      destInHero: !!document.querySelector("#qtSearchSlot #destSearch"),
      personalityVisible,
      wakeVisible: !!document.querySelector('[data-q="wake"]')?.closest(".section")?.offsetParent,
      progressHidden: getComputedStyle(document.querySelector(".progress-wrap")).display === "none",
      answersWake: answers.wake,
      answersSocial: answers.social,
      updateHrefReady: !!document.getElementById("qtUpdateProfile"),
    };
  });

  // Search + select Lisbon
  await page.fill("#destSearch", "Lisboa");
  await page.waitForTimeout(350);
  await page.locator("#destResults .search-item").first().click();
  await page.waitForTimeout(300);

  const panel = await page.evaluate(() => {
    const overlay = document.getElementById("qtOverlay");
    const body = document.getElementById("qtPanelBody");
    const ids = ["accomSection", "datesBlock", "budgetBlock", "misionSection"];
    const inPanel = {};
    ids.forEach((id) => {
      inPanel[id] = !!body?.querySelector(`#${id}`);
    });
    const wakeInPanel = !!body?.querySelector('[data-q="wake"]');
    const paceInPanel = !!body?.querySelector('[data-q="pace"]');
    const socialInPanel = !!body?.querySelector("#socialBlock");
    return {
      open: overlay?.classList.contains("open"),
      panelOpenClass: document.body.classList.contains("qt-panel-open"),
      destLabel: document.getElementById("qtPanelDest")?.textContent?.trim() || "",
      inPanel,
      wakeInPanel,
      paceInPanel,
      socialInPanel,
      updateText: document.getElementById("qtUpdateProfile")?.textContent?.trim() || "",
      accomPrefill: !!document.querySelector('#qtPanelBody [data-q="accom"][data-v="boutique"].sel'),
    };
  });

  // Confirm update link does NOT auto-navigate; capture explicit target without leaving
  const urlBefore = page.url();
  await page.waitForTimeout(400);
  const urlAfterIdle = page.url();

  const updateIntent = await page.evaluate(() => {
    let target = null;
    const btn = document.getElementById("qtUpdateProfile");
    if (!btn || typeof exitQuickTripToFullProfile !== "function") {
      return { ok: false, reason: "missing" };
    }
    const topWin = window.top || window;
    const desc = Object.getOwnPropertyDescriptor(topWin, "location");
    const fakeLoc = {
      href: topWin.location.href,
      replace(u) {
        target = u;
      },
    };
    try {
      // Patch assign path used by exitQuickTripToFullProfile
      const prev = topWin.location;
      Object.defineProperty(topWin, "location", {
        configurable: true,
        get() {
          return {
            ...prev,
            set href(u) {
              target = u;
            },
            get href() {
              return prev.href;
            },
          };
        },
      });
    } catch (e) {
      /* fallback: read function source */
    }
    const src = String(exitQuickTripToFullProfile);
    const wantsDiscover = /mode=discover/.test(src);
    return {
      ok: wantsDiscover,
      srcHasDiscover: wantsDiscover,
      label: btn.textContent.trim(),
    };
  });

  // Fill trip fields + generate with merge check
  await page.locator('#qtPanelBody [data-q="dur"][data-v="semana"]').click();
  await page.fill("#budgetMax", "2500");
  await page.locator('#qtPanelBody [data-q="budget_r"][data-v="mid"]').click();
  await page.locator('#qtPanelBody [data-q="mision_focus"][data-v="cultura"]').click();

  let postedBody = null;
  await page.route("**/api/generate-itinerary", async (route) => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        html: "<h2>Día 1</h2><p>Lisboa test</p>",
        archetype: { id: "explorador", nombre: "El Explorador Auténtico" },
        mode: "full",
      }),
    });
  });

  await page.click("#qtSubmitBtn");
  await page.waitForTimeout(800);

  const afterGen = await page.evaluate(() => ({
    panelStillOpen: document.getElementById("qtOverlay")?.classList.contains("open"),
    itineraryShown: document.getElementById("itinerarySection")?.classList.contains("show"),
  }));

  const report = {
    ui,
    panel,
    urlBefore,
    urlAfterIdle,
    urlUnchangedUntilTap: urlBefore === urlAfterIdle,
    updateIntent,
    postedBody: postedBody
      ? {
          wake: postedBody.wake,
          social: postedBody.social,
          social_e: postedBody.social_e,
          destinations: postedBody.destinations,
          budgetMax: postedBody.budgetMax,
          trip_type: postedBody.trip_type,
          mision_focus: postedBody.mision_viaje?.focus,
          accom: postedBody.accom,
          origin: postedBody.origin,
        }
      : null,
    afterGen,
    pageErrors: errors,
  };

  const checks = {
    qtActive: ui.qtActive === true,
    heroSearch: ui.destInHero === true && /dónde|where|où/i.test(ui.heroTitle),
    personalityHidden: ui.personalityVisible === false && ui.wakeVisible === false,
    dnaSilent: ui.answersWake === "manana" && ui.answersSocial === "solo",
    panelOpens: panel.open === true,
    tripFieldsOnly:
      panel.inPanel.accomSection &&
      panel.inPanel.datesBlock &&
      panel.inPanel.budgetBlock &&
      panel.inPanel.misionSection &&
      !panel.wakeInPanel &&
      !panel.paceInPanel &&
      !panel.socialInPanel,
    updateLinkPresent: /perfil|profile|profil/i.test(panel.updateText),
    noAutoUpdate: report.urlUnchangedUntilTap,
    generateMerged:
      postedBody?.wake === "manana" &&
      postedBody?.social === "solo" &&
      postedBody?.trip_type === "destino" &&
      Array.isArray(postedBody?.destinations) &&
      postedBody.destinations.length > 0 &&
      String(postedBody.budgetMax) === "2500",
    updateExplicit: report.updateIntent?.srcHasDiscover === true,
  };

  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  console.log(JSON.stringify({ checks, report, failed: failed.map(([k]) => k) }, null, 2));

  await browser.close();
  if (failed.length) {
    console.error("FAIL", failed.map(([k]) => k).join(", "));
    process.exit(1);
  }
  console.log("OK quick-trip flow");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
