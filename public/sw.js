/**
 * Minimal Service Worker for PWA compliance.
 * Required for the 'beforeinstallprompt' event to fire in most browsers.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Standard fetch listener to enable offline caching / PWA status
});
