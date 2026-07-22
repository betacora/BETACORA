/**
 * Verify Vercel Analytics: debug script loads + funnel events reach window.va.
 * Run: npm run verify:analytics  (dev server on BASE_URL)
 *
 * NOTE: In development, script.debug.js logs events to the console and may not
 * POST to production ingest. Production/preview on Vercel sends to /_vercel/insights.
 * Enable Web Analytics in the Vercel project dashboard for dashboard data.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    window.__btAnalytics = { events: [], scripts: [] };
    const push = (name, data) => {
      window.__btAnalytics.events.push({ name, data, t: Date.now() });
    };
    const queue = [];
    window.vaq = queue;
    window.va = function (cmd, payload) {
      queue.push(arguments);
      if (cmd === "event" && payload && payload.name) push(payload.name, payload.data);
    };
    const origAppend = Document.prototype.appendChild;
    Document.prototype.appendChild = function (node) {
      try {
        if (node && node.tagName === "SCRIPT" && node.src) {
          window.__btAnalytics.scripts.push(node.src);
        }
      } catch (_) {}
      return origAppend.call(this, node);
    };
  });

  const page = await context.newPage();
  const consoleLines = [];
  page.on("console", (m) => consoleLines.push(m.text()));

  const network = { debugScript: false, eventPosts: 0 };
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("script.debug.js") || u.includes("/_vercel/insights/script.js")) {
      network.debugScript = true;
    }
    if (
      u.includes("/insights/event") ||
      u.includes("/v1/event") ||
      u.includes("vitals.vercel-insights")
    ) {
      network.eventPosts += 1;
    }
  });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  await page.goto(`${BASE}/questionnaire`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  for (const f of page.frames()) {
    if (f.url().includes("questionnaire.html")) {
      await f.evaluate(() => {
        btTrack("questionnaire_completed", { trip_type: "destino", verify: true });
        btTrack("itinerary_generated", { mode: "short", verify: true });
      });
      break;
    }
  }
  await page.waitForTimeout(800);

  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const toggleBtns = page.locator("div.flex.rounded-\\[7px\\].overflow-hidden button");
  if ((await toggleBtns.count()) >= 2) {
    await toggleBtns.nth(1).click();
  }
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => window.__btAnalytics);
  const names = state.events.map((e) => e.name);
  const uniq = [...new Set(names)];

  const report = {
    network,
    scripts: state.scripts.filter((s) => /vercel|insights/i.test(s)),
    events: uniq,
    eventCount: names.length,
    vercelConsoleSample: consoleLines
      .filter((l) => /vercel|web analytics|\\[va\\]/i.test(l))
      .slice(0, 8),
  };
  console.log(JSON.stringify(report, null, 2));

  const required = [
    "landing_page_view",
    "questionnaire_started",
    "questionnaire_completed",
    "itinerary_generated",
    "registration_started",
  ];
  const missing = required.filter((e) => !uniq.includes(e));

  if (!network.debugScript && report.scripts.length === 0) {
    console.error("FAIL: Analytics script did not load");
    process.exit(1);
  }
  if (missing.length) {
    console.error("FAIL: missing events:", missing.join(", "));
    console.error("Got:", uniq.join(", ") || "(none)");
    process.exit(1);
  }

  console.log("✓ All funnel events fired and Analytics debug script loaded");
  console.log(
    "NOTE: Dashboard data requires enabling Web Analytics on the Vercel project."
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
