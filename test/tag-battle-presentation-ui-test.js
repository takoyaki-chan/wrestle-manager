'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');
const main = read('src', 'tag-battle-main.js');
const html = read('src', 'tag-battle.html');
const mobile = read('src', 'battle-mobile.css');

assert.ok(!main.includes('simulateMatch('), 'tag replay viewer must not simulate or recalculate a match');
assert.ok(!main.includes('Engine.battle'), 'tag replay viewer must remain presentation-only');
assert.ok(main.includes('S.frames = data.result.frames || []'), 'tag viewer must consume completed result.frames');

for (const hook of [
  'function _spawnAttackArrow',
  'function _showDmgPop',
  'function _showBigMoveSplash',
  'function animateTouchSwap',
  'function animateEvent',
  'function showCutin',
  'function _finishPinSeq',
  'function showResult',
]) {
  assert.ok(main.includes(hook), `existing tag replay presentation hook is missing: ${hook}`);
}

assert.ok(main.includes('class="wm-tag-live-ring"'), 'approved wide live-ring layout is missing');
assert.ok(main.includes('class="wm-tag-lower-dock"'), 'approved tag lower dock is missing');
assert.ok(main.includes('getFullUrl(ch)'), 'ring wrestlers and temporary helpers must use full-body assets');
assert.ok(main.includes('getUpperUrl(ch)'), 'lower team cards must use upper-body assets');
assert.ok(main.includes('hudApronFillA') && main.includes('hudApronFillB'), 'both apron HP meters must remain visible in the HUD');
assert.ok(main.includes('S.logHtml = turnMarker + lines + S.logHtml'), 'new tag replay log entries must be prepended');

assert.ok(main.includes("showBanner('反撃のタッチ！'"), 'hot-tag presentation must use the approved Japanese label');
assert.ok(main.includes("showBanner('ダブルチーム！'"), 'double-team presentation must use Japanese');
assert.ok(main.includes("showBanner('カットイン！'"), 'save presentation must use Japanese');
assert.ok(!main.includes("showBanner('HOT TAG!'") && !main.includes("showBanner('DOUBLE TEAM!'") && !main.includes("showBanner('CUT IN!'"), 'legacy English-only event banners must be removed');

assert.ok(html.includes('.wm-tag-ring-helper{z-index:6;opacity:0'), 'apron figures must be hidden outside an actual ring entry');
assert.ok(html.includes('.wm-tag-live-ring.camera-close .wm-tag-full-figure{bottom:-105%;height:205%}'), 'all figures must share the same close-up scale');
assert.ok(html.includes('.wm-tag-ring-helper.left.show{left:19%;opacity:.96'), 'temporary left-side ring entry is missing');
assert.ok(html.includes('.wm-tag-ring-helper.right.show{right:19%;opacity:.96'), 'temporary right-side ring entry is missing');
assert.ok(html.includes('.tag-out-legal{animation:wmTagSlideOut'), 'fixed-scale slide animation must override the legacy tag swap');
assert.ok(html.includes('@keyframes wmTagSlideIn{from{transform:translateX('), 'tag swaps must enter horizontally at a fixed scale');
assert.ok(html.includes('grid-template-columns:1fr auto 1fr'), 'primary tag replay button must remain at the exact center');
assert.ok(html.includes('.wm-tag-move-detail .wm-move-guide') && html.includes('font-size:11px'), 'tag move descriptions must use the approved readable size');
assert.ok(mobile.includes('/* Tag battle presentation v2 */'), 'tag presentation must retain a phone layout');
assert.ok(mobile.includes('.wm-tag-exchange-panel { grid-column: 1 / -1; grid-row: 1;'), 'phone tag layout must keep the exchange panel above both teams');

console.log('tag-battle-presentation-ui-test: ok');
