'use strict';

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

const STATS = ['pw', 'sp', 'te', 'st', 'mn'];
let failed = 0;

function section(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${error && error.stack || error}`);
  }
}

function fighter(id, name, ovr, cap, extra = {}) {
  return {
    id, name,
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    pot: { pw: 90, sp: 110, te: 100, st: 105, mn: 95 },
    trainCap: { pw: cap, sp: cap, te: cap, st: cap, mn: cap },
    age: 21,
    traits: [],
    popularity: 30,
    condition: 80,
    contractPop: 30,
    injury: null,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    ...extra,
  };
}

function stateWithSElite(candidate, extra = {}) {
  const sId = RIVAL_ORGS.find(org => org.tier === 'S').id;
  return {
    rngSeed: 424242,
    season: 5,
    week: 16,
    orgName: 'テスト団体',
    lockerRoomMorale: 60,
    roster: [candidate],
    freeAgents: [],
    scoutCandidates: [],
    aiOrgs: {
      [sId]: {
        roster: [
          fighter(901, 'S1', 95, 120),
          fighter(902, 'S2', 94, 118),
          fighter(903, 'S3', 93, 114),
          fighter(904, 'S4', 92, 112),
          fighter(905, 'S5', 91, 108),
        ],
      },
    },
    ...extra,
  };
}

function withRates(seedRate, triggerRate, fn) {
  const oldSeed = Engine.kaigan.SEED_RATE;
  const oldTrigger = Engine.kaigan.TRIGGER_RATE;
  Engine.kaigan.SEED_RATE = seedRate;
  Engine.kaigan.TRIGGER_RATE = triggerRate;
  try { return fn(); }
  finally {
    Engine.kaigan.SEED_RATE = oldSeed;
    Engine.kaigan.TRIGGER_RATE = oldTrigger;
  }
}

console.log('=== 開眼 Phase 1 不変条件 ===\n');

section('I3a. 生成時シード判定は既存RNGを1回も消費しない', () => {
  withRates(1, 0.25, () => {
    const rng = Engine.rng.create(1001);
    const before = JSON.stringify(rng);
    const seeded = Engine.kaigan.assignSeed(fighter(1, '対象', 50, 90), rng);
    assert.strictEqual(seeded.kaiganSeed, true);
    assert.strictEqual(JSON.stringify(rng), before);
    const ineligible = Engine.kaigan.assignSeed(fighter(2, '対象外', 80, 101), rng);
    assert.strictEqual(ineligible.kaiganSeed, undefined);
    assert.strictEqual(JSON.stringify(rng), before);
    const overridden = Engine.kaigan.ensureSeedEligibility({
      ...seeded,
      trainCap: { pw: 105, sp: 105, te: 105, st: 105, mn: 105 },
    });
    assert.strictEqual(overridden.kaiganSeed, undefined);
  });
});

section('I3b. 未発火シード保持者と非保持者の成長fingerprintが完全一致する', () => {
  const base = fighter(3, '同一選手', 45, 90, { age: 23 });
  const hiddenSeedOnly = { ...base, kaiganSeed: true };
  const G = { season: 4, lockerRoomMorale: 60 };
  const rngA = Engine.rng.create(2002);
  const rngB = Engine.rng.create(2002);
  const rowsA = [];
  const rowsB = [];
  for (let i = 0; i < 24; i++) {
    rowsA.push(Engine.growth.calcGrowth(rngA, G, base, 'pw', 1));
    rowsB.push(Engine.growth.calcGrowth(rngB, G, hiddenSeedOnly, 'pw', 1));
  }
  const fingerprintA = JSON.stringify({ rows: rowsA, rng: rngA });
  const fingerprintB = JSON.stringify({ rows: rowsB, rng: rngB });
  assert.strictEqual(fingerprintB, fingerprintA);
  console.log(`        fingerprint=${fingerprintA}`);
});

section('I3c. 発火判定と着地帯判定も外部RNGを消費しない', () => {
  withRates(0.015, 1, () => {
    const candidate = fighter(4, '候補', 55, 90, { kaiganSeed: true });
    const state = stateWithSElite(candidate);
    const sentinel = Engine.rng.create(3003);
    const before = JSON.stringify(sentinel);
    const awakened = Engine.kaigan.tryTrigger(state, candidate, {
      selfOvr: 55, opponentOvr: 70, opponentId: 901, matchIndex: 0,
      mq: 72, won: false, wasInjured: false, isFreeAgent: false,
    });
    assert.ok(awakened && awakened.kaiganState);
    assert.strictEqual(JSON.stringify(sentinel), before);
  });
});

section('I4. 開眼でpot・現在mnは不変、全statのtrainCapは1点も下がらない', () => {
  const candidate = fighter(5, '形状保持', 60, 80, {
    kaiganSeed: true,
    mn: 47,
    pot: { pw: 70, sp: 140, te: 100, st: 120, mn: 70 },
    trainCap: { pw: 126, sp: 72, te: 84, st: 79, mn: 93 },
  });
  const state = stateWithSElite(candidate);
  const oldCaps = { ...candidate.trainCap };
  const oldPot = JSON.parse(JSON.stringify(candidate.pot));
  const awakened = Engine.kaigan.applyAwakening(state, candidate, { opponentId: 901, matchIndex: 1 });
  STATS.forEach(stat => assert.ok(awakened.trainCap[stat] >= oldCaps[stat], `${stat} capが低下`));
  assert.deepStrictEqual(awakened.kaiganState.appliedTrainCap, awakened.trainCap);
  assert.deepStrictEqual(awakened.pot, oldPot);
  assert.strictEqual(awakened.mn, 47);
  assert.ok(awakened.kaiganState.targetTrainCapOVR >= 116 && awakened.kaiganState.targetTrainCapOVR <= 120);
  assert.strictEqual(awakened.kaiganState.remainingSeasons, 3);
});

section('開眼期間は3シーズンだけgamma=1.0・ageMul下限1.0になり、その後は通常物理へ戻る', () => {
  const base = fighter(6, '期間確認', 60, 110, { age: 27 });
  const active = {
    ...base,
    kaiganSeed: true,
    kaiganState: { triggeredSeason: 5, triggeredWeek: 10, remainingSeasons: 3 },
  };
  assert.strictEqual(Engine.kaigan.isActive(active, 5), true);
  assert.strictEqual(Engine.kaigan.isActive(active, 7), true);
  assert.strictEqual(Engine.kaigan.isActive(active, 8), false);
  const activeGain = Engine.growth.calcGrowth(Engine.rng.create(4004), { season: 7, lockerRoomMorale: 60 }, active, 'pw', 1);
  const normalGain = Engine.growth.calcGrowth(Engine.rng.create(4004), { season: 7, lockerRoomMorale: 60 }, base, 'pw', 1);
  assert.ok(activeGain > normalGain, `${activeGain} <= ${normalGain}`);
  const expiredGain = Engine.growth.calcGrowth(Engine.rng.create(4004), { season: 8, lockerRoomMorale: 60 }, active, 'pw', 1);
  assert.strictEqual(expiredGain, normalGain);
});

section('発火資格はシード・年齢・格上差・好試合/勝利・在籍/出場をすべて要求する', () => {
  withRates(0.015, 1, () => {
    const base = fighter(7, '資格確認', 55, 90, { kaiganSeed: true });
    const state = stateWithSElite(base);
    const good = { selfOvr: 55, opponentOvr: 63, opponentId: 901, matchIndex: 0, mq: 72, won: false };
    assert.ok(Engine.kaigan.tryTrigger(state, base, good));
    assert.strictEqual(Engine.kaigan.tryTrigger(state, { ...base, kaiganSeed: undefined }, good), null);
    assert.strictEqual(Engine.kaigan.tryTrigger(state, { ...base, age: 18 }, good), null);
    assert.strictEqual(Engine.kaigan.tryTrigger(state, base, { ...good, opponentOvr: 62 }), null);
    assert.strictEqual(Engine.kaigan.tryTrigger(state, base, { ...good, mq: 71 }), null);
    assert.ok(Engine.kaigan.tryTrigger(state, base, { ...good, mq: 20, won: true }));
    assert.strictEqual(Engine.kaigan.tryTrigger(state, base, { ...good, wasInjured: true }), null);
    assert.strictEqual(Engine.kaigan.tryTrigger(state, base, { ...good, isFreeAgent: true }), null);
  });
});

section('試合結果の共通入口はシングルだけを処理し、既存ログ/新聞の形へ変換する', () => {
  withRates(0.015, 1, () => {
    const candidate = fighter(8, '実戦候補', 55, 90, { kaiganSeed: true });
    const opponent = fighter(9, '格上', 70, 105);
    const state = stateWithSElite(candidate, { roster: [candidate, opponent] });
    const singles = Engine.kaigan.processMatchResults(state, [candidate, opponent], [{
      left: { ...candidate }, right: { ...opponent }, winner: 'right', mq: 75,
    }], { orgId: 'player', orgName: state.orgName });
    assert.strictEqual(singles.occurrences.length, 1);
    assert.ok(singles.roster.find(f => f.id === candidate.id).kaiganState);
    assert.match(Engine.kaigan.weeklyLog(singles.occurrences[0]), /開眼した/);
    assert.strictEqual(Engine.kaigan.industryEvent(singles.occurrences[0]).type, 'kaiganAwakening');

    const tag = Engine.kaigan.processMatchResults(state, [candidate, opponent], [{
      matchType: 'tag', left: { ...candidate }, right: { ...opponent }, winner: 'right', mq: 90,
    }], { orgId: 'player', orgName: state.orgName });
    assert.strictEqual(tag.occurrences.length, 0);
  });
});

section('I5. validateGameStateがシードなし・残季数範囲外・cap低下を検出する', () => {
  const broken = fighter(10, '破損データ', 50, 80, {
    kaiganState: {
      triggeredSeason: 2, triggeredWeek: 4, remainingSeasons: 4,
      targetTrainCapOVR: 115,
      capFloor: { pw: 90, sp: 80, te: 80, st: 80, mn: 80 },
      appliedTrainCap: { pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
    },
  });
  const oldWarn = console.warn;
  console.warn = () => {};
  let checked;
  try {
    checked = Engine.validateGameState({ season: 3, week: 8, roster: [broken], aiOrgs: {} });
  } finally {
    console.warn = oldWarn;
  }
  const messages = (checked.debugLog || []).map(entry => entry.message).filter(message => message.includes('開眼状態'));
  assert.ok(messages.some(message => message.includes('kaiganSeed')));
  assert.ok(messages.some(message => message.includes('remainingSeasons')));
  assert.ok(messages.some(message => message.includes('pw 開眼適用capが開眼前より低下')));
});

section('期間終了後の通常wearによるcap低下はI5違反にしない', () => {
  const candidate = fighter(11, '通常衰退', 90, 110, { kaiganSeed: true });
  const awakened = Engine.kaigan.applyAwakening(stateWithSElite(candidate), candidate, { opponentId: 901 });
  const naturallyDecayed = {
    ...awakened,
    trainCap: { ...awakened.trainCap, st: awakened.trainCap.st - 2 },
  };
  const oldWarn = console.warn;
  console.warn = () => {};
  let checked;
  try {
    checked = Engine.validateGameState({ season: 12, week: 1, roster: [naturallyDecayed], aiOrgs: {} });
  } finally {
    console.warn = oldWarn;
  }
  const messages = (checked.debugLog || []).map(entry => entry.message).filter(message => message.includes('開眼状態'));
  assert.deepStrictEqual(messages, []);
});

section('新聞は既存大ニュース系列・基礎315で、地の文3文かつ内部値/セリフを含まない', () => {
  const templates = NEWS_HEADLINE_TEMPLATES.kaiganAwakening;
  assert.strictEqual(templates.length, 1);
  assert.strictEqual(Engine.newspaper.PRIORITY.kaiganAwakening, Engine.newspaper.PRIORITY.hotProspectDebut);
  assert.ok(BIG_NEWS_TYPES.has('kaiganAwakening'));
  const text = `${templates[0].headline}${templates[0].body}`;
  assert.ok(!/(OVR|MQ|「|」)/.test(text));
  assert.strictEqual((templates[0].body.match(/。/g) || []).length, 3);
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\nAll kaigan invariant tests passed.');
