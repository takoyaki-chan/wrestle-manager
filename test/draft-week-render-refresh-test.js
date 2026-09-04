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
  /const weekLabel = G\.offSeason[\s\S]*?オフ第\{w\}週'[\s\S]*?G\.offWeek \|\| 3[\s\S]*?第\{w\}週'[\s\S]*?G\.week/,
  'scoutEvent refresh should define the week label for offseason and regular drafts'
);
// i18n P7-6: leadBody は直書きテンプレ文字列から WM_I18N.t(..., { week: weekLabel, ... }) 呼び出しへ
// 配線し直した(EN画面で生JAのまま露出していた穴の修正)。weekLabelは`${weekLabel}`という
// テンプレ埋め込みではなく `week: weekLabel` というt()パラメータとして使われるようになった。
assert.ok(
  scoutBranch.indexOf('const weekLabel') < scoutBranch.indexOf('week: weekLabel'),
  'weekLabel must be initialized before the draft newspaper markup uses it'
);

console.log('draft-week-render-refresh-test: ok');
