const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

function fighter(id) {
  return {
    id,
    name: `F${id}`,
    age: 19,
    pw: 70 - (id % 7), sp: 70 - (id % 7), te: 70 - (id % 7),
    st: 70 - (id % 7), mn: 70 - (id % 7),
    style: 'Allround', popularity: 40, condition: 80, traits: [],
    _orgId: 'player', _orgName: 'Test Org',
  };
}

function stateFor(size) {
  return {
    season: 3,
    week: Engine.juniorTournament.WEEK,
    weekPhase: 'juniorTournament',
    rngSeed: 24680,
    funds: 0,
    orgName: 'Test Org',
    roster: Array.from({ length: size }, (_, index) => fighter(index + 1)),
    aiOrgs: {},
  };
}

function resultCounts(state) {
  return state.roster.map(f => f.careerRecord.history
    .filter(entry => entry.type === 'juniorTournament')
    .at(-1).result).sort();
}

function objectMethodBody(source, signature) {
  const start = source.indexOf(`${signature} {`);
  assert.ok(start >= 0, `${signature} not found`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') {
      depth--;
      if (depth === 0) return source.slice(braceStart + 1, index);
    }
  }
  throw new Error(`${signature} body end not found`);
}

(function testWeekPhaseLifecycleAndAllBracketRecords() {
  for (const size of [4, 8, 16]) {
    const state = stateFor(size);
    const selection = Engine.juniorTournament.select(state);
    assert.strictEqual(selection.bracketSize, size);

    const result = Engine.juniorTournament.run(state, selection.participants, Engine.rng.create(size));
    const applied = Engine.juniorTournament.apply(
      { ...state, _juniorTournamentSelection: selection },
      result
    );

    assert.strictEqual(applied.state.weekPhase, 'manage', `${size}人大会の確定時にmanageへ戻す`);
    assert.strictEqual(applied.state._juniorTournamentSelection, undefined, `${size}人大会の選出データを確定後に残さない`);
    assert.strictEqual(applied.state._juniorTournamentResult.cancelled, undefined);
    assert.strictEqual(resultCounts(applied.state).length, size, `${size}人全員に出場履歴を残す`);

    const expected = size === 16
      ? ['champion', 'firstRound', 'firstRound', 'firstRound', 'firstRound', 'firstRound', 'firstRound', 'firstRound', 'firstRound', 'quarterFinal', 'quarterFinal', 'quarterFinal', 'quarterFinal', 'runnerUp', 'semiFinal', 'semiFinal']
      : size === 8
        ? ['champion', 'quarterFinal', 'quarterFinal', 'quarterFinal', 'quarterFinal', 'runnerUp', 'semiFinal', 'semiFinal']
        : ['champion', 'runnerUp', 'semiFinal', 'semiFinal'];
    assert.deepStrictEqual(resultCounts(applied.state), expected, `${size}人ブラケットの敗退ラウンドを正しく記録する`);
    assert.ok(applied.state.funds >= 2000, `${size}人大会の賞金をプレイヤー団体へ支給する`);
  }
})();

(function testEnteringTournamentWeekSetsActivePhase() {
  const before = {
    ...stateFor(16),
    week: Engine.juniorTournament.WEEK - 1,
    weekPhase: 'weekSummary',
  };
  const advanced = Engine.advanceWeek(before);
  assert.strictEqual(advanced.state.week, Engine.juniorTournament.WEEK);
  assert.strictEqual(advanced.state.weekPhase, 'juniorTournament', '開催週への進入で大会phaseを開始する');
  assert.strictEqual(advanced.state._juniorTournamentSelection.bracketSize, 16);
})();

(function testWeekTabHasSafeReturnPathDuringTournament() {
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
  const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
  const management = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');

  assert.ok(app.includes('resumeJuniorTournament()'), '進行中の大会を破棄せず再開するApp経路を持つ');
  assert.ok(app.includes('G._juniorTournamentResult && !G._juniorTournamentResult.cancelled'), '旧セーブの確定済み大会を再計算せず完了させる');
  assert.ok(ui.includes("G.weekPhase === 'juniorTournament'"), '今週タブが進行中の大会phaseを正規に扱う');
  assert.ok(ui.includes('App.resumeJuniorTournament()'), '今週タブから大会進行画面へ戻れる');
  assert.ok(ui.includes('App.recoverWeekPhase()'), '汎用復旧UIはAppのデータ保全復旧を経由する');
  assert.match(management, /weekPhase:\s*'manage',[\s\S]{0,160}_juniorTournamentResult/, '結果適用がphase完了を原子的に確定する');
})();

(function testRecoveryPreservesAlreadyCommittedLegacyTournament() {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
  const recoverBody = objectMethodBody(appSource, 'recoverWeekPhase()');
  const runRecover = new Function('App', 'Storage', 'showScreen', 'refreshAll', 'G', `
    const outcome = (function() { ${recoverBody} })();
    return { outcome, state: G };
  `);
  const committedResult = { champion: { id: 1 }, runnerUp: { id: 2 }, cancelled: false };
  const calls = [];
  const recovered = runRecover(
    { _jtPreview: { phase: 'finalResult' } },
    { autoSave() { calls.push('save'); } },
    () => calls.push('screen'),
    () => calls.push('refresh'),
    {
      weekPhase: 'juniorTournament',
      _juniorTournamentResult: committedResult,
      _juniorTournamentSelection: { participants: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] },
    }
  );

  assert.strictEqual(recovered.outcome, true);
  assert.strictEqual(recovered.state.weekPhase, 'manage');
  assert.strictEqual(recovered.state._juniorTournamentSelection, undefined);
  assert.strictEqual(recovered.state._juniorTournamentResult, committedResult, '確定済みの結果を消さない');
  assert.deepStrictEqual(calls, ['save', 'screen', 'refresh']);
})();

console.log('junior-weekphase-lifecycle-test: ok');
