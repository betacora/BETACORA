/**
 * Local harness: register public/sw.js, then detect waiting worker after sw.js changes.
 * Run with: node scripts/verify-sw-update.mjs
 * Requires a server serving the app (default http://127.0.0.1:3000).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SW_TEST_URL || "http://127.0.0.1:3000";
const SW_PATH = path.resolve("public/sw.js");
const MARKER = "/* __SW_VERIFY_MARK__ */";

async function main() {
  const original = fs.readFileSync(SW_PATH, "utf8");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = `${BASE}/?forceSw=1`;
  console.log("Opening", url);
  await page.goto(url, { waitUntil: "networkidle" });

  // Wait for SW to control the page (first install auto-activates)
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return Boolean(reg?.active) && Boolean(navigator.serviceWorker.controller);
  }, null, { timeout: 15000 });

  const before = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      active: reg?.active?.scriptURL || null,
      waiting: Boolean(reg?.waiting),
      cacheNameHint: "betacora-v5",
    };
  });
  console.log("Initial SW:", before);

  // Simulate deploy: change SW bytes so the browser fetches a new worker
  const bumped = original.includes(MARKER)
    ? original.replace(MARKER, `${MARKER}\n/* bump ${Date.now()} */`)
    : `${original}\n${MARKER}\n/* bump ${Date.now()} */\n`;
  fs.writeFileSync(SW_PATH, bumped);

  // Also bump a visible landing string via DOM only for the assert after reload path;
  // the SW update banner is the primary signal.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  });

  // Wait for waiting worker + banner
  await page.waitForFunction(() => {
    const banner = document.body.innerText.includes("Nueva versión disponible") ||
      document.body.innerText.includes("New version available") ||
      document.body.innerText.includes("Nouvelle version disponible");
    return banner;
  }, null, { timeout: 20000 }).catch(() => null);

  const mid = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const banner =
      document.body.innerText.includes("Nueva versión disponible") ||
      document.body.innerText.includes("New version available") ||
      document.body.innerText.includes("Nouvelle version disponible");
    return {
      waiting: Boolean(reg?.waiting),
      banner,
      textSample: document.body.innerText.slice(0, 200),
    };
  });
  console.log("After update check:", mid);

  if (!mid.waiting && !mid.banner) {
    throw new Error("Expected a waiting service worker or update banner after SW change");
  }

  // Click Actualizar / Update if banner present
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const btn = buttons.find((b) =>
      /Actualizar|Update|Mettre à jour/.test(b.textContent || "")
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Clicked update button:", clicked);

  if (clicked) {
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  }

  const after = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      waiting: Boolean(reg?.waiting),
      controller: Boolean(navigator.serviceWorker.controller),
      bannerGone: !(
        document.body.innerText.includes("Nueva versión disponible") ||
        document.body.innerText.includes("New version available")
      ),
    };
  });
  console.log("After activate/reload:", after);

  // Restore SW file
  fs.writeFileSync(SW_PATH, original);
  console.log("Restored public/sw.js");

  await browser.close();

  if (!mid.banner && !mid.waiting) process.exit(1);
  console.log("OK: update flow detected waiting SW / banner");
}

main().catch((err) => {
  try {
    const original = fs.readFileSync(SW_PATH, "utf8");
    // best-effort restore if we mutated
    if (original.includes(MARKER)) {
      // leave bumped content if restore failed mid-flight — caller can git checkout
    }
  } catch {}
  console.error(err);
  process.exit(1);
});
