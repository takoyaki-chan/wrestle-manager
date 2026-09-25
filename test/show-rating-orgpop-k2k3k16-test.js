#!/usr/bin/env node
'use strict';

// 総点検 K-2・K-3・K-16(2026-09-25 Keisuke裁定)の回帰テスト
//   K-2 : ★の物語ボーナス(因縁決着+6/因縁カード+2/ファン期待+4件)が本番の呼び出し元の名前でも効く。
//         measureShow はファン期待を r.fanExpectMatch で数える。1興行の★は state.lastShowRating に1つ。
//   K-3 : ★で決まった団体人気のプラスの変化にだけ、会場の器の係数を掛ける(人気20未満・マイナスは不変)。
//   K-16: 節目の大会(対抗戦・秋の4団体戦)の加減算に節目の係数 (1+逓減)/2 を勝ち負けとも掛ける。

const assert = require('assert');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });

const near = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol, `${label}: got ${got}, want ${want} (±${tol})`);
};

// ── K-2: calcShowRating は両方の名前を読む ──
{
  const results = [{ mq: 55 }, { mq: 50 }, { mq: 48 }];
  const rate = ctx => Engine.attendanceV2.calcShowRating(results, 140, 150, 0, ctx);
  assert.strictEqual(rate({}).bonusScore, 3, '試合数の充実+3だけ');
  assert.strictEqual(rate(undefined).bonusScore, 3, 'context未指定でも落ちない');
  assert.strictEqual(rate({ rivalryResolved: true, rivalryCards: 2, fanExpectMatches: 1 }).bonusScore, 3 + 6 + 4,
    '本番の呼び出し元の名前(rivalryResolved/rivalryCards/fanExpectMatches)で因縁決着+6・ファン期待+4が効く');
  assert.strictEqual(rate({ rivalryResolved: false, rivalryCards: 1, fanExpectMatches: 0 }).bonusScore, 3 + 2,
    '決着が無ければ因縁カード+2');
  assert.strictEqual(rate({ rivalryCards: 0, fanExpectMatches: 3 }).bonusScore, 3 + 12, 'ファン期待は1件+4');
  assert.strictEqual(rate({ hasRivalryResolution: true, hasRivalryCard: true, fanExpectCount: 1 }).bonusScore, 3 + 6 + 4,
    'has系の名前(measureShow/大会精算)も従来どおり効く');
  assert.strictEqual(rate({ hasRivalryResolution: false, hasRivalryCard: false, fanExpectCount: 0,
    rivalryResolved: true, rivalryCards: 3, fanExpectMatches: 2 }).bonusScore, 3,
    'has系の名前が明示されていればそちらを優先(大会精算は物語ボーナス0を明示している)');
}

// ── K-2: measureShow のファン期待は r.fanExpectMatch ──
{
  const G = Engine.createInitialState(42, true);
  const a = G.roster[0], b = G.roster[1];
  const card = [{ left: a.id, right: b.id }];
  const results = [{ mq: 60, left: a, right: b, winner: 'left', fanExpectMatch: true }];
  const withFlag = Engine.attendanceV2.measureShow(G, card, results, 150, 0);
  const without = Engine.attendanceV2.measureShow(G, card, [{ ...results[0], fanExpectMatch: false }], 150, 0);
  assert.strictEqual(withFlag.rating.bonusScore - without.rating.bonusScore, SHOW_RATING_CONFIG.fanExpectBonus,
    'measureShow は興行経路が立てる r.fanExpectMatch を数える');
}

// ── K-2: 1興行の★は1つ(保存と取り出し) ──
{
  const rating = Engine.attendanceV2.calcShowRating([{ mq: 70 }, { mq: 60 }, { mq: 55 }], 150, 150, 0, { rivalryCards: 1 });
  const packed = Engine.attendanceV2.packShowRating(rating, 12);
  assert.deepStrictEqual(Object.keys(packed).sort(), ['bonusScore', 'mqScore', 'occScore', 'showNo', 'stars', 'totalScore']);
  assert.strictEqual(Engine.attendanceV2.getStoredShowRating({ lastShowRating: packed, totalShows: 12 }).stars, rating.stars,
    '同じ興行(totalShows一致)なら保存された★を返す');
  assert.strictEqual(Engine.attendanceV2.getStoredShowRating({ lastShowRating: packed, totalShows: 13 }), null,
    '別の興行の★は使わない');
  assert.strictEqual(Engine.attendanceV2.getStoredShowRating({ totalShows: 13 }), null, '保存が無い旧セーブは null(再計算へ)');
}

// ── K-3: 会場の器の係数(裁定ガイドの表) ──
{
  const table = {
    30: [0.73, 0.95, 1, 1, 1, 1, 1, 1, 1, 1],
    40: [0.28, 0.56, 0.93, 1, 1, 1, 1, 1, 1, 1],
    50: [0.2, 0.33, 0.56, 0.89, 1, 1, 1, 1, 1, 1],
    60: [0.2, 0.21, 0.35, 0.56, 0.83, 1, 1, 1, 1, 1],
    70: [0.2, 0.2, 0.25, 0.39, 0.59, 0.98, 1, 1, 1, 1],
    80: [0.2, 0.2, 0.2, 0.28, 0.42, 0.69, 1, 1, 1, 1],
    90: [0.2, 0.2, 0.2, 0.2, 0.29, 0.48, 0.83, 1, 1, 1],
    100: [0.2, 0.2, 0.2, 0.2, 0.2, 0.33, 0.58, 1, 1, 1],
  };
  for (const [pop, row] of Object.entries(table)) {
    row.forEach((want, v) => near(Engine.orgPop.getVenueFitMultiplier(Number(pop), v), want, 0.006, `会場の器 人気${pop} 会場${v}`));
  }
  for (let v = 0; v < VENUES.length; v++) {
    assert.strictEqual(Engine.orgPop.getVenueFitMultiplier(19.9, v), 1, '人気20未満は常に1');
  }
  assert.strictEqual(Engine.orgPop.getVenueFitMultiplier(80, undefined), 1, '会場不明は1');
  assert.strictEqual(Engine.orgPop.isVenueSmallForOrgPop(80, 0), true, '人気80の公民館は「小さい会場」');
  assert.strictEqual(Engine.orgPop.isVenueSmallForOrgPop(80, 6), false, '人気80の大ホールは説明なし');
  assert.strictEqual(Engine.orgPop.isVenueSmallForOrgPop(15, 0), false, '人気20未満は説明なし');
}

// ── K-3: applyShowPopularity(プラスの変化だけ・人気20未満は完全に従来どおり) ──
{
  const res = [{ mq: 60 }];
  const rng = () => Engine.rng.create(12345);
  const sp = (pop, stars, venue) => Engine.applyShowPopularity([], res, pop, rng(), stars, venue);
  near(sp(80, 5, 0).popDelta, 0.088, 0.001, '人気80・公民館の★5は+0.44→+0.09');
  near(sp(80, 5, 2).popDelta, 0.088, 0.001, '人気80・小ホールBの★5は+0.09');
  near(sp(80, 5, 4).popDelta, 0.183, 0.002, '人気80・中ホールAの★5は+0.18');
  near(sp(80, 5, 5).popDelta, 0.306, 0.002, '人気80・中ホールBの★5は+0.31');
  near(sp(80, 4, 6).popDelta, 0.22, 1e-9, '人気80・大ホールの★4は+0.22のまま');
  assert.strictEqual(sp(80, 5, 0).venueFit < SHOW_ORGPOP_VENUE_FIT.noteBelow, true, '戻り値 venueFit で説明の要否が分かる');
  near(Engine.applyShowPopularity([], res, 80, rng(), 5).popDelta, 0.44, 1e-9, '会場を渡さない呼び出し(AI団体)は係数なし');
  for (const v of [0, 2, 4, 9]) {
    assert.strictEqual(sp(80, 1, v).popDelta, -1, 'マイナスの変化(★1)は会場で変わらない');
    assert.strictEqual(sp(80, 2, v).popDelta, -0.5, 'マイナスの変化(★2)は会場で変わらない');
    assert.strictEqual(sp(80, 1, v).venueFit, 1, 'マイナスの変化には係数を掛けない');
  }
  for (const pop of [0, 10, 14.9, 15, 19.99]) {
    for (const stars of [1, 2, 3, 4, 5]) {
      const legacy = Engine.applyShowPopularity([], res, pop, rng(), stars).popDelta;
      for (let v = 0; v < VENUES.length; v++) {
        assert.strictEqual(sp(pop, stars, v).popDelta, legacy, `人気${pop}・★${stars}・会場${v} は従来と完全に同じ`);
      }
    }
  }
}

// ── K-16: 節目の係数と対抗戦の加減算 ──
{
  [[10, 1], [19.9, 1], [20, 0.85], [39, 0.85], [40, 0.675], [54, 0.675], [55, 0.61], [84, 0.61], [85, 0.575], [94, 0.575], [95, 0.53]]
    .forEach(([pop, m]) => near(Engine.orgPop.getMilestoneMultiplier(pop), m, 1e-9, `節目の係数 人気${pop}`));
  near(Engine.orgPop.applyMilestoneChange(4, 75), 2.44, 1e-9, '秋の優勝(人気75)');
  near(Engine.orgPop.applyMilestoneChange(-2, 75), -1.22, 1e-9, '秋の準決勝負け(人気75)');
  const base = { orgPop: 75, battlePoints: { player: 0, org_s: 0, org_a: 0, org_b: 0 }, orgWarRecord: {}, season: 3, week: 22, ppvUnlocked: true };
  const win = Engine.event.applyWarOutcome(base, 3, 2, 'org_a');
  near(win.state.orgPop, 78.05, 1e-9, '対抗戦の勝ち越し(人気75)は+3.05');
  assert.ok(win.events[0].includes('団体人気+3.1'), `ログは実際の変化量: ${win.events[0]}`);
  const loss = Engine.event.applyWarOutcome(base, 2, 3, 'org_a');
  near(loss.state.orgPop, 73.17, 1e-9, '対抗戦の負け越し(人気75)は−1.83');
  assert.ok(loss.events[0].includes('団体人気-1.8'), `ログは実際の変化量: ${loss.events[0]}`);
  const low = Engine.event.applyWarOutcome({ ...base, orgPop: 15, ppvUnlocked: false }, 3, 2, 'org_a');
  assert.strictEqual(low.state.orgPop, 20, '人気20未満は従来どおり+5');
  assert.ok(low.events[0].includes('団体人気+5'), `人気20未満のログは従来どおり: ${low.events[0]}`);
}

// ── K-3付随: ドーム圏の案内は満員見込みで判定(旗揚げ直後のロスターでは出ない) ──
{
  const G = { ...Engine.createInitialState(42, true), orgPop: 92 };
  const outlook = Engine.economy.getDomeSelloutOutlook(G);
  assert.strictEqual(typeof outlook.estOccRate, 'number');
  assert.strictEqual(outlook.sellout, false, '旗揚げ直後の顔ぶれでは人気92でもドームの満員見込みは立たない');
  assert.strictEqual(Engine.economy.getDomeSelloutOutlook({ roster: [], orgPop: 95 }).sellout, false, '選手がいなければ出さない');
}

console.log('show-rating-orgpop-k2k3k16-test: ok');
