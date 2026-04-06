#!/usr/bin/env node
// MQ分布分析スクリプト — Phase 3 ドラマ減点調整用
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

const seeds = 10;
const seasonsPerSeed = 10;

// OV帯別の集計
const OV_BANDS = [
  { label: '30', min: 20, max: 40 },
  { label: '50', min: 40, max: 60 },
  { label: '70', min: 60, max: 75 },
  { label: '80', min: 75, max: 85 },
  { label: '90', min: 85, max: 95 },
  { label: '100', min: 95, max: 110 },
];
const buckets = {};
OV_BANDS.forEach(b => { buckets[b.label] = { baseMQ: [], finalMQ: [] }; });

const starCounts = { '☆': 0, '★': 0, '★★': 0, '★★★': 0, '★★★★': 0, '★★★★★': 0 };
let totalMatches = 0;
let mq100count = 0;

function getStarRating(mq) {
  if (mq >= 90) return '★★★★★';
  if (mq >= 80) return '★★★★';
  if (mq >= 65) return '★★★';
  if (mq >= 50) return '★★';
  if (mq >= 35) return '★';
  return '☆';
}

// Monkey-patch simulateMatch to capture baseMQ per match
let simMatchResults = [];
const origSim = Engine.battle.simulateMatch;
Engine.battle.simulateMatch = function(...args) {
  const result = origSim.apply(Engine.battle, args);
  if (result && typeof result.mq === 'number') {
    const avgOV = (Engine.util.ov(args[0]) + Engine.util.ov(args[1])) / 2;
    simMatchResults.push({ avgOV, baseMQ: result.mq, detail: result.mqDetail });
  }
  return result;
};

// Sim helpers (minimal copy from auto-sim)
function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  return { ...G, debugLog: [] };
}
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = (VENUES[venueIdx] || VENUES[0]).maxMatches;
  const effectiveMax = Math.min(G.week % 12 === 0 ? maxMatches + 1 : maxMatches, 8);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2)
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
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
const TR = ['_pendingChoiceEvent','_pendingNotifEvent','_pendingLargeEvent','_pendingTeamSpirit','_pendingGrowthEvents','_pendingMotivationRetirements','_pendingCoachReport','_flavorEvents','_pendingEliteTicket','_juniorTournamentSelection','_juniorTournamentResult'];
function clearT(G) { let s = G; for (const k of TR) { if (s[k] !== undefined) { const { [k]: _, ...c } = s; s = c; } } return s; }
function handleChoice(G, rng) {
  if (!G._pendingChoiceEvent) return G;
  if (Engine.events?.resolveChoice) { const r = Engine.events.resolveChoice(G, Engine.rng.float(rng) < 0.5 ? 'A' : 'B'); if (r?.state) return r.state; }
  const { _pendingChoiceEvent: _, ...c } = G; return c;
}
function handleLarge(G, rng) {
  if (!G._pendingLargeEvent) return G;
  if (Engine.events?.resolveLargeEvent) { const r = Engine.events.resolveLargeEvent(G, Engine.rng.float(rng) < 0.5 ? 'A' : 'B'); if (r?.state) return r.state; }
  const { _pendingLargeEvent: _, ...c } = G; return c;
}
function handleContract(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  let state = { ...G };
  for (const neg of (G.pendingContractNegotiations || [])) {
    const rr = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    if (neg.attitude === 'sudden_departure') { state = Engine.contract.resolveNegotiation(rr, state, neg, 0).state; continue; }
    const roll = Engine.rng.float(simRng);
    let ci, sc;
    if (neg.attitude === 'raise') ci = roll < 0.7 ? 0 : roll < 0.9 ? 1 : 2;
    else { if (roll < 0.6) ci = 0; else if (roll < 0.8) { ci = 1; sc = 'retain'; } else ci = 2; }
    const res = Engine.contract.resolveNegotiation(rr, state, neg, ci, sc);
    state = res.state;
    if (res.result.escalated) state = Engine.contract.resolveNegotiation(rr, state, { ...neg, attitude: 'transfer' }, 0).state;
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...c } = state;
  return c;
}

console.log(`=== MQ Distribution Analysis (${seeds}×${seasonsPerSeed} = ${seeds * seasonsPerSeed} seasons) ===\n`);

let allErrors = 0;
for (let si = 0; si < seeds; si++) {
  const seed = (si + 1) * 7919;
  let G;
  try { G = initGame(seed); } catch (e) { allErrors++; continue; }
  let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  let completed = 0, iter = 0;
  while (completed < seasonsPerSeed && iter < seasonsPerSeed * 60) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') { G = initGame(seed + iter); simRng = Engine.rng.create(Engine.rng.derive(seed + iter, 0xABCD)); continue; }
      if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
      if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
      if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
      if (G.weekPhase === 'juniorTournament') {
        const sel = G._juniorTournamentSelection;
        if (sel && !sel.cancelled) {
          const jr = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
          const jt = Engine.juniorTournament.run(G, sel.participants, jr);
          G = { ...Engine.juniorTournament.apply(G, jt).state, weekPhase: 'manage' };
        } else G = { ...G, weekPhase: 'manage' };
        delete G._juniorTournamentSelection;
      }
      if (G.weekPhase === 'contractNegotiation') G = handleContract(G, simRng);

      // 興行
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
        simMatchResults = [];
        G = autoSetupShowCard(G, simRng);
        if (G.showCard && G.showCard.length > 0) {
          const showResult = Engine.executeShow(G);
          if (showResult && !showResult.error) {
            // executeShow results have final MQ (with external bonuses)
            const finalResults = showResult.results || [];
            // simMatchResults has baseMQ from monkey-patched simulateMatch
            for (let mi = 0; mi < simMatchResults.length; mi++) {
              const sm = simMatchResults[mi];
              const fr = finalResults[mi];
              const finalMQ = fr ? fr.mq : sm.baseMQ;
              totalMatches++;
              const star = getStarRating(finalMQ);
              starCounts[star]++;
              if (finalMQ >= 100) mq100count++;
              for (const band of OV_BANDS) {
                if (sm.avgOV >= band.min && sm.avgOV < band.max) {
                  buckets[band.label].baseMQ.push(sm.baseMQ);
                  buckets[band.label].finalMQ.push(finalMQ);
                  break;
                }
              }
            }
            G = showResult.state;
          }
        }
      }

      G = handleChoice(G, simRng);
      G = handleLarge(G, simRng);
      G = clearT(G);
      G = { ...Engine.tickWeek(G).state, gameLog: [], debugLog: [] };
      G = clearT(G);
      G = { ...Engine.advanceWeek(G).state, gameLog: [] };
      if (!G.offSeason && G.week === 1 && G.season > 1) completed++;
    } catch (e) {
      allErrors++;
      G = initGame(seed + iter);
      simRng = Engine.rng.create(Engine.rng.derive(seed + iter, 0xABCD));
    }
  }
  process.stdout.write(`  Seed ${si + 1}/${seeds} done\r`);
}

// Report
function stats(arr) {
  if (!arr.length) return { avg: 0, med: 0, max: 0, min: 0, n: 0 };
  const s = [...arr].sort((a, b) => a - b);
  return {
    avg: +(arr.reduce((a, v) => a + v, 0) / arr.length).toFixed(1),
    med: +s[Math.floor(s.length / 2)].toFixed(1),
    max: +s[s.length - 1].toFixed(1),
    min: +s[0].toFixed(1),
    n: arr.length,
  };
}

console.log('\n\n=== OV帯別 MQ分布 ===');
console.log('avgOV | baseMQ平均 | baseMQ中央 | baseMQ最大 | finalMQ平均 | finalMQ最大 | N');
console.log('------|-----------|-----------|-----------|------------|------------|------');
for (const band of OV_BANDS) {
  const b = buckets[band.label];
  const bs = stats(b.baseMQ);
  const fs = stats(b.finalMQ);
  console.log(`  ${band.label.padStart(3)}  |   ${String(bs.avg).padStart(5)}   |   ${String(bs.med).padStart(5)}   |   ${String(bs.max).padStart(5)}   |    ${String(fs.avg).padStart(5)}   |    ${String(fs.max).padStart(5)}   |  ${String(bs.n).padStart(5)}`);
}

console.log('\n=== 星分布 ===');
console.log(`Total matches: ${totalMatches}`);
for (const [star, count] of Object.entries(starCounts)) {
  const pct = totalMatches > 0 ? (count / totalMatches * 100).toFixed(1) : 0;
  console.log(`  ${star.padEnd(5)}: ${String(count).padStart(6)} (${pct}%)`);
}
console.log(`\n  MQ=100: ${mq100count} (${totalMatches > 0 ? (mq100count / totalMatches * 100).toFixed(2) : 0}%)`);
console.log(`Errors: ${allErrors}`);
