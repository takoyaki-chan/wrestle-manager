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
for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.js'))) {
  const text = fs.readFileSync(path.join(SRC, file), 'utf8').replace(/\r\n/g, '\n');
  text.split('\n').forEach((line, i) => {
    // 列0開始の `NAME['key']... = {` / `= [`。if文中のガード代入や .push(...) は対象外
    if (/^[A-Za-z_$][\w$]*\[.*\]\s*=\s*[\[{]/.test(line)) offenders.push(`${file}:${i + 1}: ${line.slice(0, 80)}`);
  });
}
assert.deepStrictEqual(offenders, [],
  'トップレベルのブラケット代入はワークブック往復から不可視になる(dotted path か const 内のキーにすること):\n' + offenders.join('\n'));

// ── B. GLIMPSE_B の単一定義と解決の分岐 ──────────────────────────────
const data = fs.readFileSync(path.join(SRC, 'data.js'), 'utf8');
assert.ok(!/^if \(!GLIMPSE_B_LINES/m.test(data), 'GLIMPSE_B への push実行文ガードが復活している');
// CARE_REACTION_DIALOGUES も同型のガード付きpushブロック(旧軸・全60セル死にセル)を
// 2026-08-20 に撤去済み。ルールAは `if (!X[...])` と `.push()` を対象外にしているため、
// この形の復活はテーブル名で個別に塞ぐ(NOTIF/CHOICE/LARGE/RIVALRY の残ブロック撤去後に汎用化予定)
assert.ok(!/^(?:if \(!)?CARE_REACTION_DIALOGUES\[/m.test(data),
  'CARE_REACTION_DIALOGUES へのブラケット代入/push実行文が復活している(ワークブック往復から不可視になる)');

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
