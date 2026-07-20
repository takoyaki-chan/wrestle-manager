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

const fighter = { id: 'atk', name: 'Attacker', style: 'Allround', bigMoveCooldown: true };
const defender = { id: 'def', name: 'Defender', hp: 20, mhp: 100 };
const bigOnlyPhase = [{ name: 'Climax', min: 1, max: 1, mult: 1, tierW: { small: 0, medium: 0, big: 100 }, rollupRate: 0, counterBonus: 0 }];
const unlocked = Engine.battle.selMove(Engine.rng.create(42), fighter.style, 1, bigOnlyPhase, {
  fighter,
  defender,
  eng: ENG,
});
assert(unlocked.d >= 14 && unlocked.d <= 16, 'cooldown must still allow an unlocked finisher');
assert(fighter.bigMoveCooldown === false, 'a finisher must not start normal-big cooldown');

fighter.bigMoveCooldown = false;
defender.hp = defender.mhp;
const normalBig = Engine.battle.selMove(Engine.rng.create(42), fighter.style, 1, bigOnlyPhase, {
  fighter,
  defender,
  eng: ENG,
});
assert(normalBig.d >= 11 && normalBig.d <= 13, 'locked finishers must leave only normal big moves');
assert(fighter.bigMoveCooldown === true, 'a normal big move must start cooldown');

console.log('finisher cooldown test: OK');
