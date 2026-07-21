const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js',
  'data.js',
  'coach-lines.js',
  'data-faction-dialogue.js',
  'management.js',
  'match-engine.js',
  'relationships.js',
  'flag-dialogue.js',
  'factions.js',
  'draft-negotiation.js',
].forEach(loadAsGlobal);

let state = Engine.createInitialState(4242, true);
state = { ...state, season: 1, week: Engine.autumnWar.EVENT_WEEK };
state = {
  ...state,
  roster: state.roster.map(f => ({ ...f, pw: 100, sp: 100, te: 100, st: 100, mn: 100, condition: 100 })),
  aiOrgs: Object.fromEntries(Object.entries(state.aiOrgs).map(([orgId, org]) => [orgId, {
    ...org,
    roster: org.roster.map(f => ({ ...f, pw: 5, sp: 5, te: 5, st: 5, mn: 5, condition: 100 })),
  }])),
};
state = { ...state, rankings: Engine.ranking.updateRankings(state) };
state = { ...state, autumnWar: Engine.autumnWar.announce(state), autumnWarPhase: 'entry' };
const members = Engine.autumnWar._selectMembers(state, 'player');
const order = Engine.autumnWar._defaultOrder(state, 'player', members);
state = Engine.autumnWar.confirmPlayerTeam(state, members, order);
state = Engine.autumnWar.startSession(state);

assert.strictEqual(state.autumnWar.session.results.length, 0, '大会開始時点では終了済み団体戦があってはならない');
assert.strictEqual(state.autumnWar.session.activeMatch.bouts.length, 0, '大会開始時点ではフォール結果を生成しない');
const initialRng = { ...state.autumnWar.session.rng };

const first = Engine.autumnWar.simulateNextBout(state);
assert.ok(first.bout, '最初の操作で1フォールが解決される');
const watchedFirst = Engine.autumnWar.simulateNextBout(
  JSON.parse(JSON.stringify(state)),
  { recordFrames: true }
);
assert.deepStrictEqual(watchedFirst.bout, first.bout, 'watched and skipped bouts must resolve identically');
assert.deepStrictEqual(watchedFirst.state.autumnWar, first.state.autumnWar, 'watched and skipped tournament state must match');
assert.ok(watchedFirst.replay?.result?.frames?.length > 0, 'watched bout must include replay frames');
const firstProgress = Engine.autumnWar.getProgress(first.state);
const firstBoutCount = firstProgress.results.reduce((sum, match) => sum + match.bouts.length, 0);
assert.strictEqual(firstBoutCount, 1, '1回の操作で未来のフォールまで生成してはならない');
assert.notDeepStrictEqual(first.state.autumnWar.session.rng, initialRng, 'フォール後のRNG状態を保存する');

const saved = JSON.parse(JSON.stringify(first.state));
const uninterrupted = Engine.autumnWar.simulateNextBout(first.state);
const resumed = Engine.autumnWar.simulateNextBout(saved);
assert.deepStrictEqual(resumed.bout, uninterrupted.bout, '保存・再開後も次フォールは同じ結果になる');
assert.deepStrictEqual(
  resumed.state.autumnWar.session.rng,
  uninterrupted.state.autumnWar.session.rng,
  '保存・再開後もRNG進行が一致する'
);

state = first.state;
let steps = 1;
let sawFinalOrder = false;
while (state.autumnWar.session.phase !== 'complete' && steps < 20) {
  if (state.autumnWar.session.phase === 'finalOrder') {
    sawFinalOrder = true;
    const finalOrder = Engine.autumnWar.suggestFinalOrder(state, 'player');
    state = Engine.autumnWar.reorderForFinal(state, finalOrder);
    assert.strictEqual(state.autumnWar.session.phase, 'final', '布陣確定後に初めて決勝へ進む');
    assert.strictEqual(state.autumnWar.session.activeMatch.bouts.length, 0, '決勝も未シミュレートで開始する');
  } else {
    const next = Engine.autumnWar.simulateNextBout(state);
    assert.ok(next.bout, `step ${steps + 1} must produce one bout`);
    state = next.state;
    steps += 1;
  }
}

assert.strictEqual(state.autumnWar.session.phase, 'complete', '大会は最大15フォールで完走する');
assert.ok(steps >= 3 && steps <= 15, `unexpected bout count: ${steps}`);
assert.ok(sawFinalOrder, '固定seedではプレイヤーが決勝進出し、布陣確定停止を検証する');
const result = Engine.autumnWar.getProgress(state);
assert.ok(result.champion && result.finalResult && result.mvpId, '最終フォール後に優勝・決勝・MVPが確定する');
const applied = Engine.autumnWar.apply(state, result);
assert.strictEqual(applied.state.autumnWar.champion, result.champion);
assert.strictEqual(applied.state.autumnWarPhase, 'result');

console.log(`autumn-war-live-engine-test: ok (${steps} bouts)`);
