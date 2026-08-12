'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ factions: true });

const oldSave = {
  factionHostility: {
    '1>2': 98.50000000000001,
    '2>1': '63.70000000000001',
    '3>4': Number.POSITIVE_INFINITY,
    '4>5': -12,
    '5>6': 100.00000000000001,
  },
};
const repaired = Engine.factions.normalizeFactionHostility(oldSave);
assert.deepStrictEqual(repaired.factionHostility, {
  '1>2': 98.5,
  '2>1': 63.7,
  '5>6': 100,
}, '旧セーブの長い小数・文字列・範囲外値を正規化する');

let changed = Engine.factions.applyHostilityChange({
  factionHostility: { '1>2': 98.8 },
}, 1, 2, -0.3);
assert.strictEqual(changed.factionHostility['1>2'], 98.5, '通常更新で 98.50000000000001 を保存しない');

changed = Engine.factions.processWeeklyHostilityDecay({
  factionHostility: { '1>2': 98.8 },
  factions: [{ id: 1, memberIds: [] }, { id: 2, memberIds: [] }],
});
assert.strictEqual(changed.factionHostility['1>2'], 98.5, '週次減衰でも小数誤差を保存しない');

let repeated = {
  factionHostility: { '1>2': 100 },
  factions: [{ id: 1, memberIds: [] }, { id: 2, memberIds: [] }],
};
for (let i = 0; i < 250; i++) {
  repeated = Engine.factions.processWeeklyHostilityDecay(repeated);
  const value = repeated.factionHostility['1>2'];
  if (value == null) break;
  assert.strictEqual(value, Math.round(value * 10) / 10, `週次減衰${i + 1}回目で小数誤差が再発した`);
  assert.ok(String(value).length <= 5, `表示不能な長い数値が残った: ${value}`);
}

const srcDir = path.join(__dirname, '..', 'src');
const factionSource = fs.readFileSync(path.join(srcDir, 'factions.js'), 'utf8');
const appSource = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
const managementSource = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');

assert.strictEqual(
  (factionSource.match(/this\._normalizeHostility\(val \* cfg\.hostilityLeaderChangeMultiplier\)/g) || []).length,
  2,
  'リーダー交代の両経路も敵対度を正規化する'
);
assert.ok(appSource.includes('G = Engine.factions.normalizeFactionHostility(G);'), 'ロード時の旧セーブ補正を外さない');
assert.ok(managementSource.includes('s = Engine.factions.normalizeFactionHostility(s);'), '週次判定前の防波堤を外さない');
assert.strictEqual(Engine.factions.getHostilityLabel(98.5), '血みどろ', '高い敵対度は既存の最上位ラベルへ変換する');
assert.strictEqual(Engine.factions.getHostilityLabel(63.7), '泥沼', '小数の敵対度も既存の段位ラベルへ変換する');

console.log('faction hostility precision tests passed');
