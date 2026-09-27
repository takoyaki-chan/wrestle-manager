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

console.log('auto-rest-line-test: PASS');
