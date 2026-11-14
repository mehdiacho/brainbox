// A basic service worker for PWA caching capabilities.
const CACHE_NAME = 'ideaspace-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Add other static assets you want to cache (e.g., /main.css, /app.js)
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request); // Fetch from network
      }
    )
  );
});