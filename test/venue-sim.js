#!/usr/bin/env node
// venue-sim.js — ドーム収益シミュレーション
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('engine.js');

function calcRosterSalaryCost(roster, titles) {
  return roster.reduce((sum, c) => sum + Engine.util.getSalary(c, titles || { world: { championId: null } }), 0);
}

function getSponsor(orgPop) {
  const row = SPONSOR_TABLE.find(r => orgPop >= r.min && orgPop <= r.max);
  return row ? row.val : 0;
}

function getBroadcast(orgPop) {
  const row = BROADCAST_TABLE.find(r => orgPop >= r.min && orgPop <= r.max);
  return row ? row.val : 0;
}

// 疑似GameState
function makeG(orgPop, venueIdx, popScore) {
  return {
    orgPop,
    showVenue: venueIdx,
    roster: [],
    titles: { world: { championId: null } },
    showCard: [],
    attendanceMomentum: 0,
    heatScore: 0,
    rngSeed: 42,
    season: 1, week: 4,
    difficultyMode: 'normal',
  };
}

// ダミーロスター（popScore目安）
function makeRoster(avgOvr, avgPop, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1, name: `選手${i+1}`,
    pw: avgOvr, sp: avgOvr, te: avgOvr, st: avgOvr, mn: avgOvr,
    popularity: avgPop,
    salaryBonus: 0,
    traits: [],
    injury: null,
    isRental: false,
  }));
}

// --- シミュレーション ---
console.log('=== 会場別収益シミュレーション ===\n');

const venueNames = VENUES.map(v => v.name);

// 試算パラメータ
const scenarios = [
  { orgPop: 60, avgOvr: 55, avgPop: 30, rosterCount: 12, label: '序盤  (orgPop=60)' },
  { orgPop: 75, avgOvr: 65, avgPop: 50, rosterCount: 15, label: '中盤  (orgPop=75)' },
  { orgPop: 85, avgOvr: 72, avgPop: 65, rosterCount: 18, label: '中盤+ (orgPop=85)' },
  { orgPop: 95, avgOvr: 80, avgPop: 75, rosterCount: 20, label: '終盤  (orgPop=95)' },
  { orgPop: 100, avgOvr: 85, avgPop: 85, rosterCount: 22, label: '最強  (orgPop=100)' },
];

for (const sc of scenarios) {
  const roster = makeRoster(sc.avgOvr, sc.avgPop, sc.rosterCount);
  const salaryCost = calcRosterSalaryCost(roster, null);
  const popScore = Engine.popularity.calcRosterPopScore(roster);
  const sponsor = getSponsor(sc.orgPop);
  const broadcast = getBroadcast(sc.orgPop);
  const fixedCost = FIXED_COSTS.admin;

  console.log(`\n【${sc.label}】 ロスター${sc.rosterCount}名 OVR=${sc.avgOvr} pop=${sc.avgPop} 人気スコア=${popScore.toFixed(0)}`);
  console.log(`  給与合計: ${salaryCost}万/週  スポンサー: ${sponsor}万  放映権: ${broadcast}万  固定費: ${fixedCost}万`);
  console.log(`  非興行週の純利益: ${sponsor + broadcast - salaryCost - fixedCost}万`);
  console.log('');

  // 各会場
  const G = makeG(sc.orgPop, 0, popScore);
  const header = '  会場          | キャパ  | 入場者  | 稼働率 | チケット | グッズ | 会場費 | 興行純利益 | 週純利益';
  console.log(header);
  console.log('  ' + '-'.repeat(header.length - 2));

  for (let vi = 0; vi < VENUES.length; vi++) {
    const G2 = { ...G, showVenue: vi };
    // mainCardPop: ざっくり想定（OVR×0.8+pop×0.2、上位4人平均）
    const mainCardPop = sc.avgOvr * 0.8 + sc.avgPop * 0.2;
    const attendance = Engine.economy.calcAttendance(G2, vi, mainCardPop, false, false, null);
    const rev = Engine.economy.calcShowRevenue(roster, vi, attendance);
    const showNet = rev.ticketRev + rev.goodsRev - rev.venueCost;
    const weekNet = rev.ticketRev + rev.goodsRev - rev.venueCost + sponsor + broadcast - salaryCost - fixedCost;
    const occPct = Math.round(rev.occupancyRate * 100);
    const v = VENUES[vi];
    const highlight = (vi === 9) ? ' ← ドーム' : '';
    console.log(`  ${v.name.padEnd(7)}      | ${String(v.cap).padStart(5)}   | ${String(attendance).padStart(5)}   | ${String(occPct).padStart(4)}%  | ${String(rev.ticketRev).padStart(6)}万 | ${String(rev.goodsRev).padStart(4)}万 | ${String(rev.venueCost).padStart(4)}万 | ${String(showNet).padStart(8)}万 | ${String(weekNet).padStart(8)}万${highlight}`);
  }
}

// --- ドーム収益率の詳細分析 ---
console.log('\n\n=== ドーム詳細分析: orgPopによる収益推移 ===\n');
console.log('  orgPop | 入場者  | 稼働率 | チケット | グッズ | 会場費 | 興行純利益 | ROI(収入/費用)');
console.log('  ' + '-'.repeat(75));

for (const orgPop of [50, 60, 65, 70, 75, 80, 85, 90, 95, 100]) {
  const roster = makeRoster(70, 60, 18);
  const popScore = Engine.popularity.calcRosterPopScore(roster);
  const G = makeG(orgPop, 9, popScore);
  const mainCardPop = 70 * 0.8 + 60 * 0.2;
  const attendance = Engine.economy.calcAttendance(G, 9, mainCardPop, false, false, null);
  const rev = Engine.economy.calcShowRevenue(roster, 9, attendance);
  const showNet = rev.ticketRev + rev.goodsRev - rev.venueCost;
  const roi = ((rev.ticketRev + rev.goodsRev) / rev.venueCost).toFixed(2);
  const occPct = Math.round(rev.occupancyRate * 100);
  console.log(`  ${String(orgPop).padStart(6)} | ${String(attendance).padStart(5)}   | ${String(occPct).padStart(4)}%  | ${String(rev.ticketRev).padStart(6)}万 | ${String(rev.goodsRev).padStart(4)}万 | ${String(rev.venueCost).padStart(4)}万 | ${String(showNet).padStart(8)}万 | ${roi}x`);
}

// --- アリーナvsドーム 比較 ---
console.log('\n\n=== アリーナ vs ドーム 損益分岐点分析 ===\n');
console.log('  同一orgPopでどちらが有利か（orgPop別）\n');
console.log('  orgPop | アリーナ興行純益 | ドーム興行純益 | ドーム優位額 | ドーム稼働率');
console.log('  ' + '-'.repeat(72));

for (const orgPop of [55, 60, 65, 70, 75, 80, 85, 90, 95, 100]) {
  const roster = makeRoster(70, 60, 18);
  const mainCardPop = 70 * 0.8 + 60 * 0.2;
  const G = makeG(orgPop, 0, 0);

  const attArena = Engine.economy.calcAttendance({ ...G, showVenue: 7 }, 7, mainCardPop, false, false, null);
  const revArena = Engine.economy.calcShowRevenue(roster, 7, attArena);
  const netArena = revArena.ticketRev + revArena.goodsRev - revArena.venueCost;

  const attDome = Engine.economy.calcAttendance({ ...G, showVenue: 9 }, 9, mainCardPop, false, false, null);
  const revDome = Engine.economy.calcShowRevenue(roster, 9, attDome);
  const netDome = revDome.ticketRev + revDome.goodsRev - revDome.venueCost;

  const diff = netDome - netArena;
  const occDome = Math.round(revDome.occupancyRate * 100);
  const mark = diff > 5000 ? ' ⚠️ 圧倒的' : diff > 0 ? ' ✅ 有利' : ' ❌ 不利';
  console.log(`  ${String(orgPop).padStart(6)} | ${String(netArena).padStart(12)}万 | ${String(netDome).padStart(10)}万 | ${String(diff).padStart(8)}万 | ${String(occDome).padStart(5)}%${mark}`);
}

// --- ドーム揺らぎシミュレーション（会場スケール集客揺らぎ） ---
console.log('\n\n=== ドーム揺らぎシミュレーション（±40%揺らぎ） ===\n');
console.log('  orgPop=100, 50回のドーム興行をシミュレーション\n');

{
  const roster = makeRoster(80, 75, 20);
  const mainCardPop = 80 * 0.8 + 75 * 0.2;
  const G = makeG(100, 9, 0);
  const results = [];

  for (let trial = 0; trial < 50; trial++) {
    const rng = Engine.rng.create(42 + trial * 7919);
    const att = Engine.economy.calcAttendance(G, 9, mainCardPop, false, false, rng);
    const rev = Engine.economy.calcShowRevenue(roster, 9, att);
    const net = rev.ticketRev + rev.goodsRev - rev.venueCost;
    const occPct = Math.round(rev.occupancyRate * 100);
    results.push({ trial, att, net, occPct });
  }

  // ソート: 純利益順
  results.sort((a, b) => a.net - b.net);

  const losses = results.filter(r => r.net < 0).length;
  const bigWins = results.filter(r => r.net > 5000).length;
  const avgNet = Math.round(results.reduce((s, r) => s + r.net, 0) / results.length);

  console.log('  試行 | 入場者  | 稼働率 | 興行純利益');
  console.log('  ' + '-'.repeat(42));
  for (const r of results) {
    const mark = r.net < 0 ? ' ❌ 赤字' : r.net > 5000 ? ' 🔥 大当たり' : '';
    console.log(`  #${String(r.trial+1).padStart(2)}  | ${String(r.att).padStart(5)}   | ${String(r.occPct).padStart(4)}%  | ${String(r.net).padStart(8)}万${mark}`);
  }
  console.log(`\n  サマリー: 赤字回数=${losses}/50 (${Math.round(losses/50*100)}%)  大当たり(5000万+)=${bigWins}/50 (${Math.round(bigWins/50*100)}%)  平均純利益=${avgNet}万`);
}

// --- 会場別揺らぎ範囲 ---
console.log('\n\n=== 会場別 揺らぎ範囲一覧 ===\n');
console.log('  会場        | 揺らぎ | 最低倍率 | 最高倍率');
console.log('  ' + '-'.repeat(48));
for (let i = 0; i < VENUES.length; i++) {
  const f = VENUE_FLUCTUATION[i];
  console.log(`  ${VENUES[i].name.padEnd(7)}     | ±${String(Math.round(f*100)).padStart(2)}%   | ×${(1-f).toFixed(2)}    | ×${(1+f).toFixed(2)}`);
}

// --- 給与比較 ---
console.log('\n\n=== 給与カーブ確認 ===\n');
console.log('  OVR | 給与base | +pop30 | +pop50 | +pop70');
console.log('  ' + '-'.repeat(48));
for (const ovr of [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]) {
  const base = Math.round(SALARY_PARAMS.baseA * Math.exp(SALARY_PARAMS.baseB * ovr));
  const pop30 = base + Math.round(SALARY_PARAMS.popMax * Math.pow(30/100, SALARY_PARAMS.popExp));
  const pop50 = base + Math.round(SALARY_PARAMS.popMax * Math.pow(50/100, SALARY_PARAMS.popExp));
  const pop70 = base + Math.round(SALARY_PARAMS.popMax * Math.pow(70/100, SALARY_PARAMS.popExp));
  console.log(`  ${String(ovr).padStart(3)} |  ${String(base).padStart(5)}万 | ${String(pop30).padStart(5)}万 | ${String(pop50).padStart(5)}万 | ${String(pop70).padStart(5)}万`);
}

console.log('\n完了');
