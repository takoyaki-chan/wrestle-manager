'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');
const uiCommon = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');

// away-flow-redesign (2026-07-25): the show-prep banner + manual "遠征対抗戦を実行" button
// were removed from ui-render.js. startShowPrep() (ui-common.js) now calls
// App.beginAwayChallengeTravel() to play the travel scene and start the away show
// automatically, before the show-prep card editor is ever rendered — so the manual
// entry point in the renderer is no longer needed. startAwayChallengeFromPrep() itself
// stays in app.js as a safety-valve fallback (called from executeShow() and from
// beginAwayChallengeTravel()'s own fallback), which the assertions below still cover.
assert(app.includes('startAwayChallengeFromPrep()'), 'App must expose a direct away challenge launch method');
assert(app.includes('beginAwayChallengeTravel()'), 'App must expose the travel-scene-gated away challenge entry point');
assert(uiCommon.includes('App.beginAwayChallengeTravel()'), 'startShowPrep must call App.beginAwayChallengeTravel() before rendering the show-prep card editor');
assert(!renderer.includes('onclick="App.startAwayChallengeFromPrep()"'), 'the show-prep manual away-challenge launch button must not resurface in the renderer');
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
