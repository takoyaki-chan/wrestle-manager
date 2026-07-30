'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

const igniteStart = app.indexOf("} else if (eventId === 'F02_IGNITE')");
const igniteEnd = app.indexOf("} else if (eventId === 'F02_RESOLUTION')", igniteStart);
assert.ok(igniteStart >= 0 && igniteEnd > igniteStart, 'F02 ignition flow should exist');
const igniteFlow = app.slice(igniteStart, igniteEnd);

assert.match(igniteFlow, /factionPair:\s*\[/, 'ignition result should include both factions');
assert.match(igniteFlow, /leaderAId/, 'ignition result should include the first faction leader');
assert.match(igniteFlow, /leaderBId/, 'ignition result should include the opposing faction leader');
assert.match(igniteFlow, /reporterText:/, 'ignition result should explain the official match booking');
assert.match(ui, /const factionPair = Array\.isArray\(opts\.factionPair\)/, 'result view should accept faction pairs');
assert.match(ui, /mdl-a-faction-clash-stage/, 'result view should render the faction clash stage');
assert.match(ui, /MAIN EVENT ・ OFFICIAL/, 'result view should label the official main event');
assert.match(ui, /opts\.reporterText \|\|/, 'result view should render event-specific reporting text');
assert.match(css, /\.mdl-a-faction-clash\s*\{/, 'faction clash layout should have dedicated styles');
assert.match(css, /\.mdl-a-faction-clash-portrait\s*\{/, 'faction clash leaders should have portrait styles');

console.log('faction-ignite-result-layout-test: passed');
