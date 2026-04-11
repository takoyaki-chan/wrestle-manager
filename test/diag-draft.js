#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('draft-negotiation.js');

if (typeof Engine === 'undefined' || typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: Engine/ALL_CHARS load failed');
  process.exit(1);
}

function autoSetupShowCard(state, simRng) {
  const roster = state.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return state;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(state.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined' ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4;
  const effectiveMax = Math.min(maxMatches, 8);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }
  if (state.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(state);
    if (cd.allowed) {
      const champId = state.titles.world.championId;
      const tm = card.find(m => m.left === champId || m.right === champId);
      if (tm) tm.isTitle = true;
    }
  }
  return { ...state, showCard: card, showVenue: venueIdx };
}

function autoHandleChoiceEvent(state, simRng) {
  if (!state._pendingChoiceEvent) return state;
  const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
  if (Engine.events && typeof Engine.events.resolveChoice === 'function') {
    const result = Engine.events.resolveChoice(state, choice);
    if (result && result.state) return result.state;
  }
  const { _pendingChoiceEvent: _, ...clean } = state;
  return clean;
}

function autoHandleLargeEvent(state, simRng) {
  if (!state._pendingLargeEvent) return state;
  if (Engine.events && typeof Engine.events.resolveLargeEvent === 'function') {
    const result = Engine.events.resolveLargeEvent(state, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (result && result.state) return result.state;
  }
  const { _pendingLargeEvent: _, ...clean } = state;
  return clean;
}

function autoHandlePPVEntry(state, simRng) {
  if (state.ppvPhase !== 'entry') return state;
  const roster = state.roster.filter(c => !c.injury);
  const entries = [];
  for (const c of roster) {
    if (entries.length >= 6) break;
    if (Engine.rng.float(simRng) < 0.7) entries.push(c.id);
  }
  if (entries.length < 2) {
    for (const c of roster) {
      if (entries.length >= 2) break;
      if (!entries.includes(c.id)) entries.push(c.id);
    }
  }
  return { ...state, ppvEntries: entries };
}

function autoHandleContractNegotiation(state) {
  if (state.weekPhase !== 'contractNegotiation' || !state.pendingContractNegotiations) return state;
  let next = { ...state };
  for (const neg of next.pendingContractNegotiations) {
    const resolveRng = Engine.rng.create(
      Engine.rng.derive(next.rngSeed || 1, next.season || 1, 0xC0E7, neg.fighterId, 2)
    );
    const result = Engine.contract.resolveNegotiation(resolveRng, next, neg, 0);
    if (result && result.state) next = result.state;
  }
  return next;
}

function skipPhase(state) {
  if (state.weekPhase === 'ppvEntry') return { ...state, weekPhase: 'manage', ppvPhase: 'locked' };
  if (state.weekPhase === 'ppvShow') return { ...state, ppvPhase: 'tv' };
  if (state.weekPhase === 'ppvTV') return { ...state, ppvPhase: null };
  if (state.weekPhase === 'negotiation') {
    return { ...state, pendingContractNegotiations: null, weekPhase: state.offSeason ? 'offseason' : 'manage' };
  }
  if (state.weekPhase === 'contractNegotiation') {
    return { ...state, pendingContractNegotiations: null, weekPhase: state.offSeason ? 'offseason' : 'manage' };
  }
  if (state.weekPhase === 'juniorTournament') {
    return { ...state, weekPhase: 'manage', _juniorTournamentSelection: null };
  }
  if (state.weekPhase === 'warChallenge') return { ...state, weekPhase: 'manage', pendingWar: null };
  if (state.weekPhase === 'settled') return { ...state, weekPhase: 'manage' };
  if (state.pendingRetirements && state.pendingRetirements.length > 0) {
    return { ...state, pendingRetirements: [] };
  }
  return state;
}

function normalizeFighterForRoster(fighter) {
  return {
    ...fighter,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0, ...(fighter?.seasonGrowth || {}) },
    wins: fighter?.wins ?? 0,
    losses: fighter?.losses ?? 0,
    draws: fighter?.draws ?? 0,
    injury: fighter?.injury ?? null,
    condition: typeof fighter?.condition === 'number' ? fighter.condition : 80,
    schedule: ['balance', 'practice', 'promo', 'rest'].includes(fighter?.schedule) ? fighter.schedule : 'balance',
    intensive: !!fighter?.intensive,
    intensiveWeeks: fighter?.intensiveWeeks || 0,
    lastMatchResult: fighter?.lastMatchResult || null,
  };
}

function autoHandleScoutEvent(state, simRng) {
  if (state.weekPhase !== 'scoutEvent') return state;
  let next = {
    ...state,
    roster: [...(state.roster || [])],
    freeAgents: [...(state.freeAgents || [])],
    dormantPool: [...(state.dormantPool || [])],
    scoutCandidates: [...(state.scoutCandidates || [])],
    scoutPicks: [...(state.scoutPicks || [])],
    aiOrgs: Object.fromEntries(
      Object.entries(state.aiOrgs || {}).map(([orgId, org]) => [orgId, { ...org, roster: [...(org.roster || [])] }])
    ),
    gameLog: [...(state.gameLog || [])],
  };

  const occupiedIds = Engine.util.collectOccupiedCharacterDefIds(next);
  (next.scoutCandidates || []).forEach(c => occupiedIds.delete(c.id));
  for (const cand of next.scoutCandidates) {
    const entry = { id: cand.id, age: cand.age || 17 };
    if (!occupiedIds.has(entry.id) && !next.dormantPool.some(e => e.id === entry.id)) {
      next.dormantPool.push(entry);
      occupiedIds.add(entry.id);
    }
  }

  next.gameLog.push(`SCOUT_FINISH picks=${next.scoutPicks.length} remain=${next.scoutCandidates.length}`);
  next.scoutCandidates = null;
  next.scoutPicks = null;
  next.scoutMaxPicks = null;
  next.scoutPendingPick = null;
  next.scoutEventType = null;
  next.scoutsThisSeason = (next.scoutsThisSeason || 0) + 1;
  next.weekPhase = next.offSeason ? 'offseason' : 'manage';
  return next;
}

const TRANSIENT_KEYS = [
  '_pendingChoiceEvent',
  '_pendingNotifEvent',
  '_pendingLargeEvent',
  '_pendingTeamSpirit',
  '_pendingGrowthEvents',
  '_pendingMotivationRetirements',
  '_pendingCoachReport',
  '_flavorEvents',
  '_pendingEliteTicket',
  '_juniorTournamentSelection',
  '_juniorTournamentResult',
];

function clearTransient(state) {
  let next = state;
  for (const key of TRANSIENT_KEYS) {
    if (next[key] !== undefined) {
      next = { ...next };
      delete next[key];
    }
  }
  return next;
}

function collectSummary(state) {
  const dormant = state.dormantPool || [];
  const freeAgents = state.freeAgents || [];
  const retired = state.retiredIds || [];
  const aiTotal = Object.values(state.aiOrgs || {}).reduce((sum, org) => sum + (org.roster || []).length, 0);
  const youth = dormant.filter(e => {
    const age = e.age || 17;
    return age >= 17 && age <= 18;
  }).length;

  const allIds = new Set();
  const duplicates = [];
  const add = (id, bucket) => {
    if (allIds.has(id)) duplicates.push(`${bucket}:${id}`);
    allIds.add(id);
  };

  (state.roster || []).forEach(c => add(c.id, 'roster'));
  freeAgents.forEach(c => add(c.id, 'fa'));
  dormant.forEach(e => add(e.id, 'dormant'));
  Object.values(state.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => add(c.id, 'ai')));
  retired.forEach(id => add(id, 'retired'));

  return {
    dormant: dormant.length,
    youth,
    freeAgents: freeAgents.length,
    retired: retired.length,
    player: (state.roster || []).length,
    ai: aiTotal,
    unique: allIds.size,
    duplicates,
  };
}

const args = process.argv.slice(2);
const targetSeasons = parseInt(args[0], 10) || 20;
const userSeed = args[1] ? parseInt(args[1], 10) : 42;

console.log(`=== Draft Pool Diagnostic (${targetSeasons} seasons, seed=${userSeed}) ===`);

let state = Engine.createInitialState(userSeed, true);
state = { ...state, debugLog: state.debugLog || [] };

const simRng = Engine.rng.create(Engine.rng.derive(userSeed, 0xCC));
const seasonLogs = [];

const initial = collectSummary(state);
console.log('\n--- INITIAL STATE ---');
console.log(`  ALL_CHARS: ${ALL_CHARS.length}`);
console.log(`  Player roster: ${initial.player}`);
console.log(`  FA: ${initial.freeAgents}`);
console.log(`  dormantPool: ${initial.dormant}`);
console.log(`  dormant youth(17-18): ${initial.youth}`);
console.log(`  retiredIds: ${initial.retired}`);
console.log(`  AI rosters total: ${initial.ai}`);
console.log(`  Total unique IDs: ${initial.unique} / ${ALL_CHARS.length}`);

let maxWeeks = targetSeasons * 53;
let weekCount = 0;
let lastSeason = state.season;
let scoutEventsThisSeason = 0;

while (weekCount < maxWeeks) {
  weekCount++;

  if (state.season !== lastSeason) {
    const row = collectSummary(state);
    seasonLogs.push({
      season: state.season,
      dormant: row.dormant,
      youth: row.youth,
      fa: row.freeAgents,
      retired: row.retired,
      player: row.player,
      ai: row.ai,
      scouts: scoutEventsThisSeason,
      unique: row.unique,
      duplicates: row.duplicates.length,
    });
    console.log(
      `S${state.season}: dormant=${row.dormant}(17-18:${row.youth}), FA=${row.freeAgents}, retired=${row.retired}, ` +
      `player=${row.player}, AI=${row.ai}, unique=${row.unique}, scouts=${scoutEventsThisSeason}`
    );
    lastSeason = state.season;
    scoutEventsThisSeason = 0;
  }

  if (state.offSeason) {
    if (state.weekPhase === 'scoutEvent') {
      console.log(`  [offWeek ${state.offWeek}] scoutEvent: ${(state.scoutCandidates || []).length} candidates`);
      scoutEventsThisSeason++;
      state = autoHandleScoutEvent(state, simRng);
    }

    if (state.weekPhase === 'contractNegotiation') {
      state = autoHandleContractNegotiation(state);
    }
  } else if (state.weekPhase === 'scoutEvent') {
    console.log(`  [week ${state.week}] scoutEvent: ${(state.scoutCandidates || []).length} candidates`);
    scoutEventsThisSeason++;
    state = autoHandleScoutEvent(state, simRng);
  }

  state = autoHandleChoiceEvent(state, simRng);
  state = autoHandleLargeEvent(state, simRng);
  state = autoHandlePPVEntry(state, simRng);
  state = clearTransient(state);
  state = skipPhase(state);

  if (!state.offSeason && Engine.util.isShowWeek(state.week) && state.weekPhase === 'manage') {
    state = autoSetupShowCard(state, simRng);
    if (state.showCard && state.showCard.length > 0) {
      const showResult = Engine.executeShow(state);
      if (showResult && showResult.state) state = showResult.state;
    }
  }

  try {
    const tick = Engine.tickWeek(state);
    if (!tick || !tick.state) break;
    state = { ...tick.state, gameLog: [] };
    state = clearTransient(state);
    state = skipPhase(state);

    const adv = Engine.advanceWeek(state);
    if (!adv || !adv.state) break;
    state = { ...adv.state, gameLog: [] };
    state = clearTransient(state);
  } catch (e) {
    console.error(`CRASH at S${state.season} W${state.week}: ${e.message}`);
    process.exitCode = 1;
    break;
  }

  if (state.debugLog && state.debugLog.length > 0) {
    for (const msg of state.debugLog) {
      if (typeof msg === 'string' && msg.includes('[VIOLATION]')) {
        console.error(`  VIOLATION S${state.season}W${state.week}: ${msg}`);
      }
    }
    state = { ...state, debugLog: [] };
  }
}

console.log('\n=== SUMMARY ===');
console.log('Season | dormant | d(17-18) | FA | retired | player | AI | unique | dup | scouts');
console.log('-------|---------|----------|----|---------|--------|----|--------|-----|-------');
for (const log of seasonLogs) {
  console.log(
    `  S${String(log.season).padStart(3)} |${String(log.dormant).padStart(8)} |${String(log.youth).padStart(9)} |` +
    `${String(log.fa).padStart(3)} |${String(log.retired).padStart(8)} |${String(log.player).padStart(7)} |` +
    `${String(log.ai).padStart(3)} |${String(log.unique).padStart(7)} |${String(log.duplicates).padStart(4)} |` +
    `${String(log.scouts).padStart(6)}`
  );
}

const finalRow = collectSummary(state);
console.log(`\nTotal unique IDs in system: ${finalRow.unique} / ${ALL_CHARS.length}`);
if (finalRow.duplicates.length > 0) {
  console.log(`DUPLICATES FOUND: ${finalRow.duplicates.join(', ')}`);
}
console.log(
  `Final S${state.season}: dormant=${finalRow.dormant}, youth=${finalRow.youth}, ` +
  `FA=${finalRow.freeAgents}, retired=${finalRow.retired}, player=${finalRow.player}, AI=${finalRow.ai}`
);

let failed = false;
if (finalRow.unique !== ALL_CHARS.length) {
  console.error(`FAIL: unique ids mismatch (${finalRow.unique}/${ALL_CHARS.length})`);
  failed = true;
}
if (finalRow.duplicates.length > 0) {
  console.error(`FAIL: duplicate ids found (${finalRow.duplicates.length})`);
  failed = true;
}
if (finalRow.youth === 0) {
  console.error('FAIL: dormant youth pool collapsed to zero');
  failed = true;
}
if (finalRow.dormant < 10) {
  console.error(`FAIL: dormantPool too small (${finalRow.dormant})`);
  failed = true;
}
if (failed) process.exit(1);
console.log('PASS: draft pool circulation looks healthy');
