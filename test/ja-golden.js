#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — JAゴールデンテスト (Stage A P1 / I3)
//
//  ■ 目的
//    英語対応の下ごしらえ(i18n化・断片連結の解消など)を進める過程で、
//    「日本語版の出力が1文字も変わっていない」ことを機械的に保証するスナップショット。
//    docs/i18n-stage-a-p1-design-v0.1.md D5/I3。
//
//  ■ 何を採取するか
//    固定シード(42)・skipDraft=trueでゲームを初期化し、20シーズン分を
//    test/auto-sim.js と同じ作法(vm.runInThisContextでソースをグローバル展開・
//    Engine.rng.create/deriveでシードを一元管理)でヘッドレス進行させながら、
//    エンジンから決定的に得られる生成テキストを毎週集める:
//      - 週刊新聞 (G.weeklyNewspaper: 一面+サブ記事の見出し・本文)
//      - ティッカー (Engine.news.generateTicker — app.js _refreshTicker と同じ導出)
//      - 興行の決着文 (Engine.formatFinish(finType, finMove) — 全試合)
//      - 興行のフレーバーイベント文 (executeShow の戻り値 events配列)
//      - 引退演出のセリフ選択結果 (Engine.retirement.selectLine の line/summary/
//        championWorryLine)
//      - デバッグログに積まれたメッセージ(不変条件違反時の文面)
//    turn単位の戦闘ログ(match-engine.js log配列)は量が膨大かつ観戦専用の内部表現
//    なので対象外(UIのDOM文字列同様、P1のスコープ外 — 設計書D5注記のとおり)。
//
//  ■ 使い方
//    node test/ja-golden.js            # 基準ファイルと照合。不一致ならexit 1
//    node test/ja-golden.js --update   # 現在の出力を新しい基準として保存
//
//  ■ 運用ルール(I3)
//    P1適用「前」に一度 --update で基準を採取し、P1適用「後」に無引数で照合する。
//    この順序を守ることで「i18n化そのものが日本語版を壊していない」ことが言える。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

const UPDATE = process.argv.includes('--update');
const SEED = 42;
const SEASONS = 20;
const MAX_ITER = SEASONS * 60; // auto-sim.jsと同じ安全弁(1シーズン≒52+4週)

const baselinePath = path.join(__dirname, 'fixtures', 'ja-golden-baseline.json');

// ── Step 1: ソースコードをグローバルスコープで実行(test/auto-sim.js と同じ作法) ──
global.window = { IS_TRIAL: false };

// auto-sim.js 同様、Math.random に依存する残存経路も固定シードで再現可能にする。
let legacyRandomState = SEED >>> 0;
Math.random = function seededLegacyRandom() {
  legacyRandomState = (Math.imul(legacyRandomState, 1664525) + 1013904223) >>> 0;
  return legacyRandomState / 0x100000000;
};

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

// ブラウザと同じ読み込み順序(auto-sim.js と同一。i18n.js/UI層は対象外なので読み込まない)
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

// ── Step 2: テキスト収集 ──
const golden = [];
function pushText(tag, text) {
  if (text == null) return;
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (!s) return;
  golden.push(`[${tag}] ${s}`);
}

function collectNewspaper(G) {
  const np = G.weeklyNewspaper;
  if (!np) return;
  const tag = `S${G.season}W${G.week}/newspaper`;
  if (np.topStory) {
    pushText(`${tag}/top/headline`, np.topStory.headline);
    pushText(`${tag}/top/body`, np.topStory.body);
  }
  (np.subStories || []).forEach((st, i) => {
    pushText(`${tag}/sub${i}/headline`, st && st.headline);
    pushText(`${tag}/sub${i}/body`, st && st.body);
  });
}

function collectTicker(G) {
  if (G.offSeason) return;
  const tag = `S${G.season}W${G.week}/ticker`;
  // app.js App._refreshTicker() と全く同じ導出(0xBEEF)。読み取り専用(Gには書き戻さない)。
  const tickerRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBEEF));
  const items = Engine.news.generateTicker(tickerRng, G) || [];
  items.forEach((text, i) => pushText(`${tag}${i}`, text));
}

function collectShowResult(G, showResult) {
  if (!showResult || showResult.error) return;
  const tag = `S${G.season}W${G.week}/show`;
  (showResult.results || []).forEach((r, i) => {
    if (!r || !r.finType) return;
    pushText(`${tag}/match${i}/finish`, Engine.formatFinish(r.finType, r.finMove));
  });
  (showResult.events || []).forEach((e, i) => pushText(`${tag}/event${i}`, e));
  const pending = showResult.state && showResult.state._pendingInjuryRetirements;
  (pending || []).forEach((ir, i) => {
    pushText(`${tag}/retirement${i}/line`, ir && ir.line);
    pushText(`${tag}/retirement${i}/summary`, ir && ir.summary);
    pushText(`${tag}/retirement${i}/championWorry`, ir && ir.championWorryLine);
  });
}

let debugLogSeen = 0;
function collectDebugLog(G) {
  const log = Array.isArray(G.debugLog) ? G.debugLog : [];
  for (let i = debugLogSeen; i < log.length; i++) {
    pushText(`S${G.season}W${G.week}/debugLog${i}`, log[i] && log[i].message);
  }
  debugLogSeen = log.length;
}

// ── Step 3: シミュレーション本体(test/auto-sim.js の runSimulation を
//    「進行に必要な分岐だけ」に絞って再構成したもの。統計プローブ・計測用の
//    monkey-patchはすべて削り、ゲームが特定フェーズで止まらないための
//    状態遷移コードだけを残す。関数の中身はauto-sim.jsと同一(コピー)) ──

function initGame(seed) {
  let G = Engine.createInitialState(seed, true); // skipDraft=true
  G = { ...G, debugLog: G.debugLog || [] };
  return G;
}

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
          const roster2 = G.roster || [];
          const hasRental = [mainMatch.left, mainMatch.right].some(id => roster2.find(c => c.id === id)?.isRental);
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

function autoHandleChoiceEvent(G, simRng) {
  if (!G._pendingChoiceEvent) return G;
  const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveChoice === 'function') {
    const result = Engine.events.resolveChoice(G, choice);
    if (result && result.state) return result.state;
  }
  const { _pendingChoiceEvent: _drop, ...clean } = G;
  return clean;
}

function autoHandleLargeEvent(G, simRng) {
  if (!G._pendingLargeEvent) return G;
  if (typeof Engine.events !== 'undefined' && typeof Engine.events.resolveLargeEvent === 'function') {
    const result = Engine.events.resolveLargeEvent(G, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (result && result.state) return result.state;
  }
  const { _pendingLargeEvent: _drop, ...clean } = G;
  return clean;
}

function autoHandleFactionEvent(G, simRng) {
  if (!G._pendingFactionEvent) return G;
  const fe = G._pendingFactionEvent;
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA90));
  let s = G;
  try {
    if (fe.eventId === 'F01') {
      const choiceId = ['A', 'B', 'C'][Math.floor(Engine.rng.float(simRng) * 3)];
      const r = Engine.factions.applyF01Choice(s, fe.payload, choiceId, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02') {
      const choiceId = ['A', 'B', 'C'][Math.floor(Engine.rng.float(simRng) * 3)];
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
    } else if (['F04', 'F05', 'F06', 'F07', 'F08'].includes(fe.eventId)) {
      const choiceId = ['A', 'B', 'C'][Math.floor(Engine.rng.float(simRng) * 3)];
      const fn = Engine.factions[`apply${fe.eventId}Choice`];
      if (typeof fn === 'function') {
        const r = fn.call(Engine.factions, s, fe.payload, choiceId, rng);
        if (r && r.state) s = r.state;
      }
    } else if (['COMMON_1', 'COMMON_5', 'COMMON_7'].includes(fe.eventId)) {
      const choiceId = ['A', 'B', 'C'][Math.floor(Engine.rng.float(simRng) * 3)];
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
  } catch (_e) { /* auto-sim.js と同様: 設計意図としてはここに到達しない */ }
  const { _pendingFactionEvent: _drop, ...clean } = s;
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
    if (neg.attitude === 'decline') {
      choiceIdx = roll < 0.3 ? 0 : (roll < 0.8 ? 1 : 2);
    } else if (neg.attitude === 'decline_voluntary') {
      choiceIdx = roll < 0.3 ? 0 : 1;
    } else if (neg.attitude === 'raise') {
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      if (roll < 0.6) { choiceIdx = 0; }
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else { choiceIdx = 2; }
    }
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = result.state;
    if (result.result && result.result.escalated) {
      const escNeg = { ...neg, attitude: 'transfer' };
      const escResult = Engine.contract.resolveNegotiation(resolveRng, state, escNeg, 0);
      state = escResult.state;
    }
  }
  const { pendingContractNegotiations: _drop1, _contractAutoRenewed: _drop2, ...clean } = state;
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
    intensive: false, intensiveWeeks: 0, careerStage: 'active',
  });

  for (const r of draftResult.results) {
    const clean = { ...r.candidate };
    delete clean._notion; delete clean._estimate; delete clean._isSeed; delete clean._hasCompetition;

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
      const { [k]: _drop, ...clean } = s;
      s = clean;
    }
  }
  return s;
}

// ── Step 4: メインループ(auto-sim.js runSimulationの進行ロジックを流用。
//    統計収集は行わず、代わりに毎週テキストを収集する) ──
function runSimulation() {
  let currentSeed = SEED;
  let G = initGame(currentSeed);
  let simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
  let completed = 0;
  let iter = 0;

  while (completed < SEASONS && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        currentSeed = (currentSeed * 1103515245 + 12345) | 0;
        G = initGame(currentSeed);
        simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
        continue;
      }

      if (Engine.ppvTournament.isTournamentSeason(G.season) && G.ppvTournament?.phase === 'entry') {
        G = Engine.ppvTournament.confirmPlayerEntries(G, Engine.ppvTournament.suggestPlayerEntries(G));
      }
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
      if (G.springTagPhase === 'entry') {
        const cand = Engine.springTagLeague.getEntryCandidates(G);
        let pick = cand.suggestions && cand.suggestions[0];
        if (!pick && cand.eligible && cand.eligible.length >= 2) {
          const shuffled = [...cand.eligible].sort(() => Engine.rng.float(simRng) - 0.5);
          pick = { f1Id: shuffled[0].id, f2Id: shuffled[1].id };
        }
        if (pick) G = Engine.springTagLeague.confirmPlayerTeam(G, pick.f1Id, pick.f2Id);
      }
      if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
      if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

      const springTagOccupiesThisWeek = G.week === 12 && G.springTagLeague && !G.springTagLeague.cancelled
        && G.springTagLeague.matches && G.springTagLeague.matches.length > 0;
      const autumnWarOccupiesThisWeek = G.week === 36 && G.autumnWar && !G.autumnWar.cancelled && G.autumnWar.champion;
      const tenchosenOccupiesThisWeek = G.week === 48 && G.ppvTournament?.phase === 'done' && G.ppvTournament.season === G.season;
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage'
          && !springTagOccupiesThisWeek && !autumnWarOccupiesThisWeek && !tenchosenOccupiesThisWeek) {
        G = autoSetupShowCard(G, simRng);
        if (G.showCard && G.showCard.length > 0) {
          const showResult = Engine.executeShow(G);
          if (showResult && !showResult.error) {
            collectShowResult(G, showResult);
            G = showResult.state;
          }
        }
      }

      G = autoHandleChoiceEvent(G, simRng);
      G = autoHandleLargeEvent(G, simRng);
      G = clearTransients(G);

      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };
      G = Engine.unifiedTitle.autoConsumePlayerTurn(G);
      collectNewspaper(G);
      collectTicker(G);
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);

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
          const { _pendingAutumnWarReplay: _drop, ...cancelledClean } = cancelledAutumn.state;
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
          const { _pendingAutumnWarReplay: _drop, ...autumnClean } = appliedAutumn.state;
          const { session: _dropSession, ...autumnWarClean } = autumnClean.autumnWar || {};
          G = { ...autumnClean, autumnWar: autumnWarClean, gameLog: [] };
        }
      }

      if (G.pendingRetirements && G.pendingRetirements.length > 0) {
        const confirmed = G.pendingRetirements.map(r => r.fighter);
        const commitRes = Engine.retirement.commitRetirements(G, confirmed);
        const { pendingRetirements: _drop, ...rest } = commitRes.state;
        G = rest;
      }

      G = Engine.validateGameState(G);
      collectDebugLog(G);

      if (!G.offSeason && G.week === 1 && G.season > 1) completed++;
    } catch (e) {
      // auto-sim.js と同じ耐性戦略: 例外時は決定論的に別シードで再初期化して続行する。
      // (fixed seed=42での通常実行ではここに到達しない想定。到達したら診断を出す)
      process.stderr.write(`[ja-golden] iter ${iter} で例外: ${e.message}\n`);
      currentSeed = (currentSeed * 1103515245 + 12345) | 0;
      G = initGame(currentSeed);
      simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
    }
  }

  if (iter >= MAX_ITER) {
    process.stderr.write(`[ja-golden] MAX_ITER (${MAX_ITER}) に到達。無限ループの可能性があります\n`);
  }
}

runSimulation();

// ── Step 5: ハッシュ化・照合 ──
function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

const normalizedText = golden.join('\n');
const hash = sha256(normalizedText);

if (UPDATE) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  const baseline = {
    seed: SEED,
    seasons: SEASONS,
    generatedAt: new Date().toISOString(),
    count: golden.length,
    hash,
    lines: golden,
  };
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n', 'utf8');
  console.log(`[ja-golden] 基準を更新しました: ${baselinePath}`);
  console.log(`[ja-golden] lines=${golden.length} hash=${hash}`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`[ja-golden] 基準ファイルがありません: ${baselinePath}`);
  console.error('[ja-golden] まず `node test/ja-golden.js --update` で基準を採取してください。');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

if (baseline.hash === hash) {
  console.log(`[ja-golden] OK: 基準と完全一致 (lines=${golden.length}, hash=${hash})`);
  process.exit(0);
}

console.error(`[ja-golden] NG: 基準と不一致`);
console.error(`[ja-golden] baseline: lines=${baseline.count} hash=${baseline.hash}`);
console.error(`[ja-golden] current:  lines=${golden.length} hash=${hash}`);

const baseLines = Array.isArray(baseline.lines) ? baseline.lines : [];
const maxLen = Math.max(baseLines.length, golden.length);
let shown = 0;
console.error('[ja-golden] 差分(最初の10件):');
for (let i = 0; i < maxLen && shown < 10; i++) {
  const a = baseLines[i];
  const b = golden[i];
  if (a === b) continue;
  shown++;
  console.error(`  #${i}`);
  console.error(`    baseline: ${a === undefined ? '(なし)' : a}`);
  console.error(`    current : ${b === undefined ? '(なし)' : b}`);
}
if (shown === 0) {
  console.error('  (行ごとの差分は見つかりませんでした — 行順や連結方法が変わった可能性があります)');
}
process.exit(1);
