const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'src', 'data.js');
const VICTORY_PATH = path.join(ROOT, 'src', 'victory-lines.js');

const JP = {
  source: '\u51fa\u5178',
  path: '\u30d1\u30b9',
  archetype: '\u5c5e\u6027',
  personality: '\u6027\u683c',
  current: '\u73fe\u884c\u30bb\u30ea\u30d5',
  revised: '\u4fee\u6b63\u6848',
};

const PERSONALITY_BY_LABEL = {
  '\u30ce\u30fc\u30de\u30eb': 'normal',
  '\u5f37\u6c17': 'bold',
  '\u5be1\u9ed9': 'quiet',
  '\u5185\u6c17': 'shy',
  '\u304a\u6c17\u697d': 'easygoing',
  '\u771f\u9762\u76ee': 'earnest',
  '\u611f\u60c5\u7684': 'emotional',
};

const ARCHETYPE_BY_LABEL = {
  '\u6a19\u6e96': 'normal',
  '\u304a\u5b22\u69d8': 'ojousama',
  '\u30e4\u30f3\u30ad\u30fc': 'delinquent',
  '\u30af\u30fc\u30eb': 'cool',
  '\u8831\u60d1': 'seductive',
  '\u4e01\u5be7': 'polite',
  '\u5171\u901a': '_default',
};

const PERSONALITY_KEYS = new Set(Object.values(PERSONALITY_BY_LABEL));
const ARCHETYPE_KEYS = new Set(Object.values(ARCHETYPE_BY_LABEL));

function loadDataModule() {
  delete require.cache[DATA_PATH];
  return require(DATA_PATH);
}

function loadVictoryData() {
  const source = fs.readFileSync(VICTORY_PATH, 'utf8');
  const sandbox = {
    console,
    require,
    module: undefined,
    exports: undefined,
  };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__victory = { VICTORY_LINES, SCOUT_SIGNING_LINES };`, sandbox, {
    filename: VICTORY_PATH,
  });
  return sandbox.__victory;
}

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

    if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Invalid local file header for ${name}`);
    }

    const localNameLength = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buf.slice(dataStart, dataStart + compressedSize);

    let content;
    if (method === 0) {
      content = compressed;
    } else if (method === 8) {
      content = zlib.inflateRawSync(compressed);
    } else {
      throw new Error(`Unsupported zip compression method: ${method}`);
    }

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
  while ((match = re.exec(workbookXml))) {
    names.push(decodeXmlText(match[1]));
  }
  return names;
}

function parseWorksheetRows(sheetXml, sharedStrings) {
  const rows = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRe.exec(sheetXml))) {
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
      if (inlineMatch) {
        value = decodeXmlText(inlineMatch[1]);
      } else if (type === 's' && valueMatch) {
        value = sharedStrings[Number(valueMatch[1])] || '';
      } else if (valueMatch) {
        value = decodeXmlText(valueMatch[1]);
      }

      cells.set(col, value);
    }

    rows.push(cells);
  }

  return rows;
}

function normalizeLabel(value, lookup) {
  const text = String(value || '').trim().normalize('NFC');
  return lookup[text] || '';
}

function normalizeKeyPart(value) {
  return String(value || '').trim().normalize('NFC');
}

function extractRevisions(workbookPath) {
  const entries = readZipEntries(workbookPath);
  const sheetNames = parseSheetNames(entries.get('xl/workbook.xml') || '');
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml') || '');
  const revisions = new Map();
  const conflicts = [];

  for (let i = 0; i < sheetNames.length; i += 1) {
    const sheetName = sheetNames[i];
    if (sheetName !== '\u5168\u30bb\u30ea\u30d5') continue;

    const sheetXml = entries.get(`xl/worksheets/sheet${i + 1}.xml`);
    if (!sheetXml) continue;

    const rows = parseWorksheetRows(sheetXml, sharedStrings);
    const header = rows[0] || new Map();
    const headerIndex = {};
    for (const [col, label] of header.entries()) {
      headerIndex[String(label).trim()] = col;
    }

    const sourceCol = headerIndex[JP.source] || 'B';
    const pathCol = headerIndex[JP.path] || 'C';
    const archetypeCol = headerIndex[JP.archetype] || 'E';
    const personalityCol = headerIndex[JP.personality] || 'D';
    const currentCol = headerIndex[JP.current] || 'H';
    const revisedCol = headerIndex[JP.revised] || 'I';

    for (let r = 1; r < rows.length; r += 1) {
      const row = rows[r];
      const source = normalizeKeyPart(row.get(sourceCol));
      const pathText = normalizeKeyPart(row.get(pathCol));
      const current = String(row.get(currentCol) || '').normalize('NFC');
      const revised = String(row.get(revisedCol) || '').normalize('NFC');
      if (!source || !revised || revised === current) continue;

      const personality = normalizeLabel(row.get(personalityCol), PERSONALITY_BY_LABEL);
      const archetype = normalizeLabel(row.get(archetypeCol), ARCHETYPE_BY_LABEL);
      const key = [source, pathText, personality, archetype, current].join('\n');

      revisions.set(key, {
        source,
        pathText,
        personality,
        archetype,
        current,
        revised,
      });
    }
  }

  return { revisions: [...revisions.values()], conflicts };
}

function buildRevisionLookup(root, source) {
  const nodes = [];

  function walk(value, ctx, holder, key) {
    if (typeof value === 'string') {
      nodes.push({
        source: normalizeKeyPart(source),
        pathText: normalizeKeyPart(ctx.path.join(' > ')),
        personality: normalizeKeyPart(ctx.personality || ''),
        archetype: normalizeKeyPart(ctx.archetype || ''),
        current: String(value).normalize('NFC'),
        holder,
        key,
      });
      return;
    }

    if (Array.isArray(value)) {
      if (value.every(item => typeof item === 'string')) {
        value.forEach((item, index) => {
          walk(item, { ...ctx, path: [...ctx.path, String(index + 1)] }, value, index);
        });
        return;
      }

      value.forEach((item, index) => {
        walk(item, { ...ctx, path: [...ctx.path, String(index + 1)] }, value, index);
      });
      return;
    }

    if (!value || typeof value !== 'object') return;

    for (const [childKey, child] of Object.entries(value)) {
      if (PERSONALITY_KEYS.has(childKey)) {
        walk(child, { ...ctx, personality: childKey }, value, childKey);
        continue;
      }
      if (ARCHETYPE_KEYS.has(childKey)) {
        walk(child, { ...ctx, archetype: childKey }, value, childKey);
        continue;
      }
      walk(child, { ...ctx, path: [...ctx.path, childKey] }, value, childKey);
    }
  }

  walk(root, { path: [], personality: '', archetype: '' }, null, null);
  return nodes;
}

function findRevisionTarget(lookup, revision) {
  const source = normalizeKeyPart(revision.source);
  const pathText = normalizeKeyPart(revision.pathText);
  const personality = normalizeKeyPart(revision.personality || '');
  const archetype = normalizeKeyPart(revision.archetype || '');
  const current = String(revision.current).normalize('NFC');

  const exact = lookup.find(node => (
    node.source === source &&
    node.pathText === pathText &&
    node.personality === personality &&
    node.archetype === archetype &&
    node.current === current
  ));
  if (exact) return exact;

  let candidates = lookup.filter(node => (
    node.source === source &&
    node.pathText === pathText &&
    node.personality === personality &&
    node.archetype === archetype
  ));
  if (candidates.length === 1) return candidates[0];

  if (!archetype) {
    candidates = lookup.filter(node => (
      node.source === source &&
      node.pathText === pathText &&
      node.personality === personality
    ));
    if (candidates.length === 1) return candidates[0];

    candidates = lookup.filter(node => (
      node.source === source &&
      node.pathText === pathText &&
      node.personality === personality &&
      node.current === current
    ));
    if (candidates.length === 1) return candidates[0];
  }

  if (!personality) {
    candidates = lookup.filter(node => (
      node.source === source &&
      node.pathText === pathText &&
      node.archetype === archetype
    ));
    if (candidates.length === 1) return candidates[0];

    candidates = lookup.filter(node => (
      node.source === source &&
      node.pathText === pathText &&
      node.archetype === archetype &&
      node.current === current
    ));
    if (candidates.length === 1) return candidates[0];
  }

  candidates = lookup.filter(node => node.source === source && node.pathText === pathText);
  return candidates.length === 1 ? candidates[0] : null;
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
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === stringQuote) {
        inString = false;
      }
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
    if (ch === '[' || ch === '{' || ch === '(') {
      depth += 1;
      continue;
    }
    if (ch === ']' || ch === '}' || ch === ')') {
      depth -= 1;
      continue;
    }
    if (ch === ';' && depth === 0) {
      return `${fileText.slice(0, start)}const ${constName} = ${renderedValue};${fileText.slice(index + 1)}`;
    }
  }

  throw new Error(`Could not determine end of ${constName}`);
}

function main() {
  const workbookPath = process.argv[2];
  if (!workbookPath) {
    throw new Error('Usage: node scripts/apply-dialogue-workbook.js <workbook.xlsx>');
  }

  const { revisions, conflicts } = extractRevisions(workbookPath);
  const dataModule = loadDataModule();
  const victoryData = loadVictoryData();
  const lookupCache = new Map();
  const touchedDataConsts = new Set();
  const touchedVictoryConsts = new Set();

  for (const revision of revisions) {
    if (revision.source === 'SCOUT_SIGNING_LINES') {
      if (!lookupCache.has(revision.source)) {
        lookupCache.set(revision.source, buildRevisionLookup(victoryData.SCOUT_SIGNING_LINES, revision.source));
      }
      const target = findRevisionTarget(lookupCache.get(revision.source), revision);
      if (!target) throw new Error(`Revision target not found: ${revision.source} -> ${revision.pathText}`);
      target.holder[target.key] = revision.revised;
      touchedVictoryConsts.add('SCOUT_SIGNING_LINES');
      continue;
    }

    if (!(revision.source in dataModule)) {
      throw new Error(`Unknown source constant: ${revision.source}`);
    }
    if (!lookupCache.has(revision.source)) {
      lookupCache.set(revision.source, buildRevisionLookup(dataModule[revision.source], revision.source));
    }
    const target = findRevisionTarget(lookupCache.get(revision.source), revision);
    if (!target) throw new Error(`Revision target not found: ${revision.source} -> ${revision.pathText}`);
    target.holder[target.key] = revision.revised;
    touchedDataConsts.add(revision.source);
  }

  let dataText = fs.readFileSync(DATA_PATH, 'utf8');
  for (const constName of touchedDataConsts) {
    dataText = replaceConstBlock(dataText, constName, serialize(dataModule[constName]));
  }
  fs.writeFileSync(DATA_PATH, dataText, 'utf8');

  let victoryText = fs.readFileSync(VICTORY_PATH, 'utf8');
  for (const constName of touchedVictoryConsts) {
    victoryText = replaceConstBlock(victoryText, constName, serialize(victoryData[constName]));
  }
  fs.writeFileSync(VICTORY_PATH, victoryText, 'utf8');

  console.log(JSON.stringify({
    workbookPath,
    revisionCount: revisions.length,
    conflictCount: conflicts.length,
    touchedDataConsts: [...touchedDataConsts],
    touchedVictoryConsts: [...touchedVictoryConsts],
  }, null, 2));
}

main();
