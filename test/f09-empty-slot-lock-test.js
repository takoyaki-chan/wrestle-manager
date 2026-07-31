'use strict';

// test/f09-empty-slot-lock-test.js — task-70
//
// Bug: buildF09MatchPairs() can return a pair whose fighterIdA/fighterIdB no
// longer resolves to an active roster fighter (departed/released mid-week,
// or injured/forcedRest — none of which buildF09MatchPairs filters out,
// and this file is not allowed to touch factions.js). The old F09 injection
// code in src/ui-render.js locked every slot in [0, slots) unconditionally,
// so an unresolvable pair produced a slot that *looked* empty
// ("— 選手選択 —") but could never be clicked, because _spOpenPicker's F09
// guard only checked the _f09Locked flag, not whether the slot was actually
// filled. That is a dead-end card slot (see docs/ui/mockup-baseline-v0.1.md
// §5-D — no dead ends, ever).
//
// This test extracts the two pieces of logic this task is scoped to touch
// (src/ui-render.js only) as isolated snippets — the F09 injection block and
// the _spOpenPicker guard — and exercises them directly, the same technique
// used by test/faction-f09-show-flow-guard-test.js and
// test/rivalry-resolution-match-guard-test.js for other renderShowPrep-owned
// logic that can't be loaded wholesale (it depends on `document`).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8')
  .replace(/\r\n/g, '\n');

// ── extract the F09 injection block ────────────────────────────────────────
function buildF09Injection(source) {
  const startMarker = '// ── F09 注入: _pendingF09 が立っていれば派閥対抗戦カードを強制組込み ──';
  const endMarker = '// ── F08 ディレクティブ注入:';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'F09 injection block not found (markers moved?)');
  const blockSrc = source.slice(start, end);
  // The block only touches its `G`/`Engine` parameters and reassigns `G`
  // (never mutates the caller's object), so it is safe to run as an
  // isolated function body.
  return new Function('G', 'Engine', `${blockSrc}\nreturn G;`);
}

// ── extract _spOpenPicker (a standalone function) ──────────────────────────
function buildOpenPicker(source) {
  const start = source.indexOf('function _spOpenPicker');
  assert.ok(start >= 0, '_spOpenPicker not found');
  const brace = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  assert.ok(end > 0, '_spOpenPicker end not found');
  const fnSrc = source.slice(start, end + 1);
  // _spOpenPicker reads/writes the module-level `let _spActivePicker`.
  // Declare it in the wrapper's scope so the extracted function closes over
  // it, and expose get/set so the test can observe/seed it.
  const wrapperSrc = `
    let _spActivePicker = null;
    ${fnSrc}
    return {
      open: _spOpenPicker,
      getActivePicker: () => _spActivePicker,
    };
  `;
  return new Function('G', 'showToast', 'Audio', 'renderShowPrep', wrapperSrc);
}

const applyF09Injection = buildF09Injection(uiSrc);
const openPickerFactory = buildOpenPicker(uiSrc);

function makeFighter(id, extra = {}) {
  return { id, name: `F${id}`, injury: null, forcedRest: false, ...extra };
}

function withWarnCapture(fn) {
  const calls = [];
  const orig = console.warn;
  console.warn = (...args) => calls.push(args);
  try {
    fn();
  } finally {
    console.warn = orig;
  }
  return calls;
}

// ── 1) incomplete pairs must not lock an empty slot ────────────────────────
{
  const roster = [
    makeFighter(11), makeFighter(21),                    // pair 0: both healthy → should lock
    makeFighter(12), makeFighter(22, { forcedRest: true }), // pair 1: partner forced-rest
    makeFighter(13),                                      // pair 2: partner (23) departed — absent from roster entirely
  ];
  const showCard = [
    { left: 0, right: 0, isTitle: false },
    { left: 0, right: 0, isTitle: false },
    { left: 0, right: 0, isTitle: false },
    { left: 11, right: 99, isTitle: false }, // pre-existing booking referencing fighter 11 (to check stripping still works)
  ];
  const G = {
    season: 3, week: 24, roster, showCard,
    _pendingF09: { factionAId: 100, factionBId: 200 },
  };
  const Engine = {
    factions: {
      buildF09MatchPairs: () => ([
        { fighterIdA: 11, fighterIdB: 21 },
        { fighterIdA: 12, fighterIdB: 22 },
        { fighterIdA: 13, fighterIdB: 23 },
      ]),
    },
  };

  let next;
  const warnCalls = withWarnCapture(() => {
    next = applyF09Injection(G, Engine);
  });

  assert.strictEqual(next.showCard[0].left, 11);
  assert.strictEqual(next.showCard[0].right, 21);
  assert.strictEqual(next.showCard[0]._f09Locked, true, 'a fully-formed pair keeps its lock');

  assert.strictEqual(next.showCard[1].left, 0);
  assert.strictEqual(next.showCard[1].right, 0);
  assert.ok(!next.showCard[1]._f09Locked, 'a forced-rest partner must leave the slot open, not locked-empty');

  assert.strictEqual(next.showCard[2].left, 0);
  assert.strictEqual(next.showCard[2].right, 0);
  assert.ok(!next.showCard[2]._f09Locked, 'an unresolvable (departed) fighter id must leave the slot open, not locked-empty');

  assert.strictEqual(next.showCard[3].left, 0, 'fighter locked into a valid F09 pair must still be stripped from other slots');
  assert.strictEqual(next.showCard[3].right, 99, 'unrelated fighters in other slots must be left alone');

  assert.strictEqual(next._pendingF09, G._pendingF09, '_pendingF09 stays active while at least one pair still resolves');
  assert.strictEqual(warnCalls.length, 2, 'both incomplete pairs should be logged for diagnosis');
  for (const call of warnCalls) {
    const [msg, ctx] = call;
    assert.ok(String(msg).includes('[WM F09]'));
    assert.deepStrictEqual(Object.keys(ctx).sort(), ['fighterIdA', 'fighterIdB', 'pairCount', 'season', 'showCardLength', 'slotIdx', 'week'].sort());
  }
}

// ── 2) a fully-healthy F09 setup still locks every slot as before (regression) ──
{
  const roster = [1, 2, 3, 4, 5, 6].map(id => makeFighter(id));
  const showCard = [0, 1, 2].map(() => ({ left: 0, right: 0, isTitle: false }));
  const G = { season: 1, week: 12, roster, showCard, _pendingF09: { factionAId: 1, factionBId: 2 } };
  const Engine = {
    factions: {
      buildF09MatchPairs: () => ([
        { fighterIdA: 1, fighterIdB: 4 },
        { fighterIdA: 2, fighterIdB: 5 },
        { fighterIdA: 3, fighterIdB: 6 },
      ]),
    },
  };
  const next = applyF09Injection(G, Engine);
  for (let i = 0; i < 3; i++) {
    assert.strictEqual(next.showCard[i]._f09Locked, true, `slot ${i} of a fully-formed F09 card should stay locked`);
    assert.ok(next.showCard[i].left > 0 && next.showCard[i].right > 0, `slot ${i} should be filled`);
  }
}

// ── 3) no pairs at all still clears _pendingF09 (unrelated existing behavior) ──
{
  const G = { season: 1, week: 12, roster: [], showCard: [{ left: 0, right: 0, isTitle: false }], _pendingF09: { factionAId: 1, factionBId: 2 } };
  const Engine = { factions: { buildF09MatchPairs: () => ([]) } };
  const next = applyF09Injection(G, Engine);
  assert.strictEqual(next._pendingF09, undefined, 'zero pairs should still drop _pendingF09 as before');
}

// ── 4) picker: a locked-but-empty F09 slot must always open (last-resort guard) ──
function makeHarness(showCard) {
  const G = { season: 5, week: 10, showCard };
  const toastCalls = [];
  const showToast = (msg) => toastCalls.push(msg);
  const audioCalls = [];
  const Audio = { play: (name) => audioCalls.push(name) };
  const renderCalls = { count: 0 };
  const renderShowPrep = () => { renderCalls.count++; };
  const picker = openPickerFactory(G, showToast, Audio, renderShowPrep);
  return { G, picker, toastCalls, audioCalls, renderCalls };
}

{
  const h = makeHarness([{ left: 0, right: 0, isTitle: false, _f09Locked: true }]);
  const warnCalls = withWarnCapture(() => h.picker.open(0, 'left'));
  assert.deepStrictEqual(h.picker.getActivePicker(), { slotIdx: 0, side: 'left' },
    'a locked-but-empty F09 slot must open the picker (no dead end)');
  assert.strictEqual(h.toastCalls.length, 0, 'no lock toast should fire when the slot is actually empty');
  assert.strictEqual(h.renderCalls.count, 1, 'renderShowPrep should run to show the opened picker');
  assert.strictEqual(warnCalls.length, 1, 'the unexpected lock state should be logged for diagnosis');
}

// ── 5) a properly-formed F09 slot stays locked (unchanged behavior) ────────
{
  const h = makeHarness([{ left: 11, right: 21, isTitle: false, _f09Locked: true }]);
  h.picker.open(0, 'left');
  assert.strictEqual(h.picker.getActivePicker(), null, 'a fully-formed F09 match must stay locked');
  assert.strictEqual(h.toastCalls.length, 1);
  assert.ok(h.toastCalls[0].includes('F09'));
}

// ── 6) F08 lock stays absolute even on an empty slot (must not regress) ────
{
  const h = makeHarness([{ left: 0, right: 0, isTitle: false, _f08Locked: true }]);
  h.picker.open(0, 'left');
  assert.strictEqual(h.picker.getActivePicker(), null, 'F08 lock must not gain the F09 empty-slot bypass');
  assert.strictEqual(h.toastCalls.length, 1);
  assert.ok(h.toastCalls[0].includes('直接対決'));
}

// ── 7) 派閥内序列戦 lock stays absolute even on an empty slot (must not regress) ──
{
  const h = makeHarness([{ left: 0, right: 0, isTitle: false, _internalChallengeLocked: true }]);
  h.picker.open(0, 'left');
  assert.strictEqual(h.picker.getActivePicker(), null, '派閥内序列戦ロック must not gain the F09 empty-slot bypass');
  assert.strictEqual(h.toastCalls.length, 1);
  assert.ok(h.toastCalls[0].includes('序列戦'));
}

console.log('f09-empty-slot-lock-test: ok');
