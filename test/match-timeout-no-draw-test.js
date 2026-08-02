'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');

const source = readSource('src', 'match-engine.js');
const start = source.indexOf('function resolveTimeoutWinner(');
const end = source.indexOf('// ── Battle Engine', start);
assert.ok(start >= 0 && end > start, '時間切れ判定の共通関数が見つからない');

const fnSource = source.slice(start, end);
const Engine = { rng: { float: rng => rng.value } };
const resolveTimeoutWinner = new Function('Engine', `${fnSource}; return resolveTimeoutWinner;`)(Engine);

assert.strictEqual(resolveTimeoutWinner(50, 40, 0, 0, { value: 0.9 }, 'left', 'right'), 'left', '残りHP優位を判定できない');
assert.strictEqual(resolveTimeoutWinner(40, 50, 0, 0, { value: 0.1 }, 'left', 'right'), 'right', '右側の残りHP優位を判定できない');
assert.strictEqual(resolveTimeoutWinner(50, 50, 8, -8, { value: 0.9 }, 'left', 'right'), 'left', '同HP時の試合優勢を判定できない');
assert.strictEqual(resolveTimeoutWinner(50, 50, -8, 8, { value: 0.1 }, 'left', 'right'), 'right', '同HP時の右側優勢を判定できない');
assert.strictEqual(resolveTimeoutWinner(50, 50, 0, 0, { value: 0.1 }, 'left', 'right'), 'left', '完全同値時のseeded判定が左を返さない');
assert.strictEqual(resolveTimeoutWinner(50, 50, 0, 0, { value: 0.9 }, 'left', 'right'), 'right', '完全同値時のseeded判定が右を返さない');

const singlesTimeout = source.slice(source.indexOf('if (!winner) {', source.indexOf('simulateMatch(charL')), source.indexOf('// ── MQ算出', source.indexOf('simulateMatch(charL')));
assert.ok(singlesTimeout.includes("resolveTimeoutWinner(L.hp, R.hp"), 'シングル戦の時間切れが共通判定を通っていない');
assert.ok(!singlesTimeout.includes("winner = 'draw'"), 'シングル戦の時間切れにdraw生成が残っている');

const tagStart = source.indexOf('// タイムアウト', source.indexOf('simulateTagMatch'));
const tagEnd = source.indexOf('// ── MQ算出', tagStart);
const tagTimeout = source.slice(tagStart, tagEnd);
assert.ok(tagTimeout.includes('resolveTimeoutWinner(totalHpA, totalHpB'), 'タッグ戦の時間切れが共通判定を通っていない');
assert.ok(!tagTimeout.includes("winner = 'draw'"), 'タッグ戦の時間切れにdraw生成が残っている');

const formatStart = source.indexOf('Engine.formatFinish = function(');
const formatEnd = source.indexOf('// ╔', formatStart);
const formatFinish = new Function('Engine', `${source.slice(formatStart, formatEnd)}; return Engine.formatFinish;`)({});
assert.strictEqual(formatFinish('HP判定', ''), '判定勝ち', '結果画面・新聞で時間切れの白星根拠が伝わらない');
assert.ok(source.includes('時間切れ判定により、${winner === \'left\' ? L.name : R.name}の勝利'),
  '試合ログに判定勝ちの一言が無い');

console.log('match-timeout-no-draw-test: ok');
