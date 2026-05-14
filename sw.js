// GESTÃO CH v4 — Service Worker
// Versão incrementada força atualização no celular
var CACHE_NAME = 'gestaoch-v4-1';
var urlsToCache = ['/gestaoch/', '/gestaoch/index.html', '/gestaoch/manifest.json'];

self.addEventListener('install', function(event) {
  self.skipWaiting(); // Ativa imediatamente sem esperar
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache).catch(function(){});
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim(); // Toma controle imediato
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Network first para o HTML (sempre pegar versão mais nova)
  if (event.request.url.includes('index.html') || event.request.url.endsWith('/gestaoch/')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }
  // Cache first para outros recursos
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request);
    })
  );
});
