const CACHE_NAME = "cat-794ac-manual-v3";
const APP_ROOT = self.registration.scope;
const APP_FILES = [
  APP_ROOT,
  new URL("./manifest.webmanifest", APP_ROOT).href,
  new URL("./pwa.js", APP_ROOT).href,
  new URL("./icons/cat-794.svg", APP_ROOT).href,
  new URL("./icons/cat-794-192.png", APP_ROOT).href,
  new URL("./icons/cat-794-512.png", APP_ROOT).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("cat-794ac-manual-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "CHECK_CACHE") {
    event.source?.postMessage({ type: "CACHE_READY", ready: true });
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const network = fetch(request);
    const cacheUpdate = network.then((response) => {
      if (!response.ok) return;
      return caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT, response.clone()));
    }).catch(() => {});
    event.waitUntil(cacheUpdate);
    event.respondWith(
      network.catch(async () => (await caches.match(request)) || (await caches.match(APP_ROOT)) || Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
