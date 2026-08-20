const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractAssignedFunctionBody(signature) {
  const start = appSource.indexOf(signature);
  if (start < 0) throw new Error(`${signature} not found`);
  const braceStart = appSource.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < appSource.length; i++) {
    const ch = appSource[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return appSource.slice(braceStart + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

const runJtWinnerAdvanceState = new Function('App', 'Engine', 'match', extractAssignedFunctionBody('App._jtWinnerAdvanceState = function(match)'));
const runJtSimulateMatch = new Function('App', 'Engine', 'G', 'jt', 'left', 'right', 'roundIdx', 'pairIdx', extractAssignedFunctionBody('App._jtSimulateMatch = function(jt, left, right, roundIdx, pairIdx)'));
const runJtRecompute = new Function('App', 'jt', 'fromRoundIdx', extractAssignedFunctionBody('App._jtRecomputeSubsequentRounds = function(jt, fromRoundIdx)'));
const runJtUpdateFinalResults = new Function('App', 'jt', extractAssignedFunctionBody('App._jtUpdateFinalResults = function(jt)'));

function fighter(id, ovr) {
  return {
    id,
    name: `F${id}`,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    style: 'Allround',
    popularity: 50,
    traits: [],
    age: 18,
    condition: 80,
  };
}

function stable(value) {
  return JSON.parse(JSON.stringify(value));
}

(function testJuniorTournamentCarryHpBecomesStartingHp() {
  const f = fighter(1, 80);
  const prepared = Engine.juniorTournament._withTournamentHp({ ...f, jtCarryHpPct: 50 }, 1);
  const fullHp = Math.round(ENG.hpBase + f.st * ENG.hpScale);

  assert.strictEqual(prepared.condition, 80);
  assert.strictEqual(prepared.jtCarryHpPct, 50);
  assert.strictEqual(prepared._hpOverride, Math.round(fullHp * 0.5));
})();

(function testJuniorTournamentStartsAtFullHpByDefault() {
  const f = fighter(1, 80);
  const prepared = Engine.juniorTournament._withTournamentHp(f, 1);
  const fullHp = Math.round(ENG.hpBase + f.st * ENG.hpScale);

  assert.strictEqual(prepared.jtCarryHpPct, 100);
  assert.strictEqual(prepared._hpOverride, fullHp);
})();

(function testJuniorTournamentUsesStandardSeeds() {
  const state = { rngSeed: 1, season: 1 };
  const eight = [90, 85, 80, 75, 70, 65, 60, 55].map((ovr, i) => fighter(i + 1, ovr));
  assert.deepStrictEqual(
    Engine.juniorTournament._seedBracket(eight, state).map(f => f.id),
    [1, 8, 4, 5, 3, 6, 7, 2]
  );

  const four = eight.slice(0, 4);
  assert.deepStrictEqual(
    Engine.juniorTournament._seedBracket(four, state).map(f => f.id),
    [1, 4, 3, 2]
  );

  const sixteen = Array.from({ length: 16 }, (_, i) => fighter(i + 1, 100 - i));
  assert.deepStrictEqual(
    Engine.juniorTournament._seedBracket(sixteen, state).map(f => f.id),
    [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15]
  );
})();

(function testJuniorTournamentSelectsAndRunsSixteenWhenEligiblePoolIsLarge() {
  const state = {
    rngSeed: 2468,
    season: 3,
    orgName: 'Test Org',
    roster: Array.from({ length: 16 }, (_, i) => fighter(i + 1, 100 - i)),
    aiOrgs: {},
  };
  const selection = Engine.juniorTournament.select(state);
  assert.strictEqual(selection.bracketSize, 16, '16人以上の有資格者では16人トーナメントにする');
  assert.strictEqual(selection.participants.length, 16, '上位16人を選出する');
  const result = Engine.juniorTournament.run(state, selection.participants, Engine.rng.create(4));
  assert.deepStrictEqual(result.rounds.map(round => round.name), ['firstRound', 'quarterFinal', 'semiFinal', 'final']);
  assert.strictEqual(result.rounds.reduce((sum, round) => sum + round.matches.length, 0), 15,
    '16人トーナメントは全15試合');
})();

(function testJuniorTournamentDrawUsesAdvancedWinnerHp() {
  const originalSim = Engine.battle.simulateMatch;
  Engine.battle.simulateMatch = () => ({
    winner: 'draw',
    mq: 50,
    turns: 20,
    finType: 'HP判定',
    finMove: '',
    hpLeft: { final: 70, max: 100 },
    hpRight: { final: 10, max: 100 },
    log: [],
    frames: [],
  });

  try {
    const state = { rngSeed: 1, season: 1 };
    const result = Engine.juniorTournament.run(
      state,
      [fighter(1, 80), fighter(2, 70), fighter(3, 60), fighter(4, 50)],
      Engine.rng.create(1)
    );

    const finalLeft = result.rounds[1].matches[0].left;
    assert.strictEqual(result.rounds[0].matches[0].winnerId, 1);
    assert.strictEqual(finalLeft.id, 1);
    assert.strictEqual(finalLeft.jtCarryHpPct, 81);
  } finally {
    Engine.battle.simulateMatch = originalSim;
  }
})();

(function testJuniorTournamentCarriesRecoveredHpIntoNextRoundSimulation() {
  const originalSim = Engine.battle.simulateMatch;
  const calls = [];
  Engine.battle.simulateMatch = (left, right, rng, tier, options) => {
    calls.push({ left, right, tier, options });
    if (calls.length === 1) {
      return {
        winner: 'left',
        mq: 50,
        turns: 8,
        finType: 'pin',
        finMove: '',
        hpLeft: { final: 25, max: 100 },
        hpRight: { final: 0, max: 100 },
        log: [],
        frames: [],
      };
    }
    if (calls.length === 2) {
      return {
        winner: 'left',
        mq: 50,
        turns: 8,
        finType: 'pin',
        finMove: '',
        hpLeft: { final: 100, max: 100 },
        hpRight: { final: 0, max: 100 },
        log: [],
        frames: [],
      };
    }
    return {
      winner: 'left',
      mq: 50,
      turns: 8,
      finType: 'pin',
      finMove: '',
      hpLeft: { final: 100, max: 100 },
      hpRight: { final: 0, max: 100 },
      log: [],
      frames: [],
    };
  };

  try {
    const state = { rngSeed: 1, season: 1 };
    const result = Engine.juniorTournament.run(
      state,
      [fighter(1, 80), fighter(2, 70), fighter(3, 60), fighter(4, 50)],
      Engine.rng.create(1)
    );

    const finalCall = calls[2];
    const expectedFullHp = Math.round(BIGMATCH_ENG.hpBase + finalCall.left.st * BIGMATCH_ENG.hpScale);
    assert.strictEqual(result.rounds[0].matches[0].winnerId, 1);
    assert.strictEqual(result.rounds[1].matches[0].left.jtCarryHpPct, 45);
    assert.strictEqual(finalCall.left.jtCarryHpPct, 45);
    assert.strictEqual(finalCall.left.condition, 80);
    assert.strictEqual(finalCall.left._hpOverride, Math.round(expectedFullHp * 0.45));
    assert.ok(finalCall.left._hpOverride < expectedFullHp, 'carried condition should reduce starting HP');
    // opts の完全一致は避ける。2026-07-30 に因縁のリング内効果(rivalryRing 等)が
    // raw プロファイルにも通るようになり、チャネルが増えた。見るべきは
    // 「フレーム記録を要求している」ことと「リング内効果の口が繋がっている」こと。
    assert.strictEqual(finalCall.options.recordFrames, true, 'フレーム記録を要求する');
    assert.ok('rivalryRing' in finalCall.options,
      '因縁のリング内効果が渡されている(呼び忘れの再発防止)');
  } finally {
    Engine.battle.simulateMatch = originalSim;
  }
})();

(function testWatchingDoesNotChangeTournamentResult() {
  const state = { rngSeed: 2468, season: 3, roster: [], aiOrgs: {} };
  const participants = [90, 86, 82, 78, 74, 70, 66, 62].map((ovr, i) => fighter(i + 1, ovr));
  const initial = Engine.juniorTournament.run(state, participants, Engine.rng.create(1));
  const watched = JSON.parse(JSON.stringify(initial));
  const G = {
    ...state,
    roster: participants,
  };
  const App = {
    _jtLookupFighter(id) {
      return G.roster.find(f => f.id === id) || null;
    },
    _jtWinnerAdvanceState(match) {
      return runJtWinnerAdvanceState(App, Engine, match);
    },
    _jtSimulateMatch(jt, left, right, roundIdx, pairIdx) {
      return runJtSimulateMatch(App, Engine, G, jt, left, right, roundIdx, pairIdx);
    },
    _jtUpdateFinalResults(jt) {
      return runJtUpdateFinalResults(App, jt);
    },
  };

  runJtRecompute(App, { selection: { participants }, result: watched }, 0);

  assert.deepStrictEqual(stable(watched.rounds.map(r => r.matches)), stable(initial.rounds.map(r => r.matches)));
  assert.deepStrictEqual(stable(watched.champion), stable(initial.champion));
  assert.deepStrictEqual(stable(watched.runnerUp), stable(initial.runnerUp));
  assert.deepStrictEqual(stable(watched.semiFinalists), stable(initial.semiFinalists));
})();

console.log('junior-tournament-simulation-test: ok');
