#!/usr/bin/env node
'use strict';

// test/dialogue-workbook-roundtrip-test.js
//
// セリフ編集Excel の書き戻し(apply)が、テンプレートリテラルのプレースホルダを
// 壊さないことを検証する。
//
// 2026-08-01 の事故: 書き戻しが `${d.rivalName}` を `\${d.rivalName}` に
// エスケープしてしまい、黒田記者の目6本でプレースホルダが展開されなくなった
// (団体名の代わりに「${d.rivalName}」という文字列がそのまま紙面に出る状態)。
//
// 原因は、書き戻しに意味の違う2経路があるのにエスケープを共用していたこと:
//   (a) プレーンなリテラル  … 抽出も照合も vm 評価値 → エスケープが必要
//   (b) 関数本体のリテラル  … 抽出も照合も生テキスト → エスケープしてはいけない
// 黒田記者の目は `d => ` + backtick リテラルなので (b)。

const assert = require('assert');
const path = require('path');
const DW = require(path.join(__dirname, '..', 'tools', 'dialogue-workbook.js'));

let failures = 0;
function check(cond, message) {
  if (!cond) { failures += 1; console.error(`FAIL: ${message}`); }
  else console.log(`ok - ${message}`);
}

// ─── (a) プレーンなリテラル経路: エスケープされること ───
const esc = DW.escapeForQuote;
check(esc('a`b', '`') === 'a\\`b', 'バッククォートはエスケープされる');
check(esc('a\\b', '`') === 'a\\\\b', 'バックスラッシュはエスケープされる');
check(esc("it's", "'") === "it\\'s", 'シングルクォートはエスケープされる');
check(esc('1行目\n2行目', '`') === '1行目\\n2行目', '改行は \\n に畳まれる');

// ─── (b) 関数本体経路: プレースホルダが素通りすること ───
// tools 側の内部関数なので、実際の書き戻し経路を通して確認する。
const src = [
  'const KURODA_FIXTURE = {',
  '  even: [',
  '    d => `${d.rivalName}とほぼ並んでいる`,',
  '  ],',
  '};',
  '',
].join('\n');

const rewritten = DW._applyRevisionToSourceForTest
  ? DW._applyRevisionToSourceForTest(src, 'KURODA_FIXTURE.even[1]', '${d.rivalName}とほぼ並んでいる', '本紙としては、${d.rivalName}との差は「埋まる差」だと書いておく')
  : null;

if (rewritten == null) {
  // テスト用フックが無い場合は、実ソースの現物で確認する(反映済みの16本)
  const fs = require('fs');
  const kuroda = fs.readFileSync(path.join(__dirname, '..', 'src', 'kuroda-text.js'), 'utf8');
  check(!kuroda.includes('\\${'),
    'src/kuroda-text.js にエスケープ済みプレースホルダ \\${ が1つも無い');
  check(kuroda.includes('${d.rivalName}'),
    'src/kuroda-text.js に生のプレースホルダ ${d.rivalName} が残っている');
} else {
  check(rewritten.includes('${d.rivalName}') && !rewritten.includes('\\${'),
    '関数本体経路の書き戻しでプレースホルダが素通りする');
}

// ─── 全ソースにわたる不変条件 ───
// テンプレートリテラル中の \${ は「意図的にリテラルの $ を出したい」場合にしか
// 使われないはず。セリフ系ファイルには1つも無いことを確認する。
const fs = require('fs');
const SRC = path.join(__dirname, '..', 'src');
const DIALOGUE_FILES = [
  'kuroda-text.js', 'victory-lines.js', 'coach-lines.js',
  'data-faction-dialogue.js', 'flag-dialogue.js', 'battle-lines.js',
  'tag-battle-lines.js',
];
for (const f of DIALOGUE_FILES) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  const n = (s.match(/\\\$\{/g) || []).length;
  check(n === 0, `src/${f} にエスケープ済みプレースホルダ \\\${ が無い(実際: ${n}件)`);
}

console.log('');
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log('dialogue-workbook-roundtrip-test: ok');
