/**
 * Verify "Llévame aquí" injection + map popup deep links.
 * Usage: node scripts/verify-take-me.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const SAMPLE_HTML = `
<div class="profile-result">
  <div class="profile-type">Test Archetype</div>
  <div class="profile-essence">Essence</div>
</div>
<h2>Itinerario</h2>
<h3>Alfama sin filtros</h3>
<p class="day-meta">Día 1 — 8 oct</p>
<p>Empieza en el <strong>Hotel Independente</strong> y desayuna en <strong>Pastéis de Belém</strong>.</p>
<p>Por la tarde visita la <strong>Torre de Belém</strong> y cena en <strong>Cervejaria Ramiro</strong>.</p>
<script type="application/json" id="bt-places">
{"places":[
  {"name":"Hotel Independente","day":1,"lat":38.7169,"lng":-9.1484,"type":"hotel"},
  {"name":"Pastéis de Belém","day":1,"lat":38.6976,"lng":-9.2034,"type":"food"},
  {"name":"Torre de Belém","day":1,"lat":38.6916,"lng":-9.2160,"type":"sight"},
  {"name":"Cervejaria Ramiro","day":1,"lat":38.7203,"lng":-9.1360,"type":"food"}
]}
</script>
`;

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/questionnaire.html?mode=discover", {
    waitUntil: "load",
    timeout: 60000,
  });
  await page.waitForTimeout(800);

  // Avoid auth redirect loops from initFlowMode when not logged in
  await page.evaluate(() => {
    window.btAuth = Object.assign({}, window.btAuth || {}, {
      init: async () => ({}),
      getUser: async () => ({ id: "verify-user" }),
      getTravelerProfile: async () => null,
      checkLimit: async () => ({ allowed: true }),
      incrementCount: async () => {},
      saveItinerary: async () => ({ ok: true, id: "x" }),
    });
  });

  await page.evaluate((html) => {
    if (typeof renderItineraryHtml !== "function") {
      throw new Error("renderItineraryHtml missing");
    }
    renderItineraryHtml(html, { nombre: "Test Archetype", id: 1 });
  }, SAMPLE_HTML);

  await page.waitForTimeout(600);

  const report = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".bitacora-article a.bt-take-me")].map((a) => ({
      text: a.textContent.replace(/\s+/g, " ").trim(),
      href: a.getAttribute("href"),
      target: a.getAttribute("target"),
    }));

    // Open first marker popup via Leaflet
    let popupHtml = null;
    let popupLink = null;
    const map = window.btItineraryMap;
    if (map && typeof map.eachLayer === "function") {
      let opened = false;
      map.eachLayer((layer) => {
        if (opened) return;
        if (layer && typeof layer.getPopup === "function" && layer.getPopup() && typeof layer.openPopup === "function") {
          layer.openPopup();
          opened = true;
        }
      });
      const popupEl = document.querySelector(".leaflet-popup-content .bt-map-popup");
      popupHtml = popupEl ? popupEl.innerHTML : null;
      const a = popupEl?.querySelector("a.bt-take-me");
      popupLink = a
        ? { text: a.textContent.replace(/\s+/g, " ").trim(), href: a.getAttribute("href") }
        : null;
    } else {
      // Fallback: click first marker icon
      const icon = document.querySelector(".leaflet-marker-icon");
      if (icon) icon.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const popupEl = document.querySelector(".leaflet-popup-content .bt-map-popup");
      const a = popupEl?.querySelector("a.bt-take-me");
      popupLink = a
        ? { text: a.textContent.replace(/\s+/g, " ").trim(), href: a.getAttribute("href") }
        : null;
    }

    return {
      linkCount: links.length,
      links,
      uniqueHrefs: [...new Set(links.map((l) => l.href))],
      allMapsDir: links.every((l) =>
        /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/.test(l.href || ""),
      ),
      allBlank: links.every((l) => l.target === "_blank"),
      labelEs: links[0]?.text.includes("Llévame aquí"),
      mapExists: !!document.getElementById("btItineraryMap"),
      popupLink,
      popupHasTakeMe: !!(popupLink && /Llévame aquí|Take me there|M'y emmener/.test(popupLink.text)),
    };
  });

  // i18n EN
  await page.evaluate(() => {
    LANG.set("en");
    const article = document.querySelector(".bitacora-article");
    article.querySelectorAll("a.bt-take-me").forEach((a) => a.remove());
    // Re-inject with English label — call inject on places from lastTripPlaces
    if (typeof injectTakeMeLinks === "function" && window.lastTripPlaces) {
      injectTakeMeLinks(article, lastTripPlaces);
    } else if (typeof lastTripPlaces !== "undefined") {
      injectTakeMeLinks(article, lastTripPlaces);
    }
  });
  // lastTripPlaces is not on window - re-render
  await page.evaluate((html) => {
    LANG.set("en");
    renderItineraryHtml(html, { nombre: "Test Archetype", id: 1 });
  }, SAMPLE_HTML);
  await page.waitForTimeout(400);
  const enLabel = await page.evaluate(() => {
    const a = document.querySelector(".bitacora-article a.bt-take-me");
    return a ? a.textContent.replace(/\s+/g, " ").trim() : null;
  });

  await page.evaluate((html) => {
    LANG.set("fr");
    renderItineraryHtml(html, { nombre: "Test Archetype", id: 1 });
  }, SAMPLE_HTML);
  await page.waitForTimeout(400);
  const frLabel = await page.evaluate(() => {
    const a = document.querySelector(".bitacora-article a.bt-take-me");
    return a ? a.textContent.replace(/\s+/g, " ").trim() : null;
  });

  const checks = {
    fourLinks: report.linkCount === 4,
    mapsFormat: report.allMapsDir === true,
    blankTarget: report.allBlank === true,
    coordsIndependente: report.links.some((l) =>
      l.href.includes("38.7169") && l.href.includes("-9.1484"),
    ),
    coordsBelem: report.links.some((l) =>
      l.href.includes("38.6916") && l.href.includes("-9.216"),
    ),
    mapPopup: report.popupHasTakeMe === true &&
      /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/.test(report.popupLink?.href || ""),
    en: /Take me there/i.test(enLabel || ""),
    fr: /M'y emmener/i.test(frLabel || ""),
    noPageErrors: errors.length === 0,
  };

  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  console.log(JSON.stringify({ checks, report, enLabel, frLabel, failed, errors }, null, 2));
  await browser.close();
  if (failed.length) process.exit(1);
  console.log("OK take-me links");
})();
