'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
const start = source.indexOf('resolvePoach(state, fighterIdToRelease, accepted)');
const end = source.indexOf('\n    },', start);
const resolvePoach = source.slice(start, end);

assert.ok(start >= 0, 'resolvePoach should exist');
assert.match(resolvePoach, /const liveFighter = \(s\.roster \|\| \[\]\)\.find\(c => c\.id === fighterIdToRelease\) \|\| poach\.fighter;/,
  'poach should capture the latest roster fighter before removal');
assert.strictEqual((resolvePoach.match(/applyTransferReset\(\{ \.\.\.liveFighter, orgId: targetId \}\)/g) || []).length, 2,
  'both accepted and failed-defense transfers should reset the live fighter');

console.log('poach-live-fighter-test: ok');
