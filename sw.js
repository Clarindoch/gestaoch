const CACHE='gestaoch-v3';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){self.clients.claim();});
self.addEventListener('fetch',function(e){
  if(e.request.url.includes('script.google.com')||e.request.url.includes('googleapis.com')){
    e.respondWith(fetch(e.request).catch(function(){return new Response('Offline',{status:503});}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request);}));
});