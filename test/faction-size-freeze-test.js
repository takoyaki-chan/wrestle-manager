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

function makeFighter(id) {
  return {
    id,
    name: `F${id}`,
    orgId: 'player',
    pw: 60,
    sp: 60,
    te: 60,
    st: 60,
    mn: 60,
    style: 'Allround',
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

function setBondUniform(state, ids, bondValue) {
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      setBond(state, a, b, bondValue);
    }
  }
}

function makeStateWithFactions(factionSpecs, outsiderCount, outsiderBond = 85) {
  const state = {
    season: 1,
    week: 10,
    rngSeed: 12345,
    roster: [],
    relationships: {},
    factions: [],
    factionEventCooldowns: {},
    factionHostility: {},
    factionReconciliationStreak: {},
    factionEndlessStreak: {},
    f02MediationWatches: [],
  };

  let nextId = 1;
  const factionData = [];
  for (const spec of factionSpecs) {
    const memberIds = [];
    for (let i = 0; i < spec.size; i++) {
      state.roster.push(makeFighter(nextId));
      memberIds.push(nextId);
      nextId += 1;
    }
    setBondUniform(state, memberIds, 70);
    factionData.push({
      id: factionData.length + 1,
      name: `F${factionData.length + 1}組`,
      leaderId: memberIds[0],
      memberIds: [...memberIds],
      flavor: spec.flavor || 'neutral',
      type: 'loyal',
      status: 'active',
      momentum: spec.momentum || 0,
      inHostility: !!spec.inHostility,
      authoritativeTag: false,
      dictatorTag: false,
      createdWeek: 1,
    });
  }
  state.factions = factionData;

  const outsiderIds = [];
  for (let i = 0; i < outsiderCount; i++) {
    state.roster.push(makeFighter(nextId));
    outsiderIds.push(nextId);
    nextId += 1;
  }
  for (const oid of outsiderIds) {
    for (const fac of factionData) {
      for (const mid of fac.memberIds) {
        setBond(state, oid, mid, outsiderBond);
        setBond(state, mid, oid, outsiderBond);
      }
    }
  }

  return state;
}

function withZeroRng(fn) {
  const original = Engine.rng.float;
  Engine.rng.float = () => 0;
  try {
    fn();
  } finally {
    Engine.rng.float = original;
  }
}

withZeroRng(() => {
  const soloFrozen = makeStateWithFactions([{ size: 6 }], 3);
  const s1 = Engine.factions.processWeeklyMemberChanges(soloFrozen, {});
  assert.strictEqual(s1.factions[0].memberIds.length, 6);

  const soloGrowing = makeStateWithFactions([{ size: 5, flavor: 'bond_first' }], 1);
  const s2 = Engine.factions.processWeeklyMemberChanges(soloGrowing, {});
  assert.strictEqual(s2.factions[0].memberIds.length, 6);

  const twoFactions = makeStateWithFactions([{ size: 6 }, { size: 3 }], 2);
  const s3 = Engine.factions.processWeeklyMemberChanges(twoFactions, {});
  assert.strictEqual(s3.factions[0].memberIds.length, 7);
  assert.strictEqual(s3.factions[1].memberIds.length, 4);

  const hostileMomentum = makeStateWithFactions([
    { size: 5, flavor: 'neutral', momentum: 50, inHostility: true },
    { size: 3 },
  ], 1);
  const s4 = Engine.factions.processWeeklyMemberChanges(hostileMomentum, {});
  assert.strictEqual(s4.factions[0].memberIds.length, 6);
});

console.log('faction-size-freeze-test: ok');
