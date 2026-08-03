'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const css = read('src/index.html');

const resultSeStart = app.indexOf('_playWarMatchResultSe(matchResult)');
const resultSe = app.slice(resultSeStart, app.indexOf('warSkipMatch(idx)', resultSeStart));
assert.ok(resultSe.includes("orgId: 'player'"), '対抗戦の自団体側を明示して共通SE判定へ渡す');
assert.ok(resultSe.includes('playMatchResultSe('), '対抗戦の決着SEは共通の勝敗判定を使う');

const skipStart = app.indexOf('warSkipMatch(idx)', resultSeStart);
const skip = app.slice(skipStart, app.indexOf('// Skip all remaining war matches', skipStart));
assert.ok(skip.includes('App._playWarMatchResultSe(wp.results[idx]);'), 'スキップ決着でも勝敗SEを鳴らす');
assert.ok(!skip.includes("Audio.play('tick')"), 'スキップ決着を操作音だけで済ませない');

const watchedStart = app.indexOf('_receiveWarBattleResult(data)', skipStart);
const watched = app.slice(watchedStart, app.indexOf('// Finalize war: apply outcome', watchedStart));
assert.ok(watched.includes('App._playWarMatchResultSe(wp.results[idx]);'), '観戦決着でも勝敗SEを鳴らす');
assert.ok(!watched.includes("Audio.play('click')"), '観戦決着をクリック音だけで済ませない');

assert.ok(/\.pb-mrow\.is-resolved \.pb-portrait\{width:108px;height:162px\}/.test(css),
  '対抗戦の消化済み試合も通常サイズの選手写真を使う');
assert.ok(!/\.pb-mrow\.is-resolved \.pb-portrait\{width:46px;height:66px\}/.test(css),
  '対抗戦の小さなサムネイル指定を残さない');

console.log('war-result-presentation-test: ok');
