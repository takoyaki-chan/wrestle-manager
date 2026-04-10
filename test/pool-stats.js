#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const vm = require('vm');
global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('draft-negotiation.js');

// ── auto-sim互換のヘルパー ──
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = (VENUES[venueIdx] || VENUES[0]).maxMatches || 4;
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
      const tm = card.find(m => m.left === champId || m.right === champId);
      if (tm) tm.isTitle = true;
    }
  }
  return { ...G, showCard: card, showVenue: venueIdx };
}

function clearTransients(G) {
  const keys = ['_pendingNotifEvent','_pendingChoiceEvent','_pendingLargeEvent',
    '_pendingTeamSpirit','_pendingSuddenDepartures','_pendingCoachReport',
    '_pendingAIGrowthAlerts','_pendingPromoIncomes','_pendingMediaIncomes',
    '_midseasonScoutTriggered','_triggerScoutEvent','_triggerMidseasonScout'];
  let clean = G;
  for (const k of keys) { if (clean[k] !== undefined) { clean = { ...clean }; delete clean[k]; } }
  return clean;
}

function skipPhase(G) {
  if (G.weekPhase === 'ppvEntry') return { ...G, weekPhase: 'manage', ppvPhase: 'locked' };
  if (G.weekPhase === 'ppvShow') return { ...G, ppvPhase: 'tv' };
  if (G.weekPhase === 'ppvTV') return { ...G, ppvPhase: null };
  if (G.weekPhase === 'scoutEvent') {
    // 候補を全員dormantPoolに返却してからスキップ
    let pool = [...(G.dormantPool || [])];
    (G.scoutCandidates || []).forEach(c => {
      if (!pool.some(e => e.id === c.id)) pool.push({ id: c.id, age: c.age || 17 });
    });
    return { ...G, dormantPool: pool, scoutCandidates: null, scoutPicks: [], scoutMaxPicks: null, scoutPendingPick: null, scoutEventType: null, weekPhase: G.offSeason ? 'offseason' : 'manage' };
  }
  if (G.weekPhase === 'negotiation') return { ...G, pendingContractNegotiations: null, weekPhase: G.offSeason ? 'offseason' : 'manage' };
  if (G.weekPhase === 'contractNegotiation') return { ...G, pendingContractNegotiations: null, weekPhase: G.offSeason ? 'offseason' : 'manage' };
  if (G.weekPhase === 'juniorTournament') return { ...G, weekPhase: 'manage', _juniorTournamentSelection: null };
  if (G.weekPhase === 'warChallenge') return { ...G, weekPhase: 'manage', pendingWar: null };
  if (G.weekPhase === 'settled') return { ...G, weekPhase: 'manage' };
  if (G._draftNegotiationStarted || G._draftNegotiation) {
    // ドラフト候補をdormantPoolに返却してからスキップ
    let pool = [...(G.dormantPool || [])];
    (G.scoutCandidates || []).forEach(c => {
      if (!pool.some(e => e.id === c.id)) pool.push({ id: c.id, age: c.age || 17 });
    });
    return { ...G, dormantPool: pool, _draftNegotiationStarted: false, _draftNegotiation: null, _draftInterests: null, scoutCandidates: null, weekPhase: G.offSeason ? 'offseason' : 'manage' };
  }
  if (G.pendingRetirements && G.pendingRetirements.length > 0) return { ...G, pendingRetirements: [] };
  return G;
}

// ── メインループ ──
const seed = parseInt(process.argv[2]) || 42;
let G = Engine.createInitialState(seed, true);
G = { ...G, debugLog: G.debugLog || [] };
const simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));

console.log('Season | Pool | 17-18 | 19-20 | 21+ | FA | Retired | Elig | Player | AI | Total');
console.log('-------|------|-------|-------|-----|-----|---------|------|--------|-----|------');

let lastSeason = 0;
for (let iter = 0; iter < 60000; iter++) {
  if (G.weekPhase === 'gameover') break;

  if (G.season !== lastSeason) {
    const pool = G.dormantPool || [];
    const a1718 = pool.filter(e => (e.age||17) >= 17 && (e.age||17) <= 18).length;
    const a1920 = pool.filter(e => (e.age||17) >= 19 && (e.age||17) <= 20).length;
    const a21p = pool.filter(e => (e.age||17) >= 21).length;
    const fa = (G.freeAgents || []).length;
    const retiredIds = G.retiredIds || [];
    const retired = retiredIds.length;
    const retiredSeasons = G.retiredSeasons || {};
    const COOLDOWN = 5;
    const occupiedIds = new Set();
    (G.roster || []).forEach(c => occupiedIds.add(c.id));
    Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => occupiedIds.add(c.id)));
    (G.freeAgents || []).forEach(c => occupiedIds.add(c.id));
    pool.forEach(e => occupiedIds.add(e.id));
    const eligible = retiredIds.filter(id => !occupiedIds.has(id) && retiredSeasons[id] !== undefined && G.season - retiredSeasons[id] >= COOLDOWN).length;
    const player = (G.roster || []).length;
    const ai = Object.values(G.aiOrgs || {}).reduce((s,o) => s + (o.roster||[]).length, 0);
    const total = pool.length + fa + retired + player + ai;
    console.log(
      `${String(G.season).padStart(6)} | ${String(pool.length).padStart(4)} | ${String(a1718).padStart(5)} | ${String(a1920).padStart(5)} | ${String(a21p).padStart(3)} | ${String(fa).padStart(3)} | ${String(retired).padStart(7)} | ${String(eligible).padStart(4)} | ${String(player).padStart(6)} | ${String(ai).padStart(3)} | ${String(total).padStart(5)}`
    );
    lastSeason = G.season;
    if (G.season > 20) break;
  }

  G = skipPhase(G);

  // 興行週: カード自動編成→executeShow
  if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
    G = autoSetupShowCard(G, simRng);
    if (G.showCard && G.showCard.length > 0) {
      const showResult = Engine.executeShow(G);
      if (showResult && !showResult.error) G = showResult.state;
    }
  }

  G = clearTransients(G);

  try {
    // tickWeek: 週次処理パイプライン
    const r = Engine.tickWeek(G);
    G = { ...r.state, gameLog: [] };
    G = clearTransients(G);

    // advanceWeek: 次の週へ進む
    const adv = Engine.advanceWeek(G);
    G = { ...adv.state, gameLog: [] };
    G = clearTransients(G);
  } catch(e) {
    G = { ...G, weekPhase: G.offSeason ? 'offseason' : 'manage' };
  }
}
