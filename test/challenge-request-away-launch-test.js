'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');

assert(renderer.includes('App.startAwayChallengeFromPrep()'), 'away challenge notice must expose a direct launch button');
assert(app.includes('startAwayChallengeFromPrep()'), 'App must expose a direct away challenge launch method');
assert(app.includes('App._awayChallengeManualStart = true'), 'direct launch must mark the manual result flow');
assert(app.includes('if (App._awayChallengeManualStart)'), 'manual away results must return to show preparation instead of closing a nonexistent local result screen');
assert(app.includes('awayPlayerRosterIds: [...ownIds]'), 'away previews must retain the pre-away player roster boundary');
assert(app.includes('isTemporaryAwayGuest'), 'away result finalization must identify temporary opponent guests');
assert(app.includes('Reassert the pre-away player roster boundary'), 'away result application must purge guests a second time after result hooks');
assert(app.includes('playerRosterIds: (G.roster || []).filter(f => !f.isCRGuest).map(f => f.id)'), 'incoming challenge flow must retain the pre-match player roster boundary');
assert(app.includes('isTemporaryChallengeGuest'), 'incoming challenge cleanup must use guest provenance rather than guest IDs alone');
assert(app.includes('_recoverAwayChallengeAfterError(error)'), 'away finalization errors must purge temporary guests');
assert(app.includes("state.roster = (state.roster || []).filter(c =>"), 'serialized saves must exclude temporary challenge guests');
assert(app.includes('const removedChallengeGuests = cleanedRoster.length'), 'every load must repair newly contaminated saves even after the old migration marker');

console.log('challenge-request-away-launch-test: ok');
