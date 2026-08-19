'use strict';
// GLIMPSE_B 統一(2026-08-12, roadmap要判断8)の回帰ガード。
//
// 背景: GLIMPSE_B_LINES はかつて const宣言(新軸)+ブラケット再代入(旧軸)の二重定義で、
//   (1) ブック改訂が死んだconst側にだけ積まれ(セリフ抽出パーサはブラケット代入を拾えない)、
//   (2) 実効側は getDialoguePool の 'normal'×'_default' 誤ヒットで全コンボが
//       標準×ノーマルの同一セリフに平坦化していた。
// 詳細: docs/tone-bible/10-GLIMPSE_B二重定義精査-v1.md
//
// 守るもの:
//   A. セリフテーブルのトップレベル・ブラケット代入を src/*.js に復活させない
//      (tools/extract-dialogue-parser.js はドットパス代入しか拾えないため、
//       ブラケット代入はワークブック往復から不可視になる)
//   B. GLIMPSE_B が単一定義のまま、アーキタイプ×性格でセル別に解決されること(平坦化回帰の検出)

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { scanExpr } = require('../tools/extract-dialogue-parser.js');

const SRC = path.join(__dirname, '..', 'src');

// ── A. トップレベルのブラケット代入禁止 ──────────────────────────────
const offenders = [];
const pushOffenders = [];
for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.js'))) {
  const text = fs.readFileSync(path.join(SRC, file), 'utf8').replace(/\r\n/g, '\n');
  text.split('\n').forEach((line, i) => {
    // 列0開始の `NAME['key']... = {` / `= [`。if文中のガード代入や .push(...) は対象外
    if (/^[A-Za-z_$][\w$]*\[.*\]\s*=\s*[\[{]/.test(line)) offenders.push(`${file}:${i + 1}: ${line.slice(0, 80)}`);
    // 列0開始の `if (!TABLE[...])` ガード生成 / `TABLE….push(…)` 実行文(Session F型)。
    // GLIMPSE_B(2026-08-12)・CARE(2026-08-20)と同型の NOTIF/CHOICE/LARGE/RIVALRY/SNAPSHOT
    // ブロックを 2026-08-20 に全撤去し、テーブル名指定の個別検査から汎用ルールに昇格。
    // 到達するセルでもワークブック往復から不可視になるため、生死を問わず全面禁止。
    if (/^if \(![A-Z][A-Z0-9_]*[[.]/.test(line) || /^[A-Z][A-Z0-9_]*[[.].*\.push\(/.test(line))
      pushOffenders.push(`${file}:${i + 1}: ${line.slice(0, 80)}`);
  });
}
assert.deepStrictEqual(offenders, [],
  'トップレベルのブラケット代入はワークブック往復から不可視になる(dotted path か const 内のキーにすること):\n' + offenders.join('\n'));
assert.deepStrictEqual(pushOffenders, [],
  'セリフテーブルへのガード付きpush実行文はワークブック往復から不可視になる(宣言リテラルに書くこと):\n' + pushOffenders.join('\n'));

// ── B. GLIMPSE_B の単一定義と解決の分岐 ──────────────────────────────
const data = fs.readFileSync(path.join(SRC, 'data.js'), 'utf8');

const anchor = /^const GLIMPSE_B_LINES = /m.exec(data);
assert.ok(anchor, 'const GLIMPSE_B_LINES が見つからない');
const exprStart = anchor.index + anchor[0].length;
const table = vm.runInNewContext('(' + data.slice(exprStart, scanExpr(data, exprStart)) + ')');

assert.ok(table['GL-01'] && table['GL-10'] && table['GL-11'] && table['GL-12'], 'GLキーの欠落');
assert.ok(table['GL-02-hostile'], 'GL-02-hostile が const 内にない');
assert.ok(table['GL-01'].win.composed && table['GL-01'].win.composed.normal, 'composed(鷹揚)セルの欠落');
const flat = JSON.stringify(table);
assert.ok(!flat.includes('"_default"'), 'GLIMPSE_B に旧軸キー _default が復活している(平坦化の原因)');
assert.ok(!flat.includes('"_scene"'), 'GLIMPSE_B に _scene が復活している(消費コードなし)');

const fnStart = data.indexOf('function getDialoguePool');
assert.ok(fnStart >= 0, 'getDialoguePool が見つからない');
const ctx = vm.createContext({});
vm.runInContext(data.slice(fnStart, data.indexOf('\n}', fnStart) + 2), ctx);
const pool = vm.runInContext('getDialoguePool', ctx);

const combos = [
  ['standard', 'normal'], ['standard', 'bold'], ['standard', 'emotional'],
  ['delinquent', 'bold'], ['ojousama', 'normal'], ['seductive', 'emotional'],
  ['polite', 'shy'], ['polite', 'earnest'], ['cool', 'quiet'], ['composed', 'easygoing'],
];
const firsts = combos.map(([archetype, personality]) => pool(table['GL-01'].win, { archetype, personality })[0]);
const distinct = new Set(firsts).size;
assert.ok(distinct >= 9,
  `GL-01勝利が平坦化している: 10コンボ中${distinct}種のみ (${firsts.join(' / ')})`);
assert.ok(pool(table['GL-01'].win, { archetype: 'delinquent', personality: 'bold' })[0] !== firsts[0],
  'ヤンキー×強気が標準×ノーマルに落ちている');

console.log('PASS glimpse-b-axis-guard: bracket代入0 / 単一定義 / 10コンボ' + distinct + '種');
