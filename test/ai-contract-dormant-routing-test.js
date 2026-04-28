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

(function testAiDepartureFallsBackToDormantWhenFaIsFull() {
  const originalFloat = Engine.rng.float;
  const originalInt = Engine.rng.int;
  Engine.rng.float = (() => {
    const rolls = [0.0, 0.6];
    return () => rolls.shift() ?? 0.0;
  })();
  Engine.rng.int = () => 0;

  try {
    const fighter = makeFighter();
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

    assert.strictEqual(result.departures.length, 1, 'one low-trust fighter should depart');
    assert.strictEqual(result.departures[0].destination, 'dormant', 'news payload should reflect dormant fallback');
    assert.ok(state.dormantPool.some(entry => entry.id === fighter.id), 'fighter should be routed into dormantPool');
    assert.strictEqual(state.freeAgents.some(entry => entry.id === fighter.id), false, 'fighter should not appear in FA list');
  } finally {
    Engine.rng.float = originalFloat;
    Engine.rng.int = originalInt;
  }
})();

console.log('ai-contract-dormant-routing-test: ok');
