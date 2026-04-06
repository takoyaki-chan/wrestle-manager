#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  引き出し率システム検証 Phase 2 — 提案Dプロトタイプ
//
//  全成長パス（practice + match + breakthrough + slump）に品質乗数を適用
//  trainCapベース天井を廃止し「到達可能上限（achievableMax）」ベース天井を使用
//
//  Usage:
//    node test/extraction-rate-phase2.js
//    node test/extraction-rate-phase2.js --full
//    node test/extraction-rate-phase2.js [seeds] [seasons]
//    node test/extraction-rate-phase2.js 10 8
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
const SEED_COUNT = parseInt(numericArgs[0], 10) || (fullMode ? 10 : 2);
const TARGET_SEASONS = parseInt(numericArgs[1], 10) || (fullMode ? 8 : 3);

// ══════════════════════════════════════════════════════════════════════════════
//  才能ティア分類 & 代表選手選出（Phase 1と同一）
// ══════════════════════════════════════════════════════════════════════════════

const charPotData = ALL_CHARS.map(c => {
  const pot = c.pot;
  const potSum = pot.pw + pot.sp + pot.te + pot.st + pot.mn;
  const capOVR = potSum / 5;
  const initOVR = (c.pw + c.sp + c.te + c.st + c.mn) / 5;
  const hasAgeTrait = (c.traits || []).some(t => ['早熟', '晩成', '遅咲き'].includes(t));
  return { id: c.id, name: c.name, potSum, capOVR, initOVR, hasAgeTrait, traits: c.traits || [] };
}).sort((a, b) => b.potSum - a.potSum);

const TIER_REPS = {
  top:    [1, 37, 33, 55, 65],
  upper:  [81, 82, 89, 48, 69],
  middle: [72, 19, 71, 39, 50],
  lower:  [32, 76, 78, 62, 54],
  bottom: [92, 64, 44, 23, 53],
};
const TIER_NAMES = ['top', 'upper', 'middle', 'lower', 'bottom'];
const ALL_TRACKED_IDS = new Set(Object.values(TIER_REPS).flat());

const ORIGINAL_POT = {};
ALL_CHARS.forEach(c => {
  if (ALL_TRACKED_IDS.has(c.id)) {
    ORIGINAL_POT[c.id] = { ...c.pot };
  }
});

// ティア別capOVR平均
const TIER_CAP_OVR = {};
for (const [tier, ids] of Object.entries(TIER_REPS)) {
  TIER_CAP_OVR[tier] = ids.map(id => {
    const d = charPotData.find(c => c.id === id);
    return d ? d.capOVR : 0;
  }).reduce((a, b) => a + b, 0) / 5;
}

// ══════════════════════════════════════════════════════════════════════════════
//  品質レベル
// ══════════════════════════════════════════════════════════════════════════════

const QUALITY_LEVELS = {
  neglect:  0.10,
  normal:   0.45,
  fullcare: 0.84,
  devoted:  0.96,
};

// ══════════════════════════════════════════════════════════════════════════════
//  パラメータセット定義
// ══════════════════════════════════════════════════════════════════════════════

// achievableRatioBase: trainCapをachievableMax近くに引き下げる基本比率
// ceilingBase/Range: 品質による天井調整 (ceiling = trainCap × arb × (cBase + q × cRange))
// speedBase/Range: 全成長パスの速度乗数 (speed = sBase + q × sRange)
// btBase/Range: BT確率乗数
// slumpBase/Range: スランプ確率乗数（高い=スランプしやすい）

// ── Round 3: 速度+イベントがベスト、天井メカニズムは不採用 ──
//
// Round 1 結果: Set A(速度のみ)=8-13差, B(速度+天井)=BROKEN, C(速度+イベント)=11-13差, D(全入り)=BROKEN
// Round 2 結果: Set E(極端速度)=6.5-15.5差(不安定), F(速度+緩天井)=5-9差, G(速度+強イベント)=11-16差(最善), H(3要素)=7-11差
//
// 発見: trainCap天井は逆効果。convergenceRatio=0.15はstat~137で発動するが実キャラは~76前後で停滞。
//        真の天井はageMultiplier(27歳+で0)。天井=成長窓の総成長量。
//        速度乗数は成長窓内の蓄積量を直接変える。イベント(BT/slump)も有効。
//
// Round 3方針:
//   Set G (Round 2最善の参照): 速度0.21-1.35 + BT 0.23-1.56 + slump 3.17-0.73
//   Set I (より広い速度+イベント): 速度0.17-1.43 + BT 0.22-1.85 + slump 3.62-0.81
//   Set J (G + 練習品質ボーナス): Gと同じ + 各練習成長に微量フラット加減算

const PARAM_SETS = {
  G: {
    label: 'Speed + Events (R2 best)',
    achievableRatioBase: null,
    ceilingBase: null, ceilingRange: null,
    speedBase: 0.05, speedRange: 1.55,       // neglect=0.21, fullcare=1.35
    btBase: 0.05, btRange: 1.80,             // neglect=0.23, fullcare=1.56
    slumpBase: 3.50, slumpRange: -3.30,      // neglect=3.17, fullcare=0.73
    flatBase: null, flatRange: null,
  },
  I: {
    label: 'Wider Speed + Stronger Events',
    achievableRatioBase: null,
    ceilingBase: null, ceilingRange: null,
    speedBase: 0.00, speedRange: 1.70,       // neglect=0.17, fullcare=1.43
    btBase: 0.00, btRange: 2.20,             // neglect=0.22, fullcare=1.85
    slumpBase: 4.00, slumpRange: -3.80,      // neglect=3.62, fullcare=0.81
    flatBase: null, flatRange: null,
  },
  J: {
    label: 'G + Practice Quality Bonus',
    achievableRatioBase: null,
    ceilingBase: null, ceilingRange: null,
    speedBase: 0.05, speedRange: 1.55,       // neglect=0.21, fullcare=1.35
    btBase: 0.05, btRange: 1.80,             // neglect=0.23, fullcare=1.56
    slumpBase: 3.50, slumpRange: -3.30,      // neglect=3.17, fullcare=0.73
    flatBase: -0.01, flatRange: 0.02,        // neglect=-0.008, fullcare=+0.007 per calcGrowth
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  ゲームループ用ヘルパー（auto-sim.jsから移植）
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

// ══════════════════════════════════════════════════════════════════════════════
//  キャラクター追跡
// ══════════════════════════════════════════════════════════════════════════════

function findChar(G, charId) {
  let c = G.roster.find(c => c.id === charId);
  if (c) return { char: c, location: 'player' };
  for (const [orgId, org] of Object.entries(G.aiOrgs || {})) {
    c = (org.roster || []).find(c => c.id === charId);
    if (c) return { char: c, location: `ai:${org.tier}` };
  }
  c = (G.freeAgents || []).find(c => c.id === charId);
  if (c) return { char: c, location: 'fa' };
  return null;
}

function collectCharSnapshot(G) {
  const snap = {};
  for (const charId of ALL_TRACKED_IDS) {
    const found = findChar(G, charId);
    if (!found) { snap[charId] = { retired: true }; continue; }
    const c = found.char;
    const origPot = ORIGINAL_POT[charId];
    const ovr = (c.pw + c.sp + c.te + c.st + c.mn) / 5;
    const capOVR = origPot ? (origPot.pw + origPot.sp + origPot.te + origPot.st + origPot.mn) / 5 : ovr;
    snap[charId] = {
      ovr: +ovr.toFixed(1),
      age: c.age || (17 + (c.careerSeasons || 0)),
      location: found.location,
      retired: false,
    };
  }
  return snap;
}

// ══════════════════════════════════════════════════════════════════════════════
//  パッチシステム
// ══════════════════════════════════════════════════════════════════════════════

// 元の関数を保存
const ORIGINALS = {
  calcGrowth: Engine.growth.calcGrowth,
  calcBreakthroughProb: Engine.growthEvents.calcBreakthroughProb,
  checkSlump: Engine.growthEvents.checkSlump,
  matchGrowthBase: GROWTH_CONFIG.matchGrowthBase,
};

function applyPatches(quality, params) {
  const speedMul = params.speedBase != null
    ? params.speedBase + quality * params.speedRange : 1.0;
  const btMul = params.btBase != null
    ? params.btBase + quality * params.btRange : 1.0;
  const slumpMul = params.slumpBase != null
    ? params.slumpBase + quality * params.slumpRange : 1.0;
  const flatBonus = params.flatBase != null
    ? params.flatBase + quality * params.flatRange : 0;

  // (1) Practice growth speed multiplier + optional flat bonus
  Engine.growth.calcGrowth = function(rng, G, char, stat, overrideCoachMul) {
    const result = ORIGINALS.calcGrowth.call(this, rng, G, char, stat, overrideCoachMul);
    if (result <= 0) return 0;  // ageMultiplierが0なら成長なし
    return Math.max(0, Math.round((result * speedMul + flatBonus) * 10) / 10);
  };

  // (2) Match growth speed multiplier (via matchGrowthBase)
  GROWTH_CONFIG.matchGrowthBase = ORIGINALS.matchGrowthBase * speedMul;

  // (3) Breakthrough probability multiplier
  Engine.growthEvents.calcBreakthroughProb = function(fighter, mq, oppOvr, context) {
    const prob = ORIGINALS.calcBreakthroughProb.call(this, fighter, mq, oppOvr, context);
    return prob * btMul;
  };

  // (4) Slump probability multiplier
  Engine.growthEvents.checkSlump = function(rng, fighter, trigger) {
    if (fighter.hotStreak || fighter.slump || fighter.motivationLoss) return false;
    const probTable = {
      injury_moderate_recovery: 0.03 * slumpMul,
      injury_severe_recovery:   0.05 * slumpMul,
      defeat:                   0.008 * slumpMul,
      penalty_end:              0.02 * slumpMul,
    };
    const prob = probTable[trigger] || 0;
    return prob > 0 && Engine.rng.float(rng) < prob;
  };
}

function removePatches() {
  Engine.growth.calcGrowth = ORIGINALS.calcGrowth;
  Engine.growthEvents.calcBreakthroughProb = ORIGINALS.calcBreakthroughProb;
  Engine.growthEvents.checkSlump = ORIGINALS.checkSlump;
  GROWTH_CONFIG.matchGrowthBase = ORIGINALS.matchGrowthBase;
}

function modifyTrainCaps(G, params, quality) {
  if (params.achievableRatioBase == null) return G;

  const arb = params.achievableRatioBase;
  const ceilingMul = params.ceilingBase + quality * params.ceilingRange;
  const totalMul = arb * ceilingMul;

  const modifyPots = (roster) => roster.map(c => {
    const nc = { ...c };
    if (nc.pot) {
      nc.pot = {};
      for (const s of ['pw', 'sp', 'te', 'st', 'mn']) {
        nc.pot[s] = Math.round((c.pot[s] || 100) * totalMul);
      }
    }
    if (nc.trainCap) {
      nc.trainCap = {};
      for (const s of ['pw', 'sp', 'te', 'st', 'mn']) {
        nc.trainCap[s] = Math.round((c.trainCap[s] || 100) * totalMul);
      }
    }
    return nc;
  });

  G = { ...G, roster: modifyPots(G.roster) };

  const newAiOrgs = {};
  for (const [orgId, org] of Object.entries(G.aiOrgs || {})) {
    newAiOrgs[orgId] = { ...org, roster: modifyPots(org.roster || []) };
  }
  G = { ...G, aiOrgs: newAiOrgs };

  if (G.freeAgents) {
    G = { ...G, freeAgents: modifyPots(G.freeAgents) };
  }

  return G;
}

// ══════════════════════════════════════════════════════════════════════════════
//  シミュレーション実行
// ══════════════════════════════════════════════════════════════════════════════

function runSim(seed, seasons, G_init) {
  let G = G_init ? { ...G_init } : null;

  if (!G) {
    try {
      G = Engine.createInitialState(seed, true);
      G = { ...G, debugLog: G.debugLog || [] };
    } catch (e) {
      console.error(`  Seed ${seed}: initGame failed - ${e.message}`);
      return null;
    }
  }

  let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  const snapshots = [];
  let completed = 0;
  let iter = 0;
  const MAX_ITER = seasons * 60;

  snapshots.push({ season: 1, chars: collectCharSnapshot(G) });

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') break;

      if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
      if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
      if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
      if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
      if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

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

      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        snapshots.push({ season: G.season, chars: collectCharSnapshot(G) });
      }
    } catch (e) {
      break;
    }
  }
  return snapshots;
}

// ══════════════════════════════════════════════════════════════════════════════
//  テスト実行
// ══════════════════════════════════════════════════════════════════════════════

function runBaseline() {
  console.log('═══ ベースライン計測 ═══');
  const allResults = [];
  const t0 = Date.now();
  for (let i = 0; i < SEED_COUNT; i++) {
    const seed = 42 + i * 7919;
    process.stdout.write(`  Seed ${i + 1}/${SEED_COUNT}...\r`);
    const r = runSim(seed, TARGET_SEASONS);
    if (r) allResults.push(r);
  }
  console.log(`  完了: ${allResults.length} seeds, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return allResults;
}

function runParamSet(paramSetId, params) {
  console.log(`\n═══ パラメータセット ${paramSetId}: ${params.label} ═══`);

  // パラメータ表示
  for (const [qName, qVal] of Object.entries(QUALITY_LEVELS)) {
    const spd = params.speedBase != null ? (params.speedBase + qVal * params.speedRange).toFixed(2) : '-';
    const ceil = params.ceilingBase != null
      ? (params.achievableRatioBase * (params.ceilingBase + qVal * params.ceilingRange)).toFixed(3) : '-';
    const bt = params.btBase != null ? (params.btBase + qVal * params.btRange).toFixed(2) : '-';
    const slp = params.slumpBase != null ? (params.slumpBase + qVal * params.slumpRange).toFixed(2) : '-';
    const flat = params.flatBase != null ? (params.flatBase + qVal * params.flatRange).toFixed(3) : '-';
    console.log(`  ${qName.padEnd(9)} Q=${qVal}: speed=${spd}  ceil=${ceil}  bt=${bt}  slump=${slp}  flat=${flat}`);
  }

  const qualityResults = {};

  for (const [qName, qValue] of Object.entries(QUALITY_LEVELS)) {
    process.stdout.write(`  ${qName}...\r`);
    applyPatches(qValue, params);

    const allResults = [];
    const t0 = Date.now();

    for (let i = 0; i < SEED_COUNT; i++) {
      const seed = 42 + i * 7919;

      let G;
      try {
        G = Engine.createInitialState(seed, true);
        G = { ...G, debugLog: G.debugLog || [] };
      } catch (e) { continue; }

      // trainCap修正
      G = modifyTrainCaps(G, params, qValue);

      const r = runSim(seed, TARGET_SEASONS, G);
      if (r) allResults.push(r);
    }

    console.log(`  ${qName.padEnd(9)}: ${allResults.length} seeds, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    qualityResults[qName] = allResults;
    removePatches();
  }

  return qualityResults;
}

// ══════════════════════════════════════════════════════════════════════════════
//  集計ヘルパー
// ══════════════════════════════════════════════════════════════════════════════

function aggregateTier(allResults, tierIds, seasonIdx) {
  let ovrSum = 0, count = 0, retiredCount = 0;
  allResults.forEach(snapshots => {
    const snap = snapshots[seasonIdx];
    if (!snap) return;
    tierIds.forEach(charId => {
      const cs = snap.chars[charId];
      if (!cs || cs.retired) { retiredCount++; return; }
      ovrSum += cs.ovr;
      count++;
    });
  });
  if (count === 0) return { avgOVR: '-', count: 0, retired: retiredCount };
  return { avgOVR: +(ovrSum / count).toFixed(1), count, retired: retiredCount };
}

// ══════════════════════════════════════════════════════════════════════════════
//  レポート出力
// ══════════════════════════════════════════════════════════════════════════════

function printOVRTable(label, qualityResults) {
  console.log(`\n--- ${label}: ティア別OVR推移 ---`);

  for (const tier of TIER_NAMES) {
    console.log(`  [${tier}] capOVR=${TIER_CAP_OVR[tier].toFixed(1)}`);
    const header = '  S#  | ' + Object.keys(QUALITY_LEVELS).map(q => q.padEnd(11)).join(' | ');
    console.log(header);
    console.log('  ' + '-'.repeat(header.length - 2));

    for (let s = 0; s <= Math.min(TARGET_SEASONS, 8); s++) {
      const cols = Object.keys(QUALITY_LEVELS).map(qName => {
        const results = qualityResults[qName];
        if (!results) return '     -     ';
        const agg = aggregateTier(results, TIER_REPS[tier], s);
        return agg.count === 0 ? '     -     ' : String(agg.avgOVR).padStart(6);
      });
      console.log(`  S${String(s + 1).padStart(2)} | ${cols.join('     | ')}`);
    }
  }
}

function printDiffTable(label, qualityResults) {
  const s7Idx = Math.min(6, TARGET_SEASONS);
  console.log(`\n--- ${label}: 放置vs全力 OVR差 (S${s7Idx + 1}) ---`);
  console.log(`  目標: 15前後\n`);

  for (const tier of TIER_NAMES) {
    const nOVR = qualityResults.neglect ? aggregateTier(qualityResults.neglect, TIER_REPS[tier], s7Idx).avgOVR : '-';
    const fOVR = qualityResults.fullcare ? aggregateTier(qualityResults.fullcare, TIER_REPS[tier], s7Idx).avgOVR : '-';
    if (nOVR === '-' || fOVR === '-') {
      console.log(`  ${tier}: データなし`);
    } else {
      const diff = fOVR - nOVR;
      const v = diff >= 13 && diff <= 17 ? '✓OK' : (diff < 13 ? '▼小' : '▲大');
      console.log(`  ${tier.padEnd(8)}: 放置=${nOVR}  全力=${fOVR}  差=${diff.toFixed(1).padStart(5)}  ${v}`);
    }
  }
}

function printReversalMatrix(label, qualityResults) {
  const s7Idx = Math.min(6, TARGET_SEASONS);
  console.log(`\n--- ${label}: 逆転マトリクス (S${s7Idx + 1}) ---`);
  console.log('  行=全力側, 列=放置側. 正=全力側が上回る. ★=逆転 ☆=接近(±3以内)\n');

  // ヘッダー
  console.log('  全力側＼放置 | ' + TIER_NAMES.map(t => t.padEnd(8)).join('  '));
  console.log('  ' + '-'.repeat(68));

  const fc = qualityResults.fullcare;
  const ng = qualityResults.neglect;
  if (!fc || !ng) { console.log('  データなし'); return; }

  for (const myTier of TIER_NAMES) {
    const myOVR = aggregateTier(fc, TIER_REPS[myTier], s7Idx).avgOVR;
    const cols = TIER_NAMES.map(oppTier => {
      const oppOVR = aggregateTier(ng, TIER_REPS[oppTier], s7Idx).avgOVR;
      if (myOVR === '-' || oppOVR === '-') return '    -   ';
      const diff = myOVR - oppOVR;
      const marker = diff > 3 ? '★' : (diff > -3 ? '☆' : '  ');
      return `${(diff >= 0 ? '+' : '') + diff.toFixed(1).padStart(5)}${marker}`;
    });
    console.log(`  ${myTier.padEnd(13)}| ${cols.join('  ')}`);
  }

  // ワンランク逆転・2ランク逆転チェック
  console.log('\n  [逆転判定]');
  const tierPairs1 = [['upper', 'top'], ['middle', 'upper'], ['lower', 'middle'], ['bottom', 'lower']];
  const tierPairs2 = [['middle', 'top'], ['lower', 'upper'], ['bottom', 'middle']];

  console.log('  ◆ ワンランク逆転（全力 vs 1つ上の放置）:');
  for (const [myTier, oppTier] of tierPairs1) {
    const myOVR = aggregateTier(fc, TIER_REPS[myTier], s7Idx).avgOVR;
    const oppOVR = aggregateTier(ng, TIER_REPS[oppTier], s7Idx).avgOVR;
    if (myOVR === '-' || oppOVR === '-') continue;
    const diff = myOVR - oppOVR;
    const v = diff > 0 ? '★成立' : (diff > -3 ? '☆接近' : '✕不成立');
    console.log(`    ${myTier}全力(${myOVR}) vs ${oppTier}放置(${oppOVR}) = ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} ${v}`);
  }

  console.log('  ◆ 2ランク逆転（全力 vs 2つ上の放置）:');
  for (const [myTier, oppTier] of tierPairs2) {
    const myOVR = aggregateTier(fc, TIER_REPS[myTier], s7Idx).avgOVR;
    const oppOVR = aggregateTier(ng, TIER_REPS[oppTier], s7Idx).avgOVR;
    if (myOVR === '-' || oppOVR === '-') continue;
    const diff = myOVR - oppOVR;
    const v = diff > 0 ? '★逆転!' : (diff > -3 ? '☆接近' : '✕不成立');
    console.log(`    ${myTier}全力(${myOVR}) vs ${oppTier}放置(${oppOVR}) = ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} ${v}`);
  }
}

function printSummaryComparison(allParamResults, baselineResults) {
  const s7Idx = Math.min(6, TARGET_SEASONS);

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                パラメータセット横断比較 (S7時点)                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // 放置vs全力OVR差
  console.log(`\n--- 放置 vs 全力 OVR差 ---`);
  const setIds = Object.keys(allParamResults);
  console.log(`  ${'ティア'.padEnd(8)} | 現行     | ${setIds.map(id => `Set${id}`.padStart(6)).join(' | ')}`);
  console.log(`  ${'-'.repeat(8)}-|-${'-'.repeat(8)}-|-${setIds.map(() => '-'.repeat(6)).join('-|-')}`);

  for (const tier of TIER_NAMES) {
    const baseOVR = aggregateTier(baselineResults, TIER_REPS[tier], s7Idx).avgOVR;
    const diffs = setIds.map(id => {
      const er = allParamResults[id];
      if (!er || !er.neglect || !er.fullcare) return '   -  ';
      const nOVR = aggregateTier(er.neglect, TIER_REPS[tier], s7Idx).avgOVR;
      const fOVR = aggregateTier(er.fullcare, TIER_REPS[tier], s7Idx).avgOVR;
      if (nOVR === '-' || fOVR === '-') return '   -  ';
      return (fOVR - nOVR).toFixed(1).padStart(6);
    });
    console.log(`  ${tier.padEnd(8)} | ${String(baseOVR).padStart(6)}   | ${diffs.join(' | ')}`);
  }

  // 全力OVR
  console.log(`\n--- 全力 OVR ---`);
  console.log(`  ${'ティア'.padEnd(8)} | 現行     | ${setIds.map(id => `Set${id}`.padStart(6)).join(' | ')}`);
  console.log(`  ${'-'.repeat(8)}-|-${'-'.repeat(8)}-|-${setIds.map(() => '-'.repeat(6)).join('-|-')}`);

  for (const tier of TIER_NAMES) {
    const baseOVR = aggregateTier(baselineResults, TIER_REPS[tier], s7Idx).avgOVR;
    const ovrVals = setIds.map(id => {
      const er = allParamResults[id];
      if (!er || !er.fullcare) return '   -  ';
      const fOVR = aggregateTier(er.fullcare, TIER_REPS[tier], s7Idx).avgOVR;
      return fOVR === '-' ? '   -  ' : String(fOVR).padStart(6);
    });
    console.log(`  ${tier.padEnd(8)} | ${String(baseOVR).padStart(6)}   | ${ovrVals.join(' | ')}`);
  }

  // ワンランク逆転サマリー
  console.log(`\n--- ワンランク逆転 (下位全力 vs 上位放置) ---`);
  for (const id of setIds) {
    const er = allParamResults[id];
    if (!er || !er.fullcare || !er.neglect) { console.log(`  Set${id}: データなし`); continue; }
    const lowerFull = aggregateTier(er.fullcare, TIER_REPS.lower, s7Idx).avgOVR;
    const upperNeglect = aggregateTier(er.neglect, TIER_REPS.upper, s7Idx).avgOVR;
    if (lowerFull === '-' || upperNeglect === '-') { console.log(`  Set${id}: データなし`); continue; }
    const diff = lowerFull - upperNeglect;
    const v = diff > 0 ? '★成立' : (diff > -3 ? '☆接近' : '✕不成立');
    console.log(`  Set${id}: 下位全力=${lowerFull}  上位放置=${upperNeglect}  差=${diff >= 0 ? '+' : ''}${diff.toFixed(1)}  ${v}`);
  }

  // 2ランク逆転サマリー
  console.log(`\n--- 2ランク逆転 (下位全力 vs 最強放置) ---`);
  for (const id of setIds) {
    const er = allParamResults[id];
    if (!er || !er.fullcare || !er.neglect) continue;
    const lowerFull = aggregateTier(er.fullcare, TIER_REPS.lower, s7Idx).avgOVR;
    const topNeglect = aggregateTier(er.neglect, TIER_REPS.top, s7Idx).avgOVR;
    if (lowerFull === '-' || topNeglect === '-') continue;
    const diff = lowerFull - topNeglect;
    const v = diff > 0 ? '★逆転!' : (diff > -3 ? '☆接近' : '✕不成立');
    console.log(`  Set${id}: 下位全力=${lowerFull}  最強放置=${topNeglect}  差=${diff >= 0 ? '+' : ''}${diff.toFixed(1)}  ${v}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  メイン実行
// ══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════');
console.log('  引き出し率システム — Phase 2 検証');
console.log(`  Seeds: ${SEED_COUNT}  Seasons: ${TARGET_SEASONS}`);
console.log('══════════════════════════════════════════════════════════════');

// ティア情報
console.log('\n── 代表選手一覧 ──');
for (const [tier, ids] of Object.entries(TIER_REPS)) {
  const chars = ids.map(id => {
    const d = charPotData.find(c => c.id === id);
    return d ? `${d.name}(pot${d.potSum})` : `ID${id}`;
  });
  console.log(`  ${tier}: ${chars.join(', ')}`);
}

// Step 1: ベースライン
const baselineResults = runBaseline();

// ベースラインOVR推移
console.log('\n--- ベースライン: ティア別OVR推移 ---');
for (const tier of TIER_NAMES) {
  const ovrs = [];
  for (let s = 0; s <= Math.min(TARGET_SEASONS, 8); s++) {
    const agg = aggregateTier(baselineResults, TIER_REPS[tier], s);
    ovrs.push(agg.avgOVR);
  }
  console.log(`  ${tier.padEnd(8)}: ${ovrs.map(v => String(v).padStart(5)).join(' → ')}`);
}

// Step 2: 各パラメータセットテスト
const allParamResults = {};

for (const [setId, params] of Object.entries(PARAM_SETS)) {
  const qr = runParamSet(setId, params);
  allParamResults[setId] = qr;

  printOVRTable(`Set ${setId}: ${params.label}`, qr);
  printDiffTable(`Set ${setId}: ${params.label}`, qr);
  printReversalMatrix(`Set ${setId}: ${params.label}`, qr);
}

// Step 3: 横断比較
printSummaryComparison(allParamResults, baselineResults);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  Phase 2 検証完了');
console.log('══════════════════════════════════════════════════════════════');
