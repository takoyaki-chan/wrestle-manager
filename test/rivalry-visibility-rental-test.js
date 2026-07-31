'use strict';

// task-63: 他団体の因縁を「見えるように」する + レンタル選手を因縁の経路だけ開ける
//
// 検証項目(指示書「テスト」節):
//  1. 週次ドラマの因縁系イベントでレンタルが対象に入ること
//  2. 絆系・派閥系・退団系では従来どおり除外されること
//  3. レンタル絡みの倍率が src/data.js にあり直書きされていないこと
//  4. 通知候補に他団体の相手が入ること、かつ自団体の選手が必ず一方に居ること
//  5. 通知の頻度上限が効くこと

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

function makeFighter(id, overrides) {
  return Object.assign({
    id, name: `F${id}`, personality: 'normal', archetype: 'normal',
    age: 22, style: 'Allround', condition: 70, trust: 50, injury: null,
  }, overrides || {});
}

function baseState(overrides) {
  return Object.assign({
    season: 3, week: 10, rngSeed: 777,
    roster: [],
    aiOrgs: {},
    relationships: {},
    rivalries: {},
    orgPop: 40,
    lockerRoomMorale: 60,
    lastShowResults: [],
  }, overrides || {});
}

// ══════════════════════════════════════════════════════════
// 1. 因縁系イベント: レンタル選手が対象に入ること
// ══════════════════════════════════════════════════════════
(function testRentalRivalryEscalationFires() {
  const nonRental = makeFighter(1, { name: 'Nonrental' });
  const rental = makeFighter(2, { name: 'Rental', isRental: true });

  let fired = false;
  let firedAwakening = false;

  for (let week = 1; week <= 400 && (!fired || !firedAwakening); week++) {
    const state = baseState({
      week: 1 + (week % 40), season: 1 + Math.floor(week / 40),
      roster: [
        { ...nonRental },
        { ...rental },
      ],
      relationships: {
        // 一方的な敵意条件: 1>2 rivalry>=50 & bond<=30, 2>1 rivalry<20
        '1>2': { bond: 20, rivalry: 55 },
        '2>1': { bond: 50, rivalry: 5 },
      },
    });
    const dummyRng = Engine.rng.create(week);
    const result = Engine.relationships.processWeeklyStoryEvents(state, dummyRng);
    if ((result.state.relationships['2>1'].rivalry || 0) > 5.01) fired = true;

    // 覚醒条件も別途探索: 2>1側のbondを60+にして 1>2 が覚醒対象になるケース
    const state2 = baseState({
      week: 1 + (week % 40), season: 1 + Math.floor(week / 40),
      roster: [
        { ...nonRental },
        { ...rental },
      ],
      relationships: {
        '1>2': { bond: 20, rivalry: 55 },
        '2>1': { bond: 65, rivalry: 5 },
      },
    });
    const result2 = Engine.relationships.processWeeklyStoryEvents(state2, dummyRng);
    if ((result2.state.relationships['2>1'].rivalry || 0) - 5 >= 14) firedAwakening = true;
  }

  assert.ok(fired, 'レンタルが絡む「一方的な敵意」escalationロールが400試行で一度も発火しなかった');
  assert.ok(firedAwakening, 'レンタルが絡む「クロス非対称 覚醒」イベントが400試行で一度も発火しなかった');
})();

// ══════════════════════════════════════════════════════════
// 2. 絆系イベント: レンタル選手は従来どおり除外されること
// ══════════════════════════════════════════════════════════
(function testBondZoneStillExcludesRental() {
  const nonRental = makeFighter(1, { name: 'Nonrental', condition: 50 });
  const rental = makeFighter(2, { name: 'Rental', isRental: true, condition: 50 });

  // 親友ゾーン条件(双方向 bond70+, rivalry<40) + 両者今週出場 → 本来なら条件回復するはずだが
  // レンタルはactiveRosterから除外されているのでペア自体がループに入らない
  const state = baseState({
    roster: [nonRental, rental],
    relationships: {
      '1>2': { bond: 80, rivalry: 10 },
      '2>1': { bond: 80, rivalry: 10 },
    },
    lastShowResults: [
      { left: { id: 1 }, right: { id: 2 }, winner: 'left', matchType: 'single' },
    ],
  });
  const rng = Engine.rng.create(12345);
  const result = Engine.relationships.processWeeklyStoryEvents(state, rng);
  const rentalAfter = result.state.roster.find(f => f.id === 2);
  assert.strictEqual(rentalAfter.condition, 50, '親友ゾーン(絆系)のcondition回復がレンタル選手に適用されてしまっている');
})();

// ══════════════════════════════════════════════════════════
// 3. 倍率が data.js の新規定数であり、直書きされていないこと
// ══════════════════════════════════════════════════════════
(function testMultiplierIsDataJsConstant() {
  assert.strictEqual(typeof RENTAL_RIVALRY_CONFIG, 'object', 'RENTAL_RIVALRY_CONFIG が data.js のグローバル定数として存在しない');
  assert.strictEqual(typeof RENTAL_RIVALRY_CONFIG.probMult, 'number');
  assert.strictEqual(typeof RENTAL_RIVALRY_CONFIG.magnitudeMult, 'number');
  assert.ok(RENTAL_RIVALRY_CONFIG.probMult >= 1.0 && RENTAL_RIVALRY_CONFIG.probMult <= 2.0,
    `probMult(${RENTAL_RIVALRY_CONFIG.probMult}) が想定レンジ外`);
  assert.ok(RENTAL_RIVALRY_CONFIG.magnitudeMult >= 1.0 && RENTAL_RIVALRY_CONFIG.magnitudeMult <= 2.0,
    `magnitudeMult(${RENTAL_RIVALRY_CONFIG.magnitudeMult}) が想定レンジ外`);

  const dataSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'data.js'), 'utf8');
  assert.ok(/const RENTAL_RIVALRY_CONFIG\s*=\s*\{/.test(dataSrc), 'RENTAL_RIVALRY_CONFIG が data.js にトップレベル定数として定義されていない');

  const relSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'relationships.js'), 'utf8');
  assert.ok(relSrc.includes('RENTAL_RIVALRY_CONFIG'), 'relationships.js が RENTAL_RIVALRY_CONFIG を参照していない(直書きの疑い)');
  // 直書きの疑いがある典型パターン(0.035*1.4 のような固定倍率のハードコード)が無いことを確認
  assert.ok(!/0\.035\s*\*\s*1\.4/.test(relSrc), 'rivalry escalation の確率が定数を介さず直書きされている');
  assert.ok(!/0\.015\s*\*\s*1\.4/.test(relSrc), '覚醒イベントの確率が定数を介さず直書きされている');
})();

// ══════════════════════════════════════════════════════════
// 4. 通知候補: 他団体の相手が入ること + 自団体の選手が必ず一方に居ること
// ══════════════════════════════════════════════════════════
(function testCrossOrgCandidateVisible() {
  const playerFighter = makeFighter(101, { name: 'PlayerAce' });
  const aiFighter = makeFighter(201, { name: 'RivalOrgAce' });

  playerFighter._relationshipFlags = { R4: aiFighter.id };

  const state = baseState({
    roster: [playerFighter],
    aiOrgs: { rivalOrg1: { roster: [aiFighter] } },
    relationships: {
      '101>201': { bond: 30, rivalry: 60 },
      '201>101': { bond: 30, rivalry: 55 },
    },
  });

  // crossOrg判定そのものの直接確認
  assert.strictEqual(Engine.snapshot._isCrossOrg(state, aiFighter.id), true,
    '他団体所属キャラが crossOrg=true と判定されない');
  assert.strictEqual(Engine.snapshot._isCrossOrg(state, playerFighter.id), false,
    '自団体所属キャラが誤って crossOrg=true と判定される');

  // R4候補が(確率的なので複数seedを試して)実際に生成され、自団体選手が主体・他団体選手が相手であること
  let found = null;
  for (let seed = 1; seed <= 200 && !found; seed++) {
    const rng = Engine.rng.create(seed);
    const candidates = Engine.snapshot._collectCandidates(rng, state);
    found = candidates.find(c => c.source === 'R4');
  }
  assert.ok(found, 'R4候補(rivalry40+相手との勝敗)が200試行で一度も生成されなかった');
  assert.strictEqual(found.fighterId, playerFighter.id, '通知の主体が自団体選手になっていない');
  assert.strictEqual(found.fighter2Id, aiFighter.id, '通知の相手が他団体選手になっていない');
  assert.strictEqual(found.crossOrg, true, 'crossOrgフラグが立っていない');

  // 名前解決: state.rosterに居ない他団体キャラでも "???" にならないこと
  const rngForText = Engine.rng.create(99);
  let resolvedName = false;
  for (let i = 0; i < 50; i++) {
    const candidate = { source: 'R4', fighterId: playerFighter.id, fighter2Id: aiFighter.id, type: 'slot', crossOrg: true };
    const built = Engine.snapshot._buildSnapshotText(rngForText, candidate, state);
    assert.ok(!built.text.includes('{name2}'), `name2テンプレートが未展開のまま出力されている: ${built.text}`);
    if (built.text.includes(aiFighter.name)) resolvedName = true;
    assert.ok(!built.text.includes('???'), `他団体の相手名が解決できず "???" になっている: ${built.text}`);
  }
  assert.ok(resolvedName, `50回中一度も他団体の相手名(${aiFighter.name})が本文に現れなかった`);
})();

// 自団体同士(同団体)の場合はcrossOrg=falseのままであること(回帰確認)
(function testSameOrgStaysNonCrossOrg() {
  const a = makeFighter(301, { name: 'Ace' });
  const b = makeFighter(302, { name: 'Mate' });
  a._relationshipFlags = { R5: b.id };
  const state = baseState({
    roster: [a, b],
    relationships: { '301>302': { bond: 30, rivalry: 45 }, '302>301': { bond: 30, rivalry: 50 } },
  });
  let found = null;
  for (let seed = 1; seed <= 200 && !found; seed++) {
    const rng = Engine.rng.create(seed);
    const candidates = Engine.snapshot._collectCandidates(rng, state);
    found = candidates.find(c => c.source === 'R5');
  }
  assert.ok(found, 'R5候補(同団体)が200試行で一度も生成されなかった');
  assert.strictEqual(found.crossOrg, false, '同団体ペアなのに crossOrg=true と判定されている');
})();

// ══════════════════════════════════════════════════════════
// 5. 通知の頻度上限(クールダウン)が効くこと
// ══════════════════════════════════════════════════════════
(function testCrossOrgCooldownIsLonger() {
  assert.strictEqual(SNAPSHOT_PAIR_COOLDOWN_WEEKS, 6, '既存のクールダウン週数(6週)が変更されている');
  assert.ok(CROSS_ORG_SNAPSHOT_COOLDOWN_WEEKS > SNAPSHOT_PAIR_COOLDOWN_WEEKS,
    '他団体絡み候補のクールダウンが通常より長くなっていない');

  const state = baseState({ season: 5, week: 10 }); // absWeek = (5-1)*48+10 = 202
  const absWeekNow = Engine.util.absWeek(state.season, state.week);
  const gapWeeks = 8; // SNAPSHOT_PAIR_COOLDOWN_WEEKS(6) < 8 < CROSS_ORG_SNAPSHOT_COOLDOWN_WEEKS(10)
  const lastWeek = absWeekNow - gapWeeks;

  const crossOrgCandidate = { fighterId: 1, fighter2Id: 2, crossOrg: true };
  const sameOrgCandidate = { fighterId: 1, fighter2Id: 2, crossOrg: false };
  const key = Engine.snapshot._cooldownKey(crossOrgCandidate);
  state._snapshotCooldowns = { [key]: lastWeek };

  assert.strictEqual(Engine.snapshot._isOnCooldown(crossOrgCandidate, state), true,
    `8週前に出た他団体絡み候補が、まだクールダウン中(${CROSS_ORG_SNAPSHOT_COOLDOWN_WEEKS}週)のはずなのに再抽選対象になっている`);
  assert.strictEqual(Engine.snapshot._isOnCooldown(sameOrgCandidate, state), false,
    `8週前に出た同団体候補は、通常クールダウン(${SNAPSHOT_PAIR_COOLDOWN_WEEKS}週)を過ぎているのに再抽選対象になっていない`);
})();

console.log('rivalry-visibility-rental-test: ok');
