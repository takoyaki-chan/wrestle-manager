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

function makeFighter(id, name, extra = {}) {
  return {
    id,
    name,
    style: 'Allround',
    popularity: 65,
    trust: 50,
    injury: null,
    ...extra,
  };
}

function buildState() {
  const base = Engine.createInitialState(77, true);
  const rental = makeFighter(201, 'Rental Star', {
    isRental: true,
    rentalFromOrg: 'org_a',
    rentalSeasonsLeft: 1,
  });
  const owned = makeFighter(202, 'Homegrown Ace', {
    popularity: 20,
  });

  return {
    ...base,
    season: 2,
    week: TRANSFER_CONFIG.windows[0],
    rankings: [
      { orgId: 'org_s', rank: 1 },
      { orgId: 'player', rank: 2 },
      { orgId: 'org_a', rank: 3 },
      { orgId: 'org_b', rank: 4 },
    ],
    roster: [rental, owned],
  };
}

function testTransferWindowSkipsRentalFighters() {
  const state = buildState();
  const rng = Engine.rng.create(1);
  const result = Engine.transfer.processTransferWindow(rng, state);

  assert.deepStrictEqual(result.state.pendingPoach, [], 'rental fighters should not receive poach offers');
  assert.ok(
    result.events.some(event => event.includes('引き抜きオファーなし')),
    'transfer window should report no offers when only rental fighters qualify'
  );
}

function testResolvePoachCleansLegacyRentalOffer() {
  const state = buildState();
  const rental = state.roster[0];
  const poachOrg = RIVAL_ORGS.find(org => org.id === 'org_s');
  const result = Engine.transfer.resolvePoach({
    ...state,
    pendingPoach: [{ fighter: rental, org: poachOrg, fee: 999 }],
  }, rental.id, true);

  assert.deepStrictEqual(result.state.pendingPoach, [], 'legacy rental poach offers should be cleared');
  assert.ok(result.state.roster.some(f => f.id === rental.id), 'rental fighter should stay on roster');
  assert.ok(result.events.includes('rental poach offer ignored'), 'legacy rental poach offers should be ignored');
}

testTransferWindowSkipsRentalFighters();
testResolvePoachCleansLegacyRentalOffer();

console.log('rental-poach-guard-test: ok');
