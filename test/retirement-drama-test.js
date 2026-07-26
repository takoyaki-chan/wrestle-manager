// retirement-drama-test.js
//
// 幕引き（retirement-drama-spec v0.2）の安全網。
//   A 静かに去る    — 段の抽選ではなく消耗の連続曲線
//   B 燃え尽きるまで — エンジンが花道(ラストラン)へ送る。年1〜2名まで
//   C 壮絶な幕切れ  — 門は消耗40。舞台の格と若い頃の無理で重みが掛かる
//   D-1 力が尽きた  — ピークOVR基準（持ち味基準では**永久に発動しない**）
//   E 社長が決める  — engine が先回りして奪わない
//
// **数値そのものは較正で動く前提なので固定しない。** 規則と、壊れたら困る性質を守る。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const management = read('src/management.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

global.window = { IS_TRIAL: false };
(function load() {
  const srcDir = path.join(root, 'src');
  ['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
   'management.js', 'match-engine.js', 'relationships.js'].forEach(f => {
    let code = fs.readFileSync(path.join(srcDir, f), 'utf-8')
      .replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '')
      .replace(/^(const|let) /gm, 'var ');
    new vm.Script(code, { filename: f }).runInThisContext();
  });
})();

console.log('=== 幕引き（A〜E） ===\n');

// ─────────────────────────────────────────────────────────────
// A. 静かに去る — 連続曲線
// ─────────────────────────────────────────────────────────────

section('A-1. 消耗の引退確率は「段」ではなく連続', () => {
  assert.strictEqual(typeof quietExitChance, 'function', 'quietExitChance が無い');
  // 段だと同じ値が並ぶ。連続なら 1 ずつでも必ず増える
  for (let w = 41; w <= 79; w++) {
    assert.ok(quietExitChance(w) > quietExitChance(w - 1),
      `wear ${w-1}→${w} で確率が増えていない。段に戻っている`);
  }
});

section('A-2. 門より下では起きない / 単調増加 / 1を超えない', () => {
  const start = RETIRE_CFG.quietExit.startWear;
  for (let w = 0; w < start; w++) assert.strictEqual(quietExitChance(w), 0, `wear ${w} で0でない`);
  for (let w = 0; w <= 200; w++) {
    const p = quietExitChance(w);
    assert.ok(p >= 0 && p <= 1, `wear ${w} の確率が範囲外: ${p}`);
  }
  assert.ok(quietExitChance(79) > quietExitChance(40) * 3, '深いほうが十分に高くない');
});

section('A-3. ⚠衰え(20)が出た年に engine が引退させない（型E を殺さない）', () => {
  // 社長が引導を渡す余地を残す。20〜39 の帯で engine 主導の引退が起きてはいけない
  for (let w = 20; w < 40; w++) {
    assert.strictEqual(quietExitChance(w), 0,
      `wear ${w} で engine が引退させている。プレイヤーが決める前にさらってしまう`);
  }
});

section('A-4. 壊れた入力で落ちない', () => {
  [undefined, null, NaN, -10, 'abc'].forEach(v => {
    const p = quietExitChance(v);
    assert.ok(Number.isFinite(p) && p >= 0, `quietExitChance(${String(v)}) が壊れている`);
  });
});

// ─────────────────────────────────────────────────────────────
// B. 燃え尽きるまで（花道）
// ─────────────────────────────────────────────────────────────

section('B-1. 花道の設定表がある', () => {
  const ft = RETIRE_CFG.farewellTour;
  assert.ok(ft, 'farewellTour が無い');
  ['maxPerSeason', 'minPopularity', 'orTitleWins', 'minAge'].forEach(k =>
    assert.ok(ft[k] != null, `${k} が無い`));
  assert.ok(ft.maxPerSeason >= 1 && ft.maxPerSeason <= 3,
    `年 ${ft.maxPerSeason} 名は配りすぎ。スポットライトは巡るもの`);
});

section('B-2. エンジン側の入口が配線されている', () => {
  assert.ok(/farewellTour/.test(management), 'farewellTour を読んでいない');
  assert.ok(/lastRun: true, lastRunWeek: startAbs/.test(management),
    '季末の引退判定から lastRun を立てる経路が無い');
});

section('B-3. 花道に回した選手は、その年の引退者から外れる', () => {
  // 二重に処理すると「花道に出たのに、その年に引退済み」になる
  const at = management.indexOf('B「燃え尽きるまで」');
  assert.ok(at > 0, 'B の実装ブロックが見つからない');
  const body = management.slice(at, at + 1800);
  assert.ok(/retirees = retirees\.filter\(c => !sentIds\.has\(c\.id\)\)/.test(body),
    '引退者リストから外していない。二重処理になる');
});

// ─────────────────────────────────────────────────────────────
// C. 壮絶な幕切れ
// ─────────────────────────────────────────────────────────────

section('C-1. 門(消耗40)より下では絶対に起きない', () => {
  const min = RETIRE_CFG.careerEnding.minWear;
  assert.strictEqual(min, 40, `門が ${min}。実測で25は「⚠衰えが出たその年」で早すぎた`);
  ['undercard', 'main', 'title', 'special', 'summit'].forEach(st => {
    for (let w = 0; w < min; w++) {
      assert.strictEqual(careerEndingChance({ wear: w }, st), 0,
        `wear ${w} / ${st} で起きてしまう。無傷の若手がいきなり壊れるのは理不尽`);
    }
  });
});

section('C-2. 舞台が大きいほど起きやすい', () => {
  const f = { wear: 50 };
  const order = ['undercard', 'main', 'title', 'special', 'summit'];
  for (let i = 1; i < order.length; i++) {
    assert.ok(careerEndingChance(f, order[i]) >= careerEndingChance(f, order[i - 1]),
      `${order[i-1]} より ${order[i]} が低い。大舞台のほうが映える、に反する`);
  }
  assert.ok(careerEndingChance(f, 'undercard') < careerEndingChance(f, 'summit'),
    '前座と頂上が同じ。旧実装（舞台を見ない）に戻っている');
});

section('C-3. 消耗が深いほど上がるが、**急峻でない**', () => {
  const p40 = careerEndingChance({ wear: 40 }, 'main');
  const p79 = careerEndingChance({ wear: 79 }, 'main');
  assert.ok(p79 > p40, '消耗が深くても上がらない');
  assert.ok(p79 < p40 * 4,
    `40→79 で ${(p79/p40).toFixed(1)}倍。急峻すぎる。「壊れて当然」になると事故ではなく必然になる`);
});

section('C-4. 若い頃の無理が上乗せされる', () => {
  const clean = careerEndingChance({ wear: 50, intensiveWeeksTotal: 0 }, 'main');
  const burnt = careerEndingChance({ wear: 50, intensiveWeeksTotal: 200 }, 'main');
  assert.ok(burnt > clean, '追い込み漬けの選手が壊れやすくなっていない');
  assert.ok(burnt <= clean * RETIRE_CFG.careerEnding.strainMaxMult + 1e-9, '上乗せが上限を超えている');
});

section('C-5. 上限がある（大舞台でも確率が暴走しない）', () => {
  const max = RETIRE_CFG.careerEnding.maxProb;
  assert.ok(max > 0 && max <= 0.35, `上限 ${max} が高すぎる`);
  const p = careerEndingChance({ wear: 999, intensiveWeeksTotal: 9999 }, 'summit');
  assert.ok(p <= max + 1e-9, `上限を超えている: ${p}`);
});

section('C-6. 両方の経路が新しい規則を使っている（自団体/AI団体）', () => {
  const hits = management.match(/careerEndingChance\(/g) || [];
  assert.ok(hits.length >= 2,
    `careerEndingChance の呼び出しが ${hits.length} 箇所。自団体とAI団体の両方で使うこと`);
  assert.ok(!/wear >= 40 \? 0\.065 : 0\.025/.test(management),
    '旧実装（舞台を見ない2段）が残っている');
});

section('C-7. 舞台の格が試合から渡っている', () => {
  assert.ok(/_stageOf/.test(management), '舞台を決めるヘルパーが無い');
  assert.ok(/isTitleMatch.*'title'/.test(management) || /'title'/.test(management),
    '王座戦が舞台として扱われていない');
});

// ─────────────────────────────────────────────────────────────
// D-1. 力が尽きた（ピーク基準）
// ─────────────────────────────────────────────────────────────

section('D-1. しきい値が decayFloor より上（でないと永久に発動しない）', () => {
  const th = RETIRE_CFG.peakDropThreshold;
  assert.ok(th != null, 'peakDropThreshold が無い');
  assert.ok(th > RETIRE_CFG.decayFloor,
    `しきい値 ${th} が衰退の下限 ${RETIRE_CFG.decayFloor} 以下。` +
    'これが原因で8年間一度も発動していなかった（2026-07-26 発見）');
});

section('D-2. 判定が「持ち味」ではなく「ピークOVR」を見る', () => {
  const at = management.indexOf('checkRetirement(rng, fighter)');
  const body = management.slice(at, at + 1600);
  assert.ok(/peakOVR/.test(body), 'ピークOVR を見ていない');
  assert.ok(!/notionOvr \* RETIRE_CFG\.voluntaryThreshold/.test(body),
    '持ち味基準のまま。ピーク90の選手と素の値70の選手を同じ物差しで測っている');
});

section('D-3. ピークから落ちた選手が実際に引退する', () => {
  const f = { pw: 60, sp: 60, te: 60, st: 60, mn: 60, age: 26, wear: 10,
              careerRecord: { peakOVR: 90 }, lowPerformanceSeasons: 0 };
  let retired = false;
  for (let i = 0; i < RETIRE_CFG.voluntarySeasons + 2; i++) {
    if (Engine.rival.checkRetirement(Engine.rng.create(1), f)) { retired = true; break; }
  }
  assert.ok(retired, `ピーク90→現在60でも引退しない。しきい値 ${RETIRE_CFG.peakDropThreshold} が緩すぎる`);
});

section('D-4. ピークを保っている選手は、この経路では引退しない', () => {
  const f = { pw: 88, sp: 88, te: 88, st: 88, mn: 88, age: 24, wear: 0,
              careerRecord: { peakOVR: 90 }, lowPerformanceSeasons: 0 };
  for (let i = 0; i < 5; i++) {
    assert.ok(!Engine.rival.checkRetirement(Engine.rng.create(i + 1), f),
      '力を保っているのに引退した');
  }
});

// ─────────────────────────────────────────────────────────────
// 全体
// ─────────────────────────────────────────────────────────────

section('全-1. 設定は data.js の表にある（実装にベタ書きしない）', () => {
  ['quietExit', 'farewellTour', 'careerEnding', 'peakDropThreshold'].forEach(k =>
    assert.ok(RETIRE_CFG[k] != null, `RETIRE_CFG.${k} が無い`));
});

section('全-2. 確定引退(消耗80)は残っている', () => {
  const f = { pw: 50, sp: 50, te: 50, st: 50, mn: 50, age: 25, wear: 85,
              careerRecord: { peakOVR: 50 } };
  assert.ok(Engine.rival.checkRetirement(Engine.rng.create(1), f), '消耗80でも引退しない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (18 sections)');
