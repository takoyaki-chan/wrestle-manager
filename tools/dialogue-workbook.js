#!/usr/bin/env node
'use strict';
/**
 * tools/dialogue-workbook.js
 *
 * セリフ編集用 Excel(.xlsx) 往復ツール。
 *
 *   node tools/dialogue-workbook.js export [カテゴリ名...]
 *   node tools/dialogue-workbook.js apply  [ファイル...] [--dry-run]
 *
 * export: docs/dialogue/ の抽出基盤(tools/extract-dialogue.js の
 *   TABLE_MANIFEST / CATEGORIES / パース評価パイプライン)を再利用し、
 *   docs/dialogue/xlsx/<カテゴリ名>.xlsx を生成する。「改訂」列は空欄。
 *
 * apply: 生成済み .xlsx を読み、「改訂」列が「現在」列と異なる行だけを
 *   対象に、ID(=ソース上のプロパティパス)で src/*.js の該当リテラルを
 *   直接置換する(オブジェクト全体の再シリアライズはしない — コメント・
 *   1行配列などの元の書式を壊さないための方針)。書き換え前に「現在」列が
 *   実ソースと一致するか検証し、不一致ならその行はスキップ+警告する。
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
const XLSX_DIR = path.join(ROOT, 'docs', 'dialogue', 'xlsx');
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
  normal: '標準',
  composed: '鷹揚',
  ojousama: 'お嬢様',
  delinquent: 'ヤンキー',
  cool: 'クール',
  seductive: '蠱惑',
  polite: '丁寧',
};

const PERSONALITY_KEYS = new Set(Object.keys(PERSONALITY_LABELS));
const ARCHETYPE_KEYS = new Set(Object.keys(ARCHETYPE_LABELS));

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
// (例: CHALLENGE_LINES の polite_earnest / normal_normal)からも推定する。
function detectMeta(idPath, tableRoot) {
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

function writeWorkbook(filePath, sheets) {
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
// 3. カテゴリ選択の解決(CLIの引数は "04" / "04-challenge-request" /
//    "04-challenge-request.xlsx" いずれでも受け付ける)。
// ───────────────────────────────────────────────────────────────────────
function categoryBaseName(cat) {
  return EX.CATEGORIES[cat].file.replace(/\.md$/, '');
}

function resolveCategoryArg(arg) {
  const stripped = arg.replace(/\.xlsx$/i, '').replace(/\.md$/i, '');
  for (const cat of Object.keys(EX.CATEGORIES)) {
    if (cat === stripped || categoryBaseName(cat) === stripped) return cat;
  }
  return null;
}

function selectCategories(args) {
  if (!args.length) return Object.keys(EX.CATEGORIES).sort();
  const cats = [];
  for (const arg of args) {
    const cat = resolveCategoryArg(arg);
    if (!cat) throw new Error(`unknown category: ${arg}`);
    cats.push(cat);
  }
  return cats;
}

// ───────────────────────────────────────────────────────────────────────
// 4. export
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

function headerRow() {
  return ['ID(編集不可)', '出典', 'テーブル', 'パス', 'archetype', 'personality', '現在', '改訂', '備考']
    .map(value => ({ value, style: STYLES.header }));
}

function buildDataRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  const archetypeStyle = row.personality || row.archetype ? personalityStyle : STYLES.metaCommon;
  return [
    { value: row.id, style: STYLES.idLock },
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

function makeSheet(name, rows) {
  const widths = [30, 16, 22, 26, 10, 10, 50, 50, 20];
  const rowHeights = (_, rowIndex) => (rowIndex === 0 ? 24 : 40);
  return {
    name,
    rows: [headerRow(), ...rows.map(buildDataRow)],
    widths,
    defaultRowHeight: 20,
    freezeTopRow: true,
    autoFilter: true,
    rowHeights,
  };
}

// カテゴリ内のテーブル数が多い(>8)場合はテーブル単位でシートを分割する。
// 少ない場合は1カテゴリ1シート("全セリフ")にまとめる方が見通しがよい。
// (docs/dialogue/README.md のxlsxワークフロー節に理由を明記)
const SPLIT_TABLE_COUNT_THRESHOLD = 8;

function exportCategory(sandbox, cat) {
  const info = EX.CATEGORIES[cat];
  const entries = EX.TABLE_MANIFEST.filter(t => t.cat === cat);
  const tableRows = [];
  let totalRows = 0;
  for (const entry of entries) {
    const rows = buildRowsForTable(sandbox, entry);
    if (rows === null) {
      console.error(`[dialogue-workbook] WARN: table not resolvable, skipped: ${entry.path}`);
      continue;
    }
    tableRows.push({ entry, rows });
    totalRows += rows.length;
  }

  const split = entries.length > SPLIT_TABLE_COUNT_THRESHOLD;
  const used = new Set();
  let sheets;
  if (split) {
    sheets = tableRows
      .filter(t => t.rows.length > 0)
      .map(t => {
        const shortName = t.entry.path.split('.').pop();
        return makeSheet(uniqueSheetName(shortName, used), t.rows);
      });
  } else {
    const allRows = tableRows.flatMap(t => t.rows);
    sheets = [makeSheet(uniqueSheetName('全セリフ', used), allRows)];
  }

  if (sheets.length === 0) {
    console.error(`[dialogue-workbook] WARN: category ${cat} produced 0 rows, skipping xlsx write`);
    return null;
  }

  const outPath = path.join(XLSX_DIR, `${categoryBaseName(cat)}.xlsx`);
  writeWorkbook(outPath, sheets);
  return { cat, outPath, tableCount: entries.length, rowCount: totalRows, sheetCount: sheets.length, split };
}

function runExport(args) {
  const cats = selectCategories(args);
  console.log('[dialogue-workbook] parsing + evaluating src/*.js ...');
  const { allDecls } = EX.loadAllDecls();
  const sandbox = EX.evalAll(allDecls);
  const errs = sandbox.__ERRORS__ || [];
  if (errs.length) {
    console.error(`[dialogue-workbook] ${errs.length} declaration(s) failed to evaluate (see extract-dialogue.js output for detail)`);
  }

  const results = [];
  for (const cat of cats) {
    const result = exportCategory(sandbox, cat);
    if (result) results.push(result);
  }

  console.log('[dialogue-workbook] export summary:');
  for (const r of results) {
    console.log(`  ${categoryBaseName(r.cat)}.xlsx — tables:${r.tableCount} rows:${r.rowCount} sheets:${r.sheetCount}${r.split ? ' (per-table split)' : ' (combined)'}`);
  }
  console.log(`[dialogue-workbook] wrote ${results.length} workbook(s) to ${XLSX_DIR}`);
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

// 5-3. 引用符スタイルに合わせたエスケープ。
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
function collectCandidatesFromWorkbook(filePath) {
  const sheets = readWorkbookSheets(filePath);
  const candidates = [];
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    const header = sheet.rows[0];
    const headerIndex = {};
    for (const [col, label] of header.entries()) headerIndex[String(label).trim()] = col;

    const idCol = headerIndex['ID(編集不可)'];
    const currentCol = headerIndex['現在'];
    const revisedCol = headerIndex['改訂'];
    if (idCol === undefined || currentCol === undefined || revisedCol === undefined) {
      console.error(`[dialogue-workbook] WARN: sheet "${sheet.name}" in ${path.basename(filePath)} does not look like a dialogue-workbook sheet (missing ID/現在/改訂 header), skipped`);
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
  const newLiteral = quoteChar + escapeForQuote(candidate.revised, quoteChar) + quoteChar;
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
function resolveApplyTargets(args) {
  if (args.length === 0) {
    if (!fs.existsSync(XLSX_DIR)) return [];
    return fs.readdirSync(XLSX_DIR)
      .filter(f => f.toLowerCase().endsWith('.xlsx'))
      .map(f => path.join(XLSX_DIR, f));
  }
  return args.map(arg => {
    if (fs.existsSync(arg)) return path.resolve(arg);
    const withExt = arg.toLowerCase().endsWith('.xlsx') ? arg : `${arg}.xlsx`;
    const inXlsxDir = path.join(XLSX_DIR, withExt);
    if (fs.existsSync(inXlsxDir)) return inXlsxDir;
    throw new Error(`workbook not found: ${arg} (looked at "${arg}" and "${inXlsxDir}")`);
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
      console.log('  node tools/dialogue-workbook.js export [カテゴリ名...]');
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
