#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Tag Match Engine — Standalone Validation Test
//  Engine.tagMatch.simulateTagMatch の動作検証
//
//  Usage: node test/tag-match-test.js [試合数] [シード]
//  Example: node test/tag-match-test.js 1000 42
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

if (!Engine.tagMatch || !Engine.tagMatch.simulateTagMatch) {
  console.error('ERROR: Engine.tagMatch.simulateTagMatch が見つかりません');
  process.exit(1);
}

const args = process.argv.slice(2);
const totalMatches = parseInt(args[0], 10) || 500;
const baseSeed = args[1] ? parseInt(args[1], 10) : 42;

console.log('=== Tag Match Engine Validation ===');
console.log(`Matches: ${totalMatches}  Seed: ${baseSeed}`);
console.log('-----------------------------------');

// 全キャラからランダムに4人選ぶ
const chars = ALL_CHARS.map(c => ({
  id: c.id, name: c.name, style: c.style,
  pw: c.pw, sp: c.sp, te: c.te, st: c.st, mn: c.mn,
  personality: c.personality, archetype: c.archetype,
  traits: c.traits || [],
}));

const stats = {
  teamAWins: 0, teamBWins: 0, draws: 0,
  finTypes: {}, avgTurns: 0, avgMQ: 0, avgSegments: 0,
  touchTypes: { tactical: 0, exhaustion: 0, hotTag: 0 },
  dramaEvents: { doubleTeam: 0, friendlyFire: 0, cutinSave: 0, betrayal: 0, hotTag: 0 },
  errors: [],
  mqDist: { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 },
  turnDist: { '<15': 0, '15-25': 0, '25-35': 0, '35-45': 0, '45+': 0 },
};

let totalTurns = 0, totalMQ = 0, totalSegments = 0;

for (let i = 0; i < totalMatches; i++) {
  const seed = baseSeed + i * 7919;
  const rng = Engine.rng.create(seed);

  // 4人をランダム選出（重複なし）
  const pool = [...chars];
  const pick = [];
  for (let j = 0; j < 4; j++) {
    const idx = Engine.rng.int(rng, 0, pool.length - 1);
    pick.push(pool.splice(idx, 1)[0]);
  }

  const teamA = { fighter1: pick[0], fighter2: pick[1] };
  const teamB = { fighter1: pick[2], fighter2: pick[3] };

  // ランダムなbondとタッグ経験
  const bond_A = Engine.rng.int(rng, 20, 90);
  const bond_B = Engine.rng.int(rng, 20, 90);
  const tagExp_A = Engine.rng.int(rng, 0, 15);
  const tagExp_B = Engine.rng.int(rng, 0, 15);

  try {
    const result = Engine.tagMatch.simulateTagMatch(teamA, teamB, rng, {
      bond_A, bond_B, tagExp_A, tagExp_B,
    });

    // ── 検証 ──
    // winner
    if (!['teamA', 'teamB', 'draw'].includes(result.winner)) {
      stats.errors.push(`Match ${i}: invalid winner "${result.winner}"`);
    }
    // turns
    if (result.turns <= 0 || result.turns > TAG_MATCH_CONFIG.maxTotalTurns) {
      stats.errors.push(`Match ${i}: turns out of range: ${result.turns}`);
    }
    // mq
    if (typeof result.mq !== 'number' || isNaN(result.mq) || result.mq < 5 || result.mq > 100) {
      stats.errors.push(`Match ${i}: invalid MQ: ${result.mq}`);
    }
    // segments
    if (!Array.isArray(result.segments) || result.segments.length === 0) {
      stats.errors.push(`Match ${i}: no segments`);
    }
    // perFighter
    for (const fid of [pick[0].id, pick[1].id, pick[2].id, pick[3].id]) {
      if (!result.perFighter[fid]) {
        stats.errors.push(`Match ${i}: missing perFighter for ${fid}`);
      }
    }
    // winAttribution (non-draw, non-HP判定)
    if (result.winner !== 'draw' && result.finType !== 'HP判定') {
      if (!result.winAttribution.pinnedBy || !result.winAttribution.pinnedWho) {
        stats.errors.push(`Match ${i}: missing winAttribution (finType=${result.finType})`);
      }
    }
    // matchType
    if (result.matchType !== 'tag') {
      stats.errors.push(`Match ${i}: matchType not 'tag'`);
    }

    // ── 集計 ──
    if (result.winner === 'teamA') stats.teamAWins++;
    else if (result.winner === 'teamB') stats.teamBWins++;
    else stats.draws++;

    stats.finTypes[result.finType] = (stats.finTypes[result.finType] || 0) + 1;
    totalTurns += result.turns;
    totalMQ += result.mq;
    totalSegments += result.segments.length;

    // タッチ種類
    for (const seg of result.segments) {
      if (seg.touchType && stats.touchTypes[seg.touchType] != null) {
        stats.touchTypes[seg.touchType]++;
      }
    }

    // ドラマイベント
    for (const d of result.dramaSummary) {
      if (stats.dramaEvents[d.type] != null) stats.dramaEvents[d.type]++;
    }

    // MQ分布
    if (result.mq < 20) stats.mqDist['0-20']++;
    else if (result.mq < 40) stats.mqDist['20-40']++;
    else if (result.mq < 60) stats.mqDist['40-60']++;
    else if (result.mq < 80) stats.mqDist['60-80']++;
    else stats.mqDist['80-100']++;

    // ターン分布
    if (result.turns < 15) stats.turnDist['<15']++;
    else if (result.turns <= 25) stats.turnDist['15-25']++;
    else if (result.turns <= 35) stats.turnDist['25-35']++;
    else if (result.turns <= 45) stats.turnDist['35-45']++;
    else stats.turnDist['45+']++;

  } catch (e) {
    stats.errors.push(`Match ${i}: CRASH: ${e.message}`);
  }

  if ((i + 1) % 100 === 0) process.stdout.write(`  ... ${i + 1}/${totalMatches}\n`);
}

stats.avgTurns = totalTurns / totalMatches;
stats.avgMQ = totalMQ / totalMatches;
stats.avgSegments = totalSegments / totalMatches;

// ── 結果出力 ──
console.log('');
console.log('Match Results:');
console.log(`  TeamA wins: ${stats.teamAWins} (${(stats.teamAWins / totalMatches * 100).toFixed(1)}%)`);
console.log(`  TeamB wins: ${stats.teamBWins} (${(stats.teamBWins / totalMatches * 100).toFixed(1)}%)`);
console.log(`  Draws:      ${stats.draws} (${(stats.draws / totalMatches * 100).toFixed(1)}%)`);
console.log('');
console.log('Finish Types:');
for (const [k, v] of Object.entries(stats.finTypes).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v} (${(v / totalMatches * 100).toFixed(1)}%)`);
}
console.log('');
console.log(`Avg Turns:    ${stats.avgTurns.toFixed(1)}`);
console.log(`Avg Segments: ${stats.avgSegments.toFixed(1)}`);
console.log(`Avg MQ:       ${stats.avgMQ.toFixed(1)}`);
console.log('');
console.log('MQ Distribution:');
for (const [k, v] of Object.entries(stats.mqDist)) {
  const bar = '#'.repeat(Math.round(v / totalMatches * 50));
  console.log(`  ${k.padEnd(6)}: ${String(v).padStart(4)} ${bar}`);
}
console.log('');
console.log('Turn Distribution:');
for (const [k, v] of Object.entries(stats.turnDist)) {
  const bar = '#'.repeat(Math.round(v / totalMatches * 50));
  console.log(`  ${k.padEnd(6)}: ${String(v).padStart(4)} ${bar}`);
}
console.log('');
console.log('Touch Types:');
for (const [k, v] of Object.entries(stats.touchTypes)) {
  console.log(`  ${k}: ${v}`);
}
console.log('');
console.log('Drama Events:');
for (const [k, v] of Object.entries(stats.dramaEvents)) {
  console.log(`  ${k}: ${v} (${(v / totalMatches).toFixed(2)}/match)`);
}
console.log('');
console.log('-----------------------------------');
if (stats.errors.length > 0) {
  console.log(`ERRORS: ${stats.errors.length}`);
  for (const e of stats.errors.slice(0, 20)) console.log(`  ${e}`);
  if (stats.errors.length > 20) console.log(`  ... and ${stats.errors.length - 20} more`);
  console.log('Result: FAIL ✗');
  process.exit(1);
} else {
  console.log('Result: ALL CLEAR ✓');
}
