#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Growth v2.0 Verification Simulation
//  距離ベース成長(baseLearning=2.0)の検証。実エンジンでフルシミュレーション。
//
//  Usage: node test/growth-v2-verification.js [シーズン数] [シード数]
//  Default: 15シーズン × 5シード
// ══════════════════════════════════════════════════════════════════════════════

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
const targetSeasons = parseInt(args[0], 10) || 15;
const seedCount = parseInt(args[1], 10) || 5;

console.log('=== Growth v2.0 Verification Simulation ===');
console.log(`Seasons: ${targetSeasons}, Seeds: ${seedCount}`);
console.log('');

// ══════════════════════════════════════════════════════════════════════════════
//  ヘルパー群（auto-sim.js / growth-analysis.js から流用）
// ══════════════════════════════════════════════════════════════════════════════

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

function autoHandleContractNegotiation(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  const negotiations = G.pendingContractNegotiations || [];
  let state = { ...G };
  for (const neg of negotiations) {
    const roll = Engine.rng.float(simRng);
    let choiceIdx, subChoice;
    if (neg.attitude === 'raise') {
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      if (roll < 0.6) { choiceIdx = 0; }
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else { choiceIdx = 2; }
    }
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
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

// ══════════════════════════════════════════════════════════════════════════════
//  データ構造
// ══════════════════════════════════════════════════════════════════════════════

// 代表キャラID
const FEATURED_IDS = [1, 37, 4, 56, 46, 78, 24, 80];
const FEATURED_INFO = {
  1:  { name: '阿武隈塔子', reason: '最高potTotal。S級エースの代表' },
  37: { name: '白銀麗子',   reason: 'potTotal2位。エースクラスの成長確認' },
  4:  { name: '高津小春',   reason: '高pot、低めのnotion。ドラフト候補上位帯' },
  56: { name: '片桐ありさ', reason: 'elite帯。中堅上位の代表' },
  46: { name: '井沢遥',     reason: 'elite帯。特性豊富' },
  78: { name: '椿山みさき', reason: 'mid帯。典型的なドラフト候補' },
  24: { name: '園部梨花',   reason: '低帯。成長の下限確認' },
  80: { name: '高島さや',   reason: '極端に低いnotion、中程度のpot。距離ベースで最も恩恵' },
};

// 年齢帯定義
const AGE_BANDS = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

function getAgeBand(age) {
  if (age >= 26) return '26+';
  return String(age);
}

function getAgeBandIdx(age) {
  return Math.min(age - 17, AGE_BANDS.length - 1);
}

// OVR計算
function calcOVR(c) {
  return Math.round((c.pw + c.sp + c.te + c.st + c.mn) / 5);
}

// trainCapベースOVR
function calcTrainCapOVR(c) {
  if (!c.trainCap) return null;
  return Math.round((c.trainCap.pw + c.trainCap.sp + c.trainCap.te + c.trainCap.st + c.trainCap.mn) / 5);
}

// ══════════════════════════════════════════════════════════════════════════════
//  収集用データ構造（シードをまたいで集約）
// ══════════════════════════════════════════════════════════════════════════════

// 1. 年齢別OVR推移: ageOvrBySeasonAndAge[season][ageBand] = [ovr, ovr, ...]
const ageOvrData = []; // per-seed array of seasonSnapshots

// 2. trainCap到達率: 全シード終了時の全ファイターの到達率
const reachRates = [];

// 3. 代表キャラ軌跡: featured[id][seedIdx] = [{season, age, pw, sp, te, st, mn, ovr, bt, slump, slumpWeeks}, ...]
const featuredData = {};
FEATURED_IDS.forEach(id => { featuredData[id] = []; });

// 4. 団体別平均OVR推移: orgOvr[seedIdx][season] = {player, S, A, B}
const orgOvrData = [];

// 5. 成長イベント頻度: per-seed accumulator
const growthEventTotals = {
  breakthroughCount: 0,
  slumpStartCount: 0,
  slumpWeeksTotal: 0,
  slumpResolvedCount: 0,
  motivationLossCount: 0,
  hotStreakCount: 0,
  totalFighterSeasons: 0,
};

// 6. 年齢帯別1シーズン成長量: seasonGrowth[ageBand] = [delta, delta, ...]
const seasonGrowthByAge = {};
AGE_BANDS.forEach(a => { seasonGrowthByAge[a >= 26 ? '26+' : String(a)] = []; });

// ══════════════════════════════════════════════════════════════════════════════
//  シミュレーション本体
// ══════════════════════════════════════════════════════════════════════════════

function getAllFighters(G) {
  const fighters = [];
  // プレイヤーロスター
  G.roster.filter(c => !c.isRental).forEach(c => fighters.push({ ...c, _org: 'player' }));
  // AI団体
  if (G.aiOrgs) {
    ['org_s', 'org_a', 'org_b'].forEach(orgId => {
      const org = G.aiOrgs[orgId];
      if (org && org.roster) {
        const tier = orgId === 'org_s' ? 'S' : orgId === 'org_a' ? 'A' : 'B';
        org.roster.forEach(c => fighters.push({ ...c, _org: tier }));
      }
    });
  }
  return fighters;
}

function runSeed(seed, seasons) {
  let G;
  try {
    G = Engine.createInitialState(seed, true);
    G = { ...G, debugLog: G.debugLog || [] };
  } catch (e) {
    console.error(`  Seed ${seed}: initGame failed - ${e.message}`);
    return null;
  }

  let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));

  // シード固有の収集構造
  const seedAgeOvr = {};       // season → ageBand → [ovr]
  const seedFeatured = {};     // id → [{season, ...}]
  FEATURED_IDS.forEach(id => { seedFeatured[id] = []; });
  const seedOrgOvr = {};       // season → {player, S, A, B}
  let prevOvrByFighter = {};   // id → prevOVR（1シーズン成長量計測用）

  // 成長イベント追跡（per-fighter）
  const eventTracker = {};     // fighterId → {bt, slumpStart, slumpWeeks, motLoss, hotStreak}

  function snapshotSeason(G, season) {
    const allFighters = getAllFighters(G);

    // 1. 年齢別OVR
    seedAgeOvr[season] = {};
    allFighters.forEach(f => {
      const band = getAgeBand(f.age || 17);
      if (!seedAgeOvr[season][band]) seedAgeOvr[season][band] = [];
      seedAgeOvr[season][band].push(calcOVR(f));
    });

    // 3. 代表キャラ軌跡
    FEATURED_IDS.forEach(id => {
      const f = allFighters.find(c => c.id === id);
      if (f) {
        seedFeatured[id].push({
          season, age: f.age || 17,
          pw: f.pw, sp: f.sp, te: f.te, st: f.st, mn: f.mn,
          ovr: calcOVR(f),
          trainCapOvr: calcTrainCapOVR(f),
        });
      }
    });

    // 4. 団体別平均OVR
    const byOrg = { player: [], S: [], A: [], B: [] };
    allFighters.forEach(f => {
      if (byOrg[f._org]) byOrg[f._org].push(calcOVR(f));
    });
    seedOrgOvr[season] = {};
    ['player', 'S', 'A', 'B'].forEach(org => {
      const arr = byOrg[org];
      seedOrgOvr[season][org] = arr.length > 0
        ? +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : 0;
    });

    // 6. 年齢帯別1シーズン成長量
    allFighters.forEach(f => {
      const ovr = calcOVR(f);
      const prevOvr = prevOvrByFighter[f.id];
      if (prevOvr !== undefined && season > 1) {
        const band = getAgeBand(f.age || 17);
        seasonGrowthByAge[band].push(ovr - prevOvr);
      }
      prevOvrByFighter[f.id] = ovr;
    });

    // 5. 成長イベント（careerHistory差分チェック）
    allFighters.forEach(f => {
      if (!eventTracker[f.id]) {
        eventTracker[f.id] = { histLen: 0, inSlump: false, slumpStart: 0 };
      }
      const tracker = eventTracker[f.id];
      const history = f.careerHistory || [];

      // 新しい履歴エントリを走査
      for (let i = tracker.histLen; i < history.length; i++) {
        const entry = history[i];
        if (entry.type === 'breakthrough') growthEventTotals.breakthroughCount++;
        if (entry.type === 'slump_start') {
          growthEventTotals.slumpStartCount++;
          tracker.inSlump = true;
          tracker.slumpStart = entry.week || 0;
        }
        if (entry.type === 'slump_end') {
          growthEventTotals.slumpResolvedCount++;
          if (tracker.inSlump) {
            // detailに「スランプ脱出（N週間）」の形式で入っている
            const dMatch = (entry.detail || '').match(/(\d+)週/);
            const duration = dMatch ? parseInt(dMatch[1], 10) : 0;
            growthEventTotals.slumpWeeksTotal += Math.max(1, duration);
            tracker.inSlump = false;
          }
        }
        if (entry.type === 'motivation_loss_start') growthEventTotals.motivationLossCount++;
      }
      // hotStreak検出（フラグから）
      if (f.hotStreak && !tracker.wasHot) growthEventTotals.hotStreakCount++;
      tracker.wasHot = !!f.hotStreak;
      tracker.histLen = history.length;
    });

    growthEventTotals.totalFighterSeasons += allFighters.length;
  }

  // 初期スナップショット
  const allInit = getAllFighters(G);
  allInit.forEach(f => { prevOvrByFighter[f.id] = calcOVR(f); });
  snapshotSeason(G, 1);

  let completed = 0;
  let iter = 0;
  const MAX_ITER = seasons * 60;

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        console.error(`  Seed ${seed}: GAMEOVER at S${G.season}W${G.week}`);
        break;
      }

      // 特殊フェーズ処理
      if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
      if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
      if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
      if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
      if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

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

      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [], debugLog: [] };
      G = clearTransients(G);

      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [], debugLog: [] };

      // シーズン遷移検出
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        snapshotSeason(G, G.season);
        if (completed % 5 === 0) {
          process.stdout.write(`  Seed ${seed}: ${completed}/${seasons} seasons\r`);
        }
      }
    } catch (e) {
      console.error(`  Seed ${seed}: ERROR S${G.season}W${G.week} - ${e.message}`);
      break;
    }
  }

  // 2. trainCap到達率（シミュレーション終了時）
  const allFinal = getAllFighters(G);
  allFinal.forEach(f => {
    if (!f.trainCap) return;
    const capOvr = calcTrainCapOVR(f);
    if (!capOvr || capOvr === 0) return;
    const ovr = calcOVR(f);
    reachRates.push(Math.round(ovr / capOvr * 100));
  });

  return { seedAgeOvr, seedFeatured, seedOrgOvr };
}

// ══════════════════════════════════════════════════════════════════════════════
//  全シード実行
// ══════════════════════════════════════════════════════════════════════════════

const startTime = Date.now();

for (let i = 0; i < seedCount; i++) {
  const seed = 42 + i * 7919;
  process.stdout.write(`  Running seed ${i + 1}/${seedCount} (${seed})...\r`);
  const result = runSeed(seed, targetSeasons);
  if (result) {
    ageOvrData.push(result.seedAgeOvr);
    FEATURED_IDS.forEach(id => {
      featuredData[id].push(result.seedFeatured[id]);
    });
    orgOvrData.push(result.seedOrgOvr);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nCompleted ${ageOvrData.length} seeds in ${elapsed}s\n`);

// ══════════════════════════════════════════════════════════════════════════════
//  出力
// ══════════════════════════════════════════════════════════════════════════════

function bar(n, maxN, maxLen) {
  const len = maxN > 0 ? Math.round(n / maxN * maxLen) : 0;
  return '█'.repeat(len);
}

// ── 1. 全選手の年齢別OVR推移 ──
console.log('═══════════════════════════════════════════════════════════════');
console.log('  1. 年齢別 平均OVR推移');
console.log('═══════════════════════════════════════════════════════════════');

// シーズン1とシーズン最終の比較
const firstSeason = 1;
const lastSeason = targetSeasons + 1; // season番号はG.season（2がS2）

AGE_BANDS.forEach(a => {
  const band = a >= 26 ? '26+' : String(a);
  // 全シードから集約
  let startOvrs = [];
  let endOvrs = [];
  ageOvrData.forEach(seedData => {
    if (seedData[firstSeason] && seedData[firstSeason][band]) {
      startOvrs.push(...seedData[firstSeason][band]);
    }
    if (seedData[lastSeason] && seedData[lastSeason][band]) {
      endOvrs.push(...seedData[lastSeason][band]);
    }
  });
  const startAvg = startOvrs.length > 0
    ? Math.round(startOvrs.reduce((s, v) => s + v, 0) / startOvrs.length) : '-';
  const endAvg = endOvrs.length > 0
    ? Math.round(endOvrs.reduce((s, v) => s + v, 0) / endOvrs.length) : '-';
  const delta = (typeof startAvg === 'number' && typeof endAvg === 'number')
    ? endAvg - startAvg : 0;
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
  const barStr = bar(Math.max(0, delta), 20, 30);
  const label = `age${band}`.padEnd(6);
  console.log(`${label}: OVR ${String(startAvg).padStart(3)} → ${String(endAvg).padStart(3)} (${deltaStr.padStart(4)})  ${barStr}`);
});

// ── 2. trainCap到達率の分布 ──
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  2. trainCap到達率 分布');
console.log('═══════════════════════════════════════════════════════════════');

const reachBins = [
  { label: ' 0- 50%', min: 0,  max: 50 },
  { label: '51- 60%', min: 51, max: 60 },
  { label: '61- 70%', min: 61, max: 70 },
  { label: '71- 80%', min: 71, max: 80 },
  { label: '81- 90%', min: 81, max: 90 },
  { label: '91-100%', min: 91, max: 100 },
  { label: '101%+  ', min: 101, max: 999 },
];
const maxBinCount = Math.max(1, ...reachBins.map(b =>
  reachRates.filter(r => r >= b.min && r <= b.max).length
));
reachBins.forEach(b => {
  const count = reachRates.filter(r => r >= b.min && r <= b.max).length;
  const barStr = bar(count, maxBinCount, 30);
  console.log(`${b.label}: ${String(count).padStart(4)}名 ${barStr}`);
});
if (reachRates.length > 0) {
  const sorted = [...reachRates].sort((a, b) => a - b);
  const avg = Math.round(reachRates.reduce((s, v) => s + v, 0) / reachRates.length);
  const med = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  console.log(`平均: ${avg}%  中央値: ${med}%  最小: ${min}%  最大: ${max}%`);
}

// ── 3. 代表キャラの成長軌跡 ──
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  3. 代表キャラの成長軌跡（詳細）');
console.log('═══════════════════════════════════════════════════════════════');

FEATURED_IDS.forEach(id => {
  const info = FEATURED_INFO[id];
  const template = ALL_CHARS.find(c => c.id === id);
  const potTotal = template
    ? template.pot.pw + template.pot.sp + template.pot.te + template.pot.st + template.pot.mn
    : '?';

  const allSeeds = featuredData[id]; // array of seed results, each = [{season, age, pw, sp, te, st, mn, ovr, trainCapOvr}, ...]
  if (allSeeds.length === 0 || allSeeds.every(s => s.length === 0)) return;

  // 最もデータが多いシードを代表として使用
  const bestSeed = allSeeds.reduce((best, curr) => curr.length > best.length ? curr : best, allSeeds[0]);
  const trainCapOvr = bestSeed.length > 0 ? bestSeed[0].trainCapOvr : '?';

  console.log('');
  console.log(`${info.name} (pot:${potTotal}, trainCap OVR:${trainCapOvr}) — ${info.reason}`);

  // 代表シードのデータを表示
  bestSeed.forEach(d => {
    console.log(
      `  S${String(d.season).padStart(2)}(age${d.age}):` +
      ` pw:${Math.round(d.pw)} sp:${Math.round(d.sp)}` +
      ` te:${Math.round(d.te)} st:${Math.round(d.st)}` +
      ` mn:${Math.round(d.mn)} → OVR ${d.ovr}`
    );
  });

  // 到達率は全シード平均
  const finalOvrs = allSeeds.map(s => s.length > 0 ? s[s.length - 1].ovr : null).filter(v => v !== null);
  const finalCapOvrs = allSeeds.map(s => s.length > 0 ? s[s.length - 1].trainCapOvr : null).filter(v => v !== null && v > 0);
  if (finalOvrs.length > 0 && finalCapOvrs.length > 0) {
    const avgFinalOvr = finalOvrs.reduce((s, v) => s + v, 0) / finalOvrs.length;
    const avgCap = finalCapOvrs.reduce((s, v) => s + v, 0) / finalCapOvrs.length;
    console.log(`  到達率: ${Math.round(avgFinalOvr / avgCap * 100)}% (${allSeeds.length}シード平均)`);
  }
});

// ── 4. 団体別の平均OVR推移 ──
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  4. 団体別 平均OVR推移');
console.log('═══════════════════════════════════════════════════════════════');
console.log('Season  | Player |  S級  |  A級  |  B級');
console.log('--------+--------+-------+-------+-------');

for (let s = 1; s <= targetSeasons + 1; s++) {
  let pSum = 0, sSum = 0, aSum = 0, bSum = 0, cnt = 0;
  orgOvrData.forEach(seedData => {
    if (seedData[s]) {
      pSum += seedData[s].player;
      sSum += seedData[s].S;
      aSum += seedData[s].A;
      bSum += seedData[s].B;
      cnt++;
    }
  });
  if (cnt === 0) continue;
  console.log(
    `S${String(s).padStart(2)}     |` +
    ` ${(pSum / cnt).toFixed(1).padStart(5)}  |` +
    ` ${(sSum / cnt).toFixed(1).padStart(4)}  |` +
    ` ${(aSum / cnt).toFixed(1).padStart(4)}  |` +
    ` ${(bSum / cnt).toFixed(1).padStart(4)}`
  );
}

// ── 5. 成長イベントの発生頻度 ──
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  5. 成長イベント発生頻度（1シーズン/キャラあたり）');
console.log('═══════════════════════════════════════════════════════════════');

const totalFS = growthEventTotals.totalFighterSeasons || 1;
const btRate = growthEventTotals.breakthroughCount / totalFS;
const slumpRate = growthEventTotals.slumpStartCount / totalFS;
const avgSlumpDuration = growthEventTotals.slumpResolvedCount > 0
  ? (growthEventTotals.slumpWeeksTotal / growthEventTotals.slumpResolvedCount).toFixed(1) : '-';
const motLossRate = growthEventTotals.motivationLossCount / totalFS;
const hotRate = growthEventTotals.hotStreakCount / totalFS;

console.log(`ブレイクスルー:    ${btRate.toFixed(3)}回/シーズン (≒ キャリア10年で${(btRate * 10).toFixed(1)}回)`);
console.log(`スランプ突入:      ${slumpRate.toFixed(3)}回/シーズン`);
console.log(`スランプ平均期間:  ${avgSlumpDuration}週`);
console.log(`モチベ喪失:        ${motLossRate.toFixed(3)}回/シーズン`);
console.log(`絶好調(BT連鎖):    ${hotRate.toFixed(3)}回/シーズン`);

// ── 6. 1シーズンあたりの成長量 ──
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  6. 年齢帯別 1シーズン成長量 (OVR増分)');
console.log('═══════════════════════════════════════════════════════════════');

const growthLabels = {
  '17': '新人期',
  '18': '成長開始',
  '19': '黄金前期',
  '20': '黄金後期',
  '21': '安定期前半',
  '22': '安定期後半',
  '23': '仕上げ前半',
  '24': '仕上げ後半',
  '25': 'ほぼ停止',
  '26+': '成長なし',
};

Object.entries(seasonGrowthByAge).forEach(([band, deltas]) => {
  if (deltas.length === 0) {
    console.log(`age${band.padEnd(3)}: (データなし)`);
    return;
  }
  const avg = +(deltas.reduce((s, v) => s + v, 0) / deltas.length).toFixed(1);
  const sorted = [...deltas].sort((a, b) => a - b);
  const minD = sorted[0];
  const maxD = sorted[sorted.length - 1];
  const label = growthLabels[band] || '';
  const avgStr = avg >= 0 ? `+${avg}` : `${avg}`;
  console.log(`age${band.padEnd(3)}: ${avgStr.padStart(5)} (min:${minD >= 0 ? '+' : ''}${minD}, max:${maxD >= 0 ? '+' : ''}${maxD})   ${label}`);
});

console.log('');
console.log(`=== Done (${elapsed}s) ===`);
