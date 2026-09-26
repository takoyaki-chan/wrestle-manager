#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage2-test.js — K-1「興行後の処理を一本化する」第2段(表示・記録だけの差を統一する)の回帰ガード
//  (2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-E08 因縁決着エントリ: Engine.show.resolvedRivalryEntry。lastShowNumber(何番目の興行か)と
//       宿怨の決着の勝者 bitterResolutionWinnerId の両方を持つ
//    2. K1-A06 対戦成績: Engine.show.recordShowH2h(印は Engine.show.buildMatchMeta)。シングルの履歴に
//       元同僚の初対面・派閥抗争中・ロッカー荒廃中・奪還戦の印を刻み、元同僚の初対面は業界ニュースに積む
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

// ── 2. K1-A06 対戦成績の履歴の印と元同僚の初対面の記事 ──
function h2hState() {
  const tl = (org, fs, fw, ts, tw) => ({ orgId: org, fromSeason: fs, fromWeek: fw, ...(ts ? { toSeason: ts, toWeek: tw } : {}) });
  return {
    season: 2, week: 14, h2h: {},
    roster: [
      // 1 と 2: 元は同じ他団体(org_a)にいて、別々の時期に自団体へ来た(離脱後の初対面)
      { id: 1, name: '選手1', orgTimeline: [tl('org_a', 1, 1, 2, 5), tl('player', 2, 5)] },
      { id: 2, name: '選手2', orgTimeline: [tl('org_a', 1, 1, 2, 10), tl('player', 2, 10)] },
      { id: 3, name: '選手3', orgTimeline: [tl('player', 1, 1)] },
      { id: 4, name: '選手4', orgTimeline: [tl('player', 1, 1)] },
      { id: 5, name: '選手5', orgTimeline: [tl('player', 1, 1)] },
      { id: 6, name: '選手6', orgTimeline: [tl('player', 1, 1)] },
    ],
    factions: [{ id: 1, memberIds: [3], inHostility: true }, { id: 2, memberIds: [4], inHostility: false }],
    _lockerCrisisWeek: Engine.util.absWeek(2, 14) - 2,
  };
}

section('A06: 履歴の印(元同僚の初対面・派閥抗争中・ロッカー荒廃中・奪還戦)', () => {
  assert.ok(typeof Engine.show.buildMatchMeta === 'function', 'Engine.show.buildMatchMeta が無い');
  const s = h2hState();
  assert.deepStrictEqual(Engine.show.buildMatchMeta(s, 1, 2, false), { betrayal: true, lockerStress: true });
  assert.deepStrictEqual(Engine.show.buildMatchMeta(s, 3, 4, true), { factionWar: true, lockerStress: true, reclaim: true });
  const calm = { ...s, _lockerCrisisWeek: Engine.util.absWeek(2, 14) - 5 };
  assert.deepStrictEqual(Engine.show.buildMatchMeta(calm, 5, 6, false), {}, '荒廃から5週たてば印なし');
});

section('A06: 通常興行の対戦成績 — シングルは印つき・元同僚の初対面は記事・タッグは対角4組・直訴は飛ばす', () => {
  assert.ok(typeof Engine.show.recordShowH2h === 'function', 'Engine.show.recordShowH2h が無い');
  const s = h2hState();
  const before = JSON.stringify(s);
  const validMatches = [
    { left: 1, right: 2 },
    { left: 3, right: 4, isTitle: true },
    { matchType: 'tag', teamA: { fighter1: 3, fighter2: 5 }, teamB: { fighter1: 4, fighter2: 6 } },
    { left: 5, right: 6, isCRMatch: true },
  ];
  const results = [
    { winner: 'left', mq: 60 },
    { winner: 'right', mq: 70, isTitleMatch: true },
    { matchType: 'tag', winner: 'teamB', mq: 50 },
    { winner: 'left', mq: 40 },
  ];
  const out = Engine.show.recordShowH2h(s, validMatches, results);
  assert.strictEqual(JSON.stringify(s), before, '入力の状態を書き換えた');
  const last = key => { const h = out.h2h[key].history; return h[h.length - 1]; };
  assert.strictEqual(last('1>2').bt, 1, '元同僚の初対面の印');
  assert.strictEqual(last('1>2').lc, 1, 'ロッカー荒廃中の印');
  assert.strictEqual(out.h2h['3>4'].history[0].fc, 1, '派閥抗争中の印');
  assert.strictEqual(out.h2h['3>4'].history[0].t, 1, '王座戦の印');
  // タッグ: 対角4組(3-4, 3-6, 5-4, 5-6)。勝ったのは teamB(4・6)。印は付けない
  assert.strictEqual(out.h2h['3>4'].matches, 2, 'シングル+タッグで2戦');
  assert.strictEqual(out.h2h['3>6'].winsB, 1);
  assert.strictEqual(out.h2h['4>5'].winsA, 1);
  assert.strictEqual(last('3>6').fc, undefined, 'タッグには印を付けない');
  // 直訴試合(5-6 のシングル)は記録しない(5-6 はタッグの1戦だけ)
  assert.strictEqual(out.h2h['5>6'].matches, 1, '直訴試合を二重に記録した');
  // 元同僚の初対面の記事は1本
  const news = (out._industryNewsEvents || []).filter(e => e.type === 'firstMeetSinceDeparture');
  assert.strictEqual(news.length, 1);
  assert.deepStrictEqual(news[0].data, { nameA: '選手1', nameB: '選手2' });
  // 同じ組の2度目の対戦(離脱後にもう会っている)は初対面ではない
  const again = Engine.show.recordShowH2h({ ...out, _industryNewsEvents: [] }, [validMatches[0]], [results[0]]);
  assert.strictEqual(again.h2h['1>2'].history[1].bt, undefined);
  assert.strictEqual((again._industryNewsEvents || []).length, 0);
});

section('A06: 両経路が Engine.show.recordShowH2h を呼ぶ(App._buildMatchMeta は無い)', () => {
  const fin = finalizeBody();
  const exe = executeShowBody();
  assert.ok(fin.includes('s = Engine.show.recordShowH2h(s, validMatches, results);'), 'app.js が共通の関数を呼んでいない');
  assert.ok(exe.includes('s = Engine.show.recordShowH2h({ ...s, roster }, validMatches, results);'), 'management.js が共通の関数を呼んでいない');
  // B3(単発の挑戦状)の専用の記録(Engine.h2h.update(s.h2h || {}, b3.fighterId, …))は別枠なので残ってよい
  assert.ok(!/h2h = Engine\.h2h\.update\(h2h, (m\.left|aId)/.test(fin), 'app.js の通常興行に自前の h2h 記録が残っている');
  assert.ok(!exe.includes('Engine.h2h.update('), 'management.js の executeShow に自前の h2h 記録が残っている');
  const app = readSource('src', 'app.js');
  assert.ok(!app.includes('_buildMatchMeta('), 'App._buildMatchMeta が残っている(対抗戦・PPV も Engine.show.buildMatchMeta を使う)');
  assert.ok(app.includes('Engine.show.buildMatchMeta(G, r.playerFighter.id, r.aiFighter.id, false)'), '対抗戦の印');
  assert.ok(app.includes('Engine.show.buildMatchMeta(s, match.left.id, match.right.id, false)'), 'PPV の印');
});

// ── 3. K1-T01 奪還挑戦の予約の欄 ──
section('T01: 進行の修復は、奪還挑戦の予約が無い状態に null の欄を作らない', () => {
  const base = { season: 2, week: 14, weekPhase: 'manage', roster: [{ id: 1 }], showCard: [], coachAssign: {} };
  const none = Engine.saveDoctor.repairProgressionState(base).state;
  assert.ok(!Object.prototype.hasOwnProperty.call(none, '_pendingReclaim'), '予約が無いのに _pendingReclaim の欄ができた');
  const kept = Engine.saveDoctor.repairProgressionState({ ...base, _pendingReclaim: null }).state;
  assert.strictEqual(kept._pendingReclaim, null, 'もとから null の欄は null のまま');
  const valid = Engine.saveDoctor.repairProgressionState({ ...base, _pendingReclaim: { titleType: 'world', challengerId: 1 } }).state;
  assert.deepStrictEqual(valid._pendingReclaim, { titleType: 'world', challengerId: 1 }, '有効な予約は残す');
  const stale = Engine.saveDoctor.repairProgressionState({ ...base, _pendingReclaim: { titleType: 'world', challengerId: 99 } });
  assert.strictEqual(stale.state._pendingReclaim, null, '居ない挑戦者の予約は null にする(従来どおり)');
  assert.ok(stale.changes.includes('pendingReclaim_stale_ref_removed'));
});

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
