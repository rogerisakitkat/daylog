'use strict';
/*
 * Day log page, increment 003 (2026-10-07; version 020-2): the part Chrome keeps on the
 * phone so the page opens and saves with no signal (D19, R27), takes over a
 * new approved version by itself (D23), and sends waiting entries when signal
 * comes back even with the page closed, where Chrome allows it.
 * Changing VERSION is what makes Chrome fetch a new version of the page.
 */
var VERSION = '020-2';
var CACHE = 'daylog-' + VERSION;
var FILES = ['./', 'index.html', 'app.js', 'send.js', 'style.css', 'manifest.webmanifest',
             'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

importScripts('send.js');

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('daylog-') === 0 && k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// The page's own files come from the phone; nothing else is touched (the
// sends to the sheet go straight to Google).
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (req.mode === 'navigate') {
          return c.match('./').then(function (page) { return page || fetch(req); });
        }
        return fetch(req);
      });
    })
  );
});

// Waits 20 seconds first: if the page is open and its own send gets through,
// nothing is left to send, so a Save is not sent twice.
self.addEventListener('sync', function (e) {
  if (e.tag === 'send') {
    e.waitUntil(DL.counts().then(function (c) {
      if (!c.anyWaiting) return null;
      return new Promise(function (resolve) { setTimeout(resolve, 20000); }).then(function () { return DL.sendWaiting(); });
    }));
  }
});
