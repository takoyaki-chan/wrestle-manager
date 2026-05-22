const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'app.js');
const appSource = fs.readFileSync(appPath, 'utf8');

function getMethodBody(source, name) {
  const start = source.indexOf(`  ${name}() {`);
  assert.ok(start >= 0, `${name} method should exist`);

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return source.slice(bodyStart + 1, i);
  }
  throw new Error(`Could not parse ${name} body`);
}

const advanceCurrentFlow = getMethodBody(appSource, 'advanceCurrentFlow');
const advanceWeek = getMethodBody(appSource, 'advanceWeek');

const scoutGuardInCurrentFlow = advanceCurrentFlow.indexOf("G.weekPhase === 'scoutEvent'");
const offSeasonAdvance = advanceCurrentFlow.indexOf("G.offSeason || G.weekPhase === 'offseason'");

assert.ok(scoutGuardInCurrentFlow >= 0, 'advanceCurrentFlow should handle scoutEvent explicitly');
assert.ok(offSeasonAdvance >= 0, 'advanceCurrentFlow should still advance offseason flow');
assert.ok(
  scoutGuardInCurrentFlow < offSeasonAdvance,
  'scoutEvent must be handled before the broad offSeason branch'
);
assert.ok(
  /showScreen\('scoutEvent'\)/.test(advanceCurrentFlow),
  'advanceCurrentFlow should return the user to the draft screen'
);

const scoutGuardInAdvanceWeek = advanceWeek.indexOf("G.weekPhase === 'scoutEvent'");
const engineAdvance = advanceWeek.indexOf('Engine.advanceWeek(G)');

assert.ok(scoutGuardInAdvanceWeek >= 0, 'advanceWeek should guard scoutEvent');
assert.ok(engineAdvance >= 0, 'advanceWeek should still call Engine.advanceWeek for normal flow');
assert.ok(
  scoutGuardInAdvanceWeek < engineAdvance,
  'advanceWeek must not call Engine.advanceWeek while a draft event is pending'
);
assert.ok(
  /showScreen\('scoutEvent'\)/.test(advanceWeek),
  'advanceWeek guard should keep the draft screen visible'
);

console.log('draft-offseason-flow-guard-test: ok');
