// common1-booking-test.js
//
// task-79: Common-1（派閥内対決）を「即時試合」から「興行予約」へ変更した安全網。
// 守りたいのは次の4つ。
//
//  (1) A選択が bookedCommon1 を作るだけで、即時試合フラグ(pendingMatch)を返さないこと
//  (2) 二重予約を防ぐこと（予約が残っている間は新しい Common-1 が選ばれない）
//  (3) 予約の有効性判定（在籍/怪我/レンタル/forcedRest）と1シーズン(48週)の自然消滅
//  (4) カード中から予約ペアを枠に関係なく検出できること、他の予約試合との重複を検出できること

'use strict';
const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ factions: true });

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== Common-1: 興行予約化(task-79) ===\n');

function makeFighter(id, overrides = {}) {
  return Object.assign({
    id, name: `F${id}`, orgId: 'player',
    pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    style: 'Allround', personality: 'normal', archetype: 'normal',
    injury: null, isRental: false, forcedRest: false, age: 22,
    popularity: 40, condition: 80, trust: 60,
  }, overrides);
}

function makeState(overrides = {}) {
  const roster = [1, 2, 3].map(id => makeFighter(id));
  const relationships = {};
  for (const a of [1, 2, 3]) {
    for (const b of [1, 2, 3]) {
      if (a === b) continue;
      relationships[`${a}>${b}`] = { bond: 70, rivalry: 0 };
    }
  }
  relationships['2>3'] = { bond: 55, rivalry: 60 };
  relationships['3>2'] = { bond: 55, rivalry: 60 };

  return Object.assign({
    season: 2, week: 10, offSeason: false, rngSeed: 12345,
    roster, relationships,
    factions: [{
      id: 1, name: 'テスト組', leaderId: 1, memberIds: [1, 2, 3],
      flavor: 'bond_first', archetypeId: 'BOND', type: 'loyal', status: 'active',
      momentum: 50, inHostility: false,
      authoritativeTag: false, dictatorTag: false,
      createdWeek: 1, formedAbsWeek: 1,
      hostilityTo: {},
    }],
    factionEventCooldowns: {}, factionHostility: {},
    factionReconciliationStreak: {}, factionEndlessStreak: {},
    f02MediationWatches: [],
    lockerRoomMorale: 60,
  }, overrides);
}

const rng = () => Engine.rng.create(1);

const payload = {
  factionId: 1, factionName: 'テスト組', archetypeId: 'BOND', leaderId: 1,
  fighterAId: 2, fighterAName: 'F2', fighterBId: 3, fighterBName: 'F3',
  currentRivalry: 60,
};

// ─────────────────────────────────────────────────────────────
// (1) A選択 = 予約作成、即時試合フラグなし
// ─────────────────────────────────────────────────────────────

section('1-a. A選択は bookedCommon1 を作り、pendingMatchは返さない', () => {
  const s = makeState();
  const r = Engine.factions.applyCommon1Choice(s, payload, 'A', rng());
  assert.strictEqual(r.pendingMatch, undefined, '旧・即時試合フラグ(pendingMatch)がまだ返っている');
  assert.strictEqual(r.booked, true, 'booked:true が返っていない');
  assert.ok(r.state.bookedCommon1, 'bookedCommon1が作られていない');
  assert.strictEqual(r.state.bookedCommon1.fighterAId, 2);
  assert.strictEqual(r.state.bookedCommon1.fighterBId, 3);
  assert.strictEqual(r.state.bookedCommon1.factionId, 1);
  assert.strictEqual(r.state.bookedCommon1.createdSeason, 2);
  assert.strictEqual(r.state.bookedCommon1.createdWeek, 10);
});

section('1-b. B/C選択は従来通り即時に結果を返し、予約は作らない', () => {
  const s = makeState();
  const rB = Engine.factions.applyCommon1Choice(s, payload, 'B', rng());
  assert.ok(!rB.state.bookedCommon1, 'B選択なのに予約が作られた');
  assert.ok(rB.resultText, 'B選択の結果文が空');
  const rC = Engine.factions.applyCommon1Choice(s, payload, 'C', rng());
  assert.ok(!rC.state.bookedCommon1, 'C選択なのに予約が作られた');
});

// ─────────────────────────────────────────────────────────────
// (2) 二重予約防止
// ─────────────────────────────────────────────────────────────

section('2-a. bookedCommon1がある間は checkCommon1Conditions が ineligible', () => {
  const s = makeState({ bookedCommon1: { fighterAId: 2, fighterBId: 3, factionId: 1, createdSeason: 2, createdWeek: 10 } });
  const r = Engine.factions.checkCommon1Conditions(s, rng());
  assert.strictEqual(r.eligible, false, '予約が残っているのに新しい Common-1 が選ばれた（二重予約）');
});

// ─────────────────────────────────────────────────────────────
// (3) 予約の有効性・期限
// ─────────────────────────────────────────────────────────────

function bookedState(bOverrides = {}) {
  return makeState({
    bookedCommon1: Object.assign({
      fighterAId: 2, fighterBId: 3, factionId: 1, factionName: 'テスト組',
      archetypeId: 'BOND', leaderId: 1, createdSeason: 2, createdWeek: 10,
      createdAbsWeek: Engine.util.absWeekTotal(2, 10, false, 0),
    }, bOverrides),
  });
}

section('3-a. 在籍・健康な予約は有効', () => {
  const s = bookedState();
  assert.strictEqual(Engine.factions.isBookedCommon1Valid(s), true);
  assert.strictEqual(Engine.factions.isBookedCommon1Expired(s), false);
  assert.strictEqual(Engine.factions.sweepBookedCommon1(s).bookedCommon1, s.bookedCommon1, '有効な予約がスイープで消えた');
});

section('3-b. 退団済み(ロスター不在)の予約は静かに無効', () => {
  const s = bookedState({ fighterBId: 999 });
  assert.strictEqual(Engine.factions.isBookedCommon1Valid(s), false);
  const swept = Engine.factions.sweepBookedCommon1(s);
  assert.ok(!swept.bookedCommon1, '退団済みの予約が残った');
});

section('3-c. 負傷中の当事者がいると予約は静かに無効', () => {
  const s = bookedState();
  s.roster = s.roster.map(c => c.id === 3 ? Object.assign({}, c, { injury: { weeks: 2 } }) : c);
  assert.strictEqual(Engine.factions.isBookedCommon1Valid(s), false, '負傷中なのに有効と判定された');
  const swept = Engine.factions.sweepBookedCommon1(s);
  assert.ok(!swept.bookedCommon1, '負傷中の予約が残った');
});

section('3-d. レンタル中/forcedRest中の当事者がいると予約は静かに無効', () => {
  const sRental = bookedState();
  sRental.roster = sRental.roster.map(c => c.id === 2 ? Object.assign({}, c, { isRental: true }) : c);
  assert.strictEqual(Engine.factions.isBookedCommon1Valid(sRental), false, 'レンタル中なのに有効と判定された');

  const sRest = bookedState();
  sRest.roster = sRest.roster.map(c => c.id === 2 ? Object.assign({}, c, { forcedRest: true }) : c);
  assert.strictEqual(Engine.factions.isBookedCommon1Valid(sRest), false, 'forcedRest中なのに有効と判定された');
});

section('3-e. 1シーズン(48週)未満は期限内、48週以降は期限切れ', () => {
  const createdAbs = Engine.util.absWeekTotal(1, 1, false, 0);
  const notExpired = bookedState({ createdAbsWeek: createdAbs });
  notExpired.season = 1; notExpired.week = 1;
  // 47週後(まだ期限内)
  const nearlyExpired = Object.assign({}, notExpired, { week: 1, season: 1 });
  nearlyExpired.week = 48; // 47週経過
  assert.strictEqual(Engine.factions.isBookedCommon1Expired(nearlyExpired), false, '47週経過で期限切れ扱いになった(早すぎる)');

  const expired = Object.assign({}, notExpired);
  expired.season = 2; expired.week = 1; // 48週経過
  assert.strictEqual(Engine.factions.isBookedCommon1Expired(expired), true, '48週経過しても期限切れにならない');
  const swept = Engine.factions.sweepBookedCommon1(expired);
  assert.ok(!swept.bookedCommon1, '期限切れの予約がスイープで残った');
});

// ─────────────────────────────────────────────────────────────
// (4) カード検出・他予約との重複
// ─────────────────────────────────────────────────────────────

section('4-a. findBookedCommon1CardIndex は枠(位置)を問わず予約ペアを検出する', () => {
  const s = bookedState();
  const validMatches = [
    { left: 1, right: 99, matchType: 'single' }, // メイン: 無関係
    { left: 3, right: 2, matchType: 'single' },  // セミ: 予約ペア(順序逆)
  ];
  const idx = Engine.factions.findBookedCommon1CardIndex(s, validMatches);
  assert.strictEqual(idx, 1, '順序が逆(B vs A)のペアを検出できていない、または枠位置に依存している');
});

section('4-b. findBookedCommon1CardIndex はタッグ枠を対象にしない', () => {
  const s = bookedState();
  const validMatches = [
    { matchType: 'tag', teamA: { fighter1: 2, fighter2: 9 }, teamB: { fighter1: 3, fighter2: 8 } },
  ];
  const idx = Engine.factions.findBookedCommon1CardIndex(s, validMatches);
  assert.strictEqual(idx, -1, 'タッグ枠を誤ってCommon-1として検出した');
});

section('4-c. hasCompetingBooking は他の予約試合(CH/B3/F09/派閥内序列戦/奪還戦)を検出する', () => {
  const flags = ['_crMatchLocked', 'isCRMatch', '_f09Locked', '_internalChallengeLocked', 'isReclaim'];
  flags.forEach(flag => {
    const validMatches = [{ left: 10, right: 20, matchType: 'single', [flag]: true }];
    assert.strictEqual(Engine.factions.hasCompetingBooking(validMatches), true, `${flag} が競合として検出されない`);
  });
  assert.strictEqual(Engine.factions.hasCompetingBooking([{ left: 1, right: 2, matchType: 'single' }]), false, '無関係な試合が競合と誤判定された');
});

// ─────────────────────────────────────────────────────────────
// (5) 派閥解散命令との連動
// ─────────────────────────────────────────────────────────────

section('5-a. 派閥解散命令は進行中の Common-1 予約も畳む', () => {
  const s = bookedState();
  const { state: out } = Engine.factions.dissolveAllByDecree(s, { seal: false });
  assert.ok(!out.bookedCommon1, '解散命令後も bookedCommon1 が残っている');
});

console.log('');
if (failed > 0) {
  console.log(`${failed} 件失敗`);
  process.exit(1);
} else {
  console.log('全件PASS');
}
