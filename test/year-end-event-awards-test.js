'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const management = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');

[
  'springTagChampion',
  'tenchosenChampion',
  'ppvFinalWinner',
].forEach(key => {
  assert.ok(management.includes(key), `${key} must be generated for year-end awards`);
  assert.ok(ui.includes(`awards.${key}`), `${key} must have a ceremony slide`);
  assert.ok(ui.includes(`a.${key}`), `${key} must appear in the ceremony summary`);
});

assert.ok(
  management.includes("e.type === 'ppvTournament' && e.season === state.season && e.result === 'champion'"),
  'Tenchosen champion must come from the current-season career result'
);
assert.ok(
  management.includes("e.type === 'ppvMainEvent' && e.season === state.season && e.isSummit && e.won"),
  'PPV award must identify the current-season final-match winner'
);
assert.ok(
  management.includes('bestTag.awardedSeason === state.season'),
  'spring tag champions must be limited to the current season'
);
assert.ok(
  management.includes('(f.orgTimeline || []).some(t => t.fromSeason === state.season)'),
  'rookie selection must retain offseason-join compatibility'
);

console.log('year-end-event-awards-test: ok');
