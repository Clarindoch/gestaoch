// Service Worker — Gestão CH
// Simples: apenas permite instalação como PWA
self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function() { self.clients.claim(); });
// SEM handler de fetch — evita o aviso "no-op fetch handler"
