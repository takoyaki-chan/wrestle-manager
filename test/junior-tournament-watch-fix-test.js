const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractAssignedFunctionBody(signature) {
  const start = appSource.indexOf(signature);
  if (start < 0) throw new Error(`${signature} not found`);
  const braceStart = appSource.indexOf('{', start);
  if (braceStart < 0) throw new Error(`${signature} body start not found`);
  let depth = 0;
  for (let i = braceStart; i < appSource.length; i++) {
    const ch = appSource[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return appSource.slice(braceStart + 1, i);
      }
    }
  }
  throw new Error(`${signature} body end not found`);
}

function extractMethodBody(signature, nextMarker) {
  const startToken = `${signature} {`;
  const start = appSource.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} block not found`);
  const bodyStart = start + startToken.length;
  const end = appSource.indexOf(`\n\n  ${nextMarker}`, bodyStart);
  if (end < 0) throw new Error(`${signature} block end not found`);
  return appSource.slice(bodyStart, end).replace(/\n  \},\s*$/, '');
}

function extractObjectMethodBody(signature) {
  const startToken = `${signature} {`;
  const start = appSource.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} block not found`);
  const braceStart = appSource.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < appSource.length; i++) {
    const ch = appSource[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return appSource.slice(braceStart + 1, i);
      }
    }
  }
  throw new Error(`${signature} block end not found`);
}

const jtWinnerAdvanceStateBody = extractAssignedFunctionBody("App._jtWinnerAdvanceState = function(match)");
const jtSimulateMatchBody = extractAssignedFunctionBody("App._jtSimulateMatch = function(jt, left, right, roundIdx, pairIdx)");
const jtRecomputeBody = extractAssignedFunctionBody("App._jtRecomputeSubsequentRounds = function(jt, fromRoundIdx)");
const receiveJtBody = extractAssignedFunctionBody("App._receiveJTBattleResult = function(data)");
const resumeLoadedSpecialPhaseBody = extractObjectMethodBody('resumeLoadedSpecialPhase()');
const escapeBattleBody = extractMethodBody('escapeBattle()', '// Skip all remaining matches');

const runJtWinnerAdvanceState = new Function('App', 'Engine', 'match', `${jtWinnerAdvanceStateBody}`);
const runJtSimulateMatch = new Function('App', 'Engine', 'G', 'jt', 'left', 'right', 'roundIdx', 'pairIdx', `${jtSimulateMatchBody}`);
const runJtRecompute = new Function('App', 'jt', 'fromRoundIdx', `${jtRecomputeBody}`);
const runReceiveJt = new Function(
  'App', 'Audio', 'document', 'clearTimeout', 'renderJuniorTournamentMatchResult', 'data',
  `${receiveJtBody}`
);
const runResumeLoadedSpecialPhase = new Function('App', 'G', `${resumeLoadedSpecialPhaseBody}`);
const runEscapeBattle = new Function('App', 'Audio', 'document', 'clearTimeout', 'renderMatchPreview', `${escapeBattleBody}`);

(function testJtWinnerAdvanceStateCarriesCondition() {
  const App = {};
  const Engine = { juniorTournament: { CONDITION_RECOVERY: 25 } };
  const match = {
    left: { id: 1, name: 'A' },
    right: { id: 2, name: 'B' },
    winnerId: 2,
    hpRight: { final: 30, max: 120 },
  };

  const winner = runJtWinnerAdvanceState(App, Engine, match);

  assert.strictEqual(winner.id, 2);
  assert.strictEqual(winner.jtCarryHpPct, 45);
})();

(function testJtSimulateMatchRequestsReplayFrames() {
  const calls = [];
  const App = {
    _jtLookupFighter(id) {
      return { id, name: `F${id}`, base: true };
    },
  };
  const Engine = {
    rng: {
      derive(...parts) { return parts.join(':'); },
      create(seed) { return { seed }; },
    },
    juniorTournament: {
      _withTournamentHp(fighter) {
        return { ...fighter, _hpOverride: Math.round(100 * (fighter.jtCarryHpPct ?? 100) / 100) };
      },
    },
    battle: {
      simulateMatch(left, right, rng, tier, options) {
        calls.push({ left, right, rng, tier, options });
        return {
          winner: 'left',
          mq: 88,
          turns: 14,
          finType: 'フォール',
          finMove: 'Flash',
          hpLeft: { final: 40, max: 100 },
          hpRight: { final: 0, max: 100 },
          log: ['done'],
          frames: [{ turn: 1 }],
        };
      },
    },
  };
  const G = { rngSeed: 10, season: 3 };
  const jt = { result: { rounds: [{}, {}, {}] } };

  const result = runJtSimulateMatch(
    App,
    Engine,
    G,
    jt,
    { id: 1, name: 'L', jtCarryHpPct: 61 },
    { id: 2, name: 'R', jtCarryHpPct: 57 },
    1,
    0
  );

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].left.jtCarryHpPct, 61);
  assert.strictEqual(calls[0].right.jtCarryHpPct, 57);
  assert.strictEqual(calls[0].left._hpOverride, 61);
  assert.strictEqual(calls[0].right._hpOverride, 57);
  assert.deepStrictEqual(calls[0].options, { recordFrames: true });
  assert.deepStrictEqual(result.frames, [{ turn: 1 }]);
})();

(function testJtRecomputeUsesAdvancedWinnersAndFrames() {
  const App = {
    _jtWinnerAdvanceState(match) {
      return {
        id: match.winnerId,
        name: `winner-${match.winnerId}`,
        jtCarryHpPct: match.winnerId === 1 ? 72 : 66,
      };
    },
    _jtSimulateMatch(jt, left, right, roundIdx, pairIdx) {
      return {
        left,
        right,
        winnerId: left.id,
        loserId: right.id,
        mq: 70,
        turns: 10,
        finType: 'フォール',
        finMove: 'Sim',
        hpLeft: { final: 30, max: 100 },
        hpRight: { final: 0, max: 100 },
        log: [],
        winner: 'left',
        frames: [{ roundIdx, pairIdx }],
      };
    },
    _jtUpdateFinalResults(jt) {
      jt._updated = true;
    },
  };
  const jt = {
    result: {
      rounds: [
        {
          matches: [
            { left: { id: 1 }, right: { id: 2 }, winnerId: 1 },
            { left: { id: 3 }, right: { id: 4 }, winnerId: 4 },
          ],
        },
        { matches: [{ stale: true }] },
      ],
    },
  };

  runJtRecompute(App, jt, 0);

  const finalMatch = jt.result.rounds[1].matches[0];
  assert.strictEqual(finalMatch.left.jtCarryHpPct, 72);
  assert.strictEqual(finalMatch.right.jtCarryHpPct, 66);
  assert.deepStrictEqual(finalMatch.frames, [{ roundIdx: 1, pairIdx: 0 }]);
  assert.strictEqual(jt._updated, true);
})();

(function testReceiveJtIgnoresDuplicateAfterResultScreen() {
  let rendered = 0;
  const App = {
    _jtPreview: {
      phase: 'matchResult',
      currentRound: 0,
      currentMatch: 0,
      result: {
        rounds: [
          {
            matches: [
              {
                left: { id: 11 },
                right: { id: 22 },
                winnerId: 11,
              },
            ],
          },
        ],
      },
    },
  };
  const Audio = { fileBgm: { fadeOut() { throw new Error('should not fade'); } }, play() { rendered++; } };
  const document = {
    getElementById() {
      return { style: {}, classList: { add() {}, remove() {} } };
    },
  };

  runReceiveJt(App, Audio, document, () => {}, () => { rendered++; }, { winner: 'left', winnerId: 11 });

  assert.strictEqual(rendered, 0);
})();

(function testReceiveJtDoesNotOverwriteCanonicalReplayResult() {
  let rendered = 0;
  const match = {
    left: { id: 11 },
    right: { id: 22 },
    winner: 'left',
    winnerId: 11,
    loserId: 22,
    mq: 77,
    turns: 9,
    finType: 'pin',
    finMove: 'Canon',
    hpLeft: { final: 35, max: 100 },
    hpRight: { final: 0, max: 100 },
    log: ['canonical'],
  };
  const App = {
    _jtPreview: {
      phase: 'watching',
      currentRound: 0,
      currentMatch: 0,
      result: {
        rounds: [
          {
            matches: [match],
          },
        ],
      },
    },
    _jtRecomputeSubsequentRounds() {
      throw new Error('watch replay must not recompute tournament results');
    },
  };
  const Audio = { fileBgm: { fadeOut() {} }, play() { rendered++; } };
  const document = {
    getElementById() {
      return { style: {}, classList: { add() {}, remove() {} } };
    },
  };

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    runReceiveJt(
      App,
      Audio,
      document,
      () => {},
      () => { rendered++; },
      {
        winner: 'right',
        winnerId: 22,
        mq: 1,
        turns: 1,
        finType: 'submission',
        finMove: 'Iframe',
        hpLeft: { current: 0, max: 100 },
        hpRight: { current: 99, max: 100 },
        log: ['iframe'],
      }
    );
  } finally {
    console.warn = originalWarn;
  }

  assert.strictEqual(match.winner, 'left');
  assert.strictEqual(match.winnerId, 11);
  assert.strictEqual(match.loserId, 22);
  assert.strictEqual(match.mq, 77);
  assert.strictEqual(match.turns, 9);
  assert.strictEqual(match.finType, 'pin');
  assert.strictEqual(match.finMove, 'Canon');
  assert.deepStrictEqual(match.hpLeft, { final: 35, max: 100 });
  assert.deepStrictEqual(match.hpRight, { final: 0, max: 100 });
  assert.deepStrictEqual(match.log, ['canonical']);
  assert.strictEqual(App._jtPreview.phase, 'matchResult');
  assert.strictEqual(rendered, 2);
})();

(function testLoadResumeReEntersJuniorTournamentPhase() {
  const calls = [];
  const App = {
    initPPVShow() { calls.push('ppvShow'); },
    initPPVTV() { calls.push('ppvTV'); },
    initJuniorTournament() { calls.push('juniorTournament'); },
  };

  const resumed = runResumeLoadedSpecialPhase(App, { weekPhase: 'juniorTournament' });

  assert.strictEqual(resumed, true);
  assert.deepStrictEqual(calls, ['juniorTournament']);
})();

(function testLoadResumeStartsJuniorTournamentFromManageWeek() {
  const calls = [];
  const App = {
    initPPVShow() { calls.push('ppvShow'); },
    initPPVTV() { calls.push('ppvTV'); },
    initJuniorTournament() { calls.push('juniorTournament'); },
    canEnterJuniorTournamentThisWeek() { return true; },
    enterJuniorTournamentFromWeek() { calls.push('enterJT'); return true; },
  };

  const resumed = runResumeLoadedSpecialPhase(App, { weekPhase: 'manage', week: 25 });

  assert.strictEqual(resumed, true);
  assert.deepStrictEqual(calls, ['enterJT']);
})();

(function testLoadResumeDoesNotClaimHandledWhenJuniorTournamentCancels() {
  const calls = [];
  const App = {
    initPPVShow() { calls.push('ppvShow'); },
    initPPVTV() { calls.push('ppvTV'); },
    initJuniorTournament() { calls.push('juniorTournament'); },
    canEnterJuniorTournamentThisWeek() { return true; },
    enterJuniorTournamentFromWeek() { calls.push('enterJT'); return false; },
  };

  const resumed = runResumeLoadedSpecialPhase(App, { weekPhase: 'manage', week: 25 });

  assert.strictEqual(resumed, false);
  assert.deepStrictEqual(calls, ['enterJT']);
})();

(function testEscapeBattleFallsBackToJtSkip() {
  let skipArgs = null;
  const App = {
    _showPreview: null,
    _warPreview: null,
    _ppvPreview: null,
    _b3Preview: null,
    _b2Preview: null,
    _jtPreview: {
      phase: 'watching',
      currentRound: 1,
      currentMatch: 2,
    },
    jtSkipMatch(ri, mi) {
      skipArgs = [ri, mi];
    },
  };
  const Audio = { fileBgm: { stop() {} } };
  const document = {
    getElementById() {
      return { style: {} };
    },
  };

  runEscapeBattle(App, Audio, document, () => {}, () => {});

  assert.strictEqual(App._jtPreview.phase, 'matchResult');
  assert.deepStrictEqual(skipArgs, [1, 2]);
})();

console.log('junior-tournament-watch-fix-test: ok');
