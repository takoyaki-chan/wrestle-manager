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
loadAsGlobal('engine.js');

function makeFighter(id, name) {
  return {
    id,
    name,
    style: 'Allround',
    trust: 50,
    popularity: 60,
    salaryBonus: 0,
    injury: null,
  };
}

function buildState(seed) {
  const base = Engine.createInitialState(seed, true);
  const fighter = makeFighter(101, 'Matsushita');
  const teammate = makeFighter(102, 'Akamori');
  const coachId = ALL_COACHES[0].id;
  const targetOrg = RIVAL_ORGS[0];
  return {
    ...base,
    season: 1,
    week: 1,
    funds: 1000000,
    roster: [fighter, teammate],
    coaches: [coachId],
    coachAssign: { [coachId]: [fighter.id] },
    relationships: null,
    aiOrgs: {
      ...base.aiOrgs,
      [targetOrg.id]: { ...base.aiOrgs[targetOrg.id], roster: [] },
    },
    pendingPoach: [{ fighter, org: targetOrg, fee: 123456 }],
  };
}

function findFailedDefenseSeed() {
  for (let seed = 1; seed < 20000; seed++) {
    const rng = Engine.rng.create(Engine.rng.derive(seed, 1, 1, 101));
    if (Engine.rng.float(rng) >= TRANSFER_CONFIG.nonChampionRetentionRate) return seed;
  }
  throw new Error('failed to find seed that produces a failed defense');
}

function testSanitizeAssignments() {
  const coachId = ALL_COACHES[0].id;
  const state = {
    roster: [makeFighter(1, 'A')],
    coaches: [coachId],
    coachAssign: { [coachId]: [1, 999, 1], 9999: [1] },
  };
  const sanitized = Engine.coach.sanitizeAssignments(state);
  assert.deepStrictEqual(sanitized, { [coachId]: [1] });
}

function testFailedPoachClearsCoachAssignment() {
  const seed = findFailedDefenseSeed();
  const state = buildState(seed);
  const coachId = state.coaches[0];
  const result = Engine.transfer.resolvePoach(state, 101, false).state;

  assert.ok(result.roster.every(f => f.id !== 101), 'fighter should leave roster after failed defense');
  assert.deepStrictEqual(result.coachAssign[coachId], [], 'coach assignment should be cleared after failed defense');
}

function testProcessDepartureClearsCoachAssignment() {
  const state = buildState(77);
  const coachId = state.coaches[0];
  const fighter = state.roster[0];
  const rng = Engine.rng.create(1234);
  const result = Engine.contract.processDeparture(rng, fighter, state).state;

  assert.ok(result.roster.every(f => f.id !== fighter.id), 'fighter should leave roster during generic departure');
  assert.deepStrictEqual(result.coachAssign[coachId], [], 'coach assignment should be cleared during generic departure');
}

testSanitizeAssignments();
testFailedPoachClearsCoachAssignment();
testProcessDepartureClearsCoachAssignment();

console.log('coach-poach-assignment-test: ok');
