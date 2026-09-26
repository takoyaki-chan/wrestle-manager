#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const LZString = require('lz-string');

global.window = { IS_TRIAL: false };

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const SAVE_COMPRESS_MARKER = 'WM_LZ|';
const DEFAULT_FA_MIN = 3;
const DEFAULT_DORMANT_MIN = 20;
const DEFAULT_YOUTH_MIN = 12;

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(SRC_DIR, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js[^\n]*\s[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

function loadGameContext() {
  loadAsGlobal('victory-lines.js');
  loadAsGlobal('data.js');
  loadAsGlobal('management.js');
  loadAsGlobal('match-engine.js');
  loadAsGlobal('relationships.js');
  loadAsGlobal('draft-negotiation.js');
}

function parseArgs(argv) {
  const opts = {
    repair: false,
    dryRun: false,
    json: false,
    output: null,
    backup: true,
    input: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--repair') opts.repair = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--no-backup') opts.backup = false;
    else if (arg === '--output' || arg === '-o') opts.output = argv[++i];
    else if (!opts.input) opts.input = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!opts.input) {
    throw new Error(
      'Usage: node tools/save-doctor.js <save-file> [--repair] [--dry-run] [--output <file>] [--json] [--no-backup]'
    );
  }
  return opts;
}

function readSaveFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    return { state: JSON.parse(trimmed), raw, compressed: false };
  }
  if (raw.startsWith(SAVE_COMPRESS_MARKER) || raw.startsWith('WM_LZ\x00')) {
    const markerLen = raw.startsWith(SAVE_COMPRESS_MARKER) ? SAVE_COMPRESS_MARKER.length : 6;
    const json = LZString.decompressFromUTF16(raw.slice(markerLen));
    if (!json) throw new Error('Could not decompress save data');
    return { state: JSON.parse(json), raw, compressed: true };
  }
  throw new Error('Unsupported save format. Expected plain JSON or WM_LZ compressed text.');
}

function serializeSave(state, compressed) {
  const json = JSON.stringify(state);
  if (!compressed) return json;
  return SAVE_COMPRESS_MARKER + LZString.compressToUTF16(json);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getAllCharIds() {
  return new Set((global.ALL_CHARS || []).map(c => c.id));
}

function normalizeDormantEntry(entry) {
  if (entry == null) return null;
  if (typeof entry === 'number' || typeof entry === 'string') {
    const id = Number(entry);
    if (!Number.isFinite(id)) return null;
    return { id, age: 17 };
  }
  const id = Number(entry.id);
  if (!Number.isFinite(id)) return null;
  const age = Math.max(17, Math.min(21, Math.round(entry.age || 17)));
  return { id, age };
}

function makeBucketMap(state) {
  const buckets = [];
  buckets.push({ name: 'roster', items: ensureArray(state.roster), getId: c => c && c.id });
  Object.entries(state.aiOrgs || {}).forEach(([orgId, org]) => {
    buckets.push({ name: `ai:${orgId}`, items: ensureArray(org && org.roster), getId: c => c && c.id });
  });
  buckets.push({ name: 'freeAgents', items: ensureArray(state.freeAgents), getId: c => c && c.id });
  buckets.push({ name: 'scoutCandidates', items: ensureArray(state.scoutCandidates), getId: c => c && c.id });
  buckets.push({ name: 'dormantPool', items: ensureArray(state.dormantPool), getId: c => c && c.id });
  buckets.push({ name: 'retiredIds', items: ensureArray(state.retiredIds), getId: c => c });
  return buckets;
}

function summarizeState(state) {
  const pool = ensureArray(state.dormantPool);
  const fa = ensureArray(state.freeAgents);
  const roster = ensureArray(state.roster);
  const aiTotal = Object.values(state.aiOrgs || {}).reduce((sum, org) => sum + ensureArray(org && org.roster).length, 0);
  const youthCount = pool.filter(e => {
    const age = (e && e.age) || 17;
    return age >= 17 && age <= 18;
  }).length;
  return {
    season: state.season || 1,
    week: state.week || 1,
    roster: roster.length,
    aiTotal,
    freeAgents: fa.length,
    dormantPool: pool.length,
    dormantYouth: youthCount,
    retiredIds: ensureArray(state.retiredIds).length,
  };
}

function collectUniverse(state) {
  const universe = getAllCharIds();
  const placements = new Map();
  const duplicates = [];

  for (const bucket of makeBucketMap(state)) {
    for (const item of bucket.items) {
      const id = bucket.getId(item);
      if (!Number.isFinite(Number(id))) continue;
      const intId = Number(id);
      if (!universe.has(intId)) continue;
      const existing = placements.get(intId);
      if (existing) duplicates.push({ id: intId, first: existing, second: bucket.name });
      else placements.set(intId, bucket.name);
    }
  }

  const missing = [...universe].filter(id => !placements.has(id)).sort((a, b) => a - b);
  return { duplicates, missing, placements };
}

function diagnoseState(state) {
  const summary = summarizeState(state);
  const { duplicates, missing } = collectUniverse(state);
  const pool = ensureArray(state.dormantPool).map(normalizeDormantEntry).filter(Boolean);
  const retiredIds = ensureArray(state.retiredIds).map(Number).filter(Number.isFinite);
  const retiredSeasons = state.retiredSeasons || {};
  const missingRetiredSeasons = retiredIds.filter(id => retiredSeasons[id] === undefined);
  const youthCount = pool.filter(e => e.age >= 17 && e.age <= 18).length;
  const issues = [];

  if (duplicates.length > 0) issues.push(`duplicate IDs: ${duplicates.length}`);
  if (missing.length > 0) issues.push(`missing IDs: ${missing.length}`);
  if (missingRetiredSeasons.length > 0) issues.push(`retiredSeasons missing: ${missingRetiredSeasons.length}`);
  if (summary.freeAgents < DEFAULT_FA_MIN) issues.push(`freeAgents low: ${summary.freeAgents}`);
  if (summary.dormantPool < DEFAULT_DORMANT_MIN) issues.push(`dormantPool low: ${summary.dormantPool}`);
  if (youthCount < DEFAULT_YOUTH_MIN) issues.push(`dormant youth low: ${youthCount}`);

  return {
    summary,
    duplicates,
    missing,
    missingRetiredSeasons,
    issues,
  };
}

// K-4 S7(docs/fun-audit-v0.1/k4-separate-lives-design.md §7): 修復はゲーム本体のロード時修復
// Engine.saveDoctor.repairOnLoad に一本化した。以前はここに独自の再投入(休眠プールへの補充・非常時は
// クールダウン無視)を持っていて、ゲーム本体と規則がずれていた(注目の人生の休み・転生の関所・人生番号の移行)。
// 使い方(docs/SAVE-DOCTOR-使い方.txt の BAT 経由の手順)は変わらない。
function repairState(inputState) {
  const rep = Engine.saveDoctor.repairOnLoad(clone(inputState));
  return { state: rep.state, changes: rep.changes.slice(), diagnosis: diagnoseState(rep.state), severe: !!rep.severe };
}

function printDiagnosis(title, diagnosis) {
  const s = diagnosis.summary;
  console.log(title);
  console.log(`  season/week: S${s.season} W${s.week}`);
  console.log(`  roster: ${s.roster} | ai: ${s.aiTotal} | FA: ${s.freeAgents} | dormant: ${s.dormantPool} | dormant(17-18): ${s.dormantYouth} | retiredIds: ${s.retiredIds}`);
  console.log(`  issues: ${diagnosis.issues.length > 0 ? diagnosis.issues.join(', ') : 'none'}`);
  if (diagnosis.duplicates.length > 0) {
    const sample = diagnosis.duplicates.slice(0, 8).map(d => `${d.id}(${d.first}->${d.second})`).join(', ');
    console.log(`  duplicate sample: ${sample}${diagnosis.duplicates.length > 8 ? ' ...' : ''}`);
  }
  if (diagnosis.missing.length > 0) {
    const sample = diagnosis.missing.slice(0, 12).join(', ');
    console.log(`  missing IDs: ${sample}${diagnosis.missing.length > 12 ? ' ...' : ''}`);
  }
  if (diagnosis.missingRetiredSeasons.length > 0) {
    const sample = diagnosis.missingRetiredSeasons.slice(0, 12).join(', ');
    console.log(`  retiredSeasons missing: ${sample}${diagnosis.missingRetiredSeasons.length > 12 ? ' ...' : ''}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  loadGameContext();

  const inputPath = path.resolve(opts.input);
  const loaded = readSaveFile(inputPath);
  const before = diagnoseState(loaded.state);
  printDiagnosis('Before', before);

  if (!opts.repair) return;

  const repaired = repairState(loaded.state);
  console.log('Repair actions');
  if (repaired.changes.length === 0) console.log('  no changes');
  else repaired.changes.forEach(line => console.log(`  - ${line}`));
  printDiagnosis('After', repaired.diagnosis);

  if (opts.dryRun) return;

  const outputPath = path.resolve(opts.output || inputPath);
  if (!opts.output && opts.backup) {
    const backupPath = `${inputPath}.bak.${Date.now()}`;
    fs.copyFileSync(inputPath, backupPath);
    console.log(`Backup written: ${backupPath}`);
  }

  const payload = serializeSave(repaired.state, loaded.compressed && !opts.json);
  fs.writeFileSync(outputPath, payload, 'utf-8');
  console.log(`Saved repaired file: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`save-doctor failed: ${error.message}`);
  process.exit(1);
}
