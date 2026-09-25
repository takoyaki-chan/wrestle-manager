#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage4b2-test.js — K-1「興行後の処理を一本化する」第4段 4-B(後半)の回帰ガード(2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-E01 プロモ蓄積のリセット: Engine.show.resetPromoStacks。試合に出た選手(シングルの左右・タッグの4人)の
//       promoStack を0に戻す。出ていない選手は触らない。入力のロスターを書き換えない
//    2. K1-E03 怪我による引退: Engine.show.resolveMatchInjury / retireInjuredFighter / applyInjuryRetirementAftermath /
//       buildInjuryRetirementPresentations。引退者をロスターから外し、経歴・引退者の記録・関係値の凍結・仲の良い選手の
//       気落ち(M-22)・王座の返上(この興行の王座戦の結果も見る)・引退ポップアップのデータまで。実プレイの画面は
//       結果画面の怪我の欄に全治の週数を出さず、閉じた後に本人の引退ポップアップ→周りの反応(M-22)の順
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)が見る。ここは関数の中身と、
//  app.js が共通の関数を呼んでいること(文面)を確かめる。前半(F01/E05/X03/E02)は test/k1-stage4b-test.js。
//
//  ■ 使い方
//    node test/k1-stage4b2-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

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

// ── 2. K1-E03 怪我による引退 ──
// 本物の進行で作った状態(seed 42 の2季目)を土台にする(コーチ・関係値・年代記の関数が実データを読む)
const baseState = (() => {
  const G = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 6 && g.weekPhase === 'manage' && !g.offSeason });
  return { ...G, roster: G.roster.map(f => ({ ...f, injury: null })) };
})();
const clone = v => JSON.parse(JSON.stringify(v));
const heavyChk = (f, retireType = 'wearInjury', farewellKind = null) => ({
  newFighter: { ...f, injury: { type: '重傷', weeksLeft: 12, totalWeeks: 12 } },
  injuryInfo: { injury: { type: '重傷' }, weeks: 12 },
  retireType, farewellKind,
});

section('E03: retireInjuredFighter — ロスターから外し、経歴・引退者の記録・関係値の凍結まで済ませる(入力は書き換えない)', () => {
  assert.ok(Engine.show && typeof Engine.show.retireInjuredFighter === 'function', 'Engine.show.retireInjuredFighter が無い');
  const s0 = clone(baseState);
  const before = clone(s0);
  const f = s0.roster[0];
  const out = Engine.show.retireInjuredFighter(s0, s0.roster, f.id, heavyChk(f));
  assert.deepStrictEqual(s0, before, '入力の状態が書き換わった');
  assert.ok(!out.roster.some(c => c.id === f.id), 'ロスターに残っている');
  assert.strictEqual(out.roster.length, s0.roster.length - 1);
  const rf = out.state.retiredFighters.find(x => x.id === f.id);
  assert.ok(rf, 'retiredFighters に入っていない');
  assert.ok((rf.careerHistory || []).some(h => h.type === 'injury_retirement' && h.season === s0.season && h.week === s0.week), '経歴(injury_retirement)が無い');
  assert.ok((rf.careerRecord.history || []).some(h => h.type === 'retire' && h.reason === 'wearInjury'), 'careerRecord の retire が無い');
  assert.ok(rf.growthLog === undefined, 'growthLog が残っている');
  assert.ok(out.state.retiredIds.includes(f.id));
  assert.strictEqual(out.state.retiredSeasons[f.id], s0.season);
  const keys = Object.keys(out.state.relationships || {}).filter(k => k.startsWith(`${f.id}>`) || k.endsWith(`>${f.id}`));
  assert.ok(keys.length > 0 && keys.every(k => out.state.relationships[k].frozen), '引退者の関係値が凍結されていない');
});

section('E03: resolveMatchInjury — 重傷で消耗が上限を越えた選手は引退し、entry に retireType と幕切れの型が載る', () => {
  assert.ok(typeof Engine.show.resolveMatchInjury === 'function', 'Engine.show.resolveMatchInjury が無い');
  const s0 = clone(baseState);
  const [a, b] = s0.roster;
  const roster = s0.roster.map(c => (c.id === a.id || c.id === b.id) ? { ...c, wear: 70, condition: 35 } : c);
  const result = { matchType: 'single', left: { id: a.id, name: a.name }, right: { id: b.id, name: b.name }, winner: 'left', mq: 40, turns: 30, hpLeft: 5, hpRight: 0 };
  let hit = null;
  for (let seed = 1; seed < 20000 && !hit; seed++) {
    const s = { ...s0, rngSeed: seed, roster };
    const fighter = roster.find(c => c.id === b.id);
    const res = Engine.show.resolveMatchInjury(s, roster, result, 1, fighter, {});
    if (res && res.retired) hit = { res, s };
  }
  assert.ok(hit, '2万シードで一度も怪我引退が起きない');
  const { res } = hit;
  assert.strictEqual(res.entry.id, b.id);
  assert.ok(['wearInjury', 'careerEnding'].includes(res.entry.retireType), `retireType=${res.entry.retireType}`);
  assert.ok('farewellKind' in res.entry, 'entry に farewellKind の欄が無い');
  assert.ok(!res.roster.some(c => c.id === b.id), '引退者がロスターに残っている');
  assert.ok(res.state.retiredFighters.some(x => x.id === b.id), '引退者の記録が無い');
  // 乱入選手は判定しない
  const intr = { ...roster.find(c => c.id === b.id), isIntrusion: true };
  assert.strictEqual(Engine.show.resolveMatchInjury(hit.s, roster, result, 1, intr, {}), null, '乱入選手を判定した');
});

section('E03: applyInjuryRetirementAftermath — 仲の良い選手の気落ち(M-22)・王座の返上(興行前の王者とこの興行の王者の両方)', () => {
  assert.ok(typeof Engine.show.applyInjuryRetirementAftermath === 'function', 'Engine.show.applyInjuryRetirementAftermath が無い');
  const s0 = clone(baseState);
  const [x, y, z] = s0.roster;
  // x が引退。y は x と仲が良い
  let s = { ...s0, relationships: { ...s0.relationships, [`${y.id}>${x.id}`]: { bond: 80, rivalry: 0 }, [`${x.id}>${y.id}`]: { bond: 80, rivalry: 0 } }, _modalQueue: [] };
  const ret = Engine.show.retireInjuredFighter(s, s.roster, x.id, heavyChk(x));
  // 興行前の王者は x、この興行の王座戦の結果(ローカル titles)も x(防衛した直後に引退)
  const withChamp = { ...ret.state, titles: { ...ret.state.titles, world: { ...(ret.state.titles && ret.state.titles.world), championId: x.id, defenses: 3 } } };
  const localTitles = { ...withChamp.titles, world: { ...withChamp.titles.world, championId: x.id, defenses: 4 } };
  const entries = [{ id: x.id, name: x.name, injury: { type: '重傷' }, retireType: 'wearInjury', farewellKind: null }];
  const before = clone(withChamp);
  const aft = Engine.show.applyInjuryRetirementAftermath(withChamp, ret.roster, localTitles, entries);
  // 関係性ポップアップの待ち行列(_modalQueue)だけは共有配列への push が通り道(K-1 第1段の実施結果に記録。
  // 写して足す形にすると auto-sim の指紋が変わるため従来どおり)。それ以外は書き換えない
  const { _modalQueue: _q1, ...restAfter } = withChamp;
  const { _modalQueue: _q0, ...restBefore } = before;
  assert.deepStrictEqual(restAfter, restBefore, '入力の状態が書き換わった');
  assert.strictEqual(aft.state.titles.world.championId, null, '興行前の王者の王座が空位になっていない');
  assert.strictEqual(aft.titles.world.championId, null, 'この興行の王座戦の結果(titles)に引退者が王者のまま残っている');
  assert.strictEqual(aft.events.filter(e => /王座返上/.test(e)).length, 1, `王座返上のログが1本でない: ${JSON.stringify(aft.events)}`);
  assert.ok(aft.state.relationships[`${y.id}>${x.id}`].bond < 80, '仲の良い選手の絆が下がっていない(O-04)');
  assert.ok((aft.state._modalQueue || []).some(m => m.type === 'M-22'), '引退の置き土産(M-22)が積まれていない');
  // 引退者がいなければ何も変えない(王者 z は健在)
  const calm = { ...s0, titles: { ...s0.titles, world: { ...(s0.titles && s0.titles.world), championId: z.id } } };
  const none = Engine.show.applyInjuryRetirementAftermath(calm, calm.roster, calm.titles, [{ id: z.id, name: z.name, injury: { type: '軽傷' }, retireType: null }]);
  assert.strictEqual(none.state, calm);
  assert.strictEqual(none.titles.world.championId, z.id);
  assert.deepStrictEqual(none.events, []);
});

section('E03: buildInjuryRetirementPresentations — 引退ポップアップのデータ(経路・セリフ・幕切れの型・王座返上)を組む', () => {
  assert.ok(typeof Engine.show.buildInjuryRetirementPresentations === 'function', 'Engine.show.buildInjuryRetirementPresentations が無い');
  const s0 = clone(baseState);
  const x = s0.roster[0];
  const pre = { ...s0, titles: { ...s0.titles, world: { ...(s0.titles && s0.titles.world), championId: x.id } } };
  const ret = Engine.show.retireInjuredFighter(s0, s0.roster, x.id, heavyChk(x, 'careerEnding', 'pyrrhic'));
  const entries = [{ id: x.id, name: x.name, injury: { type: '重傷' }, retireType: 'careerEnding', farewellKind: 'pyrrhic' }];
  const out = Engine.show.buildInjuryRetirementPresentations(ret.state, pre, entries);
  const p = out._pendingInjuryRetirements;
  assert.ok(Array.isArray(p) && p.length === 1, '_pendingInjuryRetirements が1件でない');
  assert.strictEqual(p[0].fighter.id, x.id);
  assert.strictEqual(p[0].route, 'injury_career_ending');
  assert.strictEqual(p[0].farewellKind, 'pyrrhic', '幕切れの型が演出データに届いていない');
  assert.strictEqual(p[0].wasChampion, true);
  assert.ok(typeof p[0].line === 'string' && p[0].line.length > 0, '引退セリフが無い');
  // 引退者がいなければ状態はそのまま
  assert.strictEqual(Engine.show.buildInjuryRetirementPresentations(s0, s0, []), s0);
});

section('E03: 実プレイ(app.js)とエンジン(executeShow)が同じ関数で怪我引退を処理し、画面の流れが引退ポップアップへつながる', () => {
  const body = finalizeBody();
  const ex = executeShowBody();
  ['resolveMatchInjury', 'applyInjuryRetirementAftermath', 'buildInjuryRetirementPresentations'].forEach(fn => {
    assert.ok(new RegExp(`Engine\\.show\\.${fn}\\(`).test(body), `_finalizeShowImpl が Engine.show.${fn} を呼んでいない`);
    assert.ok(new RegExp(`Engine\\.show\\.${fn}\\(`).test(ex), `executeShow が Engine.show.${fn} を呼んでいない`);
  });
  assert.ok(!/Engine\.show\.rollMatchInjury\(/.test(body), '_finalizeShowImpl が怪我だけ付けて残す旧コード(rollMatchInjury の直呼び)を持っている');
  const app = readSource('src', 'app.js');
  const close = app.slice(app.indexOf('  closeShowResult() {'), app.indexOf('  closeShowResult() {') + 40000);
  assert.ok(/showRetirementPopups\(pendingInjuryRetirements/.test(close), 'closeShowResult が怪我引退の本人ポップアップを出していない');
  assert.ok(/deferFlagModalsAfterInjuryRetire/.test(close), '引退の置き土産(M-22)を本人の引退ポップアップの後に回す処理が無い');
  const ui = readSource('src', 'ui-common.js');
  const blk = ui.slice(ui.indexOf('function _pbInjuryBlock('), ui.indexOf('function _pbInjuryBlock(') + 800);
  assert.ok(/ir\.retireType \? ''/.test(blk), '結果画面の怪我の欄が引退者にも全治の週数を出す');
});

if (failed > 0) {
  console.log(`\n${failed} 件 FAIL`);
  process.exit(1);
}
console.log('\nALL PASS');
