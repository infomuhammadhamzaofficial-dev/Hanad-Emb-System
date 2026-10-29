// ====================================================================
// CraftFlow - Service Worker for PWA (Zero Lag & Mobile Cache)
// ====================================================================

const CACHE_NAME = 'craftflow-cache-v12';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './data.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// Install Event: Pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First with Cache Fallback for dynamic fresh data
self.addEventListener('fetch', (event) => {
  // Let cross-origin Neon Cloud API and CDN requests pass straight to network
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Avoid caching POST/PUT requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone and update cache with fresh response
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline / spotty connection)
        return caches.match(event.request);
      })
  );
});
