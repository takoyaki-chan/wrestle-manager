const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

function makeFighter(id, extra = {}) {
  return {
    id,
    name: `F${id}` ,
    pw: 60,
    sp: 60,
    te: 60,
    st: 60,
    mn: 60,
    style: 'Allround',
    personality: 'normal',
    archetype: 'normal',
    injury: null,
    isRental: false,
    age: 22,
    affinityAxis: 0, // affinity-spec v1.0: 同軸ペア → distance 0 → target 60
    ...extra,
  };
}

function isTenthStep(value) {
  return Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;
}

function makeState(overrides = {}) {
  const fighterA = makeFighter(1);
  const fighterB = makeFighter(2);
  return {
    season: 2,
    week: 5,
    totalShows: 20,
    rngSeed: 12345,
    roster: [fighterA, fighterB],
    aiOrgs: {},
    matchupLog: [],
    relationships: {
      '1>2': { bond: 50, rivalry: 0 },
      '2>1': { bond: 50, rivalry: 0 },
    },
    relationshipCounters: {},
    ...overrides,
  };
}

function testHighValueGainsAreSoftCapped() {
  const rng = Engine.rng.create(100);
  const state = makeState({
    relationships: {
      '1>2': { bond: 95, rivalry: 92 },
      '2>1': { bond: 50, rivalry: 0 },
    },
  });

  const next = Engine.relationships.applyToRoster(
    state,
    1,
    [2],
    { min: 10, max: 10 },
    { min: 10, max: 10 },
    rng
  );

  assert.ok(next.relationships['1>2'].bond < 96, 'bond gain should be strongly reduced near the cap');
  assert.ok(next.relationships['1>2'].rivalry <= 93.2, 'rivalry gain should be strongly reduced near the cap');
}

function testWeeklyDecayCoolsHotRivalry() {
  const rng = Engine.rng.create(200);
  const state = makeState({
    relationships: {
      '1>2': { bond: 92, rivalry: 90 },
      '2>1': { bond: 50, rivalry: 0 },
    },
  });

  const next = Engine.relationships.processWeeklyDecay(state, rng);
  // affinity-spec v1.0 §5.1: bondPull 半減 + 加速項撤廃で減少幅は控えめになった
  // 同軸ペア (affinityAxis=0) は target=60 へ向かう → 92 から微減
  assert.ok(next.relationships['1>2'].bond < 91.95, 'high bond should drift back toward target each week');
  assert.ok(next.relationships['1>2'].rivalry < 89.25, 'high rivalry should cool noticeably each week');
}

function testRelationshipValuesStayOnTenthSteps() {
  const rng = Engine.rng.create(250);
  const state = makeState({
    relationships: {
      '1>2': { bond: 61.37, rivalry: 18.26 },
      '2>1': { bond: 48.88, rivalry: 11.94 },
    },
  });

  const next = Engine.relationships.applyToRoster(
    state,
    1,
    [2],
    { min: 1.25, max: 1.25 },
    { min: 2.35, max: 2.35 },
    rng
  );

  assert.ok(isTenthStep(next.relationships['1>2'].bond), 'bond should be quantized to tenths');
  assert.ok(isTenthStep(next.relationships['1>2'].rivalry), 'rivalry should be quantized to tenths');
}

function testCountersUseAbsoluteWeek() {
  const rng = Engine.rng.create(300);
  const state = makeState();
  const next = Engine.relationships.applyMatchResult(state, 1, 2, {
    mq: 70,
    winner: 'win',
    hpA: { final: 40, max: 100 },
    hpB: { final: 0, max: 100 },
    turns: 10,
    stage: 'normal',
    isTitleMatch: false,
    rivalryResolved: false,
    injuredId: null,
    isCareerBestA: false,
    isCareerBestB: false,
    losingStreakA: 0,
    losingStreakB: 0,
    isProveModeA: false,
    isProveModeB: false,
  }, rng);

  const counterKey = '1>2:match:normal';
  assert.strictEqual(next.relationshipCounters[counterKey].lastWeek, 53, 'counter should store absolute week');
}

function testLowBondVendettaStillWorksInsideZeroToHundredScale() {
  const state = makeState({
    lockerRoomMorale: 60,
    relationships: {
      '1>2': { bond: 5, rivalry: 40 },
      '2>1': { bond: 8, rivalry: 38 },
    },
  });

  const next = Engine.relationships.applyRecontactEvents(state, [{
    type: 'vendetta',
    charA: 1,
    charB: 2,
    effect: { moralePenalty: -6, rivalryBonus: 5, bondPenalty: -2 },
  }]);

  assert.strictEqual(next.lockerRoomMorale, 54, 'vendetta should hurt locker room morale');
  assert.ok(next.relationships['1>2'].rivalry >= 45, 'vendetta should reignite rivalry');
  assert.ok(next.relationships['1>2'].bond <= 3, 'vendetta should push bond closer to zero');
}

function testNewSigningDoesNotTriggerRecontactFromFreshNeutralLinks() {
  const previousState = makeState({
    roster: [makeFighter(1), makeFighter(2), makeFighter(3)],
    relationships: {
      '1>2': { bond: 50, rivalry: 0 },
      '2>1': { bond: 50, rivalry: 0 },
    },
  });
  const currentState = {
    ...previousState,
    relationships: {
      ...previousState.relationships,
      '1>3': { bond: 47, rivalry: 0 },
      '2>3': { bond: 52, rivalry: 0 },
    },
  };

  const events = Engine.relationships.checkRecontact(currentState, 3, [1, 2], previousState);
  assert.deepStrictEqual(events, [], 'freshly created signing links should not count as recontact');
}


function testRivalryLevelUsesRelationshipValues() {
  const state = makeState({
    rivalries: {
      '1-2': { matches: 1, resolutionCount: 0 },
    },
    relationships: {
      '1>2': { bond: 58, rivalry: 65 },
      '2>1': { bond: 61, rivalry: 68 },
    },
  });

  const lvl = Engine.title.getRivalryLevel(state, 1, 2);
  assert.ok(lvl, 'rivalry level should exist for mutual rivalry');
  assert.strictEqual(lvl.label, '宿敵', 'label should be derived from rivalry value band');
  assert.strictEqual(lvl.mqBonus, 4, 'mutual rivalry65 with positive bond should grant rivalry bonus plus chemistry bonus');
}

function testResolutionBranchesByBondAndAllowsShortcut() {
  const goodState = makeState({
    rivalries: { '1-2': { matches: 3, resolutionCount: 1 } },
    relationships: {
      '1>2': { bond: 65, rivalry: 82 },
      '2>1': { bond: 68, rivalry: 85 },
    },
  });
  const bitterState = makeState({
    rivalries: { '1-2': { matches: 3, resolutionCount: 1 } },
    relationships: {
      '1>2': { bond: 25, rivalry: 82 },
      '2>1': { bond: 28, rivalry: 84 },
    },
  });

  const goodPair = Engine.title.getRivalryPairState(goodState, 1, 2);
  const bitterPair = Engine.title.getRivalryPairState(bitterState, 1, 2);
  const shortcut = Engine.title.checkResolution(goodPair, 82, 70, 1);
  const bitter = Engine.title.checkResolution(bitterPair, 82, 70, 1);

  assert.strictEqual(shortcut.resolved, 'goodRival', 'high bond should branch to good rival');
  assert.strictEqual(shortcut.isShortcut, true, 'mutual high-rivalry high-bond pairs should use shortcut resolution');
  assert.strictEqual(bitter.resolved, 'bitter', 'low bond should branch to bitter rival');
}

function testGoodRivalFanExpectStillBuildsFanInterest() {
  const state = makeState({
    season: 2,
    week: 10,
    rivalries: {
      '1-2': { matches: 0, resolutionCount: 2, resolved: 'goodRival', lastAbsWeek: Engine.util.absWeek(2, 8) },
    },
    relationships: {
      '1>2': { bond: 70, rivalry: 4 },
      '2>1': { bond: 72, rivalry: 3 },
    },
  });
  assert.ok(Engine.fanExpect.generate(state).some(ev => ev.leftId === 1 && ev.rightId === 2), 'resolved good-rival pairs should still appear as fan-expected cards');
}
testHighValueGainsAreSoftCapped();
testWeeklyDecayCoolsHotRivalry();
testRelationshipValuesStayOnTenthSteps();
testCountersUseAbsoluteWeek();
testRivalryLevelUsesRelationshipValues();
testResolutionBranchesByBondAndAllowsShortcut();
testGoodRivalFanExpectStillBuildsFanInterest();
testLowBondVendettaStillWorksInsideZeroToHundredScale();
testNewSigningDoesNotTriggerRecontactFromFreshNeutralLinks();

console.log('relationship-balance-test: ok');
