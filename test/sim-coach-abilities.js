#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  コーチ能力 数値決定シミュレーション
//  現行エンジンの関数を使い、各能力パラメータ候補を比較する
//
//  Usage: node test/sim-coach-abilities.js <SIM番号> [シーズン数] [シード数]
//  Example: node test/sim-coach-abilities.js 1       (SIM-1, 10seeds×10seasons)
//           node test/sim-coach-abilities.js 1 10 10 (same)
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

if (typeof Engine === 'undefined' || typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: Engine/ALL_CHARS が読み込めません');
  process.exit(1);
}

// ── 共通ユーティリティ ──
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function fmt(n) { return n.toFixed(2); }

const args = process.argv.slice(2);
const simNum = parseInt(args[0], 10) || 1;
const numSeasons = parseInt(args[1], 10) || 10;
const numSeeds = parseInt(args[2], 10) || 10;

console.log(`\n${'='.repeat(60)}`);
console.log(`  SIM-${simNum} シミュレーション (${numSeeds} seeds × ${numSeasons} seasons = ${numSeeds * numSeasons} total)`);
console.log(`${'='.repeat(60)}\n`);

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-1: 延命術 — wear蓄積をどの程度抑えれば「早熟スターの寿命+2〜3年」か
// ══════════════════════════════════════════════════════════════════════════════
function runSim1() {
  // テストキャラ群: 様々なdurability・特性を持つ選手を生成
  // 早熟8名 + 通常8名 + 晩成4名 = 20名で統計を取る
  const charTemplates = [];
  const baseStats = { pw: 70, sp: 70, te: 70, st: 70, mn: 60 };
  const basePot = { pw: 90, sp: 90, te: 90, st: 90, mn: 70 };

  for (let i = 0; i < 8; i++) {
    charTemplates.push({ id: 1000 + i, name: `早熟${i}`, traits: ['早熟'], ...baseStats, pot: basePot, style: 'Allround' });
  }
  for (let i = 0; i < 8; i++) {
    charTemplates.push({ id: 1100 + i, name: `通常${i}`, traits: [], ...baseStats, pot: basePot, style: 'Allround' });
  }
  for (let i = 0; i < 4; i++) {
    charTemplates.push({ id: 1200 + i, name: `晩成${i}`, traits: ['晩成'], ...baseStats, pot: basePot, style: 'Allround' });
  }

  const scenarios = [
    { label: 'ベースライン (能力なし)', wearMul: 1.0, wearCap: Infinity },
    { label: 'A: wear -30%',            wearMul: 0.7, wearCap: Infinity },
    { label: 'B: wear -50%',            wearMul: 0.5, wearCap: Infinity },
    { label: 'C: 年間wear上限8',         wearMul: 1.0, wearCap: 8 },
  ];

  for (const scenario of scenarios) {
    const results = { all: [], souzyuku: [], normal: [], bansei: [] };
    const wear40Ages = { all: [], souzyuku: [], normal: [], bansei: [] };
    const wear80Ages = { all: [], souzyuku: [], normal: [], bansei: [] };

    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);

      // キャラ生成（全員17歳スタート）
      const chars = charTemplates.map(t => {
        const durRng = Engine.rng.create(Engine.rng.derive(seed * 7919, t.id, 999));
        const durability = Engine.career.generateDurability(durRng);
        return {
          id: t.id, name: t.name, traits: t.traits,
          age: 17, wear: 0, durability,
          wins: 0, losses: 0, draws: 0,
          careerSeasons: 0, seasonInjuries: 0, intensiveWeeks: 0,
          notionValue: { pw: t.pw, sp: t.sp, te: t.te, st: t.st, mn: t.mn },
          pw: t.pw, sp: t.sp, te: t.te, st: t.st, mn: t.mn,
          pot: t.pot,
          retired: false, retireAge: null,
          wear40Age: null, wear80Age: null,
        };
      });

      // シーズンループ
      for (let season = 1; season <= numSeasons; season++) {
        for (const c of chars) {
          if (c.retired) continue;

          // 年齢加算
          c.age++;
          c.careerSeasons++;

          // 試合数シミュレーション（年間約30試合）
          c.wins += 15; c.losses += 12; c.draws += 3;
          // 怪我回数（平均0.5回/シーズン）
          c.seasonInjuries = Engine.rng.float(rng) < 0.5 ? 1 : 0;
          c.intensiveWeeks = Engine.rng.int(rng, 4, 10);

          // wear蓄積（applySeasonEndのロジックを再現）
          const decayStartAge = 23 + (c.durability || 0);
          if (c.age >= decayStartAge) {
            const baseWear = 10 + Engine.rng.int(rng, -3, 3);
            let wearBonus = 0;
            const avgMatches = Math.round((c.wins + c.losses + c.draws) / c.careerSeasons);
            if (avgMatches >= 40) wearBonus += 3;
            wearBonus += (c.seasonInjuries || 0) * 2;
            if ((c.intensiveWeeks || 0) >= 12) wearBonus += 2;
            wearBonus -= (c.durability || 0);
            let finalWear = Math.max(1, baseWear + wearBonus);

            // ★ 延命術の効果適用
            finalWear = Math.round(finalWear * scenario.wearMul);
            finalWear = Math.min(finalWear, scenario.wearCap);
            finalWear = Math.max(1, finalWear); // 最低1は蓄積

            c.wear += finalWear;
          }

          // wear閾値到達記録
          if (c.wear >= 40 && c.wear40Age === null) c.wear40Age = c.age;
          if (c.wear >= 80 && c.wear80Age === null) c.wear80Age = c.age;

          // 引退判定（checkRetirementのロジックを再現）
          if (c.wear >= 80) { c.retired = true; c.retireAge = c.age; continue; }

          let retireChance = 0;
          if (c.wear >= 60) retireChance = 0.50;
          else if (c.wear >= 40) retireChance = 0.20;
          const ageChances = { 30: 0.15, 31: 0.40, 32: 0.75, 33: 1.00 };
          if (ageChances[c.age] != null) retireChance = Math.max(retireChance, ageChances[c.age]);
          else if (c.age >= 33) retireChance = 1.0;

          if (retireChance > 0 && Engine.rng.float(rng) < retireChance) {
            c.retired = true; c.retireAge = c.age;
          }

          c.seasonInjuries = 0;
        }
      }

      // 未引退は最終年齢を記録（打ち切り）
      for (const c of chars) {
        if (!c.retired) c.retireAge = c.age;

        const category = c.traits.includes('早熟') ? 'souzyuku'
          : c.traits.includes('晩成') ? 'bansei' : 'normal';
        results.all.push(c.retireAge);
        results[category].push(c.retireAge);
        if (c.wear40Age) { wear40Ages.all.push(c.wear40Age); wear40Ages[category].push(c.wear40Age); }
        if (c.wear80Age) { wear80Ages.all.push(c.wear80Age); wear80Ages[category].push(c.wear80Age); }
      }
    }

    // 結果出力
    console.log(`── ${scenario.label} ──`);
    console.log(`  引退年齢  全体: ${fmt(mean(results.all))} (σ=${fmt(std(results.all))})  早熟: ${fmt(mean(results.souzyuku))}  通常: ${fmt(mean(results.normal))}  晩成: ${fmt(mean(results.bansei))}  `);
    console.log(`  wear40到達 全体: ${fmt(mean(wear40Ages.all))} (n=${wear40Ages.all.length})  早熟: ${fmt(mean(wear40Ages.souzyuku))}  通常: ${fmt(mean(wear40Ages.normal))}  晩成: ${fmt(mean(wear40Ages.bansei))}`);
    console.log(`  wear80到達 全体: ${fmt(mean(wear80Ages.all))} (n=${wear80Ages.all.length})  早熟: ${fmt(mean(wear80Ages.souzyuku))}  通常: ${fmt(mean(wear80Ages.normal))}  晩成: ${fmt(mean(wear80Ages.bansei))}`);
    console.log();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-2: 限界突破 — trainCapに上乗せした時の最終OVR変化
// ══════════════════════════════════════════════════════════════════════════════
function runSim2() {
  const scenarios = [
    { label: 'ベースライン (能力なし)', capBonus: 0 },
    { label: 'A: trainCap +3',          capBonus: 3 },
    { label: 'B: trainCap +5',          capBonus: 5 },
    { label: 'C: trainCap +4',          capBonus: 4 },
  ];

  // 追加シナリオ: つけっぱなし vs 途中で外した場合
  const attachModes = [
    { label: 'つけっぱなし', detachSeason: Infinity },
    { label: 'シーズン5で外す', detachSeason: 5 },
  ];

  const charTemplate = {
    pw: 70, sp: 70, te: 70, st: 70, mn: 60,
    pot: { pw: 95, sp: 95, te: 95, st: 95, mn: 75 },
    style: 'Allround', traits: [],
  };

  for (const scenario of scenarios) {
    for (const mode of attachModes) {
      if (scenario.capBonus === 0 && mode.detachSeason !== Infinity) continue; // ベースラインは1パターンのみ

      const ovrResults = [];
      const statResults = { pw: [], sp: [], te: [], st: [] };
      const capReachSeasons = [];

      for (let seed = 1; seed <= numSeeds; seed++) {
        const rng = Engine.rng.create(seed * 7919);
        const capRng = Engine.rng.create(Engine.rng.derive(seed * 7919, 2000, 555));

        // trainCap生成
        const baseCap = {};
        ['pw', 'sp', 'te', 'st'].forEach(s => {
          const factor = 0.55 + Engine.rng.float(capRng) * (0.80 - 0.55);
          baseCap[s] = Math.round(factor * charTemplate.pot[s]);
        });

        const char = {
          pw: Math.round(charTemplate.pw * 0.45), // 17歳初期値
          sp: Math.round(charTemplate.sp * 0.45),
          te: Math.round(charTemplate.te * 0.45),
          st: Math.round(charTemplate.st * 0.45),
          mn: charTemplate.mn,
          age: 17, traits: charTemplate.traits,
          trainCap: { ...baseCap },
          style: charTemplate.style,
        };

        let capReached = null;

        for (let season = 1; season <= numSeasons; season++) {
          char.age++;

          // コーチ効果: trainCapに上乗せ（or 外す）
          const activeBonus = (season <= mode.detachSeason) ? scenario.capBonus : 0;
          const effectiveCap = {};
          ['pw', 'sp', 'te', 'st'].forEach(s => {
            effectiveCap[s] = baseCap[s] + activeBonus;
          });

          // 週次成長シミュレーション（48週、うち約36週練習）
          for (let week = 1; week <= 36; week++) {
            const ageMul = ageMultiplier(char.age, char.traits);
            if (ageMul <= 0) break;

            // pickGrowthStat
            const weights = [0.25, 0.25, 0.25, 0.25]; // Allround
            const stats = ['pw', 'sp', 'te', 'st'];
            const r = Engine.rng.float(rng);
            let cumulative = 0, stat = 'st';
            for (let i = 0; i < stats.length; i++) {
              cumulative += weights[i];
              if (r < cumulative) { stat = stats[i]; break; }
            }

            const current = char[stat];
            const cap = effectiveCap[stat];
            if (current >= cap) continue;

            const remaining = cap - current;
            const ratio = remaining / cap;
            const baseGain = 3.0 * ratio * ageMul * 1.0; // coachMul=1.0
            const variance = 0.5 + Engine.rng.float(rng) * 1.0;
            const gain = Math.max(0, Math.round(baseGain * variance * 10) / 10);
            char[stat] = Math.min(cap, char[stat] + gain);
          }

          // trainCap到達チェック（全ステが基本capの95%超）
          if (!capReached) {
            const allNear = ['pw', 'sp', 'te', 'st'].every(s => char[s] >= baseCap[s] * 0.95);
            if (allNear) capReached = season;
          }
        }

        // 外した後は基本capを超えた分をクランプ
        if (mode.detachSeason < Infinity) {
          ['pw', 'sp', 'te', 'st'].forEach(s => {
            // 「外したらcapが戻る＝超過分は以降の成長天井が元に戻る」
            // ただし即座にステは下がらない（設計: 外しても即座に下がるわけではない）
          });
        }

        const ovr = Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5);
        ovrResults.push(ovr);
        ['pw', 'sp', 'te', 'st'].forEach(s => statResults[s].push(char[s]));
        if (capReached) capReachSeasons.push(capReached);
      }

      const labelFull = scenario.capBonus === 0 ? scenario.label : `${scenario.label} (${mode.label})`;
      console.log(`── ${labelFull} ──`);
      console.log(`  最終OVR: ${fmt(mean(ovrResults))} (σ=${fmt(std(ovrResults))})`);
      console.log(`  最終ステ: PW=${fmt(mean(statResults.pw))} SP=${fmt(mean(statResults.sp))} TE=${fmt(mean(statResults.te))} ST=${fmt(mean(statResults.st))}`);
      console.log(`  trainCap到達シーズン: ${capReachSeasons.length > 0 ? fmt(mean(capReachSeasons)) : 'N/A'} (n=${capReachSeasons.length}/${numSeeds})`);
      console.log();
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-8: ステ特化 — 練習選択率UP方式（対象ステの選択重みを倍率で増加）
//  評価指標: S1〜S3各シーズン末の対象ステ値推移 + 他ステとの差 + trainCap到達タイミング
// ══════════════════════════════════════════════════════════════════════════════
function runSim8() {
  const scenarios = [
    { label: 'ベースライン (能力なし)', selectMul: 1.0 },
    { label: 'A: 練習選択率 ×1.40',    selectMul: 1.40 },
    { label: 'B: 練習選択率 ×1.50',    selectMul: 1.50 },
    { label: 'C: 練習選択率 ×1.60',    selectMul: 1.60 },
  ];

  const targetStat = 'pw'; // PW特化で検証
  const trackSeasons = Math.min(numSeasons, 10); // S1〜最大S10を追跡

  const charTemplate = {
    pw: 70, sp: 70, te: 70, st: 70, mn: 60,
    pot: { pw: 95, sp: 95, te: 95, st: 95, mn: 75 },
  };

  // Allround + Striker の2スタイルで検証
  const styles = [
    { label: 'Allround', weights: [0.25, 0.25, 0.25, 0.25] },
    { label: 'Striker',  weights: [0.35, 0.35, 0.15, 0.15] },
  ];

  const statNames = ['pw', 'sp', 'te', 'st'];
  const targetIdx = statNames.indexOf(targetStat);

  for (const style of styles) {
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`◆ ${style.label} スタイル (${targetStat.toUpperCase()}特化検証)`);
    console.log(`${'━'.repeat(60)}`);

    // ベースラインの時系列データを保持（差分計算用）
    const baselineTimeline = {};  // season -> { pw, sp, te, st }

    for (const scenario of scenarios) {
      // シーズンごとの時系列データ蓄積
      const timeline = {};  // season -> { pw:[], sp:[], te:[], st:[] }
      for (let s = 1; s <= trackSeasons; s++) {
        timeline[s] = { pw: [], sp: [], te: [], st: [] };
      }
      const capReachSeasons = [];  // 対象ステがtrainCapの95%に到達したシーズン
      const targetSelectCount = [];  // 対象ステが選ばれた回数（全シーズン通算）
      const totalSelectCount = [];   // 総練習回数

      for (let seed = 1; seed <= numSeeds; seed++) {
        const rng = Engine.rng.create(seed * 7919);
        const capRng = Engine.rng.create(Engine.rng.derive(seed * 7919, 3000, 555));

        const baseCap = {};
        statNames.forEach(s => {
          const factor = 0.55 + Engine.rng.float(capRng) * (0.80 - 0.55);
          baseCap[s] = Math.round(factor * charTemplate.pot[s]);
        });

        const char = {
          pw: Math.round(charTemplate.pw * 0.45),
          sp: Math.round(charTemplate.sp * 0.45),
          te: Math.round(charTemplate.te * 0.45),
          st: Math.round(charTemplate.st * 0.45),
          mn: charTemplate.mn,
          age: 17, traits: [],
        };

        let capReached = null;
        let tgtSelects = 0, totalSelects = 0;

        for (let season = 1; season <= numSeasons; season++) {
          char.age++;
          for (let week = 1; week <= 36; week++) {
            const ageMul = ageMultiplier(char.age, char.traits);
            if (ageMul <= 0) break;

            // pickGrowthStat: 対象ステの重みにselectMulを掛けて再正規化
            const rawWeights = [...style.weights];
            rawWeights[targetIdx] *= scenario.selectMul;
            const wSum = rawWeights.reduce((a, b) => a + b, 0);
            const normWeights = rawWeights.map(w => w / wSum);

            const r = Engine.rng.float(rng);
            let cumulative = 0, stat = 'st';
            for (let i = 0; i < statNames.length; i++) {
              cumulative += normWeights[i];
              if (r < cumulative) { stat = statNames[i]; break; }
            }

            totalSelects++;
            if (stat === targetStat) tgtSelects++;

            const current = char[stat];
            const cap = baseCap[stat];
            if (current >= cap) continue;

            const remaining = cap - current;
            const ratio = remaining / cap;
            const baseGain = 3.0 * ratio * ageMul * 1.0;
            const variance = 0.5 + Engine.rng.float(rng) * 1.0;
            const gain = Math.max(0, Math.round(baseGain * variance * 10) / 10);
            char[stat] = Math.min(cap, char[stat] + gain);
          }

          // シーズン末スナップショット
          if (season <= trackSeasons) {
            statNames.forEach(s => timeline[season][s].push(char[s]));
          }

          // 対象ステのtrainCap到達チェック（95%超）
          if (!capReached && char[targetStat] >= baseCap[targetStat] * 0.95) {
            capReached = season;
          }
        }

        if (capReached) capReachSeasons.push(capReached);
        targetSelectCount.push(tgtSelects);
        totalSelectCount.push(totalSelects);
      }

      // ── 出力 ──
      console.log(`\n  ── ${scenario.label} ──`);

      // 練習選択率の実測値
      const actualRate = mean(targetSelectCount) / mean(totalSelectCount) * 100;
      console.log(`    実測 ${targetStat.toUpperCase()} 選択率: ${actualRate.toFixed(1)}% (理論値: ${(style.weights[targetIdx] * scenario.selectMul / (style.weights.reduce((a,b)=>a+b,0) + style.weights[targetIdx] * (scenario.selectMul - 1)) * 100).toFixed(1)}%)`);

      // trainCap到達タイミング
      const capReachStr = capReachSeasons.length > 0
        ? `S${fmt(mean(capReachSeasons))} (n=${capReachSeasons.length}/${numSeeds})`
        : 'N/A';
      console.log(`    ${targetStat.toUpperCase()} trainCap到達: ${capReachStr}`);

      // 時系列テーブル
      console.log(`    ┌────────┬────────┬────────┬────────┬────────┬──────────────────┐`);
      console.log(`    │ Season │   PW   │   SP   │   TE   │   ST   │ PW vs 他ステ平均 │`);
      console.log(`    ├────────┼────────┼────────┼────────┼────────┼──────────────────┤`);

      for (let s = 1; s <= trackSeasons; s++) {
        const mPW = mean(timeline[s].pw), mSP = mean(timeline[s].sp);
        const mTE = mean(timeline[s].te), mST = mean(timeline[s].st);
        const otherAvg = (mSP + mTE + mST) / 3;
        const diff = mPW - otherAvg;
        const diffStr = `${diff >= 0 ? '+' : ''}${fmt(diff)}`;

        // ベースラインとの差分（シナリオA以降）
        let vsBase = '';
        if (scenario.selectMul !== 1.0 && baselineTimeline[s]) {
          const basePWval = baselineTimeline[s].pw;
          const d = mPW - basePWval;
          vsBase = ` (B${d >= 0 ? '+' : ''}${fmt(d)})`;
        }

        console.log(`    │  S${String(s).padStart(2)}   │ ${fmt(mPW).padStart(6)}${s <= trackSeasons ? vsBase.padEnd(0) : ''} │ ${fmt(mSP).padStart(6)} │ ${fmt(mTE).padStart(6)} │ ${fmt(mST).padStart(6)} │    ${diffStr.padStart(6)}        │`);

        // ベースライン保存
        if (scenario.selectMul === 1.0) {
          baselineTimeline[s] = { pw: mPW, sp: mSP, te: mTE, st: mST };
        }
      }
      console.log(`    └────────┴────────┴────────┴────────┴────────┴──────────────────┘`);

      // ベースラインとの差分サマリー（シナリオA以降のみ）
      if (scenario.selectMul !== 1.0) {
        console.log(`    ── ベースラインとの差分（対象ステPW） ──`);
        let diffLine = '    ';
        for (let s = 1; s <= trackSeasons; s++) {
          if (baselineTimeline[s]) {
            const d = mean(timeline[s].pw) - baselineTimeline[s].pw;
            diffLine += `S${s}:${d >= 0 ? '+' : ''}${fmt(d)}  `;
          }
        }
        console.log(diffLine);

        // 他ステへの影響（SP, TE, ST）
        console.log(`    ── 他ステへの影響 ──`);
        let otherLine = '    ';
        for (let s = 1; s <= trackSeasons; s++) {
          if (baselineTimeline[s]) {
            const dSP = mean(timeline[s].sp) - baselineTimeline[s].sp;
            const dTE = mean(timeline[s].te) - baselineTimeline[s].te;
            const dST = mean(timeline[s].st) - baselineTimeline[s].st;
            otherLine += `S${s}: SP${dSP >= 0?'+':''}${fmt(dSP)} TE${dTE >= 0?'+':''}${fmt(dTE)} ST${dST >= 0?'+':''}${fmt(dST)}  `;
          }
        }
        console.log(otherLine);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-9: 新人育成 — 低OVR選手の成長速度UP
// ══════════════════════════════════════════════════════════════════════════════
function runSim9() {
  const scenarios = [
    { label: 'ベースライン (能力なし)', threshold: 0, mul: 1.0 },
    { label: 'A: OVR≤50 → 成長×1.2',   threshold: 50, mul: 1.2 },
    { label: 'B: OVR≤45 → 成長×1.3',   threshold: 45, mul: 1.3 },
    { label: 'C: OVR≤50 → 成長×1.3',   threshold: 50, mul: 1.3 },
    { label: 'D: OVR≤50 → 成長×1.5',   threshold: 50, mul: 1.5 },
    { label: 'E: OVR≤50 → 成長×2.0',   threshold: 50, mul: 2.0 },
  ];

  const charTemplate = {
    pw: 70, sp: 70, te: 70, st: 70, mn: 60,
    pot: { pw: 95, sp: 95, te: 95, st: 95, mn: 75 },
    style: 'Allround', traits: [],
  };

  // 低OVR選手テスト（初期OVR ~35）と高OVR選手テスト（初期OVR ~60）
  // 練習24週に変更（実ゲームでは興行/休息/怪我で練習回数が減る）
  const startLevels = [
    { label: '新人(17歳)', age: 17, ratio: 0.45, practiceWeeks: 24 },
    { label: '中堅(20歳)', age: 20, ratio: 0.70, practiceWeeks: 24 },
  ];

  for (const level of startLevels) {
    console.log(`\n◆ ${level.label} スタート`);

    // ベースラインのOVR推移を記録（比較用）
    let baseOvrBySeason = null;

    for (const scenario of scenarios) {
      const ovrBySeason = Array.from({ length: numSeasons + 1 }, () => []);
      const ovr50ReachSeason = [];

      for (let seed = 1; seed <= numSeeds; seed++) {
        const rng = Engine.rng.create(seed * 7919);
        const capRng = Engine.rng.create(Engine.rng.derive(seed * 7919, 4000, 555));

        const baseCap = {};
        ['pw', 'sp', 'te', 'st'].forEach(s => {
          const factor = 0.55 + Engine.rng.float(capRng) * (0.80 - 0.55);
          baseCap[s] = Math.round(factor * charTemplate.pot[s]);
        });

        const char = {
          pw: Math.round(charTemplate.pw * level.ratio),
          sp: Math.round(charTemplate.sp * level.ratio),
          te: Math.round(charTemplate.te * level.ratio),
          st: Math.round(charTemplate.st * level.ratio),
          mn: charTemplate.mn,
          age: level.age, traits: charTemplate.traits,
        };

        const initOvr = Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5);
        ovrBySeason[0].push(initOvr);
        let reached50 = initOvr >= 50 ? 0 : null;

        for (let season = 1; season <= numSeasons; season++) {
          char.age++;
          const practiceWeeks = level.practiceWeeks || 36;
          for (let week = 1; week <= practiceWeeks; week++) {
            const ageMul = ageMultiplier(char.age, char.traits);
            if (ageMul <= 0) break;

            const stats = ['pw', 'sp', 'te', 'st'];
            const r = Engine.rng.float(rng);
            let cumulative = 0, stat = 'st';
            for (let i = 0; i < stats.length; i++) {
              cumulative += 0.25;
              if (r < cumulative) { stat = stats[i]; break; }
            }

            const current = char[stat];
            const cap = baseCap[stat];
            if (current >= cap) continue;

            const remaining = cap - current;
            const ratio = remaining / cap;
            const currentOvr = Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5);

            // ★ 新人育成の効果: OVRが閾値以下なら成長倍率適用
            let rookieMul = 1.0;
            if (scenario.threshold > 0 && currentOvr <= scenario.threshold) {
              rookieMul = scenario.mul;
            }

            const baseGain = 3.0 * ratio * ageMul * 1.0 * rookieMul;
            const variance = 0.5 + Engine.rng.float(rng) * 1.0;
            const gain = Math.max(0, Math.round(baseGain * variance * 10) / 10);
            char[stat] = Math.min(cap, char[stat] + gain);
          }

          const ovr = Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5);
          ovrBySeason[season].push(ovr);
          if (reached50 === null && ovr >= 50) reached50 = season;
        }

        if (reached50 !== null) ovr50ReachSeason.push(reached50);
      }

      console.log(`  ── ${scenario.label} ──`);
      // シーズン別OVR推移（抜粋）
      const showSeasons = [0, 1, 2, 3, 4, 5, Math.min(7, numSeasons), numSeasons];
      const unique = [...new Set(showSeasons)].filter(s => s <= numSeasons);
      const line = unique.map(s => `S${s}:${fmt(mean(ovrBySeason[s]))}`).join('  ');
      console.log(`    OVR推移: ${line}`);
      console.log(`    OVR50到達: ${ovr50ReachSeason.length > 0 ? fmt(mean(ovr50ReachSeason)) + 'シーズン' : 'N/A'} (${ovr50ReachSeason.length}/${numSeeds})`);

      if (scenario.threshold === 0) baseOvrBySeason = ovrBySeason;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-3: 弱点克服 — 最低ステのtrainCapを引き上げてバランス改善
// ══════════════════════════════════════════════════════════════════════════════
function runSim3() {
  const scenarios = [
    { label: 'ベースライン (能力なし)', capBonus: 0 },
    { label: 'A: 最低ステ trainCap +4',  capBonus: 4 },
    { label: 'B: 最低ステ trainCap +6',  capBonus: 6 },
    { label: 'C: 最低ステ trainCap +5',  capBonus: 5 },
  ];

  // 穴あり選手（PWが低い）
  const charTemplate = {
    pw: 50, sp: 75, te: 70, st: 65, mn: 60,
    pot: { pw: 65, sp: 95, te: 90, st: 85, mn: 75 },
  };

  for (const scenario of scenarios) {
    const statResults = { pw: [], sp: [], te: [], st: [] };
    const ovrResults = [];
    const gapResults = []; // 最高ステ - 最低ステ

    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);
      const capRng = Engine.rng.create(Engine.rng.derive(seed * 7919, 5000, 555));

      const baseCap = {};
      ['pw', 'sp', 'te', 'st'].forEach(s => {
        const factor = 0.55 + Engine.rng.float(capRng) * (0.80 - 0.55);
        baseCap[s] = Math.round(factor * charTemplate.pot[s]);
      });

      // 最低ステのtrainCapを引き上げ
      const effectiveCap = { ...baseCap };
      if (scenario.capBonus > 0) {
        const stats = ['pw', 'sp', 'te', 'st'];
        const minStat = stats.reduce((a, b) => baseCap[a] < baseCap[b] ? a : b);
        effectiveCap[minStat] += scenario.capBonus;
      }

      const char = {
        pw: Math.round(charTemplate.pw * 0.45),
        sp: Math.round(charTemplate.sp * 0.45),
        te: Math.round(charTemplate.te * 0.45),
        st: Math.round(charTemplate.st * 0.45),
        mn: charTemplate.mn,
        age: 17, traits: [],
      };

      for (let season = 1; season <= numSeasons; season++) {
        char.age++;
        for (let week = 1; week <= 36; week++) {
          const ageMul = ageMultiplier(char.age, []);
          if (ageMul <= 0) break;
          const stats = ['pw', 'sp', 'te', 'st'];
          const r = Engine.rng.float(rng);
          let cumulative = 0, stat = 'st';
          for (let i = 0; i < stats.length; i++) {
            cumulative += 0.25;
            if (r < cumulative) { stat = stats[i]; break; }
          }
          const current = char[stat];
          const cap = effectiveCap[stat];
          if (current >= cap) continue;
          const remaining = cap - current;
          const ratio = remaining / cap;
          const baseGain = 3.0 * ratio * ageMul * 1.0;
          const variance = 0.5 + Engine.rng.float(rng) * 1.0;
          const gain = Math.max(0, Math.round(baseGain * variance * 10) / 10);
          char[stat] = Math.min(cap, char[stat] + gain);
        }
      }

      ['pw', 'sp', 'te', 'st'].forEach(s => statResults[s].push(char[s]));
      const vals = [char.pw, char.sp, char.te, char.st];
      gapResults.push(Math.max(...vals) - Math.min(...vals));
      ovrResults.push(Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5));
    }

    console.log(`── ${scenario.label} ──`);
    console.log(`  最終ステ: PW=${fmt(mean(statResults.pw))} SP=${fmt(mean(statResults.sp))} TE=${fmt(mean(statResults.te))} ST=${fmt(mean(statResults.st))}`);
    console.log(`  OVR: ${fmt(mean(ovrResults))} (σ=${fmt(std(ovrResults))})`);
    console.log(`  最高-最低差: ${fmt(mean(gapResults))} (σ=${fmt(std(gapResults))})`);
    console.log();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-4: スター製造 — 人気上昇速度UP
// ══════════════════════════════════════════════════════════════════════════════
function runSim4() {
  // 実ゲームの人気変動メカニクスを再現:
  // rawGain = MQ≥70→3, ≥50→2, ≥30→1, else 0  + winner→+1
  // diminishing: pop<20→×1.0, <35→×0.6, <50→×0.35, <65→×0.18, <80→×0.13, 80+→×0.10
  function diminishMul(pop) {
    if (pop < 20) return 1.0;
    if (pop < 35) return 0.6;
    if (pop < 50) return 0.35;
    if (pop < 65) return 0.18;
    if (pop < 80) return 0.13;
    return 0.10;
  }

  const scenarios = [
    { label: 'ベースライン (能力なし)', mul: 1.0 },
    { label: 'A: popularity変動 ×1.2',  mul: 1.2 },
    { label: 'B: popularity変動 ×1.3',  mul: 1.3 },
    { label: 'C: popularity変動 ×1.5',  mul: 1.5 },
  ];

  for (const scenario of scenarios) {
    const pop50Seasons = [];
    const pop80Seasons = [];
    const finalPops = [];
    const popBySeason = Array.from({ length: numSeasons + 1 }, () => []);

    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);
      let pop = 10; // 新人は低人気スタート
      popBySeason[0].push(pop);
      let reached50 = null, reached80 = null;

      for (let season = 1; season <= numSeasons; season++) {
        // 1シーズン=約12興行、各興行で1試合出場
        for (let show = 0; show < 12; show++) {
          const mq = 50 + Engine.rng.int(rng, 0, 30); // 50-80
          const isWinner = Engine.rng.float(rng) < 0.5;
          let rawGain = mq >= 70 ? 3 : mq >= 50 ? 2 : mq >= 30 ? 1 : 0;
          if (isWinner) rawGain += 1;

          // ★ スター製造倍率: rawGainに適用してからdiminishing
          rawGain *= scenario.mul;

          const popDelta = rawGain > 0 ? rawGain * diminishMul(pop) : rawGain;
          pop = Math.max(1, Math.min(100, pop + popDelta));
        }

        popBySeason[season].push(Math.round(pop));
        if (reached50 === null && pop >= 50) reached50 = season;
        if (reached80 === null && pop >= 80) reached80 = season;
      }

      finalPops.push(Math.round(pop));
      if (reached50 !== null) pop50Seasons.push(reached50);
      if (reached80 !== null) pop80Seasons.push(reached80);
    }

    console.log(`── ${scenario.label} ──`);
    const showSeasons = [0, 2, 4, 6, 8, numSeasons];
    const unique = [...new Set(showSeasons)].filter(s => s <= numSeasons);
    const line = unique.map(s => `S${s}:${fmt(mean(popBySeason[s]))}`).join('  ');
    console.log(`  人気推移: ${line}`);
    console.log(`  人気50到達: ${pop50Seasons.length > 0 ? fmt(mean(pop50Seasons)) + 'シーズン' : 'N/A'} (${pop50Seasons.length}/${numSeeds})`);
    console.log(`  人気80到達: ${pop80Seasons.length > 0 ? fmt(mean(pop80Seasons)) + 'シーズン' : 'N/A'} (${pop80Seasons.length}/${numSeeds})`);
    console.log(`  最終人気: ${fmt(mean(finalPops))} (σ=${fmt(std(finalPops))})`);
    console.log();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-5: 才能開花 — 晩成/遅咲きの成長カーブ前倒し
// ══════════════════════════════════════════════════════════════════════════════
function runSim5() {
  // ペナルティ期ageMul緩和方式:
  // 晩成/遅咲きのageMultiplierで「通常より低い値」の期間を引き上げる
  // 通常テーブルとの差分(penalty)に対して緩和率を適用
  //
  // 晩成ペナルティ期: ≤17(0.50vs0.70), 18(0.70vs1.00), 19(0.90vs1.15)
  // 遅咲きペナルティ期: ≤17(0.40vs0.70), 18(0.50vs1.00), 19(0.60vs1.15), 20(0.70vs1.15), 21(0.80vs1.00)
  function modifiedAgeMul(age, traits, relief) {
    // relief: ペナルティ期の値を通常値に近づける割合 (0=変更なし, 1.0=通常と同じ)
    if (relief === 0) return ageMultiplier(age, traits);

    const base = ageMultiplier(age, traits);
    const normal = ageMultiplier(age, []); // 通常テーブルの値

    // ペナルティ期のみ適用（base < normal の場合のみ）
    if (base < normal) {
      const penalty = normal - base;
      return base + penalty * relief;
    }
    return base;
  }

  const scenarios = [
    { label: 'ベースライン (能力なし)', relief: 0 },
    { label: 'A: ペナルティ緩和 → ×0.90相当', relief: 0 },  // 下で計算
    { label: 'B: ペナルティ緩和 → ×0.95相当', relief: 0 },
    { label: 'C: ペナルティ緩和 → ×1.00相当', relief: 0 },
  ];

  // ×0.90/0.95/1.00相当 = ペナルティ期の値をその値まで引き上げる
  // relief率で表現: 晩成18歳 base=0.70, normal=1.00
  //   ×0.90相当: 0.70→0.90 = penalty0.30のうち0.20回復 → relief=0.67
  //   ×0.95相当: 0.70→0.95 = penalty0.30のうち0.25回復 → relief=0.83
  //   ×1.00相当: 0.70→1.00 = penalty0.30のうち0.30回復 → relief=1.00
  // → 単純にrelief率で統一的に処理する方が正確
  // 「ペナルティ期の下限を×0.90にする」方式に変更
  function modifiedAgeMulV2(age, traits, minFloor) {
    if (minFloor === 0) return ageMultiplier(age, traits);

    const base = ageMultiplier(age, traits);
    const normal = ageMultiplier(age, []);

    // ペナルティ期（base < normal）の場合、minFloorまで引き上げ
    if (base < normal && base < minFloor) {
      return Math.min(minFloor, normal); // normalを超えない
    }
    return base;
  }

  const scenariosV2 = [
    { label: 'ベースライン (能力なし)', minFloor: 0 },
    { label: 'A: ペナルティ期 下限0.90',  minFloor: 0.90 },
    { label: 'B: ペナルティ期 下限0.95',  minFloor: 0.95 },
    { label: 'C: ペナルティ期 下限1.00',  minFloor: 1.00 },
  ];

  const traitSets = [
    { label: '晩成', traits: ['晩成'] },
    { label: '遅咲き', traits: ['遅咲き'] },
    { label: '通常(参考)', traits: [] },
  ];

  const charTemplate = {
    pw: 70, sp: 70, te: 70, st: 70, mn: 60,
    pot: { pw: 95, sp: 95, te: 95, st: 95, mn: 75 },
  };

  const trackSeasons = Math.min(numSeasons, 10);

  // まず通常選手ベースラインのOVR推移を計算（差の基準）
  const normalBaseline = {};
  {
    const ovrBySeason = Array.from({ length: trackSeasons + 1 }, () => []);
    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);
      const capRng = Engine.rng.create(Engine.rng.derive(seed * 7919, 6000, 555));
      const baseCap = {};
      ['pw', 'sp', 'te', 'st'].forEach(s => {
        const factor = 0.55 + Engine.rng.float(capRng) * (0.80 - 0.55);
        baseCap[s] = Math.round(factor * charTemplate.pot[s]);
      });
      const char = {
        pw: Math.round(charTemplate.pw * 0.45),
        sp: Math.round(charTemplate.sp * 0.45),
        te: Math.round(charTemplate.te * 0.45),
        st: Math.round(charTemplate.st * 0.45),
        mn: charTemplate.mn, age: 17,
      };
      ovrBySeason[0].push(Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5));
      for (let season = 1; season <= trackSeasons; season++) {
        char.age++;
        for (let week = 1; week <= 36; week++) {
          const ageMul = ageMultiplier(char.age, []);
          if (ageMul <= 0) break;
          const stats = ['pw', 'sp', 'te', 'st'];
          const r = Engine.rng.float(rng);
          let cumulative = 0, stat = 'st';
          for (let i = 0; i < stats.length; i++) {
            cumulative += 0.25;
            if (r < cumulative) { stat = stats[i]; break; }
          }
          const current = char[stat];
          const cap = baseCap[stat];
          if (current >= cap) continue;
          const remaining = cap - current;
          const ratio = remaining / cap;
          const baseGain = 3.0 * ratio * ageMul * 1.0;
          const variance = 0.5 + Engine.rng.float(rng) * 1.0;
          const gain = Math.max(0, Math.round(baseGain * variance * 10) / 10);
          char[stat] = Math.min(cap, char[stat] + gain);
        }
        ovrBySeason[season].push(Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5));
      }
    }
    for (let s = 0; s <= trackSeasons; s++) normalBaseline[s] = mean(ovrBySeason[s]);
  }

  console.log(`\n  通常選手ベースライン OVR推移（差の基準）:`);
  let nbLine = '  ';
  for (let s = 0; s <= trackSeasons; s++) nbLine += `S${s}:${fmt(normalBaseline[s])}  `;
  console.log(nbLine);

  for (const ts of traitSets) {
    console.log(`\n${'━'.repeat(50)}`);
    console.log(`◆ ${ts.label}`);
    console.log(`${'━'.repeat(50)}`);

    // ageMulテーブル表示
    console.log(`  ageMulテーブル比較:`);
    for (const scenario of scenariosV2) {
      let line = `    ${scenario.label.padEnd(28)}: `;
      for (let age = 17; age <= 26; age++) {
        const val = modifiedAgeMulV2(age, ts.traits, scenario.minFloor);
        line += `${age}=${val.toFixed(2)} `;
      }
      console.log(line);
    }

    // ベースラインOVR保持
    const baselineOvr = {};

    for (const scenario of scenariosV2) {
      const ovrBySeason = Array.from({ length: trackSeasons + 1 }, () => []);
      const peakOvrs = [];
      const peakAges = [];

      for (let seed = 1; seed <= numSeeds; seed++) {
        const rng = Engine.rng.create(seed * 7919);
        const capRng = Engine.rng.create(Engine.rng.derive(seed * 7919, 6000, 555));

        const baseCap = {};
        ['pw', 'sp', 'te', 'st'].forEach(s => {
          const factor = 0.55 + Engine.rng.float(capRng) * (0.80 - 0.55);
          baseCap[s] = Math.round(factor * charTemplate.pot[s]);
        });

        const char = {
          pw: Math.round(charTemplate.pw * 0.45),
          sp: Math.round(charTemplate.sp * 0.45),
          te: Math.round(charTemplate.te * 0.45),
          st: Math.round(charTemplate.st * 0.45),
          mn: charTemplate.mn, age: 17,
        };
        let peakOvr = 0, peakAge = 17;
        ovrBySeason[0].push(Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5));

        for (let season = 1; season <= trackSeasons; season++) {
          char.age++;
          for (let week = 1; week <= 36; week++) {
            const ageMul = modifiedAgeMulV2(char.age, ts.traits, scenario.minFloor);
            if (ageMul <= 0) break;
            const stats = ['pw', 'sp', 'te', 'st'];
            const r = Engine.rng.float(rng);
            let cumulative = 0, stat = 'st';
            for (let i = 0; i < stats.length; i++) {
              cumulative += 0.25;
              if (r < cumulative) { stat = stats[i]; break; }
            }
            const current = char[stat];
            const cap = baseCap[stat];
            if (current >= cap) continue;
            const remaining = cap - current;
            const ratio = remaining / cap;
            const baseGain = 3.0 * ratio * ageMul * 1.0;
            const variance = 0.5 + Engine.rng.float(rng) * 1.0;
            const gain = Math.max(0, Math.round(baseGain * variance * 10) / 10);
            char[stat] = Math.min(cap, char[stat] + gain);
          }
          const ovr = Math.round((char.pw + char.sp + char.te + char.st + char.mn) / 5);
          ovrBySeason[season].push(ovr);
          if (ovr > peakOvr) { peakOvr = ovr; peakAge = char.age; }
        }
        peakOvrs.push(peakOvr);
        peakAges.push(peakAge);
      }

      console.log(`\n  ── ${scenario.label} ──`);

      // 時系列テーブル
      console.log(`    ┌────────┬────────┬──────────┬──────────────┐`);
      console.log(`    │ Season │  OVR   │ vs Base  │ vs 通常選手  │`);
      console.log(`    ├────────┼────────┼──────────┼──────────────┤`);

      for (let s = 1; s <= trackSeasons; s++) {
        const mOvr = mean(ovrBySeason[s]);
        const vsBase = scenario.minFloor === 0 ? '   ---' : `  ${(mOvr - baselineOvr[s] >= 0 ? '+' : '')}${fmt(mOvr - baselineOvr[s])}`;
        const vsNormal = mOvr - normalBaseline[s];
        const vsNormalStr = `  ${vsNormal >= 0 ? '+' : ''}${fmt(vsNormal)}`;

        console.log(`    │  S${String(s).padStart(2)}   │ ${fmt(mOvr).padStart(6)} │ ${vsBase.padStart(8)} │  ${vsNormalStr.padStart(10)}    │`);

        if (scenario.minFloor === 0) baselineOvr[s] = mOvr;
      }
      console.log(`    └────────┴────────┴──────────┴──────────────┘`);
      console.log(`    ピークOVR: ${fmt(mean(peakOvrs))} (age ${fmt(mean(peakAges))})`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-6: 怪我耐性 — 怪我確率ダウン＋重傷格下げ
// ══════════════════════════════════════════════════════════════════════════════
function runSim6() {
  const scenarios = [
    { label: 'ベースライン (能力なし)', injuryMul: 1.0, downgradeRate: 0 },
    { label: 'A: 怪我×0.7 + 重傷→中傷30%', injuryMul: 0.7, downgradeRate: 0.30 },
    { label: 'B: 怪我×0.5 + 重傷→中傷50%', injuryMul: 0.5, downgradeRate: 0.50 },
    { label: 'C: 怪我×0.6 + 重傷→中傷40%', injuryMul: 0.6, downgradeRate: 0.40 },
  ];

  for (const scenario of scenarios) {
    let totalInjuries = 0, totalSevere = 0, totalWeeksLost = 0;
    let totalMatches = 0;

    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);

      for (let season = 1; season <= numSeasons; season++) {
        // 年間約30試合
        for (let match = 0; match < 30; match++) {
          totalMatches++;
          // 怪我確率（平均的条件: cond70, hp50%, 12ターン）
          const condFactor = (100 - 70) / 100; // 0.3
          const hpRatio = 0.3 + Engine.rng.float(rng) * 0.5; // 0.3-0.8
          const turns = 8 + Engine.rng.int(rng, 0, 8); // 8-16
          let injuryChance = Math.min(0.15, 0.025 + condFactor * 0.05 + (1 - hpRatio) * 0.04 + turns * 0.0015);

          // ★ 怪我耐性の効果
          injuryChance *= scenario.injuryMul;

          if (Engine.rng.float(rng) > injuryChance) continue;
          totalInjuries++;

          // 重傷度判定
          const roll = Engine.rng.float(rng);
          let severity, weeks;
          if (roll < 0.65) {
            severity = 'minor'; weeks = 1 + Engine.rng.int(rng, 0, 1); // 1-2
          } else if (roll < 0.90) {
            severity = 'moderate'; weeks = 3 + Engine.rng.int(rng, 0, 1); // 3-4
          } else if (roll < 0.98) {
            severity = 'severe';
            // ★ 重傷→中傷格下げ
            if (Engine.rng.float(rng) < scenario.downgradeRate) {
              severity = 'moderate'; weeks = 3 + Engine.rng.int(rng, 0, 1); // 3-4
            } else {
              weeks = 6 + Engine.rng.int(rng, 0, 2); // 6-8
            }
          } else {
            severity = 'severe';
            // ごく稀な長期重傷も、怪我耐性による格下げ対象に含める
            if (Engine.rng.float(rng) < scenario.downgradeRate) {
              severity = 'moderate'; weeks = 3 + Engine.rng.int(rng, 0, 1); // 3-4
            } else {
              weeks = 10 + Engine.rng.int(rng, 0, 6); // 10-16
            }
          }

          if (severity === 'severe') totalSevere++;
          totalWeeksLost += weeks;
        }
      }
    }

    const totalSeasons = numSeeds * numSeasons;
    console.log(`── ${scenario.label} ──`);
    console.log(`  年間怪我回数: ${fmt(totalInjuries / totalSeasons)}`);
    console.log(`  重傷発生率: ${fmt(totalSevere / totalSeasons * 100)}% (${totalSevere}件/${totalSeasons}シーズン)`);
    console.log(`  年間離脱週数: ${fmt(totalWeeksLost / totalSeasons)}`);
    console.log(`  試合あたり怪我率: ${fmt(totalInjuries / totalMatches * 100)}%`);
    console.log();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-7: 人心掌握 — trust低下抑制
// ══════════════════════════════════════════════════════════════════════════════
function runSim7() {
  const scenarios = [
    { label: 'ベースライン (能力なし)', trustLossMul: 1.0 },
    { label: 'A: trust低下 ×0.7',        trustLossMul: 0.7 },
    { label: 'B: trust低下 ×0.5',        trustLossMul: 0.5 },
    { label: 'C: trust低下 ×0.6',        trustLossMul: 0.6 },
    { label: 'D: trust低下 ×0.85',       trustLossMul: 0.85 },
    { label: 'E: trust低下 ×0.90',       trustLossMul: 0.90 },
    { label: 'F: trust低下 ×0.80',       trustLossMul: 0.80 },
  ];

  // シミュレーション: 12人ロスター、4試合=8名出場（出場率67%）
  // ケアアクションなし想定（プレイヤーが何もしなかった場合）
  const rosterSize = 12;

  for (const scenario of scenarios) {
    const avgTrusts = [];
    const below40Rates = [];
    const equilibriums = [];

    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);
      const trusts = Array(rosterSize).fill(50); // 全員trust50スタート
      const noAppearStreaks = Array(rosterSize).fill(0);

      for (let season = 1; season <= numSeasons; season++) {
        // 実ゲーム: 12興行/シーズン（4週に1回程度）、4試合=8名出場
        for (let show = 0; show < 12; show++) {
          const matchSlots = 8;
          const indices = Array.from({ length: rosterSize }, (_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Engine.rng.int(rng, 0, i);
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          const participants = new Set(indices.slice(0, matchSlots));

          for (let i = 0; i < rosterSize; i++) {
            if (participants.has(i)) {
              trusts[i] += 1.53;
              noAppearStreaks[i] = 0;
            } else {
              const streak = noAppearStreaks[i];
              const streakMults = [1.00, 1.15, 1.35, 1.55];
              const streakMul = streak < streakMults.length ? streakMults[streak] : 1.55;
              let loss = -2.64 * streakMul;
              // ★ 人心掌握: 負方向のみ倍率適用
              loss *= scenario.trustLossMul;
              trusts[i] += loss;
              noAppearStreaks[i]++;
            }
            trusts[i] = Math.max(0, Math.min(100, trusts[i]));
          }
        }
      }

      const avgTrust = trusts.reduce((a, b) => a + b, 0) / rosterSize;
      const below40 = trusts.filter(t => t < 40).length / rosterSize;
      avgTrusts.push(avgTrust);
      below40Rates.push(below40);
      equilibriums.push(avgTrust); // 最終値≒均衡点
    }

    console.log(`── ${scenario.label} ──`);
    console.log(`  シーズン末平均trust: ${fmt(mean(avgTrusts))}`);
    console.log(`  trust 40以下の割合: ${fmt(mean(below40Rates) * 100)}%`);
    console.log(`  trust均衡点: ${fmt(mean(equilibriums))}`);
    console.log();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIM-10: 闘志注入 — スランプ脱出加速
// ══════════════════════════════════════════════════════════════════════════════
function runSim10() {
  // スランプの仕組み: 一定条件で突入、毎週一定確率で脱出
  // 簡易モデル: 毎シーズン30%でスランプ突入、週次脱出率15%
  const BASE_SLUMP_EXIT_RATE = 0.15;

  const scenarios = [
    { label: 'ベースライン (能力なし)', exitMul: 1.0, extraExitPerWeek: 0 },
    { label: 'A: 脱出確率 ×1.5',        exitMul: 1.5, extraExitPerWeek: 0 },
    { label: 'B: 脱出確率 ×2.0',        exitMul: 2.0, extraExitPerWeek: 0 },
    { label: 'C: 回復momentum +0.5/週', exitMul: 1.0, extraExitPerWeek: 0.05 },
  ];

  for (const scenario of scenarios) {
    const avgSlumpDurations = [];
    const totalSlumpWeeks = [];
    const slumpCounts = [];

    for (let seed = 1; seed <= numSeeds; seed++) {
      const rng = Engine.rng.create(seed * 7919);
      let totalDuration = 0, totalSlumps = 0, totalLostWeeks = 0;

      for (let season = 1; season <= numSeasons; season++) {
        // シーズン内にスランプ発生するか（30%/シーズン）
        if (Engine.rng.float(rng) < 0.30) {
          totalSlumps++;
          let duration = 0;
          for (let week = 0; week < 48; week++) {
            duration++;
            totalLostWeeks++;
            let exitRate = BASE_SLUMP_EXIT_RATE * scenario.exitMul + scenario.extraExitPerWeek * duration;
            exitRate = Math.min(0.90, exitRate); // cap at 90%
            if (Engine.rng.float(rng) < exitRate) break;
          }
          totalDuration += duration;
        }
      }

      if (totalSlumps > 0) avgSlumpDurations.push(totalDuration / totalSlumps);
      slumpCounts.push(totalSlumps);
      totalSlumpWeeks.push(totalLostWeeks);
    }

    const totalSeasons = numSeeds * numSeasons;
    console.log(`── ${scenario.label} ──`);
    console.log(`  平均スランプ期間: ${avgSlumpDurations.length > 0 ? fmt(mean(avgSlumpDurations)) : 'N/A'}週`);
    console.log(`  年間スランプ損失週数: ${fmt(mean(totalSlumpWeeks) / numSeasons)}`);
    console.log(`  スランプ回数: ${fmt(mean(slumpCounts))} (${numSeasons}シーズン中)`);
    console.log();
  }
}

// ── メイン分岐 ──
switch (simNum) {
  case 1: runSim1(); break;
  case 2: runSim2(); break;
  case 3: runSim3(); break;
  case 4: runSim4(); break;
  case 5: runSim5(); break;
  case 6: runSim6(); break;
  case 7: runSim7(); break;
  case 8: runSim8(); break;
  case 9: runSim9(); break;
  case 10: runSim10(); break;
  default: console.log(`SIM-${simNum} は未実装です。`);
}
