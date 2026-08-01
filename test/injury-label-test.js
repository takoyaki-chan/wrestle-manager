// injury-label-test.js
//
// 「中傷」は誹謗中傷と読めてしまう(2026-08-01 Keisuke 指摘)。
// 内部キーはセーブに載っているので変えず、**プレイヤーに見せる文字列だけ**別に持つ。
// これは feedback「プレイヤー向け表記に内部変数名を使わない」の一例で、
// 内部トークンが記事の本文まで漏れていた。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== 負傷の呼び名 ===\n');

section('1. 内部キーは変えない(既存セーブが読めなくなる)', () => {
  assert.ok(INJURY_TABLE.some(r => r.type === '中傷'), 'INJURY_TABLE の内部キーが変わっている');
  assert.ok(INJURY_DEBUFF_TABLE['中傷'], '成長ペナルティ表のキーが変わっている');
});

section('2. 表示は「中傷」ではない', () => {
  assert.notStrictEqual(injuryLabel('中傷'), '中傷', '表示がまだ「中傷」のまま');
  assert.ok(!/中傷/.test(injuryLabel('中傷')), `表示に「中傷」が残る: ${injuryLabel('中傷')}`);
  assert.ok(!/中傷/.test(injuryLabelShort('中傷')), `短縮表示に「中傷」が残る: ${injuryLabelShort('中傷')}`);
});

section('3. 軽傷・重傷はそのまま(誤読の余地がない語は変えない)', () => {
  assert.strictEqual(injuryLabel('軽傷'), '軽傷');
  assert.strictEqual(injuryLabel('重傷'), '重傷');
});

section('4. 未知の値・空でも落ちない', () => {
  assert.strictEqual(injuryLabel(null), '');
  assert.strictEqual(injuryLabel(undefined), '');
  assert.strictEqual(injuryLabel('謎の傷'), '謎の傷');
  assert.strictEqual(injuryLabelShort(null), '');
});

section('5. プレイヤーに見える箇所で生の type を出していない', () => {
  // 表示テンプレートに ${...injury.type} / ${...injuryType} が直で入っていないこと
  const files = ['src/management.js', 'src/app.js', 'src/ui-common.js', 'src/ui-render.js'];
  const bad = [];
  files.forEach(f => {
    read(f).split('\n').forEach((line, i) => {
      if (/\$\{[^}]*\binjury\.type\}|\$\{[^}]*\binjuryType\}/.test(line)) {
        bad.push(`${f}:${i + 1}  ${line.trim().slice(0, 100)}`);
      }
    });
  });
  assert.strictEqual(bad.length, 0,
    '生の負傷キーを表示に埋めている箇所がある:\n        ' + bad.join('\n        '));
});

section('6. 新聞の練習怪我見出しが言い換えを通っている', () => {
  const mgmt = read('src/management.js');
  assert.ok(/練習中に\$\{injuryLabel\(ev\.injuryType\)\}/.test(mgmt),
    '練習怪我の見出しが言い換えを通っていない(記事本文に内部語が出る)');
});

console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
