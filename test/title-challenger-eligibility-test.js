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

loadAsGlobal('data.js');
loadAsGlobal('management.js');

function fighter(id, ovr, extra = {}) {
  return {
    id,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    injury: null,
    isRental: false,
    ...extra,
  };
}

const roster = [
  fighter(1, 100),
  fighter(2, 99),
  fighter(3, 98),
  fighter(4, 97),
  fighter(5, 96),
  fighter(6, 95),
  fighter(7, 92),
  fighter(8, 91),
  fighter(9, 110, { injury: { weeksLeft: 2 } }),
  fighter(10, 110, { isRental: true }),
];

const playerEligible = new Set(Engine.title.getEligibleChallengers(roster, 1));
assert.ok(playerEligible.has(6), 'player policy should allow the fifth-ranked challenger');
assert.ok(playerEligible.has(7), 'player policy should allow a challenger within an OVR gap of 8');
assert.ok(!playerEligible.has(8), 'player policy should reject a challenger outside both limits');
assert.ok(!playerEligible.has(9), 'injured wrestlers should remain ineligible');
assert.ok(!playerEligible.has(10), 'rental wrestlers should remain ineligible');

const aiEligible = new Set(Engine.title.getEligibleChallengers(roster, 1, 'ai'));
assert.ok(aiEligible.has(4), 'AI policy should allow the third-ranked challenger');
assert.ok(aiEligible.has(6), 'AI policy should allow a challenger within an OVR gap of 5');
assert.ok(!aiEligible.has(7), 'AI policy should reject a challenger outside the stricter limits');

const reportedCaseRoster = [
  fighter(21, 100),
  fighter(22, 99),
  fighter(23, 98),
  fighter(24, 97),
  fighter(25, 94),
];
assert.ok(
  Engine.title.getEligibleChallengers(reportedCaseRoster, 21).includes(25),
  'the reported overall-rank-5, OVR-gap-6 challenger should be eligible for player booking',
);
assert.ok(
  !Engine.title.getEligibleChallengers(reportedCaseRoster, 21, 'ai').includes(25),
  'the same challenger should remain outside the stricter AI policy',
);

console.log('title-challenger-eligibility-test: ok');
