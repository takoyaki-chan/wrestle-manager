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

const matchesPerCondition = Math.max(100, Number(process.argv[2]) || 10000);
const baseSeed = Number(process.argv[3]) || 120042;
const afterNormalClimax = Number(process.argv[4] ?? PHASES[PHASES.length - 1].mult);
const afterBigClimax = Number(process.argv[5] ?? BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult);
const afterNormalEnd = Number(process.argv[6] ?? PHASES[PHASES.length - 2].mult);
const afterBigEnd = Number(process.argv[7] ?? BIGMATCH_PHASES[BIGMATCH_PHASES.length - 2].mult);
const levels = [90, 75, 60];
const statKeys = ['pw', 'sp', 'te', 'st', 'mn'];

if (matchesPerCondition % 2 !== 0) throw new Error('matchesPerCondition must be even for the two-leg comparison');
const seedsPerCondition = matchesPerCondition / 2;

const configs = [
  { name: 'task10', defStaScale: 0.0125, normalClimax: 1.45, bigClimax: 1.70, normalEnd: 1.05, bigEnd: 0.85 },
  { name: 'task12', defStaScale: 0.025, normalClimax: afterNormalClimax, bigClimax: afterBigClimax, normalEnd: afterNormalEnd, bigEnd: afterBigEnd },
];

function fighter(id, level, changedStat, delta) {
  const result = {
    id, name: `F${id}`, surname: `F${id}`, pw: level, sp: level, te: level,
    st: level, mn: level, popularity: 50, style: 'Allround', traits: [],
    personality: 'normal', archetype: 'normal', age: 28, condition: 100,
  };
  if (changedStat) result[changedStat] += delta;
  return result;
}

function applyConfig(config) {
  ENG.defStaScale = config.defStaScale;
  PHASES[PHASES.length - 1].mult = config.normalClimax;
  BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult = config.bigClimax;
  PHASES[PHASES.length - 2].mult = config.normalEnd;
  BIGMATCH_PHASES[BIGMATCH_PHASES.length - 2].mult = config.bigEnd;
}

function candidateWinRate(level, stat, delta, tier, configIndex) {
  let wins = 0, draws = 0;
  const candidateLeft = fighter(9101, level, stat, delta);
  const baselineRight = fighter(9102, level, null, 0);
  const baselineLeft = fighter(9101, level, null, 0);
  const candidateRight = fighter(9102, level, stat, delta);
  for (let index = 0; index < seedsPerCondition; index++) {
    const seed = Engine.rng.derive(baseSeed, configIndex, tier, level, statKeys.indexOf(stat), delta, index);
    const leftLeg = Engine.battle.simulateMatch(candidateLeft, baselineRight, Engine.rng.create(seed), tier);
    if (leftLeg.winner === 'left') wins++;
    else if (leftLeg.winner === 'draw') draws++;
    const rightLeg = Engine.battle.simulateMatch(baselineLeft, candidateRight, Engine.rng.create(seed), tier);
    if (rightLeg.winner === 'right') wins++;
    else if (rightLeg.winner === 'draw') draws++;
  }
  return {
    winRate: +(wins / matchesPerCondition * 100).toFixed(3),
    scoreRate: +((wins + draws * 0.5) / matchesPerCondition * 100).toFixed(3),
    draws,
  };
}

const output = {
  matchesPerCondition,
  seedsPerCondition,
  baseSeed,
  eff: Object.fromEntries([80, 90, 99, 100, 101, 110].map(value => [value, value])),
  configs: [],
};

for (let configIndex = 0; configIndex < configs.length; configIndex++) {
  const config = configs[configIndex];
  applyConfig(config);
  const rows = [];
  for (const tier of [1, 2]) {
    for (const level of levels) {
      for (const stat of statKeys) {
        for (const delta of [10, -10]) {
          rows.push({ tier, level, stat, delta, ...candidateWinRate(level, stat, delta, tier, configIndex) });
        }
      }
    }
  }
  output.configs.push({ ...config, rows });
}

console.log(JSON.stringify(output, null, 2));
