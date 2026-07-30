'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

function fighter(id, ovr, extra = {}) {
  return {
    id, name: `F${id}`,
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    popularity: 40, age: 24, traits: [], injury: null,
    ...extra,
  };
}

(function testDepthRewardsCardReadySupportAndReserves() {
  const fullRoster = [90, 85, 80, 75, 75, 75, 75, 75, 70, 70, 70, 70]
    .map((ovr, index) => fighter(index + 1, ovr));
  const profile = Engine.ranking.getDepthProfile(fullRoster);
  assert.strictEqual(Math.round(profile.coreScore), 20, '4〜8番手が目標OVRなら主力層は満点');
  assert.strictEqual(Math.round(profile.reserveScore), 10, '9〜12番手が目標OVRなら控え層は満点');
  assert.strictEqual(Math.round(profile.score), 30, '層の厚みは30点を上限にする');
})();

(function testDepthDoesNotRewardStarOnlyOrUnavailableFighters() {
  const starOnly = [90, 85, 80].map((ovr, index) => fighter(index + 1, ovr));
  assert.strictEqual(Engine.ranking.getDepthProfile(starOnly).score, 0, '上位3人だけでは層の厚みを得ない');

  const healthy = [90, 85, 80, 75, 75, 75, 75, 75, 70, 70, 70, 70]
    .map((ovr, index) => fighter(index + 1, ovr));
  const injured = healthy.map(f => f.id === 4 ? { ...f, injury: { type: 'minor' } } : f);
  assert.ok(Engine.ranking.getDepthProfile(injured).score < Engine.ranking.getDepthProfile(healthy).score,
    '欠場中の主力は厚みとして数えない');
})();

(function testRankingUiReplacesAverageOvrWithDepth() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
  const start = source.indexOf('function renderRanking()');
  const end = source.indexOf('\n// ', start + 1);
  const body = source.slice(start, end);
  assert.ok(!body.includes('平均OVR'), 'ランキング画面に平均OVRを表示しない');
  assert.ok(body.includes('層の厚み'), 'ランキング画面に層の厚みを表示する');
  assert.ok(body.includes('depthCore') && body.includes('depthReserve'), '主力層と控え層を説明する');
})();

console.log('ranking-depth-redesign-test: PASS');
