#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const vm = require('vm');
global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/if\s*\(\s*typeof\s+module\s*!==?\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)\s*\{[\s\S]*$/m, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('engine.js');

function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  return { ...G, debugLog: G.debugLog || [] };
}

function autoSetupShowCard(G, simRng) {
  var roster = G.roster.filter(function(c) { return !c.injury && c.condition >= 40; });
  if (roster.length < 2) return G;
  var venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  var maxM = (VENUES[venueIdx] || VENUES[0]).maxMatches;
  var shuffled = roster.slice().sort(function() { return Engine.rng.next(simRng) - 0.5; });
  var numMatches = Math.min(Math.floor(shuffled.length / 2), maxM);
  var card = [];
  for (var i = 0; i < numMatches; i++) {
    card.push({ left: shuffled[i*2].id, right: shuffled[i*2+1].id });
  }
  return Object.assign({}, G, { showCard: card, showVenue: venueIdx });
}

var TARGET = 30;
var seeds = [42, 100, 200, 300, 400];
var seasonData = {};

for (var si = 0; si < seeds.length; si++) {
  var seed = seeds[si];
  var simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  var G = initGame(seed);
  var completed = 0;
  var lastSeason = G.season;
  var iter = 0;
  var MAX_ITER = TARGET * 60;

  while (completed < TARGET && iter < MAX_ITER) {
    iter++;
    if (G.weekPhase === 'gameover') break;

    if (G.weekPhase === 'ppvEntry') G = Object.assign({}, G, { ppvPhase: 'locked' });
    if (G.weekPhase === 'ppvShow') G = Object.assign({}, G, { ppvPhase: 'tv' });
    if (G.weekPhase === 'ppvTV') G = Object.assign({}, G, { ppvPhase: 'done' });
    
    if (G.weekPhase === 'showPrep' || (G.week % 2 === 0 && (!G.showCard || G.showCard.length === 0))) {
      G = autoSetupShowCard(G, simRng);
    }

    G = Engine.tickWeek(G);
    
    if (G._pendingChoiceEvent) {
      var ch = G._pendingChoiceEvent.choices;
      G._pendingChoiceEvent.result = ch[Math.floor(Engine.rng.next(simRng) * ch.length)];
    }
    if (G._pendingLargeEvent) {
      var le = G._pendingLargeEvent;
      if (le.choices) le.result = le.choices[Math.floor(Engine.rng.next(simRng) * le.choices.length)];
    }
    if (G._pendingNegotiations) {
      for (var ni = 0; ni < G._pendingNegotiations.length; ni++) {
        var n = G._pendingNegotiations[ni];
        n.decision = Engine.rng.next(simRng) < 0.7 ? 'accept' : 'reject';
        Engine.contract.resolveNegotiation(G, n);
      }
      delete G._pendingNegotiations;
    }

    if (!G.offSeason && G.week === 1 && G.season > 1 && G.season !== lastSeason) {
      completed++;
      lastSeason = G.season;
      var sn = completed;
      if (!seasonData[sn]) seasonData[sn] = { pops: [], funds: [] };
      seasonData[sn].pops.push(Math.round(G.orgPop * 10) / 10);
      seasonData[sn].funds.push(Math.round(G.funds));
    }
  }
}

console.log("=== v3.1 30シーズン orgPop推移 (5シード平均) ===");
console.log("  Season |  orgPop avg (min - max) | funds avg     | bar");
for (var season = 1; season <= TARGET; season++) {
  if (!seasonData[season]) continue;
  var pops = seasonData[season].pops;
  var funds = seasonData[season].funds;
  var avg = (pops.reduce(function(a,b){return a+b;},0)/pops.length).toFixed(1);
  var min = Math.min.apply(null, pops).toFixed(1);
  var max = Math.max.apply(null, pops).toFixed(1);
  var favg = Math.round(funds.reduce(function(a,b){return a+b;},0)/funds.length);
  var bar = '#'.repeat(Math.round(parseFloat(avg) / 2));
  console.log('  S' + String(season).padStart(2) + '    | ' + avg.padStart(5) + ' (' + min.padStart(5) + '-' + max.padStart(5) + ') | ' + String(favg).padStart(8) + '万 | ' + bar);
}
