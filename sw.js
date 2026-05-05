// Service Worker — Gestão CH PWA
const CACHE = 'gestaoch-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Google Apps Script — sempre busca da rede
  if (e.request.url.includes('script.google.com') || e.request.url.includes('google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', {status:503})));
    return;
  }
  // Arquivos do app — cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
