'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const factions = fs.readFileSync(path.join(root, 'src', 'factions.js'), 'utf8');

const eventStart = app.indexOf("} else if (eventId === 'F02_RESOLUTION') {");
const eventEnd = app.indexOf("\n    } else if (eventId ===", eventStart + 1);
assert.ok(eventStart >= 0 && eventEnd > eventStart, 'F02 resolution event handler is missing');
const eventHandler = app.slice(eventStart, eventEnd);

assert.ok(factions.includes('winnerFactionName: facW.name, loserFactionName: facL.name'),
  'F02 resolution payload must retain both faction names');
assert.ok(eventHandler.includes('winFaction: payload.winnerFactionName'),
  'resolution newspaper must use the winner faction name from the F02 payload');
assert.ok(eventHandler.includes('loseFaction: payload.loserFactionName'),
  'resolution newspaper must use the loser faction name from the F02 payload');
assert.ok(!eventHandler.includes('payload.winFactionName'),
  'resolution newspaper must not read the obsolete winFactionName field');
assert.ok(!eventHandler.includes('payload.loseFactionName'),
  'resolution newspaper must not read the obsolete loseFactionName field');

console.log('faction-resolution-newspaper-names-test: ok');
