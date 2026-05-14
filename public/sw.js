// public/sw.js
const CACHE_NAME = 'photohub-v1';
const API_CACHE = 'api-cache-v1';
const IMAGE_CACHE = 'images-cache-v1';

const PRECACHE_URLS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  console.log('SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW activating...');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== API_CACHE && key !== IMAGE_CACHE) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

async function cacheFirstWithHash(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  let networkResponse;
  try {
    networkResponse = await fetch(request.clone());
  } catch (err) {
    if (cachedResponse) return cachedResponse;
    throw err;
  }
  const newHash = networkResponse.headers.get('X-Content-Hash');
  if (cachedResponse) {
    const oldHash = cachedResponse.headers.get('X-Content-Hash');
    if (oldHash && newHash && oldHash === newHash && networkResponse.ok) {
      return cachedResponse;
    }
    await cache.delete(request);
  }
  if (networkResponse.ok) {
    const responseToCache = networkResponse.clone();
    await cache.put(request, responseToCache);
  }
  return networkResponse;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request.clone()).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.match(/\/api\/photos\/\d+\/variant/)) {
    event.respondWith(cacheFirstWithHash(event.request));
    return;
  }
  if (url.pathname.match(/\/api\/photos/)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});