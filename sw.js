/* Static resources only. Firebase requests and user data bypass this worker. */
const CACHE = 'panel-admin-pwa-2026-10-03-v1';
const PREFIX = 'panel-admin-pwa-';
const STATIC = [
  './offline.html', './pwa.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-32.png'
];
const STATIC_URLS = new Set(STATIC.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(STATIC.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request, { cache: 'no-cache' }); }
      catch (error) {
        const cache = await caches.open(CACHE);
        const offline = await cache.match(new URL('./offline.html', self.registration.scope).href);
        return offline || new Response('Sin conexión. Revisa tu internet y vuelve a abrir el panel.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }
  if (STATIC_URLS.has(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(request)) || fetch(request);
    })());
  }
});
