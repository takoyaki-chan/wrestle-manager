'use strict';

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

const resolve = (condition, state, action = 'practice') =>
  Engine.season.resolveAutoRestAction(action, condition, state);

assert.strictEqual(Engine.season.getAutoRestLine({}), 60, '旧セーブの既定値は60');
assert.deepStrictEqual(resolve(59, {}), { action: 'rest', autoRested: true }, '既定60未満は従来どおり自動休養');
assert.deepStrictEqual(resolve(60, {}), { action: 'practice', autoRested: false }, '既定60ちょうどは休養しない');
assert.deepStrictEqual(resolve(75, { autoRestLine: 80 }), { action: 'rest', autoRested: true }, '80設定では体調75が自動休養');
assert.strictEqual(resolve(30, { autoRestLine: 50 }).action, 'rest', '体調30以下の安全弁は設定にかかわらず休養');

// 「今週」タブに選択UIが出ていること(表示の取りこぼし防止)
const fs = require('fs');
const render = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
assert.ok(render.includes("App.setAutoRestLine(this.value)"), '自動休養ラインのセレクトが今週タブにある');
for (const label of ['体調50未満', '体調60未満', '体調70未満', '体調80未満']) {
  assert.ok(render.includes(label), `選択肢 ${label} がある`);
}
const lang = fs.readFileSync(path.join(__dirname, '..', 'src', 'lang-en.js'), 'utf8');
assert.ok(lang.includes('Auto-rest line'), '英語のラベルがある');

console.log('auto-rest-line-test: PASS');
