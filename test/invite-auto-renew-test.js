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

function makeFighter(id, name) {
  return {
    id,
    name,
    style: 'Allround',
    personality: 'normal',
    age: 20,
    trust: 50,
    popularity: 40,
    condition: 70,
    pw: 40,
    sp: 40,
    te: 40,
    st: 40,
    mn: 40,
    trainCap: { pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
    injury: null,
    onLeave: null,
    isRental: false,
    pendingTrustDeltas: [],
  };
}

function makeState(overrides = {}) {
  return {
    rngSeed: 123,
    season: 1,
    week: 1,
    funds: 1000000,
    decisionPoints: 6,
    decisionPointsMax: 6,
    orgPop: 60,
    roster: [makeFighter(1, 'Aoi')],
    coaches: [],
    coachAssign: {},
    ...overrides,
  };
}

function pickCoachId(state) {
  return Engine.shachoshitsu.ensureInviteMarket(state).candidateIds[0];
}

(function testTrainerInviteStoresAutoRenewFlag() {
  const state = makeState();
  const coachId = pickCoachId(state);
  const result = Engine.shachoshitsu.execute('trainer', 1, state, { coachId, autoRenew: true });

  assert.ok(!result.error, result.error || 'trainer execute should succeed');
  assert.strictEqual(result.roster[0]._inviteBuff.autoRenew, true, 'auto-renew flag should be stored on invite buff');
})();

(function testExtensionConsumesFundsAndDecisionPoints() {
  const state = makeState();
  const coachId = pickCoachId(state);
  const invited = Engine.shachoshitsu.execute('trainer', 1, state, { coachId, autoRenew: true });
  const activeState = {
    ...state,
    roster: invited.roster,
    funds: invited.funds,
    decisionPoints: invited.decisionPoints,
  };
  const coach = ALL_COACHES.find(c => c.id === coachId);
  const expectedCost = Engine.shachoshitsu.getInviteExtensionCost(coach);
  const expectedDpCost = Engine.shachoshitsu.getInviteDecisionCost();

  const result = Engine.shachoshitsu.resolveInviteExtension(activeState, 1, true);

  assert.ok(!result.error, result.error || 'extension should succeed');
  assert.strictEqual(result.funds, activeState.funds - expectedCost, 'extension should deduct funds');
  assert.strictEqual(result.decisionPoints, activeState.decisionPoints - expectedDpCost, 'extension should deduct decision points');
  assert.strictEqual(result.roster[0]._inviteBuff.weeksLeft, activeState.roster[0]._inviteBuff.weeksLeft + 2);
  assert.strictEqual(result.roster[0]._inviteBuff.totalWeeks, activeState.roster[0]._inviteBuff.totalWeeks + 2);
})();

(function testExpiryAutoRenewsAndConsumesResources() {
  const state = makeState();
  const coachId = pickCoachId(state);
  const invited = Engine.shachoshitsu.execute('trainer', 1, state, { coachId, autoRenew: true });
  const activeState = {
    ...state,
    roster: invited.roster.map(f => ({
      ...f,
      _inviteBuff: { ...f._inviteBuff, weeksLeft: 1, totalWeeks: 4 },
    })),
    funds: invited.funds,
    decisionPoints: invited.decisionPoints,
  };
  const coach = ALL_COACHES.find(c => c.id === coachId);
  const expectedCost = Engine.shachoshitsu.getInviteCost(coach, activeState);
  const expectedDpCost = Engine.shachoshitsu.getInviteDecisionCost();

  const result = Engine.shachoshitsu.tickInviteBuffs(activeState);

  assert.strictEqual(result.inviteEvents.length, 0, 'auto-renew should not emit graduation');
  assert.strictEqual(result.roster[0]._inviteBuff.weeksLeft, 4, 'renewed invite should restart at 4 weeks');
  assert.strictEqual(result.roster[0]._inviteBuff.totalWeeks, 4, 'renewed invite should restart its base duration');
  assert.strictEqual(result.roster[0]._inviteBuff.autoRenew, true, 'renewed invite should keep auto-renew enabled');
  assert.strictEqual(result.funds, activeState.funds - expectedCost, 'auto-renew should deduct funds');
  assert.strictEqual(result.decisionPoints, activeState.decisionPoints - expectedDpCost, 'auto-renew should deduct decision points');
})();

(function testExtendedInviteRenewsAfterExtensionEnds() {
  const state = makeState();
  const coachId = pickCoachId(state);
  const invited = Engine.shachoshitsu.execute('trainer', 1, state, { coachId, autoRenew: true });
  const activeState = {
    ...state,
    roster: invited.roster.map(f => ({
      ...f,
      _inviteBuff: { ...f._inviteBuff, weeksLeft: 1, totalWeeks: 6 },
    })),
    funds: invited.funds,
    decisionPoints: invited.decisionPoints,
  };

  const result = Engine.shachoshitsu.tickInviteBuffs(activeState);

  assert.strictEqual(result.roster[0]._inviteBuff.weeksLeft, 4, 'auto-renew should trigger when the extended term actually ends');
  assert.strictEqual(result.roster[0]._inviteBuff.totalWeeks, 4, 'renewal after extension should start a fresh 4-week term');
})();

console.log('invite-auto-renew-test: ok');
