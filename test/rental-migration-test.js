const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const matchV2 = appSource.match(/if \(!G\._migrated_rental_v2\) \{[\s\S]*?G = \{ \.\.\.G, rentals, roster, rental: undefined, _migrated_rental_v2: true \};\s*\}/);
if (!matchV2) throw new Error('rental v2 migration block not found');
const matchV3 = appSource.match(/if \(!G\._migrated_rental_v3\) \{[\s\S]*?\} else if \(\(G\.roster \|\| \[\]\)\.some\(c => c\?\.isRental && c\.rentalSeasonsLeft !== undefined && c\.rentalWeeksLeft === undefined\)\) \{[\s\S]*?G = \{ \.\.\.G, roster \};\s*\}/);
if (!matchV3) throw new Error('rental v3 migration block not found');

const runMigrationV2 = new Function('G', `${matchV2[0]}; return G;`);
const runMigrationV3 = new Function('G', `${matchV3[0]}; return G;`);

(function testExistingRentalsArePreserved() {
  const migrated = runMigrationV2({
    roster: [{ id: 80, name: 'Rental Star', isRental: true }],
    rentals: [{ fighterId: 80, fromSource: 'rival', fromOrgId: 'org_a', seasonsLeft: 2, fee: 120 }],
  });

  assert.strictEqual(migrated.rentals.length, 1, 'existing rentals should remain after migration');
  assert.strictEqual(migrated.rentals[0].fighterId, 80);
  assert.strictEqual(migrated._migrated_rental_v2, true);
})();

(function testLegacyRentalIsConvertedWithoutDuplication() {
  const migrated = runMigrationV2({
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
  assert.strictEqual(migrated.roster[0].isRental, true);
})();

(function testRentalV3ConvertsRosterFieldToWeeks() {
  const migrated = runMigrationV3({
    roster: [{ id: 91, name: 'Legacy Rental', isRental: true, rentalSource: 'rival', rentalSeasonsLeft: 1 }],
    rentals: [{ fighterId: 91, fromSource: 'rival', fromOrgId: 'org_b', seasonsLeft: 1, fee: 0 }],
  });

  assert.strictEqual(migrated.rentals[0].weeksLeft, 12);
  assert.strictEqual(migrated.rentals[0].seasonsLeft, undefined);
  assert.strictEqual(migrated.roster[0].rentalWeeksLeft, 12);
  assert.strictEqual(migrated.roster[0].rentalSeasonsLeft, undefined);
})();

(function testRentalV3BackfillsLegacyRosterFieldEvenAfterMigrationFlag() {
  const migrated = runMigrationV3({
    _migrated_rental_v3: true,
    roster: [{ id: 101, name: 'Half Migrated', isRental: true, rentalSeasonsLeft: 2 }],
    rentals: [],
  });

  assert.strictEqual(migrated.roster[0].rentalWeeksLeft, 24);
  assert.strictEqual(migrated.roster[0].rentalSeasonsLeft, undefined);
})();

console.log('rental-migration-test: ok');
