// special-event-week-block-test.js
//
// Calendar invariant:
//   - Every season's 12th week is a dedicated special-event week.
//   - Annual weeks 12/24/36/48 can never host an ordinary show.
//   - Cancellation/completion state must not reopen the ordinary-show route.

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
let management = read('src/management.js').replace(/^(const|let) /gm, 'var ');
new vm.Script(management, { filename: 'management.js' }).runInThisContext();

const app = read('src/app.js');
const uiCommon = read('src/ui-common.js');
const uiRender = read('src/ui-render.js');
const relationships = read('src/relationships.js');

const SPECIAL_WEEKS = [12, 24, 36, 48];
const REGULAR_NEIGHBORS = [2, 10, 14, 22, 26, 34, 38, 46];

assert.deepStrictEqual(
  SPECIAL_WEEKS,
  [
    Engine.springTagLeague.LEAGUE_WEEK,
    Engine.juniorTournament.WEEK,
    Engine.autumnWar.EVENT_WEEK,
    Engine.ppvTournament.SHOW_WEEK,
  ],
  '春夏秋冬の特別興行は、それぞれの季節の第12週（年12/24/36/48週）に固定すること'
);

SPECIAL_WEEKS.forEach(week => {
  assert.strictEqual(Engine.util.isSeasonSpecialEventWeek(week), true,
    `第${week}週は開催状態に依存しない特別興行予約週であること`);
  assert.strictEqual(Engine.util.isRegularShowWeek(week), false,
    `第${week}週に通常興行を許可しないこと`);

  const state = { week, showCard: [{ left: 1, right: 2 }] };
  const result = Engine.executeShow(state);
  assert.ok(result.error && result.error.includes('特別興行週'),
    `第${week}週は純エンジンを直接呼んでも通常興行を実行しないこと`);
  assert.deepStrictEqual(state, { week, showCard: [{ left: 1, right: 2 }] },
    `第${week}週の拒否で入力stateを変更しないこと`);
});

REGULAR_NEIGHBORS.forEach(week => {
  assert.strictEqual(Engine.util.isSeasonSpecialEventWeek(week), false,
    `第${week}週を特別興行週と誤判定しないこと`);
  assert.strictEqual(Engine.util.isRegularShowWeek(week), true,
    `第${week}週は通常興行週のままであること`);
});

assert.strictEqual(Engine.util.isSeasonSpecialEventWeek(0), false, '第0週を予約週にしないこと');
assert.strictEqual(Engine.util.isSeasonSpecialEventWeek(60), false, 'シーズン外の倍数を予約週にしないこと');

// Every ordinary-show boundary uses the calendar helper rather than event
// state such as `cancelled` or `completedSeason`.
assert.ok(/startShowPrep\(\) \{[\s\S]{0,600}!isRegularShowWeek\(G\.week\)/.test(app),
  'App.startShowPrep が通常興行専用週を確認すること');
assert.ok(/executeShow\(\) \{[\s\S]{0,900}!isRegularShowWeek\(G\.week\)/.test(app),
  'App.executeShow が通常興行専用週を再確認すること');
assert.ok(/function startShowPrep\(\)[\s\S]{0,500}!Engine\.util\.isRegularShowWeek\(G\.week\)/.test(uiCommon),
  '共通UIの興行準備入口も通常興行専用週を確認すること');
assert.ok(/function resumeShowPrep\(\)[\s\S]{0,500}!Engine\.util\.isRegularShowWeek\(G\.week\)/.test(uiCommon),
  '古いshowPrep状態からの再開でも特別興行週へ入れないこと');
assert.ok(/function renderShowPrep\(\)[\s\S]{0,900}isSeasonSpecialEventWeek\(G\.week\)/.test(uiRender),
  '興行準備画面は開催状態より先にカレンダー予約週を塞ぐこと');
assert.ok(uiRender.includes('const specialEventBlocked = Engine.util.isSeasonSpecialEventWeek(G.week);'),
  '週ダッシュボードはキャンセル状態ではなくカレンダーで通常興行を隠すこと');
assert.ok(management.includes('if (isRegularShow) {'),
  'AI団体も特別興行週に通常興行を実行しないこと');
assert.ok(relationships.includes('Engine.util?.isRegularShowWeek?.(week)'),
  '挑戦興行の予約判定も共通の通常興行週ルールを使うこと');

assert.ok(!app.includes('通常興行にフォールバック'),
  '大会不成立時に通常興行へ戻す旧仕様を残さないこと');
assert.ok(!uiRender.includes('試合枠+1'),
  '専用大会週を通常カード+1枠として案内しないこと');

console.log('special-event-week-block-test: PASS');
