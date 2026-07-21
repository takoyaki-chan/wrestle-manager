const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
const scoutBranchStart = source.indexOf("else if (G.weekPhase === 'scoutEvent') {");
const nextBranchStart = source.indexOf("\n  else if (", scoutBranchStart + 1);
const scoutBranch = source.slice(
  scoutBranchStart,
  nextBranchStart >= 0 ? nextBranchStart : source.length
);

assert.ok(scoutBranchStart >= 0, 'renderWeekScreen should contain the scoutEvent branch');
assert.match(
  scoutBranch,
  /const weekLabel = G\.offSeason[\s\S]*?オフ第\$\{G\.offWeek \|\| 3\}週[\s\S]*?第\$\{G\.week\}週/,
  'scoutEvent refresh should define the week label for offseason and regular drafts'
);
assert.ok(
  scoutBranch.indexOf('const weekLabel') < scoutBranch.indexOf('${weekLabel}'),
  'weekLabel must be initialized before the draft newspaper markup uses it'
);

console.log('draft-week-render-refresh-test: ok');
