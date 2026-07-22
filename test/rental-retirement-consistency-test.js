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

function buildRentedState() {
  const base = { ...Engine.createInitialState(8128, true), funds: 999999 };
  const fromOrgId = 'org_s';
  const candidates = Engine.rental.getAvailableRentals(base).filter(r => r.org.id === fromOrgId);
  assert.ok(candidates.length > 0, 'a rival rental candidate should exist');
  const fighter = candidates[0].fighter;
  const result = Engine.rental.requestRental(
    Engine.rng.create(99), base, fighter.id, 'rival', fromOrgId, 1
  );
  assert.strictEqual(result.success, true);
  return { state: result.state, fighter, fromOrgId };
}

(function testRetirementEndsContractAndRemovesSourceCopy() {
  const { state, fighter, fromOrgId } = buildRentedState();
  assert.ok(state.aiOrgs[fromOrgId].roster.some(f => f.id === fighter.id));

  const retired = Engine.rental.terminateForRetirement(state, fighter.id);

  assert.ok(!retired.rentals.some(r => r.fighterId === fighter.id));
  assert.ok(!retired.aiOrgs[fromOrgId].roster.some(f => f.id === fighter.id));
})();

(function testWeeklyProcessingDropsOrphanContractImmediately() {
  const { state, fighter } = buildRentedState();
  const orphaned = {
    ...state,
    roster: state.roster.filter(f => f.id !== fighter.id),
  };

  const result = Engine.rental.processWeeklyRental(orphaned);

  assert.ok(!result.state.rentals.some(r => r.fighterId === fighter.id));
  assert.ok(result.events.some(e => e.includes('レンタル契約を整理')));
})();

(function testLoadRepairPreservesValidRivalRentalCopies() {
  const { state, fighter, fromOrgId } = buildRentedState();

  const repaired = Engine.saveDoctor.repairOnLoad(state).state;

  assert.ok(repaired.rentals.some(r => r.fighterId === fighter.id));
  assert.ok(repaired.roster.some(f => f.id === fighter.id && f.isRental));
  assert.ok(repaired.aiOrgs[fromOrgId].roster.some(f => f.id === fighter.id));
})();

(function testLoadRepairRemovesRetiredOrphanAndSourceCopy() {
  const { state, fighter, fromOrgId } = buildRentedState();
  const orphaned = {
    ...state,
    roster: state.roster.filter(f => f.id !== fighter.id),
    retiredIds: [...(state.retiredIds || []), fighter.id],
    retiredFighters: [...(state.retiredFighters || []), fighter],
  };

  const repair = Engine.saveDoctor.repairOnLoad(orphaned);

  assert.ok(!repair.state.rentals.some(r => r.fighterId === fighter.id));
  assert.ok(!repair.state.aiOrgs[fromOrgId].roster.some(f => f.id === fighter.id));
  assert.ok(repair.changes.includes('rental_orphan_contracts_removed:1'));
})();

(function testBothSinglesRetirementBranchesTerminateRentals() {
  const source = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  const calls = source.match(/Engine\.rental\.terminateForRetirement\(s, (?:lc|rc)\.id\)/g) || [];
  assert.strictEqual(calls.length, 2, 'both sides of a singles match must terminate retired rentals');
})();

console.log('rental-retirement-consistency-test: ok');
