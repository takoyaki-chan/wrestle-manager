#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  vm.runInThisContext(code, { filename });
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');

function mk(name, ovr, opts) {
  opts = opts || {};
  return { id: name, name,
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    style: 'Allround',
    popularity: opts.popularity != null ? opts.popularity : 50,
    traits: [], injuryWeeks: 0
  };
}
function runDist(L, R, n, tier) {
  let lw = 0, rw = 0;
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const r = Engine.battle.simulateMatch(L, R, Engine.rng.create(i + 1), tier || 1);
    if (r.winner === 'left') lw++; else if (r.winner === 'right') rw++;
  }
  for (let i = 0; i < half; i++) {
    const r = Engine.battle.simulateMatch(R, L, Engine.rng.create(half + i + 1), tier || 1);
    if (r.winner === 'left') rw++; else if (r.winner === 'right') lw++;
  }
  return { l: lw/n*100, r: rw/n*100 };
}

const N = 5000;

console.log('═══ pop 90 vs 60（同OVR、N=5000）═══\n');
console.log('OVR | tier  | pop90勝率 | pop60勝率 | 補正');
for (const ovr of [60, 70, 80]) {
  for (const tier of [1, 2]) {
    const A = mk('A', ovr, { popularity: 90 });
    const B = mk('B', ovr, { popularity: 60 });
    const r = runDist(A, B, N, tier);
    const tierLabel = tier === 1 ? '通常' : 'ビッグ';
    console.log(`${ovr}  | ${tierLabel} | ${r.l.toFixed(1)}%    | ${r.r.toFixed(1)}%    | +${(r.l - 50).toFixed(1)}pp`);
  }
}

console.log('\n━━ ST微調整後の能力値貢献度（基準60、+30、通常） ━━');
const STATS = [['PW','pw'],['SP','sp'],['TE','te'],['ST','st'],['MN','mn']];
function mk2(name, ovr, opts) {
  opts = opts || {};
  return { id: name, name,
    pw: opts.pw != null ? opts.pw : ovr,
    sp: opts.sp != null ? opts.sp : ovr,
    te: opts.te != null ? opts.te : ovr,
    st: opts.st != null ? opts.st : ovr,
    mn: opts.mn != null ? opts.mn : ovr,
    style: 'Allround', popularity: 50, traits: [], injuryWeeks: 0
  };
}
for (const [k, key] of STATS) {
  const sp = mk2(`${k}+30`, 60); sp[key] = 90;
  const r = runDist(mk2('Base', 60), sp, N, 1);
  console.log(`${k}+30 | 勝率 ${r.r.toFixed(1)}%`);
}
