const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const match = appSource.match(/if \(G\.dormantPool && G\.dormantPool\.some\(e => \{[\s\S]*?\}\)\) \{[\s\S]*?\n      \}/);
if (!match) throw new Error('dormantPool migration block not found');

const runMigration = new Function('G', `${match[0]}; return G;`);

(function testLegacyDormantPoolStringsBecomeNumericEntries() {
  const migrated = runMigration({
    dormantPool: ['101', 102, { id: '103', age: '19' }, { id: 104, age: 30 }, 'bad-id'],
  });

  assert.deepStrictEqual(migrated.dormantPool, [
    { id: 101, age: 17 },
    { id: 102, age: 17 },
    { id: 103, age: 19 },
    { id: 104, age: 21 },
  ]);
})();

console.log('dormant-pool-migration-test: ok');
