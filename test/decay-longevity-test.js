#!/usr/bin/env node
// 衰退/引退プロファイラ
// 目的: シーズン末の年齢分布・wear分布・引退件数を計測。
// 「選手が長持ちしすぎる」回帰の検証用。
// auto-sim と同じハーネスを流用。
//
// Usage: node test/decay-longevity-test.js [seasons] [seedBase]
// Example: node test/decay-longevity-test.js 30 12345

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
['victory-lines.js','data.js','data-faction-dialogue.js','management.js',
 'match-engine.js','relationships.js','flag-dialogue.js','factions.js',
 'draft-negotiation.js'].forEach(loadAsGlobal);

const args = process.argv.slice(2);
const SEASONS = parseInt(args[0], 10) || 30;
const SEED_BASE = args[1] ? parseInt(args[1], 10) : 12345;
const SEEDS = [SEED_BASE, SEED_BASE + 7919, SEED_BASE + 17389,
               SEED_BASE + 27737, SEED_BASE + 39041];

function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  return { ...G, debugLog: G.debugLog || [] };
}

// auto-sim から完全な自動応答を移植
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = (typeof VENUES !== 'undefined' ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4);
  const isSpecial = G.week % 12 === 0;
  const eff = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < eff; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i+1].id, isTitle: false });
  }
  return { ...G, showCard: card, showVenue: venueIdx };
}

function autoHandleContractNegotiation(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  const negotiations = G.pendingContractNegotiations || [];
  let state = { ...G };
  for (const neg of negotiations) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    if (neg.attitude === 'sudden_departure') {
      const r = Engine.contract.resolveNegotiation(resolveRng, state, neg, 0); state = r.state; continue;
    }
    const roll = Engine.rng.float(simRng);
    let choiceIdx, subChoice;
    if (neg.attitude === 'raise') {
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      if (roll < 0.6) choiceIdx = 0;
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else choiceIdx = 2;
    }
    const r = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = r.state;
    if (r.result && r.result.escalated) {
      const escNeg = { ...neg, attitude: 'transfer' };
      const er = Engine.contract.resolveNegotiation(resolveRng, state, escNeg, 0);
      state = er.state;
    }
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
}

function autoHandleScoutEvent(G, simRng) {
  if (G.weekPhase !== 'scoutEvent') return G;
  const candidates = G.scoutCandidates || [];
  if (candidates.length === 0) return G;
  const maxPicks = G.scoutMaxPicks || 4;
  const rosterCap = G.rosterCap || 16;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  let playerPicks = 0;
  const playerFn = (cid, round, currentBid) => {
    if (playerPicks >= maxPicks) return 'drop';
    if (ownCount + playerPicks >= rosterCap) return 'drop';
    if (currentBid > G.funds * 0.4) return 'drop';
    if (round > 8) return 'drop';
    return 'standard';
  };
  const draftRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xDFA0));
  const draftResult = Engine.draftNegotiation.runFullDraft(candidates, G, playerFn, draftRng);
  let newRoster = [...G.roster];
  let newFunds = G.funds;
  let newAiOrgs = {};
  Object.keys(G.aiOrgs || {}).forEach(k => { newAiOrgs[k] = { ...G.aiOrgs[k], roster: [...(G.aiOrgs[k]?.roster || [])] }; });
  let newFA = [...(G.freeAgents || [])];
  const normFighter = (f) => ({
    ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins||0, losses: f.losses||0, draws: f.draws||0, injury: null,
    seasonGrowth: f.seasonGrowth || { pw:0,sp:0,te:0,st:0,mn:0 },
    intensive: false, intensiveWeeks: 0,
  });
  for (const r of draftResult.results) {
    const clean = { ...r.candidate };
    delete clean._notion; delete clean._estimate; delete clean._isSeed; delete clean._hasCompetition;
    if (r.winner === 'player') {
      if (newFunds >= r.finalBid && playerPicks < maxPicks && newRoster.filter(c => !c.isRental).length < rosterCap) {
        newRoster.push(normFighter(clean)); newFunds -= r.finalBid; playerPicks++;
      } else newFA.push(normFighter(clean));
    } else if (r.winner) {
      const orgData = newAiOrgs[r.winner];
      if (orgData) Engine.rival.pushUniqueFighter(orgData.roster, normFighter({ ...clean, orgId: r.winner }));
    } else newFA.push(normFighter(clean));
  }
  return { ...G, roster: newRoster, funds: newFunds, aiOrgs: newAiOrgs, freeAgents: newFA, scoutCandidates: null, scoutPicks: null };
}

function autoHandleFactionEvent(G, simRng) {
  if (!G._pendingFactionEvent) return G;
  const fe = G._pendingFactionEvent;
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA90));
  let s = G;
  try {
    const choices = ['A','B','C'];
    const ch = choices[Math.floor(Engine.rng.float(simRng) * 3)];
    if (fe.eventId === 'F03') { const r = Engine.factions.applyF03Result(s, fe.payload, rng); if (r&&r.state) s=r.state; }
    else if (fe.eventId === 'F05H') { const r = Engine.factions.applyF05HResult(s, fe.payload); if (r&&r.state) s=r.state; }
    else if (/^F02_/.test(fe.eventId)) {
      const map = { F02_RESOLUTION:'applyF02ResolutionResult', F02_ENDLESS:'applyF02EndlessResult', F02_IGNITE:'applyF02IgniteResult', F02_PEACE:'applyF02PeaceResult' };
      const fn = Engine.factions[map[fe.eventId]]; if (fn) { const r = fn.call(Engine.factions, s, fe.payload, rng); if (r&&r.state) s=r.state; }
    } else if (fe.eventId === 'COMMON_4') { const r = Engine.factions.applyCommon4Result(s, fe.payload, rng); if (r&&r.state) s=r.state; }
    else {
      const fnName = `apply${fe.eventId}Choice`;
      if (typeof Engine.factions[fnName] === 'function') {
        const r = Engine.factions[fnName].call(Engine.factions, s, fe.payload, ch, rng);
        if (r && r.state) s = r.state;
      }
    }
  } catch (_e) {}
  const { _pendingFactionEvent: _, ...clean } = s; return clean;
}

const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
  '_juniorTournamentSelection', '_juniorTournamentResult',
  '_pendingFactionEvent', '_pendingF08Directive',
  '_shownF08PreMatchIds', '_shownF08PostMatchIds', '_pendingF08Aftermath',
];
function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) { const { [k]:_, ...c } = s; s = c; }
  }
  return s;
}

function simulate(seed, seasons, opts = {}) {
  const { skipCommit = false } = opts;
  let G = initGame(seed);
  const simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  const samples = [];     // per-season snapshot
  const retireLog = [];   // retirement events { season, age, wear, reason }
  const MAX_ITER = seasons * 60;
  let completed = 0, iter = 0;

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') break;
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
        } else G = { ...G, weekPhase: 'manage' };
        delete G._juniorTournamentSelection;
      }
      if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);
      if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
        G = autoSetupShowCard(G, simRng);
        if (G.showCard && G.showCard.length > 0) {
          const r = Engine.executeShow(G);
          if (r && !r.error) G = r.state;
        }
      }
      G = clearTransients(G);
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);
      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };

      // pendingRetirements 処理 (本番フロー再現) — API 不在環境でも安全に
      if (G.pendingRetirements && G.pendingRetirements.length > 0) {
        G.pendingRetirements.forEach(r => {
          retireLog.push({
            season: G.season, age: r.fighter.age, wear: r.fighter.wear || 0,
            route: r.route || 'season_end',
            careerSeasons: r.fighter.careerSeasons || 0,
          });
        });
        if (!skipCommit && Engine.retirement && typeof Engine.retirement.commitRetirements === 'function') {
          try {
            const confirmed = G.pendingRetirements.map(r => r.fighter);
            const cr = Engine.retirement.commitRetirements(G, confirmed);
            G = cr.state;
          } catch (_e) {}
        }
        // 古い実装は roster をすでに消しているはず。新実装は commitRetirements で消した。
        const { pendingRetirements: _, ...rest } = G;
        G = rest;
      }
      G = Engine.validateGameState(G);

      // シーズン遷移検出時にスナップショット
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        const r = G.roster.filter(c => !c.isRental);
        const ages = r.map(c => c.age || 0);
        const wears = r.map(c => c.wear || 0);
        const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
        samples.push({
          season: G.season,
          rosterSize: r.length,
          ageAvg: +avg(ages).toFixed(2),
          ageMax: Math.max(0, ...ages),
          age23plus: ages.filter(a => a >= 23).length,
          age26plus: ages.filter(a => a >= 26).length,
          age30plus: ages.filter(a => a >= 30).length,
          wearAvg: +avg(wears).toFixed(1),
          wearMax: Math.max(0, ...wears),
          wear40plus: wears.filter(w => w >= 40).length,
          wear60plus: wears.filter(w => w >= 60).length,
          wear80plusInRoster: wears.filter(w => w >= 80).length,  // バグ指標
          retiredCumulative: (G.retiredFighters || []).length,
        });
        completed++;
      }
    } catch (e) {
      // continue
      iter += 5;
    }
  }
  return { samples, retireLog };
}

console.log('=== Decay/Longevity Profiler ===');
console.log(`Seeds: ${SEEDS.length} × ${SEASONS} seasons`);
console.log('--------------------------------------');

const allSamples = [];
const allRetires = [];
for (const seed of SEEDS) {
  const { samples, retireLog } = simulate(seed, SEASONS);
  allSamples.push(...samples);
  allRetires.push(...retireLog);
  process.stdout.write(`  seed ${seed}: ${samples.length} seasons, ${retireLog.length} retirees\n`);
}
console.log('--------------------------------------');

// シーズン別集計
const bySeason = {};
allSamples.forEach(s => {
  if (!bySeason[s.season]) bySeason[s.season] = [];
  bySeason[s.season].push(s);
});
const seasons = Object.keys(bySeason).map(n => +n).sort((a,b)=>a-b);
const avg = (arr, key) => arr.reduce((a,b)=>a+b[key],0)/arr.length;

console.log('Season  | RosterSz | AgeAvg | Age26+ | Age30+ | WearAvg | Wear40+ | Wear60+ | Wear80+IN | Retired↑');
console.log('--------|----------|--------|--------|--------|---------|---------|---------|-----------|---------');
seasons.forEach(s => {
  const arr = bySeason[s];
  const r = (k, dp = 1) => avg(arr, k).toFixed(dp);
  console.log(
    `S${String(s).padStart(3)}     | `
    + `${r('rosterSize',1).padStart(7)}  | `
    + `${r('ageAvg',1).padStart(5)}  | `
    + `${r('age26plus',1).padStart(5)}  | `
    + `${r('age30plus',1).padStart(5)}  | `
    + `${r('wearAvg',1).padStart(6)}  | `
    + `${r('wear40plus',1).padStart(6)}  | `
    + `${r('wear60plus',1).padStart(6)}  | `
    + `${r('wear80plusInRoster',1).padStart(8)}  | `
    + `${r('retiredCumulative',1).padStart(6)}`
  );
});

console.log('--------------------------------------');
console.log(`引退件数 合計: ${allRetires.length}  (${(allRetires.length / (SEEDS.length * SEASONS)).toFixed(2)} /season/seed)`);
const ageBuckets = { '17-22':0, '23-25':0, '26-28':0, '29-30':0, '31-32':0, '33+':0 };
allRetires.forEach(r => {
  const a = r.age;
  if (a < 23) ageBuckets['17-22']++;
  else if (a < 26) ageBuckets['23-25']++;
  else if (a < 29) ageBuckets['26-28']++;
  else if (a < 31) ageBuckets['29-30']++;
  else if (a < 33) ageBuckets['31-32']++;
  else ageBuckets['33+']++;
});
console.log('引退時 年齢分布:');
Object.entries(ageBuckets).forEach(([k,v]) => {
  const pct = allRetires.length ? (v/allRetires.length*100).toFixed(1) : '0.0';
  console.log(`  age ${k.padEnd(6)}: ${String(v).padStart(4)} (${pct}%)`);
});

const wearBuckets = { '0-19':0, '20-39':0, '40-59':0, '60-79':0, '80+':0 };
allRetires.forEach(r => {
  const w = r.wear;
  if (w < 20) wearBuckets['0-19']++;
  else if (w < 40) wearBuckets['20-39']++;
  else if (w < 60) wearBuckets['40-59']++;
  else if (w < 80) wearBuckets['60-79']++;
  else wearBuckets['80+']++;
});
console.log('引退時 wear分布:');
Object.entries(wearBuckets).forEach(([k,v]) => {
  const pct = allRetires.length ? (v/allRetires.length*100).toFixed(1) : '0.0';
  console.log(`  wear ${k.padEnd(6)}: ${String(v).padStart(4)} (${pct}%)`);
});
const routes = {};
allRetires.forEach(r => { routes[r.route] = (routes[r.route]||0)+1; });
console.log('引退ルート:');
Object.entries(routes).forEach(([k,v]) => console.log(`  ${k.padEnd(20)}: ${v}`));
