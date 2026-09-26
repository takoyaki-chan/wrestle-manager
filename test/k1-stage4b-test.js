#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage4b-test.js — K-1「興行後の処理を一本化する」第4段 4-B(前半)の回帰ガード(2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-F01 タッグの人気: Engine.show.applyMatchPopularity。負けたチームは負けとして数え(勝ちの人気
//       ボーナスなし・連敗が続く・直近の結果が「負け」)、タッグにもメイン低評価の人気減とヒール適性の加点が掛かる
//    2. K1-E05 派閥ポイント: Engine.show.accrueFactionPoints。試合ごとに抗争ポイント・派閥内ポイントが入る
//       (週の上限20・F09 ×1.8・Common-1 の試合は派閥内ポイントを二重に入れない)。入力の状態を書き換えない
//    3. §7 X03 怪我判定の情報: Engine.show.rollMatchInjury。週・季・険悪ペア×2・舞台の格・王者を渡す
//    4. K1-E02 試合成長: Engine.show.applyMatchGrowth。年齢倍率・関係性倍率、タッグの相手は2人の平均(裁定)
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)が見る。ここは関数の中身と、
//  app.js が共通の関数を呼んでいること(文面)を確かめる。
//
//  ■ 使い方
//    node test/k1-stage4b-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { engineShowBody, appShowBody } = require('./helpers/show-paths.js');
const { loadEngines } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

// 実プレイの経路の本文(K-1 第3段: App._finalizeShowImpl → Engine.show.finalize。実プレイだけの処理は App._finalizeHook*)
function finalizeBody() {
  return appShowBody();
}

function fighter(id, extra = {}) {
  return { id, name: `選手${id}`, popularity: 40, losingStreak: 0, traits: [], role: 'Face', pw: 50, sp: 50, te: 50, st: 50, mn: 50, ...extra };
}

console.log('K-1 第4段 4-B(前半)回帰ガード');

// ── 1. K1-F01 タッグの人気 ──
section('F01: タッグの敗者は負けとして数える(勝ちの人気ボーナスなし・連敗が続く・直近の結果は負け)', () => {
  assert.ok(Engine.show && typeof Engine.show.applyMatchPopularity === 'function', 'Engine.show.applyMatchPopularity が無い');
  const roster = [fighter(1), fighter(2), fighter(3, { losingStreak: 1 }), fighter(4, { losingStreak: 1 })];
  const match = { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } };
  const result = { matchType: 'tag', winner: 'teamA', mq: 60 };
  const out = Engine.show.applyMatchPopularity(roster, match, result, false, 50, null).roster;
  const by = id => out.find(c => c.id === id);
  [1, 2].forEach(id => {
    assert.strictEqual(by(id).lastMatchResult, 'win', `勝者${id}の直近の結果`);
    assert.strictEqual(by(id).losingStreak, 0, `勝者${id}の連敗`);
  });
  [3, 4].forEach(id => {
    assert.strictEqual(by(id).lastMatchResult, 'loss', `敗者${id}の直近の結果が負けでない`);
    assert.strictEqual(by(id).losingStreak, 2, `敗者${id}の連敗が続いていない`);
  });
  // 同じ人気の勝者と敗者で、勝ちの加点(rawGain+1)の分だけ差がある
  assert.ok(by(1).popularity > by(3).popularity, `勝者 ${by(1).popularity} と敗者 ${by(3).popularity} の人気に差が無い`);
  // 各選手の値は、同じ勝敗のシングルとまったく同じ(式が一つ)
  const single = Engine.applyMQPopularity([fighter(1), fighter(3, { losingStreak: 1 })],
    { mq: 60, winner: 'left', left: { id: 1 }, right: { id: 3 } }, false, 50, null).roster;
  assert.strictEqual(by(1).popularity, single[0].popularity);
  assert.strictEqual(by(3).popularity, single[1].popularity);
});

section('F01: タッグにもメイン低評価の人気減とヒール適性の加点が掛かる(裁定)', () => {
  const roster = [
    fighter(1), fighter(2, { traits: ['ヒール適性'], role: 'Heel' }),
    fighter(3), fighter(4),
  ];
  const match = { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } };
  // メイン低評価: 同じ試合をメイン/前座で比べる
  const low = { matchType: 'tag', winner: 'teamB', mq: 20 };
  const main = Engine.show.applyMatchPopularity(roster, match, low, true, 50, null);
  const under = Engine.show.applyMatchPopularity(roster, match, low, false, 50, null);
  [1, 2, 3, 4].forEach(id => {
    const m = main.roster.find(c => c.id === id).popularity;
    const u = under.roster.find(c => c.id === id).popularity;
    assert.ok(m < u, `選手${id}: メインの低評価で人気が下がっていない (メイン ${m} / 前座 ${u})`);
  });
  assert.ok(main.popEvents.some(e => /メインイベントの低い試合評価/.test(e)), 'メイン低評価の知らせが返らない');
  // ヒール適性: MQ40以上で加点。同じ側のもう一人(特性なし)より伸びる
  const good = Engine.show.applyMatchPopularity(roster, match, { matchType: 'tag', winner: 'teamA', mq: 50 }, false, 50, null).roster;
  assert.ok(good.find(c => c.id === 2).popularity > good.find(c => c.id === 1).popularity, 'ヒール適性の加点が効いていない');
});

section('F01: 引き分けは両チームとも連敗が止まり、直近の結果は引き分け', () => {
  const roster = [fighter(1, { losingStreak: 2 }), fighter(2), fighter(3, { losingStreak: 4 }), fighter(4)];
  const match = { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } };
  const out = Engine.show.applyMatchPopularity(roster, match, { matchType: 'tag', winner: 'draw', mq: 50 }, false, 50, null).roster;
  out.forEach(c => {
    assert.strictEqual(c.lastMatchResult, 'draw');
    assert.strictEqual(c.losingStreak, 0);
  });
});

section('F01: 実プレイ(app.js)はエンジンと同じ Engine.show.applyMatchPopularity を呼ぶ(左右に同じ選手を入れない)', () => {
  const body = finalizeBody();
  assert.ok(/Engine\.show\.applyMatchPopularity\(/.test(body), '_finalizeShowImpl が Engine.show.applyMatchPopularity を呼んでいない');
  assert.ok(!/fakeSingleResult/.test(body), '左右に同じ選手を入れる旧コード(fakeSingleResult)が残っている');
  const mgmt = readSource('src', 'management.js');
  const ex = engineShowBody(); // K-1 第3段: executeShow → Engine.show.finalize
  assert.ok(/Engine\.show\.applyMatchPopularity\(/.test(ex), 'executeShow が Engine.show.applyMatchPopularity を呼んでいない');
});

// ── 2. K1-E05 派閥ポイント ──
function factionState(extra = {}) {
  // 派閥1: リーダー1・2番手2 / 派閥2: リーダー3・2番手4 / 無所属5
  const roster = [
    fighter(1, { pw: 70 }), fighter(2, { pw: 60 }), fighter(3, { pw: 70 }), fighter(4, { pw: 60 }), fighter(5),
  ];
  return {
    season: 3, week: 10, offSeason: false, roster,
    factions: [
      { id: 1, name: 'A派', leaderId: 1, memberIds: [1, 2], status: 'active', archetypeId: 'COMBAT' },
      { id: 2, name: 'B派', leaderId: 3, memberIds: [3, 4], status: 'active', archetypeId: 'COMBAT' },
    ],
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: 5, pointsB: 0, startedSeason: 3, startedWeek: 1, lastUpdatedSeason: 3, lastUpdatedWeek: 1, naturalCalmStreak: 0 } },
    ...extra,
  };
}
const single = (left, right, extra = {}) => ({ left, right, ...extra });
const singleRes = (winner) => ({ winner, mq: 50, left: { id: 0 }, right: { id: 0 } });

section('E05: 派閥の違う選手の試合で、勝者の派閥に抗争ポイントが入る(リーダー同士=10pt、引き分けは入らない)', () => {
  assert.ok(Engine.show && typeof Engine.show.accrueFactionPoints === 'function', 'Engine.show.accrueFactionPoints が無い');
  const s0 = factionState();
  const out = Engine.show.accrueFactionPoints(s0, [single(1, 3), single(2, 4)], [singleRes('left'), singleRes('draw')]);
  const e = out.factionRivalryPoints['1-2'];
  // 先頭の試合=メイン(2026-09-26 裁定3)。§2.2 のメイン +0.3 が掛かる
  const mainTop = Math.round(FACTION_CONFIG.pointsByRank.top * (1 + FACTION_CONFIG.pointsMainEventBonus));
  assert.strictEqual(e.pointsA, 5 + mainTop, `リーダー同士の勝ちで ${e.pointsA}`);
  assert.strictEqual(e.pointsB, 0, '引き分けで加点された');
});

section('E05: 入力の状態をその場で書き換えない(抗争ポイント・週の上限・派閥内ポイント・派閥)', () => {
  const s0 = factionState({ factionInternalPoints: { 2: { 4: 1 } } });
  const before = JSON.parse(JSON.stringify(s0));
  const out = Engine.show.accrueFactionPoints(s0,
    [single(1, 3), single(4, 1, { isTitle: true })],
    [singleRes('right'), singleRes('left')]);
  assert.deepStrictEqual(s0, before, '入力の状態が書き換わった');
  assert.notStrictEqual(out, s0);
  // 2番手(非リーダー)が王座戦で勝つと派閥内ポイント(§3.2 タイトル戦勝利)
  assert.strictEqual(out.factionInternalPoints[2][4], 1 + FACTION_CONFIG.internalPointsExternalTitleWin);
  assert.ok(out._rivalryPointsWeekly && Object.keys(out._rivalryPointsWeekly).length === 1, '週の上限の記録が無い');
});

section('E05: 週の上限(同じ組で20pt)と F09(×1.8・上限なし)', () => {
  const cards = [single(1, 3), single(1, 3), single(1, 3)];
  const res = [singleRes('left'), singleRes('left'), singleRes('left')];
  const capped = Engine.show.accrueFactionPoints(factionState(), cards, res).factionRivalryPoints['1-2'];
  assert.strictEqual(capped.pointsA, 5 + FACTION_CONFIG.pointsWeeklyCapPerPair, `上限を超えた: ${capped.pointsA}`);
  const f09 = Engine.show.accrueFactionPoints(factionState(), cards.map(m => ({ ...m, _f09Locked: true })), res).factionRivalryPoints['1-2'];
  const per = Math.round(FACTION_CONFIG.pointsByRank.top * FACTION_CONFIG.f09PointsMult);
  // 先頭の1試合はメイン(+0.3)が先に掛かってから ×1.8(§2.5 / §3.4。2026-09-26 裁定3)
  const perMain = Math.round(Math.round(FACTION_CONFIG.pointsByRank.top * (1 + FACTION_CONFIG.pointsMainEventBonus)) * FACTION_CONFIG.f09PointsMult);
  assert.strictEqual(f09.pointsA, 5 + perMain + per * 2, `F09 の加点 ${f09.pointsA}`);
});

section('E05: Common-1 で清算した試合は派閥内ポイントを二重に入れない / タッグはチーム代表(fighter1)で数える', () => {
  // 派閥内の試合(2 vs 1)は抗争ポイントの対象外。非リーダーが王座戦で勝つ形にして、Common-1 の印の有無で比べる
  const card = [single(2, 1, { isTitle: true })];
  const res = [singleRes('left')];
  const plain = Engine.show.accrueFactionPoints(factionState(), card, res);
  const c1 = Engine.show.accrueFactionPoints(factionState(), card, res, { common1MatchIdx: 0 });
  assert.strictEqual(plain.factionInternalPoints[1][2], FACTION_CONFIG.internalPointsExternalTitleWin);
  assert.ok(!c1.factionInternalPoints || !c1.factionInternalPoints[1] || !c1.factionInternalPoints[1][2], 'Common-1 の試合に派閥内ポイントが入った');
  const tag = Engine.show.accrueFactionPoints(factionState(),
    [{ matchType: 'tag', teamA: { fighter1: 3, fighter2: 5 }, teamB: { fighter1: 1, fighter2: 5 } }],
    [{ matchType: 'tag', winner: 'teamA', mq: 50 }]).factionRivalryPoints['1-2'];
  // 1試合だけのカード=先頭=メイン(2026-09-26 裁定3): 1.0 + メイン +0.3 + タッグ -0.5
  const tagPt = Math.round(FACTION_CONFIG.pointsByRank.top * (1 + FACTION_CONFIG.pointsMainEventBonus + FACTION_CONFIG.pointsTagBonus));
  assert.strictEqual(tag.pointsB, tagPt, `タッグの加点 ${tag.pointsB}`);
});

section('E05: 実プレイ(app.js)はエンジンと同じ Engine.show.accrueFactionPoints を呼ぶ(Common-1 の試合番号つき)', () => {
  const body = finalizeBody();
  // K-1 第3段: 加点は Engine.show.finalize の中。第4段 4-A: Common-1 の清算も finalize の中(Engine.show.settleFactionBookings)で、
  // 清算した試合の番号を common1MatchIdx で返す
  assert.ok(/Engine\.show\.accrueFactionPoints\(s, validMatches, results, \{ common1MatchIdx \}\)/.test(body),
    '_finalizeShowImpl が Engine.show.accrueFactionPoints を呼んでいない');
  const mgmt = readSource('src', 'management.js');
  assert.ok(/common1ResolvedIdx = c1Idx;/.test(mgmt) && /common1MatchIdx: common1ResolvedIdx, presentations \}/.test(mgmt)
    && /common1MatchIdx = fb\.common1MatchIdx;/.test(mgmt), 'Common-1 を清算した試合の番号を控えていない');
  const ex = engineShowBody(); // K-1 第3段: executeShow → Engine.show.finalize
  assert.ok(/Engine\.show\.accrueFactionPoints\(s, validMatches, results, \{ common1MatchIdx \}\)/.test(ex), 'executeShow が Engine.show.accrueFactionPoints を呼んでいない');
});

// ── 3. §7 X03 怪我判定に渡す情報 ──
function captureInjuryArgs(fn) {
  const real = Engine.injury.check;
  const calls = [];
  Engine.injury.check = function (rng, f, result, coachMult, week, season, downgrade, flavorOpts) {
    calls.push({ fighterId: f && f.id, coachMult, week, season, downgrade, flavorOpts });
    return null;
  };
  try { fn(); } finally { Engine.injury.check = real; }
  return calls;
}

section('X03: 怪我判定に週・季・舞台の格・王者を渡す(以前の実プレイは週・季が 0 で「0季0週」の経歴になった)', () => {
  assert.ok(Engine.show && typeof Engine.show.rollMatchInjury === 'function', 'Engine.show.rollMatchInjury が無い');
  const s = { rngSeed: 7, season: 4, week: 18, coaches: [], coachAssign: {}, roster: [fighter(1), fighter(2)], relationships: {}, titles: { world: { championId: 2 } } };
  const r = { winner: 'left', mq: 50, turns: 10, left: { id: 1 }, right: { id: 2 }, hpLeft: { final: 50, max: 100 }, hpRight: { final: 10, max: 100 } };
  const calls = captureInjuryArgs(() => {
    Engine.show.rollMatchInjury(s, r, 0, s.roster[0], { titleChampionId: 2 });
    Engine.show.rollMatchInjury(s, r, 3, s.roster[1], { titleChampionId: 2 });
    Engine.show.rollMatchInjury(s, { ...r, isTitleMatch: true }, 3, s.roster[1], { titleChampionId: 2 });
  });
  assert.strictEqual(calls.length, 3);
  calls.forEach(c => { assert.strictEqual(c.week, 18); assert.strictEqual(c.season, 4); assert.strictEqual(c.flavorOpts.titleChampionId, 2); });
  assert.deepStrictEqual(calls.map(c => c.flavorOpts.stage), ['main', 'undercard', 'title']);
  calls.forEach(c => assert.ok(!(c.flavorOpts.injuryMult > 1), '険悪でないペアに倍率が掛かった'));
});

section('X03: 険悪ペア(rivalry≥60 ∧ 平均bond≤30)はアクシデント率×2(bond-rivalry P-3)', () => {
  const rel = { bond: 20, rivalry: 70 };
  const s = { rngSeed: 7, season: 4, week: 18, coaches: [], coachAssign: {}, roster: [fighter(1), fighter(2)], relationships: { '1>2': { ...rel }, '2>1': { ...rel } } };
  const r = { winner: 'left', mq: 50, turns: 10, left: { id: 1 }, right: { id: 2 }, hpLeft: { final: 50, max: 100 }, hpRight: { final: 10, max: 100 } };
  const calls = captureInjuryArgs(() => { Engine.show.rollMatchInjury(s, r, 1, s.roster[0], {}); });
  assert.strictEqual(calls[0].flavorOpts.injuryMult, 2, `倍率 ${calls[0].flavorOpts.injuryMult}`);
});

section('X03: 中傷・重傷の経歴に今の週・季が残る(本物の Engine.injury.check を通す)', () => {
  // 怪我が出る乱数シードを探す(体調0・HP0 で確率の上限 15%)
  const f = fighter(1, { condition: 0, wear: 0 });
  const r = { winner: 'right', mq: 50, turns: 30, left: { id: 1 }, right: { id: 2 }, hpLeft: { final: 0, max: 100 }, hpRight: { final: 90, max: 100 } };
  let hit = null;
  for (let seed = 1; seed < 5000 && !hit; seed++) {
    const s = { rngSeed: seed, season: 5, week: 22, coaches: [], coachAssign: {}, roster: [f, fighter(2)], relationships: {} };
    const res = Engine.show.rollMatchInjury(s, r, 2, f, {});
    if (res && res.newFighter.careerHistory && res.newFighter.careerHistory.some(e => e.type === 'injury')) hit = res;
  }
  assert.ok(hit, '中傷以上の怪我が出るシードが見つからない');
  const e = hit.newFighter.careerHistory.find(x => x.type === 'injury');
  assert.strictEqual(e.season, 5);
  assert.strictEqual(e.week, 22);
});

section('X03: 実プレイ(app.js)はエンジンと同じ Engine.show.rollMatchInjury を呼ぶ(週・季に 0 を渡さない)', () => {
  // 第4段 4-B-6(K1-E03)で、怪我の判定は怪我による引退とまとめて Engine.show.resolveMatchInjury に入った。
  // 両経路が左右の選手ごとに resolveMatchInjury を呼び、その中で rollMatchInjury(引数の組み立て)を通す
  const body = finalizeBody();
  const calls = body.match(/Engine\.show\.resolveMatchInjury\(s, roster, r, idx, fighter, \{ hostileMult, titleChampionId: titleChampId \}\)/g) || [];
  assert.strictEqual(calls.length, 1, `_finalizeShowImpl の Engine.show.resolveMatchInjury の呼び出しが ${calls.length} 件`);
  assert.ok(/\[r\.left\.id, r\.right\.id\]\.forEach/.test(body), '_finalizeShowImpl が左右の両方を判定していない');
  assert.ok(!/Engine\.injury\.check\(/.test(body), '_finalizeShowImpl が Engine.injury.check を直接呼んでいる');
  const mgmt = readSource('src', 'management.js');
  const ex = engineShowBody(); // K-1 第3段: executeShow → Engine.show.finalize
  assert.strictEqual((ex.match(/Engine\.show\.resolveMatchInjury\(s, roster, r, idx, fighter, \{ hostileMult, titleChampionId: titleChampId \}\)/g) || []).length, 1,
    'executeShow が Engine.show.resolveMatchInjury を呼んでいない');
  assert.ok(/\[r\.left\.id, r\.right\.id\]\.forEach/.test(ex), 'executeShow が左右の両方を判定していない');
  const res = mgmt.slice(mgmt.indexOf('    resolveMatchInjury(state, roster, result, matchIdx, fighter, opts = {}) {'));
  assert.ok(/Engine\.show\.rollMatchInjury\(state, result, matchIdx, fighter, opts\)/.test(res.slice(0, 1500)),
    'Engine.show.resolveMatchInjury が Engine.show.rollMatchInjury を通っていない');
});

// ── 4. K1-E02 試合成長の式 ──
const statSum = f => f.pw + f.sp + f.te + f.st + f.mn;
// シングル1試合の出場者 left の伸び(能力の合計の増分)を、乱数シードを変えて合計する
function singlesGrowthTotal(leftExtra, seeds = 300) {
  let total = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const L = fighter(1, { pw: 60, sp: 60, te: 60, st: 60, mn: 60, age: 22, growthLog: [], ...leftExtra });
    // 相手は OVR が1低い(相手の強さ -1/15)。負け(+0.2)・好試合(MQ≥65, +0.3)で 0.5+0.3+0.2-0.067=0.933。
    // 2能力に分かれると1能力あたり0.467で、×1.0 なら四捨五入で0、×1.15/×1.2 なら1になる(倍率の有無が数字に出る組)
    const R = fighter(2, { pw: 59, sp: 59, te: 59, st: 59, mn: 59, age: 22, growthLog: [] });
    const s = { rngSeed: seed, season: 3, week: 10, coaches: [], coachAssign: {}, roster: [L, R] };
    const r = { winner: 'right', mq: 70, left: { id: 1, name: L.name }, right: { id: 2, name: R.name } };
    const out = Engine.show.applyMatchGrowth(s, s.roster, [single(1, 2)], [r]);
    total += statSum(out[0]) - statSum(L);
  }
  return total;
}

section('E02: 27歳以上は試合で伸びない(年齢倍率0)。以前の実プレイは伸びていた', () => {
  assert.ok(Engine.show && typeof Engine.show.applyMatchGrowth === 'function', 'Engine.show.applyMatchGrowth が無い');
  const total = singlesGrowthTotal({ age: 30 }, 200);
  assert.strictEqual(total, 0, `30歳の選手が試合で ${total} 伸びた`);
  assert.ok(singlesGrowthTotal({ age: 22 }, 200) > 0, '22歳の選手が試合で伸びない(組み方の前提が崩れた)');
});

section('E02: 19〜20歳(×1.15)と険悪ゾーンの伸び(関係性倍率×1.2)が効く', () => {
  const base = singlesGrowthTotal({ age: 22 });
  const young = singlesGrowthTotal({ age: 19 });
  const rel = singlesGrowthTotal({ age: 22, _relationshipGrowthMult: 1.2 });
  assert.ok(young > base, `19歳 ${young} が22歳 ${base} より伸びていない`);
  assert.ok(rel > base, `関係性倍率1.2 ${rel} が倍率なし ${base} より伸びていない`);
});

section('E02: タッグの相手の強さは2人の平均(裁定。以前の実プレイは強い方)', () => {
  const realClamp = Engine.util.clamp;
  const seen = [];
  Engine.util.clamp = function (v, lo, hi) {
    if (lo === -0.2 && hi === 0.5) seen.push(v);
    return realClamp.apply(this, arguments);
  };
  try {
    const mk = (id, v) => fighter(id, { pw: v, sp: v, te: v, st: v, mn: v, age: 20 });
    const roster = [mk(1, 60), mk(2, 60), mk(3, 80), mk(4, 40)];
    const s = { rngSeed: 3, season: 3, week: 10, coaches: [], coachAssign: {}, roster };
    Engine.show.applyMatchGrowth(s, roster,
      [{ matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } }],
      [{ matchType: 'tag', winner: 'teamB', mq: 50 }]);
  } finally {
    Engine.util.clamp = realClamp;
  }
  // チームA(60・60)から見た相手(80・40)は平均60 → 相手の強さ 0。強い方(80)なら 20/15
  assert.strictEqual(seen.length, 4, `相手の強さの計算が ${seen.length} 回`);
  assert.strictEqual(seen[0], 0);
  assert.strictEqual(seen[1], 0);
});

section('E02: 実プレイ(app.js)はエンジンと同じ Engine.show.applyMatchGrowth を呼ぶ(自前の成長計算を持たない)', () => {
  const body = finalizeBody();
  assert.ok(/roster = Engine\.show\.applyMatchGrowth\(s, roster, validMatches, results\);/.test(body), '_finalizeShowImpl が Engine.show.applyMatchGrowth を呼んでいない');
  assert.ok(!/derive\(s\.rngSeed, s\.season, s\.week, 1732\)/.test(body), '_finalizeShowImpl に自前の試合成長(乱数1732)が残っている');
  const mgmt = readSource('src', 'management.js');
  const ex = engineShowBody(); // K-1 第3段: executeShow → Engine.show.finalize
  assert.ok(/roster = Engine\.show\.applyMatchGrowth\(s, roster, validMatches, results\);/.test(ex), 'executeShow が Engine.show.applyMatchGrowth を呼んでいない');
});

if (failed > 0) {
  console.log(`\nFAIL: ${failed} 件`);
  process.exit(1);
}
console.log('\nPASS');
