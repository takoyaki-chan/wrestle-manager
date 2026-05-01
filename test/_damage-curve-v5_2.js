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

// simulateMatch の log から phase別 dmg を集計
function profileDamageByPhase(L, R, n, tier) {
  const phaseStats = {
    Opening: { dmgs: [], crits: 0, total: 0 },
    Mid: { dmgs: [], crits: 0, total: 0 },
    End: { dmgs: [], crits: 0, total: 0 },
    Climax: { dmgs: [], crits: 0, total: 0 },
  };
  const turns = [];
  let to = 0;
  for (let i = 0; i < n; i++) {
    const r = Engine.battle.simulateMatch(L, R, Engine.rng.create(i + 1), tier || 1);
    turns.push(r.turns);
    if (r.finishPhase === 'Timeout') to++;
    if (Array.isArray(r.log)) {
      for (const e of r.log) {
        // logエントリは {turn, phase, dmg, isCrit, ...} の形式と仮定
        const ph = e.phase;
        const d = e.dmg;
        if (!ph || typeof d !== 'number' || d <= 0) continue;
        if (!phaseStats[ph]) continue;
        phaseStats[ph].dmgs.push(d);
        phaseStats[ph].total++;
        if (d >= 15) phaseStats[ph].crits++;
      }
    }
  }
  const avg = turns.reduce((a,b)=>a+b, 0) / turns.length;
  let le5 = 0;
  for (const t of turns) if (t <= 5) le5++;
  return { phaseStats, avgT: avg, toRate: to/n*100, le5Rate: le5/n*100 };
}

function summarize(stats, label) {
  if (stats.dmgs.length === 0) return `${label}: (no data)`;
  const sorted = [...stats.dmgs].sort((a,b)=>a-b);
  const avg = sorted.reduce((a,b)=>a+b,0) / sorted.length;
  const median = sorted[Math.floor(sorted.length/2)];
  const max = sorted[sorted.length-1];
  const critRate = stats.total > 0 ? (stats.crits / stats.total * 100) : 0;
  const ge20 = sorted.filter(d => d >= 20).length;
  const ge20Rate = stats.total > 0 ? (ge20 / stats.total * 100) : 0;
  return `${label}: 平均dmg=${avg.toFixed(2)} 中央=${median} 最大=${max} crit率(≥15)=${critRate.toFixed(1)}% 大ダメ率(≥20)=${ge20Rate.toFixed(1)}% (n=${stats.total})`;
}

const N = 2000;
console.log('═══ ダメージカーブ v5.2 プロファイル ═══');
console.log(`サンプル: ${N}試合 / OVR 80互角 / Tier1 通常マッチ\n`);

const r = profileDamageByPhase(mk('A', 80), mk('B', 80), N, 1);

console.log('━━ Phase別ダメージ分布 ━━');
console.log(summarize(r.phaseStats.Opening, 'Opening (T1-4)'));
console.log(summarize(r.phaseStats.Mid,     'Mid     (T5-8)'));
console.log(summarize(r.phaseStats.End,     'End     (T9-12)'));
console.log(summarize(r.phaseStats.Climax,  'Climax  (T13+)'));

console.log('\n━━ 試合長/TO/ヘボ ━━');
console.log(`平均T=${r.avgT.toFixed(2)} TO率=${r.toRate.toFixed(1)}% ヘボ率(≤5T)=${r.le5Rate.toFixed(1)}%`);

console.log('\n━━ Tier2 ビッグマッチ参考 ━━');
const r2 = profileDamageByPhase(mk('A', 80), mk('B', 80), N, 2);
console.log(summarize(r2.phaseStats.Opening, 'Opening (T1-6)'));
console.log(summarize(r2.phaseStats.Mid,     'Mid     (T7-12)'));
console.log(summarize(r2.phaseStats.End,     'End     (T13-18)'));
console.log(summarize(r2.phaseStats.Climax,  'Climax  (T19+)'));
console.log(`平均T=${r2.avgT.toFixed(2)} TO率=${r2.toRate.toFixed(1)}% ヘボ率(≤5T)=${r2.le5Rate.toFixed(1)}%`);

console.log('\n━━ 番狂わせ率参考（OVR差別） ━━');
function quick(L, R, n, tier) {
  let lw = 0, rw = 0;
  for (let i = 0; i < n; i++) {
    const out = Engine.battle.simulateMatch(L, R, Engine.rng.create(i + 1), tier);
    if (out.winner === 'left') lw++; else if (out.winner === 'right') rw++;
  }
  return { rw: rw/n*100 };
}
console.log(`OVR80 vs 60 通常: 下位勝率 ${quick(mk('A',80), mk('B',60), 1000, 1).rw.toFixed(1)}%`);
console.log(`OVR80 vs 60 ビッグ: 下位勝率 ${quick(mk('A',80), mk('B',60), 1000, 2).rw.toFixed(1)}%`);
