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
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js'].forEach(loadAsGlobal);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function maxHp(eng, stamina) {
  return Math.round(eng.hpBase + Engine.util.eff(stamina) * eng.hpScale);
}

const normal40 = maxHp(ENG, 40);
const normal60 = maxHp(ENG, 60);
const normal90 = maxHp(ENG, 90);
const big40 = maxHp(BIGMATCH_ENG, 40);
const big60 = maxHp(BIGMATCH_ENG, 60);
const big90 = maxHp(BIGMATCH_ENG, 90);

assert(normal60 === 291, `normal ST60 HP must remain 291, got ${normal60}`);
assert(big60 === 482, `big-match ST60 HP must remain 482, got ${big60}`);
assert(normal90 / normal40 >= 1.50, `normal high-ST ratio must be >= 1.50, got ${normal90 / normal40}`);
assert(big90 / big40 >= 1.40, `big-match high-ST ratio must be >= 1.40, got ${big90 / big40}`);
assert(ENG.defStaScale === 0.025, `direct ST defense scale must match the established value, got ${ENG.defStaScale}`);
assert(PHASES[PHASES.length - 1].mult === 1.54, 'normal Climax multiplier must match task-12 calibration');
assert(BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].mult === 1.79, 'big-match Climax multiplier must match task-12 calibration');

const pacingCases = [
  [18, 2, false, 0], [14, 2, false, 3], [13, 2, false, 12],
  [14, 2, true, 0], [10, 2, true, 3], [9, 2, true, 12],
  [8, 1, false, 0], [6, 1, false, 3], [5, 1, false, 12],
  [6, 1, true, 0], [4, 1, true, 3], [3, 1, true, 12],
];
for (const [turns, tier, hikidashi, expected] of pacingCases) {
  const actual = Engine.battle.pacingPenalty(turns, tier, hikidashi);
  assert(actual === expected, `pacing penalty ${turns}/${tier}/${hikidashi}: expected ${expected}, got ${actual}`);
}

console.log(`hp-shape-and-pacing-test: OK normal=${normal40}/${normal60}/${normal90} (${(normal90 / normal40).toFixed(3)}x) big=${big40}/${big60}/${big90} (${(big90 / big40).toFixed(3)}x)`);
