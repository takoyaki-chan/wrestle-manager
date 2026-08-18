'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const start = app.indexOf('  _runPostMatchFlavorForMatch(idx, result, then) {');
const end = app.indexOf('\n  // ── Phase B-2:', start);
assert.ok(start >= 0 && end > start, 'post-match flavor handler is missing');
const handler = app.slice(start, end);

assert.ok(handler.includes('let completed = false;'),
  'post-match flavor completion must be tracked per match');
assert.ok(handler.includes('const finish = () => {'),
  'post-match flavor completion must be idempotent');
assert.ok(handler.includes('_chainEventPopupQueueEmpty(finish);'),
  'post-match flavor must wait for the shared popup queue through its local completion');
assert.ok(handler.includes('if (!completed) {'),
  'safety timeout must only advance an unfinished match');
assert.ok(handler.includes("console.warn('[WM] postMatchFlavor safety net fired');"),
  'an unfinished post-match popup must remain reportable to players');
assert.ok(!handler.includes('_onEventPopupQueueEmpty = null'),
  'post-match timeout must not cancel another popup flow');

console.log('post-match-flavor-safety-net-test: ok');
