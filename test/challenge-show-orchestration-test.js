'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function methodBody(signature) {
  const token = `${signature} {`;
  const start = app.indexOf(token);
  assert.ok(start >= 0, `${signature} must exist`);
  const bodyStart = start + token.length;
  let depth = 1;
  for (let i = bodyStart; i < app.length; i++) {
    if (app[i] === '{') depth++;
    else if (app[i] === '}') depth--;
    if (depth === 0) return app.slice(bodyStart, i);
  }
  throw new Error(`${signature} end not found`);
}

const accept = methodBody('handleChallengeRequest(payload)');
assert.ok(accept.includes('_pendingIncomingChallengeMatch'));
assert.ok(accept.includes('_pendingAwayChallengeMatch'));
assert.ok(!accept.includes('resolveMatchCard'), 'accepting a challenge must never resolve matches immediately');

const largeEvent = methodBody('_executeLargeEventMatch(event, prevResult)');
assert.ok(largeEvent.includes('_pendingIncomingB3Match'));
assert.ok(!largeEvent.includes('_renderB3MatchPreview'), 'B3 acceptance must reserve an ordinary-show match');

const startAway = methodBody('_startAwayChallengeShow()');
assert.ok(startAway.includes('isAwayChallenge: true'));
assert.ok(startAway.includes('_awayChallengeMatch: true'));

const executeShow = methodBody('executeShow()');
assert.ok(executeShow.includes('App.startAwayChallengeFromPrep()'), 'local show execution must resolve an away booking first');
assert.ok(
  executeShow.indexOf('App.startAwayChallengeFromPrep()') < executeShow.indexOf('const eligibleChallengeShow'),
  'away booking gate must run before the local show card is prepared'
);

const finishAway = methodBody('_finalizeAwayChallengeShow()');
assert.ok(finishAway.includes('Engine.relationships.applyMatchResult'));
assert.ok(finishAway.includes('Engine.injury.check'));
assert.ok(finishAway.includes('seasonGrowth'));
assert.ok(finishAway.includes('_applyChallengeRequestResult'));
assert.ok(!finishAway.includes('attendance'), 'away challenge must not add player attendance revenue');
assert.ok(!finishAway.includes('funds:'), 'away challenge must not add player show funds');

const closeResult = methodBody('closeShowResult()');
assert.ok(!closeResult.includes('App._startAwayChallengeShow()'), 'completed local shows must not re-enter the unsafe legacy away branch');

console.log('challenge-show-orchestration-test: ok');
