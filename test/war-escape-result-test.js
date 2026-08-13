'use strict';

// 対抗戦の観戦を「✕試合中断」で抜けたとき、結果が盤面に出ずスコアが古いまま
// 「未消化」に見えていた (2026-08-13 Keisuke報告)。中断でも観戦完了と同じ着地
// (勝敗SE→盤面再描画→全消化なら finalizeWar) になることを検査する。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function methodSource(name) {
  const start = app.indexOf(`${name}() {`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = app.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < app.length; i++) {
    if (app[i] === '{') depth++;
    if (app[i] === '}') {
      depth--;
      if (depth === 0) return app.slice(brace, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

const escapeBattleSrc = methodSource('escapeBattle');
const buildEscape = new Function(
  'App', 'Audio', 'document', 'clearTimeout', 'setTimeout',
  'renderMatchPreview', 'renderWarMatchPreview',
  `return function escapeBattle() ${escapeBattleSrc};`
);

function makeHarness(results, watchingIdx) {
  const calls = { skip: [], se: [], renderWar: 0, finalize: 0, bgmResume: 0 };
  const wp = { results: [...results], currentWatching: watchingIdx, card: results.map(() => ({})) };
  const App = {
    _escBtnTimer: null,
    _awPreview: null, _stlPreview: null, _jtPreview: null, _tcPreview: null,
    _ppvPreview: null, _showPreview: null, _b3Preview: null, _b2Preview: null,
    _warPreview: wp,
    warSkipMatch(idx) { calls.skip.push(idx); wp.results[idx] = { playerWon: true }; },
    _playWarMatchResultSe(r) { calls.se.push(r); },
    finalizeWar() { calls.finalize += 1; },
    _scheduleWarBgmResume() { calls.bgmResume += 1; },
  };
  const Audio = { fileBgm: { stop() {} }, bgm: { playStage() {}, stop() {}, play() {} } };
  const doc = { getElementById: () => ({ style: {} }) };
  const escapeBattle = buildEscape(
    App, Audio, doc, () => {}, () => {},
    () => {}, () => { calls.renderWar += 1; }
  );
  return { wp, calls, escapeBattle };
}

(function escapeMidSeriesShowsTheResultOnTheBoard() {
  const done = { playerWon: true, mq: 70 };
  const { wp, calls, escapeBattle } = makeHarness([done, null, null], 0);
  escapeBattle();
  assert.strictEqual(wp.currentWatching, -1, '観戦状態は解除される');
  assert.deepStrictEqual(calls.se, [done], '中断でも勝敗SEを鳴らす');
  assert.strictEqual(calls.renderWar, 1, '中断でも盤面を再描画して結果とスコアを反映する');
  assert.strictEqual(calls.finalize, 0, '未消化の試合が残る間は決着処理へ進まない');
  assert.strictEqual(calls.bgmResume, 1, '対抗戦BGMへ復帰する');
  assert.deepStrictEqual(calls.skip, [], '結果は観戦開始時に確定済みなのでスキップは呼ばれない');
})();

(function escapeOnTheLastMatchFinalizesTheWar() {
  const r = { playerWon: true, mq: 70 };
  const { calls, escapeBattle } = makeHarness([r, r, r], 2);
  escapeBattle();
  assert.strictEqual(calls.renderWar, 1);
  assert.strictEqual(calls.finalize, 1, '最終試合の中断は決着処理まで進む(旧実装は盤面が固まっていた)');
  assert.strictEqual(calls.bgmResume, 0, '決着処理へ進むときはBGM復帰タイマーを積まない');
})();

(function escapeWithoutPrecomputedResultFallsBackToSkip() {
  const { calls, escapeBattle } = makeHarness([null, null, null], 0);
  escapeBattle();
  assert.deepStrictEqual(calls.skip, [0], '結果が無い場合の保険は warSkipMatch(SE/盤面/finalize込み)');
})();

console.log('war-escape-result-test: ok');
