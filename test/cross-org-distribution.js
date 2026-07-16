#!/usr/bin/env node
'use strict';

// UIなし自動プレイは test/auto-sim.js の実装をそのまま読み込み、
// レポート部分だけを外して最終 GameState を受け取る。

const fs = require('fs');
const path = require('path');

const DEFAULT_SEEDS = [42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
const DEFAULT_SEASONS = 10;
const CATEGORY_ORDER = ['hostile', 'opponent', 'worthyRival', 'other'];
const CATEGORY_LABELS = {
  hostile: '敵対',
  opponent: '単なる対戦相手',
  worthyRival: '好敵手',
  other: 'その他',
};
const TARGETS = { hostile: 50, opponent: 25, worthyRival: 15, other: 10 };
const BAND_LABELS = ['0-19', '20-39', '40-59', '60-79', '80+'];

function parseArgs(argv) {
  let seeds = DEFAULT_SEEDS;
  let seasons = DEFAULT_SEASONS;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node test/cross-org-distribution.js [--seeds=42,43,...] [--seasons=10]');
      process.exit(0);
    }
    if (arg.startsWith('--seeds=')) {
      const values = arg.slice('--seeds='.length).split(',').filter(Boolean).map(Number);
      if (values.length === 0 || values.some(v => !Number.isSafeInteger(v))) {
        throw new Error(`不正な --seeds 指定です: ${arg}`);
      }
      seeds = values;
      continue;
    }
    if (arg.startsWith('--seasons=')) {
      const value = Number(arg.slice('--seasons='.length));
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`不正な --seasons 指定です: ${arg}`);
      }
      seasons = value;
      continue;
    }
    throw new Error(`未知の引数です: ${arg}`);
  }

  return { seeds, seasons };
}

function loadAutoSimulation() {
  const autoSimPath = path.join(__dirname, 'auto-sim.js');
  let source = fs.readFileSync(autoSimPath, 'utf8');
  source = source.replace(/^#!.*\r?\n/, '');

  const argsStart = source.indexOf('// ── Step 2: パラメータ解析 ──');
  const initStart = source.indexOf('// ── Step 3: ゲーム初期化 ──');
  const reportStart = source.indexOf('// ── Step 6: 実行 & レポート出力 ──');
  if (argsStart < 0 || initStart < 0 || reportStart < 0) {
    throw new Error('auto-sim.js の既知のセクション境界を検出できません');
  }

  source = source.slice(0, argsStart) + source.slice(initStart, reportStart);
  const returnPattern = /return \{ violations, errors, totalWeeks, gameOverCount, stats, flagStats, finalSeasons: G \? G\.season : 0 \};/;
  if (!returnPattern.test(source)) {
    throw new Error('auto-sim.js の最終結果返却箇所を検出できません');
  }
  source = source.replace(
    returnPattern,
    'return { violations, errors, totalWeeks, gameOverCount, stats, flagStats, finalSeasons: G ? G.season : 0, finalState: G || null };'
  );
  source += '\n;global.__crossOrgRunSimulation = runSimulation;\n';

  const bootstrap = new Function('require', '__dirname', 'global', 'process', 'console', source);
  bootstrap(require, __dirname, global, process, console);
  if (typeof global.__crossOrgRunSimulation !== 'function') {
    throw new Error('auto-sim.js の runSimulation を読み込めませんでした');
  }
  return global.__crossOrgRunSimulation;
}

function emptyStats() {
  return {
    total: 0,
    categories: Object.fromEntries(CATEGORY_ORDER.map(key => [key, 0])),
    heatmap: Array.from({ length: 5 }, () => Array(5).fill(0)),
  };
}

function bandIndex(value) {
  if (value < 20) return 0;
  if (value < 40) return 1;
  if (value < 60) return 2;
  if (value < 80) return 3;
  return 4;
}

function classify(bond, rivalry) {
  if (bond < 40 && rivalry >= 60) return 'hostile';
  if (bond >= 40 && bond < 60 && rivalry >= 40) return 'opponent';
  if (bond >= 60 && rivalry >= 60) return 'worthyRival';
  return 'other';
}

function addValue(stats, relationship) {
  const bond = Number.isFinite(relationship.bond) ? relationship.bond : 50;
  const rivalry = Number.isFinite(relationship.rivalry) ? relationship.rivalry : 0;
  stats.total++;
  stats.categories[classify(bond, rivalry)]++;
  stats.heatmap[bandIndex(bond)][bandIndex(rivalry)]++;
}

function mergeStats(target, source) {
  target.total += source.total;
  for (const key of CATEGORY_ORDER) target.categories[key] += source.categories[key];
  for (let b = 0; b < 5; b++) {
    for (let r = 0; r < 5; r++) target.heatmap[b][r] += source.heatmap[b][r];
  }
}

function collectDistribution(state) {
  const crossOrg = emptyStats();
  const sameOrg = emptyStats();
  const charOrgMap = new Map();

  for (const char of state.roster || []) charOrgMap.set(String(char.id), 'player');
  for (const [orgId, org] of Object.entries(state.aiOrgs || {})) {
    for (const char of org.roster || []) charOrgMap.set(String(char.id), orgId);
  }

  for (const [pairKey, relationship] of Object.entries(state.relationships || {})) {
    const separator = pairKey.indexOf('>');
    if (separator < 1) continue;
    const fromId = pairKey.slice(0, separator);
    const toId = pairKey.slice(separator + 1);
    const fromOrg = charOrgMap.get(fromId);
    const toOrg = charOrgMap.get(toId);
    if (!fromOrg || !toOrg || fromId === toId) continue;
    addValue(fromOrg === toOrg ? sameOrg : crossOrg, relationship || {});
  }

  return { crossOrg, sameOrg };
}

function percentage(count, total) {
  return total > 0 ? count * 100 / total : 0;
}

function printCategories(title, stats) {
  console.log(title);
  for (const key of CATEGORY_ORDER) {
    const count = stats.categories[key];
    console.log(`  ${CATEGORY_LABELS[key].padEnd(10)} ${String(count).padStart(6)}  ${percentage(count, stats.total).toFixed(2).padStart(6)}%`);
  }
  console.log(`  ${'合計'.padEnd(10)} ${String(stats.total).padStart(6)}  ${percentage(stats.total, stats.total).toFixed(2).padStart(6)}%`);
}

function printHeatmap(title, stats) {
  console.log(title);
  console.log(`  ${'bond \\ rivalry'.padEnd(16)}${BAND_LABELS.map(label => label.padStart(9)).join('')}${'row total'.padStart(11)}`);
  for (let b = 0; b < 5; b++) {
    const rowTotal = stats.heatmap[b].reduce((sum, value) => sum + value, 0);
    console.log(`  ${BAND_LABELS[b].padEnd(16)}${stats.heatmap[b].map(value => String(value).padStart(9)).join('')}${String(rowTotal).padStart(11)}`);
  }
  const columns = Array.from({ length: 5 }, (_, r) => stats.heatmap.reduce((sum, row) => sum + row[r], 0));
  console.log(`  ${'column total'.padEnd(16)}${columns.map(value => String(value).padStart(9)).join('')}${String(stats.total).padStart(11)}`);
}

function printTargetDiff(stats) {
  console.log('=== 設計目標との差分（クロスOrg・全シード合算） ===');
  for (const key of CATEGORY_ORDER) {
    const actual = percentage(stats.categories[key], stats.total);
    const diff = actual - TARGETS[key];
    console.log(`  ${CATEGORY_LABELS[key].padEnd(10)} 目標 ${TARGETS[key].toFixed(2).padStart(6)}%  実測 ${actual.toFixed(2).padStart(6)}%  差分 ${(diff >= 0 ? '+' : '') + diff.toFixed(2)}pt`);
  }
}

function main() {
  const { seeds, seasons } = parseArgs(process.argv.slice(2));
  const runSimulation = loadAutoSimulation();
  const combinedCross = emptyStats();
  const combinedSame = emptyStats();
  const seedResults = [];
  const startedAt = Date.now();

  console.log('=== クロスOrg関係値分布 実測 ===');
  console.log(`Seeds: ${seeds.join(',')}`);
  console.log(`Seasons per seed: ${seasons}`);
  console.log('集計単位: G.relationships の有向ペア（現所属が判明する選手のみ）');

  for (const seed of seeds) {
    const seedStart = Date.now();
    const simulation = runSimulation(seed, seasons);
    if (!simulation.finalState) {
      throw new Error(`seed ${seed}: 最終 GameState を取得できませんでした`);
    }
    const distribution = collectDistribution(simulation.finalState);
    mergeStats(combinedCross, distribution.crossOrg);
    mergeStats(combinedSame, distribution.sameOrg);
    seedResults.push({ seed, ...distribution, simulation });
    const elapsed = ((Date.now() - seedStart) / 1000).toFixed(1);
    console.log(`  seed ${seed}: 完了 (${elapsed}s, weeks=${simulation.totalWeeks}, errors=${simulation.errors.length})`);
  }

  console.log('');
  console.log('=== シード別分類 ===');
  for (const item of seedResults) {
    printCategories(`seed ${item.seed} / クロスOrg`, item.crossOrg);
    printCategories(`seed ${item.seed} / 同一Org`, item.sameOrg);
  }

  console.log('');
  console.log('=== 全シード合算 ===');
  printCategories('クロスOrg', combinedCross);
  printCategories('同一Org（副作用チェック）', combinedSame);
  console.log('');
  printHeatmap('クロスOrg heatmap（件数）', combinedCross);
  console.log('');
  printHeatmap('同一Org heatmap（件数・副作用チェック）', combinedSame);
  console.log('');
  printTargetDiff(combinedCross);

  const errorCount = seedResults.reduce((sum, item) => sum + item.simulation.errors.length, 0);
  const violationCount = seedResults.reduce((sum, item) => sum + item.simulation.violations.length, 0);
  console.log('');
  console.log(`Simulation diagnostics: errors=${errorCount}, violations=${violationCount}`);
  console.log(`Elapsed: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  if (errorCount > 0) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { loadAutoSimulation, collectDistribution };
