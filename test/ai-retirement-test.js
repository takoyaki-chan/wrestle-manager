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

function makeFighter(extra = {}) {
  return {
    id: 999,
    name: 'Veteran',
    pw: 60,
    sp: 60,
    te: 60,
    st: 60,
    mn: 60,
    notionValue: { pw: 60, sp: 60, te: 60, st: 60, mn: 60 },
    age: 33,
    wear: 10,
    lowPerformanceSeasons: 0,
    ...extra,
  };
}

function withForcedRoll(value, fn) {
  const originalFloat = Engine.rng.float;
  Engine.rng.float = () => value;
  try {
    fn();
  } finally {
    Engine.rng.float = originalFloat;
  }
}

function testAgeFallbackGuaranteesRetirementAtThirtyThree() {
  withForcedRoll(0.99, () => {
    const fighter = makeFighter({ age: 33, wear: 10 });
    assert.strictEqual(
      Engine.rival.checkRetirement({}, fighter),
      true,
      '33-year-olds should always retire even if wear stayed low'
    );
  });
}

function testThirtyTwoIsHighRiskButNotGuaranteed() {
  const fighter = makeFighter({ age: 32, wear: 10 });
  withForcedRoll(0.74, () => {
    assert.strictEqual(
      Engine.rival.checkRetirement({}, { ...fighter }),
      true,
      '32-year-olds should usually retire under the fallback table'
    );
  });
  withForcedRoll(0.76, () => {
    assert.strictEqual(
      Engine.rival.checkRetirement({}, { ...fighter }),
      false,
      '32-year-olds should still have a narrow chance to continue'
    );
  });
}

function testWearStillWinsBeforeAgeFallback() {
  withForcedRoll(0.99, () => {
    const fighter = makeFighter({ age: 30, wear: 80 });
    assert.strictEqual(
      Engine.rival.checkRetirement({}, fighter),
      true,
      'existing wear-based retirement should stay intact'
    );
  });
}

testAgeFallbackGuaranteesRetirementAtThirtyThree();
testThirtyTwoIsHighRiskButNotGuaranteed();
testWearStillWinsBeforeAgeFallback();

console.log('ai-retirement-test: ok');
