#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Growth Rebalance Baseline Measurement
//
//  ■ 目的（リバランス前のベースライン実測。数値提案・src/改変は行わない）
//    growth-system-spec-v2.0.md §9 の設計目標「trainCapの91–92%収束」に対し、
//    本番エンジンを test/auto-sim.js と同じヘッドレス方式で長期実行し、
//    現状の到達率・到達季数・ピーク年齢・trainCapインフレ量を実測する。
//
//  ■ 母集団
//    プレイヤー団体 + 全AI団体（S/A/B各tier）の全選手を対象に、週次で
//    ロスターを横断スキャンして追跡する（レンタル選手は成長しないため除外）。
//    「フルウィンドウ」cohort = デビュー時年齢19歳以下で観測を開始できた選手のみ
//    を到達率の主集計に使う（ゲーム開始時点で既に成人済みの選手は除外し、
//    「デビューから27歳/引退まで」の完全なキャリアだけを比較する）。
//
//  ■ 成長源の切り分け方法（feedback: バランス計測は条件を揃えて比較する）
//    採用: 方式(A) 単一ラン内の寄与分解。ブーストON/OFFの別ランは行わない
//    （乱数ストリームがズレて母集団が変わるため）。
//      1. Engine.growth.calcGrowth を非侵襲的にラップし、戻り値は一切変更せず
//         副作用ログのみ記録する。乱数を追加消費しないよう、rngを消費した後の
//         戻り値・入力state・キャラを使って非乱数な係数（coachMul/rookieMul/
//         trainCapボーナス）だけを同じ引数で再計算する（元関数と同じ純関数を
//         再呼び出しするだけなので新規rng消費はない）。
//      2. 週次の実際のステータス増分（roster実測）から (1)で計測した
//         「基礎練習+追い込み」寄与を差し引いた残差を「試合成長ほか」（正の残差）
//         と「衰退」（負の残差）に分類する。試合成長の計算式はexecuteShow内に
//         複数箇所インライン実装されており一箇所に集約されていないため、残差法を
//         採用した（各箇所を個別にフックするより堅牢）。
//      3. coachMul/rookieMulの寄与は「実測値 − 実測値/倍率」で近似する
//         （丸め・ceilの非線形性を無視した近似。桁感を掴む用途と明記する）。
//
//  ■ 既知の限界（正直に明記する）
//    - 残差法は「基礎練習+追い込み」以外を全て「試合成長ほか」に一括りにする
//      （プロモ人気成長・化ける・気風補正などstat以外/稀少イベントも残差に混入しうる）
//    - フリーエージェント経由の移籍で一時的にどのロスターにも属さない週が挟まると
//      「引退」と誤判定される可能性がある。これを避けるため、フルウィンドウcohortは
//      「27歳到達」または「26歳以上での消失」のみ採用し、26歳未満での消失は
//      「早期離脱」として集計は別出しし主要到達率には含めない
//    - 本スクリプトは test/ 配下に閉じており、src/ の挙動・rng消費順序は変更しない
//
//  Usage:
//    node test/growth-baseline-measure.js [seasons] [seed] [outFile.json]
//    node test/growth-baseline-measure.js --aggregate out1.json out2.json ...
//
//  ageMultiplier A/Bオプション（コーチ判断・数値提案なし、実測のみ。src/は不変）:
//    WM_AGECURVE=spec 環境変数を立てると、vmロード後にメモリ上でageMultiplierを
//    spec growth-system-spec-v2.0.md §2 準拠のbaseカーブに差し替えて計測する。
//    既定(未設定)は現行実装のまま（"legacy"）。出力JSONの ageCurveMode で判別可能。
//    例: WM_AGECURVE=spec node test/growth-baseline-measure.js 35 1001 out.after.json
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2);

// ── aggregate モード: 複数シードのJSON出力を統合してレポートを出す ──
// 注: printAggregateReport はモジュール後方で定義される const(SPEC_TARGETS 等)を参照するため、
// ディスパッチはファイル末尾（全 const 初期化後）で行う。ここではフラグ判定のみ。
const AGGREGATE_MODE = argv[0] === '--aggregate';
if (AGGREGATE_MODE && argv.length < 2) {
  console.error('Usage: node test/growth-baseline-measure.js --aggregate out1.json out2.json ...');
  process.exit(1);
}

const targetSeasons = parseInt(argv[0], 10) || 30;
const userSeed = argv[1] ? parseInt(argv[1], 10) : (Date.now() ^ 0xABCD1234);
const outFile = argv[2] || null;

console.log('=== Growth Rebalance Baseline Measurement ===');
console.log(`seasons=${targetSeasons} seed=${userSeed}`);

// 同じ乱数シード方式で再現性を確保（test/auto-sim.js と同一方式）
let legacyRandomState = userSeed >>> 0;
Math.random = function seededLegacyRandom() {
  legacyRandomState = (Math.imul(legacyRandomState, 1664525) + 1013904223) >>> 0;
  return legacyRandomState / 0x100000000;
};

global.window = { IS_TRIAL: false };

// ── ソースコードをグローバルスコープで実行（test/auto-sim.js と同じ読み込み方式） ──
const vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');
const repoDir = path.join(__dirname, '..');
const sourceRef = process.env.WM_SOURCE_REF || '';

function readSource(filename) {
  if (!sourceRef) return fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  return execFileSync('git', ['show', `${sourceRef}:src/${filename}`], {
    cwd: repoDir,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function loadAsGlobal(filename) {
  let code = readSource(filename);
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('coach-lines.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('flag-dialogue.js');
loadAsGlobal('factions.js');
loadAsGlobal('draft-negotiation.js');

// ══════════════════════════════════════════════════════════════════════════
//  A/Bオプション: 年齢減衰カーブの spec §2 準拠版への差し替え（メモリ上のみ）
//  WM_AGECURVE=spec を指定した場合のみ有効。既定(未設定)は現行実装のまま。
//  src/*.js はディスク上で一切書き換えない（vm でロード後の global 関数を
//  上書きするだけ。Codexが並行して作業ツリーを編集中のため、ファイルには触れない）。
// ══════════════════════════════════════════════════════════════════════════
const AGE_CURVE_MODE = process.env.WM_AGECURVE === 'spec' ? 'spec' : 'legacy';
if (AGE_CURVE_MODE === 'spec') {
  if (typeof ageMultiplier !== 'function') {
    throw new Error('ageMultiplier not found on global scope after loadAsGlobal — cannot patch for WM_AGECURVE=spec');
  }
  // eslint-disable-next-line no-global-assign
  ageMultiplier = function specAgeMultiplier(age, traits) {
    // coordinator指定: spec §2 準拠のbaseカーブ（早熟/晩成/遅咲きの専用テーブルは温存し、
    // ベース値だけを差し替える。トレイト別テーブルはgrowth-trait-rebalance v1.0の別仕様のため対象外）
    let mul;
    if (age <= 16) mul = 1.30;
    else if (age === 17) mul = 1.20;
    else if (age === 18) mul = 1.10;
    else if (age <= 21) mul = 1.00; // 19,20,21
    else if (age === 22) mul = 0.85;
    else if (age === 23) mul = 0.775;
    else if (age === 24) mul = 0.70;
    else if (age === 25) mul = 0.55;
    else if (age === 26) mul = 0.45;
    else if (age === 27) mul = 0.35;
    else mul = 0.25; // 28+

    if (!Array.isArray(traits)) return mul;
    // 以下は現行実装のトレイト別上書きテーブルをそのまま温存（src/data.jsと同一ロジック）
    if (traits.includes('早熟')) {
      if      (age <= 17) mul = 1.00;
      else if (age <= 18) mul = 1.30;
      else if (age <= 19) mul = 1.15;
      else if (age <= 20) mul = 0.80;
      else if (age <= 21) mul = 0.50;
      else if (age <= 22) mul = 0.20;
      else                mul = 0;
    } else if (traits.includes('晩成')) {
      if      (age <= 17) mul = 0.50;
      else if (age <= 18) mul = 0.70;
      else if (age <= 19) mul = 0.90;
      else if (age <= 20) mul = 1.00;
      else if (age <= 22) mul = 1.15;
      else if (age <= 23) mul = 0.70;
      else if (age <= 24) mul = 0.30;
      else                mul = 0;
    } else if (traits.includes('遅咲き')) {
      if      (age <= 17) mul = 0.40;
      else if (age <= 18) mul = 0.50;
      else if (age <= 19) mul = 0.60;
      else if (age <= 20) mul = 0.70;
      else if (age <= 21) mul = 0.80;
      else if (age <= 22) mul = 1.00;
      else if (age <= 23) mul = 1.15;
      else if (age <= 24) mul = 0.80;
      else if (age <= 25) mul = 0.30;
      else                mul = 0;
    }
    return mul;
  };
  console.log('[WM_AGECURVE=spec] ageMultiplier をspec §2準拠版に差し替え済み（メモリ上のみ、src/未変更）');
  console.log(`  probe: 20歳=${ageMultiplier(20, [])} (legacy=1.15) / 26歳=${ageMultiplier(26, [])} (legacy=0.10) / 27歳=${ageMultiplier(27, [])} (legacy=0)`);
}

// ══════════════════════════════════════════════════════════════════════════
//  成長寄与の非侵襲的計装（Engine.growth.calcGrowth をラップ、戻り値は不変）
// ══════════════════════════════════════════════════════════════════════════

const STAT_KEYS = ['pw', 'sp', 'te', 'st', 'mn'];

function statSum(obj) {
  if (!obj) return 0;
  return (obj.pw || 0) + (obj.sp || 0) + (obj.te || 0) + (obj.st || 0) + (obj.mn || 0);
}
function statOVR(obj) {
  return Math.round(statSum(obj) / 5);
}

let currentTracker = null; // 実行中シードの growth tracker（週次スナップショットで参照）

const _origCalcGrowth = Engine.growth.calcGrowth;
Engine.growth.calcGrowth = function patchedCalcGrowth(rng, G, char, stat, overrideCoachMul) {
  const finalGain = _origCalcGrowth(rng, G, char, stat, overrideCoachMul);
  if (!currentTracker || stat === 'mn') return finalGain;
  if (finalGain <= 0) return finalGain;

  const acc = currentTracker.getAcc(char.id);
  acc.trainingGainSum += finalGain;
  acc.callCount++;

  // 非乱数の係数を同じ入力で再計算する（元関数と同じ純関数呼び出し。rng追加消費なし）
  try {
    let capBonus = 0;
    if (!overrideCoachMul) {
      capBonus = Engine.coach.getTrainCapBonus(G, char.id) + Engine.coach.getWeakStatCapBonus(G, char.id, stat);
    }
    if (capBonus > (acc.trainCapBonusByStat[stat] || 0)) acc.trainCapBonusByStat[stat] = capBonus;

    const coachMul = overrideCoachMul != null ? overrideCoachMul : Engine.coach.getCharGrowthMult(G, char.id, stat);
    const rookieMul = overrideCoachMul ? 1.0 : Engine.coach.getRookieMult(G, char.id);
    if (coachMul > 1.0001) acc.coachContribSum += finalGain - finalGain / coachMul;
    if (rookieMul > 1.0001) acc.rookieContribSum += finalGain - finalGain / rookieMul;
  } catch (_e) { /* 計装エラーはゲーム進行に影響させない */ }

  return finalGain;
};

// ══════════════════════════════════════════════════════════════════════════
//  週次 growth tracker
// ══════════════════════════════════════════════════════════════════════════

function createGrowthTracker() {
  const accMap = new Map();
  return {
    active: new Map(),
    finished: [],
    accMap,
    getAcc(id) {
      let a = accMap.get(id);
      if (!a) {
        a = { trainingGainSum: 0, coachContribSum: 0, rookieContribSum: 0, trainCapBonusByStat: {}, callCount: 0 };
        accMap.set(id, a);
      }
      return a;
    },
  };
}

function makeRecord(fighter, orgKind, tier, season, week) {
  const age = fighter.age || 17;
  const curStats = { pw: fighter.pw, sp: fighter.sp, te: fighter.te, st: fighter.st, mn: fighter.mn };
  const curOvr = statOVR(curStats);
  const tcOvr = Engine.rival.trainCapOVR(fighter);
  const potSrc = fighter.pot || fighter.trainCap || curStats;
  const potOvr = statOVR(potSrc);
  const rec = {
    id: fighter.id, name: fighter.name, orgKind, tier,
    debutSeason: season, debutWeek: week, debutAge: age,
    initTrainCapOVR: tcOvr, initPotOVR: potOvr,
    initTrainCapStats: fighter.trainCap ? { ...fighter.trainCap } : null,
    initPotStats: fighter.pot ? { ...fighter.pot } : null,
    initStats: curStats,
    fullWindow: age <= 19,
    peakOvr: curOvr, peakAge: age,
    at27Ovr: null, at27Season: null, at27Stats: null,
    seasonsTo95: null,
    lastSeenSeason: season, lastSeenWeek: week, lastSeenAge: age,
    lastOvr: curOvr, lastStats: curStats,
    trainingGainTotal: 0, matchOrOtherGainTotal: 0, declineTotal: 0,
    coachContribTotal: 0, rookieContribTotal: 0,
    trainCapBonusFinal: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    _prevTrainingGainSum: 0, _prevCoachSum: 0, _prevRookieSum: 0,
  };
  if (age >= 27) { rec.at27Ovr = curOvr; rec.at27Season = season; rec.at27Stats = curStats; }
  if (tcOvr > 0 && curOvr >= 0.95 * tcOvr) rec.seasonsTo95 = 0;
  return rec;
}

function snapshotGrowth(tracker, G) {
  const seenIds = new Set();

  const visit = (fighter, orgKind, tier) => {
    if (!fighter || fighter.isRental) return; // レンタル選手は成長対象外（D-1）
    seenIds.add(fighter.id);
    let rec = tracker.active.get(fighter.id);
    const age = fighter.age || 17;
    const curStats = { pw: fighter.pw, sp: fighter.sp, te: fighter.te, st: fighter.st, mn: fighter.mn };
    const curOvr = statOVR(curStats);

    if (!rec) {
      rec = makeRecord(fighter, orgKind, tier, G.season, G.week);
      tracker.active.set(fighter.id, rec);
      return;
    }

    const acc = tracker.accMap.get(fighter.id);
    const trainingCum = acc ? acc.trainingGainSum : 0;
    const trainingDelta = trainingCum - rec._prevTrainingGainSum;
    rec._prevTrainingGainSum = trainingCum;

    const coachCum = acc ? acc.coachContribSum : 0;
    rec.coachContribTotal += (coachCum - rec._prevCoachSum);
    rec._prevCoachSum = coachCum;

    const rookieCum = acc ? acc.rookieContribSum : 0;
    rec.rookieContribTotal += (rookieCum - rec._prevRookieSum);
    rec._prevRookieSum = rookieCum;

    const actualDelta = statSum(curStats) - statSum(rec.lastStats);
    rec.trainingGainTotal += trainingDelta;
    const residual = actualDelta - trainingDelta;
    if (residual > 0) rec.matchOrOtherGainTotal += residual;
    else if (residual < 0) rec.declineTotal += (-residual);

    if (acc && acc.trainCapBonusByStat) {
      STAT_KEYS.forEach(s => {
        const v = acc.trainCapBonusByStat[s] || 0;
        if (v > rec.trainCapBonusFinal[s]) rec.trainCapBonusFinal[s] = v;
      });
    }

    if (curOvr > rec.peakOvr) { rec.peakOvr = curOvr; rec.peakAge = age; }
    if (rec.at27Ovr === null && age >= 27) {
      rec.at27Ovr = curOvr; rec.at27Season = G.season; rec.at27Stats = curStats;
    }
    if (rec.seasonsTo95 === null && rec.initTrainCapOVR > 0 && curOvr >= 0.95 * rec.initTrainCapOVR) {
      rec.seasonsTo95 = G.season - rec.debutSeason;
    }
    rec.lastSeenSeason = G.season; rec.lastSeenWeek = G.week; rec.lastSeenAge = age;
    rec.lastOvr = curOvr; rec.lastStats = curStats;
  };

  (G.roster || []).forEach(f => visit(f, 'player', null));
  Object.keys(G.aiOrgs || {}).forEach(orgId => {
    const orgCfg = (typeof RIVAL_ORGS !== 'undefined') ? RIVAL_ORGS.find(o => o.id === orgId) : null;
    const tier = orgCfg ? orgCfg.tier : null;
    ((G.aiOrgs[orgId] || {}).roster || []).forEach(f => visit(f, 'ai', tier));
  });

  for (const [id, rec] of tracker.active) {
    if (!seenIds.has(id)) {
      tracker.finished.push(rec);
      tracker.active.delete(id);
      tracker.accMap.delete(id);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  auto-sim.js と同一のプレイヤー判断オートマトン（判断ロジックは変更しない）
// ══════════════════════════════════════════════════════════════════════════

function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  G = { ...G, debugLog: G.debugLog || [] };
  return G;
}

function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined' ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4;
  const isSpecial = G.week % 12 === 0;
  const effectiveMax = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }
  if (card.length >= 2 && (G.totalShows || 0) % 8 === 3) {
    const tagSlots = card.splice(card.length - 2, 2);
    card.push({
      matchType: 'tag',
      teamA: { fighter1: tagSlots[0].left, fighter2: tagSlots[0].right },
      teamB: { fighter1: tagSlots[1].left, fighter2: tagSlots[1].right },
    });
  }
  if (G.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(G);
    if (cd.allowed) {
      const champId = G.titles.world.championId;
      if (champId) {
        const titleMatch = card.find(m => m.left === champId || m.right === champId);
        if (titleMatch) titleMatch.isTitle = true;
      } else {
        const mainMatch = card[0];
        if (mainMatch && mainMatch.left > 0 && mainMatch.right > 0) {
          const rosterAll = G.roster || [];
          const hasRental = [mainMatch.left, mainMatch.right].some(id => rosterAll.find(c => c.id === id)?.isRental);
          if (!hasRental) mainMatch.isTitle = true;
        }
      }
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

function autoHandleFactionEvent(G, simRng) {
  if (!G._pendingFactionEvent) return G;
  const fe = G._pendingFactionEvent;
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA90));
  let s = G;
  try {
    if (fe.eventId === 'F01') {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const r = Engine.factions.applyF01Choice(s, fe.payload, choiceId, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02') {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const r = Engine.factions.applyF02Choice(s, fe.payload, choiceId, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F03') {
      const r = Engine.factions.applyF03Result(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F05H') {
      const r = Engine.factions.applyF05HResult(s, fe.payload);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02_RESOLUTION') {
      const r = Engine.factions.applyF02ResolutionResult(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02_ENDLESS') {
      const r = Engine.factions.applyF02EndlessResult(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02_IGNITE') {
      const r = Engine.factions.applyF02IgniteResult(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02_PEACE') {
      const r = Engine.factions.applyF02PeaceResult(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F04' || fe.eventId === 'F05' || fe.eventId === 'F06' || fe.eventId === 'F07' || fe.eventId === 'F08') {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const fn = Engine.factions[`apply${fe.eventId}Choice`];
      if (typeof fn === 'function') {
        const r = fn.call(Engine.factions, s, fe.payload, choiceId, rng);
        if (r && r.state) s = r.state;
      }
    } else if (fe.eventId === 'COMMON_1' || fe.eventId === 'COMMON_5' || fe.eventId === 'COMMON_7') {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const map = { COMMON_1: 'applyCommon1Choice', COMMON_5: 'applyCommon5Choice', COMMON_7: 'applyCommon7Choice' };
      const fn = Engine.factions[map[fe.eventId]];
      if (typeof fn === 'function') {
        const r = fn.call(Engine.factions, s, fe.payload, choiceId, rng);
        if (r && r.state) s = r.state;
      }
    } else if (fe.eventId === 'COMMON_4') {
      const r = Engine.factions.applyCommon4Result(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    }
  } catch (_e) { /* 設計意図としてはここに到達しない */ }
  const { _pendingFactionEvent: _, ...clean } = s;
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
  const candidates = G.scoutCandidates || [];
  if (candidates.length === 0) return G;
  const maxPicks = G.scoutMaxPicks || 4;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  const rosterCap = G.rosterCap || 16;
  let playerPicks = 0;
  const playerFn = (candidateId, round, currentBid, interests) => {
    if (playerPicks >= maxPicks) return 'drop';
    if (ownCount + playerPicks >= rosterCap) return 'drop';
    if (currentBid > G.funds * 0.4) return 'drop';
    if (round > 8) return 'drop';
    return 'standard';
  };
  const draftRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xDFA0));
  const draftResult = Engine.draftNegotiation.runFullDraft(candidates, G, playerFn, draftRng);
  let newRoster = [...G.roster];
  let newFunds = G.funds;
  let newAiOrgs = {};
  Object.keys(G.aiOrgs || {}).forEach(k => {
    newAiOrgs[k] = { ...G.aiOrgs[k], roster: [...(G.aiOrgs[k]?.roster || [])] };
  });
  let newFA = [...(G.freeAgents || [])];
  let newDormant = [...(G.dormantPool || [])];
  const normFighter = (f) => ({
    ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
    injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false, intensiveWeeks: 0,
  });
  for (const r of draftResult.results) {
    const clean = { ...r.candidate };
    delete clean._notion; delete clean._estimate; delete clean._isSeed;
    delete clean._hasCompetition;
    if (r.winner === 'player') {
      if (newFunds >= r.finalBid && playerPicks < maxPicks && newRoster.filter(c => !c.isRental).length < rosterCap) {
        newRoster.push(normFighter(clean));
        newFunds -= r.finalBid;
        playerPicks++;
      } else {
        newFA.push(normFighter(clean));
      }
    } else if (r.winner && r.winner !== 'player') {
      const orgData = newAiOrgs[r.winner];
      if (orgData) {
        const recruited = normFighter({ ...clean, orgId: r.winner });
        Engine.rival.pushUniqueFighter(orgData.roster, recruited);
      }
    } else {
      newFA.push(normFighter(clean));
    }
  }
  for (const ev of draftResult.empressReinforceEvents) {
    if (ev.type === 'empressReinforce' && ev.fighter) {
      const orgData = newAiOrgs[DRAFT_EMPRESS_SAFETY.orgId];
      if (orgData) {
        Engine.rival.pushUniqueFighter(orgData.roster, normFighter(ev.fighter));
        newDormant = newDormant.filter(e => e.id !== ev.dormantIdRemoved);
      }
    }
  }
  return {
    ...G, roster: newRoster, funds: newFunds, aiOrgs: newAiOrgs,
    freeAgents: newFA, dormantPool: newDormant, scoutCandidates: null, scoutPicks: null,
  };
}

const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
  '_juniorTournamentSelection', '_juniorTournamentResult',
  '_pendingFactionEvent', '_pendingF08Directive',
  '_shownF08PreMatchIds', '_shownF08PostMatchIds', '_pendingF08Aftermath',
];
function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) {
      const { [k]: _, ...clean } = s;
      s = clean;
    }
  }
  return s;
}

function collectViolations(G, violations) {
  if (G.debugLog && G.debugLog.length > 0) {
    G.debugLog.forEach(entry => {
      if (entry.type === 'invariant_violation') {
        violations.push({ season: entry.season, week: entry.week, message: entry.message });
      }
    });
    return { ...G, debugLog: [] };
  }
  return G;
}

// ══════════════════════════════════════════════════════════════════════════
//  シミュレーション本体（test/auto-sim.js runSimulation の骨格を流用。
//  MQ/興行演出プローブ等の成長と無関係な計装は省いた「軽量版」）
// ══════════════════════════════════════════════════════════════════════════

function runSimulation(seed, seasons) {
  const violations = [];
  const errors = [];
  let totalWeeks = 0;
  let gameOverCount = 0;
  let currentSeed = seed;
  const MAX_ITER = seasons * 60;

  const tracker = createGrowthTracker();
  currentTracker = tracker;

  let G;
  try {
    G = initGame(currentSeed);
  } catch (e) {
    errors.push({ season: 0, week: 0, seed: currentSeed, error: `initGame failed: ${e.message}`, stack: e.stack });
    return { violations, errors, totalWeeks, gameOverCount, tracker, completed: 0 };
  }

  let simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
  let completed = 0;
  let iter = 0;

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        gameOverCount++;
        currentSeed = (currentSeed * 1103515245 + 12345) | 0;
        G = initGame(currentSeed);
        simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
        continue;
      }

      if (G.ppvTournament?.phase === 'entry') {
        G = Engine.ppvTournament.confirmPlayerEntries(G, Engine.ppvTournament.suggestPlayerEntries(G));
      }
      if (G.weekPhase === 'ppvEntry') { G = { ...G, ppvPhase: 'locked' }; }
      if (G.weekPhase === 'ppvShow') { G = { ...G, ppvPhase: 'tv' }; }
      if (G.weekPhase === 'ppvTV') { G = { ...G, ppvPhase: null }; }
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
      if (G.springTagPhase === 'entry') {
        const cand = Engine.springTagLeague.getEntryCandidates(G);
        let pick = cand.suggestions && cand.suggestions[0];
        if (!pick && cand.eligible && cand.eligible.length >= 2) {
          const shuffled = [...cand.eligible].sort(() => Engine.rng.float(simRng) - 0.5);
          pick = { f1Id: shuffled[0].id, f2Id: shuffled[1].id };
        }
        if (pick) G = Engine.springTagLeague.confirmPlayerTeam(G, pick.f1Id, pick.f2Id);
      }
      if (G.weekPhase === 'scoutEvent') {
        G = autoHandleScoutEvent(G, simRng);
      }
      if (G.weekPhase === 'contractNegotiation') {
        G = autoHandleContractNegotiation(G, simRng);
      }

      const springTagOccupiesThisWeek = G.week === 12 && G.springTagLeague && !G.springTagLeague.cancelled
        && G.springTagLeague.matches && G.springTagLeague.matches.length > 0;
      const autumnWarOccupiesThisWeek = G.week === 36 && G.autumnWar && !G.autumnWar.cancelled
        && G.autumnWar.champion;
      const tenchosenOccupiesThisWeek = G.week === 48 && G.ppvTournament?.phase === 'done'
        && G.ppvTournament.season === G.season;
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage'
          && !springTagOccupiesThisWeek && !autumnWarOccupiesThisWeek && !tenchosenOccupiesThisWeek) {
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
      G = { ...tickResult.state, gameLog: [] };
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);
      G = collectViolations(G, violations);

      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };

      if (G._pendingAutumnWarReplay && G.autumnWar && !G.autumnWar.session) {
        const memberIds = Engine.autumnWar._selectMembers(G, 'player');
        if (memberIds.length === Engine.autumnWar.TEAM_SIZE) {
          const order = Engine.autumnWar._defaultOrder(G, 'player', memberIds);
          G = Engine.autumnWar.confirmPlayerTeam(G, memberIds, order);
        }
        G = { ...G, autumnWar: { ...G.autumnWar, autoReorderFinal: true } };
        G = Engine.autumnWar.startSession(G);
        if (G.autumnWar?.cancelled && !G.autumnWar.session) {
          const cancelledAutumn = Engine.autumnWar.apply(G, G.autumnWar);
          const { _pendingAutumnWarReplay: _awCancelledPending, ...cancelledClean } = cancelledAutumn.state;
          G = { ...cancelledClean, gameLog: [] };
        }
      }
      if (G._pendingAutumnWarReplay && G.autumnWar?.session) {
        let guard = 0;
        while (G.autumnWar?.session && G.autumnWar.session.phase !== 'complete' && guard++ < 20) {
          if (G.autumnWar.session.phase === 'finalOrder') {
            G = Engine.autumnWar.reorderForFinal(G, Engine.autumnWar.suggestFinalOrder(G, 'player'));
          } else {
            G = Engine.autumnWar.simulateNextBout(G).state;
          }
        }
        if (G.autumnWar?.session?.phase !== 'complete') throw new Error('autumnWar live session did not complete within 20 steps');
        const autumnResult = Engine.autumnWar.getProgress(G);
        const appliedAutumn = Engine.autumnWar.apply(G, autumnResult);
        const { _pendingAutumnWarReplay: _awPending, ...autumnClean } = appliedAutumn.state;
        const { session: _awSession, ...autumnWarClean } = autumnClean.autumnWar || {};
        G = { ...autumnClean, autumnWar: autumnWarClean, gameLog: [] };
      }

      if (G.pendingRetirements && G.pendingRetirements.length > 0) {
        const confirmed = G.pendingRetirements.map(r => r.fighter);
        const commitRes = Engine.retirement.commitRetirements(G, confirmed);
        const { pendingRetirements: _drop, ...rest } = commitRes.state;
        G = rest;
      }
      totalWeeks++;

      G = Engine.validateGameState(G);
      G = collectViolations(G, violations);

      // ── growth probe: 週次スナップショット ──
      snapshotGrowth(tracker, G);

      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        if (completed % 10 === 0) process.stdout.write(`  ... ${completed}/${seasons} seasons completed\r`);
      }
    } catch (e) {
      errors.push({ season: G ? G.season : '?', week: G ? G.week : '?', seed: currentSeed, error: e.message, stack: e.stack });
      gameOverCount++;
      currentSeed = (currentSeed * 1103515245 + 12345) | 0;
      try {
        G = initGame(currentSeed);
        simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
      } catch (e2) {
        errors.push({ season: '?', week: '?', seed: currentSeed, error: `Re-init failed: ${e2.message}`, stack: e2.stack });
        break;
      }
    }
  }

  currentTracker = null;
  return { violations, errors, totalWeeks, gameOverCount, tracker, completed };
}

// ══════════════════════════════════════════════════════════════════════════
//  出力の整形
// ══════════════════════════════════════════════════════════════════════════

function finalizeOutputRecords(tracker) {
  const all = [...tracker.finished];
  let truncatedActiveCount = 0;
  for (const rec of tracker.active.values()) {
    if (rec.at27Ovr != null) all.push(rec);
    else truncatedActiveCount++;
  }
  // 内部専用フィールドを落とす
  const clean = all.map(r => {
    const { _prevTrainingGainSum, _prevCoachSum, _prevRookieSum, ...rest } = r;
    return rest;
  });
  return { records: clean, truncatedActiveCount };
}

function main() {
  const started = Date.now();
  const result = runSimulation(userSeed, targetSeasons);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const { records, truncatedActiveCount } = finalizeOutputRecords(result.tracker);

  console.log(`\ndone. seasons=${result.completed}/${targetSeasons} weeks=${result.totalWeeks} gameOvers=${result.gameOverCount} errors=${result.errors.length} violations=${result.violations.length} elapsed=${elapsed}s`);
  console.log(`tracked fighters: finished/at27-active=${records.length}  truncated(<27 at sim end)=${truncatedActiveCount}`);
  if (result.errors.length > 0) {
    console.log('--- errors (first 5) ---');
    result.errors.slice(0, 5).forEach(e => console.log(`  season=${e.season} week=${e.week}: ${e.error}`));
  }

  const output = {
    seed: userSeed,
    ageCurveMode: AGE_CURVE_MODE,
    seasonsRequested: targetSeasons,
    seasonsCompleted: result.completed,
    totalWeeks: result.totalWeeks,
    gameOverCount: result.gameOverCount,
    errorCount: result.errors.length,
    violationCount: result.violations.length,
    truncatedActiveCount,
    records,
  };

  if (outFile) {
    fs.writeFileSync(outFile, JSON.stringify(output));
    console.log(`written: ${outFile}`);
  } else {
    printAggregateReport([output]);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  レポート集計（単一run / 複数run 共通）
// ══════════════════════════════════════════════════════════════════════════

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return NaN;
  const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.floor(p * (sortedArr.length - 1))));
  return sortedArr[idx];
}
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN; }
function median(arr) {
  if (arr.length === 0) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const SPEC_TARGETS = [
  { label: '低帯',   anchor: 76,  target: 0.92 },
  { label: '中帯',   anchor: 88,  target: 0.92 },
  { label: '上帯',   anchor: 97,  target: 0.92 },
  { label: 'エース', anchor: 107, target: 0.91 },
];
function tierBinFor(trainCapOvr) {
  if (trainCapOvr < 82) return SPEC_TARGETS[0];
  if (trainCapOvr < 93) return SPEC_TARGETS[1];
  if (trainCapOvr < 103) return SPEC_TARGETS[2];
  return SPEC_TARGETS[3];
}

function printAggregateReport(runs) {
  const allRecords = runs.flatMap(r => r.records);
  const seeds = runs.map(r => r.seed);
  const totalSeasons = runs.reduce((s, r) => s + (r.seasonsCompleted || 0), 0);
  const totalWeeks = runs.reduce((s, r) => s + (r.totalWeeks || 0), 0);
  const totalErrors = runs.reduce((s, r) => s + (r.errorCount || 0), 0);
  const totalViolations = runs.reduce((s, r) => s + (r.violationCount || 0), 0);
  const totalTruncated = runs.reduce((s, r) => s + (r.truncatedActiveCount || 0), 0);

  console.log('\n========================================================');
  console.log(' Growth Baseline Aggregate Report');
  console.log('========================================================');
  console.log(`runs=${runs.length} seeds=[${seeds.join(', ')}]`);
  console.log(`total seasons completed=${totalSeasons}  total weeks=${totalWeeks}`);
  console.log(`errors=${totalErrors}  invariant violations=${totalViolations}`);
  console.log(`total tracked fighters (finished or at27)=${allRecords.length}  truncated(<27 at run end)=${totalTruncated}`);

  const byOrg = { player: allRecords.filter(r => r.orgKind === 'player').length, ai: allRecords.filter(r => r.orgKind === 'ai').length };
  console.log(`  by org: player=${byOrg.player} ai=${byOrg.ai}`);

  // ── 母集団: フルウィンドウ cohort ──
  const fullWindow = allRecords.filter(r => r.fullWindow);
  const primary = fullWindow.filter(r => r.at27Ovr != null || r.lastSeenAge >= 26);
  const earlyDropout = fullWindow.filter(r => r.at27Ovr == null && r.lastSeenAge < 26);

  console.log('\n--- 母集団 ---');
  console.log(`フルウィンドウ(デビュー時年齢<=19)候補: ${fullWindow.length}`);
  console.log(`  うち主集計cohort(27歳到達 or 26歳以上で消失): ${primary.length}`);
  console.log(`  うち早期離脱(26歳未満で消失。移籍gapの誤判定含みうる、参考値): ${earlyDropout.length}`);
  const debutAges = primary.map(r => r.debutAge);
  console.log(`  デビュー年齢分布: mean=${mean(debutAges).toFixed(1)} min=${Math.min(...debutAges)} max=${Math.max(...debutAges)}`);
  const initTcOvrs = primary.map(r => r.initTrainCapOVR).sort((a, b) => a - b);
  console.log(`  初期trainCap-OVR分布: mean=${mean(initTcOvrs).toFixed(1)} median=${median(initTcOvrs).toFixed(1)} p10=${percentile(initTcOvrs, 0.1)} p90=${percentile(initTcOvrs, 0.9)}`);

  function finalOvrOf(r) { return r.at27Ovr != null ? r.at27Ovr : r.lastOvr; }
  function finalStatsOf(r) { return r.at27Ovr != null ? r.at27Stats : r.lastStats; }

  // ── 1. 到達率分布（OVR） ──
  const rates = primary.map(r => finalOvrOf(r) / r.initTrainCapOVR).filter(x => Number.isFinite(x));
  const ratesSorted = [...rates].sort((a, b) => a - b);
  console.log('\n--- 1. 到達率分布（最終OVR ÷ 初期trainCap-OVR、主集計cohort n=' + rates.length + '） ---');
  console.log(`  mean=${(mean(rates) * 100).toFixed(1)}%  median=${(median(rates) * 100).toFixed(1)}%  p90=${(percentile(ratesSorted, 0.9) * 100).toFixed(1)}%`);
  const over92 = rates.filter(x => x >= 0.92).length;
  const over98 = rates.filter(x => x >= 0.98).length;
  console.log(`  92%以上(spec目標到達): ${over92}/${rates.length} = ${(100 * over92 / rates.length).toFixed(1)}%`);
  console.log(`  98%以上(実質MAX到達): ${over98}/${rates.length} = ${(100 * over98 / rates.length).toFixed(1)}%`);

  // stat別（÷初期pot）
  console.log('\n  stat別到達率（最終値 ÷ 初期pot、主集計cohort）:');
  ['pw', 'sp', 'te', 'st', 'mn'].forEach(stat => {
    const vals = primary
      .filter(r => r.initPotStats && r.initPotStats[stat] > 0)
      .map(r => (finalStatsOf(r)[stat] || 0) / r.initPotStats[stat]);
    if (vals.length === 0) return;
    const sorted = [...vals].sort((a, b) => a - b);
    console.log(`    ${stat}: n=${vals.length} mean=${(mean(vals) * 100).toFixed(1)}% median=${(median(vals) * 100).toFixed(1)}% p90=${(percentile(sorted, 0.9) * 100).toFixed(1)}%`);
  });

  // ── 2. 上限到達までのシーズン数 ──
  const to95 = primary.filter(r => r.seasonsTo95 != null).map(r => r.seasonsTo95);
  const to95Sorted = [...to95].sort((a, b) => a - b);
  console.log(`\n--- 2. trainCapの95%到達までのシーズン数（n=${to95.length}/${primary.length}） ---`);
  if (to95.length > 0) {
    console.log(`  mean=${mean(to95).toFixed(1)}  median=${median(to95Sorted)}  p90=${percentile(to95Sorted, 0.9)}`);
  }
  console.log(`  95%未到達のまま27歳/引退に達した選手: ${primary.length - to95.length}/${primary.length} = ${(100 * (primary.length - to95.length) / primary.length).toFixed(1)}%`);

  // ── 3. ピーク年齢 ──
  const peakAges = primary.map(r => r.peakAge);
  const peakAgeCounts = {};
  peakAges.forEach(a => { peakAgeCounts[a] = (peakAgeCounts[a] || 0) + 1; });
  console.log('\n--- 3. ピーク年齢分布 ---');
  console.log(`  mean=${mean(peakAges).toFixed(1)}  median=${median(peakAges)}`);
  Object.keys(peakAgeCounts).map(Number).sort((a, b) => a - b).forEach(age => {
    const n = peakAgeCounts[age];
    console.log(`    ${age}歳: ${n} (${(100 * n / peakAges.length).toFixed(1)}%)`);
  });

  // ── 4. trainCapインフレ量（限界突破+弱点克服） ──
  const bonusSums = primary.map(r => STAT_KEYS_LOCAL().reduce((s, k) => s + (r.trainCapBonusFinal ? (r.trainCapBonusFinal[k] || 0) : 0), 0));
  const withBonus = bonusSums.filter(x => x > 0);
  console.log('\n--- 4. trainCapインフレ量（限界突破+弱点克服、装着中に観測された最大値の合算、主集計cohort） ---');
  console.log(`  ボーナスを一度でも受けた選手: ${withBonus.length}/${bonusSums.length} = ${(100 * withBonus.length / bonusSums.length).toFixed(1)}%`);
  if (withBonus.length > 0) {
    const sorted = [...withBonus].sort((a, b) => a - b);
    console.log(`  (受けた選手のみ) 5stat合計ボーナス: mean=${mean(withBonus).toFixed(1)}pt  median=${median(sorted)}pt  max=${Math.max(...withBonus)}pt`);
    console.log(`  (受けた選手のみ) OVR換算(合計/5): mean=${(mean(withBonus) / 5).toFixed(2)}  max=${(Math.max(...withBonus) / 5).toFixed(2)}`);
  }

  // ── 5. 設計目標との比較（tier別） ──
  console.log('\n--- 5. 設計目標との比較（spec §9、tier別） ---');
  SPEC_TARGETS.forEach(t => {
    const bucket = primary.filter(r => tierBinFor(r.initTrainCapOVR) === t);
    if (bucket.length === 0) { console.log(`  ${t.label}(基準trainCap≈${t.anchor}): n=0 サンプルなし`); return; }
    const bRates = bucket.map(r => finalOvrOf(r) / r.initTrainCapOVR);
    const bSorted = [...bRates].sort((a, b) => a - b);
    const gap = mean(bRates) - t.target;
    console.log(`  ${t.label}(基準trainCap≈${t.anchor}, n=${bucket.length}): 実測mean=${(mean(bRates) * 100).toFixed(1)}% median=${(median(bSorted) * 100).toFixed(1)}%  目標=${(t.target * 100).toFixed(0)}%  差分=${gap >= 0 ? '+' : ''}${(gap * 100).toFixed(1)}pt`);
  });

  // ── 成長源の内訳（寄与分解、方式A） ──
  const trainSum = primary.reduce((s, r) => s + (r.trainingGainTotal || 0), 0);
  const matchSum = primary.reduce((s, r) => s + (r.matchOrOtherGainTotal || 0), 0);
  const declineSum = primary.reduce((s, r) => s + (r.declineTotal || 0), 0);
  const coachSum = primary.reduce((s, r) => s + (r.coachContribTotal || 0), 0);
  const rookieSum = primary.reduce((s, r) => s + (r.rookieContribTotal || 0), 0);
  const grossGain = trainSum + matchSum;
  console.log('\n--- 成長源の内訳（主集計cohort、5stat合計ポイントの累積・方式Aによる分解） ---');
  console.log(`  基礎練習+追い込み(calcGrowth計装): ${trainSum.toFixed(0)}pt (${(100 * trainSum / grossGain).toFixed(1)}%)`);
  console.log(`  試合成長ほか(残差、正の残差): ${matchSum.toFixed(0)}pt (${(100 * matchSum / grossGain).toFixed(1)}%)`);
  console.log(`  衰退(残差、負の残差の絶対値): ${declineSum.toFixed(0)}pt`);
  console.log(`  うちコーチ倍率(coachMul>1)による上乗せ分(近似): ${coachSum.toFixed(0)}pt (${(100 * coachSum / trainSum).toFixed(1)}% of 基礎練習)`);
  console.log(`  うち新人育成倍率(OVR<=50 ×1.5)による上乗せ分(近似): ${rookieSum.toFixed(0)}pt (${(100 * rookieSum / trainSum).toFixed(1)}% of 基礎練習)`);
  console.log('  [注] 試合成長ほかは「実測合計 − calcGrowth計装合計」の残差法。プロモ由来の人気等stat以外は含まれない。');

  console.log('\n[実装メモ] ageMultiplier実装(src/data.js)はspec §2の表と乖離あり:');
  console.log('  実装: <=17:0.70 / 18:1.00 / 19-20:1.15 / 21-22:1.00 / 23-24:0.50 / 25-26:0.10 / 27+:0.00（特性補正別）');
  console.log('  spec表記: 16-18:1.3-1.1 / 19-21:1.0 / 22-24:0.85-0.70 / 25-27:0.55-0.35 / 28+:<=0.25');
  console.log('  → 27歳以降は練習・試合とも成長ゲインが完全にゼロになる実装のため、27歳スナップショットは実質的な「打ち止め値」と一致する。');
}

function STAT_KEYS_LOCAL() { return ['pw', 'sp', 'te', 'st', 'mn']; }

if (AGGREGATE_MODE) {
  const runs = argv.slice(1).map(f => JSON.parse(fs.readFileSync(f, 'utf-8')));
  printAggregateReport(runs);
} else {
  main();
}
