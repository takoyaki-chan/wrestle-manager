#!/usr/bin/env node
// Morale distribution probe for 慰労会 (party) trigger condition analysis
// Phase 4 follow-up: samples G.lockerRoomMorale across many simulated weeks
// to decide whether morale<50 is too strict for the party document filter.
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

const SEEDS = [1, 7919, 31337, 54321, 98765];
const SEASONS_PER_SEED = 4;

const buckets = {
  lt30: 0, lt40: 0, lt50: 0, lt60: 0, lt70: 0, lt80: 0, ge80: 0,
};
let totalSamples = 0;
let perWeekBuckets = { management: 0, show: 0, offSeason: 0 };

for (const seed of SEEDS) {
  let G = Engine.createInitialState(seed, true);
  const totalWeeks = SEASONS_PER_SEED * 48;
  for (let wk = 0; wk < totalWeeks; wk++) {
    if (G.weekPhase === 'gameover') break;
    // Sample pre-tick
    const m = G.lockerRoomMorale != null ? G.lockerRoomMorale : 60;
    if (m < 30) buckets.lt30++;
    else if (m < 40) buckets.lt40++;
    else if (m < 50) buckets.lt50++;
    else if (m < 60) buckets.lt60++;
    else if (m < 70) buckets.lt70++;
    else if (m < 80) buckets.lt80++;
    else buckets.ge80++;
    totalSamples++;
    if (G.offSeason) perWeekBuckets.offSeason++;
    else if (Engine.util && Engine.util.isShowWeek && Engine.util.isShowWeek(G.week)) perWeekBuckets.show++;
    else perWeekBuckets.management++;

    // Ingest / advance
    try {
      const tickR = Engine.tickWeek(G);
      G = { ...tickR.state, gameLog: [] };
      const advR = Engine.advanceWeek(G);
      G = { ...advR.state, gameLog: [] };
      G = Engine.validateGameState(G);
    } catch (e) {
      console.error('error at seed', seed, 'week', wk, ':', e.message);
      break;
    }
    // Clear any transient phases to keep the loop moving
    if (G.weekPhase === 'ppvEntry' || G.weekPhase === 'contractNegotiation' ||
        G.weekPhase === 'scoutEvent' || G.weekPhase === 'transfer' ||
        G.weekPhase === 'event' || G.weekPhase === 'ppvShow' ||
        G.weekPhase === 'ppvTV' || G.weekPhase === 'juniorTournament') {
      G = { ...G, weekPhase: 'manage' };
    }
  }
}

console.log('=== lockerRoomMorale distribution ===');
console.log('Total samples:', totalSamples);
console.log('Phase mix:', perWeekBuckets);
console.log('');
const pct = n => ((n / totalSamples) * 100).toFixed(1) + '%';
console.log(`morale < 30:  ${String(buckets.lt30).padStart(5)} (${pct(buckets.lt30)})`);
console.log(`morale 30-39: ${String(buckets.lt40).padStart(5)} (${pct(buckets.lt40)})`);
console.log(`morale 40-49: ${String(buckets.lt50).padStart(5)} (${pct(buckets.lt50)})`);
console.log(`morale 50-59: ${String(buckets.lt60).padStart(5)} (${pct(buckets.lt60)})`);
console.log(`morale 60-69: ${String(buckets.lt70).padStart(5)} (${pct(buckets.lt70)})`);
console.log(`morale 70-79: ${String(buckets.lt80).padStart(5)} (${pct(buckets.lt80)})`);
console.log(`morale >= 80: ${String(buckets.ge80).padStart(5)} (${pct(buckets.ge80)})`);

// Cumulative for the thresholds we care about
const under50 = buckets.lt30 + buckets.lt40 + buckets.lt50;
const under60 = under50 + buckets.lt60;
const under70 = under60 + buckets.lt70;
console.log('');
console.log(`cumulative < 50: ${under50} (${pct(under50)})  ← current party filter`);
console.log(`cumulative < 60: ${under60} (${pct(under60)})  ← option 2 (relaxed)`);
console.log(`cumulative < 70: ${under70} (${pct(under70)})  ← option 2b (more relaxed)`);
