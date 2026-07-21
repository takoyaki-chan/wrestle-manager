const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const management = read('src/management.js');
const ui = read('src/ui-common.js');
const render = read('src/ui-render.js');
const html = read('src/index.html');
const mobile = read('src/mobile.css');
const data = read('src/data.js');

function objectLiteralAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  assert.ok(markerAt >= 0, `${marker} not found`);
  const start = source.indexOf('{', markerAt);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${marker} object did not close`);
}

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `${startMarker} section not found`);
  return source.slice(start, end);
}

(function testEngineStartsWithoutPrecomputingResults() {
  assert.ok(management.includes("autumnWarPhase: 'intro'"));
  assert.ok(management.includes('_pendingAutumnWarReplay: true'));
  assert.ok(!management.includes('autumnWar.ENTRY_WEEK'), 'Week 35 entry route must be removed');
  const startSession = section(management, 'startSession(state) {', '_suggestOrder(state');
  assert.ok(!startSession.includes('simulateMatch('), 'starting the event must not create any bout result');
  const nextBout = section(management, 'simulateNextBout(state, options = null) {', 'getProgress(state) {');
  assert.strictEqual((nextBout.match(/\.simulateMatch\(/g) || []).length, 1, 'one step must simulate exactly one bout');
  assert.ok(!nextBout.includes('while ('), 'live bout execution must not loop through future bouts');
  assert.ok(nextBout.includes('recordFrames'));
  assert.ok(nextBout.includes('replay:'));
})();

(function testAppOwnsTheFullEventFlow() {
  [
    'awBeginEntry()',
    'initAutumnWarReplay()',
    'awWatchBout()',
    'awRevealBout()',
    '_finishAutumnWarWatch()',
    'awConfirmFinalOrder()',
    'awShowMvpScene()',
    'finalizeAutumnWarReplay()',
  ].forEach(signature => assert.ok(app.includes(signature), `${signature} missing`));
  assert.ok(app.includes('Engine.autumnWar.reorderForFinal(G, p.finalOrder)'));
  assert.ok(app.includes('Engine.autumnWar.simulateNextBout(G)'));
  assert.ok(app.includes("Engine.autumnWar.simulateNextBout(G, { recordFrames: true })"));
  assert.ok(app.includes('Engine.autumnWar.apply(G, canonical)'));
  assert.ok(app.includes('delete p.watchResolved'), 'watch completion must be consumed only once');
  assert.ok(app.includes("overlay.classList.remove('active')"), 'finishing the event must close its full-screen overlay');
  const init = section(app, 'initAutumnWarReplay() {', 'awRevealBout() {');
  assert.ok(init.includes("phase: 'intro'"), 'event replay must enter the dedicated intro before entry');
  assert.ok(init.includes('const result = Engine.autumnWar.getProgress(G)'), 'live replay must reconstruct progress before rendering');
  const finalizeShow = section(app, 'finalizeShow() {', '_finalizeShowImpl() {');
  assert.ok(!finalizeShow.includes('G.autumnWar.session'), 'normal show finalization must not depend on autumn-war state');
})();

(function testDedicatedAutumnOverlayOwnsTheFlow() {
  assert.ok(html.includes('id="autumnWarOverlay"'));
  assert.ok(html.includes('id="autumnWarScreen"'));
  const views = section(ui, 'function _agwRenderPhase', 'function _tcFindFighterAnywhere');
  assert.ok(!views.includes('showResultOverlay'));
  assert.ok(!views.includes('box.style'), 'autumn-war phase rendering must not resize a shared result box');
  assert.ok(!views.includes('screen.style'), 'autumn-war phase rendering must use overlay classes');
})();

(function testWeekRouteAndStageViewsExist() {
  assert.ok(render.includes('const agwBlocked = _agwIsEventWeek()'));
  assert.ok(render.includes('renderAutumnWarWeekBanner()'));
  assert.ok(render.includes('class="stl-week-banner agw-week-banner'));
  assert.ok(!render.includes('App.awOpenEntryModal()'));
  ['renderAutumnWarIntro', 'renderAutumnWarEntry', 'renderAutumnWarBoard', 'renderAutumnWarReorder', 'renderAutumnWarResult', 'renderAutumnWarMvpScene']
    .forEach(name => assert.ok(ui.includes(`function ${name}`), `${name} missing`));
})();

(function testApprovedResponsiveEntryAndDetails() {
  const entry = section(ui, 'function _awEntryScreenHtml', 'function renderAutumnWarEntry');
  assert.ok(entry.includes('getFullUrl('), 'desktop entry must use full-body images');
  assert.ok(entry.includes('getStandUrl('), 'mobile and candidates must use stand images');
  assert.ok(entry.includes('agw-entry-mobile'), '375px L1 entry cards missing');
  assert.ok(entry.includes('agw-entry-placeholder'), 'opponent empty formation missing');
  assert.ok(entry.includes('showFighterPopup'), 'wrestler details must remain reachable');
  assert.ok(ui.includes('_jtcFcCore({'), 'bout focus must reuse the shared focus component');
  assert.ok(ui.includes('valueClassOvr('), 'OVR database color thresholds must be reused');
  assert.ok(ui.includes('Engine.autumnWar.CEILING * 100'), 'condition meter must use the tournament ceiling');
  assert.ok(/\.agw-entry-mobile\s*\{\s*display:\s*block/.test(mobile));
  assert.ok(mobile.includes('.agw-entry-opponent-summary'), 'mobile opponent strength summary must remain visible');
})();

(function testAutumnCssUsesThemeTokens() {
  const start = html.indexOf('.agw-overlay');
  const end = html.indexOf('   C-6:', start);
  assert.ok(start >= 0 && end > start, 'autumn-war CSS block missing');
  const block = html.slice(start, end);
  assert.ok(block.includes('var(--ev-autumn)'));
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(block), 'autumn-war CSS must not introduce hard-coded hex colors');
})();

(function testBaseMvpDialogueRouterMatrix() {
  const literal = objectLiteralAfter(data, 'const AUTUMN_WAR_MVP_LINES =');
  const matrix = Function(`"use strict"; return (${literal});`)();
  const contexts = ['gauntlet', 'champion', 'defiant'];
  const personalities = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
  assert.deepStrictEqual(Object.keys(matrix), contexts);
  contexts.forEach(context => personalities.forEach(personality => {
    const lines = matrix[context]?.[personality]?._default;
    assert.ok(Array.isArray(lines) && lines.length >= 1, `${context}.${personality} needs a base line`);
    lines.forEach(line => assert.ok(line.length >= 8 && line.length <= 90, `${context}.${personality} line length is unsafe`));
  }));
})();

console.log('autumn-war-ui-flow-test: ok');
