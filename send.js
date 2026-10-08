'use strict';
/*
 * Day log page, increment 003 (2026-10-07; 015, 2026-10-08: the code problem is
 * written only for the link stored now). Shared by the page (app.js) and
 * the part that keeps it working with no signal (sw.js).
 * Keeps everything in the phone's own storage (IndexedDB) and sends entries
 * that are waiting to the sheet. Nothing here knows the sheet's address
 * or code until the phone has been linked by the QR code (D46).
 *
 * Stores:
 *   kv       settings and small things: link {url, code, test, linkedAt},
 *            draft (the half-filled screen), lastSaved (the green bar),
 *            codeProblem (the sheet said the code was wrong), usuals (the
 *            usual ones in use, put there by page 012; from 013 only read)
 *   entries  every entry and version the phone has saved (D31)
 *   outbox   entries and versions not yet confirmed by the sheet:
 *            {key, seq, status: 'waiting' | 'refused', why, payload}
 */
var DL = (function () {
  var DB_NAME = 'daylog';
  var BATCH = 100;               // the sheet takes up to 500 in one send
  var MAX_CHARS = 800000;        // and up to 2,000,000 characters
  var TIMEOUT_MS = 45000;
  var dbPromise = null;

  function db() {
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve, reject) {
        var r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = function () {
          var d = r.result;
          if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
          if (!d.objectStoreNames.contains('entries')) d.createObjectStore('entries', { keyPath: 'key' });
          if (!d.objectStoreNames.contains('outbox')) d.createObjectStore('outbox', { keyPath: 'key' });
        };
        r.onsuccess = function () {
          var d = r.result;
          d.onversionchange = function () { d.close(); dbPromise = null; };
          resolve(d);
        };
        r.onerror = function () { dbPromise = null; reject(r.error); };
        r.onblocked = function () { /* another tab holds an older version; it closes itself */ };
      });
    }
    return dbPromise;
  }

  // One transaction over several stores; body(stores, result) queues the work.
  // Resolves with result only when everything in it has been written.
  function run(stores, mode, body) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var t = d.transaction(stores, mode);
        var s = {};
        stores.forEach(function (n) { s[n] = t.objectStore(n); });
        var result = {};
        try { body(s, result); } catch (err) { try { t.abort(); } catch (e) { /* already done */ } reject(err); return; }
        t.oncomplete = function () { resolve(result); };
        t.onerror = function () { reject(t.error || new Error('storage error')); };
        t.onabort = function () { reject(t.error || new Error('storage aborted')); };
      });
    });
  }

  function get(store, key) {
    return run([store], 'readonly', function (s, r) {
      var q = s[store].get(key);
      q.onsuccess = function () { r.value = q.result; };
    }).then(function (r) { return r.value; });
  }

  function getAll(store) {
    return run([store], 'readonly', function (s, r) {
      var q = s[store].getAll();
      q.onsuccess = function () { r.value = q.result; };
    }).then(function (r) { return r.value || []; });
  }

  function put(store, value, key) {
    return run([store], 'readwrite', function (s) {
      if (key === undefined) s[store].put(value); else s[store].put(value, key);
    });
  }

  function del(store, key) {
    return run([store], 'readwrite', function (s) { s[store].delete(key); });
  }

  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function stampNow() {
    var d = new Date();
    var o = -d.getTimezoneOffset();
    var sign = o < 0 ? '-' : '+';
    o = Math.abs(o);
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' +
      p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) + ' ' +
      sign + p2(Math.floor(o / 60)) + ':' + p2(o % 60);
  }

  function tell() {
    try { var bc = new BroadcastChannel('daylog'); bc.postMessage('changed'); bc.close(); } catch (e) { /* not available */ }
  }

  // Sends everything waiting. Resolves when the sheet has answered (or there
  // was nothing to send); rejects when the sheet could not be reached or did
  // not answer properly, so that Chrome tries again later. Only one send runs
  // at a time in each page or worker; a send from both at once is harmless,
  // because the sheet adds an entry and version only once.
  var sending = null;
  function sendWaiting() {
    if (!sending) {
      sending = sendRound(0).then(function (x) { sending = null; return x; },
                                  function (err) { sending = null; throw err; });
    }
    return sending;
  }

  function sendRound(rounds) {
    return Promise.all([get('kv', 'link'), getAll('outbox')]).then(function (a) {
      var link = a[0];
      var waiting = a[1].filter(function (x) { return x.status === 'waiting'; });
      if (!link || !link.url || !link.code || waiting.length === 0) return { sent: 0 };
      waiting.sort(function (x, y) { return x.seq - y.seq; });
      // Fill the send up to BATCH entries and MAX_CHARS characters (always at least one entry).
      var batch = [], size = 0;
      for (var i = 0; i < waiting.length && batch.length < BATCH; i++) {
        var n = JSON.stringify(waiting[i].payload).length;
        if (batch.length && size + n > MAX_CHARS) break;
        batch.push(waiting[i]);
        size += n;
      }
      var body = JSON.stringify({ code: link.code, entries: batch.map(function (x) { return x.payload; }) });
      var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
      return fetch(link.url, {
        method: 'POST', body: body, credentials: 'omit', redirect: 'follow', cache: 'no-store',
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (resp) {
        return resp.text();
      }).then(function (text) {
        clearTimeout(timer);
        var ans = null;
        try { ans = JSON.parse(text); } catch (e) { ans = null; }
        if (!ans || ans.ok !== true || !Array.isArray(ans.results)) {
          if (ans && ans.error === 'not allowed') {
            return codeProblemFor(link).then(function () {
              tell();
              throw new Error('the sheet did not accept the code');
            });
          }
          throw new Error('the sheet did not answer properly' + (ans && ans.error ? ': ' + ans.error : ''));
        }
        var byKey = {};
        ans.results.forEach(function (r) {
          if (r && typeof r.id === 'string' && typeof r.version === 'number') byKey[r.id + ':' + r.version] = r;
        });
        var settled = 0;
        return run(['outbox', 'kv'], 'readwrite', function (s) {
          s.kv.delete('codeProblem');
          // The sheet answered properly: this link is confirmed (see app.js, applyLink).
          var q = s.kv.get('link');
          q.onsuccess = function () {
            var cur = q.result;
            if (cur && cur.url === link.url && cur.code === link.code && !cur.confirmed) { cur.confirmed = true; s.kv.put(cur, 'link'); }
          };
          batch.forEach(function (x) {
            var r = byKey[x.payload.id + ':' + x.payload.version];
            if (!r) return;                                   // no answer for it: stays waiting
            if (r.result === 'added' || r.result === 'already had') {
              s.outbox.delete(x.key);
              settled++;
            } else if (r.result === 'refused') {
              settled++;
              x.status = 'refused';
              x.why = String(r.why || '');
              x.refusedAt = stampNow();
              s.outbox.put(x);
            }                                                 // 'failed': stays waiting
          });
        }).then(function () {
          tell();
          // More waiting than fitted in this send: carry on, but only while each send settles something.
          if (waiting.length > batch.length && settled > 0 && rounds < 50) return sendRound(rounds + 1);
          return { sent: batch.length };
        });
      }, function (err) {
        clearTimeout(timer);
        throw err;
      });
    });
  }

  // The sheet said "not allowed" to a send or check made with this link. The code
  // problem is kept only if the link stored now is still that one, checked in the
  // same storage step: a late answer to a send made with an old code, after the
  // phone was linked again, changes nothing (015; Agent M, increment 014,
  // finding 7; Q39).
  function codeProblemFor(link) {
    return run(['kv'], 'readwrite', function (s) {
      var q = s.kv.get('link');
      q.onsuccess = function () {
        var cur = q.result;
        if (cur && cur.url === link.url && cur.code === link.code) s.kv.put({ when: stampNow() }, 'codeProblem');
      };
    });
  }

  // Counts for the lines at the top of the screen. Save and Undo of the same
  // entry count as one entry.
  function counts() {
    return getAll('outbox').then(function (box) {
      var waiting = {}, refused = {}, usualRefused = {}, any = 0;
      box.forEach(function (x) {
        var id = x.payload && x.payload.id;
        var isLog = !!x.payload && x.payload.kind === 'log';
        if (x.status === 'refused') { if (isLog) refused[id] = true; else usualRefused[id] = true; }
        else { any++; if (isLog) waiting[id] = true; }                     // usual ones are sent quietly
      });
      return { waiting: Object.keys(waiting).length, refused: Object.keys(refused).length,
               usualRefused: Object.keys(usualRefused).length, anyWaiting: any };
    });
  }

  return { db: db, run: run, get: get, getAll: getAll, put: put, del: del,
           sendWaiting: sendWaiting, counts: counts, stampNow: stampNow, tell: tell, codeProblemFor: codeProblemFor };
})();
