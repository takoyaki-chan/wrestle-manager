#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage3-test.js — K-1「興行後の処理を一本化する」第3段の回帰ガード(2026-09-26)
//
//  ■ 何を守るか
//    3-1 通常興行の試合後の処理は Engine.show.finalize の1本。Engine.executeShow は
//        Engine.show.beginShow → 試合のシミュレーション → Engine.show.finalize を呼ぶだけ
//    - finalize は入力の状態を書き換えない(試合結果の配列には評価と印を書き足す=従来どおり)
//    - finalize の hooks(実プレイだけの処理を差し込む口)は決まった順に1回ずつ呼ばれる
//    - ctx.logStyle で、エンジンの文字列のログと実プレイの構造化ログを選ぶ
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)と、その --dump / compare-dumps.js
//  (同じ経路の前後比較)が見る。ここは関数の形と中身を確かめる。
//
//  ■ 使い方
//    node test/k1-stage3-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { engineShowBody, finalizeBody } = require('./helpers/show-paths.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}
const clone = v => JSON.parse(JSON.stringify(v));

console.log('K-1 第3段 回帰ガード');

// 本物の進行で作った興行週の状態(seed 42 の2季目14週。k1-parity の fixture と同じ週)に、
// 健康な選手でシングル3試合+タッグ1試合のカードを組む
const showState = (() => {
  const G = clone(advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 14 && g.weekPhase === 'manage' && !g.offSeason }));
  const ids = G.roster.filter(c => !c.injury && !c.isRental && !c.forcedRest).map(c => c.id);
  assert.ok(ids.length >= 10, `健康な選手が足りない(${ids.length})`);
  G.showCard = [
    { left: ids[0], right: ids[1], isTitle: false },
    { left: ids[2], right: ids[3], isTitle: false },
    { left: ids[4], right: ids[5], isTitle: false },
    { matchType: 'tag', teamA: { fighter1: ids[6], fighter2: ids[7] }, teamB: { fighter1: ids[8], fighter2: ids[9] } },
  ];
  return G;
})();

// ── 3-1 エンジンの経路の形 ──
section('3-1: executeShow は beginShow → 試合のシミュレーション → Engine.show.finalize を呼ぶだけ', () => {
  const mgmt = readSource('src', 'management.js');
  const exe = mgmt.slice(mgmt.indexOf('  executeShow(state) {'), mgmt.indexOf('\n  },\n', mgmt.indexOf('  executeShow(state) {')));
  assert.ok(/const begun = Engine\.show\.beginShow\(repaired, validMatches\);/.test(exe), 'executeShow が Engine.show.beginShow を呼んでいない');
  assert.ok(/const fin = Engine\.show\.finalize\(s, validMatches, rawResults, \{/.test(exe), 'executeShow が Engine.show.finalize を呼んでいない');
  // 試合後の処理を executeShow の中に書き直していない(finalize の中にだけある)
  ['Engine.mq.finalize(', 'Engine.mq.updateRecord(', 'Engine.attendanceV2.calcAttendanceV2(', 'Engine.applyShowPopularity(',
    'Engine.show.resolveMatchInjury(', 'Engine.relationships.applyMatchResult(', 'Engine.show.applyMatchGrowth(',
    'Engine.show.applySuddenDepartures(', 'Engine.kaigan.processMatchResults('].forEach(call => {
    assert.ok(!exe.includes(call), `executeShow に試合後の処理(${call})が残っている`);
    assert.ok(finalizeBody().includes(call), `Engine.show.finalize が ${call} を呼んでいない`);
  });
  // engineShowBody(executeShow + finalize)で、第2段・第4段の共通の関数がすべて通っている
  const body = engineShowBody();
  ['resolvedRivalryEntry', 'applyMatchPopularity', 'resetPromoStacks', 'resolveMatchInjury', 'applyInjuryRetirementAftermath',
    'accrueFactionPoints', 'applyMatchGrowth', 'accumulateSeasonStats', 'recordShowH2h', 'applySuddenDepartures',
    'buildInjuryRetirementPresentations', 'buildShowNewspaperData'].forEach(fn => {
    assert.ok(body.includes(`Engine.show.${fn}(`), `エンジンの経路が Engine.show.${fn} を通っていない`);
  });
});

// ── finalize の中身 ──
function runFinalize(ctx = {}) {
  const input = clone(showState);
  const validMatches = (input.showCard || []).filter(m => m.matchType === 'tag'
    ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
    : (m.left > 0 && m.right > 0));
  assert.ok(validMatches.length > 0, 'fixture にカードが無い');
  const begun = Engine.show.beginShow(input, validMatches);
  let roster = begun.roster;
  const results = validMatches.map((m, i) => {
    if (m.matchType === 'tag') {
      const f = id => roster.find(c => c.id === id);
      const tag = Engine.showTagMatch.simulate({ ...begun.state, roster }, { fighter1: f(m.teamA.fighter1), fighter2: f(m.teamA.fighter2) }, { fighter1: f(m.teamB.fighter1), fighter2: f(m.teamB.fighter2) });
      roster = tag.roster;
      return tag.result;
    }
    const rng = Engine.rng.create(Engine.rng.derive(input.rngSeed, input.season, input.week, m.left, m.right));
    return Engine.battle.simulateMatch(roster.find(c => c.id === m.left), roster.find(c => c.id === m.right), rng, 1, {});
  });
  const inputBefore = clone(input);
  const beganBefore = clone(begun.state);
  const fin = Engine.show.finalize(begun.state, validMatches, results, { roster, preShowLosingStreaks: begun.preShowLosingStreaks, preShowState: input, ...ctx });
  return { input, inputBefore, begun, beganBefore, validMatches, results, fin };
}

section('beginShow: 興行数+1・weekPhase・休養願いの解除。入力とロスターの選手を書き換えない', () => {
  const s0 = clone(showState);
  s0.roster[0] = { ...s0.roster[0], forcedRest: true };
  const before = clone(s0);
  const begun = Engine.show.beginShow(s0, (s0.showCard || []).filter(m => m.left > 0 && m.right > 0));
  assert.deepStrictEqual(s0, before, 'beginShow が入力を書き換えた');
  assert.strictEqual(begun.state.totalShows, s0.totalShows + 1);
  assert.strictEqual(begun.state.weekPhase, 'showExec');
  assert.strictEqual(begun.state.roster, s0.roster, 'state.roster は興行前のロスターのまま(finalize の書き戻しまで)');
  assert.strictEqual(begun.roster[0].forcedRest, false, '作業用のロスターで休養願いを外していない');
  assert.ok(begun.roster[0] !== s0.roster[0], '作業用のロスターは写し');
  assert.ok(begun.preShowLosingStreaks instanceof Map && begun.preShowLosingStreaks.size === s0.roster.length);
});

section('finalize: 入力の状態を書き換えない(新しい状態を返す)', () => {
  const run = runFinalize();
  assert.deepStrictEqual(run.input, run.inputBefore, 'finalize が興行前の状態を書き換えた');
  assert.deepStrictEqual(run.begun.state, run.beganBefore, 'finalize が beginShow の状態を書き換えた');
  const s = run.fin.state;
  assert.ok(s !== run.begun.state);
  assert.strictEqual(s.lastShowResults, run.fin.results, '試合結果を lastShowResults に書き戻していない');
  assert.ok(run.fin.results.every(r => Number.isFinite(r.mq) && r.mqInventory), '評価の確定(mq・mqInventory)が付いていない');
  assert.strictEqual(s.totalShows, run.input.totalShows + 1);
  assert.ok(s.lastShowAttendance > 0 && s.lastShowRating, '集客・★を残していない');
  assert.ok(s.roster.every(c => !c.forcedRest), '書き戻したロスターに休養願いが残っている');
  assert.ok(Number.isFinite(run.fin.fp) && Number.isFinite(run.fin.venueHeat));
  assert.ok(Array.isArray(run.fin.titleMatchOutcomes) && Array.isArray(run.fin.showRivalryResolutions));
});

section('finalize: 同じ入力から同じ結果(乱数は状態の種からだけ引く)', () => {
  const a = runFinalize().fin;
  const b = runFinalize().fin;
  assert.deepStrictEqual(a.state, b.state);
  assert.deepStrictEqual(a.events, b.events);
});

section('finalize: hooks は決まった順に1回ずつ、作業中の値の入れ物を受け取って呼ばれる', () => {
  const calls = [];
  const mk = name => w => {
    calls.push(name);
    ['s', 'roster', 'titles', 'rivalries', 'events', 'titleMatchOutcomes', 'validMatches', 'results'].forEach(k => assert.ok(w[k], `${name}: w.${k} が無い`));
    if (name === 'afterGrowth') {
      const wb = w.writeback();
      assert.strictEqual(wb.roster, w.roster, 'writeback のロスターが作業中のロスターでない');
      assert.strictEqual(wb.lastShowResults, w.results);
    }
  };
  const names = ['afterTitles', 'afterRelationships', 'afterGrowth', 'beforeKaigan', 'afterWriteback'];
  const hooks = Object.fromEntries(names.map(n => [n, mk(n)]));
  const plain = runFinalize().fin;
  const hooked = runFinalize({ hooks }).fin;
  assert.deepStrictEqual(calls, names);
  // 何もしない hooks は結果を変えない
  assert.deepStrictEqual(hooked.state, plain.state);
});

section('finalize: hooks が作業中の値を差し替えると、その後の処理はそれを使う', () => {
  const run = runFinalize({ hooks: {
    afterRelationships: w => { w.common1MatchIdx = 0; w.s = { ...w.s, _stage3HookMark: 1 }; },
    afterWriteback: w => {
      assert.strictEqual(w.s.roster, w.roster, 'afterWriteback の時点で書き戻しが済んでいない');
      w.s = { ...w.s, _stage3AfterWriteback: true };
    },
  } });
  assert.strictEqual(run.fin.state._stage3HookMark, 1, 'hooks の状態が引き継がれていない');
  assert.strictEqual(run.fin.state._stage3AfterWriteback, true, 'afterWriteback の状態が引き継がれていない');
});

section('finalize: ctx.logStyle — 省略時は文字列、structured は実プレイの gameLog の型', () => {
  const text = runFinalize().fin.events;
  const structured = runFinalize({ logStyle: 'structured' }).fin.events;
  assert.ok(text.some(e => typeof e === 'string' && e.startsWith('📊 ★')), 'エンジンの★の一文が無い');
  assert.ok(structured.some(e => e && (e.type === 'show_rating_org_pop_update' || e.type === 'show_rating_org_pop_update_small_venue')),
    '実プレイの★の構造化ログが無い');
  assert.ok(!structured.some(e => typeof e === 'string' && e.startsWith('📊 ★')), '構造化ログに文字列の★が混ざった');
});

if (failed > 0) {
  console.log(`\nFAIL: ${failed} 件`);
  process.exit(1);
}
console.log('\nALL PASS');
