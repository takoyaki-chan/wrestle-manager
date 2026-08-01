#!/usr/bin/env node
'use strict';
/**
 * tools/dialogue-workbook.js
 *
 * セリフ編集用 Excel(.xlsx) 往復ツール。
 *
 *   node tools/dialogue-workbook.js export
 *   node tools/dialogue-workbook.js apply  [ファイル...] [--dry-run]
 *
 * export: docs/dialogue/ の抽出基盤(tools/extract-dialogue.js の
 *   TABLE_MANIFEST / CATEGORIES / パース評価パイプライン)を再利用し、
 *   セリフ編集/ 配下に「archetype × personality の人格」単位で xlsx を
 *   生成する(2026-07-25 分割軸の再設計。旧・カテゴリ別20ファイル構成は
 *   廃止)。フォルダ構成:
 *
 *     セリフ編集/キャラタイプ別/    実在する archetype×personality の組
 *                                    (34組)ごとに1ファイル。カテゴリ横断で
 *                                    全セリフを収録 + 在籍キャラ一覧シート。
 *                                    現在キャラのいない組み合わせは
 *                                    _該当者なし.xlsx にまとめる。
 *     セリフ編集/キャラ個人別/      VICTORY_LINES / CHAR_PROFILES など
 *                                    キャラID鍵のテーブル。
 *     セリフ編集/ナレーション・記事/ 話者のいないテキスト(新聞・通知・
 *                                    黒田記者コラム・年代記など)。
 *     セリフ編集/コーチ/            コーチ関連(選手とは別人格系統)。1ファイル。
 *     セリフ編集/その他セリフ/      話者はいるが archetype×personality
 *                                    以外の軸で分岐するもの。
 *     セリフ編集/_キャラ対応表.xlsx  archetype×personality の人数・
 *                                    キャラ名マトリクス。
 *
 *   「改訂」列は空欄で出力する。
 *
 * apply: セリフ編集/ 配下を再帰的に走査して全 .xlsx を読み、「改訂」列が
 *   「現在」列と異なる行だけを対象に、ID(=ソース上のプロパティパス)で
 *   src/*.js の該当リテラルを直接置換する(オブジェクト全体の再シリアライズ
 *   はしない — コメント・1行配列などの元の書式を壊さないための方針)。
 *   書き換え前に「現在」列が実ソースと一致するか検証し、不一致ならその行は
 *   スキップ+警告する。ファイルの置き場所(どのフォルダの xlsx か)は
 *   書き戻し判定に一切影響しない — IDだけで解決する。
 *
 * 外部npm依存なし(fs/path/vm/zlib のみ)。archive/scripts/
 * generate-dialogue-workbooks.js(xlsx生成) と
 * archive/scripts/apply-dialogue-workbook.js(xlsx読取)のヘルパーを流用。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const XLSX_DIR = path.join(ROOT, 'セリフ編集');
const EX = require('./extract-dialogue.js');
const { scanExpr } = require('./extract-dialogue-parser.js');

// ───────────────────────────────────────────────────────────────────────
// 0. 性格/アーキタイプ ラベル(archive/scripts/generate-dialogue-workbooks.js
//    から流用)。テーブル内のキー名から archetype/personality 列を推定する。
// ───────────────────────────────────────────────────────────────────────
const PERSONALITY_LABELS = {
  normal: 'ノーマル',
  bold: '強気',
  quiet: '寡黙',
  shy: '内気',
  easygoing: 'お気楽',
  earnest: '真面目',
  emotional: '感情的',
};

const ARCHETYPE_LABELS = {
  standard: '標準',
  composed: '鷹揚',
  ojousama: 'お嬢様',
  delinquent: 'ヤンキー',
  cool: 'クール',
  seductive: '蠱惑',
  polite: '丁寧',
};

const PERSONALITY_KEYS = new Set(Object.keys(PERSONALITY_LABELS));
const ARCHETYPE_KEYS = new Set(Object.keys(ARCHETYPE_LABELS));

// ラベル(日本語) -> 内部キー の逆引き。ALL_CHARS の archetype/personality
// (内部キー)と、detectMeta が返すラベルを突き合わせるために使う。
const ARCHETYPE_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(ARCHETYPE_LABELS).map(([k, v]) => [v, k])
);
const PERSONALITY_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(PERSONALITY_LABELS).map(([k, v]) => [v, k])
);

const PERSONALITY_FILL = {
  '': 'metaCommon',
  ノーマル: 'personalityNormal',
  強気: 'personalityBold',
  寡黙: 'personalityQuiet',
  内気: 'personalityShy',
  お気楽: 'personalityEasygoing',
  真面目: 'personalityEarnest',
  感情的: 'personalityEarnest', // 感情的専用の色は用意されていないため真面目色を流用
};

// 「archetype_personality」または「personality_personality」のような複合キー
// (例: CHALLENGE_LINES の polite_earnest / standard_normal)からも推定する。
//
// task-68(2026-07-31)でアーキタイプの 'normal' を 'standard' に改名した結果、
// ARCHETYPE_KEYS と PERSONALITY_KEYS はもう重複しない。そのため以下のループは
// 判定順(性格を先に見るか、アーキタイプを先に見るか)に依存しない — どちらの
// セットにキーが属するかで一意に決まる。旧版はこの重複のせいで性格を先に
// 判定する特別扱いが必要だったが、重複が解消された今は素直な判定で足りる。
// 軸キーと同じ綴りのキーを持つが、実際には軸ではないテーブル。
// 例: App._NEWSPAPER_HEADLINES は試合の性質で分類しており(titleWin / rivalry /
// upset / ... / normal)、この `normal` は「特筆すべき点がない試合」であって
// 性格「ノーマル」ではない。素直に判定すると性格列に嘘が入る。
const NON_AXIS_TABLES = new Set([
  'App._NEWSPAPER_HEADLINES',
  'App._NEWSPAPER_ARTICLES',
]);

function detectMeta(idPath, tableRoot) {
  if (NON_AXIS_TABLES.has(tableRoot)) return { archetype: '', personality: '' };
  let remainder = idPath.slice(tableRoot.length);
  if (remainder.startsWith('.')) remainder = remainder.slice(1);
  const segRe = /([A-Za-z_$][A-Za-z0-9_$]*)|\[(\d+)\]/g;
  const segments = [];
  let m;
  while ((m = segRe.exec(remainder))) {
    if (m[1] !== undefined) segments.push(m[1]);
  }

  let archetype = '';
  let personality = '';
  for (const seg of segments) {
    const compound = /^([a-z]+)_([a-z]+)$/.exec(seg);
    if (compound && ARCHETYPE_KEYS.has(compound[1]) && PERSONALITY_KEYS.has(compound[2])) {
      archetype = compound[1];
      personality = compound[2];
      continue;
    }
    if (!personality && PERSONALITY_KEYS.has(seg)) {
      personality = seg;
      continue;
    }
    if (!archetype && ARCHETYPE_KEYS.has(seg)) {
      archetype = seg;
      continue;
    }
  }
  return {
    archetype: archetype ? (ARCHETYPE_LABELS[archetype] || archetype) : '',
    personality: personality ? (PERSONALITY_LABELS[personality] || personality) : '',
  };
}

// ───────────────────────────────────────────────────────────────────────
// 1. xlsx 書き出しヘルパー(archive/scripts/generate-dialogue-workbooks.js
//    の createZip/sheetXml/stylesXml/writeWorkbook 等をそのまま流用)。
// ───────────────────────────────────────────────────────────────────────
function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function crc32(buffer) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ -1) >>> 0;
}

function writeUInt16LE(buf, value, offset) { buf.writeUInt16LE(value & 0xffff, offset); }
function writeUInt32LE(buf, value, offset) { buf.writeUInt32LE(value >>> 0, offset); }

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name.replace(/\\/g, '/'), 'utf8');
    const dataBuf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const crc = crc32(dataBuf);

    const localHeader = Buffer.alloc(30);
    writeUInt32LE(localHeader, 0x04034b50, 0);
    writeUInt16LE(localHeader, 20, 4);
    writeUInt16LE(localHeader, 0, 6);
    writeUInt16LE(localHeader, 0, 8);
    writeUInt16LE(localHeader, 0, 10);
    writeUInt16LE(localHeader, 0, 12);
    writeUInt32LE(localHeader, crc, 14);
    writeUInt32LE(localHeader, dataBuf.length, 18);
    writeUInt32LE(localHeader, dataBuf.length, 22);
    writeUInt16LE(localHeader, nameBuf.length, 26);
    writeUInt16LE(localHeader, 0, 28);

    localParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    writeUInt32LE(centralHeader, 0x02014b50, 0);
    writeUInt16LE(centralHeader, 20, 4);
    writeUInt16LE(centralHeader, 20, 6);
    writeUInt16LE(centralHeader, 0, 8);
    writeUInt16LE(centralHeader, 0, 10);
    writeUInt16LE(centralHeader, 0, 12);
    writeUInt16LE(centralHeader, 0, 14);
    writeUInt32LE(centralHeader, crc, 16);
    writeUInt32LE(centralHeader, dataBuf.length, 20);
    writeUInt32LE(centralHeader, dataBuf.length, 24);
    writeUInt16LE(centralHeader, nameBuf.length, 28);
    writeUInt16LE(centralHeader, 0, 30);
    writeUInt16LE(centralHeader, 0, 32);
    writeUInt16LE(centralHeader, 0, 34);
    writeUInt16LE(centralHeader, 0, 36);
    writeUInt32LE(centralHeader, 0, 38);
    writeUInt32LE(centralHeader, offset, 42);
    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  writeUInt32LE(end, 0x06054b50, 0);
  writeUInt16LE(end, 0, 4);
  writeUInt16LE(end, 0, 6);
  writeUInt16LE(end, files.length, 8);
  writeUInt16LE(end, files.length, 10);
  writeUInt32LE(end, centralSize, 12);
  writeUInt32LE(end, offset, 16);
  writeUInt16LE(end, 0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function colName(index) {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function cellXml(ref, cell) {
  const value = cell && typeof cell === 'object' && !Array.isArray(cell) ? cell.value : cell;
  if (value === null || value === undefined || value === '') return '';
  const style = cell && typeof cell === 'object' && cell.style !== undefined ? ` s="${cell.style}"` : '';
  return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function buildColXml(widths) {
  if (!widths || widths.length === 0) return '';
  const cols = widths.map((width, index) => (
    `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  )).join('');
  return `<cols>${cols}</cols>`;
}

function buildSheetView(sheet) {
  if (!sheet.freezeTopRow) {
    return '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  }
  return '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>' +
    '</sheetView></sheetViews>';
}

function buildDimension(rows) {
  const rowCount = rows.length || 1;
  const colCount = Math.max(1, ...rows.map(row => row.length || 0));
  return `<dimension ref="A1:${colName(colCount - 1)}${rowCount}"/>`;
}

function sheetXml(sheet) {
  const rows = sheet.rows;
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => cellXml(`${colName(colIndex)}${rowIndex + 1}`, value)).join('');
    const height = sheet.rowHeights ? sheet.rowHeights(row, rowIndex) : null;
    const attrs = [`r="${rowIndex + 1}"`];
    if (height) {
      attrs.push(`ht="${height}"`);
      attrs.push('customHeight="1"');
    }
    return `<row ${attrs.join(' ')}>${cells}</row>`;
  }).join('');

  const colCount = Math.max(1, ...rows.map(row => row.length || 0));
  const filterRef = sheet.autoFilter !== false ? `A1:${colName(colCount - 1)}${rows.length || 1}` : null;

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    buildDimension(rows) +
    buildSheetView(sheet) +
    `<sheetFormatPr defaultRowHeight="${sheet.defaultRowHeight || 18}"/>` +
    buildColXml(sheet.widths) +
    '<sheetData>' + body + '</sheetData>' +
    (filterRef ? `<autoFilter ref="${filterRef}"/>` : '') +
    '<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>' +
    '</worksheet>';
}

function workbookXml(sheetNames) {
  const sheets = sheetNames.map((name, index) => (
    `<sheet name="${xmlEscape(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  )).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<bookViews><workbookView activeTab="0"/></bookViews>' +
    `<sheets>${sheets}</sheets></workbook>`;
}

function workbookRelsXml(sheetNames) {
  const sheetRels = sheetNames.map((_, index) => (
    `<Relationship Id="rId${index + 1}" ` +
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
    `Target="worksheets/sheet${index + 1}.xml"/>`
  )).join('');
  const styleRel = `<Relationship Id="rId${sheetNames.length + 1}" ` +
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" ' +
    'Target="styles.xml"/>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRels}${styleRel}</Relationships>`;
}

function contentTypesXml(sheetCount) {
  const overrides = Array.from({ length: sheetCount }, (_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ` +
    'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
  )).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    `${overrides}</Types>`;
}

function rootRelsXml() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
}

// スタイルは archive 版を踏襲しつつ、ID列(編集不可)用のグレー塗りを1つ追加。
function stylesXml() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="3">' +
    '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FF22303C"/><name val="Calibri"/><family val="2"/></font>' +
    '</fonts>' +
    '<fills count="13">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF2F4858"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF4FF"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF4F8D6"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE6EEF7"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFDE7E7"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFBEFD9"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF7EA"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFE7D9"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF4CC"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE8E8E8"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="thin"><color rgb="FFD0D7DE"/></top><bottom style="thin"><color rgb="FFD0D7DE"/></bottom><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="16">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="10" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="11" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="8" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="9" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="11" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="12" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';
}

const STYLES = {
  base: 0,
  header: 1,
  metaCommon: 2,
  current: 3,
  revised: 4,
  personalityNormal: 5,
  personalityBold: 6,
  personalityQuiet: 7,
  personalityShy: 8,
  personalityEasygoing: 9,
  personalityEarnest: 10,
  summaryHeader: 11,
  note: 12,
  number: 13,
  revisedMeta: 14,
  idLock: 15,
};

// export の後始末で「今回書いたか」を判定するための記録。
// runExport の外からも writeWorkbook は呼ばれうるので、モジュール変数に持つ。
const writtenPaths = new Set();

function writeWorkbook(filePath, sheets) {
  writtenPaths.add(path.resolve(filePath));
  const sheetNames = sheets.map(sheet => sheet.name);
  const files = [
    { name: '[Content_Types].xml', data: contentTypesXml(sheetNames.length) },
    { name: '_rels/.rels', data: rootRelsXml() },
    { name: 'xl/workbook.xml', data: workbookXml(sheetNames) },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml(sheetNames) },
    { name: 'xl/styles.xml', data: stylesXml() },
  ];
  sheets.forEach((sheet, index) => {
    files.push({ name: `xl/worksheets/sheet${index + 1}.xml`, data: sheetXml(sheet) });
  });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, createZip(files));
}

function styleForPersonality(label) {
  const key = PERSONALITY_FILL[label] || 'metaCommon';
  return STYLES[key] || STYLES.metaCommon;
}

// ───────────────────────────────────────────────────────────────────────
// 2. xlsx 読み込みヘルパー(archive/scripts/apply-dialogue-workbook.js から
//    流用。inlineStr / sharedStrings(Excelで開いて保存すると変わる)両対応)。
// ───────────────────────────────────────────────────────────────────────
function readZipEntries(filePath) {
  const buf = fs.readFileSync(filePath);
  const entries = new Map();
  let eocdOffset = -1;

  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error(`ZIP end of central directory not found: ${filePath}`);

  const centralDirOffset = buf.readUInt32LE(eocdOffset + 16);
  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  let offset = centralDirOffset;

  for (let i = 0; i < entryCount; i += 1) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid central directory record');

    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.slice(offset + 46, offset + 46 + nameLength).toString('utf8');

    if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error(`Invalid local file header for ${name}`);

    const localNameLength = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buf.slice(dataStart, dataStart + compressedSize);

    let content;
    if (method === 0) content = compressed;
    else if (method === 8) content = zlib.inflateRawSync(compressed);
    else throw new Error(`Unsupported zip compression method: ${method}`);

    entries.set(name, content.toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function decodeXmlText(text) {
  return String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .normalize('NFC');
}

function parseSharedStrings(sharedXml) {
  if (!sharedXml) return [];
  const values = [];
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = siRe.exec(sharedXml))) {
    const parts = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)];
    values.push(parts.map(part => decodeXmlText(part[1])).join(''));
  }
  return values;
}

function parseSheetNames(workbookXml) {
  const names = [];
  const re = /<sheet\b[^>]*name="([^"]+)"/g;
  let match;
  while ((match = re.exec(workbookXml))) names.push(decodeXmlText(match[1]));
  return names;
}

function parseWorksheetRows(sheetXmlText, sharedStrings) {
  const rows = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(sheetXmlText))) {
    const cells = new Map();
    const cellRe = /<c\b([^>]*)r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1]))) {
      const attrs = `${cellMatch[1]} ${cellMatch[3]}`;
      const col = cellMatch[2];
      const content = cellMatch[4];
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const type = typeMatch ? typeMatch[1] : '';
      const inlineMatch = content.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const valueMatch = content.match(/<v[^>]*>([\s\S]*?)<\/v>/);

      let value = '';
      if (inlineMatch) value = decodeXmlText(inlineMatch[1]);
      else if (type === 's' && valueMatch) value = sharedStrings[Number(valueMatch[1])] || '';
      else if (valueMatch) value = decodeXmlText(valueMatch[1]);

      cells.set(col, value);
    }
    rows.push(cells);
  }
  return rows;
}

function readWorkbookSheets(filePath) {
  const entries = readZipEntries(filePath);
  const sheetNames = parseSheetNames(entries.get('xl/workbook.xml') || '');
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml') || '');
  const sheets = [];
  for (let i = 0; i < sheetNames.length; i += 1) {
    const xml = entries.get(`xl/worksheets/sheet${i + 1}.xml`);
    if (!xml) continue;
    const rows = parseWorksheetRows(xml, sharedStrings);
    sheets.push({ name: sheetNames[i], rows });
  }
  return sheets;
}

// ───────────────────────────────────────────────────────────────────────
// 3. シート名の一意化ユーティリティ
// ───────────────────────────────────────────────────────────────────────
function sanitizeSheetName(name) {
  let s = String(name).replace(/[:\\/?*[\]]/g, '_');
  if (s.length > 31) s = s.slice(0, 31);
  return s || 'Sheet';
}

function uniqueSheetName(name, used) {
  let base = sanitizeSheetName(name);
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    const suffix = `_${n}`;
    candidate = sanitizeSheetName(base.slice(0, 31 - suffix.length) + suffix);
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

// ───────────────────────────────────────────────────────────────────────
// 4. export — 「分割軸」の再設計(2026-07-25)
//
//    旧版はカテゴリ別(20ファイル)に出力していたが、実際の編集は
//    「archetype × personality の一人格を想像して、その人の全セリフを
//    通しで直す」という単位で行われる。そのため以下の5フォルダに
//    再編する(詳細は セリフ編集/README.txt):
//
//      キャラタイプ別/   実在する archetype×personality の組(34組)ごとに
//                         1ファイル。カテゴリ横断で全セリフを収録。
//      キャラ個人別/     VICTORY_LINES / CHAR_PROFILES など、キャラIDが
//                         鍵になっている「その子固有」のテーブル。
//      ナレーション・記事/ 話者のいないテキスト(新聞・通知・年代記等)。
//      コーチ/           コーチ関連(選手とは別人格系統)。1ファイルに統合。
//      その他セリフ/     話者はいるが archetype×personality 以外の軸で
//                         分岐するもの(派閥イベント・Glimpse等)。
//
//    行の割り振りは「テーブル単位」ではなく「行(セリフ1本)単位」で行う:
//    detectMeta が archetype+personality を両方解決でき、かつその組が
//    実在キャラ(ALL_CHARS)に存在するなら → キャラタイプ別。
//    それ以外は、由来テーブルごとに割り当てた「ホーム」フォルダへ。
// ───────────────────────────────────────────────────────────────────────

function headerCells(labels) {
  return labels.map(value => ({ value, style: STYLES.header }));
}

// 4-1. 標準レイアウト(ナレーション・記事 / コーチ / その他セリフ で使用)。
//      archetype/personality 列は残すが、この束に来る行は定義上どちらも
//      未解決(または部分解決)なので実質空欄になることが多い。
// 2026-08-01: その他セリフ/コーチ を少数のファイルに統合したため、
// 1シートに複数の分類が混ざる。オートフィルタで絞れるよう「カテゴリ」列を足した。
const GENERIC_HEADER = ['ID(編集不可)', 'カテゴリ', '出典', 'テーブル', 'パス', 'archetype', 'personality', '現在', '改訂', '備考'];
const GENERIC_WIDTHS = [30, 24, 16, 22, 26, 10, 10, 50, 50, 20];

function buildGenericRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  const archetypeStyle = row.personality || row.archetype ? personalityStyle : STYLES.metaCommon;
  return [
    { value: row.id, style: STYLES.idLock },
    { value: row.category || '', style: STYLES.metaCommon },
    { value: row.source, style: STYLES.metaCommon },
    { value: row.table, style: STYLES.metaCommon },
    { value: row.path, style: STYLES.note },
    { value: row.archetype, style: archetypeStyle },
    { value: row.personality, style: personalityStyle },
    { value: row.current, style: STYLES.current },
    { value: row.revised, style: STYLES.revised },
    { value: row.note, style: STYLES.note },
  ];
}

// 4-2. キャラタイプ別レイアウト。archetype/personality 列はファイル単位で
//      自明なので省き、代わりに「どの場面のセリフか」が分かる カテゴリ 列を置く。
const COMBO_HEADER = ['ID(編集不可)', '出典', 'テーブル', 'パス', 'カテゴリ', '現在', '改訂', '備考'];
const COMBO_WIDTHS = [30, 16, 22, 26, 20, 50, 50, 20];

function buildComboRow(row) {
  return [
    { value: row.id, style: STYLES.idLock },
    { value: row.source, style: STYLES.metaCommon },
    { value: row.table, style: STYLES.metaCommon },
    { value: row.path, style: STYLES.note },
    { value: row.category, style: STYLES.metaCommon },
    { value: row.current, style: STYLES.current },
    { value: row.revised, style: STYLES.revised },
    { value: row.note, style: STYLES.note },
  ];
}

// 4-3. キャラ個人別レイアウト(VICTORY_LINES / CHAR_PROFILES)。
//      キャラID鍵のテーブルは detectMeta では archetype/personality を
//      解決できないため、ALL_CHARS から引いて列に足す。
const CHAR_HEADER = ['ID(編集不可)', '出典', 'テーブル', 'パス', 'キャラ名', 'archetype', 'personality', '現在', '改訂', '備考'];
const CHAR_WIDTHS = [30, 16, 22, 16, 14, 10, 10, 50, 50, 20];

function buildCharRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  return [
    { value: row.id, style: STYLES.idLock },
    { value: row.source, style: STYLES.metaCommon },
    { value: row.table, style: STYLES.metaCommon },
    { value: row.path, style: STYLES.note },
    { value: row.charName, style: personalityStyle },
    { value: row.archetype, style: personalityStyle },
    { value: row.personality, style: personalityStyle },
    { value: row.current, style: STYLES.current },
    { value: row.revised, style: STYLES.revised },
    { value: row.note, style: STYLES.note },
  ];
}

function buildRowsForTable(sandbox, entry) {
  const val = EX.resolvePath(sandbox, entry.path);
  if (val === undefined) return null;
  const items = [];
  EX.walk(val, entry.path, items, new Set());

  // 同一パスが複数出現するケース(関数本体からのフォールバック抽出で
  // 1つの葉から複数の文字列が拾われる場合。実測15件/16,682件)には
  // #2, #3... の連番を振って ID を一意化する。
  const seenCount = new Map();
  const rows = [];
  for (const item of items) {
    const baseId = item.path;
    const n = (seenCount.get(baseId) || 0) + 1;
    seenCount.set(baseId, n);
    const id = n === 1 ? baseId : `${baseId}#${n}`;
    const meta = detectMeta(baseId, entry.path);
    let pathRel = baseId.slice(entry.path.length);
    if (pathRel.startsWith('.')) pathRel = pathRel.slice(1);
    rows.push({
      id,
      source: `src/${entry.file}`,
      table: entry.path,
      path: pathRel,
      archetype: meta.archetype,
      personality: meta.personality,
      current: item.text,
      revised: '',
      note: '',
    });
  }
  return rows;
}

function makeSheet(name, header, widths, dataRows) {
  const rowHeights = (_, rowIndex) => (rowIndex === 0 ? 24 : 40);
  return {
    name,
    rows: [headerCells(header), ...dataRows],
    widths,
    defaultRowHeight: 20,
    freezeTopRow: true,
    autoFilter: true,
    rowHeights,
  };
}

// 4-4. 実在する archetype×personality の組(ALL_CHARS から集計)。
function getRealCombos(sandbox) {
  const combos = new Map(); // "archKey::persKey" -> [{name,style,role,traits}]
  for (const c of sandbox.ALL_CHARS) {
    const key = `${c.archetype}::${c.personality}`;
    if (!combos.has(key)) combos.set(key, []);
    combos.get(key).push(c);
  }
  return combos;
}

// 4-5. 「その他セリフ / ナレーション・記事 / コーチ」への行き先(ホーム)分類。
//      char-ID鍵テーブル(VICTORY_LINES/CHAR_PROFILES)は呼び出し側で別扱い。
const COACH_TABLE_OVERRIDE = new Set(['ALL_COACHES', 'COACH_ABILITY_CATALOG', 'COACH_FLAVOR_DEFS']);
const NARRATION_CAT_SET = new Set(['09', '10', '16', '19', '20']);
const NARRATION_NAME_SUBSTR = ['COMMENTARY', 'HEADLINE', 'TICKER', 'TEMPLATE', 'EDITORIAL', '_TEXTS', '_MEMOS', '_DOCS', 'NARRATION'];
const NARRATION_PATH_OVERRIDE = new Set(['FINISH_SUSPENSE', 'BESTMATCH_FLAVOR']);
const MISC_HOME_OVERRIDE = new Set(['NOTIF_DIALOGUES']); // cat10 だが話者ありダイアログなので misc に残す

function classifyHome(entry) {
  if (entry.path === 'VICTORY_LINES' || entry.path === 'CHAR_PROFILES') return 'char';
  if (entry.file === 'coach-lines.js' || COACH_TABLE_OVERRIDE.has(entry.path)) return 'coach';
  if (entry.file === 'kuroda-text.js') return 'narration';
  if (MISC_HOME_OVERRIDE.has(entry.path)) return 'misc';
  if (NARRATION_CAT_SET.has(entry.cat)) return 'narration';
  const lastSeg = entry.path.split('.').pop();
  if (NARRATION_NAME_SUBSTR.some(s => lastSeg.includes(s))) return 'narration';
  if (NARRATION_PATH_OVERRIDE.has(entry.path)) return 'narration';
  return 'misc';
}

// 4-6. ナレーション・記事 の6ブック分類。
function narrationBucket(entry) {
  if (entry.file === 'kuroda-text.js' || entry.path.includes('KURODA')) return '黒田記者の目';
  if (entry.path.includes('NEWS') || entry.path.includes('HEADLINE') || entry.path === 'SEASON_REVIEW_LINES') return '新聞見出し系';
  if (entry.path.includes('NOTIF') || entry.path === 'SNAPSHOT_TEXTS' || entry.path === 'LARGE_EVENT_TEXTS' ||
      entry.path === 'DECISION_DOCS' || entry.path === 'BONUS_PROPOSAL_MEMOS' || entry.path === 'CAMP_FLAVOR_TEXTS') {
    return '通知・スナップショット系';
  }
  if (entry.path.includes('chronicle') || entry.path.includes('EPITHET') || entry.path === 'CREDITS' ||
      entry.path === 'MILESTONE_EVENTS' || entry.path.includes('DOME_') || entry.path === 'AWARD_LINES' || entry.path === 'TRAIT_DEFS') {
    return '称号・記録・年代記';
  }
  if (entry.path.includes('COMMENTARY') || entry.path === 'FINISH_SUSPENSE' || entry.path === 'BESTMATCH_FLAVOR' ||
      entry.path === 'WEEKLY_STORY_TICKER' || entry.path === 'PPV_HYPE_TEMPLATES') {
    return '実況・演出';
  }
  return '雰囲気・その他';
}

// 4-7. コーチ の3ブック分類。
// 2026-08-01: 25行/238行/347行の3ファイルに割れていて開き直しが面倒だったため1本に統合。
// 中身の区別は「カテゴリ」列で付ける。
function coachBucket() { return 'コーチ'; }

function coachCategory(entry) {
  if (entry.path === 'ALL_COACHES') return 'コーチ紹介文';
  if (entry.path === 'COACH_ABILITY_CATALOG' || entry.path === 'COACH_FLAVOR_DEFS') return 'コーチ能力名鑑';
  return 'コーチボイス';
}

// 4-8. その他セリフ の分類(カテゴリ単位。F07_LINES のみ突出して大きい
//      (leftover 1000本超)ため単独ファイルに分ける)。
const MISC_CAT_LABEL = {
  '01': '01-試合本編・勝利演出',
  '02': '02-タッグマッチ',
  '03': '03-因縁・絆イベント',
  '04': '04-挑戦試合',
  '05': '05-引退・引き抜き・引き留め',
  '06': '06-契約交渉',
  '07b': '07b-派閥イベント',
  '08': '08-成長・スランプ・モチベーション',
  '10': '10-通知ダイアログ',
  '11': '11-選択イベント・大型イベント',
  '12': '12-選手経歴イベント',
  '13': '13-Glimpse Cascade',
  '14': '14-PPV・対抗戦・トーナメント',
  '17': '17-関係性フラグ',
  '18': '18-経営危機・エンディング',
};

// 2026-08-01: 5行・14行・17行…という極小ファイルが13本並んでいて
// 「まとめて直せない」状態だったため3本に統合した。
//   派閥        … F07動向 + 派閥イベント(cat07)
//   関係性フラグ … cat17(単独で473行あるので分けたまま)
//   その他      … 残り全部
// どの分類の行かは「カテゴリ」列で絞り込む。
function miscBucket(entry) {
  if (entry.path === 'F07_LINES' || entry.cat === '07') return '派閥';
  if (entry.cat === '17') return '関係性フラグ';
  return 'その他';
}

// 統合後もどの分類か分かるようにする表示名
function miscCategory(entry) {
  if (entry.path === 'F07_LINES') return '07a-派閥動向(F07)';
  const key = entry.cat === '07' ? '07b' : entry.cat;
  return MISC_CAT_LABEL[key] || `${entry.cat}-その他`;
}

// 4-9. 全テーブルを走査し、行を「キャラタイプ別 / 該当者なし / char個別
//      テーブル / home(coach・narration・misc)のバケツ」に振り分ける。
function collectAllRows(sandbox) {
  const realCombos = getRealCombos(sandbox);
  const comboRows = new Map(); // "archKey::persKey" -> rows[]
  for (const key of realCombos.keys()) comboRows.set(key, []);
  const orphanRows = []; // 実在キャラのいない組み合わせ
  const bucketRows = new Map(); // "home/bucketName" -> rows[]
  const notFound = [];

  for (const entry of EX.TABLE_MANIFEST) {
    if (entry.path === 'VICTORY_LINES' || entry.path === 'CHAR_PROFILES') continue; // 別扱い
    const rows = buildRowsForTable(sandbox, entry);
    if (rows === null) { notFound.push(entry); continue; }
    const home = classifyHome(entry);
    for (const r of rows) {
      if (r.archetype && r.personality) {
        const archKey = ARCHETYPE_LABEL_TO_KEY[r.archetype];
        const persKey = PERSONALITY_LABEL_TO_KEY[r.personality];
        const comboKey = `${archKey}::${persKey}`;
        if (realCombos.has(comboKey)) {
          comboRows.get(comboKey).push({ ...r, category: `${entry.cat} ${EX.CATEGORIES[entry.cat].title}` });
          continue;
        }
        orphanRows.push({ ...r, category: `${entry.cat} ${EX.CATEGORIES[entry.cat].title}`, combo: `${ARCHETYPE_LABELS[archKey]}×${PERSONALITY_LABELS[persKey]}` });
        continue;
      }
      let bucketName, category;
      if (home === 'coach') { bucketName = coachBucket(entry); category = coachCategory(entry); }
      else if (home === 'narration') { bucketName = narrationBucket(entry); category = bucketName; }
      else { bucketName = miscBucket(entry); category = miscCategory(entry); }
      const key = `${home}/${bucketName}`;
      if (!bucketRows.has(key)) bucketRows.set(key, []);
      bucketRows.get(key).push({ ...r, category });
    }
  }

  return { realCombos, comboRows, orphanRows, bucketRows, notFound };
}

// 4-10. キャラID鍵テーブル(VICTORY_LINES / CHAR_PROFILES)を
//       ALL_CHARS と結合して「キャラ個人別」の行を作る。
function buildCharKeyedRows(sandbox, entry) {
  const charById = new Map(sandbox.ALL_CHARS.map(c => [String(c.id), c]));
  const rows = buildRowsForTable(sandbox, entry);
  if (!rows) return [];
  for (const r of rows) {
    // ID は "VICTORY_LINES.1[2]" や "CHAR_PROFILES.1" の形。テーブル名を
    // 除いた先頭の数字列がキャラID。
    const m = /^(\d+)/.exec(r.path);
    const cid = m ? m[1] : null;
    const c = cid ? charById.get(cid) : null;
    r.charName = c ? c.name : `(不明: id=${cid})`;
    r.archetype = c ? ARCHETYPE_LABELS[c.archetype] || c.archetype : '';
    r.personality = c ? PERSONALITY_LABELS[c.personality] || c.personality : '';
    r._charId = cid ? Number(cid) : 0;
  }
  rows.sort((a, b) => a._charId - b._charId || a.path.localeCompare(b.path));
  return rows;
}

// 4-11. 「在籍キャラ一覧」シート(キャラタイプ別ファイル先頭)。
function buildRosterSheet(comboKey, members) {
  const header = ['名前', 'スタイル', 'ロール', '特性'];
  const note = [
    { value: `このタイプ(${labelForCombo(comboKey)})に該当するキャラクター: ${members.length}名`, style: STYLES.summaryHeader },
    { value: '', style: STYLES.summaryHeader },
    { value: '', style: STYLES.summaryHeader },
    { value: '', style: STYLES.summaryHeader },
  ];
  const blank = ['', '', '', ''].map(value => ({ value, style: STYLES.base }));
  const dataRows = members
    .slice()
    .sort((a, b) => a.id - b.id)
    .map(c => [
      { value: c.name, style: STYLES.note },
      { value: c.style, style: STYLES.metaCommon },
      { value: c.role, style: STYLES.metaCommon },
      { value: (c.traits || []).join('、'), style: STYLES.note },
    ]);
  return {
    name: '在籍キャラ',
    rows: [note, blank, headerCells(header), ...dataRows],
    widths: [16, 14, 12, 40],
    defaultRowHeight: 20,
    freezeTopRow: false,
    autoFilter: false,
  };
}

function labelForCombo(comboKey) {
  const [archKey, persKey] = comboKey.split('::');
  return `${ARCHETYPE_LABELS[archKey]}×${PERSONALITY_LABELS[persKey]}`;
}

function comboFileName(comboKey) {
  const [archKey, persKey] = comboKey.split('::');
  return `${ARCHETYPE_LABELS[archKey]}×${PERSONALITY_LABELS[persKey]}`;
}

// 4-12. _キャラ対応表.xlsx — どの archetype×personality に誰がいるかの一覧。
//       (archive/scripts/generate-dialogue-workbooks.js の gatherComboMap を参考)
function buildComboMapWorkbook(sandbox) {
  const archKeys = Object.keys(ARCHETYPE_LABELS);
  const persKeys = Object.keys(PERSONALITY_LABELS);
  const realCombos = getRealCombos(sandbox);

  // シート1: マトリクス(archetype × personality の人数表)
  const matrixHeader = ['', ...archKeys.map(a => ARCHETYPE_LABELS[a])].map(v => ({ value: v, style: STYLES.header }));
  const matrixRows = persKeys.map(p => {
    const row = [{ value: PERSONALITY_LABELS[p], style: STYLES.header }];
    for (const a of archKeys) {
      const n = (realCombos.get(`${a}::${p}`) || []).length;
      row.push({ value: n ? String(n) : '0', style: n ? STYLES.number : STYLES.note });
    }
    return row;
  });
  const matrixSheet = {
    name: '組み合わせ表',
    rows: [matrixHeader, ...matrixRows],
    widths: [12, ...archKeys.map(() => 10)],
    defaultRowHeight: 20,
    freezeTopRow: true,
    autoFilter: false,
  };

  // シート2: 組み合わせ内訳(49組すべて。0人の組も明記)
  const detailHeader = headerCells(['archetype', 'personality', '人数', 'キャラ名']);
  const detailRows = [];
  for (const a of archKeys) {
    for (const p of persKeys) {
      const members = realCombos.get(`${a}::${p}`) || [];
      detailRows.push([
        { value: ARCHETYPE_LABELS[a], style: STYLES.metaCommon },
        { value: PERSONALITY_LABELS[p], style: STYLES.metaCommon },
        { value: String(members.length), style: members.length ? STYLES.number : STYLES.note },
        { value: members.map(c => c.name).join('、') || '(該当者なし)', style: STYLES.note },
      ]);
    }
  }
  const detailSheet = makeSheet('組み合わせ内訳', ['archetype', 'personality', '人数', 'キャラ名'], [14, 14, 8, 60], detailRows);

  // シート3: キャラ一覧(127名)
  const charRows = sandbox.ALL_CHARS
    .slice()
    .sort((a, b) => a.id - b.id)
    .map(c => [
      { value: String(c.id), style: STYLES.metaCommon },
      { value: c.name, style: STYLES.note },
      { value: ARCHETYPE_LABELS[c.archetype] || c.archetype, style: STYLES.metaCommon },
      { value: PERSONALITY_LABELS[c.personality] || c.personality, style: STYLES.metaCommon },
      { value: c.style, style: STYLES.metaCommon },
      { value: c.role, style: STYLES.metaCommon },
      { value: (c.traits || []).join('、'), style: STYLES.note },
    ]);
  const charSheet = makeSheet('キャラ一覧', ['ID', '名前', 'archetype', 'personality', 'スタイル', 'ロール', '特性'], [8, 14, 10, 10, 12, 10, 40], charRows);

  return [matrixSheet, detailSheet, charSheet];
}

// ───────────────────────────────────────────────────────────────────────
// 4-13. export メイン処理
// ───────────────────────────────────────────────────────────────────────
function runExport(args) {
  if (args.length) {
    console.error('[dialogue-workbook] NOTE: export はカテゴリ引数を受け付けなくなりました(常に全件書き出し)。指定された引数は無視します。');
  }
  console.log('[dialogue-workbook] parsing + evaluating src/*.js ...');
  const { allDecls } = EX.loadAllDecls();
  const sandbox = EX.evalAll(allDecls);
  const errs = sandbox.__ERRORS__ || [];
  if (errs.length) {
    console.error(`[dialogue-workbook] ${errs.length} declaration(s) failed to evaluate (see extract-dialogue.js output for detail)`);
  }

  const { comboRows, orphanRows, bucketRows, notFound } = collectAllRows(sandbox);
  if (notFound.length) {
    for (const e of notFound) console.error(`[dialogue-workbook] WARN: table not resolvable, skipped: ${e.path}`);
  }

  let totalWritten = 0;
  const summary = [];
  writtenPaths.clear();

  // --- キャラタイプ別/ (34ファイル) ---
  const realCombos = getRealCombos(sandbox);
  for (const [comboKey, members] of realCombos.entries()) {
    const rows = (comboRows.get(comboKey) || []).slice().sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
    const used = new Set();
    const rosterSheet = buildRosterSheet(comboKey, members);
    const dataSheet = makeSheet(uniqueSheetName('全セリフ', used), COMBO_HEADER, COMBO_WIDTHS, rows.map(buildComboRow));
    const outPath = path.join(XLSX_DIR, 'キャラタイプ別', `${comboFileName(comboKey)}.xlsx`);
    writeWorkbook(outPath, [rosterSheet, dataSheet]);
    totalWritten += rows.length;
    summary.push(`  キャラタイプ別/${comboFileName(comboKey)}.xlsx — 在籍${members.length}名 / セリフ${rows.length}本`);
  }

  // --- キャラタイプ別/_該当者なし.xlsx (現在キャラがいない組み合わせ) ---
  {
    const rows = orphanRows.slice().sort((a, b) => a.combo.localeCompare(b.combo) || a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
    if (rows.length) {
      const header = ['ID(編集不可)', '出典', 'テーブル', 'パス', '口調×性格', 'カテゴリ', '現在', '改訂', '備考'];
      const widths = [30, 16, 22, 26, 18, 20, 50, 50, 20];
      const dataRows = rows.map(r => [
        { value: r.id, style: STYLES.idLock },
        { value: r.source, style: STYLES.metaCommon },
        { value: r.table, style: STYLES.metaCommon },
        { value: r.path, style: STYLES.note },
        { value: r.combo, style: STYLES.metaCommon },
        { value: r.category, style: STYLES.metaCommon },
        { value: r.current, style: STYLES.current },
        { value: r.revised, style: STYLES.revised },
        { value: r.note, style: STYLES.note },
      ]);
      // 注記は別シートに置く(データシートの row0 は常にヘッダーである
      // 前提を崩さないため — collectCandidatesFromWorkbook は sheet.rows[0]
      // をヘッダー行として読む)。
      const noteSheet = {
        name: '説明',
        rows: [[{ value: '現在このゲームに該当キャラが存在しない口調×性格の組み合わせ(将来キャラ用の予備セリフ)。34組ファイルには含めていない。', style: STYLES.summaryHeader }]],
        widths: [100],
        defaultRowHeight: 30,
        freezeTopRow: false,
        autoFilter: false,
      };
      const sheet = makeSheet('全セリフ', header, widths, dataRows);
      const outPath = path.join(XLSX_DIR, 'キャラタイプ別', '_該当者なし.xlsx');
      writeWorkbook(outPath, [noteSheet, sheet]);
      totalWritten += rows.length;
      summary.push(`  キャラタイプ別/_該当者なし.xlsx — セリフ${rows.length}本(実在しない組み合わせ${new Set(rows.map(r => r.combo)).size}種)`);
    }
  }

  // --- キャラ個人別/ ---
  {
    const victoryEntry = EX.TABLE_MANIFEST.find(t => t.path === 'VICTORY_LINES');
    const rows = buildCharKeyedRows(sandbox, victoryEntry);
    const used = new Set();
    const sheet = makeSheet(uniqueSheetName('全セリフ', used), CHAR_HEADER, CHAR_WIDTHS, rows.map(buildCharRow));
    const outPath = path.join(XLSX_DIR, 'キャラ個人別', '勝利セリフ.xlsx');
    writeWorkbook(outPath, [sheet]);
    totalWritten += rows.length;
    summary.push(`  キャラ個人別/勝利セリフ.xlsx — ${rows.length}本`);
  }
  {
    const profileEntry = EX.TABLE_MANIFEST.find(t => t.path === 'CHAR_PROFILES');
    const rows = buildCharKeyedRows(sandbox, profileEntry);
    const used = new Set();
    const sheet = makeSheet(uniqueSheetName('全セリフ', used), CHAR_HEADER, CHAR_WIDTHS, rows.map(buildCharRow));
    const outPath = path.join(XLSX_DIR, 'キャラ個人別', 'プロフィール.xlsx');
    writeWorkbook(outPath, [sheet]);
    totalWritten += rows.length;
    summary.push(`  キャラ個人別/プロフィール.xlsx — ${rows.length}本`);
  }

  // --- ナレーション・記事/ , コーチ/ , その他セリフ/ ---
  const HOME_FOLDER = { coach: 'コーチ', narration: 'ナレーション・記事', misc: 'その他セリフ' };
  const bucketKeys = [...bucketRows.keys()].sort();
  for (const key of bucketKeys) {
    const [home, bucketName] = key.split('/');
    const folder = HOME_FOLDER[home];
    const rows = bucketRows.get(key);
    const used = new Set();
    const sheet = makeSheet(uniqueSheetName('全セリフ', used), GENERIC_HEADER, GENERIC_WIDTHS, rows.map(buildGenericRow));
    const outPath = path.join(XLSX_DIR, folder, `${bucketName}.xlsx`);
    writeWorkbook(outPath, [sheet]);
    totalWritten += rows.length;
    summary.push(`  ${folder}/${bucketName}.xlsx — ${rows.length}本`);
  }

  // --- _キャラ対応表.xlsx ---
  {
    const sheets = buildComboMapWorkbook(sandbox);
    const outPath = path.join(XLSX_DIR, '_キャラ対応表.xlsx');
    writeWorkbook(outPath, sheets);
    summary.push(`  _キャラ対応表.xlsx`);
  }

  // ── 後始末: 今回書かなかった .xlsx を消す ──
  //
  // 行が1本も無くなったブックは書き出されない。放置すると**古いIDのファイルが
  // 残り続ける**。2026-08-01 の軸入れ替えで実際にこれが起き、「02-タッグマッチ.xlsx が
  // 入れ替え前のIDのまま残っている」＝棚卸しの数字が狂う、という形で表面化した。
  // 開いたままの Excel(.~lock) がある場合は消さずに警告する。
  {
    const wrote = new Set();
    (function collect(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) collect(full);
        else if (e.name.endsWith('.xlsx') && !e.name.startsWith('~$')) wrote.add(full);
      }
    })(XLSX_DIR);
    const stale = [...wrote].filter(f => !writtenPaths.has(path.resolve(f)));
    for (const f of stale) {
      const lock = path.join(path.dirname(f), '.~lock.' + path.basename(f) + '#');
      if (fs.existsSync(lock)) {
        console.warn(`[dialogue-workbook] ⚠ 空になったが Excel で開かれているため消せない: ${path.relative(XLSX_DIR, f)}`);
        continue;
      }
      fs.unlinkSync(f);
      console.log(`[dialogue-workbook] 削除(行が無くなったため): ${path.relative(XLSX_DIR, f)}`);
    }
  }

  console.log('[dialogue-workbook] export summary:');
  for (const s of summary) console.log(s);
  console.log(`[dialogue-workbook] total dialogue rows written: ${totalWritten} (+ 該当者なし分は上記に含む)`);
  console.log(`[dialogue-workbook] wrote workbooks under ${XLSX_DIR}`);
}

// ───────────────────────────────────────────────────────────────────────
// 5. apply — ソーステキストへの外科的リテラル置換
// ───────────────────────────────────────────────────────────────────────

// 5-1. 汎用トークンスキャナ(tools/extract-dialogue-parser.js の scanExpr と
//      同じ文字レベルの規則(文字列/テンプレート/コメントを飛ばす)を使うが、
//      「トップレベルの , / } / ] / ) に達したら消費せず止まる」という
//      別の終了条件を持つ。object/array の1要素分だけを安全に読み飛ばす
//      ために使う。
function skipWsAndComments(src, i) {
  const n = src.length;
  for (;;) {
    while (i < n && /\s/.test(src[i])) i += 1;
    if (src[i] === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? n : nl;
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      i = close === -1 ? n : close + 2;
      continue;
    }
    break;
  }
  return i;
}

function scanValue(src, i) {
  const stack = [];
  const n = src.length;
  while (i < n) {
    const top = stack.length ? stack[stack.length - 1] : null;
    const c = src[i];

    if (top === 'TEMPLATE') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i += 1; continue; }
      if (c === '$' && src[i + 1] === '{') { stack.push('DOLLARBRACE'); i += 2; continue; }
      i += 1;
      continue;
    }

    if (stack.length === 0 && (c === ',' || c === '}' || c === ']' || c === ')')) {
      return i;
    }

    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? n : nl;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      i = close === -1 ? n : close + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      i += 1;
      while (i < n && src[i] !== quote) { if (src[i] === '\\') i += 1; i += 1; }
      i += 1;
      continue;
    }
    if (c === '`') { stack.push('TEMPLATE'); i += 1; continue; }
    if (c === '{') { stack.push('OBJ'); i += 1; continue; }
    if (c === '[') { stack.push('ARR'); i += 1; continue; }
    if (c === '(') { stack.push('PAREN'); i += 1; continue; }
    if (c === '}') { if (top === 'OBJ' || top === 'DOLLARBRACE') stack.pop(); i += 1; continue; }
    if (c === ']') { if (top === 'ARR') stack.pop(); i += 1; continue; }
    if (c === ')') { if (top === 'PAREN') stack.pop(); i += 1; continue; }
    i += 1;
  }
  return i;
}

function decodeSimpleQuoted(raw) {
  const quote = raw[0];
  const inner = raw.slice(1, -1);
  if (quote !== "'" && quote !== '"') return raw;
  return inner.replace(/\\(.)/g, '$1');
}

function readKeyToken(src, i) {
  const n = src.length;
  if (src[i] === "'" || src[i] === '"') {
    const start = i;
    const quote = src[i];
    i += 1;
    while (i < n && src[i] !== quote) { if (src[i] === '\\') i += 1; i += 1; }
    i += 1;
    return { key: decodeSimpleQuoted(src.slice(start, i)), end: i };
  }
  // 素の識別子キー。ASCII の [A-Za-z0-9_$] に限らず、Unicode識別子
  // (例: 延命術)も実在するため、構文上の区切り文字( : ( , } 空白)に
  // 当たるまでを1トークンとして読む。
  const start = i;
  while (i < n && !/[\s:(),}]/.test(src[i])) i += 1;
  return { key: src.slice(start, i), end: i };
}

// { key: value, ... } の他に、Engine.* 名前空間オブジェクトで多用される
// ES6 メソッド省略記法( foo(a,b) {...} / async foo() {...} / *foo() {...} /
// get foo() {...} )も飛ばせるようにする。セリフの葉はメソッド本体の中には
// 存在しないため、メソッドは中身を見ずに丸ごとスキップして次のキーへ進む。
function findObjectKey(src, openBraceIdx, keyName) {
  let i = skipWsAndComments(src, openBraceIdx + 1);
  const n = src.length;
  while (i < n) {
    if (src[i] === '}') return null;

    let generator = false;
    if (src[i] === '*') { generator = true; i = skipWsAndComments(src, i + 1); }

    let tok = readKeyToken(src, i);
    let key = tok.key;
    let afterKey = skipWsAndComments(src, tok.end);

    // get/set/async プレフィックス: 次のトークンが更に続く識別子/文字列
    // キーで、その後ろが '(' なら、tok は本当のキー名ではなくプレフィックス。
    if (!generator && (key === 'get' || key === 'set' || key === 'async') && afterKey < n && /[A-Za-z0-9_$'"]/.test(src[afterKey])) {
      const tok2 = readKeyToken(src, afterKey);
      const after2 = skipWsAndComments(src, tok2.end);
      if (src[after2] === '(') {
        key = tok2.key;
        afterKey = after2;
      }
    }

    if (src[afterKey] === ':') {
      i = skipWsAndComments(src, afterKey + 1);
      const valueStart = i;
      const valueEnd = scanValue(src, i);
      if (key === keyName) return { valueStart, valueEnd };
      i = skipWsAndComments(src, valueEnd);
    } else if (src[afterKey] === '(') {
      // メソッド省略記法: (params) { body } をまとめて読み飛ばす。
      const afterParams = scanExpr(src, afterKey);
      const bodyStart = skipWsAndComments(src, afterParams);
      if (src[bodyStart] !== '{') {
        throw new Error(`expected method body '{' at offset ${bodyStart} while scanning object for key "${keyName}"`);
      }
      const afterBody = scanExpr(src, bodyStart);
      i = skipWsAndComments(src, afterBody);
      // メソッドは非文字列の値として扱う(該当キーが探しているキーと
      // 一致することは通常ない — セリフの葉はメソッドの戻り値ではない)。
    } else {
      throw new Error(`expected ':' or '(' at offset ${afterKey} while looking for key "${keyName}" (found token "${key}")`);
    }

    if (src[i] === ',') { i = skipWsAndComments(src, i + 1); continue; }
    if (src[i] === '}') return null;
    throw new Error(`unexpected char '${src[i]}' at offset ${i} while scanning object for key "${keyName}"`);
  }
  return null;
}

function findArrayIndex(src, openBracketIdx, index0) {
  let i = skipWsAndComments(src, openBracketIdx + 1);
  const n = src.length;
  let cur = 0;
  while (i < n) {
    if (src[i] === ']') return null;
    const valueStart = i;
    const valueEnd = scanValue(src, i);
    if (cur === index0) return { valueStart, valueEnd };
    cur += 1;
    i = skipWsAndComments(src, valueEnd);
    if (src[i] === ',') { i = skipWsAndComments(src, i + 1); continue; }
    if (src[i] === ']') return null;
    throw new Error(`unexpected char '${src[i]}' at offset ${i} while scanning array index ${index0}`);
  }
  return null;
}

// "bond_60_up.foo[1]" のようなID残余部分を ["bond_60_up","foo",1] に分解。
// キー名は "M-1"(ハイフン入り)や "延命術"(Unicode識別子)のような、単純な
// [A-Za-z0-9_$] には収まらない形も実在するため、区切り文字(., [)以外は
// 何でも1セグメントとして受け入れる。
function parseSegments(remainder) {
  const segs = [];
  const re = /\.([^.[]+)|\[(\d+)\]/g;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(remainder))) {
    if (m.index !== lastIndex) {
      throw new Error(`cannot parse path remainder near offset ${lastIndex}: "${remainder}"`);
    }
    segs.push(m[1] !== undefined ? m[1] : parseInt(m[2], 10));
    lastIndex = re.lastIndex;
  }
  if (lastIndex !== remainder.length) {
    throw new Error(`trailing unparsed path: "${remainder.slice(lastIndex)}" (full: "${remainder}")`);
  }
  return segs;
}

function locateLeafSpan(src, containerStart, segments) {
  let span = null;
  let curPos = containerStart;
  for (const seg of segments) {
    const ch = src[curPos];
    let found;
    if (typeof seg === 'string') {
      if (ch !== '{') throw new Error(`expected object literal at offset ${curPos} for key "${seg}"`);
      found = findObjectKey(src, curPos, seg);
      if (!found) throw new Error(`key not found: "${seg}" (object at offset ${curPos})`);
    } else {
      if (ch !== '[') throw new Error(`expected array literal at offset ${curPos} for index ${seg}`);
      found = findArrayIndex(src, curPos, seg - 1);
      if (!found) throw new Error(`array index not found: [${seg}] (array at offset ${curPos})`);
    }
    span = found;
    curPos = found.valueStart;
  }
  if (!span) throw new Error('empty path — no segments to descend');
  return span;
}

// 5-2. 関数本体からのリテラル抽出(tools/extract-dialogue.js の
//      extractFromFunction と同じ正規表現だが、位置(index)も返す版)。
const LIT = '(`(?:[^`\\\\]|\\\\.)*`|\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*")';
const DIRECT_RE = new RegExp('=>\\s*' + LIT + '\\s*;?\\s*$');
const RETURN_RE = new RegExp('return\\s+' + LIT);
const ANY_LIT_RE = new RegExp(LIT, 'g');

// 戻り値の start/end はデリミタ(引用符/バッククォート)を含む「リテラル全体」
// の範囲(置換時にそのまま丸ごと差し替えるため)。raw はデリミタを除いた
// 中身(tools/extract-dialogue.js の extractFromFunction が `.slice(1,-1)`
// で作る「現在」列の値と同じ形にして比較できるようにする)。
function findFunctionLiteralSpans(fnText) {
  const trimmed = fnText.trim();
  const trimOffset = fnText.indexOf(trimmed);
  let mm = DIRECT_RE.exec(trimmed);
  if (mm) {
    const start = trimOffset + mm.index + mm[0].indexOf(mm[1]);
    return [{ start, end: start + mm[1].length, raw: mm[1].slice(1, -1) }];
  }
  mm = RETURN_RE.exec(fnText);
  if (mm) {
    const start = mm.index + mm[0].indexOf(mm[1]);
    return [{ start, end: start + mm[1].length, raw: mm[1].slice(1, -1) }];
  }
  const out = [];
  let m;
  ANY_LIT_RE.lastIndex = 0;
  while ((m = ANY_LIT_RE.exec(fnText))) {
    out.push({ start: m.index, end: m.index + m[1].length, raw: m[1].slice(1, -1) });
  }
  return out;
}

// 5-3. ソースへ差し込むリテラル本文を作る。
//
// 書き戻しには意味の違う2経路があり、エスケープの扱いが逆になる。
//
//  (a) プレーンなリテラル(配列やオブジェクトの値)
//      抽出側は vm で評価した「デコード済みの値」を Excel に出しており、
//      照合も vm 評価で行う。よって差し込むときは**エスケープが必要**。
//      → escapeForQuote()
//
//  (b) 関数本体から拾ったリテラル(例 `d => ` + backtick + `...` + backtick)
//      抽出側は正規表現でソースの**生テキスト**を切り出しており、照合も生テキスト。
//      よって差し込むときは**エスケープしてはいけない**。
//      → rawLiteralBody()
//
// 2026-08-01、(b) に (a) のエスケープを掛けていたため事故が起きた:
// `${d.rivalName}` が `\${d.rivalName}` になり、黒田記者の目6本で
// プレースホルダが展開されなくなっていた(団体名の代わりに
// 「${d.rivalName}」という文字列がそのまま紙面に出る)。
function escapeForQuote(value, quoteChar) {
  let s = String(value).replace(/\\/g, '\\\\');
  s = s.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
  if (quoteChar === '`') {
    s = s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  } else {
    s = s.split(quoteChar).join(`\\${quoteChar}`);
  }
  return s;
}

// (b) 用。生テキストのまま差し込む(改行だけは1行リテラルに収める)。
function rawLiteralBody(value) {
  return String(value).replace(/\r\n|\r|\n/g, '\\n');
}

// 差し込んでもリテラルが壊れないか検査する。
// - エスケープされていない終端文字(` ' ")が本文に含まれていない
// - 末尾が奇数個のバックスラッシュで終わっていない(閉じ引用符を食う)
function literalIsSafe(text, quoteChar) {
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') { i++; continue; }
    if (s[i] === quoteChar) return false;
  }
  let trailing = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === '\\'; i--) trailing++;
  return trailing % 2 === 0;
}

// 5-4. ID -> 宣言(allDecls) の解決。ドット付き後付け拡張
//      (例: GLIMPSE_A_LINES.bond_60_up = {...})を正しく拾うため、
//      「IDの前方一致で最も長い宣言名」を採用する。
function resolveDeclarationForId(allDecls, id) {
  let best = null;
  for (const d of allDecls) {
    if (d.error) continue;
    const name = d.name;
    if (id === name || id.startsWith(`${name}.`) || id.startsWith(`${name}[`)) {
      if (!best || name.length > best.name.length) best = d;
    }
  }
  return best;
}

// ───────────────────────────────────────────────────────────────────────
// 6. apply — xlsx から改訂候補を集める
// ───────────────────────────────────────────────────────────────────────
// 編集対象ではない参照専用シート(在籍キャラ一覧・注記・_キャラ対応表の
// マトリクス/内訳/一覧など)は ID/現在/改訂 列を持たないのが仕様。
// これらは黙ってスキップし、警告で埋もれさせない。
const REFERENCE_ONLY_SHEET_NAMES = new Set(['在籍キャラ', '説明', '組み合わせ表', '組み合わせ内訳', 'キャラ一覧', '追加のしかた']);

// ID 列の見出し。往復コーパス(セリフ編集/)は「ID(編集不可)」、
// レビュー用の書き出し(tools/review-workbook.js)は「ID」。
// **同じ apply で両方を読めないと、レビュー済みの改訂を手で写す羽目になる**
// (2026-08-01: 天頂戦53件がここで詰まった)。
const ID_HEADER_NAMES = ['ID(編集不可)', 'ID'];

function collectCandidatesFromWorkbook(filePath) {
  const sheets = readWorkbookSheets(filePath);
  const candidates = [];
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    const header = sheet.rows[0];
    const headerIndex = {};
    for (const [col, label] of header.entries()) headerIndex[String(label).trim()] = col;

    const idCol = ID_HEADER_NAMES.map(n => headerIndex[n]).find(c => c !== undefined);
    const currentCol = headerIndex['現在'];
    const revisedCol = headerIndex['改訂'];
    if (idCol === undefined || currentCol === undefined || revisedCol === undefined) {
      if (!REFERENCE_ONLY_SHEET_NAMES.has(sheet.name)) {
        console.error(`[dialogue-workbook] WARN: sheet "${sheet.name}" in ${path.basename(filePath)} does not look like a dialogue-workbook sheet (missing ID/現在/改訂 header), skipped`);
      }
      continue;
    }

    for (let r = 1; r < sheet.rows.length; r += 1) {
      const row = sheet.rows[r];
      const id = String(row.get(idCol) || '').trim();
      if (!id) continue;
      const current = String(row.get(currentCol) || '');
      const revised = String(row.get(revisedCol) || '');
      if (!revised || revised === current) continue;
      candidates.push({
        id,
        current,
        revised,
        file: path.basename(filePath),
        sheet: sheet.name,
        row: r + 1,
      });
    }
  }
  return candidates;
}

// ───────────────────────────────────────────────────────────────────────
// 7. apply — 1件の改訂候補をソーステキスト上の置換に変換する
// ───────────────────────────────────────────────────────────────────────
function planEdit(candidate, allDecls, fileSrcMap, sandboxCtx) {
  const baseId = candidate.id.replace(/#(\d+)$/, '');
  const occMatch = /#(\d+)$/.exec(candidate.id);
  const occurrence = occMatch ? parseInt(occMatch[1], 10) : 1;

  const decl = resolveDeclarationForId(allDecls, baseId);
  if (!decl) {
    return { ok: false, reason: `no matching declaration found for ID root` };
  }

  const src = fileSrcMap.get(decl.file);
  if (src === undefined) {
    return { ok: false, reason: `source file not loaded: ${decl.file}` };
  }

  const containerStart = decl.endIndex - decl.exprText.length;
  const remainder = baseId.slice(decl.name.length);

  let segments;
  try {
    segments = parseSegments(remainder);
  } catch (e) {
    return { ok: false, reason: `path parse error: ${e.message}` };
  }

  let span;
  try {
    span = locateLeafSpan(src, containerStart, segments);
  } catch (e) {
    return { ok: false, reason: `source location error: ${e.message}` };
  }

  const spanText = src.slice(span.valueStart, span.valueEnd);
  const first = spanText[0];

  if (first === "'" || first === '"' || first === '`') {
    // プレーンなリテラル。vm評価で「現在」列と一致するか検証してから置換する。
    let decoded;
    try {
      decoded = vm.runInContext(spanText, sandboxCtx, { timeout: 200 });
    } catch (e) {
      return { ok: false, reason: `could not evaluate source literal for verification: ${e.message}` };
    }
    if (decoded !== candidate.current) {
      return { ok: false, reason: `source text has changed since export (current column does not match src/${decl.file})` };
    }
    const quoteChar = first;
    const newLiteral = quoteChar + escapeForQuote(candidate.revised, quoteChar) + quoteChar;
    return {
      ok: true,
      file: decl.file,
      start: span.valueStart,
      end: span.valueEnd,
      newText: newLiteral,
    };
  }

  // 関数(アロー関数等)の本体からの抽出値。生テキスト一致で照合する。
  const literalSpans = findFunctionLiteralSpans(spanText);
  const target = literalSpans[occurrence - 1];
  if (!target) {
    return { ok: false, reason: `function literal occurrence #${occurrence} not found (found ${literalSpans.length})` };
  }
  if (target.raw !== candidate.current) {
    return { ok: false, reason: `source text has changed since export (function literal #${occurrence} does not match src/${decl.file})` };
  }
  const quoteChar = spanText[target.start];
  // 生テキスト照合の経路。エスケープを掛けると ${...} が壊れるので素で差し込む。
  const body = rawLiteralBody(candidate.revised);
  if (!literalIsSafe(body, quoteChar)) {
    return { ok: false, reason: `revised text would break the ${quoteChar} literal (unescaped ${quoteChar} or trailing backslash)` };
  }
  const newLiteral = quoteChar + body + quoteChar;
  return {
    ok: true,
    file: decl.file,
    start: span.valueStart + target.start,
    end: span.valueStart + target.end,
    newText: newLiteral,
  };
}

// ───────────────────────────────────────────────────────────────────────
// 8. apply — メイン処理
// ───────────────────────────────────────────────────────────────────────
// セリフ編集/ はフォルダ分割(キャラタイプ別/コーチ/ナレーション・記事/...)に
// なったため、直下だけでなく再帰的に .xlsx を拾う必要がある。Excel が開いて
// いる間に作る一時ロックファイル(~$xxx.xlsx)は除外する。
function findAllXlsxRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('~$')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...findAllXlsxRecursive(full));
    } else if (name.toLowerCase().endsWith('.xlsx')) {
      out.push(full);
    }
  }
  return out;
}

function findXlsxByBaseName(dir, baseNameWithExt) {
  const all = findAllXlsxRecursive(dir);
  return all.filter(f => path.basename(f).toLowerCase() === baseNameWithExt.toLowerCase());
}

function resolveApplyTargets(args) {
  if (args.length === 0) {
    return findAllXlsxRecursive(XLSX_DIR);
  }
  return args.map(arg => {
    if (fs.existsSync(arg) && fs.statSync(arg).isFile()) return path.resolve(arg);
    const withExt = arg.toLowerCase().endsWith('.xlsx') ? arg : `${arg}.xlsx`;
    // フォルダ相対パス(例: "キャラタイプ別/丁寧×真面目.xlsx")として
    // そのまま存在するか。
    const asRelative = path.join(XLSX_DIR, withExt);
    if (fs.existsSync(asRelative)) return asRelative;
    // ファイル名だけ(拡張子込み/抜き)で渡された場合は再帰的に探す。
    const baseName = path.basename(withExt);
    const matches = findXlsxByBaseName(XLSX_DIR, baseName);
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      throw new Error(`workbook name is ambiguous: "${arg}" matches multiple files:\n  ${matches.join('\n  ')}\n(指定するときは セリフ編集/ からの相対パスで指定してください)`);
    }
    throw new Error(`workbook not found: ${arg} (looked at "${arg}", "${asRelative}", and recursively under ${XLSX_DIR})`);
  });
}

function runApply(args) {
  const dryRun = args.includes('--dry-run');
  const fileArgs = args.filter(a => a !== '--dry-run');
  const targets = resolveApplyTargets(fileArgs);
  if (targets.length === 0) {
    console.log('[dialogue-workbook] no workbooks to apply (nothing found).');
    return;
  }

  console.log(`[dialogue-workbook] reading ${targets.length} workbook(s)...`);
  let candidates = [];
  for (const t of targets) {
    const found = collectCandidatesFromWorkbook(t);
    console.log(`  ${path.basename(t)}: ${found.length} candidate revision(s)`);
    candidates = candidates.concat(found);
  }

  // 同一IDが複数のブックにまたがって別内容で改訂されているケースは
  // 事故なので、後勝ちにせず先に見つかった方だけ採用し警告する。
  const byId = new Map();
  const deduped = [];
  for (const c of candidates) {
    const existing = byId.get(c.id);
    if (existing) {
      if (existing.revised !== c.revised) {
        console.error(`[dialogue-workbook] WARN: conflicting revision for ${c.id} in ${c.file}:${c.sheet} (using first seen from ${existing.file}:${existing.sheet})`);
      }
      continue;
    }
    byId.set(c.id, c);
    deduped.push(c);
  }
  candidates = deduped;

  if (candidates.length === 0) {
    console.log('[dialogue-workbook] no revisions to apply (改訂 column is empty everywhere).');
    return;
  }

  console.log('[dialogue-workbook] parsing + evaluating src/*.js for verification ...');
  const { allDecls, fileSrc } = EX.loadAllDecls();
  const sandbox = EX.evalAll(allDecls);
  vm.createContext(sandbox);

  const plans = [];
  const skipped = [];
  for (const c of candidates) {
    const plan = planEdit(c, allDecls, fileSrc, sandbox);
    if (plan.ok) plans.push({ ...plan, id: c.id, current: c.current, revised: c.revised });
    else skipped.push({ id: c.id, reason: plan.reason, file: c.file, sheet: c.sheet, row: c.row });
  }

  console.log(`\n[dialogue-workbook] ${plans.length} revision(s) resolved, ${skipped.length} skipped.\n`);

  if (skipped.length) {
    console.log('--- skipped (see reason) ---');
    for (const s of skipped) {
      console.log(`  [SKIP] ${s.id}\n         reason: ${s.reason}\n         source: ${s.file} / ${s.sheet} / row ${s.row}`);
    }
    console.log('');
  }

  if (plans.length) {
    console.log('--- to apply ---');
    for (const p of plans) {
      const beforePreview = p.current.length > 40 ? `${p.current.slice(0, 40)}…` : p.current;
      const afterPreview = p.revised.length > 40 ? `${p.revised.slice(0, 40)}…` : p.revised;
      console.log(`  [${p.file}] ${p.id}`);
      console.log(`    現在: ${beforePreview}`);
      console.log(`    改訂: ${afterPreview}`);
    }
    console.log('');
  }

  if (dryRun) {
    console.log('[dialogue-workbook] --dry-run: no files were modified.');
    return;
  }

  if (plans.length === 0) {
    console.log('[dialogue-workbook] nothing to write.');
    return;
  }

  // ファイルごとに編集をまとめ、後方(末尾側)から順にスプライスして
  // オフセットのズレを防ぐ。
  const byFile = new Map();
  for (const p of plans) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file).push(p);
  }

  const backups = [];
  try {
    for (const [file, edits] of byFile.entries()) {
      const fullPath = path.join(EX.SRC, file);
      const original = fileSrc.get(file);
      const backupPath = `${fullPath}.bak`;
      fs.writeFileSync(backupPath, original, 'utf8');
      backups.push({ fullPath, backupPath });

      edits.sort((a, b) => b.start - a.start);
      let text = original;
      for (const e of edits) {
        text = text.slice(0, e.start) + e.newText + text.slice(e.end);
      }
      fs.writeFileSync(fullPath, text, 'utf8');
      console.log(`[dialogue-workbook] wrote src/${file} (${edits.length} revision(s), backup at ${path.relative(ROOT, backupPath)})`);
    }
  } catch (e) {
    console.error(`[dialogue-workbook] ERROR while writing files: ${e.message}`);
    restoreBackups(backups);
    process.exit(1);
  }

  console.log('\n[dialogue-workbook] running node test/run-all.js ...');
  const testResult = spawnSync(process.execPath, [path.join(ROOT, 'test', 'run-all.js')], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (testResult.status !== 0) {
    console.error('\n[dialogue-workbook] test/run-all.js FAILED — restoring from backup and aborting.');
    restoreBackups(backups);
    process.exit(1);
  }

  console.log('\n[dialogue-workbook] test/run-all.js passed. Revisions applied successfully.');
  console.log(`[dialogue-workbook] ${plans.length} line(s) updated across ${byFile.size} file(s). Backups kept at *.bak (delete manually once reviewed).`);
}

function restoreBackups(backups) {
  for (const { fullPath, backupPath } of backups) {
    try {
      fs.copyFileSync(backupPath, fullPath);
      console.error(`[dialogue-workbook] restored ${path.relative(ROOT, fullPath)} from backup`);
    } catch (e) {
      console.error(`[dialogue-workbook] FAILED to restore ${fullPath}: ${e.message}`);
    }
  }
}

// ───────────────────────────────────────────────────────────────────────
// 9. CLI
// ───────────────────────────────────────────────────────────────────────
function main() {
  const [, , cmd, ...rest] = process.argv;
  try {
    if (cmd === 'export') {
      runExport(rest);
    } else if (cmd === 'apply') {
      runApply(rest);
    } else {
      console.log('Usage:');
      console.log('  node tools/dialogue-workbook.js export');
      console.log('  node tools/dialogue-workbook.js apply  [ファイル...] [--dry-run]');
      process.exit(cmd ? 1 : 0);
    }
  } catch (e) {
    console.error(`[dialogue-workbook] ERROR: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  detectMeta,
  buildRowsForTable,
  collectCandidatesFromWorkbook,
  planEdit,
  scanValue,
  findObjectKey,
  findArrayIndex,
  locateLeafSpan,
  parseSegments,
  resolveDeclarationForId,
  escapeForQuote,
  readWorkbookSheets,
  writeWorkbook,
  makeSheet,
};
