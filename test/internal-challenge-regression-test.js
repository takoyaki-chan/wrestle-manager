const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('factions.js');

function makeFighter(id, extra = {}) {
  return {
    id,
    name: `F${id}`,
    orgId: 'player',
    pw: 70,
    sp: 70,
    te: 70,
    st: 70,
    mn: 70,
    style: 'Allround',
    personality: 'normal',
    archetype: 'normal',
    injury: null,
    forcedRest: false,
    isRental: false,
    age: 24,
    popularity: 50,
    condition: 90,
    trust: 60,
    ...extra,
  };
}

function buildInternalChallengeState(overrides = {}) {
  const roster = [
    makeFighter(1, { pw: 76, sp: 76, te: 76, st: 76, mn: 76 }),
    makeFighter(2, { pw: 82, sp: 82, te: 82, st: 82, mn: 82 }),
    makeFighter(3, { pw: 68, sp: 68, te: 68, st: 68, mn: 68 }),
    makeFighter(4, { pw: 64, sp: 64, te: 64, st: 64, mn: 64 }),
  ];
  return {
    season: 2,
    week: 20,
    rngSeed: 1234,
    roster,
    factions: [{
      id: 10,
      name: 'Test組',
      leaderId: 1,
      memberIds: [1, 2, 3, 4],
      archetypeId: 'MERIT',
      flavor: 'neutral',
      status: 'active',
      createdSeason: 1,
      createdWeek: 1,
      lastLeaderChangeSeason: 1,
      lastLeaderChangeWeek: 1,
      internalChallengeCooldownUntilWeek: 0,
    }],
    factionInternalPoints: {
      10: { 1: 0, 2: 14, 3: 1, 4: 0 },
    },
    factionRivalryPoints: {},
    factionTimeline: [],
    ...overrides,
  };
}

{
  const state = buildInternalChallengeState();
  const cand = Engine.factions.checkInternalChallengeConditions(state, {});
  assert.ok(cand, 'healthy challenger should be selected');
  assert.strictEqual(cand.challengerId, 2);
}

{
  const roster = [
    makeFighter(1, { injury: { weeks: 2 } }),
    makeFighter(2, { pw: 82, sp: 82, te: 82, st: 82, mn: 82 }),
    makeFighter(3),
    makeFighter(4),
  ];
  const state = buildInternalChallengeState({ roster });
  const cand = Engine.factions.checkInternalChallengeConditions(state, {});
  assert.strictEqual(cand, null, 'injured leader should block internal challenge');
}

{
  const roster = [
    makeFighter(1),
    makeFighter(2, { pw: 82, sp: 82, te: 82, st: 82, mn: 82, forcedRest: true }),
    makeFighter(3),
    makeFighter(4),
  ];
  const state = buildInternalChallengeState({ roster });
  const cand = Engine.factions.checkInternalChallengeConditions(state, {});
  assert.strictEqual(cand, null, 'forced-rest challenger should be excluded');
}

{
  const state = buildInternalChallengeState({
    _pendingInternalChallenge: {
      factionId: 10,
      leaderId: 1,
      challengerId: 2,
      registeredSeason: 2,
      registeredWeek: 20,
    },
  });
  const absWeek = Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
  const next = Engine.factions.resolveInternalChallengeDraw(state);
  assert.strictEqual(next._pendingInternalChallenge, undefined);
  assert.strictEqual(next.factions[0].internalChallengeCooldownUntilWeek, absWeek + FACTION_CONFIG.internalChallengeCooldownWeeks);
  assert.strictEqual(next.factionTimeline[next.factionTimeline.length - 1].type, 'INTERNAL_CHALLENGE_DRAWN');
}

{
  const rivalry = {
    '10:20': {
      factionAId: 10,
      factionBId: 20,
      pointsA: 10,
      pointsB: 10,
      startedSeason: 1,
      startedWeek: 20,
    },
  };
  const factions = [
    { id: 10, status: 'active', memberIds: [1] },
    { id: 20, status: 'active', memberIds: [2] },
  ];
  const hostility = { '10>20': 50, '20>10': 50 };
  const before40Weeks = buildInternalChallengeState({
    season: 2,
    week: 7,
    factions,
    factionRivalryPoints: structuredClone(rivalry),
    factionHostility: hostility,
  });
  assert.strictEqual(
    Engine.factions.checkRivalryResolution(before40Weeks, {}),
    null,
    'cross-season rivalry must include four offseason weeks without closing before week 40'
  );

  const at40Weeks = buildInternalChallengeState({
    season: 2,
    week: 8,
    factions,
    factionRivalryPoints: structuredClone(rivalry),
    factionHostility: hostility,
  });
  const result = Engine.factions.checkRivalryResolution(at40Weeks, {});
  assert.strictEqual(result.reason, 'FORCE_CLOSE_PENDING');
}

console.log('internal-challenge-regression-test: ok');
