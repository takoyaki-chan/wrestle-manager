#!/usr/bin/env node
/**
 * _run_patch_tier3b.js
 * Reads tier3b JSON data and inserts 370 missing shy/polite + emotional/seductive
 * dialogue entries into src/data.js, src/victory-lines.js, and src/ui-render.js.
 *
 * Usage: node test/_run_patch_tier3b.js
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '_tier3b_data.json');
const DATA_PATH = path.join(__dirname, '..', 'src', 'data.js');
const VICTORY_PATH = path.join(__dirname, '..', 'src', 'victory-lines.js');
const UI_RENDER_PATH = path.join(__dirname, '..', 'src', 'ui-render.js');

// ═══════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════

const PERS_MAP = { 'シャイ': 'shy', '感情的': 'emotional' };
const ARCH_MAP = { '丁寧': 'polite', '蠱惑': 'seductive' };

// Source → actual const name (if different from source column)
const CONST_NAME_MAP = {
  'RET_CHAMPION_WORRY_ARCHETYPE': 'RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE',
};

// Source → file
const SOURCE_FILE = {
  'SCOUT_SIGNING_LINES': 'victory-lines.js',
  'EMOTION_TEXTS': 'ui-render.js',
};

// Sources where personality is at the top level (no sub-category path)
const FLAT_SOURCES = new Set([
  'BREAKTHROUGH_LINES', 'BT_HINT_LINES',
  'MOTIVATION_LOSS_LINES', 'MOTIVATION_RECOVERY_LINES',
  'SLUMP_END_LINES', 'GLIMPSE_HOTSTREAK_END_LINES',
  'PPV_OPPONENT_LINES',
  'WAR_CHALLENGER_DIALOGUE', 'WAR_DECLINE_DIALOGUE',
  'PPV_SUMMIT_VICTORY_LINES',
]);

// Sources where personality is at the top level but paths have subCat prefix
const FLAT_WITH_SUBCAT = new Set([
  'RETIREMENT_LINES', 'RETIRE_ACCEPT_LINES', 'RETIRE_REFUSE_LINES',
  'RETAIN_LINES', 'NEGOTIATE_LINES', 'CONTRACT_NEGOTIATION_LINES',
  'ENDING_LINES', 'SLUMP_START_LINES',
]);

// ═══════════════════════════════════════════════════════════
//  PARSE PATH
// ═══════════════════════════════════════════════════════════

function parsePath(source, pathStr) {
  const parts = pathStr.split(' > ').map(s => s.trim());

  if (source === 'EMOTION_TEXTS') {
    return { type: 'emotion', emotion: parts[0], archetype: parts[1] };
  }

  if (source === 'RET_CHAMPION_WORRY_ARCHETYPE') {
    return { type: 'archetype_flat', archetype: parts[0] };
  }

  if (source === 'SNAPSHOT_TEXTS') {
    return { type: 'snapshot', key: parts[0], voiceOrModal: parts[1] };
  }

  if (source === 'GLIMPSE_B_LINES') {
    if (parts.length === 3) {
      return { type: 'deep_nested', level1: parts[0], level2: parts[1] };
    } else {
      return { type: 'nested', subCat: parts[0] };
    }
  }

  if (FLAT_SOURCES.has(source)) {
    return { type: 'flat' };
  }

  if (FLAT_WITH_SUBCAT.has(source)) {
    return { type: 'nested', subCat: parts[0] };
  }

  // Default: nested with personality inside subCat
  return { type: 'nested', subCat: parts[0] };
}

// ═══════════════════════════════════════════════════════════
//  BUILD PATCHES
// ═══════════════════════════════════════════════════════════

function buildPatches(rows) {
  const filePatches = {};

  for (const row of rows) {
    const source = row.source;
    const personality = PERS_MAP[row.personality];
    const archetype = ARCH_MAP[row.archetype];
    const text = row.dialogue_text;

    if (!personality || !archetype) {
      console.error(`[WARN] Unknown personality/archetype: ${row.personality}/${row.archetype}`);
      continue;
    }

    const constName = CONST_NAME_MAP[source] || source;
    const file = SOURCE_FILE[source] || 'data.js';
    const parsed = parsePath(source, row.path);

    if (!filePatches[file]) filePatches[file] = {};
    if (!filePatches[file][constName]) filePatches[file][constName] = [];

    filePatches[file][constName].push({ personality, archetype, text, parsed, source });
  }

  return filePatches;
}

// ═══════════════════════════════════════════════════════════
//  BLOCK FINDING
// ═══════════════════════════════════════════════════════════

function findBlockEnd(text, maxLen) {
  const limit = maxLen || 200000;
  let depth = 0, started = false, inString = false, strChar = '';
  for (let i = 0; i < text.length && i < limit; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; strChar = ch; continue; }
    if (ch === '{') { depth++; started = true; }
    if (ch === '}') { depth--; }
    if (started && depth === 0) return i + 1;
  }
  return Math.min(text.length, limit);
}

function findKeyBlock(text, startPos, key) {
  const needsQuote = /[^a-zA-Z0-9_]/.test(key);
  let patterns;
  if (needsQuote) {
    patterns = [
      new RegExp(`\\n([ \\t]*)'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{`),
      new RegExp(`\\n([ \\t]*)"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\s*\\{`),
    ];
  } else {
    patterns = [
      new RegExp(`\\n([ \\t]*)${key}:\\s*\\{`),
    ];
  }

  const region = text.slice(startPos);
  for (const re of patterns) {
    const m = re.exec(region);
    if (m) {
      const blockStart = startPos + m.index;
      const blockRegion = text.slice(blockStart);
      const blockEnd = findBlockEnd(blockRegion);
      return {
        start: blockStart,
        end: blockStart + blockEnd,
        content: blockRegion.slice(0, blockEnd),
        indent: m[1],
      };
    }
  }
  return null;
}

function findArrayInBlock(blockContent, key) {
  const re = new RegExp(`\\b${key}:\\s*\\[`);
  return re.test(blockContent);
}

// ═══════════════════════════════════════════════════════════
//  ENSURE TRAILING COMMA
// ═══════════════════════════════════════════════════════════

function ensureTrailingComma(text, insertPos) {
  // Look backwards from insertPos to find the last non-whitespace character
  // If it's ] or } without a comma after it, add one
  let i = insertPos - 1;
  while (i >= 0 && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) {
    i--;
  }
  if (i >= 0 && (text[i] === ']' || text[i] === '}' || text[i] === "'") && text[i + 1] !== ',') {
    // Need to insert a comma
    return text.slice(0, i + 1) + ',' + text.slice(i + 1);
  }
  return text;
}

// ═══════════════════════════════════════════════════════════
//  INSERTION HELPERS
// ═══════════════════════════════════════════════════════════

function buildArrayEntry(indent, archetype, lines) {
  const linesStr = lines.map(l => `${indent}  '${l.replace(/'/g, "\\'")}'`).join(',\n');
  return `\n${indent}${archetype}: [\n${linesStr}\n${indent}],`;
}

function insertIntoPersonalityBlock(text, persBlockStart, archetype, lines) {
  const afterPers = text.slice(persBlockStart);
  const blockEnd = findBlockEnd(afterPers);
  const blockContent = afterPers.slice(0, blockEnd);

  // Check if archetype already exists
  if (findArrayInBlock(blockContent, archetype)) {
    return { changed: false, text, alreadyExists: true };
  }

  // Find composed: [ to insert before it
  const composedRe = /(\n( +))composed:\s*\[/;
  const composedMatch = composedRe.exec(blockContent);

  if (composedMatch) {
    const insertPos = persBlockStart + composedMatch.index;
    const indent = composedMatch[2];
    const newEntry = buildArrayEntry(indent, archetype, lines);
    // Ensure the line before has a trailing comma
    const fixed = ensureTrailingComma(text, insertPos);
    const shift = fixed.length - text.length;
    return { changed: true, text: fixed.slice(0, insertPos + shift) + newEntry + fixed.slice(insertPos + shift) };
  }

  // No composed — insert before block closing }
  const closeRe = /(\n( +))\}/;
  const closeMatch = closeRe.exec(blockContent);
  if (!closeMatch) {
    return { changed: false, text, alreadyExists: false };
  }
  const indent = closeMatch[2] + '  ';
  const insertPos = persBlockStart + closeMatch.index;
  const newEntry = buildArrayEntry(indent, archetype, lines);
  // Ensure trailing comma before our insertion
  const fixed = ensureTrailingComma(text, insertPos);
  const shift = fixed.length - text.length;
  return { changed: true, text: fixed.slice(0, insertPos + shift) + newEntry + fixed.slice(insertPos + shift) };
}

function createPersonalityBlock(text, containerBlockStart, personality, archetype, lines) {
  const afterContainer = text.slice(containerBlockStart);
  const blockEnd = findBlockEnd(afterContainer);
  const blockContent = afterContainer.slice(0, blockEnd);

  // Check if personality block already exists
  const persRe = new RegExp(`\\n([ \\t]*)${personality}:\\s*\\{`);
  const persMatch = persRe.exec(blockContent);
  if (persMatch) {
    return insertIntoPersonalityBlock(text, containerBlockStart + persMatch.index, archetype, lines);
  }

  // Need to create the personality block
  // Insert before the closing } of the container
  const lastClose = blockContent.lastIndexOf('}');
  if (lastClose < 1) return { changed: false, text, alreadyExists: false };

  // Find the second-to-last } which is the last personality block's closing
  // Actually, just insert before the container's closing }
  // The lastClose is the container's }, and the one before it is a personality block's }

  // Determine indent from existing personality blocks
  const existingPersRe = /\n([ \t]+)\w+:\s*\{/;
  const existingMatch = existingPersRe.exec(blockContent);
  const persIndent = existingMatch ? existingMatch[1] : '      ';
  const archIndent = persIndent + '  ';

  const linesStr = lines.map(l => `${archIndent}  '${l.replace(/'/g, "\\'")}'`).join(',\n');
  const newBlock = `\n${persIndent}${personality}: {\n${archIndent}${archetype}: [\n${linesStr}\n${archIndent}]\n${persIndent}},`;

  const insertPos = containerBlockStart + lastClose;
  // Ensure trailing comma
  const fixed = ensureTrailingComma(text, insertPos);
  const shift = fixed.length - text.length;
  return { changed: true, text: fixed.slice(0, insertPos + shift) + newBlock + '\n' + fixed.slice(insertPos + shift) };
}

// ═══════════════════════════════════════════════════════════
//  APPLY PATCHES
// ═══════════════════════════════════════════════════════════

function applyFilePatches(text, constPatches) {
  let result = text;
  let insertCount = 0, skipCount = 0, errorCount = 0;

  for (const [constName, entries] of Object.entries(constPatches)) {
    const sourceRe = new RegExp(`(const|var)\\s+${constName}\\s*=\\s*\\{`);
    const sourceMatch = sourceRe.exec(result);
    if (!sourceMatch) {
      console.error(`[ERROR] Constant not found: ${constName}`);
      errorCount += entries.length;
      continue;
    }

    const grouped = groupEntries(entries);

    for (const group of grouped) {
      const { personality, archetype, lines, parsed, source } = group;

      // Re-find sourceStart each time (text shifts after each insertion)
      const newMatch = sourceRe.exec(result);
      if (!newMatch) { errorCount++; continue; }
      const sourceStart = newMatch.index;

      let res;
      switch (parsed.type) {
        case 'flat':
          res = insertFlat(result, sourceStart, personality, archetype, lines);
          break;
        case 'nested':
          res = insertNested(result, sourceStart, parsed.subCat, personality, archetype, lines);
          break;
        case 'deep_nested':
          res = insertDeepNested(result, sourceStart, parsed.level1, parsed.level2, personality, archetype, lines);
          break;
        case 'snapshot':
          res = insertSnapshot(result, sourceStart, parsed.key, parsed.voiceOrModal, personality, archetype, lines);
          break;
        case 'emotion':
          res = insertEmotion(result, sourceStart, parsed.emotion, parsed.archetype, lines[0]);
          break;
        case 'archetype_flat':
          res = insertArchetypeFlat(result, sourceStart, parsed.archetype, lines);
          break;
        default:
          console.error(`[ERROR] Unknown type: ${parsed.type}`);
          res = { changed: false, alreadyExists: false };
      }

      if (res.changed) {
        result = res.text;
        insertCount++;
      } else if (res.alreadyExists) {
        skipCount++;
      } else {
        console.error(`[WARN] Could not insert ${constName} ${JSON.stringify(parsed)} ${personality}.${archetype}`);
        errorCount++;
      }
    }
  }

  console.log(`  Inserted: ${insertCount}, Skipped: ${skipCount}, Errors: ${errorCount}`);
  return result;
}

function groupEntries(entries) {
  const map = new Map();
  for (const entry of entries) {
    const { personality, archetype, text, parsed, source } = entry;
    const key = JSON.stringify({ parsed, personality, archetype });
    if (!map.has(key)) {
      map.set(key, { personality, archetype, lines: [], parsed, source });
    }
    map.get(key).lines.push(text);
  }
  return Array.from(map.values());
}

// ─── Flat: personality at top level ───
function insertFlat(text, sourceStart, personality, archetype, lines) {
  const sourceRegion = text.slice(sourceStart);
  const sourceEnd = findBlockEnd(sourceRegion);
  const sourceContent = sourceRegion.slice(0, sourceEnd);

  const persRe = new RegExp(`\\n([ \\t]+)${personality}:\\s*\\{`);
  const persMatch = persRe.exec(sourceContent);

  if (persMatch) {
    return insertIntoPersonalityBlock(text, sourceStart + persMatch.index, archetype, lines);
  }

  return createPersonalityBlock(text, sourceStart, personality, archetype, lines);
}

// ─── Nested: subCat > personality > archetype ───
function insertNested(text, sourceStart, subCat, personality, archetype, lines) {
  const block = findKeyBlock(text, sourceStart, subCat);
  if (!block) {
    console.error(`[WARN] SubCat not found: ${subCat}`);
    return { changed: false, text, alreadyExists: false };
  }

  return createPersonalityBlock(text, block.start, personality, archetype, lines);
}

// ─── Deep nested: level1 > level2 > personality > archetype ───
function insertDeepNested(text, sourceStart, level1, level2, personality, archetype, lines) {
  const block1 = findKeyBlock(text, sourceStart, level1);
  if (!block1) {
    console.error(`[WARN] Level1 not found: ${level1}`);
    return { changed: false, text, alreadyExists: false };
  }

  const block2 = findKeyBlock(text, block1.start, level2);
  if (!block2) {
    console.error(`[WARN] Level2 not found: ${level2} in ${level1}`);
    return { changed: false, text, alreadyExists: false };
  }

  return createPersonalityBlock(text, block2.start, personality, archetype, lines);
}

// ─── Snapshot: key > voice/modal > personality > archetype ───
function insertSnapshot(text, sourceStart, key, voiceOrModal, personality, archetype, lines) {
  const keyBlock = findKeyBlock(text, sourceStart, key);
  if (!keyBlock) {
    console.error(`[WARN] Snapshot key not found: ${key}`);
    return { changed: false, text, alreadyExists: false };
  }

  const vBlock = findKeyBlock(text, keyBlock.start, voiceOrModal);
  if (!vBlock) {
    console.error(`[WARN] Snapshot voice/modal not found: ${voiceOrModal} in ${key}`);
    return { changed: false, text, alreadyExists: false };
  }

  return createPersonalityBlock(text, vBlock.start, personality, archetype, lines);
}

// ─── Emotion: emotion > archetype = string ───
function insertEmotion(text, sourceStart, emotion, archetype, line) {
  const emotionBlock = findKeyBlock(text, sourceStart, emotion);
  if (!emotionBlock) {
    console.error(`[WARN] Emotion not found: ${emotion}`);
    return { changed: false, text, alreadyExists: false };
  }

  const existsRe = new RegExp(`\\b${archetype}:\\s*'`);
  if (existsRe.test(emotionBlock.content)) {
    return { changed: false, text, alreadyExists: true };
  }

  const composedRe = /(\n( +))composed:\s*'/;
  const composedMatch = composedRe.exec(emotionBlock.content);
  const escapedLine = line.replace(/'/g, "\\'");

  if (composedMatch) {
    const insertPos = emotionBlock.start + composedMatch.index;
    const indent = composedMatch[2];
    const newEntry = `\n${indent}${archetype}: '${escapedLine}',`;
    const fixed = ensureTrailingComma(text, insertPos);
    const shift = fixed.length - text.length;
    return { changed: true, text: fixed.slice(0, insertPos + shift) + newEntry + fixed.slice(insertPos + shift) };
  }

  const lastClose = emotionBlock.content.lastIndexOf('}');
  if (lastClose < 0) return { changed: false, text, alreadyExists: false };

  const indentRe = /\n([ \t]+)\w+:\s*'/;
  const indentMatch = indentRe.exec(emotionBlock.content);
  const indent = indentMatch ? indentMatch[1] : '    ';

  const insertPos = emotionBlock.start + lastClose;
  const newEntry = `\n${indent}${archetype}: '${escapedLine}',\n`;
  const fixed = ensureTrailingComma(text, insertPos);
  const shift = fixed.length - text.length;
  return { changed: true, text: fixed.slice(0, insertPos + shift) + newEntry + fixed.slice(insertPos + shift) };
}

// ─── Archetype flat: archetype > [lines] ───
function insertArchetypeFlat(text, sourceStart, archetype, lines) {
  const sourceRegion = text.slice(sourceStart);
  const sourceEnd = findBlockEnd(sourceRegion);
  const sourceContent = sourceRegion.slice(0, sourceEnd);

  const archRe = new RegExp(`\\n([ \\t]*)${archetype}:\\s*\\[`);
  const archMatch = archRe.exec(sourceContent);

  if (archMatch) {
    // Archetype exists — append lines to the array
    const archStart = sourceStart + archMatch.index;
    const afterArch = text.slice(archStart);
    let depth = 0, inStr = false, strCh = '', closeBracket = -1;
    for (let i = 0; i < afterArch.length && i < 10000; i++) {
      const ch = afterArch[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === strCh) inStr = false;
        continue;
      }
      if (ch === "'" || ch === '"') { inStr = true; strCh = ch; continue; }
      if (ch === '[') depth++;
      if (ch === ']') { depth--; if (depth === 0) { closeBracket = i; break; } }
    }

    if (closeBracket < 0) return { changed: false, text, alreadyExists: false };

    const arrayContent = afterArch.slice(0, closeBracket);
    for (const line of lines) {
      const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(escaped).test(arrayContent)) {
        return { changed: false, text, alreadyExists: true };
      }
    }

    const indent = archMatch[1];
    const insertPos = archStart + closeBracket;
    const newLines = lines.map(l => `  '${l.replace(/'/g, "\\'")}'`).join(',\n' + indent);
    const fixed = ensureTrailingComma(text, insertPos);
    const shift = fixed.length - text.length;
    const newEntry = `\n${indent}  ${newLines},`;
    return { changed: true, text: fixed.slice(0, insertPos + shift) + newEntry + '\n' + indent + fixed.slice(insertPos + shift) };
  }

  // Archetype doesn't exist — create it
  const composedRe = /(\n([ \t]+))composed:\s*\[/;
  const composedMatch = composedRe.exec(sourceContent);

  if (composedMatch) {
    const insertPos = sourceStart + composedMatch.index;
    const indent = composedMatch[2];
    const newEntry = buildArrayEntry(indent, archetype, lines);
    const fixed = ensureTrailingComma(text, insertPos);
    const shift = fixed.length - text.length;
    return { changed: true, text: fixed.slice(0, insertPos + shift) + newEntry + fixed.slice(insertPos + shift) };
  }

  return { changed: false, text, alreadyExists: false };
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

const rows = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
console.log(`Loaded ${rows.length} entries from tier3b data`);

const filePatches = buildPatches(rows);

const files = {
  'data.js': DATA_PATH,
  'victory-lines.js': VICTORY_PATH,
  'ui-render.js': UI_RENDER_PATH,
};

for (const [fileName, patches] of Object.entries(filePatches)) {
  const filePath = files[fileName];
  if (!filePath) {
    console.error(`[ERROR] Unknown file: ${fileName}`);
    continue;
  }

  console.log(`\nProcessing ${fileName}...`);
  const original = fs.readFileSync(filePath, 'utf8');
  const linesBefore = original.split('\n').length;

  const result = applyFilePatches(original, patches);
  const linesAfter = result.split('\n').length;

  if (result !== original) {
    fs.writeFileSync(filePath, result, 'utf8');
    console.log(`  Written: ${linesBefore} → ${linesAfter} lines (+${linesAfter - linesBefore})`);
  } else {
    console.log(`  No changes`);
  }
}

// Verify syntax
console.log('\nVerifying syntax...');
let syntaxOk = true;
for (const [fileName, filePath] of Object.entries(files)) {
  if (!filePatches[fileName]) continue;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    new Function(content);
    console.log(`  ${fileName}: OK`);
  } catch (e) {
    console.error(`  ${fileName}: SYNTAX ERROR - ${e.message}`);
    syntaxOk = false;
  }
}

if (!syntaxOk) {
  console.error('\n[FATAL] Syntax errors detected!');
  process.exit(1);
}

console.log('\nDone!');
