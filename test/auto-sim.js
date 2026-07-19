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
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');

// window stub（Engine内で IS_TRIAL 参照がある）
global.window = { IS_TRIAL: false };

// ── Step 1: ソースコードをグローバルスコープで実行 ──
// data.js / engine.js はブラウザ向けのグローバル const で宣言されているため、
// require() の module wrapper ではスコープが閉じてしまう。
// ファイル内容を読み取り、const/let → var に置換してグローバルに展開する。

const vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
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
const args = process.argv.slice(2);
const targetSeasons = parseInt(args[0], 10) || 100;
const userSeed = args[1] ? parseInt(args[1], 10) : (Date.now() ^ 0xABCD1234);

console.log('=== Wrestle Manager Auto-Simulation ===');
console.log('Mode: engine-integrity (エンジン整合性チェック)');
console.log('※ プレイ再現ではありません。バランス判断の単独根拠にしないでください。');
console.log(`Seed: ${userSeed}`);
console.log(`Seasons: ${targetSeasons}`);
console.log('--------------------------------------');

// ── Step 3: ゲーム初期化 ──
function initGame(seed) {
  let G = Engine.createInitialState(seed, true); // skipDraft=true（ドラフトスキップ）
  G = { ...G, debugLog: G.debugLog || [] };
  return G;
}

// ── Step 4: プレイヤー判断のランダム自動化 ──

// 興行カード自動編成
// TODO[heuristic]: ランダムシャッフルで代用。本番ではプレイヤーが戦略的に編成する。
//   因縁カード・タイトル戦の意図的配置、人気選手の起用頻度管理などは再現されない。
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;

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

// Phase 3a: 派閥イベント自動処理（F01/F02/F03 をランダムに応答）
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
    if (neg.attitude === 'raise') {
      // 70% 受ける, 20% 交渉, 10% 拒否
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      // 60% 引留, 20% 理由を聞く→引留, 20% 送り出す
      if (roll < 0.6) { choiceIdx = 0; }
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else { choiceIdx = 2; }
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
    try {
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
      // 4団体勝ち残り対抗戦 Week35: OVR上位3名を弱い順に並べて自動確定。
      // 決勝では準決勝後conditionの高い順へ自動再編成する。
      if (G.autumnWarPhase === 'entry') {
        const memberIds = Engine.autumnWar._selectMembers(G, 'player');
        if (memberIds.length === Engine.autumnWar.TEAM_SIZE) {
          const order = Engine.autumnWar._defaultOrder(G, 'player', memberIds);
          G = Engine.autumnWar.confirmPlayerTeam(G, memberIds, order);
          G = { ...G, autumnWar: { ...G.autumnWar, autoReorderFinal: true } };
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

      // ── 興行週: カード自動編成→executeShow ──
      // 春のタッグリーグ開催週(Week12)はリーグ興行がその週の枠を占めるため、通常興行はスキップ
      // (Phase 1時点ではUI側の「週12は通常カード編成不可」導線が未実装のため、auto-sim側で代替)
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
          stats.showCount++;
          stats.titleMatchCount += G.showCard.filter(m => m.isTitle).length;
          const showResult = Engine.executeShow(G);
          if (showResult && !showResult.error) {
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
      // UIなしのauto-simでは秋大会リプレイを即時確定する。
      // プレイヤー編成時にautoReorderFinal=trueを予約済みなので、previewResultが正となる。
      if (G._pendingAutumnWarReplay && G.autumnWar?.previewResult) {
        const appliedAutumn = Engine.autumnWar.apply(G, G.autumnWar.previewResult);
        const { _pendingAutumnWarReplay: _awPending, ...autumnClean } = appliedAutumn.state;
        const { previewResult: _awPreviewResult, ...autumnWarClean } = autumnClean.autumnWar || {};
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

      // ── シーズン遷移検出 ──
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        stats.seasons++;
        stats.orgPopHistory.push(Math.round((G.orgPop || 0) * 10) / 10);
        stats.fundsHistory.push(Math.round(G.funds || 0));


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

  return { violations, errors, totalWeeks, gameOverCount, stats, flagStats, finalSeasons: G ? G.season : 0 };
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
console.log('--------------------------------------');
console.log(`Total violations: ${result.violations.length} (${uniqueViolations.length} unique)`);
console.log(`Total errors: ${result.errors.length}`);
console.log(`Freq warnings: ${freqWarnings.length}`);
console.log(`Total weeks simulated: ${result.totalWeeks}`);
console.log(`Game overs: ${result.gameOverCount}`);
console.log(`Elapsed: ${elapsed}s`);
const allClear = uniqueViolations.length === 0 && result.errors.length === 0 && freqWarnings.length === 0;
console.log(`Result: ${allClear ? 'ALL CLEAR ✓' : 'ISSUES FOUND'}`);
console.log('(engine-integrity check — バランス判断にはプレイ実機確認が必要)');
