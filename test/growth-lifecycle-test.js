'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

const STATS = ['pw', 'sp', 'te', 'st', 'mn'];
const notion = { pw: 100, sp: 100, te: 100, st: 100, mn: 80 };
const cap = { pw: 100, sp: 100, te: 100, st: 100, mn: 80 };

function ovr(fighter) {
  return Math.round(STATS.reduce((total, stat) => total + fighter[stat], 0) / STATS.length);
}

function makeWearFighter(seasonMatchCount, traits = []) {
  return {
    id: 8100,
    name: 'Wear test',
    ...notion,
    notionValue: { ...notion },
    trainCap: { ...cap },
    traits,
    age: 25,
    durability: 0,
    wear: 0,
    strainDebt: 0,
    seasonInjuries: 0,
    seasonIntensiveWeeks: 0,
    seasonMatchCount,
  };
}

function testSharedEntryCurve() {
  assert.strictEqual(Engine.rival.getEntryMaturityRatio(20, ['早熟']), 0.96);
  assert.strictEqual(Engine.rival.getEntryMaturityRatio(20, []), 0.87);
  assert.strictEqual(Engine.rival.getEntryMaturityRatio(20, ['晩成']), 0.85);
  assert.strictEqual(Engine.rival.getEntryMaturityRatio(17, ['早熟']), 0.75);

  const early = Engine.rival.generateStartValues(Engine.rng.create(1), notion, cap, 20, ['早熟']);
  const standard = Engine.rival.generateStartValues(Engine.rng.create(1), notion, cap, 20, []);
  const late = Engine.rival.generateStartValues(Engine.rng.create(1), notion, cap, 20, ['晩成']);
  assert.ok(ovr(early) > ovr(standard), '20歳の早熟は標準より即戦力になる');
  assert.ok(ovr(standard) > ovr(late), '20歳の晩成は標準より未完成である');
  assert.strictEqual(early.mn, 80, 'MNTは年齢成熟率で削られない');
  assert.ok(STATS.every(stat => early[stat] <= cap[stat]), '初期値はtrainCapを超えない');
}

function testGrowthTypeDurability() {
  assert.strictEqual(Engine.growth.getEffectiveDurability({ durability: 0, traits: ['早熟'] }), 0,
    '早熟は寿命ペナルティを持たない');
  assert.strictEqual(Engine.growth.getEffectiveDurability({ durability: 0, traits: [] }), 0);
  assert.strictEqual(Engine.growth.getEffectiveDurability({ durability: 0, traits: ['晩成'] }), 1,
    '晩成の延命は+1に限定する');
}

function testWorkloadWearIsShared() {
  const state = { roster: [], coaches: [], coachAssign: {} };
  const light = Engine.growth.applySeasonTrainingWear(Engine.rng.create(44), state, makeWearFighter(8), 24);
  const normal = Engine.growth.applySeasonTrainingWear(Engine.rng.create(44), state, makeWearFighter(16), 24);
  const heavy = Engine.growth.applySeasonTrainingWear(Engine.rng.create(44), state, makeWearFighter(24), 24);
  const earlyHeavy = Engine.growth.applySeasonTrainingWear(Engine.rng.create(44), state, makeWearFighter(24, ['早熟']), 24);
  assert.ok(light.wear < normal.wear && normal.wear < heavy.wear,
    '実際の年間出場数が摩耗量を段階的に変える');
  assert.strictEqual(earlyHeavy.wear, heavy.wear,
    '早熟だけに別の出場摩耗補正は掛からない');
  assert.strictEqual(heavy.seasonMatchCount, 0, 'シーズン終了時に出場数をリセットする');
}

function testProspectLifecycle() {
  const prospect = {
    id: 8200,
    name: 'Prospect',
    pw: 50, sp: 50, te: 50, st: 50, mn: 60,
    notionValue: { ...notion },
    trainCap: { ...cap },
    traits: ['早熟'],
    age: 20,
    careerStage: 'prospect',
  };
  const matured = Engine.rival.syncProspectMaturity(Engine.rng.create(8), prospect);
  assert.ok(matured.pw >= 92, '20歳の未契約早熟は成熟曲線まで追いつく');
  assert.ok(matured.pw <= cap.pw, '待機中の成熟もtrainCapを超えない');
  const active = Engine.rival.syncProspectMaturity(Engine.rng.create(8), { ...prospect, careerStage: 'active' });
  assert.strictEqual(active.pw, prospect.pw, '現役経験者のFA化で無料の追いつきは発生しない');

  const template = { id: 8201, name: 'Factory', h: 165, ...notion, pot: { ...notion }, traits: [], style: 'Grappler', role: 'Neutral' };
  assert.strictEqual(Engine.rival.makeAIFighter(template, Engine.rng.create(9), null, 20).careerStage, 'prospect');
  assert.strictEqual(Engine.rival.makeAIFighter(template, Engine.rng.create(9), 'org_s', 20).careerStage, 'active');
}

function testLateStarterRemoval() {
  assert.ok(!TRAIT_DEFS['遅咲き'], '遅咲きは新規選択・生成の特性定義から削除される');
  assert.strictEqual(ageMultiplier(20, ['遅咲き']), ageMultiplier(20, []),
    '旧特性名は移行前でも独自の成長補正を持たない');
}

testSharedEntryCurve();
testGrowthTypeDurability();
testWorkloadWearIsShared();
testProspectLifecycle();
testLateStarterRemoval();

console.log('growth-lifecycle-test: ok');
