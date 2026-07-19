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
  assert.ok(management.includes('s = Engine.autumnWar.startSession(s)'));
  assert.ok(management.includes('_pendingAutumnWarReplay: true'));
  assert.ok(management.includes('simulateNextBout(state)'));
  assert.ok(management.includes('未発生の勝敗を先に生成せず'));
  assert.ok(!management.slice(management.indexOf('// Week36: 組み合わせ')).split('// D-2:')[0].includes('autumnWar.run'));
  const startSession = section(management, 'startSession(state) {', '_suggestOrder(state');
  assert.ok(!startSession.includes('simulateMatch('), 'starting the event must not create any bout result');
  const nextBout = section(management, 'simulateNextBout(state) {', 'getProgress(state) {');
  assert.strictEqual((nextBout.match(/\.simulateMatch\(/g) || []).length, 1, 'one step must simulate exactly one bout');
  assert.ok(!nextBout.includes('while ('), 'live bout execution must not loop through future bouts');
})();

(function testAppOwnsTheFullEventFlow() {
  [
    'awOpenEntryModal()',
    'initAutumnWarReplay()',
    'awRevealBout()',
    'awConfirmFinalOrder()',
    'awShowMvpScene()',
    'finalizeAutumnWarReplay()',
  ].forEach(signature => assert.ok(app.includes(signature), `${signature} missing`));
  assert.ok(app.includes('Engine.autumnWar.reorderForFinal(G, p.finalOrder)'));
  assert.ok(app.includes('Engine.autumnWar.simulateNextBout(G)'));
  assert.ok(app.includes('Engine.autumnWar.apply(G, canonical)'));
  assert.ok(app.includes("overlay.classList.remove('active')"), 'finishing the event must close its full-screen overlay');
})();

(function testAutumnReplayKeepsControlOfResultOverlay() {
  const start = ui.indexOf('function _handlePatternBResultClose');
  const source = ui.slice(start, start + 500);
  assert.ok(source.includes('App._awPreview'), 'generic result close must leave autumn replay controls intact');
})();

(function testWeekRouteAndStageViewsExist() {
  assert.ok(render.includes('const agwBlocked = _agwIsEventWeek()'));
  assert.ok(render.includes('renderAutumnWarWeekBanner()'));
  assert.ok(render.includes('class="stl-week-banner agw-week-banner'), 'autumn banner must inherit the existing weekly banner layout');
  ['renderAutumnWarBoard', 'renderAutumnWarReorder', 'renderAutumnWarResult', 'renderAutumnWarMvpScene']
    .forEach(name => assert.ok(ui.includes(`function ${name}`), `${name} missing`));
})();

(function testAutumnCssUsesThemeTokens() {
  const start = html.indexOf('.agw-wrap');
  const end = html.indexOf('   C-6: 天頂戦', start);
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
