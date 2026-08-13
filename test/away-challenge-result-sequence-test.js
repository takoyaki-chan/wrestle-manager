'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiSource = fs.readFileSync(path.join(rootDir, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const appSource = fs.readFileSync(path.join(rootDir, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const { AWAY_CHALLENGE_RESULT_LINES } = require('../src/data.js');

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} end not found`);
}

const helperNames = [
  '_challengeRequestMatchWinnerSide',
  '_challengeRequestWinnerRepresentative',
  '_challengeRequestLoserRepresentative',
  '_challengeRequestLoserScene',
  '_challengeRequestResultPool',
  '_challengeRequestSideOrgName',
  '_challengeRequestBuildResultSequence',
];
const helperSources = helperNames.map(name => functionSource(uiSource, name)).join('\n');
const EngineStub = {
  rng: {
    derive: (...values) => values.reduce((sum, value) => sum + (Number(value) || 0), 0),
    create: seed => ({ seed }),
    int: (_rng, lo) => lo,
  },
  challengeRequest: {
    pickLine: (fighter, scene) => `EXISTING_${scene}_${fighter.id}`,
  },
};
const pure = new Function(
  'Engine',
  'AWAY_CHALLENGE_RESULT_LINES',
  `${helperSources}; return {
    winner: _challengeRequestWinnerRepresentative,
    loser: _challengeRequestLoserRepresentative,
    scene: _challengeRequestLoserScene,
    build: _challengeRequestBuildResultSequence
  };`
)(EngineStub, AWAY_CHALLENGE_RESULT_LINES);

function fighter(id, name, archetype = 'standard') {
  return { id, name, archetype, personality: 'normal' };
}

const a = [fighter(1, 'A代表'), fighter(2, 'A中堅'), fighter(3, 'A先鋒')];
const b = [fighter(11, 'B代表'), fighter(12, 'B中堅'), fighter(13, 'B先鋒')];
const card = { teamA: a, teamB: b, otherOrgName: '敵団体', isInverse: false };
const state = { orgName: '自団体', rngSeed: 42, season: 3, week: 8 };

(function fallbackUsesHighestMqWinnerWhenRepresentativeLost() {
  const result = {
    teamWin: 'A', winsA: 2, winsB: 1,
    matches: [
      { fighterA: a[0], fighterB: b[0], winner: 'right', mq: 50 },
      { fighterA: a[1], fighterB: b[1], winner: 'left', mq: 62 },
      { fighterA: a[2], fighterB: b[2], winner: 'left', mq: 81 },
    ],
  };
  const before = JSON.stringify({ card, result, state });
  const sequence = pure.build(card, result, state);
  assert.strictEqual(sequence.winner.fighter, a[2], '代表戦で負けた勝利陣営は最高MQ勝者へフォールバックする');
  assert.ok(AWAY_CHALLENGE_RESULT_LINES.seriesWin.standard.includes(sequence.winner.line), '1拍目は常に場面1プール');
  assert.strictEqual(sequence.loser.fighter, b[0], '2拍目は敗者側の第1試合代表');
  assert.strictEqual(sequence.loser.ownWon, true, '敗者側代表本人は第1試合に勝っている');
  assert.strictEqual(sequence.loser.scene, 'regretOwnWin');
  assert.ok(AWAY_CHALLENGE_RESULT_LINES.regretOwnWin.standard.includes(sequence.loser.line), '本人○×団体●は場面2以外を出さない');
  assert.strictEqual(JSON.stringify({ card, result, state }), before, '選定は入力を変更しない');
})();

(function representativeWinnerBeatsHigherMqFallbackAndOwnLossUsesExistingPool() {
  const result = {
    teamWin: 'B', winsA: 1, winsB: 2,
    matches: [
      { fighterA: a[0], fighterB: b[0], winner: 'right', mq: 45 },
      { fighterA: a[1], fighterB: b[1], winner: 'right', mq: 99 },
      { fighterA: a[2], fighterB: b[2], winner: 'left', mq: 70 },
    ],
  };
  const sequence = pure.build(card, result, state);
  assert.strictEqual(sequence.winner.fighter, b[0], '代表戦勝者はより高MQの別勝者より優先する');
  assert.ok(AWAY_CHALLENGE_RESULT_LINES.seriesWin.standard.includes(sequence.winner.line), '相手陣営勝利でも1拍目は場面1プール');
  assert.strictEqual(sequence.loser.fighter, a[0]);
  assert.strictEqual(sequence.loser.ownWon, false);
  assert.strictEqual(sequence.loser.scene, 'lose');
  assert.strictEqual(sequence.loser.line, 'EXISTING_lose_1', '本人●×団体●は既存loseプールだけを使う');
})();

(function inverseUsesTheSameTwoAxes() {
  const inverseCard = { ...card, isInverse: true, requesterOrgName: '敵団体' };
  const result = {
    teamWin: 'B', winsA: 1, winsB: 2,
    matches: [
      { fighterA: a[0], fighterB: b[0], winner: 'right', mq: 52 },
      { fighterA: a[1], fighterB: b[1], winner: 'left', mq: 65 },
      { fighterA: a[2], fighterB: b[2], winner: 'right', mq: 70 },
    ],
  };
  const sequence = pure.build(inverseCard, result, state);
  assert.strictEqual(sequence.winner.fighter, b[0], 'inverseでも代表戦勝者を優先する');
  assert.strictEqual(sequence.winner.role, '受けて立ち、団体を勝たせた代表');
  assert.strictEqual(sequence.loser.scene, 'lose');
})();

assert.strictEqual(pure.scene(true), 'regretOwnWin');
assert.strictEqual(pure.scene(false), 'lose');

// I-5: 梯子、吹き出し順、本人勝敗に基づくグレースケールをソース上でも固定する。
const showSequenceSource = functionSource(uiSource, '_showChallengeRequestResultSequence');
assert.ok(showSequenceSource.includes('width:172px;height:258px'), '1拍目の主役はXL 172x258');
assert.ok(showSequenceSource.includes('width:132px;height:194px'), '2拍目の主役はM 132x194');
assert.ok(showSequenceSource.indexOf('crrm-sequence-bubble-slot') < showSequenceSource.indexOf('crrm-sequence-portrait'), '吹き出しは画像の上');
const bubbleTemplate = showSequenceSource.slice(
  showSequenceSource.indexOf('<div class="crrm-sequence-bubble-slot"'),
  showSequenceSource.indexOf('<div class="crrm-sequence-portrait"')
);
assert.ok(bubbleTemplate.includes('entry.line') && !bubbleTemplate.includes('entry.fighter.name') && !bubbleTemplate.includes('entry.orgName'), '吹き出しの中身はセリフだけ');
assert.ok(showSequenceSource.includes('grayscale(.35) brightness(.9)'), '本人○は軽いグレー');
assert.ok(showSequenceSource.includes('grayscale(.9) brightness(.72)'), '本人●は強いグレー');

function makeFakeDom() {
  let html = '';
  let buttons = {};
  const overlay = { classList: { add() {} } };
  function button() {
    const listeners = new Map();
    return {
      addEventListener(type, fn, options) { listeners.set(type, { fn, once: !!(options && options.once) }); },
      click() {
        const listener = listeners.get('click');
        if (!listener) return;
        if (listener.once) listeners.delete('click');
        listener.fn();
      },
    };
  }
  const root = {
    get innerHTML() { return html; },
    set innerHTML(value) {
      html = String(value);
      buttons = {};
      if (html.includes('crrm-sequence-forward')) buttons['.crrm-sequence-forward'] = button();
      if (html.includes('crrm-sequence-close')) buttons['.crrm-sequence-close'] = button();
    },
    querySelector(selector) {
      if (selector === '#challengeRequestResultOverlay') return overlay;
      return buttons[selector] || null;
    },
  };
  return { root, getHtml: () => html };
}

function makeTimerHarness() {
  let nextId = 1;
  const pending = new Map();
  return {
    set(fn) { const id = nextId++; pending.set(id, fn); return id; },
    clear(id) { pending.delete(id); },
    fireNext() {
      const entry = pending.entries().next().value;
      assert.ok(entry, 'active timeout exists');
      pending.delete(entry[0]);
      entry[1]();
    },
    count: () => pending.size,
  };
}

function makeSequenceBundle() {
  const dom = makeFakeDom();
  const timers = makeTimerHarness();
  let overlayCloseCalls = 0;
  const build = new Function(
    'Engine', 'AWAY_CHALLENGE_RESULT_LINES', '_factionEnsureOverlayRoot', '_factionCloseCinematicOverlay',
    '_factionUpperUrl', 'escHtml', 'setTimeout', 'clearTimeout', 'Audio',
    `let _challengeRequestResultSequenceActive = false;
     ${helperSources}
     ${showSequenceSource}
     return { show: _showChallengeRequestResultSequence };`
  );
  const ui = build(
    EngineStub,
    AWAY_CHALLENGE_RESULT_LINES,
    () => dom.root,
    () => { overlayCloseCalls++; },
    id => `image/upper/${id}.webp`,
    value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
    fn => timers.set(fn),
    id => timers.clear(id),
    undefined
  );
  return { ...dom, timers, ui, getOverlayCloseCalls: () => overlayCloseCalls };
}

const decidedResult = {
  teamWin: 'A', winsA: 2, winsB: 1,
  matches: [
    { fighterA: a[0], fighterB: b[0], winner: 'left', mq: 70, finMove: '必殺技' },
    { fighterA: a[1], fighterB: b[1], winner: 'right', mq: 64, finMove: '丸め込み' },
    { fighterA: a[2], fighterB: b[2], winner: 'left', mq: 77, finMove: '投げ技' },
  ],
};

(function clickAndOldTimeoutCannotDoubleAdvanceOrClose() {
  const bundle = makeSequenceBundle();
  let onCloseCalls = 0;
  let duplicateCloseCalls = 0;
  assert.strictEqual(bundle.ui.show(card, decidedResult, state, () => { onCloseCalls++; }), true);
  assert.strictEqual(bundle.ui.show(card, decidedResult, state, () => { duplicateCloseCalls++; }), false, '二重起動防止フラグが働く');
  assert.ok(bundle.getHtml().includes('is-beat-one') && bundle.getHtml().includes('crrm-row'), '1拍目にスコアと明細を同居させる');
  bundle.root.querySelector('.crrm-sequence-forward').click();
  assert.ok(bundle.getHtml().includes('is-beat-two'), '▶で2拍目へ進む');
  bundle.root.querySelector('.crrm-sequence-close').click();
  bundle.root.querySelector('.crrm-sequence-close')?.click();
  assert.strictEqual(onCloseCalls, 1, '主シーケンスのonCloseは1回だけ');
  assert.strictEqual(duplicateCloseCalls, 0, '二重起動した別シーケンスを開始しない');
  assert.strictEqual(bundle.getOverlayCloseCalls(), 1, 'オーバーレイも1回だけ閉じる');
  assert.strictEqual(bundle.timers.count(), 0, 'クリック後に古いタイムアウトを残さない');
})();

(function timeoutsGuaranteeProgressWithoutClicks() {
  const bundle = makeSequenceBundle();
  let onCloseCalls = 0;
  bundle.ui.show(card, decidedResult, state, () => { onCloseCalls++; });
  bundle.timers.fireNext();
  assert.ok(bundle.getHtml().includes('is-beat-two'), '1拍目の待ちがタイムアウトして2拍目へ進む');
  bundle.timers.fireNext();
  assert.strictEqual(onCloseCalls, 1, '2拍目の待ちもタイムアウトして必ず完了する');
})();

const modalSource = functionSource(uiSource, 'showChallengeRequestResultModal');
assert.ok(modalSource.includes("result.teamWin !== 'draw'"), '決着だけ2拍シーケンスへ送る');
assert.ok(modalSource.includes('_showChallengeRequestResultSequence(card, result, state, onClose)'), '結果モーダル呼び出しを2拍へ配線する');
assert.ok(!modalSource.includes('_factionReporterStrip(state, coachLine)'), 'コーチ要約を結果モーダルから撤去する');

const coachLine = new Function(`${functionSource(appSource, '_challengeRequestCoachLogLine')}; return _challengeRequestCoachLogLine;`)();
assert.strictEqual(
  coachLine(state, card, decidedResult),
  '社長、挑戦試合 2 — 1。A代表選手が呼んだ舞台、しっかり制しました。'
);
const inverseLog = coachLine(state, { ...card, isInverse: true, requesterOrgName: '敵団体' }, { ...decidedResult, teamWin: 'B', winsA: 1, winsB: 2 });
assert.strictEqual(inverseLog, '社長、挑戦試合 2 — 1。敵団体のA代表選手の越境挑戦、退けました。');
assert.ok(appSource.includes('gameLog: [...(s.gameLog || []), coachLine]'), 'コーチ要約をgameLogへ移す');

console.log('away-challenge-result-sequence-test: ok');
