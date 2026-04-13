#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js 繝｢繧ｸ繝･繝ｼ繝ｫ繧ｨ繧ｯ繧ｹ繝昴・繝・\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('draft-negotiation.js');

const fixturePath = path.join(__dirname, 'fixtures', 'save-3seasons-seed42.json');
const save = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
const repaired = Engine.saveDoctor.repairOnLoad(save);

function assert(cond, message) {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(repaired.changed, 'expected repair to change broken fixture');
assert(repaired.after.freeAgents >= 3, `expected freeAgents >= 3, got ${repaired.after.freeAgents}`);
assert(repaired.after.dormant >= 20, `expected dormantPool >= 20, got ${repaired.after.dormant}`);
assert(repaired.after.youth >= 12, `expected dormant youth >= 12, got ${repaired.after.youth}`);
assert(repaired.after.missing.length === 0, `expected no missing IDs, got ${repaired.after.missing.length}`);
assert(repaired.after.duplicates.length === 0, `expected no duplicate IDs, got ${repaired.after.duplicates.length}`);
assert(repaired.after.missingRetiredSeasons.length === 0, `expected no missing retiredSeasons, got ${repaired.after.missingRetiredSeasons.length}`);

(function testRetiredFightersAreCarriedIntoRetiredIds() {
  const probe = Engine.saveDoctor.repairOnLoad({
    season: 4,
    week: 12,
    rngSeed: 7,
    roster: [],
    freeAgents: [],
    scoutCandidates: [],
    dormantPool: [],
    retiredIds: [],
    retiredSeasons: {},
    retiredFighters: [{ id: 1, name: '阿武隈塔子' }],
    aiOrgs: {},
  });

  assert(probe.state.retiredFighters.length === 1, 'expected retiredFighters to be preserved during repair');
  assert(!probe.after.missing.includes(1), 'expected retired fighter id to remain tracked after repair');
})();

console.log('PASS: save-doctor load repair restored the broken fixture');
