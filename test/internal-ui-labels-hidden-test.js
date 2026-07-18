const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function bodyOf(signature) {
  const start = ui.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const parenEnd = ui.indexOf(') {', start);
  const brace = parenEnd >= 0 ? parenEnd + 2 : ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(brace + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

const jtChampion = bodyOf('function renderJuniorTournamentResult');
assert.ok(!jtChampion.includes('Path'), 'JT champion screen must not show internal path label');
assert.ok(!jtChampion.includes('pathText'), 'JT champion screen must not compute/display bracket path text');
assert.ok(!jtChampion.includes('QF'), 'JT champion screen must not show QF abbreviation');
assert.ok(!jtChampion.includes('SF'), 'JT champion screen must not show SF abbreviation');

assert.ok(!ui.includes('TBD'), 'JT UI should not expose an internal TBD label');

const jtFocus = bodyOf('function _jtFocusCard');
assert.ok(!jtFocus.includes('START HP'), 'JT pre-match card should not show internal English start HP label');
assert.ok(jtFocus.includes("hpMidLabel: '開始HP'"), 'JT pre-match card should use player-facing start HP label');

const c1Result = bodyOf('function _renderCommon1MatchResult');
assert.ok(!c1Result.includes('finishPhase'), 'Common1 result should not expose battle engine phase labels');

console.log('internal-ui-labels-hidden-test: ok');
