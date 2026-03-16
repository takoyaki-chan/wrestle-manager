const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const VICTORY_PATH = path.join(ROOT, 'src', 'victory-lines.js');

const SHEET_NAME = '\u5168\u56fa\u6709\u30bb\u30ea\u30d5';
const HEADERS = {
  charId: '\u30ad\u30e3\u30e9ID',
  lineNo: '\u884c\u756a\u53f7',
  revised: '\u4fee\u6b63\u6848',
};

function readZipEntries(filePath) {
  const buf = fs.readFileSync(filePath);
  const entries = new Map();
  let eocdOffset = -1;

  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('ZIP end of central directory not found');

  const centralDirOffset = buf.readUInt32LE(eocdOffset + 16);
  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  let offset = centralDirOffset;

  for (let i = 0; i < entryCount; i += 1) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Invalid central directory record');
    }

    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.slice(offset + 46, offset + 46 + nameLength).toString('utf8');

    const localNameLength = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buf.slice(dataStart, dataStart + compressedSize);
    const content = method === 8 ? zlib.inflateRawSync(compressed) : compressed;

    entries.set(name, content.toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function decodeXmlText(text) {
  return String(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .normalize('NFC');
}

function parseSharedStrings(sharedXml) {
  if (!sharedXml) return [];
  const values = [];
  for (const match of sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    values.push([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(part => decodeXmlText(part[1])).join(''));
  }
  return values;
}

function parseSheetNames(workbookXml) {
  const names = [];
  for (const match of workbookXml.matchAll(/<sheet\b[^>]*name="([^"]+)"/g)) {
    names.push(decodeXmlText(match[1]));
  }
  return names;
}

function parseWorksheetRows(sheetXml, sharedStrings) {
  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map();
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = `${cellMatch[1]} ${cellMatch[3]}`;
      const col = cellMatch[2];
      const content = cellMatch[4];
      const type = ((attrs.match(/\bt="([^"]+)"/) || [])[1]) || '';
      const inline = content.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const valueMatch = content.match(/<v[^>]*>([\s\S]*?)<\/v>/);
      let value = '';

      if (inline) value = decodeXmlText(inline[1]);
      else if (type === 's' && valueMatch) value = sharedStrings[Number(valueMatch[1])] || '';
      else if (valueMatch) value = decodeXmlText(valueMatch[1]);

      cells.set(col, value);
    }
    rows.push(cells);
  }
  return rows;
}

function extractRevisions(workbookPath) {
  const entries = readZipEntries(workbookPath);
  const sheetNames = parseSheetNames(entries.get('xl/workbook.xml') || '');
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml') || '');
  const sheetIndex = sheetNames.indexOf(SHEET_NAME);
  if (sheetIndex < 0) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  const rows = parseWorksheetRows(entries.get(`xl/worksheets/sheet${sheetIndex + 1}.xml`) || '', sharedStrings);
  const header = rows[0] || new Map();
  const headerIndex = {};
  for (const [col, label] of header.entries()) {
    headerIndex[String(label).trim()] = col;
  }

  const charIdCol = headerIndex[HEADERS.charId] || 'B';
  const lineNoCol = headerIndex[HEADERS.lineNo] || 'F';
  const revisedCol = headerIndex[HEADERS.revised] || 'H';

  const revisions = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const charId = String(row.get(charIdCol) || '').trim();
    const lineNo = Number(String(row.get(lineNoCol) || '').trim());
    const revised = String(row.get(revisedCol) || '').normalize('NFC');
    if (!charId || !lineNo || !revised) continue;
    revisions.push({ charId, lineNo, revised });
  }
  return revisions;
}

function loadVictoryData() {
  const source = fs.readFileSync(VICTORY_PATH, 'utf8');
  const sandbox = { console, require, module: undefined, exports: undefined };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__victory = { VICTORY_LINES };`, sandbox, { filename: VICTORY_PATH });
  return sandbox.__victory;
}

function jsString(value) {
  return `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/'/g, "\\'")}'`;
}

function isIdentifier(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

function serialize(value, indent = 0) {
  const pad = '  '.repeat(indent);
  const childPad = '  '.repeat(indent + 1);

  if (typeof value === 'string') return jsString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const lines = value.map(item => `${childPad}${serialize(item, indent + 1)}`);
    return `[\n${lines.join(',\n')}\n${pad}]`;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  const lines = entries.map(([key, child]) => {
    const renderedKey = isIdentifier(key) ? key : jsString(key);
    return `${childPad}${renderedKey}: ${serialize(child, indent + 1)}`;
  });
  return `{\n${lines.join(',\n')}\n${pad}}`;
}

function replaceConstBlock(fileText, constName, renderedValue) {
  const marker = `const ${constName} =`;
  const start = fileText.indexOf(marker);
  if (start < 0) throw new Error(`Could not find ${constName}`);

  let index = start + marker.length;
  while (/\s/.test(fileText[index])) index += 1;

  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (; index < fileText.length; index += 1) {
    const ch = fileText[index];
    const next = fileText[index + 1];
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === stringQuote) inString = false;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = true;
      stringQuote = ch;
      continue;
    }
    if (ch === '[' || ch === '{' || ch === '(') { depth += 1; continue; }
    if (ch === ']' || ch === '}' || ch === ')') { depth -= 1; continue; }
    if (ch === ';' && depth === 0) {
      return `${fileText.slice(0, start)}const ${constName} = ${renderedValue};${fileText.slice(index + 1)}`;
    }
  }
  throw new Error(`Could not determine end of ${constName}`);
}

function main() {
  const workbookPath = process.argv[2];
  if (!workbookPath) throw new Error('Usage: node scripts/apply-character-dialogue-workbook.js <workbook.xlsx>');

  const revisions = extractRevisions(workbookPath);
  const victoryData = loadVictoryData();
  let changed = 0;

  for (const revision of revisions) {
    const lines = victoryData.VICTORY_LINES[revision.charId];
    if (!lines) throw new Error(`Character not found in VICTORY_LINES: ${revision.charId}`);
    const index = revision.lineNo - 1;
    if (index < 0 || index >= lines.length) {
      throw new Error(`Line not found in VICTORY_LINES: ${revision.charId} line ${revision.lineNo}`);
    }
    if (lines[index] !== revision.revised) {
      lines[index] = revision.revised;
      changed += 1;
    }
  }

  let victoryText = fs.readFileSync(VICTORY_PATH, 'utf8');
  victoryText = replaceConstBlock(victoryText, 'VICTORY_LINES', serialize(victoryData.VICTORY_LINES));
  fs.writeFileSync(VICTORY_PATH, victoryText, 'utf8');

  console.log(JSON.stringify({
    workbookPath,
    revisionCount: revisions.length,
    changedCount: changed,
  }, null, 2));
}

main();
