#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Growth Balance Analysis
//  プレイヤー vs AI の年次別OVR推移・成長速度を定量分析する。
//
//  Usage: node test/growth-analysis.js
//         node test/growth-analysis.js --full
//         node test/growth-analysis.js [シーズン数] [シード数]
//  Example: node test/growth-analysis.js 15 20
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

if (typeof Engine === 'undefined' || typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: Engine/ALL_CHARS が読み込めませんでした');
  process.exit(1);
}

// ── パラメータ ──
const args = process.argv.slice(2);
const fullMode = args.includes('--full');
const numericArgs = args.filter(arg => /^-?\d+$/.test(arg));
const targetSeasons = parseInt(numericArgs[0], 10) || (fullMode ? 15 : 6);
const seedCount = parseInt(numericArgs[1], 10) || (fullMode ? 10 : 4);

console.log('=== Growth Balance Analysis ===');
console.log(`Mode: ${fullMode ? 'full' : 'quick'}`);
console.log(`Seasons: ${targetSeasons}, Seeds: ${seedCount}`);
console.log('');

// ── transient/イベント処理用ヘルパー（auto-sim.jsから移植） ──
const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
];
function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) { const { [k]: _, ...clean } = s; s = clean; }
  }
  return s;
}

function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined'
    ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4;
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
    newRoster.push({ ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
      wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0, injury: null,
      seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
      intensive: false, intensiveWeeks: 0 });
    newFA = newFA.filter(c => c.id !== f.id);
    G = { ...G, funds: G.funds - cost };
  }
  return { ...G, roster: newRoster, freeAgents: newFA };
}

// ── データ収集 ──
// seasonSnapshots[seedIdx][season] = { player: [...ovr], aiS: [...], aiA: [...], aiB: [...], playerTop5avg, aiTop5avg, ... }
const allSnapshots = [];

function collectSnapshot(G, season) {
  const snap = { season };

  // プレイヤーロスター
  const playerOvrs = G.roster.filter(c => !c.isRental).map(c => Engine.util.ov(c)).sort((a, b) => b - a);
  snap.playerAll = playerOvrs;
  snap.playerAvg = playerOvrs.length ? +(playerOvrs.reduce((s, v) => s + v, 0) / playerOvrs.length).toFixed(1) : 0;
  snap.playerTop5 = playerOvrs.slice(0, 5);
  snap.playerTop5Avg = snap.playerTop5.length ? +(snap.playerTop5.reduce((s, v) => s + v, 0) / snap.playerTop5.length).toFixed(1) : 0;
  snap.playerCount = playerOvrs.length;

  // AI団体（tier別） — G.aiOrgs[orgId].roster 構造
  snap.ai = {};
  const aiOrgList = (typeof Engine.rival !== 'undefined' && typeof Engine.rival.getAllOrgs === 'function')
    ? Engine.rival.getAllOrgs(G.aiOrgs) : [];
  aiOrgList.forEach(org => {
    const ovrs = (org.roster || []).map(c => Engine.util.ov(c)).sort((a, b) => b - a);
    snap.ai[org.tier] = snap.ai[org.tier] || [];
    snap.ai[org.tier].push(...ovrs);
  });

  // 全体ランキング（全選手のOVR）
  const allFighters = [];
  G.roster.filter(c => !c.isRental).forEach(c => allFighters.push({ ovr: Engine.util.ov(c), source: 'player' }));
  aiOrgList.forEach(org => {
    (org.roster || []).forEach(c => allFighters.push({ ovr: Engine.util.ov(c), source: org.tier }));
  });
  allFighters.sort((a, b) => b.ovr - a.ovr);
  snap.globalTop10 = allFighters.slice(0, 10);
  snap.playerInTop10 = allFighters.slice(0, 10).filter(f => f.source === 'player').length;
  snap.playerInTop5 = allFighters.slice(0, 5).filter(f => f.source === 'player').length;

  // AI平均
  const aiAllOvrs = allFighters.filter(f => f.source !== 'player').map(f => f.ovr);
  snap.aiAvg = aiAllOvrs.length ? +(aiAllOvrs.reduce((s, v) => s + v, 0) / aiAllOvrs.length).toFixed(1) : 0;
  snap.aiTop5Avg = aiAllOvrs.length >= 5
    ? +(aiAllOvrs.slice(0, 5).reduce((s, v) => s + v, 0) / 5).toFixed(1) : snap.aiAvg;

  // orgPop
  snap.orgPop = +(G.orgPop || 0).toFixed(1);

  return snap;
}

// ── メインシミュレーション ──
function runAnalysis(seed, seasons) {
  let G;
  try {
    G = Engine.createInitialState(seed, true);
    G = { ...G, debugLog: G.debugLog || [] };
  } catch (e) {
    console.error(`  Seed ${seed}: initGame failed - ${e.message}`);
    return null;
  }

  let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  const snapshots = [];
  let completed = 0;
  let iter = 0;
  const MAX_ITER = seasons * 60;

  // Season 1 開始時点のスナップショット
  snapshots.push(collectSnapshot(G, 1));

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        // 破産→データなしで中断
        console.error(`  Seed ${seed}: GAMEOVER at S${G.season}W${G.week}`);
        return snapshots;
      }

      if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
      if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
      if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
      if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);

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

      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [], debugLog: [] };
      G = clearTransients(G);

      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [], debugLog: [] };

      // シーズン遷移検出
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        snapshots.push(collectSnapshot(G, G.season));
      }
    } catch (e) {
      console.error(`  Seed ${seed}: ERROR S${G.season}W${G.week} - ${e.message}`);
      return snapshots;
    }
  }

  return snapshots;
}

// ── 全シード実行 ──
const startTime = Date.now();
for (let i = 0; i < seedCount; i++) {
  const seed = 42 + i * 7919;
  process.stdout.write(`  Running seed ${i + 1}/${seedCount} (${seed})...\r`);
  const snapshots = runAnalysis(seed, targetSeasons);
  if (snapshots) allSnapshots.push(snapshots);
}
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nCompleted ${allSnapshots.length} seeds in ${elapsed}s\n`);

// ── 集計・レポート ──
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  Season-by-Season OVR Comparison (averaged across all seeds)       ║');
console.log('╠══════╦══════════╦══════════╦══════════╦══════════╦═════╦═════╦══════╣');
console.log('║  S#  ║ Plyr Avg ║ PlyrTop5 ║  AI Avg  ║ AI Top5  ║ T5  ║ T10 ║ Pop  ║');
console.log('╠══════╬══════════╬══════════╬══════════╬══════════╬═════╬═════╬══════╣');

for (let s = 0; s <= targetSeasons; s++) {
  let pAvg = 0, pTop5 = 0, aAvg = 0, aTop5 = 0, inTop5 = 0, inTop10 = 0, pop = 0;
  let count = 0;
  allSnapshots.forEach(snapshots => {
    const snap = snapshots[s];
    if (!snap) return;
    pAvg += snap.playerAvg;
    pTop5 += snap.playerTop5Avg;
    aAvg += snap.aiAvg;
    aTop5 += snap.aiTop5Avg;
    inTop5 += snap.playerInTop5;
    inTop10 += snap.playerInTop10;
    pop += snap.orgPop;
    count++;
  });
  if (count === 0) continue;
  const row = [
    `S${String(s + 1).padStart(2)}`,
    (pAvg / count).toFixed(1).padStart(7),
    (pTop5 / count).toFixed(1).padStart(7),
    (aAvg / count).toFixed(1).padStart(7),
    (aTop5 / count).toFixed(1).padStart(7),
    (inTop5 / count).toFixed(1).padStart(3),
    (inTop10 / count).toFixed(1).padStart(3),
    (pop / count).toFixed(0).padStart(4),
  ];
  console.log(`║ ${row[0]} ║ ${row[1]}  ║ ${row[2]}  ║ ${row[3]}  ║ ${row[4]}  ║ ${row[5]} ║ ${row[6]} ║ ${row[7]} ║`);
}
console.log('╚══════╩══════════╩══════════╩══════════╩══════════╩═════╩═════╩══════╝');

// ── 詳細: AI tier別 ──
console.log('\n--- AI Tier-wise Avg OVR by Season ---');
for (let s = 0; s <= targetSeasons; s++) {
  const tierAvgs = { S: [], A: [], B: [] };
  allSnapshots.forEach(snapshots => {
    const snap = snapshots[s];
    if (!snap || !snap.ai) return;
    ['S', 'A', 'B'].forEach(t => {
      if (snap.ai[t] && snap.ai[t].length > 0) {
        tierAvgs[t].push(snap.ai[t].reduce((s, v) => s + v, 0) / snap.ai[t].length);
      }
    });
  });
  const sAvg = tierAvgs.S.length ? (tierAvgs.S.reduce((s, v) => s + v, 0) / tierAvgs.S.length).toFixed(1) : '-';
  const aAvg = tierAvgs.A.length ? (tierAvgs.A.reduce((s, v) => s + v, 0) / tierAvgs.A.length).toFixed(1) : '-';
  const bAvg = tierAvgs.B.length ? (tierAvgs.B.reduce((s, v) => s + v, 0) / tierAvgs.B.length).toFixed(1) : '-';
  console.log(`  S${String(s + 1).padStart(2)}: Tier-S=${sAvg}  Tier-A=${aAvg}  Tier-B=${bAvg}`);
}

// ── ブレークスルー発生率 ──
console.log('\n--- Growth Velocity (Top5 OVR delta per season) ---');
for (let s = 1; s <= targetSeasons; s++) {
  let pDelta = 0, aDelta = 0, count = 0;
  allSnapshots.forEach(snapshots => {
    if (!snapshots[s] || !snapshots[s - 1]) return;
    pDelta += snapshots[s].playerTop5Avg - snapshots[s - 1].playerTop5Avg;
    aDelta += snapshots[s].aiTop5Avg - snapshots[s - 1].aiTop5Avg;
    count++;
  });
  if (count === 0) continue;
  console.log(`  S${s}→S${s + 1}: Player Top5 ${(pDelta / count) >= 0 ? '+' : ''}${(pDelta / count).toFixed(1)}  AI Top5 ${(aDelta / count) >= 0 ? '+' : ''}${(aDelta / count).toFixed(1)}`);
}
