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
loadAsGlobal('management.js');
loadAsGlobal('relationships.js');

function fighter(id, ovr, extra = {}) {
  return {
    id,
    name: `F${id}`,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    popularity: 30,
    age: 20,
    orgTimeline: [{ orgId: extra.orgId || 'player', fromSeason: 1, fromWeek: 1 }],
    ...extra,
  };
}

function pot(avg) {
  return { pw: avg, sp: avg, te: avg, st: avg, mn: avg };
}

function buildAiOrgs() {
  return {
    org_s: {
      roster: Array.from({ length: AI_SCOUT_CFG.S.idealRoster }, (_, i) => fighter(1000 + i, 40 + i, { orgId: 'org_s' })),
    },
    org_a: {
      roster: Array.from({ length: AI_SCOUT_CFG.A.idealRoster }, (_, i) => fighter(2000 + i, 38 + i, { orgId: 'org_a' })),
    },
    org_b: {
      roster: Array.from({ length: AI_SCOUT_CFG.B.idealRoster }, (_, i) => fighter(3000 + i, 35 + i, { orgId: 'org_b' })),
    },
  };
}

(function testHighOvrDepartureIsClaimedAndReplacesWeakest() {
  const star = fighter(1, 78, { name: 'Departed Star' });
  const state = {
    rngSeed: 123,
    season: 3,
    week: 6,
    roster: [],
    freeAgents: [],
    dormantPool: [],
    aiOrgs: buildAiOrgs(),
  };

  const result = Engine.rival.claimDepartedStar(Engine.rng.create(1), state, star);

  assert.strictEqual(result.claimed, true, 'OVR 75+ departed fighter should be claimed immediately');
  assert.ok(result.orgId, 'claim should name the acquiring org');
  assert.ok(result.state.aiOrgs[result.orgId].roster.some(f => f.id === star.id), 'star should move to AI roster');
  assert.strictEqual(result.state.freeAgents.some(f => f.id === star.id), false, 'star should not remain in FA');
  assert.ok(result.ejected, 'full AI roster should eject its weakest fighter');
  assert.ok(result.state.dormantPool.some(e => e.id === result.ejected.id), 'ejected fighter should leave active roster');
})();

(function testLowerOvrDepartureIsNotClaimed() {
  const mid = fighter(2, 70, { name: 'Useful Midcarder' });
  const state = {
    rngSeed: 123,
    season: 3,
    week: 6,
    roster: [],
    freeAgents: [],
    dormantPool: [],
    aiOrgs: buildAiOrgs(),
  };

  const result = Engine.rival.claimDepartedStar(Engine.rng.create(2), state, mid);

  assert.strictEqual(result.claimed, false, 'OVR below 75 should follow normal departure flow');
})();

(function testEliteTrainCapDepartureIsClaimedEvenWithLowerOvr() {
  const prospect = fighter(3, 62, { name: 'Elite Prospect', trainCap: pot(150), assessedTier: 'elite' });
  const state = {
    rngSeed: 123,
    season: 3,
    week: 6,
    roster: [],
    freeAgents: [],
    dormantPool: [],
    aiOrgs: buildAiOrgs(),
  };

  const result = Engine.rival.claimDepartedStar(Engine.rng.create(3), state, prospect);

  assert.strictEqual(result.claimed, true, 'elite-potential departed fighter should be claimed even below OVR 75');
  assert.ok(result.state.aiOrgs[result.orgId].roster.some(f => f.id === prospect.id), 'elite prospect should move to AI roster');
})();

(function testLowTrainCapOverridesHighTemplatePotential() {
  const capped = fighter(5, 62, {
    name: 'Capped Template Star',
    pot: pot(180),
    trainCap: pot(90),
    assessedTier: 'elite',
  });
  const state = {
    rngSeed: 123,
    season: 3,
    week: 6,
    roster: [],
    freeAgents: [],
    dormantPool: [],
    aiOrgs: buildAiOrgs(),
  };

  const result = Engine.rival.claimDepartedStar(Engine.rng.create(5), state, capped);

  assert.strictEqual(result.claimed, false, 'low trainCap should override high template pot/assessedTier for below-OVR claim checks');
})();

(function testAIReleasePolicyProtectsYoungEliteProspect() {
  const prospect = fighter(4001, 38, {
    name: 'Protected Prospect',
    age: 18,
    orgId: 'org_s',
    trainCap: pot(150),
    pot: pot(150),
    assessedTier: 'elite',
  });
  const veteran = fighter(4002, 50, {
    name: 'Low Ceiling Veteran',
    age: 27,
    orgId: 'org_s',
    trainCap: pot(70),
    pot: pot(70),
    assessedTier: 'material',
  });
  const aiOrgs = buildAiOrgs();
  aiOrgs.org_s.roster = [
    prospect,
    veteran,
    ...Array.from({ length: AI_SCOUT_CFG.S.idealRoster - 2 }, (_, i) => fighter(4100 + i, 56 + i, { orgId: 'org_s', trainCap: pot(90), pot: pot(90) })),
  ];
  const state = {
    rngSeed: 123,
    season: 3,
    week: 6,
    roster: [],
    freeAgents: [],
    dormantPool: [],
    aiOrgs,
  };

  const result = Engine.rival.claimDepartedStar(Engine.rng.create(4), state, fighter(4, 82, { name: 'Incoming Ace' }));

  assert.strictEqual(result.claimed, true, 'incoming ace should be claimed');
  assert.notStrictEqual(result.ejected.id, prospect.id, 'AI should not eject a young elite prospect just because current OVR is low');
  assert.strictEqual(result.ejected.id, veteran.id, 'AI should eject the low-ceiling veteran first');
})();

console.log('departed-star-claim-test: ok');
