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

function fighter(id) {
  return {
    id,
    name: `F${id}`,
    pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    condition: 80, popularity: 40, trust: 60,
    injury: null,
  };
}

const resolvedPairKey = Engine.factions._sortedPairKey(1, 2);
const state = {
  season: 1,
  week: 10,
  roster: [fighter(1), fighter(2), fighter(3), fighter(4)],
  relationships: {},
  factions: [
    {
      id: 1, name: '赤組', leaderId: 1, memberIds: [1, 2],
      type: 'loyal', inHostility: true, momentum: 28,
    },
    {
      id: 2, name: '青組', leaderId: 3, memberIds: [3, 4],
      type: 'loyal', inHostility: true, momentum: -22,
    },
  ],
  factionHostility: { '1>2': 100, '2>1': 100 },
  factionPendingIgnite: { factionAId: 1, factionBId: 2 },
  f02MediationWatches: [
    { factionAId: 1, factionBId: 2 },
    { factionAId: 10, factionBId: 11 },
  ],
  factionReconciliationStreak: { [resolvedPairKey]: 5, '10|11': 3 },
  factionEndlessStreak: { [resolvedPairKey]: 17, '10|11': 8 },
  factionTimeline: [],
};

const result = Engine.factions.applyF02ResolutionResult(state, {
  winnerId: 1,
  loserId: 3,
  winnerFactionId: 1,
  loserFactionId: 2,
}, Engine.rng.create(123));
const next = result.state;

for (const factionId of [1, 2]) {
  const faction = next.factions.find(f => f.id === factionId);
  assert.strictEqual(faction.inHostility, false, '決着後は抗争状態を解除する');
  assert.strictEqual(faction.momentum, 0, '決着後は抗争の勢いをリセットする');
}
assert.strictEqual(next.factionHostility['1>2'], 60, '対立度は冷却用の関係値として残す');
assert.strictEqual(next.factionHostility['2>1'], 60, '対立度は両方向とも冷却用に残す');
assert.ok(!('factionPendingIgnite' in next), '決着したペアの煽り予約を残さない');
assert.deepStrictEqual(next.f02MediationWatches, [{ factionAId: 10, factionBId: 11 }], '同ペアの仲裁監視だけを消す');
assert.deepStrictEqual(next.factionReconciliationStreak, { '10|11': 3 }, '同ペアの和解連続カウントを消す');
assert.deepStrictEqual(next.factionEndlessStreak, { '10|11': 8 }, '同ペアの長期抗争カウントを消す');
assert.ok(!Engine.factions.rollResolutionAfterMatch(next, { winnerId: 1, loserId: 3, isDraw: false }).pendingEvent, '決着済みペアは再び決着イベントを出さない');

console.log('faction resolution cleanup tests passed');
