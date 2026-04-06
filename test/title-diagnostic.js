#!/usr/bin/env node
/**
 * タイトル保持者OVR診断スクリプト
 * auto-sim.jsと同じゲームループでAI団体のタイトル状況を追跡
 */
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
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

const SEASONS = parseInt(process.argv[2]) || 50;
const SEED = parseInt(process.argv[3]) || 12345;

// --- auto-simと同じヘルパー ---
function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  return { ...G, debugLog: G.debugLog || [] };
}

function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined' ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4;
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < maxMatches; i += 2) {
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
  if (Engine.events?.resolveChoice) {
    const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
    const r = Engine.events.resolveChoice(G, choice);
    if (r?.state) return r.state;
  }
  const { _pendingChoiceEvent: _, ...c } = G;
  return c;
}
function autoHandleLargeEvent(G, simRng) {
  if (!G._pendingLargeEvent) return G;
  if (Engine.events?.resolveLargeEvent) {
    const r = Engine.events.resolveLargeEvent(G, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (r?.state) return r.state;
  }
  const { _pendingLargeEvent: _, ...c } = G;
  return c;
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
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, 0); // always accept
    state = result.state;
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
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

// --- 統計 ---
const aiTitleChanges = [];
const aiChampSnapshots = [];

let G = initGame(SEED);
let simRng = Engine.rng.create(Engine.rng.derive(SEED, 0xABCD));
let completed = 0;
let iter = 0;
const MAX_ITER = SEASONS * 60;

while (completed < SEASONS && iter < MAX_ITER) {
  iter++;
  try {
    if (G.weekPhase === 'gameover') {
      const newSeed = (SEED * 1103515245 + 12345 + completed) | 0;
      G = initGame(newSeed);
      simRng = Engine.rng.create(Engine.rng.derive(newSeed, 0xABCD));
      continue;
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
      } else {
        G = { ...G, weekPhase: 'manage' };
      }
      delete G._juniorTournamentSelection;
    }
    if (G.weekPhase === 'scoutEvent') { /* skip */ }
    if (G.weekPhase === 'contractNegotiation') {
      G = autoHandleContractNegotiation(G, simRng);
    }

    // 興行
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

    // ★ tickWeek前にAIタイトル状態を記録
    const prevAIChamps = {};
    if (G.aiOrgs) {
      for (const [orgId, org] of Object.entries(G.aiOrgs)) {
        prevAIChamps[orgId] = org.titles?.world?.championId;
      }
    }

    // tickWeek (AI processAIWeek がこの中で実行される)
    const tickResult = Engine.tickWeek(G);
    G = { ...tickResult.state, gameLog: [] };

    // tickWeek後にAIタイトル変動を検出
    if (G.aiOrgs) {
      for (const [orgId, org] of Object.entries(G.aiOrgs)) {
        const newChamp = org.titles?.world?.championId;
        const prevChamp = prevAIChamps[orgId];
        const roster = org.roster || [];

        // 王者スナップショット(毎週)
        if (newChamp) {
          const champ = roster.find(f => f.id === newChamp);
          if (champ) {
            const champOvr = Engine.util.ov(champ);
            const healthy = roster.filter(f => !f.injury);
            const topOvr = healthy.length > 0 ? Math.max(...healthy.map(f => Engine.util.ov(f))) : champOvr;
            aiChampSnapshots.push({ orgId, champOvr, topOvr, gap: topOvr - champOvr, season: G.season, week: G.week });
          }
        }

        // タイトル変動
        if (prevChamp && newChamp && prevChamp !== newChamp) {
          const newC = roster.find(f => f.id === newChamp);
          const prevC = roster.find(f => f.id === prevChamp);
          const healthy = roster.filter(f => !f.injury);
          const topOvr = healthy.length > 0 ? Math.max(...healthy.map(f => Engine.util.ov(f))) : 0;
          aiTitleChanges.push({
            season: G.season, week: G.week, orgId,
            oldChampOvr: prevC ? Engine.util.ov(prevC) : 0,
            newChampOvr: newC ? Engine.util.ov(newC) : 0,
            topOvr,
            gap: topOvr - (newC ? Engine.util.ov(newC) : 0),
          });
        }
      }
    }

    G = clearTransients(G);

    // advanceWeek
    const advResult = Engine.advanceWeek(G);
    G = { ...advResult.state, gameLog: [] };
    G = Engine.validateGameState(G);

    // シーズン遷移検出
    if (!G.offSeason && G.week === 1 && G.season > 1) {
      completed++;
      if (completed % 10 === 0) process.stdout.write(`  ... ${completed}/${SEASONS}\r`);
    }
  } catch (e) {
    console.error(`ERROR S${G?.season}W${G?.week}: ${e.message}`);
    const newSeed = (SEED * 1103515245 + iter) | 0;
    G = initGame(newSeed);
    simRng = Engine.rng.create(Engine.rng.derive(newSeed, 0xABCD));
  }
}

// --- 結果出力 ---
console.log(`\n■ タイトル保持者OVR診断 (${SEASONS}シーズン, seed=${SEED})\n`);

const gaps = aiChampSnapshots.map(s => s.gap);
const avgGap = gaps.length > 0 ? (gaps.reduce((a,b) => a+b, 0) / gaps.length).toFixed(1) : 'N/A';
const gapOver5 = gaps.filter(g => g > 5).length;
const gapOver10 = gaps.filter(g => g > 10).length;
const gapOver15 = gaps.filter(g => g > 15).length;

console.log(`=== AI団体 (全団体合計) ===`);
console.log(`  週次スナップショット数: ${gaps.length}`);
console.log(`  タイトル変動回数: ${aiTitleChanges.length}`);
console.log(`  変動率: ${gaps.length > 0 ? (aiTitleChanges.length / (SEASONS)).toFixed(2) : 'N/A'}/シーズン`);
console.log(`  平均OVRギャップ(トップとの差): ${avgGap}`);
console.log(`  OVRギャップ>5の割合: ${(gapOver5/gaps.length*100).toFixed(1)}% (${gapOver5}/${gaps.length})`);
console.log(`  OVRギャップ>10の割合: ${(gapOver10/gaps.length*100).toFixed(1)}% (${gapOver10}/${gaps.length})`);
console.log(`  OVRギャップ>15の割合: ${(gapOver15/gaps.length*100).toFixed(1)}% (${gapOver15}/${gaps.length})`);

const weakWins = aiTitleChanges.filter(c => c.gap > 5);
const veryWeakWins = aiTitleChanges.filter(c => c.gap > 10);
console.log(`\n  タイトル奪取時OVRギャップ>5: ${weakWins.length}/${aiTitleChanges.length}`);
console.log(`  タイトル奪取時OVRギャップ>10: ${veryWeakWins.length}/${aiTitleChanges.length}`);

if (aiTitleChanges.length > 0) {
  console.log(`\n  --- 全タイトル変動(最初の20件) ---`);
  aiTitleChanges.slice(0, 20).forEach(c => {
    const mark = c.gap > 5 ? ' ⚠️' : '';
    console.log(`    S${c.season}W${c.week} ${c.orgId}: OVR ${c.oldChampOvr}→${c.newChampOvr} (top=${c.topOvr} gap=${c.gap})${mark}`);
  });
}

// 王者OVR分布
const ovrBuckets = {};
aiChampSnapshots.forEach(s => {
  const bucket = Math.floor(s.champOvr / 5) * 5;
  ovrBuckets[bucket] = (ovrBuckets[bucket] || 0) + 1;
});
console.log(`\n  --- 王者OVR分布 ---`);
Object.keys(ovrBuckets).sort((a,b) => a-b).forEach(k => {
  const pct = (ovrBuckets[k] / aiChampSnapshots.length * 100).toFixed(1);
  const bar = '#'.repeat(Math.round(pct));
  console.log(`    OVR ${String(k).padStart(2)}-${String(parseInt(k)+4).padStart(2)}: ${String(ovrBuckets[k]).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
});

console.log('\nResult: DIAGNOSTIC COMPLETE');
