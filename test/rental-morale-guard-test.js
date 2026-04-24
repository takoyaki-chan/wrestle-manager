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

function makeFighter(id, extra = {}) {
  return {
    id,
    name: `Fighter ${id}`,
    style: 'Allround',
    personality: 'normal',
    archetype: 'normal',
    popularity: 40,
    trust: 50,
    injury: null,
    ...extra,
  };
}

(function testRentalDoesNotDragLockerRoomMorale() {
  const state = { lockerRoomMorale: 60, lastShowResults: [] };
  const ownedRoster = [makeFighter(1, { trust: 60 })];
  const withRental = [...ownedRoster, makeFighter(2, { isRental: true, trust: 0 })];

  const ownedOnlyMorale = Engine.trust.updateLockerRoomMorale(state, { roster: ownedRoster });
  const withRentalMorale = Engine.trust.updateLockerRoomMorale(state, { roster: withRental });

  assert.strictEqual(withRentalMorale, ownedOnlyMorale, 'rental fighters should not affect locker room morale calculations');
})();

(function testDepartureImpactSkipsRentalRosterMembers() {
  const roster = [
    makeFighter(1, { trust: 55 }),
    makeFighter(2, { isRental: true, trust: 55 }),
  ];
  const relationships = {
    [Engine.relationships._key(1, 99)]: { bond: 80 },
    [Engine.relationships._key(2, 99)]: { bond: 80 },
  };

  const impacted = Engine.trust.applyDepartureTrustImpact(roster, 99, relationships, { name: 'Departed' });

  assert.ok(impacted[0].trust < roster[0].trust, 'owned roster members should still receive departure trust impact');
  assert.strictEqual(impacted[1].trust, roster[1].trust, 'rental roster members should not receive departure trust impact');
})();

console.log('rental-morale-guard-test: ok');
