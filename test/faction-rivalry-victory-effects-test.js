#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/faction-rivalry-victory-effects-test.js — 派閥抗争の決着の効果(2026-09-26 Keisuke 裁定
//  「派閥の決着の効果は仕様どおり効かせる」)の回帰ガード
//
//  ■ 何を守るか(specs/faction-rivalry-points-spec-v0.1.md §5)
//    以前の applyRivalryVictory / checkRivalryResolution は state を直接書き換える形で、純関数のヘルパーの
//    戻り値を捨てていた。先取100の勝者・敗者の勢い・信頼・絆と両方向の対立度 -40(派閥消滅の残存側 -40 も)が
//    一度も入らず、勝者の集客(§5.1)と敗者の寝返り・亀裂の確率(§5.2)は書くだけで読まれていなかった。
//    - §5.1 勝者: 勢い +40・全メンバーの信頼 +5・メンバー→リーダーの絆 +5・派閥抗争 appeal を 12週間持ち越す
//    - §5.2 敗者: 勢い -25・リーダーの信頼 -8・末端の信頼 -3・権威の失墜・F04/F05 の確率 ×1.5 を 12週間
//    - §5.3 共通: 両方向 hostility -40・記録の削除・F08/F09 のクールダウン
//    - §5.4 CONSOLATION は残存側の hostility -40 だけ / CALM は効果なし
//    - 純関数(入力の state を書き換えない)・tickWeek が返り値の state を使う
//
//  ■ 使い方
//    node test/faction-rivalry-victory-effects-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

// factions.js の結果文は派閥名を WM_I18N.pn に通す。auto-sim.js と同じ素通しのスタブを先に置く
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach((key) => { out = out.split('{' + key + '}').join(params[key]); });
  return out;
}, pn(str) { return str; }, pnSurname(str) { return str; }, mv(str) { return str; }, mvShort(str) { return str; } };
loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

const CFG = FACTION_CONFIG;
const F = Engine.factions;
const clone = (x) => JSON.parse(JSON.stringify(x));
const close = (a, b) => Math.abs(a - b) < 1e-9;
const sens = (t) => Engine.trust.trustSensitivity(t);
const hostOf = (s, a, b) => (s.factionHostility || {})[F._hostKey(a, b)] || 0;
const momOf = (s, id) => s.factions.find(f => f.id === id).momentum;
const trustOf = (s, id) => s.roster.find(c => c.id === id).trust;
const bondOf = (s, a, b) => s.relationships[`${a}>${b}`].bond;
const absOf = (s) => Engine.util.absWeekTotal(s.season, s.week, s.offSeason, s.offWeek);

function fighter(id, extra = {}) {
  return { id, name: `選手${id}`, popularity: 40, trust: 50, traits: [], role: 'Face', pw: 60, sp: 60, te: 60, st: 60, mn: 60, personality: 'normal', archetype: 'standard', ...extra };
}
function rel(bond) { return { bond, rivalry: 0 }; }

// 派閥1(勝者): リーダー1・2・3 / 派閥2(敗者): リーダー4・5・6。抗争中・勢い10・対立度 90/70・抗争ポイント 100—62
function victoryState(extra = {}) {
  const roster = [
    fighter(1, { pw: 80, trust: 50 }), fighter(2, { pw: 70, trust: 70 }), fighter(3, { trust: 80 }),
    fighter(4, { pw: 80, trust: 50 }), fighter(5, { pw: 70, trust: 40 }), fighter(6, { trust: 65 }),
  ];
  return {
    season: 3, week: 10, offSeason: false, offWeek: 0, rngSeed: 42, roster,
    relationships: { '2>1': rel(50), '3>1': rel(98), '5>4': rel(50), '1>2': rel(50) },
    factions: [
      { id: 1, name: '一派', leaderId: 1, memberIds: [1, 2, 3], status: 'active', type: 'rivalrous', momentum: 10, archetypeId: 'COMBAT', createdSeason: 1, createdWeek: 5 },
      { id: 2, name: '四派', leaderId: 4, memberIds: [4, 5, 6], status: 'active', type: 'rivalrous', momentum: 10, archetypeId: 'AUTHORITY', authoritativeTag: true, createdSeason: 1, createdWeek: 8 },
    ],
    factionHostility: { '1>2': 90, '2>1': 70 },
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: CFG.pointsResolutionThreshold, pointsB: 62, startedSeason: 2, startedWeek: 30, lastUpdatedSeason: 3, lastUpdatedWeek: 9, naturalCalmStreak: 0 } },
    factionEventCooldowns: {},
    factionTimeline: [],
    ...extra,
  };
}

console.log('派閥抗争の決着の効果(spec §5)回帰ガード');

section('§5.1/§5.2 先取100: 勝者・敗者の勢い・信頼・絆が入る(checkRivalryResolution の返り値の state)', () => {
  const s = victoryState();
  const r = F.checkRivalryResolution(s, null);
  assert.ok(r && r.resolved && r.reason === 'POINTS' && r.winnerFactionId === 1 && r.loserFactionId === 2, JSON.stringify(r && { ...r, state: undefined }));
  const o = r.state;
  assert.ok(o && o !== s, '新しい state が返っていない');
  // 勢い
  assert.strictEqual(momOf(o, 1), 10 + CFG.victoryWinnerMomentum, '勝者の勢い');
  assert.strictEqual(momOf(o, 2), 10 + CFG.victoryLoserMomentum, '敗者の勢い');
  // 信頼(Engine.trust の感度つき)
  for (const id of [1, 2, 3]) {
    const t0 = trustOf(s, id);
    assert.ok(close(trustOf(o, id), Math.min(100, t0 + CFG.victoryWinnerTrust * sens(t0))), `勝者 ${id} の信頼 ${t0}→${trustOf(o, id)}`);
  }
  assert.ok(close(trustOf(o, 4), 50 + CFG.victoryLoserLeaderTrust * sens(50)), `敗者リーダーの信頼 ${trustOf(o, 4)}`);
  for (const id of [5, 6]) {
    const t0 = trustOf(s, id);
    assert.ok(close(trustOf(o, id), t0 + CFG.victoryLoserMemberTrust * sens(t0)), `敗者末端 ${id} の信頼 ${t0}→${trustOf(o, id)}`);
  }
  // 絆: 勝者メンバー→リーダーだけ +5(上限100)。リーダー→メンバー・敗者は動かない
  assert.strictEqual(bondOf(o, 2, 1), 50 + CFG.victoryBondGainToLeader);
  assert.strictEqual(bondOf(o, 3, 1), 100);
  assert.strictEqual(bondOf(o, 1, 2), 50, 'リーダー→メンバーが動いた');
  assert.strictEqual(bondOf(o, 5, 4), 50, '敗者の絆が動いた');
  // 権威の失墜
  assert.strictEqual(o.factions.find(f => f.id === 2).authoritativeTag, false, '敗者の authoritativeTag が残っている');
});

section('§5.3 先取100: 両方向 hostility -40・記録の削除・F08/F09 のクールダウン・年表', () => {
  const s = victoryState();
  const o = F.checkRivalryResolution(s, null).state;
  assert.strictEqual(hostOf(o, 1, 2), 90 + CFG.victoryHostilityDecay);
  assert.strictEqual(hostOf(o, 2, 1), 70 + CFG.victoryHostilityDecay);
  assert.ok(!o.factionRivalryPoints['1-2'], '記録が残っている');
  const nowAbs = F._absWeek(o);
  assert.strictEqual(o.factionEventCooldowns[F._f08Key(1, 2)].lastTriggeredWeek, nowAbs);
  assert.strictEqual(o.factionEventCooldowns[F._f09Key(1, 2)].lastTriggeredWeek, nowAbs);
  const tl = o.factionTimeline[o.factionTimeline.length - 1];
  assert.deepStrictEqual(tl, { type: 'RIVALRY_CLOSED', season: 3, week: 10, winnerFactionId: 1, loserFactionId: 2, reason: 'POINTS' });
});

section('純関数: checkRivalryResolution / applyRivalryVictory は入力の state を書き換えない', () => {
  const s = victoryState();
  const before = clone(s);
  F.checkRivalryResolution(s, null);
  assert.deepStrictEqual(s, before, 'checkRivalryResolution が入力を書き換えた');
  F.applyRivalryVictory(s, 1, 2, 'POINTS', null);
  assert.deepStrictEqual(s, before, 'applyRivalryVictory が入力を書き換えた');
  // 自然沈静化の週の数え上げも返り値にだけ入る
  const calm = victoryState({ factionHostility: { '1>2': 5, '2>1': 5 } });
  calm.factionRivalryPoints['1-2'].pointsA = 30;
  const calmBefore = clone(calm);
  const r = F.checkRivalryResolution(calm, null);
  assert.deepStrictEqual(calm, calmBefore, '自然沈静化の週数で入力を書き換えた');
  assert.strictEqual(r.resolved, false);
  assert.strictEqual(r.state.factionRivalryPoints['1-2'].naturalCalmStreak, 1);
});

section('§5.4 CALM: 4週続けて沈静化で記録を閉じる・勝者敗者の効果なし・対立度据置', () => {
  let s = victoryState({ factionHostility: { '1>2': 5, '2>1': 5 } });
  s.factionRivalryPoints['1-2'].pointsA = 30;
  const start = clone(s);
  let r = null;
  for (let i = 0; i < CFG.pointsNaturalCalmWeeks; i++) {
    r = F.checkRivalryResolution(s, null);
    s = { ...r.state, week: r.state.week + 1 };
  }
  assert.strictEqual(r.reason, 'CALM', `${CFG.pointsNaturalCalmWeeks}週目に沈静化で閉じない: ${r.reason}`);
  const o = r.state;
  assert.ok(!o.factionRivalryPoints['1-2']);
  assert.strictEqual(o.factionTimeline[o.factionTimeline.length - 1].reason, 'CALM');
  assert.deepStrictEqual(o.factions.map(f => f.momentum), start.factions.map(f => f.momentum));
  assert.deepStrictEqual(o.roster.map(c => c.trust), start.roster.map(c => c.trust));
  assert.strictEqual(hostOf(o, 1, 2), 5);
  assert.ok(!o._factionAppealBoost && !o._factionDefectionBoost);
});

section('§5.4 CONSOLATION: 派閥消滅は勝者なし・残存側の hostility -40 だけ', () => {
  const s = victoryState();
  s.factionRivalryPoints['1-2'].pointsA = 40;
  s.factions = s.factions.filter(f => f.id !== 2);
  const r = F.checkRivalryResolution(s, null);
  assert.strictEqual(r.reason, 'CONSOLATION');
  assert.strictEqual(r.winnerFactionId, null);
  assert.strictEqual(hostOf(r.state, 1, 2), 90 + CFG.victoryHostilityDecay, '残存側の対立度が下がっていない');
  assert.strictEqual(momOf(r.state, 1), 10, '勝者の効果が付いた');
  assert.ok(!r.state.factionRivalryPoints['1-2']);
  assert.ok(!r.state._factionAppealBoost);
});

section('§5.1 勝者の顔役は 12週間、決着の時点の派閥抗争 appeal を持ち越す(対立度 -40 の後も派閥抗争マッチ)', () => {
  const s = victoryState({ factionHostility: { '1>2': 70, '2>1': 60 } }); // 平均65 → 段 Mid
  const o = F.checkRivalryResolution(s, null).state;
  // 決着後の対立度は 30/20(平均25 < 40)。持ち越しが無ければ派閥抗争マッチではない
  assert.ok((hostOf(o, 1, 2) + hostOf(o, 2, 1)) / 2 < 40);
  assert.strictEqual(F.isFactionFeudMatch(o, 1, 4), true, '勝者リーダー vs 敗者リーダーが派閥抗争マッチでない');
  assert.strictEqual(F.calcFactionFeudAppeal(o, 1, 4, {}), CFG.factionAppealMid, '持ち越しの額');
  // 顔役(リーダー・幹部)でなければ従来どおり対象外
  const noExec = clone(o);
  noExec.factions[0].memberIds.push(7, 8, 9); noExec.roster.push(fighter(7, { pw: 90 }), fighter(8, { pw: 90 }), fighter(9, { pw: 30 }));
  assert.strictEqual(F.isFactionFeudMatch(noExec, 9, 4), false, '末端まで派閥抗争マッチになった');
  // 12週後は切れる
  const at = (weeks) => { const t = clone(o); const abs = absOf(o) + weeks; t.season = Math.floor((abs - 1) / 52) + 1; t.week = abs - (t.season - 1) * 52; return t; };
  // 決着の週の翌週〜12週後の週まで効く
  assert.strictEqual(F.isFactionFeudMatch(at(1), 1, 4), true, '翌週に効いていない');
  assert.strictEqual(F.isFactionFeudMatch(at(CFG.victoryAppealBoostWeeks), 1, 4), true, '12週目に切れた');
  assert.strictEqual(F.isFactionFeudMatch(at(CFG.victoryAppealBoostWeeks + 1), 1, 4), false, '13週目も残っている');
  // 同じ番号で結成し直された派閥には効かない(派閥IDは使い回される)
  const remade = clone(o);
  remade.factions[0] = { ...remade.factions[0], createdSeason: 3, createdWeek: 11 };
  assert.strictEqual(F.isFactionFeudMatch(remade, 1, 4), false, '作り直された派閥に持ち越しが効いた');
  // 対立度 40 未満のまま先取100に届いた決着(忠誠型どうしなど)も、最初の段(factionAppealLow)を持ち越す
  const cold = F.checkRivalryResolution(victoryState({ factionHostility: { '1>2': 10, '2>1': 10 } }), null).state;
  assert.strictEqual(F.isFactionFeudMatch(cold, 1, 4), true, '対立度の低い決着の勝者に持ち越しが無い');
  assert.strictEqual(F.calcFactionFeudAppeal(cold, 1, 4, {}), CFG.factionAppealLow);
  // 決着前(持ち越しなし・対立度 10)は派閥抗争マッチではない
  assert.strictEqual(F.isFactionFeudMatch(victoryState({ factionHostility: { '1>2': 10, '2>1': 10 } }), 1, 4), false);
  // 集客の式(management.js)に入る: 持ち越し分がそのまま入る(feudSumCap と rivalry との排他は従来どおり)
  const A = o.roster.find(c => c.id === 1), B = o.roster.find(c => c.id === 4);
  const withCarry = Engine.attendanceV2.calcMatchAppeal(A, B, {}, o);
  const noCarry = Engine.attendanceV2.calcMatchAppeal(A, B, {}, { ...o, _factionAppealBoost: {} });
  assert.ok(close(withCarry - noCarry, CFG.factionAppealMid), `集客の差 ${withCarry - noCarry}`);
});

section('§5.2 敗者の寝返り(F04)・亀裂(F05)の確率 ×1.5 を 12週間(pickWeeklyEvent が読む)', () => {
  const o = F.checkRivalryResolution(victoryState(), null).state;
  assert.strictEqual(F._defectionProbMult(o, 2), CFG.victoryDefectionMult, '敗者の倍率');
  assert.strictEqual(F._defectionProbMult(o, 1), 1, '勝者に倍率が付いた');
  const w12 = clone(o); w12.week += CFG.victoryDefectionMultWeeks;
  assert.strictEqual(F._defectionProbMult(w12, 2), CFG.victoryDefectionMult, '12週目に倍率が切れた');
  const later = clone(o); later.week += CFG.victoryDefectionMultWeeks + 1;
  assert.strictEqual(F._defectionProbMult(later, 2), 1, '13週目も倍率が残る');

  // F05: 忠誠型の敗者(5人・リーダーへの絆の低い2人が互いに70)。乱数 0.5 は素の40%では外れ、×1.5 の60%では当たる
  const roster = [1, 2, 3, 4, 5, 6, 7, 8].map(id => fighter(id));
  const relationships = { '6>4': rel(20), '7>4': rel(20), '6>7': rel(70), '7>6': rel(70) };
  const loyal = {
    season: 3, week: 10, offSeason: false, offWeek: 0, rngSeed: 42, roster, relationships,
    factions: [
      { id: 1, name: '一派', leaderId: 1, memberIds: [1, 2, 3], status: 'active', type: 'loyal', momentum: 0, createdSeason: 1, createdWeek: 5 },
      { id: 2, name: '四派', leaderId: 4, memberIds: [4, 5, 6, 7, 8], status: 'active', type: 'loyal', momentum: 0, createdSeason: 1, createdWeek: 8 },
    ],
    factionHostility: {},
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: 100, pointsB: 10, startedSeason: 3, startedWeek: 1, lastUpdatedSeason: 3, lastUpdatedWeek: 9, naturalCalmStreak: 0 } },
    factionEventCooldowns: { F01_rejected_until: 99999 }, factionTimeline: [],
  };
  const afterWin = F.checkRivalryResolution(loyal, null).state;
  const withFloat = (v, fn) => { const orig = Engine.rng.float; Engine.rng.float = () => v; try { return fn(); } finally { Engine.rng.float = orig; } };
  assert.ok(F.checkF05Conditions(loyal).eligible && F.checkF05Conditions(afterWin).eligible, '前提: F05 の条件');
  assert.notStrictEqual(withFloat(0.5, () => F.pickWeeklyEvent(loyal, Engine.rng.create(1))).eventId, 'F05', '決着前に 0.5 で F05 が出た');
  assert.strictEqual(withFloat(0.5, () => F.pickWeeklyEvent(afterWin, Engine.rng.create(1))).eventId, 'F05', '敗者の F05 が ×1.5 になっていない');
  const late = clone(afterWin); late.week += CFG.victoryDefectionMultWeeks + 1;
  assert.notStrictEqual(withFloat(0.5, () => F.pickWeeklyEvent(late, Engine.rng.create(1))).eventId, 'F05', '13週目も F05 が ×1.5');

  // F04: 敗者(2)の末端6が第三の派閥(3)へ寝返る候補。乱数 0.4 は素の30%では外れ、×1.5 の45%では当たる
  const r3 = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(id => fighter(id));
  const three = {
    season: 3, week: 10, offSeason: false, offWeek: 0, rngSeed: 42, roster: r3,
    relationships: { '6>4': rel(20), '6>7': rel(80), '6>8': rel(80), '6>9': rel(80) },
    factions: [
      { id: 1, name: '一派', leaderId: 1, memberIds: [1, 2, 3], status: 'active', type: 'rivalrous', momentum: 0, createdSeason: 1, createdWeek: 5 },
      { id: 2, name: '四派', leaderId: 4, memberIds: [4, 5, 6], status: 'active', type: 'rivalrous', momentum: 0, createdSeason: 1, createdWeek: 8 },
      { id: 3, name: '七派', leaderId: 7, memberIds: [7, 8, 9], status: 'active', type: 'rivalrous', momentum: 0, createdSeason: 2, createdWeek: 1 },
    ],
    factionHostility: { '1>2': 60, '2>1': 60, '2>3': 60, '3>2': 60 },
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: 100, pointsB: 10, startedSeason: 3, startedWeek: 1, lastUpdatedSeason: 3, lastUpdatedWeek: 9, naturalCalmStreak: 0 } },
    factionEventCooldowns: { F01_rejected_until: 99999 }, factionTimeline: [],
  };
  const afterWin3 = F.checkRivalryResolution(three, null).state;
  const f04 = F.checkF04Conditions(afterWin3);
  assert.ok(f04.eligible && f04.fromFactionId === 2 && f04.toFactionId === 3, `前提: F04 の候補 ${JSON.stringify(f04)}`);
  assert.notStrictEqual(withFloat(0.4, () => F.pickWeeklyEvent(three, Engine.rng.create(1))).eventId, 'F04', '決着前に 0.4 で F04 が出た');
  assert.strictEqual(withFloat(0.4, () => F.pickWeeklyEvent(afterWin3, Engine.rng.create(1))).eventId, 'F04', '敗者からの F04 が ×1.5 になっていない');
});

section('tickWeek: 先取100の週に決着の効果が返り値の G に入り、入力の G は書き換わらない', () => {
  const base = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 6 && g.weekPhase === 'manage' && !g.offSeason });
  const ids = base.roster.filter(c => !c.isRental).slice(0, 6).map(c => c.id);
  assert.strictEqual(ids.length, 6);
  const syn = victoryState();
  const map = new Map([1, 2, 3, 4, 5, 6].map((k, i) => [k, ids[i]]));
  const factions = syn.factions.map(f => ({ ...f, leaderId: map.get(f.leaderId), memberIds: f.memberIds.map(x => map.get(x)) }));
  let G = {
    ...base,
    factions,
    factionHostility: { '1>2': 90, '2>1': 70 },
    factionRivalryPoints: { '1-2': { ...syn.factionRivalryPoints['1-2'], startedSeason: 2, startedWeek: 1 } },
    factionEventCooldowns: {},
    factionTimeline: [],
  };
  delete G._pendingFactionEvent;
  delete G._pendingF09;
  const before = clone(G);
  const origPick = F.pickWeeklyEvent;
  const origMembers = F.processWeeklyMemberChanges;
  F.pickWeeklyEvent = () => ({ eventId: null });
  F.processWeeklyMemberChanges = (st) => st;
  let out;
  try { out = Engine.tickWeek(G).state; } finally {
    F.pickWeeklyEvent = origPick;
    F.processWeeklyMemberChanges = origMembers;
  }
  assert.deepStrictEqual(G.factionRivalryPoints, before.factionRivalryPoints, '入力の G の記録が書き換わった');
  assert.ok(!out.factionRivalryPoints['1-2'], '記録が閉じていない');
  const tl = out.factionTimeline.filter(e => e.type === 'RIVALRY_CLOSED');
  assert.ok(tl.length === 1 && tl[0].reason === 'POINTS' && tl[0].winnerFactionId === 1, JSON.stringify(tl));
  // 勢いは週の減衰(1)を挟むので、±40/−25 の大きさで入っていることを見る
  assert.ok(momOf(out, 1) >= 10 + CFG.victoryWinnerMomentum - 2, `勝者の勢い ${momOf(out, 1)}`);
  assert.ok(momOf(out, 2) <= 10 + CFG.victoryLoserMomentum + 2, `敗者の勢い ${momOf(out, 2)}`);
  // 対立度は週の減衰の後に -40 が入る
  assert.ok(hostOf(out, 1, 2) <= 90 + CFG.victoryHostilityDecay, `勝者→敗者の対立度 ${hostOf(out, 1, 2)}`);
  assert.ok(out._factionAppealBoost && out._factionAppealBoost[1] && out._factionDefectionBoost && out._factionDefectionBoost[2]);
  const mgmt = readSource('src', 'management.js');
  assert.ok(/const resolution = Engine\.factions\.checkRivalryResolution\(s, resRng\);[\s\S]{0,400}if \(resolution && resolution\.state\) s = resolution\.state;/.test(mgmt), 'tickWeek が返り値の state を使っていない');
});

if (failed > 0) {
  console.log(`\n${failed} 件 FAIL`);
  process.exit(1);
}
console.log('\nfaction-rivalry-victory-effects-test: ALL PASS');
