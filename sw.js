// ====================================================================
// CraftFlow - Service Worker for PWA (Offline-First & Resilient)
// ====================================================================

const CACHE_NAME = 'craftflow-cache-v46';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
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

// Activate Event: Clear all outdated caches to free up storage immediately
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

// Fetch Event: Cache-First with ignoreSearch for static assets, no duplicate query entries
self.addEventListener('fetch', (event) => {
  // Let cross-origin Neon Cloud API and CDN requests pass straight to network
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Avoid non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. Navigation requests (Opening the app, desktop shortcut, mobile shortcut)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      caches.match('./index.html', { ignoreSearch: true }).then((cachedIndex) => {
        // Try network fetch to keep fresh if server is up
        const networkFetch = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('./index.html', networkResponse.clone());
              cache.put('./', networkResponse);
            });
          }
          return networkResponse;
        }).catch(() => null);

        // If we have cached copy, return it immediately so app opens fast and never errors
        if (cachedIndex) {
          return cachedIndex;
        }

        // If not cached, wait for network or fallback
        return networkFetch.then(res => res || caches.match('./index.html'));
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2. Static Assets
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              const cleanRequest = new Request(url.origin + url.pathname, { method: 'GET' });
              cache.put(cleanRequest, networkResponse);
            });
          }
        }).catch(() => null);
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const path = url.pathname.toLowerCase();
          if (path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js') || 
              path.endsWith('.json') || path.endsWith('.svg') || path.endsWith('.png') || 
              path === '/' || path.endsWith('/')) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              const cleanRequest = new Request(url.origin + url.pathname, { method: 'GET' });
              cache.put(cleanRequest, resClone);
            });
          }
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
