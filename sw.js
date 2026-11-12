/* WordShelf service worker: makes the app work offline.
   When you change index.html, also change the version number below (v1 -> v2),
   so that phones download the new version. */
const CACHE = 'wordshelf-v1';
const FONTS = 'wordshelf-fonts';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'privacy.html',
               'icon-192.png', 'icon-512.png', 'maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The app itself: cache first, so it opens with no internet.
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit =>
        hit || fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        }).catch(() => caches.match('index.html'))
      )
    );
    return;
  }

  // Google Fonts: save them the first time they load, so they also work offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONTS).then(c =>
        c.match(req).then(hit =>
          hit || fetch(req).then(res => { c.put(req, res.clone()); return res; })
        )
      )
    );
  }
});
