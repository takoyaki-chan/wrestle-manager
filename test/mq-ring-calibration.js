#!/usr/bin/env node
'use strict';
// MQ再設計 P3b追補 較正計測(mq-ring-calibration-v0.1)
// rivalryRing(counterPt/escape)・titleMatch のリング内効果を、対戦構成×条件のグリッドで計測する。
// src/ は一切変更しない。同一seed対照実験のテンプレート(test/mq-trait-probe.js)の流儀に倣い、
// 構成ごとに同じseed列を全条件で使い回すペア比較を行う。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

for (const filename of ['victory-lines.js', 'data.js', 'management.js', 'match-engine.js', 'relationships.js']) {
  loadAsGlobal(filename);
}

const N = Number(process.argv[2]) || 4000;

function fighter(id, name, ov) {
  return {
    id, name, surname: name, style: 'Allround', role: 'Neutral', condition: 80,
    pw: ov, sp: ov, te: ov, st: ov, mn: ov,
    traits: [], personality: 'normal', archetype: 'normal',
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// ── 対戦構成 3種 ──────────────────────────────────────────────
const STRUCTURES = [
  { key: 'a_diff8', label: '(a) OV80 vs OV72 (差8)', leftOv: 80, rightOv: 72, seedBase: 0x610000 },
  { key: 'b_diff15', label: '(b) OV85 vs OV70 (差15)', leftOv: 85, rightOv: 70, seedBase: 0x620000 },
  { key: 'c_diff3', label: '(c) OV78 vs OV75 (差3)', leftOv: 78, rightOv: 75, seedBase: 0x630000 },
];

// ── 条件 9種(+ title系baseline) ─────────────────────────────
// rivalryRing / titleMatch は src/match-engine.js の opts.rivalryRing / opts.titleMatch に
// そのまま渡す(P3b で追加済みのリング内効果入力チャネル)。
// 「title相当 escape+0.05」は src の TITLE_RING_ESCAPE_BONUS(=0.10固定)を書き換えられないため、
// 同じ加算チャネル(ringEscapeBonus = rivalryRing.escape + (titleMatch?0.10:0))を rivalryRing.escape
// 経由で模擬する(counterPt=0固定。実際のtitleMatchもcounterPtには乗らない)。
//
// tier: src/management.js L11706 `simulateMatch(charL, charR, matchRng, m.isTitle ? 2 : 1, ...)`
// の通り、実ゲームでは isTitle=true の試合のみ matchTier=2(BIGMATCH_ENG)で走る。因縁(非タイトル)戦は
// isTitleでない限り常にtier=1。この非対称を再現するため、title系の2条件のみtier=2で計測し、
// tier=2固有のbaseline(baseline_tier2)と比較する。それ以外はtier=1固定・baselineと比較する。
const CONDITIONS = [
  { key: 'baseline', label: 'baseline(効果なし, tier1)', rivalryRing: null, titleMatch: false, tier: 1 },
  { key: 'counter_only', label: 'counterのみ(counterPt+4 / escape0)', rivalryRing: { counterPt: 4, escape: 0 }, titleMatch: false, tier: 1 },
  { key: 'escape_step_003', label: 'escape段階 counterPt+4 / escape+0.03', rivalryRing: { counterPt: 4, escape: 0.03 }, titleMatch: false, tier: 1 },
  { key: 'escape_step_005', label: 'escape段階 counterPt+4 / escape+0.05', rivalryRing: { counterPt: 4, escape: 0.05 }, titleMatch: false, tier: 1 },
  { key: 'escape_step_008', label: 'escape段階 counterPt+4 / escape+0.08', rivalryRing: { counterPt: 4, escape: 0.08 }, titleMatch: false, tier: 1 },
  { key: 'escape_step_015', label: 'escape段階 counterPt+4 / escape+0.15', rivalryRing: { counterPt: 4, escape: 0.15 }, titleMatch: false, tier: 1 },
  { key: 'escape_only', label: 'escapeのみ(counterPt0 / escape+0.08)', rivalryRing: { counterPt: 0, escape: 0.08 }, titleMatch: false, tier: 1 },
  { key: 'baseline_tier2', label: 'baseline(効果なし, tier2/BIGMATCH)', rivalryRing: null, titleMatch: false, tier: 2 },
  { key: 'title_flag_010', label: 'title相当(実装経路 titleMatch:true, escape+0.10, tier2)', rivalryRing: null, titleMatch: true, tier: 2 },
  { key: 'title_calib_005', label: 'title相当(escapeチャネル模擬, escape+0.05, tier2)', rivalryRing: { counterPt: 0, escape: 0.05 }, titleMatch: false, tier: 2 },
];

function runCondition(leftBase, rightBase, condition, seedBase) {
  const leftWins = [];
  const mqs = [];
  const koSums = [];
  const transcendFired = [];
  const turnsArr = [];

  for (let i = 0; i < N; i++) {
    const seed = seedBase + i;
    const rng = Engine.rng.create(seed);
    const left = fighter(9001, 'Left', leftBase);
    const right = fighter(9002, 'Right', rightBase);
    const opts = { recordFrames: true };
    if (condition.rivalryRing) opts.rivalryRing = condition.rivalryRing;
    if (condition.titleMatch) opts.titleMatch = true;
    const result = Engine.battle.simulateMatch(left, right, rng, condition.tier || 1, opts);

    leftWins.push(result.winner === 'left' ? 1 : 0);
    mqs.push(result.mq);
    turnsArr.push(result.turns);
    transcendFired.push(result.transcend && result.transcend.fired ? 1 : 0);
    const lastFrame = result.frames[result.frames.length - 1];
    koSums.push((lastFrame.kickoutCountL || 0) + (lastFrame.kickoutCountR || 0));
  }

  return {
    key: condition.key,
    label: condition.label,
    n: N,
    leftWinRatePct: +(mean(leftWins) * 100).toFixed(2),
    mqMean: +mean(mqs).toFixed(3),
    koMean: +mean(koSums).toFixed(4),
    transcendFiredPct: +(mean(transcendFired) * 100).toFixed(2),
    turnsMean: +mean(turnsArr).toFixed(3),
  };
}

const report = [];
for (const structure of STRUCTURES) {
  const rows = [];
  for (const condition of CONDITIONS) {
    rows.push(runCondition(structure.leftOv, structure.rightOv, condition, structure.seedBase));
  }
  const baseline = rows.find(r => r.key === 'baseline');
  const baselineTier2 = rows.find(r => r.key === 'baseline_tier2');
  const withDelta = rows.map(r => {
    const ref = r.key === 'title_flag_010' || r.key === 'title_calib_005' ? baselineTier2
      : r.key === 'baseline_tier2' ? baselineTier2
      : baseline;
    return {
      ...r,
      baselineRef: ref.key,
      leftWinRateDeltaPt: +(r.leftWinRatePct - ref.leftWinRatePct).toFixed(2),
      mqDelta: +(r.mqMean - ref.mqMean).toFixed(3),
      koDelta: +(r.koMean - ref.koMean).toFixed(4),
      transcendFiredDeltaPt: +(r.transcendFiredPct - ref.transcendFiredPct).toFixed(2),
      turnsDelta: +(r.turnsMean - ref.turnsMean).toFixed(3),
    };
  });
  report.push({ structure: structure.key, label: structure.label, leftOv: structure.leftOv, rightOv: structure.rightOv, rows: withDelta });
}

console.log(`MQ ring-in calibration grid (N=${N} seeds per cell, ${STRUCTURES.length} structures x ${CONDITIONS.length} conditions)`);
console.log(JSON.stringify(report, null, 2));
