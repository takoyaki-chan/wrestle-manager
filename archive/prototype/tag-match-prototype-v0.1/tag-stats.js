#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Tag Match Statistics — 1000試合バッチ統計
//  Usage: node tag-stats.js [試合数] [シード]
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

// ── ソースコードをグローバルスコープで実行 ──
const protoDir = __dirname;

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(protoDir, filename), 'utf-8');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('wm-data.js');
loadAsGlobal('wm-engine.js');
loadAsGlobal('tag-data.js');
loadAsGlobal('tag-engine.js');

if (typeof Engine === 'undefined') { console.error('ERROR: Engine missing'); process.exit(1); }
if (typeof TagEngine === 'undefined') { console.error('ERROR: TagEngine missing'); process.exit(1); }
if (typeof ALL_CHARS === 'undefined') { console.error('ERROR: ALL_CHARS missing'); process.exit(1); }

// ── パラメータ ──
const args = process.argv.slice(2);
const N = parseInt(args[0], 10) || 1000;
const baseSeed = args[1] ? parseInt(args[1], 10) : 42;

// ── 統計コレクター ──
const turnsList = [];
const segsList = [];
const mqList = [];
const mqDetailList = [];
const finishTurnList = [];        // 決着ターン
const finishHpList = [];          // 決着時4人のHP残量 [{a1,a2,b1,b2}]
const finishMethodCounts = {};    // 決着手段カウント
const finishPhaseCounts = {};

// タッチ
let touchTotal = 0;
let touchAttempts = 0;            // want→判定に入った回数（ログから推定）
const touchTypeCounts = { tactical: 0, exhaustion: 0, hotTag: 0, failed: 0 };

// ドラマ
const dramaMatchCounts = { doubleTeam: 0, friendlyFire: 0, betrayal: 0, cutinSave: 0, hotTag: 0 };
const dramaEventCounts = { doubleTeam: 0, friendlyFire: 0, betrayal: 0, cutinSave: 0, hotTag: 0 };
let cutinAttempts = 0;  // カットイン判定が入った回数
let cutinSuccesses = 0; // カットイン成功回数
let finisherAttempts = 0; // HP<=0になった回数(決着含む)

let crashes = 0;

// ── シミュレーション ──
console.log(`=== Tag Match Statistics (N=${N}, seed=${baseSeed}) ===\n`);

const rng = Engine.rng.create(baseSeed);
const chars = ALL_CHARS.filter(c => c.id > 0);

for (let i = 0; i < N; i++) {
  const pool = [...chars];
  const pick = () => pool.splice(Engine.rng.int(rng, 0, pool.length - 1), 1)[0];
  const f1 = pick(), f2 = pick(), f3 = pick(), f4 = pick();

  const matchRng = Engine.rng.create(Engine.rng.derive(baseSeed, i, f1.id, f2.id, f3.id, f4.id));
  const bondA = Engine.rng.int(rng, 20, 90);
  const bondB = Engine.rng.int(rng, 20, 90);
  const tagExpA = Engine.rng.int(rng, 0, 20);
  const tagExpB = Engine.rng.int(rng, 0, 20);

  let result;
  try {
    result = TagEngine.simulateTagMatch(
      { fighter1: f1, fighter2: f2 },
      { fighter1: f3, fighter2: f4 },
      matchRng,
      { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB }
    );
  } catch (e) {
    crashes++;
    continue;
  }

  // ── 1. 試合の長さ ──
  turnsList.push(result.turns);
  segsList.push(result.segments.length);

  // ── 2. 決着タイミング ──
  finishTurnList.push(result.turns);

  const pf = result.perFighter;
  const ids = [f1.id, f2.id, f3.id, f4.id];
  const hps = ids.map(id => pf[id] ? pf[id].hpFinal : 0);
  finishHpList.push(hps);

  // 決着手段: 個人技 vs タッグ技 vs その他
  let finCategory;
  if (result.finType === 'HP判定') {
    finCategory = 'HP判定(時間切れ)';
  } else if (result.finType === '丸め込み') {
    finCategory = '丸め込み';
  } else if (result.postMatchFlags.doubleTeamFinishFlag) {
    finCategory = '汎用タッグ技';
  } else {
    finCategory = '個人技(' + result.finType + ')';
  }
  finishMethodCounts[finCategory] = (finishMethodCounts[finCategory] || 0) + 1;
  finishPhaseCounts[result.finishPhase || 'unknown'] = (finishPhaseCounts[result.finishPhase || 'unknown'] || 0) + 1;

  // ── 3. タッチ関連 ──
  // 成功タッチ: segments (最後のfinish/timeoutを除く)
  for (const seg of result.segments) {
    if (seg.touchType && seg.touchType !== 'finish' && seg.touchType !== 'timeout') {
      touchTotal++;
      if (touchTypeCounts[seg.touchType] != null) {
        touchTypeCounts[seg.touchType]++;
      }
    }
  }
  // ログから失敗タッチを数える
  for (const line of result.log) {
    if (line.includes('タッチ失敗')) touchTypeCounts.failed++;
  }

  // ── 4. ドラマイベント ──
  const typesInMatch = new Set();
  for (const d of result.dramaSummary) {
    if (dramaEventCounts[d.type] != null) {
      dramaEventCounts[d.type]++;
    }
    typesInMatch.add(d.type);
  }
  for (const t of typesInMatch) {
    if (dramaMatchCounts[t] != null) dramaMatchCounts[t]++;
  }

  // カットイン詳細: ログ解析
  // HP<=0 or ピン成功 → "カットイン判定が入った" 回数
  // "カットイン" を含むログ行 → 成功
  // "キックアウト" → フィニッシャー試行だがカットイン前に返した
  for (const line of result.log) {
    if (line.includes('カットイン！')) cutinSuccesses++;
    if (line.includes('カットイン！') || line.includes('見殺し')) cutinAttempts++;
  }
  // HP<=0が起きた回数（≒フィニッシャー到達）
  for (const line of result.log) {
    if (line.includes('★ 決着') || line.includes('★ ピン成功') || line.includes('★ タッグ技で決着')
        || line.includes('キックアウト') || line.includes('ロープエスケープ')
        || line.includes('カットイン！') || line.includes('見殺し')
        || line.includes('丸め込みで逆転')) {
      finisherAttempts++;
    }
  }

  // ── 5. MQ ──
  mqList.push(result.mq);
  mqDetailList.push(result.mqDetail);
}

const total = turnsList.length;
if (crashes > 0) console.log(`⚠ Crashes: ${crashes}\n`);

// ══════════════════════════════════════════════════════════════════════
//  統計ユーティリティ
// ══════════════════════════════════════════════════════════════════════

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const variance = sorted.reduce((s, v) => s + (v - avg) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  return { avg, median, sd, min: sorted[0], max: sorted[n - 1], n };
}

function histogram(arr, binSize, label) {
  const bins = {};
  for (const v of arr) {
    const bin = Math.floor(v / binSize) * binSize;
    bins[bin] = (bins[bin] || 0) + 1;
  }
  const keys = Object.keys(bins).map(Number).sort((a, b) => a - b);
  const maxCount = Math.max(...Object.values(bins));
  const barWidth = 40;

  console.log(`  ${label} (bin=${binSize}):`);
  for (const k of keys) {
    const count = bins[k];
    const pct = (count / arr.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / maxCount * barWidth));
    const rangeLabel = `${k}-${k + binSize - 1}`.padStart(7);
    console.log(`    ${rangeLabel}: ${bar} ${count} (${pct}%)`);
  }
}

function pct(v, t) { return (v / t * 100).toFixed(1); }
function fmt(v) { return typeof v === 'number' ? v.toFixed(1) : v; }

// ══════════════════════════════════════════════════════════════════════
//  出力
// ══════════════════════════════════════════════════════════════════════

console.log('━'.repeat(60));
console.log('  1. 試合の長さ');
console.log('━'.repeat(60));

const turnSt = stats(turnsList);
console.log(`  総ターン数:`);
console.log(`    平均: ${fmt(turnSt.avg)}  中央値: ${fmt(turnSt.median)}  SD: ${fmt(turnSt.sd)}  最小: ${turnSt.min}  最大: ${turnSt.max}`);
console.log('');
histogram(turnsList, 5, 'ターン数分布');

console.log('');
const segSt = stats(segsList);
console.log(`  セグメント数:`);
console.log(`    平均: ${fmt(segSt.avg)}  最小: ${segSt.min}  最大: ${segSt.max}`);

// 1セグメントあたり平均ターン数
const segTurnsAll = [];
for (let i = 0; i < turnsList.length; i++) {
  segTurnsAll.push(turnsList[i] / segsList[i]);
}
const segTurnSt = stats(segTurnsAll);
console.log(`  1セグメントあたり平均ターン: ${fmt(segTurnSt.avg)} (SD: ${fmt(segTurnSt.sd)})`);

console.log('');
console.log('━'.repeat(60));
console.log('  2. 決着タイミング');
console.log('━'.repeat(60));

console.log(`  決着ターン: 平均 ${fmt(turnSt.avg)}  最小 ${turnSt.min}  最大 ${turnSt.max}`);
console.log('');

// 決着時HP残量
const avgHps = [0, 0, 0, 0];
for (const hps of finishHpList) {
  for (let j = 0; j < 4; j++) avgHps[j] += hps[j];
}
console.log(`  決着時4選手HP残量(平均):`);
console.log(`    TeamA-1: ${fmt(avgHps[0] / total)}  TeamA-2: ${fmt(avgHps[1] / total)}`);
console.log(`    TeamB-1: ${fmt(avgHps[2] / total)}  TeamB-2: ${fmt(avgHps[3] / total)}`);
console.log('');

console.log(`  決着手段の内訳:`);
const sortedMethods = Object.entries(finishMethodCounts).sort((a, b) => b[1] - a[1]);
for (const [method, count] of sortedMethods) {
  console.log(`    ${method.padEnd(20)} ${count.toString().padStart(5)} (${pct(count, total)}%)`);
}
console.log('');

console.log(`  決着フェーズ:`);
const sortedPhases = Object.entries(finishPhaseCounts).sort((a, b) => b[1] - a[1]);
for (const [phase, count] of sortedPhases) {
  console.log(`    ${phase.padEnd(12)} ${count.toString().padStart(5)} (${pct(count, total)}%)`);
}

console.log('');
console.log('━'.repeat(60));
console.log('  3. タッチ関連');
console.log('━'.repeat(60));

const touchSuccessTotal = touchTypeCounts.tactical + touchTypeCounts.exhaustion + touchTypeCounts.hotTag;
const touchAttemptTotal = touchSuccessTotal + touchTypeCounts.failed;
console.log(`  タッチ発生: 平均 ${fmt(touchSuccessTotal / total)}/試合  (成功${touchSuccessTotal} + 失敗${touchTypeCounts.failed} = 試行${touchAttemptTotal})`);
console.log(`  タッチ成功率: ${pct(touchSuccessTotal, Math.max(touchAttemptTotal, 1))}%`);
console.log('');
console.log(`  種類別内訳:`);
console.log(`    戦術タッチ:   ${touchTypeCounts.tactical.toString().padStart(5)} (${pct(touchTypeCounts.tactical, Math.max(touchSuccessTotal, 1))}% of success)`);
console.log(`    消耗タッチ:   ${touchTypeCounts.exhaustion.toString().padStart(5)} (${pct(touchTypeCounts.exhaustion, Math.max(touchSuccessTotal, 1))}%)`);
console.log(`    ホットタグ:   ${touchTypeCounts.hotTag.toString().padStart(5)} (${pct(touchTypeCounts.hotTag, Math.max(touchSuccessTotal, 1))}%)`);
console.log(`    失敗:         ${touchTypeCounts.failed.toString().padStart(5)}`);

console.log('');
console.log('━'.repeat(60));
console.log('  4. ドラマイベント');
console.log('━'.repeat(60));

console.log(`  ${'イベント'.padEnd(16)} ${'発生試合%'.padStart(8)} ${'平均回数/試合'.padStart(12)}`);
console.log(`  ${'─'.repeat(40)}`);
const dramaOrder = ['doubleTeam', 'friendlyFire', 'cutinSave', 'hotTag', 'betrayal'];
const dramaNames = {
  doubleTeam: 'ダブルチーム',
  friendlyFire: '同士討ち',
  cutinSave: 'カットイン',
  hotTag: 'ホットタグ',
  betrayal: '見殺し',
};
for (const key of dramaOrder) {
  const matchPct = pct(dramaMatchCounts[key], total);
  const avgPerMatch = fmt(dramaEventCounts[key] / total);
  console.log(`  ${(dramaNames[key] || key).padEnd(16)} ${matchPct.padStart(7)}% ${avgPerMatch.padStart(11)}`);
}

console.log('');
console.log(`  カットイン詳細:`);
console.log(`    フィニッシャー級到達(HP≤0等): ${finisherAttempts}`);
console.log(`    カットイン判定回数:           ${cutinAttempts}`);
console.log(`    カットイン成功回数:           ${cutinSuccesses}`);

// ホットタグバフ
let hotTagBuffCount = 0;
// (ログから "気迫バフ発動" を数える — 試合データに直接はない)
// 再度走査は重いのでdramaEventCountsのhotTagからバフ確率で推定
// → 実際にはhotTagBuffChance=0.22なので概算
console.log(`  ホットタグバフ: 発動率は設定値 ${(TAG_MATCH_CONFIG.touch.hotTagBuffChance * 100).toFixed(0)}% (ホットタグ${dramaEventCounts.hotTag}回中 推定${Math.round(dramaEventCounts.hotTag * TAG_MATCH_CONFIG.touch.hotTagBuffChance)}回)`);

console.log('');
console.log('━'.repeat(60));
console.log('  5. MQ');
console.log('━'.repeat(60));

const mqSt = stats(mqList);
console.log(`  平均: ${fmt(mqSt.avg)}  SD: ${fmt(mqSt.sd)}  最小: ${mqSt.min}  最大: ${mqSt.max}`);
console.log('');
histogram(mqList, 10, 'MQ分布');

// MQ内訳の平均
console.log('');
console.log(`  MQ内訳(平均):`);
const detailKeys = ['ceiling', 'dramaPenalty', 'pacingPenalty', 'finishPenalty', 'screenTimeBonus', 'touchDiversityBonus', 'dramaEventBonus', 'finishBonus', 'longSegPenalty', 'screenTimePenalty'];
const detailLabels = {
  ceiling: 'Ceiling(OVR天井)',
  dramaPenalty: 'ドラマペナ',
  pacingPenalty: 'ペーシングペナ',
  finishPenalty: 'フィニッシュペナ',
  screenTimeBonus: '見せ場分配ボーナス',
  touchDiversityBonus: 'タッチ多様性ボーナス',
  dramaEventBonus: 'ドラマイベントボーナス',
  finishBonus: 'フィニッシュボーナス',
  longSegPenalty: '長セグメントペナ',
  screenTimePenalty: '出番偏りペナ',
};
for (const key of detailKeys) {
  const avg = mqDetailList.reduce((s, d) => s + (d[key] || 0), 0) / total;
  const sign = key.includes('Penalty') || key.includes('ペナ') ? '-' : key.includes('Bonus') || key.includes('ボーナス') ? '+' : '';
  console.log(`    ${(detailLabels[key] || key).padEnd(24)} ${sign}${fmt(Math.abs(avg))}`);
}

console.log('');
console.log('━'.repeat(60));
console.log(`  完了: ${total}試合 / ${crashes}クラッシュ`);
console.log('━'.repeat(60));
