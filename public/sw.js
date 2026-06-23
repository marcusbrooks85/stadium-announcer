// Minimal Service Worker for PWA Installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through to satisfy the browser audit
  event.respondWith(fetch(event.request));
});
