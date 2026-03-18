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

function withStubs(stubs, fn) {
  const originals = [];
  Object.entries(stubs).forEach(([pathKey, value]) => {
    const parts = pathKey.split('.');
    let target = global;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
    const key = parts[parts.length - 1];
    originals.push({ target, key, value: target[key] });
    target[key] = value;
  });
  try {
    fn();
  } finally {
    originals.reverse().forEach(({ target, key, value }) => {
      target[key] = value;
    });
  }
}

function makeRosterFighter(id, name, ovr, capOvr, extra = {}) {
  return {
    id,
    name,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    trainCap: { pw: capOvr, sp: capOvr, te: capOvr, st: capOvr, mn: capOvr },
    condition: 80,
    injury: null,
    wins: 0,
    losses: 0,
    draws: 0,
    popularity: 40,
    style: 'Allround',
    role: 'Face',
    age: 24,
    traits: [],
    trust: 50,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    ...extra,
  };
}

function makeShowState(roster, titles) {
  return {
    rngSeed: 12345,
    season: 3,
    week: 2,
    aiOrgs: {
      org_s: {
        roster,
        titles,
        coaches: [],
        coachAssign: {},
        orgPop: 75,
        lockerRoomMorale: 60,
        matchupLog: [],
        showCount: 0,
      },
    },
  };
}

function testGenerateTrainCapDefaultFloor() {
  const rng = Engine.rng.create(1);
  withStubs({ 'Engine.rng.float': () => 0 }, () => {
    const cap = Engine.rival.generateTrainCap(rng, {}, { pw: 100, sp: 120, te: 140, st: 160, mn: 180 });
    assert.deepStrictEqual(cap, { pw: 55, sp: 66, te: 77, st: 88, mn: 99 });
  });
}

function testGenerateTrainCapOverrideRange() {
  const rng = Engine.rng.create(2);
  withStubs({ 'Engine.rng.float': () => 0 }, () => {
    const cap = Engine.rival.generateTrainCap(rng, {}, { pw: 100, sp: 100, te: 100, st: 100, mn: 100 }, [0.75, 0.80]);
    assert.deepStrictEqual(cap, { pw: 75, sp: 75, te: 75, st: 75, mn: 75 });
  });
}

function testInitAIOrgsSeedsTitles() {
  const seed = 77;
  Engine.rival.initRandomRoster(Engine.rng.create(seed));
  const ai = Engine.rival.initAIOrgs(Engine.rng.create(seed)).aiOrgs;
  Object.values(ai).forEach(org => {
    assert.ok(org.titles && org.titles.world, 'AI titles should be initialized');
    assert.strictEqual(org.titles.world.championId, null);
    assert.strictEqual(org.titles.world.defenses, 0);
  });
}

function testGetAceConfigPrioritizesSTrainCapTop3() {
  const fighter = makeRosterFighter(1, 'Hidden Ace', 70, 130);
  const org = {
    tier: 'S',
    roster: [
      makeRosterFighter(2, 'Top 1', 95, 100),
      makeRosterFighter(3, 'Top 2', 90, 105),
      makeRosterFighter(4, 'Top 3', 85, 110),
      fighter,
    ],
  };
  const config = Engine.rival.getAceConfig(org, fighter);
  assert.strictEqual(config.practiceRate, 0.95);
}

function testProcessAIWeekAutoCrownsWhenVacant() {
  const ace = makeRosterFighter(10, 'Ace', 92, 120);
  const rookie = makeRosterFighter(11, 'Rookie', 70, 90);
  const state = makeShowState([ace, rookie], Engine.rival.createAITitles());

  withStubs({
    'Engine.rival.generateAIMatchCard': () => [],
    'Engine.trust.applyShowTrust': roster => ({ roster }),
    'Engine.coach.getCondBonus': () => 0,
    'Engine.rival.buildAICoachAssignments': () => ({}),
  }, () => {
    const next = Engine.rival.processAIWeek(Engine.rng.create(5), state, { id: 'org_s', tier: 'S' });
    assert.strictEqual(next.titles.world.championId, ace.id);
    assert.strictEqual(next.titles.world.defenses, 0);
    assert.strictEqual(next.titles.world.wonSeason, state.season);
    assert.strictEqual(next.titles.world.wonWeek, state.week);
  });
}

function testProcessAIWeekCountsDrawAsDefense() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const challenger = makeRosterFighter(21, 'Challenger', 88, 118);
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 2, wonSeason: 1, wonWeek: 2 });
  const state = makeShowState([champ, challenger], titles);

  withStubs({
    'Engine.rival.generateAIMatchCard': () => [{ left: champ, right: challenger }],
    'Engine.rng.float': () => 0.99,
    'Engine.battle.simulateMatch': () => ({ left: champ, right: challenger, winner: 'draw', mq: 60, hpLeft: { final: 40, max: 100 }, hpRight: { final: 40, max: 100 } }),
    'Engine.trust.applyShowTrust': roster => ({ roster }),
    'Engine.coach.getMQBonusForMatch': () => 0,
    'Engine.coach.getMatchGrowthBonus': () => 0,
    'Engine.coach.getCondBonus': () => 0,
    'Engine.coach.getInjuryMult': () => 1,
    'Engine.growthEvents.checkAndApplyBreakthrough': () => null,
    'Engine.growthEvents.checkSlump': () => false,
    'Engine.growthEvents.applySlump': fighter => fighter,
    'Engine.growthEvents.updateSlumpMomentumAfterMatch': fighter => fighter,
    'Engine.growthEvents.checkMotivationLoss': () => false,
    'Engine.growthEvents.applyMotivationLoss': fighter => fighter,
    'Engine.growthEvents.updateMotivationLossMomentumAfterMatch': fighter => fighter,
    'Engine.popularity.applyDiminishing': () => 0,
    'Engine.popularity.checkLosingStreak': () => ({ popDelta: 0, losingStreak: 0 }),
    'Engine.rival.buildAICoachAssignments': () => ({}),
  }, () => {
    const next = Engine.rival.processAIWeek(Engine.rng.create(6), state, { id: 'org_s', tier: 'S' });
    assert.strictEqual(next.titles.world.championId, champ.id);
    assert.strictEqual(next.titles.world.defenses, 3);
  });
}

function testProcessAIWeekChangesChampionOnLoss() {
  const champ = makeRosterFighter(30, 'Champion', 90, 120);
  const challenger = makeRosterFighter(31, 'Challenger', 91, 121);
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 4, wonSeason: 1, wonWeek: 3 });
  const state = makeShowState([champ, challenger], titles);

  withStubs({
    'Engine.rival.generateAIMatchCard': () => [{ left: champ, right: challenger }],
    'Engine.rng.float': () => 0.99,
    'Engine.battle.simulateMatch': () => ({ left: champ, right: challenger, winner: 'right', mq: 78, hpLeft: { final: 0, max: 100 }, hpRight: { final: 35, max: 100 } }),
    'Engine.trust.applyShowTrust': roster => ({ roster }),
    'Engine.coach.getMQBonusForMatch': () => 0,
    'Engine.coach.getMatchGrowthBonus': () => 0,
    'Engine.coach.getCondBonus': () => 0,
    'Engine.coach.getInjuryMult': () => 1,
    'Engine.growthEvents.checkAndApplyBreakthrough': () => null,
    'Engine.growthEvents.checkSlump': () => false,
    'Engine.growthEvents.applySlump': fighter => fighter,
    'Engine.growthEvents.updateSlumpMomentumAfterMatch': fighter => fighter,
    'Engine.growthEvents.checkMotivationLoss': () => false,
    'Engine.growthEvents.applyMotivationLoss': fighter => fighter,
    'Engine.growthEvents.updateMotivationLossMomentumAfterMatch': fighter => fighter,
    'Engine.popularity.applyDiminishing': () => 0,
    'Engine.popularity.checkLosingStreak': () => ({ popDelta: 0, losingStreak: 0 }),
    'Engine.rival.buildAICoachAssignments': () => ({}),
  }, () => {
    const next = Engine.rival.processAIWeek(Engine.rng.create(7), state, { id: 'org_s', tier: 'S' });
    assert.strictEqual(next.titles.world.championId, challenger.id);
    assert.strictEqual(next.titles.world.defenses, 0);
    assert.strictEqual(next.titles.world.wonSeason, state.season);
    assert.strictEqual(next.titles.world.wonWeek, state.week);
  });
}

testGenerateTrainCapDefaultFloor();
testGenerateTrainCapOverrideRange();
testInitAIOrgsSeedsTitles();
testGetAceConfigPrioritizesSTrainCapTop3();
testProcessAIWeekAutoCrownsWhenVacant();
testProcessAIWeekCountsDrawAsDefense();
testProcessAIWeekChangesChampionOnLoss();

console.log('ai-ace-title-system-test: ok');