// Service Worker — Gestão CH PWA
const CACHE = 'gestaoch-v1';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ARQUIVOS); }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.includes('script.google.com') || e.request.url.includes('google.com')) {
    e.respondWith(fetch(e.request).catch(function() { return new Response('Offline', {status: 503}); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) { return cached || fetch(e.request); })
  );
});
