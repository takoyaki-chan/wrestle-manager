'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
const start = source.indexOf('commitRetirements(state, confirmedFighters)');
const end = source.indexOf('\n    },', start);
const commitRetirements = source.slice(start, end);

assert.ok(start >= 0, 'commitRetirements should exist');
assert.match(commitRetirements, /roster: surviving, retiredFighters:/,
  'retirement should first remove confirmed fighters from roster');
assert.match(commitRetirements, /Engine\.factions\.reconcileRoster\(s, factionRng\)/,
  'retirement should immediately reconcile faction membership');
assert.ok(
  commitRetirements.indexOf('roster: surviving') < commitRetirements.indexOf('Engine.factions?.reconcileRoster'),
  'faction reconciliation must run after the roster has been updated'
);

console.log('retire-faction-cleanup-test: ok');
