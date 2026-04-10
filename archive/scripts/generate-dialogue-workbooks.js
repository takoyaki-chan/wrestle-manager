const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports');

const data = require(path.join(ROOT, 'src', 'data.js'));

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
  _default: 'デフォルト',
};

const PERSONALITY_FILL = {
  '': 'metaCommon',
  ノーマル: 'personalityNormal',
  強気: 'personalityBold',
  寡黙: 'personalityQuiet',
  内気: 'personalityShy',
  お気楽: 'personalityEasygoing',
  真面目: 'personalityEarnest',
  感情的: 'personalityEmotional',
};

const MAIN_SOURCES = [
  'RIVALRY_CONFRONTATION_LINES',
  'RIVALRY_RESOLUTION_LINES',
  'GOODRIVAL_RESOLUTION_LINES',
  'BITTER_RESOLUTION_LINES',
  'RIVALRY_CONFRONTATION_LINES_70',
  'RIVALRY_CONFRONTATION_LINES_90',
  'RIVALRY_MATCH_REACTION',
  'UPSET_RIVALRY_LINES',
  'NEGOTIATE_LINES',
  'CONTRACT_NEGOTIATION_LINES',
  'RETIREMENT_LINES',
  'RETIRE_ACCEPT_LINES',
  'RETIRE_REFUSE_LINES',
  'RETAIN_LINES',
  'COACH_RETIRE_ADVICE_TEXTS',
  'AWARD_LINES',
  'BT_HINT_LINES',
  'BREAKTHROUGH_LINES',
  'SLUMP_START_LINES',
  'SLUMP_END_LINES',
  'MOTIVATION_LOSS_LINES',
  'MOTIVATION_RECOVERY_LINES',
  'NOTIF_EVENT_TEXTS',
  'NOTIF_DIALOGUES',
  'CAMP_FLAVOR_TEXTS',
  'CARE_REACTION_DIALOGUES',
  'CHOICE_EVENT_DIALOGUES',
  'LARGE_EVENT_TEXTS',
  'LARGE_EVENT_DIALOGUES',
  'ENDING_LINES',
  'TEAM_SPIRIT_TEXTS',
  'ATMOSPHERE_TEXTS',
  'COACH_REPORT_TEXTS',
  'SNAPSHOT_TEXTS',
  'PPV_OPPONENT_LINES',
  'PPV_HYPE_TEMPLATES',
  'BESTMATCH_FLAVOR',
  'MILESTONE_EVENTS',
  'GLIMPSE_A_LINES',
  'GLIMPSE_HOTSTREAK_END_LINES',
  'GLIMPSE_B_LINES',
];

function loadVictoryData() {
  const filePath = path.join(ROOT, 'src', 'victory-lines.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    console,
    require,
    module: undefined,
    exports: undefined,
  };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__victory = { VICTORY_LINES, SCOUT_SIGNING_LINES };`, sandbox, {
    filename: filePath,
  });
  return sandbox.__victory;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

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

function writeUInt16LE(buf, value, offset) {
  buf.writeUInt16LE(value & 0xffff, offset);
}

function writeUInt32LE(buf, value, offset) {
  buf.writeUInt32LE(value >>> 0, offset);
}

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

function stylesXml() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="3">' +
    '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FF22303C"/><name val="Calibri"/><family val="2"/></font>' +
    '</fonts>' +
    '<fills count="12">' +
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
    '</fills>' +
    '<borders count="2">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="thin"><color rgb="FFD0D7DE"/></top><bottom style="thin"><color rgb="FFD0D7DE"/></bottom><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="15">' +
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
    files.push({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: sheetXml(sheet),
    });
  });
  fs.writeFileSync(filePath, createZip(files));
}

function gatherComboMap(chars) {
  const map = new Map();
  for (const char of chars) {
    const personality = char.personality || 'normal';
    const archetype = char.archetype || 'normal';
    const key = `${personality}::${archetype}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(char.name);
  }
  return map;
}

function traverseText(value, sourceName, ctx, rows) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      rows.push({
        source: sourceName,
        path: ctx.path.join(' > '),
        personality: ctx.personality || '',
        archetype: ctx.archetype || '',
        text: value,
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.every(item => typeof item === 'string')) {
      value.forEach((item, index) => {
        if (item && item.trim()) {
          rows.push({
            source: sourceName,
            path: [...ctx.path, String(index + 1)].join(' > '),
            personality: ctx.personality || '',
            archetype: ctx.archetype || '',
            text: item,
          });
        }
      });
      return;
    }

    value.forEach((item, index) => {
      traverseText(item, sourceName, { ...ctx, path: [...ctx.path, String(index + 1)] }, rows);
    });
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (Object.prototype.hasOwnProperty.call(PERSONALITY_LABELS, key)) {
      traverseText(child, sourceName, { ...ctx, personality: key }, rows);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(ARCHETYPE_LABELS, key)) {
      traverseText(child, sourceName, { ...ctx, archetype: key }, rows);
      continue;
    }

    traverseText(child, sourceName, { ...ctx, path: [...ctx.path, key] }, rows);
  }
}

function jpPersonality(key) {
  return key ? PERSONALITY_LABELS[key] || key : '';
}

function jpArchetype(key) {
  if (!key) return '';
  return ARCHETYPE_LABELS[key] || key;
}

function comboTargets(comboMap, personality, archetype) {
  if (!personality) return [];
  if (!archetype || archetype === '_default') {
    const targets = [];
    for (const [key, names] of comboMap.entries()) {
      const [comboPersonality] = key.split('::');
      if (comboPersonality === personality) targets.push(...names);
    }
    return targets;
  }
  return comboMap.get(`${personality}::${archetype}`) || [];
}

function makeMainRows() {
  const victoryData = loadVictoryData();
  const comboMap = gatherComboMap(data.ALL_CHARS);
  const collected = [];

  for (const sourceName of MAIN_SOURCES) {
    if (data[sourceName] !== undefined) {
      traverseText(data[sourceName], sourceName, { path: [], personality: '', archetype: '' }, collected);
    }
  }

  traverseText(victoryData.SCOUT_SIGNING_LINES, 'SCOUT_SIGNING_LINES', { path: [], personality: '', archetype: '' }, collected);

  const rows = [];
  let index = 1;
  for (const item of collected) {
    const targets = comboTargets(comboMap, item.personality, item.archetype);
    if (item.personality && targets.length === 0) continue;

    rows.push({
      no: index,
      source: item.source,
      path: item.path,
      personality: jpPersonality(item.personality),
      archetype: item.archetype ? jpArchetype(item.archetype) : '',
      targetCount: targets.length ? String(targets.length) : '',
      targets: targets.join('、'),
      current: item.text,
      revised: '',
    });
    index += 1;
  }

  const comboSummary = [];
  let comboNo = 1;
  for (const [key, names] of [...comboMap.entries()].sort()) {
    const [personality, archetype] = key.split('::');
    comboSummary.push({
      no: comboNo,
      personality: jpPersonality(personality),
      archetype: jpArchetype(archetype),
      count: String(names.length),
      names: names.join('、'),
    });
    comboNo += 1;
  }

  return { rows, comboSummary };
}

function makeCharacterRows() {
  const victoryData = loadVictoryData();
  const byId = new Map(data.ALL_CHARS.map(char => [String(char.id), char]));
  const rows = [];
  let index = 1;
  for (const [id, lines] of Object.entries(victoryData.VICTORY_LINES)) {
    const char = byId.get(String(id));
    if (!char) continue;
    lines.forEach((line, lineIndex) => {
      rows.push({
        no: index,
        charId: String(char.id),
        charName: char.name,
        personality: jpPersonality(char.personality || 'normal'),
        archetype: jpArchetype(char.archetype || 'normal'),
        lineNo: String(lineIndex + 1),
        current: line,
        revised: '',
      });
      index += 1;
    });
  }
  return rows;
}

function styleForPersonality(label, fallback = STYLES.metaCommon) {
  const key = PERSONALITY_FILL[label] || 'metaCommon';
  return STYLES[key] || fallback;
}

function mainHeaderRow() {
  return ['No.', '出典', 'パス', '性格', '属性', '対象キャラ数', '対象キャラ', '現行セリフ', '修正案']
    .map(value => ({ value, style: STYLES.header }));
}

function comboHeaderRow() {
  return ['No.', '性格', '属性', '対象キャラ数', '対象キャラ']
    .map(value => ({ value, style: STYLES.summaryHeader }));
}

function characterHeaderRow() {
  return ['No.', 'キャラID', 'キャラ名', '性格', '属性', '行番号', '現行セリフ', '修正案']
    .map(value => ({ value, style: STYLES.header }));
}

function characterSummaryHeaderRow() {
  return ['キャラID', 'キャラ名', '性格', '属性', 'セリフ数']
    .map(value => ({ value, style: STYLES.summaryHeader }));
}

function buildMainDataRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  const archetypeStyle = row.personality ? personalityStyle : STYLES.metaCommon;
  return [
    { value: row.no, style: STYLES.number },
    { value: row.source, style: STYLES.metaCommon },
    { value: row.path, style: STYLES.note },
    { value: row.personality, style: personalityStyle },
    { value: row.archetype, style: archetypeStyle },
    { value: row.targetCount, style: STYLES.number },
    { value: row.targets, style: STYLES.note },
    { value: row.current, style: STYLES.current },
    { value: row.revised, style: STYLES.revised },
  ];
}

function buildComboDataRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  return [
    { value: row.no, style: STYLES.number },
    { value: row.personality, style: personalityStyle },
    { value: row.archetype, style: personalityStyle },
    { value: row.count, style: STYLES.number },
    { value: row.names, style: STYLES.note },
  ];
}

function buildCharacterDataRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  return [
    { value: row.no, style: STYLES.number },
    { value: row.charId, style: STYLES.metaCommon },
    { value: row.charName, style: STYLES.metaCommon },
    { value: row.personality, style: personalityStyle },
    { value: row.archetype, style: personalityStyle },
    { value: row.lineNo, style: STYLES.number },
    { value: row.current, style: STYLES.current },
    { value: row.revised, style: STYLES.revised },
  ];
}

function buildCharacterSummaryRow(row) {
  const personalityStyle = styleForPersonality(row.personality);
  return [
    { value: row.charId, style: STYLES.metaCommon },
    { value: row.charName, style: STYLES.metaCommon },
    { value: row.personality, style: personalityStyle },
    { value: row.archetype, style: personalityStyle },
    { value: row.count, style: STYLES.number },
  ];
}

function makeSheet(name, rows, options = {}) {
  return {
    name,
    rows,
    widths: options.widths,
    defaultRowHeight: options.defaultRowHeight,
    freezeTopRow: options.freezeTopRow !== false,
    autoFilter: options.autoFilter !== false,
    rowHeights: options.rowHeights,
  };
}

function buildMainWorkbook() {
  const { rows, comboSummary } = makeMainRows();
  const widths = [6, 24, 28, 12, 12, 12, 34, 58, 58];
  const comboWidths = [6, 12, 12, 12, 46];
  const rowHeights = (_, rowIndex) => (rowIndex === 0 ? 24 : 54);
  const comboRowHeights = (_, rowIndex) => (rowIndex === 0 ? 24 : 30);

  const sheets = [
    makeSheet('組合せ', [comboHeaderRow(), ...comboSummary.map(buildComboDataRow)], {
      widths: comboWidths,
      defaultRowHeight: 22,
      rowHeights: comboRowHeights,
    }),
    makeSheet('全セリフ', [mainHeaderRow(), ...rows.map(buildMainDataRow)], {
      widths,
      defaultRowHeight: 22,
      rowHeights,
    }),
    makeSheet('共通・その他', [mainHeaderRow(), ...rows.filter(row => !row.personality).map(buildMainDataRow)], {
      widths,
      defaultRowHeight: 22,
      rowHeights,
    }),
  ];

  for (const label of Object.values(PERSONALITY_LABELS)) {
    sheets.push(makeSheet(label, [mainHeaderRow(), ...rows.filter(row => row.personality === label).map(buildMainDataRow)], {
      widths,
      defaultRowHeight: 22,
      rowHeights,
    }));
  }

  return { sheets, rowCount: rows.length, comboCount: comboSummary.length };
}

function buildCharacterWorkbook() {
  const rows = makeCharacterRows();
  const widths = [6, 10, 18, 12, 12, 10, 58, 58];
  const summaryWidths = [10, 18, 12, 12, 10];
  const rowHeights = (_, rowIndex) => (rowIndex === 0 ? 24 : 54);
  const summaryRowHeights = (_, rowIndex) => (rowIndex === 0 ? 24 : 26);

  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.charId}::${row.charName}`;
    if (!grouped.has(key)) grouped.set(key, { ...row, count: 0 });
    grouped.get(key).count += 1;
  }

  const sheets = [
    makeSheet('全固有セリフ', [characterHeaderRow(), ...rows.map(buildCharacterDataRow)], {
      widths,
      defaultRowHeight: 22,
      rowHeights,
    }),
    makeSheet('キャラ一覧', [characterSummaryHeaderRow(), ...[...grouped.values()].map(buildCharacterSummaryRow)], {
      widths: summaryWidths,
      defaultRowHeight: 22,
      rowHeights: summaryRowHeights,
    }),
  ];

  for (const label of Object.values(PERSONALITY_LABELS)) {
    sheets.push(makeSheet(label, [characterHeaderRow(), ...rows.filter(row => row.personality === label).map(buildCharacterDataRow)], {
      widths,
      defaultRowHeight: 22,
      rowHeights,
    }));
  }

  return {
    sheets,
    rowCount: rows.length,
    charCount: grouped.size,
  };
}

function main() {
  ensureDir(OUT_DIR);

  const mainBook = buildMainWorkbook();
  const charBook = buildCharacterWorkbook();

  const mainPath = path.join(OUT_DIR, 'dialogue-rewrite-master.xlsx');
  const charPath = path.join(OUT_DIR, 'dialogue-rewrite-character-specific.xlsx');

  writeWorkbook(mainPath, mainBook.sheets);
  writeWorkbook(charPath, charBook.sheets);

  console.log(JSON.stringify({
    mainPath,
    charPath,
    mainRows: mainBook.rowCount,
    comboCount: mainBook.comboCount,
    characterRows: charBook.rowCount,
    characterCount: charBook.charCount,
  }, null, 2));
}

main();
