const CACHE='eckos-v2';
const CORE=['./','./index.html','./manifest.json','./img/character.png','./img/ranks.png','./img/icon-192.png','./img/icon-512.png'];

self.addEventListener('install',ev=>{
  ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',ev=>{
  ev.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',ev=>{
  const req=ev.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  // Page shell: always try the network first so updates show up; fall back to cache offline.
  if(req.mode==='navigate'||req.url.endsWith('/index.html')||req.url.endsWith('/')){
    ev.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }
  // Static assets: cache-first, fill the cache on first fetch.
  ev.respondWith(
    caches.match(req).then(hit=>hit||fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return res;
    }))
  );
});
