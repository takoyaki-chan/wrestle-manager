'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

const S_ORG = RIVAL_ORGS.find(org => org.tier === 'S');
const STATS = ['pw', 'sp', 'te', 'st', 'mn'];

function makeFighter(id, extra = {}) {
  const stats = { pw: 60, sp: 60, te: 60, st: 60, mn: 60 };
  return {
    id,
    name: `AI-${id}`,
    ...stats,
    trainCap: { pw: 100, sp: 100, te: 100, st: 100, mn: 100 },
    notionValue: { ...stats },
    style: 'Grappler',
    personality: 'normal',
    traits: [],
    age: 20,
    careerSeasons: 3,
    condition: 80,
    wear: 0,
    strainDebt: 0,
    seasonIntensiveWeeks: 0,
    intensiveWeeksTotal: 0,
    intensiveWeeks: 0,
    seasonInjuries: 0,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    statPeak: { ...stats },
    popularity: 20,
    promoStack: 0,
    wins: 8,
    losses: 4,
    draws: 0,
    schedule: 'balance',
    injury: null,
    trust: 50,
    ...extra,
  };
}

function makeState(fighter, week = 2) {
  return {
    rngSeed: 12345,
    season: 1,
    week,
    leagueElevated: false,
    roster: [makeFighter(9000)],
    coaches: [],
    coachAssign: {},
    lockerRoomMorale: 60,
    relationships: {},
    aiOrgs: {
      [S_ORG.id]: {
        roster: [fighter],
        orgPop: 75,
        lockerRoomMorale: 60,
        coaches: [],
        coachAssign: {},
        titles: Engine.rival.createAITitles(),
      },
    },
  };
}

function withStubbedTraining(fn) {
  const originalGrowth = Engine.growth.calcGrowth;
  const originalPick = Engine.coach.pickGrowthStat;
  const originalFloat = Engine.rng.float;
  let intensiveFlag = null;
  Engine.growth.calcGrowth = (_rng, _state, fighter) => {
    intensiveFlag = fighter.intensive;
    return 1;
  };
  Engine.coach.pickGrowthStat = () => 'pw';
  Engine.rng.float = () => 0;
  try {
    const value = fn();
    return { value, getIntensiveFlag: () => intensiveFlag };
  } finally {
    Engine.growth.calcGrowth = originalGrowth;
    Engine.coach.pickGrowthStat = originalPick;
    Engine.rng.float = originalFloat;
  }
}

function testShowWeekAndHeatParity() {
  const fighter = makeFighter(1001, { _heat: 0, condition: 80 });
  const run = withStubbedTraining(() =>
    Engine.rival.processAIWeek(Engine.rng.create(1), makeState(fighter, 2), S_ORG));
  const result = run.value;
  const next = result.roster[0];
  assert.strictEqual(run.getIntensiveFlag(), true, '興行週も追い込み判定を calcGrowth へ渡す');
  assert.strictEqual(next.seasonIntensiveWeeks, 1, 'AI追い込みをシーズン累積する');
  assert.strictEqual(next._heat, 1, 'AI追い込みはプレイヤーと同じく_heatを+1する');
}

function testRestAndIntensiveGuards() {
  const exhausted = makeFighter(1002, { condition: 59, _heat: 3 });
  const rested = withStubbedTraining(() =>
    Engine.rival.processAIWeek(Engine.rng.create(2), makeState(exhausted, 1), S_ORG)).value;
  assert.strictEqual(rested.roster[0].seasonIntensiveWeeks, 0, 'condition<60は練習しない');
  assert.strictEqual(rested.roster[0]._heat, 1, '強制休養は_heatを-2する');

  const capped = makeFighter(1003, { condition: 80, intensiveWeeks: 2, _heat: 2 });
  const run = withStubbedTraining(() =>
    Engine.rival.processAIWeek(Engine.rng.create(3), makeState(capped, 1), S_ORG));
  const normal = run.value;
  assert.strictEqual(run.getIntensiveFlag(), false, '連続2週到達時は追い込みを選ばない');
  assert.strictEqual(normal.roster[0].seasonIntensiveWeeks, 0);
  assert.strictEqual(normal.roster[0]._heat, 1, '通常練習は_heatを-1する');
}

function testSharedSeasonWear() {
  const fighter = makeFighter(1004, {
    age: 24,
    careerSeasons: 4,
    wins: 160,
    losses: 20,
    seasonInjuries: 2,
    seasonIntensiveWeeks: 4,
    strainDebt: 3,
    durability: 0,
  });
  const playerState = { roster: [fighter], coaches: [], coachAssign: {} };
  const aiState = Engine.rival.buildAIState(makeState(fighter), makeState(fighter).aiOrgs[S_ORG.id], [fighter], 'S');
  const player = Engine.growth.applySeasonTrainingWear(Engine.rng.create(44), playerState,
    { ...fighter, age: 25 }, 24);
  const ai = Engine.growth.applySeasonTrainingWear(Engine.rng.create(44), aiState,
    { ...fighter, age: 25 }, 24);
  ['wear', 'strainDebt', 'seasonIntensiveWeeks'].forEach(key => {
    assert.strictEqual(ai[key], player[key], `AIとプレイヤーで${key}の季末処理が異なる`);
  });
}

function testAIInitialWearUsesSharedDecayStartAge() {
  const originalDurability = Engine.career.generateDurability;
  Engine.career.generateDurability = () => 0;
  try {
    const template = {
      id: 1010, name: '初期wear検証', h: 165,
      pw: 70, sp: 70, te: 70, st: 70, mn: 70,
      pot: { pw: 100, sp: 100, te: 100, st: 100, mn: 100 },
      traits: [], style: 'Grappler', role: 'standard', personality: 'normal',
    };
    const fighter = Engine.rival.makeAIFighter(template, Engine.rng.create(10), S_ORG.id, 24);
    assert.ok(fighter.wear > 0,
      '耐久0の24歳AIは共通のdecayStartAge=23に従い、初期wearを1年分持つ');
  } finally {
    Engine.career.generateDurability = originalDurability;
  }
}

function testSeasonTrainerAndPlayerIsolation() {
  const eligible = makeFighter(1005);
  const worn = makeFighter(1006, { wear: 1 });
  const declined = makeFighter(1007, { statPeak: { pw: 61, sp: 60, te: 60, st: 60, mn: 60 } });
  const state = makeState(eligible, 1);
  state.season = 2;
  state.aiOrgs[S_ORG.id] = {
    ...state.aiOrgs[S_ORG.id],
    roster: [eligible, worn, declined],
    coaches: [ALL_COACHES[0].id],
  };
  const originalFloat = Engine.rng.float;
  Engine.rng.float = () => 0;
  let assigned;
  try {
    assigned = Engine.rival.assignAISeasonTrainers(state);
  } finally {
    Engine.rng.float = originalFloat;
  }
  const trainer = assigned[S_ORG.id].roster.find(f => f._inviteBuff);
  assert.strictEqual(trainer.id, eligible.id, 'wearまたはstatPeak比の低下がある選手は候補外');
  assert.strictEqual(trainer._inviteBuff.source, 'aiSeasonTrainer');
  assert.strictEqual(trainer._inviteBuff.weeksLeft, 4, '招聘と同じ4週間だけ効く');
  let ticked = assigned[S_ORG.id].roster;
  for (let i = 0; i < 4; i++) ticked = Engine.rival.tickAISeasonTrainerBuffs(ticked);
  assert.ok(!ticked.find(f => f.id === eligible.id)._inviteBuff, '4週後にAIトレーナーは終了する');

  const playerSnapshot = JSON.stringify(state.roster);
  Engine.rival.processAIWeek(Engine.rng.create(9), state, S_ORG);
  assert.strictEqual(JSON.stringify(state.roster), playerSnapshot,
    'AI週次処理はプレイヤーの成長入力を直接変更しない');
}

function testValidationAndDeadConfigRemoval() {
  const invalid = makeFighter(1008, { age: 30, durability: 0, _heat: 5, seasonIntensiveWeeks: -1, strainDebt: -1 });
  const state = makeState(invalid, 1);
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = message => warnings.push(String(message));
  try {
    Engine.validateGameState({ ...state, funds: 100, orgPop: 50, heatScore: 0 });
  } finally {
    console.warn = originalWarn;
  }
  assert.ok(warnings.some(w => w.includes('_heatが範囲外')));
  assert.ok(warnings.some(w => w.includes('seasonIntensiveWeeksが不正値')));
  assert.ok(warnings.some(w => w.includes('strainDebtが不正値')));
  assert.ok(warnings.some(w => w.includes('decayStartAge到達後にstrainDebtが残存')));
  assert.strictEqual(state.aiOrgs[S_ORG.id].roster[0].strainDebt, 0,
    'decayStartAge到達後のAI strainDebtは検証時に0へ正規化する');
  assert.ok(!Object.prototype.hasOwnProperty.call(GROWTH_CONFIG, 'aiMatchWearCoef'));
  [AI_TIER_LIMITS, AI_TIER_LIMITS_ELEVATED, AI_COACH_CONFIG, AI_COACH_CONFIG_ELEVATED].forEach(config => {
    assert.ok(!JSON.stringify(config).includes('growthBonus'));
    assert.ok(!JSON.stringify(config).includes('coachMul'));
  });
}

testShowWeekAndHeatParity();
testRestAndIntensiveGuards();
testSharedSeasonWear();
testAIInitialWearUsesSharedDecayStartAge();
testSeasonTrainerAndPlayerIsolation();
testValidationAndDeadConfigRemoval();

console.log('ai-growth-parity-test: ok');
