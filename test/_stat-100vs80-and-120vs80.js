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

function mk(name, allBase, opts) {
  opts = opts || {};
  return { id: name, name,
    pw: opts.pw != null ? opts.pw : allBase,
    sp: opts.sp != null ? opts.sp : allBase,
    te: opts.te != null ? opts.te : allBase,
    st: opts.st != null ? opts.st : allBase,
    mn: opts.mn != null ? opts.mn : allBase,
    style: 'Allround', popularity: 50, traits: [], injuryWeeks: 0
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

console.log('═══ 能力値特化勝率シミュレーション (N=5000) ═══\n');

console.log('━━ 試験1: 1能力=100、他=80（特化値+20） vs 全能力=80（基準） ━━');
console.log('─ 通常マッチ ─');
console.log('特化 | 構成               | 特化勝率 | 基準勝率 | 効果 (+pp)');
for (const [k, key] of STATS) {
  const sp = mk(`${k}100`, 80); sp[key] = 100;
  const r = runDist(mk('Base80', 80), sp, N, 1);
  const overallSpec = `${sp.pw}/${sp.sp}/${sp.te}/${sp.st}/${sp.mn}`;
  console.log(`${k}   | ${overallSpec.padEnd(18)} | ${r.r.toFixed(1)}%    | ${r.l.toFixed(1)}%    | +${(r.r - 50).toFixed(1)}pp`);
}
console.log('─ ビッグマッチ ─');
console.log('特化 | 構成               | 特化勝率 | 基準勝率 | 効果 (+pp)');
for (const [k, key] of STATS) {
  const sp = mk(`${k}100`, 80); sp[key] = 100;
  const r = runDist(mk('Base80', 80), sp, N, 2);
  const overallSpec = `${sp.pw}/${sp.sp}/${sp.te}/${sp.st}/${sp.mn}`;
  console.log(`${k}   | ${overallSpec.padEnd(18)} | ${r.r.toFixed(1)}%    | ${r.l.toFixed(1)}%    | +${(r.r - 50).toFixed(1)}pp`);
}

console.log('\n━━ 試験2: 1能力=120、他=80（特化値+40、MN除く4能力のみ） vs 全能力=80（基準） ━━');
console.log('─ 通常マッチ ─');
console.log('特化 | 構成                | 特化勝率 | 基準勝率 | 効果 (+pp)');
for (const [k, key] of STATS) {
  if (k === 'MN') continue;
  const sp = mk(`${k}120`, 80); sp[key] = 120;
  const r = runDist(mk('Base80', 80), sp, N, 1);
  const overallSpec = `${sp.pw}/${sp.sp}/${sp.te}/${sp.st}/${sp.mn}`;
  console.log(`${k}   | ${overallSpec.padEnd(19)} | ${r.r.toFixed(1)}%    | ${r.l.toFixed(1)}%    | +${(r.r - 50).toFixed(1)}pp`);
}
console.log('─ ビッグマッチ ─');
console.log('特化 | 構成                | 特化勝率 | 基準勝率 | 効果 (+pp)');
for (const [k, key] of STATS) {
  if (k === 'MN') continue;
  const sp = mk(`${k}120`, 80); sp[key] = 120;
  const r = runDist(mk('Base80', 80), sp, N, 2);
  const overallSpec = `${sp.pw}/${sp.sp}/${sp.te}/${sp.st}/${sp.mn}`;
  console.log(`${k}   | ${overallSpec.padEnd(19)} | ${r.r.toFixed(1)}%    | ${r.l.toFixed(1)}%    | +${(r.r - 50).toFixed(1)}pp`);
}

console.log('\n━━ 効果率まとめ（特化勝率を100%とした寄与率） ━━');
console.log('1能力=100/他=80（差+20、通常マッチ基準）の効果ランキング:');
const results = [];
for (const [k, key] of STATS) {
  const sp = mk(`${k}100`, 80); sp[key] = 100;
  const r = runDist(mk('Base80', 80), sp, N, 1);
  results.push({ k, rate: r.r });
}
results.sort((a, b) => b.rate - a.rate);
const total = results.reduce((s, x) => s + (x.rate - 50), 0);
results.forEach((x, i) => {
  const share = ((x.rate - 50) / total * 100).toFixed(1);
  console.log(`${i+1}位 ${x.k}: 勝率${x.rate.toFixed(1)}% (寄与+${(x.rate-50).toFixed(1)}pp / シェア${share}%)`);
});

console.log('\n═══ 完了 ═══');
