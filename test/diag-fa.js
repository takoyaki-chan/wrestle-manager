#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — FA/Dormant Pool 診断スクリプト
//  Mode: diagnostic-fa-pool (FA・休眠プール・引退循環の診断用)
//
//  ■ 目的
//    FA / dormantPool / retiredIds のサイズ推移をシーズン単位でトラッキングし、
//    選手循環(入団・退団・引退・復帰)のバランス崩れを早期発見する。
//
//  ■ このスクリプトが保証しないこと
//    - 通常プレイの完全再現ではない(auto-sim由来の簡略判断を含む)
//    - ドラフト指名戦略、ケアアクション、契約交渉はヒューリスティック
//    - 発見した数値異常は「本番セーブまたは実プレイで再確認」が必須
//
//  Usage: node test/diag-fa.js [シード]
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const path = require('path');
const fs = require('fs');
global.window = { IS_TRIAL: false };
const vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('draft-negotiation.js');

// --- Reuse auto-sim helpers ---
function normFighter(f) {
  return { ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
    injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false, intensiveWeeks: 0 };
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
    if (s[k] !== undefined) { const { [k]: _, ...clean } = s; s = clean; }
  }
  return s;
}

function autoHandleScoutEvent(G, simRng) {
  if (G.weekPhase !== 'scoutEvent') return G;
  const candidates = G.scoutCandidates || [];
  if (candidates.length === 0) return G;
  const maxPicks = G.scoutMaxPicks || 4;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  const rosterCap = G.rosterCap || 16;
  let playerPicks = 0;
  const playerFn = (cid, round, bid) => {
    if (playerPicks >= maxPicks) return 'drop';
    if (ownCount + playerPicks >= rosterCap) return 'drop';
    if (bid > G.funds * 0.4) return 'drop';
    if (round > 8) return 'drop';
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
  for (const r of draftResult.results) {
    const clean = { ...r.candidate };
    delete clean._notion; delete clean._estimate; delete clean._isSeed; delete clean._hasCompetition;
    if (r.winner === 'player') {
      if (newFunds >= r.finalBid && playerPicks < maxPicks && newRoster.filter(c => !c.isRental).length < rosterCap) {
        newRoster.push(normFighter(clean)); newFunds -= r.finalBid; playerPicks++;
      } else { newFA.push(normFighter(clean)); }
    } else if (r.winner && r.winner !== 'player') {
      const orgData = newAiOrgs[r.winner];
      if (orgData) Engine.rival.pushUniqueFighter(orgData.roster, normFighter({ ...clean, orgId: r.winner }));
    } else { newFA.push(normFighter(clean)); }
  }
  for (const ev of (draftResult.empressReinforceEvents || [])) {
    if (ev.type === 'empressReinforce' && ev.fighter) {
      const orgData = newAiOrgs[DRAFT_EMPRESS_SAFETY.orgId];
      if (orgData) {
        Engine.rival.pushUniqueFighter(orgData.roster, normFighter(ev.fighter));
        newDormant = newDormant.filter(e => e.id !== ev.dormantIdRemoved);
      }
    }
  }
  return { ...G, roster: newRoster, funds: newFunds, aiOrgs: newAiOrgs, freeAgents: newFA,
    dormantPool: newDormant, scoutCandidates: null, scoutPicks: null };
}

function autoHandleContractNegotiation(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  const negotiations = G.pendingContractNegotiations || [];
  let state = { ...G };
  for (const neg of negotiations) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    if (neg.attitude === 'sudden_departure') {
      state = Engine.contract.resolveNegotiation(resolveRng, state, neg, 0).state;
      continue;
    }
    const roll = Engine.rng.float(simRng);
    let choiceIdx, subChoice;
    if (neg.attitude === 'raise') { choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2); }
    else { if (roll < 0.6) choiceIdx = 0; else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; } else choiceIdx = 2; }
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = result.state;
    if (result.result && result.result.escalated) {
      state = Engine.contract.resolveNegotiation(resolveRng, state, { ...neg, attitude: 'transfer' }, 0).state;
    }
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
}

function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < 4; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i+1].id, isTitle: false });
  }
  const venueIdx = Math.min(9, Math.max(0, Math.floor((G.orgPop || 0) / 12)));
  return { ...G, showCard: card, showVenue: venueIdx };
}

// --- Main simulation (based on auto-sim pattern) ---
const seed = parseInt(process.argv[2]) || 42;
let G = Engine.createInitialState(seed, true);
G = { ...G, debugLog: [] };
const simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));

console.log('=== FA/Dormant Pool Diagnostic ===');
console.log('Mode: diagnostic-fa-pool');
console.log('※ 診断専用: 通常プレイの完全再現ではありません。異常値は実プレイで再確認してください。');
console.log('');
console.log('Season | FA  | Dormant | D(17-18) | Retired | PlyrR | AI_S | AI_A | AI_B | DraftCands');

let lastSeason = G.season;
let lastDraftCands = '-';
const TARGET = 25;
let completed = 0;
const MAX_ITER = TARGET * 60;

function printStats(G, draftInfo) {
  const fa = (G.freeAgents || []).length;
  const dorm = (G.dormantPool || []).length;
  const elig = (G.dormantPool || []).filter(e => (e.age||17) >= 17 && (e.age||17) <= 18).length;
  const ret = (G.retiredIds || []).length;
  const pr = G.roster.length;
  const ao = Object.values(G.aiOrgs || {});
  console.log(
    `S${String(G.season).padStart(2,'0')} ` +
    `| ${String(fa).padStart(3)} ` +
    `| ${String(dorm).padStart(7)} ` +
    `| ${String(elig).padStart(8)} ` +
    `| ${String(ret).padStart(7)} ` +
    `| ${String(pr).padStart(5)} ` +
    `| ${String(ao[0]?.roster?.length||0).padStart(4)} ` +
    `| ${String(ao[1]?.roster?.length||0).padStart(4)} ` +
    `| ${String(ao[2]?.roster?.length||0).padStart(4)} ` +
    `| ${draftInfo}`
  );
}

// Initial stats
printStats(G, '-');

let iter = 0;
while (completed < TARGET && iter < MAX_ITER) {
  iter++;
  try {
    if (G.weekPhase === 'gameover') { break; }

    // Handle special phases
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
      } else { G = { ...G, weekPhase: 'manage' }; }
      delete G._juniorTournamentSelection;
    }
    if (G.weekPhase === 'scoutEvent') {
      const cands = (G.scoutCandidates || []).length;
      if (cands > 0) lastDraftCands = String(cands);
      G = autoHandleScoutEvent(G, simRng);
    }
    if (G.weekPhase === 'contractNegotiation') {
      G = autoHandleContractNegotiation(G, simRng);
    }

    // Show setup
    if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
      G = autoSetupShowCard(G, simRng);
      if (G.showCard && G.showCard.length > 0) {
        const showResult = Engine.executeShow(G);
        if (showResult && !showResult.error) G = showResult.state;
      }
    }

    G = clearTransients(G);
    const tickResult = Engine.tickWeek(G);
    G = { ...tickResult.state, gameLog: [], debugLog: [] };
    G = clearTransients(G);

    const advResult = Engine.advanceWeek(G);
    G = { ...advResult.state, gameLog: [] };

    G = Engine.validateGameState(G);
    G = { ...G, debugLog: [] };

    // Season transition
    if (!G.offSeason && G.week === 1 && G.season > lastSeason) {
      printStats(G, lastDraftCands);
      lastDraftCands = '-';
      lastSeason = G.season;
      completed++;
    }
  } catch (e) {
    console.error('ERROR at S' + G.season + ' W' + G.week + ':', e.message);
    break;
  }
}

// Final accounting
console.log('\n--- Character Accounting ---');
const allIds = new Set();
G.roster.forEach(c => allIds.add(c.id));
(G.freeAgents || []).forEach(c => allIds.add(c.id));
(G.dormantPool || []).forEach(e => allIds.add(e.id));
(G.retiredIds || []).forEach(id => allIds.add(id));
Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => allIds.add(c.id)));
// Check rentals too
(G.rentals || []).forEach(r => { if (r.fighterId) allIds.add(r.fighterId); });
console.log('Total tracked IDs:', allIds.size, '/ 127');
const missingIds = [];
for (let i = 1; i <= 128; i++) {
  if (i === 10) continue;
  if (!allIds.has(i)) missingIds.push(i);
}
if (missingIds.length > 0) console.log('MISSING IDs:', missingIds.join(', '));
else console.log('All characters accounted for.');
