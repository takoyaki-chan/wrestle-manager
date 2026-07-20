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
const normalClimax = Number(process.argv[4] ?? PHASES[PHASES.length - 1].mult);
const bigClimax = Number(process.argv[5] ?? BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult);
const gaps = [0, 5, 10, 15, 20];

PHASES[PHASES.length - 1].mult = normalClimax;
BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult = bigClimax;

function fighter(id, rating) {
  return {
    id, name: id, surname: id, pw: rating, sp: rating, te: rating,
    st: rating, mn: rating, popularity: 50, style: 'Allround', traits: [],
    personality: 'normal', archetype: 'normal', age: 28, condition: 100,
  };
}

function createStats() {
  return {
    matches: 0, turns: 0, climax: 0, climaxTurns: 0,
    finishers: 0, zeroFinisherMatches: 0, timeouts: 0, mq: 0,
    smallFallGu: 0, consecutiveBig: 0,
    wins: Object.fromEntries(gaps.map(gap => [gap, 0])),
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
  const finishers = Math.max(0, (selection.finisher || 0) - (selection.forcedFinisher || 0));
  target.finishers += finishers;
  if (finishers === 0) target.zeroFinisherMatches++;
  target.consecutiveBig += selection.consecutiveBig || 0;
  if (result.finMoveTier === 'small' && result.finType !== 'TKO') target.smallFallGu++;
  if (result.winner === 'left') target.wins[gap]++;
}

function summarize(target) {
  const pct = value => value / target.matches * 100;
  return {
    matches: target.matches,
    avgTurns: +(target.turns / target.matches).toFixed(3),
    climaxPct: +pct(target.climax).toFixed(3),
    climaxStay: +(target.climaxTurns / target.matches).toFixed(3),
    finishersPerMatch: +(target.finishers / target.matches).toFixed(3),
    zeroFinisherPct: +pct(target.zeroFinisherMatches).toFixed(3),
    timeoutPct: +pct(target.timeouts).toFixed(3),
    avgMq: +(target.mq / target.matches).toFixed(3),
    smallFallGu: target.smallFallGu,
    consecutiveBig: target.consecutiveBig,
    winRates: Object.fromEntries(gaps.map(gap => [gap, +(target.wins[gap] / trials * 100).toFixed(3)])),
  };
}

const normal = createStats();
const big = createStats();
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
  config: {
    trialsPerGap: trials,
    baseSeed,
    normalClimax,
    bigClimax,
    normalFinisherUnlock: ENG.finisherUnlockHpThreshold,
    bigFinisherUnlock: BIGMATCH_ENG.finisherUnlockHpThreshold,
  },
  normal: summarize(normal),
  big: summarize(big),
}, null, 2));
