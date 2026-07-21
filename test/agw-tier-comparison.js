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

const iterations = Math.max(1, Number.parseInt(process.argv[2] || '1000', 10));
const seedBase = Number.parseInt(process.argv[3] || '190019', 10);

function prepareState(seed) {
  let state = Engine.createInitialState(seed, true);
  state = { ...state, season: 3, week: Engine.autumnWar.ENTRY_WEEK };
  state = { ...state, rankings: Engine.ranking.updateRankings(state) };
  state = { ...state, autumnWar: Engine.autumnWar.announce(state), autumnWarPhase: 'entry' };
  const members = Engine.autumnWar._selectMembers(state, 'player');
  assert.strictEqual(members.length, Engine.autumnWar.TEAM_SIZE, `seed ${seed}: player team shortage`);
  const order = Engine.autumnWar._defaultOrder(state, 'player', members);
  state = Engine.autumnWar.confirmPlayerTeam(state, members, order);
  state = {
    ...state,
    autumnWar: { ...state.autumnWar, autoReorderFinal: true },
  };
  return Engine.autumnWar.startSession(state);
}

function normalHpFighter(fighter) {
  const fullHp = Math.round(ENG.hpBase + Engine.util.eff(fighter.st) * ENG.hpScale);
  return {
    ...fighter,
    _hpOverride: Engine.wear.toHpOverride(fighter.condition, fullHp),
  };
}

function emptyMetrics() {
  return [1, 2, 3].map(index => ({
    index,
    bouts: 0,
    decisive: 0,
    winnerHp: 0,
    winnerHpRatio: 0,
    turns: 0,
    winnerConditionAfter: 0,
  }));
}

function runVariant(tier) {
  const metrics = emptyMetrics();
  const originalSimulateMatch = Engine.battle.simulateMatch;
  let captured = null;

  Engine.battle.simulateMatch = function comparedSimulateMatch(left, right, rng, requestedTier, opts) {
    const result = tier === 1
      ? originalSimulateMatch(normalHpFighter(left), normalHpFighter(right), rng, 1, opts)
      : originalSimulateMatch(left, right, rng, 2, opts);
    captured = result;
    return result;
  };

  try {
    for (let i = 0; i < iterations; i++) {
      let state = prepareState(seedBase + i);
      let guard = 0;
      while (state.autumnWar?.session?.phase !== 'complete' && guard++ < 20) {
        captured = null;
        const next = Engine.autumnWar.simulateNextBout(state);
        assert.ok(next.bout && captured, `tier ${tier}, seed ${seedBase + i}: bout was not simulated`);
        state = next.state;

        if (next.bout.index > 3) continue;
        const metric = metrics[next.bout.index - 1];
        metric.bouts += 1;
        metric.turns += captured.turns;
        if (!next.bout.winnerId) continue;

        const winnerIsLeft = captured.winner === 'left';
        const hp = winnerIsLeft ? captured.hpLeft : captured.hpRight;
        metric.decisive += 1;
        metric.winnerHp += hp.final;
        metric.winnerHpRatio += hp.final / hp.max;
        metric.winnerConditionAfter += next.bout.conditionAfter[next.bout.winnerId];
      }
      assert.strictEqual(state.autumnWar.session.phase, 'complete', `tier ${tier}, seed ${seedBase + i}: event did not finish`);
    }
  } finally {
    Engine.battle.simulateMatch = originalSimulateMatch;
  }

  return metrics.map(metric => ({
    fall: metric.index,
    samples: metric.bouts,
    decisiveSamples: metric.decisive,
    avgWinnerHp: metric.winnerHp / metric.decisive,
    avgWinnerHpPct: metric.winnerHpRatio / metric.decisive * 100,
    avgTurns: metric.turns / metric.bouts,
    avgWinnerConditionAfter: metric.winnerConditionAfter / metric.decisive,
  }));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

const tier2 = runVariant(2);
const tier1 = runVariant(1);

console.log(`AGW tier comparison: ${iterations} paired seeds (${seedBase}..${seedBase + iterations - 1})`);
console.log('残HP = 各チーム戦の該当フォールにおける勝者の終了HP。引き分けはHP平均から除外。');
console.table(tier2.map((current, index) => {
  const normal = tier1[index];
  return {
    fall: current.fall,
    samples: current.samples,
    tier2_hp: round(current.avgWinnerHp),
    tier1_hp: round(normal.avgWinnerHp),
    tier2_hp_pct: round(current.avgWinnerHpPct),
    tier1_hp_pct: round(normal.avgWinnerHpPct),
    tier2_turns: round(current.avgTurns),
    tier1_turns: round(normal.avgTurns),
    tier2_condition: round(current.avgWinnerConditionAfter),
    tier1_condition: round(normal.avgWinnerConditionAfter),
  };
}));

console.log(JSON.stringify({
  iterations,
  seedBase,
  tier2: tier2.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'number' ? round(value) : value]))),
  tier1: tier1.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'number' ? round(value) : value]))),
}, null, 2));
