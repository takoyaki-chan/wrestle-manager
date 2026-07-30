#!/usr/bin/env node
// Growth lever measurement wrapper.  It loads auto-sim in memory, injects only
// GROWTH_CONFIG values, and attaches read-only end-of-season probes.  src and
// test/auto-sim.js remain untouched.
'use strict';

const fs = require('fs');
const path = require('path');
const Module = module.constructor;

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] != null ? argv[index + 1] : fallback;
};
const gamma = Number(option('--gamma', '1.0'));
const heat = option('--heat', 'off');
const wearCoef = Number(option('--wear', '0'));
const heatTables = { off: null, A: [1.8, 1.5, 1.25, 1.0], B: [1.8, 1.6, 1.4, 1.2, 1.0] };
if (!Number.isFinite(gamma) || gamma <= 0) throw new Error(`Invalid --gamma: ${gamma}`);
if (!Object.prototype.hasOwnProperty.call(heatTables, heat)) throw new Error(`Invalid --heat: ${heat}`);
if (!Number.isFinite(wearCoef) || wearCoef < 0) throw new Error(`Invalid --wear: ${wearCoef}`);

const autoSimPath = path.join(__dirname, 'auto-sim.js');
let source = fs.readFileSync(autoSimPath, 'utf8');
const loadMarker = "loadAsGlobal('draft-negotiation.js');";
const configInjection = `
${loadMarker}

globalThis.__growthLeverProbe = { retireAges: [], seasonEnds: [] };
GROWTH_CONFIG.brakeGamma = ${JSON.stringify(gamma)};
GROWTH_CONFIG.intensiveHeatTable = ${JSON.stringify(heatTables[heat])};
GROWTH_CONFIG.aiMatchWearCoef = ${JSON.stringify(wearCoef)};
{
  const _growthLeverOriginalSeasonEnd = Engine.rival.processSeasonEnd;
  Engine.rival.processSeasonEnd = function growthLeverSeasonEndProbe(rng, state) {
    const before = Object.values(state.aiOrgs || {}).flatMap(org => org?.roster || []).map(f => ({ id: f.id, age: f.age || 17 }));
    const result = _growthLeverOriginalSeasonEnd.apply(this, arguments);
    const remaining = new Set(Object.values(result.aiOrgs || {}).flatMap(org => org?.roster || []).map(f => f.id));
    before.forEach(f => { if (!remaining.has(f.id)) globalThis.__growthLeverProbe.retireAges.push(f.age + 1); });
    return result;
  };
}`;
if (!source.includes(loadMarker)) throw new Error('auto-sim load marker was not found');
source = source.replace(loadMarker, configInjection);

const seasonMarker = 'stats.fundsHistory.push(Math.round(G.funds || 0));';
const seasonInjection = `${seasonMarker}
        {
          const _growthLeverAi = Object.values(G.aiOrgs || {}).flatMap(org => org?.roster || []);
          const _growthLeverTop8 = [..._growthLeverAi].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 8);
          globalThis.__growthLeverProbe.seasonEnds.push({
            season: G.season - 1,
            top8AvgOvr: _growthLeverTop8.length ? _growthLeverTop8.reduce((sum, f) => sum + Engine.util.ov(f), 0) / _growthLeverTop8.length : null,
            wears: _growthLeverAi.map(f => f.wear || 0),
          });
        }`;
if (!source.includes(seasonMarker)) throw new Error('auto-sim season marker was not found');
source = source.replace(seasonMarker, seasonInjection);

const child = new Module(autoSimPath, module);
child.filename = autoSimPath;
child.paths = Module._nodeModulePaths(path.dirname(autoSimPath));
child._compile(source, autoSimPath);

const probe = globalThis.__growthLeverProbe;
const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1))];
};
const lastFive = probe.seasonEnds.slice(-5);
const finalWears = probe.seasonEnds.length ? probe.seasonEnds[probe.seasonEnds.length - 1].wears : [];
const report = {
  gamma,
  heat,
  wearCoef,
  aiTop8OvrLast5Mean: lastFive.length ? lastFive.reduce((sum, row) => sum + (row.top8AvgOvr || 0), 0) / lastFive.length : null,
  aiRetireAgeMedian: percentile(probe.retireAges, 0.50),
  aiRetireAgeP10: percentile(probe.retireAges, 0.10),
  aiRetirees: probe.retireAges.length,
  finalAiWear: {
    n: finalWears.length,
    median: percentile(finalWears, 0.50),
    p10: percentile(finalWears, 0.10),
    p90: percentile(finalWears, 0.90),
    min: finalWears.length ? Math.min(...finalWears) : null,
    max: finalWears.length ? Math.max(...finalWears) : null,
  },
};
console.log(`Growth lever probe: ${JSON.stringify(report)}`);
