#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage4b2-test.js — K-1「興行後の処理を一本化する」第4段 4-B(後半)の回帰ガード(2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-E01 プロモ蓄積のリセット: Engine.show.resetPromoStacks。試合に出た選手(シングルの左右・タッグの4人)の
//       promoStack を0に戻す。出ていない選手は触らない。入力のロスターを書き換えない
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)が見る。ここは関数の中身と、
//  app.js が共通の関数を呼んでいること(文面)を確かめる。前半(F01/E05/X03/E02)は test/k1-stage4b-test.js。
//
//  ■ 使い方
//    node test/k1-stage4b2-test.js
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

// executeShow の本文(次のメソッドの手前まで)
function executeShowBody() {
  const mgmt = readSource('src', 'management.js');
  const start = mgmt.indexOf('  executeShow(state) {');
  assert.ok(start >= 0, 'executeShow が見つからない');
  const end = mgmt.indexOf('\n  },\n', start);
  return mgmt.slice(start, end);
}

function fighter(id, extra = {}) {
  return { id, name: `選手${id}`, popularity: 40, trust: 50, traits: [], role: 'Face', pw: 50, sp: 50, te: 50, st: 50, mn: 50, ...extra };
}

console.log('K-1 第4段 4-B(後半)回帰ガード');

// ── 1. K1-E01 プロモ蓄積のリセット ──
section('E01: 試合に出た選手(シングルの左右・タッグの4人)の promoStack が0に戻り、出ていない選手は触らない', () => {
  assert.ok(Engine.show && typeof Engine.show.resetPromoStacks === 'function', 'Engine.show.resetPromoStacks が無い');
  const roster = [1, 2, 3, 4, 5, 6, 7].map(id => fighter(id, { promoStack: 3 }));
  const before = JSON.parse(JSON.stringify(roster));
  const results = [
    { matchType: 'single', left: { id: 1 }, right: { id: 2 }, winner: 'left', mq: 50 },
    { matchType: 'tag', winner: 'teamA', mq: 50, perFighter: { 3: {}, 4: {}, 5: {}, 6: {} } },
  ];
  const out = Engine.show.resetPromoStacks(roster, results);
  [1, 2, 3, 4, 5, 6].forEach(id => assert.strictEqual(out.find(c => c.id === id).promoStack, 0, `出場した選手${id}の蓄積が残っている`));
  assert.strictEqual(out.find(c => c.id === 7).promoStack, 3, '出ていない選手7の蓄積が変わった');
  assert.strictEqual(out.find(c => c.id === 7), roster[6], '出ていない選手のオブジェクトを作り直した');
  assert.deepStrictEqual(roster, before, '入力のロスターが書き換わった');
});

section('E01: 実プレイ(app.js)とエンジン(executeShow)が同じ Engine.show.resetPromoStacks を呼ぶ', () => {
  assert.ok(/Engine\.show\.resetPromoStacks\(roster, results\)/.test(finalizeBody()), '_finalizeShowImpl が Engine.show.resetPromoStacks を呼んでいない');
  assert.ok(/Engine\.show\.resetPromoStacks\(roster, results\)/.test(executeShowBody()), 'executeShow が Engine.show.resetPromoStacks を呼んでいない');
});

if (failed > 0) {
  console.log(`\n${failed} 件 FAIL`);
  process.exit(1);
}
console.log('\nALL PASS');
