const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

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

(function testRentalDoesNotInheritTemporaryGuestFlags() {
  const base = { ...Engine.createInitialState(381, true), funds: 999999 };
  const available = Engine.rental.getAvailableRentals(base).find(r => r.source === 'rival');
  assert.ok(available, 'rival rental candidate is required');

  const markedState = {
    ...base,
    aiOrgs: {
      ...base.aiOrgs,
      [available.org.id]: {
        ...base.aiOrgs[available.org.id],
        roster: base.aiOrgs[available.org.id].roster.map(f => f.id === available.fighter.id
          ? { ...f, isAwayChallengeGuest: true, isCRGuest: true, isB3ChallengeGuest: true }
          : f),
      },
    },
  };
  const result = Engine.rental.requestRental(
    Engine.rng.create(38), markedState, available.fighter.id, 'rival', available.org.id, 1
  );
  assert.strictEqual(result.success, true);
  const rental = result.state.roster.find(f => f.id === available.fighter.id && f.isRental);
  assert.ok(rental, 'rental must be added to player roster');
  assert.ok(!rental.isAwayChallengeGuest && !rental.isCRGuest && !rental.isB3ChallengeGuest,
    'rental must never inherit temporary challenge-guest markers');
})();

console.log('rental-challenge-guest-guard-test: ok');
