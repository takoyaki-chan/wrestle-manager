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

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('factions.js');

function fighter(id, ovr) {
  return {
    id,
    name: `F${id}`,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    personality: 'earnest',
    archetype: 'standard',
  };
}

function state() {
  return {
    season: 2,
    week: 30,
    roster: [fighter(1, 80), fighter(2, 70), fighter(3, 82), fighter(4, 72)],
    factions: [
      { id: 10, name: 'A派', leaderId: 1, memberIds: [1, 2], status: 'active' },
      { id: 20, name: 'B派', leaderId: 3, memberIds: [3, 4], status: 'active' },
    ],
    factionRivalryPoints: {},
  };
}

const ctx = {
  fighterIdA: 1,
  fighterIdB: 3,
  winner: 'A',
  isMain: false,
  isTitle: false,
  isTag: false,
  isF09: true,
};

{
  const s = state();
  const before = JSON.stringify(s);
  const calc = Engine.factions.calculateRivalryPointsForMatch(s, ctx);
  assert.deepStrictEqual(calc, {
    pt: 18,
    factionAId: 10,
    factionBId: 20,
    winnerFactionId: 10,
    rankKey: 'top',
    multiplier: 1,
  });
  assert.strictEqual(JSON.stringify(s), before, 'モーダル用の事前計算はゲーム状態を変更しない');

  Engine.factions.accrueRivalryPointsFromMatch(s, ctx);
  const entry = s.factionRivalryPoints[Engine.factions._pairKey(10, 20)];
  assert.strictEqual(entry.pointsA, calc.pt, '本番加算とモーダル表示の差分を同じ計算にする');
  assert.strictEqual(entry.pointsB, 0);
}

{
  const s = state();
  s.roster.find(f => f.id === 1).pw = 70;
  s.roster.find(f => f.id === 1).sp = 70;
  s.roster.find(f => f.id === 1).te = 70;
  s.roster.find(f => f.id === 1).st = 70;
  s.roster.find(f => f.id === 1).mn = 70;
  const calc = Engine.factions.calculateRivalryPointsForMatch(s, ctx);
  assert.strictEqual(calc.pt, 22, 'F09下剋上補正も表示差分へ反映する');
}

const appSource = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
assert.ok(appSource.includes('calculateRivalryPointsForMatch(G,'), 'F09試合後モーダルを純計算へ接続する');
assert.ok(appSource.includes('ptDelta: currentCalc ? currentCalc.pt : 0'), '0固定表示を戻さない');

console.log('faction-f09-match-post-points-test: ok');
