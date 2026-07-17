'use strict';

const CACHE = 'chino-v16';

// App shell + datos principales: si algo falla, el SW no se instala.
// Los shards de trazos (assets/data/strokes/) se cachean bajo demanda.
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/app.css',
  './assets/js/lib/hanzi-writer.min.js',
  './assets/js/app/core.js',
  './assets/js/app/home.js',
  './assets/js/app/learn.js',
  './assets/js/app/dict.js',
  './assets/js/app/practice.js',
  './assets/js/app/strokes.js',
  './assets/js/app/songs.js',
  './assets/js/app/profile.js',
  './assets/js/app/main.js',
  './assets/data/words.json',
  './assets/data/chars.json',
  './assets/data/radicals.json',
  './assets/images/favicon.svg',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './assets/images/icon-maskable-512.png',
  // Fuentes locales
  './assets/fonts/aFTU7PB1QTsUX8KYthqQBA.woff2',
  './assets/fonts/aFTU7PB1QTsUX8KYthSQBLyM.woff2',
  './assets/fonts/aFTR7PB1QTsUX8KYvumzEYOtbQ.woff2',
  './assets/fonts/aFTR7PB1QTsUX8KYvumzEY2tbZX9.woff2',
  './assets/fonts/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2',
  './assets/fonts/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K6h9Q.woff2',
  './assets/fonts/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2',
  './assets/fonts/nuFiD-vYSZviVYUb_rj3ij__anPXDTLYgFE_.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var sameOrigin = url.origin === self.location.origin;

  // Datos JSON: stale-while-revalidate — sirve caché al instante pero
  // actualiza en segundo plano, para que los datos nuevos lleguen solos.
  if (sameOrigin && /\/assets\/data\//.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
          var refresh = fetch(e.request).then(function (res) {
            if (res && res.ok) c.put(e.request, res.clone());
            return res;
          }).catch(function () { return hit; });
          return hit || refresh;
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.ok && sameOrigin) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      });
    })
  );
});
