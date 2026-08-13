'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EVENT_LINES_BY_KEY } = require('../src/data.js');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const html = read('src/index.html');
const ui = read('src/ui-common.js');
const app = read('src/app.js');

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} end not found`);
}

(function auroraTokensMatchApprovedMock() {
  const expected = {
    unified: '#7de0c8',
    'unified-deep': '#3f7dbb',
    'unified-hi': '#eafff6',
    'unified-grad': 'linear-gradient(115deg,#7ee8d0 0%,#6aa8ff 30%,#b58cff 55%,#ff9ac8 78%,#7ee8d0 100%)',
    'unified-glow': 'rgba(120,220,220,.5)',
    'unified-text': '#123028',
  };
  Object.entries(expected).forEach(([name, value]) => {
    assert.ok(html.includes(`--${name}: ${value}`), `--${name} must match c-aurora`);
  });
})();

(function temporaryTealLiteralsAreGoneFromJavaScript() {
  const js = fs.readdirSync(path.join(root, 'src'))
    .filter(name => name.endsWith('.js'))
    .map(name => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n');
  const temporary = /#(?:4fb7c5|75d6e2|9eeaf2|257886|d9fbff)\b|rgba\(\s*79\s*,\s*183\s*,\s*197\s*,|rgba\(\s*25\s*,\s*95\s*,\s*110\s*,/i;
  assert.doesNotMatch(js, temporary);
})();

(function localDialoguePickerDoesNotMutateGameState() {
  const Engine = {
    rng: {
      derive: (...values) => values.reduce((sum, value) => sum + (Number(value) || 0), 0),
      create: seed => ({ seed }),
      int: (_rng, low) => low,
    },
  };
  const pick = new Function('EVENT_LINES_BY_KEY', 'Engine',
    `${functionSource(ui, '_pickUnifiedTitleLine')}; return _pickUnifiedTitleLine;`)(EVENT_LINES_BY_KEY, Engine);
  const state = { rngSeed: 42, season: 8, week: 48, nested: { untouched: true } };
  const before = JSON.stringify(state);
  assert.strictEqual(pick('coronation', { id: 7, archetype: 'standard' }, state, 1),
    EVENT_LINES_BY_KEY.coronation.standard[0]);
  assert.strictEqual(pick('return', { id: 8, archetype: 'unknown' }, state, 2),
    EVENT_LINES_BY_KEY.return.standard[0], '欠落archetypeはstandardへフォールバックする');
  assert.strictEqual(JSON.stringify(state), before, '表示セリフ選択はGameStateを変更しない');
})();

(function unifiedResultUsesThePlayerSpecificWinOrLossScene() {
  const captured = [];
  const Engine = {
    rng: {
      derive: (...values) => values.reduce((sum, value) => sum + (Number(value) || 0), 0),
      create: seed => ({ seed }),
      int: (_rng, low) => low,
    },
    unifiedTitle: { _orgName: (_state, orgId) => orgId === 'player' ? '自団体' : '相手団体' },
    formatFinish: () => '決着',
  };
  const build = new Function(
    'App', 'G', 'VENUES', 'Engine', 'EVENT_LINES_BY_KEY', 'POST_MATCH_FLAVOR_LINES',
    'pickDialogueLine', 'showEventMatchResultPopup', '_matchNextLabel',
    `${functionSource(ui, '_pickUnifiedTitleLine')}
     ${functionSource(ui, 'renderRegularMatchResultPopup')}
     return renderRegularMatchResultPopup;`
  );
  const run = (away, winner) => {
    const player = { id: 1, name: '自団体選手', archetype: 'standard' };
    const opponent = { id: 2, name: '相手選手', archetype: 'cool', isUnifiedTitleGuest: true };
    const booking = away
      ? { championId: 2, championOrgId: 'rival', challengerId: 1 }
      : { championId: 1, challengerId: 2, challengerOrgId: 'rival' };
    const App = {
      _unifiedTitleShowData: away ? null : booking,
      _showPreview: {
        validMatches: [{ left: 1, right: 2, isTitle: true, _unifiedTitleMatch: true }],
        results: [{ winner, mq: 5, finType: 'pin', finMove: '', turns: 9, hpLeft: {}, hpRight: {}, left: player, right: opponent }],
        ...(away ? { isUnifiedAwayTitle: true, unifiedAwayBooking: booking } : {}),
      },
    };
    const G = { season: 8, week: 12, totalShows: 1, showVenue: 0, orgName: '自団体', rngSeed: 42, roster: [player, opponent] };
    const render = build(App, G, [{ name: '会場' }], Engine, EVENT_LINES_BY_KEY, { winner: {} },
      () => '通常勝者台詞', options => captured.push(options), () => '結果へ →');
    render(0, () => {});
    return captured.at(-1);
  };

  const defense = run(false, 'left');
  assert.ok(EVENT_LINES_BY_KEY.defenseWin.standard.includes(defense.victoryLine));
  assert.strictEqual(defense.loserLine, '');
  const lost = run(false, 'right');
  assert.ok(EVENT_LINES_BY_KEY.beltLost.standard.includes(lost.loserLine));
  assert.strictEqual(lost.showVictoryLine, false);
  const capture = run(true, 'left');
  assert.ok(EVENT_LINES_BY_KEY.captureWin.standard.includes(capture.victoryLine));
  const failed = run(true, 'right');
  assert.ok(EVENT_LINES_BY_KEY.challengeFailed.standard.includes(failed.loserLine));
})();

(function fourApprovedViewsKeepTheirSizeAndToneContracts() {
  [
    /unified-coronation-portrait[^}]*width:172px;height:258px/,
    /unified-return-portrait[^}]*width:150px;height:224px/,
    /unified-challenge-champion>img[^}]*width:132px;height:194px/,
    /unified-challenge-face[^}]*width:52px;height:52px;max-width:52px;max-height:52px/,
  ].forEach(pattern => assert.match(html, pattern));
  assert.match(ui, /variant:\s*'unifiedTitle'[\s\S]*title:\s*'挑 戦 表 明'/);
  assert.match(ui, /choices:\s*\[\{ letter: '🌐', label: '受けて立つ'/);
  assert.ok(!functionSource(ui, 'showUnifiedTitleChallengerArrival').includes('var(--accent-hostility)'));
  assert.ok(ui.includes('今回は見送る(次は約9か月後)'));
})();

(function guardedProgressionAndAllSevenScenesAreWired() {
  ['showUnifiedTitleCoronation', 'showUnifiedTitleReturnCeremony', 'showUnifiedTitleChallengeModal']
    .forEach(name => {
      const source = functionSource(ui, name);
      assert.ok(source.includes('let resolved = false'), `${name}: double guard`);
      assert.ok(source.includes('safetyTimer = setTimeout'), `${name}: timeout safety`);
    });
  const arrival = functionSource(ui, 'showHostileArrivalStage');
  assert.ok(arrival.includes("cfg.variant === 'unifiedTitle'"));
  assert.ok(arrival.includes('if (Number(cfg.safetyTimeoutMs) > 0 && choices[0])'));
  assert.ok(app.includes('App._unifiedCoronationKey !== ceremonyKey'));
  ['coronation', 'return', 'challengerArrival', 'defenseWin', 'beltLost', 'captureWin', 'challengeFailed']
    .forEach(scene => assert.ok(ui.includes(`'${scene}'`), `${scene} is wired`));
})();

(function coronationClickAndSafetyCanCompleteOnlyOnce() {
  const timers = [];
  const button = {
    listener: null,
    addEventListener(_type, listener) { this.listener = listener; },
    focus() {},
    click() { if (this.listener) this.listener(); },
  };
  const layer = {
    innerHTML: '',
    setAttribute() {},
    remove() {},
    querySelector(selector) { return selector === '.unified-coronation-next' ? button : null; },
  };
  const document = {
    body: { appendChild() {} },
    createElement: () => layer,
    querySelector: () => null,
  };
  const build = new Function(
    'document', 'getUpperUrl', 'escHtml', '_pickUnifiedTitleLine', 'setTimeout', 'clearTimeout',
    'requestAnimationFrame', 'Audio',
    `${functionSource(ui, 'showUnifiedTitleCoronation')}; return showUnifiedTitleCoronation;`
  );
  const show = build(document, () => '', String, () => '承認済みセリフ',
    (fn, ms) => (timers.push({ fn, ms }), timers.length), () => {}, fn => fn(), { play() {} });
  let calls = 0;
  show({ fighter: { id: 1, name: '王者' }, state: {}, safetyTimeoutMs: 30 }, () => { calls++; });
  button.click();
  button.click();
  timers.forEach(timer => timer.fn());
  assert.strictEqual(calls, 1, '戴冠のクリックと時限保険が競合してもonDoneは1回');
})();

(function officeChoiceAndSafetyCanCompleteOnlyOnce() {
  const timers = [];
  const send = {
    dataset: { unifiedFighter: '1' }, listener: null,
    addEventListener(_type, listener) { this.listener = listener; }, click() { this.listener?.(); },
  };
  const skip = {
    listener: null,
    addEventListener(_type, listener) { this.listener = listener; }, click() { this.listener?.(); },
  };
  const document = {
    querySelectorAll: selector => selector === '[data-unified-fighter]' ? [send] : [],
    getElementById: id => id === 'unifiedTitleSkipBtn' ? skip : null,
  };
  const state = {
    roster: [{ id: 1, name: '候補', archetype: 'standard' }],
    aiOrgs: { rival: { roster: [{ id: 2, name: '王者', archetype: 'cool' }] } },
  };
  const Engine = {
    unifiedTitle: {
      _findActive: () => ({ fighter: state.aiOrgs.rival.roster[0], orgId: 'rival' }),
      _orgName: () => '相手団体',
    },
    util: { ov: () => 77 },
  };
  const build = new Function(
    'Engine', 'document', '_isPopupActive', '_popupQueue', 'getUpperUrl', '_u3bOrgBadgeHtml',
    'portraitImg', 'escHtml', '_mdlAHeader', '_mdlASeasonLabel', '_mdlAReporterStrip',
    '_mdlAOpen', '_mdlAClose', 'setTimeout', 'clearTimeout', 'Audio',
    `${functionSource(ui, 'showUnifiedTitleChallengeModal')}; return showUnifiedTitleChallengeModal;`
  );
  const show = build(Engine, document, () => false, [], () => '', () => '', () => '<img>', String,
    () => '', () => '', () => '', () => true, () => {},
    (fn, ms) => (timers.push({ fn, ms }), timers.length), () => {}, { play() {} });
  let calls = 0;
  show({ championId: 2, eligibleIds: [1] }, state, () => { calls++; });
  send.click();
  skip.click();
  timers.forEach(timer => timer.fn());
  assert.strictEqual(calls, 1, 'Office選択と時限保険が競合してもonChoiceは1回');
})();

(function defaultHostileArrivalMarkupRemainsTheBaseVariant() {
  const source = functionSource(ui, 'showHostileArrivalStage');
  assert.ok(source.includes("const variantClass = cfg.variant === 'unifiedTitle' ? ' unified-title-arrival' : '';"));
  assert.ok(source.includes('hostile-arrival-overlay${variantClass}'));
})();

console.log('unified-title-presentation-test: ok');
