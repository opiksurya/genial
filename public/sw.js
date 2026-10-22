// Genial Agent Portal - Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'genial-agent-pwa-v1';
const PRECACHE_ASSETS = [
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[PWA SW] Precache warning:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Network-first strategy for dynamic data, cache fallback for assets
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If it's a valid static asset response, optionally update cache
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    (event.request.url.includes('/build/') || event.request.url.endsWith('.png') || event.request.url.endsWith('.svg'))
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
