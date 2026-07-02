const CACHE_NAME = 'eoi-calc-v3';
const STATIC_ASSETS = [
  '/',
  '/locales/en/common.json',
  '/locales/zh/common.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
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

  // Network-first for navigation so deploys reach users immediately
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  // Hashed build assets are immutable — cache-first is safe
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request))
    );
    return;
  }

  // Everything else (locales, icons…) is stale-while-revalidate:
  // serve the cache for speed, refresh it in the background
  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetchAndCache(request).catch(() => cached);
      return cached || refresh;
    })
  );
});
