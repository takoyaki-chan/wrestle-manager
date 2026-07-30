'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const management = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');

[
  'springTagChampion',
  'autumnWarChampion',
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
  management.includes("e.type === 'autumnWar' && e.season === state.season && e.result === 'champion'"),
  'Autumn war champion team must come from the current-season career result'
);
assert.ok(
  management.includes('bestTag.awardedSeason === state.season'),
  'spring tag champions must be limited to the current season'
);

// 新人王はジュニアトーナメント優勝者に授与される。OVR だけで選ぶ旧方式は廃止済み。
assert.ok(
  management.includes('rookieOfYear: jtChampion'),
  'rookie of the year must be the junior tournament champion'
);
assert.ok(
  !management.includes('selectRookie(state)'),
  'the OVR-only rookie selection must be removed'
);
assert.ok(
  !ui.includes('_buildRookieAward'),
  'the standalone rookie slide must be removed (merged into the JT slide)'
);
assert.ok(
  ui.includes("<span class=\"aw-tag\">新人王</span>"),
  'the JT slide must show the rookie-of-the-year title'
);
// 同一功績への二重加点（JT優勝 8pt + 新人賞 5pt）は廃止した。
assert.ok(
  !management.includes('id: `rookie_${s.season}`'),
  'the separate rookie achievement point must be gone'
);

// スライドビルダーの kind 文字列と設定キーが一致していること（不一致だと無言でスキップされる）。
['springTag', 'autumnWar', 'tenchosen', 'ppvFinal'].forEach(kind => {
  assert.ok(
    new RegExp(`${kind}:\\s*\\{ icon:`).test(ui),
    `_buildSeasonEventChampionAward must define the ${kind} variant`
  );
  assert.ok(
    ui.includes(`, '${kind}')`),
    `_buildSeasonEventChampionAward must be called with the ${kind} kind`
  );
});

// 表彰式は2部構成（今年の大会 → 個人表彰）。
assert.ok(
  ui.includes("const SEC_EVENT = '今年の大会'") && ui.includes("const SEC_AWARD = '個人表彰'"),
  'the ceremony must be split into the two sections'
);

console.log('year-end-event-awards-test: ok');
