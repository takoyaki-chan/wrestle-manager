#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Economy Balance Check
//  シーズン別の収支推移を計測し、経済バランスの問題を可視化する。
//
//  Usage: node test/economy-check.js [シーズン数] [シード数]
//  Example: node test/economy-check.js 20 5
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');

global.window = { IS_TRIAL: false };

const vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

if (typeof Engine === 'undefined') { console.error('ERROR: Engine not loaded'); process.exit(1); }

const args = process.argv.slice(2);
const targetSeasons = parseInt(args[0], 10) || 20;
const seedCount = parseInt(args[1], 10) || 5;

console.log('=== Economy Balance Check ===');
console.log(`Seasons: ${targetSeasons}, Seeds: ${seedCount}`);
console.log('');

// auto-simと同じヘルパー群
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = (VENUES[venueIdx] || VENUES[0]).maxMatches;
  const isSpecial = G.week % 12 === 0;
  const effectiveMax = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }
  if (G.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(G);
    if (cd.allowed) {
      const champId = G.titles.world.championId;
      const titleMatch = card.find(m => m.left === champId || m.right === champId);
      if (titleMatch) titleMatch.isTitle = true;
    }
  }
  return { ...G, showCard: card, showVenue: venueIdx };
}

function autoHandleChoiceEvent(G, simRng) {
  if (!G._pendingChoiceEvent) return G;
  const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveChoice === 'function') {
    const result = Engine.events.resolveChoice(G, choice);
    if (result && result.state) return result.state;
  }
  const { _pendingChoiceEvent: _, ...clean } = G;
  return clean;
}

function autoHandleLargeEvent(G, simRng) {
  if (!G._pendingLargeEvent) return G;
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveLargeEvent === 'function') {
    const result = Engine.events.resolveLargeEvent(G, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (result && result.state) return result.state;
  }
  const { _pendingLargeEvent: _, ...clean } = G;
  return clean;
}

function autoHandleContractNegotiation(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  const negotiations = G.pendingContractNegotiations || [];
  let state = { ...G };
  for (const neg of negotiations) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    if (neg.attitude === 'sudden_departure') {
      const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, 0);
      state = result.state;
      continue;
    }
    const roll = Engine.rng.float(simRng);
    let choiceIdx, subChoice;
    if (neg.attitude === 'raise') {
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      if (roll < 0.6) { choiceIdx = 0; }
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else { choiceIdx = 2; }
    }
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = result.state;
    if (result.result.escalated) {
      const escNeg = { ...neg, attitude: 'transfer' };
      const escResult = Engine.contract.resolveNegotiation(resolveRng, state, escNeg, 0);
      state = escResult.state;
    }
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
}

function autoHandleScoutEvent(G, simRng) {
  if (G.weekPhase !== 'scoutEvent') return G;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  if (ownCount >= (G.rosterCap || 16)) return G;
  const fa = G.freeAgents || [];
  if (fa.length === 0) return G;
  const shuffled = [...fa].sort(() => Engine.rng.float(simRng) - 0.5);
  const toSign = shuffled.slice(0, Math.min(2, (G.rosterCap || 16) - ownCount));
  let newRoster = [...G.roster];
  let newFA = [...fa];
  for (const f of toSign) {
    const cost = f.assessedValue || 100;
    if (G.funds - cost < 0) continue;
    newRoster.push({ ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance', wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0, injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 }, intensive: false, intensiveWeeks: 0 });
    newFA = newFA.filter(c => c.id !== f.id);
    G = { ...G, funds: G.funds - cost };
  }
  return { ...G, roster: newRoster, freeAgents: newFA };
}

const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
  '_juniorTournamentSelection', '_juniorTournamentResult',
];
function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) { const { [k]: _, ...clean } = s; s = clean; }
  }
  return s;
}

// ══════════════════════════════════════════════════════════════
//  シミュレーション: シーズン別の収支データを蓄積
// ══════════════════════════════════════════════════════════════

function runEconomySim(seed, seasons) {
  let G;
  try { G = Engine.createInitialState(seed, true); G = { ...G, debugLog: G.debugLog || [] }; }
  catch (e) { console.error(`  initGame failed (seed ${seed}): ${e.message}`); return null; }

  const simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  const MAX_ITER = seasons * 60;

  // シーズン単位の累計データ
  const seasonData = [];
  let currentSeasonAccum = {
    season: 1, totalIncome: 0, totalExpense: 0,
    ticketIncome: 0, goodsIncome: 0, mediaIncome: 0, promoIncome: 0, subsidyIncome: 0, otherIncome: 0,
    salaryExpense: 0, venueExpense: 0, coachExpense: 0, fixedExpense: 0,
    showCount: 0, avgAttendance: 0, _attendanceSum: 0,
    orgPop: 0, funds: 0, rosterSize: 0, avgOVR: 0,
  };
  let completed = 0, iter = 0;

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        currentSeasonAccum.orgPop = G.orgPop || 0;
        currentSeasonAccum.funds = G.funds || 0;
        currentSeasonAccum.rosterSize = G.roster ? G.roster.filter(c => !c.isRental).length : 0;
        seasonData.push({ ...currentSeasonAccum, gameover: true });
        return { seasonData, gameover: true, gameoverSeason: G.season };
      }

      // 特殊フェーズ処理
      if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
      if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
      if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
      if (G.weekPhase === 'juniorTournament') {
        const sel = G._juniorTournamentSelection;
        if (sel && !sel.cancelled) {
          const jtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
          const jtResult = Engine.juniorTournament.run(G, sel.participants, jtRng);
          const applied = Engine.juniorTournament.apply(G, jtResult);
          G = { ...applied.state, weekPhase: 'manage' };
        } else { G = { ...G, weekPhase: 'manage' }; }
        delete G._juniorTournamentSelection;
      }
      if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
      if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

      // 興行週
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
        G = autoSetupShowCard(G, simRng);
        if (G.showCard && G.showCard.length > 0) {
          const showResult = Engine.executeShow(G);
          if (showResult && !showResult.error) G = showResult.state;
        }
      }

      G = autoHandleChoiceEvent(G, simRng);
      G = autoHandleLargeEvent(G, simRng);
      G = clearTransients(G);

      // tickWeek — ここでprocessSettlementが実行される
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };

      // 収支データを蓄積
      const wf = G.weeklyFinance;
      if (wf && wf.details) {
        currentSeasonAccum.totalIncome += wf.income || 0;
        currentSeasonAccum.totalExpense += wf.expense || 0;
        for (const d of wf.details) {
          if (d.type === 'income') {
            if (d.category === 'ticket') currentSeasonAccum.ticketIncome += d.val;
            else if (d.category === 'goods') currentSeasonAccum.goodsIncome += d.val;
            else if (d.category === 'media') currentSeasonAccum.mediaIncome += d.val;
            else if (d.category === 'promo') currentSeasonAccum.promoIncome += d.val;
            else if (d.label && d.label.includes('助成金')) currentSeasonAccum.subsidyIncome += d.val;
            else currentSeasonAccum.otherIncome += d.val;
          } else if (d.type === 'expense') {
            const absVal = Math.abs(d.val);
            if (d.label && d.label.includes('給与') && !d.label.includes('コーチ')) currentSeasonAccum.salaryExpense += absVal;
            else if (d.label && d.label.includes('会場')) currentSeasonAccum.venueExpense += absVal;
            else if (d.label && d.label.includes('コーチ')) currentSeasonAccum.coachExpense += absVal;
            else if (d.label && d.label.includes('固定')) currentSeasonAccum.fixedExpense += absVal;
          }
        }
        // チケット収入からattendance抽出
        const ticketDetail = wf.details.find(d => d.label && d.label.includes('チケット'));
        if (ticketDetail) {
          const attMatch = ticketDetail.label.match(/(\d+)人/);
          if (attMatch) {
            currentSeasonAccum._attendanceSum += parseInt(attMatch[1]);
            currentSeasonAccum.showCount++;
          }
        }
      }

      G = clearTransients(G);
      G = { ...G, debugLog: [] };

      // advanceWeek
      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };
      G = Engine.validateGameState(G);
      G = { ...G, debugLog: [] };

      // シーズン遷移検出
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        currentSeasonAccum.orgPop = Math.round((G.orgPop || 0) * 10) / 10;
        currentSeasonAccum.funds = Math.round(G.funds || 0);
        currentSeasonAccum.rosterSize = G.roster ? G.roster.filter(c => !c.isRental).length : 0;
        const ovrs = G.roster ? G.roster.filter(c => !c.isRental).map(c => Engine.util.ov(c)) : [];
        currentSeasonAccum.avgOVR = ovrs.length > 0 ? Math.round(ovrs.reduce((a, b) => a + b, 0) / ovrs.length) : 0;
        currentSeasonAccum.avgAttendance = currentSeasonAccum.showCount > 0 ? Math.round(currentSeasonAccum._attendanceSum / currentSeasonAccum.showCount) : 0;
        delete currentSeasonAccum._attendanceSum;
        seasonData.push({ ...currentSeasonAccum });

        completed++;
        currentSeasonAccum = {
          season: G.season, totalIncome: 0, totalExpense: 0,
          ticketIncome: 0, goodsIncome: 0, mediaIncome: 0, promoIncome: 0, subsidyIncome: 0, otherIncome: 0,
          salaryExpense: 0, venueExpense: 0, coachExpense: 0, fixedExpense: 0,
          showCount: 0, avgAttendance: 0, _attendanceSum: 0,
          orgPop: 0, funds: 0, rosterSize: 0, avgOVR: 0,
        };
      }
    } catch (e) {
      console.error(`  Error at S${G.season}W${G.week}: ${e.message}`);
      return { seasonData, error: e.message };
    }
  }
  return { seasonData };
}

// ══════════════════════════════════════════════════════════════
//  メイン実行
// ══════════════════════════════════════════════════════════════

const allSeasonData = [];
const startTime = Date.now();

for (let i = 0; i < seedCount; i++) {
  const seed = 42 + i * 7919;
  process.stdout.write(`  Seed ${seed} (${i + 1}/${seedCount})...`);
  const result = runEconomySim(seed, targetSeasons);
  if (result) {
    allSeasonData.push(result.seasonData);
    if (result.gameover) {
      console.log(` GAMEOVER at season ${result.gameoverSeason}`);
    } else {
      console.log(` ${result.seasonData.length} seasons OK`);
    }
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

// ══════════════════════════════════════════════════════════════
//  集計 & レポート
// ══════════════════════════════════════════════════════════════

console.log(`\n=== Economy Report (${elapsed}s) ===\n`);

const maxLen = Math.max(...allSeasonData.map(d => d.length));
const avgByseason = [];

for (let s = 0; s < maxLen; s++) {
  const samples = allSeasonData.filter(d => d[s]).map(d => d[s]);
  if (samples.length === 0) continue;
  const avg = (arr, key) => Math.round(arr.reduce((sum, d) => sum + (d[key] || 0), 0) / arr.length);
  avgByseason.push({
    season: s + 1,
    n: samples.length,
    totalIncome: avg(samples, 'totalIncome'),
    totalExpense: avg(samples, 'totalExpense'),
    net: avg(samples, 'totalIncome') - avg(samples, 'totalExpense'),
    ticketIncome: avg(samples, 'ticketIncome'),
    goodsIncome: avg(samples, 'goodsIncome'),
    mediaIncome: avg(samples, 'mediaIncome'),
    promoIncome: avg(samples, 'promoIncome'),
    subsidyIncome: avg(samples, 'subsidyIncome'),
    salaryExpense: avg(samples, 'salaryExpense'),
    venueExpense: avg(samples, 'venueExpense'),
    coachExpense: avg(samples, 'coachExpense'),
    fixedExpense: avg(samples, 'fixedExpense'),
    orgPop: (samples.reduce((sum, d) => sum + (d.orgPop || 0), 0) / samples.length).toFixed(1),
    funds: avg(samples, 'funds'),
    rosterSize: avg(samples, 'rosterSize'),
    avgOVR: avg(samples, 'avgOVR'),
    avgAttendance: avg(samples, 'avgAttendance'),
    showCount: avg(samples, 'showCount'),
    profitRate: 0,
  });
  const last = avgByseason[avgByseason.length - 1];
  last.profitRate = last.totalIncome > 0 ? Math.round((last.net / last.totalIncome) * 100) : 0;
}

// テーブル出力
console.log('Season | orgPop | Funds    | Income   | Expense  | Net      | Profit% | Roster | avgOVR | Attend | Shows');
console.log('-------|--------|----------|----------|----------|----------|---------|--------|--------|--------|------');
for (const row of avgByseason) {
  const pad = (v, w) => String(v).padStart(w);
  console.log(
    `  ${pad(row.season, 3)}  | ${pad(row.orgPop, 5)}  | ${pad(row.funds, 7)}万 | ${pad(row.totalIncome, 7)}万 | ${pad(row.totalExpense, 7)}万 | ${pad(row.net, 7)}万 | ${pad(row.profitRate, 5)}%  | ${pad(row.rosterSize, 5)}  | ${pad(row.avgOVR, 5)}  | ${pad(row.avgAttendance, 5)}  | ${pad(row.showCount, 3)}`
  );
}

// 収入内訳
console.log('\n--- Income Breakdown (Season Average) ---');
console.log('Season | Ticket   | Goods    | Media    | Promo    | Subsidy');
console.log('-------|----------|----------|----------|----------|--------');
for (const row of avgByseason) {
  const pad = (v, w) => String(v).padStart(w);
  console.log(
    `  ${pad(row.season, 3)}  | ${pad(row.ticketIncome, 7)}万 | ${pad(row.goodsIncome, 7)}万 | ${pad(row.mediaIncome, 7)}万 | ${pad(row.promoIncome, 7)}万 | ${pad(row.subsidyIncome, 7)}万`
  );
}

// 支出内訳
console.log('\n--- Expense Breakdown (Season Average) ---');
console.log('Season | Salary   | Venue    | Coach    | Fixed');
console.log('-------|----------|----------|----------|------');
for (const row of avgByseason) {
  const pad = (v, w) => String(v).padStart(w);
  console.log(
    `  ${pad(row.season, 3)}  | ${pad(row.salaryExpense, 7)}万 | ${pad(row.venueExpense, 7)}万 | ${pad(row.coachExpense, 7)}万 | ${pad(row.fixedExpense, 7)}万`
  );
}

// 利益率推移の問題検出
console.log('\n--- Balance Analysis ---');
let issues = [];
for (const row of avgByseason) {
  if (row.profitRate > 50) issues.push(`S${row.season}: 利益率${row.profitRate}% — 金余りすぎ`);
  if (row.profitRate < -10) issues.push(`S${row.season}: 利益率${row.profitRate}% — 赤字危険`);
  if (row.funds > 20000) issues.push(`S${row.season}: 残高${row.funds}万 — 貯金過剰`);
  if (row.funds < 0) issues.push(`S${row.season}: 残高${row.funds}万 — 破産圏`);
}
if (issues.length === 0) {
  console.log('  No major balance issues detected.');
} else {
  issues.forEach(i => console.log(`  ⚠ ${i}`));
}

// 収支構造分析
console.log('\n--- Structural Analysis ---');
if (avgByseason.length >= 3) {
  const early = avgByseason.slice(0, 3);
  const late = avgByseason.slice(-3);
  const avgEarlyProfit = Math.round(early.reduce((s, r) => s + r.profitRate, 0) / early.length);
  const avgLateProfit = Math.round(late.reduce((s, r) => s + r.profitRate, 0) / late.length);
  const earlySalaryRatio = Math.round(early.reduce((s, r) => s + r.salaryExpense, 0) / early.reduce((s, r) => s + r.totalExpense, 0) * 100);
  const lateSalaryRatio = Math.round(late.reduce((s, r) => s + r.salaryExpense, 0) / late.reduce((s, r) => s + r.totalExpense, 0) * 100);
  console.log(`  序盤(S1-3) 平均利益率: ${avgEarlyProfit}%, 給与比率: ${earlySalaryRatio}%`);
  console.log(`  終盤(last3) 平均利益率: ${avgLateProfit}%, 給与比率: ${lateSalaryRatio}%`);

  if (avgByseason.length >= 5) {
    const mid = avgByseason[Math.floor(avgByseason.length / 2)];
    const first = avgByseason[0];
    const orgPopGrowth = first.orgPop > 0 ? (mid.orgPop - first.orgPop) / first.orgPop : 0;
    const incomeGrowth = first.totalIncome > 0 ? (mid.totalIncome - first.totalIncome) / first.totalIncome : 0;
    const expenseGrowth = first.totalExpense > 0 ? (mid.totalExpense - first.totalExpense) / first.totalExpense : 0;
    console.log(`  orgPop成長(S1→mid): +${(orgPopGrowth * 100).toFixed(0)}%`);
    console.log(`  収入成長(S1→mid): +${(incomeGrowth * 100).toFixed(0)}%`);
    console.log(`  支出成長(S1→mid): +${(expenseGrowth * 100).toFixed(0)}%`);
    if (incomeGrowth > expenseGrowth * 1.5) console.log('  → 収入の伸びが支出を大きく上回っている（金余り傾向）');
    if (expenseGrowth > incomeGrowth * 1.5) console.log('  → 支出の伸びが収入を大きく上回っている（カツカツ傾向）');
  }
}

console.log('\nDone.');
