#!/usr/bin/env node
'use strict';

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

const trials = Math.max(1, Number(process.argv[2]) || 2000);
const baseSeed = Number(process.argv[3]) || 42;
const defStaScale = Number(process.argv[4] ?? ENG.defStaScale);
const normalClimax = Number(process.argv[5] ?? PHASES[PHASES.length - 1].mult);
const bigClimax = Number(process.argv[6] ?? BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult);
const normalEnd = Number(process.argv[7] ?? PHASES[PHASES.length - 2].mult);
const bigEnd = Number(process.argv[8] ?? BIGMATCH_PHASES[BIGMATCH_PHASES.length - 2].mult);
const gaps = [0, 5, 10, 15, 20];

ENG.defStaScale = defStaScale;
PHASES[PHASES.length - 1].mult = normalClimax;
BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult = bigClimax;
PHASES[PHASES.length - 2].mult = normalEnd;
BIGMATCH_PHASES[BIGMATCH_PHASES.length - 2].mult = bigEnd;

function fighter(id, rating) {
  return {
    id, name: id, surname: id, pw: rating, sp: rating, te: rating,
    st: rating, mn: rating, popularity: 50, style: 'Allround', traits: [],
    personality: 'normal', archetype: 'normal', age: 28, condition: 100,
  };
}

function stats() {
  return {
    matches: 0, turns: 0, climax: 0, climaxTurns: 0, finishers: 0,
    timeouts: 0, mq: 0, smallFallGu: 0, consecutiveBig: 0,
    wins: Object.fromEntries(gaps.map(gap => [gap, 0])),
    opening: {
      eligible: 0, checked: 0, fired: 0, hit: 0, finishes: 0,
      damageBands: { shallow: 0, medium: 0, deep: 0, fatal: 0 },
    },
  };
}

function record(target, result, gap, phases) {
  target.matches++;
  target.turns += result.turns || 0;
  target.mq += result.mq || 0;
  const climaxStart = phases[phases.length - 1].min;
  if ((result.turns || 0) >= climaxStart) target.climax++;
  target.climaxTurns += Math.max(0, (result.turns || 0) - climaxStart + 1);
  if (result.finishPhase === 'Timeout') target.timeouts++;
  const selection = result.moveSelectionStats || {};
  target.finishers += Math.max(0, (selection.finisher || 0) - (selection.forcedFinisher || 0));
  target.consecutiveBig += selection.consecutiveBig || 0;
  if (result.finMoveTier === 'small' && result.finType !== 'TKO') target.smallFallGu++;
  if (result.winner === 'left') target.wins[gap]++;
  if (result.openingExecutionEligible) {
    target.opening.eligible++;
    if (result.openingExecutionChecked) target.opening.checked++;
    if (result.openingExecution) {
      target.opening.fired++;
      if (result.openingExecutionHit) target.opening.hit++;
      if (result.openingExecutionData?.finished) target.opening.finishes++;
      const band = result.openingExecutionData?.damageBand;
      if (band && target.opening.damageBands[band] != null) target.opening.damageBands[band]++;
    }
  }
}

function summarize(target) {
  const pct = value => value / target.matches * 100;
  return {
    matches: target.matches,
    avgTurns: +(target.turns / target.matches).toFixed(3),
    climaxPct: +pct(target.climax).toFixed(3),
    climaxStay: +(target.climaxTurns / target.matches).toFixed(3),
    finishersPerMatch: +(target.finishers / target.matches).toFixed(3),
    timeoutPct: +pct(target.timeouts).toFixed(3),
    avgMq: +(target.mq / target.matches).toFixed(3),
    smallFallGu: target.smallFallGu,
    consecutiveBig: target.consecutiveBig,
    winRates: Object.fromEntries(gaps.map(gap => [gap, +(target.wins[gap] / trials * 100).toFixed(3)])),
    opening: {
      ...target.opening,
      firedPerEligiblePct: target.opening.eligible ? +(target.opening.fired / target.opening.eligible * 100).toFixed(3) : 0,
      hitPerFiredPct: target.opening.fired ? +(target.opening.hit / target.opening.fired * 100).toFixed(3) : 0,
    },
  };
}

const normal = stats();
const big = stats();
for (const gap of gaps) {
  const left = fighter(`left-${gap}`, 80);
  const right = fighter(`right-${gap}`, 80 - gap);
  for (let index = 0; index < trials; index++) {
    const seed = Engine.rng.derive(baseSeed, gap, index);
    record(normal, Engine.battle.simulateMatch(left, right, Engine.rng.create(seed), 1), gap, PHASES);
    record(big, Engine.battle.simulateMatch(left, right, Engine.rng.create(seed), 2), gap, BIGMATCH_PHASES);
  }
}

console.log(JSON.stringify({
  config: { trialsPerGap: trials, baseSeed, defStaScale, normalClimax, bigClimax, normalEnd, bigEnd },
  hp: {
    normal: [40, 60, 90].map(st => Math.round(ENG.hpBase + st * ENG.hpScale)),
    big: [40, 60, 90].map(st => Math.round(BIGMATCH_ENG.hpBase + st * BIGMATCH_ENG.hpScale)),
  },
  normal: summarize(normal),
  big: summarize(big),
}, null, 2));
