#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  引き出し率システム検証スクリプト
//
//  Step 1: 現行エンジンのベースライン成長実測
//  Step 2: 引き出し率プロトタイプの品質別成長実測
//  Step 3: 比較レポート出力
//
//  Usage:
//    node test/extraction-rate-verify.js [seeds] [seasons]
//    node test/extraction-rate-verify.js 20 12
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
loadAsGlobal('engine.js');

if (typeof Engine === 'undefined' || typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: Engine/ALL_CHARS が読み込めませんでした');
  process.exit(1);
}

// ── パラメータ ──
const args = process.argv.slice(2);
const SEED_COUNT = parseInt(args[0], 10) || 20;
const TARGET_SEASONS = parseInt(args[1], 10) || 12;

// ══════════════════════════════════════════════════════════════════════════════
//  才能ティア分類 & 代表選手選出
// ══════════════════════════════════════════════════════════════════════════════

// 全キャラのpotSum(=trainCap合計)を計算
const charPotData = ALL_CHARS.map(c => {
  const pot = c.pot;
  const potSum = pot.pw + pot.sp + pot.te + pot.st + pot.mn;
  const capOVR = potSum / 5;
  const initOVR = (c.pw + c.sp + c.te + c.st + c.mn) / 5;
  const hasAgeTrait = (c.traits || []).some(t => ['早熟', '晩成', '遅咲き'].includes(t));
  return { id: c.id, name: c.name, potSum, capOVR, initOVR, hasAgeTrait, traits: c.traits || [] };
}).sort((a, b) => b.potSum - a.potSum);

// ティア代表選手（年齢特性なしを優先選出）
const TIER_REPS = {
  top:    [1, 37, 33, 55, 65],     // potSum: 820, 819, 800, 781, 801
  upper:  [81, 82, 89, 48, 69],    // potSum: 772, 762, 754, 752, 739
  middle: [72, 19, 71, 39, 50],    // potSum: 728, 720, 717, 712, 706
  lower:  [32, 76, 78, 62, 54],    // potSum: 702, 689, 688, 680, 667
  bottom: [92, 64, 44, 23, 53],    // potSum: 655, 641, 606, 596, 652
};

const ALL_TRACKED_IDS = new Set(Object.values(TIER_REPS).flat());

// 各キャラの元trainCap(pot)を保存
const ORIGINAL_POT = {};
ALL_CHARS.forEach(c => {
  if (ALL_TRACKED_IDS.has(c.id)) {
    ORIGINAL_POT[c.id] = { ...c.pot };
  }
});

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
  return null; // retired
}

function collectCharSnapshot(G) {
  const snap = {};
  for (const charId of ALL_TRACKED_IDS) {
    const found = findChar(G, charId);
    if (!found) {
      snap[charId] = { retired: true };
      continue;
    }
    const c = found.char;
    const origPot = ORIGINAL_POT[charId];
    const ovr = (c.pw + c.sp + c.te + c.st + c.mn) / 5;
    const capOVR = (origPot.pw + origPot.sp + origPot.te + origPot.st + origPot.mn) / 5;
    // mn doesn't grow, so growable cap = (sum of pw/sp/te/st caps + mn_current) / 5
    const growableCapOVR = (origPot.pw + origPot.sp + origPot.te + origPot.st + c.mn) / 5;
    snap[charId] = {
      ovr: +ovr.toFixed(1),
      pw: c.pw, sp: c.sp, te: c.te, st: c.st, mn: c.mn,
      age: c.age || (17 + (c.careerSeasons || 0)),
      location: found.location,
      condition: c.condition,
      injury: !!c.injury,
      slump: !!c.slump,
      hotStreak: !!c.hotStreak,
      breakthrough: !!c.breakthroughThisSeason,
      reachRatio: +(ovr / capOVR * 100).toFixed(1),
      growableReachRatio: +(ovr / growableCapOVR * 100).toFixed(1),
      retired: false,
    };
  }
  return snap;
}

// ══════════════════════════════════════════════════════════════════════════════
//  シミュレーションコア
// ══════════════════════════════════════════════════════════════════════════════

function runSim(seed, seasons) {
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

  // S1開始時スナップショット
  snapshots.push({ season: 1, chars: collectCharSnapshot(G) });

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        console.error(`  Seed ${seed}: GAMEOVER at S${G.season}W${G.week}`);
        return snapshots;
      }

      // 特殊フェーズ処理
      if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
      if (G.weekPhase === 'ppvShow') G = { ...G, ppvPhase: 'tv' };
      if (G.weekPhase === 'ppvTV') G = { ...G, ppvPhase: null };
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

      // transient消化
      G = autoHandleChoiceEvent(G, simRng);
      G = autoHandleLargeEvent(G, simRng);
      G = clearTransients(G);

      // tickWeek
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [], debugLog: [] };
      G = clearTransients(G);

      // advanceWeek
      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [], debugLog: [] };

      // シーズン遷移
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        snapshots.push({ season: G.season, chars: collectCharSnapshot(G) });
        if (completed % 4 === 0) {
          process.stdout.write(`    S${completed}/${seasons}\r`);
        }
      }
    } catch (e) {
      console.error(`  Seed ${seed}: ERROR S${G.season}W${G.week} - ${e.message}`);
      return snapshots;
    }
  }
  return snapshots;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Step 1: ベースライン計測
// ══════════════════════════════════════════════════════════════════════════════

function runBaseline() {
  console.log('═══ Step 1: 現行エンジン ベースライン成長計測 ═══');
  console.log(`Seeds: ${SEED_COUNT}, Seasons: ${TARGET_SEASONS}\n`);

  const allResults = [];
  const startTime = Date.now();

  for (let i = 0; i < SEED_COUNT; i++) {
    const seed = 42 + i * 7919;
    process.stdout.write(`  Seed ${i + 1}/${SEED_COUNT} (${seed})...\r`);
    const result = runSim(seed, TARGET_SEASONS);
    if (result) allResults.push(result);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  完了: ${allResults.length} seeds, ${elapsed}s\n`);
  return allResults;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Step 2: 引き出し率プロトタイプ検証
// ══════════════════════════════════════════════════════════════════════════════

const QUALITY_LEVELS = {
  neglect:  0.10,  // 放置
  normal:   0.45,  // 普通
  fullcare: 0.84,  // 全力
  devoted:  0.96,  // 溺愛
};

// GSBの候補値
const GSB_VALUES = [8.0, 10.0, 12.0];

function applyExtractionRatePatch(quality) {
  const ceilingMul = 0.75 + quality * 0.20;
  const speedMul = 0.85 + quality * 0.30;

  // calcGrowthをオーバーライド
  const originalCalcGrowth = Engine.growth._originalCalcGrowth || Engine.growth.calcGrowth;
  if (!Engine.growth._originalCalcGrowth) {
    Engine.growth._originalCalcGrowth = originalCalcGrowth;
  }

  Engine.growth.calcGrowth = function(rng, G, char, stat, overrideCoachMul) {
    if (stat === 'mn') return 0;
    const current = char[stat];

    // 元のtrainCapから有効天井を計算
    const origTrainCap = char.trainCap ? char.trainCap[stat] : (char.pot[stat] || current);
    const effectiveCap = Math.round(origTrainCap * ceilingMul);
    if (current >= effectiveCap) return 0;

    // char.trainCap/potを一時的に差し替え
    const savedTrainCap = char.trainCap;
    const savedPot = char.pot;

    // effectiveCap版のtrainCap/potを作成
    const makeCapped = (orig) => {
      if (!orig) return null;
      const capped = {};
      for (const s of ['pw', 'sp', 'te', 'st', 'mn']) {
        capped[s] = Math.round((orig[s] || 100) * ceilingMul);
      }
      return capped;
    };

    if (char.trainCap) char.trainCap = makeCapped(char.trainCap);
    if (char.pot) char.pot = makeCapped(char.pot);

    // 元の関数を呼ぶ
    const rawResult = originalCalcGrowth.call(this, rng, G, char, stat, overrideCoachMul);

    // 復元
    char.trainCap = savedTrainCap;
    char.pot = savedPot;

    // speed multiplier適用
    const adjusted = Math.round(rawResult * speedMul * 10) / 10;

    // effectiveCapでクランプ
    return Math.min(adjusted, Math.max(0, effectiveCap - current));
  };
}

function applyExtractionRateToMatchGrowth(quality) {
  // 試合成長にも有効天井を適用するために、processAIWeekとexecuteShowの
  // 試合成長パスにもキャップを適用する。
  // 最もクリーンな方法: 全キャラのtrainCap/potに有効天井を書き込む

  // 注: calcGrowthパッチが試合中成長パスにも影響する場合はこの関数は不要
  // 試合成長はcalcGrowth経由ではないので、別途キャラデータを変更する
  const ceilingMul = 0.75 + quality * 0.20;

  // このアプローチ: 試合成長後のstat上限をeffectiveCapに制限
  // engine.js内でstat更新後に `Math.min(trainCap, stat + growth)` が使われるため
  // trainCap自体を変更すれば自然にキャップされる
  // ただし元のtrainCapを失わないよう、_originalPotフィールドに退避する

  return { ceilingMul }; // 情報のみ返す（実際のキャップはcollectCharSnapshotで考慮）
}

function removeExtractionRatePatch() {
  if (Engine.growth._originalCalcGrowth) {
    Engine.growth.calcGrowth = Engine.growth._originalCalcGrowth;
    delete Engine.growth._originalCalcGrowth;
  }
}

function runExtractionTest(gsbValue) {
  console.log(`\n═══ Step 2: 引き出し率プロトタイプ検証 (GSB=${gsbValue}) ═══\n`);

  // GROWTH_SEASON_BASEを変更
  const originalGSB = GROWTH_SEASON_BASE;
  // グローバル変数の書き換え（vm.runInThisContextでvarとして展開済み）
  global.GROWTH_SEASON_BASE = gsbValue;
  // data.js内のGROWTH_SEASON_BASEを上書き
  GROWTH_SEASON_BASE = gsbValue;

  const qualityResults = {};

  for (const [qName, qValue] of Object.entries(QUALITY_LEVELS)) {
    console.log(`  品質: ${qName} (Q=${qValue})`);

    applyExtractionRatePatch(qValue);
    const matchInfo = applyExtractionRateToMatchGrowth(qValue);

    const allResults = [];
    const startTime = Date.now();

    for (let i = 0; i < SEED_COUNT; i++) {
      const seed = 42 + i * 7919;
      process.stdout.write(`    Seed ${i + 1}/${SEED_COUNT}...\r`);

      // ゲーム初期化後にキャラの trainCap を effectiveCap に変更
      let G;
      try {
        G = Engine.createInitialState(seed, true);
        G = { ...G, debugLog: G.debugLog || [] };
      } catch (e) {
        console.error(`    Seed ${seed}: initGame failed - ${e.message}`);
        continue;
      }

      // 全キャラのtrainCap/potをeffectiveCapに変更（試合成長キャップ用）
      const ceilingMul = matchInfo.ceilingMul;
      const modifyPots = (roster) => roster.map(c => {
        const nc = { ...c };
        if (nc.pot) {
          nc._originalPot = nc.pot;
          nc.pot = {};
          for (const s of ['pw', 'sp', 'te', 'st', 'mn']) {
            nc.pot[s] = Math.round(nc._originalPot[s] * ceilingMul);
          }
        }
        if (nc.trainCap) {
          nc._originalTrainCap = nc.trainCap;
          nc.trainCap = {};
          for (const s of ['pw', 'sp', 'te', 'st', 'mn']) {
            nc.trainCap[s] = Math.round(nc._originalTrainCap[s] * ceilingMul);
          }
        }
        return nc;
      });

      G = { ...G, roster: modifyPots(G.roster) };

      // AI団体のロスターも変更
      const newAiOrgs = {};
      for (const [orgId, org] of Object.entries(G.aiOrgs || {})) {
        newAiOrgs[orgId] = { ...org, roster: modifyPots(org.roster || []) };
      }
      G = { ...G, aiOrgs: newAiOrgs };

      // FAも変更
      if (G.freeAgents) {
        G = { ...G, freeAgents: modifyPots(G.freeAgents) };
      }

      // シミュレーション実行
      let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
      const snapshots = [];
      let completed = 0;
      let iter = 0;
      const MAX_ITER = TARGET_SEASONS * 60;

      snapshots.push({ season: 1, chars: collectCharSnapshot(G) });

      while (completed < TARGET_SEASONS && iter < MAX_ITER) {
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
          // エラー時は途中結果を使う
          break;
        }
      }

      if (snapshots.length > 0) allResults.push(snapshots);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`    完了: ${allResults.length} seeds, ${elapsed}s`);

    qualityResults[qName] = allResults;

    removeExtractionRatePatch();
  }

  // GSBを復元
  GROWTH_SEASON_BASE = originalGSB;

  return qualityResults;
}

// ══════════════════════════════════════════════════════════════════════════════
//  集計ヘルパー
// ══════════════════════════════════════════════════════════════════════════════

function aggregateTier(allResults, tierIds, seasonIdx) {
  let ovrSum = 0, reachSum = 0, count = 0, retiredCount = 0;
  let ageSum = 0;

  allResults.forEach(snapshots => {
    const snap = snapshots[seasonIdx];
    if (!snap) return;
    tierIds.forEach(charId => {
      const charSnap = snap.chars[charId];
      if (!charSnap || charSnap.retired) { retiredCount++; return; }
      ovrSum += charSnap.ovr;
      reachSum += charSnap.reachRatio;
      ageSum += charSnap.age;
      count++;
    });
  });

  if (count === 0) return { avgOVR: '-', avgReach: '-', retired: retiredCount, count: 0, avgAge: '-' };
  return {
    avgOVR: +(ovrSum / count).toFixed(1),
    avgReach: +(reachSum / count).toFixed(1),
    avgAge: +(ageSum / count).toFixed(1),
    retired: retiredCount,
    count,
  };
}

function findReachSeason(allResults, tierIds, threshold = 95) {
  // 有効天井の95%に到達するシーズンを探す
  for (let s = 0; s < TARGET_SEASONS + 1; s++) {
    const agg = aggregateTier(allResults, tierIds, s);
    if (agg.avgReach !== '-' && agg.avgReach >= threshold) return s + 1; // season number
  }
  return '未到達';
}

// ══════════════════════════════════════════════════════════════════════════════
//  Step 3: レポート出力
// ══════════════════════════════════════════════════════════════════════════════

function printBaselineReport(baselineResults) {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║               現行エンジン: ティア別OVR推移 (平均)                         ║');
  console.log('╠══════╦════════════════╦════════════════╦════════════════╦════════════════╦════════════════╣');
  console.log('║  S#  ║   最強 (top)   ║  上位 (upper)  ║  中央 (mid)    ║  下位 (lower)  ║  最弱 (bottom) ║');
  console.log('╠══════╬════════════════╬════════════════╬════════════════╬════════════════╬════════════════╣');

  const tierNames = ['top', 'upper', 'middle', 'lower', 'bottom'];

  for (let s = 0; s <= TARGET_SEASONS; s++) {
    const cols = tierNames.map(tier => {
      const agg = aggregateTier(baselineResults, TIER_REPS[tier], s);
      if (agg.count === 0) return '     -     ';
      return `${String(agg.avgOVR).padStart(5)} (${String(agg.avgReach).padStart(4)}%)`;
    });
    const sLabel = `S${String(s + 1).padStart(2)}`;
    console.log(`║ ${sLabel} ║ ${cols.map(c => c.padEnd(14)).join(' ║ ')} ║`);
  }
  console.log('╚══════╩════════════════╩════════════════╩════════════════╩════════════════╩════════════════╝');

  // 成長速度
  console.log('\n--- ティア別 年次成長速度 (OVR delta) ---');
  for (let s = 1; s <= Math.min(TARGET_SEASONS, 10); s++) {
    const deltas = tierNames.map(tier => {
      const prev = aggregateTier(baselineResults, TIER_REPS[tier], s - 1);
      const curr = aggregateTier(baselineResults, TIER_REPS[tier], s);
      if (prev.count === 0 || curr.count === 0) return '  -  ';
      const d = curr.avgOVR - prev.avgOVR;
      return (d >= 0 ? '+' : '') + d.toFixed(1);
    });
    console.log(`  S${s}→S${s + 1}: ${tierNames.map((t, i) => `${t}=${deltas[i]}`).join('  ')}`);
  }

  // 到達シーズン
  console.log('\n--- trainCapの95%到達シーズン ---');
  tierNames.forEach(tier => {
    const reachS = findReachSeason(baselineResults, TIER_REPS[tier], 95);
    console.log(`  ${tier}: ${reachS}`);
  });
}

function printExtractionReport(extractionResults, gsbValue) {
  const tierNames = ['top', 'upper', 'middle', 'lower', 'bottom'];
  const qualityNames = Object.keys(QUALITY_LEVELS);

  console.log(`\n╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║       引き出し率モデル: 品質別OVR推移 (GSB=${gsbValue})                     ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝`);

  for (const tier of tierNames) {
    console.log(`\n--- ${tier} ティア (capOVR avg: ${(TIER_REPS[tier].map(id => {
      const d = charPotData.find(c => c.id === id);
      return d ? d.capOVR : 0;
    }).reduce((a, b) => a + b, 0) / 5).toFixed(1)}) ---`);

    console.log('  S#  | 放置(Q=.10)  | 普通(Q=.45)  | 全力(Q=.84)  | 溺愛(Q=.96)');
    console.log('  ----+-------------+-------------+-------------+-------------');

    for (let s = 0; s <= Math.min(TARGET_SEASONS, 10); s++) {
      const cols = qualityNames.map(qName => {
        const results = extractionResults[qName];
        if (!results) return '     -     ';
        const agg = aggregateTier(results, TIER_REPS[tier], s);
        if (agg.count === 0) return '     -     ';
        return `${String(agg.avgOVR).padStart(5)} (${String(agg.avgReach).padStart(4)}%)`;
      });
      console.log(`  S${String(s + 1).padStart(2)} | ${cols.join(' | ')}`);
    }
  }

  // 逆転マトリクス（S7時点）
  const s7Idx = Math.min(6, TARGET_SEASONS);
  console.log(`\n═══ 逆転マトリクス (S${s7Idx + 1}時点, GSB=${gsbValue}) ═══`);
  console.log('行 = 全力育成側のティア, 列 = 各品質の対戦相手ティア');
  console.log('値 = (全力側OVR) - (相手OVR)。正の値=全力側が上回る\n');

  console.log('全力側＼相手 | 最強放置  最強普通  上位放置  上位普通  中央放置  中央普通');
  console.log('-------------|--------- --------- --------- --------- --------- ---------');

  const fullcareResults = extractionResults.fullcare;
  const neglectResults = extractionResults.neglect;
  const normalResults = extractionResults.normal;

  for (const myTier of tierNames) {
    const myOVR = fullcareResults ? aggregateTier(fullcareResults, TIER_REPS[myTier], s7Idx).avgOVR : '-';
    const opponents = [];
    for (const oppTier of ['top', 'upper', 'middle']) {
      for (const qName of ['neglect', 'normal']) {
        const oppResults = qName === 'neglect' ? neglectResults : normalResults;
        const oppOVR = oppResults ? aggregateTier(oppResults, TIER_REPS[oppTier], s7Idx).avgOVR : '-';
        if (myOVR === '-' || oppOVR === '-') {
          opponents.push('    -   ');
        } else {
          const diff = myOVR - oppOVR;
          const marker = diff > 0 ? '★' : (Math.abs(diff) <= 2 ? '☆' : '  ');
          opponents.push(`${(diff >= 0 ? '+' : '') + diff.toFixed(1).padStart(5)}${marker}`);
        }
      }
    }
    console.log(`  ${myTier.padEnd(11)} | ${opponents.join('  ')}`);
  }

  // OVR差（放置 vs 全力）
  console.log(`\n--- 放置 vs 全力 OVR差 (S${s7Idx + 1}時点) ---`);
  console.log('  目標: 各ティアで10-12ポイント差\n');
  for (const tier of tierNames) {
    const neglectOVR = neglectResults ? aggregateTier(neglectResults, TIER_REPS[tier], s7Idx).avgOVR : '-';
    const fullcareOVR = fullcareResults ? aggregateTier(fullcareResults, TIER_REPS[tier], s7Idx).avgOVR : '-';
    if (neglectOVR === '-' || fullcareOVR === '-') {
      console.log(`  ${tier}: データなし`);
    } else {
      const diff = fullcareOVR - neglectOVR;
      const verdict = diff >= 10 && diff <= 12 ? '✓ 目標範囲内' : (diff < 10 ? '▼ 差が小さい' : '▲ 差が大きい');
      console.log(`  ${tier}: 放置=${neglectOVR}  全力=${fullcareOVR}  差=${diff.toFixed(1)}  ${verdict}`);
    }
  }

  // 到達シーズン（全力）
  console.log('\n--- 全力育成(Q=0.84)の有効天井95%到達シーズン ---');
  console.log('  目標: S5中頃〜S7\n');
  for (const tier of tierNames) {
    if (!fullcareResults) { console.log(`  ${tier}: データなし`); continue; }
    // effectiveCapに対する到達率を計算
    const ceilingMul = 0.75 + 0.84 * 0.20; // = 0.918
    for (let s = 0; s <= TARGET_SEASONS; s++) {
      const agg = aggregateTier(fullcareResults, TIER_REPS[tier], s);
      if (agg.count === 0) continue;
      // effectiveCapOVR = originalCapOVR * ceilingMul
      const tierAvgCapOVR = TIER_REPS[tier].map(id => {
        const d = charPotData.find(c => c.id === id);
        return d ? d.capOVR : 0;
      }).reduce((a, b) => a + b, 0) / 5;
      const effectiveCapOVR = tierAvgCapOVR * ceilingMul;
      const reachVsEffective = (agg.avgOVR / effectiveCapOVR) * 100;
      if (reachVsEffective >= 95) {
        const verdict = (s + 1 >= 5 && s + 1 <= 7) ? '✓ 目標範囲内' : ((s + 1 < 5) ? '▼ 早すぎる' : '▲ 遅すぎる');
        console.log(`  ${tier}: S${s + 1}で到達 (OVR ${agg.avgOVR} / 有効天井 ${effectiveCapOVR.toFixed(1)}) ${verdict}`);
        break;
      }
      if (s === TARGET_SEASONS) {
        console.log(`  ${tier}: S${TARGET_SEASONS}でも未到達 (OVR ${agg.avgOVR} / 有効天井 ${effectiveCapOVR.toFixed(1)})`);
      }
    }
  }

  // 放置の到達シーズン
  console.log('\n--- 放置(Q=0.10)の有効天井95%到達シーズン ---');
  console.log('  目標: S3-4\n');
  for (const tier of tierNames) {
    if (!neglectResults) { console.log(`  ${tier}: データなし`); continue; }
    const ceilingMul = 0.75 + 0.10 * 0.20; // = 0.77
    for (let s = 0; s <= TARGET_SEASONS; s++) {
      const agg = aggregateTier(neglectResults, TIER_REPS[tier], s);
      if (agg.count === 0) continue;
      const tierAvgCapOVR = TIER_REPS[tier].map(id => {
        const d = charPotData.find(c => c.id === id);
        return d ? d.capOVR : 0;
      }).reduce((a, b) => a + b, 0) / 5;
      const effectiveCapOVR = tierAvgCapOVR * ceilingMul;
      const reachVsEffective = (agg.avgOVR / effectiveCapOVR) * 100;
      if (reachVsEffective >= 95) {
        const verdict = (s + 1 >= 3 && s + 1 <= 4) ? '✓ 目標範囲内' : ((s + 1 < 3) ? '▼ 早すぎる' : '▲ 遅すぎる');
        console.log(`  ${tier}: S${s + 1}で到達 (OVR ${agg.avgOVR} / 有効天井 ${effectiveCapOVR.toFixed(1)}) ${verdict}`);
        break;
      }
      if (s === TARGET_SEASONS) {
        console.log(`  ${tier}: S${TARGET_SEASONS}でも未到達 (OVR ${agg.avgOVR} / 有効天井 ${effectiveCapOVR.toFixed(1)})`);
      }
    }
  }
}

function printComparisonReport(baselineResults, extractionResults, gsbValue) {
  console.log(`\n╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║           現行 vs 引き出し率モデル 比較 (GSB=${gsbValue})                   ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝`);

  const tierNames = ['top', 'upper', 'middle', 'lower', 'bottom'];
  const s7Idx = Math.min(6, TARGET_SEASONS);

  console.log(`\n--- S${s7Idx + 1}時点 OVR比較 ---`);
  console.log('  ティア    | 現行     | 放置     | 普通     | 全力     | 溺愛');
  console.log('  ----------+----------+----------+----------+----------+----------');

  for (const tier of tierNames) {
    const baseline = aggregateTier(baselineResults, TIER_REPS[tier], s7Idx);
    const cols = [baseline.avgOVR];
    for (const qName of Object.keys(QUALITY_LEVELS)) {
      const results = extractionResults[qName];
      const agg = results ? aggregateTier(results, TIER_REPS[tier], s7Idx) : { avgOVR: '-' };
      cols.push(agg.avgOVR);
    }
    console.log(`  ${tier.padEnd(10)}| ${cols.map(v => String(v).padStart(6)).join('   | ')}`);
  }

  // パラメータ推奨
  console.log('\n═══ パラメータ推奨 ═══');
  console.log(`  テスト済みGSB: ${gsbValue}`);

  // 全力のS7到達チェック
  const fullcareResults = extractionResults.fullcare;
  if (fullcareResults) {
    const topAgg = aggregateTier(fullcareResults, TIER_REPS.top, s7Idx);
    const ceilingMul = 0.75 + 0.84 * 0.20;
    const topCapOVR = TIER_REPS.top.map(id => {
      const d = charPotData.find(c => c.id === id);
      return d ? d.capOVR : 0;
    }).reduce((a, b) => a + b, 0) / 5;
    const effectiveCapOVR = topCapOVR * ceilingMul;
    const reachPct = topAgg.count > 0 ? (topAgg.avgOVR / effectiveCapOVR * 100).toFixed(1) : '-';

    console.log(`  全力S7到達率(top): ${reachPct}% (有効天井 ${effectiveCapOVR.toFixed(1)})`);
    if (reachPct !== '-') {
      const pct = parseFloat(reachPct);
      if (pct < 85) console.log(`  → GSBを上げるか、速度乗数を上げることを推奨`);
      else if (pct < 95) console.log(`  → 95%未満だが、S8-9で到達する可能性あり。微調整の余地あり`);
      else console.log(`  → 目標達成。現行パラメータで良好`);
    }
  }

  // 天井幅
  console.log(`\n  天井幅 75%-95% の評価:`);
  console.log(`    放置(Q=.10): 有効天井 = trainCap × ${(0.75 + 0.10 * 0.20).toFixed(2)} = ${((0.75 + 0.10 * 0.20) * 100).toFixed(0)}%`);
  console.log(`    全力(Q=.84): 有効天井 = trainCap × ${(0.75 + 0.84 * 0.20).toFixed(3)} = ${((0.75 + 0.84 * 0.20) * 100).toFixed(1)}%`);
  console.log(`    溺愛(Q=.96): 有効天井 = trainCap × ${(0.75 + 0.96 * 0.20).toFixed(3)} = ${((0.75 + 0.96 * 0.20) * 100).toFixed(1)}%`);

  const neglectResults = extractionResults.neglect;
  if (neglectResults && fullcareResults) {
    for (const tier of tierNames) {
      const nOVR = aggregateTier(neglectResults, TIER_REPS[tier], s7Idx).avgOVR;
      const fOVR = aggregateTier(fullcareResults, TIER_REPS[tier], s7Idx).avgOVR;
      if (nOVR !== '-' && fOVR !== '-') {
        const diff = fOVR - nOVR;
        if (diff < 8) {
          console.log(`    ⚠ ${tier}: 差${diff.toFixed(1)} — 天井幅を広げるか速度差を広げることを推奨`);
        }
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  メイン実行
// ══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════');
console.log('  引き出し率システム — 検証レポート');
console.log(`  Seeds: ${SEED_COUNT}  Seasons: ${TARGET_SEASONS}`);
console.log('══════════════════════════════════════════════════════════════');

// ティア情報表示
console.log('\n── 代表選手一覧 ──');
for (const [tier, ids] of Object.entries(TIER_REPS)) {
  const chars = ids.map(id => {
    const d = charPotData.find(c => c.id === id);
    return d ? `${d.name}(pot${d.potSum},OVR${d.initOVR.toFixed(0)})` : `ID${id}`;
  });
  console.log(`  ${tier}: ${chars.join(', ')}`);
}

// Step 0: 初期化診断（最初のシードで個別キャラのステータスを確認）
console.log('\n── 初期化診断 (seed=42) ──');
{
  const G = Engine.createInitialState(42, true);
  for (const [tier, ids] of Object.entries(TIER_REPS)) {
    for (const charId of ids) {
      const found = findChar(G, charId);
      if (!found) { console.log(`  ID${charId}: NOT FOUND`); continue; }
      const c = found.char;
      const origChar = ALL_CHARS.find(ch => ch.id === charId);
      const initOVR = (origChar.pw + origChar.sp + origChar.te + origChar.st + origChar.mn) / 5;
      const actualOVR = (c.pw + c.sp + c.te + c.st + c.mn) / 5;
      const age = c.age || (17 + (c.careerSeasons || 0));
      const wear = c.wear || 0;
      const cSeasons = c.careerSeasons || 0;
      const diff = actualOVR - initOVR;
      console.log(`  [${tier}] ${c.name}: OVR ${actualOVR.toFixed(1)} (data:${initOVR.toFixed(1)}, diff:${diff >= 0 ? '+' : ''}${diff.toFixed(1)}) age=${age} wear=${wear} careers=${cSeasons} loc=${found.location}`);
    }
  }
}

// Step 1: ベースライン
const baselineResults = runBaseline();
printBaselineReport(baselineResults);

// Step 2: 引き出し率テスト（複数GSB値）
const GSB_TO_TEST = [8.0, 12.0, 16.0, 24.0];
const allExtractionResults = {};

for (const gsb of GSB_TO_TEST) {
  allExtractionResults[gsb] = runExtractionTest(gsb);
  printExtractionReport(allExtractionResults[gsb], gsb);
  printComparisonReport(baselineResults, allExtractionResults[gsb], gsb);
}

// Step 3: GSB横断比較サマリー
console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    GSB横断比較サマリー                                      ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

const tierNames = ['top', 'upper', 'middle', 'lower', 'bottom'];
const s7Idx = Math.min(6, TARGET_SEASONS);

console.log(`\n--- S${s7Idx + 1}時点: 放置 vs 全力 OVR差 (全GSB) ---`);
console.log(`  ${'ティア'.padEnd(10)} | ${GSB_TO_TEST.map(g => `GSB=${g}`.padStart(7)).join(' | ')}`);
console.log(`  ${'-'.repeat(10)}-|-${GSB_TO_TEST.map(() => '-'.repeat(7)).join('-|-')}`);

for (const tier of tierNames) {
  const diffs = GSB_TO_TEST.map(gsb => {
    const er = allExtractionResults[gsb];
    if (!er || !er.neglect || !er.fullcare) return '   -  ';
    const nOVR = aggregateTier(er.neglect, TIER_REPS[tier], s7Idx).avgOVR;
    const fOVR = aggregateTier(er.fullcare, TIER_REPS[tier], s7Idx).avgOVR;
    if (nOVR === '-' || fOVR === '-') return '   -  ';
    return (fOVR - nOVR).toFixed(1).padStart(6);
  });
  console.log(`  ${tier.padEnd(10)} | ${diffs.join(' | ')}`);
}

console.log(`\n--- S${s7Idx + 1}時点: 全力OVR (全GSB) ---`);
console.log(`  ${'ティア'.padEnd(10)} | 現行     | ${GSB_TO_TEST.map(g => `GSB=${g}`.padStart(7)).join(' | ')}`);
console.log(`  ${'-'.repeat(10)}-|-${'-'.repeat(8)}-|-${GSB_TO_TEST.map(() => '-'.repeat(7)).join('-|-')}`);

for (const tier of tierNames) {
  const baseOVR = aggregateTier(baselineResults, TIER_REPS[tier], s7Idx).avgOVR;
  const gsbOVRs = GSB_TO_TEST.map(gsb => {
    const er = allExtractionResults[gsb];
    if (!er || !er.fullcare) return '   -  ';
    const fOVR = aggregateTier(er.fullcare, TIER_REPS[tier], s7Idx).avgOVR;
    return fOVR === '-' ? '   -  ' : String(fOVR).padStart(6);
  });
  console.log(`  ${tier.padEnd(10)} | ${String(baseOVR).padStart(6)}   | ${gsbOVRs.join(' | ')}`);
}

// 逆転チェック（下位全力 vs 上位放置）
console.log(`\n--- 逆転チェック: 下位全力 vs 上位放置 (S${s7Idx + 1}) ---`);
for (const gsb of GSB_TO_TEST) {
  const er = allExtractionResults[gsb];
  if (!er || !er.fullcare || !er.neglect) { console.log(`  GSB=${gsb}: データなし`); continue; }
  const lowerFull = aggregateTier(er.fullcare, TIER_REPS.lower, s7Idx).avgOVR;
  const upperNeglect = aggregateTier(er.neglect, TIER_REPS.upper, s7Idx).avgOVR;
  if (lowerFull === '-' || upperNeglect === '-') { console.log(`  GSB=${gsb}: データなし`); continue; }
  const diff = lowerFull - upperNeglect;
  const verdict = diff > 0 ? '★逆転成立' : (diff > -2 ? '☆接近' : '✕逆転不成立');
  console.log(`  GSB=${String(gsb).padEnd(4)}: 下位全力=${lowerFull}  上位放置=${upperNeglect}  差=${diff >= 0 ? '+' : ''}${diff.toFixed(1)}  ${verdict}`);
}

// 全力の有効天井到達シーズン比較
console.log(`\n--- 全力(Q=0.84) 有効天井95%到達シーズン (全GSB) ---`);
const ceilingMulFull = 0.75 + 0.84 * 0.20; // 0.918
for (const tier of tierNames) {
  const tierAvgCapOVR = TIER_REPS[tier].map(id => {
    const d = charPotData.find(c => c.id === id);
    return d ? d.capOVR : 0;
  }).reduce((a, b) => a + b, 0) / 5;
  const effectiveCapOVR = tierAvgCapOVR * ceilingMulFull;

  const reachSeasons = GSB_TO_TEST.map(gsb => {
    const er = allExtractionResults[gsb];
    if (!er || !er.fullcare) return '-';
    for (let s = 0; s <= TARGET_SEASONS; s++) {
      const agg = aggregateTier(er.fullcare, TIER_REPS[tier], s);
      if (agg.count === 0) continue;
      if ((agg.avgOVR / effectiveCapOVR) * 100 >= 95) return `S${s + 1}`;
    }
    return '未到達';
  });
  console.log(`  ${tier.padEnd(10)}: effectiveCap=${effectiveCapOVR.toFixed(1)}  ${GSB_TO_TEST.map((g, i) => `GSB=${g}:${reachSeasons[i]}`).join('  ')}`);
}

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  検証完了');
console.log('══════════════════════════════════════════════════════════════');
