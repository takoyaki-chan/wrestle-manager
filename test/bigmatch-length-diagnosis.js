#!/usr/bin/env node
'use strict';

// Controlled normal-vs-big-match length diagnosis.
// Usage: node test/bigmatch-length-diagnosis.js [trials-per-gap-and-rule] [seed]

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
  'victory-lines.js',
  'data.js',
  'coach-lines.js',
  'data-faction-dialogue.js',
  'management.js',
  'match-engine.js',
  'relationships.js',
  'flag-dialogue.js',
  'factions.js',
  'draft-negotiation.js',
].forEach(loadAsGlobal);

const trials = Math.max(1, parseInt(process.argv[2], 10) || 10000);
const baseSeed = process.argv[3] != null ? parseInt(process.argv[3], 10) : 42;
const gaps = [0, 5, 10, 15, 20];
const phaseNames = ['Opening', 'Mid', 'End', 'Climax'];

function makeFighter(id, name, rating) {
  return {
    id,
    name,
    pw: rating,
    sp: rating,
    te: rating,
    st: rating,
    mn: rating,
    popularity: 50,
    style: 'Allround',
    traits: [],
    age: 28,
    condition: 100,
  };
}

function createStats(tier) {
  const maxTurn = tier >= 2 ? BIGMATCH_MAX_T : MAX_T;
  return {
    matches: 0,
    turns: 0,
    reachedClimax: 0,
    finishPhases: { Opening: 0, Mid: 0, End: 0, Climax: 0, Timeout: 0 },
    turnHistogram: Array(maxTurn + 1).fill(0),
    phaseTurns: { Opening: 0, Mid: 0, End: 0, Climax: 0 },
    finisherSelections: 0,
    forcedFinisherSelections: 0,
    zeroFinisherMatches: 0,
    finishTypes: { fall: 0, gu: 0, TKO: 0, decision: 0 },
    strongerWins: 0,
    draws: 0,
    maxHpTotal: 0,
    maxHpFighters: 0,
    damageByPhase: {
      Opening: { damage: 0, turns: 0 },
      Mid: { damage: 0, turns: 0 },
      End: { damage: 0, turns: 0 },
      Climax: { damage: 0, turns: 0 },
    },
  };
}

function classifyFinishType(finType) {
  const text = String(finType || '');
  if (text === 'TKO') return 'TKO';
  if (text.includes('\u30ae\u30d6\u30a2\u30c3\u30d7')) return 'gu';
  if (text.includes('\u30d5\u30a9\u30fc\u30eb') || text.includes('\u30d4\u30f3') || text.includes('\u4e38\u3081\u8fbc\u307f')) return 'fall';
  return 'decision';
}

function recordResult(stats, result, tier) {
  const phases = tier >= 2 ? BIGMATCH_PHASES : PHASES;
  const climaxStart = phases[phases.length - 1].min;
  const maxTurn = stats.turnHistogram.length - 1;
  const turns = Math.max(0, Math.min(result.turns || 0, maxTurn));
  stats.matches++;
  stats.turns += turns;
  if (turns >= climaxStart) stats.reachedClimax++;
  stats.turnHistogram[turns]++;
  const finishPhase = result.finishPhase === 'Timeout' ? 'Timeout' : result.finishPhase;
  if (stats.finishPhases[finishPhase] != null) stats.finishPhases[finishPhase]++;
  for (const phase of phases) {
    stats.phaseTurns[phase.name] += Math.max(0, Math.min(turns, phase.max) - phase.min + 1);
  }

  const selections = result.moveSelectionStats || {};
  const forcedFinishers = selections.forcedFinisher || 0;
  const normalFinishers = Math.max(0, (selections.finisher || 0) - forcedFinishers);
  stats.finisherSelections += normalFinishers;
  stats.forcedFinisherSelections += forcedFinishers;
  if (normalFinishers === 0) stats.zeroFinisherMatches++;
  stats.finishTypes[classifyFinishType(result.finType)]++;

  if (result.winner === 'draw') stats.draws++;
  else if (result.winner === 'left') stats.strongerWins++;
  stats.maxHpTotal += result.hpLeft.max + result.hpRight.max;
  stats.maxHpFighters += 2;

  for (const frame of result.frames || []) {
    const phaseStats = stats.damageByPhase[frame.phase];
    if (!phaseStats) continue;
    phaseStats.turns++;
    phaseStats.damage += Number(frame.action && frame.action.dmg) || 0;
  }

}

function formatSummary(gap, rule, stats) {
  const pct = count => count / stats.matches * 100;
  const finishPhases = ['Opening', 'Mid', 'End', 'Climax', 'Timeout']
    .map(phase => `${phase}:${stats.finishPhases[phase]}(${pct(stats.finishPhases[phase]).toFixed(2)}%)`).join(' ');
  const residence = phaseNames
    .map(phase => `${phase}:${(stats.phaseTurns[phase] / stats.matches).toFixed(3)}`).join(' ');
  const finishTypes = Object.entries(stats.finishTypes)
    .map(([type, count]) => `${type}:${count}(${pct(count).toFixed(2)}%)`).join(' ');
  const histogram = stats.turnHistogram.slice(1)
    .map((count, index) => `T${index + 1}:${count}(${pct(count).toFixed(2)}%)`).join(' ');
  const phaseDamage = phaseNames.map(phase => {
    const values = stats.damageByPhase[phase];
    return `${phase}:${values.turns ? (values.damage / values.turns).toFixed(3) : 'n/a'}`;
  }).join(' ');
  const winLabel = gap === 0 ? 'leftWin' : 'strongerWin';

  console.log(`gap=${gap} rule=${rule} n=${stats.matches} avgTurns=${(stats.turns / stats.matches).toFixed(3)} maxHP=${(stats.maxHpTotal / stats.maxHpFighters).toFixed(3)}`);
  console.log(`  finishPhase ${finishPhases}`);
  console.log(`  ClimaxReach ${stats.reachedClimax}/${stats.matches} (${pct(stats.reachedClimax).toFixed(2)}%) phaseResidence ${residence}`);
  console.log(`  finisher/match=${(stats.finisherSelections / stats.matches).toFixed(3)} zero=${stats.zeroFinisherMatches}/${stats.matches} (${pct(stats.zeroFinisherMatches).toFixed(2)}%) forced=${stats.forcedFinisherSelections}`);
  console.log(`  finishType ${finishTypes} ${winLabel}=${stats.strongerWins}/${stats.matches} (${pct(stats.strongerWins).toFixed(2)}%) draws=${stats.draws}`);
  console.log(`  damage/turn ${phaseDamage}`);
  console.log(`  finishTurn ${histogram}`);
}

console.log('=== Controlled Big-Match Length Diagnosis ===');
console.log(`trialsPerGapAndRule=${trials} seed=${baseSeed}`);
console.log('fixedCard: left OVR=80, right OVR=80-gap; every stat equals OVR; full-health start');

const allStats = new Map();
for (const gap of gaps) {
  const left = makeFighter(`controlled-left-${gap}`, 'Controlled Left', 80);
  const right = makeFighter(`controlled-right-${gap}`, 'Controlled Right', 80 - gap);
  const normal = createStats(1);
  const big = createStats(2);
  for (let index = 0; index < trials; index++) {
    const pairedSeed = Engine.rng.derive(baseSeed, gap, index);
    const normalResult = Engine.battle.simulateMatch(left, right, Engine.rng.create(pairedSeed), 1, { recordFrames: true });
    const bigResult = Engine.battle.simulateMatch(left, right, Engine.rng.create(pairedSeed), 2, { recordFrames: true });
    recordResult(normal, normalResult, 1);
    recordResult(big, bigResult, 2);
  }
  allStats.set(gap, { normal, big });
  formatSummary(gap, 'normal', normal);
  formatSummary(gap, 'big', big);
}

console.log('=== Direct Comparison ===');
for (const gap of gaps) {
  const { normal, big } = allStats.get(gap);
  const normalTurns = normal.turns / normal.matches;
  const bigTurns = big.turns / big.matches;
  const normalHp = normal.maxHpTotal / normal.maxHpFighters;
  const bigHp = big.maxHpTotal / big.maxHpFighters;
  console.log(`gap=${gap} deltaTurns=${(bigTurns - normalTurns).toFixed(3)} ratioTurns=${(bigTurns / normalTurns).toFixed(3)} ratioMaxHP=${(bigHp / normalHp).toFixed(3)}`);
}
