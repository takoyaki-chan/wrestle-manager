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

for (const filename of ['victory-lines.js', 'data.js', 'management.js', 'match-engine.js', 'relationships.js']) {
  loadAsGlobal(filename);
}

const iterations = Number(process.argv[2]) || 5000;

function fighter(id, name, stats, traits) {
  return {
    id, name, surname: name, style: 'Allround', role: 'Neutral', condition: 80,
    pw: stats.pw, sp: stats.sp, te: stats.te, st: stats.st, mn: stats.mn,
    traits: traits || [], personality: 'normal', archetype: 'normal',
  };
}

function metric(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    mean: +mean.toFixed(3),
    median: +median.toFixed(3),
    stddev: +Math.sqrt(variance).toFixed(3),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function runSinglesPair(label, leftStats, rightStats, trait, tier) {
  const mqWithout = [], mqWith = [], delta = [];
  const dramaWithout = [], dramaWith = [], pacingWithout = [], pacingWith = [];
  let changed = 0;
  for (let i = 0; i < iterations; i++) {
    const seed = 0x510000 + i;
    const leftWithout = fighter(9001, 'Left', leftStats, []);
    const leftWith = fighter(9001, 'Left', leftStats, [trait]);
    const right = fighter(9002, 'Right', rightStats, []);
    const without = Engine.battle.simulateMatch(leftWithout, right, Engine.rng.create(seed), tier);
    const withTrait = Engine.battle.simulateMatch(leftWith, right, Engine.rng.create(seed), tier);
    mqWithout.push(without.mq); mqWith.push(withTrait.mq);
    dramaWithout.push(without.mqDetail.dramaPenalty); dramaWith.push(withTrait.mqDetail.dramaPenalty);
    pacingWithout.push(without.mqDetail.pacingPenalty); pacingWith.push(withTrait.mqDetail.pacingPenalty);
    delta.push(withTrait.mq - without.mq);
    if (withTrait.mq !== without.mq) changed++;
  }
  return {
    label, trait, tier, iterations,
    mqWithout: metric(mqWithout), mqWith: metric(mqWith), delta: metric(delta),
    mqChangedPct: +(changed / iterations * 100).toFixed(2),
    dramaWithout: metric(dramaWithout), dramaWith: metric(dramaWith),
    pacingWithout: metric(pacingWithout), pacingWith: metric(pacingWith),
  };
}

const even = { pw: 65, sp: 65, te: 65, st: 65, mn: 65 };
const stronger = { pw: 80, sp: 80, te: 80, st: 80, mn: 80 };
const weaker = { pw: 45, sp: 45, te: 45, st: 45, mn: 45 };
const reports = [
  runSinglesPair('even-normal', even, even, '名勝負製造機', 1),
  runSinglesPair('ov-gap-normal', stronger, weaker, '引き出し上手', 1),
  runSinglesPair('ov-gap-big', stronger, weaker, '引き出し上手', 2),
];

console.log(`MQ trait paired probe (${iterations} seeds per case)`);
for (const report of reports) console.log(JSON.stringify(report));
