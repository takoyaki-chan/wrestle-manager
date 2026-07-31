'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const common = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');

assert.ok(common.includes('function showTitleMatchCeremony(outcome, onDone)'),
  'title outcomes should have a dedicated ceremony adapter');
assert.ok(common.includes('showCeremonyEvent(evt, speakers'),
  'title ceremony must use the shared milestone ceremony component');
assert.ok(common.includes("visualVariant: 'triumph'"),
  'title ceremony should use the existing triumph ceremony presentation');
assert.ok(common.includes("titleDefense") && common.includes("titleWin"),
  'defenses and title wins must select their respective fighter dialogue');
assert.ok(app.includes("typeof evt.lineForFighter === 'function'"),
  'the shared ceremony must accept event-provided fighter lines');
assert.ok(app.includes("const speakerCountClass = speakers.length === 1"),
  'the shared ceremony should center title ceremonies with one speaker');
assert.ok(app.includes('showTitleMatchCeremony(outcome, done)'),
  'title outcomes should be queued in the regular post-show ceremony flow');
assert.ok(app.includes("outcome: 'change', newChampId: rd.challengerId"),
  'successful title reclaims should also receive the title ceremony');
assert.ok(!common.includes('tmc-card'),
  'title ceremony must not introduce a separate popup frame');

console.log('title-match-ceremony-test: ok');
