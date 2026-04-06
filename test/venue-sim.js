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

function makeRoster(avgOvr, avgPop, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `F${i + 1}`,
    pw: avgOvr,
    sp: avgOvr,
    te: avgOvr,
    st: avgOvr,
    mn: avgOvr,
    popularity: avgPop,
    salaryBonus: 0,
    traits: [],
    injury: null,
    isRental: false,
  }));
}

function makeState(orgPop, venueIdx) {
  return {
    orgPop,
    showVenue: venueIdx,
    roster: [],
    titles: { world: { championId: null } },
    showCard: [],
    attendanceMomentum: 0,
    heatScore: 0,
    rngSeed: 42,
    season: 1,
    week: 4,
    difficultyMode: 'normal',
  };
}

function calcSalaryCost(roster) {
  return roster.reduce((sum, c) => sum + Engine.util.getSalary(c, { world: { championId: null } }), 0);
}

function simulateVenue(orgPop, avgOvr, avgPop, rosterCount, venueIdx) {
  const roster = makeRoster(avgOvr, avgPop, rosterCount);
  const state = makeState(orgPop, venueIdx);
  const mainCardPop = avgOvr * 0.8 + avgPop * 0.2;
  const attendance = Engine.economy.calcAttendance(state, venueIdx, mainCardPop, false, false, null);
  const revenue = Engine.economy.calcShowRevenue(venueIdx, attendance);
  const salary = calcSalaryCost(roster);
  const fixed = FIXED_COSTS.admin;
  return {
    venue: VENUES[venueIdx],
    attendance,
    occPct: Math.round(revenue.occupancyRate * 100),
    ticketRev: revenue.ticketRev,
    venueCost: revenue.venueCost,
    showNet: revenue.ticketRev - revenue.venueCost,
    weekNet: revenue.ticketRev - revenue.venueCost - salary - fixed,
  };
}

const scenarios = [
  { orgPop: 60, avgOvr: 55, avgPop: 30, rosterCount: 12, label: 'mid-low' },
  { orgPop: 75, avgOvr: 65, avgPop: 50, rosterCount: 15, label: 'mid' },
  { orgPop: 85, avgOvr: 72, avgPop: 65, rosterCount: 18, label: 'upper-mid' },
  { orgPop: 95, avgOvr: 80, avgPop: 75, rosterCount: 20, label: 'high' },
  { orgPop: 100, avgOvr: 85, avgPop: 85, rosterCount: 22, label: 'top' },
];

console.log('=== Venue Revenue Simulation ===\n');

for (const scenario of scenarios) {
  console.log(`-- ${scenario.label} orgPop=${scenario.orgPop} ovr=${scenario.avgOvr} pop=${scenario.avgPop} roster=${scenario.rosterCount}`);
  console.log('venue       | cap   | att   | occ | ticket | cost | showNet | weekNet');
  console.log('----------- | ----- | ----- | --- | ------ | ---- | ------- | -------');
  for (let venueIdx = 0; venueIdx < VENUES.length; venueIdx++) {
    const row = simulateVenue(
      scenario.orgPop,
      scenario.avgOvr,
      scenario.avgPop,
      scenario.rosterCount,
      venueIdx
    );
    console.log(
      `${row.venue.name.padEnd(11)} | ${String(row.venue.cap).padStart(5)} | ${String(row.attendance).padStart(5)} | ${String(row.occPct).padStart(3)}% | ${String(row.ticketRev).padStart(6)} | ${String(row.venueCost).padStart(4)} | ${String(row.showNet).padStart(7)} | ${String(row.weekNet).padStart(7)}`
    );
  }
  console.log('');
}

console.log('-- Dome focus (orgPop 50..100) --');
console.log('orgPop | att   | occ | ticket | cost | showNet | roi');
console.log('------ | ----- | --- | ------ | ---- | ------- | ----');
for (const orgPop of [50, 60, 70, 80, 90, 100]) {
  const row = simulateVenue(orgPop, 70, 60, 18, 9);
  const roi = (row.ticketRev / Math.max(1, row.venueCost)).toFixed(2);
  console.log(
    `${String(orgPop).padStart(6)} | ${String(row.attendance).padStart(5)} | ${String(row.occPct).padStart(3)}% | ${String(row.ticketRev).padStart(6)} | ${String(row.venueCost).padStart(4)} | ${String(row.showNet).padStart(7)} | ${roi}x`
  );
}

console.log('\nDone');
