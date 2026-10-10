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
 * 015 (2026-10-08): the six things kept on the phone are read one by one when
 * the page opens, and anything that could not be read is never written over or
 * deleted while the page is open (Q37, D101, D113); a link arriving is taken
 * even then. 015-2: answers about the end of a walk that could not be read are
 * kept, the red line stays up to date, no automatic reload while a screen could
 * not be read, and a second full read when storage opens late (Agent N).
 * 015-3: Undo keeps the End walk tick too, the red line says which screen holds
 * an end that cannot be saved yet, and stops naming the green bar once a Save
 * has replaced it (Agent N's recheck).
 * 016 (2026-10-08): the page open twice on the phone (Q40, D116, D119). The page
 * remembers what it last read or wrote of the five things it changes (the three
 * half-filled screens, the walk running, the green bar), compares them inside the
 * same storage step before writing, and never writes over one that another open
 * copy changed: it takes the stored one and says so. It also takes them again
 * when it comes back to the front or another copy says it wrote. A damaged stored
 * value is treated as one that could not be read (Agent N, note 7).
 * 016-2 (Agent P): storage steps start at once again, as on 015-3, and the screens
 * are copied when their write is asked for; the page compares with what it wrote
 * itself, so its own writes are never taken for another copy's (a Save right after
 * typing could be lost on 016-1); a comparison read that fails writes nothing; a red
 * line saying what to do is not replaced by the general one, and says what changed;
 * Undo undoes only the green bar it was tapped on; odd usual-one picks are put right
 * as since 013, not treated as damaged.
 * 016-3 (Agent P's recheck): an Undo stopped because the other copy's green bar was
 * taken in meanwhile says "Not undone"; a working Undo takes away a "Not undone" line;
 * when the page is closed, his changes not yet stored are written at once, as on 015-3.
 * 016-4: at closing, only screens holding a tap or typing of his not yet stored are
 * written that way, not ones the page only put right by itself (Agent P, W-d).
 * 016-5 (Agent T): when the page goes to the back, his changes not yet stored are
 * written at once as at closing, before the comparing write, so they are not lost if
 * the page is stopped in the moment the comparing read takes; the lines after a Save
 * that was not made say to enter again anything missing (the screen may show the
 * other copy's version).
 * 018 (2026-10-09): today's list under Everything else (R34, R43, R86, R87).
 * 019 (2026-10-09): tapping an Intraday entry in today's list opens it on the Intraday
 * screen, filled in as it stands; "Save changes" makes the next version of that entry,
 * "Cancel" leaves it (R60, R76, R88, R89, R90: no Undo after Save changes). A change in
 * progress is kept on the phone as "draft-fix", compared before writing like the other
 * half-filled screens (016); the half-filled new entry waits in "draft" meanwhile.
 * 019-2 (Agent W): the "Changes saved" bar keeps its own end time (fixUntil) and has its
 * until in the past, so an earlier page put back by the way back never shows it or offers
 * an Undo for it (F1); taps just after the screen jumps are ignored for a moment (W1); the
 * Evening End box cannot end a walk while that walk is being changed (W2); an entry turned
 * away by the sheet is no longer shown as turned away once a newer version of it has gone
 * (W3); the check that the entry was not changed meanwhile reads two versions, not all (W4);
 * the green bar after changing a walk says what it is (W5); entries missing a part are
 * opened as their day and Screen say (N3); opening an entry counts as touching the page (N5).
 * 019-3: the green bar is hidden while an entry is being changed (it showed the last Save
 * above the banner); it comes back after Save changes or Cancel.
 * 020 (2026-10-09): a little harder to change an entry (R91 to R94). A tap on an entry only
 * shows a "Change this entry" button under it (R92); the button opens it. While an entry is
 * being changed the screen is pale yellow, the box naming it is pinned under the headings,
 * and the button reads "Save changes to 2:05 PM entry" (R93). No extra question (R94).
 * 020-2 (Agent W): the Change button opens the entry only once it has been showing for
 * 0.7 seconds, so a slow second tap cannot land on a button that just moved under the finger
 * (W1); the "another day" question goes when Edit changes the time again (W3).
 * 021 (2026-10-09): Morning and Evening entries can be changed too, on their own screens, the
 * same way (R88, R92, R93): the Change button opens them there, yellow, with "Save changes" and
 * "Cancel"; afterwards the app goes back to Intraday (G021-1). The end of an ended walk or
 * workout can be changed to another time or to "Don't know", never taken off (R95, D141).
 * A Morning or Evening change in progress is kept in "draft-fix" with dr null and its screen in
 * sdr, so page 020-2 (the way back) treats it as unreadable and never opens or writes over it.
 * 021-2 (Agent X): a walk or workout made longer than 12 hours by a changed start (Edit) or end is
 * asked about once more at Save changes (X1); "Saved when you tap Save changes" (N6).
 * 021-3 (Agent X's recheck): the red lines about the entry being changed (12 hours, another day,
 * start after end) go after Cancel, and after Edit or a new end changes what they were about.
 * 022 (2026-10-09): earlier days (R64, R73, R78, R96). Arrows on today's list's heading show an earlier
 * day in the same spot, read only until Edit (R78); after Edit, entries change as today's do (R92, R93).
 * The day shown and the Edit unlock are kept in memory only, never stored (G022-1), so nothing new is
 * stored and the way back to 021-3 is unaffected. A time typed with Edit for an earlier day's entry
 * stays on that day (R97); for today's entries Edit works as before. A normal Save brings the list
 * back to today (G022-3).
 * 022-3 (Agent Y): an entry opens only if it is of the day the list shows and that day is not read only, so a
 * Change button left showing across 5:00 AM or from the day before a quick arrow tap opens nothing (1, 12);
 * Edit unlocks only the day drawn; Edit's time on an earlier day takes the later 1:30 AM when the clocks go
 * back, as today's Edit does, and says when the clocks skipped the time typed (2, 3); an earlier day's entry
 * given a time before 5:00 AM asks once more (4, G022-7); the "another day" line says it can't be moved back
 * (5); "changed" on an earlier day's list carries its date (6); the line after changing an earlier day's
 * entry says where it is (7); a clock set back no longer leaves the tap shield on for that long (8); an empty
 * earlier day shows no read-only box (11).
 * 022-4 (Agent Y's recheck, R1): the night question is not asked when the Log day changes too, so it and the
 * "another day" question can no longer take turns at Save changes without saving.
 */
var PAGE_VERSION = '022-4';
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
  reading: true,                  // the opening read of the phone's storage has not finished
  unread: {},                     // things kept on the phone that could not be read at opening (015):
                                  // never written over or deleted while the page is open
  known: {},                      // what this page last read or wrote of each of GUARDED, as fp() (016)
  gen: {},                        // how often each of GUARDED was taken in from storage (016-2)
  closeWrite: {},                 // screens written at closing without comparing, not yet known done (016-3)
  edits: {},                      // his taps and typing on each screen, counted (016-4)
  storedEdits: {},                // how many of those the stored screen holds
  noStorage: false,               // the phone's storage could not be opened at all when the page opened
  fix: null,                      // an entry being changed (019): { id, base, test, orig, dr, opened }
  fixConfirm: null                // a change to another day, asked about once (019, G019-5)
};
var KEY_FIX = 'draft-fix';        // where a change in progress is kept (019)

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

// The screen a change in progress is on (021): Morning, Evening or Intraday.
function fixScreenOf(fx) { return fx && (fx.screen === 'Morning' || fx.screen === 'Evening') ? fx.screen : 'Intraday'; }
function fixOn(screen) { return !!state.fix && fixScreenOf(state.fix) === screen; }
// What each screen shows: the entry being changed on that screen while there is one (019, 021).
function draftOf(screen) {
  if (fixOn(screen)) return state.fix.dr;
  return screen === 'Morning' ? state.mdraft : (screen === 'Evening' ? state.edraft : state.draft);
}
function idr() { return draftOf('Intraday'); }
// A change in progress as it is kept on the phone: on Morning or Evening its screen goes in sdr
// and dr is null, so page 020-2 (the way back) never takes it for an Intraday change (021).
function storedFix(f) {
  if (fixScreenOf(f) === 'Intraday') return f;
  return { id: f.id, base: f.base, test: f.test, orig: f.orig, screen: f.screen, dr: null, sdr: f.dr, opened: f.opened };
}
// The four things kept like half-filled screens, by their key in storage (019 adds KEY_FIX).
var SLOTS = ['draft', 'draft-Morning', 'draft-Evening', KEY_FIX];
function valueOfKey(k) {
  if (k === KEY_FIX) return state.fix ? storedFix(state.fix) : undefined;
  return k === 'draft' ? state.draft : (k === 'draft-Morning' ? state.mdraft : state.edraft);
}
// The key his taps and typing on a screen change: the change in progress while there is one.
function screenKey(screen) { return fixOn(screen) ? KEY_FIX : draftKey(screen); }
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
    // A stored screen that could not be read at opening is left as it is (015).
    // The screens are copied now, when the write is asked for, as on 015-3 (016-2; Agent P, F1).
    var w = SLOTS.filter(function (k) { return !state.unread[k]; }).map(function (k) {
      var v = valueOfKey(k);
      return { k: k, v: v === undefined ? undefined : clone(v), gen: state.gen[k], known: state.known[k], ed: state.edits[k] || 0 };
    }).filter(function (x) {
      // No change in progress, and none stored as far as this page knows: nothing to write (019).
      return !(x.k === KEY_FIX && x.v === undefined && (x.known === undefined || x.known === '-'));
    });
    if (!w.length) return Promise.resolve();
    var lostMine = false;
    return guarded(['kv'], function (s, got, missed) {
      var wrote = {};
      w.forEach(function (x) {
        // Not written: taken from another open copy since it was copied, changed there
        // since this page last saw it, or not readable just now (016).
        if (state.gen[x.k] !== x.gen || !unchanged(x.k, got, missed)) {
          if (fp(x.k, x.v) !== x.known) lostMine = true;      // it held a change of his not yet stored
          return;
        }
        if (x.v === undefined) s.kv.delete(x.k); else s.kv.put(x.v, x.k);
        wrote[x.k] = x.v;
      });
      return { wrote: wrote };
    }).then(function (res) {
      w.forEach(function (x) { if (res.wrote && Object.prototype.hasOwnProperty.call(res.wrote, x.k)) state.storedEdits[x.k] = x.ed; });
      afterGuarded(res, lostMine ? 'typed' : 'other');
    }).catch(function () { /* shown at Save */ });
  };
  if (now) return write();
  draftTimer = setTimeout(write, 300);
  return Promise.resolve();
}

// When the page is being closed, screens holding a change of his not yet stored are
// written at once, without first reading what is stored, as on 015-3: waiting for the
// reads can lose what he typed when the page goes at once (016-3; Agent P, W1, W-c).
// The page being closed is the one at the front, which took in the other copy's
// changes when it came there; another copy at the back does not write.
function storeAtClose() {
  if (!state.loaded) return;
  if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
  // Only screens holding a tap or typing of his not yet stored: a screen the page only put
  // right by itself (an old usual one, an end answer dropped) is not written without
  // comparing (016-4; Agent P, W-d).
  var w = SLOTS.map(function (k) { var v = valueOfKey(k); return { k: k, v: v === undefined ? undefined : clone(v), ed: state.edits[k] || 0 }; })
                 .filter(function (x) {
                   return !state.unread[x.k] && x.ed !== (state.storedEdits[x.k] || 0) && fp(x.k, x.v) !== state.known[x.k];
                 });
  if (!w.length) return;
  // Until this write is known to be done, finding it in storage is not taken for another copy's change.
  w.forEach(function (x) { x.f = fp(x.k, x.v); state.closeWrite[x.k] = x.f; });
  DL.run(['kv'], 'readwrite', function (s) {
    w.forEach(function (x) { if (x.v === undefined) s.kv.delete(x.k); else s.kv.put(x.v, x.k); });
  }).then(function () {
    w.forEach(function (x) {
      if (state.closeWrite[x.k] === x.f) { state.known[x.k] = x.f; delete state.closeWrite[x.k]; state.storedEdits[x.k] = x.ed; }
    });
    tellKept();
  }, function () {
    w.forEach(function (x) { if (state.closeWrite[x.k] === x.f) delete state.closeWrite[x.k]; });
  });
}
// Whether a stored value is the one this page last read or wrote (or its own write at
// closing, which then counts as known).
function sameAsKnown(k, v) {
  var f = fp(k, v);
  if (f === state.known[k]) return true;
  if (state.closeWrite[k] === f) { state.known[k] = f; delete state.closeWrite[k]; return true; }
  return false;
}

// ------------------------------------------------------------------ the page open twice (016)

// The five things the page changes in the phone's storage. Before writing any of
// them it reads them all again in the same storage step and compares each with
// what it last read or wrote (state.known); one that another open copy of the
// page changed is never written over: the stored one is taken instead (Q40).
var GUARDED = ['draft', 'draft-Morning', 'draft-Evening', 'running', 'lastSaved', KEY_FIX];   // 019 adds the change in progress
// What is compared: the value written out with its parts in a fixed order. A half-filled
// screen is compared as the page would show it, so a screen never stored, an empty one
// and one kept by an older page without the newer parts count the same when they hold
// the same (another copy writing them back unchanged is not a change).
function stable(v) {
  if (v === undefined) return '-';
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(function (x) { return x === undefined ? 'null' : stable(x); }).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; })
                 .map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
}
function fp(k, v) {
  if (v !== undefined && !kindOk(k, v)) return 'damaged ' + stable(v);
  if (k === 'draft') return stable(v && v.scores ? fillDraft(clone(v)) : emptyDraft());
  if (k === 'draft-Morning') return stable(fillOther(v === undefined ? undefined : clone(v), emptyMorning()));
  if (k === 'draft-Evening') return stable(fillOther(v === undefined ? undefined : clone(v), emptyEvening()));
  if (k === KEY_FIX) return v === undefined || v === null ? '-' : stable(normFix(clone(v)));
  return stable(v);
}
// A change in progress as the page uses it: its screen with every part (019).
function normFix(v) {
  var scr = fixScreenOf(v);
  var d = scr === 'Intraday' ? fillDraft(v.dr) : fillOther(v.sdr !== undefined ? v.sdr : v.dr, emptyOf(scr));
  return { id: v.id, base: v.base, test: !!v.test, orig: v.orig, screen: scr, dr: d, opened: v.opened === undefined ? null : v.opened };
}

// The page's own storage steps start at once, as on 015-3 (016-2; Agent P, W1): the
// phone's storage runs steps that touch the same things one after another, in the
// order they were started, and each step's results are taken in (afterGuarded) before
// the next one reads. state.gen counts, for each of the five, how often a stored value
// was taken in (take), so a step worked out before that is not written over it.
function queued(fn) {
  try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); }
}

// One storage step: first reads the five (except any that could not be read at
// opening, which are never touched), then decide(stores, got, missed) queues the
// writes and returns { wrote: { key: value written, or undefined for one deleted },
// refused }. Resolves with that, got and missed, once everything in the step is
// written. A read that fails here does not stop the step: that item is listed in
// missed and cannot be compared, so it is not written (016-2), and a Save or Undo
// that needs it writes nothing (a failure seen only in tests so far).
function guarded(stores, decide, mode, extras) {
  // A step that writes entries makes today's list read them again (018): before it starts and once it is over.
  var touchesEntries = (mode || 'readwrite') === 'readwrite' && stores.indexOf('entries') >= 0;
  if (touchesEntries) listGen++;
  var over = function () { if (touchesEntries) listGen++; };
  return DL.db().then(function (d) {
    return new Promise(function (resolve, reject) {
      var t = d.transaction(stores, mode || 'readwrite');
      var s = {};
      stores.forEach(function (n) { s[n] = t.objectStore(n); });
      var keys = GUARDED.filter(function (k) { return !state.unread[k]; });
      // Further reads in the same step (019: every version of the entry being changed).
      var ex = extras || [], extra = {};
      var got = {}, missed = {}, left = keys.length + ex.length, res = null, failed = null, started = false;
      var go = function () {
        if (started) return;
        started = true;
        try { res = decide(s, got, missed, extra) || {}; res.got = got; res.missed = missed; if (!res.wrote) res.wrote = {}; }
        catch (err) { failed = err; try { t.abort(); } catch (e) { /* already done */ } }
      };
      var one = function () { if (--left === 0) go(); };
      keys.forEach(function (k) {
        try {
          var q = s.kv.get(k);
          q.onsuccess = function () { try { got[k] = q.result; } catch (e) { missed[k] = true; } one(); };
          q.onerror = function (e) { missed[k] = true; try { e.preventDefault(); e.stopPropagation(); } catch (x) { /* ignore */ } one(); };
        } catch (e) { missed[k] = true; left--; }
      });
      ex.forEach(function (x) {
        try {
          var q = x.key !== undefined ? s[x.store].get(x.key) : s[x.store].getAll(x.range);
          q.onsuccess = function () { extra[x.name] = q.result; one(); };
          q.onerror = function (e) { extra.failed = true; try { e.preventDefault(); e.stopPropagation(); } catch (y) { /* ignore */ } one(); };
        } catch (e) { extra.failed = true; left--; }
      });
      if (left === 0) go();
      // A step whose reads never all answered is treated as not readable (Agent P, note 8).
      t.oncomplete = function () { over(); resolve(res || { refused: true, unreadable: true, got: got, missed: missed, wrote: {} }); };
      t.onerror = function () { over(); reject(failed || t.error || new Error('storage error')); };
      t.onabort = function () { over(); reject(failed || t.error || new Error('storage aborted')); };
    });
  });
}
// The comparison for one item: true when it may be written, that is, unchanged since
// this page last saw it, or not read at opening (never written, 015). One whose read
// failed just now cannot be compared, so it is not written (016-2; Agent P, W2).
function unchanged(k, got, missed) {
  if (state.unread[k]) return true;
  if (missed[k]) return false;
  return sameAsKnown(k, got[k]);
}
function notReadable(keys, missed) { return keys.some(function (k) { return !state.unread[k] && missed[k]; }); }

// After a storage step: what was written is now what this page knows; anything
// else that another copy changed is taken (how: 'typed', 'save-walk', 'save-screen',
// 'undo' or 'other', for the red line). Another open copy is told when something really changed.
// Returns the keys taken.
function afterGuarded(res, how) {
  if (res.unreadable) return [];          // nothing was compared or written (016-2)
  var wrote = res.wrote || {}, got = res.got || {};
  var changed = false, taken = [];
  Object.keys(wrote).forEach(function (k) {
    if (fp(k, wrote[k]) !== fp(k, got[k])) changed = true;
    state.known[k] = fp(k, wrote[k]);
  });
  Object.keys(got).forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(wrote, k)) return;
    if (!sameAsKnown(k, got[k])) taken.push(k);
  });
  if (changed) tellKept();
  if (taken.length || res.refused) takeChanged(got, taken, how);
  return taken;
}

// Takes the stored values of keys, then brings the screen and the red line up to
// date (how 'none': the caller shows the line itself).
function takeChanged(got, keys, how) {
  keys.forEach(function (k) { take(k, got[k]); });
  // The time pad stays open unless what it was for was taken (016-2; Agent P, note 3).
  var t = state.tpadFor;
  if (t && keys.some(function (k) { return k === draftKey(t.screen) || (t.end && k === 'running'); })) closeTpad();
  tidyEnds();
  render();
  refreshDone();
  if (how !== 'none') showOtherLine(how);
}
// The red line about another open copy, followed by the one about anything not read (015).
// A line saying what to do (not saved, not undone, enter it again) is not replaced by the
// general one while it shows (016-2; Agent P, W3).
var specificShown = '';
function showOtherLine(how) {
  var e = el('error');
  if (how === 'other' && specificShown && !e.hidden && e.textContent === specificShown) return;
  var u = unreadText();
  showError(otherText(how) + (u ? ' ' + u : ''));
  specificShown = how === 'other' ? '' : e.textContent;
  unreadShown = '';
}

var OTHER_OPEN = 'The day log is also open somewhere else on this phone, for example in a Chrome tab, ';
var CLOSE_OTHER = 'To avoid this, close the other one and use only the home-screen icon.';
var LATEST_SAVE = 'This page now shows the latest; check it. If what you entered is still on the screen, tap Save again; if any of it is missing, enter it again first. ';
function otherText(how) {
  if (how === 'save-walk') return 'Not saved. ' + OTHER_OPEN + 'and a walk or workout was started or ended there. ' + LATEST_SAVE + CLOSE_OTHER;
  if (how === 'save-screen') return 'Not saved. ' + OTHER_OPEN + 'and this screen was saved or changed there. ' + LATEST_SAVE + CLOSE_OTHER;
  if (how === 'undo') {
    return 'Not undone. ' + OTHER_OPEN + 'and something was saved or undone there. ' +
           'This page now shows the latest; check the green bar, and tap Undo again if it still needs undoing. ' + CLOSE_OTHER;
  }
  if (how === 'typed') {
    return OTHER_OPEN + 'and something was changed there. This page now shows the latest; if something you just entered here is missing, enter it again. ' + CLOSE_OTHER;
  }
  return OTHER_OPEN + 'and something was changed there. This page now shows the latest. ' + CLOSE_OTHER;
}
// A comparison read that failed just now: nothing was written (016-2; Agent P, W2).
var NOT_READ_SAVE = 'Not saved: this phone could not read its own storage just now, so nothing was saved, and the entry is back on the screen. ' +
                    'Tap Save again; if this keeps happening, close the page and open it again, and tell Claude.';
var NOT_READ_UNDO = 'Not undone: this phone could not read its own storage just now, so nothing was changed. ' +
                    'Tap Undo again; if this keeps happening, close the page and open it again, and tell Claude.';

// Puts a value read from storage in use (at opening, and when another open copy
// changed it). A damaged value (a kind the page never writes) is treated like one
// that could not be read (015): not used, never written over (Agent N, note 7).
// Returns false for a damaged one.
function take(k, v) {
  if (v !== undefined && !kindOk(k, v)) {
    state.unread[k] = true;
    delete state.known[k];
    state.gen[k] = (state.gen[k] || 0) + 1;
    if (k === 'running') state.running = null;
    else if (k === 'lastSaved') state.lastSaved = null;
    else if (k === KEY_FIX) state.fix = null;
    else setDraftOf(k === 'draft' ? 'Intraday' : k.slice(6), emptyOf(k === 'draft' ? 'Intraday' : k.slice(6)));
    return false;
  }
  state.known[k] = fp(k, v);              // before fillDraft changes v
  state.gen[k] = (state.gen[k] || 0) + 1;
  state.storedEdits[k] = state.edits[k] || 0;     // what he had on that screen is replaced by what is stored
  if (k === 'running') state.running = v || null;
  else if (k === 'lastSaved') state.lastSaved = v || null;
  else if (k === 'draft') { state.draft = v ? fillDraft(v) : emptyDraft(); settleUsualPicks(state.draft); }
  else if (k === 'draft-Morning') state.mdraft = fillOther(v, emptyMorning());
  else if (k === 'draft-Evening') state.edraft = fillOther(v, emptyEvening());
  else if (k === KEY_FIX) { state.fix = v ? normFix(v) : null; state.fixConfirm = null; }
  return true;
}

function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
function isDay(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function isHM(s) { return typeof s === 'string' && /^\d{2}:\d{2}$/.test(s); }
function isNum(n) { return typeof n === 'number' && isFinite(n); }
function optStr(s) { return s === undefined || s === null || typeof s === 'string'; }
function optBool(b) { return b === undefined || b === null || typeof b === 'boolean'; }
function noneOr(v, ok) { return v === undefined || v === null || ok(v); }
function scoresOk(o, keys) {
  return isObj(o) && keys.every(function (k) { return noneOr(o[k], function (n) { return SCORE_VALUES.indexOf(n) >= 0; }); });
}
function timesOk(o, keys) { return isObj(o) && keys.every(function (k) { return noneOr(o[k], isHM); }); }
function fixedOk(f) { return noneOr(f, function (x) { return isObj(x) && isDay(x.date) && isHM(x.time) && noneOr(x.at, isNum); }); }
function endAnsOk(a) {
  return noneOr(a, function (x) { return isObj(x) && optBool(x.unknown) && noneOr(x.time, isHM) && optStr(x.forId); });
}
// A new end typed for an ended walk or workout being changed (021, R95).
function newEndOk(x) { return isObj(x) && (x.unknown === true || (isHM(x.time) && isNum(x.at) && noneOr(x.date, isDay) && noneOr(x.from, isNum))); }
function runningOk(r) {
  return isObj(r) && typeof r.id === 'string' && isNum(r.version) && typeof r.kind === 'string' && isObj(r.fields) &&
         isNum(r.startAt) && isDay(r.startDate) && isHM(r.startTime);
}
// The kinds of value the page writes (and pages since 003 wrote); anything else is damaged.
// Parts already put right when read are not checked: Food, Other and Liquids (fillDraft),
// and Shake and Medicine picks (settleUsualPicks, since 013: an odd pick shows as Something else).
function kindOk(k, v) {
  if (k === 'running') return runningOk(v);
  if (k === 'lastSaved') {
    return isObj(v) && isDay(v.date) && isHM(v.time) && typeof v.summary === 'string' && noneOr(v.until, isNum) && noneOr(v.fixUntil, isNum) &&
           noneOr(v.savedDate, isDay) && noneOr(v.savedTime, isHM) && optStr(v.id) && optBool(v.undone) &&
           noneOr(v.ended, function (e) { return isObj(e) && isNum(e.version) && runningOk(e.before); });
  }
  if (k === 'draft') {
    return isObj(v) && scoresOk(v.scores, SCORE_ROWS) && fixedOk(v.fixed) && optStr(v.comments) && optStr(v.why) &&
           optBool(v.notable) && optBool(v.personal) && optStr(v.liqWhat) &&
           noneOr(v.workout, function (w) { return isObj(w) && optStr(w.kind); }) && optBool(v.endTick) && endAnsOk(v.endAns) &&
           noneOr(v.newEnd, newEndOk);
  }
  if (k === 'draft-Morning') {
    return isObj(v) && timesOk(v.times, MORNING_TIMES) && scoresOk(v.scores, MORNING_SCORES.map(function (s) { return s.key; })) &&
           fixedOk(v.fixed) && optStr(v.phone) && optStr(v.words);
  }
  if (k === 'draft-Evening') {
    return isObj(v) && timesOk(v.times, EVENING_TIMES) && scoresOk(v.scores, EVENING_SCORES.map(function (s) { return s.key; })) &&
           fixedOk(v.fixed) && optBool(v.notable) && optStr(v.why) && endAnsOk(v.endAns);
  }
  if (k === KEY_FIX) {
    if (v === null) return true;
    if (!(isObj(v) && typeof v.id === 'string' && isNum(v.base) && v.base >= 1 && isObj(v.orig) && optBool(v.test))) return false;
    if (v.screen !== undefined && v.screen !== 'Intraday' && v.screen !== 'Morning' && v.screen !== 'Evening') return false;
    var scr = fixScreenOf(v);
    if (scr === 'Intraday') return kindOk('draft', v.dr) && isObj(v.dr.fixed);
    var d = v.sdr !== undefined ? v.sdr : v.dr;          // as kept (dr null, sdr) or as used
    return (v.sdr === undefined || v.dr === null) && kindOk('draft-' + scr, d) && isObj(d.fixed);
  }
  return true;
}

// Reads the five again and takes any that another open copy changed: when the
// page comes back to the front, and when another copy says it wrote. A change of
// this page's own still waiting to be written goes first, compared as always.
function catchUp() {
  if (!state.loaded || state.noStorage) return Promise.resolve();
  if (draftTimer) return storeDraft(true);
  return queued(function () {
    if (!GUARDED.some(function (k) { return !state.unread[k]; })) return null;
    return guarded(['kv'], function () { return { wrote: {} }; }, 'readonly')
      .then(function (res) { afterGuarded(res, 'other'); });
  }).catch(function () { /* read again next time */ });
}

var keptChannel = null;
function tellKept() { try { if (keptChannel) keptChannel.postMessage('kept'); } catch (e) { /* not available */ } }

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
  if (fixOn(screen)) return false;      // not while an entry is being changed on that screen (019; Evening from 021, G021-3)
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
  // While the walk or workout running could not be read, answers about its end are
  // kept as they are (015-2; Agent N, finding 1).
  if (state.unread.running) return;
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
// When a green bar goes. The "Changes saved" bar (019-2) keeps its own in fixUntil; its until is
// already past, so an earlier page put back by the way back shows no bar and no Undo (Agent W, F1).
function barUntil(b) { return b ? (b.fix ? b.fixUntil : b.until) : 0; }
function barGone(b) { var u = barUntil(b); return !!u && Date.now() >= u; }
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
  if (fixOn(screen)) { saveFix(); return; }      // 019; Morning and Evening from 021
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
  // A walk or workout running that could not be read is never written over (015).
  if (screen === 'Intraday' && dr.workout && dr.workout.kind && state.unread.running) {
    showError('This phone could not read whether a walk or workout is already running, so a new one can’t be started just now. ' +
              'Close the page and open it again, or tap Workout to take it off and save the rest.');
    return;
  }
  // An end answered before, for a walk or workout that could not be read now, is kept for it (015-2).
  if (state.unread.running && (dr.endTick || dr.endAns)) {
    showError('This screen holds the end of a walk or workout that this phone could not read, so it can’t be saved until the phone can read it. ' +
              'Close the page and open it again; if this keeps happening, tell Claude.');
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
  // A walk being changed on Intraday is not ended meanwhile (019-2; Agent W, W2).
  if (endHow && state.fix && run && state.fix.id === run.id) {
    showError('You are changing this ' + (run.kind === 'Walk' ? 'walk' : 'workout') + ' on Intraday. Tap Save changes or Cancel there first, then end it here.');
    specificShown = el('error').textContent;
    return;
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
  var dk = draftKey(screen);
  // What this Save was worked out from (016): if the walk running or this screen was
  // taken from another open copy since, or another copy changed them in storage,
  // nothing is written. This page's own earlier writes are not a change (016-2; Agent P, F1).
  var gen0 = { running: state.gen.running, screen: state.gen[dk] };
  var ed0 = state.edits[dk] || 0;
  setDraftOf(screen, emptyOf(screen));
  state.running = newRunning;
  closeTpad();
  render();
  queued(function () {
    return guarded(['entries', 'outbox', 'kv'], function (s, got, missed) {
      if (notReadable(['running', dk], missed)) return { refused: true, unreadable: true };
      if (state.gen.running !== gen0.running || !unchanged('running', got, missed)) return { refused: true, why: 'save-walk' };
      if (state.gen[dk] !== gen0.screen || !unchanged(dk, got, missed)) return { refused: true, why: 'save-screen' };
      var wrote = {};
      if (entry) { s.entries.put(entry); s.outbox.put(out); }
      if (endV) { s.entries.put(endV); s.outbox.put(endOut); }
      // Anything that could not be read at opening is left as it is (015).
      if (!state.unread.running) {
        if (newRunning) s.kv.put(newRunning, 'running'); else s.kv.delete('running');
        wrote.running = newRunning || undefined;
      }
      s.kv.put(bar, 'lastSaved');
      wrote.lastSaved = bar;
      if (!state.unread[dk]) { s.kv.delete(dk); wrote[dk] = undefined; }
      return { wrote: wrote };
    });
  }).then(function (res) {
    if (res.refused) {
      // Nothing was written: the screen gets back what was on it (unless taken from
      // another copy meanwhile), then takes what another copy changed (016).
      if (state.gen.running === gen0.running) state.running = runBefore;
      if (state.gen[dk] === gen0.screen && !hasAnythingOf(screen, draftOf(screen))) setDraftOf(screen, saved);
      if (res.unreadable) {
        render();
        showError(NOT_READ_SAVE);
        specificShown = el('error').textContent;
        return;
      }
      ['running', dk].forEach(function (k) {
        if (!state.unread[k] && !res.missed[k] && !sameAsKnown(k, res.got[k])) take(k, res.got[k]);
      });
      afterGuarded(res, res.why);
      storeDraft(true);
      return;
    }
    state.lastSaved = bar;
    armedId = null;                   // the Change button goes after a Save (020)
    listDay = null;                   // the list comes back to today, where the new entry is (G022-3)
    listEditDay = null;
    // The entry just saved is shaded green in today's list for a moment (G24; 018).
    state.flash = { id: bar.id || (bar.ended && bar.ended.id) || null, until: Date.now() + 4000 };
    setTimeout(refreshList, 4100);
    state.storedEdits[dk] = ed0;      // what he had on the screen is saved (016-4)
    delete state.unread.lastSaved;    // replaced by this Save, as always (015-3; Agent N, recheck R3)
    el('error').hidden = true;
    showUnread(false);                // the line about what could not be read stays while it applies (015-2)
    el('nothing').hidden = true;
    var taken = afterGuarded(res, 'none');   // a screen another open copy changed meanwhile is taken (016)
    tidyEnds();
    storeDraft(true);                 // anything typed meanwhile is kept for the next entry
    render();
    kick();
    window.scrollTo(0, 0);
    if (taken.length) showOtherLine('other');
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
  if (bar && barGone(bar)) { render(); return; }
  if (!bar || bar.undone || bar.fix || state.saving) return;      // no Undo after Save changes (R90)
  if (fixOn(state.screen)) return;            // not while an entry is being changed on this screen (G019-1)
  if (state.unread.running && (bar.started || bar.ended)) {      // never written over (015)
    showError('This phone could not read whether a walk or workout is running, so this Save can’t be undone just now. ' +
              'Close the page and open it again, then tap Undo.');
    return;
  }
  state.saving = true;
  var stamp = stampOf(new Date());
  // What this Undo was worked out from (016): it undoes the green bar shown when Undo
  // was tapped, so nothing is written if the stored green bar is no longer that one, or
  // (when this Undo starts or ends a walk) if the walk running was taken from another
  // copy since or changed there (016-2: compared with the bar itself; Agent P, note 1).
  var barFp = fp('lastSaved', bar);
  var gen0 = { lastSaved: state.gen.lastSaved, running: state.gen.running };
  var touchesRun = !!(bar.ended || bar.started);
  var refusedRes = null;
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
    return queued(function () {
      return guarded(['entries', 'outbox', 'kv'], function (s, got, missed) {
        if (notReadable(touchesRun ? ['lastSaved', 'running'] : ['lastSaved'], missed)) return { refused: true, unreadable: true };
        if (state.gen.lastSaved !== gen0.lastSaved || fp('lastSaved', got.lastSaved) !== barFp) return { refused: true, why: 'bar' };
        if (touchesRun && (state.gen.running !== gen0.running || !unchanged('running', got, missed))) return { refused: true, why: 'walk' };
        var wrote = {};
        puts.forEach(function (v) {
          s.entries.put(v);
          s.outbox.put({ key: v.key, seq: v.seq, status: 'waiting', payload: payloadFor(v) });
        });
        if (restored) { s.kv.put(restored, 'running'); wrote.running = restored; }
        else if (bar.started) { s.kv.delete('running'); wrote.running = undefined; }
        s.kv.put(newBar, 'lastSaved');
        wrote.lastSaved = newBar;
        return { wrote: wrote };
      });
    }).then(function (res) {
      if (res.refused) { refusedRes = res; return; }
      state.lastSaved = newBar;
      if (state.unread.lastSaved) { delete state.unread.lastSaved; refreshUnread(); }   // 015-3
      if (restored) state.running = restored;
      else if (bar.started) state.running = null;
      afterGuarded(res, 'other');
    });
  }).then(function () {
    state.saving = false;
    if (refusedRes) {
      if (refusedRes.unreadable) { showError(NOT_READ_UNDO); specificShown = el('error').textContent; return; }
      // The green bar was replaced by a newer Save of this page itself (Save and Undo
      // tapped together): nothing to say; the newer bar shows (016-2; Agent P, note 1).
      // Not so if anything was taken in from another copy since the tap (016-3; Agent P, W-a).
      var g = refusedRes.got;
      var mine = state.gen.lastSaved === gen0.lastSaved && state.gen.running === gen0.running &&
                 Object.keys(g).every(function (k) { return sameAsKnown(k, g[k]); });
      if (mine) { render(); return; }
      // Nothing was written: takes what another open copy changed, and says so (016).
      afterGuarded(refusedRes, 'undo');
      return;
    }
    if (!state.unread.running) state.draft.endTick = false;     // kept while the walk could not be read (015-3; Agent N, recheck R1)
    // A "Not undone" line from an earlier try goes once an Undo works (016-3; Agent P, W-b).
    var e = el('error');
    if (!e.hidden && specificShown && e.textContent === specificShown && /^Not undone/.test(specificShown)) {
      e.hidden = true; specificShown = ''; showUnread(false);
    }
    tidyEnds();
    render();
    kick();
  }, function () {
    state.saving = false;
    showError('Could not undo: this phone’s storage refused. Try Undo again.');
  });
}

// ------------------------------------------------------------------ changing a saved entry (019)
// Tapping an Intraday entry in today's list opens its newest version on the Intraday
// screen (R88). "Save changes" writes the next version of it (D20, R76), keeping its
// time unless Edit changed it, with the time of the change in "Saved at" (R60, R16).
// Workout cannot be added or taken off here (G019-4); the kind of a walk or workout
// can change, and a walk still running takes the change with it, so its End ends the
// changed version. No Undo after Save changes (R90).

// Every key fieldsFor() can write; any other part of the entry is kept as it was
// (for example "Workout ended").
var MADE_BY_SCREEN = ['Log day', 'Time', 'Screen', 'Mind', 'Body', 'Balance', 'Comments', 'Notable', 'Notable why', 'Personal',
                      'Shake', 'Shake contents', 'Medicine', 'Medicine contents', 'Workout', 'Coffee', 'Water', 'Other liquid',
                      'Other liquid, what', 'Food or snack', 'Food or snack, what', 'Other', 'Calendar date', 'UTC offset', 'Saved at'];
function versionsRange(id) { return IDBKeyRange.bound(id + ':', id + ':￿'); }
function newestOf(list) {
  var top = null;
  (list || []).forEach(function (v) { if (v && typeof v.version === 'number' && (!top || v.version > top.version)) top = v; });
  return top;
}
// The Intraday screen filled in from a saved entry's fields.
function fixDraftFrom(f) {
  var d = emptyDraft();
  var date = calDateOf(f);
  var time = f['Time'];
  d.fixed = { date: date, time: time, at: momentOf(date, time).getTime() };
  d.edited = true;                                   // its time is never dropped (settleOf)
  SCORE_ROWS.forEach(function (k) {
    var n = typeof f[k] === 'string' && /^[+-]?\d$/.test(f[k].trim()) ? Number(f[k]) : f[k];     // a score kept as text (Agent W, N3)
    if (SCORE_VALUES.indexOf(n) >= 0) d.scores[k] = n;
  });
  if (typeof f['Comments'] === 'string') d.comments = f['Comments'];
  d.notable = f['Notable'] === 'Yes';
  if (typeof f['Notable why'] === 'string') d.why = f['Notable why'];
  d.personal = f['Personal'] === 'Yes';
  USUAL_KINDS.forEach(function (kind) {
    if (typeof f[kind] !== 'string') return;
    d[kind] = { pick: f[kind], what: f[kind] === SOMETHING_ELSE && typeof f[kind + ' contents'] === 'string' ? f[kind + ' contents'] : '' };
  });
  if (typeof f['Workout'] === 'string') d.workout = { kind: f['Workout'] };
  var lq = { coffee: f['Coffee'] === 'Yes', water: f['Water'] === 'Yes', other: f['Other liquid'] === 'Yes',
             what: typeof f['Other liquid, what'] === 'string' ? f['Other liquid, what'] : '' };
  if (lq.coffee || lq.water || lq.other) d.liquids = lq; else d.liqWhat = lq.what;
  d.food = { on: f['Food or snack'] === 'Yes', text: typeof f['Food or snack, what'] === 'string' ? f['Food or snack, what'] : '' };
  d.other = { on: f['Other'] !== undefined, text: typeof f['Other'] === 'string' ? f['Other'] : '' };
  return d;
}
// The Morning or Evening screen filled in from a saved entry's fields (021).
function scoreOf(x) {
  var n = typeof x === 'string' && /^[+-]?\d$/.test(x.trim()) ? Number(x) : x;     // a score kept as text (Agent W, N3)
  return SCORE_VALUES.indexOf(n) >= 0 ? n : null;
}
function fixScreenDraftFrom(f, scr) {
  var d = emptyOf(scr);
  var date = calDateOf(f);
  d.fixed = { date: date, time: f['Time'], at: momentOf(date, f['Time']).getTime() };
  d.edited = true;                                   // its time is never dropped (settleOf)
  (scr === 'Morning' ? MORNING_TIMES : EVENING_TIMES).forEach(function (k) { if (isHM(f[k])) d.times[k] = f[k]; });
  (scr === 'Morning' ? MORNING_SCORES : EVENING_SCORES).forEach(function (s) { d.scores[s.key] = scoreOf(f[s.key]); });
  if (scr === 'Morning') {
    if (typeof f['Phone before bed'] === 'string') d.phone = f['Phone before bed'];
    if (typeof f['Sleep in own words'] === 'string') d.words = f['Sleep in own words'];
  } else {
    d.notable = f['Day notable'] === 'Yes';
    if (typeof f['Day notable why'] === 'string') d.why = f['Day notable why'];
  }
  return d;
}
// The calendar date of an entry: its own, or worked out from its Log day and Time (before 5:00 AM
// the calendar date is the day after the Log day, R75) for an entry without one (Agent W, N3).
function dayAfter(s) { var p = parts(s); return dateStr(new Date(p.y, p.m - 1, p.d + 1, 12)); }
function calDateOf(f) {
  if (isDay(f['Calendar date'])) return f['Calendar date'];
  return isHM(f['Time']) && Number(f['Time'].slice(0, 2)) < DAY_STARTS_AT ? dayAfter(f['Log day']) : f['Log day'];
}
// The usual one recorded in the entry, when it is not among the usual ones in use now:
// offered as a choice, so keeping it keeps what was recorded (G40).
function fixExtra(kind) {
  var fx = state.fix;
  if (!fx) return null;
  var name = fx.orig[kind];
  if (typeof name !== 'string' || name === SOMETHING_ELSE) return null;
  if (USUALS[kind].some(function (u) { return u.name === name; })) return null;
  return { name: name, contents: typeof fx.orig[kind + ' contents'] === 'string' ? fx.orig[kind + ' contents'] : '' };
}
// Every key fieldsMorning() and fieldsEvening() can write (021).
var MADE_BY_MORNING = ['Log day', 'Time', 'Screen'].concat(MORNING_TIMES, MORNING_SCORES.map(function (s) { return s.key; }),
                      ['Phone before bed', 'Sleep in own words', 'Calendar date', 'UTC offset', 'Saved at']);
var MADE_BY_EVENING = ['Log day', 'Time', 'Screen'].concat(EVENING_SCORES.map(function (s) { return s.key; }), EVENING_TIMES,
                      ['Day notable', 'Day notable why', 'Calendar date', 'UTC offset', 'Saved at']);
// The fields of the changed version.
function fixFields(fx, now) {
  var scr = fixScreenOf(fx);
  if (scr !== 'Intraday') {
    var g = fieldsOf(scr, fx.dr, now), og = fx.orig, made = scr === 'Morning' ? MADE_BY_MORNING : MADE_BY_EVENING;
    var odg = calDateOf(og);
    if (fx.dr.fixed.date === odg && fx.dr.fixed.time === og['Time'] && og['UTC offset'] !== undefined) g['UTC offset'] = og['UTC offset'];
    Object.keys(og).forEach(function (k) { if (made.indexOf(k) < 0 && g[k] === undefined) g[k] = og[k]; });
    return g;
  }
  var f = fieldsFor(fx.dr, now), o = fx.orig;
  // A shake or medicine kept as recorded keeps what was recorded with it (G40).
  USUAL_KINDS.forEach(function (kind) {
    if (fx.dr[kind] && typeof o[kind] === 'string' && o[kind] !== SOMETHING_ELSE && fx.dr[kind].pick === o[kind]) {
      f[kind] = o[kind];
      if (o[kind + ' contents'] !== undefined) f[kind + ' contents'] = o[kind + ' contents']; else delete f[kind + ' contents'];
    }
  });
  // The time not changed: the date and offset stay exactly as recorded.
  var od = calDateOf(o);
  if (fx.dr.fixed.date === od && fx.dr.fixed.time === o['Time'] && o['UTC offset'] !== undefined) f['UTC offset'] = o['UTC offset'];
  Object.keys(o).forEach(function (k) { if (MADE_BY_SCREEN.indexOf(k) < 0 && f[k] === undefined) f[k] = o[k]; });
  // A new end for an ended walk or workout (021, R95): a time, or not known; never taken off.
  var ne = fx.dr.newEnd;
  if (ne && o['Workout ended'] !== undefined && o['Workout'] !== undefined) f['Workout ended'] = ne.unknown ? END_NOT_KNOWN : ne.time;
  return f;
}
// The end of the walk or workout being changed as it now stands: the new end typed, or the saved one (021).
function fixEndNow(fx) {
  var ne = fx.dr.newEnd;
  if (ne) return ne.unknown ? END_NOT_KNOWN : ne.time;
  return fx.orig['Workout ended'];
}
// The green bar's line after Save changes: what the entry holds, a walk or workout with its times (Agent W, W5).
function fixSummary(f, running) {
  var g = clone(f);
  var w = '';
  if (g['Workout'] !== undefined) {
    var end = g['Workout ended'];
    w = g['Workout'] + (end === undefined ? (running ? ' from ' + ampm(g['Time']) + ', still running' : '')
                        : end === END_NOT_KNOWN ? ' from ' + ampm(g['Time']) + ', end not known'
                        : ' ' + ampm(g['Time']) + ' to ' + (isHM(end) ? ampm(end) : end));
    delete g['Workout']; delete g['Workout ended'];
  }
  var rest = summary(g);
  return w && rest ? w + ', ' + rest : (w || rest);
}
function sameFields(a, b) {
  var x = clone(a), y = clone(b);
  delete x['Saved at']; delete y['Saved at'];
  if (y['Screen'] === undefined) y['Screen'] = 'Intraday';          // an entry with no Screen is an Intraday one (Agent W, N3)
  return stable(x) === stable(y);
}
// The end of an ended walk or workout as a moment: the first time with its clock time
// at or after it started (as endMoment).
function endAtOf(o) {
  var e = o['Workout ended'];
  if (!isHM(e)) return null;
  var t = momentOf(calDateOf(o), o['Time']);
  for (var k = 0; k <= 26 * 60; k++) {
    if (timeStr(t) === e) return t.getTime();
    t = new Date(t.getTime() + 60000);
  }
  return null;
}

var CANT_CHANGE_NOW = 'This phone could not read part of what it keeps, so entries can’t be changed just now. ' +
                      'Close the page and open it again; if this keeps happening, tell Claude.';
var FIX_CHANGED = 'Not saved: this entry was changed since you opened it here (it was undone, or its walk or workout was ended or changed, ' +
                  'perhaps in the day log open somewhere else). Your changes are still on the screen. Tap Cancel to see the entry as it is now, then change it again.';
var NOT_READ_FIX = 'Not saved: this phone could not read its own storage just now, so nothing was saved, and your changes are back on the screen. ' +
                   'Tap Save changes again; if this keeps happening, close the page and open it again, and tell Claude.';

// Taps in the screen for a moment after it jumps (an entry opened, Save changes, Cancel) are
// ignored, so a quick second tap does not land on whatever moved under the finger (Agent W, W1).
var TAP_SHIELD_MS = 400, tapShield = 0;
function shieldTaps(ms) { tapShield = Math.max(tapShield, Date.now() + ms); }

var opening = false;
function openFix(id) {
  if (state.reading || !state.loaded || state.noStorage || state.fix || opening || state.screen !== 'Intraday') return;
  if (dayLocked()) return;                            // an earlier day is read only until Edit (R78; 022)
  if (state.unread[KEY_FIX]) { showError(CANT_CHANGE_NOW); return; }
  opening = true;
  DL.run(['entries'], 'readonly', function (s, r) {
    var q = s.entries.getAll(versionsRange(id));
    q.onsuccess = function () { r.list = q.result; };
  }).then(function (r) {
    opening = false;
    var top = newestOf(r.list);
    if (!top || top.state === 'undone' || state.fix || state.screen !== 'Intraday' || !!top.test !== !!state.test) return;
    var f = top.fields || {};
    // Only an entry of the day the list shows, and that day not read only: a Change button left showing across
    // 5:00 AM, or from the day before a quick arrow tap, opens nothing (022-3; Agent Y, 1).
    if (f['Log day'] !== shownDay() || dayLocked()) { armedId = null; refreshList(); return; }
    var scr = f['Screen'] === 'Morning' || f['Screen'] === 'Evening' ? f['Screen'] : 'Intraday';     // 021
    if (!isHM(f['Time']) || !(isDay(f['Calendar date']) || isDay(f['Log day']))) {
      showError('This entry’s time could not be read, so it can’t be changed on the phone. Tell Claude.');
      return;
    }
    if (scr === 'Intraday' && f['Workout'] !== undefined && state.unread.running) {
      showError('This phone could not read whether a walk or workout is running, so this one can’t be changed just now. ' +
                'Close the page and open it again.');
      return;
    }
    if (draftTimer) storeDraft(true);                 // the half-filled new entry is kept as it is
    state.interacted = true;                          // a new page version waits until he leaves (Agent W, N5)
    state.fix = { id: id, base: top.version, test: !!top.test, orig: clone(f), screen: scr,
                  dr: scr === 'Intraday' ? fixDraftFrom(f) : fixScreenDraftFrom(f, scr), opened: DL.stampNow() };
    if (scr !== 'Intraday') state.screen = scr;       // the entry opens on its own screen (R88; 021)
    state.fixConfirm = null;
    state.fixLongOk = null;
    state.edits[KEY_FIX] = (state.edits[KEY_FIX] || 0) + 1;
    closePad();
    closeTpad();
    el('nothing').hidden = true;
    storeDraft(true);
    render();
    window.scrollTo(0, 0);
    shieldTaps(TAP_SHIELD_MS);                        // the screen moved under his finger (Agent W, W1)
  }, function () {
    opening = false;
    showError('This entry could not be read from the phone’s storage just now. Try again; if this keeps happening, tell Claude.');
  });
}

// The red lines about the entry being changed go once they no longer apply: after Cancel or Save changes,
// and after Edit or a new end changes the time they were about (021-3; Agent X's recheck).
var FIX_LINE = /^(This makes the (walk|workout) more than |This time puts the entry on |This time is |The (walk|workout) ended at |With this start, the end at |An entry can’t be left with nothing in it)/;
function clearFixLine() {
  var e = el('error');
  if (!e.hidden && FIX_LINE.test(e.textContent)) { e.hidden = true; specificShown = ''; showUnread(false); }
}
// Leaves the change without saving it; also used when nothing was changed.
function cancelFix(note) {
  if (!state.fix) return;
  armedId = null;
  closePad();
  closeTpad();
  if (fixScreenOf(state.fix) !== 'Intraday' && state.screen === fixScreenOf(state.fix)) state.screen = 'Intraday';   // G021-1
  state.fix = null;
  clearFixLine();
  state.fixConfirm = null;
  state.edits[KEY_FIX] = (state.edits[KEY_FIX] || 0) + 1;
  storeDraft(true);
  el('nothing').hidden = true;
  render();
  window.scrollTo(0, 0);
  shieldTaps(TAP_SHIELD_MS);
  if (note) showNote(note);
}

function saveFix() {
  var fx = state.fix;
  if (state.reading || !fx) return;
  var scr = fixScreenOf(fx);
  if (padShowing('tpad') && el('tpadinput').value.trim() !== '') {         // a time typed and not yet set (021)
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
  var dr = fx.dr;
  if (scr === 'Intraday' && dr.liquids && !liquidsPicked(dr)) {
    showNote('Pick Coffee, Water or Something else, or tap Liquids again to take it off.');
    return;
  }
  var walk = scr === 'Intraday' && fx.orig['Workout'] !== undefined;
  if (walk && state.unread.running) {
    showError('This phone could not read whether a walk or workout is running, so this one can’t be changed just now. ' +
              'Close the page and open it again.');
    return;
  }
  if (scr === 'Intraday' ? !hasContent(dr, true) : !contentOf(scr, dr)) {
    showError('An entry can’t be left with nothing in it. Put something back, or tap Cancel to leave it as it was.');
    return;
  }
  var now = new Date();
  var fields = fixFields(fx, now);
  if (sameFields(fields, fx.orig)) { cancelFix('Nothing was changed, so nothing was saved.'); return; }
  var startAt = dr.fixed.at || momentOf(dr.fixed.date, dr.fixed.time).getTime();
  // The end as it now stands: a new end typed (021) at the moment worked out when it was typed, else the saved one.
  var ne = walk ? dr.newEnd : null;
  var endAt = walk ? (ne ? (ne.unknown ? null : ne.at) : endAtOf(fx.orig)) : null;
  var endShown = walk ? fixEndNow(fx) : null;
  if (endAt !== null && startAt > endAt) {
    showError('The ' + (fx.orig['Workout'] === 'Walk' ? 'walk' : 'workout') + ' ended at ' + ampm(endShown) +
              ', so its start can’t be later than that. Change the time with Edit' + (ne ? ' or the end' : '') + ', or tap Cancel.');
    return;
  }
  // The sheet keeps only the end's clock time, read as the first such time after the start; a start moved
  // by Edit after a new end was typed must still give that same end (021).
  if (ne && !ne.unknown && endAtOf({ 'Workout ended': ne.time, 'Time': dr.fixed.time, 'Calendar date': dr.fixed.date }) !== ne.at) {
    showError('With this start, the end at ' + ampm(ne.time) + ' would fall on another day. Change the start with Edit or type the end again, or tap Cancel.');
    return;
  }
  // Longer than 12 hours because the start or the end was changed: asked once more, as when an end is typed (021-2; Agent X, X1).
  // Not when its length is unchanged, nor for a typed end already asked about with this same start.
  if (endAt !== null) {
    var startMin = Math.floor(startAt / 60000) * 60000;
    var lenMin = Math.round((endAt - startMin) / 60000);
    var o0 = fx.orig, oEnd = endAtOf(o0);
    var oLen = oEnd !== null && isHM(o0['Time']) ? Math.round((oEnd - momentOf(calDateOf(o0), o0['Time']).getTime()) / 60000) : null;
    var askedTyped = !!(ne && !ne.unknown && ne.from === startAt && state.longOkEnd === fx.id + '|' + ne.time + '|' + ne.from);
    var lk = fx.id + '|' + startAt + '|' + endAt;
    if (lenMin > LONG_HOURS * 60 && lenMin !== oLen && !askedTyped && state.fixLongOk !== lk) {
      state.fixLongOk = lk;
      var wk = fx.orig['Workout'] === 'Walk' ? 'walk' : 'workout';
      var ed = new Date(endAt);
      showError('This makes the ' + wk + ' more than ' + LONG_HOURS + ' hours long (' + whenOf(dr.fixed.date, dr.fixed.time, dateStr(new Date())) +
                ' to ' + whenOf(dateStr(ed), timeStr(ed), dr.fixed.date) + '). Tap Save changes again to keep it, or change the time with Edit' +
                (ne ? ' or the end' : '') + ', or tap Cancel.');
      specificShown = el('error').textContent;
      return;
    }
  }
  // An earlier day's entry given a time before 5:00 AM goes on the night after that day, which still counts for it (R75):
  // asked once more, since he may have meant that morning (022-3; Agent Y, 4; G022-7).
  if (earlierFixDay() && fields['Log day'] === fx.orig['Log day'] && isHM(fx.orig['Time']) && Number(fx.orig['Time'].slice(0, 2)) >= DAY_STARTS_AT &&
      Number(fields['Time'].slice(0, 2)) < DAY_STARTS_AT) {
    var nk = fx.id + '|night|' + fields['Calendar date'] + '|' + fields['Time'];
    if (state.fixConfirm !== nk) {
      state.fixConfirm = nk;
      showError('This time is ' + ampm(fields['Time']) + ' on ' + weekday(fields['Calendar date']) + ' ' + usDate(fields['Calendar date']) +
                ', the night after ' + weekday(fields['Log day']) + ' ' + usDate(fields['Log day']) + ' (before 5:00 AM it still counts for that day). ' +
                'Tap Save changes again to keep it, or change the time with Edit.');
      specificShown = el('error').textContent;
      return;
    }
  }
  // Moved to another day: asked once more, since there is no Undo (G019-5; from 022 the line says where it goes, G022-5).
  if (fields['Log day'] !== fx.orig['Log day']) {
    var ck = fx.id + '|' + fields['Log day'] + '|' + fields['Time'];
    if (state.fixConfirm !== ck) {
      state.fixConfirm = ck;
      showError('This time puts the entry on ' + weekday(fields['Log day']) + ' ' + usDate(fields['Log day']) +
                ', so it will leave today’s list and can’t be moved back to today afterwards (it will show under the ‹ arrow). ' +
                'Tap Save changes again to keep it, or change the time with Edit.');
      specificShown = el('error').textContent;
      return;
    }
  }
  state.fixConfirm = null;
  var run = state.running;
  var isRun = !!(run && run.id === fx.id);
  var newRunning = run;
  if (isRun) {
    newRunning = clone(run);
    newRunning.version = fx.base + 1;
    newRunning.fields = fields;
    newRunning.kind = fields['Workout'];
    newRunning.startAt = startAt;
    newRunning.startDate = dr.fixed.date;
    newRunning.startTime = dr.fixed.time;
  }
  var ver = fx.base + 1;
  var entry = { key: fx.id + ':' + ver, id: fx.id, version: ver, state: 'current', test: fx.test, fields: fields, seq: nextSeq(),
                changed: { date: dateStr(now), time: timeStr(now) } };
  var pl = payloadFor(entry);
  pl.app.change = 'fix';
  var out = { key: entry.key, seq: entry.seq, status: 'waiting', payload: pl };
  // The green bar says the changes were saved, with no Undo (R90, G019-7). Its id is null and its
  // until already past, so an earlier page put back by the way back neither shows it nor undoes anything (019-2).
  var bar = { id: null, fixId: fx.id, fix: true, date: dr.fixed.date, time: dr.fixed.time,
              summary: scr === 'Intraday' ? fixSummary(fields, isRun) : summary(fields), undone: false,
              test: fx.test, screen: scr, savedDate: dateStr(now), savedTime: timeStr(now),
              until: now.getTime(), fixUntil: nextDayStart(now).getTime(), started: false, ended: null };
  if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
  var gen0 = { running: state.gen.running, fix: state.gen[KEY_FIX] };
  var ed0 = state.edits[KEY_FIX] || 0;
  var saved = fx, runBefore = run;
  var screenBefore = state.screen;
  state.fix = null;                                  // the screen goes back at once, as after Save
  if (scr !== 'Intraday') state.screen = 'Intraday';  // back to today's list (G021-1)
  state.running = newRunning;
  closePad();
  closeTpad();
  render();
  shieldTaps(TAP_SHIELD_MS);
  queued(function () {
    return guarded(['entries', 'outbox', 'kv'], function (s, got, missed, extra) {
      if (notReadable(walk ? [KEY_FIX, 'running'] : [KEY_FIX], missed) || extra.failed) return { refused: true, unreadable: true };
      if (state.gen[KEY_FIX] !== gen0.fix || !unchanged(KEY_FIX, got, missed)) return { refused: true, why: 'save-screen' };
      if (isRun && (state.gen.running !== gen0.running || !unchanged('running', got, missed))) return { refused: true, why: 'save-walk' };
      // Still the newest version, and not undone: no version after it, and it is there (019-2: two reads, Agent W, W4).
      if (extra.next !== undefined || !extra.base || extra.base.state === 'undone') return { refused: true, why: 'fix-changed' };
      if (isRun && (!got.running || got.running.id !== fx.id || got.running.version !== fx.base)) return { refused: true, why: 'fix-changed' };
      var wrote = {};
      s.entries.put(entry);
      s.outbox.put(out);
      if (isRun) { s.kv.put(newRunning, 'running'); wrote.running = newRunning; }
      s.kv.put(bar, 'lastSaved');
      wrote.lastSaved = bar;
      s.kv.delete(KEY_FIX);
      wrote[KEY_FIX] = undefined;
      return { wrote: wrote };
    }, 'readwrite', [{ name: 'base', store: 'entries', key: fx.id + ':' + fx.base }, { name: 'next', store: 'entries', key: fx.id + ':' + (fx.base + 1) }]);
  }).then(function (res) {
    if (res.refused) {
      if (state.gen.running === gen0.running) state.running = runBefore;
      if (state.gen[KEY_FIX] === gen0.fix && !state.fix) { state.fix = saved; if (state.screen === 'Intraday') state.screen = screenBefore; }
      if (res.unreadable) { render(); showError(NOT_READ_FIX); specificShown = el('error').textContent; return; }
      if (res.why === 'fix-changed') {
        afterGuarded(res, 'none');
        render();
        showError(FIX_CHANGED);
        specificShown = el('error').textContent;
        return;
      }
      ['running', KEY_FIX].forEach(function (k) {
        if (!state.unread[k] && !res.missed[k] && !sameAsKnown(k, res.got[k])) take(k, res.got[k]);
      });
      afterGuarded(res, res.why);
      storeDraft(true);
      return;
    }
    state.lastSaved = bar;
    armedId = null;
    state.flash = { id: fx.id, until: Date.now() + 4000 };     // shaded green in today's list (G24)
    setTimeout(refreshList, 4100);
    state.storedEdits[KEY_FIX] = ed0;
    delete state.unread.lastSaved;
    el('error').hidden = true;
    showUnread(false);
    el('nothing').hidden = true;
    var taken = afterGuarded(res, 'none');
    tidyEnds();
    storeDraft(true);
    render();
    kick();
    window.scrollTo(0, 0);
    if (taken.length) showOtherLine('other');
  }, function () {
    state.running = runBefore;
    if (!state.fix) { state.fix = saved; if (state.screen === 'Intraday') state.screen = screenBefore; }
    storeDraft(true);
    render();
    showError('Could not save the changes on this phone: its storage refused. They are back on the screen; try Save changes again.');
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
  return newestEntries().then(function (newest) {
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

// ------------------------------------------------------------------ today's list (018)
// Every entry of the current day (05:00 to 05:00) that stands, newest first, from the
// phone's own storage: the newest version of each, undone ones left out (R86), with a
// grey note while it waits to send (R87) and a red one if the sheet turned it away
// (G018-3). Only entries of the same kind as the page (test or real, G018-5).
// The entries are read again only when they may have changed (listGen: a Save or Undo
// here, a message from another open copy, coming back to the page), not at every tap:
// with a year of entries stored, reading them all takes a moment (018, perf check).
var listBusy = false, listAgain = false;
var listGen = 1, listReadGen = 0, listNewest = null, listRows = null, listRowsKey = '', listDrawn = '';
var listChanged = {};             // for each entry, when it was last changed with Save changes (019, R89)
var armedId = null;               // the entry showing "Change this entry" (020, R92); never stored
var armedAt = 0;                  // when it appeared: the button works only after ARMED_MS (020-2; Agent W, W1)
var ARMED_MS = 700;
var listDay = null;               // the earlier day the list shows (022, R96); null for today; never stored (G022-1)
var listEditDay = null;           // the earlier day unlocked with Edit (R78); never stored
var listFirstDay = null;          // the first day this phone has an entry for (the ‹ arrow stops there)
var listHeadDay = null;           // the day whose heading and list are drawn now; Edit unlocks only that one (022-3; Agent Y, 12)
// The day the list shows: today unless an earlier day was picked with the arrows.
function shownDay() {
  var t = currentLogDay();
  if (listDay && listDay >= t) { listDay = null; listEditDay = null; }    // the clock was set back: today again
  return listDay || t;
}
// An earlier day not unlocked with Edit: its entries can't be opened (R78).
function dayLocked() { var d = shownDay(); return d !== currentLogDay() && listEditDay !== d; }
function showDay(d) {
  var t = currentLogDay();
  var nd = !d || d >= t ? null : d;
  if (nd === listDay) return;
  listDay = nd;
  listEditDay = null;               // leaving a day locks it again (G022-1)
  armedId = null;
  refreshList();
}
var newestReading = null, newestReadingGen = 0;
// The newest version of every entry, by id: read once for each change (listGen) and shared
// by today's list and the check marks on Morning and Evening (refreshDone), so a Save
// reads the entries once, as page 016-5 did (018-2; Agent V, F1).
function newestEntries() {
  var gen = listGen;
  if (listNewest && listReadGen === gen) return Promise.resolve(listNewest);
  if (newestReading && newestReadingGen === gen) return newestReading;
  newestReadingGen = gen;
  var p = DL.getAll('entries').then(function (all) {
    var newest = {}, changed = {};
    all.forEach(function (v) {
      if (v && typeof v.id === 'string' && typeof v.version === 'number' && (!newest[v.id] || v.version > newest[v.id].version)) newest[v.id] = v;
      if (v && typeof v.id === 'string' && typeof v.version === 'number' && v.changed && isDay(v.changed.date) && isHM(v.changed.time) &&
          (!changed[v.id] || v.version > changed[v.id].version)) changed[v.id] = { version: v.version, date: v.changed.date, time: v.changed.time };
    });
    listNewest = newest;
    listChanged = changed;
    listReadGen = gen;
    listRows = null;
    return newest;
  });
  newestReading = p;
  var clear = function () { if (newestReading === p) newestReading = null; };
  p.then(clear, clear);
  return p;
}
function refreshList() {
  if (listBusy) { listAgain = true; return Promise.resolve(); }
  listBusy = true;
  var today = currentLogDay();
  var day = shownDay();             // today, or the earlier day picked with the arrows (022)
  var done = function () { listBusy = false; if (listAgain) { listAgain = false; refreshList(); } };
  var failed = function () {
    // Nothing new to show: the last drawing stays; an empty list says so (018-2; Agent V, W5).
    var box = el('today');
    if (!box.firstChild) box.appendChild(listDiv('empty', (day === today ? 'Today’s list' : 'The list for this day') + ' could not be read just now. If this keeps happening, close the page and open it again.'));
    listDrawn = '';
    done();
  };
  return Promise.all([newestEntries(), DL.getAll('outbox')]).then(function (a) {
    var newest = a[0];
    var waiting = {}, refused = refusedNow(a[1], newest);
    a[1].forEach(function (x) {
      var pl = x && x.payload;
      if (!pl || pl.kind !== 'log') return;
      if (x.status !== 'refused') waiting[pl.id] = true;
    });
    var key = listReadGen + '|' + day + '|' + !!state.test;
    if (!listRows || listRowsKey !== key) {
      // The first day with an entry on this phone, for the ‹ arrow (022).
      var first = null;
      Object.keys(newest).forEach(function (id) {
        var v = newest[id], ld = (v.fields || {})['Log day'];
        if (v.state !== 'undone' && !!v.test === !!state.test && isDay(ld) && (!first || ld < first)) first = ld;
      });
      listFirstDay = first;
      listRows = Object.keys(newest).map(function (id) { return newest[id]; }).filter(function (v) {
        var f = v.fields || {};
        return v.state !== 'undone' && f['Log day'] === day && !!v.test === !!state.test;
      });
      listRows.sort(function (x, y) {
        var kx = listKey(x), ky = listKey(y);
        if (kx !== ky) return kx < ky ? 1 : -1;
        return (y.seq || 0) - (x.seq || 0);
      });
      listRowsKey = key;
    }
    // Drawn again only when something shown would change (018, perf check).
    var flashOn = !!(state.flash && Date.now() < state.flash.until) ? state.flash.id : '';
    var sig = key + '|' + Object.keys(waiting).sort().join(',') + '|' + Object.keys(refused).sort().join(',') + '|' + flashOn;
    // The entry just saved, when its day is not today (a time changed to before 5:00 AM or to
    // the evening before): a line says where it went (018-2; Agent V, W4).
    var bar = state.lastSaved, away = '';
    var bid = bar ? (bar.id || bar.fixId) : null;      // a change saved (019) has its entry in fixId
    if (day === today && bar && !bar.undone && bid && !barGone(bar) && newest[bid] &&
        newest[bid].state !== 'undone' && !!newest[bid].test === !!state.test) {
      var bd = (newest[bid].fields || {})['Log day'];
      if (typeof bd === 'string' && bd !== today) away = bd;
    }
    var awayFix = !!(away && bar.fix);
    if (armedId && !listRows.some(function (v) { return v.id === armedId; })) armedId = null;
    var locked = dayLocked();
    sig += '|' + away + '|' + awayFix + '|' + (armedId || '') + '|' + locked + '|' + today;
    renderDayHead(day, today, locked, listRows.length);
    if (sig !== listDrawn || !el('today').firstChild) { drawList(listRows, waiting, refused, away, awayFix, day !== today, locked, day); listDrawn = sig; }
  }).then(done, failed);
}
// Entries the sheet turned away and not since replaced by a newer version of them: a refused
// version older than the newest one no longer counts (019-2; Agent W, W3).
function refusedNow(outbox, newest) {
  var refused = {};
  outbox.forEach(function (x) {
    var pl = x && x.payload;
    if (!pl || pl.kind !== 'log' || x.status !== 'refused') return;
    var top = newest[pl.id];
    if (!top || typeof pl.version !== 'number' || pl.version >= top.version) refused[pl.id] = true;
  });
  return refused;
}
function listKey(v) {
  var f = v.fields || {};
  return String(f['Calendar date'] || f['Log day'] || '') + ' ' + String(f['Time'] || '');
}
function listScores(f, rows, out) {
  var scored = rows.filter(function (r) { return typeof f[r.key] === 'number'; });
  scored.forEach(function (r) { out.push(r.name + ' ' + signed(f[r.key])); });
  if (scored.length) rows.forEach(function (r) { if (scored.indexOf(r) < 0) out.push(r.name + ' not scored'); });
}
function listTime(t) { return typeof t === 'string' && /^\d\d:\d\d$/.test(t) ? ampm(t) : '—'; }
// What one entry shows: a title, detail lines, its words and small marks (G11, G018-4).
function listParts(f) {
  var title = [], details = [], words = [], marks = [];
  var screen = f['Screen'] || 'Intraday';
  if (screen === 'Morning') {
    title.push('Morning');
    var m = [];
    MORNING_TIMES.forEach(function (k) { if (f[k] !== undefined) m.push(k + ' ' + listTime(f[k])); });
    listScores(f, MORNING_SCORES.map(function (s) { return { key: s.key, name: s.key }; }), m);
    if (f['Phone before bed'] !== undefined) m.push('Phone before bed: ' + f['Phone before bed']);
    if (m.length) details.push(m.join(' · '));
    if (f['Sleep in own words'] !== undefined) words.push(['', f['Sleep in own words']]);
  } else if (screen === 'Evening') {
    title.push('Evening');
    var e = [], wd = [];
    listScores(f, EVENING_SCORES.map(function (s) { return { key: s.key, name: s.label }; }), wd);
    if (wd.length) e.push('Whole day: ' + wd.join(', '));
    EVENING_TIMES.forEach(function (k) { if (f[k] !== undefined) e.push(k + ' ' + listTime(f[k])); });
    if (e.length) details.push(e.join(' · '));
    if (f['Day notable'] === 'Yes') marks.push('Day notable');
    if (f['Day notable why'] !== undefined) words.push(['Why notable: ', f['Day notable why']]);
  } else {
    ['Shake', 'Medicine'].forEach(function (k) {
      if (f[k] === undefined) return;
      title.push(k + ' · ' + f[k]);
      if (f[k] === SOMETHING_ELSE && f[k + ' contents'] !== undefined) words.push([k + ': ', f[k + ' contents']]);
    });
    if (f['Workout'] !== undefined) {
      title.push('Workout · ' + f['Workout']);
      var end = f['Workout ended'];
      details.push(end === undefined ? listTime(f['Time']) + ', not ended yet'
                   : end === END_NOT_KNOWN ? listTime(f['Time']) + ' to an end time not known'
                   : listTime(f['Time']) + ' to ' + listTime(end));
    }
    var liq = LIQUIDS.filter(function (l) { return f[l.column] === 'Yes'; }).map(function (l) { return l.name; });
    if (liq.length) title.push('Liquids · ' + (liq.length === 1 ? liq[0] : liq.slice(0, -1).join(', ') + ' and ' + liq[liq.length - 1]));
    if (f['Other liquid, what'] !== undefined) words.push(['Liquids: ', f['Other liquid, what']]);
    if (f['Food or snack'] === 'Yes') title.push('Food');
    if (f['Food or snack, what'] !== undefined) words.push(['Food: ', f['Food or snack, what']]);
    if (f['Other'] !== undefined) { title.push('Other'); words.push(['Other: ', f['Other']]); }
    var sc = [];
    listScores(f, SCORE_ROWS.map(function (k) { return { key: k, name: k }; }), sc);
    if (sc.length) details.push(sc.join(' · '));
    if (f['Comments'] !== undefined) words.unshift(['', f['Comments']]);
    if (f['Notable'] === 'Yes') marks.push('Notable');
    if (f['Notable why'] !== undefined) words.push(['Why notable: ', f['Notable why']]);
    if (f['Personal'] === 'Yes') marks.push('Personal');
    if (!title.length) title.push(sc.length ? 'Scores' : 'Intraday');
  }
  // Semicolons between the things ticked, since a workout's kind can hold commas of its own (018-2; Agent V, W2; G018-6).
  return { title: title.join('; '), details: details, words: words, marks: marks };
}
function listDiv(cls, text) { var d = document.createElement('div'); d.className = cls; d.textContent = text; return d; }
// The list's heading: the day between the arrows, and on an earlier day Back to today and the read-only box (022, R96, R78).
function renderDayHead(day, today, locked, nrows) {
  var past = day !== today;
  listHeadDay = day;
  el('daytitle').textContent = (past ? '' : 'Today · ') + weekday(day) + ' ' + usDate(day);
  el('dayprev').disabled = !listFirstDay || day <= listFirstDay;
  el('daynext').disabled = !past;
  el('daytoday').hidden = !past;
  el('dayro').hidden = !past || !nrows;     // an empty earlier day: nothing to change, no box (022-3; Agent Y, 11)
  el('dayrotext').textContent = locked ? 'Read only. Tap Edit to change an entry on this day.'
                                       : 'You can change entries on this day: tap one, then Change this entry.';     // G022-4
  el('dayedit').hidden = !locked;
}
function drawList(rows, waiting, refused, away, awayFix, past, locked, day) {
  var box = el('today');
  box.textContent = '';
  box.classList.toggle('past', !!past);
  if (away) box.appendChild(listDiv('away', awayFix ? 'The entry you just changed is on ' + weekday(away) + ' ' + usDate(away) + ', not today; the ‹ arrow shows that day.'     // 022-3; Agent Y, 7
                                                    : 'The entry you just saved belongs to ' + weekday(away) + ' ' + usDate(away) + ', so it is not in today’s list. Each day in the list runs from 5:00 AM to 5:00 AM.'));
  var hint = document.querySelector('.listhint');
  if (hint) hint.hidden = !rows.length || !!past;      // no hint over an empty list (Agent W, N8), nor on an earlier day, where the grey box says it (022)
  if (!rows.length) { box.appendChild(listDiv('empty', past ? 'Nothing saved on this day.' : 'Nothing saved yet today.')); return; }
  var flash = state.flash && Date.now() < state.flash.until ? state.flash.id : null;
  rows.forEach(function (v) {
    var f = v.fields || {}, parts = listParts(f);
    var row = document.createElement('div');
    row.className = 'entry' + (flash && v.id === flash ? ' new' : '') + (armedId === v.id ? ' armed' : '');
    row.setAttribute('data-id', v.id);
    row.setAttribute('data-screen', f['Screen'] || 'Intraday');
    row.appendChild(listDiv('et', listTime(f['Time'])));
    var body = document.createElement('div');
    body.className = 'eb';
    body.appendChild(listDiv('ek', parts.title));
    parts.details.forEach(function (t) { body.appendChild(listDiv('ed', t)); });
    parts.words.forEach(function (w) { body.appendChild(listDiv('ew', w[0] + '“' + String(w[1]) + '”')); });
    if (parts.marks.length) body.appendChild(listDiv('em', parts.marks.join(' · ')));
    var ch = listChanged[v.id];
    if (ch) body.appendChild(listDiv('en chg', 'changed ' + whenOf(ch.date, ch.time, past ? day : dateStr(new Date()))));     // R89; with its date on an earlier day (022-3; Agent Y, 6)
    if (refused[v.id]) body.appendChild(listDiv('en bad', 'The sheet did not accept this'));
    else if (waiting[v.id]) body.appendChild(listDiv('en wait', 'waiting to send'));
    if (armedId === v.id) {
      var cb = document.createElement('button');
      cb.type = 'button';
      cb.className = 'chgbtn';
      cb.textContent = 'Change this entry';
      body.appendChild(cb);
    }
    row.appendChild(body);
    box.appendChild(row);
  });
}

function refreshStatus() {
  refreshList();                    // today's list follows every change the lines at the top follow (018)
  return Promise.all([DL.counts(), DL.get('kv', 'link'), DL.get('kv', 'codeProblem')]).then(function (a) {
    var c = a[0];
    if (!c.refused) return a;
    // Turned-away entries since replaced by a newer version that went are not counted (019-2; Agent W, W3).
    return Promise.all([DL.getAll('outbox'), newestEntries()]).then(function (b) {
      c.refused = Object.keys(refusedNow(b[0], b[1])).length;
      return a;
    }, function () { return a; });
  }).then(function (a) {
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
    // Storage could not be opened when the page opened, but can now (016).
    if (state.noStorage) { state.noStorage = false; refreshUnread(); }
    // The stored link could not be read when the page opened, but can now: use it (015).
    if (state.unread.link) {
      delete state.unread.link;
      state.link = old || null;
      state.test = !!(old && old.test);
      el('ver').textContent = 'page ' + PAGE_VERSION + (state.test ? ' · TEST' : '');
      refreshUnread();                  // the red line no longer names the link (015-2; Agent N, finding 3)
    }
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
        if (r === 'refused') { state.linkNote = ''; return DL.codeProblemFor(link); }
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
    showError('The link could not be kept: this phone’s storage refused. Nothing was changed.' + (unreadText() ? ' ' + unreadText() : ''));
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
  var fixing = fixOn(screen);
  el('else').hidden = screen !== 'Intraday' || !!state.fix;     // today's list: Intraday only (018, G018-1); hidden while changing an entry (G019-1, G021-2)
  el('fixbanner').hidden = !fixing;
  var fo = state.fix ? state.fix.orig : null;
  var fwhen = fo && isHM(fo['Time']) ? whenOf(calDateOf(fo), fo['Time'], dateStr(new Date())) : '';
  if (fixing) {
    var fs = fixScreenOf(state.fix);
    el('fixtitle').textContent = 'Changing your ' + (fs === 'Intraday' ? '' : fs + ' ') + 'entry of ' + fwhen;
  }
  // A Morning or Evening entry being changed while he is on Intraday: a line in place of today's list (G021-2).
  var away = !!state.fix && screen === 'Intraday' && !fixing;
  el('fixaway').hidden = !away;
  if (away) {
    var fa = fixScreenOf(state.fix);
    el('fixaway').textContent = 'You are changing your ' + fa + ' entry of ' + fwhen + '. Tap ' + fa +
                                ' at the top to save the changes or cancel them. The list comes back after that.';
  }
  document.body.classList.toggle('fixing', fixing);          // pale yellow while changing (020, R93)
  el('save').textContent = fixing ? 'Save changes to ' + (isHM(state.fix.orig['Time']) ? ampm(state.fix.orig['Time']) + ' ' : '') + 'entry' : 'Save';
  el('cancelfix').hidden = !fixing;
  var usig = JSON.stringify([fixExtra('Shake'), fixExtra('Medicine')]);
  if (usig !== usualSig) buildUsualChoices();

  // Green bar after Save (G10, D48)
  var bar = state.lastSaved;
  if (bar && barGone(bar)) bar = null;
  if (fixing) bar = null;                          // hidden while an entry is being changed (019-3, G019-1)
  var sb = el('savedbar');
  if (bar) {
    sb.hidden = false;
    var entryWhen = (bar.savedDate && bar.date !== bar.savedDate ? weekday(bar.date) + ' ' + usDate(bar.date) + ' ' : '') + ampm(bar.time);
    var title;
    if (bar.undone) {
      title = 'Undone: entry of ' + entryWhen;
    } else if (bar.fix) {
      title = 'Changes saved at ' + ampm(bar.savedTime || bar.time) + ' · entry time ' + entryWhen;
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
    el('undo').hidden = !!bar.undone || !!bar.fix || fixing;      // no Undo after Save changes (R90), nor while changing (G019-1)
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
  if (!el('tpad').hidden && (!state.tpadFor || state.tpadFor.screen !== screen || (state.tpadFor.end && !endBoxOn(screen)) ||
                              (state.tpadFor.fixEnd && !fixOn(screen)))) closeTpad();

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
  var dr = idr();
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
  // While an entry is being changed (019) the tile shows that entry's walk or workout, if it has one.
  var runShown = state.running && !fixOn('Intraday') ? state.running : null;
  el('lbl-Workout').textContent = runShown ? endLabel() : 'Workout';
  var won = runShown ? (dr.endTick || (stale && endAnswered(dr))) : !!dr.workout;
  tw.classList.toggle('on', won);
  tw.classList.toggle('end', !!runShown);
  tw.setAttribute('aria-pressed', won ? 'true' : 'false');
  el('p-Workout').hidden = !(dr.workout && !runShown);
  Array.prototype.forEach.call(document.querySelectorAll('#p-Workout .choice'), function (c) {
    var on = !!dr.workout && dr.workout.kind === c.getAttribute('data-name');
    c.classList.toggle('on', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  var rl = el('running');
  var fe = el('fixend'), feOn = false;
  if (fixOn('Intraday')) {
    var o = state.fix.orig, w = o['Workout'] === 'Walk' ? 'walk' : 'workout';
    rl.hidden = o['Workout'] === undefined;
    if (o['Workout'] === undefined) rl.textContent = '';
    else if (state.running && state.running.id === state.fix.id) {
      rl.textContent = 'This ' + w + ' is still running. Its start is the time at the top. End it after you save or cancel.';
    } else if (o['Workout ended'] !== undefined) {
      // Its end can be changed here (021, R95).
      rl.textContent = 'This ' + w + ' started at the time at the top. Tap its end time below to change it.';
      feOn = true;
      renderFixEnd(state.fix, w);
    } else {
      rl.textContent = 'Its start is the time at the top.';
    }
  } else if (state.running && (!stale || dr.endTick)) {
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
  fe.hidden = !feOn;
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
  var dr = draftOf('Morning');
  MORNING_TIMES.forEach(function (k) { setTimeButton(document.querySelector('.tset[data-s="Morning"][data-k="' + k + '"]'), dr.times[k]); });
  Array.prototype.forEach.call(document.querySelectorAll('#phone .ynb'), function (b) {
    var on = dr.phone === b.getAttribute('data-v');
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (el('sleepwords').value !== dr.words) el('sleepwords').value = dr.words;
}

function renderEvening() {
  var dr = draftOf('Evening');
  EVENING_TIMES.forEach(function (k) { setTimeButton(document.querySelector('.tset[data-s="Evening"][data-k="' + k + '"]'), dr.times[k]); });
  el('daynotable').checked = dr.notable;
  el('tk-daynotable').classList.toggle('on', dr.notable);
  el('daywhywrap').hidden = !dr.notable;
  if (el('daywhy').value !== dr.why) el('daywhy').value = dr.why;
}

// The end of an ended walk or workout being changed (021, R95): its time (tap to change) and Don't know.
function renderFixEnd(fx, w) {
  var end = fixEndNow(fx), ne = fx.dr.newEnd;
  var b = el('fixendset');
  if (end === END_NOT_KNOWN) { b.textContent = 'not known'; b.classList.add('set'); }
  else setTimeButton(b, isHM(end) ? end : null);
  if (ne && !ne.unknown && ne.date && ne.date !== fx.dr.fixed.date) b.textContent = weekday(ne.date) + ' ' + usDate(ne.date) + ' ' + ampm(ne.time);
  var dk = el('fixendunknown');
  dk.classList.toggle('on', end === END_NOT_KNOWN);
  dk.setAttribute('aria-pressed', end === END_NOT_KNOWN ? 'true' : 'false');
  var was = fx.orig['Workout ended'];
  el('fixendnote').textContent = ne && end !== was
    ? 'Changed from ' + (was === END_NOT_KNOWN ? 'not known' : listTime(was)) + '. Saved when you tap Save changes.'
    : 'The ' + w + '’s end can be changed, not taken off.';
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
  if (state.fix && state.fix.id === r.id) note.textContent = 'You are changing this ' + (r.kind === 'Walk' ? 'walk' : 'workout') + ' on Intraday. Tap Save changes or Cancel there first, then end it here.';
}

// The entry's time (G2, G21, G23, G26)
function renderWhen() {
  var dr = cur();
  var shown = dr.fixed || { date: dateStr(new Date()), time: timeStr(new Date()) };
  el('whendate').textContent = weekday(shown.date) + ' ' + usDate(shown.date) + ' · ';
  el('whentime').textContent = ampm(shown.time);
  var ld = logDayOf(shown.date, shown.time);
  var notToday = !!dr.fixed && ld !== currentLogDay() && !earlierFixDay();     // a half-filled screen from an earlier day (Agent Q, W5); not an earlier day's entry being changed (022)
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
var usualSig = '';
function buildUsualChoices() {
  usualSig = JSON.stringify([fixExtra('Shake'), fixExtra('Medicine')]);
  USUAL_KINDS.forEach(function (kind) {
    var box = el('c-' + kind);
    box.textContent = '';
    var extra = fixExtra(kind);     // while changing an entry: the usual one it recorded, if no longer in use (019)
    var why = usualsNote(kind);
    if (why) {
      var n = document.createElement('div');
      n.className = 'pnote';
      n.setAttribute('data-why', why.why);
      n.textContent = why.text;
      box.appendChild(n);
    }
    USUALS[kind].map(function (u) { return { name: u.name, contents: u.contents }; })
      .concat(extra ? [extra] : [])
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
          if (!idr()[kind]) idr()[kind] = { pick: o.name, what: '' };
          idr()[kind].pick = o.name;
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
      idr()[kind] = idr()[kind] ? null : { pick: USUALS[kind].length ? USUALS[kind][0].name : SOMETHING_ELSE, what: '' };
      settle();
      storeDraft(true);
      render();
    });
    el('w-' + kind).setAttribute('maxlength', String(WHAT_MAX));
    el('w-' + kind).addEventListener('input', function () {
      touch();
      if (idr()[kind]) idr()[kind].what = el('w-' + kind).value;
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
      if (fixOn('Intraday') && !idr().workout) return;
      touch();
      if (!idr().workout) idr().workout = { kind: null };
      idr().workout.kind = k;
      el('nothing').hidden = true;
      storeDraft(true);
      render();
    });
    el('c-Workout').appendChild(b);
  });
  el('t-Workout').addEventListener('click', function () {
    if (fixOn('Intraday')) {        // a walk or workout can't be added or taken off a saved entry (019, G019-4)
      showNote(idr().workout ? 'A walk or workout can’t be taken off a saved entry. You can change its kind.'
                             : 'A walk or workout can’t be added to a saved entry. Tap Cancel, then start it as a new entry.');
      return;
    }
    if (state.running && isStale() && !idr().endTick) {        // ended in the box above (R80)
      try { el('endq').scrollIntoView({ block: 'center' }); } catch (e) { /* ignore */ }
      openTpad({ screen: 'Intraday', end: true }, el('endrow'));
      return;
    }
    touch();
    if (state.running) idr().endTick = !idr().endTick;
    else idr().workout = idr().workout ? null : { kind: null };
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
      if (!idr().liquids) idr().liquids = { coffee: false, water: false, other: false, what: idr().liqWhat || '' };
      idr().liquids[l.key] = !idr().liquids[l.key];
      el('nothing').hidden = true;
      storeDraft(true);
      render();
      if (l.key === 'other' && idr().liquids.other) el('w-Liquids').focus();
    });
    el('c-Liquids').appendChild(b);
  });
  el('t-Liquids').addEventListener('click', function () {
    touch();
    // Taking Liquids off keeps the Something else words for when it is tapped again, as Food and Other do (Agent C, W2).
    if (idr().liquids) {
      idr().liqWhat = idr().liquids.what || '';
      idr().liquids = null;
    } else {
      idr().liquids = { coffee: false, water: false, other: false, what: idr().liqWhat || '' };
    }
    settle();
    storeDraft(true);
    render();
  });
  el('w-Liquids').setAttribute('maxlength', String(WHAT_MAX));
  el('w-Liquids').addEventListener('input', function () {
    touch();
    if (idr().liquids) idr().liquids.what = el('w-Liquids').value;
    limitNote('w-Liquids', WHAT_MAX, 'That line');
    storeDraft(false);
  });
  // Food (R84): the tap, and words if he wants (R66).
  el('t-Food').addEventListener('click', function () {
    touch();
    idr().food.on = !idr().food.on;
    settle();
    storeDraft(true);
    render();
    if (idr().food.on) el('food').focus();
  });
  el('food').setAttribute('maxlength', String(FOOD_MAX));
  el('food').addEventListener('input', function () {
    touch();
    idr().food.text = el('food').value;
    limitNote('food', FOOD_MAX, 'The Food box');
    settle();
    storeDraft(false);
  });
  el('t-Other').addEventListener('click', function () {
    touch();
    idr().other.on = !idr().other.on;
    settle();
    storeDraft(true);
    render();
    if (idr().other.on) el('other').focus();
  });
  el('other').setAttribute('maxlength', String(OTHER_MAX));
  el('other').addEventListener('input', function () {
    touch();
    idr().other.text = el('other').value;
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
      var md = draftOf('Morning');
      md.phone = md.phone === v ? null : v;      // tap again clears
      settle();
      storeDraft(true);
      render();
    });
  });
  el('sleepwords').setAttribute('maxlength', String(WORDS_MAX));
  el('sleepwords').addEventListener('input', function () {
    touch();
    draftOf('Morning').words = el('sleepwords').value;
    limitNote('sleepwords', WORDS_MAX, 'Sleep in your own words');
    settle();
    storeDraft(false);
  });
  el('daywhy').setAttribute('maxlength', String(WHY_MAX));
  el('daynotable').addEventListener('change', function () {
    touch();
    draftOf('Evening').notable = el('daynotable').checked;
    settle();
    storeDraft(true);
    render();
    if (draftOf('Evening').notable) el('daywhy').focus();
  });
  el('daywhy').addEventListener('input', function () {
    touch();
    draftOf('Evening').why = el('daywhy').value;
    limitNote('daywhy', WHY_MAX, 'The Why line');
    settle();
    storeDraft(false);
  });
  el('endset').addEventListener('click', function () {
    openTpad({ screen: state.screen, end: true }, el('endrow'));
  });
  // The end of the walk or workout being changed (021, R95).
  el('fixendset').addEventListener('click', function () {
    if (!fixOn('Intraday') || state.screen !== 'Intraday') return;
    openTpad({ screen: 'Intraday', fixEnd: true }, el('fixendrow'));
  });
  el('fixendunknown').addEventListener('click', function () {
    if (!fixOn('Intraday') || state.screen !== 'Intraday') return;
    state.interacted = true;
    state.fix.dr.newEnd = { unknown: true };        // sets "not known"; a time is given again by typing it (G021-4)
    clearFixLine();                                   // 021-3
    closeTpad();
    storeDraft(true);
    render();
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
  el('tpadlabel').textContent = target.end || target.fixEnd ? 'Ended at' : target.key;
  el('tpadinput').value = '';
  var dr = draftOf(target.screen);
  var has = target.fixEnd ? false : target.end ? endAnswered(dr) && !!dr.endAns.time : !!dr.times[target.key];   // no Clear for a changed end (R95)
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
  if (t.fixEnd) {
    // A new end for the ended walk or workout being changed (021, R95), worked out from its start as it now stands.
    var fx = state.fix;
    if (!fixOn('Intraday') || !fx || fx.orig['Workout ended'] === undefined) { closeTpad(); render(); return; }
    var kind = fx.orig['Workout'];
    var pr = { kind: kind, startAt: dr.fixed.at || momentOf(dr.fixed.date, dr.fixed.time).getTime(),
               startDate: dr.fixed.date, startTime: dr.fixed.time };
    var fm = endMoment(pr, hhmm, new Date());
    if (!fm.ok) {
      el('tpadmsg').textContent = fm.msg;
      el('tpadmsg').className = 'padmsg bad';
      return;
    }
    var fh = (fm.at - Math.floor(pr.startAt / 60000) * 60000) / 3600000;
    var fk = fx.id + '|' + hhmm;
    if (fh > LONG_HOURS && state.longOk !== fk) {
      state.longOk = fk;
      el('tpadmsg').textContent = 'That makes the ' + (kind === 'Walk' ? 'walk' : 'workout') + ' more than ' + LONG_HOURS +
        ' hours long (' + whenOf(pr.startDate, pr.startTime, dateStr(new Date())) + ' to ' + whenOf(fm.date, hhmm, pr.startDate) +
        '). Tap ' + half + ' again to keep it, or type a different time.';
      el('tpadmsg').className = 'padmsg bad';
      return;
    }
    state.longOkEnd = fh > LONG_HOURS ? fx.id + '|' + hhmm + '|' + pr.startAt : null;   // asked at the pad (021-2)
    state.longOk = null;
    state.interacted = true;
    dr.newEnd = { unknown: false, time: hhmm, at: fm.at, date: fm.date, from: pr.startAt };
    clearFixLine();                                   // 021-3
  } else if (t.end) {
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
  if (t.fixEnd) { closeTpad(); render(); return; }          // an end is never taken off (R95)
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
// The earlier day of the entry being changed on this screen, if it is one (022): its Edit keeps it on that day (R97).
function earlierFixDay() {
  if (!fixOn(state.screen)) return null;
  var d = state.fix.orig['Log day'];
  return isDay(d) && d < currentLogDay() ? d : null;
}
// A time typed for an entry of an earlier day: on that day, before 5:00 AM the early morning after it (R75, R97).
function timeOnDay(four, day) {
  var H = Number(four.slice(0, 2)), M = Number(four.slice(2, 4));
  if (H > 23 || M > 59) return null;
  var time = p2(H) + ':' + p2(M);
  var date = H < DAY_STARTS_AT ? dayAfter(day) : day;
  var t = momentOf(date, time);
  if (timeStr(t) !== time || dateStr(t) !== date) return { skipped: true };     // a time the clocks skipped that night (022-3; Agent Y, 3)
  var later = new Date(t.getTime() + 3600000);
  if (timeStr(later) === time && dateStr(later) === date) t = later;            // the hour that repeats: the later one, as editedTime (Agent Y, 2)
  return { date: date, time: time, at: t.getTime() };
}
function openPad() {
  closeTpad();
  el('pad').hidden = false;
  el('padinput').value = '';
  var ed = earlierFixDay();
  el('padmsg').textContent = 'Type the time, like 205 or 1130, then tap AM or PM.' + (ed ? ' It stays on ' + weekday(ed) + ' ' + usDate(ed) + '.' : '');
  el('padmsg').className = 'padmsg';
  el('padinput').focus();
}
function closePad() { el('pad').hidden = true; }
function padShowing(id) { var p = el(id); return !p.hidden && p.offsetParent !== null; }
function setFromPad(half) {
  var four = typedTime(el('padinput').value.trim(), half);
  var ed = earlierFixDay();
  var got = four ? (ed ? timeOnDay(four, ed) : editedTime(four, new Date())) : null;
  if (got && got.skipped) {
    el('padmsg').textContent = 'There was no ' + ampm(four.slice(0, 2) + ':' + four.slice(2)) + ' that night: the clocks went forward an hour. Type another time.';
    el('padmsg').className = 'padmsg bad';
    return;
  }
  if (!got) {
    el('padmsg').textContent = 'Not a time. Type it like 205 or 1130, then tap AM or PM.';
    el('padmsg').className = 'padmsg bad';
    return;
  }
  state.interacted = true;
  var dr = cur();
  dr.fixed = got;
  dr.edited = true;
  // The "another day" question is about the time asked; a new time asks again if needed (020-2; Agent W, W3).
  if (fixOn(state.screen)) {
    state.fixConfirm = null;
    clearFixLine();                                   // asked again at Save changes if it still applies (021-3)
  }
  storeDraft(true);
  closePad();
  render();
}

function showScreen(s) {
  if (SCREENS.indexOf(s) < 0 || s === state.screen) return;
  armedId = null;                   // the Change button goes when he leaves Intraday (020)
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
  // First of all: taps in the screen just after it jumped are dropped (019-2; Agent W, W1).
  document.addEventListener('click', function (e) {
    var now = Date.now();
    if (tapShield - now > 5 * TAP_SHIELD_MS) tapShield = 0;     // the phone's clock was set back: no long shield (022-3; Agent Y, 8)
    if (now >= tapShield) return;
    var t = e.target;
    if (t && t.closest && t.closest('main')) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
  el('save').addEventListener('click', function () { if (fixOn(state.screen)) saveFix(); else save(); });
  el('cancelfix').addEventListener('click', function () { cancelFix(''); });
  // Tapping an entry in today's list opens it to change (019, R88).
  // From 020 a tap only shows "Change this entry" under the entry; that button opens it (R92).
  el('today').addEventListener('click', function (e) {
    var t = e.target;
    var row = t && t.closest ? t.closest('.entry') : null;
    if (!row || !row.getAttribute('data-id')) return;
    var id = row.getAttribute('data-id');
    if (dayLocked()) return;                                   // an earlier day is read only until Edit (R78; 022)
    shieldTaps(TAP_SHIELD_MS);
    if (t.closest('.chgbtn')) {
      var since = Date.now() - armedAt;
      if (since >= 0 && since < ARMED_MS) return;                   // (a clock set back since: no wait, 022-3)             // the button only just appeared under his finger (020-2)
      armedId = null; openFix(id); return;
    }
    armedId = armedId === id ? null : id;
    armedAt = Date.now();
    refreshList();
  });
  // Earlier days (022, R96): the arrows step a day at a time; Edit unlocks the day shown (R78).
  el('dayprev').addEventListener('click', function () {
    var d = dayBefore(shownDay());
    if (!listFirstDay || d < listFirstDay) return;
    showDay(d);
  });
  el('daynext').addEventListener('click', function () { if (shownDay() !== currentLogDay()) showDay(dayAfter(shownDay())); });
  el('daytoday').addEventListener('click', function () { showDay(null); });
  el('dayedit').addEventListener('click', function () {
    var d = shownDay();
    if (d === currentLogDay() || d !== listHeadDay) return;          // only the day he sees (022-3)
    listEditDay = d;
    shieldTaps(TAP_SHIELD_MS);      // the box changes under his finger
    refreshList();
  });
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
    idr().comments = el('comments').value;
    limitNote('comments', COMMENT_MAX, 'Comments');
    settle();
    if (!idr().fixed) renderWhen();
    storeDraft(false);
  });
  el('notable').addEventListener('change', function () {
    touch();
    idr().notable = el('notable').checked;
    settle();
    storeDraft(true);
    render();
    if (idr().notable) el('why').focus();
  });
  el('why').addEventListener('input', function () {
    touch();
    idr().why = el('why').value;
    limitNote('why', WHY_MAX, 'The Why line');
    settle();
    if (!idr().fixed) renderWhen();
    storeDraft(false);
  });
  el('personal').addEventListener('change', function () {
    touch();
    idr().personal = el('personal').checked;
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
      // His changes not yet stored are written at once first, as at closing: the comparing
      // write below waits for its reads, and the page can be stopped in that moment (016-5; Agent T, F1).
      storeAtClose();
      // Not while a screen could not be read: what he typed there is not stored (015-2; Agent N, finding 2).
      storeDraft(true).then(function () { if (state.reloadWhenHidden && !unreadScreen()) location.reload(); });
    } else {
      listGen++;                    // read today's list again on coming back (018)
      catchUp();                    // another open copy may have changed things meanwhile (016)
      render();
      kick();
      checkForNewVersion();
    }
  });
  window.addEventListener('pagehide', storeAtClose);
  // His own taps and typing on the screen in front (anything but the headings, the
  // green bar, the lines and Save), counted only to decide what is written at closing (016-4).
  ['click', 'input', 'change'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.closest('main') || t.closest('#savedbar, #error, #status, #save, #nothing, #else, #cancelfix, #fixbanner')) return;
      var k = screenKey(state.screen);
      state.edits[k] = (state.edits[k] || 0) + 1;
    }, true);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { listGen++; catchUp(); } });
  try {
    var bc = new BroadcastChannel('daylog');
    keptChannel = bc;               // this page's own messages do not come back to it
    bc.onmessage = function (e) {
      // Another open copy saved or undid something ('kept'): today's list reads the entries
      // again. A finished send ('changed', also this page's own) touches only what waits to
      // be sent, which the list reads every time anyway (018-2; Agent V, F1).
      if (e && e.data === 'kept') listGen++;
      refreshStatus();
      if (e && e.data === 'kept' && document.visibilityState === 'visible') catchUp();
    };
  } catch (e) { /* not available */ }

  // The clock at the top moves until the first tap (G26); the green bar goes at
  // 05:00, when the check marks and the End box are looked at again too.
  var lastDay = currentLogDay();
  setInterval(function () {
    var b = state.lastSaved;
    if (!cur().fixed) renderWhen();
    if (b && barGone(b) && !el('savedbar').hidden) render();
    var d = currentLogDay();
    if (d !== lastDay) { lastDay = d; armedId = null; refreshDone(); render(); }     // the Change button goes at 5:00 AM (022-3)
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

// The six things kept for him on the phone, read when the page opens, with
// what the red line calls each one if it cannot be read (015).
var KEPT = [['draft', 'the half-filled Intraday screen'], ['lastSaved', 'the green bar of your last Save'],
            ['link', 'the link to your sheet'], ['running', 'whether a walk or workout is running'],
            ['draft-Morning', 'the half-filled Morning screen'], ['draft-Evening', 'the half-filled Evening screen'],
            [KEY_FIX, 'a change you were making to an entry']];
function readKept(key) {
  var once = function () { return DL.get('kv', key).then(function (v) { return { ok: true, value: v }; }); };
  return once().catch(function () { return once(); }).catch(function () { return { ok: false }; });
}
function readAllKept() { return Promise.all(KEPT.map(function (k) { return readKept(k[0]); })); }
function andList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
// Screens holding an end given for a walk or workout that could not be read (015-3).
function heldEnds() {
  var out = [];
  if (state.draft && (state.draft.endTick || state.draft.endAns)) out.push('Intraday');
  if (state.edraft && state.edraft.endAns) out.push('Evening');
  return out;
}
function unreadScreen() { return SLOTS.some(function (k) { return !!state.unread[k]; }); }
// The red line about what could not be read, or '' when everything was (015).
function unreadText() {
  // Storage not opened at all: nothing can be saved, whatever arrives (016; session 15 records check).
  if (state.noStorage) {
    return 'This phone’s storage could not be opened, so nothing can be saved. Close the page and open it again; if it keeps happening, tell Claude.';
  }
  var missed = KEPT.filter(function (k) { return state.unread[k[0]]; }).map(function (k) { return k[1]; });
  if (!missed.length) return '';
  var screens = SCREENS.filter(function (s) { return state.unread[draftKey(s)]; });
  var held = heldEnds();
  return 'This phone could not read part of what it keeps: ' + andList(missed) + '. ' +
         (!state.unread.running ? 'You can still save. ' :
          !held.length ? 'You can still save, but not start or end a walk or workout. ' :
          'A walk or workout can’t be started or ended until it can be read, and the ' + andList(held) + ' screen' +
          (held.length > 1 ? 's, which hold' : ', which holds') + ' an end you gave, can’t be saved until then. ') +
         (screens.length ? 'Anything you type on ' + (screens.length === 1 ? 'that screen' : 'those screens') +
                           ' is kept only once you tap Save. ' : '') +
         'Close the page and open it again; if this keeps happening, tell Claude.';
}
var unreadShown = '';
function showUnread(scroll) {
  var t = unreadText();
  unreadShown = t;
  if (!t) return;
  if (scroll) { showError(t); return; }
  el('error').textContent = t;
  el('error').hidden = false;
}
// When something more could be read later (the link, 015-2): the line is brought up to date
// if it is the one showing.
function refreshUnread() {
  var e = el('error');
  if (e.hidden || e.textContent !== unreadShown) return;
  if (unreadText()) showUnread(false); else { unreadShown = ''; e.hidden = true; }
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
  var usualsRead = readKept('usuals');     // also tried twice (015-2; Agent N, note 5)
  // From 015 the six things kept for him are read one by one, each tried twice,
  // so one that cannot be read does not throw the others away (Q37). One that
  // still cannot be read is listed in state.unread and never written over or
  // deleted while the page is open (storeDraft, save, undo).
  readAllKept().then(function (r) {
    if (r.some(function (x) { return x.ok; })) return { r: r, opens: true };
    // Nothing could be read. If storage opens now, everything is read once more (015-2; Agent N, note 4).
    return DL.db().then(function () {
      return readAllKept().then(function (r2) {
        usualsRead = usualsRead.then(function (u) { return u.ok ? u : readKept('usuals'); });
        return { r: r2, opens: true };
      });
    }, function () { return { r: r, opens: false }; });
  }).then(function (res) {
    var r = res.r;
    return usualsRead.then(function (u) {
      state.reading = false;
      loadUsuals(u);
      var got = {}, missed = [];
      KEPT.forEach(function (k, i) {
        if (r[i].ok) got[k[0]] = r[i].value;
        else { state.unread[k[0]] = true; missed.push(k[1]); }
      });
      // Each of the five is taken as read, and remembered for comparing before
      // writing (016); a damaged one counts as not read (Agent N, note 7).
      GUARDED.forEach(function (k) {
        if (!state.unread[k] && !take(k, got[k])) missed.push(k);
      });
      state.loaded = true;
      state.link = got['link'] || null;
      state.test = !!(state.link && state.link.test);
      state.noStorage = !res.opens;
      buildUsualChoices();
      render();
      askToKeepStorage();
      if (state.noStorage || missed.length) showUnread(true);
      // A link arriving is taken even then: applyLink reads the stored link itself (Q37).
      return applyLink(arrived);
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
