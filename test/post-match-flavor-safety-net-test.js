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
// 2026-09-26: 敗者の心は汎用の列(showEventPopup/_chainEventPopupQueueEmpty)を通さず、試合一覧の殻の上に
// 自分で出して完了を返す(showPostMatchFlavorPopups)。汎用の列は殻の後ろで止まるので、そこを待つと毎試合保険が発火していた
// (動きの検査は post-match-flavor-over-show-shell-test.js)
assert.ok(handler.includes('showPostMatchFlavorPopups(popups, finish)'),
  'post-match flavor must draw over the show shell and report completion through its local finish');
assert.ok(!handler.includes('showEventPopup(') && !handler.includes('_chainEventPopupQueueEmpty('),
  'post-match flavor must not wait on the shared event popup queue (it is gated behind the show shell)');
assert.ok(handler.includes('flavor.cancel()'),
  'the safety net must withdraw a flavor popup that never got on screen');
assert.ok(handler.includes('if (!completed) {'),
  'safety timeout must only advance an unfinished match');
assert.ok(handler.includes("console.warn('[WM] postMatchFlavor safety net fired');"),
  'an unfinished post-match popup must remain reportable to players');
assert.ok(!handler.includes('_onEventPopupQueueEmpty = null'),
  'post-match timeout must not cancel another popup flow');

console.log('post-match-flavor-safety-net-test: ok');
