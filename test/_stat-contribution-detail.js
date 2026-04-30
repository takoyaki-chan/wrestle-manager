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
const STATS = [['PW','pw'],['SP','sp'],['TE','te'],['ST','st'],['MN','mn']];
const STYLES = ['Allround','Grappler','Speed','Technique','Striker','Submission','Brawler'];

console.log('═══ 能力値貢献度 詳細シミュレーション ═══\n');

console.log('━━ 試験A: スケーリングカーブ（基準60、+10/+20/+30/+40 特化、Allround） ━━');
console.log('能力値 | +10    | +20    | +30    | +40');
for (const [k, key] of STATS) {
  const row = [];
  for (const delta of [10, 20, 30, 40]) {
    const sp = mk(`${k}+${delta}`, 60); sp[key] = 60 + delta;
    const r = runDist(mk('Base', 60), sp, N, 1);
    row.push(r.r.toFixed(1) + '%');
  }
  console.log(`${k}    | ${row.join(' | ')}`);
}

console.log('\n━━ 試験B: 基準OVR別の +30勝率（基準70/80、Allround） ━━');
console.log('能力値 | 基準60 | 基準70 | 基準80');
for (const [k, key] of STATS) {
  const row = [];
  for (const baseOvr of [60, 70, 80]) {
    const sp = mk(`${k}+30`, baseOvr); sp[key] = baseOvr + 30;
    const r = runDist(mk('Base', baseOvr), sp, N, 1);
    row.push(r.r.toFixed(1) + '%');
  }
  console.log(`${k}    | ${row.join(' | ')}`);
}

console.log('\n━━ 試験C: 通常 vs ビッグマッチ別の +30勝率（基準60） ━━');
console.log('能力値 | 通常    | ビッグ');
for (const [k, key] of STATS) {
  const sp = mk(`${k}+30`, 60); sp[key] = 90;
  const r1 = runDist(mk('Base', 60), sp, N, 1);
  const r2 = runDist(mk('Base', 60), sp, N, 2);
  console.log(`${k}    | ${r1.r.toFixed(1)}% | ${r2.r.toFixed(1)}%`);
}

console.log('\n━━ 試験D: スタイル別の +30勝率（基準60、通常マッチ） ━━');
console.log('Style       | PW   | SP   | TE   | ST   | MN');
for (const style of STYLES) {
  const row = [];
  for (const [k, key] of STATS) {
    const base = mk('Base', 60, { style });
    const sp = mk(`${k}+30`, 60, { style }); sp[key] = 90;
    const r = runDist(base, sp, N, 1);
    row.push(r.r.toFixed(1) + '%');
  }
  console.log(`${style.padEnd(11)} | ${row.join(' | ')}`);
}

console.log('\n━━ 試験E: 1点差貢献（OVR=70 で各能力値+1の勝率寄与） ━━');
console.log('能力値 | +1勝率pt | 解釈');
for (const [k, key] of STATS) {
  const sp = mk(`${k}+1`, 70); sp[key] = 71;
  const r = runDist(mk('Base', 70), sp, N, 1);
  const delta = (r.r - 50);
  console.log(`${k}    | ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}pp  | ${delta > 0.3 ? '影響大' : delta > 0.1 ? '中' : '微小'}`);
}

console.log('\n━━ 試験F: 攻撃寄り(PW/SP) vs 防御寄り(ST/MN) 全振り対決 ━━');
const offFull = mk('Off', 60, { pw: 90, sp: 90, te: 60, st: 60, mn: 60 });
const defFull = mk('Def', 60, { pw: 60, sp: 60, te: 60, st: 90, mn: 90 });
const balanced = mk('Bal', 70);
const r1 = runDist(offFull, defFull, N, 1);
console.log(`攻撃全振り(PW/SP+30) vs 防御全振り(ST/MN+30) | 攻 ${r1.l.toFixed(1)}% / 防 ${r1.r.toFixed(1)}%`);
const r2 = runDist(offFull, balanced, N, 1);
console.log(`攻撃全振り vs バランス70                   | 攻 ${r2.l.toFixed(1)}% / 均 ${r2.r.toFixed(1)}%`);
const r3 = runDist(defFull, balanced, N, 1);
console.log(`防御全振り vs バランス70                   | 防 ${r3.l.toFixed(1)}% / 均 ${r3.r.toFixed(1)}%`);

console.log('\n═══ 完了 ═══');
