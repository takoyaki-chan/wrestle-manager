'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

const result = spawnSync(process.execPath, [path.join(__dirname, 'stale-lint.js'), '--strict'], {
  cwd: path.join(__dirname, '..'),
  encoding: 'utf8',
});

assert.strictEqual(result.status, 0, result.stderr || result.stdout);
assert.match(result.stdout, /no stale source-string assertions found\./,
  'the stale-test detector should have no false positives');

console.log('stale-lint-contract-test: ok');
