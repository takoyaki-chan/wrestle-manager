const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

function makeState() {
  return {
    season: 3,
    week: 8,
    rngSeed: 24680,
    roster: [
      { id: 1, name: 'A', pw: 60, sp: 60, te: 60, st: 60, mn: 60, style: 'Allround' },
      { id: 2, name: 'B', pw: 60, sp: 60, te: 60, st: 60, mn: 60, style: 'Allround' },
    ],
    aiOrgs: {},
    matchupLog: [],
    relationships: {
      '1>2': { bond: 20, rivalry: 35 },
      '2>1': { bond: 20, rivalry: 35 },
    },
    relationshipCounters: {},
  };
}

function makeContext(overrides = {}) {
  return {
    mq: 70,
    winner: 'win',
    hpA: { final: 40, max: 100 },
    hpB: { final: 0, max: 100 },
    turns: 10,
    stage: 'normal',
    isTitleMatch: false,
    rivalryResolved: true,
    rivalryResolutionValue: 35,
    rivalryResolutionType: 'bitter',
    injuredId: null,
    isCareerBestA: false,
    isCareerBestB: false,
    losingStreakA: 0,
    losingStreakB: 0,
    isProveModeA: false,
    isProveModeB: false,
    isCrossOrg: false,
    ovrA: 60,
    ovrB: 60,
    ...overrides,
  };
}

function apply(context, seed = 1000) {
  return Engine.relationships.applyMatchResult(
    makeState(),
    1,
    2,
    context,
    Engine.rng.create(seed)
  );
}

function testExplicitResolutionBandsAreAuthoritative() {
  [
    { type: 'first', value: 27 },
    { type: 'goodRival', value: 3 },
    { type: 'bitter', value: 35 },
  ].forEach(({ type, value }, index) => {
    const next = apply(makeContext({
      rivalryResolutionType: type,
      rivalryResolutionValue: value,
    }), 1100 + index);

    assert.strictEqual(next.relationships['1>2'].rivalry, value, `${type}: A>B should keep the selected band value`);
    assert.strictEqual(next.relationships['2>1'].rivalry, value, `${type}: B>A should keep the selected band value`);
  });
}

function testBitterResolutionDoesNotReconcileThePair() {
  const bitter = apply(makeContext(), 1200);
  const ordinary = apply(makeContext({
    rivalryResolved: false,
    rivalryResolutionValue: undefined,
    rivalryResolutionType: undefined,
  }), 1200);

  assert.strictEqual(
    bitter.relationships['1>2'].bond,
    ordinary.relationships['1>2'].bond,
    'bitter resolution should not add the reconciliation bond bonus'
  );
  assert.strictEqual(
    bitter.relationships['2>1'].bond,
    ordinary.relationships['2>1'].bond,
    'bitter resolution should not add the reconciliation bond bonus in the reverse direction'
  );
}

function testCopyClarifiesBitterResolutionAndAwardDialogue() {
  const root = path.resolve(__dirname, '..');
  const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
  const data = fs.readFileSync(path.join(root, 'src', 'data.js'), 'utf8');

  assert.ok(ui.includes('決 着、な お 宿 怨'));
  assert.ok(ui.includes('勝敗は決した。しかし、遺恨は消えなかった'));
  assert.ok(!ui.includes('ふたりは「宿怨」になった'));
  assert.ok(data.includes('すっごく楽しかった！ 終わった瞬間「もう1回！」って思ったもん'));
  assert.ok(!data.includes('すっげー楽しかった！'));
}

testExplicitResolutionBandsAreAuthoritative();
testBitterResolutionDoesNotReconcileThePair();
testCopyClarifiesBitterResolutionAndAwardDialogue();

console.log('rivalry-resolution-regression-test: ok');
