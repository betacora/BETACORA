/**
 * BeTacora service worker
 * - HTML / navigations: network-first (offline cache fallback)
 * - Next.js RSC / Flight: network-only (no cache)
 * - /api/*: network-only (never cache)
 * - /_next/static/* (hashed): cache-first
 * - Other same-origin GETs: stale-while-revalidate
 * - Updates: waiting SW until client posts SKIP_WAITING (banner)
 */
const CACHE_NAME = "betacora-v5";

self.addEventListener("install", (event) => {
  // Stay in waiting until the page asks us to activate — enables update banner UX.
  event.waitUntil(caches.open(CACHE_NAME).then(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function sameOrigin(url) {
  try {
    return url.origin === self.location.origin;
  } catch {
    return false;
  }
}

function isHtmlRequest(request, url) {
  if (request.mode === "navigate") return true;
  if (request.destination === "document") return true;
  const path = url.pathname;
  return (
    path.endsWith(".html") ||
    path === "/questionnaire" ||
    path === "/sobre-nosotros" ||
    path === "/about" ||
    path === "/a-propos"
  );
}

function isRscRequest(request, url) {
  if (url.searchParams.has("_rsc")) return true;
  const accept = request.headers.get("Accept") || "";
  return accept.includes("text/x-component");
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isImmutableStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

function isIconOrManifest(url) {
  return (
    url.pathname === "/manifest.json" ||
    /^\/icon-(192|512)\.png$/.test(url.pathname)
  );
}

async function networkFirst(request, { minHtmlBytes = 0 } = {}) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const shouldCache =
        minHtmlBytes <= 0 ||
        (await response
          .clone()
          .text()
          .then((t) => t.length > minHtmlBytes)
          .catch(() => false));
      if (shouldCache) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Offline navigation fallback to home shell if available
    if (request.mode === "navigate") {
      const home = await caches.match("/");
      if (home) return home;
    }
    throw new Error("network and cache miss");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }
  const network = await networkPromise;
  if (network) return network;
  throw new Error("network and cache miss");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // Don't intercept cross-origin (fonts CDN, analytics, etc.)
  if (!sameOrigin(url)) return;

  // API: always prefer live data; no offline cache of responses
  if (isApiRequest(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Next.js RSC / Flight: always prefer network (never cache — avoids stale soft nav)
  if (isRscRequest(event.request, url)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw new Error("rsc network miss");
      })
    );
    return;
  }

  // HTML / app shell: network-first so deploys show up on next visit
  if (isHtmlRequest(event.request, url)) {
    event.respondWith(networkFirst(event.request, { minHtmlBytes: 500 }));
    return;
  }

  // Manifest + icons: network-first so ?v= busting works
  if (isIconOrManifest(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Hashed Next.js assets + fonts: cache-first (safe — filenames change on deploy)
  if (isImmutableStatic(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else (public JS, images, etc.): SWR
  event.respondWith(staleWhileRevalidate(event.request));
});

