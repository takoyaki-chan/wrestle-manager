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
const RETIRED_COOLDOWN = 5;

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

function getTemplateById(id) {
  return (global.ALL_CHARS || []).find(c => c.id === id) || null;
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

function dedupeById(list, getId) {
  const seen = new Set();
  const result = [];
  const removed = [];
  for (const item of ensureArray(list)) {
    const id = Number(getId(item));
    if (!Number.isFinite(id)) continue;
    if (seen.has(id)) {
      removed.push(id);
      continue;
    }
    seen.add(id);
    result.push(item);
  }
  return { result, removed };
}

function normalizeFighterForFA(fighter) {
  return {
    ...fighter,
    orgId: null,
    condition: fighter.condition ?? 80,
    schedule: fighter.schedule || 'balance',
    wins: fighter.wins || 0,
    losses: fighter.losses || 0,
    draws: fighter.draws || 0,
    injury: fighter.injury || null,
    seasonGrowth: fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false,
    intensiveWeeks: 0,
  };
}

function createFAFromDormant(state, entries, rngSalt) {
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 1, state.season || 1, state.week || 1, rngSalt));
  return entries
    .map(entry => {
      const template = getTemplateById(entry.id);
      if (!template) return null;
      return normalizeFighterForFA(Engine.rival.makeAIFighter(template, rng, null, entry.age || 19));
    })
    .filter(Boolean);
}

function repairState(inputState) {
  const state = clone(inputState);
  const changes = [];
  const baselineSeason = Math.max(1, (state.season || 1) - 10);

  state.roster = ensureArray(state.roster);
  state.freeAgents = ensureArray(state.freeAgents);
  state.scoutCandidates = ensureArray(state.scoutCandidates);
  state.dormantPool = ensureArray(state.dormantPool).map(normalizeDormantEntry).filter(Boolean);
  state.retiredIds = ensureArray(state.retiredIds).map(Number).filter(Number.isFinite);
  state.retiredFighters = ensureArray(state.retiredFighters);
  state.retiredSeasons = { ...(state.retiredSeasons || {}) };
  state.aiOrgs = state.aiOrgs || {};
  for (const orgId of Object.keys(state.aiOrgs)) {
    state.aiOrgs[orgId] = { ...state.aiOrgs[orgId], roster: ensureArray(state.aiOrgs[orgId].roster) };
  }

  const rosterDeduped = dedupeById(state.roster, c => c && c.id);
  if (rosterDeduped.removed.length > 0) changes.push(`Removed ${rosterDeduped.removed.length} duplicate roster entries`);
  state.roster = rosterDeduped.result;

  for (const [orgId, org] of Object.entries(state.aiOrgs)) {
    const deduped = dedupeById(org.roster, c => c && c.id);
    if (deduped.removed.length > 0) changes.push(`Removed ${deduped.removed.length} duplicate AI entries from ${orgId}`);
    state.aiOrgs[orgId] = { ...org, roster: deduped.result };
  }

  const occupied = new Set();
  const claim = (id, bucket) => {
    if (!Number.isFinite(id)) return false;
    if (occupied.has(id)) return false;
    occupied.add(id);
    return true;
  };

  state.roster = state.roster.filter(c => claim(Number(c.id), 'roster'));
  for (const orgId of Object.keys(state.aiOrgs)) {
    state.aiOrgs[orgId].roster = state.aiOrgs[orgId].roster.filter(c => claim(Number(c.id), `ai:${orgId}`));
  }

  const prevFA = state.freeAgents.length;
  state.freeAgents = state.freeAgents.filter(c => claim(Number(c.id), 'freeAgents'));
  if (state.freeAgents.length !== prevFA) changes.push(`Removed ${prevFA - state.freeAgents.length} conflicting freeAgents`);

  const prevScout = state.scoutCandidates.length;
  state.scoutCandidates = state.scoutCandidates.filter(c => claim(Number(c.id), 'scoutCandidates'));
  if (state.scoutCandidates.length !== prevScout) changes.push(`Removed ${prevScout - state.scoutCandidates.length} conflicting scoutCandidates`);

  const prevDormant = state.dormantPool.length;
  state.dormantPool = state.dormantPool.filter(entry => claim(Number(entry.id), 'dormantPool'));
  if (state.dormantPool.length !== prevDormant) changes.push(`Removed ${prevDormant - state.dormantPool.length} conflicting dormantPool entries`);

  const retiredFromFighters = state.retiredFighters
    .map(f => Number(f && f.id))
    .filter(Number.isFinite);
  for (const id of retiredFromFighters) {
    if (!state.retiredIds.includes(id) && !occupied.has(id)) {
      state.retiredIds.push(id);
      changes.push(`Added retiredFighter ${id} to retiredIds`);
    }
  }

  const prevRetired = state.retiredIds.length;
  state.retiredIds = dedupeById(state.retiredIds, id => id).result.filter(id => !occupied.has(id));
  if (state.retiredIds.length !== prevRetired) changes.push(`Removed ${prevRetired - state.retiredIds.length} conflicting retiredIds`);

  for (const id of state.retiredIds) {
    if (state.retiredSeasons[id] === undefined) {
      state.retiredSeasons[id] = baselineSeason;
    }
  }

  const allCharIds = getAllCharIds();
  const activeOrCooldown = new Set([
    ...state.roster.map(c => Number(c.id)),
    ...Object.values(state.aiOrgs).flatMap(org => ensureArray(org.roster).map(c => Number(c.id))),
    ...state.freeAgents.map(c => Number(c.id)),
    ...state.scoutCandidates.map(c => Number(c.id)),
    ...state.dormantPool.map(e => Number(e.id)),
    ...state.retiredIds.map(Number),
  ].filter(Number.isFinite));

  const missingIds = [...allCharIds].filter(id => !activeOrCooldown.has(id)).sort((a, b) => a - b);
  if (missingIds.length > 0) {
    for (const id of missingIds) {
      state.retiredIds.push(id);
      state.retiredSeasons[id] = baselineSeason;
    }
    changes.push(`Recovered ${missingIds.length} missing IDs into retired cooldown`);
  }

  const cooldownEligible = () => {
    const blocked = new Set([
      ...state.roster.map(c => Number(c.id)),
      ...Object.values(state.aiOrgs).flatMap(org => ensureArray(org.roster).map(c => Number(c.id))),
      ...state.freeAgents.map(c => Number(c.id)),
      ...state.scoutCandidates.map(c => Number(c.id)),
      ...state.dormantPool.map(e => Number(e.id)),
    ].filter(Number.isFinite));

    return state.retiredIds
      .filter(id => !blocked.has(id))
      .filter(id => state.retiredSeasons[id] !== undefined && (state.season || 1) - state.retiredSeasons[id] >= RETIRED_COOLDOWN)
      .sort((a, b) => (state.retiredSeasons[a] || 0) - (state.retiredSeasons[b] || 0));
  };

  const emergencyEligible = () => {
    const blocked = new Set([
      ...state.roster.map(c => Number(c.id)),
      ...Object.values(state.aiOrgs).flatMap(org => ensureArray(org.roster).map(c => Number(c.id))),
      ...state.freeAgents.map(c => Number(c.id)),
      ...state.scoutCandidates.map(c => Number(c.id)),
      ...state.dormantPool.map(e => Number(e.id)),
    ].filter(Number.isFinite));

    return state.retiredIds
      .filter(id => !blocked.has(id))
      .sort((a, b) => (state.retiredSeasons[a] || 0) - (state.retiredSeasons[b] || 0));
  };

  const addDormantEntries = (ids, age) => {
    for (const id of ids) {
      if (state.dormantPool.some(e => e.id === id)) continue;
      state.dormantPool.push({ id, age });
      state.retiredIds = state.retiredIds.filter(rid => rid !== id);
      delete state.retiredSeasons[id];
    }
  };

  const youthCount = () => state.dormantPool.filter(e => e.age >= 17 && e.age <= 18).length;

  if (youthCount() < DEFAULT_YOUTH_MIN) {
    const needed = DEFAULT_YOUTH_MIN - youthCount();
    let returnees = cooldownEligible().slice(0, needed);
    if (returnees.length < needed) {
      const extra = emergencyEligible()
        .filter(id => !returnees.includes(id))
        .slice(0, needed - returnees.length);
      returnees = [...returnees, ...extra];
    }
    addDormantEntries(returnees, 17);
    if (returnees.length > 0) changes.push(`Recycled ${returnees.length} retired IDs into dormant youth pool`);
  }

  if (state.dormantPool.length < DEFAULT_DORMANT_MIN) {
    const needed = DEFAULT_DORMANT_MIN - state.dormantPool.length;
    let returnees = cooldownEligible().slice(0, needed);
    if (returnees.length < needed) {
      const extra = emergencyEligible()
        .filter(id => !returnees.includes(id))
        .slice(0, needed - returnees.length);
      returnees = [...returnees, ...extra];
    }
    addDormantEntries(returnees, 19);
    if (returnees.length > 0) changes.push(`Recycled ${returnees.length} retired IDs into dormant pool`);
  }

  const dormantAges = [17, 18, 19, 20];
  const untrackedIds = [...allCharIds].filter(id => {
    return !state.roster.some(c => c.id === id)
      && !Object.values(state.aiOrgs).some(org => ensureArray(org.roster).some(c => c.id === id))
      && !state.freeAgents.some(c => c.id === id)
      && !state.scoutCandidates.some(c => c.id === id)
      && !state.dormantPool.some(e => e.id === id)
      && !state.retiredIds.includes(id);
  });
  if (untrackedIds.length > 0) {
    untrackedIds.forEach((id, idx) => {
      state.dormantPool.push({ id, age: dormantAges[idx % dormantAges.length] });
    });
    changes.push(`Recovered ${untrackedIds.length} fully untracked IDs into dormant pool`);
  }

  if (state.freeAgents.length < DEFAULT_FA_MIN) {
    const needed = DEFAULT_FA_MIN - state.freeAgents.length;
    const candidates = [...state.dormantPool]
      .filter(e => e.age >= 19 && e.age <= 20)
      .slice(0, needed);
    if (candidates.length < needed) {
      const fallback = state.dormantPool
        .filter(e => e.age < 21 && !candidates.some(c => c.id === e.id))
        .slice(0, needed - candidates.length);
      candidates.push(...fallback);
    }
    if (candidates.length > 0) {
      const created = createFAFromDormant(state, candidates, 0x5A0E);
      const createdIds = new Set(created.map(f => f.id));
      state.freeAgents.push(...created);
      state.dormantPool = state.dormantPool.filter(e => !createdIds.has(e.id));
      changes.push(`Restored ${created.length} freeAgents from dormant pool`);
    }
  }

  if (state.dormantPool.length < DEFAULT_DORMANT_MIN) {
    const needed = DEFAULT_DORMANT_MIN - state.dormantPool.length;
    const returnees = emergencyEligible().slice(0, needed);
    addDormantEntries(returnees, 19);
    if (returnees.length > 0) changes.push(`Topped off dormant pool with ${returnees.length} retired IDs after FA restore`);
  }

  const post = diagnoseState(state);
  return { state, changes, diagnosis: post };
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
