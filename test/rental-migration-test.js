const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const match = appSource.match(/if \(!G\._migrated_rental_v2\) \{[\s\S]*?G = \{ \.\.\.G, rentals, rental: undefined, _migrated_rental_v2: true \};\s*\}/);
if (!match) throw new Error('rental migration block not found');

const runMigration = new Function('G', `${match[0]}; return G;`);

(function testExistingRentalsArePreserved() {
  const migrated = runMigration({
    roster: [{ id: 80, name: 'Rental Star', isRental: true }],
    rentals: [{ fighterId: 80, fromSource: 'rival', fromOrgId: 'org_a', seasonsLeft: 2, fee: 120 }],
  });

  assert.strictEqual(migrated.rentals.length, 1, 'existing rentals should remain after migration');
  assert.strictEqual(migrated.rentals[0].fighterId, 80);
  assert.strictEqual(migrated._migrated_rental_v2, true);
})();

(function testLegacyRentalIsConvertedWithoutDuplication() {
  const migrated = runMigration({
    roster: [{ id: 91, name: 'Legacy Rental' }],
    rental: { fighterId: 91, fromOrgId: 'org_b' },
    rentals: [],
  });

  assert.strictEqual(migrated.rentals.length, 1, 'legacy rental should convert into rentals array');
  assert.deepStrictEqual(migrated.rentals[0], {
    fighterId: 91,
    fromSource: 'rival',
    fromOrgId: 'org_b',
    seasonsLeft: 1,
    fee: 0,
  });
  assert.strictEqual(migrated.roster[0].rentalSource, 'rival');
  assert.strictEqual(migrated.roster[0].rentalSeasonsLeft, 1);
})();

console.log('rental-migration-test: ok');