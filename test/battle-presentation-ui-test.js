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
assert.ok(html.includes("background-image:url('../image/battle-ring-bg-mockup-v2.png')"), 'ring background must be painted by the stationary live-ring container');
assert.ok(html.includes('.wm-ring-bg{display:none}'), 'the separately composited ring image must stay disabled');
assert.ok(!html.includes('.wm-ring-bg{position:absolute;z-index:-'), 'ring background must not use a negative compositing layer');
assert.ok(html.includes('.wm-live-ring .wm-ring-fighter{position:absolute;z-index:4;'), 'moving fighters must stay above the fixed ring layers');
assert.ok(html.includes('background:transparent!important'), 'moving fighter panels must not expose an opaque panel background');
assert.ok(html.includes('bottom:max(-80%,calc(100% - 105cqw));height:min(180%,105cqw)'), 'close-up must respond to the ring aspect ratio and cap zoom at 180%');
assert.ok(html.includes('bottom:-18%;left:50%;right:auto;height:118%'), 'both full-image canvases must share a centered anchor');
assert.ok(html.includes('translate:-50% 0'), 'full-image canvas centering must be independent of each character silhouette');
assert.ok(!html.includes('camera-close .wm-ring-fighter.left .wm-full-figure{right:-3%;transform:scaleX(-1) scale('), 'close-up must not apply a different secondary zoom to full-body assets');
assert.ok(main.includes("panel.classList.toggle('silhouette-danger'"), 'critical HP must drive the silhouette danger state');
assert.ok(html.includes('.wm-live-ring .danger-glow{display:none}'), 'legacy rectangular danger glow must be hidden in the live ring');
assert.ok(html.includes('.wm-ring-fighter.charging .wm-full-figure{animation:wmFigureChargeAura'), 'big-move charge glow must follow the transparent fighter image');
assert.ok(html.includes('box-shadow:none!important'), 'live-ring state effects must not restore rectangular panel shadows');
assert.ok(html.includes('--wm-figure-shadow:drop-shadow(0 0 0 transparent)'), 'moving fighters must not drag a black shadow across the stationary background');
assert.ok(html.includes('.wm-live-ring.attack-left .wm-ring-light.left,.wm-live-ring.attack-right .wm-ring-light.right{opacity:.22;transform:none}'), 'attack motion must not change the visible range of the ring lighting');
assert.ok(html.includes('.vic-speech{position:relative;max-width:460px;background:rgba(250,246,236,0.98)'), 'single victory dialogue must use the standard white speech bubble');
assert.ok(html.includes('.vic-speech-text{position:relative;z-index:1;font-size:15px;line-height:1.6;color:#2a2518'), 'single victory dialogue must use dark text');
assert.ok(!html.includes('var(--blue-light)') && !html.includes('var(--red-light)'), 'undefined side-color tokens must not be used');

assert.ok(mobile.includes('/* Single battle presentation v4 */'), 'single battle phone layout is missing');
assert.ok(mobile.includes('grid-template-areas: "main main" "left right"'), 'phone controls must keep the primary action centered above settings');
assert.ok(mobile.includes('.wm-stat-card .ability-bars { display: flex; }'), 'phone stat cards must retain the requested ability bars');

console.log('battle-presentation-ui-test: ok');
