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
  throw new Error('Engine or ALL_CHARS failed to load');
}

function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  G = { ...G, debugLog: G.debugLog || [] };
  return G;
}

function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;

  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined'
    ? (VENUES[venueIdx] || VENUES[0]).maxMatches
    : 4;
  const isSpecial = G.week % 12 === 0;
  const effectiveMax = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);

  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }

  if (G.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(G);
    if (cd.allowed) {
      const champId = G.titles.world.championId;
      const titleMatch = card.find(m => m.left === champId || m.right === champId);
      if (titleMatch) titleMatch.isTitle = true;
    }
  }

  return { ...G, showCard: card, showVenue: venueIdx };
}

function autoHandleChoiceEvent(G, simRng) {
  if (!G._pendingChoiceEvent) return G;
  const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveChoice === 'function') {
    const result = Engine.events.resolveChoice(G, choice);
    if (result && result.state) return result.state;
  }
  const { _pendingChoiceEvent: _, ...clean } = G;
  return clean;
}

function autoHandleLargeEvent(G, simRng) {
  if (!G._pendingLargeEvent) return G;
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveLargeEvent === 'function') {
    const result = Engine.events.resolveLargeEvent(G, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (result && result.state) return result.state;
  }
  const { _pendingLargeEvent: _, ...clean } = G;
  return clean;
}

function autoHandleContractNegotiation(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  const negotiations = G.pendingContractNegotiations || [];
  let state = { ...G };
  for (const neg of negotiations) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    if (neg.attitude === 'sudden_departure') {
      const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, 0);
      state = result.state;
      continue;
    }
    const roll = Engine.rng.float(simRng);
    let choiceIdx;
    let subChoice;
    if (neg.attitude === 'raise') {
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      if (roll < 0.6) choiceIdx = 0;
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else choiceIdx = 2;
    }
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = result.state;
    if (result.result.escalated) {
      const escNeg = { ...neg, attitude: 'transfer' };
      const escResult = Engine.contract.resolveNegotiation(resolveRng, state, escNeg, 0);
      state = escResult.state;
    }
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
}

function autoHandleScoutEvent(G) {
  if (G.weekPhase !== 'scoutEvent') return G;
  const candidates = G.scoutCandidates || [];
  if (candidates.length === 0) return G;

  const maxPicks = G.scoutMaxPicks || 4;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  const rosterCap = G.rosterCap || 16;
  let playerPicks = 0;

  const playerFn = (_candidateId, round, currentBid) => {
    if (playerPicks >= maxPicks) return 'drop';
    if (ownCount + playerPicks >= rosterCap) return 'drop';
    if (currentBid > G.funds * 0.4) return 'drop';
    if (round > 8) return 'drop';
    playerPicks++;
    return 'standard';
  };

  const draftRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xDFA0));
  const draftResult = Engine.draftNegotiation.runFullDraft(candidates, G, playerFn, draftRng);

  let newRoster = [...G.roster];
  let newFunds = G.funds;
  let newAiOrgs = {};
  Object.keys(G.aiOrgs || {}).forEach(k => {
    newAiOrgs[k] = { ...G.aiOrgs[k], roster: [...(G.aiOrgs[k]?.roster || [])] };
  });
  let newFA = [...(G.freeAgents || [])];
  let newDormant = [...(G.dormantPool || [])];

  const normFighter = (f) => ({
    ...f,
    condition: f.condition ?? 80,
    schedule: f.schedule || 'balance',
    wins: f.wins || 0,
    losses: f.losses || 0,
    draws: f.draws || 0,
    injury: null,
    seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false,
    intensiveWeeks: 0,
  });

  for (const r of draftResult.results) {
    const clean = { ...r.candidate };
    delete clean._notion;
    delete clean._estimate;
    delete clean._isSeed;
    delete clean._hasCompetition;

    if (r.winner === 'player') {
      if (newFunds >= r.finalBid && newRoster.filter(c => !c.isRental).length < rosterCap) {
        newRoster.push(normFighter(clean));
        newFunds -= r.finalBid;
      } else {
        newFA.push(normFighter(clean));
      }
    } else if (r.winner && r.winner !== 'player') {
      const orgData = newAiOrgs[r.winner];
      if (orgData) {
        const recruited = normFighter({ ...clean, orgId: r.winner });
        Engine.rival.pushUniqueFighter(orgData.roster, recruited);
      }
    } else {
      newFA.push(normFighter(clean));
    }
  }

  for (const ev of draftResult.empressReinforceEvents) {
    if (ev.type === 'empressReinforce' && ev.fighter) {
      const orgData = newAiOrgs[DRAFT_EMPRESS_SAFETY.orgId];
      if (orgData) {
        Engine.rival.pushUniqueFighter(orgData.roster, normFighter(ev.fighter));
        newDormant = newDormant.filter(e => e.id !== ev.dormantIdRemoved);
      }
    }
  }

  return {
    ...G,
    roster: newRoster,
    funds: newFunds,
    aiOrgs: newAiOrgs,
    freeAgents: newFA,
    dormantPool: newDormant,
    scoutCandidates: null,
    scoutPicks: null,
  };
}

const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
  '_juniorTournamentSelection', '_juniorTournamentResult',
];

function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) {
      const { [k]: _, ...clean } = s;
      s = clean;
    }
  }
  return s;
}

function collectViolations(G, violations) {
  if (G.debugLog && G.debugLog.length > 0) {
    G.debugLog.forEach(entry => {
      if (entry.type === 'invariant_violation') {
        violations.push({ season: entry.season, week: entry.week, message: entry.message });
      }
    });
    return { ...G, debugLog: [] };
  }
  return G;
}

function getEligibleDormantCount(G) {
  return (G.dormantPool || []).filter(e => (e?.age || 17) < 21).length;
}

function getAllActiveIds(G) {
  const ids = new Set();
  (G.roster || []).forEach(c => ids.add(c.id));
  Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => ids.add(c.id)));
  (G.freeAgents || []).forEach(c => ids.add(c.id));
  return ids;
}

function collectWeeklyMetrics(G, metrics) {
  const aiSizes = Object.fromEntries(
    Object.entries(G.aiOrgs || {}).map(([orgId, org]) => [orgId, (org.roster || []).length])
  );
  const playerHealthy = (G.roster || []).filter(c => !c.injury && (c.condition || 0) >= 40).length;
  const faCount = (G.freeAgents || []).length;
  const eligibleDormant = getEligibleDormantCount(G);
  const activeCount = getAllActiveIds(G).size;
  const retiredCooldownCount = (G.retiredIds || []).length;
  const totalSupply = activeCount + (G.dormantPool || []).length + retiredCooldownCount;

  metrics.weekCount++;
  metrics.fa.min = Math.min(metrics.fa.min, faCount);
  metrics.fa.max = Math.max(metrics.fa.max, faCount);
  metrics.fa.sum += faCount;
  metrics.eligibleDormant.min = Math.min(metrics.eligibleDormant.min, eligibleDormant);
  metrics.eligibleDormant.max = Math.max(metrics.eligibleDormant.max, eligibleDormant);
  metrics.eligibleDormant.sum += eligibleDormant;
  metrics.playerHealthy.min = Math.min(metrics.playerHealthy.min, playerHealthy);
  metrics.activeCount.min = Math.min(metrics.activeCount.min, activeCount);
  metrics.activeCount.max = Math.max(metrics.activeCount.max, activeCount);
  metrics.activeCount.sum += activeCount;
  metrics.totalSupply.min = Math.min(metrics.totalSupply.min, totalSupply);
  metrics.totalSupply.max = Math.max(metrics.totalSupply.max, totalSupply);

  if (faCount === 0) metrics.zeroFAWeeks++;
  if (eligibleDormant < 3) metrics.lowDormantWeeks++;
  if (eligibleDormant < 10) metrics.tightDormantWeeks++;

  Object.entries(aiSizes).forEach(([orgId, size]) => {
    if (!(orgId in metrics.aiMinSize)) metrics.aiMinSize[orgId] = size;
    metrics.aiMinSize[orgId] = Math.min(metrics.aiMinSize[orgId], size);
    if (size <= 5) metrics.aiAtFloorWeeks[orgId] = (metrics.aiAtFloorWeeks[orgId] || 0) + 1;
  });

  const activeIds = getAllActiveIds(G);
  const dormantIds = new Set((G.dormantPool || []).map(e => e.id));
  activeIds.forEach(id => {
    const retiredSeason = metrics.retiredAtSeason[id];
    if (retiredSeason == null) return;
    const gap = G.season - retiredSeason;
    if (gap < metrics.minRetireReturnGap) metrics.minRetireReturnGap = gap;
    if (gap < 5) metrics.earlyRetireReturns.push({ id, season: G.season, retiredSeason: retiredSeason, gap });
  });
  dormantIds.forEach(id => {
    const retiredSeason = metrics.retiredAtSeason[id];
    if (retiredSeason == null) return;
    const gap = G.season - retiredSeason;
    if (gap < metrics.minRetireReturnGap) metrics.minRetireReturnGap = gap;
    if (gap < 5) metrics.earlyRetireReturns.push({ id, season: G.season, retiredSeason: retiredSeason, gap, pool: true });
  });
}

function collectSeasonSnapshot(G, metrics) {
  const aiRosterCount = Object.values(G.aiOrgs || {}).reduce((sum, org) => sum + (org.roster || []).length, 0);
  const eligibleDormant = getEligibleDormantCount(G);
  metrics.seasonSnapshots.push({
    season: G.season,
    playerRoster: (G.roster || []).filter(c => !c.isRental).length,
    aiRoster: aiRosterCount,
    freeAgents: (G.freeAgents || []).length,
    dormantPool: (G.dormantPool || []).length,
    eligibleDormant,
    retiredCooldown: (G.retiredIds || []).length,
    totalUniverse: getAllActiveIds(G).size + (G.dormantPool || []).length + (G.retiredIds || []).length,
  });
}

function runAnalysis(seed, seasons) {
  const violations = [];
  let G = initGame(seed);
  let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  let completed = 0;
  let iter = 0;
  const MAX_ITER = seasons * 60;
  const metrics = {
    seed,
    seasonsRequested: seasons,
    weekCount: 0,
    zeroFAWeeks: 0,
    lowDormantWeeks: 0,
    tightDormantWeeks: 0,
    fa: { min: Infinity, max: 0, sum: 0 },
    eligibleDormant: { min: Infinity, max: 0, sum: 0 },
    playerHealthy: { min: Infinity },
    activeCount: { min: Infinity, max: 0, sum: 0 },
    totalSupply: { min: Infinity, max: 0 },
    aiMinSize: {},
    aiAtFloorWeeks: {},
    retiredAtSeason: {},
    earlyRetireReturns: [],
    minRetireReturnGap: Infinity,
    seasonSnapshots: [],
    initial: {
      allChars: ALL_CHARS.length,
      playerRoster: (G.roster || []).length,
      aiRoster: Object.values(G.aiOrgs || {}).reduce((sum, org) => sum + (org.roster || []).length, 0),
      freeAgents: (G.freeAgents || []).length,
      dormantPool: (G.dormantPool || []).length,
      retiredCooldown: (G.retiredIds || []).length,
    },
  };

  collectWeeklyMetrics(G, metrics);
  collectSeasonSnapshot(G, metrics);

  while (completed < seasons && iter < MAX_ITER) {
    iter++;

    if (G.weekPhase === 'gameover') {
      throw new Error(`Unexpected gameover at season ${G.season}, week ${G.week}`);
    }

    if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
    if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
    if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
    if (G.weekPhase === 'juniorTournament') {
      const sel = G._juniorTournamentSelection;
      if (sel && !sel.cancelled) {
        const jtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
        const jtResult = Engine.juniorTournament.run(G, sel.participants, jtRng);
        const applied = Engine.juniorTournament.apply(G, jtResult);
        G = { ...applied.state, weekPhase: 'manage' };
      } else {
        G = { ...G, weekPhase: 'manage' };
      }
      delete G._juniorTournamentSelection;
    }

    if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G);
    if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

    if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
      G = autoSetupShowCard(G, simRng);
      if (G.showCard && G.showCard.length > 0) {
        const showResult = Engine.executeShow(G);
        if (showResult && !showResult.error) G = showResult.state;
      }
    }

    G = autoHandleChoiceEvent(G, simRng);
    G = autoHandleLargeEvent(G, simRng);
    G = clearTransients(G);

    const tickResult = Engine.tickWeek(G);
    G = { ...tickResult.state, gameLog: [] };
    G = clearTransients(G);
    G = collectViolations(G, violations);

    const beforeAdvanceSeason = G.season;
    const beforeRetiredIds = new Set(G.retiredIds || []);

    const advResult = Engine.advanceWeek(G);
    G = { ...advResult.state, gameLog: [] };

    const afterRetiredIds = new Set(G.retiredIds || []);
    afterRetiredIds.forEach(id => {
      if (!beforeRetiredIds.has(id) && metrics.retiredAtSeason[id] == null) {
        metrics.retiredAtSeason[id] = beforeAdvanceSeason;
      }
    });

    G = Engine.validateGameState(G);
    G = collectViolations(G, violations);
    collectWeeklyMetrics(G, metrics);

    if (!G.offSeason && G.week === 1 && G.season > beforeAdvanceSeason) {
      completed++;
      collectSeasonSnapshot(G, metrics);
    }
  }

  metrics.completedSeasons = completed;
  metrics.violations = violations;
  return metrics;
}

function formatPct(part, whole) {
  if (!whole) return '0.0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

const args = process.argv.slice(2);
const seasons = parseInt(args[0], 10) || 100;
const seed = parseInt(args[1], 10) || 42;

const startedAt = Date.now();
const metrics = runAnalysis(seed, seasons);
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

const avgFA = metrics.fa.sum / metrics.weekCount;
const avgEligibleDormant = metrics.eligibleDormant.sum / metrics.weekCount;
const avgActive = metrics.activeCount.sum / metrics.weekCount;
const last = metrics.seasonSnapshots[metrics.seasonSnapshots.length - 1];

console.log(JSON.stringify({
  seed: metrics.seed,
  seasonsRequested: metrics.seasonsRequested,
  completedSeasons: metrics.completedSeasons,
  elapsedSeconds: Number(elapsed),
  allChars: metrics.initial.allChars,
  initial: metrics.initial,
  final: last,
  fa: {
    min: metrics.fa.min,
    max: metrics.fa.max,
    avg: Number(avgFA.toFixed(2)),
    zeroWeeks: metrics.zeroFAWeeks,
    zeroWeekRate: formatPct(metrics.zeroFAWeeks, metrics.weekCount),
  },
  eligibleDormant: {
    min: metrics.eligibleDormant.min,
    max: metrics.eligibleDormant.max,
    avg: Number(avgEligibleDormant.toFixed(2)),
    lowWeeksUnder3: metrics.lowDormantWeeks,
    lowWeeksUnder3Rate: formatPct(metrics.lowDormantWeeks, metrics.weekCount),
    tightWeeksUnder10: metrics.tightDormantWeeks,
    tightWeeksUnder10Rate: formatPct(metrics.tightDormantWeeks, metrics.weekCount),
  },
  playerHealthyMin: metrics.playerHealthy.min,
  aiMinSize: metrics.aiMinSize,
  aiAtFloorWeeks: metrics.aiAtFloorWeeks,
  activeCount: {
    min: metrics.activeCount.min,
    max: metrics.activeCount.max,
    avg: Number(avgActive.toFixed(2)),
  },
  totalSupply: metrics.totalSupply,
  minRetireReturnGap: Number.isFinite(metrics.minRetireReturnGap) ? metrics.minRetireReturnGap : null,
  earlyRetireReturns: metrics.earlyRetireReturns.slice(0, 20),
  earlyRetireReturnCount: metrics.earlyRetireReturns.length,
  violationCount: metrics.violations.length,
  seasonSnapshots: metrics.seasonSnapshots,
}, null, 2));
