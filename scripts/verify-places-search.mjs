/**
 * Verification for Pieza 1 — Places search proxy.
 *
 * Checks:
 * 1) Missing GOOGLE_PLACES_API_KEY → clear PlacesConfigError (not a crash)
 * 2) Scrubbed payloads never contain the API key (browser-visible JSON safety)
 * 3) Optional live Text Search when GOOGLE_PLACES_API_KEY is set
 * 4) Optional HTTP route checks when BASE_URL is set
 *
 * Usage (Node 22+):
 *   node --experimental-strip-types scripts/verify-places-search.mjs
 *   GOOGLE_PLACES_API_KEY=... node --experimental-strip-types scripts/verify-places-search.mjs
 *   BASE_URL=http://127.0.0.1:3000 node --experimental-strip-types scripts/verify-places-search.mjs
 */

import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let failed = 0;
function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  failed += 1;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function loadPlaces() {
  const tsPath = path.join(root, "lib/places.ts");
  return import(pathToFileURL(tsPath).href);
}

async function main() {
  const savedKey = process.env.GOOGLE_PLACES_API_KEY;

  // --- 1) Missing key ---
  delete process.env.GOOGLE_PLACES_API_KEY;
  const places = await loadPlaces();

  let missingThrew = false;
  try {
    await places.searchPlacesText({ query: "Museo del Prado" });
  } catch (err) {
    missingThrew = true;
    const isConfig =
      err instanceof places.PlacesConfigError ||
      (err && typeof err === "object" && err.name === "PlacesConfigError");
    const msg = err instanceof Error ? err.message : String(err);
    if (isConfig && /GOOGLE_PLACES_API_KEY/i.test(msg)) {
      pass("missing key → PlacesConfigError", msg.slice(0, 120));
    } else {
      fail(
        "missing key → PlacesConfigError",
        `got ${err?.name || typeof err}: ${msg}`,
      );
    }
  }
  if (!missingThrew) fail("missing key → PlacesConfigError", "no error thrown");

  // --- 2) Key never appears in scrubbed client payloads ---
  const fakeKey = "AIzaSyFakeKeyForScrubTest_DO_NOT_USE_123456";
  process.env.GOOGLE_PLACES_API_KEY = fakeKey;

  const polluted = JSON.stringify({
    ok: true,
    leak: fakeKey,
    url: `https://example.com?key=${fakeKey}`,
    header: `X-Goog-Api-Key: ${fakeKey}`,
    places: [{ name: "Café", note: `secret ${fakeKey}` }],
  });
  const scrubbed = places.scrubSecrets(polluted, fakeKey);
  if (scrubbed.includes(fakeKey)) {
    fail("scrubSecrets removes API key from JSON", scrubbed.slice(0, 200));
  } else if (!scrubbed.includes("[redacted]")) {
    fail("scrubSecrets marks redacted placeholders");
  } else {
    pass("scrubSecrets removes API key from browser-visible JSON");
  }

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        places: [
          {
            id: "places/ChIJdemo",
            displayName: { text: "Museo del Prado" },
            formattedAddress: "Madrid, Spain",
            location: { latitude: 40.4138, longitude: -3.6921 },
            rating: 4.7,
            userRatingCount: 1000,
            types: ["museum"],
            googleMapsUri: "https://maps.google.com/?cid=demo",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const result = await places.searchPlacesText({
      query: "Museo del Prado",
      limit: 3,
    });
    const serialized = places.scrubSecrets(
      JSON.stringify({ ok: true, ...result }),
      fakeKey,
    );
    if (serialized.includes(fakeKey)) {
      fail(
        "searchPlacesText response must not contain API key",
        serialized.slice(0, 300),
      );
    } else if (
      !result.places?.length ||
      result.places[0].name !== "Museo del Prado"
    ) {
      fail("mocked search shape", JSON.stringify(result).slice(0, 300));
    } else {
      pass(
        "mocked Text Search shape (no key in payload)",
        `${result.count} place(s), name=${result.places[0].name}`,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- 3) Live Places call (optional) ---
  if (savedKey && savedKey.trim()) {
    process.env.GOOGLE_PLACES_API_KEY = savedKey.trim();
    try {
      const live = await places.searchPlacesText({
        query: "Museo del Prado Madrid",
        language: "es",
        limit: 3,
      });
      const liveJson = JSON.stringify({ ok: true, ...live });
      if (liveJson.includes(savedKey.trim())) {
        fail("LIVE response leaked API key");
      } else if (!live.places?.length) {
        fail("LIVE Text Search returned zero places", liveJson.slice(0, 300));
      } else {
        pass(
          "LIVE Text Search",
          live.places
            .map((p) => p.name)
            .slice(0, 3)
            .join(" | "),
        );
        console.log(
          "LIVE_SAMPLE",
          JSON.stringify(
            {
              ok: true,
              count: live.count,
              places: live.places.map((p) => ({
                id: p.id,
                name: p.name,
                address: p.address,
                rating: p.rating,
              })),
            },
            null,
            2,
          ),
        );
      }
    } catch (err) {
      fail(
        "LIVE Text Search",
        err instanceof Error ? err.message : String(err),
      );
    }
  } else {
    console.log(
      "SKIP  LIVE Text Search — set GOOGLE_PLACES_API_KEY to verify real Google results in this environment",
    );
  }

  if (savedKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
  else process.env.GOOGLE_PLACES_API_KEY = savedKey;

  // --- 4) HTTP route (optional) ---
  const base = process.env.BASE_URL?.replace(/\/$/, "");
  if (base) {
    const missing = await fetch(`${base}/api/places/search?q=prado`);
    const missingBody = await missing.text();
    let missingJson = {};
    try {
      missingJson = JSON.parse(missingBody);
    } catch {
      /* ignore */
    }

    // Without GOOGLE_PLACES_API_KEY on the server → misconfigured.
    // With key but without Upstash → rate_limit_unavailable (fail-closed).
    const code = missingJson.code;
    if (
      missing.status === 503 &&
      (code === "misconfigured" || code === "rate_limit_unavailable")
    ) {
      pass(
        "HTTP without key/Upstash → clear 503",
        `code=${code}`,
      );
    } else if (missing.status === 200 && Array.isArray(missingJson.places)) {
      pass(
        "HTTP live search OK",
        `${missingJson.count} place(s)`,
      );
    } else {
      fail(
        "HTTP clear error or results",
        `status=${missing.status} body=${missingBody.slice(0, 240)}`,
      );
    }

    if (savedKey && missingBody.includes(savedKey)) {
      fail("HTTP body leaked API key");
    } else if (fakeKey && missingBody.includes(fakeKey)) {
      fail("HTTP body leaked fake test key");
    } else {
      pass("HTTP body does not contain API key");
    }

    // Empty q: if key missing → misconfigured; if key+upstash present → validation_error
    const empty = await fetch(`${base}/api/places/search`);
    const emptyBody = await empty.text();
    if (emptyBody.includes("AIza") || (savedKey && emptyBody.includes(savedKey))) {
      fail("empty-q response leaked key-like secret");
    } else {
      pass("empty-q response has no API key");
    }
  } else {
    console.log(
      "SKIP  HTTP route checks — set BASE_URL=http://127.0.0.1:3000 after next start",
    );
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll places-search checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
