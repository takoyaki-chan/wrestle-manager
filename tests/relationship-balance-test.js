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
loadAsGlobal('engine.js');

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
    ...extra,
  };
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
      '1>2': { bond: 0, rivalry: 0 },
      '2>1': { bond: 0, rivalry: 0 },
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
      '2>1': { bond: 0, rivalry: 0 },
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
      '2>1': { bond: 0, rivalry: 0 },
    },
  });

  const next = Engine.relationships.processWeeklyDecay(state, rng);
  assert.ok(next.relationships['1>2'].bond < 91.7, 'high bond should drift back from the cap each week');
  assert.ok(next.relationships['1>2'].rivalry < 89.25, 'high rivalry should cool noticeably each week');
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

function testLegacyBondMigrationMapsNeutralToZero() {
  assert.strictEqual(Engine.relationships.migrateLegacyBondValue(50), 0, 'legacy neutral bond should map to 0');
  assert.strictEqual(Engine.relationships.migrateLegacyBondValue(25), -50, 'legacy low bond should become hostile');
  assert.strictEqual(Engine.relationships.migrateLegacyBondValue(100), 100, 'legacy cap should stay at the new cap');
}

function testToxicRecontactEscalatesRivalry() {
  const state = makeState({
    lockerRoomMorale: 60,
    relationships: {
      '1>2': { bond: -85, rivalry: 40 },
      '2>1': { bond: -82, rivalry: 38 },
    },
  });

  const next = Engine.relationships.applyRecontactEvents(state, [{
    type: 'vendetta',
    charA: 1,
    charB: 2,
    effect: { moralePenalty: -6, rivalryBonus: 5, bondPenalty: -2 },
  }]);

  assert.strictEqual(next.lockerRoomMorale, 54, 'toxic reunion should hurt locker room morale');
  assert.ok(next.relationships['1>2'].rivalry >= 45, 'toxic reunion should reignite rivalry');
  assert.ok(next.relationships['1>2'].bond <= -87, 'toxic reunion should deepen bond hostility');
}

testHighValueGainsAreSoftCapped();
testWeeklyDecayCoolsHotRivalry();
testCountersUseAbsoluteWeek();
testLegacyBondMigrationMapsNeutralToZero();
testToxicRecontactEscalatesRivalry();

console.log('relationship-balance-test: ok');