// Hand-written service worker (no next-pwa).
// iOS note: Safari evicts SW caches aggressively under storage pressure and
// after ~weeks of non-use. Every strategy below treats the cache as a bonus,
// never as the source of truth — a cold cache only costs a network round-trip.
const CACHE_NAME = 'eoi-calc-v5';

// Minimal app shell: enough to render something offline.
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/locales/en/common.json',
  '/locales/zh/common.json',
  '/android-chrome-192x192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok && request.url.startsWith(self.location.origin)) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Pages: network-first so deploys reach users immediately; refresh the
  // cached shell copy on success, fall back to it offline. On "lie-fi" the
  // request can hang far past usefulness — race it against a timeout and
  // serve the cached shell instead of a blank wait.
  // Cached (and matched) by the request's own URL, not a hardcoded '/' —
  // there's more than one route (/, /sponsorship), and a shared-key cache
  // would serve the wrong page offline for every route but whichever loaded last.
  if (request.mode === 'navigate') {
    const NAV_TIMEOUT_MS = 3000;
    event.respondWith(
      (async () => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        try {
          return await Promise.race([
            network,
            new Promise((_, reject) => setTimeout(() => reject(new Error('nav-timeout')), NAV_TIMEOUT_MS)),
          ]);
        } catch {
          // Cold cache: fall back to this route's cached copy, then the app
          // shell ('/'), then let the in-flight network attempt settle.
          return (await caches.match(request)) || (await caches.match('/')) || network;
        }
      })()
    );
    return;
  }

  // Hashed build assets are immutable — cache-first is safe.
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request))
    );
    return;
  }

  // Everything else (locales, icons…): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetchAndCache(request).catch(() => cached);
      return cached || refresh;
    })
  );
});
