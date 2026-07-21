'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const management = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');

assert(app.includes('_migrated_roster_cap_away_guest_repair_v1'), 'affected saves must receive a one-time roster-cap repair');
assert(app.includes("filter(f => !f?.isAwayChallengeGuest)"), 'save repair must remove stale away guests');
assert(!app.includes('ownCount > 12'), 'temporary roster size must never unlock the 16-person cap');
assert(!app.includes('(state.rosterCap || 0) >= 16'), 'a previously corrupted cap must not self-perpetuate');
assert(management.includes('!f.isRental && !f.isAwayChallengeGuest'), 'away guests must be excluded from organization rankings');

console.log('roster-cap-away-guest-guard-test: ok');
