#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage2-test.js — K-1「興行後の処理を一本化する」第2段(表示・記録だけの差を統一する)の回帰ガード
//  (2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-E08 因縁決着エントリ: Engine.show.resolvedRivalryEntry。lastShowNumber(何番目の興行か)と
//       宿怨の決着の勝者 bitterResolutionWinnerId の両方を持つ
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)が見る。ここは関数の中身と、
//  app.js / management.js が共通の関数を呼んでいること(文面)を確かめる。
//
//  ■ 使い方
//    node test/k1-stage2-test.js
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

// 関数本文(次のメソッドの手前まで)
function methodBody(file, signature) {
  const src = readSource('src', file);
  const start = src.indexOf(signature);
  assert.ok(start >= 0, `${signature} が見つからない`);
  const end = src.indexOf('\n  },\n', start);
  return src.slice(start, end);
}
const finalizeBody = () => methodBody('app.js', '  _finalizeShowImpl() {');
const executeShowBody = () => methodBody('management.js', '  executeShow(state) {');

console.log('K-1 第2段 回帰ガード');

// ── 1. K1-E08 因縁決着エントリ ──
section('E08: 決着エントリは lastShowNumber と宿怨の勝者IDの両方を持つ', () => {
  assert.ok(Engine.show && typeof Engine.show.resolvedRivalryEntry === 'function', 'Engine.show.resolvedRivalryEntry が無い');
  const prev = { matches: 5, lastWeek: 10, resolutionCount: 1, lastBand: 2, oneSided: 'A', pendingClashBonus: 3, tier: 2 };
  const state = { season: 2, week: 14, totalShows: 24 };
  const bitter = Engine.show.resolvedRivalryEntry(prev, { newResolutionCount: 2, resolved: 'bitter' }, state, 81);
  assert.strictEqual(bitter.lastShowNumber, 24);
  assert.strictEqual(bitter.bitterResolutionWinnerId, 81);
  assert.strictEqual(bitter.resolved, 'bitter');
  assert.strictEqual(bitter.matches, 0);
  assert.strictEqual(bitter.resolutionCount, 2);
  assert.strictEqual(bitter.lastWeek, 14);
  assert.strictEqual(bitter.lastResolvedWeek, 14);
  assert.strictEqual(bitter.lastAbsWeek, Engine.util.absWeek(2, 14));
  assert.strictEqual(bitter.lastBand, 0);
  assert.strictEqual(bitter.oneSided, null);
  assert.strictEqual(bitter.pendingClashBonus, 0);
  assert.strictEqual(bitter.tier, 2, '前のエントリのほかの欄は残す');
  // 好敵手・初回の決着には宿怨の勝者IDを付けない
  const good = Engine.show.resolvedRivalryEntry(prev, { newResolutionCount: 2, resolved: 'goodRival' }, state, 81);
  assert.strictEqual(good.bitterResolutionWinnerId, undefined);
  assert.strictEqual(good.lastShowNumber, 24);
  const first = Engine.show.resolvedRivalryEntry(prev, { newResolutionCount: 1 }, state, 81);
  assert.strictEqual(first.resolved, undefined);
  assert.strictEqual(first.bitterResolutionWinnerId, undefined);
  // 入力のエントリを書き換えない
  assert.strictEqual(prev.matches, 5);
});

section('E08: 両経路が Engine.show.resolvedRivalryEntry を呼ぶ(自前のエントリを組まない)', () => {
  const fin = finalizeBody();
  const exe = executeShowBody();
  assert.ok(fin.includes('Engine.show.resolvedRivalryEntry(rivalries[key], resolution, s, winnerId)'), 'app.js が共通の関数を呼んでいない');
  assert.ok(exe.includes('Engine.show.resolvedRivalryEntry(rivalries[key], resolution, s, winnerId)'), 'management.js が共通の関数を呼んでいない');
  assert.ok(!/bitterResolutionWinnerId:\s*winnerId/.test(fin), 'app.js に自前の決着エントリが残っている');
  assert.ok(!/lastShowNumber:\s*s\.totalShows/.test(exe), 'management.js に自前の決着エントリが残っている');
});

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
