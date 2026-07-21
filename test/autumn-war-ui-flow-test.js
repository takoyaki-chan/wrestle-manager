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
    'awSkipTeamMatch()',
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
  const teamSkip = section(app, 'awSkipTeamMatch() {', '_awConsumeBoutStep(stepped) {');
  assert.ok(teamSkip.includes("'まとめてスキップ'"), 'team-match skip must use the approved short label');
  assert.ok(teamSkip.includes('showConfirm('), 'team-match skip must require confirmation');
  assert.ok(teamSkip.includes('while (steps < maxSteps)'), 'team-match skip must advance the remaining live bouts');
  assert.strictEqual((teamSkip.match(/Engine\.autumnWar\.simulateNextBout\(G\)/g) || []).length, 1, 'team-match skip must reuse the canonical one-bout engine step');
  assert.ok(!teamSkip.includes('runLegacy'), 'team-match skip must not use the legacy bulk simulator');
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
  assert.ok(entry.includes('agw-entry-empty-slot'), 'opponent unlabeled slots missing');
  assert.ok(entry.includes('agw-entry-slot-row'), 'desktop role slots must stay inside the player half');
  assert.ok(!entry.includes('agw-entry-role-select'), 'overlapping figure-level role buttons must be removed');
  assert.ok(entry.includes('showFighterPopup'), 'wrestler details must remain reachable');
  assert.ok(ui.includes('agw-live-stage'), 'six-wrestler live stage missing');
  assert.ok(ui.includes('valueClassOvr('), 'OVR database color thresholds must be reused');
  assert.ok(ui.includes('Engine.autumnWar.CEILING * 100'), 'condition meter must use the tournament ceiling');
  assert.ok(/\.agw-entry-mobile\s*\{\s*display:\s*block/.test(mobile));
  assert.ok(mobile.includes('.agw-entry-opponent-summary'), 'mobile opponent strength summary must remain visible');
})();

(function testApprovedLiveBoardLayoutAndActions() {
  const board = section(ui, 'function _agwDisplayOrgIds', 'function renderAutumnWarBoutResultPopup');
  assert.ok(board.includes("match.orgA === 'player'"));
  assert.ok(board.includes('return { left: match.orgB, right: match.orgA }'), 'player organization must render on the right');
  assert.ok(board.includes('getFullUrl('), 'live board must show all six full-body images');
  assert.ok(board.includes('agw-status-rail'), 'four-team status rail missing');
  assert.ok(board.includes('この試合の結果を見る ▶'));
  assert.ok(board.includes('App.awSkipTeamMatch()'));
  assert.ok(html.includes('.agw-live-team.is-left .agw-live-figure img{transform:scaleX(-1)}'), 'only the left team should be mirrored toward center');
  assert.ok(html.includes('.agw-live-team.is-right .agw-live-names{direction:rtl}'), 'right-side names must stay under their corresponding figures');
  assert.ok(html.includes('.agw-live-actions>.btn{flex:1 1 0;max-width:220px;height:48px}'), 'desktop action buttons must have equal sizing');
  assert.ok(mobile.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), '375px actions must use three equal columns');
  assert.ok(mobile.includes('height: 54px'), '375px action buttons must share one height');
})();

(function testOptionalSeededDialogueMoments() {
  const sectionText = section(ui, 'const _AGW_DIALOGUE_CHANCE', 'function renderAutumnWarBoard');
  assert.ok(sectionText.includes('preBout: 0.55'));
  assert.ok(sectionText.includes('survivor: 0.60'));
  assert.ok(sectionText.includes('champion: 0.75'));
  assert.ok(sectionText.includes('Engine.rng.create(seed | 0)'), 'dialogue inclusion must use a local seeded RNG');
  assert.ok(!sectionText.includes('Math.random'), 'autumn-war dialogue must stay stable across reloads');
  assert.ok(sectionText.includes('getJuniorTournamentLine(timing'), 'pre-bout pair must reuse the personality/archetype tournament matrix');
  assert.ok(sectionText.includes('jt-bub-pair agw-bout-dialogue'), 'optional two-wrestler exchange is missing');
  const boutPopup = section(ui, 'function renderAutumnWarBoutResultPopup', 'function renderAutumnWarBoard');
  assert.ok(boutPopup.includes('showVictoryLine: !!victoryLine'), 'survivor line must be allowed to disappear');
  const resultView = section(ui, 'function renderAutumnWarResult', 'function _agwMvpLine');
  assert.ok(resultView.includes('agw-champion-speech'), 'optional championship speech is missing');
  assert.ok(html.includes('.agw-champion-speech'));
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
