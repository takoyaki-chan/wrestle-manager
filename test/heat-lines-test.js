'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const data = require('../src/data.js');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const norm = value => JSON.parse(JSON.stringify(value));

function flattenSelf(lines) {
  return Object.values(lines).flatMap(state =>
    Object.values(state).flatMap(personality => Object.values(personality).flat()));
}

function parseApprovedDraft() {
  const blocks = read('docs/dialogue/heat-visibility-lines-draft-v0.1.md').match(/```js\n([\s\S]*?)```/g);
  assert.ok(blocks && blocks.length >= 2, '承認草案の2つのJavaScriptブロックが見つからない');
  const code = blocks.map(block => block.replace(/^```js\n/, '').replace(/```$/, '')).join('\n')
    + '\n;this.__heatLines = { HEAT_STATE_SELF_LINES, HEAT_STATE_COACH_LINES };';
  const sandbox = {};
  vm.runInNewContext(code, sandbox);
  return sandbox.__heatLines;
}

const approved = parseApprovedDraft();

assert.deepStrictEqual(norm(data.HEAT_STATE_SELF_LINES), norm(approved.HEAT_STATE_SELF_LINES),
  '選手側セリフが承認草案と一字一句一致する');
assert.deepStrictEqual(norm(data.HEAT_STATE_COACH_LINES), norm(approved.HEAT_STATE_COACH_LINES),
  'コーチ側セリフが承認草案と一字一句一致する');
assert.strictEqual(data.EVENT_LINES_BY_KEY.heatSelf, data.HEAT_STATE_SELF_LINES, 'heatSelf がレジストリ登録されている');
assert.strictEqual(data.EVENT_LINES_BY_KEY.heatCoach, data.HEAT_STATE_COACH_LINES, 'heatCoach がレジストリ登録されている');

const allLines = [...flattenSelf(data.HEAT_STATE_SELF_LINES), ...Object.values(data.HEAT_STATE_COACH_LINES).flat()];
assert.ok(allLines.every(line => line.length <= 43), '全セリフが43文字以内');

const personalities = ['normal', 'bold', 'easygoing', 'earnest', 'emotional', 'quiet', 'shy'];
for (const state of ['fresh', 'warm', 'heavy']) {
  for (const personality of personalities) {
    assert.doesNotThrow(() => data.pickDialogueLine(data.HEAT_STATE_SELF_LINES[state], { personality }),
      `${state}/${personality} が _default までフォールバックする`);
  }
}

const recoveryLines = data.HEAT_STATE_COACH_LINES.heavy.filter(line =>
  line.includes('休ませれば戻る') || line.includes('一週抜けばまた入るようになる'));
assert.ok(recoveryLines.length >= 2, 'heavy プールに回復ルールを明示する2本が残っている');

const forbidden = /(?:[0-9０-９]|_heat|intensiveHeatTable|GROWTH_CONFIG|倍率|trainCap|seasonIntensiveWeeks)/;
assert.ok(allLines.every(line => !forbidden.test(line)), 'セリフ本文に数値・倍率・内部変数名を露出しない');

const commonSource = read('src/ui-common.js');
const renderSource = read('src/ui-render.js');
assert.ok(!commonSource.includes('pickDialogueLine(HEAT_STATE_SELF_LINES[state], fighter)'),
  '未接続の選手本人向け熱量セリフを選手詳細へ戻さない');
assert.ok(renderSource.includes('HEAT_STATE_COACH_LINES[heatState]'), '道場コーチ吹き出しが状態別プールを引く');
assert.ok(renderSource.includes("heavyFighters[0] || reportFighter"), 'heavy の選手をコーチ観察の優先対象にする');
assert.ok(renderSource.includes('speechText = heatPool'),
  '同じコーチ報告枠を差し替え、strain 系との同週重複を防ぐ');

console.log('heat-lines-test: PASS');
