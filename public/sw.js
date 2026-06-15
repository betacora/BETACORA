const CACHE_NAME = "betacora-v3";
// Do not precache HTML — stale/empty shells caused blank iframe after SW activation
const PRECACHE_URLS = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isHtmlRequest(request) {
  if (request.mode === "navigate") return true;
  if (request.destination === "document") return true;
  try {
    const path = new URL(request.url).pathname;
    return path.endsWith(".html") || path === "/questionnaire";
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Network-first for HTML so SW activation never serves stale blank shells
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const copy = response.clone();
            const text = await copy.text();
            // Never cache empty or trivially small HTML documents
            if (text.length > 500) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
            }
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
