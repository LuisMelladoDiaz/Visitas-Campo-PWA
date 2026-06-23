const CACHE_NAME = 'visitas-tecnicas-cache-v1';
const ASSETS = ['index.html','manifest.json','sw.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request).then(networkResponse => {
    return caches.open(CACHE_NAME).then(cache => {
      cache.put(event.request, networkResponse.clone());
      return networkResponse;
    });
  }).catch(() => caches.match('index.html'))));
});
