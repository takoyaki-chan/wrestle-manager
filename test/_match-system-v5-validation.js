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
    pw: opts.pw != null ? opts.pw : ovr, sp: opts.sp != null ? opts.sp : ovr,
    te: opts.te != null ? opts.te : ovr, st: opts.st != null ? opts.st : ovr,
    mn: opts.mn != null ? opts.mn : ovr,
    style: opts.style || 'Allround',
    popularity: opts.popularity != null ? opts.popularity : 50,
    traits: opts.traits || [], injuryWeeks: 0
  };
}

function runDist(L, R, n, tier) {
  const turns = [];
  let lw = 0, rw = 0, to = 0;
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const r = Engine.battle.simulateMatch(L, R, Engine.rng.create(i + 1), tier || 1);
    turns.push(r.turns);
    if (r.winner === 'left') lw++; else if (r.winner === 'right') rw++;
    if (r.finishPhase === 'Timeout') to++;
  }
  for (let i = 0; i < half; i++) {
    const r = Engine.battle.simulateMatch(R, L, Engine.rng.create(half + i + 1), tier || 1);
    turns.push(r.turns);
    if (r.winner === 'left') rw++; else if (r.winner === 'right') lw++;
    if (r.finishPhase === 'Timeout') to++;
  }
  const avg = turns.reduce((a,b)=>a+b,0) / turns.length;
  let le5 = 0;
  for (const t of turns) if (t <= 5) le5++;
  return { lw: lw/n*100, rw: rw/n*100, t: avg, to: to/n*100, le5: le5/n*100 };
}

const N = 5000;

console.log('═══ 戦闘エンジン v5.0 検証 ═══\n');

console.log('━━ 試験1: 番狂わせ率（同pop=50） ━━');
console.log('OVR上位 vs 下位 | 通常 下位勝率 | ビッグ 下位勝率');
for (const [hi, lo] of [[80,80],[80,75],[80,70],[80,65],[80,60],[80,55],[80,50]]) {
  const r1 = runDist(mk('A', hi), mk('B', lo), N, 1);
  const r2 = runDist(mk('A', hi), mk('B', lo), N, 2);
  console.log(`${hi} vs ${lo}     | ${r1.rw.toFixed(1)}%       | ${r2.rw.toFixed(1)}%`);
}

console.log('\n━━ 試験2: 試合長 / TO率 / ヘボ試合率（互角80vs80） ━━');
const eq1 = runDist(mk('A', 80), mk('B', 80), N, 1);
const eq2 = runDist(mk('A', 80), mk('B', 80), N, 2);
console.log(`通常 互角  | 平均T ${eq1.t.toFixed(1)} / TO率 ${eq1.to.toFixed(1)}% / ヘボ率 ${eq1.le5.toFixed(1)}%`);
console.log(`ビッグ 互角| 平均T ${eq2.t.toFixed(1)} / TO率 ${eq2.to.toFixed(1)}% / ヘボ率 ${eq2.le5.toFixed(1)}%`);

console.log('\n━━ 試験3: 能力値貢献度（平均60 vs +30特化） ━━');
const baseline = mk('Base', 60);
const stats = [];
for (const [k, key] of [['PW','pw'],['SP','sp'],['TE','te'],['ST','st'],['MN','mn']]) {
  const sp = mk(`${k}90`, 60); sp[key] = 90;
  const r = runDist(baseline, sp, N, 1);
  console.log(`${k}+30 | 勝率 ${r.rw.toFixed(1)}%`);
  if (k !== 'MN') stats.push(r.rw);
}
const m = stats.reduce((a,b)=>a+b,0) / stats.length;
const sd = Math.sqrt(stats.reduce((s,v)=>s+(v-m)**2,0)/stats.length);
console.log(`PW/SP/TE/ST 標準偏差 ${sd.toFixed(2)}pp`);

console.log('\n━━ 試験4: popularity効果（同OVR=80、pop差別） ━━');
console.log('pop差         | 通常 補正 | ビッグ 補正');
for (const [pa, pb] of [[50,50],[70,30],[80,20],[90,10],[99,1]]) {
  const r1 = runDist(mk('A', 80, { popularity: pa }), mk('B', 80, { popularity: pb }), N, 1);
  const r2 = runDist(mk('A', 80, { popularity: pa }), mk('B', 80, { popularity: pb }), N, 2);
  console.log(`${pa} vs ${pb}      | +${(r1.lw-50).toFixed(1)}pp    | +${(r2.lw-50).toFixed(1)}pp`);
}

console.log('\n━━ 試験5: 互角試合カーブ（OVR差0〜10、ビッグマッチ） ━━');
console.log('OVR上位 vs 下位 | 上位勝率');
for (const lo of [80,79,78,77,76,75,73,70]) {
  const r = runDist(mk('A', 80), mk('B', lo), N, 2);
  console.log(`80 vs ${lo}    | ${r.lw.toFixed(1)}%`);
}

console.log('\n━━ 試験6: 実機シナリオ（ビッグマッチ） ━━');
const scs = [
  { n: 'トップ(80,p90) vs 中堅(60,p40)', L: mk('A', 80, { popularity: 90 }), R: mk('B', 60, { popularity: 40 }) },
  { n: 'エース(80,p99) vs 弱者(60,p20)', L: mk('A', 80, { popularity: 99 }), R: mk('B', 60, { popularity: 20 }) },
  { n: '人気弱者(60,p99) vs 不人気強者(80,p10)', L: mk('A', 60, { popularity: 99 }), R: mk('B', 80, { popularity: 10 }) },
];
for (const s of scs) {
  const r = runDist(s.L, s.R, N, 2);
  console.log(`${s.n.padEnd(40)} | 左勝率 ${r.lw.toFixed(1)}%`);
}

console.log('\n═══ 検証完了 ═══');
