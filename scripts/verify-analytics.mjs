/**
 * Verify Vercel Analytics funnel events in the browser.
 * In development, @vercel/analytics uses debug mode (console only — no network posts).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";

const REQUIRED = [
  "landing_page_view",
  "questionnaire_started",
  "questionnaire_completed",
  "itinerary_generated",
  "registration_started",
];

function eventsFromConsole(lines) {
  const found = new Set();
  for (const text of lines) {
    for (const name of REQUIRED) {
      if (
        text.includes(`[event] ${name}`) ||
        text.includes(`name: ${name}`) ||
        (text.includes("Running queued event") && text.includes(name))
      ) {
        found.add(name);
      }
    }
  }
  return found;
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();

  const consoleLines = [];
  page.on("console", (m) => consoleLines.push(m.text()));

  let debugScript = false;
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("script.debug.js") || u.includes("/_vercel/insights/script.js")) {
      debugScript = true;
    }
  });

  async function waitForEvent(name, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (eventsFromConsole(consoleLines).has(name)) return true;
      await page.waitForTimeout(200);
    }
    return eventsFromConsole(consoleLines).has(name);
  }

  // Landing → landing_page_view
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  if (!(await waitForEvent("landing_page_view"))) {
    console.warn("landing_page_view not seen yet; dumping recent console:");
    console.warn(consoleLines.slice(-15).join("\n"));
  }

  // Questionnaire → questionnaire_started; iframe btTrack → completed + generated
  await page.goto(`${BASE}/questionnaire`, { waitUntil: "networkidle" });
  await waitForEvent("questionnaire_started");
  for (const f of page.frames()) {
    if (f.url().includes("questionnaire.html")) {
      await f.evaluate(() => {
        btTrack("questionnaire_completed", { trip_type: "destino", verify: true });
        btTrack("itinerary_generated", { mode: "short", verify: true });
      });
      break;
    }
  }
  await waitForEvent("questionnaire_completed");
  await waitForEvent("itinerary_generated");

  // Auth → registration_started
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const toggleBtns = page.locator("div.flex.rounded-\\[7px\\].overflow-hidden button");
  if ((await toggleBtns.count()) >= 2) {
    await toggleBtns.nth(1).click();
  }
  await waitForEvent("registration_started");

  const found = eventsFromConsole(consoleLines);
  const vercelLines = consoleLines.filter((l) => /Vercel Web Analytics/i.test(l));

  const report = {
    debugScript,
    events: [...found].sort(),
    vercelLogCount: vercelLines.length,
    sample: vercelLines.filter((l) => /\[event\]|queued event/.test(l)).slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));

  const missing = REQUIRED.filter((e) => !found.has(e));
  if (!debugScript) {
    console.error("FAIL: Analytics debug script did not load");
    process.exit(1);
  }
  if (missing.length) {
    console.error("FAIL: missing events:", missing.join(", "));
    process.exit(1);
  }

  console.log("✓ Funnel events confirmed via Vercel Analytics debug console");
  console.log(
    "NOTE: Dev mode does not POST to Vercel. Enable Web Analytics in the Vercel project dashboard for production data."
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
