const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const index = read('src', 'index.html');
const battle = read('src', 'battle-engine.html');
const tagBattle = read('src', 'tag-battle.html');
const mobile = read('src', 'mobile.css');
const battleMobile = read('src', 'battle-mobile.css');
const uiCommon = read('src', 'ui-common.js');
const uiRender = read('src', 'ui-render.js');
const buildZip = read('build-zip.sh');
const manifest = JSON.parse(read('release', 'manifest.json'));

for (const [name, html] of [
  ['main game', index],
  ['single battle', battle],
  ['tag battle', tagBattle],
]) {
  assert.ok(html.includes('viewport-fit=cover'), `${name} must support phone safe areas`);
}

assert.ok(index.includes('href="mobile.css"'), 'main game must load its phone layout');
assert.ok(battle.includes('href="battle-mobile.css"'), 'single battle must load its phone layout');
assert.ok(tagBattle.includes('href="battle-mobile.css"'), 'tag battle must load its phone layout');

assert.ok(mobile.includes('@media (max-width: 700px)'), 'main phone breakpoint is missing');
assert.ok(
  mobile.includes('.nav-bar {') &&
    mobile.includes('position: sticky;') &&
    mobile.includes('top: 0;'),
  'phone navigation must remain at the top of the scrolling app'
);
assert.ok(
  mobile.includes('height: 100dvh;') &&
    mobile.includes('overflow-y: auto;') &&
    mobile.includes('-webkit-overflow-scrolling: touch;'),
  'the phone app must own a momentum-enabled vertical scroll viewport'
);
assert.ok(mobile.includes('.sp-match-card-inner'), 'show preparation cards need a phone layout');
assert.ok(mobile.includes('.week-roster-table'), 'wide roster tables need phone overflow handling');
assert.ok(
  mobile.includes('.week-roster-table tbody { min-width: 620px; }') &&
    mobile.includes('.week-roster-table .wr-name-link') &&
    mobile.includes('max-width: 6em;'),
  'the week roster must use compact columns and truncate long names on phones'
);
assert.ok(
  uiRender.includes('toggleSurvivalPanel') &&
    uiRender.includes('wm-survival-panel-collapsed') &&
    index.includes('.survival-panel.is-collapsed .survival-body'),
  'the survival panel needs a persistent one-button minimize control'
);
assert.ok(mobile.includes('.draft-fc.cand .draft-fc-portrait'), 'draft candidates need compact full-width phone cards');
assert.ok(
  mobile.includes('.app.draft-cream {') &&
    mobile.includes('touch-action: pan-y;') &&
    mobile.includes('-webkit-overflow-scrolling: touch;'),
  'the founding draft must accept momentum swipe scrolling on phones'
);
assert.ok(mobile.includes('.team-member:nth-child(4)'), 'the five-person launch photo needs a 3+2 phone grid');
assert.ok(mobile.includes('.ranking-popup .orgs-grid'), 'organization rankings need a one-column phone layout');
assert.ok(mobile.includes('.ranking-popup .rp-card'), 'organization profiles need a phone layout');
assert.ok(mobile.includes('.shachoshitsu-desk'), 'the office background needs phone sizing');
assert.ok(
  mobile.includes('.venue-grid { grid-template-columns: repeat(3, minmax(0, 1fr));'),
  'show venue choices need a compact three-column phone layout'
);
assert.ok(
  uiRender.includes('<div class="db-table-scroll"><table class="db-table">'),
  'database tables need a background-owning horizontal scroller'
);
assert.ok(
  uiRender.includes('<table class="db-table db-fighter-table">') &&
    mobile.includes('.db-fighter-table td:first-child .portrait'),
  'fighter database rows need compact phone-specific columns and portraits'
);
assert.ok(
  mobile.includes('.shachoshitsu-rental-grid {') &&
    mobile.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'),
  'rental candidates need a two-column phone layout'
);
assert.ok(
  mobile.includes('.sp-portrait-placeholder:nth-child(3)') &&
    mobile.includes('.sp-portrait-placeholder:nth-child(5)'),
  'empty show-card slots must occupy the same phone grid cells as portraits'
);
assert.ok(
  mobile.includes('.pb-container .pb-mrow:not(.is-pending)') &&
    mobile.includes('.pb-container .pb-fighter.is-left') &&
    mobile.includes('.pb-container .pb-fighter.is-right') &&
    mobile.includes('.pb-container .pb-result {') &&
    mobile.includes('grid-column: 1 / -1;') &&
    mobile.includes('.pb-score-strip { grid-template-columns: repeat(2, minmax(0, 1fr)) !important;') &&
    uiCommon.includes('pb-mrow is-main is-b3') &&
    uiCommon.includes('pb-mrow is-main is-b2') &&
    uiCommon.includes('pb-mrow is-main is-jt'),
  'all match-result formats must keep both fighters side by side with result details below on phones'
);
assert.ok(
  uiRender.includes('class="sp-portrait-placeholder"'),
  'empty show-card portraits must have a stable responsive-layout hook'
);

assert.ok(battleMobile.includes('@media (max-width: 700px)'), 'battle phone breakpoint is missing');
assert.ok(battleMobile.includes('.main-row'), 'battle columns need a phone layout');
assert.ok(battleMobile.includes('.controls-sub'), 'battle controls need a phone layout');
assert.ok(
  battleMobile.includes('env(safe-area-inset-bottom'),
  'battle controls must stay above the phone safe area'
);

assert.ok(
  uiCommon.includes("window.matchMedia?.('(max-width: 700px)')") &&
    uiCommon.includes("nav.scrollTo({ left:") &&
    !uiCommon.includes('btn.scrollIntoView'),
  'phone navigation must center horizontally without moving the page vertically'
);
assert.ok(
  uiRender.includes("window.matchMedia?.('(max-width: 700px)').matches && centerChar") &&
    uiRender.includes('return _renderDbRelmapMobile(allChars, centerChar);') &&
    uiRender.includes('function _relmapMobileSetCenter(charId)') &&
    uiRender.includes('function _relmapMobileSearch(value)') &&
    uiRender.includes('強い関係のみ') &&
    uiRender.includes('🔥 因縁・ライバル') &&
    uiRender.includes('🤝 友情・信頼') &&
    uiRender.includes('⚠️ 警戒・不和') &&
    uiRender.includes('🎭 同門・派閥'),
  'the phone relationship view must use a searchable person-centered list'
);
assert.ok(
  mobile.includes('.relmap-mobile-root {') &&
    mobile.includes('touch-action: pan-y;') &&
    mobile.includes('.rm-mobile-card {') &&
    mobile.includes('.rm-mobile-direction-grid {') &&
    mobile.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);'),
  'phone relationship cards must fit the viewport and keep vertical scrolling'
);
assert.ok(
  mobile.includes('.db-subtab-bar {') &&
    mobile.includes('position: sticky;') &&
    uiRender.includes('const targetTop = Math.max(0, screen.offsetTop - 8);') &&
    uiRender.includes("app.scrollTo({ top: targetTop, behavior: 'auto' })"),
  'database subtabs must remain at the top when phone content is replaced'
);
assert.ok(
  uiRender.includes('<svg id="relmapSvg"') &&
    uiRender.includes('function _drawRelmapAfterRender()') &&
    uiRender.includes("svg.addEventListener('pointerdown'") &&
    uiRender.includes("svg.addEventListener('pointermove'") &&
    uiRender.includes('svg.setPointerCapture(e.pointerId)'),
  'the desktop force-directed relationship graph must remain available'
);
assert.ok(
  uiRender.includes('.chron-two-col { grid-template-columns: minmax(0, 1fr); }') &&
    mobile.includes('.np-stand-img { background-size: auto 118%; background-position: center top; }') &&
    mobile.includes('.np-matchup-row { grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr);'),
  'chronicle highlights and newspaper matchups need single-width phone layouts'
);
assert.ok(
  mobile.includes('#screen-newspaper .np-top-photo {') &&
    mobile.includes('background-size: auto 100%;') &&
    mobile.includes('#screen-newspaper .np-versus-grid {') &&
    mobile.includes('grid-template-columns: minmax(0, 1fr) 46px minmax(0, 1fr);'),
  'newspaper lead and show-result portraits must fit phone-width paper cards'
);
assert.ok(
  mobile.includes('#screen-newspaper .np-rivalry-stand .img {') &&
    mobile.includes('#screen-newspaper .np-mvprace-card-1 .np-mvprace-stats') &&
    mobile.includes('#screen-newspaper .np-mvprace-minor-num {') &&
    mobile.includes('#screen-newspaper .np-mvprace-list-row--rich .np-mvprace-list-facts'),
  'rivalry portraits and every MVP tier need phone-specific full-width rows'
);

for (const file of ['src/mobile.css', 'src/battle-mobile.css']) {
  assert.ok(manifest.sourceFiles.includes(file), `${file} is missing from the release manifest`);
  assert.ok(buildZip.includes(file), `${file} is missing from the legacy ZIP build`);
  assert.ok(fs.existsSync(path.join(root, file)), `${file} does not exist`);
}

console.log('mobile-layout-test: ok');
