const VERSION = 'tablevault-v1';
const CORE_FILES = ['', 'index.html', 'site.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'maskable-icon.svg', 'maskable-icon-512.png'];

function withBase(pathname) {
  return new URL(pathname, self.registration.scope).toString();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE_FILES.map((file) => withBase(file)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(VERSION).then((cache) => cache.put(withBase('index.html'), clone));
          return response;
        })
        .catch(async () => (await caches.match(withBase('index.html'))) || Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    }),
  );
});
