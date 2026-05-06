// Service Worker — Gestão CH
// Versão simples: só registra para permitir instalação como PWA
// Não faz cache pois o sistema depende de conexão com Google

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.clients.claim();
});

// Não intercepta nada — deixa todas as requisições passarem normalmente
self.addEventListener('fetch', function(e) {
  // Passa direto sem cache
});
