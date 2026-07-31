'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', 'src');
const renderSource = fs.readFileSync(path.join(srcDir, 'ui-render.js'), 'utf8');
const commonSource = fs.readFileSync(path.join(srcDir, 'ui-common.js'), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} が見つかりません`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} の終端が見つかりません`);
}

const tooltipMatch = renderSource.match(/const TRAINING_FATIGUE_TOOLTIP = ('[^']+');/);
assert(tooltipMatch, 'ツールチップ定数が見つかりません');
const context = vm.createContext({});
vm.runInContext([
  `const TRAINING_FATIGUE_TOOLTIP = ${tooltipMatch[1]};`,
  extractFunction(renderSource, 'getTrainingState'),
  extractFunction(renderSource, 'renderTrainingFatigueSignal'),
].join('\n'), context);

function stateFor(fighter) {
  return vm.runInContext(`getTrainingState(${JSON.stringify(fighter)})`, context);
}

function signalFor(fighter, placement) {
  return vm.runInContext(`renderTrainingFatigueSignal(${JSON.stringify(fighter)}, ${JSON.stringify(placement)})`, context);
}

// 表示用の3段階への畳み込み。未設定は新加入・履歴なし選手を想定する。
assert.strictEqual(stateFor({ _heat: 0 }), 'fresh');
assert.strictEqual(stateFor({ _heat: 1 }), 'warm');
assert.strictEqual(stateFor({ _heat: 2 }), 'warm');
assert.strictEqual(stateFor({ _heat: 3 }), 'heavy');
assert.strictEqual(stateFor({ _heat: 4 }), 'heavy');
assert.strictEqual(stateFor({}), 'fresh');

// UI出力には内部名・数値・倍率を含めない。
const heavyHtml = signalFor({ _heat: 3 }, 'week');
assert.match(heavyHtml, /training-fatigue-sign/);
assert.match(heavyHtml, /追い込みを続けると体が重くなり、同じ練習でも身につきにくくなる。休ませると戻る。/);
assert.doesNotMatch(heavyHtml, /_heat|intensive|\d|[×xX]/);
assert.strictEqual(signalFor({ _heat: 2 }, 'week'), '');

// レンタル・怪我中・新加入（履歴なし）も表示専用処理で例外にならない。
assert.doesNotThrow(() => signalFor({ isRental: true, injury: null, _heat: 3 }));
assert.doesNotThrow(() => signalFor({ injury: { type: '捻挫' }, _heat: 4 }));
assert.doesNotThrow(() => signalFor({ isRental: false }));

// 選手詳細は承認済みの personality×archetype プールを参照する。
assert.match(commonSource, /function getHeatStateQuote\(state, fighter\)/);
assert.match(commonSource, /pickDialogueLine\(HEAT_STATE_SELF_LINES\[state\], fighter\)/);
assert.match(commonSource, /getHeatStateQuote\(trainingState, c\)/);

console.log('heat-visibility-test: PASS');
