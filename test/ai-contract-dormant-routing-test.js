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
loadAsGlobal('relationships.js');

function makeFighter(extra = {}) {
  return {
    id: 501,
    name: '片桐ありさ',
    age: 27,
    pw: 72,
    sp: 68,
    te: 66,
    st: 64,
    mn: 61,
    notionValue: { pw: 72, sp: 68, te: 66, st: 64, mn: 61 },
    trust: 10,
    traits: [],
    orgTimeline: [{ orgId: 'org_s', fromSeason: 1, fromWeek: 1 }],
    ...extra,
  };
}

// K-4 R2(2026-09-26): デビュー済みの選手は FA が満杯でも FA へ(休眠プールに入ると同じIDが
// 別人として作り直されるため)。休眠プールへ退避するのは、まだデビューしていない見込み選手だけ。
function runDeparture(fighterExtra) {
  const originalFloat = Engine.rng.float;
  const originalInt = Engine.rng.int;
  Engine.rng.float = (() => {
    const rolls = [0.0, 0.6];
    return () => rolls.shift() ?? 0.0;
  })();
  Engine.rng.int = () => 0;

  try {
    const fighter = makeFighter(fighterExtra);
    const roster = [
      fighter,
      makeFighter({ id: 502, trust: 80 }),
      makeFighter({ id: 503, trust: 80 }),
      makeFighter({ id: 504, trust: 80 }),
      makeFighter({ id: 505, trust: 80 }),
      makeFighter({ id: 506, trust: 80 }),
    ];
    const state = {
      season: 3,
      aiOrgs: {
        org_s: { roster: roster.map(f => ({ ...f })), titles: {} },
        org_a: { roster: Array.from({ length: 12 }, (_, i) => makeFighter({ id: 600 + i, trust: 80 })) },
        org_b: { roster: Array.from({ length: 12 }, (_, i) => makeFighter({ id: 700 + i, trust: 80 })) },
        org_c: { roster: Array.from({ length: 12 }, (_, i) => makeFighter({ id: 800 + i, trust: 80 })) },
      },
      freeAgents: Array.from({ length: ROSTER_CFG.fa }, (_, i) => makeFighter({ id: 900 + i })),
      dormantPool: [],
      relationships: {},
    };

    const result = Engine.rival.processAIContracts({}, roster.map(f => ({ ...f })), 'org_s', 'S', state);
    return { result, state, fighter };
  } finally {
    Engine.rng.float = originalFloat;
    Engine.rng.int = originalInt;
  }
}

(function testDebutedAiDepartureGoesToFaEvenWhenFaIsFull() {
  const { result, state, fighter } = runDeparture({ careerStage: 'active' });
  assert.strictEqual(result.departures.length, 1, 'one low-trust fighter should depart');
  assert.strictEqual(result.departures[0].destination, 'fa', 'news payload should say FA');
  const inFa = state.freeAgents.find(entry => entry.id === fighter.id);
  assert.ok(inFa, 'debuted fighter should be in FA even though FA was full');
  assert.strictEqual(state.freeAgents.length, ROSTER_CFG.fa + 1, 'FA cap does not apply to debuted fighters');
  assert.strictEqual(inFa.faSince, 3, 'faSince should record the season the fighter entered FA');
  assert.strictEqual(inFa.faFromOrgId, 'org_s', 'faFromOrgId should record the org the fighter left');
  assert.strictEqual(state.dormantPool.some(entry => entry.id === fighter.id), false, 'debuted fighter must not enter dormantPool');
})();

(function testProspectDepartureStillFallsBackToDormantWhenFaIsFull() {
  const { result, state, fighter } = runDeparture({ careerStage: 'prospect' });
  assert.strictEqual(result.departures.length, 1, 'one low-trust fighter should depart');
  assert.strictEqual(result.departures[0].destination, 'dormant', 'news payload should reflect dormant fallback');
  assert.ok(state.dormantPool.some(entry => entry.id === fighter.id), 'prospect should be routed into dormantPool');
  assert.strictEqual(state.freeAgents.some(entry => entry.id === fighter.id), false, 'prospect should not appear in FA list');
})();

console.log('ai-contract-dormant-routing-test: ok');
