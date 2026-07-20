#!/usr/bin/env node
'use strict';

// Coarse search for task-09 phase/HP calibration.
// Usage: node test/phase-hp-calibration-search.js [trials-per-gap-and-rule] [seed] [candidate-name]

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js',
].forEach(loadAsGlobal);

const trials = Math.max(1, parseInt(process.argv[2], 10) || 2000);
const baseSeed = process.argv[3] != null ? parseInt(process.argv[3], 10) : 42;
const candidateFilter = process.argv[4] || '';
const gaps = [0, 5, 10, 15, 20];

function phases(boundaries, mults, bigWeights, counterBonuses) {
  const names = ['Opening', 'Mid', 'End', 'Climax'];
  const tierWeights = [
    { small: 70, medium: 25, big: 5 },
    { small: 35, medium: 45, big: 20 },
    { small: 15, medium: 55, big: 30 },
    { small: 100 - bigWeights, medium: 0, big: bigWeights },
  ];
  tierWeights[3].small = 0;
  tierWeights[3].medium = 100 - bigWeights;
  return names.map((name, index) => ({
    name,
    min: boundaries[index][0],
    max: boundaries[index][1],
    mult: mults[index],
    tierW: tierWeights[index],
    rollupRate: [0, 3, 5, 7][index],
    counterBonus: (counterBonuses || [0, 3, 5, 8])[index],
  }));
}

const candidates = [
  {
    name: 'baseline-cooldown-fix',
    normal: { maxT: 16, hpBase: 100, hpScale: 1.80, finisherUnlock: 0.50, phases: phases([[1, 4], [5, 8], [9, 12], [13, 16]], [0.60, 0.85, 1.05, 1.30], 65) },
    big: { maxT: 24, hpBase: 170, hpScale: 2.20, finisherUnlock: 0.40, phases: phases([[1, 6], [7, 12], [13, 18], [19, 24]], [0.70, 0.85, 1.00, 1.20], 65) },
  },
  {
    name: 'hp125-phase12-18',
    normal: { maxT: 20, hpBase: 125, hpScale: 2.25, phases: phases([[1, 4], [5, 8], [9, 11], [12, 20]], [0.60, 0.85, 1.05, 1.20], 55) },
    big: { maxT: 30, hpBase: 213, hpScale: 2.75, phases: phases([[1, 6], [7, 12], [13, 17], [18, 30]], [0.70, 0.85, 1.00, 1.15], 55) },
  },
  {
    name: 'hp135-phase12-18',
    normal: { maxT: 21, hpBase: 135, hpScale: 2.43, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.20], 55) },
    big: { maxT: 32, hpBase: 230, hpScale: 2.97, phases: phases([[1, 6], [7, 12], [13, 17], [18, 32]], [0.70, 0.85, 1.00, 1.15], 55) },
  },
  {
    name: 'hp135-phase11-17',
    normal: { maxT: 21, hpBase: 135, hpScale: 2.43, phases: phases([[1, 4], [5, 7], [8, 10], [11, 21]], [0.60, 0.82, 1.00, 1.18], 52) },
    big: { maxT: 32, hpBase: 230, hpScale: 2.97, phases: phases([[1, 6], [7, 11], [12, 16], [17, 32]], [0.70, 0.83, 0.98, 1.12], 52) },
  },
  {
    name: 'hp145-phase12-18',
    normal: { maxT: 22, hpBase: 145, hpScale: 2.61, phases: phases([[1, 4], [5, 8], [9, 11], [12, 22]], [0.60, 0.85, 1.05, 1.18], 52) },
    big: { maxT: 33, hpBase: 247, hpScale: 3.19, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.12], 52) },
  },
  {
    name: 'hp155-hot-threshold65-60',
    normal: { maxT: 23, hpBase: 155, hpScale: 2.79, finisherUnlock: 0.65, phases: phases([[1, 4], [5, 8], [9, 11], [12, 23]], [0.60, 0.85, 1.05, 1.30], 65) },
    big: { maxT: 35, hpBase: 264, hpScale: 3.41, finisherUnlock: 0.60, phases: phases([[1, 6], [7, 12], [13, 17], [18, 35]], [0.70, 0.85, 1.00, 1.20], 65) },
  },
  {
    name: 'hp165-hot-threshold70-65',
    normal: { maxT: 24, hpBase: 165, hpScale: 2.97, finisherUnlock: 0.70, phases: phases([[1, 4], [5, 8], [9, 11], [12, 24]], [0.60, 0.85, 1.05, 1.30], 65) },
    big: { maxT: 36, hpBase: 281, hpScale: 3.63, finisherUnlock: 0.65, phases: phases([[1, 6], [7, 12], [13, 17], [18, 36]], [0.70, 0.85, 1.00, 1.20], 65) },
  },
  {
    name: 'hp155-hot-threshold75-70',
    normal: { maxT: 23, hpBase: 155, hpScale: 2.79, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 23]], [0.60, 0.85, 1.05, 1.30], 65) },
    big: { maxT: 35, hpBase: 264, hpScale: 3.41, finisherUnlock: 0.70, phases: phases([[1, 6], [7, 12], [13, 17], [18, 35]], [0.70, 0.85, 1.00, 1.20], 65) },
  },
  {
    name: 'balanced130-145-threshold75',
    normal: { maxT: 21, hpBase: 130, hpScale: 2.34, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.20], 55) },
    big: { maxT: 33, hpBase: 247, hpScale: 3.19, finisherUnlock: 0.75, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.12], 55) },
  },
  {
    name: 'balanced130-145-threshold85-80',
    normal: { maxT: 21, hpBase: 130, hpScale: 2.34, finisherUnlock: 0.85, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.20], 55) },
    big: { maxT: 33, hpBase: 247, hpScale: 3.19, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.12], 55) },
  },
  {
    name: 'balanced140-150-hot75-70',
    normal: { maxT: 22, hpBase: 140, hpScale: 2.52, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 22]], [0.60, 0.85, 1.05, 1.30], 65) },
    big: { maxT: 34, hpBase: 255, hpScale: 3.30, finisherUnlock: 0.70, phases: phases([[1, 6], [7, 12], [13, 17], [18, 34]], [0.70, 0.85, 1.00, 1.20], 65) },
  },
  {
    name: 'fine130-mult125-120',
    normal: { maxT: 21, hpBase: 130, hpScale: 2.34, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.25], 55) },
    big: { maxT: 33, hpBase: 247, hpScale: 3.19, finisherUnlock: 0.75, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.20], 55) },
  },
  {
    name: 'fine132-250-mult126-122',
    normal: { maxT: 21, hpBase: 132, hpScale: 2.38, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.26], 55) },
    big: { maxT: 33, hpBase: 250, hpScale: 3.24, finisherUnlock: 0.75, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.22], 55) },
  },
  {
    name: 'final132-250-mult127-122-threshold75-80',
    normal: { maxT: 21, hpBase: 132, hpScale: 2.38, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.27], 55) },
    big: { maxT: 33, hpBase: 250, hpScale: 3.24, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.22], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'flattened-light170-317',
    normal: { maxT: 21, hpBase: 170, hpScale: 1.90, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.27], 55) },
    big: { maxT: 33, hpBase: 317, hpScale: 2.40, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.22], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'flattened-mid210-365',
    normal: { maxT: 21, hpBase: 210, hpScale: 1.40, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.27], 55) },
    big: { maxT: 33, hpBase: 365, hpScale: 1.80, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.22], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'flattened-strong250-421',
    normal: { maxT: 21, hpBase: 250, hpScale: 0.90, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.31], 55) },
    big: { maxT: 33, hpBase: 421, hpScale: 1.10, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.26], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'flattened-strong-tuned',
    normal: { maxT: 21, hpBase: 250, hpScale: 0.90, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.35], 55) },
    big: { maxT: 33, hpBase: 421, hpScale: 1.10, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.30], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'adopted-flat-hp',
    normal: { maxT: 21, hpBase: 250, hpScale: 0.90, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 421, hpScale: 1.10, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.85, 1.00, 1.30], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'soft-big-prephases',
    normal: { maxT: 21, hpBase: 230, hpScale: 1.15, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 401, hpScale: 1.35, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.35], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'soft-big-prephases-hot-climax',
    normal: { maxT: 21, hpBase: 230, hpScale: 1.15, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 401, hpScale: 1.35, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.55], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'final-task09',
    normal: { maxT: 21, hpBase: 198, hpScale: 1.55, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 401, hpScale: 1.35, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.57], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'task10-proposed-hp-shape',
    normal: { maxT: 21, hpBase: 141, hpScale: 2.50, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 272, hpScale: 3.50, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.57], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'task10-control-centered-hp-shape',
    normal: { maxT: 21, hpBase: 131, hpScale: 2.50, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 250, hpScale: 3.50, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.57], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'task10-minratio-control-centered',
    normal: { maxT: 21, hpBase: 141, hpScale: 2.36, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.38], 55) },
    big: { maxT: 33, hpBase: 272, hpScale: 3.20, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.57], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'task10-proposed-hp-tuned-climax',
    normal: { maxT: 21, hpBase: 141, hpScale: 2.50, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.50], 55) },
    big: { maxT: 33, hpBase: 272, hpScale: 3.50, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.79], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'task10-minratio-mean-centered',
    normal: { maxT: 21, hpBase: 145, hpScale: 2.43, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.50], 55) },
    big: { maxT: 33, hpBase: 282, hpScale: 3.33, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.79], 55, [0, 2, 4, 7]) },
  },
  {
    name: 'final-task10',
    normal: { maxT: 21, hpBase: 141, hpScale: 2.50, finisherUnlock: 0.75, phases: phases([[1, 4], [5, 8], [9, 11], [12, 21]], [0.60, 0.85, 1.05, 1.45], 55) },
    big: { maxT: 33, hpBase: 272, hpScale: 3.50, finisherUnlock: 0.80, phases: phases([[1, 6], [7, 12], [13, 17], [18, 33]], [0.70, 0.75, 0.85, 1.70], 55, [0, 2, 4, 7]) },
  },
];

function makeFighter(id, rating) {
  return { id, name: id, pw: rating, sp: rating, te: rating, st: rating, mn: rating, popularity: 50, style: 'Allround', traits: [], age: 28, condition: 100 };
}

function applyCandidate(candidate) {
  MAX_T = candidate.normal.maxT;
  BIGMATCH_MAX_T = candidate.big.maxT;
  PHASES.splice(0, PHASES.length, ...candidate.normal.phases.map(phase => ({ ...phase, tierW: { ...phase.tierW } })));
  BIGMATCH_PHASES.splice(0, BIGMATCH_PHASES.length, ...candidate.big.phases.map(phase => ({ ...phase, tierW: { ...phase.tierW } })));
  ENG.hpBase = candidate.normal.hpBase;
  ENG.hpScale = candidate.normal.hpScale;
  ENG.finisherUnlockHpThreshold = candidate.normal.finisherUnlock != null ? candidate.normal.finisherUnlock : 0.50;
  BIGMATCH_ENG.hpBase = candidate.big.hpBase;
  BIGMATCH_ENG.hpScale = candidate.big.hpScale;
  BIGMATCH_ENG.finisherUnlockHpThreshold = candidate.big.finisherUnlock != null ? candidate.big.finisherUnlock : 0.40;
}

function createStats() {
  return {
    matches: 0, turns: 0, climax: 0, climaxTurns: 0, timeouts: 0,
    finishers: 0, smallFallGu: 0, consecutiveBig: 0, mq: 0,
    wins: Object.fromEntries(gaps.map(gap => [gap, 0])),
    byPhase: {},
  };
}

function record(stats, result, gap, phaseConfig) {
  stats.matches++;
  stats.turns += result.turns || 0;
  stats.mq += result.mq || 0;
  const climax = phaseConfig[phaseConfig.length - 1];
  if ((result.turns || 0) >= climax.min) stats.climax++;
  stats.climaxTurns += Math.max(0, (result.turns || 0) - climax.min + 1);
  if (result.finishPhase === 'Timeout') stats.timeouts++;
  const selection = result.moveSelectionStats || {};
  stats.finishers += Math.max(0, (selection.finisher || 0) - (selection.forcedFinisher || 0));
  stats.consecutiveBig += selection.consecutiveBig || 0;
  if (result.finMoveTier === 'small' && result.finType !== 'TKO') stats.smallFallGu++;
  if (result.winner === 'left') stats.wins[gap]++;
  for (const [phase, counts] of Object.entries(selection.byPhase || {})) {
    if (!stats.byPhase[phase]) stats.byPhase[phase] = { small: 0, medium: 0, big: 0 };
    stats.byPhase[phase].small += counts.small || 0;
    stats.byPhase[phase].medium += counts.medium || 0;
    stats.byPhase[phase].big += counts.big || 0;
  }
}

function printStats(label, stats) {
  const pct = value => value / stats.matches * 100;
  const wins = gaps.map(gap => `${gap}:${(stats.wins[gap] / trials * 100).toFixed(2)}`).join(',');
  const bigShare = ['Opening', 'Mid', 'End', 'Climax'].map(phase => {
    const counts = stats.byPhase[phase] || { small: 0, medium: 0, big: 0 };
    const total = counts.small + counts.medium + counts.big;
    return `${phase}:${total ? (counts.big / total * 100).toFixed(1) : 'n/a'}`;
  }).join(',');
  console.log(`${label} avgT=${(stats.turns / stats.matches).toFixed(3)} climax=${pct(stats.climax).toFixed(2)}% climaxStay=${(stats.climaxTurns / stats.matches).toFixed(3)} fin=${(stats.finishers / stats.matches).toFixed(3)} TO=${pct(stats.timeouts).toFixed(2)}% MQ=${(stats.mq / stats.matches).toFixed(2)} smallFG=${stats.smallFallGu} normalBig2=${stats.consecutiveBig}`);
  console.log(`  wins[gap:rate]=${wins} effectiveBig%=${bigShare}`);
}

console.log(`phase/HP calibration search: trials=${trials} per gap/rule seed=${baseSeed}`);
for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
  const candidate = candidates[candidateIndex];
  if (candidateFilter && candidate.name !== candidateFilter) continue;
  applyCandidate(candidate);
  const normal = createStats();
  const big = createStats();
  for (const gap of gaps) {
    const left = makeFighter(`left-${gap}`, 80);
    const right = makeFighter(`right-${gap}`, 80 - gap);
    for (let index = 0; index < trials; index++) {
      const seed = Engine.rng.derive(baseSeed, gap, index);
      record(normal, Engine.battle.simulateMatch(left, right, Engine.rng.create(seed), 1), gap, PHASES);
      record(big, Engine.battle.simulateMatch(left, right, Engine.rng.create(seed), 2), gap, BIGMATCH_PHASES);
    }
  }
  console.log(`candidate=${candidate.name}`);
  printStats('  normal', normal);
  printStats('  big   ', big);
}
