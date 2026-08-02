#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  MQ業界記録(state.mqRecord) スタート値候補 軌道計測スクリプト
//
//  ■ 目的
//    state.mqRecord のスタート値候補(86/88/90/92/94/96/98/100)を、シングル/タッグ
//    別々に評価するため、全経路(プレイヤー通常興行/AI興行/PPV/天頂戦/ジュニア/
//    春タッグ/秋勝ち残り/イベント戦)の全試合について最終MQ>=80の試合を実測する。
//
//  ■ test/auto-sim.js との違い
//    - src/ は一切変更しない。test/auto-sim.js も変更しない(このファイルは完全に
//      新規・独立したスクリプト。ループ構造は auto-sim.js を参考に再構成した)。
//    - auto-sim.js は「対抗戦」(pendingEvent.type==='war') と PPV(非天頂戦シーズン)
//      の実際の試合実行を行わない(UIが処理する前提でスキップされる/サンプリングのみ)。
//      本スクリプトはこの2経路についてのみ、production の関数(Engine.event.*,
//      Engine.ppv.preparePPVDay/applyPPVResults)をapp.jsの呼び出し順序に倣って
//      自前で駆動し、実際に Engine.mq.updateRecord まで到達させる。
//    - 旧 pendingEvent.type==='summit' (D-4 単独頂上決戦) はPPV内へ統合済み。
//      現行ゲームでは生成せず、旧セーブに残る予約もロード時に解除する。
//
//  ■ 計測方法
//    Engine.mq.updateRecord をフックし、production の判定(state.mqRecordの実際の
//    更新)には一切手を加えず、渡された matchResult.mq が80以上の場合のみ
//    {seed, season, week, stage, matchType, mq} を記録する。
//    候補値ごとの記録更新シミュレーションは、収集済みデータに対する後処理
//    (このスクリプト内)で行う。1回のシミュレーションで全候補値を評価できる。
//
//  Usage: node test/mq-record-trajectory.js [seed1,seed2,...] [seasons]
//  Example: node test/mq-record-trajectory.js 42,7919,15838,23757,31676 40
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

const argv = process.argv.slice(2);
const DEFAULT_SEEDS = [42, 7919, 15838, 23757, 31676];
const SEEDS = argv[0] ? argv[0].split(',').map(Number) : DEFAULT_SEEDS;
const SEASONS = argv[1] ? parseInt(argv[1], 10) : 40;
const CANDIDATES = [86, 88, 90, 92, 94, 96, 98, 100];
const SEASONS_PER_DECADE = 10;

global.window = { IS_TRIAL: false };

// ── ソース読み込み(auto-sim.js と同じグローバル展開方式) ──
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
loadAsGlobal('coach-lines.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('flag-dialogue.js');
loadAsGlobal('factions.js');
loadAsGlobal('draft-negotiation.js');

if (typeof Engine === 'undefined' || typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: Engine / ALL_CHARS が読み込めませんでした');
  process.exit(1);
}

// ── 非match経路の Math.random 呼び出しも再現可能にするため seed 化 ──
// (auto-sim.js と同じ流儀。シードを跨ぐたびに再初期化する)
let legacyRandomState = 1;
function seedLegacyRandom(seed) { legacyRandomState = seed >>> 0; }
Math.random = function seededLegacyRandom() {
  legacyRandomState = (Math.imul(legacyRandomState, 1664525) + 1013904223) >>> 0;
  return legacyRandomState / 0x100000000;
};

// ══════════════════════════════════════════════════════════════════════════════
//  MQレコード計測フック
// ══════════════════════════════════════════════════════════════════════════════
if (!Engine.mq || typeof Engine.mq.updateRecord !== 'function') {
  console.error('ERROR: Engine.mq.updateRecord が見つかりません');
  process.exit(1);
}

const samples = []; // { seed, season, week, stage, matchType, mq }
let currentSeed = 0;

function classifyMatchType(matchResult, metadata) {
  if (matchResult && (matchResult.matchType === 'tag' || (matchResult.mqInventory && matchResult.mqInventory.matchType === 'tag'))) {
    return 'tag';
  }
  const ids = ((metadata && metadata.holderIds) || []).filter(id => id != null);
  const uniq = [...new Set(ids)];
  if (uniq.length >= 4) return 'tag';
  return 'singles';
}

const _origUpdateRecord = Engine.mq.updateRecord;
Engine.mq.updateRecord = function(state, matchResult, metadata) {
  // production の挙動(state.mqRecordが実際に更新されるか)には一切影響を与えない。
  const result = _origUpdateRecord.call(this, state, matchResult, metadata);
  const mq = Number(matchResult && matchResult.mq);
  if (Number.isFinite(mq) && mq >= 80) {
    samples.push({
      seed: currentSeed,
      season: (metadata && metadata.season != null) ? metadata.season : (state ? state.season : null),
      week: (metadata && metadata.week != null) ? metadata.week : (state ? state.week : null),
      stage: (metadata && metadata.stage) || null,
      matchType: classifyMatchType(matchResult, metadata),
      mq,
    });
  }
  return result;
};

// ══════════════════════════════════════════════════════════════════════════════
//  ゲーム進行ヘルパー(test/auto-sim.js から流用・簡略化。バランス計測用の
//  プローブ類は全て削除し、進行に必要なロジックのみ残した)
// ══════════════════════════════════════════════════════════════════════════════

function initGame(seed) {
  let G = Engine.createInitialState(seed, true); // skipDraft=true
  return { ...G, debugLog: G.debugLog || [] };
}

// 興行カード自動編成(auto-sim.js と同一ロジック)
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;

  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined'
    ? (VENUES[venueIdx] || VENUES[0]).maxMatches
    : 4;
  const isSpecial = G.week % 12 === 0;
  const effectiveMax = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);

  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }

  // タッグマッチ挿入(8興行に1回、4人以上余っている場合)
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
          const roster2 = G.roster || [];
          const hasRental = [mainMatch.left, mainMatch.right].some(id => roster2.find(c => c.id === id)?.isRental);
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

  const playerFn = (candidateId, round, currentBid) => {
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

// ── PPV(非天頂戦シーズン)自動処理 ──
// auto-sim.js はここを「サンプリングのみ・状態には反映しない」で済ませているため、
// 本スクリプトでは app.js (initPPVShow → ppvSkipAll → finalizePPV) の呼び出し順序を
// 再現し、実際に Engine.ppv.applyPPVResults まで到達させる(mqRecordの正規経路)。
function autoHandlePPVEntry(G) {
  if (G.weekPhase !== 'ppvEntry') return G;
  const rankings = G.rankings || [];
  const ppvEntries = {};
  RIVAL_ORGS.forEach(org => {
    const orgRank = rankings.find(r => r.orgId === org.id);
    const slots = Engine.ppv.getSlotCount(orgRank ? orgRank.rank : 4);
    const pre = (G._ppvAIEntries || {})[org.id];
    const aiData = G.aiOrgs[org.id];
    ppvEntries[org.id] = (pre && pre.length) ? pre : (aiData ? Engine.ppv.getAIEntries(aiData, slots) : []);
  });
  const pSlots = Engine.ppv.getSlotCount(Engine.ranking.getPlayerRank(rankings));
  const champId = G.titles?.world?.championId;
  const healthy = (G.roster || []).filter(f => !f.injury && !f.isRental);
  const champ = healthy.find(f => f.id === champId);
  const rest = healthy.filter(f => !champ || f.id !== champ.id)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const playerEntries = (champ ? [champ, ...rest] : rest).slice(0, pSlots).map(f => ({ ...f }));
  if (playerEntries.length > 0) {
    ppvEntries.player = playerEntries;
    return { ...G, ppvEntries, ppvPhase: 'locked', _ppvAIEntries: undefined };
  }
  return { ...G, ppvPhase: 'tv' };
}

function autoHandlePPVShow(G) {
  if (G.weekPhase !== 'ppvShow') return G;
  const ppvDay = Engine.ppv.preparePPVDay(G);
  if (!ppvDay.card || ppvDay.card.length === 0) {
    return { ...G, ppvPhase: null, weekPhase: 'manage' };
  }
  const results = ppvDay.card.map((match, idx) => {
    const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
    return Engine.ppv.simulatePPVMatch(match.left, match.right, matchRng);
  });
  const applied = Engine.ppv.applyPPVResults(G, ppvDay.card, results, ppvDay.summitPair);
  return { ...applied.state, ppvPhase: null, weekPhase: 'manage' };
}

function autoHandlePPVTV(G) {
  // TVモード(プレイヤー未参加)は production でも Engine.mq.updateRecord に
  // 到達しない(simulateTVResultsはmqRecordを更新しない)ため、状態遷移のみ行う。
  if (G.weekPhase !== 'ppvTV') return G;
  return { ...G, ppvPhase: null, weekPhase: 'manage' };
}

// ── 対抗戦(pendingEvent.type==='war') 自動処理 ──
// auto-sim.js には存在しない自動化(既存auto-simはpendingEventを無視して放置する)。
// app.js App.warSkipAll → App.finalizeWar の呼び出し順序を再現する。
// 旧 pendingEvent.type==='summit' (D-4) は現行ゲームで生成しないため対象外。
function autoHandlePendingWarEvent(G) {
  const ev = G.pendingEvent;
  if (!ev || ev.type !== 'war') return G;
  const card = Engine.event.makeWarCard(G, ev.opponentOrgId);
  if (!card || card.length === 0) {
    return { ...G, pendingEvent: null, weekPhase: 'manage' };
  }
  const warRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xE7A2));
  const warResult = Engine.event.resolveWar(warRng, G, card);
  let s = G;
  warResult.results.forEach(r => {
    // app.js App.finalizeWar と同じ呼び出し形(matchResultではなく{mq}のみ渡す)
    s = Engine.mq.updateRecord(s, { mq: r.mq }, {
      holderIds: [r.playerFighter.id, r.aiFighter.id],
      orgId: null,
      stage: 'event',
    }).state;
  });
  const outcome = Engine.event.applyWarOutcome(s, warResult.playerWins, warResult.aiWins, ev.opponentOrgId);
  return { ...outcome.state, weekPhase: 'manage' };
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

// ══════════════════════════════════════════════════════════════════════════════
//  シミュレーション本体
// ══════════════════════════════════════════════════════════════════════════════

function runSeed(seed, seasons) {
  currentSeed = seed;
  seedLegacyRandom(seed);
  let G = initGame(seed);
  let simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
  let completed = 0;
  let iter = 0;
  const MAX_ITER = seasons * 60;

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        seed = (seed * 1103515245 + 12345) | 0;
        currentSeed = seed;
        seedLegacyRandom(seed);
        G = initGame(seed);
        simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
        continue;
      }

      // ── 特殊weekPhaseの即座処理(UIが処理するフェーズをバイパス) ──
      if (G.ppvTournament?.phase === 'entry') {
        G = Engine.ppvTournament.confirmPlayerEntries(G, Engine.ppvTournament.suggestPlayerEntries(G));
      }
      if (G.weekPhase === 'ppvEntry') {
        G = autoHandlePPVEntry(G);
      }
      if (G.weekPhase === 'ppvShow') {
        G = autoHandlePPVShow(G);
      }
      if (G.weekPhase === 'ppvTV') {
        G = autoHandlePPVTV(G);
      }
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
      // 春のタッグリーグ Week11: プレイヤーチーム編成の自動化
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
      // 対抗戦(war): production ではUIが処理するが、本スクリプトでは自動解決する
      if (G.weekPhase === 'event') {
        G = autoHandlePendingWarEvent(G);
      }
      if (G.weekPhase === 'transfer' || G.weekPhase === 'scoutEvent') {
        if (G.weekPhase === 'scoutEvent') {
          G = autoHandleScoutEvent(G, simRng);
        }
      }
      if (G.weekPhase === 'contractNegotiation') {
        G = autoHandleContractNegotiation(G, simRng);
      }

      // ── 興行週: カード自動編成→executeShow ──
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
          if (showResult && !showResult.error) {
            G = showResult.state;
          }
        }
      }

      // ── transientイベント消化 ──
      G = autoHandleChoiceEvent(G, simRng);
      G = autoHandleLargeEvent(G, simRng);
      G = clearTransients(G);

      // ── tickWeek(週次パイプライン) ──
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);
      if (G.debugLog && G.debugLog.length > 0) G = { ...G, debugLog: [] };

      // ── advanceWeek(次の週へ) ──
      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };

      // 秋4団体勝ち残り対抗戦: ライブセッション駆動(auto-sim.jsと同じ)
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
        if (G.autumnWar?.session?.phase === 'complete') {
          const autumnResult = Engine.autumnWar.getProgress(G);
          const appliedAutumn = Engine.autumnWar.apply(G, autumnResult);
          const { _pendingAutumnWarReplay: _awPending, ...autumnClean } = appliedAutumn.state;
          const { session: _awSession, ...autumnWarClean } = autumnClean.autumnWar || {};
          G = { ...autumnClean, autumnWar: autumnWarClean, gameLog: [] };
        }
      }

      // auto-simには引き留めUIがないため、検出された引退候補をその場で全て確定
      if (G.pendingRetirements && G.pendingRetirements.length > 0) {
        const confirmed = G.pendingRetirements.map(r => r.fighter);
        const commitRes = Engine.retirement.commitRetirements(G, confirmed);
        const { pendingRetirements: _drop, ...rest } = commitRes.state;
        G = rest;
      }

      G = Engine.validateGameState(G);
      if (G.debugLog && G.debugLog.length > 0) G = { ...G, debugLog: [] };

      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
      }
    } catch (e) {
      seed = (seed * 1103515245 + 12345) | 0;
      currentSeed = seed;
      seedLegacyRandom(seed);
      try {
        G = initGame(seed);
        simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
      } catch (e2) {
        console.error(`[FATAL] seed ${seed} 再初期化失敗: ${e2.message}`);
        break;
      }
    }
  }

  if (iter >= MAX_ITER) {
    console.error(`[WARN] seed ${seed}: MAX_ITER (${MAX_ITER}) に到達。目標シーズン数に届いていない可能性`);
  }
  return completed;
}

// ══════════════════════════════════════════════════════════════════════════════
//  実行
// ══════════════════════════════════════════════════════════════════════════════

console.log('=== MQ業界記録 スタート値候補 軌道計測 ===');
console.log(`Seeds: ${SEEDS.join(', ')}`);
console.log(`Seasons per seed: ${SEASONS}`);
console.log('--------------------------------------');

const startTime = Date.now();
const perSeedSampleIndex = []; // [{seed, startIdx, endIdx}]
for (const seed of SEEDS) {
  const startIdx = samples.length;
  const t0 = Date.now();
  const completedSeasons = runSeed(seed, SEASONS);
  const endIdx = samples.length;
  perSeedSampleIndex.push({ seed, startIdx, endIdx });
  console.log(`  seed ${seed}: ${completedSeasons}/${SEASONS} seasons, ${endIdx - startIdx} samples(mq>=80), ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
console.log(`Total elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
console.log(`Total samples (mq>=80): ${samples.length}`);

// ── stage別内訳(参考) ──
const stageCounts = {};
samples.forEach(s => { stageCounts[s.stage] = (stageCounts[s.stage] || 0) + 1; });
console.log('\n=== stage別サンプル数(mq>=80) ===');
Object.entries(stageCounts).sort((a, b) => b[1] - a[1]).forEach(([stage, n]) => {
  console.log(`  ${String(stage).padEnd(10)}: ${n}`);
});

// ══════════════════════════════════════════════════════════════════════════════
//  候補値ごとの記録更新シミュレーション(後処理・純粋な集計。ゲーム状態には無関係)
// ══════════════════════════════════════════════════════════════════════════════

function simulateRecordTrajectory(seedSamples, startValue) {
  // seedSamples は season→week 順(=発生順)にソート済みを前提とする
  let current = startValue;
  let firstUpdateSeason = null;
  const updatesPerDecade = [0, 0, 0, 0]; // S1-10 / S11-20 / S21-30 / S31-40
  let updateCount = 0;
  for (const s of seedSamples) {
    if (s.mq > current) {
      current = s.mq;
      updateCount++;
      if (firstUpdateSeason === null) firstUpdateSeason = s.season;
      const decadeIdx = Math.min(3, Math.floor((s.season - 1) / SEASONS_PER_DECADE));
      if (decadeIdx >= 0) updatesPerDecade[decadeIdx]++;
    }
  }
  return { finalValue: current, firstUpdateSeason, updatesPerDecade, updateCount };
}

function median(arr) {
  const nums = arr.filter(v => v != null).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

const matchTypes = ['singles', 'tag'];
const report = {}; // report[matchType][candidate] = { perSeed: [...], median, avgUpdatesPerDecade }

for (const matchType of matchTypes) {
  report[matchType] = {};
  for (const candidate of CANDIDATES) {
    const perSeed = [];
    for (const { seed, startIdx, endIdx } of perSeedSampleIndex) {
      const seedSamples = samples.slice(startIdx, endIdx).filter(s => s.matchType === matchType);
      const traj = simulateRecordTrajectory(seedSamples, candidate);
      perSeed.push({ seed, ...traj });
    }
    const firstUpdateSeasons = perSeed.map(p => p.firstUpdateSeason);
    const avgUpdatesPerDecade = [0, 1, 2, 3].map(i =>
      perSeed.reduce((sum, p) => sum + p.updatesPerDecade[i], 0) / perSeed.length);
    report[matchType][candidate] = {
      perSeed,
      medianFirstUpdateSeason: median(firstUpdateSeasons),
      avgUpdatesPerDecade,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  レポート出力
// ══════════════════════════════════════════════════════════════════════════════

function fmtSeason(v) { return v == null ? '—(40シーズン内更新なし)' : `S${v}`; }

let out = '';
out += '# MQ業界記録 スタート値候補 軌道レポート\n\n';
out += `生成日時: ${new Date().toISOString()}\n\n`;
out += `## 実行条件\n\n`;
out += `- シード: ${SEEDS.join(', ')}\n`;
out += `- シーズン数/シード: ${SEASONS}\n`;
out += `- 候補値: ${CANDIDATES.join(', ')}\n`;
out += `- 対象経路: プレイヤー通常興行(normal) / AI興行(ai) / PPV(ppv) / 天頂戦(tenchosen) / ジュニア(junior) / 春タッグ(springTag) / 秋勝ち残り(autumnWar) / イベント戦=対抗戦(event)\n`;
out += `- 除外: 旧 pendingEvent.type==='summit'(D-4 単独頂上決戦)はPPV内へ統合済みで、現行ゲームでは生成しない\n`;
out += `- 総サンプル数(mq>=80): ${samples.length}\n\n`;

out += `## stage別サンプル数(mq>=80)\n\n`;
out += '| stage | 件数 |\n|---|---|\n';
Object.entries(stageCounts).sort((a, b) => b[1] - a[1]).forEach(([stage, n]) => {
  out += `| ${stage} | ${n} |\n`;
});
out += '\n';

for (const matchType of matchTypes) {
  out += `## ${matchType === 'singles' ? 'シングル' : 'タッグ'} (matchType=${matchType})\n\n`;

  out += '### 初更新シーズン(候補値ごと)\n\n';
  out += '| 候補値 | ' + SEEDS.map(s => `seed${s}`).join(' | ') + ' | 中央値 |\n';
  out += '|---|' + SEEDS.map(() => '---').join('|') + '|---|\n';
  for (const candidate of CANDIDATES) {
    const r = report[matchType][candidate];
    const row = r.perSeed.map(p => fmtSeason(p.firstUpdateSeason));
    out += `| ${candidate} | ${row.join(' | ')} | ${fmtSeason(r.medianFirstUpdateSeason)} |\n`;
  }
  out += '\n';

  out += '### 更新回数(10年区間別平均・5シード平均)\n\n';
  out += '| 候補値 | S1-10 | S11-20 | S21-30 | S31-40 |\n|---|---|---|---|---|\n';
  for (const candidate of CANDIDATES) {
    const r = report[matchType][candidate];
    out += `| ${candidate} | ${r.avgUpdatesPerDecade.map(v => v.toFixed(2)).join(' | ')} |\n`;
  }
  out += '\n';

  out += '### 最終到達記録値(シードごと・40シーズン終了時点)\n\n';
  out += '| 候補値 | ' + SEEDS.map(s => `seed${s}`).join(' | ') + ' |\n';
  out += '|---|' + SEEDS.map(() => '---').join('|') + '|\n';
  for (const candidate of CANDIDATES) {
    const r = report[matchType][candidate];
    out += `| ${candidate} | ${r.perSeed.map(p => p.finalValue).join(' | ')} |\n`;
  }
  out += '\n';
}

out += '## 生データ要約\n\n';
out += '各シード・各stageの mq>=80 サンプル件数:\n\n';
out += '| seed | ' + Object.keys(stageCounts).join(' | ') + ' | 合計 |\n';
out += '|---|' + Object.keys(stageCounts).map(() => '---').join('|') + '|---|\n';
for (const { seed, startIdx, endIdx } of perSeedSampleIndex) {
  const seedSamples = samples.slice(startIdx, endIdx);
  const counts = {};
  Object.keys(stageCounts).forEach(st => { counts[st] = 0; });
  seedSamples.forEach(s => { counts[s.stage] = (counts[s.stage] || 0) + 1; });
  out += `| ${seed} | ${Object.keys(stageCounts).map(st => counts[st]).join(' | ')} | ${seedSamples.length} |\n`;
}
out += '\n';

const reportPath = path.join(__dirname, '..', 'docs', 'mq-record-trajectory-report.md');
fs.writeFileSync(reportPath, out, 'utf-8');
console.log(`\nレポートを書き出しました: ${reportPath}`);

// コンソールにも主要テーブルを出力
console.log('\n' + out);
