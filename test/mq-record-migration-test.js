#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js 繝｢繧ｸ繝･繝ｼ繝ｫ繧ｨ繧ｯ繧ｹ繝昴・繝・\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js',
].forEach(loadAsGlobal);

const oldSave = {
  season: 8,
  week: 17,
  roster: [{ id: 1, careerBestMQ: 103 }],
  aiOrgs: {
    org_s: { roster: [{ id: 2, careerBestMQ: 111 }] },
    org_a: { roster: [{ id: 3, careerBestMQ: 98 }] },
  },
  freeAgents: [{ id: 4, careerBestMQ: 117 }],
  retiredFighters: [{ id: 5, careerBestMQ: 114 }],
};
const oldSnapshot = JSON.stringify(oldSave);
const migrated = Engine.mq.migrateRecord(oldSave);

assert.strictEqual(JSON.stringify(oldSave), oldSnapshot, 'migration must not mutate old save');
assert.strictEqual(migrated.mqRecord.value, 117, 'highest saved careerBestMQ must seed record');
assert.strictEqual(migrated.mqRecord.holderIds, null, 'historical holder is unknown');
assert.strictEqual(migrated.mqRecord.orgId, null, 'historical org is unknown');
assert.strictEqual(migrated._migrated_mq_record_v1, true, 'migration marker');

const existingRecord = {
  ...oldSave,
  mqRecord: {
    value: 123,
    holderIds: [8, 9],
    orgId: 'player',
    season: 7,
    week: 40,
    stage: 'normal',
  },
};
const preserved = Engine.mq.migrateRecord(existingRecord);
assert.deepStrictEqual(preserved.mqRecord, existingRecord.mqRecord, 'existing record must be preserved');
assert.strictEqual(preserved._migrated_mq_record_v1, true, 'existing record gets marker once');
assert.strictEqual(
  Engine.mq.migrateRecord(preserved),
  preserved,
  'marked save must not be rebuilt');

const tied = Engine.mq.updateRecord(migrated, { mq: 117 }, {
  holderIds: [6, 7],
  orgId: 'player',
  stage: 'normal',
});
assert.strictEqual(tied.updated, false, 'tie must not replace all-time record');
assert.strictEqual(tied.state, migrated, 'tie must preserve state reference');

const updated = Engine.mq.updateRecord(migrated, { mq: 121 }, {
  holderIds: [6, 7, 6],
  orgId: 'player',
  stage: 'normal',
});
assert.strictEqual(updated.updated, true, 'strictly higher MQ must update');
assert.notStrictEqual(updated.state, migrated, 'record update must be immutable');
assert.deepStrictEqual(updated.record, {
  value: 121,
  holderIds: [6, 7],
  orgId: 'player',
  season: 8,
  week: 17,
  stage: 'normal',
});
assert.strictEqual(migrated.mqRecord.value, 117, 'prior state remains unchanged');

const incomplete = Engine.mq.updateRecord(migrated, { mq: 130 }, {
  holderIds: [6],
  stage: 'normal',
});
assert.strictEqual(incomplete.updated, false, 'records require two to four holders');

console.log('mq-record-migration-test: PASS');
