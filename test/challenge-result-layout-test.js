// challenge-result-layout-test.js
//
// 2026-07-27: 挑戦試合の結果画面（📜 果たし状、成就。）で、
// **敗れた側と勝った側を横に並べる**。
//
// Keisuke「対抗戦関係で敗北と勝者の横並びになるはずなのに、縦並びになっている」
//
// 原因: 2つの .crrm-reaction-scene をラッパー無しで並べていたため、
// それぞれが margin:auto の独立ブロックとして縦に積まれ、
// 対戦の結果なのに2画面ぶんの高さを食っていた。
//
// 守るもの:
//   1. 2人出るときは横並びのラッパーで囲む
//   2. ラッパーは flex 横並び・下端揃い（勝者だけ画像が大きくても土台が揃う）
//   3. 狭い画面でも縦積みに戻さない（戻すと結局2画面ぶんの高さになる）
//   4. 1人だけのとき（引き分け等）も中央に出る

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src/ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

/** ui-common.js から関数1つのソースを切り出す（純粋関数を単体で評価するため） */
function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(start, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 挑戦試合の結果画面 敗者と勝者の並び ===\n');

section('1. 2つのシーンを横並びのラッパーで囲んでいる', () => {
  assert.ok(/const reactionHtml = `<div class="crrm-reactions\$\{showFoeAlongside \? ' is-pair' : ''\}">/.test(ui),
    'リアクションをラッパーで囲んでいない。ラッパー無しだと独立ブロックとして縦に積まれる');
});

section('2. ラッパーは flex の横並び・下端揃い', () => {
  const at = ui.indexOf('.crrm-reactions {');
  assert.ok(at > 0, '.crrm-reactions のCSSが無い');
  const decl = ui.slice(at, ui.indexOf('}', at));
  assert.ok(/display:\s*flex/.test(decl), '.crrm-reactions が flex ではない');
  assert.ok(/align-items:\s*flex-end/.test(decl),
    '下端揃いになっていない。勝者だけ画像が大きいので、揃えないと土台がずれて見える');
  assert.ok(/justify-content:\s*center/.test(decl), '中央寄せになっていない');
  assert.ok(/flex-wrap:\s*nowrap/.test(decl),
    '折り返しを許している。折り返すと結局縦積みになる');
  const pairAt = ui.indexOf('.crrm-reactions.is-pair {');
  assert.ok(pairAt > 0, '2人表示用のCSSが無い');
  const pairDecl = ui.slice(pairAt, ui.indexOf('}', pairAt));
  assert.ok(/display:\s*grid/.test(pairDecl), '2人表示が明示的な2列グリッドではない');
  assert.ok(/grid-template-columns:\s*minmax\(0,260px\)\s+minmax\(0,260px\)/.test(pairDecl),
    '2人表示の列数が固定されていない');
});

section('3. シーン側が縦積みに戻る指定を持っていない', () => {
  const at = ui.indexOf('.crrm-reaction-scene {');
  assert.ok(at > 0, '.crrm-reaction-scene のCSSが無い');
  const decl = ui.slice(at, ui.indexOf('}', at));
  // margin:auto が残っていると、flex 子でも中央に寄って間延びする
  assert.ok(!/margin:[^;]*auto/.test(decl),
    '.crrm-reaction-scene に margin:auto が残っている。横並びの間隔が崩れる');
});

section('4. 狭い画面でも横並びを崩さない', () => {
  const mq = ui.slice(ui.indexOf('@media(max-width:600px) {', ui.indexOf('.crrm-reactions {')));
  const block = mq.slice(0, mq.indexOf('\n      }'));
  assert.ok(!/\.crrm-reactions\s*\{[^}]*flex-direction:\s*column/.test(block),
    '狭い画面で縦積みに戻している。結局2画面ぶんの高さになる');
  // 2人を収めるために一段小さくしていること
  assert.ok(/\.crrm-reaction-portrait\s*\{[^}]*width:\s*\d+px/.test(block),
    '狭い画面での画像縮小指定が無い。2人が収まらない');
});

section('5. 1人だけのときもラッパーを通る（中央に出る）', () => {
  // is-pair が付くのは2人のときだけ。ラッパー自体は常に出す
  assert.ok(/<div class="crrm-reactions\$\{showFoeAlongside \? ' is-pair' : ''\}">/.test(ui),
    '1人のときにラッパーを外していると、中央寄せの規則が二重管理になる');
  const at = ui.indexOf('.crrm-reactions.is-pair');
  assert.ok(at > 0, 'is-pair 用の指定が無い');
});

section('6. 2人表示は左が勝者、右が敗者', () => {
  // 並び順は _challengeRequestReactionOrder に切り出してある。生成コードの字面ではなく
  // 関数の返り値で検査する（字面照合はリファクタで陳腐化する。test/stale-lint.js 参照）。
  const src = functionSource('_challengeRequestReactionOrder');
  const orderOf = new Function(`${src}; return _challengeRequestReactionOrder;`)();
  const self = { fighter: { id: 1 }, line: 'a' };
  const foe = { fighter: { id: 2 }, line: 'b' };
  assert.deepStrictEqual(orderOf(self, foe, false), [self, foe],
    '自団体が勝った回に自団体が左に来ていない');
  assert.deepStrictEqual(orderOf(self, foe, true), [foe, self],
    '自団体が負けた回に勝った相手が左に来ていない');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
