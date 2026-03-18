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

function buildState() {
  const base = Engine.createInitialState(123, true);
  const fromOrgId = 'org_s';
  const orgData = base.aiOrgs[fromOrgId];
  const fighter = [...orgData.roster]
    .sort((a, b) => Engine.util.ov(a) - Engine.util.ov(b))
    .find(f => !f.injury);

  return {
    state: {
      ...base,
      funds: 999999,
      rankings: [
        { orgId: 'org_s', rating: 500, rank: 1 },
        { orgId: 'org_a', rating: 420, rank: 2 },
        { orgId: 'org_b', rating: 340, rank: 3 },
        { orgId: 'player', rating: 100, rank: 4 },
      ],
    },
    fromOrgId,
    fighter,
  };
}

(function testRivalRentalAlwaysSucceedsWhenAffordable() {
  const { state, fromOrgId, fighter } = buildState();

  for (let seed = 1; seed <= 25; seed++) {
    const rng = Engine.rng.create(seed);
    const result = Engine.rental.requestRental(rng, state, fighter.id, 'rival', fromOrgId, 1);
    assert.strictEqual(result.success, true, `rental should succeed for seed ${seed}`);
    assert.ok(result.state.rentals.some(r => r.fighterId === fighter.id), 'rental contract should be added');
    assert.ok(result.state.roster.some(c => c.id === fighter.id && c.isRental), 'rental fighter should join roster');
  }
})();

console.log('rental-guaranteed-success-test: ok');