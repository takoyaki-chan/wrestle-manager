'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const css = readSource('src', 'index.html');

function section(start, end) {
  const from = ui.indexOf(start);
  const to = ui.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, `section not found: ${start}`);
  return ui.slice(from, to);
}

const showSummary = section('function renderShowResult(results, injuryResults)', '// ── Pattern B ヘルパー');
// 終端マーカーは 2026-07-26 の死にコード掃除で _hpComparisonBar('/** HP対比バー') が
// 消えたため、次に必ず来る PPV テレビ中継の見出しへ差し替えた。
const ppvSummary = section('function renderPPVResult(card, results, summitPair, heatChange, mqBonuses)', '// ── PPV GRAND FINAL テレビ中継');
const ppvTvSummary = section('function renderPPVTvBroadcast(card, results, ppvName)', '// ── Phase D');
const warSummary = section('function renderWarFinalResult(ev, results, playerWins, aiWins, eventWon)', 'let _warVictoryWinners');

assert(ui.includes('function _pbShowSummaryTheme(week)'), '週から全試合結果テーマを解決する必要がある');
['spring', 'summer', 'autumn', 'ppv', 'normal'].forEach(key => {
  assert(ui.includes(`key: '${key}'`), `${key} の全試合結果テーマが必要`);
  assert(css.includes(`pb-theme-${key}`), `${key} の全試合結果CSSが必要`);
});
assert(showSummary.includes('pb-event-summary pb-theme-${summaryTheme.key}'), '通常・季節興行の全試合結果へ大会テーマを接続する');
assert(showSummary.includes('pb-summary-emblem'), '大会エンブレムをヘッダーに表示する');
assert(showSummary.indexOf('pb-attend-hero') < showSummary.indexOf('pb-score-strip'), '客入りを副指標より先に表示する');
assert(css.includes('.pb-event-summary .pb-attend-hero-val{font-size:72px'), '客入り人数を最重要数値として強調する');
assert(css.includes('.pb-event-summary .pb-attend-hero-bar{height:9px'), '客入りバーを見やすく強調する');

assert(showSummary.includes('has-dialogue'), '定期興行の全試合結果はセリフがある行の高さを確保する');
assert(showSummary.includes("_pbFighterBlock('left', r.left, leftCls, metaLeft, leftLine)"),
  '定期興行の左選手へ吹き出しセリフを渡す');
assert(showSummary.includes("_pbFighterBlock('right', r.right, rightCls, metaRight, rightLine)"),
  '定期興行の右選手へ吹き出しセリフを渡す');
[ppvSummary, ppvTvSummary, warSummary].forEach((summary, index) => {
  assert(!summary.includes('has-dialogue'), `定期興行以外の全試合結果${index + 1}に重複セリフ用レイアウトを残さない`);
  assert(!summary.includes('pb-dialogue'), `定期興行以外の全試合結果${index + 1}に重複セリフ吹き出しを出さない`);
});
assert(!ppvSummary.includes('coachPraise'), 'PPV全試合結果にコーチのセリフを重複表示しない');
assert(!ppvTvSummary.includes('emotionText'), 'PPV観戦の全試合結果に感情セリフを重複表示しない');
assert(!warSummary.includes('r.victoryLine &&'), '対抗戦の全試合結果に勝者セリフを重複表示しない');

console.log('show-result-summary-theme-test: ok');
