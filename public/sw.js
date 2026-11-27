/* Service worker do painel: deixa o app instalável e abre mesmo com internet fraca. */
const CACHE = 'ssite-painel-v3';
const SHELL = ['/painel', '/static/app.css', '/static/panel.css', '/static/panel.js', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // dados e páginas públicas sempre da rede (nunca guardar dados das clientes)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/s/') || url.pathname.startsWith('/m/')) return;
  if (e.request.mode === 'navigate' && url.pathname.startsWith('/painel')) {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('/painel', copy)); return r; }).catch(() => caches.match('/painel')));
    return;
  }
  if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
  }
});
