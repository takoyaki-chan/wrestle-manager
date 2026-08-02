'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');
const main = read('src', 'battle-engine-main.js');
const html = read('src', 'battle-engine.html');
const mobile = read('src', 'battle-mobile.css');

assert.ok(!main.includes('simulateMatch('), 'replay viewer must not simulate or recalculate a match');
assert.ok(!main.includes('Engine.battle'), 'replay viewer must not call the battle engine');
assert.ok(main.includes('S.frames   = (data.result && data.result.frames) || []'), 'viewer must consume the completed result.frames');

for (const hook of [
  'function _spawnMissEffect',
  'function _spawnAttackArrow',
  'function _showDmgPop',
  'function _showBigMoveSplash',
  'function showCutin',
  'function _finishPinSeq',
  'function showResult',
]) {
  assert.ok(main.includes(hook), `existing replay presentation hook is missing: ${hook}`);
}

assert.ok(main.includes('_getFullUrl(ch)'), 'live ring must use full-body assets');
assert.ok(main.includes('_getUpperUrl(ch)'), 'stat cards must use upper-body assets');
assert.ok(main.includes('class="wm-live-ring"'), 'approved live-ring layout is missing');
assert.ok(main.includes('class="wm-lower-dock"'), 'approved lower information dock is missing');
assert.ok(main.includes('${_matchBadgeHtml()}'), 'big/rivalry match badge must be embedded in the live ring');
assert.ok(!main.includes('bigmatch-strip') && !html.includes('.bigmatch-strip'), 'legacy full-width big/rivalry match strip must be removed');
const badgeStart = main.indexOf('function _matchBadgeHtml');
const badgeEnd = main.indexOf('// ─── ライブリング', badgeStart);
assert.ok(badgeStart >= 0 && badgeEnd > badgeStart && !main.slice(badgeStart, badgeEnd).includes('<img'), 'compact match badge must not contain fighter images');
assert.ok(main.includes('次の攻防 ▶'), 'primary replay button must use the approved simple label');
assert.ok(main.includes('function _buildAutoCameraPlan'), 'intentional automatic camera plan is missing');
assert.ok(main.includes('holdUntil = Math.max(holdUntil, index + 1)'), 'automatic close-up must hold through the next exchange');
assert.ok(main.includes('function previousFrame'), 'display-only one-frame rewind is missing');
assert.ok(main.includes('S.logHtml = turnMarker + lines + S.logHtml'), 'new replay log entries must be prepended');

assert.ok(main.includes('../image/battle-ring-bg-mockup-v2.png'), 'approved illustrated ring background is missing');
assert.ok(html.includes('.wm-stat-card.right .ab-fill{margin-left:auto}'), 'right stat bars must grow from the portrait side');
assert.ok(html.includes("content:'実況'"), 'angular commentary panel must retain its broadcast label during effects');
assert.ok(html.includes('grid-template-columns:1fr auto 1fr'), 'primary replay button must remain at the exact center');
assert.ok(html.includes('.wm-live-ring.camera-close .wm-ring-fighter .wm-full-figure{bottom:-105%;height:205%}'), 'close-up must retain the full-image canvas top edge');
assert.ok(!html.includes('camera-close .wm-ring-fighter.left .wm-full-figure{right:-3%;transform:scaleX(-1) scale('), 'close-up must not apply a different secondary zoom to full-body assets');
assert.ok(!html.includes('var(--blue-light)') && !html.includes('var(--red-light)'), 'undefined side-color tokens must not be used');

assert.ok(mobile.includes('/* Single battle presentation v4 */'), 'single battle phone layout is missing');
assert.ok(mobile.includes('grid-template-areas: "main main" "left right"'), 'phone controls must keep the primary action centered above settings');
assert.ok(mobile.includes('.wm-stat-card .ability-bars { display: flex; }'), 'phone stat cards must retain the requested ability bars');

console.log('battle-presentation-ui-test: ok');
