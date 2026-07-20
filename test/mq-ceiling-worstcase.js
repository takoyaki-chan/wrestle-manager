#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js',
].forEach(loadAsGlobal);

const iterations = Math.max(100, Number(process.argv[2]) || 20000);
const baseSeed = Number(process.argv[3]) || 130042;

function percentile(sorted, fraction) {
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

function metric(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  const mean = values.length ? sum / values.length : 0;
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length
    ? (sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2)
    : 0;
  return {
    mean: +mean.toFixed(3),
    median: +median.toFixed(3),
    min: sorted.length ? +sorted[0].toFixed(3) : 0,
    max: sorted.length ? +sorted[sorted.length - 1].toFixed(3) : 0,
    p99: sorted.length ? +percentile(sorted, 0.99).toFixed(3) : 0,
  };
}

function rate(count, total) {
  return +(count / Math.max(1, total) * 100).toFixed(3);
}

function engineRawMq(result) {
  const detail = result.mqDetail || {};
  if (result.matchType === 'tag') {
    return (detail.ceiling || 0) - (detail.dramaPenalty || 0) - (detail.pacingPenalty || 0)
      - (detail.finishPenalty || 0) + (detail.tagBonus || 0) - (detail.tagPenalty || 0);
  }
  return (detail.ceiling || 0) - (detail.dramaPenalty || 0)
    - (detail.pacingPenalty || 0) - (detail.finishPenalty || 0);
}

function summarize(label, samples, pathName) {
  const finals = samples.map(sample => sample.finalMq);
  const unlimited = samples.map(sample => sample.unlimitedMq);
  const overages = samples.map(sample => Math.max(0, sample.finalMq - 100)).filter(value => value > 0);
  const wouldOverages = samples.map(sample => Math.max(0, sample.unlimitedMq - 100)).filter(value => value > 0);
  const capReached = samples.filter(sample => sample.capReached === true);
  const capLosses = samples.map(sample => sample.capLoss || 0).filter(value => value > 0);
  const upperClampLosses = samples.map(sample => sample.upperClampLoss || 0).filter(value => value > 0);
  const engineClampLosses = samples.map(sample => sample.engineClampLoss || 0).filter(value => value > 0);
  const contributionKeys = [
    'engineRawMq', 'engineFinalMq', 'ceiling', 'dramaPenalty', 'pacingPenalty',
    'finishPenalty', 'tagBonus', 'tagPenalty', 'rivalry', 'title', 'crowd',
    'milestoneMqBoost', 'nextMatchMq', 'lastRun', 'freshness', 'trust',
  ];
  const contributions = {};
  for (const key of contributionKeys) contributions[key] = metric(samples.map(sample => sample[key] || 0));
  const maxUnlimitedSample = samples.reduce((best, sample) =>
    !best || sample.unlimitedMq > best.unlimitedMq ? sample : best, null);
  const maxEngineRawSample = samples.reduce((best, sample) =>
    !best || sample.engineRawMq > best.engineRawMq ? sample : best, null);
  return {
    label,
    path: pathName,
    matches: samples.length,
    finalMq: metric(finals),
    unlimitedMq: metric(unlimited),
    finalOver100: {
      count: overages.length,
      pct: rate(overages.length, samples.length),
      overage: metric(overages),
    },
    wouldExceed100WithoutUpperLimit: {
      count: wouldOverages.length,
      pct: rate(wouldOverages.length, samples.length),
      overage: metric(wouldOverages),
    },
    externalCap: {
      applicable: samples.some(sample => sample.capReached != null),
      reached: capReached.length,
      reachedPct: rate(capReached.length, samples.length),
      loss: metric(capLosses),
    },
    upperClamp: {
      applied: upperClampLosses.length,
      appliedPct: rate(upperClampLosses.length, samples.length),
      loss: metric(upperClampLosses),
    },
    tagEngineClamp: {
      applied: engineClampLosses.length,
      appliedPct: rate(engineClampLosses.length, samples.length),
      loss: metric(engineClampLosses),
    },
    climaxFinishPct: rate(samples.filter(sample => sample.finishPhase === 'Climax').length, samples.length),
    maxUnlimitedSample,
    maxEngineRawSample,
    contributions,
  };
}

const initial = Engine.createInitialState(baseSeed, true);
if (!initial.roster || initial.roster.length < 4) throw new Error('At least four roster fighters are required');

function maxFighter(source, rating, lastRun) {
  return {
    ...source,
    pw: rating, sp: rating, te: rating, st: rating, mn: rating,
    popularity: 100, condition: 100, trust: 50, injury: null, isRental: false,
    traits: ['名勝負製造機', '引き出し上手'],
    lastRun: lastRun ? true : null,
  };
}

function scenarioState(config, iteration) {
  const roster = initial.roster.map((fighter, index) =>
    maxFighter(fighter, config.rating, config.lastRun && index === 0));
  const [a, b, c, d] = roster;
  const key = Engine.title.getRivalryKey(a.id, b.id);
  const relationships = {
    ...(initial.relationships || {}),
    [`${a.id}>${b.id}`]: { bond: 100, rivalry: 100 },
    [`${b.id}>${a.id}`]: { bond: 100, rivalry: 100 },
  };
  const main = config.matchType === 'tag'
    ? { matchType: 'tag', teamA: { fighter1: a.id, fighter2: b.id }, teamB: { fighter1: c.id, fighter2: d.id } }
    : { left: a.id, right: b.id, isTitle: true };
  const support = [];
  for (let index = 0; support.length < 7; index++) {
    const left = roster[(index * 2 + 2) % roster.length];
    const right = roster[(index * 2 + 3) % roster.length];
    support.push({ left: left.id, right: right.id, isTitle: false });
  }
  const buffs = [];
  if (config.milestones) {
    buffs.push({ type: 'mq_boost', amount: 3, weeks: 4 });
    buffs.push({ type: 'next_match_mq', amount: 3, weeks: 1, pair: [a.id, b.id] });
  }
  return {
    ...initial,
    rngSeed: Engine.rng.derive(baseSeed, config.seedSalt, iteration),
    season: 10,
    week: 24,
    totalShows: 100,
    orgPop: 100,
    attendanceMomentum: config.forceSellout ? 10 : 0.15,
    roster,
    relationships,
    rivalries: {
      ...(initial.rivalries || {}),
      [key]: { matches: 20, ...(config.resolvedType ? { resolved: config.resolvedType } : {}) },
    },
    titleEstablished: true,
    titles: { ...(initial.titles || {}), world: { championId: a.id, defenses: 10, wonWeek: 1 } },
    lastTitleMatchWeek: null,
    milestoneBuffs: buffs,
    matchupLog: [],
    showVenue: 9,
    showCard: [main, ...support],
    weekPhase: 'manage',
  };
}

function uiReconstruction(result) {
  const inventory = result.mqInventory;
  let value = inventory.baseEngineMq;
  const addUpper = amount => { value = Math.min(100, value + amount); };
  if (inventory.matchType === 'singles') {
    addUpper(inventory.rivalry || 0);
    addUpper(inventory.title || 0);
  }
  value = Engine.util.clamp(value + (inventory.crowd || 0), 5, 100);
  const freshness = inventory.matchType === 'singles' ? (result.freshnessBonus || 0) : 0;
  value = Engine.util.clamp(value + freshness, 5, 100);
  const unlimitedMq = engineRawMq(result) + (inventory.matchType === 'singles'
    ? (inventory.rivalry || 0) + (inventory.title || 0) + freshness
    : 0) + (inventory.crowd || 0);
  const postEngineUnlimitedMq = inventory.baseEngineMq + (inventory.matchType === 'singles'
    ? (inventory.rivalry || 0) + (inventory.title || 0) + freshness
    : 0) + (inventory.crowd || 0);
  return {
    finalMq: value,
    unlimitedMq,
    freshness,
    upperClampLoss: Math.max(0, postEngineUnlimitedMq - value),
  };
}

function sampleFromResult(result, pathName) {
  const inventory = result.mqInventory;
  const detail = result.mqDetail || {};
  const raw = engineRawMq(result);
  const engineClampLoss = result.matchType === 'tag' && raw > 100 + 1e-9 ? raw - 100 : 0;
  const common = {
    engineRawMq: raw,
    engineFinalMq: inventory.baseEngineMq,
    engineClampLoss,
    ceiling: detail.ceiling || 0,
    dramaPenalty: detail.dramaPenalty || 0,
    pacingPenalty: detail.pacingPenalty || 0,
    finishPenalty: detail.finishPenalty || 0,
    tagBonus: detail.tagBonus || 0,
    tagPenalty: detail.tagPenalty || 0,
    rivalry: inventory.rivalry || 0,
    title: inventory.title || 0,
    crowd: inventory.crowd || 0,
    milestoneMqBoost: inventory.milestoneMqBoost || 0,
    nextMatchMq: inventory.nextMatchMq || 0,
    lastRun: inventory.lastRun || 0,
    trust: inventory.trust || 0,
    turns: result.turns || 0,
    finishPhase: result.finishPhase || '',
  };
  if (pathName === 'Engine.executeShow') {
    return {
      ...common,
      freshness: 0,
      finalMq: inventory.finalMq,
      unlimitedMq: raw + inventory.uncappedExternal + (inventory.trust || 0),
      capReached: inventory.cap == null ? null : inventory.capReached,
      capLoss: inventory.capLoss || 0,
      upperClampLoss: 0,
    };
  }
  return {
    ...common,
    ...uiReconstruction(result),
    milestoneMqBoost: 0,
    nextMatchMq: 0,
    lastRun: 0,
    trust: 0,
    capReached: null,
    capLoss: 0,
  };
}

const scenarios = [
  {
    id: 'singles-realistic-95', seedSalt: 9513, matchType: 'singles', rating: 95,
    milestones: false, lastRun: false, forceSellout: false,
    description: 'OVR95, title, maximum ordinary rivalry, top venue/high-popularity full card, first meeting, both MQ traits',
  },
  {
    id: 'singles-max-stack-100', seedSalt: 10013, matchType: 'singles', rating: 100,
    milestones: true, lastRun: true, forceSellout: true,
    description: 'OVR100 plus title/rivalry/forced sellout, both +3 milestone buffs, last-run main event, first meeting, both MQ traits',
  },
  {
    id: 'singles-good-rival-100', seedSalt: 11313, matchType: 'singles', rating: 100,
    milestones: false, lastRun: false, forceSellout: true, resolvedType: 'goodRival',
    description: 'OVR100, resolved good-rival status, title, forced dome sellout, first meeting, both MQ traits',
  },
  {
    id: 'singles-bitter-rival-100', seedSalt: 11313, matchType: 'singles', rating: 100,
    milestones: false, lastRun: false, forceSellout: true, resolvedType: 'bitter',
    description: 'OVR100, resolved bitter-rival status, title, forced dome sellout, first meeting, both MQ traits',
  },
  {
    id: 'tag-max-stack-100', seedSalt: 41313, matchType: 'tag', rating: 100,
    milestones: true, lastRun: true, forceSellout: true,
    description: 'four OVR100 wrestlers, forced dome sellout, last-run main event, Match Maker trait',
  },
];

const output = {
  iterations,
  baseSeed,
  note: 'App path is a disconnected reconstruction of App._finalizeShowImpl ordering; DOM/UI is not executed.',
  externalCap: MQ_EXTERNAL_CAP,
  scenarios: [],
};

for (const config of scenarios) {
  const headless = [];
  const ui = [];
  let crowdMin = Infinity;
  let crowdMax = -Infinity;
  for (let index = 0; index < iterations; index++) {
    const execution = Engine.executeShow(scenarioState(config, index));
    if (!execution || execution.error) throw new Error(`${config.id} failed at ${index}: ${execution?.error || 'unknown error'}`);
    const result = execution.results[0];
    if (!result?.mqInventory) throw new Error(`${config.id} did not return MQ inventory at ${index}`);
    crowdMin = Math.min(crowdMin, result.mqInventory.crowd || 0);
    crowdMax = Math.max(crowdMax, result.mqInventory.crowd || 0);
    headless.push(sampleFromResult(result, 'Engine.executeShow'));
    ui.push(sampleFromResult(result, 'App._finalizeShowImpl reconstruction'));
  }
  output.scenarios.push({
    config,
    observedCrowdBonus: { min: crowdMin, max: crowdMax },
    headless: summarize(config.id, headless, 'Engine.executeShow'),
    ui: summarize(config.id, ui, 'App._finalizeShowImpl reconstruction'),
  });
}

function requireResult(condition, message) {
  if (!condition) throw new Error(`MQ ceiling probe invariant failed: ${message}`);
}

const byId = Object.fromEntries(output.scenarios.map(scenario => [scenario.config.id, scenario]));
const realistic = byId['singles-realistic-95'];
const maximum = byId['singles-max-stack-100'];
const goodRival = byId['singles-good-rival-100'];
const bitterRival = byId['singles-bitter-rival-100'];
const tag = byId['tag-max-stack-100'];
requireResult(realistic.headless.externalCap.reachedPct === 100, 'realistic singles must reach the +12 cap');
requireResult(realistic.headless.finalOver100.count > 0, 'realistic singles must demonstrate final MQ above 100');
requireResult(realistic.ui.upperClamp.applied > 0, 'realistic singles must demonstrate the UI upper clamp');
requireResult(maximum.observedCrowdBonus.min === 6, 'maximum singles must hold the sellout/top-venue +6 bonus');
requireResult(maximum.headless.externalCap.loss.min === 15, 'maximum singles must lose 15 points to the +12 cap');
requireResult(maximum.headless.finalOver100.count > 0, 'maximum singles must demonstrate headless MQ above 100');
requireResult(maximum.ui.finalMq.max === 100 && maximum.ui.upperClamp.applied > 0, 'maximum singles UI path must clamp at 100');
requireResult(goodRival.headless.contributions.rivalry.mean === 2, 'good-rival bonus must be +2');
requireResult(bitterRival.headless.contributions.rivalry.mean === 2, 'bitter-rival bonus must be +2');
requireResult(tag.observedCrowdBonus.min === 6, 'maximum tag match must hold the sellout/top-venue +6 bonus');
requireResult(tag.headless.tagEngineClamp.applied > 0, 'tag engine must demonstrate its internal 100 clamp');
requireResult(tag.headless.finalOver100.count > 0, 'tag headless path must demonstrate final MQ above 100');
requireResult(tag.ui.upperClamp.applied > 0, 'tag UI path must demonstrate its post-engine upper clamp');

console.log(JSON.stringify(output, null, 2));
