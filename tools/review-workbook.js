#!/usr/bin/env node
'use strict';
/**
 * tools/review-workbook.js
 *
 * **未承認セリフのレビュー用** xlsx を1枚書き出す。
 *
 *   node tools/review-workbook.js <出力先.xlsx> <入力JSON>
 *
 * なぜ既存の tools/dialogue-workbook.js を使わないか:
 *   - `dialogue-workbook.js export` は **セリフ編集/ 配下を丸ごと書き直す破壊的操作**で、
 *     未反映の「改訂」列があると消える(2026-07 の実例)。レビューのために走らせてはいけない
 *   - 未承認のセリフを往復コーパス(セリフ編集/)に混ぜると、`apply` が
 *     まだ main に無いファイルへ書き戻そうとする。承認前は corpus の外に置く
 *
 * したがってこのツールは **書き出し専用・往復しない**。
 * 承認後に本体へ取り込んでから、通常の `dialogue-workbook.js export` に載せる。
 *
 * 入力JSON の形:
 *   { "sheets": [ { "name": "シート名",
 *                   "columns": ["列1","列2",...],
 *                   "widths": [10,40,...],
 *                   "rows": [["値","値",...], ...] } ] }
 *
 * 外部npm依存なし。zip/xlsx のヘルパーは dialogue-workbook.js から読み込んで流用する。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// dialogue-workbook.js から xlsx 書き出しヘルパーだけを借りる
// (require するとCLIとして走ってしまうので、必要な関数だけ切り出して評価する)
function loadWorkbookWriter() {
  const src = fs.readFileSync(path.join(__dirname, 'dialogue-workbook.js'), 'utf8');
  const need = [
    'xmlEscape', 'crc32', 'writeUInt16LE', 'writeUInt32LE', 'createZip',
    'colName', 'cellXml', 'buildColXml', 'buildSheetView', 'buildDimension',
    'sheetXml', 'workbookXml', 'workbookRelsXml', 'contentTypesXml',
    'rootRelsXml', 'stylesXml', 'writeWorkbook',
  ];
  const chunks = [];
  for (const name of need) {
    const start = src.indexOf(`function ${name}(`);
    if (start < 0) throw new Error(`dialogue-workbook.js に ${name} が無い`);
    const open = src.indexOf('{', src.indexOf(')', start));
    let depth = 0;
    for (let i = open; i < src.length; i += 1) {
      if (src[i] === '{') depth += 1;
      if (src[i] === '}') {
        depth -= 1;
        if (depth === 0) { chunks.push(src.slice(start, i + 1)); break; }
      }
    }
  }
  // writeWorkbook が触る writtenPaths と STYLES の代役
  const ctx = {
    Buffer, require, console,
    fs, path,
    writtenPaths: new Set(),
    STYLES: { header: 2, metaCommon: 0 },
  };
  vm.createContext(ctx);
  vm.runInContext(chunks.join('\n'), ctx);
  return ctx;
}

function main() {
  const [outPath, jsonPath] = process.argv.slice(2);
  if (!outPath || !jsonPath) {
    console.error('usage: node tools/review-workbook.js <出力先.xlsx> <入力JSON>');
    process.exit(1);
  }
  const spec = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const w = loadWorkbookWriter();

  const sheets = spec.sheets.map(s => {
    const header = s.columns.map(c => ({ value: c, style: 2 }));
    const rows = [header, ...s.rows];
    return {
      name: s.name,
      rows,
      cols: s.widths ? s.widths.map((width, i) => ({ min: i + 1, max: i + 1, width })) : null,
      freeze: 'A2',
      rowHeights: (row, i) => (i === 0 ? 22 : null),
    };
  });
  w.writeWorkbook(outPath, sheets);
  const total = spec.sheets.reduce((n, s) => n + s.rows.length, 0);
  console.log(`wrote ${outPath}  (${sheets.length} sheets / ${total} rows)`);
}

main();
