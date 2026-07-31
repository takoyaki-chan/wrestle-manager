'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\nif \(typeof module !== 'undefined'[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js',
].forEach(loadAsGlobal);

function phaseLabel(state) {
  if (state.offSeason && state.offWeek === 1 && state.pendingAwards) return 'awards';
  if (state.offSeason && state.offWeek === 2) return 'contract';
  return state.weekPhase;
}

let state = Engine.createInitialState(46001, true);
state = {
  ...state,
  week: 47,
  offSeason: false,
  offWeek: 0,
  weekPhase: 'manage',
  ppvUnlocked: false,
  ppvPhase: null,
  funds: 5000,
};

const trace = [];
const record = () => trace.push(`S${state.season} W${state.week}${state.offSeason ? `/OFF${state.offWeek}` : ''}:${phaseLabel(state)}`);
record();

// 第47週から第48週へ: TV PPV を必ず一度だけ開始する。
state = Engine.advanceWeek(state).state;
record();
assert.strictEqual(state.week, 48);
assert.strictEqual(state.weekPhase, 'ppvTV');
assert.strictEqual(state.ppvPhase, 'tv');

// App.closePPVTV と同じく週次精算後に ppvPhase を消して進める。
state = Engine.tickWeek(state).state;
record();
state = { ...state, ppvPhase: null };
state = Engine.advanceWeek(state).state;
record();
assert.strictEqual(state.offSeason, true);
assert.strictEqual(state.week, 49);
assert.strictEqual(state.weekPhase, 'offseason');

// オフシーズン第1週は表彰データを作る。第2週（契約更改）より必ず前。
state = Engine.advanceWeek(state).state;
record();
assert.strictEqual(state.offWeek, 1);
assert.ok(state.pendingAwards, 'offseason week 1 must prepare awards before contracts');
const awardsIndex = trace.length - 1;

state = Engine.advanceWeek(state).state;
record();
assert.strictEqual(state.offWeek, 2);
assert.ok(awardsIndex < trace.length - 1, 'awards must precede the contract-renewal week');

const ppvStarts = trace.filter(entry => /:ppv(?:TV|Show)$/.test(entry));
assert.deepStrictEqual(ppvStarts, ['S1 W48:ppvTV'], 'PPV must be consumed once, in regular week 48 only');

// 壊れた旧セーブ相当: offSeason 中に week=48 / ppvPhase=tv が残っても PPV へ戻らない。
const stale = {
  ...state,
  week: 48,
  offSeason: true,
  offWeek: 0,
  weekPhase: 'offseason',
  ppvPhase: 'tv',
};
const staleResult = Engine.advanceWeek(stale).state;
assert.strictEqual(staleResult.weekPhase, 'offseason');
assert.notStrictEqual(staleResult.weekPhase, 'ppvTV');
assert.notStrictEqual(staleResult.weekPhase, 'ppvShow');

const management = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
assert.ok(management.includes("s.week === PPV_SHOW_WEEK && !s.offSeason && s.ppvPhase === 'locked'"));
assert.ok(management.includes("s.week === PPV_SHOW_WEEK && !s.offSeason && s.ppvPhase === 'tv'"));

console.log(`PPV season flow trace: ${trace.join(' -> ')}`);
console.log('ppv-season-flow-test: ok');
