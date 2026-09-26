#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/faction-f08-leader-rivalry-boost-test.js — F08「直接対決をメインに組む」の試合後、
//  2人のリーダーの因縁(rivalry)が両方向に +30〜40 深まる(2026-09-26 Keisuke 裁定「直す」)
//
//  ■ 何を守るか
//    Engine.show.settleFactionBookings(興行後の派閥の予約の清算。第4段 4-A までは実プレイの hook)の F08 の清算は、
//    リーダー同士の直接対決の後に 30 + floor(乱数×11) を両方向の rivalry に足す(乱数は派閥の 0xFA88 の3つ目。
//    1つ目・2つ目は Engine.factions.applyMatchResult の勢いと対立度)。関係値のキーは方向つきの `a>b` で、
//    2026-09-26 までは `a|b` で引いていたため一度も効いていなかった(点火 faction-f08 で発見)
//    - 両方向に同じ量が足される。足す量は 30〜40 で、乱数の3つ目から決まる(引く数は変えていない)
//    - 関係値のほかの組・ほかの欄(bond)は動かさない
//    - 引き分けでも因縁は深まる(勢い・対立度の乱数を引かないので、足す量は乱数の1つ目から)
//    - 100 で頭打ち
//
//  ■ 使い方
//    node test/faction-f08-leader-rivalry-boost-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

const clone = v => JSON.parse(JSON.stringify(v));
// K-1 第4段 4-A(2026-09-26): 派閥の予約の清算は実プレイの hook から Engine.show.settleFactionBookings(両経路)へ移った
const mgmt = readSource('src', 'management.js');
const start = mgmt.indexOf('\n    settleFactionBookings(state, roster, validMatches, results) {');
assert.ok(start >= 0, 'Engine.show.settleFactionBookings が無い');
const method = mgmt.slice(start, mgmt.indexOf('\n    },\n', start) + 6);
const hooks = {
  _finalizeHookFactionBookings(w) {
    const out = Engine.show.settleFactionBookings(w.s, w.roster, w.validMatches, w.results);
    w.s = out.state;
    w.roster = out.roster;
  },
};

// 2派閥(リーダー+2人ずつ)。リーダーは各派閥の顔役(isLeaderOrExecutive)
const ids = [1, 2, 3, 4, 5, 6];
const roster = ids.map(id => ({ ...clone(ALL_CHARS.find(c => c.id === id)), trust: 60, condition: 90 }));
const key = (a, b) => `${a}>${b}`;
function baseState(rivalryAB, rivalryBA) {
  const relationships = {};
  for (const a of ids) for (const b of ids) if (a !== b) relationships[key(a, b)] = { bond: 50, rivalry: 10 };
  relationships[key(1, 4)] = { bond: 30, rivalry: rivalryAB };
  relationships[key(4, 1)] = { bond: 35, rivalry: rivalryBA };
  return {
    rngSeed: 4242, season: 2, week: 10, roster,
    relationships,
    factions: [
      { id: 11, name: 'A派', leaderId: 1, memberIds: [1, 2, 3], momentum: 10, type: 'rivalrous', inHostility: true },
      { id: 12, name: 'B派', leaderId: 4, memberIds: [4, 5, 6], momentum: 10, type: 'rivalrous', inHostility: true },
    ],
    factionHostility: { '11>12': 85, '12>11': 20 },
    _pendingF08Directive: { factionAId: 11, factionBId: 12, leaderAId: 1, leaderBId: 4, triggeredSeason: 2, triggeredWeek: 9 },
  };
}
function run(state, winner) {
  const w = {
    s: state,
    roster: state.roster,
    validMatches: [{ left: 1, right: 4, isTitle: false }],
    results: [{ winner, left: { id: 1 }, right: { id: 4 }, hpLeft: { final: 40, max: 100 }, hpRight: { final: 0, max: 100 } }],
  };
  hooks._finalizeHookFactionBookings(w);
  return w.s;
}
// 足す量: 派閥の 0xFA88 の乱数の n 番目(1始まり)
function expectedBoost(s, nth) {
  const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xFA88));
  let v = 0;
  for (let i = 0; i < nth; i += 1) v = Engine.rng.float(rng);
  return 30 + Math.floor(v * 11);
}

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

console.log('F08 直接対決の両リーダーの因縁');

section('勝敗のついた直接対決: 両方向に同じ量(30〜40・乱数の3つ目)が足され、ほかの関係値は動かない', () => {
  const s0 = baseState(45.5, 44.25);
  const before = clone(s0.relationships);
  const s1 = run(s0, 'left');
  const boost = expectedBoost(s0, 3);
  assert.ok(boost >= 30 && boost <= 40, `足す量 ${boost} が 30〜40 の外`);
  assert.strictEqual(s1.relationships[key(1, 4)].rivalry, 45.5 + boost, `リーダーA→B の因縁 45.5 → ${s1.relationships[key(1, 4)].rivalry}(+${boost} のはず)`);
  assert.strictEqual(s1.relationships[key(4, 1)].rivalry, 44.25 + boost, `リーダーB→A の因縁 44.25 → ${s1.relationships[key(4, 1)].rivalry}(+${boost} のはず)`);
  assert.strictEqual(s1.relationships[key(1, 4)].bond, 30, 'bond が動いた');
  assert.strictEqual(s1.relationships[key(4, 1)].bond, 35, 'bond が動いた');
  for (const k of Object.keys(before)) {
    if (k === key(1, 4) || k === key(4, 1)) continue;
    assert.deepStrictEqual(s1.relationships[k], before[k], `ほかの組 ${k} の関係値が動いた`);
  }
  assert.strictEqual(s1._pendingF08Directive, undefined, '方針が消えていない');
  // 勢いと対立度(1つ目・2つ目の乱数)は従来どおり 1.5 倍で動く
  const w = s1.factions.find(f => f.id === 11);
  assert.ok(w.momentum > 10, '勝った派閥の勢いが上がっていない');
  assert.ok(s1.factionHostility['12>11'] > 20, '敗れた派閥→勝った派閥の対立度が上がっていない');
});

section('右(リーダーB)が勝っても両方向に同じ量', () => {
  const s0 = baseState(20, 60);
  const s1 = run(s0, 'right');
  const boost = expectedBoost(s0, 3);
  assert.strictEqual(s1.relationships[key(1, 4)].rivalry, 20 + boost);
  assert.strictEqual(s1.relationships[key(4, 1)].rivalry, 60 + boost);
});

section('引き分け: 勢い・対立度の乱数を引かないので、足す量は乱数の1つ目から。それでも両方向に深まる', () => {
  const s0 = baseState(40, 41);
  const s1 = run(s0, 'draw');
  const boost = expectedBoost(s0, 1);
  assert.strictEqual(s1.relationships[key(1, 4)].rivalry, 40 + boost);
  assert.strictEqual(s1.relationships[key(4, 1)].rivalry, 41 + boost);
});

section('100 で頭打ち', () => {
  const s1 = run(baseState(90, 75), 'left'); // 75 + 30〜40 も 100 を超える
  assert.strictEqual(s1.relationships[key(1, 4)].rivalry, 100);
  assert.strictEqual(s1.relationships[key(4, 1)].rivalry, 100);
});

section('リーダー同士の対決がカードに無ければ因縁は動かない(方針だけ消える)', () => {
  const s0 = baseState(45, 45);
  const w = {
    s: s0, roster: s0.roster,
    validMatches: [{ left: 2, right: 5, isTitle: false }],
    results: [{ winner: 'left', left: { id: 2 }, right: { id: 5 }, hpLeft: { final: 40, max: 100 }, hpRight: { final: 0, max: 100 } }],
  };
  hooks._finalizeHookFactionBookings(w);
  assert.strictEqual(w.s.relationships[key(1, 4)].rivalry, 45);
  assert.strictEqual(w.s.relationships[key(4, 1)].rivalry, 45);
  assert.strictEqual(w.s._pendingF08Directive, undefined);
});

section('関係値の引き方は方向つきのキー(a|b 型の引き間違いが戻っていない)', () => {
  assert.ok(!/`\$\{d\.leader[AB]Id\}\|\$\{d\.leader[AB]Id\}`/.test(method), 'F08 の清算がまだ `a|b` のキーで関係値を引いている');
  assert.ok(method.includes('Engine.relationships._key(d.leaderAId, d.leaderBId)'), 'F08 の清算が Engine.relationships._key を使っていない');
});

if (failed > 0) {
  console.log(`\n${failed} 件失敗`);
  process.exit(1);
}
console.log('\nfaction-f08-leader-rivalry-boost-test: ok');
