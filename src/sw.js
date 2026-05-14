// src/sw.js
const CACHE_NAME = 'photohub-v1';
const API_CACHE = 'api-cache-v1';
const IMAGE_CACHE = 'images-cache-v1';

// Файлы для кэширования при установке
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest' // если есть
];

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

// Стратегии кэширования
async function cacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request.clone());
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (e) {
    return new Response('Network error', { status: 503 });
  }
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
  
  // Кэширование вариантов изображений (Cache First)
  if (url.pathname.match(/\/api\/photos\/\d+\/variant/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Кэширование API списка фото (Stale While Revalidate)
  if (url.pathname.match(/\/api\/photos/)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Для статики (js, css, html) - используем кэш
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});