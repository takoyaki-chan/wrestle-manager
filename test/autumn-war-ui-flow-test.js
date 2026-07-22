const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
  ['awSelectFinalRole(', 'awPickFinalFighter(', 'awAutoFinalOrder()']
    .forEach(signature => assert.ok(app.includes(signature), `${signature} missing`));
  const finalControls = section(app, 'awMoveFinal(index, delta) {', 'awConfirmFinalOrder() {');
  assert.ok(finalControls.includes('[order[role], order[fighterIndex]] = [order[fighterIndex], order[role]]'), 'final role selection must swap only the three qualified representatives');
  const entryControls = section(app, 'awPickFighter(id) {', 'awMoveEntry(index, delta) {');
  assert.ok(entryControls.includes('[order[role], order[idx]] = [order[idx], order[role]]'), 'entry role selection must swap already-assigned wrestlers');
  assert.ok(finalControls.includes("Engine.autumnWar.suggestFinalOrder(G, 'player')"), 'final auto order must use the canonical condition-aware suggestion');
  assert.ok(app.includes('Engine.autumnWar.reorderForFinal(G, p.finalOrder)'));
  assert.ok(app.includes('Engine.autumnWar.simulateNextBout(G)'));
  assert.ok(app.includes("Engine.autumnWar.simulateNextBout(G, { recordFrames: true })"));
  const watchedBout = section(app, 'awWatchBout() {', '_finishAutumnWarWatch() {');
  assert.ok(watchedBout.includes('const displayReplay = replay;'), 'watched bouts must retain the bracket left/right order');
  assert.ok(!app.includes('_awOrientReplayForBoard'), 'player-side replay forcing must be removed');
  assert.ok(app.includes('Engine.autumnWar.apply(G, canonical)'));
  assert.ok(app.includes('delete p.watchResolved'), 'watch completion must be consumed only once');
  assert.ok(app.includes("overlay.classList.remove('active')"), 'finishing the event must close its full-screen overlay');
  const watch = section(app, 'awWatchBout() {', '_finishAutumnWarWatch() {');
  assert.ok(watch.includes('preserveParentFileBgm: true'), 'watched bouts must preserve the autumn tournament BGM');
  assert.ok(!watch.includes("Audio.bgm.play('battle')"), 'watched bouts must not switch to the standard battle BGM');
  assert.ok(!watch.includes('Audio.fileBgm.stop()'), 'watched bouts must not stop the autumn tournament BGM');
  const finishWatch = section(app, '_finishAutumnWarWatch() {', 'awAdvanceMatch() {');
  assert.ok(!finishWatch.includes('Audio.fileBgm.play('), 'returning from a watched bout must not restart an uninterrupted tournament BGM');
  const init = section(app, 'initAutumnWarReplay() {', 'awRevealBout() {');
  assert.ok(init.includes("phase: 'intro'"), 'event replay must enter the dedicated intro before entry');
  assert.ok(init.includes('const result = Engine.autumnWar.getProgress(G)'), 'live replay must reconstruct progress before rendering');
  const commit = section(app, '_awCommitResult() {', '_playAutumnWarChampionFanfare() {');
  assert.ok(commit.includes('p.result = applied.state.autumnWar'), 'result view must receive the committed revenue distribution');
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
  assert.ok(entry.includes("const playerOnLeft = playerPair?.orgA === 'player'"), 'entry formation must follow the player bracket side');
  assert.ok(entry.includes('${playerOnLeft ? playerPanel : opponentPanel}'), 'entry formation must move the complete player panel between sides');
  assert.ok(entry.includes('showFighterPopup'), 'wrestler details must remain reachable');
  assert.ok(ui.includes('agw-live-stage'), 'six-wrestler live stage missing');
  assert.ok(ui.includes('valueClassOvr('), 'OVR database color thresholds must be reused');
  assert.ok(ui.includes('Engine.autumnWar.CEILING * 100'), 'condition meter must use the tournament ceiling');
  assert.ok(/\.agw-entry-mobile\s*\{\s*display:\s*block/.test(mobile));
  assert.ok(mobile.includes('.agw-entry-opponent-summary'), 'mobile opponent strength summary must remain visible');
  const finalOrder = section(ui, 'function renderAutumnWarReorder', 'function renderAutumnWarResult');
  assert.ok(finalOrder.includes('agw-entry-stage'), 'desktop final order must reuse the opening formation stage');
  assert.ok(finalOrder.includes('agw-entry-mobile'), 'mobile final order must reuse the L1 card format');
  assert.ok(finalOrder.includes('agw-entry-candidate-rail'), 'final order must retain the familiar wrestler shelf');
  assert.ok(finalOrder.includes('App.awPickFinalFighter'), 'final wrestler shelf must support role swapping');
  assert.ok(finalOrder.includes('conditionValue'), 'final formation must show post-semifinal condition');
  assert.ok(finalOrder.includes('_agwConditionBar(conditionValue(fighter.id), false)'), 'final formation must show each wrestler condition as a bar');
  assert.ok(finalOrder.includes("const playerOnLeft = finalOrgIds[0] === 'player'"), 'final formation must follow the finalist bracket order');
  assert.ok(finalOrder.includes('${playerOnLeft ? playerPanel : opponentPanel}'), 'final formation must move the complete player panel between sides');
  assert.ok(!finalOrder.includes('agw-order-row'), 'the old final-only list layout must be removed');
})();

(function testApprovedLiveBoardLayoutAndActions() {
  const board = section(ui, 'function _agwDisplayOrgIds', 'function renderAutumnWarBoutResultPopup');
  const displaySides = section(ui, 'function _agwDisplayOrgIds', 'function _agwOrderFor');
  assert.ok(displaySides.includes('return { left: match.orgA, right: match.orgB }'), 'live board must retain the tournament bracket order');
  assert.ok(!displaySides.includes("=== 'player'"), 'live board must not force the player organization onto either side');
  assert.ok(board.includes('getFullUrl('), 'live board must show all six full-body images');
  const liveTeam = section(ui, 'function _agwLiveTeamHtml', 'function _agwStatusRailHtml');
  assert.ok(liveTeam.includes('const stateOrder = { ring: 0, wait: 1, out: 2 };'), 'the active wrestler must be displayed closest to center');
  assert.ok(liveTeam.includes('const names = displayOrder.map'), 'live-board nameplates must follow the reordered wrestler positions');
  assert.ok(liveTeam.includes('agw-live-slot-${index}'), 'every active, waiting, or eliminated wrestler must receive a unique board slot');
  assert.ok(board.includes('agw-status-rail'), 'four-team status rail missing');
  assert.ok(board.includes('この試合の結果を見る ▶'));
  assert.ok(board.includes('App.awSkipTeamMatch()'));
  assert.ok(html.includes('.agw-live-team.is-left .agw-live-figure img{transform:scaleX(-1)}'), 'only the left team should be mirrored toward center');
  assert.ok(html.includes('.agw-live-team.is-left .agw-live-figure.agw-live-slot-0{right:0;left:auto;z-index:6}'), 'the active wrestler must stand closest to center on the left team');
  assert.ok(html.includes('.agw-live-team.is-left .agw-live-figure.agw-live-slot-2{left:0;right:auto;z-index:2}'), 'the outermost slot must be used for eliminated wrestlers after the waiting fighters');
  assert.ok(html.includes('.agw-live-team.is-right .agw-live-name.agw-live-slot-0{grid-column:1}'), 'right-side nameplates must stay beneath their matching slot');
  assert.ok(html.includes('.agw-entry-team.is-left .agw-entry-figure[data-order="0"]{right:0;left:auto}'), 'left-side entry figures must place the opener closest to center');
  assert.ok(html.includes('.agw-entry-team.is-right .agw-entry-placeholder[data-order="0"]{right:auto;left:0}'), 'right-side opponent placeholders must mirror with the bracket side');
  assert.ok(html.includes('.agw-live-actions>.btn{flex:1 1 0;max-width:220px;height:48px}'), 'desktop action buttons must have equal sizing');
  assert.ok(mobile.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), '375px actions must use three equal columns');
  assert.ok(mobile.includes('height: 54px'), '375px action buttons must share one height');
  const boutPopup = section(ui, 'function renderAutumnWarBoutResultPopup', 'function renderAutumnWarBoard');
  assert.ok(boutPopup.includes('const displayOrgIds = _agwDisplayOrgIds(match)'), 'bout result must reuse the live-board side order');
  assert.ok(boutPopup.includes('bout.winnerId === right.id'), 'winner styling must follow the displayed right-side wrestler');
  assert.ok(boutPopup.includes('score[displayOrgIds.left]'), 'bout result score must follow the displayed side order');
})();

(function testBattleFinishCanPreserveTournamentBgm() {
  const finishListener = section(ui, "if (e.data && e.data.type === 'BATTLE_FINISH_CUE')", "if (e.data && e.data.type === 'MATCH_RESULT')");
  assert.ok(finishListener.includes('if (!e.data.preserveParentFileBgm)'), 'finish cue must respect a parent BGM preservation request');
  const battle = fs.readFileSync(path.join(root, 'src/battle-engine-main.js'), 'utf8');
  const finishCue = section(battle, 'function _notifyFinishCue()', 'function _finishPinSeq()');
  assert.ok(finishCue.includes('S.matchInfo.preserveParentFileBgm'), 'battle iframe must pass the BGM preservation request back to the parent');
})();

(function testOptionalSeededDialogueMoments() {
  const sectionText = section(ui, 'const _AGW_DIALOGUE_CHANCE', 'function renderAutumnWarBoard');
  assert.ok(sectionText.includes('preBout: 0.55'));
  assert.ok(sectionText.includes('survivor: 0.60'));
  assert.ok(sectionText.includes('champion: 0.75'));
  assert.ok(sectionText.includes('Engine.rng.create(seed | 0)'), 'dialogue inclusion must use a local seeded RNG');
  assert.ok(!sectionText.includes('Math.random'), 'autumn-war dialogue must stay stable across reloads');
  assert.ok(sectionText.includes('getAutumnWarMatchLine(timing'), 'pre-bout pair must use the Autumn War personality/archetype matrix');
  assert.ok(sectionText.includes("getAutumnWarMatchLine('survivor'"), 'survivor speech must use the Autumn War personality/archetype matrix');
  assert.ok(sectionText.includes('match.winnerOrg'), 'completed team matches must bypass the next-challenger speech');
  assert.ok(sectionText.includes("match.round === 'final' ? 'champion' : 'gauntlet'"), 'team victories must choose the correct Autumn War victory context');
  assert.ok(sectionText.includes('getDialoguePool(lineSet, winner)'), 'team victory dialogue must resolve from the winner personality and archetype');
  assert.ok(sectionText.includes('jt-bub-pair agw-bout-dialogue'), 'optional two-wrestler exchange is missing');
  const boutPopup = section(ui, 'function renderAutumnWarBoutResultPopup', 'function renderAutumnWarBoard');
  assert.ok(boutPopup.includes('showVictoryLine: !!victoryLine'), 'survivor line must be allowed to disappear');
  const resultView = section(ui, 'function renderAutumnWarResult', 'function _agwMvpLine');
  assert.ok(resultView.includes('agw-champion-speech'), 'optional championship speech is missing');
  assert.ok(resultView.includes('agw-champ-member'), 'championship speech must be attached to its speaker card');
  assert.ok(resultView.includes('result.revenueDistribution'), 'result view must read the saved dome-event distribution');
  assert.ok(resultView.includes('大会総収入'), 'result view must show the event revenue basis');
  assert.ok(resultView.includes('興行分配 ¥${playerShare.gateAmount}万'), 'player payout must separate gate revenue');
  assert.ok(resultView.includes('延べ出場${playerShare.appearances}人'), 'gate payout must expose the appearance component');
  assert.ok(resultView.includes('ブランド ¥${playerShare.brandAmount}万'), 'player payout must separate brand revenue');
  assert.ok(resultView.includes('通常興行基礎${playerShare.brandBase}'), 'brand payout must expose the ordinary-show baseline');
  assert.ok(resultView.includes('結果ボーナス +${Math.round(playerShare.brandBonusRate * 100)}%'), 'brand payout must expose the tournament-result percentage bonus');
  assert.ok(resultView.includes('${playerShare.brandBonusAmount}'), 'brand payout must expose the bonus amount');
  assert.ok(html.includes('.agw-champion-speech'));
  assert.ok(html.includes('.agw-result-finance'));
})();

(function testPreBoutDialogueFollowsDisplayedSides() {
  const dialogueSource = section(ui, 'const _AGW_DIALOGUE_CHANCE', 'function _agwSurvivorLine');
  const sandbox = {
    G: { rngSeed: 42, season: 1, week: 36 },
    Engine: {
      rng: {
        create: seed => ({ seed }),
        float: () => 0,
      },
    },
    escHtml: value => String(value),
    getAutumnWarMatchLine: (_timing, personality) => `${personality}のセリフ`,
  };
  vm.runInNewContext(`${dialogueSource}\nthis.renderDialogue = _agwPreBoutDialogueHtml;`, sandbox);

  const playerLeftMatch = { round: 'semiFinal', orgA: 'player', orgB: 'rival' };
  const playerLeftNext = {
    index: 1,
    left: { id: 10, orgId: 'player' },
    right: { id: 20, orgId: 'rival' },
  };
  const player = { id: 10, name: 'プレイヤー選手', personality: 'bold', archetype: 'cool' };
  const rival = { id: 20, name: '対戦相手', personality: 'quiet', archetype: 'normal' };
  const playerLeftOutput = sandbox.renderDialogue(playerLeftMatch, playerLeftNext, player, rival, { left: 'player', right: 'rival' });
  assert.ok(playerLeftOutput.indexOf('プレイヤー選手') < playerLeftOutput.indexOf('対戦相手'), 'player dialogue must render left when the bracket puts the player on the left');
  assert.ok(playerLeftOutput.indexOf('boldのセリフ') < playerLeftOutput.indexOf('quietのセリフ'), 'left and right dialogue text must stay with their displayed speakers');

  const playerRightMatch = { round: 'semiFinal', orgA: 'rival', orgB: 'player' };
  const playerRightNext = {
    index: 1,
    left: { id: 20, orgId: 'rival' },
    right: { id: 10, orgId: 'player' },
  };
  const playerRightOutput = sandbox.renderDialogue(playerRightMatch, playerRightNext, rival, player, { left: 'rival', right: 'player' });
  assert.ok(playerRightOutput.indexOf('対戦相手') < playerRightOutput.indexOf('プレイヤー選手'), 'player dialogue must render right when the bracket puts the player on the right');
  assert.ok(playerRightOutput.indexOf('quietのセリフ') < playerRightOutput.indexOf('boldのセリフ'), 'right-side player dialogue must keep the player text');
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
