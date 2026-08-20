'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  numeric-overhaul P3b: 成長端数持ち越し(_growthFrac)の不変条件テスト
//
//  背景: calcGrowth の Math.ceil 1pt下限は「rawGain 0.4でも+1pt」の隠しインフレで、
//  cap近傍0.85帯では招聘/合宿の倍率差(×1.25 vs ×1.53等)を同じ+1に潰す
//  第2の量子化器だった(care-rework2 task-98 裁定B)。P3bで端数持ち越し方式へ是正。
//
//  ここで固定する不変条件:
//    F1. settleGrowthFraction の保存則(端数は失われず、いつか必ず1ptに実る)
//    F2. calcGrowth は小数(0.1刻み)を返し、切り上げない
//    T1. 招聘/合宿倍率の単調性(倍率↑→成長↑)が量子化に潰されない
//    T3. cap近傍0.85帯でも倍率差が実際の成長量の差になる(task-98で未達だった項)
//    F3. セーブ互換: _growthFrac 未定義は0扱い / validateGameState がNaN・範囲外を自動修正
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

let failed = 0;
function section(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${error && error.stack || error}`);
  }
}

function fighter(id, name, ovr, cap, extra = {}) {
  return {
    id, name,
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    pot: { pw: cap, sp: cap, te: cap, st: cap, mn: cap },
    trainCap: { pw: cap, sp: cap, te: cap, st: cap, mn: cap },
    age: 21,
    traits: [],
    popularity: 30,
    condition: 80,
    contractPop: 30,
    injury: null,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    ...extra,
  };
}

const G60 = { season: 3, lockerRoomMorale: 60 };
const settle = (...args) => Engine.growth.settleGrowthFraction(...args);

console.log('=== P3b 成長端数持ち越し 不変条件 ===\n');

section('F1a. 保存則: 0.3を10回積むとちょうど3pt(端数は失われない)', () => {
  let frac = 0, applied = 0;
  for (let i = 0; i < 10; i++) {
    const r = settle(frac, 0.3, 999);
    frac = r.frac;
    applied += r.gain;
  }
  assert.strictEqual(applied, 3);
  assert.strictEqual(frac, 0);
});

section('F1b. 浮動小数ノイズ: 0.9+0.1は確実に1ptになる(0.999...で止まらない)', () => {
  const r1 = settle(0.9, 0.1, 999);
  assert.strictEqual(r1.gain, 1);
  assert.strictEqual(r1.frac, 0);
  // 0.1×10 の積み上げでも同じ
  let frac = 0, applied = 0;
  for (let i = 0; i < 10; i++) { const r = settle(frac, 0.1, 999); frac = r.frac; applied += r.gain; }
  assert.strictEqual(applied, 1);
  assert.strictEqual(frac, 0);
});

section('F1c. cap衝突: 超過分の端数は破棄される(壁の向こうに貯金しない)', () => {
  const r = settle(0.8, 2.5, 2); // total 3.3 だが残り2pt
  assert.strictEqual(r.gain, 2);
  assert.strictEqual(r.frac, 0);
  const r2 = settle(0, 0.4, 0); // 残り0でも端数を積まない
  assert.strictEqual(r2.gain, 0);
  assert.strictEqual(r2.frac, 0);
});

section('F1d. セーブ互換: prevFrac未定義(旧セーブ)は0扱い', () => {
  const r = settle(undefined, 1.4, 999);
  assert.strictEqual(r.gain, 1);
  assert.strictEqual(r.frac, 0.4);
});

section('F2. calcGrowthは0.1刻みの小数を返す(ceilの1pt下限が存在しない)', () => {
  // cap近傍(残り10%)の選手: 旧実装なら全て整数(ほぼ常に1)が返っていた帯
  const near = fighter(11, '壁際', 90, 100);
  const rng = Engine.rng.create(9001);
  const samples = [];
  for (let i = 0; i < 200; i++) samples.push(Engine.growth.calcGrowth(rng, G60, near, 'pw', 1));
  const positives = samples.filter(v => v > 0);
  assert.ok(positives.length > 0, '正の成長サンプルが1つもない');
  samples.forEach(v => {
    assert.ok(v >= 0 && v <= 10, `返り値が範囲外: ${v}`);
    assert.strictEqual(Math.round(v * 10) / 10, v, `0.1刻みでない: ${v}`);
  });
  const fractional = positives.filter(v => !Number.isInteger(v));
  assert.ok(fractional.length > 0, '非整数の返り値が皆無(ceilが残っている疑い)');
});

section('T1. 招聘/合宿倍率の単調性: 1.00 < 1.25 < 1.35 < 1.53 が返り値に厳密に出る', () => {
  const mults = [1.0, 1.25, 1.35, 1.53];
  // 同一シード=同一weeklyVarianceのペアド比較。中堅帯(残り40%)
  const totals = mults.map(mult => {
    const rng = Engine.rng.create(7101);
    let total = 0;
    for (let week = 0; week < 12; week++) {
      const c = fighter(21, '単調性', 60, 100, mult > 1.0 ? { _inviteBuff: { mult, weeksLeft: 4 } } : {});
      total += Engine.growth.calcGrowth(rng, G60, c, 'pw', 1);
    }
    return total;
  });
  for (let i = 1; i < totals.length; i++) {
    assert.ok(totals[i] > totals[i - 1], `倍率${mults[i]}の累計(${totals[i].toFixed(1)})が倍率${mults[i - 1]}(${totals[i - 1].toFixed(1)})を上回らない`);
  }
});

section('T3. cap近傍0.85帯でも倍率差が成長量の差になる(task-98未達項の解消)', () => {
  // current 85 / cap 100 = 0.85帯。旧実装はここで×1.25も×1.53も同じ+1/週に潰れていた
  const run = mult => {
    const rng = Engine.rng.create(7303);
    let frac = 0, applied = 0, cur = 85;
    for (let week = 0; week < 20; week++) {
      const c = fighter(31, '壁際差', cur, 100, { _inviteBuff: { mult, weeksLeft: 4 } });
      const g = Engine.growth.calcGrowth(rng, G60, c, 'pw', 1);
      const r = settle(frac, g, 100 - cur);
      frac = r.frac;
      applied += r.gain;
      cur += r.gain;
    }
    return applied + frac; // 実った分+持ち越し中の端数=期待成長の実現値
  };
  const low = run(1.25);
  const high = run(1.53);
  assert.ok(low > 0, `0.85帯で×1.25の成長が0(死に帯が残っている): ${low}`);
  assert.ok(high > low, `0.85帯で倍率差が出ない: ×1.53=${high.toFixed(2)} <= ×1.25=${low.toFixed(2)}`);
});

section('F3. validateGameState: _growthFracのNaN/範囲外を警告つきで0へ自動修正、正常値は保持', () => {
  const bad1 = fighter(41, 'NaN端数', 50, 90, { _growthFrac: NaN });
  const bad2 = fighter(42, '範囲外端数', 50, 90, { _growthFrac: 1.2 });
  const good = fighter(43, '正常端数', 50, 90, { _growthFrac: 0.5 });
  const legacy = fighter(44, '旧セーブ', 50, 90); // _growthFrac未定義
  const state = {
    season: 2, week: 5, rngSeed: 1,
    roster: [bad1, bad2, good, legacy],
    freeAgents: [], scoutCandidates: [], aiOrgs: {},
  };
  Engine.validateGameState(state);
  assert.strictEqual(bad1._growthFrac, 0);
  assert.strictEqual(bad2._growthFrac, 0);
  assert.strictEqual(good._growthFrac, 0.5);
  assert.strictEqual(legacy._growthFrac, undefined);
});

console.log('');
if (failed > 0) {
  console.log(`${failed} section(s) FAILED`);
  process.exit(1);
}
console.log('ALL PASS');
