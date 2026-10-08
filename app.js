'use strict';
/*
 * Day log page. Increment 003 (2026-10-07): the Intraday screen, showing only
 * the parts that work (D47), the green bar with Undo (D48), and the lines about
 * entries waiting to send (D24) or turned away by the sheet (D45).
 * 004: Shake, Medicine, Coffee, Other. 005: Workout with Start and End.
 * 007 (2026-10-07): the Morning and Evening screens (R39 to R41, R44, mockup
 * round 2) with times typed then AM or PM (D75), and the question about a
 * walk or workout still running (R69, R80, D76).
 * 009 (2026-10-07): Liquids in place of Coffee, with Coffee, Water and Something
 * else, any that apply (R85, D82, D84); Food on the main row (R84, D81); a new
 * version of a usual one (R51 as changed, D83).
 * 012 (2026-10-08): the usual ones are copied once into the phone's own storage
 * and used from there (D93, D98).
 * 013 (2026-10-08): the page's files carry no usual ones; it uses only the ones
 * stored on the phone, checked more strictly, and says so when there are none
 * (D93, D98, D102). Uses DL from send.js.
 */
var PAGE_VERSION = '013-2';
var SCREENS = ['Morning', 'Intraday', 'Evening'];
var SCORE_ROWS = ['Mind', 'Body', 'Balance'];
var MORNING_SCORES = [{ label: 'Quality', key: 'Sleep quality' }, { label: 'Amount', key: 'Sleep amount' }];
var EVENING_SCORES = [{ label: 'Mind', key: 'Whole day Mind' }, { label: 'Body', key: 'Whole day Body' },
                      { label: 'Balance', key: 'Whole day Balance' }];
var MORNING_TIMES = ['Went to sleep', 'Woke up', 'Got out of bed'];   // R44
var EVENING_TIMES = ['Got in bed'];                                    // R40
var SCORE_VALUES = [-3, -2, -1, 0, 1, 2, 3];
var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var DAY_STARTS_AT = 5;            // before 05:00 an entry belongs to the day before (R75)
var COMMENT_MAX = 20000;          // the sheet takes up to 40,000 characters in a cell
var WHY_MAX = 2000;               // and up to 45,000 for the whole copy for the app
var OTHER_MAX = 2000;
var WHAT_MAX = 2000;              // "Something else" for Shake, Medicine or Liquids
var FOOD_MAX = 2000;              // the Food box
var WORDS_MAX = 20000;            // Sleep in your own words
var END_NOT_KNOWN = 'not known';  // Workout ended, after "Don't know" (D76)
var LONG_HOURS = 12;              // a typed end making a walk longer than this is asked about again

// The usual ones (R50, R51) are kept in the phone's own storage ("usuals" in
// kv), where page 012 put them, and used from there (D93, D98). From 013 the
// page's files carry none. Changing them comes with the My usual ones screen
// (step 8); until then a phone with none stored offers only Something else.
var USUAL_KINDS = ['Shake', 'Medicine'];
var USUAL_MAX = 2000;             // a usual one's contents: no longer than a Something else line (WHAT_MAX)
var USUAL_NAME_MAX = 200;
var USUAL_ID = /^[A-Za-z0-9_-]{8,64}$/;   // the sheet's rule for IDs (program 001-5)
var USUAL_VERSION_MAX = 1000000;          // and for versions
// Characters that show as nothing: a name made only of them is blank.
var INVISIBLE = /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF]/g;
// The ones in use: none until storage has been read, then the stored ones.
var USUALS = { Shake: [], Medicine: [] };
var SOMETHING_ELSE = 'Something else';
// Liquids (R85): each pick has its own column; Something else also keeps his words.
var LIQUIDS = [{ name: 'Coffee', key: 'coffee', column: 'Coffee' },
               { name: 'Water', key: 'water', column: 'Water' },
               { name: SOMETHING_ELSE, key: 'other', column: 'Other liquid' }];
var WORKOUT_KINDS = ['Walk', 'Weights or resistance', 'Stretches', 'Bike, rower or similar'];   // R52

var state = {
  screen: 'Intraday',             // the page always opens on Intraday (R74)
  draft: null,                    // the half-filled Intraday screen
  mdraft: null,                   // the half-filled Morning screen
  edraft: null,                   // the half-filled Evening screen
  lastSaved: null,
  link: null,
  test: false,
  interacted: false,
  reloadWhenHidden: false,
  linkNote: '',
  loaded: false,
  saving: false,
  done: { Morning: false, Evening: false },
  doneDay: null,
  tpadFor: null,
  usualsFrom: null,               // once read: 'phone', 'none', 'unreadable' or 'not read' (013)
  reading: true                   // the opening read of the phone's storage has not finished
};

// ------------------------------------------------------------------ dates and times

function p2(n) { return (n < 10 ? '0' : '') + n; }
function dateStr(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function timeStr(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()); }
function offsetStr(d) {
  var o = -d.getTimezoneOffset();
  var sign = o < 0 ? '-' : '+';
  o = Math.abs(o);
  return sign + p2(Math.floor(o / 60)) + ':' + p2(o % 60);
}
function parts(s) { return { y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)), d: Number(s.slice(8, 10)) }; }
function dayBefore(s) { var p = parts(s); return dateStr(new Date(p.y, p.m - 1, p.d - 1, 12)); }
function weekday(s) { var p = parts(s); return WEEKDAYS[new Date(p.y, p.m - 1, p.d, 12).getDay()]; }
function momentOf(date, time) {
  var p = parts(date);
  return new Date(p.y, p.m - 1, p.d, Number(time.slice(0, 2)), Number(time.slice(3, 5)));
}
// On the screen: MM-DD-YYYY and h:mm AM/PM (R83). The sheet keeps YYYY-MM-DD and HH:MM (D54).
function usDate(s) { return s.slice(5, 7) + '-' + s.slice(8, 10) + '-' + s.slice(0, 4); }
function ampm(time) {
  var H = Number(time.slice(0, 2));
  return (H % 12 || 12) + ':' + time.slice(3, 5) + ' ' + (H < 12 ? 'AM' : 'PM');
}
function logDayOf(date, time) { return Number(time.slice(0, 2)) < DAY_STARTS_AT ? dayBefore(date) : date; }
function currentLogDay() { var n = new Date(); return logDayOf(dateStr(n), timeStr(n)); }

// Edit (R65 as changed) and the Morning and Evening times (D75): the time as he
// would say it, then AM or PM: 2 or 02 is 2:00, 205 is 2:05, 1130 is 11:30;
// hours 1 to 12, minutes 00 to 59.
function typedTime(digits, half) {
  if (!/^\d{1,4}$/.test(digits)) return null;
  var h, m;
  if (digits.length <= 2) { h = Number(digits); m = 0; }
  else { h = Number(digits.slice(0, digits.length - 2)); m = Number(digits.slice(-2)); }
  if (h < 1 || h > 12 || m > 59) return null;
  var H = (h % 12) + (half === 'PM' ? 12 : 0);
  return p2(H) + p2(m);
}

// Then: four numbers, 24-hour. The most recent moment with that clock time,
// at or before now (S1): at 00:30, 2345 is 23:45 the evening before. Found by
// walking back a minute at a time, so the hour that repeats when the clocks
// go back gives the later one, and a time the clocks skipped that day gives
// the day before.
function editedTime(four, now) {
  if (!/^\d{4}$/.test(four)) return null;
  var H = Number(four.slice(0, 2)), M = Number(four.slice(2, 4));
  if (H > 23 || M > 59) return null;
  var time = p2(H) + ':' + p2(M);
  var t = new Date(now.getTime());
  t.setSeconds(0, 0);
  for (var k = 0; k <= 50 * 60; k++) {
    if (timeStr(t) === time) return { date: dateStr(t), time: time, at: t.getTime() };
    t = new Date(t.getTime() - 60000);
  }
  return null;
}

// The end of a running walk or workout typed in the End box (R69, R80): the
// first moment with that clock time at or after the minute it started. It has
// to be no later than now; otherwise the typed time cannot be right.
function endMoment(run, hhmm, now) {
  var t = new Date(run.startAt);
  t.setSeconds(0, 0);
  for (var k = 0; k <= 26 * 60; k++) {
    if (timeStr(t) === hhmm) break;
    t = new Date(t.getTime() + 60000);
  }
  if (timeStr(t) !== hhmm) return { ok: false, msg: 'Not a time. Type it like 1130 or 645, then tap AM or PM.' };
  if (t.getTime() > now.getTime()) {
    return { ok: false, msg: 'An end at ' + ampm(hhmm) + ' doesn’t fit: the ' + (run.kind === 'Walk' ? 'walk' : 'workout') +
             ' started ' + whenOf(run.startDate, run.startTime, dateStr(now)) + ', and it’s now ' + ampm(timeStr(now)) +
             '. Check the time and AM or PM.' };
  }
  return { ok: true, at: t.getTime(), date: dateStr(t), time: hhmm };
}

// ------------------------------------------------------------------ the half-filled screens

function emptyDraft() {
  return { fixed: null, scores: { Mind: null, Body: null, Balance: null },
           comments: '', notable: false, why: '', personal: false,
           Shake: null, Medicine: null, liquids: null, liqWhat: '', food: { on: false, text: '' }, other: { on: false, text: '' },
           workout: null, endTick: false, endAns: null };
}
function emptyMorning() {
  return { fixed: null, times: { 'Went to sleep': null, 'Woke up': null, 'Got out of bed': null },
           scores: { 'Sleep quality': null, 'Sleep amount': null }, phone: null, words: '' };
}
function emptyEvening() {
  return { fixed: null, scores: { 'Whole day Mind': null, 'Whole day Body': null, 'Whole day Balance': null },
           times: { 'Got in bed': null }, notable: false, why: '', endAns: null };
}
// A screen kept by an earlier page version gets the new parts, empty.
function fillDraft(d) {
  var e = emptyDraft();
  Object.keys(e).forEach(function (k) { if (d[k] === undefined) d[k] = e[k]; });
  if (!d.other || typeof d.other !== 'object') d.other = { on: false, text: '' };
  if (!d.food || typeof d.food !== 'object') d.food = { on: false, text: '' };
  // A screen kept by page 007-3 or earlier with Coffee tapped: Coffee is picked under Liquids.
  if (d.coffee === true && !d.liquids) d.liquids = { coffee: true, water: false, other: false, what: '' };
  delete d.coffee;
  if (d.liquids && typeof d.liquids !== 'object') d.liquids = null;
  return d;
}
function liquidsPicked(dr) {
  return !!dr.liquids && (dr.liquids.coffee || dr.liquids.water || dr.liquids.other);
}
function fillOther(d, empty) {
  if (!d || typeof d !== 'object' || !d.scores || !d.times) return empty;
  Object.keys(empty).forEach(function (k) { if (d[k] === undefined) d[k] = empty[k]; });
  Object.keys(empty.scores).forEach(function (k) { if (d.scores[k] === undefined) d.scores[k] = null; });
  Object.keys(empty.times).forEach(function (k) { if (d.times[k] === undefined) d.times[k] = null; });
  return d;
}

function draftOf(screen) { return screen === 'Morning' ? state.mdraft : (screen === 'Evening' ? state.edraft : state.draft); }
function setDraftOf(screen, d) {
  if (screen === 'Morning') state.mdraft = d; else if (screen === 'Evening') state.edraft = d; else state.draft = d;
}
function emptyOf(screen) { return screen === 'Morning' ? emptyMorning() : (screen === 'Evening' ? emptyEvening() : emptyDraft()); }
function draftKey(screen) { return screen === 'Intraday' ? 'draft' : 'draft-' + screen; }
function cur() { return draftOf(state.screen); }

function hasText(s) { return typeof s === 'string' && /\S/.test(s); }
function anyValue(o) { return Object.keys(o).some(function (k) { return o[k] !== null; }); }

// Anything on a screen at all (used to forget a time fixed by a tap, and to put
// an entry back on the screen if the phone's storage refuses it).
function hasAnythingOf(screen, dr) {
  if (screen === 'Morning') return anyValue(dr.times) || anyValue(dr.scores) || !!dr.phone || dr.words !== '';
  if (screen === 'Evening') return anyValue(dr.scores) || anyValue(dr.times) || dr.notable || dr.why !== '' || !!dr.endAns;
  return hasContent(dr) || dr.personal || dr.comments !== '' || (dr.notable && dr.why !== '') || dr.other.on ||
         !!dr.liquids || dr.food.on ||
         !!dr.workout || !!dr.endTick || !!dr.endAns;
}
function hasAnything(dr) { return hasAnythingOf('Intraday', dr); }

// What makes a new entry on each screen (the End of a workout is a version of its own row).
function contentOf(screen, dr) {
  if (screen === 'Morning') return anyValue(dr.times) || anyValue(dr.scores) || !!dr.phone || hasText(dr.words);
  if (screen === 'Evening') return anyValue(dr.scores) || anyValue(dr.times) || dr.notable;
  return hasContent(dr, true);
}

// A screen emptied again forgets the time fixed by a tap (not a time set with Edit).
function settleOf(screen, dr) {
  if (dr && dr.fixed && !dr.edited && !hasAnythingOf(screen, dr)) dr.fixed = null;
}
function settle() { settleOf(state.screen, cur()); }
// Personal alone is not something to save; Notable alone is (S2).
// withoutEnd: what makes a new entry (the End of a workout is a version of its own row).
function hasContent(dr, withoutEnd) {
  return SCORE_ROWS.some(function (k) { return dr.scores[k] !== null; }) || hasText(dr.comments) || dr.notable ||
         !!dr.Shake || !!dr.Medicine || liquidsPicked(dr) || dr.food.on || (dr.other.on && hasText(dr.other.text)) ||
         !!(dr.workout && dr.workout.kind) ||
         (!withoutEnd && (!!(dr.endTick && state.running) || endAnswered(dr)));
}

// The entry's time is fixed at his first tap on that screen (G2).
function touch() {
  state.interacted = true;
  var dr = cur();
  if (!dr.fixed) {
    var now = new Date();
    dr.fixed = { date: dateStr(now), time: timeStr(now), at: now.getTime() };
    renderWhen();
  }
}

var draftTimer = null;
function storeDraft(now) {
  if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
  if (!state.loaded) return Promise.resolve();      // never overwrite a stored screen not yet read back
  var write = function () {
    draftTimer = null;
    var d = clone(state.draft), m = clone(state.mdraft), e = clone(state.edraft);
    return DL.run(['kv'], 'readwrite', function (s) {
      s.kv.put(d, 'draft');
      s.kv.put(m, 'draft-Morning');
      s.kv.put(e, 'draft-Evening');
    }).catch(function () { /* shown at Save */ });
  };
  if (now) return write();
  draftTimer = setTimeout(write, 300);
  return Promise.resolve();
}

// ------------------------------------------------------------------ a walk or workout still running

// The workout running now, if any (increment 005): { id, version, test, kind,
// fields (its current version's fields), startAt, startDate, startTime }.
function endLabel() { return state.running && state.running.kind === 'Walk' ? 'End walk' : 'End workout'; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function whenOf(date, time, sameAsDate) {
  return (sameAsDate && date !== sameAsDate ? weekday(date) + ' ' + usDate(date) + ' ' : '') + ampm(time);
}
// Begun on a day that is now over: from 05:00 on the calendar day after it
// started (R75, R80). A walk begun between midnight and 05:00 is not asked
// about at 05:00 the same morning, so never mid-walk (Agent Q, F4).
function isStale() {
  var r = state.running;
  if (!r) return false;
  var s = new Date(r.startAt);
  var t = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1, DAY_STARTS_AT, 0, 0, 0);
  return Date.now() >= t.getTime();
}
// Where the End box shows: the Evening screen while anything runs (R69); Intraday
// once the day it began on is over (R80).
function endBoxOn(screen) {
  if (!state.running) return false;
  return screen === 'Evening' || (screen === 'Intraday' && isStale());
}
function endAnswered(dr) {
  var r = state.running;
  return !!(r && dr.endAns && dr.endAns.forId === r.id && (dr.endAns.unknown || dr.endAns.time));
}
// Answers and ticks about a workout that is no longer running are dropped,
// and a screen left empty by that forgets the time fixed by the tap (Agent Q,
// F1). A workout picked on the screen is dropped while another is running,
// which can only happen after Undo brings one back (F2).
function tidyEnds() {
  var r = state.running, stale = isStale();
  var e = state.edraft, d = state.draft;
  if (e && e.endAns && (!r || e.endAns.forId !== r.id)) { e.endAns = null; settleOf('Evening', e); }
  if (d) {
    var was = hasAnythingOf('Intraday', d);
    if (d.endAns && (!r || d.endAns.forId !== r.id || !stale)) d.endAns = null;
    if (d.endTick && !r) d.endTick = false;
    if (d.workout && r) d.workout = null;
    if (was) settleOf('Intraday', d);
  }
}

// ------------------------------------------------------------------ what a Save sends

function baseFields(dr, screen) {
  var f = {};
  f['Log day'] = logDayOf(dr.fixed.date, dr.fixed.time);
  f['Time'] = dr.fixed.time;
  f['Screen'] = screen;
  return f;
}
function tailFields(f, dr, savedAt) {
  f['Calendar date'] = dr.fixed.date;
  f['UTC offset'] = offsetStr(dr.fixed.at ? new Date(dr.fixed.at) : momentOf(dr.fixed.date, dr.fixed.time));
  f['Saved at'] = stampOf(savedAt);
  return f;
}

function fieldsFor(dr, savedAt) {
  var f = baseFields(dr, 'Intraday');
  SCORE_ROWS.forEach(function (k) { if (dr.scores[k] !== null) f[k] = dr.scores[k]; });
  if (hasText(dr.comments)) f['Comments'] = dr.comments;
  if (dr.notable) {
    f['Notable'] = 'Yes';
    if (hasText(dr.why)) f['Notable why'] = dr.why;
  }
  if (dr.personal) f['Personal'] = 'Yes';
  ['Shake', 'Medicine'].forEach(function (kind) {
    var pick = dr[kind];
    if (!pick) return;
    var usual = USUALS[kind].filter(function (u) { return u.name === pick.pick; })[0];
    if (usual) {
      f[kind] = usual.name;
      f[kind + ' contents'] = usual.contents;
    } else {
      f[kind] = SOMETHING_ELSE;
      if (hasText(pick.what)) f[kind + ' contents'] = pick.what;
    }
  });
  if (dr.workout && dr.workout.kind) f['Workout'] = dr.workout.kind;
  if (dr.liquids) {
    LIQUIDS.forEach(function (l) { if (dr.liquids[l.key]) f[l.column] = 'Yes'; });
    if (dr.liquids.other && hasText(dr.liquids.what)) f['Other liquid, what'] = dr.liquids.what;
  }
  if (dr.food.on) {
    f['Food or snack'] = 'Yes';
    if (hasText(dr.food.text)) f['Food or snack, what'] = dr.food.text;
  }
  if (dr.other.on && hasText(dr.other.text)) f['Other'] = dr.other.text;
  return tailFields(f, dr, savedAt);
}

function fieldsMorning(dr, savedAt) {
  var f = baseFields(dr, 'Morning');
  MORNING_TIMES.forEach(function (k) { if (dr.times[k]) f[k] = dr.times[k]; });
  MORNING_SCORES.forEach(function (s) { if (dr.scores[s.key] !== null) f[s.key] = dr.scores[s.key]; });
  if (dr.phone) f['Phone before bed'] = dr.phone;
  if (hasText(dr.words)) f['Sleep in own words'] = dr.words;
  return tailFields(f, dr, savedAt);
}

function fieldsEvening(dr, savedAt) {
  var f = baseFields(dr, 'Evening');
  EVENING_SCORES.forEach(function (s) { if (dr.scores[s.key] !== null) f[s.key] = dr.scores[s.key]; });
  EVENING_TIMES.forEach(function (k) { if (dr.times[k]) f[k] = dr.times[k]; });
  if (dr.notable) {
    f['Day notable'] = 'Yes';
    if (hasText(dr.why)) f['Day notable why'] = dr.why;
  }
  return tailFields(f, dr, savedAt);
}

function fieldsOf(screen, dr, savedAt) {
  if (screen === 'Morning') return fieldsMorning(dr, savedAt);
  if (screen === 'Evening') return fieldsEvening(dr, savedAt);
  return fieldsFor(dr, savedAt);
}

function stampOf(d) { return dateStr(d) + ' ' + timeStr(d) + ':' + p2(d.getSeconds()) + ' ' + offsetStr(d); }

function newId() {
  var b = new Uint8Array(16);
  crypto.getRandomValues(b);
  var s = btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return 'e' + s;
}

var seqCounter = 0;
function nextSeq() { seqCounter = (seqCounter + 1) % 1000; return Date.now() * 1000 + seqCounter; }

// The green bar and its Undo last until the next Save, and at most until the
// day he saved in has ended (05:00), so Undo is only for a Save just made (S3, R76).
function nextDayStart(d) {
  var t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), DAY_STARTS_AT, 0, 0, 0);
  if (t.getTime() <= d.getTime()) t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, DAY_STARTS_AT, 0, 0, 0);
  return t;
}

function signed(n) { return n > 0 ? '+' + n : (n < 0 ? '−' + Math.abs(n) : '0'); }

function scoreBits(f, rows, bits) {
  var scored = rows.filter(function (r) { return typeof f[r.key] === 'number'; });
  scored.forEach(function (r) { bits.push(r.name + ' ' + signed(f[r.key])); });
  if (scored.length) rows.forEach(function (r) { if (scored.indexOf(r) < 0) bits.push(r.name + ' not scored'); });
}

function summary(f) {
  var bits = [];
  if (f['Screen'] === 'Morning') {
    MORNING_TIMES.forEach(function (k) { if (f[k] !== undefined) bits.push(k + ' ' + ampm(f[k])); });
    scoreBits(f, MORNING_SCORES.map(function (s) { return { key: s.key, name: s.key }; }), bits);
    if (f['Phone before bed'] !== undefined) bits.push('phone before bed ' + f['Phone before bed']);
    if (f['Sleep in own words'] !== undefined) bits.push('sleep words');
    return 'Morning: ' + bits.join(', ');
  }
  if (f['Screen'] === 'Evening') {
    scoreBits(f, EVENING_SCORES.map(function (s) { return { key: s.key, name: s.label }; }), bits);
    EVENING_TIMES.forEach(function (k) { if (f[k] !== undefined) bits.push(k + ' ' + ampm(f[k])); });
    if (f['Day notable'] === 'Yes') bits.push('day notable');
    return 'Evening: ' + bits.join(', ');
  }
  if (f['Shake'] !== undefined) bits.push('Shake · ' + f['Shake']);
  if (f['Workout'] !== undefined && f['Workout ended'] === undefined) bits.push(f['Workout'] + ' started');
  if (f['Medicine'] !== undefined) bits.push('Medicine · ' + f['Medicine']);
  var liq = LIQUIDS.filter(function (l) { return f[l.column] === 'Yes'; }).map(function (l) { return l.name; });
  // "Coffee, Water and Something else", so Food and Other after it do not read as drinks (Agent C, W1).
  if (liq.length) bits.push('Liquids · ' + (liq.length === 1 ? liq[0] : liq.slice(0, -1).join(', ') + ' and ' + liq[liq.length - 1]));
  if (f['Food or snack'] === 'Yes') bits.push('Food');
  if (f['Other'] !== undefined) bits.push('Other');
  var scored = SCORE_ROWS.filter(function (k) { return typeof f[k] === 'number'; });
  scored.forEach(function (k) { bits.push(k + ' ' + signed(f[k])); });
  if (scored.length) SCORE_ROWS.forEach(function (k) { if (scored.indexOf(k) < 0) bits.push(k + ' not scored'); });
  if (f['Comments'] !== undefined) bits.push('comment');
  if (f['Notable'] === 'Yes') bits.push('notable');
  if (f['Personal'] === 'Yes') bits.push('personal');
  return bits.join(', ');
}

// "usuals" in the copy for the app says where the usual ones in use came from
// (012): "phone" shows the phone holds them in its own storage (D98).
function payloadFor(entry) {
  return { kind: 'log', test: entry.test, id: entry.id, version: entry.version, state: entry.state,
           fields: entry.fields, app: { page: PAGE_VERSION, screen: (entry.fields && entry.fields['Screen']) || 'Intraday',
                                        usuals: state.usualsFrom || 'not read', fields: entry.fields } };
}

// The screen is cleared at once when Save is tapped, so anything typed next
// belongs to the next entry. If writing to the phone fails, the entry is put
// back on the screen (when the screen is still empty) with a message.
// One Save can write two rows: anything on the screen is a new entry, and
// ending a workout is a new version of the workout's own row (R67, R69).
var lastSaveTap = 0;
function save() {
  var screen = state.screen;
  if (state.reading) return;                        // the opening read is not finished (013; a few milliseconds)
  if (padShowing('tpad') && el('tpadinput').value.trim() !== '') {
    el('tpadmsg').textContent = 'Tap AM or PM to set this time first, or Cancel.';
    el('tpadmsg').className = 'padmsg bad';
    try { el('tpad').scrollIntoView({ block: 'center' }); } catch (x) { /* ignore */ }
    return;
  }
  if (padShowing('pad') && el('padinput').value.trim() !== '') {
    el('padmsg').textContent = 'Tap AM or PM to change the time first, or Cancel.';
    el('padmsg').className = 'padmsg bad';
    try { el('pad').scrollIntoView({ block: 'center' }); } catch (x) { /* ignore */ }
    return;
  }
  tidyEnds();
  var dr = cur();
  var run = state.running;
  if (screen === 'Intraday' && dr.workout && !dr.workout.kind) {
    showNote('Pick what kind of workout it is, or tap Workout again to take it off.');
    return;
  }
  if (screen === 'Intraday' && dr.liquids && !liquidsPicked(dr)) {
    showNote('Pick Coffee, Water or Something else, or tap Liquids again to take it off.');
    return;
  }
  // How this Save ends the running walk or workout, if it does.
  var endHow = null;
  if (endBoxOn(screen) && endAnswered(dr)) {
    if (dr.endAns.unknown) endHow = { unknown: true };
    else {
      var em = endMoment(run, dr.endAns.time, new Date());
      if (!em.ok) { showError(em.msg); return; }
      endHow = { time: em.time, at: em.at, date: em.date };
    }
  } else if (screen === 'Intraday' && dr.endTick && run) {
    endHow = { atTop: true };
  }
  var other = contentOf(screen, dr);
  if (!endHow && !other) {
    if (Date.now() - lastSaveTap > 1500) showNothing();     // not after a double tap
    return;
  }
  if (!dr.fixed) touch();
  if (endHow && endHow.atTop) {
    var endAt = dr.fixed.at || momentOf(dr.fixed.date, dr.fixed.time).getTime();
    if (endAt < run.startAt) {
      showError('The end, ' + whenOf(dr.fixed.date, dr.fixed.time, run.startDate) + ', is before the ' +
                (run.kind === 'Walk' ? 'walk' : 'workout') + ' started (' + ampm(run.startTime) + '). Change the time with Edit.');
      return;
    }
  }
  lastSaveTap = Date.now();
  var now = new Date();
  var entry = null, out = null, fields = null, endV = null, endOut = null, newRunning = run;
  var bits = [];
  if (other) {
    var id = newId();
    fields = fieldsOf(screen, dr, now);
    entry = { key: id + ':1', id: id, version: 1, state: 'current', test: state.test, fields: fields, seq: nextSeq() };
    out = { key: entry.key, seq: entry.seq, status: 'waiting', payload: payloadFor(entry) };
    bits.push(summary(fields));
    if (screen === 'Intraday' && dr.workout && dr.workout.kind && (!run || endHow)) {
      newRunning = { id: id, version: 1, test: state.test, kind: dr.workout.kind, fields: fields,
                     startAt: dr.fixed.at || momentOf(dr.fixed.date, dr.fixed.time).getTime(),
                     startDate: dr.fixed.date, startTime: dr.fixed.time };
    }
  }
  if (endHow) {
    var ef = clone(run.fields);
    ef['Workout ended'] = endHow.unknown ? END_NOT_KNOWN : (endHow.atTop ? dr.fixed.time : endHow.time);
    ef['Saved at'] = stampOf(now);
    endV = { key: run.id + ':' + (run.version + 1), id: run.id, version: run.version + 1, state: 'current', test: run.test, fields: ef, seq: nextSeq() };
    endOut = { key: endV.key, seq: endV.seq, status: 'waiting', payload: payloadFor(endV) };
    if (endHow.atTop) {
      bits.push(run.kind + ' ended (' + whenOf(run.startDate, run.startTime, dr.fixed.date) + ' to ' + ampm(dr.fixed.time) + ')');
    } else if (endHow.unknown) {
      bits.push(run.kind + ' from ' + whenOf(run.startDate, run.startTime, dateStr(now)) + ' ended, end time not known');
    } else {
      bits.push(run.kind + ' ended (' + whenOf(run.startDate, run.startTime, dateStr(now)) + ' to ' +
                whenOf(endHow.date, endHow.time, run.startDate) + ')');
    }
    newRunning = null;
  }
  var bar = { id: entry ? entry.id : null, date: dr.fixed.date, time: dr.fixed.time, summary: bits.join('; '), undone: false, test: state.test,
              screen: screen, savedDate: dateStr(now), savedTime: timeStr(now), until: nextDayStart(now).getTime(),
              started: !!(entry && newRunning && newRunning.id === entry.id),
              ended: endHow ? { id: run.id, version: endV.version, before: run } : null };
  if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
  var saved = dr, runBefore = run;
  setDraftOf(screen, emptyOf(screen));
  state.running = newRunning;
  closeTpad();
  render();
  DL.run(['entries', 'outbox', 'kv'], 'readwrite', function (s) {
    if (entry) { s.entries.put(entry); s.outbox.put(out); }
    if (endV) { s.entries.put(endV); s.outbox.put(endOut); }
    if (newRunning) s.kv.put(newRunning, 'running'); else s.kv.delete('running');
    s.kv.put(bar, 'lastSaved');
    s.kv.delete(draftKey(screen));
  }).then(function () {
    state.lastSaved = bar;
    el('error').hidden = true;
    el('nothing').hidden = true;
    tidyEnds();
    storeDraft(true);                 // anything typed meanwhile is kept for the next entry
    render();
    kick();
    window.scrollTo(0, 0);
  }, function () {
    state.running = runBefore;
    var nowDraft = draftOf(screen);
    if (!hasAnythingOf(screen, nowDraft)) setDraftOf(screen, saved);
    storeDraft(true);
    render();
    var lost = '';
    if (draftOf(screen) !== saved) {
      var words = fields && (fields['Comments'] !== undefined ? fields['Comments'] : fields['Sleep in own words']);
      lost = 'The entry of ' + ampm(saved.fixed.time) + ' was not saved' +
             (words !== undefined && words !== null ? '; its words were: “' + String(words).slice(0, 300) + (String(words).length > 300 ? '…' : '') + '”' : '') +
             (bits.length ? ' (' + bits.join('; ') + ')' : '') + '.';
    }
    showError('Could not save on this phone: its storage refused. ' +
              (draftOf(screen) === saved ? 'The entry is back on the screen; try Save again.' : lost));
  });
}

// Undo: a new entry made by the Save is marked undone; a workout ended by the
// Save runs again, as a newer version restoring the one before (increment 001
// CARD, C9); a workout started by the Save is undone with its entry.
function undo() {
  var bar = state.lastSaved;
  if (bar && bar.until && Date.now() >= bar.until) { render(); return; }
  if (!bar || bar.undone || state.saving) return;
  state.saving = true;
  var stamp = stampOf(new Date());
  var getV1 = bar.id ? DL.get('entries', bar.id + ':1') : Promise.resolve(null);
  getV1.then(function (v1) {
    if (bar.id && !v1) throw new Error('the saved entry was not found on this phone');
    var puts = [];
    if (v1) {
      var f1 = clone(v1.fields);
      f1['Saved at'] = stamp;
      puts.push({ key: bar.id + ':2', id: bar.id, version: 2, state: 'undone', test: v1.test, fields: f1, seq: nextSeq() });
    }
    var restored = null;
    if (bar.ended) {
      var b = bar.ended.before;
      var rf = clone(b.fields);
      rf['Saved at'] = stamp;
      var ver = bar.ended.version + 1;
      puts.push({ key: b.id + ':' + ver, id: b.id, version: ver, state: 'current', test: b.test, fields: rf, seq: nextSeq() });
      restored = clone(b);
      restored.version = ver;
      restored.fields = rf;
    }
    var newBar = clone(bar);
    newBar.undone = true;
    return DL.run(['entries', 'outbox', 'kv'], 'readwrite', function (s) {
      puts.forEach(function (v) {
        s.entries.put(v);
        s.outbox.put({ key: v.key, seq: v.seq, status: 'waiting', payload: payloadFor(v) });
      });
      if (restored) s.kv.put(restored, 'running');
      else if (bar.started) s.kv.delete('running');
      s.kv.put(newBar, 'lastSaved');
    }).then(function () {
      state.lastSaved = newBar;
      if (restored) state.running = restored;
      else if (bar.started) state.running = null;
    });
  }).then(function () {
    state.saving = false;
    state.draft.endTick = false;
    tidyEnds();
    render();
    kick();
  }, function () {
    state.saving = false;
    showError('Could not undo: this phone’s storage refused. Try Undo again.');
  });
}

// ------------------------------------------------------------------ the check marks on Morning and Evening (G1)

// Morning or Evening is done for the day when an entry from it, for today's
// log day, is on this phone and its newest version is not undone.
var doneBusy = false;
function refreshDone() {
  if (doneBusy) return Promise.resolve();
  doneBusy = true;
  var today = currentLogDay();
  return DL.getAll('entries').then(function (all) {
    var newest = {};
    all.forEach(function (v) { if (!newest[v.id] || v.version > newest[v.id].version) newest[v.id] = v; });
    var done = { Morning: false, Evening: false };
    Object.keys(newest).forEach(function (id) {
      var v = newest[id], f = v.fields || {};
      if (v.state !== 'undone' && (f['Screen'] === 'Morning' || f['Screen'] === 'Evening') &&
          f['Log day'] === today && !!v.test === !!state.test) done[f['Screen']] = true;
    });
    state.done = done;
    state.doneDay = today;
    doneBusy = false;
    renderHeads();
  }, function () { doneBusy = false; });
}

// ------------------------------------------------------------------ the usual ones in the phone's storage (012)

// A stored value is used only if every usual one in it has an ID and a version
// the sheet accepts (IDs 8 to 64 letters, digits, - or _, used once across all
// usual ones; versions whole numbers from 1 to 1,000,000), a name that is not
// blank, not Something else and not used twice in its kind (ignoring case, spaces
// and characters that show as nothing), at most 200 characters, and contents no
// longer than a Something else line, so an entry using it fits the sheet (Agent K,
// increment 012, W3; Agent L, increment 013, F1, W1 to W3). A list with a gap
// fails. Anything else is left as it is and not used.
function usualsReadable(u) {
  if (!u || typeof u !== 'object' || Array.isArray(u)) return false;
  var ids = {};
  return USUAL_KINDS.every(function (k) {
    var list = u[k], names = {};
    if (!Array.isArray(list)) return false;
    for (var i = 0; i < list.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(list, i)) return false;
      var x = list[i];
      if (!x || typeof x !== 'object') return false;
      if (typeof x.id !== 'string' || !USUAL_ID.test(x.id) || ids['i:' + x.id]) return false;
      if (typeof x.version !== 'number' || !isFinite(x.version) || Math.floor(x.version) !== x.version ||
          x.version < 1 || x.version > USUAL_VERSION_MAX) return false;
      if (typeof x.name !== 'string' || x.name.length > USUAL_NAME_MAX) return false;
      var key = x.name.replace(INVISIBLE, '').trim().toLowerCase();
      if (key === '' || key === SOMETHING_ELSE.toLowerCase() || names['n:' + key]) return false;
      if (typeof x.contents !== 'string' || x.contents.length > USUAL_MAX) return false;
      ids['i:' + x.id] = true;
      names['n:' + key] = true;
    }
    return true;
  });
}

// The usual ones in use are the ones stored on the phone (013: the page carries
// none, and nothing is ever written under "usuals" here). read is { ok, value }
// from the opening read.
function loadUsuals(read) {
  USUALS = { Shake: [], Medicine: [] };
  if (!read || !read.ok) { state.usualsFrom = 'not read'; return; }
  var stored = read.value;
  if (stored === undefined) { state.usualsFrom = 'none'; return; }
  if (!usualsReadable(stored)) { state.usualsFrom = 'unreadable'; return; }
  USUALS = { Shake: clone(stored.Shake), Medicine: clone(stored.Medicine) };
  state.usualsFrom = (USUALS.Shake.length || USUALS.Medicine.length) ? 'phone' : 'none';
}

// A half-filled screen kept with a usual one picked that is not in use on this
// phone shows Something else, with the usual one's name in its box when the box
// is empty, so the pick is not saved as a blank (Agent K, increment 012, W2).
// The stored screen changes only when he next touches it.
function settleUsualPicks(dr) {
  USUAL_KINDS.forEach(function (kind) {
    var pick = dr && dr[kind];
    if (!pick || pick.pick === SOMETHING_ELSE) return;
    if (USUALS[kind].some(function (u) { return u.name === pick.pick; })) return;
    dr[kind] = { pick: SOMETHING_ELSE, what: hasText(pick.what) ? pick.what : String(pick.pick || '') };
  });
}

// Why Shake or Medicine offers only Something else, if it does: { why, text }.
function usualsNote(kind) {
  if (!state.usualsFrom || USUALS[kind].length) return null;
  if (state.usualsFrom === 'not read') {
    return { why: 'not read',
             text: 'Your usual ones could not be read on this phone, so only Something else is offered. Type what you had. ' +
                   'Close the page and open it again; if this stays, tell Claude.' };
  }
  if (state.usualsFrom === 'unreadable') {
    return { why: 'unreadable',
             text: 'The usual ones stored on this phone cannot be used, so only Something else is offered. Type what you had, ' +
                   'and tell Claude.' };
  }
  return { why: 'none',
           text: 'No usual ' + (kind === 'Shake' ? 'shake' : 'medicine') + ' is stored on this phone, so only Something else is offered. ' +
                 'Type what you had.' };
}

// ------------------------------------------------------------------ sending

// Send the usual ones to the Usual ones tab once per kind of link (real or
// test), each at its version with a fixed Usual ID, so a second phone or a
// repeat is answered "already had", and a newer version marks the older one
// replaced in the sheet (009, D83). Pages up to 007-3 kept one mark,
// "usualsSent-real" (or -test), for version 1 of both. From 012 the ones sent
// are those in use, read from storage first; their IDs and versions are the
// same as before, so nothing already sent goes again. On 013 a phone with none
// stored sends none.
var seeding = false;
function seedUsuals() {
  var link = state.link;
  if (!link || seeding || !state.usualsFrom) return;
  var which = link.test ? 'test' : 'real';
  var oldFlag = 'usualsSent-' + which;
  var all = [];
  USUAL_KINDS.forEach(function (kind) { USUALS[kind].forEach(function (u) { all.push({ kind: kind, u: u }); }); });
  var flagOf = function (u) { return 'usualSent-' + u.id + '-v' + u.version + '-' + which; };
  seeding = true;
  Promise.all([DL.get('kv', oldFlag)].concat(all.map(function (a) { return DL.get('kv', flagOf(a.u)); }))).then(function (got) {
    var oldDone = !!got[0];
    var toSend = all.filter(function (a, i) { return !got[i + 1] && !(oldDone && a.u.version === 1); });
    var toMark = all.filter(function (a, i) { return !got[i + 1] && oldDone && a.u.version === 1; });
    if (!toSend.length && !toMark.length) return null;
    var stamp = DL.stampNow();
    return DL.run(['outbox', 'kv'], 'readwrite', function (s) {
      toSend.forEach(function (a) {
        var u = a.u;
        var fields = { 'Kind': a.kind, 'Name': u.name, 'Contents': u.contents, 'Saved at': stamp };
        s.outbox.put({ key: u.id + ':' + u.version + ':' + which, seq: nextSeq(), status: 'waiting',
                       payload: { kind: 'usual', test: !!link.test, id: u.id, version: u.version, state: 'current', fields: fields,
                                  app: { page: PAGE_VERSION, usual: { kind: a.kind, name: u.name, contents: u.contents } } } });
        s.kv.put(true, flagOf(u));
      });
      toMark.forEach(function (a) { s.kv.put(true, flagOf(a.u)); });
    }).then(function () { return toSend.length ? DL.sendWaiting() : null; });
  }).then(function () { seeding = false; refreshStatus(); }, function () { seeding = false; refreshStatus(); });
}

var kickTimer = null;
function kick() {
  refreshStatus();
  refreshDone();
  seedUsuals();
  // Chrome's background send covers the page being closed before its own send
  // finished; the worker waits 20 seconds first, so it finds nothing left to
  // send when the page's send got through. It is asked for only when something
  // is waiting; while it runs it can hold up a new page version (Q31).
  DL.counts().then(function (c) { if (c.anyWaiting) askBackgroundSend(); }, function () { /* ignore */ });
  DL.sendWaiting().then(refreshStatus, refreshStatus);
}

function askBackgroundSend() {
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(function (reg) { return reg.sync.register('send'); }).catch(function () { /* not allowed */ });
    }
  } catch (e) { /* not available */ }
}

function refreshStatus() {
  return Promise.all([DL.counts(), DL.get('kv', 'link'), DL.get('kv', 'codeProblem')]).then(function (a) {
    var c = a[0], link = a[1], codeProblem = a[2];
    var lines = [];
    if (!link) lines.push(['warn', 'Not linked to your sheet yet. Scan the code on your PC.']);
    if (link && codeProblem) lines.push(['bad', 'The sheet did not accept this phone’s code. Your entries are kept on this phone. Tell Claude.']);
    if (c.refused) lines.push(['bad', 'The sheet turned away ' + (c.refused === 1 ? '1 entry' : c.refused + ' entries') + '. ' +
                                (c.refused === 1 ? 'It is' : 'They are') + ' kept on this phone. Tell Claude.']);
    if (c.usualRefused) lines.push(['bad', 'The sheet turned away your usual ones. Tell Claude.']);
    if (c.waiting) lines.push(['wait', (c.waiting === 1 ? '1 entry' : c.waiting + ' entries') + ' waiting to send']);
    if (state.linkNote) lines.push(['ok', state.linkNote]);
    var box = document.getElementById('status');
    box.textContent = '';
    lines.forEach(function (l) {
      var div = document.createElement('div');
      div.className = 'line ' + l[0];
      div.textContent = l[1];
      box.appendChild(div);
    });
    state.waiting = c.waiting;
    state.anyWaiting = c.anyWaiting;
  }).catch(function () { /* storage not ready */ });
}

// ------------------------------------------------------------------ linking by the QR code (D46)

function base64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  var bin = atob(s);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Read and clear the part after "#" at once, before anything else, so the
// code never stays in the address bar even if storage cannot be opened.
function takeLinkFromAddress() {
  var h = location.hash || '';
  if (!h) return null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  var m = /^#link=([A-Za-z0-9_-]+)$/.exec(h);
  if (!m) return { bad: true };
  try {
    var o = JSON.parse(base64urlDecode(m[1]));
    if (!o || typeof o.u !== 'string' || typeof o.c !== 'string') return { bad: true };
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(o.u)) return { bad: true };
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(o.c)) return { bad: true };
    return { url: o.u, code: o.c, test: o.t === 1 };
  } catch (e) {
    return { bad: true };
  }
}

// Linking rules:
// - not linked yet: the link is kept at once and checked with the sheet;
// - linked to a sheet that has answered properly at least once ("confirmed"):
//   a link to a different sheet is ignored and nothing changes;
// - otherwise (same sheet with a new code, or a first link that never worked):
//   the new link replaces the old one only after the sheet has accepted it.
function applyLink(got) {
  if (!got) return Promise.resolve();
  if (got.bad) { showError('That link could not be read. Nothing was changed.'); return Promise.resolve(); }
  return DL.get('kv', 'link').then(function (old) {
    var link = { url: got.url, code: got.code, test: got.test, linkedAt: DL.stampNow() };
    if (old && old.confirmed && old.url !== got.url) {
      showError('This phone is already linked to your sheet. A link to a different sheet was ignored, and nothing was changed. Tell Claude.');
      return null;
    }
    if (old && old.url === got.url && old.code === got.code && !!old.test === got.test) {
      state.linkNote = 'Already linked to your sheet.';
      return null;
    }
    if (!old) {
      return storeLink(link).then(function () {
        state.linkNote = 'Checking the link with your sheet…';
        render();
        return checkLink(link);
      }).then(function (r) {
        if (r === 'ok') {
          state.linkNote = 'Linked to your sheet.';
          link.confirmed = true;
          return DL.put('kv', link, 'link');
        }
        if (r === 'refused') { state.linkNote = ''; return DL.put('kv', { when: DL.stampNow() }, 'codeProblem'); }
        if (r === 'unreachable') { state.linkNote = 'Linked. The sheet could not be reached just now; entries will wait until it can.'; return null; }
        state.linkNote = 'Linked. The sheet gave an unexpected answer; entries will wait and be sent again.';
        return null;
      });
    }
    state.linkNote = 'Checking the new link with your sheet…';
    render();
    return checkLink(link).then(function (r) {
      var what = (old.url !== link.url) ? 'Linked to your sheet.' :
                 (old.code !== link.code) ? 'Linked to your sheet with the new code.' :
                 (link.test ? 'Switched to TEST: entries now go to the Test log tab.' : 'Switched back from TEST: entries now go to your log.');
      if (r === 'ok') { link.confirmed = true; return storeLink(link).then(function () { state.linkNote = what; }); }
      state.linkNote = '';
      if (r === 'refused') showError('Your sheet did not accept the code in that link. Nothing was changed.');
      else showError('That link could not be checked just now. Nothing was changed; open it again when you have signal.');
      return null;
    });
  }).then(function () {
    render();
    clearNoteLater();
    kick();
  }, function () {
    showError('The link could not be kept: this phone’s storage refused. Nothing was changed.');
  });
}

function storeLink(link) {
  return DL.run(['kv'], 'readwrite', function (s) { s.kv.put(link, 'link'); s.kv.delete('codeProblem'); }).then(function () {
    state.link = link;
    state.test = link.test;
    el('ver').textContent = 'page ' + PAGE_VERSION + (state.test ? ' · TEST' : '');
    askToKeepStorage();
  });
}

// A send with no entries: the sheet answers "no entries" when the code is
// right and "not allowed" when it is wrong, and adds nothing either way.
// Answers 'ok', 'refused', 'unreachable' or 'odd'.
function checkLink(link) {
  return fetch(link.url, { method: 'POST', body: JSON.stringify({ code: link.code, entries: [] }),
                           credentials: 'omit', redirect: 'follow', cache: 'no-store' })
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var ans = null;
      try { ans = JSON.parse(text); } catch (e) { ans = null; }
      if (ans && ans.ok === false && ans.error === 'no entries') return 'ok';
      if (ans && ans.error === 'not allowed') return 'refused';
      return 'odd';
    }, function () { return 'unreachable'; });
}

var noteTimer = null;
function clearNoteLater() {
  if (noteTimer) clearTimeout(noteTimer);
  noteTimer = setTimeout(function () { state.linkNote = ''; refreshStatus(); }, 10000);
}

// Ask Chrome to keep the page's stored entries even when the phone is short
// of space; asked again at every opening until Chrome agrees.
function askToKeepStorage() {
  try {
    if (navigator.storage && navigator.storage.persisted && navigator.storage.persist) {
      navigator.storage.persisted().then(function (yes) { if (!yes) return navigator.storage.persist(); }).catch(function () { /* ignore */ });
    }
  } catch (e) { /* not available */ }
}

// ------------------------------------------------------------------ drawing the screen

function el(id) { return document.getElementById(id); }

function renderHeads() {
  SCREENS.forEach(function (s) {
    var h = el('h-' + s);
    var on = state.screen === s;
    h.classList.toggle('on', on);
    h.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (s !== 'Intraday') el('hk-' + s).hidden = !(state.done[s] && state.doneDay === currentLogDay());
  });
}

function render() {
  tidyEnds();
  var screen = state.screen;
  document.body.classList.toggle('test', !!state.test);
  el('testbar').hidden = !state.test;
  renderHeads();
  SCREENS.forEach(function (s) { el('sc-' + s).hidden = s !== screen; });

  // Green bar after Save (G10, D48)
  var bar = state.lastSaved;
  if (bar && bar.until && Date.now() >= bar.until) bar = null;
  var sb = el('savedbar');
  if (bar) {
    sb.hidden = false;
    var entryWhen = (bar.savedDate && bar.date !== bar.savedDate ? weekday(bar.date) + ' ' + usDate(bar.date) + ' ' : '') + ampm(bar.time);
    var title;
    if (bar.undone) {
      title = 'Undone: entry of ' + entryWhen;
    } else {
      title = 'Saved at ' + ampm(bar.savedTime || bar.time);
      if (bar.savedTime && (bar.time !== bar.savedTime || bar.date !== bar.savedDate)) title += ' · entry time ' + entryWhen;
    }
    el('savedtitle').textContent = title;
    var undoneText = 'It will show in your sheet as undone.';
    if (bar.undone && bar.ended) {
      var bk = bar.ended.before.kind === 'Walk' ? 'walk' : 'workout';
      undoneText = 'The ' + bk + ' is running again' + (bar.id ? '; the other entry will show in your sheet as undone.' : '.');
    } else if (bar.undone && bar.started) {
      undoneText = 'Not started. It will show in your sheet as undone.';
    }
    el('savedwhat').textContent = bar.undone ? undoneText : bar.summary;
    el('undo').hidden = !!bar.undone;
    sb.classList.toggle('undone', !!bar.undone);
  } else {
    sb.hidden = true;
  }

  renderWhen();
  renderEndBox();
  renderScores();
  renderIntraday();
  renderMorning();
  renderEvening();
  // The time pad goes when its screen is left or its End box is gone (Agent Q, round 2).
  if (!el('tpad').hidden && (!state.tpadFor || state.tpadFor.screen !== screen || (state.tpadFor.end && !endBoxOn(screen)))) closeTpad();

  refreshStatus();
}

function renderScores() {
  Array.prototype.forEach.call(document.querySelectorAll('.srow'), function (row) {
    var s = row.getAttribute('data-s'), k = row.getAttribute('data-k');
    var v = draftOf(s).scores[k];
    Array.prototype.forEach.call(row.querySelectorAll('.n'), function (b) {
      var on = v !== null && v !== undefined && Number(b.getAttribute('data-v')) === v;
      b.classList.toggle('pick', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });
}

function renderIntraday() {
  var dr = state.draft;
  // Comments, Notable, Personal
  var c = el('comments');
  if (c.value !== dr.comments) c.value = dr.comments;
  el('notable').checked = dr.notable;
  el('personal').checked = dr.personal;
  el('whywrap').hidden = !dr.notable;
  var w = el('why');
  if (w.value !== dr.why) w.value = dr.why;
  el('tk-notable').classList.toggle('on', dr.notable);
  el('tk-personal').classList.toggle('on', dr.personal);

  // Shake, Medicine, Coffee, Other (increment 004)
  ['Shake', 'Medicine'].forEach(function (kind) {
    var pick = dr[kind];
    var tile = el('t-' + kind);
    tile.classList.toggle('on', !!pick);
    tile.setAttribute('aria-pressed', pick ? 'true' : 'false');
    el('p-' + kind).hidden = !pick;
    Array.prototype.forEach.call(document.querySelectorAll('#p-' + kind + ' .choice'), function (c) {
      var on = !!pick && pick.pick === c.getAttribute('data-name');
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var wi = el('w-' + kind);
    wi.hidden = !(pick && pick.pick === SOMETHING_ELSE);
    var wanted = pick ? pick.what : '';
    if (wi.value !== wanted) wi.value = wanted;
  });
  // Workout (increment 005); a workout from a day that is over is ended in the box above (R80)
  var stale = isStale();
  var tw = el('t-Workout');
  el('lbl-Workout').textContent = state.running ? endLabel() : 'Workout';
  var won = state.running ? (dr.endTick || (stale && endAnswered(dr))) : !!dr.workout;
  tw.classList.toggle('on', won);
  tw.classList.toggle('end', !!state.running);
  tw.setAttribute('aria-pressed', won ? 'true' : 'false');
  el('p-Workout').hidden = !(dr.workout && !state.running);
  Array.prototype.forEach.call(document.querySelectorAll('#p-Workout .choice'), function (c) {
    var on = !!dr.workout && dr.workout.kind === c.getAttribute('data-name');
    c.classList.toggle('on', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  var rl = el('running');
  if (state.running && (!stale || dr.endTick)) {
    var r = state.running;
    rl.hidden = false;
    rl.textContent = dr.endTick
      ? (r.kind === 'Walk' ? 'The walk' : 'The workout') + ' ends at the time at the top when you tap Save.'
      : r.kind + ' started ' + whenOf(r.startDate, r.startTime, dateStr(new Date())) + '. Tap ' + endLabel() + ' when you finish.';
  } else if (state.running) {
    rl.hidden = false;
    rl.textContent = 'Still running from an earlier day. Set when the ' + (state.running.kind === 'Walk' ? 'walk' : 'workout') +
                     ' ended in the box above.';
  } else {
    rl.hidden = true;
  }
  // Liquids and Food (increment 009)
  var lq = dr.liquids;
  el('t-Liquids').classList.toggle('on', !!lq);
  el('t-Liquids').setAttribute('aria-pressed', lq ? 'true' : 'false');
  el('p-Liquids').hidden = !lq;
  LIQUIDS.forEach(function (l) {
    var c = document.querySelector('#c-Liquids .choice[data-key="' + l.key + '"]');
    var on = !!lq && !!lq[l.key];
    c.classList.toggle('on', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  var wl = el('w-Liquids');
  wl.hidden = !(lq && lq.other);
  var lw = lq ? lq.what : '';
  if (wl.value !== lw) wl.value = lw;
  el('t-Food').classList.toggle('on', dr.food.on);
  el('t-Food').setAttribute('aria-pressed', dr.food.on ? 'true' : 'false');
  el('foodwrap').hidden = !dr.food.on;
  if (el('food').value !== dr.food.text) el('food').value = dr.food.text;
  el('t-Other').classList.toggle('on', dr.other.on);
  el('t-Other').setAttribute('aria-pressed', dr.other.on ? 'true' : 'false');
  el('otherwrap').hidden = !dr.other.on;
  if (el('other').value !== dr.other.text) el('other').value = dr.other.text;
}

function setTimeButton(btn, hhmm) {
  btn.textContent = hhmm ? ampm(hhmm) : 'tap to set';
  btn.classList.toggle('set', !!hhmm);
}

function renderMorning() {
  var dr = state.mdraft;
  MORNING_TIMES.forEach(function (k) { setTimeButton(document.querySelector('.tset[data-s="Morning"][data-k="' + k + '"]'), dr.times[k]); });
  Array.prototype.forEach.call(document.querySelectorAll('#phone .ynb'), function (b) {
    var on = dr.phone === b.getAttribute('data-v');
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (el('sleepwords').value !== dr.words) el('sleepwords').value = dr.words;
}

function renderEvening() {
  var dr = state.edraft;
  EVENING_TIMES.forEach(function (k) { setTimeButton(document.querySelector('.tset[data-s="Evening"][data-k="' + k + '"]'), dr.times[k]); });
  el('daynotable').checked = dr.notable;
  el('tk-daynotable').classList.toggle('on', dr.notable);
  el('daywhywrap').hidden = !dr.notable;
  if (el('daywhy').value !== dr.why) el('daywhy').value = dr.why;
}

// The box about a walk or workout still running (R69, R80, D76)
function renderEndBox() {
  var box = el('endq');
  var on = endBoxOn(state.screen);
  box.hidden = !on;
  if (!on) return;
  var r = state.running, dr = cur();
  var what = r.kind === 'Walk' ? 'Your walk' : 'Your workout (' + r.kind + ')';
  el('endqtext').textContent = what + ' from ' + whenOf(r.startDate, r.startTime, dateStr(new Date())) + ' is still running. When did it end?';
  var a = endAnswered(dr) ? dr.endAns : null;
  setTimeButton(el('endset'), a && a.time ? a.time : null);
  if (a && a.time && a.date && a.date !== r.startDate) el('endset').textContent = weekday(a.date) + ' ' + usDate(a.date) + ' ' + ampm(a.time);
  var dk = el('endunknown');
  dk.classList.toggle('on', !!(a && a.unknown));
  dk.setAttribute('aria-pressed', a && a.unknown ? 'true' : 'false');
  var note = el('endqnote');
  if (a && a.unknown) note.textContent = 'It ends with no end time when you tap Save. Your sheet will say the end is not known.';
  else if (a && a.time) note.textContent = 'It ends at ' + whenOf(a.date || r.startDate, a.time, r.startDate) + ' when you tap Save.';
  else note.textContent = 'Set the time, or tap Don’t know. Skip it and you’ll be asked again.';
}

// The entry's time (G2, G21, G23, G26)
function renderWhen() {
  var dr = cur();
  var shown = dr.fixed || { date: dateStr(new Date()), time: timeStr(new Date()) };
  el('whendate').textContent = weekday(shown.date) + ' ' + usDate(shown.date) + ' · ';
  el('whentime').textContent = ampm(shown.time);
  var ld = logDayOf(shown.date, shown.time);
  var notToday = !!dr.fixed && ld !== currentLogDay();     // a half-filled screen from an earlier day (Agent Q, W5)
  var note = el('daynote');
  if (ld !== shown.date || notToday) {
    note.hidden = false;
    note.textContent = 'Counts for ' + weekday(ld) + ' ' + usDate(ld) + (ld !== shown.date ? ' (before 5:00 AM)' : '') +
                       (notToday ? ', not today. Edit changes it.' : '.');
  } else note.hidden = true;
}

// The choices under Shake and Medicine: the usual ones in use, then Something
// else, with a note when there are none. Built again once the stored usual ones
// have been read (012, 013).
function buildUsualChoices() {
  USUAL_KINDS.forEach(function (kind) {
    var box = el('c-' + kind);
    box.textContent = '';
    var why = usualsNote(kind);
    if (why) {
      var n = document.createElement('div');
      n.className = 'pnote';
      n.setAttribute('data-why', why.why);
      n.textContent = why.text;
      box.appendChild(n);
    }
    USUALS[kind].map(function (u) { return { name: u.name, contents: u.contents }; })
      .concat([{ name: SOMETHING_ELSE, contents: '' }])
      .forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice';
        b.setAttribute('data-name', o.name);
        var t = document.createElement('span');
        t.className = 'cn';
        t.textContent = o.name;
        b.appendChild(t);
        if (o.contents) {
          var c = document.createElement('span');
          c.className = 'cc';
          c.textContent = o.contents;
          b.appendChild(c);
        }
        var k = document.createElement('span');
        k.className = 'chk';
        k.textContent = '✓';
        b.appendChild(k);
        b.addEventListener('click', function () {
          touch();
          if (!state.draft[kind]) state.draft[kind] = { pick: o.name, what: '' };
          state.draft[kind].pick = o.name;
          storeDraft(true);
          render();
          if (o.name === SOMETHING_ELSE) el('w-' + kind).focus();
        });
        box.appendChild(b);
      });
  });
}

function buildButtons() {
  buildUsualChoices();
  USUAL_KINDS.forEach(function (kind) {
    el('t-' + kind).addEventListener('click', function () {
      touch();
      // The usual one is already picked (S8); tapping the button again takes it off.
      state.draft[kind] = state.draft[kind] ? null : { pick: USUALS[kind].length ? USUALS[kind][0].name : SOMETHING_ELSE, what: '' };
      settle();
      storeDraft(true);
      render();
    });
    el('w-' + kind).setAttribute('maxlength', String(WHAT_MAX));
    el('w-' + kind).addEventListener('input', function () {
      touch();
      if (state.draft[kind]) state.draft[kind].what = el('w-' + kind).value;
      limitNote('w-' + kind, WHAT_MAX, 'That line');
      storeDraft(false);
    });
  });
  WORKOUT_KINDS.forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('data-name', k);
    var t = document.createElement('span'); t.className = 'cn'; t.textContent = k; b.appendChild(t);
    var c = document.createElement('span'); c.className = 'chk'; c.textContent = '✓'; b.appendChild(c);
    b.addEventListener('click', function () {
      touch();
      if (!state.draft.workout) state.draft.workout = { kind: null };
      state.draft.workout.kind = k;
      el('nothing').hidden = true;
      storeDraft(true);
      render();
    });
    el('c-Workout').appendChild(b);
  });
  el('t-Workout').addEventListener('click', function () {
    if (state.running && isStale() && !state.draft.endTick) {        // ended in the box above (R80)
      try { el('endq').scrollIntoView({ block: 'center' }); } catch (e) { /* ignore */ }
      openTpad({ screen: 'Intraday', end: true }, el('endrow'));
      return;
    }
    touch();
    if (state.running) state.draft.endTick = !state.draft.endTick;
    else state.draft.workout = state.draft.workout ? null : { kind: null };
    settle();
    storeDraft(true);
    render();
  });
  // Liquids (R85): any that apply (D84); tapping Liquids again takes them all off.
  LIQUIDS.forEach(function (l) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('data-key', l.key);
    var t = document.createElement('span'); t.className = 'cn'; t.textContent = l.name; b.appendChild(t);
    var c = document.createElement('span'); c.className = 'chk'; c.textContent = '✓'; b.appendChild(c);
    b.addEventListener('click', function () {
      touch();
      if (!state.draft.liquids) state.draft.liquids = { coffee: false, water: false, other: false, what: state.draft.liqWhat || '' };
      state.draft.liquids[l.key] = !state.draft.liquids[l.key];
      el('nothing').hidden = true;
      storeDraft(true);
      render();
      if (l.key === 'other' && state.draft.liquids.other) el('w-Liquids').focus();
    });
    el('c-Liquids').appendChild(b);
  });
  el('t-Liquids').addEventListener('click', function () {
    touch();
    // Taking Liquids off keeps the Something else words for when it is tapped again, as Food and Other do (Agent C, W2).
    if (state.draft.liquids) {
      state.draft.liqWhat = state.draft.liquids.what || '';
      state.draft.liquids = null;
    } else {
      state.draft.liquids = { coffee: false, water: false, other: false, what: state.draft.liqWhat || '' };
    }
    settle();
    storeDraft(true);
    render();
  });
  el('w-Liquids').setAttribute('maxlength', String(WHAT_MAX));
  el('w-Liquids').addEventListener('input', function () {
    touch();
    if (state.draft.liquids) state.draft.liquids.what = el('w-Liquids').value;
    limitNote('w-Liquids', WHAT_MAX, 'That line');
    storeDraft(false);
  });
  // Food (R84): the tap, and words if he wants (R66).
  el('t-Food').addEventListener('click', function () {
    touch();
    state.draft.food.on = !state.draft.food.on;
    settle();
    storeDraft(true);
    render();
    if (state.draft.food.on) el('food').focus();
  });
  el('food').setAttribute('maxlength', String(FOOD_MAX));
  el('food').addEventListener('input', function () {
    touch();
    state.draft.food.text = el('food').value;
    limitNote('food', FOOD_MAX, 'The Food box');
    settle();
    storeDraft(false);
  });
  el('t-Other').addEventListener('click', function () {
    touch();
    state.draft.other.on = !state.draft.other.on;
    settle();
    storeDraft(true);
    render();
    if (state.draft.other.on) el('other').focus();
  });
  el('other').setAttribute('maxlength', String(OTHER_MAX));
  el('other').addEventListener('input', function () {
    touch();
    state.draft.other.text = el('other').value;
    limitNote('other', OTHER_MAX, 'The Other box');
    settle();
    storeDraft(false);
  });
}

// Score rows for one screen: rows are { label, key } (key = the sheet's column).
function buildScoreBlock(boxId, screen, rows) {
  var box = el(boxId);
  rows.forEach(function (r) {
    var row = document.createElement('div');
    row.className = 'srow';
    row.setAttribute('data-s', screen);
    row.setAttribute('data-k', r.key);
    var lab = document.createElement('div');
    lab.className = 'lab';
    lab.textContent = r.label;
    row.appendChild(lab);
    SCORE_VALUES.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'n ' + (v < 0 ? 'vm' + Math.abs(v) : 'vp' + v);
      b.setAttribute('data-v', String(v));
      b.setAttribute('aria-label', (screen === 'Morning' ? 'Sleep ' + r.label.toLowerCase() : (screen === 'Evening' ? 'Whole day ' : '') + r.label) + ' ' + signed(v));
      b.textContent = signed(v);
      b.addEventListener('click', function () {
        if (state.screen !== screen) return;
        touch();
        var dr = draftOf(screen);
        dr.scores[r.key] = (dr.scores[r.key] === v) ? null : v;   // tap again clears (G4)
        settle();
        storeDraft(true);
        render();
      });
      row.appendChild(b);
    });
    box.appendChild(row);
  });
}

function buildScores() {
  buildScoreBlock('scores', 'Intraday', SCORE_ROWS.map(function (k) { return { label: k, key: k }; }));
  buildScoreBlock('scores-Morning', 'Morning', MORNING_SCORES);
  buildScoreBlock('scores-Evening', 'Evening', EVENING_SCORES);
}

// The rows of times on Morning and Evening ("tap to set").
function buildTimes(boxId, screen, keys) {
  var box = el(boxId);
  keys.forEach(function (k) {
    var row = document.createElement('div');
    row.className = 'trow';
    var lab = document.createElement('span');
    lab.className = 'tl';
    lab.textContent = k;
    row.appendChild(lab);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tset';
    b.setAttribute('data-s', screen);
    b.setAttribute('data-k', k);
    b.setAttribute('aria-label', k + ': set the time');
    b.textContent = 'tap to set';
    b.addEventListener('click', function () {
      if (state.screen !== screen) return;
      openTpad({ screen: screen, key: k }, row);
    });
    row.appendChild(b);
    box.appendChild(row);
  });
}

function buildMorningEvening() {
  buildTimes('times-Morning', 'Morning', MORNING_TIMES);
  buildTimes('times-Evening', 'Evening', EVENING_TIMES);
  Array.prototype.forEach.call(document.querySelectorAll('#phone .ynb'), function (b) {
    b.addEventListener('click', function () {
      touch();
      var v = b.getAttribute('data-v');
      state.mdraft.phone = state.mdraft.phone === v ? null : v;      // tap again clears
      settle();
      storeDraft(true);
      render();
    });
  });
  el('sleepwords').setAttribute('maxlength', String(WORDS_MAX));
  el('sleepwords').addEventListener('input', function () {
    touch();
    state.mdraft.words = el('sleepwords').value;
    limitNote('sleepwords', WORDS_MAX, 'Sleep in your own words');
    settle();
    storeDraft(false);
  });
  el('daywhy').setAttribute('maxlength', String(WHY_MAX));
  el('daynotable').addEventListener('change', function () {
    touch();
    state.edraft.notable = el('daynotable').checked;
    settle();
    storeDraft(true);
    render();
    if (state.edraft.notable) el('daywhy').focus();
  });
  el('daywhy').addEventListener('input', function () {
    touch();
    state.edraft.why = el('daywhy').value;
    limitNote('daywhy', WHY_MAX, 'The Why line');
    settle();
    storeDraft(false);
  });
  el('endset').addEventListener('click', function () {
    openTpad({ screen: state.screen, end: true }, el('endrow'));
  });
  el('endunknown').addEventListener('click', function () {
    var r = state.running;
    if (!r) return;
    touch();
    var dr = cur();
    dr.endAns = (dr.endAns && dr.endAns.unknown && dr.endAns.forId === r.id) ? null : { forId: r.id, unknown: true, time: null, date: null };
    if (state.screen === 'Intraday' && dr.endAns) dr.endTick = false;
    closeTpad();
    settle();
    storeDraft(true);
    render();
  });
}

// The number pad for a time: the time as he would say it, then AM or PM (D75).
function openTpad(target, row) {
  closePad();
  state.tpadFor = target;
  var p = el('tpad');
  row.parentNode.insertBefore(p, row.nextSibling);
  p.hidden = false;
  state.longOk = null;
  el('tpadlabel').textContent = target.end ? 'Ended at' : target.key;
  el('tpadinput').value = '';
  var dr = draftOf(target.screen);
  var has = target.end ? endAnswered(dr) && !!dr.endAns.time : !!dr.times[target.key];
  el('tpadclear').hidden = !has;
  el('tpadmsg').textContent = 'Type the time, like 1130 or 645, then tap AM or PM.';
  el('tpadmsg').className = 'padmsg';
  el('tpadinput').focus();
}
function closeTpad() {
  state.tpadFor = null;
  state.longOk = null;
  var p = el('tpad');
  if (!p) return;
  p.hidden = true;
  var home = el('save');
  if (p.nextSibling !== home) home.parentNode.insertBefore(p, home);   // keeps the lines between rows (Agent Q, W7)
}
function setFromTpad(half) {
  var t = state.tpadFor;
  if (!t || t.screen !== state.screen) { closeTpad(); return; }
  var four = typedTime(el('tpadinput').value.trim(), half);
  if (!four) {
    el('tpadmsg').textContent = 'Not a time. Type it like 1130 or 645, then tap AM or PM.';
    el('tpadmsg').className = 'padmsg bad';
    return;
  }
  var hhmm = four.slice(0, 2) + ':' + four.slice(2);
  var dr = cur();
  if (t.end) {
    var r = state.running;
    if (!r) { closeTpad(); render(); return; }
    var em = endMoment(r, hhmm, new Date());
    if (!em.ok) {
      el('tpadmsg').textContent = em.msg;
      el('tpadmsg').className = 'padmsg bad';
      return;
    }
    // Over 12 hours is most likely a slip (AM for PM, or a walk left for days):
    // asked once more before it is taken (Agent Q, F3 and W4).
    var hours = (em.at - Math.floor(r.startAt / 60000) * 60000) / 3600000;
    var key = r.id + '|' + hhmm;
    if (hours > LONG_HOURS && state.longOk !== key) {
      state.longOk = key;
      el('tpadmsg').textContent = 'That makes the ' + (r.kind === 'Walk' ? 'walk' : 'workout') + ' more than ' + LONG_HOURS +
        ' hours long (' + whenOf(r.startDate, r.startTime, dateStr(new Date())) + ' to ' + whenOf(em.date, hhmm, r.startDate) +
        '). Tap ' + half + ' again to keep it, or type a different time.';
      el('tpadmsg').className = 'padmsg bad';
      return;
    }
    state.longOk = null;
    touch();
    dr.endAns = { forId: r.id, unknown: false, time: hhmm, date: em.date };
    if (state.screen === 'Intraday') dr.endTick = false;
  } else {
    touch();
    dr.times[t.key] = hhmm;
  }
  storeDraft(true);
  closeTpad();
  render();
}
function clearFromTpad() {
  var t = state.tpadFor;
  if (!t || t.screen !== state.screen) { closeTpad(); return; }
  var dr = cur();
  if (t.end) dr.endAns = null; else dr.times[t.key] = null;
  settle();
  storeDraft(true);
  closeTpad();
  render();
}

var nothingTimer = null;
function showNote(text) {
  var n = el('nothing');
  n.textContent = text;
  n.hidden = false;
  if (nothingTimer) clearTimeout(nothingTimer);
  nothingTimer = setTimeout(function () { n.hidden = true; }, 4000);
}

function showNothing() {
  var n = el('nothing');
  n.textContent = 'Nothing to save yet';
  n.hidden = false;
  if (nothingTimer) clearTimeout(nothingTimer);
  nothingTimer = setTimeout(function () { n.hidden = true; }, 2500);
}

function showError(text) {
  var e = el('error');
  e.textContent = text;
  e.hidden = false;
  try { e.scrollIntoView({ block: 'center' }); } catch (x) { /* ignore */ }
}

// Edit: the number pad, then AM or PM (R65 as changed)
function openPad() {
  closeTpad();
  el('pad').hidden = false;
  el('padinput').value = '';
  el('padmsg').textContent = 'Type the time, like 205 or 1130, then tap AM or PM.';
  el('padmsg').className = 'padmsg';
  el('padinput').focus();
}
function closePad() { el('pad').hidden = true; }
function padShowing(id) { var p = el(id); return !p.hidden && p.offsetParent !== null; }
function setFromPad(half) {
  var four = typedTime(el('padinput').value.trim(), half);
  var got = four ? editedTime(four, new Date()) : null;
  if (!got) {
    el('padmsg').textContent = 'Not a time. Type it like 205 or 1130, then tap AM or PM.';
    el('padmsg').className = 'padmsg bad';
    return;
  }
  state.interacted = true;
  var dr = cur();
  dr.fixed = got;
  dr.edited = true;
  storeDraft(true);
  closePad();
  render();
}

function showScreen(s) {
  if (SCREENS.indexOf(s) < 0 || s === state.screen) return;
  storeDraft(true);
  state.screen = s;
  closePad();
  closeTpad();
  el('nothing').hidden = true;
  render();
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------------ start

function wire() {
  el('save').addEventListener('click', save);
  el('undo').addEventListener('click', undo);
  el('edit').addEventListener('click', openPad);
  el('padam').addEventListener('click', function () { setFromPad('AM'); });
  el('padpm').addEventListener('click', function () { setFromPad('PM'); });
  el('padcancel').addEventListener('click', closePad);
  el('padinput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); el('padmsg').textContent = 'Now tap AM or PM.'; el('padmsg').className = 'padmsg'; }
  });
  el('tpadam').addEventListener('click', function () { setFromTpad('AM'); });
  el('tpadpm').addEventListener('click', function () { setFromTpad('PM'); });
  el('tpadcancel').addEventListener('click', closeTpad);
  el('tpadclear').addEventListener('click', clearFromTpad);
  el('tpadinput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); el('tpadmsg').textContent = 'Now tap AM or PM.'; el('tpadmsg').className = 'padmsg'; }
  });
  SCREENS.forEach(function (s) { el('h-' + s).addEventListener('click', function () { showScreen(s); }); });
  el('comments').setAttribute('maxlength', String(COMMENT_MAX));
  el('why').setAttribute('maxlength', String(WHY_MAX));
  el('comments').addEventListener('input', function () {
    touch();
    state.draft.comments = el('comments').value;
    limitNote('comments', COMMENT_MAX, 'Comments');
    settle();
    if (!state.draft.fixed) renderWhen();
    storeDraft(false);
  });
  el('notable').addEventListener('change', function () {
    touch();
    state.draft.notable = el('notable').checked;
    settle();
    storeDraft(true);
    render();
    if (state.draft.notable) el('why').focus();
  });
  el('why').addEventListener('input', function () {
    touch();
    state.draft.why = el('why').value;
    limitNote('why', WHY_MAX, 'The Why line');
    settle();
    if (!state.draft.fixed) renderWhen();
    storeDraft(false);
  });
  el('personal').addEventListener('change', function () {
    touch();
    state.draft.personal = el('personal').checked;
    settle();
    storeDraft(true);
    render();
  });
  el('error').addEventListener('click', function () { el('error').hidden = true; });

  window.addEventListener('online', kick);
  // A link opened while the page is already open in this tab (W3 of the checks).
  window.addEventListener('hashchange', function () { applyLink(takeLinkFromAddress()); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      storeDraft(true).then(function () { if (state.reloadWhenHidden) location.reload(); });
    } else {
      render();
      kick();
      checkForNewVersion();
    }
  });
  window.addEventListener('pagehide', function () { storeDraft(true); });
  try {
    var bc = new BroadcastChannel('daylog');
    bc.onmessage = function () { refreshStatus(); };
  } catch (e) { /* not available */ }

  // The clock at the top moves until the first tap (G26); the green bar goes at
  // 05:00, when the check marks and the End box are looked at again too.
  var lastDay = currentLogDay();
  setInterval(function () {
    var b = state.lastSaved;
    if (!cur().fixed) renderWhen();
    if (b && b.until && Date.now() >= b.until && !el('savedbar').hidden) render();
    var d = currentLogDay();
    if (d !== lastDay) { lastDay = d; refreshDone(); render(); }
  }, 10000);
  // Anything waiting is tried again every minute while the page is open.
  setInterval(function () { if (state.anyWaiting) kick(); }, 60000);
}

// A new approved version takes over by itself (D23). It is used at once if
// he has not touched the screen yet, otherwise as soon as he leaves the page.
// The half-filled screens and waiting entries are in storage, so nothing is lost.
function watchUpdates() {
  if (!('serviceWorker' in navigator)) return;
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }
    if (!state.interacted) {
      storeDraft(true).then(function () { location.reload(); });
    } else {
      state.reloadWhenHidden = true;
    }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
    try { reg.update(); } catch (e) { /* offline */ }
  }).catch(function () { /* the page still works while open */ });
}

function checkForNewVersion() {
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistration().then(function (reg) { if (reg) return reg.update(); }).catch(function () { /* offline */ });
    }
  } catch (e) { /* not available */ }
}

var limitTimer = null;
function limitNote(id, max, name) {
  if (el(id).value.length < max) return;
  var n = el('nothing');
  n.textContent = name + ' can hold up to ' + max.toLocaleString('en-US') + ' characters; anything beyond that was not kept.';
  n.hidden = false;
  if (limitTimer) clearTimeout(limitTimer);
  limitTimer = setTimeout(function () { n.hidden = true; n.textContent = 'Nothing to save yet'; }, 5000);
}

function start() {
  var arrived = takeLinkFromAddress();
  el('ver').textContent = 'page ' + PAGE_VERSION;
  buildScores();
  buildButtons();
  buildMorningEvening();
  wire();
  // The usual ones are read on their own, so a failed read of them alone cannot
  // stop the half-filled screens, the running walk or the link being read (Agent K, W1).
  // The screen counts as loaded only once both reads are done (013).
  var usualsRead = DL.get('kv', 'usuals').then(function (v) { return { ok: true, value: v }; },
                                               function () { return { ok: false }; });
  Promise.all([DL.get('kv', 'draft'), DL.get('kv', 'lastSaved'), DL.get('kv', 'link'), DL.get('kv', 'running'),
               DL.get('kv', 'draft-Morning'), DL.get('kv', 'draft-Evening')]).then(function (a) {
    return usualsRead.then(function (u) {
      state.reading = false;
      loadUsuals(u);
      state.running = a[3] || null;
      var d = a[0];
      state.draft = (d && d.scores) ? fillDraft(d) : emptyDraft();
      settleUsualPicks(state.draft);
      state.mdraft = fillOther(a[4], emptyMorning());
      state.edraft = fillOther(a[5], emptyEvening());
      state.loaded = true;
      state.lastSaved = a[1] || null;
      state.link = a[2] || null;
      state.test = !!(state.link && state.link.test);
      buildUsualChoices();
      render();
      askToKeepStorage();
      return applyLink(arrived);
    });
  }, function () {
    // Even when storage could not be opened, the usual ones that could be read are offered (Agent L, W4).
    return usualsRead.then(function (u) {
      state.reading = false;
      loadUsuals(u);
      state.draft = emptyDraft();
      state.mdraft = emptyMorning();
      state.edraft = emptyEvening();
      buildUsualChoices();
      render();
      showError('This phone’s storage could not be opened, so nothing can be saved. Close the page and open it again; if it keeps happening, tell Claude.');
    });
  }).then(function () {
    el('ver').textContent = 'page ' + PAGE_VERSION + (state.test ? ' · TEST' : '');
    kick();
  });
  watchUpdates();
}

state.draft = emptyDraft();
state.mdraft = emptyMorning();
state.edraft = emptyEvening();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
