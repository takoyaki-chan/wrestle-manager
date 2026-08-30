#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Auto-Simulation Script
//  Mode: engine-integrity (エンジン整合性チェック)
//
//  ■ 目的
//    本番エンジン (tickWeek / advanceWeek / executeShow / validateGameState) を
//    UIなしで高速に長期実行し、不変条件(invariant)違反を検出する。
//
//  ■ このテストが保証すること
//    - GameState の参照整合性(選手消失・重複・NaN 等)
//    - tickWeek パイプラインの処理順序と副作用の一貫性
//    - イベント発生頻度が期待範囲内(対抗戦・スカウト・興行)
//    - 長期シミュレーションでのクラッシュ・無限ループがないこと
//
//  ■ このテストが保証しないこと(本番再現が必要な代表例)
//    - 興行カード編成: ランダムシャッフルで代用(プレイヤーの戦略的判断なし)
//    - 契約交渉: 確率ベースの自動応答(プレイヤー心理の再現なし)
//    - スカウト/ドラフト: 簡易AIで代用(資金配分・指名戦略の再現なし)
//    - ケアアクション: 未実行(信頼度管理の再現なし)
//    - UI導線/タイミング依存の演出・ポップアップ表示
//    - バランス感覚(「強すぎる」「弱すぎる」は数値だけでは判断不可)
//
//  ■ バランス修正の運用ルール
//    auto-sim の結果だけでバランス修正しないこと。
//    「auto-sim上の症状」と「本番セーブで再現済みの症状」は分けて扱う。
//    修正フロー: 本番で症状確認 → auto-sim で再現範囲を特定 → 修正 → 両方で確認
//
//  Usage: node test/auto-sim.js [シーズン数] [シード]
//  Example: node test/auto-sim.js 500 12345
//  Historical source comparison (PowerShell):
//    $env:WM_SOURCE_REF='3e9ca50'; node test/auto-sim.js 100 42
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
// care-rework2 P0-5: フラグ(--care 等)を位置引数から分離する。
// 既存の呼び出しは数値2つだけなので positional === args となり、従来動作は不変。
const cliFlags = args.filter(a => a.startsWith('--'));
const positionalArgs = args.filter(a => !a.startsWith('--'));
const targetSeasons = parseInt(positionalArgs[0], 10) || 100;
const userSeed = positionalArgs[1] ? parseInt(positionalArgs[1], 10) : (Date.now() ^ 0xABCD1234);
// --care: 自動プレイヤーが毎週ケア書類(決裁書類)を決裁枠・資金の許す限り実行する
const CARE_MODE = cliFlags.includes('--care');

// Some non-match simulation paths still use Math.random(). Seed those calls as
// well so commit-to-commit measurements with the same CLI seed are comparable.
let legacyRandomState = userSeed >>> 0;
Math.random = function seededLegacyRandom() {
  legacyRandomState = (Math.imul(legacyRandomState, 1664525) + 1013904223) >>> 0;
  return legacyRandomState / 0x100000000;
};

// window stub（Engine内で IS_TRIAL 参照がある）
global.window = { IS_TRIAL: false };

// ── Step 1: ソースコードをグローバルスコープで実行 ──
// data.js / engine.js はブラウザ向けのグローバル const で宣言されているため、
// require() の module wrapper ではスコープが閉じてしまう。
// ファイル内容を読み取り、const/let → var に置換してグローバルに展開する。

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
  // module.exports ブロックを除去（Node.js の module 変数との衝突防止）
  // 末尾の "if (typeof module !== 'undefined' ...)" ブロック全体を削除
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  // const/let → var でグローバルスコープに展開（vm.runInThisContext では var のみグローバルになる）
  code = code.replace(/^(const|let) /gm, 'var ');
  // vm.runInThisContext はグローバルスコープでスクリプトを実行する
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

// ブラウザと同じ読み込み順序: victory-lines.js → data.js → engine.js
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

// task-92 I-6: 年末表彰データが作られる瞬間のMVPと統一王者を横計測する。
// sourceRefで旧HEADを読む場合も同じ物差しを使えるよう、ゲーム実装の外側で包む。
const unifiedRecordsI6Probe = { annualMvps: 0, unifiedChampionMvps: 0 };
const generateAwardsForUnifiedRecordsI6 = Engine.awards.generate;
Engine.awards.generate = function generateAwardsWithUnifiedRecordsI6(rng, state) {
  const awards = generateAwardsForUnifiedRecordsI6.call(this, rng, state);
  if (awards?.mvp) {
    unifiedRecordsI6Probe.annualMvps++;
    if (state.unifiedTitle?.championId === awards.mvp.id) unifiedRecordsI6Probe.unifiedChampionMvps++;
  }
  return awards;
};

function createPhaseTimingStats(maxTurn, climaxStart) {
  return {
    matches: 0,
    climaxStart,
    reachedClimax: 0,
    finishPhases: { Opening: 0, Mid: 0, End: 0, Climax: 0, Timeout: 0 },
    turnHistogram: Array(maxTurn + 1).fill(0),
    phaseTurns: { Opening: 0, Mid: 0, End: 0, Climax: 0 },
  };
}

function createBigStartGroupStats() {
  return {
    matches: 0,
    turns: 0,
    overrideAtFullHealth: 0,
    reachedClimax: 0,
    finishPhases: { Opening: 0, Mid: 0, End: 0, Climax: 0, Timeout: 0 },
    turnHistogram: Array(BIGMATCH_MAX_T + 1).fill(0),
    phaseTurns: { Opening: 0, Mid: 0, End: 0, Climax: 0 },
    finisherSelections: 0,
    zeroFinisherMatches: 0,
    mqTotal: 0,
    legacyPacingMqTotal: 0,
    finishTypes: { fall: 0, gu: 0, TKO: 0, decision: 0 },
    startHpRatios: [],
    origins: {
      juniorTournament: { matches: 0, mqTotal: 0, legacyPacingMqTotal: 0, startHpRatios: [] },
      autumnWar: { matches: 0, mqTotal: 0, legacyPacingMqTotal: 0, startHpRatios: [] },
      tenchosen: { matches: 0, mqTotal: 0, legacyPacingMqTotal: 0, startHpRatios: [] },
      other: { matches: 0, mqTotal: 0, legacyPacingMqTotal: 0, startHpRatios: [] },
    },
  };
}

function classifyFinishType(finType) {
  const text = String(finType || '');
  if (text === 'TKO') return 'TKO';
  if (text.includes('\u30ae\u30d6\u30a2\u30c3\u30d7')) return 'gu';
  if (text.includes('\u30d5\u30a9\u30fc\u30eb') || text.includes('\u30d4\u30f3') || text.includes('\u4e38\u3081\u8fbc\u307f')) return 'fall';
  return 'decision';
}

function recordBigStartGroup(stats, result, startHpRatios, origin, overrideAtFullHealth) {
  const turns = Math.max(0, Math.min(result.turns || 0, BIGMATCH_MAX_T));
  stats.matches++;
  stats.turns += turns;
  if (overrideAtFullHealth) stats.overrideAtFullHealth++;
  const climaxStart = BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].min;
  if (turns >= climaxStart) stats.reachedClimax++;
  stats.turnHistogram[turns]++;
  const finishPhase = result.finishPhase === 'Timeout' ? 'Timeout' : result.finishPhase;
  if (stats.finishPhases[finishPhase] != null) stats.finishPhases[finishPhase]++;
  for (const phase of BIGMATCH_PHASES) {
    stats.phaseTurns[phase.name] += Math.max(0, Math.min(turns, phase.max) - phase.min + 1);
  }
  const selections = result.moveSelectionStats || {};
  const normalFinishers = Math.max(0, (selections.finisher || 0) - (selections.forcedFinisher || 0));
  stats.finisherSelections += normalFinishers;
  if (normalFinishers === 0) stats.zeroFinisherMatches++;
  stats.finishTypes[classifyFinishType(result.finType)]++;
  stats.mqTotal += result.mq || 0;
  stats.legacyPacingMqTotal += result._legacyPacingMq || result.mq || 0;
  stats.startHpRatios.push(...startHpRatios);
  if (origin && stats.origins[origin]) {
    stats.origins[origin].matches++;
    stats.origins[origin].mqTotal += result.mq || 0;
    stats.origins[origin].legacyPacingMqTotal += result._legacyPacingMq || result.mq || 0;
    stats.origins[origin].startHpRatios.push(...startHpRatios);
  }
}

let activeBigMatchOrigin = 'other';

function legacyPacingPenalty(matchTurns, tier, hasHikidashi) {
  const limits = tier >= 2
    ? (hasHikidashi ? { ideal: 10, ok: 7 } : { ideal: 13, ok: 10 })
    : (hasHikidashi ? { ideal: 5, ok: 3 } : { ideal: 7, ok: 5 });
  if (matchTurns >= limits.ideal) return 0;
  if (matchTurns >= limits.ok) return 3;
  return 12;
}

function mqWithLegacyPacing(result, tier, charL, charR) {
  const detail = result.mqDetail;
  if (!detail) return result.mq || 0;
  const hasHikidashi = Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手');
  const pacingPenalty = legacyPacingPenalty(result.turns || 0, tier, hasHikidashi);
  return Math.max(5, Math.round(detail.ceiling - detail.dramaPenalty - pacingPenalty - detail.finishPenalty));
}

// Task 10: match-injury totals. Player match injuries go through
// Engine.injury.check; AI match injuries are detected around processAIWeek.
// Training injuries are intentionally excluded because match length cannot
// affect their probability.
const injuryProbe = {
  all: { injuries: 0, weeks: 0, severe: 0, fighterSeasons: new Set() },
  player: { injuries: 0, weeks: 0, severe: 0, fighterSeasons: new Set() },
  contextKey: 'initial',
};

function injuryFighterSeasonKey(scope, orgId, fighterId, season) {
  return `${injuryProbe.contextKey}:${season}:${scope}:${orgId || 'player'}:${fighterId}`;
}

function recordInjury(scope, orgId, fighter, injury, weeks, season) {
  if (!fighter || !injury) return;
  const key = injuryFighterSeasonKey(scope, orgId, fighter.id, season);
  injuryProbe.all.fighterSeasons.add(key);
  injuryProbe.all.injuries++;
  injuryProbe.all.weeks += weeks || 0;
  if (injury.type === '重傷' || injury.severity === 'severe') injuryProbe.all.severe++;
  if (scope === 'player') {
    injuryProbe.player.fighterSeasons.add(key);
    injuryProbe.player.injuries++;
    injuryProbe.player.weeks += weeks || 0;
    if (injury.type === '重傷' || injury.severity === 'severe') injuryProbe.player.severe++;
  }
}

function observeFighterSeasons(state) {
  for (const fighter of state.roster || []) {
    const key = injuryFighterSeasonKey('player', 'player', fighter.id, state.season);
    injuryProbe.player.fighterSeasons.add(key);
    injuryProbe.all.fighterSeasons.add(key);
  }
  for (const [orgId, orgData] of Object.entries(state.aiOrgs || {})) {
    for (const fighter of orgData.roster || []) {
      injuryProbe.all.fighterSeasons.add(injuryFighterSeasonKey('ai', orgId, fighter.id, state.season));
    }
  }
}

const _injuryCheckForProbe = Engine.injury.check;
Engine.injury.check = function(...args) {
  const result = _injuryCheckForProbe.apply(this, args);
  if (result && result.injuryInfo) {
    recordInjury('player', 'player', args[1], result.injuryInfo.injury, result.injuryInfo.weeks, args[5]);
  }
  return result;
};

const _processAIWeekForInjuryProbe = Engine.rival.processAIWeek;
Engine.rival.processAIWeek = function(rng, state, org) {
  const priorOrg = state.aiOrgs?.[org.id] || {};
  const before = new Map((priorOrg.roster || []).map(fighter => [fighter.id, fighter]));
  const priorRetirees = new Set((priorOrg._midSeasonRetirees || []).map(fighter => fighter.id));
  const result = _processAIWeekForInjuryProbe.call(this, rng, state, org);
  for (const fighter of result?.roster || []) {
    const prior = before.get(fighter.id);
    const injury = fighter.injury;
    if ((!prior || !prior.injury) && injury && injury.type !== 'training injury') {
      recordInjury('ai', org.id, fighter, injury, injury.weeksLeft, state.season);
    }
  }
  for (const fighter of result?._midSeasonRetirees || []) {
    if (!priorRetirees.has(fighter.id) && (!before.get(fighter.id) || !before.get(fighter.id).injury)) {
      recordInjury('ai', org.id, fighter, fighter.injury, fighter.injury?.weeksLeft, state.season);
    }
  }
  return result;
};

// タスク69 §1: OVR差バンドを 0(独立) / 1-2 / 3-4 / 5-9 / 10-14 / 15-19 / 20-24 / 25-29 / 30+
// に細分化する測定ヘルパー。差0は「格上」が存在しないため zero.leftWins で別扱いする。
function createOvrBandSet() {
  return {
    zero: { matches: 0, leftWins: 0 },
    bands: {
      '1-2': { matches: 0, strongerWins: 0 },
      '3-4': { matches: 0, strongerWins: 0 },
      '5-9': { matches: 0, strongerWins: 0 },
      '10-14': { matches: 0, strongerWins: 0 },
      '15-19': { matches: 0, strongerWins: 0 },
      '20-24': { matches: 0, strongerWins: 0 },
      '25-29': { matches: 0, strongerWins: 0 },
      '30+': { matches: 0, strongerWins: 0 },
    },
  };
}
function ovrGapBandKey(gap) {
  if (gap <= 2) return '1-2';
  if (gap <= 4) return '3-4';
  if (gap <= 9) return '5-9';
  if (gap <= 14) return '10-14';
  if (gap <= 19) return '15-19';
  if (gap <= 24) return '20-24';
  if (gap <= 29) return '25-29';
  return '30+';
}

// Task 05-07 balance probe: aggregate real single-match results produced by the
// engine-integrity run.  Keeping this beside auto-sim makes before/after runs
// directly comparable under the same seed without changing production logic.
const matchBalanceProbe = {
  matches: 0,
  turns: 0,
  timeouts: 0,
  mq: [],
  legacyPacingMq: [],
  smallFallOrGuFinishes: 0,
  smallTkoFinishes: 0,
  finisherSelections: 0,
  forcedFinisherSelections: 0,
  zeroFinisherMatches: 0,
  consecutiveBigSelections: 0,
  moveSelections: 0,
  rollupSelections: 0,
  tiersByPhase: {},
  phaseTiming: {
    normal: createPhaseTimingStats(MAX_T, PHASES[PHASES.length - 1].min),
    big: createPhaseTimingStats(BIGMATCH_MAX_T, BIGMATCH_PHASES[BIGMATCH_PHASES.length - 1].min),
  },
  bigStartGroups: {
    full: createBigStartGroupStats(),
    carried: createBigStartGroupStats(),
  },
  openingExecution: {
    '15-19': { eligible: 0, checked: 0, fired: 0, hit: 0, finishes: 0, misses: 0, underdogWinsAfterMiss: 0, damageBands: { shallow: 0, medium: 0, deep: 0, fatal: 0 } },
    '20-24': { eligible: 0, checked: 0, fired: 0, hit: 0, finishes: 0, misses: 0, underdogWinsAfterMiss: 0, damageBands: { shallow: 0, medium: 0, deep: 0, fatal: 0 } },
    '25-29': { eligible: 0, checked: 0, fired: 0, hit: 0, finishes: 0, misses: 0, underdogWinsAfterMiss: 0, damageBands: { shallow: 0, medium: 0, deep: 0, fatal: 0 } },
    '30+': { eligible: 0, checked: 0, fired: 0, hit: 0, finishes: 0, misses: 0, underdogWinsAfterMiss: 0, damageBands: { shallow: 0, medium: 0, deep: 0, fatal: 0 } },
  },
  openingFinishMq: [],
  // タスク69 §1: OVR差バンドを細分化 + tier1/tier2/carried(消耗持ち越し大会)を分離。
  // 差0は「格上」概念が無いので strongerWins ではなく leftWins で追う(理論値50%)。
  ovrBandGroups: {
    tier1: createOvrBandSet(),
    tier2: createOvrBandSet(),
    carried: createOvrBandSet(),
  },
};

// Task 11: MQ inventory probe. These samples only observe values already
// returned by the engines or by Engine.executeShow; they do not feed back into
// simulation state.
const mqInventoryProbe = {
  singlesRaw: [],
  tagRaw: [],
  regularFinal: [],
  uiRouteEstimate: [],
};

// MQ再設計P3c(mq-redesign-proposal-v0.5 §3.2/§3.2b/§3.4b/G) 計測:
// fp分布・観客帯pressureFactor割合・興行内観客寄与σ・興行平均MQ・鮮度→集客移管の影響。
const mqP3cProbe = {
  showFp: [],
  pressureBandCounts: { plus10: 0, plus05: 0, zero: 0, minus05: 0, minus10: 0 },
  showCrowdSigma: [],
  showAvgMq: [],
  freshnessAttendanceDeltaPct: [],
  freshnessMultActiveMatches: 0,
  freshnessMultTotalMatches: 0,
  domeShowCount: 0,
};

// MQ再設計P3d 物差し再較正(mq-p3d-baseline-compare-v0.1) 計測:
// 回収前後の同一seed比較用。fp/season/venueIdxタグ付き分布、通常興行の生MQ、
// 興行収入(チケット+興行連動グッズ/メディア)、ブレークスルー発火数、シーズン末trust/人気平均。
// 既存ロジックには接続しない横計測(読み取り専用)。
const p3dProbe = {
  fpSamples: [],       // {fp, season, venueIdx}
  normalShowMq: [],    // {mq, season} 通常興行の全試合(シングル+タッグ)の生MQ
  showRevenue: [],     // {revenue, season} 興行収入(チケット/興行ブースト/興行放映/期待カード/ライバル抗争メディア)
  breakthroughs: { total: 0, perSeason: new Map() },
  seasonEnd: [],       // {season, avgTrust, avgPopularity} 自団体ロスター(レンタル除く)
};

// 成長ブレークスルー発火の観測(既存戻り値を横取りするだけ・シミュレーション状態には影響しない)
const _checkAndApplyBreakthroughForP3dProbe = Engine.growthEvents.checkAndApplyBreakthrough;
Engine.growthEvents.checkAndApplyBreakthrough = function(rng, fighter, mq, oppOvr, context, season, week, breakthroughMult) {
  const result = _checkAndApplyBreakthroughForP3dProbe.apply(this, arguments);
  if (result) {
    p3dProbe.breakthroughs.total++;
    const key = String(season);
    p3dProbe.breakthroughs.perSeason.set(key, (p3dProbe.breakthroughs.perSeason.get(key) || 0) + 1);
  }
  return result;
};

// Task 22: observe industry-wide all-time MQ record updates without changing
// production state or RNG consumption.
// MQ再設計P3e(§2.2): シングル/タッグ分離後は記録プローブも用途別に分けて収集する。
const mqRecordProbe = { updates: [], updatesSingle: [], updatesTag: [] };
if (Engine.mq && typeof Engine.mq.updateRecord === 'function') {
  const updateMqRecord = Engine.mq.updateRecord;
  Engine.mq.updateRecord = function(state, matchResult, metadata) {
    const result = updateMqRecord.call(this, state, matchResult, metadata);
    if (result.updated) {
      mqRecordProbe.updates.push({ ...result.record });
      if (metadata && metadata.matchType === 'tag') {
        mqRecordProbe.updatesTag.push({ ...result.record });
      } else {
        mqRecordProbe.updatesSingle.push({ ...result.record });
      }
    }
    return result;
  };
}

// Task 16: production paths other than executeShow finalize MQ in their own
// functions. Keep references to their returned result objects so the final MQ
// can be compared with a hypothetical App-style upper clamp without changing
// the simulation state or the production calculation.
const mqPathProbe = {
  aiShow: [],
  ppv: [],
  eventMatch: [],
  juniorTournament: [],
  tenchosen: [],
  springTagLeague: [],
  autumnWar: [],
};
let activeMqPathOrigin = null;

const _simulateMatchForBalanceProbe = Engine.battle.simulateMatch;
Engine.battle.simulateMatch = function(charL, charR, rng, matchTier, opts) {
  const result = _simulateMatchForBalanceProbe.call(this, charL, charR, rng, matchTier, opts);
  if (activeMqPathOrigin && mqPathProbe[activeMqPathOrigin]) {
    mqPathProbe[activeMqPathOrigin].push({ result, baseMq: result.mq });
  }
  const resolvedTier = result.matchTier || matchTier || 1;
  result._legacyPacingMq = mqWithLegacyPacing(result, resolvedTier, charL, charR);
  const leftOvr = Engine.util.ov(charL);
  const rightOvr = Engine.util.ov(charR);
  const gap = Math.abs(leftOvr - rightOvr);
  const strongerSide = leftOvr === rightOvr ? null : leftOvr > rightOvr ? 'left' : 'right';
  // タスク69 §1: 消耗持ち越し(初期HPが最大HPより低い)かどうかで集計を分ける。
  // 天頂戦/対抗戦の勝ち残りなど、_hpOverride が付くビッグマッチはここで carried 扱いにする。
  const _maxLeftHp = result.hpLeft && result.hpLeft.max;
  const _maxRightHp = result.hpRight && result.hpRight.max;
  const _startLeftHp = charL._hpOverride != null ? charL._hpOverride : _maxLeftHp;
  const _startRightHp = charR._hpOverride != null ? charR._hpOverride : _maxRightHp;
  const isCarriedMatch = (_maxLeftHp != null && _startLeftHp < _maxLeftHp)
    || (_maxRightHp != null && _startRightHp < _maxRightHp);
  const ovrGroupKey = isCarriedMatch ? 'carried' : (resolvedTier >= 2 ? 'tier2' : 'tier1');
  const ovrGroup = matchBalanceProbe.ovrBandGroups[ovrGroupKey];
  if (gap === 0) {
    ovrGroup.zero.matches++;
    if (result.winner === 'left') ovrGroup.zero.leftWins++;
  } else {
    const ovrBandEntry = ovrGroup.bands[ovrGapBandKey(gap)];
    ovrBandEntry.matches++;
    if (strongerSide && result.winner === strongerSide) ovrBandEntry.strongerWins++;
  }
  matchBalanceProbe.matches++;
  matchBalanceProbe.turns += result.turns || 0;
  matchBalanceProbe.timeouts += result.finishPhase === 'Timeout' ? 1 : 0;
  matchBalanceProbe.mq.push(result.mq || 0);
  matchBalanceProbe.legacyPacingMq.push(result._legacyPacingMq);
  if (result.mqDetail) {
    const detail = result.mqDetail;
    mqInventoryProbe.singlesRaw.push({
      ceiling: detail.ceiling,
      dramaPenalty: detail.dramaPenalty,
      pacingPenalty: detail.pacingPenalty,
      finishPenalty: detail.finishPenalty,
      rawBeforeLowerClamp: detail.ceiling - detail.dramaPenalty - detail.pacingPenalty - detail.finishPenalty,
      finalMq: result.mq,
      avgOV: (leftOvr + rightOvr) / 2,
      tier: resolvedTier,
      hasMeishoubu: Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機'),
      hasHikidashi: Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手'),
      transcendFired: !!result.transcend?.fired,
      transcendExcess: result.transcend?.excess || 0,
      transcendOverflow: result.transcend?.overflow || 0,
      // MQ再設計P3c(§3.7b計測4): OV100超の減衰シーリング。detail.ceilingはringOvAdjust込みの
      // 実効avgOVで計算済みなので、こちらを基準にOV>100ペアを判定する。
      ovCeilingOver100: detail.ceiling > 100,
      ovCeilingUpshift: Math.max(0, detail.ceiling - 100),
      // MQ再設計P3b: リング内化(因縁/タイトル/trust/バフ)の観測。
      winner: result.winner,
      strongerSide,
      // 2026-08-01: 実力差を持たせる。不変条件6 は「同OV帯」で括っていたが、
      // 同じOV帯でも**因縁ペアは実力差が非因縁ペアの半分以下**(実測 3.85 vs 7.89)。
      // 帯だけで括ると母集団の違いを「因縁の偏り」と誤読する。差で括り直すために要る。
      ovrGap: Math.abs(leftOvr - rightOvr),
      rivalryRingTier: result.rivalryRing ? result.rivalryRing.tier : 0,
      titleRingApplied: !!result.titleRing,
      trustDebuffSum: Array.isArray(result.trustDebuff)
        ? (result.trustDebuff[0] || 0) + (result.trustDebuff[1] || 0) : 0,
      ovBuffSum: Array.isArray(result.ovBuff)
        ? (result.ovBuff[0] || 0) + (result.ovBuff[1] || 0) : 0,
    });
  }
  const phaseTiming = matchBalanceProbe.phaseTiming[(result.matchTier || matchTier || 1) >= 2 ? 'big' : 'normal'];
  const phaseConfig = (result.matchTier || matchTier || 1) >= 2 ? BIGMATCH_PHASES : PHASES;
  const completedTurns = Math.max(0, Math.min(result.turns || 0, phaseTiming.turnHistogram.length - 1));
  phaseTiming.matches++;
  if (completedTurns >= phaseTiming.climaxStart) phaseTiming.reachedClimax++;
  phaseTiming.turnHistogram[completedTurns]++;
  const finishPhaseKey = result.finishPhase === 'Timeout' ? 'Timeout' : result.finishPhase;
  if (phaseTiming.finishPhases[finishPhaseKey] != null) phaseTiming.finishPhases[finishPhaseKey]++;
  for (const phase of phaseConfig) {
    const turnsInPhase = Math.max(0, Math.min(completedTurns, phase.max) - phase.min + 1);
    phaseTiming.phaseTurns[phase.name] += turnsInPhase;
  }
  if ((result.matchTier || matchTier || 1) >= 2) {
    const maxLeft = result.hpLeft.max;
    const maxRight = result.hpRight.max;
    const startLeft = charL._hpOverride != null ? charL._hpOverride : maxLeft;
    const startRight = charR._hpOverride != null ? charR._hpOverride : maxRight;
    const startHpRatios = [startLeft / maxLeft, startRight / maxRight];
    const isCarried = startLeft < maxLeft || startRight < maxRight;
    const overrideAtFullHealth = !isCarried && (charL._hpOverride != null || charR._hpOverride != null);
    recordBigStartGroup(
      matchBalanceProbe.bigStartGroups[isCarried ? 'carried' : 'full'],
      result,
      startHpRatios,
      isCarried ? activeBigMatchOrigin : null,
      overrideAtFullHealth
    );
  }
  const selection = result.moveSelectionStats;
  if (selection) {
    matchBalanceProbe.moveSelections += selection.total || 0;
    matchBalanceProbe.rollupSelections += selection.rollup || 0;
    const forcedFinisher = selection.forcedFinisher || 0;
    const normalFinisher = Math.max(0, (selection.finisher || 0) - forcedFinisher);
    matchBalanceProbe.finisherSelections += normalFinisher;
    matchBalanceProbe.forcedFinisherSelections += forcedFinisher;
    matchBalanceProbe.consecutiveBigSelections += selection.consecutiveBig || 0;
    if (normalFinisher === 0) matchBalanceProbe.zeroFinisherMatches++;
    for (const [phase, counts] of Object.entries(selection.byPhase || {})) {
      if (!matchBalanceProbe.tiersByPhase[phase]) {
        matchBalanceProbe.tiersByPhase[phase] = { small: 0, medium: 0, big: 0, rollup: 0 };
      }
      for (const tier of ['small', 'medium', 'big', 'rollup']) {
        matchBalanceProbe.tiersByPhase[phase][tier] += counts[tier] || 0;
      }
    }
  }
  if (result.finMoveTier === 'small') {
    if (result.finType === 'TKO') matchBalanceProbe.smallTkoFinishes++;
    else matchBalanceProbe.smallFallOrGuFinishes++;
  }
  if (result.openingExecutionEligible) {
    const openingBand = result.openingExecutionGap < 20 ? '15-19'
      : result.openingExecutionGap < 25 ? '20-24'
      : result.openingExecutionGap < 30 ? '25-29'
      : '30+';
    const opening = matchBalanceProbe.openingExecution[openingBand];
    opening.eligible++;
    if (result.openingExecutionChecked) opening.checked++;
    if (result.openingExecution) {
      opening.fired++;
      if (result.openingExecutionHit) {
        opening.hit++;
        const damageBand = result.openingExecutionData && result.openingExecutionData.damageBand;
        if (damageBand && opening.damageBands[damageBand] != null) opening.damageBands[damageBand]++;
      } else {
        opening.misses++;
        if (result.winner !== result.openingExecutionStrongerSide && result.winner !== 'draw') {
          opening.underdogWinsAfterMiss++;
        }
      }
      if (result.openingExecutionData && result.openingExecutionData.finished) {
        opening.finishes++;
        matchBalanceProbe.openingFinishMq.push(result.mq || 0);
      }
    }
  }
  return result;
};

const _simulateTagMatchForMqInventory = Engine.tagMatch.simulateTagMatch;
Engine.tagMatch.simulateTagMatch = function(teamA, teamB, rng, opts) {
  const result = _simulateTagMatchForMqInventory.call(this, teamA, teamB, rng, opts);
  if (activeMqPathOrigin && mqPathProbe[activeMqPathOrigin]) {
    mqPathProbe[activeMqPathOrigin].push({ result, baseMq: result.mq });
  }
  if (result?.mqDetail) {
    const detail = result.mqDetail;
    const fighters = [teamA.fighter1, teamA.fighter2, teamB.fighter1, teamB.fighter2];
    mqInventoryProbe.tagRaw.push({
      ceiling: detail.ceiling,
      dramaPenalty: detail.dramaPenalty,
      pacingPenalty: detail.pacingPenalty,
      finishPenalty: detail.finishPenalty,
      screenTimeBonus: detail.screenTimeBonus,
      touchDiversityBonus: detail.touchDiversityBonus,
      dramaEventBonus: detail.dramaEventBonus,
      finishBonus: detail.finishBonus,
      longSegPenalty: detail.longSegPenalty,
      screenTimePenalty: detail.screenTimePenalty,
      tagBonus: detail.tagBonus,
      tagPenalty: detail.tagPenalty,
      rawBeforeClamp: detail.ceiling - detail.dramaPenalty - detail.pacingPenalty - detail.finishPenalty
        + detail.tagBonus - detail.tagPenalty,
      finalMq: result.mq,
      avgOV: fighters.reduce((sum, fighter) => sum + Engine.util.ov(fighter), 0) / fighters.length,
      hasMeishoubu: fighters.some(fighter => Traits.has(fighter, '名勝負製造機')),
      transcendFired: !!detail.transcend?.fired,
      transcendExcess: detail.transcend?.excess || 0,
      transcendOverflow: detail.transcend?.overflow || 0,
    });
  }
  return result;
};

function wrapBigMatchOrigin(target, method, origin) {
  if (!target || typeof target[method] !== 'function') return;
  const original = target[method];
  target[method] = function(...args) {
    const previous = activeBigMatchOrigin;
    activeBigMatchOrigin = origin;
    try {
      return original.apply(this, args);
    } finally {
      activeBigMatchOrigin = previous;
    }
  };
}

function wrapMqPathOrigin(target, method, origin) {
  if (!target || typeof target[method] !== 'function') return;
  const original = target[method];
  target[method] = function(...args) {
    const previous = activeMqPathOrigin;
    activeMqPathOrigin = origin;
    try {
      return original.apply(this, args);
    } finally {
      activeMqPathOrigin = previous;
    }
  };
}

wrapBigMatchOrigin(Engine.juniorTournament, 'run', 'juniorTournament');
wrapBigMatchOrigin(Engine.ppvTournament, 'run', 'tenchosen');
wrapBigMatchOrigin(Engine.autumnWar, 'simulateNextBout', 'autumnWar');
wrapMqPathOrigin(Engine.rival, 'processAIWeek', 'aiShow');
wrapMqPathOrigin(Engine.ppv, 'simulateTVResults', 'ppv');
wrapMqPathOrigin(Engine.ppv, 'simulatePPVMatch', 'ppv');
wrapMqPathOrigin(Engine.event, 'resolveEventMatch', 'eventMatch');
wrapMqPathOrigin(Engine.juniorTournament, 'run', 'juniorTournament');
wrapMqPathOrigin(Engine.ppvTournament, 'run', 'tenchosen');
wrapMqPathOrigin(Engine.springTagLeague, 'run', 'springTagLeague');
wrapMqPathOrigin(Engine.autumnWar, 'simulateNextBout', 'autumnWar');

// グローバルに展開されたか確認
if (typeof Engine === 'undefined') {
  console.error('ERROR: Engine が読み込めませんでした');
  process.exit(1);
}
if (typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: ALL_CHARS が読み込めませんでした');
  process.exit(1);
}

// ── Step 2: パラメータ解析 ──
console.log('=== Wrestle Manager Auto-Simulation ===');
console.log('Mode: engine-integrity (エンジン整合性チェック)');
console.log('※ プレイ再現ではありません。バランス判断の単独根拠にしないでください。');
console.log(`Seed: ${userSeed}`);
console.log(`Seasons: ${targetSeasons}`);
console.log(`Source: ${sourceRef || 'working-tree'}`);
console.log('--------------------------------------');

// ── Step 3: ゲーム初期化 ──
//
// ■ 派閥計測モード (WM_FACTION_FIXTURE=1)
//   通常の auto-sim では自団体ロスターが平均7.5人までしか育たず、FACTION_CONFIG.minRosterSize(10)
//   に届かない。そのため 40 シーズン回しても派閥イベントは 1 件も発生せず、
//   「factions.js を編集すると auto-sim が走る」というフックは派閥のコードを一行も踏んでいない
//   （2026-07-27 実測）。派閥まわりの発生率を測るときだけ、この環境変数でロスターを積む。
//   ※ロスターが rosterCap を超えるため validateGameState の「キャップ超過」違反が出る。
//     これは fixture の副作用であって派閥側の不具合ではない。整合性チェック目的では使わないこと。
function initGame(seed) {
  let G = Engine.createInitialState(seed, true); // skipDraft=true（ドラフトスキップ）
  G = { ...G, debugLog: G.debugLog || [] };
  if (process.env.WM_FACTION_FIXTURE === '1') {
    const rngP = Engine.rng.create((seed ^ 0x1234) >>> 0);
    const existingIds = new Set(G.roster.map(x => x.id));
    const cands = (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS : [])
      .filter(x => !existingIds.has(x.id)).slice(0, 12);
    const extra = cands.map(t => {
      const f = Engine.makeChar(t, rngP, G.orgId);
      return { ...f, orgJoinWeek: 1, contractOVR: Engine.util.ov(f), contractPop: f.popularity || 0 };
    });
    G = { ...G, roster: [...G.roster, ...extra], funds: 5000, rosterCap: 16, orgPop: 30 };
  }
  return G;
}

// ── Step 4: プレイヤー判断のランダム自動化 ──

// MQ再設計P3c 計測6: 鮮度→集客移管(§1.3/G)の動員影響。
// パフォーマンス注記: Engine.freshness.calc は matchupLog 全体を毎回フィルタする O(log長) 処理で、
// 興行を重ねるほど log が伸びて重くなる(auto-simの実行時間が季節数に対し超線形な主因)。
// 独自に calc() や calcMatchAppeal を追加で呼び直すと、その O(log長) コストが二重・三重になり
// 実行時間が跳ね上がる。そのため「本番が実際に呼んでいる calcMatchAppeal 呼び出し」に相乗りし、
// 鮮度係数を後から除算で復元する(追加コストは実質ゼロ)。
let _freshnessShowWithSum = 0;
let _freshnessShowWithoutSum = 0;
const _origCalcMatchAppealForFreshnessProbe = Engine.attendanceV2.calcMatchAppeal;
Engine.attendanceV2.calcMatchAppeal = function(fighterA, fighterB, context, G) {
  const result = _origCalcMatchAppealForFreshnessProbe.call(this, fighterA, fighterB, context, G);
  const bonus = (context && context.freshnessRawBonus) || 0;
  mqP3cProbe.freshnessMultTotalMatches++;
  if (bonus) mqP3cProbe.freshnessMultActiveMatches++;
  const mult = Engine.freshness.attendanceMult(bonus);
  const withoutF = mult ? result / mult : result;
  _freshnessShowWithSum += result;
  _freshnessShowWithoutSum += withoutF;
  return result;
};

// 興行カード自動編成
// TODO[heuristic]: ランダムシャッフルで代用。本番ではプレイヤーが戦略的に編成する。
//   因縁カード・タイトル戦の意図的配置、人気選手の起用頻度管理などは再現されない。
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  const unifiedIncoming = Engine.unifiedTitle?.getIncomingMatch(G) || null;
  if (roster.length < 2 && !unifiedIncoming) return G;

  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined'
    ? (VENUES[venueIdx] || VENUES[0]).maxMatches
    : 4;
  const isSpecial = G.week % 12 === 0;
  const effectiveMax = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);

  // ロスターをシャッフル
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({
      left: shuffled[i].id,
      right: shuffled[i + 1].id,
      isTitle: false,
    });
  }

  // タッグマッチ挿入（8興行に1回、4人以上余っている場合）
  if (card.length >= 2 && (G.totalShows || 0) % 8 === 3) {
    // 最後の2試合（4人）をタッグ1試合に置換
    const tagSlots = card.splice(card.length - 2, 2);
    card.push({
      matchType: 'tag',
      teamA: { fighter1: tagSlots[0].left, fighter2: tagSlots[0].right },
      teamB: { fighter1: tagSlots[1].left, fighter2: tagSlots[1].right },
    });
  }

  // タイトルマッチ判定（確立済み＆クールダウンOK）
  if (G.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(G);
    if (cd.allowed) {
      const champId = G.titles.world.championId;
      if (champId) {
        // 王者在位: 王者が含まれる試合をタイトル戦に
        const titleMatch = card.find(m => m.left === champId || m.right === champId);
        if (titleMatch) titleMatch.isTitle = true;
      } else {
        // 王座空位: メイン枠を初代王者決定戦に
        const mainMatch = card[0];
        if (mainMatch && mainMatch.left > 0 && mainMatch.right > 0) {
          const roster = G.roster || [];
          const hasRental = [mainMatch.left, mainMatch.right].some(id => roster.find(c => c.id === id)?.isRental);
          if (!hasRental) mainMatch.isTitle = true;
        }
      }
    }
  }

  if (unifiedIncoming) {
    const reserved = Engine.unifiedTitle.reserveIncomingMatch(G);
    if (reserved.match) {
      const blockedIds = new Set([reserved.match.championId, reserved.match.challengerId]);
      const remaining = card.filter(match => {
        if (match.matchType === 'tag') {
          return ![
            match.teamA?.fighter1, match.teamA?.fighter2,
            match.teamB?.fighter1, match.teamB?.fighter2,
          ].some(id => blockedIds.has(id));
        }
        return !blockedIds.has(match.left) && !blockedIds.has(match.right);
      });
      const guest = {
        ...reserved.match.challenger,
        isUnifiedTitleGuest: true,
        _unifiedGuestOrgId: reserved.match.challengerOrgId,
      };
      return {
        ...reserved.state,
        roster: [...(G.roster || []).filter(f => !f.isUnifiedTitleGuest), guest],
        showCard: [reserved.match.slot, ...remaining].slice(0, effectiveMax),
        showVenue: venueIdx,
      };
    }
  }

  return { ...G, showCard: card, showVenue: venueIdx };
}

// 選択型イベントのランダム応答
// TODO[heuristic]: 50%ランダムで代用。本番ではプレイヤーが状況判断で選択する。
function autoHandleChoiceEvent(G, simRng) {
  if (!G._pendingChoiceEvent) return G;
  const event = G._pendingChoiceEvent;
  // ランダムにA/Bを選択
  const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveChoice === 'function') {
    const result = Engine.events.resolveChoice(G, choice);
    if (result && result.state) {
      return result.state;
    }
  }
  // 選択イベントを消化
  const { _pendingChoiceEvent: _, ...clean } = G;
  return clean;
}

// 大型イベントの自動処理
function autoHandleLargeEvent(G, simRng) {
  if (!G._pendingLargeEvent) return G;
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveLargeEvent === 'function') {
    const result = Engine.events.resolveLargeEvent(G, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (result && result.state) return result.state;
  }
  const { _pendingLargeEvent: _, ...clean } = G;
  return clean;
}

// 派閥イベントの発生内訳（WM_FACTION_FIXTURE=1 のとき末尾に出力する）
const factionEventCensus = { byEvent: {}, byF07Incident: {} };
// 殿堂入り計測 (WM_HOF_FIXTURE=1)。G はシミュレーションループのスコープ内にあるので、
// ループ末でここへ引退者を移しておき、最後にトップレベルで集計する
const hofCensus = [];
const hofSeenIds = new Set();
let lastAllHallOfFame = null;
const hofPlayerRosterEver = new Set(); // 一度でも自団体に在籍した選手id（引退後は roster から消えるので毎週ためる）

// ── 王座の保持期間 計測 (WM_TITLE_FIXTURE=1) ────────────────────────────
// Keisuke「平均2.7回防衛なら1年も持たない」。記事文を「N年保持」ではなく「N度防衛」と
// 書く規約にしたいので、**実データの分布を測ってから語彙を決める**（引き継ぎメモ E）。
//
// tickWeek の後に G を覗くだけの**読み取り専用**の横計測。エンジンを1回も呼ばないので、
// 本編の乱数消費にもシーズン推移にも触れない（fingerprint が動かないこと自体が条件）。
const titleCensus = { reigns: [], open: new Map() };
// 新聞P2: 一面トップの種別分布 (WM_FRONTPAGE_FIXTURE=1)。読み取り専用
const frontPageCensus = { total: 0, byType: {}, values: [] };
function censusTitleReigns(state) {
  if (!state) return;
  const absWeek = (state.season - 1) * 48 + (state.week || 1);
  const belts = [['player', state.titles]];
  for (const id in (state.aiOrgs || {})) belts.push([id, (state.aiOrgs[id] || {}).titles]);
  for (const [orgId, titles] of belts) {
    const belt = titles && titles.world;
    const champ = belt ? (belt.championId != null ? belt.championId : null) : null;
    const prev = titleCensus.open.get(orgId);
    if (!prev || prev.champ !== champ) {
      // 王者が代わった/空位になった → 直前の在位を1件として閉じる
      if (prev && prev.champ != null) {
        titleCensus.reigns.push({
          orgId, weeks: Math.max(1, absWeek - prev.start), defenses: prev.defenses || 0,
        });
      }
      titleCensus.open.set(orgId, { champ, start: absWeek, defenses: (belt && belt.defenses) || 0 });
    } else if (belt) {
      // 在位中。防衛数は王座陥落時に 0 へ戻るので、毎週の最大値を持っておく
      prev.defenses = Math.max(prev.defenses || 0, belt.defenses || 0);
    }
  }
}

// ── 給与カーブ計測 (WM_SALARY_FIXTURE=1) ────────────────────────────────
// 給与の下り坂設計(docs/salary-decline-proposal-v0.1.md)の較正材料。
// 契約更改の直前(generateNegotiations呼び出し時 = contractOVR/Pop再固定前)に
// 自団体ロスターの給与・適正給・gapRatio を控える。フックは既存戻り値を
// 横取りするだけで、シミュレーション状態にも乱数消費にも触れない。
const salaryCensus = { renewals: [], raises: [] };
if (process.env.WM_SALARY_FIXTURE === '1') {
  const _generateNegotiationsForSalaryCensus = Engine.contract.generateNegotiations;
  Engine.contract.generateNegotiations = function(rng, state) {
    try {
      for (const f of (state.roster || [])) {
        if (f.isRental) continue;
        const salary = Engine.util.getSalary(f, state.titles);
        const fair = Engine.util.getSalary(
          { ...f, contractOVR: Engine.util.ov(f), contractPop: f.popularity || 0 },
          state.titles
        );
        salaryCensus.renewals.push({
          season: state.season, id: f.id, name: f.name, age: f.age || 17,
          ovr: Engine.util.ov(f), pop: Math.round(f.popularity || 0),
          wear: f.wear || 0, trust: f.trust != null ? f.trust : 50,
          bonus: f.salaryBonus || 0, salary, fair,
          gapRatio: salary > 0 ? fair / salary : 1.0,
        });
      }
    } catch (_e) { /* 計測エラーはゲームに影響させない */ }
    return _generateNegotiationsForSalaryCensus.call(this, rng, state);
  };
  const _resolveNegotiationForSalaryCensus = Engine.contract.resolveNegotiation;
  Engine.contract.resolveNegotiation = function(rng, state, neg, choiceIdx, subChoice) {
    const result = _resolveNegotiationForSalaryCensus.call(this, rng, state, neg, choiceIdx, subChoice);
    try {
      if (result && result.result && result.result.salaryDelta > 0) {
        salaryCensus.raises.push({
          season: state.season, id: neg.fighterId,
          delta: result.result.salaryDelta, attitude: neg.attitude,
        });
      }
    } catch (_e) { /* 計測エラーはゲームに影響させない */ }
    return result;
  };
}

// Phase 3a: 派閥イベント自動処理（F01/F02/F03 をランダムに応答）
function autoHandleFactionEvent(G, simRng) {
  if (!G._pendingFactionEvent) return G;
  const fe = G._pendingFactionEvent;
  factionEventCensus.byEvent[fe.eventId] = (factionEventCensus.byEvent[fe.eventId] || 0) + 1;
  if (fe.eventId === 'F07') {
    const it = (fe.payload && fe.payload.incidentType) || '(none)';
    factionEventCensus.byF07Incident[it] = (factionEventCensus.byF07Incident[it] || 0) + 1;
  }
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA90));
  let s = G;
  try {
    if (fe.eventId === 'F01') {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const r = Engine.factions.applyF01Choice(s, fe.payload, choiceId, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02') {
      // v4: 3択化 (A=煽る / B=仲裁 / C=介入しない)
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

// PPVエントリー自動選択
function autoHandlePPVEntry(G, simRng) {
  if (G.weekPhase !== 'ppvEntry') return G;
  // ロスターから上位の健康な選手を選択
  const healthy = G.roster.filter(c => !c.injury && !c.isRental);
  const sorted = [...healthy].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  // PPVスロット数を取得
  const rankings = Engine.ranking.updateRankings(G);
  const playerRank = Engine.ranking.getPlayerRank(rankings);
  const slots = (typeof PPV_SLOTS !== 'undefined' ? PPV_SLOTS[playerRank] : 3) || 3;

  const entries = sorted.slice(0, Math.min(slots, sorted.length));
  if (typeof Engine.ppv !== 'undefined' && typeof Engine.ppv.confirmEntry === 'function') {
    // confirmEntryがある場合はそれを使う
    const ppvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF0));
    const ppvResult = Engine.ppv.generateCard(G, ppvRng);
    G = { ...G, ppvEntries: ppvResult.entries || {}, ppvPhase: 'locked' };
  } else {
    G = { ...G, ppvPhase: 'locked' };
  }
  return G;
}

// 契約更新交渉の自動処理
// TODO[heuristic]: 確率ベースの自動応答。本番ではプレイヤーが個別に判断する。
//   昇給受諾率・引留率が固定確率のため、trust管理やロスター戦略の影響を反映しない。
function autoHandleContractNegotiation(G, simRng) {
  if (G.weekPhase !== 'contractNegotiation') return G;
  const negotiations = G.pendingContractNegotiations || [];
  let state = { ...G };
  for (const neg of negotiations) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    // v2.0: 突発退団は選択肢なし — 即退団
    if (neg.attitude === 'sudden_departure') {
      const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, 0);
      state = result.state;
      continue;
    }
    const roll = Engine.rng.float(simRng);
    let choiceIdx, subChoice;
    if (neg.attitude === 'decline') {
      // 据え置き30% / 査定どおり50% / 厳しく20%
      choiceIdx = roll < 0.3 ? 0 : (roll < 0.8 ? 1 : 2);
    } else if (neg.attitude === 'decline_voluntary') {
      // 据え置き30% / 申し出を受け入れる70%
      choiceIdx = roll < 0.3 ? 0 : 1;
    } else if (neg.attitude === 'raise') {
      // 70% 受ける, 20% 交渉, 10% 拒否
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      // 60% 引留, 20% 理由を聞く→引留, 20% 送り出す
      if (roll < 0.6) { choiceIdx = 0; }
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else { choiceIdx = 2; }
    }
    if (process.env.WM_SALARY_FIXTURE === '1'
        && (neg.attitude === 'decline' || neg.attitude === 'decline_voluntary')) {
      salaryCensus.declines ||= [];
      salaryCensus.declines.push({
        season: state.season,
        id: neg.fighterId,
        attitude: neg.attitude,
        choice: ['A', 'B', 'C'][choiceIdx],
      });
    }
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = result.state;
    // 昇給拒否→移籍志願に発展した場合、引き留めを試みる
    if (result.result.escalated) {
      const escNeg = { ...neg, attitude: 'transfer' };
      const escResult = Engine.contract.resolveNegotiation(resolveRng, state, escNeg, 0);
      state = escResult.state;
    }
  }
  // transientフィールドクリア
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
}

// スカウトイベント自動処理（draft-negotiation-spec: セリエンジン使用）
// TODO[heuristic]: 資金40%上限・8ラウンド撤退の簡易AI。本番のドラフト戦略とは異なる。
//   プレイヤーの指名優先度、競合団体との駆け引き、ロスター構成を考慮した補強は再現されない。
function autoHandleScoutEvent(G, simRng) {
  if (G.weekPhase !== 'scoutEvent') return G;
  const candidates = G.scoutCandidates || [];
  if (candidates.length === 0) return G;

  const maxPicks = G.scoutMaxPicks || 4;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  const rosterCap = G.rosterCap || 16;
  let playerPicks = 0;

  // ダミープレイヤー: 資金に余裕があれば標準で粘る、10ラウンドで降りる
  const playerFn = (candidateId, round, currentBid, interests) => {
    if (playerPicks >= maxPicks) return 'drop';
    if (ownCount + playerPicks >= rosterCap) return 'drop';
    if (currentBid > G.funds * 0.4) return 'drop'; // 資金の40%超えたら降りる
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
  const log = [...(G.gameLog || [])];

  const normFighter = (f) => ({
    ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
    injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false, intensiveWeeks: 0,
    // 2026-08-29 Fix-B追随: 本体(ui-common)のnormFighterと同じくactive化する
    careerStage: 'active',
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
        // 取れなかった→フリー市場
        newFA.push(normFighter(clean));
      }
    } else if (r.winner && r.winner !== 'player') {
      // AI団体が落札
      const orgData = newAiOrgs[r.winner];
      if (orgData) {
        const recruited = normFighter({ ...clean, orgId: r.winner });
        Engine.rival.pushUniqueFighter(orgData.roster, recruited);
      }
    } else {
      // 流札 → フリー市場
      newFA.push(normFighter(clean));
    }
  }

  // §6 EMPRESS安全網
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
    ...G,
    roster: newRoster,
    funds: newFunds,
    aiOrgs: newAiOrgs,
    freeAgents: newFA,
    dormantPool: newDormant,
    scoutCandidates: null,
    scoutPicks: null,
  };
}

// transientフィールドを一括消化するヘルパー
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

// ══════════════════════════════════════════════════════════════════════════════
//  care-rework2 P0-5: ケア自動実行モード (--care)
//
//  ■ 目的
//    auto-sim は長らくケアアクション(決裁書類)を一度も実行してこなかった。
//    その結果、7月以降のバランス較正がすべて「ケアを使わない世界」だけを物差しに
//    行われてきた(docs/care-rework2-plan-v0.1.md §1.2)。以後の較正を
//    「使う世界/使わない世界」の両方で確認できるようにするための計装。
//
//  ■ 自動プレイヤーの方針(すべて決定論。Math.random は使わない)
//    毎週 manage フェーズで、指示書の優先順に決裁枠⚡と資金の許す限り実行する:
//      bonus → party → refresh_leave → special_treatment → media → trainer → camp
//    対象選手はプールから決定的な規則(下記)で選び、同順位は id 昇順で割る。
//
//  ■ 注意: これは「エンジンの発動条件」ではなく「自動プレイヤーの方針」である。
//    refresh_leave / media / trainer / camp は activationCondition が null
//    (=常時発動可)なので、素直に回すと毎週撃ち続けて実プレイと乖離する。
//    そこで方針側に閾値ゲートを置いている(下記コメント参照)。閾値は
//    エンジンには一切影響しない — auto-sim のプレイヤー判断の代用にすぎない。
// ══════════════════════════════════════════════════════════════════════════════

const CARE_PRIORITY = ['bonus', 'party', 'refresh_leave', 'special_treatment', 'media', 'trainer', 'camp'];
const careStats = {
  totalSpend: 0,
  totalDp: 0,
  counts: {},
  errors: {},
  cooldownSkips: {},
  trustSamples: [],
  moraleSamples: [],
};

// 現場にいる選手(レンタル・怪我・休暇を除く)
function careEligible(f) { return !!f && !f.isRental && !f.injury && !f.onLeave; }

// 決定的な最小値/最大値選択(同値は id 昇順)
function carePickBy(pool, scoreFn, wantMax) {
  let best = null, bestScore = null;
  for (const f of pool) {
    const s = scoreFn(f);
    if (bestScore === null
      || (wantMax ? s > bestScore : s < bestScore)
      || (s === bestScore && f.id < best.id)) {
      best = f; bestScore = s;
    }
  }
  return best;
}

// 書類ごとの対象選手 + options を決める。実行対象がなければ null。
function carePickTarget(docId, G) {
  const roster = G.roster || [];
  const live = roster.filter(careEligible);

  if (docId === 'bonus') {
    // 発動条件と同じプール(trust<60)から、最も信頼が低い選手へ。
    // 起案4案は index1 = 基準額×1.0 を選ぶ(×0.5 はプライド選手への侮辱帯なので避ける)。
    const pool = live.filter(f => (f.trust != null ? f.trust : 50) < 60);
    const t = carePickBy(pool, f => (f.trust != null ? f.trust : 50), false);
    return t ? { fighterId: t.id, options: { presetIndex: 1 } } : null;
  }
  if (docId === 'party' || docId === 'camp') {
    // 団体書類(対象指定なし)。発動可否と決裁枠・資金は execute 側が判定する。
    // camp(⚡3)は優先順位が最後尾なので、上位書類が枠を使い切った週は自然に落ちる。
    return live.length > 0 ? { fighterId: null, options: undefined } : null;
  }
  if (docId === 'refresh_leave') {
    // 常時発動可。方針ゲート: 体調50未満の選手がいるときだけ、最も体調が低い1人に2週。
    const pool = live.filter(f => (f.condition || 70) < 50);
    const t = carePickBy(pool, f => (f.condition || 70), false);
    return t ? { fighterId: t.id, options: { weeks: 2 } } : null;
  }
  if (docId === 'special_treatment') {
    // care-rework2 P2-C: 発動条件と同じプール(総週数10以上の長期離脱)から、
    // 最も離脱が長い選手へ。該当者がいない週はスキップ(長期重傷は季0〜1件)。
    const pool = roster.filter(f => !f.isRental && Engine.shachoshitsu.isLongTermInjured(f));
    const t = carePickBy(pool, f => f.injury.weeksLeft || 0, true);
    return t ? { fighterId: t.id, options: undefined } : null;
  }
  if (docId === 'media') {
    // 看板選手を広告塔に。最も人気の高い選手へ。
    const t = carePickBy(live, f => f.popularity || 0, true);
    return t ? { fighterId: t.id, options: undefined } : null;
  }
  if (docId === 'trainer') {
    // §3.2 同時招聘は1件まで。空いているときだけ、伸びしろ(trainCap残)が最大の選手へ。
    if (roster.some(f => f._inviteBuff)) return null;
    const pool = live.filter(f => !f._inviteBuff);
    const room = f => ['pw', 'te', 'sp', 'st'].reduce((s, k) => {
      const cap = (f.trainCap && f.trainCap[k] != null) ? f.trainCap[k] : (f.pot && f.pot[k]) || f[k];
      return s + Math.max(0, cap - (f[k] || 0));
    }, 0);
    const t = carePickBy(pool, room, true);
    if (!t) return null;
    // 今期市場の候補から、その選手に対する効果(mult)が最大のコーチを選ぶ。
    const market = Engine.shachoshitsu.ensureInviteMarket(G);
    const ids = (market && market.candidateIds) || [];
    let bestCoach = null, bestMult = -1;
    for (const cid of ids) {
      const coach = ALL_COACHES.find(c => c.id === cid);
      if (!coach) continue;
      const m = Engine.shachoshitsu.calcInviteMult(coach, t, G).mult;
      if (m > bestMult || (m === bestMult && bestCoach && coach.id < bestCoach.id)) { bestMult = m; bestCoach = coach; }
    }
    return bestCoach ? { fighterId: t.id, options: { coachId: bestCoach.id, autoRenew: false } } : null;
  }
  return null;
}

// 1週分のケア決裁。実プレイ(App.executeDecision)と同じ state 反映を行う。
function autoExecuteCare(G) {
  if (!CARE_MODE) return G;
  if (G.offSeason || G.weekPhase !== 'manage') return G;

  const availableIds = new Set(Engine.shachoshitsu.getAvailableDocs(G).map(d => d.id));
  for (const docId of CARE_PRIORITY) {
    if (!availableIds.has(docId)) continue;
    if ((G._decisionDoneThisWeek || []).includes(docId)) continue;
    const doc = Engine.shachoshitsu.getDoc(docId);
    if (!doc) continue;
    if ((G.decisionPoints || 0) < (doc.decisionCost || 0)) continue;

    const pick = carePickTarget(docId, G);
    if (!pick) continue;

    const result = Engine.shachoshitsu.execute(docId, pick.fighterId, G, pick.options);
    if (!result || result.error) {
      // care-rework2 P2-B: 慰労会がCD2週になったため cooldown は「打てない週」の
      // 正常な結果であって不具合ではない。件数だけ別枠で数え、errors には積まない。
      if (result && result.error === 'cooldown') {
        careStats.cooldownSkips[docId] = (careStats.cooldownSkips[docId] || 0) + 1;
        continue;
      }
      const key = `${docId}:${(result && result.error) || 'null'}`;
      careStats.errors[key] = (careStats.errors[key] || 0) + 1;
      continue;
    }

    // ── state 反映(app.js App.executeDecision と同じ順序・同じフィールド) ──
    if (result.factionState) G = result.factionState;
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      _decisionDoneThisWeek: [...(G._decisionDoneThisWeek || []), docId],
      gameLog: [],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    if (result.h2h) G = { ...G, h2h: result.h2h };
    // care-rework2 P2-B: 慰労会の余韻(消化は tickWeek 側)
    if (result._partyAfterglowWeeks) G = { ...G, _partyAfterglowWeeks: result._partyAfterglowWeeks };
    if (result.coachAssign) G = { ...G, coachAssign: result.coachAssign };
    if (result.lastInvitedCoachId != null) G = { ...G, lastInvitedCoachId: result.lastInvitedCoachId };
    if (result.orgPopDelta) {
      const newOrgPop = Engine.util.clamp(
        (G.orgPop || 0) + Engine.orgPop.applyOrgPopChange(result.orgPopDelta, G.orgPop, null), 0, 100);
      G = { ...G, orgPop: newOrgPop };
    }
    if (result._industryNewsEvents && result._industryNewsEvents.length > 0) {
      G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ...result._industryNewsEvents] };
    }

    careStats.totalSpend += result.cost || 0;
    careStats.totalDp += doc.decisionCost || 0;
    careStats.counts[docId] = (careStats.counts[docId] || 0) + 1;
  }
  return G;
}

// 週次サンプリング(ケアあり/なしの比較用。--care でなくても採る)
function careSample(G) {
  const live = (G.roster || []).filter(f => !f.isRental);
  if (live.length === 0) return;
  careStats.trustSamples.push(
    live.reduce((s, f) => s + (f.trust != null ? f.trust : 50), 0) / live.length);
  careStats.moraleSamples.push(G.lockerRoomMorale != null ? G.lockerRoomMorale : 60);
}

// debugLogから違反を収集してクリア
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

// ── Step 5: シミュレーションメインループ ──

// 頻度チェックの期待レンジ定義
// min/max を外れるとバグの疑いがある（ロジック到達不全・確率設定ミスなど）
// ※ 閾値は100シーズン以上のシミュレーションで統計的に安定する値を設定
const FREQ_THRESHOLDS = [
  // 対抗戦: week10/22/34で55%チェック×3 + 干ばつボーナス = 実効約91%/シーズン
  // (バグあり時は transfer window の早期returnでスキップされ低下する)
  { key: 'warRate',   label: '対抗戦/シーズン',           min: 0.75, max: 1.00 },
  { key: 'springTagRate', label: '春タッグ完走/シーズン', min: 0.95, max: 1.00 },
  { key: 'autumnWarRate', label: '秋4団体戦完走/シーズン', min: 0.95, max: 1.00 },
  // スカウト: オフシーズン(1回) + シーズン中week29(1回) = 2.0/シーズンが正常
  // どちらかがバグで消えると ~1.0 まで低下する
  { key: 'scoutRate', label: 'スカウトイベント/シーズン', min: 1.00, max: 2.50 },
  // 興行: isShowWeek(even) × シーズン48週 = 最大24回。イベント等で数回減少しうる
  { key: 'showRate',  label: '興行/シーズン',             min: 18,   max: 26   },
];

function runSimulation(seed, seasons) {
  unifiedRecordsI6Probe.annualMvps = 0;
  unifiedRecordsI6Probe.unifiedChampionMvps = 0;
  const violations = [];
  const errors = [];
  let totalWeeks = 0;
  let gameOverCount = 0;
  let currentSeed = seed;
  const MAX_ITER = seasons * 60; // 安全弁（1シーズン≒52+4週）

  // 頻度トラッキング
  const stats = {
    seasons: 0,
    warEvents: 0,        // warThisSeason が false→true になった回数
    poachEvents: 0,      // weekPhase:'transfer' に遷移した回数
    scoutEvents: 0,      // weekPhase:'scoutEvent' に遷移した回数
    ppvEvents: 0,        // weekPhase:'ppvEntry' に遷移した回数
    springTagCompletedCount: 0, // 春のタッグリーグが champion 確定まで完走した回数
    springTagCancelledCount: 0, // 春のタッグリーグが不開催(チーム不足等)になった回数
    autumnWarCompletedCount: 0, // 4団体勝ち残り対抗戦が champion 確定まで完走した回数
    autumnWarCancelledCount: 0, // 出場団体不足等で不開催になった回数
    tenchosenEligibleCount: 0,   // season%4===0 の対象シーズン数
    tenchosenStartedCount: 0,    // Week43でエントリーが生成された回数
    tenchosenCompletedCount: 0,  // Week48で決勝まで完走した回数
    tenchosenDramaEvents: 0,
    tenchosenZeroDramaCount: 0,
    tenchosenFinalMq: [],
    tenchosenFailedSeasons: [],
    normalPpvCompletedCount: 0,
    normalPpvMainMq: [],
    showCount: 0,        // 実行した興行の総数
    titleMatchCount: 0,  // タイトルマッチの総数
    orgPopHistory: [],   // シーズン末orgPop記録
    fundsHistory: [],    // シーズン末funds記録
    // 新集客v2計測
    v2Samples: [],       // {orgPop, oldAtt, newAtt, reach, draw, showDraw, stars, mqScore, occScore, bonusScore}
    // MQ再設計P4: 大ニュース記事(mqAllTimeRecord/mqTagRecord)が一面になった週数
    mqAllTimeRecordNewsCount: 0,
    mqTagRecordNewsCount: 0,
    // MQ再設計P5: 大ニュース記事(hotProspectDebut/fatedRivals/topChampionInjury)が一面になった週数
    hotProspectDebutNewsCount: 0,
    fatedRivalsNewsCount: 0,
    topChampionInjuryNewsCount: 0,
  };

  let G;
  try {
    G = initGame(currentSeed);
  } catch (e) {
    errors.push({ season: 0, week: 0, seed: currentSeed, error: `initGame failed: ${e.message}`, stack: e.stack });
    return { violations, errors, totalWeeks, gameOverCount };
  }

  let simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
  let completed = 0;
  let iter = 0;
  const tenchosenEligibleSeasons = new Set();
  const tenchosenStartedSeasons = new Set();
  const tenchosenCompletedSeasons = new Set();
  const normalPpvCompletedSeasons = new Set();

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    // 殿堂入り計測 (WM_HOF_FIXTURE=1): state.retiredFighters は**年度末に空にされる
    // 一時バッファ**なので、シーズンをまたぐ前に毎週さらっておく。
    // 最後にまとめて読むと最終年の残りしか取れない(2026-08-01 にこれで測り違えた)
    if (process.env.WM_HOF_FIXTURE === '1' && G) {
      (G.roster || []).forEach(c => { if (c && c.id != null) hofPlayerRosterEver.add(c.id); });
      (G.retiredFighters || []).forEach(f => {
        if (f && f.id != null && f.careerRecord && !hofSeenIds.has(f.id)) {
          hofSeenIds.add(f.id);
          const inPlayer = hofPlayerRosterEver.has(f.id);
          hofCensus.push(Object.assign({}, f.careerRecord, { _wasPlayerRoster: inPlayer, _orgHint: f._orgName || f.orgId || null }));
        }
      });
      if (G.allHallOfFame) lastAllHallOfFame = G.allHallOfFame;
      ([]).forEach(() => {
      });
    }
    try {
      injuryProbe.contextKey = String(currentSeed);
      observeFighterSeasons(G);
      // ── ゲームオーバー判定 ──
      if (G.weekPhase === 'gameover') {
        gameOverCount++;
        violations.push({ season: G.season, week: G.week, message: `GAMEOVER: 資金 ${Math.round(G.funds)}万 で破産` });
        currentSeed = (currentSeed * 1103515245 + 12345) | 0;
        G = initGame(currentSeed);
        simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
        continue;
      }

      // ── 特殊weekPhaseの即座処理（UIが処理するフェーズをバイパス） ──
      if (Engine.ppvTournament.isTournamentSeason(G.season) && !tenchosenEligibleSeasons.has(G.season)) {
        tenchosenEligibleSeasons.add(G.season);
        stats.tenchosenEligibleCount++;
      }
      if (G.ppvTournament && G.ppvTournament.season === G.season
          && !tenchosenStartedSeasons.has(G.season)) {
        tenchosenStartedSeasons.add(G.season);
        stats.tenchosenStartedCount++;
      }
      if (G.ppvTournament?.phase === 'entry') {
        // 天頂戦は weekPhase を奪わないため、専用phaseを見てOVR上位を自動確定する。
        G = Engine.ppvTournament.confirmPlayerEntries(G, Engine.ppvTournament.suggestPlayerEntries(G));
      }
      if (G.weekPhase === 'ppvEntry') {
        G = { ...G, ppvPhase: 'locked' };
      }
      if (G.weekPhase === 'ppvShow') {
        if (!Engine.ppvTournament.isTournamentSeason(G.season) && !normalPpvCompletedSeasons.has(G.season)) {
          const ppvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBBA0));
          const sample = Engine.ppv.simulateTVResults(G, ppvRng);
          const idx = sample.card.findIndex(m => m.isSummit);
          if (idx >= 0 && sample.results[idx]) {
            stats.normalPpvMainMq.push(sample.results[idx].mq);
            stats.normalPpvCompletedCount++;
            normalPpvCompletedSeasons.add(G.season);
          }
        }
        G = { ...G, ppvPhase: 'tv' };
      }
      if (G.weekPhase === 'ppvTV') {
        if (!Engine.ppvTournament.isTournamentSeason(G.season) && !normalPpvCompletedSeasons.has(G.season)) {
          const ppvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBBA0));
          const sample = Engine.ppv.simulateTVResults(G, ppvRng);
          const idx = sample.card.findIndex(m => m.isSummit);
          if (idx >= 0 && sample.results[idx]) {
            stats.normalPpvMainMq.push(sample.results[idx].mq);
            stats.normalPpvCompletedCount++;
            normalPpvCompletedSeasons.add(G.season);
          }
        }
        G = { ...G, ppvPhase: null };
      }
      if (G.weekPhase === 'juniorTournament') {
        // ジュニアトーナメント: エンジンで全試合処理
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
      // 春のタッグリーグ Week11: プレイヤーチーム編成の自動化
      // TODO[heuristic]: サジェスト上位ペア（なければ適格選手からランダムペア）で即確定。
      //   本番ではプレイヤーがケミストリー・因縁等を見て戦略的に組む。
      //   （エンジンは weekPhase を奪わず springTagPhase==='entry' で編成期間を表す）
      if (G.springTagPhase === 'entry') {
        const cand = Engine.springTagLeague.getEntryCandidates(G);
        let pick = cand.suggestions && cand.suggestions[0];
        if (!pick && cand.eligible && cand.eligible.length >= 2) {
          const shuffled = [...cand.eligible].sort(() => Engine.rng.float(simRng) - 0.5);
          pick = { f1Id: shuffled[0].id, f2Id: shuffled[1].id };
        }
        if (pick) {
          G = Engine.springTagLeague.confirmPlayerTeam(G, pick.f1Id, pick.f2Id);
        }
      }
      if (G.weekPhase === 'event' || G.weekPhase === 'transfer' || G.weekPhase === 'scoutEvent') {
        // スカウトでFA獲得を試みる
        if (G.weekPhase === 'scoutEvent') {
          G = autoHandleScoutEvent(G, simRng);
        }
      }
      // ── 契約更新交渉の自動処理 ──
      if (G.weekPhase === 'contractNegotiation') {
        G = autoHandleContractNegotiation(G, simRng);
      }

      // ── ケア自動実行 (--care) ── 実プレイと同じく manage フェーズ・興行前に決裁する
      G = autoExecuteCare(G);

      // ── 興行週: カード自動編成→executeShow ──
      // 春のタッグリーグ開催週(Week12)はリーグ興行がその週の枠を占めるため、通常興行はスキップ
      // (Phase 1時点ではUI側の「週12は通常カード編成不可」導線が未実装のため、auto-sim側で代替)
      const springTagOccupiesThisWeek = G.week === 12 && G.springTagLeague && !G.springTagLeague.cancelled
        && G.springTagLeague.matches && G.springTagLeague.matches.length > 0;
      const autumnWarOccupiesThisWeek = G.week === 36 && G.autumnWar && !G.autumnWar.cancelled
        && G.autumnWar.champion;
      const tenchosenOccupiesThisWeek = G.week === 48 && G.ppvTournament?.phase === 'done'
        && G.ppvTournament.season === G.season;
      // MQ再設計P3d 物差し再較正: この反復で通常興行が実行されたかどうか(tickWeek後の
      // weeklyFinance読み取りに使う)。通常興行以外(春タッグ/秋対抗戦/天頂戦)は対象外。
      let p3dShowHappenedThisIter = false;
      let p3dShowSeason = null;
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage'
          && !springTagOccupiesThisWeek && !autumnWarOccupiesThisWeek && !tenchosenOccupiesThisWeek) {
        G = autoSetupShowCard(G, simRng);
        if (G.showCard && G.showCard.length > 0) {
          stats.showCount++;
          stats.titleMatchCount += G.showCard.filter(m => m.isTitle).length;
          // 計測6用リセット(Engine.executeShow内の実際のcalcMatchAppeal呼び出しに相乗りする)
          _freshnessShowWithSum = 0;
          _freshnessShowWithoutSum = 0;
          const showResult = Engine.executeShow(G);
          if (showResult && !showResult.error) {
            p3dShowHappenedThisIter = true;
            p3dShowSeason = G.season;
            // MQ再設計P3d: 通常興行の生MQ(シングル+タッグ全試合)をseasonタグ付きで採取。
            for (const r of showResult.results || []) {
              if (typeof r.mq === 'number') {
                p3dProbe.normalShowMq.push({ mq: r.mq, season: G.season });
              }
            }
            if (Number.isFinite(showResult.fp)) {
              p3dProbe.fpSamples.push({ fp: showResult.fp, season: G.season, venueIdx: G.showVenue || 0 });
            }
            for (const matchResult of showResult.results || []) {
              if (!matchResult.mqInventory) continue;
              const inventory = { ...matchResult.mqInventory };
              mqInventoryProbe.regularFinal.push(inventory);
              let uiMq = inventory.baseEngineMq;
              let upperClampCount = 0;
              let upperOverageTotal = 0;
              let upperOverageMax = 0;
              const addWithUpperClamp = amount => {
                const raw = uiMq + amount;
                if (raw > 100) {
                  upperClampCount++;
                  upperOverageTotal += raw - 100;
                  upperOverageMax = Math.max(upperOverageMax, raw - 100);
                }
                uiMq = Math.min(100, raw);
              };
              if (inventory.matchType === 'singles') {
                addWithUpperClamp(inventory.rivalry || 0);
                addWithUpperClamp(inventory.title || 0);
              }
              const crowdRaw = uiMq + (inventory.crowd || 0);
              if (crowdRaw > 100) {
                upperClampCount++;
                upperOverageTotal += crowdRaw - 100;
                upperOverageMax = Math.max(upperOverageMax, crowdRaw - 100);
              }
              uiMq = Engine.util.clamp(crowdRaw, 5, 100);
              const freshness = inventory.matchType === 'singles' ? (matchResult.freshnessBonus || 0) : 0;
              const freshnessRaw = uiMq + freshness;
              if (freshnessRaw > 100) {
                upperClampCount++;
                upperOverageTotal += freshnessRaw - 100;
                upperOverageMax = Math.max(upperOverageMax, freshnessRaw - 100);
              }
              uiMq = Engine.util.clamp(freshnessRaw, 5, 100);
              mqInventoryProbe.uiRouteEstimate.push({
                ...inventory,
                freshness,
                finalMq: uiMq,
                upperClampCount,
                upperOverageTotal,
                upperOverageMax,
              });
            }
            // ── MQ再設計P3c計測(§3.2/§3.2b/G): fp分布・観客帯割合・興行内観客寄与σ・
            //    興行平均MQ・鮮度→集客移管の動員影響。既存ロジックには接続しない横計測。 ──
            try {
              if (Number.isFinite(showResult.fp)) {
                mqP3cProbe.showFp.push(showResult.fp);
                const pf = showResult.pressureFactor;
                const band = pf === 1.0 ? 'plus10' : pf === 0.5 ? 'plus05'
                  : pf === -0.5 ? 'minus05' : pf === -1.0 ? 'minus10' : 'zero';
                mqP3cProbe.pressureBandCounts[band]++;
              }
              const normalCrowdVals = [];
              const normalMqVals = [];
              for (const r of showResult.results || []) {
                const inv = r.mqInventory;
                if (inv && (inv.profile === 'normal-single' || inv.profile === 'normal-tag')) {
                  normalCrowdVals.push(inv.crowd || 0);
                  normalMqVals.push(r.mq || 0);
                }
              }
              if (normalCrowdVals.length >= 2) {
                const mean = normalCrowdVals.reduce((a, b) => a + b, 0) / normalCrowdVals.length;
                const variance = normalCrowdVals.reduce((s, v) => s + (v - mean) ** 2, 0) / normalCrowdVals.length;
                mqP3cProbe.showCrowdSigma.push(Math.sqrt(variance));
              }
              if (normalMqVals.length > 0) {
                mqP3cProbe.showAvgMq.push(normalMqVals.reduce((a, b) => a + b, 0) / normalMqVals.length);
              }
              // 計測6: 鮮度→集客移管の動員影響。上のcalcMatchAppealモンキーパッチが本番呼び出しに
              // 相乗りして集計済みの _freshnessShowWithSum/_freshnessShowWithoutSum を読むだけ
              // (追加のfreshness.calc/calcMatchAppeal呼び出しなし。appeal合計ベースの近似値であり、
              // calcShowDrawの位置重みや集客の非線形カーブ通過後の厳密な%ではない点に留意)。
              const venueIdxForFreshness = (G.showVenue) || 0;
              if (venueIdxForFreshness === 9) mqP3cProbe.domeShowCount++;
              if (_freshnessShowWithoutSum > 0) {
                mqP3cProbe.freshnessAttendanceDeltaPct.push(
                  (_freshnessShowWithSum - _freshnessShowWithoutSum) / _freshnessShowWithoutSum * 100);
              }
            } catch (_e) { /* 計測エラーはゲームに影響させない */ }
            // ── 新集客v2計測（既存ロジック非接続・横で計算するだけ） ──
            if (typeof Engine.attendanceV2 !== 'undefined' && showResult.results) {
              try {
                const preShowState = G; // executeShow前のstate（showCard/showVenue付き）
                const venueIdx = preShowState.showVenue || 0;
                // 旧集客（processSettlement相当の概算）
                const matchPops = preShowState.showCard.filter(m => m.matchType !== 'tag' && m.left > 0 && m.right > 0).map(m => {
                  const l = preShowState.roster.find(c => c.id === m.left);
                  const r = preShowState.roster.find(c => c.id === m.right);
                  return ((l ? l.popularity : 0) + (r ? r.popularity : 0)) / 2;
                });
                const oldCardPop = Engine.economy.calcCardPop(matchPops);
                const hasTitleMatch = preShowState.showCard.some(m => m.isTitle);
                const champId = preShowState.titles?.world?.championId;
                const hasChamp = preShowState.showCard.some(m => m.matchType !== 'tag' && (m.left === champId || m.right === champId));
                const oldAtt = Engine.economy.calcAttendance(preShowState, venueIdx, oldCardPop, hasTitleMatch, hasChamp, null, 0);
                // 新集客v2計測（attendanceは旧値を渡してoccupancy計算に使う）
                const v2m = Engine.attendanceV2.measureShow(
                  preShowState, preShowState.showCard, showResult.results, oldAtt, venueIdx
                );
                stats.v2Samples.push({
                  orgPop: Math.round(preShowState.orgPop * 10) / 10,
                  oldAtt,
                  newAtt: v2m.attendV2.attendance,
                  reach: v2m.attendV2.reach,
                  draw: v2m.attendV2.draw,
                  showDraw: v2m.attendV2.showDraw,
                  stars: v2m.rating.stars,
                  mqScore: v2m.rating.mqScore,
                  occScore: v2m.rating.occScore,
                  bonusScore: v2m.rating.bonusScore,
                  totalScore: v2m.rating.totalScore,
                });
              } catch (_e) { /* 計測エラーはゲームに影響させない */ }
            }
            G = showResult.state;
          }
        }
      }

      // ── transientイベント消化 ──
      G = autoHandleChoiceEvent(G, simRng);
      G = autoHandleLargeEvent(G, simRng);
      G = clearTransients(G);

      // ── tickWeek（週次パイプライン） ── validateGameStateはtickWeek内で実行される
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };
      // UIなしでもプレイヤー側へ回った全国統一王座の挑戦権を自動選択・消化する。
      G = Engine.unifiedTitle.autoConsumePlayerTurn(G);
      if (process.env.WM_TITLE_FIXTURE === '1') censusTitleReigns(G);
      // 新聞P2: 一面トップに来た記事の種別を数える。G を覗くだけの読み取り専用。
      // WM_SOURCE_REF と併用して P2 前後を比べるためのもの
      if (process.env.WM_FRONTPAGE_FIXTURE === '1' && G.weeklyNewspaper) {
        const ts = G.weeklyNewspaper.topStory;
        if (ts && ts.type) {
          frontPageCensus.total++;
          frontPageCensus.byType[ts.type] = (frontPageCensus.byType[ts.type] || 0) + 1;
          if (ts.newsValue != null) frontPageCensus.values.push(ts.newsValue);
        }
      }
      // MQ再設計P4: 大ニュース記事(mqAllTimeRecord/mqTagRecord)の生成回数を計測
      const bigNewsType = G.weeklyNewspaper && G.weeklyNewspaper.topStory && G.weeklyNewspaper.topStory.type;
      if (bigNewsType === 'mqAllTimeRecord') stats.mqAllTimeRecordNewsCount++;
      else if (bigNewsType === 'mqTagRecord') stats.mqTagRecordNewsCount++;
      // MQ再設計P5: hotProspectDebut/fatedRivals/topChampionInjuryの生成回数を計測
      else if (bigNewsType === 'hotProspectDebut') stats.hotProspectDebutNewsCount++;
      else if (bigNewsType === 'fatedRivals') stats.fatedRivalsNewsCount++;
      else if (bigNewsType === 'topChampionInjury') stats.topChampionInjuryNewsCount++;
      // MQ再設計P3d: 通常興行があった週のみ、processSettlement(tickWeek内)が積んだ
      // weeklyFinance.details から興行連動収入(チケット/興行ブースト/興行放映/期待カード/
      // ライバル抗争メディア)だけを抽出して合算する。週次経常収入(グッズ週次・メディア週次・
      // プロモ収入)は含めない。既存ロジックには接続しない読み取り専用の横計測。
      if (p3dShowHappenedThisIter) {
        const p3dShowLabels = ['チケット収入', 'グッズ収入（興行ブースト）', 'メディア収入（興行放映）',
          'メディア収入（期待カード）', 'メディア収入（ライバル抗争）'];
        const p3dDetails = (G.weeklyFinance && G.weeklyFinance.details) || [];
        const p3dRevenue = p3dDetails
          .filter(d => d.type === 'income' && p3dShowLabels.some(label => d.label.startsWith(label)))
          .reduce((sum, d) => sum + (d.val || 0), 0);
        p3dProbe.showRevenue.push({ revenue: p3dRevenue, season: p3dShowSeason });
      }
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);
      G = collectViolations(G, violations);

      // ── advanceWeek（次の週へ）── 対抗戦・移籍・スカウト等のチェックはここで行われる
      const _wasWar = G.warThisSeason;
      const _prevPhase = G.weekPhase;
      const _prevSpringTagChampion = G.springTagLeague ? G.springTagLeague.champion : undefined;
      const _prevSpringTagCancelled = G.springTagLeague ? G.springTagLeague.cancelled : undefined;
      const _prevAutumnWarChampion = G.autumnWar ? G.autumnWar.champion : undefined;
      const _prevAutumnWarCancelled = G.autumnWar ? G.autumnWar.cancelled : undefined;
      const _prevAutumnWarSeason = G.autumnWar ? G.autumnWar.announcedSeason : undefined;
      const _prevTournamentPhase = G.ppvTournament?.phase;
      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };
      // UIなしのauto-simでも本番と同じく1フォールずつ実行する。
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
      if (G.springTagLeague && G.springTagLeague.champion && G.springTagLeague.champion !== _prevSpringTagChampion) {
        stats.springTagCompletedCount++;
      }
      if (G.springTagLeague && G.springTagLeague.cancelled && !_prevSpringTagCancelled) {
        stats.springTagCancelledCount++;
      }
      if (G.autumnWar && G.autumnWar.champion && G.autumnWar.champion !== _prevAutumnWarChampion) {
        stats.autumnWarCompletedCount++;
      }
      if (G.autumnWar && G.autumnWar.cancelled
          && (!_prevAutumnWarCancelled || G.autumnWar.announcedSeason !== _prevAutumnWarSeason)) {
        stats.autumnWarCancelledCount++;
      }
      if (G.ppvTournament?.phase === 'done' && _prevTournamentPhase !== 'done'
          && !tenchosenCompletedSeasons.has(G.ppvTournament.season)) {
        tenchosenCompletedSeasons.add(G.ppvTournament.season);
        stats.tenchosenCompletedCount++;
        const finalMatch = G.ppvTournament.rounds?.find(r => r.name === 'final')?.matches?.[0];
        if (finalMatch && Number.isFinite(finalMatch.mq)) stats.tenchosenFinalMq.push(finalMatch.mq);
        const dramaCount = G.ppvTournament.dramaEvents?.length || 0;
        stats.tenchosenDramaEvents += dramaCount;
        if (dramaCount === 0) stats.tenchosenZeroDramaCount++;
      }
      if (Engine.ppvTournament.isTournamentSeason(G.season) && G.week === 48
          && G.ppvTournament && G.ppvTournament.phase !== 'done'
          && !stats.tenchosenFailedSeasons.includes(G.season)) {
        stats.tenchosenFailedSeasons.push(G.season);
      }
      // auto-sim には引き留めUIがないので、検出された引退候補をその場で全て確定
      if (G.pendingRetirements && G.pendingRetirements.length > 0) {
        const confirmed = G.pendingRetirements.map(r => r.fighter);
        const commitRes = Engine.retirement.commitRetirements(G, confirmed);
        const { pendingRetirements: _drop, ...rest } = commitRes.state;
        G = rest;
      }
      totalWeeks++;

      // 頻度トラッキング（advanceWeek後の状態変化を検出）
      if (G.warThisSeason && !_wasWar) stats.warEvents++;
      if (G.weekPhase !== _prevPhase) {
        if (G.weekPhase === 'transfer')   stats.poachEvents++;
        if (G.weekPhase === 'scoutEvent') stats.scoutEvents++;
        if (G.weekPhase === 'ppvEntry')   stats.ppvEvents++;
      }

      // advanceWeek後にもvalidate
      G = Engine.validateGameState(G);
      G = collectViolations(G, violations);
      careSample(G);

      // ── シーズン遷移検出 ──
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        stats.seasons++;
        stats.orgPopHistory.push(Math.round((G.orgPop || 0) * 10) / 10);
        stats.fundsHistory.push(Math.round(G.funds || 0));

        // MQ再設計P3d: シーズン末(オフシーズン明け=季節切替検出時点)の自団体ロスター
        // (レンタル除く)平均trust/平均人気。既存ロジックには接続しない読み取り専用。
        {
          const p3dActiveRoster = (G.roster || []).filter(c => !c.isRental);
          if (p3dActiveRoster.length > 0) {
            const p3dAvgTrust = p3dActiveRoster.reduce((sum, c) => sum + (c.trust != null ? c.trust : 50), 0) / p3dActiveRoster.length;
            const p3dAvgPop = p3dActiveRoster.reduce((sum, c) => sum + (c.popularity || 0), 0) / p3dActiveRoster.length;
            p3dProbe.seasonEnd.push({ season: G.season - 1, avgTrust: p3dAvgTrust, avgPopularity: p3dAvgPop });
          }
        }

        if (completed % 50 === 0) {
          process.stdout.write(`  ... ${completed}/${seasons} seasons completed\r`);
        }
      }

    } catch (e) {
      errors.push({
        season: G ? G.season : '?',
        week: G ? G.week : '?',
        seed: currentSeed,
        error: e.message,
        stack: e.stack,
      });
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

  if (iter >= MAX_ITER) {
    errors.push({ season: G.season, week: G.week, seed: currentSeed, error: `MAX_ITER (${MAX_ITER}) に到達。無限ループの可能性` });
  }

  // relationship-flags-spec-v1.0 §7-4: フラグ発火頻度集計
  const flagStats = {
    F1_betrayer: 0, F2_returner: 0, F3_master: 0,
    F4_cohort: 0, F5_rivalCohort: 0, F6_admire: 0,
    F7_envy: 0,
    F1_modal: 0, F2_modal: 0, F6_modal: 0, F7_modal: 0,
    F7_aging: 0,
  };
  // 最終 G から累積カウント（フラグは原則永続なので最終値が累積に近い）
  if (G && G.relationshipFlags) {
    flagStats.F1_betrayer = (G.relationshipFlags.betrayer || []).length;
    flagStats.F2_returner = (G.relationshipFlags.returner || []).length;
    flagStats.F3_master = (G.relationshipFlags.master || []).length;
    flagStats.F4_cohort = (G.relationshipFlags.cohort || []).length;
    flagStats.F5_rivalCohort = (G.relationshipFlags.rivalCohort || []).length;
    flagStats.F6_admire = (G.relationshipFlags.admire || []).length;
    flagStats.F7_envy = (G.relationshipFlags.envy || []).length;
  }
  if (G && G.relationshipHistory) {
    flagStats.F2_returner_history = (G.relationshipHistory.betrayalRecord || []).length;
  }

  const semanticJson = JSON.stringify({ G, stats, flagStats, totalWeeks, gameOverCount }, (key, value) => {
    if (key === 'mqInventory' || key === 'debugLog' || key === 'gameLog') return undefined;
    // task-88 I-1: 王座創設前の null は旧HEAD(undefined)と同じ意味として指紋から除外。
    if (key === 'unifiedTitle' && value == null) return undefined;
    return value;
  });
  let semanticFingerprint = 2166136261;
  for (let i = 0; i < semanticJson.length; i++) {
    semanticFingerprint ^= semanticJson.charCodeAt(i);
    semanticFingerprint = Math.imul(semanticFingerprint, 16777619) >>> 0;
  }
  const unifiedHistory = (G?.unifiedTitle?.history || []);
  const unifiedDefenses = unifiedHistory.filter(ev => ev.type === 'defense').length;
  const unifiedMoves = unifiedHistory.filter(ev => ev.type === 'move').length;
  const unifiedDefenseMatches = unifiedDefenses + unifiedMoves;
  const unifiedDistribution = unifiedHistory.some(ev => ev.type === 'creation') ? {
    creations: unifiedHistory.filter(ev => ev.type === 'creation').length,
    moves: unifiedMoves,
    defenses: unifiedDefenses,
    defenseMatches: unifiedDefenseMatches,
    defenseSuccessRate: unifiedDefenseMatches > 0 ? unifiedDefenses / unifiedDefenseMatches : 0,
    playerTurns: unifiedHistory.filter(ev => ev.type === 'playerTurnOffered').length,
    playerTurnsConsumed: unifiedHistory.filter(ev => ev.type === 'playerTurnConsumed').length,
    vacates: unifiedHistory.filter(ev => ev.type === 'vacate').length,
  } : null;
  const hofLevels = { star1: 0, star2: 0, star3: 0 };
  Object.values(G?.allHallOfFame || {}).flat().forEach(entry => {
    const level = Number(entry?.hofLevel)
      || Engine.awards.getHofLevel(Number(entry?.hofPoints) || 0);
    if (level === 1) hofLevels.star1++;
    else if (level === 2) hofLevels.star2++;
    else if (level >= 3) hofLevels.star3++;
  });
  const unifiedRecordsI6 = {
    hofLevels,
    annualMvps: unifiedRecordsI6Probe.annualMvps,
    unifiedChampionMvps: unifiedRecordsI6Probe.unifiedChampionMvps,
    unifiedChampionMvpRate: unifiedRecordsI6Probe.annualMvps > 0
      ? unifiedRecordsI6Probe.unifiedChampionMvps / unifiedRecordsI6Probe.annualMvps : 0,
  };
  return {
    violations, errors, totalWeeks, gameOverCount, stats, flagStats,
    finalSeasons: G ? G.season : 0,
    semanticFingerprint: semanticFingerprint.toString(16).padStart(8, '0'),
    unifiedDistribution,
    unifiedRecordsI6,
  };
}

// ── Step 6: 実行 & レポート出力 ──
const startTime = Date.now();
const result = runSimulation(userSeed, targetSeasons);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(''); // 進捗行のクリア
console.log('--------------------------------------');

// 違反レポート
const uniqueViolations = [];
const seen = new Set();
result.violations.forEach(v => {
  const key = `S${v.season}W${v.week}:${v.message}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueViolations.push(v);
  }
});

if (uniqueViolations.length > 0) {
  uniqueViolations.forEach(v => {
    console.log(`[WARN] Season ${v.season}, Week ${v.week}: ${v.message}`);
  });
}

// エラーレポート
if (result.errors.length > 0) {
  console.log('');
  result.errors.forEach(e => {
    console.log(`[ERROR] Season ${e.season}, Week ${e.week} (seed:${e.seed}): ${e.error}`);
    if (e.stack) {
      // スタックトレースの最初の3行のみ
      const lines = e.stack.split('\n').slice(0, 4);
      lines.forEach(l => console.log(`  ${l.trim()}`));
    }
  });
}

// 頻度レポート
const freqWarnings = [];
const s = result.stats;
if (result.unifiedDistribution) {
  const u = result.unifiedDistribution;
  console.log('');
  console.log('全国統一王座 分布:');
  console.log(`  創設回数: ${u.creations}`);
  console.log(`  移動回数: ${u.moves}`);
  console.log(`  防衛成功率: ${u.defenses}/${u.defenseMatches} (${(u.defenseSuccessRate * 100).toFixed(1)}%)`);
  console.log(`  こちらの番: 発生${u.playerTurns} / 消化${u.playerTurnsConsumed}`);
  console.log(`  返上回数: ${u.vacates}`);
}
if (targetSeasons >= 100) {
  const i6 = result.unifiedRecordsI6;
  console.log('');
  console.log('全国統一王座 P4 記録較正 (I-6):');
  console.log(`  殿堂★分布: ★=${i6.hofLevels.star1} ★★=${i6.hofLevels.star2} ★★★=${i6.hofLevels.star3}`);
  console.log(`  年間MVPの統一王者比率: ${i6.unifiedChampionMvps}/${i6.annualMvps} (${(i6.unifiedChampionMvpRate * 100).toFixed(1)}%)`);
}
if (s.seasons >= 10) {
  const rates = {
    warRate:   s.warEvents        / s.seasons,
    poachRate: s.poachEvents      / s.seasons,
    scoutRate: s.scoutEvents      / s.seasons,
    ppvRate:   s.ppvEvents        / s.seasons,
    showRate:  s.showCount        / s.seasons,
    titleRate: s.titleMatchCount  / s.seasons,
    springTagRate: s.springTagCompletedCount / s.seasons,
    autumnWarRate: s.autumnWarCompletedCount / s.seasons,
  };

  console.log('');
  console.log(`Frequency Stats (${s.seasons} seasons):`);

  // 閾値あり項目
  FREQ_THRESHOLDS.forEach(t => {
    const v = rates[t.key];
    const ok = v >= t.min && v <= t.max;
    const status = ok ? '[OK]' : '[!!]';
    console.log(`  ${status} ${t.label.padEnd(24)} ${v.toFixed(2).padStart(5)}   期待: ${t.min}-${t.max}`);
    if (!ok) freqWarnings.push(`${t.label}: ${v.toFixed(2)} (期待値 ${t.min}–${t.max})`);
  });

  // 参考情報（閾値なし — ゲーム状態依存で変動するため）
  console.log(`  [--] ${'PPV/シーズン'.padEnd(24)} ${rates.ppvRate.toFixed(2).padStart(5)}`);
  console.log(`  [--] ${'春のタッグリーグ完走/中止'.padEnd(20)} ${s.springTagCompletedCount}/${s.springTagCancelledCount}`);
  console.log(`  [--] ${'秋4団体戦完走/中止'.padEnd(23)} ${s.autumnWarCompletedCount}/${s.autumnWarCancelledCount}`);
  console.log(`  [--] ${'引き抜き発生/シーズン'.padEnd(22)} ${rates.poachRate.toFixed(2).padStart(5)}   ※rank1時は0が正常`);
  console.log(`  [--] ${'タイトルマッチ/シーズン'.padEnd(22)} ${rates.titleRate.toFixed(2).padStart(5)}   ※auto-simでは0が正常(未設立)`);
  console.log(`  [--] ${'大ニュース(MQ記録更新: シングル/タッグ)'.padEnd(20)} ${s.mqAllTimeRecordNewsCount}/${s.mqTagRecordNewsCount}`);
  console.log(`  [--] ${'大ニュース(ルーキー/ライバル/王者重傷)'.padEnd(20)} ${s.hotProspectDebutNewsCount}/${s.fatedRivalsNewsCount}/${s.topChampionInjuryNewsCount}   ※稀イベントのため0が正常`);

  const tenchosenStartRate = s.tenchosenEligibleCount > 0 ? s.tenchosenStartedCount / s.tenchosenEligibleCount : 0;
  const tenchosenCompleteRate = s.tenchosenEligibleCount > 0 ? s.tenchosenCompletedCount / s.tenchosenEligibleCount : 0;
  const normalExpected = Math.max(0, s.seasons - s.tenchosenEligibleCount);
  const normalCompleteRate = normalExpected > 0 ? s.normalPpvCompletedCount / normalExpected : 0;
  const mqSummary = values => {
    if (!values.length) return 'n=0';
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const bands = [
      ['<50', value => value < 50], ['50-59', value => value >= 50 && value < 60],
      ['60-69', value => value >= 60 && value < 70], ['70-79', value => value >= 70 && value < 80],
      ['80-89', value => value >= 80 && value < 90], ['90+', value => value >= 90],
    ];
    return `n=${values.length} avg=${avg.toFixed(1)} ` + bands.map(([label, test]) => `${label}:${values.filter(test).length}`).join(' ');
  };
  const zeroDramaRate = s.tenchosenCompletedCount > 0 ? s.tenchosenZeroDramaCount / s.tenchosenCompletedCount : 0;
  const dramaPerEvent = s.tenchosenCompletedCount > 0 ? s.tenchosenDramaEvents / s.tenchosenCompletedCount : 0;
  console.log('');
  console.log('天頂戦 / 通常年PPV 比較:');
  console.log(`  [${tenchosenStartRate === 1 ? 'OK' : '!!'}] 天頂戦開催       ${s.tenchosenStartedCount}/${s.tenchosenEligibleCount} (${tenchosenStartRate.toFixed(2)})`);
  console.log(`  [${tenchosenCompleteRate === 1 ? 'OK' : '!!'}] 天頂戦完走       ${s.tenchosenCompletedCount}/${s.tenchosenEligibleCount} (${tenchosenCompleteRate.toFixed(2)})`);
  console.log(`  [${normalCompleteRate === 1 ? 'OK' : '!!'}] 通常年PPV実行    ${s.normalPpvCompletedCount}/${normalExpected} (${normalCompleteRate.toFixed(2)})`);
  console.log(`  [--] 天頂戦ドラマ       平均${dramaPerEvent.toFixed(2)}件 / 0件率${zeroDramaRate.toFixed(2)}`);
  console.log(`  [--] 天頂戦決勝MQ       ${mqSummary(s.tenchosenFinalMq)}`);
  console.log(`  [--] 通常年PPVメインMQ  ${mqSummary(s.normalPpvMainMq)}`);
  if (s.tenchosenFailedSeasons.length) console.log(`  [!!] 未完走シーズン      ${s.tenchosenFailedSeasons.join(', ')}`);
  if (tenchosenStartRate !== 1) freqWarnings.push(`天頂戦開催率: ${tenchosenStartRate.toFixed(2)} (期待値 1.00)`);
  if (tenchosenCompleteRate !== 1) freqWarnings.push(`天頂戦完走率: ${tenchosenCompleteRate.toFixed(2)} (期待値 1.00)`);
  if (normalCompleteRate !== 1) freqWarnings.push(`通常年PPV実行率: ${normalCompleteRate.toFixed(2)} (期待値 1.00)`);
  // 完走8大会未満(=32シーズン未満)では統計ブレで誤検知するため発動させない(0件率0.4でも5大会全部非0になる確率は8%/シードある)
  if (s.tenchosenCompletedCount >= 8 && s.tenchosenZeroDramaCount === 0) {
    freqWarnings.push('天頂戦ドラマ0件の大会がない (常時発火の疑い)');
  }
}

if (freqWarnings.length > 0) {
  console.log('');
  freqWarnings.forEach(w => console.log(`[FREQ WARN] ${w} — ロジック到達不全やバグの可能性`));
}

// orgPop推移サマリー
if (s.orgPopHistory && s.orgPopHistory.length >= 5) {
  console.log('');
  console.log(`OrgPop推移 (${s.orgPopHistory.length} seasons):`);
  const step = Math.max(1, Math.floor(s.orgPopHistory.length / 30));
  for (let i = 0; i < s.orgPopHistory.length; i += step) {
    const pop = s.orgPopHistory[i];
    const funds = s.fundsHistory[i];
    const bar = '#'.repeat(Math.round(pop / 2));
    console.log(`  S${String(i+1).padStart(3)}: pop=${String(pop).toFixed ? pop.toFixed(1).padStart(5) : String(pop).padStart(5)}  funds=${String(funds).padStart(8)}万  ${bar}`);
  }
  // 最終シーズンも必ず表示
  const last = s.orgPopHistory.length - 1;
  if (last % step !== 0) {
    const pop = s.orgPopHistory[last];
    const funds = s.fundsHistory[last];
    const bar = '#'.repeat(Math.round(pop / 2));
    console.log(`  S${String(last+1).padStart(3)}: pop=${pop.toFixed(1).padStart(5)}  funds=${String(funds).padStart(8)}万  ${bar}`);
  }
}

// ─��� 新集客v2計測レポート ──
if (result.stats.v2Samples && result.stats.v2Samples.length > 0) {
  const samples = result.stats.v2Samples;
  console.log('');
  console.log(`=== 新集客v2 計測レポート (${samples.length} shows) ===`);

  // orgPop帯別に集計
  const bands = [[0,20,'0-20'],[20,40,'20-40'],[40,60,'40-60'],[60,80,'60-80'],[80,101,'80+']];
  for (const [lo, hi, label] of bands) {
    const band = samples.filter(s => s.orgPop >= lo && s.orgPop < hi);
    if (band.length === 0) continue;
    const avg = (arr, key) => Math.round(arr.reduce((s, x) => s + x[key], 0) / arr.length);
    const avgF = (arr, key) => (arr.reduce((s, x) => s + x[key], 0) / arr.length).toFixed(2);
    console.log(`  orgPop ${label} (n=${band.length}):`);
    console.log(`    旧集客: avg=${avg(band,'oldAtt')}  新集客: avg=${avg(band,'newAtt')}  reach: avg=${avg(band,'reach')}  draw: avg=${avgF(band,'draw')}`);
    console.log(`    showDraw: avg=${avgF(band,'showDraw')}  ★分布: ${[1,2,3,4,5].map(st => `★${st}=${band.filter(s=>s.stars===st).length}`).join(' ')}`);
    console.log(`    rating内訳: mq=${avgF(band,'mqScore')} occ=${avgF(band,'occScore')} bonus=${avgF(band,'bonusScore')} total=${avgF(band,'totalScore')}`);
  }

  // 全体サマリー
  const allDraw = samples.map(s => s.draw);
  const allStars = samples.map(s => s.stars);
  console.log(`  全体: draw min=${Math.min(...allDraw).toFixed(2)} avg=${(allDraw.reduce((a,b)=>a+b,0)/allDraw.length).toFixed(2)} max=${Math.max(...allDraw).toFixed(2)}`);
  console.log(`  全体: ★ avg=${(allStars.reduce((a,b)=>a+b,0)/allStars.length).toFixed(2)} 分布: ${[1,2,3,4,5].map(st => `★${st}=${samples.filter(s=>s.stars===st).length}`).join(' ')}`);
}

// relationship-flags-spec-v1.0 §7-4: フラグ発火頻度
{
  const seasons = Math.max(1, result.stats.seasons || targetSeasons);
  const injurySummary = scope => {
    const perSeason = scope.injuries / seasons;
    const perFighterSeason = scope.fighterSeasons.size ? scope.injuries / scope.fighterSeasons.size : 0;
    return `total=${scope.injuries} annual=${perSeason.toFixed(2)} fighter-year=${perFighterSeason.toFixed(4)} weeks=${scope.weeks} annualWeeks=${(scope.weeks / seasons).toFixed(2)} severe=${scope.severe}`;
  };
  console.log('');
  console.log('Match injury probe (training injuries excluded):');
  console.log(`  all organizations: ${injurySummary(injuryProbe.all)}`);
  console.log(`  player organization: ${injurySummary(injuryProbe.player)}`);
}

// relationship-flags-spec-v1.0 §7-4: フラグ発火頻度
if (result.flagStats) {
  const seasons = Math.max(1, result.finalSeasons || 1);
  const fs = result.flagStats;
  console.log('--------------------------------------');
  console.log('関係性フラグ累積（最終時点）/ シーズン平均');
  const fmt = (v) => `${v} (${(v / seasons).toFixed(2)}/シーズン)`;
  console.log(`  F-1 裏切り者     : ${fmt(fs.F1_betrayer)}    [目標: 0.5〜1.5]`);
  console.log(`  F-2 出戻り       : ${fmt(fs.F2_returner)}    [目標: 0.05〜0.2]`);
  console.log(`  F-3 師弟         : ${fmt(fs.F3_master)}    [目標: 0.1〜0.3]`);
  console.log(`  F-4 同期         : ${fs.F4_cohort}                  (頻度目標なし)`);
  console.log(`  F-5 ライバル同期 : ${fmt(fs.F5_rivalCohort)} [目標: 0.2〜0.5]`);
  console.log(`  F-6 憧れ         : ${fmt(fs.F6_admire)}    [目標: 0.5〜1.5]`);
  console.log(`  F-7 嫉妬         : ${fmt(fs.F7_envy)}    [目標: 0.3〜1.0]`);
}

if (matchBalanceProbe.matches > 0) {
  const avgTurns = matchBalanceProbe.turns / matchBalanceProbe.matches;
  const timeoutRate = matchBalanceProbe.timeouts / matchBalanceProbe.matches * 100;
  const avgMq = matchBalanceProbe.mq.reduce((sum, value) => sum + value, 0) / matchBalanceProbe.mq.length;
  const legacyPacingAvgMq = matchBalanceProbe.legacyPacingMq.reduce((sum, value) => sum + value, 0) / matchBalanceProbe.legacyPacingMq.length;
  const mqBands = [
    ['<50', value => value < 50],
    ['50-59', value => value >= 50 && value < 60],
    ['60-69', value => value >= 60 && value < 70],
    ['70-79', value => value >= 70 && value < 80],
    ['80-89', value => value >= 80 && value < 90],
    ['90+', value => value >= 90],
  ];
  console.log('--------------------------------------');
  console.log(`Match Balance Probe (${matchBalanceProbe.matches} singles):`);
  console.log(`  平均ターン数: ${avgTurns.toFixed(2)}`);
  console.log(`  時間切れ判定: ${matchBalanceProbe.timeouts}/${matchBalanceProbe.matches} (${timeoutRate.toFixed(2)}%)`);
  console.log(`  MQ: avg=${avgMq.toFixed(2)} ${mqBands.map(([label, test]) => `${label}:${matchBalanceProbe.mq.filter(test).length}`).join(' ')}`);
  console.log(`  MQ with legacy pacing thresholds: avg=${legacyPacingAvgMq.toFixed(2)} delta=${(avgMq - legacyPacingAvgMq).toFixed(2)}`);
  if (matchBalanceProbe.moveSelections > 0) {
    console.log(`  小技決着: フォール/ギブアップ=${matchBalanceProbe.smallFallOrGuFinishes} TKO=${matchBalanceProbe.smallTkoFinishes}`);
    console.log(`  フィニッシュ級(開幕大技除外): 平均${(matchBalanceProbe.finisherSelections / matchBalanceProbe.matches).toFixed(3)}回/試合 0回率=${(matchBalanceProbe.zeroFinisherMatches / matchBalanceProbe.matches * 100).toFixed(2)}%`);
    console.log(`  開幕大技によるフィニッシュ級選択: ${matchBalanceProbe.forcedFinisherSelections}`);
    console.log(`  大技2連続: ${matchBalanceProbe.consecutiveBigSelections}`);
    console.log(`  丸め込み選択: ${matchBalanceProbe.rollupSelections}/${matchBalanceProbe.moveSelections} (${(matchBalanceProbe.rollupSelections / matchBalanceProbe.moveSelections * 100).toFixed(2)}%)`);
    for (const phase of ['Opening', 'Mid', 'End', 'Climax']) {
      const counts = matchBalanceProbe.tiersByPhase[phase];
      if (!counts) continue;
      const tierTotal = counts.small + counts.medium + counts.big;
      const pct = tier => tierTotal > 0 ? counts[tier] / tierTotal * 100 : 0;
      console.log(`  ${phase}ティア(丸め込み除外): 小${pct('small').toFixed(2)}% 中${pct('medium').toFixed(2)}% 大${pct('big').toFixed(2)}% (n=${tierTotal}, rollup=${counts.rollup})`);
    }
    const openingFinishCount = matchBalanceProbe.openingFinishMq.length;
    console.log('  開幕大技:');
    for (const [label, opening] of Object.entries(matchBalanceProbe.openingExecution)) {
      const triggerRate = opening.checked ? opening.fired / opening.checked * 100 : 0;
      const overallTriggerRate = opening.eligible ? opening.fired / opening.eligible * 100 : 0;
      const hitRate = opening.fired ? opening.hit / opening.fired * 100 : 0;
      const finishRate = opening.eligible ? opening.finishes / opening.eligible * 100 : 0;
      const reversalRate = opening.misses ? opening.underdogWinsAfterMiss / opening.misses * 100 : 0;
      const hitTotal = opening.hit || 1;
      const damageText = Object.entries(opening.damageBands)
        .map(([band, count]) => `${band}:${(count / hitTotal * 100).toFixed(1)}%`).join(' ');
      console.log(`    OVR差${label}: 判定時発動${opening.fired}/${opening.checked} (${triggerRate.toFixed(2)}%) 全対象比${overallTriggerRate.toFixed(2)}% 命中${opening.hit}/${opening.fired} (${hitRate.toFixed(2)}%) 開幕決着${opening.finishes}/${opening.eligible} (${finishRate.toFixed(2)}%)`);
      console.log(`      ダメージ帯 ${damageText} / 透かし後格下勝利 ${opening.underdogWinsAfterMiss}/${opening.misses} (${reversalRate.toFixed(2)}%)`);
    }
    if (openingFinishCount > 0) {
      const openingMqAvg = matchBalanceProbe.openingFinishMq.reduce((sum, value) => sum + value, 0) / openingFinishCount;
      console.log(`    開幕決着MQ: n=${openingFinishCount} avg=${openingMqAvg.toFixed(2)} min=${Math.min(...matchBalanceProbe.openingFinishMq)} max=${Math.max(...matchBalanceProbe.openingFinishMq)}`);
      console.log(`    開幕決着/シーズン: ${(openingFinishCount / Math.max(1, targetSeasons)).toFixed(2)}`);
    }
  }
  console.log('  フェーズ到達・決着ターン:');
  for (const [key, label] of [['normal', '通常'], ['big', 'ビッグマッチ']]) {
    const timing = matchBalanceProbe.phaseTiming[key];
    if (!timing.matches) continue;
    const pct = count => count / timing.matches * 100;
    const finishText = ['Opening', 'Mid', 'End', 'Climax', 'Timeout']
      .map(phase => `${phase}:${timing.finishPhases[phase]}(${pct(timing.finishPhases[phase]).toFixed(2)}%)`).join(' ');
    const histogramText = timing.turnHistogram
      .slice(1)
      .map((count, index) => `T${index + 1}:${count}(${pct(count).toFixed(2)}%)`).join(' ');
    const residenceText = ['Opening', 'Mid', 'End', 'Climax']
      .map(phase => `${phase}:${(timing.phaseTurns[phase] / timing.matches).toFixed(2)}T`).join(' ');
    console.log(`    ${label} (n=${timing.matches}): 終了フェーズ ${finishText}`);
    console.log(`      Climax到達: ${timing.reachedClimax}/${timing.matches} (${pct(timing.reachedClimax).toFixed(2)}%)`);
    console.log(`      決着ターン: ${histogramText}`);
    console.log(`      平均滞在: ${residenceText}`);
  }
  const bigStartTotal = matchBalanceProbe.bigStartGroups.full.matches
    + matchBalanceProbe.bigStartGroups.carried.matches;
  if (bigStartTotal > 0) {
    const hpDistribution = ratios => {
      if (!ratios.length) return 'n=0';
      const bins = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-<100': 0, '100': 0 };
      for (const ratio of ratios) {
        if (ratio >= 0.9995) bins['100']++;
        else if (ratio < 0.2) bins['0-20']++;
        else if (ratio < 0.4) bins['20-40']++;
        else if (ratio < 0.6) bins['40-60']++;
        else if (ratio < 0.8) bins['60-80']++;
        else bins['80-<100']++;
      }
      const avg = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length * 100;
      const range = `${Math.min(...ratios).toFixed(3)}-${Math.max(...ratios).toFixed(3)}`;
      return `fighters=${ratios.length} avg=${avg.toFixed(2)}% range=${range} ${Object.entries(bins).map(([bin, count]) => `${bin}:${count}`).join(' ')}`;
    };
    console.log('  Big-match start-HP diagnosis:');
    for (const [key, label] of [['full', 'full-health'], ['carried', 'carried-fatigue']]) {
      const group = matchBalanceProbe.bigStartGroups[key];
      if (!group.matches) {
        console.log(`    ${label}: n=0 (0.00%)`);
        continue;
      }
      const pct = count => count / group.matches * 100;
      const finishText = ['Opening', 'Mid', 'End', 'Climax', 'Timeout']
        .map(phase => `${phase}:${group.finishPhases[phase]}(${pct(group.finishPhases[phase]).toFixed(2)}%)`).join(' ');
      const histogramText = group.turnHistogram.slice(1)
        .map((count, index) => `T${index + 1}:${count}(${pct(count).toFixed(2)}%)`).join(' ');
      const residenceText = ['Opening', 'Mid', 'End', 'Climax']
        .map(phase => `${phase}:${(group.phaseTurns[phase] / group.matches).toFixed(2)}T`).join(' ');
      const finishTypeText = Object.entries(group.finishTypes)
        .map(([type, count]) => `${type}:${count}(${pct(count).toFixed(2)}%)`).join(' ');
      console.log(`    ${label}: n=${group.matches}/${bigStartTotal} (${(group.matches / bigStartTotal * 100).toFixed(2)}%) avgTurns=${(group.turns / group.matches).toFixed(2)}`);
      console.log(`      finishPhase ${finishText}`);
      console.log(`      Climax reach ${group.reachedClimax}/${group.matches} (${pct(group.reachedClimax).toFixed(2)}%)`);
      console.log(`      finishTurn ${histogramText}`);
      console.log(`      phaseResidence ${residenceText}`);
      console.log(`      MQ avg=${(group.mqTotal / group.matches).toFixed(2)} legacyPacing=${(group.legacyPacingMqTotal / group.matches).toFixed(2)}`);
      console.log(`      finisher/match=${(group.finisherSelections / group.matches).toFixed(3)} zero=${group.zeroFinisherMatches}/${group.matches} (${pct(group.zeroFinisherMatches).toFixed(2)}%)`);
      console.log(`      finishType ${finishTypeText}`);
      console.log(`      startHP ${hpDistribution(group.startHpRatios)}`);
      if (key === 'full' && group.overrideAtFullHealth > 0) {
        console.log(`      note: ${group.overrideAtFullHealth} matches supplied _hpOverride equal to max HP and are classified by actual full-health start.`);
      }
      if (key === 'carried') {
        for (const [origin, originStats] of Object.entries(group.origins)) {
          const mq = originStats.matches ? (originStats.mqTotal / originStats.matches).toFixed(2) : 'n/a';
          const legacyMq = originStats.matches ? (originStats.legacyPacingMqTotal / originStats.matches).toFixed(2) : 'n/a';
          console.log(`      origin=${origin} matches=${originStats.matches} MQ=${mq} legacyPacing=${legacyMq} startHP ${hpDistribution(originStats.startHpRatios)}`);
        }
      }
    }
  }
  const ovrGroupLabels = { tier1: '通常(tier1)', tier2: 'ビッグマッチ(tier2)', carried: '消耗持ち越し大会(carried)' };
  for (const [groupKey, groupLabel] of Object.entries(ovrGroupLabels)) {
    const group = matchBalanceProbe.ovrBandGroups[groupKey];
    const zeroRate = group.zero.matches > 0 ? group.zero.leftWins / group.zero.matches * 100 : 0;
    console.log(`  [OVR差 ${groupLabel}]`);
    console.log(`    OVR差0: left勝利 ${group.zero.leftWins}/${group.zero.matches} (${zeroRate.toFixed(2)}%) ※理論値50%`);
    for (const [label, band] of Object.entries(group.bands)) {
      const winRate = band.matches > 0 ? band.strongerWins / band.matches * 100 : 0;
      console.log(`    OVR差${label}: 格上勝利 ${band.strongerWins}/${band.matches} (${winRate.toFixed(2)}%)`);
    }
  }
}

function mqInventoryMetric(samples, key) {
  const values = samples.map(sample => Number(sample[key]) || 0).sort((a, b) => a - b);
  if (values.length === 0) return { n: 0, mean: 0, median: 0, stddev: 0, activationPct: 0, min: 0, max: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    n: values.length,
    mean: Math.round(mean * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    stddev: Math.round(Math.sqrt(variance) * 1000) / 1000,
    activationPct: Math.round(values.filter(value => Math.abs(value) > 1e-9).length / values.length * 10000) / 100,
    min: values[0],
    max: values[values.length - 1],
  };
}

function printMqInventoryMetrics(label, samples, keys) {
  console.log(`  ${label} (n=${samples.length})`);
  for (const key of keys) {
    const metric = mqInventoryMetric(samples, key);
    console.log(`    ${key}: mean=${metric.mean} median=${metric.median} sd=${metric.stddev} active=${metric.activationPct}% range=${metric.min}..${metric.max}`);
  }
}

if (mqInventoryProbe.singlesRaw.length || mqInventoryProbe.tagRaw.length || mqInventoryProbe.regularFinal.length) {
  console.log('--------------------------------------');
  console.log('MQ Inventory Probe:');
  printMqInventoryMetrics('raw singles', mqInventoryProbe.singlesRaw,
    ['ceiling', 'dramaPenalty', 'pacingPenalty', 'finishPenalty', 'rawBeforeLowerClamp', 'finalMq']);
  const singlesLower = mqInventoryProbe.singlesRaw.filter(sample => sample.rawBeforeLowerClamp < 5).length;
  const singlesUpper = mqInventoryProbe.singlesRaw.filter(sample => sample.rawBeforeLowerClamp > 100).length;
  console.log(`    clamps: lower=${singlesLower} upper-overage=${singlesUpper} (singles engine has no upper clamp)`);
  for (const [traitKey, label, metricKey] of [
    ['hasMeishoubu', '名勝負製造機', 'dramaPenalty'],
    ['hasHikidashi', '引き出し上手', 'pacingPenalty'],
  ]) {
    const active = mqInventoryProbe.singlesRaw.filter(sample => sample[traitKey]);
    const inactive = mqInventoryProbe.singlesRaw.filter(sample => !sample[traitKey]);
    console.log(`    ${label}: active n=${active.length} ${metricKey}=${mqInventoryMetric(active, metricKey).mean} final=${mqInventoryMetric(active, 'finalMq').mean}; inactive n=${inactive.length} ${metricKey}=${mqInventoryMetric(inactive, metricKey).mean} final=${mqInventoryMetric(inactive, 'finalMq').mean}`);
  }

  if (mqInventoryProbe.tagRaw.length) {
    printMqInventoryMetrics('raw tag', mqInventoryProbe.tagRaw,
      ['ceiling', 'dramaPenalty', 'pacingPenalty', 'finishPenalty', 'screenTimeBonus', 'touchDiversityBonus', 'dramaEventBonus', 'finishBonus', 'longSegPenalty', 'screenTimePenalty', 'tagBonus', 'tagPenalty', 'rawBeforeClamp', 'finalMq']);
    const tagLower = mqInventoryProbe.tagRaw.filter(sample => sample.rawBeforeClamp < 5).length;
    const tagUpper = mqInventoryProbe.tagRaw.filter(sample => sample.rawBeforeClamp > 100).length;
    console.log(`    clamp: lower=${tagLower}; upper-overage=${tagUpper} (tag engine has no upper clamp)`);
  }

  const finals = mqInventoryProbe.regularFinal;
  if (finals.length) {
    printMqInventoryMetrics('regular show final', finals,
      ['baseEngineMq', 'rivalry', 'title', 'crowd', 'milestoneMqBoost', 'nextMatchMq', 'lastRun', 'trust', 'uncappedExternal', 'cappedPositive', 'capLoss', 'finalMq']);
    const capped = finals.filter(sample => sample.capReached).length;
    const capLoss = finals.filter(sample => sample.capLoss > 0).length;
    const lower = finals.filter(sample => sample.lowerClampHit).length;
    const over100 = finals.filter(sample => sample.finalMq > 100).length;
    console.log(`    clamp/cap: positive-cap-reached=${capped} cap-loss=${capLoss} lower=${lower} final>100=${over100}`);
    const ovBands = [
      ['<=50', value => value <= 50],
      ['50-65', value => value > 50 && value <= 65],
      ['65-80', value => value > 65 && value <= 80],
      ['80+', value => value > 80],
    ];
    const bonusKeys = ['rivalry', 'title', 'crowd', 'milestoneMqBoost', 'nextMatchMq', 'lastRun'];
    for (const [label, test] of ovBands) {
      const band = finals.filter(sample => sample.avgOV != null && test(sample.avgOV));
      if (!band.length) continue;
      const capCount = band.filter(sample => sample.capReached).length;
      const overCount = band.filter(sample => sample.finalMq > 100).length;
      const activeText = bonusKeys.map(key => `${key}:${band.filter(sample => (sample[key] || 0) > 0).length}`).join(' ');
      console.log(`    OV ${label}: n=${band.length} cap=${capCount} >100=${overCount} ${activeText}`);
    }
  }
  const uiEstimates = mqInventoryProbe.uiRouteEstimate;
  if (uiEstimates.length) {
    printMqInventoryMetrics('player UI route reconstruction', uiEstimates,
      ['baseEngineMq', 'rivalry', 'title', 'crowd', 'freshness', 'upperOverageTotal', 'finalMq']);
    const clampedMatches = uiEstimates.filter(sample => sample.upperClampCount > 0);
    const lowerMatches = uiEstimates.filter(sample => sample.finalMq === 5);
    const overages = clampedMatches.map(sample => sample.upperOverageTotal);
    console.log(`    clamps: upper=${clampedMatches.length}/${uiEstimates.length} lower-final=${lowerMatches.length}/${uiEstimates.length} overage-mean=${mqInventoryMetric(clampedMatches, 'upperOverageTotal').mean} overage-max=${overages.length ? Math.max(...overages) : 0}`);
  }

  // 超過レイヤー(mq-redesign-proposal-v0.4 §3.7 / P3a)観測。不変条件#3の検証用。
  function printTranscendMetrics(label, samples) {
    if (!samples.length) return;
    const fired = samples.filter(sample => sample.transcendFired);
    const firedPct = Math.round(fired.length / samples.length * 100000) / 1000;
    console.log(`  ${label}: n=${samples.length} fired=${fired.length} (${firedPct}%)`);
    if (fired.length) {
      const overflows = fired.map(sample => sample.transcendOverflow);
      const overflowMean = Math.round(overflows.reduce((a, b) => a + b, 0) / overflows.length * 1000) / 1000;
      const overflowMax = Math.max(...overflows);
      console.log(`    overflow: mean=${overflowMean} max=${overflowMax}`);
      const finals = fired.map(sample => sample.finalMq).sort((a, b) => a - b);
      const finalMean = Math.round(finals.reduce((a, b) => a + b, 0) / finals.length * 1000) / 1000;
      console.log(`    finalMq(fired matches): mean=${finalMean} min=${finals[0]} max=${finals[finals.length - 1]}`);
    }
    const shiftMean = Math.round(samples.reduce((sum, sample) => sum + (sample.transcendOverflow || 0), 0) / samples.length * 1000) / 1000;
    console.log(`    average MQ shift across all ${label}: +${shiftMean}`);
  }
  console.log('--------------------------------------');
  console.log('Transcend Layer Probe (P3a):');
  printTranscendMetrics('singles', mqInventoryProbe.singlesRaw);
  printTranscendMetrics('tag', mqInventoryProbe.tagRaw);

  // MQ再設計P3b(mq-redesign-proposal-v0.4 §3.3〜§3.6)観測: 固定加算撤廃→リング内化の効果測定。
  // 不変条件4: 因縁戦の平均MQ優位(同OV帯±5、非因縁戦比)+1.0〜+2.5
  // 不変条件6: 因縁/タイトルのリング内化による勝率歪みは同OV帯で±2pt以内
  {
    const singles = mqInventoryProbe.singlesRaw;
    const ovBandOf = value => Math.round(value / 5) * 5;
    // 不変条件4(MQ優位)は従来どおり「同OV帯」で括る。見応えは実力帯の話なので妥当。
    // 不変条件6(勝率歪み)だけ **実力差(ovrGap)で括り直す**(2026-08-01)。
    //   同OV帯で括ると、因縁ペアの実力差が非因縁ペアの半分以下であること自体が
    //   「格上が負けやすい」として出てしまい、リング内効果の偏りと区別できない。
    //   実力差を揃えて比べれば、因縁が勝敗を歪めているかだけを見られる。
    const gapBandOf = gap => (gap <= 2 ? '0-2' : gap <= 5 ? '3-5' : gap <= 9 ? '6-9' : '10+');
    const byBand = new Map();
    const byGap = new Map();
    for (const sample of singles) {
      const band = ovBandOf(sample.avgOV);
      if (!byBand.has(band)) byBand.set(band, { rivalry: [], none: [] });
      (sample.rivalryRingTier > 0 ? byBand.get(band).rivalry : byBand.get(band).none).push(sample);
      if (sample.ovrGap == null) continue;
      const gb = gapBandOf(sample.ovrGap);
      if (!byGap.has(gb)) byGap.set(gb, { rivalry: [], none: [] });
      (sample.rivalryRingTier > 0 ? byGap.get(gb).rivalry : byGap.get(gb).none).push(sample);
    }
    let weightedMqDiffSum = 0, mqDiffWeight = 0;
    let weightedWinDiffSum = 0, winDiffWeight = 0;
    const bandRows = [];
    for (const [band, bucket] of [...byBand.entries()].sort((a, b) => a[0] - b[0])) {
      if (bucket.rivalry.length < 5 || bucket.none.length < 5) continue; // サンプル不足帯は除外
      const rivalryMq = bucket.rivalry.reduce((s, x) => s + x.finalMq, 0) / bucket.rivalry.length;
      const noneMq = bucket.none.reduce((s, x) => s + x.finalMq, 0) / bucket.none.length;
      const mqDiff = rivalryMq - noneMq;
      weightedMqDiffSum += mqDiff * bucket.rivalry.length;
      mqDiffWeight += bucket.rivalry.length;

      const decided = arr => arr.filter(x => x.strongerSide && (x.winner === 'left' || x.winner === 'right'));
      const rivalryDecided = decided(bucket.rivalry);
      const noneDecided = decided(bucket.none);
      let winDiff = null;
      if (rivalryDecided.length >= 5 && noneDecided.length >= 5) {
        const rivalryWinRate = rivalryDecided.filter(x => x.winner === x.strongerSide).length / rivalryDecided.length * 100;
        const noneWinRate = noneDecided.filter(x => x.winner === x.strongerSide).length / noneDecided.length * 100;
        winDiff = rivalryWinRate - noneWinRate;
        weightedWinDiffSum += winDiff * rivalryDecided.length;
        winDiffWeight += rivalryDecided.length;
      }
      bandRows.push({ band, nRivalry: bucket.rivalry.length, nNone: bucket.none.length, mqDiff, winDiff });
    }
    console.log('--------------------------------------');
    console.log('Ring-in Effect Probe (P3b, mq-redesign-proposal-v0.4 §3.3〜§3.6):');
    for (const row of bandRows) {
      console.log(`  avgOV~${row.band}: n(因縁)=${row.nRivalry} n(非因縁)=${row.nNone} MQ差=${row.mqDiff.toFixed(2)} 勝率歪み=${row.winDiff == null ? 'n/a' : row.winDiff.toFixed(2) + 'pt'}`);
    }
    const overallMqDiff = mqDiffWeight ? weightedMqDiffSum / mqDiffWeight : null;
    const overallWinDiff = winDiffWeight ? weightedWinDiffSum / winDiffWeight : null;
    console.log(`  [不変条件4] 因縁戦の平均MQ優位(同OV帯±5、加重平均): ${overallMqDiff == null ? 'n/a(サンプル不足)' : overallMqDiff.toFixed(3)} (目標+1.0〜+2.5)`);
    console.log(`  (参考)勝率歪み(同OV帯・母集団の実力差を揃えていない): ${overallWinDiff == null ? 'n/a' : overallWinDiff.toFixed(3) + 'pt'}`);
    // 不変条件6 の本体: 実力差を揃えたうえで、因縁の有無で格上勝率が変わるか
    {
      const decided2 = arr => arr.filter(x => x.strongerSide && (x.winner === 'left' || x.winner === 'right'));
      let wSum = 0, wN = 0;
      const order = ['0-2', '3-5', '6-9', '10+'];
      for (const gb of order) {
        const bucket = byGap.get(gb);
        if (!bucket) continue;
        const rv = decided2(bucket.rivalry), nn = decided2(bucket.none);
        if (rv.length < 5 || nn.length < 5) { console.log(`    OVR差${gb}: n(因縁)=${bucket.rivalry.length} n(非因縁)=${bucket.none.length} 勝率歪み=n/a(サンプル不足)`); continue; }
        const rw = rv.filter(x => x.winner === x.strongerSide).length / rv.length * 100;
        const nw = nn.filter(x => x.winner === x.strongerSide).length / nn.length * 100;
        const d = rw - nw;
        wSum += d * rv.length; wN += rv.length;
        console.log(`    OVR差${gb}: n(因縁)=${rv.length} n(非因縁)=${nn.length} 格上勝率 因縁${rw.toFixed(1)}% 非因縁${nw.toFixed(1)}% 歪み=${d.toFixed(2)}pt`);
      }
      const overall = wN ? wSum / wN : null;
      console.log(`  [不変条件6] 勝率歪み(**実力差を揃えた**加重平均): ${overall == null ? 'n/a(サンプル不足)' : overall.toFixed(3) + 'pt'} (目標±2pt以内)`);
    }

    // リング内効果の発動率(母数=シングル全試合)
    const n = singles.length || 1;
    const rivalryActive = singles.filter(s => s.rivalryRingTier > 0).length;
    const titleActive = singles.filter(s => s.titleRingApplied).length;
    const trustActive = singles.filter(s => s.trustDebuffSum < 0).length;
    const buffActive = singles.filter(s => s.ovBuffSum > 0).length;
    console.log(`  発動率(n=${singles.length}): 因縁=${(rivalryActive / n * 100).toFixed(2)}% タイトル=${(titleActive / n * 100).toFixed(2)}% trust=${(trustActive / n * 100).toFixed(2)}% バフ=${(buffActive / n * 100).toFixed(2)}%`);
    for (let tier = 1; tier <= 4; tier++) {
      const tierN = singles.filter(s => s.rivalryRingTier === tier).length;
      if (tierN) console.log(`    因縁tier${tier}: n=${tierN} (${(tierN / n * 100).toFixed(2)}%)`);
    }

    // 超過レイヤー(P3a)発生率: 因縁あり/なしでの比較(因縁が燃料になり微増するはず)
    const rivalrySamples = singles.filter(s => s.rivalryRingTier > 0);
    const noneSamples = singles.filter(s => s.rivalryRingTier === 0);
    const transcendRate = arr => arr.length ? arr.filter(x => x.transcendFired).length / arr.length * 100 : 0;
    console.log(`  超過レイヤー発生率: 因縁あり=${transcendRate(rivalrySamples).toFixed(3)}%(n=${rivalrySamples.length}) 因縁なし=${transcendRate(noneSamples).toFixed(3)}%(n=${noneSamples.length}) 全体=${transcendRate(singles).toFixed(3)}%`);
  }
}

// MQ再設計P3c(mq-redesign-proposal-v0.5 §3.2/§3.2b/§3.7b/G) 計測レポート
console.log('--------------------------------------');
console.log('MQ P3c Probe (観客帯×試合注目度・会場の熱・OV100超・鮮度→集客移管):');
{
  const percentile = (arr, p) => {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Engine.util.clamp(Math.round((sorted.length - 1) * p), 0, sorted.length - 1);
    return sorted[idx];
  };
  const fpArr = mqP3cProbe.showFp;
  if (fpArr.length) {
    console.log(`  [計測1] fp(fill pressure)分布 n=${fpArr.length}:`);
    console.log(`    p10=${percentile(fpArr, 0.10).toFixed(3)} p25=${percentile(fpArr, 0.25).toFixed(3)} p50=${percentile(fpArr, 0.50).toFixed(3)} p75=${percentile(fpArr, 0.75).toFixed(3)} p90=${percentile(fpArr, 0.90).toFixed(3)} p95=${percentile(fpArr, 0.95).toFixed(3)} p99=${percentile(fpArr, 0.99).toFixed(3)}`);
    const bc = mqP3cProbe.pressureBandCounts;
    const total = fpArr.length;
    const pct = n => (n / total * 100).toFixed(2);
    console.log(`    pressureFactor帯割合: +1.0=${pct(bc.plus10)}% +0.5=${pct(bc.plus05)}% 0=${pct(bc.zero)}% -0.5=${pct(bc.minus05)}% -1.0=${pct(bc.minus10)}%`);
    const topBandPct = Number(pct(bc.plus10));
    console.log(`    [目標: 最上位帯(+1.0)が興行の10〜15%以下] 実測=${topBandPct}% ${topBandPct <= 15 ? 'OK' : '(目標外・報告のみ、係数は変更しない)'}`);
  } else {
    console.log('  [計測1] fp分布: サンプルなし(通常興行が発生しなかった)');
  }

  const sigmaArr = mqP3cProbe.showCrowdSigma;
  if (sigmaArr.length) {
    const sigmaMean = sigmaArr.reduce((a, b) => a + b, 0) / sigmaArr.length;
    console.log(`  [計測2/不変条件1] 興行内・試合間の観客寄与σ: mean=${sigmaMean.toFixed(3)} n(興行, 2試合以上)=${sigmaArr.length} [目標: ≥1.0] ${sigmaMean >= 1.0 ? 'OK' : 'NG'}`);
  } else {
    console.log('  [計測2] 観客寄与σ: サンプルなし(2試合以上の通常興行が発生しなかった)');
  }

  const avgMqArr = mqP3cProbe.showAvgMq;
  if (avgMqArr.length) {
    const avgMqMean = avgMqArr.reduce((a, b) => a + b, 0) / avgMqArr.length;
    console.log(`  [計測3] 通常興行の平均MQ着地: mean=${avgMqMean.toFixed(2)} n(興行)=${avgMqArr.length} [想定: 約54±1.5]`);
  }

  const singlesAll = mqInventoryProbe.singlesRaw;
  const over100 = singlesAll.filter(s => s.ovCeilingOver100);
  if (singlesAll.length) {
    const rate = (over100.length / singlesAll.length * 100);
    console.log(`  [計測4/不変条件9] OV100超ペア発生率(シングル全経路): n=${over100.length}/${singlesAll.length} (${rate.toFixed(3)}%)`);
    if (over100.length) {
      const upshiftMean = over100.reduce((s, x) => s + x.ovCeilingUpshift, 0) / over100.length;
      const upshiftMax = Math.max(...over100.map(x => x.ovCeilingUpshift));
      console.log(`    平均上振れ(ceiling-100): mean=+${upshiftMean.toFixed(2)} max=+${upshiftMax.toFixed(2)}`);
    }
    // 不変条件9: avgOV<=100のペアは素点が完全不変であること(第4セグメント追加のみ・既存3セグメントは触っていない)
    console.log(`    [不変条件9注記] avgOV<=100は既存3セグメントの式そのまま(コード上不変)。第4セグメントはavgOV>100のみに作用`);
  }

  const deltaArr = mqP3cProbe.freshnessAttendanceDeltaPct;
  if (deltaArr.length) {
    const deltaMean = deltaArr.reduce((a, b) => a + b, 0) / deltaArr.length;
    console.log(`  [計測6] 鮮度→集客移管によるappeal合計の平均変化(動員%の近似値): mean=${deltaMean >= 0 ? '+' : ''}${deltaMean.toFixed(3)}% n(興行)=${deltaArr.length} [想定: ±2%以内]`);
    console.log(`    マンネリ/初顔合わせ係数が実際に効いた試合数: ${mqP3cProbe.freshnessMultActiveMatches}/${mqP3cProbe.freshnessMultTotalMatches} (${(mqP3cProbe.freshnessMultActiveMatches / Math.max(1, mqP3cProbe.freshnessMultTotalMatches) * 100).toFixed(2)}%)`);
  }

  console.log(`  [計測5] ドーム(venueIdx=9)興行の発生回数: ${mqP3cProbe.domeShowCount || 0}件。0件ならtest/mq-p3c-unit.jsの単体テストで検証(tierAmp/大一番化/engagement cap)。`);
}

console.log('--------------------------------------');
console.log('MQ All-Time Record Probe:');
console.log(`  updates(合算): ${mqRecordProbe.updates.length} / ${targetSeasons} seasons`);
console.log(`  updates per 10 seasons(合算): ${(mqRecordProbe.updates.length / Math.max(1, targetSeasons) * 10).toFixed(2)}`);
// MQ再設計P3e(§2.2): mqRecord(シングル)/mqRecordTag(タッグ)を分離して報告する。
console.log(`  [シングル] updates: ${mqRecordProbe.updatesSingle.length} / ${targetSeasons} seasons (${(mqRecordProbe.updatesSingle.length / Math.max(1, targetSeasons) * 10).toFixed(2)}/10seasons)`);
if (mqRecordProbe.updatesSingle.length > 0) {
  const lastSingle = mqRecordProbe.updatesSingle[mqRecordProbe.updatesSingle.length - 1];
  console.log(`    final observed record: MQ${lastSingle.value} (${lastSingle.stage}, S${lastSingle.season} W${lastSingle.week})`);
}
console.log(`  [タッグ] updates: ${mqRecordProbe.updatesTag.length} / ${targetSeasons} seasons (${(mqRecordProbe.updatesTag.length / Math.max(1, targetSeasons) * 10).toFixed(2)}/10seasons)`);
if (mqRecordProbe.updatesTag.length > 0) {
  const lastTag = mqRecordProbe.updatesTag[mqRecordProbe.updatesTag.length - 1];
  console.log(`    final observed record: MQ${lastTag.value} (${lastTag.stage}, S${lastTag.season} W${lastTag.week})`);
}
if (mqRecordProbe.updates.length > 0) {
  const lastRecord = mqRecordProbe.updates[mqRecordProbe.updates.length - 1];
  console.log(`  final observed record(合算): MQ${lastRecord.value} (${lastRecord.stage}, S${lastRecord.season} W${lastRecord.week})`);
}

const mqPathRows = Object.entries(mqPathProbe)
  .map(([pathName, entries]) => {
    const unique = [...new Map(entries.map(entry => [entry.result, entry])).values()];
    const finals = unique.map(entry => Number(entry.result?.mq) || 0);
    const capped = finals.map(value => Math.min(100, value));
    const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return {
      pathName,
      count: finals.length,
      meanFinal: mean(finals),
      meanAppClamp: mean(capped),
      over100: finals.filter(value => value > 100).length,
      max: finals.length ? Math.max(...finals) : 0,
    };
  })
  .filter(row => row.count > 0);
if (mqPathRows.length) {
  console.log('  special-path upper-clamp reconstruction:');
  for (const row of mqPathRows) {
    console.log(`    ${row.pathName}: n=${row.count} current=${row.meanFinal.toFixed(3)} appClamp=${row.meanAppClamp.toFixed(3)} delta=${(row.meanAppClamp - row.meanFinal).toFixed(3)} >100=${row.over100} max=${row.max}`);
  }
}
console.log('--------------------------------------');
console.log('MQ P3d Baseline Compare Probe (mq-p3d-baseline-compare-v0.1) — 物差し再較正の材料:');
{
  const percentile = (arr, p) => {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Engine.util.clamp(Math.round((sorted.length - 1) * p), 0, sorted.length - 1);
    return sorted[idx];
  };
  const pctRow = arr => {
    if (!arr.length) return 'n=0';
    const ps = [0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99];
    const labels = ['p5', 'p10', 'p25', 'p50', 'p75', 'p90', 'p95', 'p99'];
    return `n=${arr.length} ` + ps.map((p, i) => `${labels[i]}=${percentile(arr, p).toFixed(3)}`).join(' ');
  };

  console.log('  [fp(fill pressure) percentile]');
  const fpAll = p3dProbe.fpSamples.map(x => x.fp);
  console.log(`    全体: ${pctRow(fpAll)}`);
  const seasonBandOf = season => (season <= 10 ? 'S1-10' : season <= 25 ? 'S11-25' : 'S26+');
  for (const band of ['S1-10', 'S11-25', 'S26+']) {
    const arr = p3dProbe.fpSamples.filter(x => seasonBandOf(x.season) === band).map(x => x.fp);
    console.log(`    season=${band}: ${pctRow(arr)}`);
  }
  const venueTierOf = idx => (idx <= 2 ? '小会場(0-2)' : idx <= 5 ? '中会場(3-5)' : idx <= 8 ? '大会場(6-8)' : 'ドーム(9)');
  for (const tier of ['小会場(0-2)', '中会場(3-5)', '大会場(6-8)', 'ドーム(9)']) {
    const arr = p3dProbe.fpSamples.filter(x => venueTierOf(x.venueIdx) === tier).map(x => x.fp);
    console.log(`    venue=${tier}: ${pctRow(arr)}`);
  }

  console.log('  [MQ閾値越え率(通常興行の全試合・シングル+タッグ)]');
  const mqAll = p3dProbe.normalShowMq.map(x => x.mq);
  const mqLabels = { 45: 'メディア系下限', 60: 'メディア系上位', 65: '成長系(closeMatch)', 70: 'trust好試合', 80: '成長系(高MQ)' };
  console.log(`    n(試合)=${mqAll.length}`);
  [45, 60, 65, 70, 80].forEach(t => {
    const rate = mqAll.length ? (mqAll.filter(v => v >= t).length / mqAll.length * 100) : 0;
    console.log(`    MQ>=${t} (${mqLabels[t]}): ${rate.toFixed(2)}%`);
  });

  const avgMqArr = mqP3cProbe.showAvgMq;
  if (avgMqArr.length) {
    const r50 = avgMqArr.filter(v => v >= 50).length / avgMqArr.length * 100;
    const r30 = avgMqArr.filter(v => v >= 30).length / avgMqArr.length * 100;
    console.log(`  [興行平均MQ閾値越え率] n(興行)=${avgMqArr.length} 平均MQ>=50: ${r50.toFixed(2)}%  平均MQ>=30: ${r30.toFixed(2)}%`);
  } else {
    console.log('  [興行平均MQ閾値越え率] サンプルなし');
  }

  const revArr = p3dProbe.showRevenue.map(x => x.revenue);
  if (revArr.length) {
    const revMean = revArr.reduce((a, b) => a + b, 0) / revArr.length;
    console.log(`  [興行収入(チケット+興行連動グッズ/メディア)] n(興行)=${revArr.length} 平均=${revMean.toFixed(1)}万円 min=${Math.min(...revArr).toFixed(0)}万円 max=${Math.max(...revArr).toFixed(0)}万円`);
  } else {
    console.log('  [興行収入] サンプルなし');
  }

  const seasonsCount = Math.max(1, result.stats.seasons || 0);
  console.log(`  [ブレークスルー] total=${p3dProbe.breakthroughs.total} 平均/シーズン=${(p3dProbe.breakthroughs.total / seasonsCount).toFixed(3)} (n(seasons)=${seasonsCount})`);

  if (p3dProbe.seasonEnd.length) {
    const avgTrustAll = p3dProbe.seasonEnd.reduce((sum, x) => sum + x.avgTrust, 0) / p3dProbe.seasonEnd.length;
    const avgPopAll = p3dProbe.seasonEnd.reduce((sum, x) => sum + x.avgPopularity, 0) / p3dProbe.seasonEnd.length;
    console.log(`  [シーズン末 自団体ロスター平均(レンタル除く)] n(seasons)=${p3dProbe.seasonEnd.length} avgTrust=${avgTrustAll.toFixed(2)} avgPopularity=${avgPopAll.toFixed(2)}`);
  } else {
    console.log('  [シーズン末ロスター平均] サンプルなし');
  }

  if (result.stats.v2Samples && result.stats.v2Samples.length) {
    const samples = result.stats.v2Samples;
    const total = samples.length;
    const distPct = [1, 2, 3, 4, 5].map(st => (samples.filter(x => x.stars === st).length / total * 100).toFixed(1));
    console.log(`  [ショー評価★分布] n=${total} ` + [1, 2, 3, 4, 5].map((st, i) => `★${st}=${distPct[i]}%`).join(' '));
  } else {
    console.log('  [ショー評価★分布] サンプルなし');
  }

  console.log(`  [超過レイヤー発生率(既存計測の再掲)] ${(() => {
    const singles = mqInventoryProbe.singlesRaw;
    if (!singles.length) return 'n=0';
    const rate = singles.filter(x => x.transcendFired).length / singles.length * 100;
    return `n=${singles.length} rate=${rate.toFixed(3)}%`;
  })()}`);
  console.log(`  [mqRecord更新回数(既存計測の再掲・合算)] updates=${mqRecordProbe.updates.length} / ${targetSeasons} seasons (${(mqRecordProbe.updates.length / Math.max(1, targetSeasons) * 10).toFixed(2)}/10seasons)`);
  console.log(`  [mqRecord更新回数 シングル/タッグ内訳] singles=${mqRecordProbe.updatesSingle.length} tag=${mqRecordProbe.updatesTag.length}`);
}
// ── 殿堂入り計測モード (WM_HOF_FIXTURE=1) ──────────────────────────────
// 2026-08-01: 加点要素の追加を検討するにあたり、
//   ・いまの実績ポイントの分布と、★/★★/★★★ の到達人数
//   ・**全盛期OVR が実績ポイントと別の軸になっているか**（相関）
//   ・追加候補（挑戦状の勝利 / 歴代最高評価の試合 / 大会ベストバウト）が何点動かすか
// を数える。「必要かどうか考える検証をしてみましょう」(Keisuke) への回答用。
if (process.env.WM_HOF_FIXTURE === '1') {
  console.log('--------------------------------------');
  console.log('[殿堂入り計測] (WM_HOF_FIXTURE=1)');
  const rows = [];
  for (const rec of hofCensus) {
    if (!rec) continue;
    let cur = 0;
    try { cur = Engine.awards.calcHofPoints(rec) || 0; } catch (e) { continue; }
    const hist = rec.history || [];
    const n = (pred) => hist.filter(pred).length;
    const addB3 = n(e => e.type === 'b3Challenge' && e.won) * 2;
    const addMq = n(e => e.type === 'mqAllTimeRecord' || e.type === 'mqTagRecord') * 4;
    const addBest = n(e => e.type === 'tenchosenBestBout' || e.type === 'juniorTournamentBestBout') * 2;
    rows.push({ cur, add: addB3 + addMq + addBest, addB3, addMq, addBest, peak: rec.peakOVR || 0 });
  }
  // ── 残っている殿堂入り(恒久)の実人数 ──
  {
    const allHof = (typeof lastAllHallOfFame !== 'undefined' && lastAllHallOfFame) || null;
    if (allHof) {
      const parts = Object.entries(allHof).map(([k, v]) => `${k}=${(v || []).length}`);
      console.log(`  [i] allHallOfFame(恒久保存) ${parts.join(' ')}`);
    } else {
      console.log('  [i] allHallOfFame 未取得');
    }
    const fromPlayer = hofCensus.filter(r => r._wasPlayerRoster).length;
    console.log(`  [i] 一度でも自団体に在籍した人: ${fromPlayer} / ${hofCensus.length}`);
  }
  // ── 取りこぼし監査 ──────────────────────────────────────────
  // 「今までのバランスで問題なく殿堂入りは出ていた」(Keisuke 2026-08-01)。
  // 圏外が9割を超えるなら、集計側が**加点すべきものを読み落としている**疑いがある。
  // 実際にキャリアへ積まれている type と、calcHofPoints が読む type を突き合わせる。
  {
    const typeCount = {};
    hofCensus.forEach(rec => (rec.history || []).forEach(e => {
      if (e && e.type) typeCount[e.type] = (typeCount[e.type] || 0) + 1;
    }));
    // calcHofPoints が実際に読んでいる type（ソースと対で保守すること）
    const READ = {
      titleWin: 'タイトル獲得(countTitleStats経由)',
      titleDefense: 'タイトル防衛(countTitleStats経由)',
      juniorTournament: 'ジュニア優勝 ×4',
      springTagLeague: '春タッグ優勝 ×3',
      autumnWar: '秋対抗戦 勝ち抜き/優勝',
      ppvTournament: '天頂戦 優勝8/準優勝5/ベスト4=3',
      ppvMainEvent: '頂上決戦 勝利 ×5',
      war: '対抗戦 勝利 ×1.5',
      awardMVP: 'MVP ×2',
      awardRookie: '新人王 1.5',
      awardBestMatch: 'ベストマッチ ×1',
      awardMedia: 'メディア功労 ×1.5',
      domeMain: 'ドームメイン 勝3/敗1',
    };
    console.log('  ── 取りこぼし監査 ──');
    const readKeys = Object.keys(READ);
    const missing = readKeys.filter(k => !typeCount[k]);
    if (missing.length) {
      console.log(`  [!] 集計対象なのにキャリアに1件も無い type (${missing.length}件):`);
      missing.forEach(k => console.log(`      ${k.padEnd(20)} ${READ[k]}`));
    } else {
      console.log('  集計対象の type はすべてキャリアに存在する');
    }
    const unread = Object.keys(typeCount)
      .filter(k => !readKeys.includes(k))
      .sort((a, b) => typeCount[b] - typeCount[a]);
    console.log(`  [i] キャリアにあるが集計していない type (上位15/全${unread.length}件):`);
    unread.slice(0, 15).forEach(k => console.log(`      ${k.padEnd(24)} ${String(typeCount[k]).padStart(5)}件`));
    console.log('  [i] 集計対象の出現件数:');
    readKeys.forEach(k => console.log(`      ${k.padEnd(20)} ${String(typeCount[k] || 0).padStart(5)}件  ${READ[k]}`));
  }

  if (rows.length === 0) {
    console.log('  引退者0人。シーズン数を増やして再実行してください');
  } else {
    const lv = p => (p >= 35 ? 3 : p >= 22 ? 2 : p >= 15 ? 1 : 0);
    const count = (arr, f) => arr.filter(f).length;
    const pct = (a, b) => `${(a / b * 100).toFixed(1)}%`;
    const N = rows.length;
    console.log(`  引退者 n=${N}`);
    [['現行', r => r.cur], ['加点後', r => r.cur + r.add]].forEach(([label, get]) => {
      const c = [0, 1, 2, 3].map(l => count(rows, r => lv(get(r)) === l));
      console.log(`  ${label.padEnd(6)} 圏外 ${String(c[0]).padStart(4)}(${pct(c[0], N)})  `
        + `★ ${String(c[1]).padStart(3)}(${pct(c[1], N)})  `
        + `★★ ${String(c[2]).padStart(3)}(${pct(c[2], N)})  `
        + `★★★ ${String(c[3]).padStart(3)}(${pct(c[3], N)})`);
    });
    const promoted = count(rows, r => lv(r.cur + r.add) > lv(r.cur));
    console.log(`  加点で階級が上がる人数: ${promoted} (${pct(promoted, N)})  ← 閾値を据え置いた場合のインフレ量`);
    console.log(`  加点の内訳(合計pt): 挑戦状=${rows.reduce((s, r) => s + r.addB3, 0)} `
      + `歴代最高評価=${rows.reduce((s, r) => s + r.addMq, 0)} ベストバウト=${rows.reduce((s, r) => s + r.addBest, 0)}`);

    // 全盛期OVR は別の軸か？(実績ポイントとの相関 / 高peak低ptの層)
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    const xs = rows.map(r => r.peak), ys = rows.map(r => r.cur);
    const mx = mean(xs), my = mean(ys);
    const cov = mean(rows.map((r, i) => (xs[i] - mx) * (ys[i] - my)));
    const sd = a => Math.sqrt(mean(a.map(v => (v - mean(a)) ** 2)));
    const corr = cov / (sd(xs) * sd(ys) || 1);
    console.log(`  全盛期OVR と 実績pt の相関 r=${corr.toFixed(3)}  (peak平均=${mx.toFixed(1)})`);
    const hiPeak = rows.filter(r => r.peak >= 80);
    const hiPeakLowPt = count(hiPeak, r => r.cur < 15);
    console.log(`  peak80以上 n=${hiPeak.length} のうち 現行で圏外(15pt未満): ${hiPeakLowPt} (${hiPeak.length ? pct(hiPeakLowPt, hiPeak.length) : '-'})`);
    console.log('    ↑ 「強かったのに何も獲れなかった」層。多いほど全盛期OVR加点に意味がある');
    const loPeakIn = count(rows, r => r.peak < 70 && r.cur >= 15);
    console.log(`  peak70未満なのに ★以上: ${loPeakIn} (${pct(loPeakIn, N)})  ← 実績だけで入れてしまう層`);
  }
}

// ── 王座の保持期間 (WM_TITLE_FIXTURE=1) ────────────────────────────────
// 記事文の語彙を決めるための材料。「N年保持」と書ける長さの在位が実際にあるのか、
// それとも「N度防衛」でしか語れないのかを、分布で見る。
if (process.env.WM_TITLE_FIXTURE === '1') {
  console.log('--------------------------------------');
  console.log('[王座の保持期間] (WM_TITLE_FIXTURE=1)  1シーズン=48週');
  const all = titleCensus.reigns;
  if (!all.length) {
    console.log('  在位を1件も観測できなかった');
  } else {
    const show = (label, rows) => {
      if (!rows.length) { console.log(`  ${label}: なし`); return; }
      const w = rows.map(r => r.weeks).sort((a, b) => a - b);
      const d = rows.map(r => r.defenses).sort((a, b) => a - b);
      const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
      const avg = arr => (arr.reduce((s, v) => s + v, 0) / arr.length);
      const pct = n => `${(n / rows.length * 100).toFixed(1)}%`;
      console.log(`  ${label}  n=${rows.length}`);
      console.log(`    保持週数  平均${avg(w).toFixed(1)}週 (${(avg(w) / 48).toFixed(2)}年)  中央${q(w, .5)}週  最長${w[w.length - 1]}週`);
      console.log(`    分位      p25=${q(w, .25)}週  p75=${q(w, .75)}週  p90=${q(w, .9)}週`);
      console.log(`    1年(48週)以上: ${pct(w.filter(v => v >= 48).length)}   2年以上: ${pct(w.filter(v => v >= 96).length)}   半年(24週)未満: ${pct(w.filter(v => v < 24).length)}`);
      console.log(`    防衛回数  平均${avg(d).toFixed(2)}度  中央${q(d, .5)}度  最多${d[d.length - 1]}度  0度で明け渡し: ${pct(d.filter(v => v === 0).length)}`);
    };
    show('全団体', all);
    const mine = all.filter(r => r.orgId === 'player');
    if (mine.length) show('自団体のみ', mine);
    else console.log('  自団体: 観測対象外 — 団体王座の解禁(titleEstablished)は app.js にしかなく、'
      + 'auto-sim は app.js を読まないため自団体の王座は一度も設立されない。上の数字はAI団体のみ');
  }
}

// ── 一面トップの種別分布 (WM_FRONTPAGE_FIXTURE=1) ────────────────────
// 新聞P2 で「どの記事が一面に来るか」がどう変わったかを見る。
// WM_SOURCE_REF=<ref> と併用すれば P2 前後を同一シードで比べられる。
if (process.env.WM_FRONTPAGE_FIXTURE === '1') {
  console.log('--------------------------------------');
  console.log('[一面トップの種別] (WM_FRONTPAGE_FIXTURE=1)');
  const c = frontPageCensus;
  if (!c.total) console.log('  観測なし');
  else {
    Object.entries(c.byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`  ${k.padEnd(26)} ${String(v).padStart(4)}  ${(v / c.total * 100).toFixed(1)}%`);
    });
    console.log(`  ${'(号数)'.padEnd(26)} ${String(c.total).padStart(4)}`);
    if (c.values.length) {
      const v = [...c.values].sort((a, b) => a - b);
      const avg = v.reduce((s2, x) => s2 + x, 0) / v.length;
      console.log(`  合成点  平均${avg.toFixed(0)}  中央${v[Math.floor(v.length / 2)]}  最小${v[0]}  最大${v[v.length - 1]}`);
      console.log(`  資格線260以上の号: ${(v.filter(x => x >= 260).length / v.length * 100).toFixed(1)}%`);
    }
  }
}

// ── 給与カーブ (WM_SALARY_FIXTURE=1) ──────────────────────────────────
// gapRatio帯の分布を出す。詳細分析用に WM_SALARY_FIXTURE_OUT=<path> で生データをJSON保存。
if (process.env.WM_SALARY_FIXTURE === '1') {
  console.log('--------------------------------------');
  console.log('[給与カーブ計測] (WM_SALARY_FIXTURE=1)  更改直前サンプル');
  const rows = salaryCensus.renewals;
  if (!rows.length) {
    console.log('  観測なし');
  } else {
    const bands = [
      ['gap>=1.3 (昇給large)', r => r.gapRatio >= 1.3],
      ['1.1-1.3 (昇給mid)  ', r => r.gapRatio >= 1.1 && r.gapRatio < 1.3],
      ['0.90-1.1 (none)    ', r => r.gapRatio > 0.90 && r.gapRatio < 1.1],
      ['0.75-0.90 (下りmid)', r => r.gapRatio > 0.75 && r.gapRatio <= 0.90],
      ['<=0.75 (下りlarge) ', r => r.gapRatio <= 0.75],
    ];
    console.log(`  選手シーズン数 n=${rows.length}  (${targetSeasons}季)`);
    for (const [label, fn] of bands) {
      const hit = rows.filter(fn);
      const wearHit = hit.filter(r => r.wear > 0).length;
      console.log(`  ${label} ${String(hit.length).padStart(5)}  ${(hit.length / rows.length * 100).toFixed(1)}%  (うちwear>0: ${wearHit})`);
    }
    const raiseTotal = salaryCensus.raises.reduce((s, r) => s + r.delta, 0);
    console.log(`  昇給イベント: ${salaryCensus.raises.length}件  総額${raiseTotal}万/週分`);
  }
  if (process.env.WM_SALARY_FIXTURE_OUT) {
    fs.writeFileSync(process.env.WM_SALARY_FIXTURE_OUT,
      JSON.stringify({ seed: userSeed, seasons: targetSeasons, ...salaryCensus }));
    console.log(`  生データ保存: ${process.env.WM_SALARY_FIXTURE_OUT}`);
  }
}

if (process.env.WM_FACTION_FIXTURE === '1') {
  console.log('--------------------------------------');
  console.log('[派閥イベント発生内訳] (WM_FACTION_FIXTURE=1)');
  const evEntries = Object.entries(factionEventCensus.byEvent).sort((a, b) => b[1] - a[1]);
  const evTotal = evEntries.reduce((s, [, v]) => s + v, 0);
  if (!evTotal) {
    console.log('  発生なし');
  } else {
    for (const [k, v] of evEntries) {
      console.log(`  ${k.padEnd(16)} ${String(v).padStart(5)}  ${(v / targetSeasons).toFixed(2)}/season  ${(v / evTotal * 100).toFixed(1)}%`);
    }
    console.log(`  ${'TOTAL'.padEnd(16)} ${String(evTotal).padStart(5)}  ${(evTotal / targetSeasons).toFixed(2)}/season`);
    const commonKeys = evEntries.filter(([k]) => k.startsWith('COMMON_'));
    const commonTotal = commonKeys.reduce((s, [, v]) => s + v, 0);
    if (commonTotal) {
      const c1 = factionEventCensus.byEvent.COMMON_1 || 0;
      console.log(`  共通イベント ${commonTotal} 件中 COMMON_1 は ${c1} 件 (${(c1 / commonTotal * 100).toFixed(1)}%)`);
    }
    const f07 = Object.entries(factionEventCensus.byF07Incident).sort((a, b) => b[1] - a[1]);
    if (f07.length) {
      console.log('  [F07 incidentType 内訳]');
      for (const [k, v] of f07) console.log(`    ${k.padEnd(24)} ${v}`);
    }
  }
}
// ── care-rework2 P0-5: ケア計装サマリー ──
{
  const avg = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  console.log('--------------------------------------');
  console.log(`[ケア計装] mode: ${CARE_MODE ? '--care (自動決裁ON)' : 'ケアなし(従来)'}`);
  console.log(`  平均trust(自団体・週次平均):        ${avg(careStats.trustSamples).toFixed(2)}`);
  console.log(`  平均lockerRoomMorale(週次平均):     ${avg(careStats.moraleSamples).toFixed(2)}`);
  if (CARE_MODE) {
    console.log(`  ケア総支出:                         ${Math.round(careStats.totalSpend)}万 (${(careStats.totalSpend / targetSeasons).toFixed(0)}万/season)`);
    console.log(`  決裁枠⚡消費合計:                    ${careStats.totalDp} (${(careStats.totalDp / targetSeasons).toFixed(1)}/season)`);
    console.log('  実行回数(書類別):');
    for (const docId of CARE_PRIORITY) {
      const n = careStats.counts[docId] || 0;
      const doc = Engine.shachoshitsu.getDoc(docId);
      console.log(`    ${(doc ? doc.label : docId).padEnd(18)} ${String(n).padStart(5)}  ${(n / targetSeasons).toFixed(2)}/season`);
    }
    const cdEntries = Object.entries(careStats.cooldownSkips).sort((a, b) => b[1] - a[1]);
    if (cdEntries.length) {
      console.log('  CD中でスキップ(正常・不具合ではない):');
      for (const [k, v] of cdEntries) console.log(`    ${k.padEnd(36)} ${v}`);
    }
    const errEntries = Object.entries(careStats.errors).sort((a, b) => b[1] - a[1]);
    if (errEntries.length) {
      console.log('  実行できなかった内訳(書類:理由):');
      for (const [k, v] of errEntries.slice(0, 10)) console.log(`    ${k.padEnd(36)} ${v}`);
    }
  }
}
console.log('--------------------------------------');
console.log(`Total violations: ${result.violations.length} (${uniqueViolations.length} unique)`);
console.log(`Total errors: ${result.errors.length}`);
console.log(`Freq warnings: ${freqWarnings.length}`);
console.log(`Total weeks simulated: ${result.totalWeeks}`);
console.log(`Game overs: ${result.gameOverCount}`);
console.log(`Semantic fingerprint: ${result.semanticFingerprint}`);
console.log(`Elapsed: ${elapsed}s`);
const allClear = uniqueViolations.length === 0 && result.errors.length === 0 && freqWarnings.length === 0;
console.log(`Result: ${allClear ? 'ALL CLEAR ✓' : 'ISSUES FOUND'}`);
console.log('(engine-integrity check — バランス判断にはプレイ実機確認が必要)');
