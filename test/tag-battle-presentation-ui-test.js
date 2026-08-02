'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');
const main = read('src', 'tag-battle-main.js');
const html = read('src', 'tag-battle.html');
const lines = read('src', 'tag-battle-lines.js');
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
assert.ok(html.includes('.wm-tag-live-ring.camera-close .wm-tag-ring-fighter .wm-tag-full-figure{bottom:-80%;height:180%;bottom:max(-80%,calc(100% - 105cqw));height:min(180%,105cqw);animation:none!important'), 'tag close-up must cap zoom and suspend expensive silhouette animation');
assert.ok(html.includes('.wm-tag-live-ring.camera-close .wm-tag-ring-helper .wm-tag-full-figure{bottom:-18%;height:118%}'), 'off-ring helpers must not be enlarged during close-ups');
assert.ok(html.includes('.wm-tag-ring-helper.left.show{left:19%;opacity:.96'), 'temporary left-side ring entry is missing');
assert.ok(html.includes('.wm-tag-ring-helper.right.show{right:19%;opacity:.96'), 'temporary right-side ring entry is missing');
assert.ok(html.includes('.tag-out-legal{animation:wmTagSlideOut'), 'fixed-scale slide animation must override the legacy tag swap');
assert.ok(html.includes('@keyframes wmTagSlideIn{from{transform:translateX('), 'tag swaps must enter horizontally at a fixed scale');
assert.ok(html.includes('grid-template-columns:1fr auto 1fr'), 'primary tag replay button must remain at the exact center');
assert.ok(html.includes('.wm-tag-move-detail .wm-move-guide') && html.includes('font-size:11px'), 'tag move descriptions must use the approved readable size');
assert.ok(main.includes("cls.push('silhouette-danger')") && main.includes("current.classList.toggle('silhouette-danger'"), 'tag critical HP must keep the silhouette danger state in sync');
assert.ok(html.includes('.wm-tag-live-ring .danger-glow{display:none}'), 'legacy rectangular tag danger glow must be hidden');
assert.ok(html.includes('.wm-tag-ring-fighter.charging .wm-tag-full-figure{animation:wmFigureChargeAura'), 'tag big-move charge glow must follow the transparent fighter image');
assert.ok(html.includes('.wm-tag-ring-fighter.ff-flash .wm-tag-full-figure{animation:wmFigureFriendlyFlash'), 'tag event flashes must follow the transparent fighter image');
assert.ok(html.includes('.wm-tag-ring-fighter.tag-highlight .wm-tag-full-figure{animation:wmFigureTagTouchAura'), 'normal touch highlight must follow the incoming fighter silhouette');
assert.ok(html.includes('.wm-tag-ring-fighter.tag-highlight-hot .wm-tag-full-figure{animation:wmFigureHotTagTouchAura'), 'hot-tag highlight must follow the incoming fighter silhouette');
assert.ok(html.includes('.wm-tag-ring-fighter.tag-highlight-hot{animation:none}'), 'touch highlights must not animate the rectangular fighter panel');
assert.ok(html.includes('.vic-win-line{position:relative;margin-bottom:8px;padding:11px 16px;border:1px solid rgba(122,101,48,.52);border-radius:10px;color:#211d15;background:rgba(250,246,236,.98)'), 'tag victory dialogue must use the standard white speech bubble with dark text');
assert.ok(main.includes('const winLine = pickTagWinLine(winFinisher);'), 'winner dialogue must not receive a full partner name');
assert.ok(!main.includes('const lossLine =') && !main.includes('<div class="vic-loss-line">'), 'tag result must not force a loser quote into the winner-focused screen');
assert.ok(lines.includes('const TAG_MATCH_WIN_NAMELESS_LINES = {') && lines.includes('function pickTagWinLine(fighter) {'), 'tag winner dialogue must use a name-free line pool');
assert.ok(mobile.includes('/* Tag battle presentation v2 */'), 'tag presentation must retain a phone layout');
assert.ok(mobile.includes('.wm-tag-exchange-panel { grid-column: 1 / -1; grid-row: 1;'), 'phone tag layout must keep the exchange panel above both teams');

console.log('tag-battle-presentation-ui-test: ok');
