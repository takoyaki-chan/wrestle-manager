#!/usr/bin/env node
'use strict';

// 40年較正用の読み取り専用プローブ。
// auto-sim本体には手を入れず、開眼発火と週末stateを観測する。観測時は必ず
// JSON deep-copyしたstateだけを読み、本編stateも本編RNGも変更しない。

const fs = require('fs');
const path = require('path');
const Module = module.constructor;

const autoSimPath = path.join(__dirname, 'auto-sim.js');
let source = fs.readFileSync(autoSimPath, 'utf8');

const loadMarker = "loadAsGlobal('draft-negotiation.js');";
const seedRateOverride = Number(process.env.WM_KAIGAN_SEED_RATE);
const triggerRateOverride = Number(process.env.WM_KAIGAN_TRIGGER_RATE);
const rateSetup = [
  Number.isFinite(seedRateOverride) && seedRateOverride > 0
    ? `Engine.kaigan.SEED_RATE = ${JSON.stringify(seedRateOverride)};`
    : '',
  Number.isFinite(triggerRateOverride) && triggerRateOverride > 0
    ? `Engine.kaigan.TRIGGER_RATE = ${JSON.stringify(triggerRateOverride)};`
    : '',
].filter(Boolean).join('\n');
const probeInjection = `${loadMarker}
${rateSetup}

globalThis.__kaiganCalibrationProbe = (() => {
  const records = new Map();
  const seedRollsById = new Map();
  const diagnostics = { seedEligible: 0, seedsAssigned: 0, eligibleMatchAttempts: 0 };
  let lastSeason = 0;
  const deepCopy = value => JSON.parse(JSON.stringify(value));
  const percentile = (values, p) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1))];
  };
  const activeFighters = state => [
    ...(state.roster || []),
    ...Object.values(state.aiOrgs || {}).flatMap(org => (org && org.roster) || []),
  ];
  const p95 = state => percentile(activeFighters(state).map(f => Engine.util.ov(f)), 0.95);
  const keyOf = fighter => {
    const ks = fighter.kaiganState || {};
    return String(fighter.id) + '@' + String(ks.triggeredSeason) + ':' + String(ks.triggeredWeek);
  };
  const observe = (state, fighter) => {
    if (!fighter || !fighter.kaiganState) return;
    const key = keyOf(fighter);
    const currentOvr = Engine.util.ov(fighter);
    const industryP95 = p95(state);
    const prior = records.get(key);
    if (!prior) {
      records.set(key, {
        key,
        id: fighter.id,
        name: fighter.name,
        triggerSeason: fighter.kaiganState.triggeredSeason,
        triggerWeek: fighter.kaiganState.triggeredWeek,
        triggerAge: fighter.kaiganState.triggerAge,
        targetTrainCapOVR: fighter.kaiganState.targetTrainCapOVR,
        sTop4Median: fighter.kaiganState.sTop4Median,
        seedRoll: (seedRollsById.get(fighter.id) || []).slice(-1)[0] ?? null,
        maxOvr: currentOvr,
        industryP95AtMax: industryP95,
      });
    } else if (currentOvr > prior.maxOvr) {
      prior.maxOvr = currentOvr;
      prior.industryP95AtMax = industryP95;
    }
  };
  const capture = liveState => {
    // 到達OVRは四半期ごと(12/24/36/48週+開幕週)に追う。発火瞬間は上の
    // applyAwakeningラッパーで別途必ず捕捉する。毎週フルstateを複製すると
    // 計測自体が本編シムより支配的になるため、読み取り密度だけを落とす。
    const week = liveState.week || 0;
    if (week !== 1 && week % 12 !== 0) return;
    const state = deepCopy(liveState);
    lastSeason = Math.max(lastSeason, state.season || 0);
    activeFighters(state).forEach(fighter => observe(state, fighter));
  };
  const originalAssign = Engine.kaigan.assignSeed;
  Engine.kaigan.assignSeed = function kaiganCalibrationAssign(fighter, rng) {
    const eligible = fighter && Engine.kaigan.trainCapOVR(fighter) <= Engine.kaigan.SEED_MAX_TRAIN_CAP_OVR;
    let roll = null;
    if (eligible) {
      diagnostics.seedEligible++;
      const probeRng = Engine.kaigan._rngFromSnapshot(rng, fighter, 0x4B41);
      roll = Engine.rng.float(probeRng);
    }
    const result = originalAssign.apply(this, arguments);
    if (result && result.kaiganSeed === true && (!fighter || fighter.kaiganSeed !== true)) {
      diagnostics.seedsAssigned++;
      seedRollsById.set(result.id, [...(seedRollsById.get(result.id) || []), roll]);
    }
    return result;
  };
  const originalTryTrigger = Engine.kaigan.tryTrigger;
  Engine.kaigan.tryTrigger = function kaiganCalibrationTryTrigger(state, fighter, context = {}) {
    const age = Number(fighter && fighter.age) || 0;
    const eligible = !!(state && fighter && fighter.kaiganSeed === true && !fighter.kaiganState
      && age >= Engine.kaigan.MIN_AGE && age <= Engine.kaigan.MAX_AGE
      && !context.isFreeAgent && !context.wasInjured
      && Number.isFinite(context.selfOvr) && Number.isFinite(context.opponentOvr)
      && context.opponentOvr - context.selfOvr >= Engine.kaigan.OPPONENT_OVR_GAP
      && (context.won || (Number(context.mq) || 0) >= Engine.kaigan.MQ_GATE));
    if (eligible) diagnostics.eligibleMatchAttempts++;
    return originalTryTrigger.apply(this, arguments);
  };
  const originalApply = Engine.kaigan.applyAwakening;
  Engine.kaigan.applyAwakening = function kaiganCalibrationApply(state, fighter, context) {
    const result = originalApply.apply(this, arguments);
    if (result && result !== fighter && result.kaiganState) {
      observe(deepCopy(state), deepCopy(result));
    }
    return result;
  };
  return { records, diagnostics, capture, get lastSeason() { return lastSeason; } };
})();`;

if (!source.includes(loadMarker)) throw new Error('auto-sim load marker was not found');
source = source.replace(loadMarker, probeInjection);

const tickMarker = 'G = { ...tickResult.state, gameLog: [] };';
const tickInjection = `${tickMarker}
      globalThis.__kaiganCalibrationProbe.capture(G);`;
if (!source.includes(tickMarker)) throw new Error('auto-sim tick marker was not found');
source = source.replace(tickMarker, tickInjection);

const originalLog = console.log;
const originalWarn = console.warn;
const capturedWarnings = [];
console.log = () => {};
console.warn = (...parts) => capturedWarnings.push(parts.join(' '));
try {
  const child = new Module(autoSimPath, module);
  child.filename = autoSimPath;
  child.paths = Module._nodeModulePaths(path.dirname(autoSimPath));
  child._compile(source, autoSimPath);
} finally {
  console.log = originalLog;
  console.warn = originalWarn;
}

const probe = globalThis.__kaiganCalibrationProbe;
const records = [...probe.records.values()].map(record => ({
  ...record,
  excessOverP95: record.industryP95AtMax == null ? null : record.maxOvr - record.industryP95AtMax,
}));
const seed = Number(process.argv[3]) || 0;
const seasons = Number(process.argv[2]) || 0;
const report = {
  seed,
  seasons,
  seedRate: Engine.kaigan.SEED_RATE,
  triggerRate: Engine.kaigan.TRIGGER_RATE,
  observedThroughSeason: probe.lastSeason,
  count: records.length,
  triggerAges: records.map(record => record.triggerAge),
  reachedOvrs: records.map(record => record.maxOvr),
  maxExcessOverP95: records.length ? Math.max(...records.map(record => record.excessOverP95 ?? -Infinity)) : null,
  records,
  diagnostics: probe.diagnostics,
  warnings: capturedWarnings.filter(line => line.includes('[WM Debug]')).length,
  warningSamples: [...new Set(capturedWarnings.filter(line => line.includes('[WM Debug]')))].slice(0, 12),
};

console.log(`KAIGAN_CALIBRATION ${JSON.stringify(report)}`);
