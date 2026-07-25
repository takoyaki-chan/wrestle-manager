const assert = require('assert');
const { readSource } = require('./helpers/source');

const index = readSource('src', 'index.html');
const mobile = readSource('src', 'mobile.css');
const app = readSource('src', 'app.js');
const uiRender = readSource('src', 'ui-render.js');

assert.ok(
  mobile.includes('.title-screen,') && mobile.includes('z-index: 9000;'),
  'title and setup overlays must cover the fixed phone navigation'
);
assert.ok(
  uiRender.includes('opening-org-line${orgLengthClass}') &&
    index.includes('.opening-org-line{display:block') &&
    index.includes('white-space:nowrap'),
  'the promotion name must start on its own unbroken line'
);
assert.ok(
  uiRender.includes('let _openingTransitioning = false;') &&
    uiRender.includes('if (_openingTransitioning) return;') &&
    uiRender.includes("currentEl.style.display = 'none'"),
  'opening acts must switch sequentially without duplicated text'
);
// 挨拶セリフは各選手の頭上に吹き出しで配置される(team-bubble)。過去の team-greetings
// ブロックは廃止済み(2026-07-23 セリフは吹き出しに収めるのが基本形の裁定)。
// 配列そのものを抽出して「5人分・全員非空」を behavior として検証する(文字列一致に頼らない)。
const foundingGreetingsMatch = app.match(/const foundingGreetings = \[([\s\S]*?)\];/);
assert.ok(foundingGreetingsMatch, 'foundingGreetings array must be defined in app.js');
const foundingGreetings = foundingGreetingsMatch[1]
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith("'") || line.startsWith('"'));
assert.strictEqual(foundingGreetings.length, 5, 'all 5 founding members need a greeting line');
assert.ok(
  foundingGreetings.every(line => line.replace(/^['",]+|['",]+$/g, '').trim().length > 0),
  'every founding greeting line must be non-empty'
);
assert.ok(
  app.includes('class="team-bubble"'),
  'greetings must render as per-member overhead speech bubbles (team-bubble)'
);
assert.ok(
  index.includes('.completion-overlay.show .team-bubble'),
  'team-bubble must be revealed once the completion overlay is shown'
);
// 2026-07-25 Keisuke決定: モバイルは吹き出しを画像の下へ反転させず、5人を1人ずつ順番に見せる。
// 旧・偶数番だけ order:3 で反転させる場当たり対応は撤去済みであること。
assert.ok(
  !index.includes("nth-child(even) .team-bubble{order:3"),
  'team-bubble must no longer flip below the portrait on even members (mobile one-speaker-at-a-time replaces it)'
);
assert.ok(
  /@media\(max-width:900px\)[\s\S]*?teamBubbleSpotlight/.test(index) &&
    index.includes('var(--greeting-index) * 2.6s') &&
    index.includes('animation:teamBubbleSpotlight'),
  'mobile team-bubble must cycle one speaker at a time via a --greeting-index-driven CSS animation instead of showing all 5 at once'
);

console.log('opening-scene-ui-test: ok');
