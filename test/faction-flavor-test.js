const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
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

function makeFighter(id, ovr = 60) {
  return {
    id,
    name: `F${id}`,
    orgId: 'player',
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    style: 'Allround',
    role: 'Neutral',
    personality: 'normal',
    archetype: 'normal',
    injury: null,
    isRental: false,
    age: 22,
    popularity: 40,
    condition: 80,
    trust: 60,
  };
}

function setBond(state, fromId, toId, bond) {
  state.relationships[`${fromId}>${toId}`] = { bond, rivalry: 0 };
}

function makeState(roster, seed = 12345) {
  return {
    season: 1,
    week: 1,
    rngSeed: seed,
    roster,
    relationships: {},
    factions: [],
    factionEventCooldowns: {},
    factionHostility: {},
  };
}

function withFloatSequence(values, fn) {
  const original = Engine.rng.float;
  let idx = 0;
  Engine.rng.float = () => {
    const value = values[Math.min(idx, values.length - 1)];
    idx += 1;
    return value;
  };
  try {
    fn();
  } finally {
    Engine.rng.float = original;
  }
}

function buildJoinState(flavor) {
  const roster = [makeFighter(1), makeFighter(2), makeFighter(3), makeFighter(4)];
  const state = makeState(roster);
  roster.slice(1).forEach(member => {
    setBond(state, member.id, 1, 70);
    setBond(state, 1, member.id, 70);
  });
  setBond(state, 4, 2, 70);
  setBond(state, 4, 3, 70);
  state.factions = [{
    id: 1,
    name: 'Test',
    leaderId: 1,
    memberIds: [1, 2, 3],
    flavor,
    type: 'loyal',
    status: 'active',
    momentum: 0,
  }];
  return state;
}

{
  const roster = [makeFighter(1, 62), makeFighter(2, 61), makeFighter(3, 60)];
  const state = makeState(roster, 777);
  for (const a of roster) {
    for (const b of roster) {
      if (a.id === b.id) continue;
      setBond(state, a.id, b.id, 90);
    }
  }
  const flavor = Engine.factions._decideFactionFlavor(state, 1, [1, 2, 3], Engine.rng.create(1));
  assert.strictEqual(flavor, 'bond_first');
}

{
  const roster = [makeFighter(1, 90), makeFighter(2, 88), makeFighter(3, 86)];
  const state = makeState(roster, 888);
  for (const a of roster) {
    for (const b of roster) {
      if (a.id === b.id) continue;
      setBond(state, a.id, b.id, 60);
    }
  }
  const flavor = Engine.factions._decideFactionFlavor(state, 1, [1, 2, 3], Engine.rng.create(1));
  assert.strictEqual(flavor, 'meritocratic');
}

{
  const rng = {};
  const bondState = buildJoinState('bond_first');
  withFloatSequence([0.11], () => {
    const s2 = Engine.factions.processWeeklyMemberChanges(bondState, rng);
    assert.strictEqual(s2.factions[0].memberIds.length, 4);
  });

  const neutralState = buildJoinState('neutral');
  withFloatSequence([0.11], () => {
    const s2 = Engine.factions.processWeeklyMemberChanges(neutralState, rng);
    assert.strictEqual(s2.factions[0].memberIds.length, 4);
  });

  const meritState = buildJoinState('meritocratic');
  withFloatSequence([0.11], () => {
    const s2 = Engine.factions.processWeeklyMemberChanges(meritState, rng);
    assert.strictEqual(s2.factions[0].memberIds.length, 3);
  });
}

{
  const state = buildJoinState(undefined);
  withFloatSequence([0.1], () => {
    const s2 = Engine.factions.processWeeklyMemberChanges(state, {});
    assert.strictEqual(s2.factions[0].flavor, 'neutral');
    assert.strictEqual(s2.factions[0].memberIds.length, 4);
  });
}

{
  const roster = [makeFighter(1, 95)];
  for (let i = 2; i <= 12; i++) roster.push(makeFighter(i, 60));
  const state = makeState(roster, 999);
  for (let i = 2; i <= 12; i++) {
    setBond(state, i, 1, 60 + i);
    setBond(state, 1, i, 60 + i);
  }
  const loyal = Engine.factions.checkLoyalFormationConditions(state);
  assert.strictEqual(loyal.eligible, true);
  assert.deepStrictEqual(loyal.followerIds, [12, 11, 10]);

  const applied = Engine.factions.applyF01Choice(state, {
    leaderId: loyal.leaderId,
    leaderName: loyal.leaderName,
    followerIds: loyal.followerIds,
  }, 'C', Engine.rng.create(1));
  assert.strictEqual(applied.state.factions.length, 1);
  assert.deepStrictEqual(applied.state.factions[0].memberIds, [1, 12, 11, 10]);
}

console.log('faction-flavor-test: ok');
