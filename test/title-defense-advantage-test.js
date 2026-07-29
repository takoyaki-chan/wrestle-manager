'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

['victory-lines.js', 'data.js', 'management.js', 'match-engine.js', 'relationships.js'].forEach(loadAsGlobal);

function fighter(id) {
  return { id, name: `F${id}`, pw: 70, sp: 70, te: 70, st: 70, mn: 70, popularity: 50, trust: 50, traits: [] };
}

const roster = [fighter(1), fighter(2)];
const state = { roster, titles: { world: { championId: 1 } } };

const normalDefense = Engine.mq.buildRingInOpts(state, 1, 2, {
  roster, isTitle: true, normalShowRingExtras: true,
});
assert.deepStrictEqual(normalDefense.simOpts.championDefenseEscape, [0.02, 0],
  '通常興行の防衛戦では王者だけに脱出率+2ポイントを渡す');

const reversedDefense = Engine.mq.buildRingInOpts(state, 2, 1, {
  roster, isTitle: true, normalShowRingExtras: true,
});
assert.deepStrictEqual(reversedDefense.simOpts.championDefenseEscape, [0, 0.02],
  '王者が右側でも補正対象を正しく判定する');

const ppvTitle = Engine.mq.buildRingInOpts(state, 1, 2, { roster, isTitle: true });
assert.deepStrictEqual(ppvTitle.simOpts.championDefenseEscape, [0, 0],
  'PPV・大会戦など通常興行外のタイトル戦には補正しない');

const vacantTitle = Engine.mq.buildRingInOpts({ roster, titles: { world: { championId: null } } }, 1, 2, {
  roster, isTitle: true, normalShowRingExtras: true,
});
assert.deepStrictEqual(vacantTitle.simOpts.championDefenseEscape, [0, 0],
  '初代王者決定戦には補正しない');

const simulated = Engine.battle.simulateMatch(roster[0], roster[1], Engine.rng.create(123), 2, normalDefense.simOpts);
assert.deepStrictEqual(simulated.championDefenseEscape, [0.02, 0],
  '試合エンジンへ王者補正が引き継がれる');

console.log('title-defense-advantage-test: ok');
