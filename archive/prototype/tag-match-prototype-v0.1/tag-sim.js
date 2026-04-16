#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Tag Match Prototype — Auto-Simulation Script
//  UIなしでタッグマッチエンジンを高速実行し、不整合を検出する。
//
//  Usage: node tag-sim.js [試合数] [シード]
//  Example: node tag-sim.js 1000 12345
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

// 読み込み順序: wm-data → wm-engine → tag-data → tag-engine
loadAsGlobal('wm-data.js');
loadAsGlobal('wm-engine.js');
loadAsGlobal('tag-data.js');
loadAsGlobal('tag-engine.js');

// 確認
if (typeof Engine === 'undefined') { console.error('ERROR: Engine が読み込めませんでした'); process.exit(1); }
if (typeof TagEngine === 'undefined') { console.error('ERROR: TagEngine が読み込めませんでした'); process.exit(1); }
if (typeof ALL_CHARS === 'undefined') { console.error('ERROR: ALL_CHARS が読み込めませんでした'); process.exit(1); }

// ── パラメータ解析 ──
const args = process.argv.slice(2);
const targetMatches = parseInt(args[0], 10) || 100;
const userSeed = args[1] ? parseInt(args[1], 10) : (Date.now() ^ 0x7A61);

console.log('=== Tag Match Auto-Simulation ===');
console.log(`Seed: ${userSeed}`);
console.log(`Matches: ${targetMatches}`);
console.log('');

// ── シミュレーション実行 ──
const rng = Engine.rng.create(userSeed);
const chars = ALL_CHARS.filter(c => c.id > 0);

let violations = [];
let stats = {
  total: 0,
  teamAWins: 0, teamBWins: 0, draws: 0,
  mqSum: 0, mqMin: 100, mqMax: 0,
  turnSum: 0, turnMin: 999, turnMax: 0,
  segSum: 0, segMin: 999, segMax: 0,
  touchTypes: { tactical: 0, exhaustion: 0, hotTag: 0 },
  dramaTypes: { doubleTeam: 0, cutinSave: 0, friendlyFire: 0, betrayal: 0, hotTag: 0 },
  finTypes: {},
  finPhases: {},
};

for (let i = 0; i < targetMatches; i++) {
  // ランダムに4人選出（重複なし）
  const pool = [...chars];
  const pick = () => {
    const idx = Engine.rng.int(rng, 0, pool.length - 1);
    return pool.splice(idx, 1)[0];
  };
  const f1 = pick(), f2 = pick(), f3 = pick(), f4 = pick();

  const matchRng = Engine.rng.create(Engine.rng.derive(userSeed, i, f1.id, f2.id, f3.id, f4.id));

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
    violations.push(`Match ${i}: CRASH — ${e.message}\n  ${f1.name}&${f2.name} vs ${f3.name}&${f4.name}\n  ${e.stack}`);
    continue;
  }

  stats.total++;

  // ── 検証 ──
  if (!['teamA', 'teamB', 'draw'].includes(result.winner)) {
    violations.push(`Match ${i}: Invalid winner: ${result.winner}`);
  }
  if (result.mq < 5 || result.mq > 100 || isNaN(result.mq)) {
    violations.push(`Match ${i}: Invalid MQ: ${result.mq}`);
  }
  if (result.turns < 1 || result.turns > TAG_MATCH_CONFIG.maxTotalTurns || isNaN(result.turns)) {
    violations.push(`Match ${i}: Invalid turns: ${result.turns}`);
  }
  if (!result.segments || result.segments.length < 1) {
    violations.push(`Match ${i}: No segments`);
  }
  const segTurnSum = result.segments.reduce((s, seg) => s + seg.turns, 0);
  if (segTurnSum !== result.turns) {
    violations.push(`Match ${i}: Segment turns sum ${segTurnSum} !== total turns ${result.turns}`);
  }
  const pf = result.perFighter;
  for (const fid of [f1.id, f2.id, f3.id, f4.id]) {
    if (!pf[fid]) {
      violations.push(`Match ${i}: Missing perFighter for id ${fid}`);
      continue;
    }
    if (isNaN(pf[fid].hpFinal)) violations.push(`Match ${i}: NaN hpFinal for id ${fid}`);
    if (isNaN(pf[fid].turnsLegal)) violations.push(`Match ${i}: NaN turnsLegal for id ${fid}`);
    if (isNaN(pf[fid].damageDealt)) violations.push(`Match ${i}: NaN damageDealt for id ${fid}`);
  }
  if (!result.finType) violations.push(`Match ${i}: No finType`);

  // ── 統計収集 ──
  if (result.winner === 'teamA') stats.teamAWins++;
  else if (result.winner === 'teamB') stats.teamBWins++;
  else stats.draws++;

  stats.mqSum += result.mq;
  stats.mqMin = Math.min(stats.mqMin, result.mq);
  stats.mqMax = Math.max(stats.mqMax, result.mq);
  stats.turnSum += result.turns;
  stats.turnMin = Math.min(stats.turnMin, result.turns);
  stats.turnMax = Math.max(stats.turnMax, result.turns);
  const nSeg = result.segments.length;
  stats.segSum += nSeg;
  stats.segMin = Math.min(stats.segMin, nSeg);
  stats.segMax = Math.max(stats.segMax, nSeg);

  for (const seg of result.segments) {
    if (seg.touchType && stats.touchTypes[seg.touchType] != null) {
      stats.touchTypes[seg.touchType]++;
    }
  }
  for (const d of result.dramaSummary) {
    if (stats.dramaTypes[d.type] != null) stats.dramaTypes[d.type]++;
  }

  stats.finTypes[result.finType] = (stats.finTypes[result.finType] || 0) + 1;
  stats.finPhases[result.finishPhase] = (stats.finPhases[result.finishPhase] || 0) + 1;
}

// ── 結果出力 ──
console.log('=== Results ===');
console.log(`Total: ${stats.total} matches`);
console.log(`Violations: ${violations.length}`);
if (violations.length > 0) {
  console.log('');
  console.log('--- Violations (first 20) ---');
  for (const v of violations.slice(0, 20)) console.log(`  ${v}`);
}
console.log('');
console.log('--- Win Rate ---');
console.log(`  TeamA: ${stats.teamAWins} (${(stats.teamAWins / stats.total * 100).toFixed(1)}%)`);
console.log(`  TeamB: ${stats.teamBWins} (${(stats.teamBWins / stats.total * 100).toFixed(1)}%)`);
console.log(`  Draw:  ${stats.draws} (${(stats.draws / stats.total * 100).toFixed(1)}%)`);
console.log('');
console.log('--- MQ ---');
console.log(`  Avg: ${(stats.mqSum / stats.total).toFixed(1)}  Min: ${stats.mqMin}  Max: ${stats.mqMax}`);
console.log('');
console.log('--- Turns ---');
console.log(`  Avg: ${(stats.turnSum / stats.total).toFixed(1)}  Min: ${stats.turnMin}  Max: ${stats.turnMax}`);
console.log('');
console.log('--- Segments ---');
console.log(`  Avg: ${(stats.segSum / stats.total).toFixed(1)}  Min: ${stats.segMin}  Max: ${stats.segMax}`);
console.log('');
console.log('--- Touch Types ---');
for (const [k, v] of Object.entries(stats.touchTypes)) {
  console.log(`  ${k}: ${v}`);
}
console.log('');
console.log('--- Drama Events ---');
for (const [k, v] of Object.entries(stats.dramaTypes)) {
  console.log(`  ${k}: ${v} (${(v / stats.total * 100).toFixed(1)}% of matches)`);
}
console.log('');
console.log('--- Finish Types ---');
for (const [k, v] of Object.entries(stats.finTypes)) {
  console.log(`  ${k}: ${v} (${(v / stats.total * 100).toFixed(1)}%)`);
}
console.log('');
console.log('--- Finish Phases ---');
for (const [k, v] of Object.entries(stats.finPhases)) {
  console.log(`  ${k}: ${v} (${(v / stats.total * 100).toFixed(1)}%)`);
}
console.log('');
console.log(`Result: ${violations.length === 0 ? 'ALL CLEAR ✓' : `${violations.length} VIOLATIONS ✗`}`);
