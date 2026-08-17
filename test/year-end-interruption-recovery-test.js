'use strict';

// 年末フローの途中停止を、翌年の二重表彰や契約交渉のやり直しへ波及させない。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGame } = require('./helpers/load-game.js');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function appMethod(name, nextName) {
  const start = app.indexOf(`  ${name}(`);
  const end = app.indexOf(`\n  ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `${name} method not found`);
  return app.slice(start, end).trim().replace(/,$/, '');
}

// 1) 完了済みのpending/stageはナビゲーションを永久ロックせず、その場で掃除する。
{
  const context = {
    G: {
      season: 4,
      lastAwards: { season: 4 },
      _annualAwardsCompletedSeason: 4,
      pendingAwards: { season: 4 },
      _annualAwardsCeremonyPending: { season: 4 },
    },
    Storage: { autoSave() {} },
    console: { warn() {} },
  };
  context.App = {};
  const completed = appMethod('_annualAwardsCompletedThrough', '_repairCompletedAnnualAwards');
  const repair = appMethod('_repairCompletedAnnualAwards', '_isAwardsStageActive');
  vm.runInNewContext(`Object.assign(App,{${completed},${repair}});`, context);
  assert.strictEqual(context.App._repairCompletedAnnualAwards('test'), true);
  assert.strictEqual(context.G.pendingAwards, undefined);
  assert.strictEqual(context.G._annualAwardsCeremonyPending, undefined);
}

// 旧年のstageだけが残っていても、新年のpendingは巻き込んで消さない。
{
  const context = {
    G: {
      season: 5,
      lastAwards: { season: 4 },
      _annualAwardsCompletedSeason: 4,
      pendingAwards: { season: 5 },
      _annualAwardsCeremonyPending: { season: 4 },
    },
    Storage: { autoSave() {} },
    console: { warn() {} },
  };
  context.App = {};
  const completed = appMethod('_annualAwardsCompletedThrough', '_repairCompletedAnnualAwards');
  const repair = appMethod('_repairCompletedAnnualAwards', '_isAwardsStageActive');
  vm.runInNewContext(`Object.assign(App,{${completed},${repair}});`, context);
  assert.strictEqual(context.App._repairCompletedAnnualAwards('mixed-season-test'), true);
  assert.strictEqual(context.G.pendingAwards.season, 5);
  assert.strictEqual(context.G._annualAwardsCeremonyPending, undefined);
}

// 2) 契約交渉は保存済みカーソルから再開し、解決済みの1人目をもう一度処理しない。
{
  const handleSource = appMethod('handleContractNegotiations', '_buildContractRenewalSalaryChanges');
  const negotiations = [
    { fighterId: 1, fighterName: 'A', attitude: 'raise' },
    { fighterId: 2, fighterName: 'B', attitude: 'raise' },
  ];
  const context = {
    G: {
      season: 2, rngSeed: 10, roster: [], titles: {}, gameLog: [],
      pendingContractNegotiations: negotiations,
      _contractNegotiationProgress: {
        season: 2, total: 2, cursor: 1,
        negotiationIds: [1, 2],
        results: [{ type: 'stay', fighterId: 1, fighterName: 'A', salaryDelta: 0 }],
        salaryBefore: { 1: 10, 2: 20 },
      },
    },
    Engine: { util: { getSalary() { return 0; } } },
    Storage: { autoSave() {} },
    showScreen() {},
    showContractSuddenDepartureModal() { throw new Error('unexpected sudden departure'); },
  };
  const summaries = [];
  const choices = [];
  const resultScreens = [];
  context.showContractSummaryModal = (remaining, _a, _s, onStart) => summaries.push({ remaining, onStart });
  context.showContractNegotiationModal = (neg, _i, _t, _g, onChoice) => choices.push({ neg, onChoice });
  context.showContractResultModal = (results, _changes, onDone) => resultScreens.push({ results, onDone });
  context.App = {
    _buildContractRenewalSalaryChanges() { return []; },
    _resolveContractChoice(neg, _choice, results, onDone, onResolved) {
      const result = { type: 'stay', fighterId: neg.fighterId, fighterName: neg.fighterName, salaryDelta: 0 };
      results.push(result);
      onResolved(result);
      onDone();
    },
    advanceWeek() {},
  };
  const handle = vm.runInNewContext(`({${handleSource}}).handleContractNegotiations`, context);
  handle.call(context.App);
  assert.deepStrictEqual(Array.from(summaries[0].remaining, neg => neg.fighterId), [2],
    '再開時サマリーに解決済みの選手が残っている');
  summaries[0].onStart();
  assert.deepStrictEqual(choices.map(row => row.neg.fighterId), [2], '1人目を再交渉している');
  choices[0].onChoice(0);
  assert.strictEqual(resultScreens.length, 1);
  assert.deepStrictEqual(Array.from(resultScreens[0].results, r => r.fighterId), [1, 2]);
}

// 3) 表彰式の途中で再読込しても、受賞履歴の副作用は年1回に限る。
{
  const awards = {
    season: 6,
    hallOfFame: [],
    rookieOfYear: { id: 101, orgName: 'テスト団体', isPlayerOrg: true },
    npcAwards: {},
  };
  let recorded = 0;
  const finishCallbacks = [];
  const context = {
    G: { season: 6, offSeason: true, offWeek: 1, pendingAwards: awards, roster: [] },
    Engine: {
      awards: {
        recordAwardEvent(state) { recorded += 1; return state; },
        checkHallOfFame() { return []; },
        finalizeRetireeBuffer(state) { return state; },
      },
    },
    Storage: { autoSave() {} },
    Audio: { fileBgm: { fadeOut() {}, play() {} } },
    YEAR_END_AWARDS_BGM: 'silent-test',
    refreshAll() {},
    showAwardsCeremony(_data, onFinish) { finishCallbacks.push(onFinish); },
    console: { warn() {}, error() {} },
  };
  context.App = {
    _annualAwardsCeremonyActive: false,
    _pushNewsEvent() {},
    restoreBgmForState() {},
    _showNewsPanelIfNeeded(done) { done(); },
    _checkAndShowMilestone(done) { done(); },
    _maybeShowSeasonFanfare(done) { done(); },
    _showFarewellsThenReport() {},
  };
  const completed = appMethod('_annualAwardsCompletedThrough', '_repairCompletedAnnualAwards');
  const repair = appMethod('_repairCompletedAnnualAwards', '_isAwardsStageActive');
  const showStart = app.indexOf('  _checkAndShowAwards(');
  const showBoundary = app.indexOf('\n  _checkMilestones(', showStart);
  const showBlock = app.slice(showStart, showBoundary);
  const showEnd = showBlock.lastIndexOf('\n  },');
  const show = showBlock.slice(0, showEnd + 4).trim().replace(/,$/, '');
  vm.runInNewContext(`Object.assign(App,{${completed},${repair},${show}});`, context);

  context.App._checkAndShowAwards();
  assert.strictEqual(recorded, 1);
  assert.strictEqual(context.G._annualAwardsPreparedSeason, 6);

  // 表彰画面中の強制終了→セーブ再読込を模擬。
  context.App._annualAwardsCeremonyActive = false;
  context.App._checkAndShowAwards();
  assert.strictEqual(recorded, 1, '再読込後に受賞履歴を二重適用している');
  assert.strictEqual(finishCallbacks.length, 2, '未完了の表彰式を再開できない');

  finishCallbacks[1]();
  assert.strictEqual(context.G.pendingAwards, undefined);
  assert.strictEqual(context.G._annualAwardsCompletedSeason, 6);

  // 完了済み年のフラグが旧セーブに残っても三度目は上映しない。
  context.G = {
    ...context.G,
    pendingAwards: awards,
    _annualAwardsCeremonyPending: { season: 6 },
  };
  context.App._annualAwardsCeremonyActive = false;
  context.App._checkAndShowAwards();
  assert.strictEqual(finishCallbacks.length, 2, '完了済み表彰式を再上映している');
}

// 4) 表彰UIを完走できなくても、年越し時点で結果を確定して未完了フラグを翌年へ運ばない。
loadGame({ full: true });
{
  let state = Engine.createInitialState(7711, true);
  const unfinished = { season: 3, hallOfFame: [], mvp: null };
  state = {
    ...state,
    season: 3,
    offSeason: true,
    offWeek: 4,
    weekPhase: 'offseason',
    pendingAwards: unfinished,
    _annualAwardsCeremonyPending: { season: 3 },
  };
  const advanced = Engine.advanceWeek(state).state;
  assert.strictEqual(advanced.season, 4);
  assert.strictEqual(advanced.pendingAwards, undefined);
  assert.strictEqual(advanced._annualAwardsCeremonyPending, undefined);
  assert.strictEqual(advanced.lastAwards.season, 3);
  assert.strictEqual(advanced._annualAwardsCompletedSeason, 3);
}

console.log('year-end-interruption-recovery-test: ok');
