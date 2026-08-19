// Service Worker for Control Recepción y Despacho PWA
const CACHE_NAME = 'control-forestal-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and avoid Firestore / external API requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore.googleapis.com')) return;
  if (event.request.url.includes('identitytoolkit.googleapis.com')) return;
  if (event.request.url.includes('chrome-extension')) return;

  // Network-first strategy to prevent stale 404 chunk errors
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, return it directly
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          // Optionally cache static assets like icon or manifest
          if (event.request.url.endsWith('.svg') || event.request.url.endsWith('.json')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline fallback
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/');
          if (fallback) return fallback;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
