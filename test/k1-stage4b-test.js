#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage4b-test.js — K-1「興行後の処理を一本化する」第4段 4-B(前半)の回帰ガード(2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-F01 タッグの人気: Engine.show.applyMatchPopularity。負けたチームは負けとして数え(勝ちの人気
//       ボーナスなし・連敗が続く・直近の結果が「負け」)、タッグにもメイン低評価の人気減とヒール適性の加点が掛かる
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)が見る。ここは関数の中身と、
//  app.js が共通の関数を呼んでいること(文面)を確かめる。
//
//  ■ 使い方
//    node test/k1-stage4b-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

// _finalizeShowImpl の本文(次のメソッドの手前まで)
function finalizeBody() {
  const app = readSource('src', 'app.js');
  const start = app.indexOf('  _finalizeShowImpl() {');
  assert.ok(start >= 0, '_finalizeShowImpl が見つからない');
  const end = app.indexOf('\n  },\n', start);
  return app.slice(start, end);
}

function fighter(id, extra = {}) {
  return { id, name: `選手${id}`, popularity: 40, losingStreak: 0, traits: [], role: 'Face', pw: 50, sp: 50, te: 50, st: 50, mn: 50, ...extra };
}

console.log('K-1 第4段 4-B(前半)回帰ガード');

// ── 1. K1-F01 タッグの人気 ──
section('F01: タッグの敗者は負けとして数える(勝ちの人気ボーナスなし・連敗が続く・直近の結果は負け)', () => {
  assert.ok(Engine.show && typeof Engine.show.applyMatchPopularity === 'function', 'Engine.show.applyMatchPopularity が無い');
  const roster = [fighter(1), fighter(2), fighter(3, { losingStreak: 1 }), fighter(4, { losingStreak: 1 })];
  const match = { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } };
  const result = { matchType: 'tag', winner: 'teamA', mq: 60 };
  const out = Engine.show.applyMatchPopularity(roster, match, result, false, 50, null).roster;
  const by = id => out.find(c => c.id === id);
  [1, 2].forEach(id => {
    assert.strictEqual(by(id).lastMatchResult, 'win', `勝者${id}の直近の結果`);
    assert.strictEqual(by(id).losingStreak, 0, `勝者${id}の連敗`);
  });
  [3, 4].forEach(id => {
    assert.strictEqual(by(id).lastMatchResult, 'loss', `敗者${id}の直近の結果が負けでない`);
    assert.strictEqual(by(id).losingStreak, 2, `敗者${id}の連敗が続いていない`);
  });
  // 同じ人気の勝者と敗者で、勝ちの加点(rawGain+1)の分だけ差がある
  assert.ok(by(1).popularity > by(3).popularity, `勝者 ${by(1).popularity} と敗者 ${by(3).popularity} の人気に差が無い`);
  // 各選手の値は、同じ勝敗のシングルとまったく同じ(式が一つ)
  const single = Engine.applyMQPopularity([fighter(1), fighter(3, { losingStreak: 1 })],
    { mq: 60, winner: 'left', left: { id: 1 }, right: { id: 3 } }, false, 50, null).roster;
  assert.strictEqual(by(1).popularity, single[0].popularity);
  assert.strictEqual(by(3).popularity, single[1].popularity);
});

section('F01: タッグにもメイン低評価の人気減とヒール適性の加点が掛かる(裁定)', () => {
  const roster = [
    fighter(1), fighter(2, { traits: ['ヒール適性'], role: 'Heel' }),
    fighter(3), fighter(4),
  ];
  const match = { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } };
  // メイン低評価: 同じ試合をメイン/前座で比べる
  const low = { matchType: 'tag', winner: 'teamB', mq: 20 };
  const main = Engine.show.applyMatchPopularity(roster, match, low, true, 50, null);
  const under = Engine.show.applyMatchPopularity(roster, match, low, false, 50, null);
  [1, 2, 3, 4].forEach(id => {
    const m = main.roster.find(c => c.id === id).popularity;
    const u = under.roster.find(c => c.id === id).popularity;
    assert.ok(m < u, `選手${id}: メインの低評価で人気が下がっていない (メイン ${m} / 前座 ${u})`);
  });
  assert.ok(main.popEvents.some(e => /メインイベントの低い試合評価/.test(e)), 'メイン低評価の知らせが返らない');
  // ヒール適性: MQ40以上で加点。同じ側のもう一人(特性なし)より伸びる
  const good = Engine.show.applyMatchPopularity(roster, match, { matchType: 'tag', winner: 'teamA', mq: 50 }, false, 50, null).roster;
  assert.ok(good.find(c => c.id === 2).popularity > good.find(c => c.id === 1).popularity, 'ヒール適性の加点が効いていない');
});

section('F01: 引き分けは両チームとも連敗が止まり、直近の結果は引き分け', () => {
  const roster = [fighter(1, { losingStreak: 2 }), fighter(2), fighter(3, { losingStreak: 4 }), fighter(4)];
  const match = { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } };
  const out = Engine.show.applyMatchPopularity(roster, match, { matchType: 'tag', winner: 'draw', mq: 50 }, false, 50, null).roster;
  out.forEach(c => {
    assert.strictEqual(c.lastMatchResult, 'draw');
    assert.strictEqual(c.losingStreak, 0);
  });
});

section('F01: 実プレイ(app.js)はエンジンと同じ Engine.show.applyMatchPopularity を呼ぶ(左右に同じ選手を入れない)', () => {
  const body = finalizeBody();
  assert.ok(/Engine\.show\.applyMatchPopularity\(/.test(body), '_finalizeShowImpl が Engine.show.applyMatchPopularity を呼んでいない');
  assert.ok(!/fakeSingleResult/.test(body), '左右に同じ選手を入れる旧コード(fakeSingleResult)が残っている');
  const mgmt = readSource('src', 'management.js');
  const ex = mgmt.slice(mgmt.indexOf('  executeShow(state) {'), mgmt.indexOf('  executeShow(state) {') + 60000);
  assert.ok(/Engine\.show\.applyMatchPopularity\(/.test(ex), 'executeShow が Engine.show.applyMatchPopularity を呼んでいない');
});

if (failed > 0) {
  console.log(`\nFAIL: ${failed} 件`);
  process.exit(1);
}
console.log('\nPASS');
