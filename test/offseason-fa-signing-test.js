'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const uiSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

const scoutStart = uiSource.indexOf('function _renderShachoshitsuScoutDesk()');
const scoutEnd = uiSource.indexOf('\nfunction _renderShachoshitsuRentalDesk()', scoutStart);
assert.ok(scoutStart >= 0 && scoutEnd > scoutStart, 'scout desk source must be found');

const scoutDesk = uiSource.slice(scoutStart, scoutEnd);
assert.ok(!scoutDesk.includes('if (G.offSeason)'),
  'free-agent contracts must remain available during the offseason');
assert.ok(scoutDesk.includes("showFighterPopup(${c.id},'free',true)"),
  'eligible free agents must retain their contract action');

const signStart = appSource.indexOf('  signFighter(charId) {');
const signEnd = appSource.indexOf('  _normalizeFighterForRoster(fighter) {', signStart);
assert.ok(signStart >= 0 && signEnd > signStart, 'signFighter source must be found');
assert.ok(!appSource.slice(signStart, signEnd).includes('G.offSeason'),
  'the signing action must not reject offseason contracts');

console.log('offseason-fa-signing-test: ok');
