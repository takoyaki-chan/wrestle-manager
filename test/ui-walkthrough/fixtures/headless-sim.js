'use strict';

// レア画面強制点火カタログ(バグ捜索体制③)のfixture生成用 headless 進行モジュール。
// ループ構造とプレイヤー判断の自動化は test/auto-sim.js の現行ループを流用し、
// 「Nシーズン完走」ではなく「任意のG条件まで進めて止まる」形に一般化したもの。
// ※ test/make-save.js は auto-sim の古いコピーで JT/秋対抗戦/派閥イベントの消化を
//   持っておらず、多季fixtureに未消化の残骸が残る(2026-08-14 天頂戦シナリオで実証)。
//   本モジュールは auto-sim.js 側を正として移植している。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', '..', '..', 'src');

let enginesLoaded = false;
function loadEngines() {
  if (enginesLoaded) return;
  global.window = global.window || { IS_TRIAL: false };
  const files = [
    'victory-lines.js',
    'data.js',
    'management.js',
    'match-engine.js',
    'relationships.js',
    'draft-negotiation.js',
    'factions.js',
  ];
  for (const filename of files) {
    let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
    code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
    code = code.replace(/^(const|let) /gm, 'var ');
    new vm.Script(code, { filename }).runInThisContext();
  }
  enginesLoaded = true;
}

function expandRosterForTest(G) {
  // auto-sim版はTARGET14/cap18だが、UI用fixtureは12で止める。
  // 実UIのロード後はcheckRosterCapMilestonesがorgPop連動でキャップを再計算し、
  // headlessの人工orgPop床(80)が外れて自然値へ落ちるとキャップは12まで縮む。
  // 13名以上のfixtureは毎週validateGameState違反(D1)を吐く(2026-08-14実証)
  const TARGET = 12;
  let s = { ...G, rosterCap: 12, funds: Math.max(G.funds, 8000) };
  const fa = s.freeAgents || [];
  const ownCount = s.roster.filter(c => !c.isRental).length;
  if (ownCount < TARGET && fa.length > 0) {
    const sorted = [...fa].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const toSign = sorted.slice(0, TARGET - ownCount);
    let newRoster = [...s.roster];
    let newFA = [...fa];
    for (const f of toSign) {
      newRoster.push({
        ...f,
        condition: f.condition ?? 80,
        schedule: f.schedule || 'balance',
        wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
        injury: null,
        seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
        intensive: false, intensiveWeeks: 0,
      });
      newFA = newFA.filter(c => c.id !== f.id);
    }
    s = { ...s, roster: newRoster, freeAgents: newFA };
  }
  return s;
}

function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = (VENUES[venueIdx] || VENUES[0]).maxMatches;
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
      const tm = card.find(m => m.left === champId || m.right === champId);
      if (tm) tm.isTitle = true;
    }
  }
  return { ...G, showCard: card, showVenue: venueIdx };
}

function autoHandleChoiceEvent(G, simRng) {
  if (!G._pendingChoiceEvent) return G;
  const choice = Engine.rng.float(simRng) < 0.5 ? 'A' : 'B';
  if (Engine.events?.resolveChoice) {
    const result = Engine.events.resolveChoice(G, choice);
    if (result?.state) return result.state;
  }
  const { _pendingChoiceEvent: _, ...clean } = G;
  return clean;
}

function autoHandleLargeEvent(G, simRng) {
  if (!G._pendingLargeEvent) return G;
  if (Engine.events?.resolveLargeEvent) {
    const result = Engine.events.resolveLargeEvent(G, Engine.rng.float(simRng) < 0.5 ? 'A' : 'B');
    if (result?.state) return result.state;
  }
  const { _pendingLargeEvent: _, ...clean } = G;
  return clean;
}

// auto-sim.js の autoHandleFactionEvent から計測(census)を除いて移植
function autoHandleFactionEvent(G, simRng) {
  if (!G._pendingFactionEvent) return G;
  const fe = G._pendingFactionEvent;
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA90));
  let s = G;
  try {
    if (fe.eventId === 'F01' || fe.eventId === 'F02') {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const fn = fe.eventId === 'F01' ? Engine.factions.applyF01Choice : Engine.factions.applyF02Choice;
      const r = fn.call(Engine.factions, s, fe.payload, choiceId, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F03') {
      const r = Engine.factions.applyF03Result(s, fe.payload, rng);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F05H') {
      const r = Engine.factions.applyF05HResult(s, fe.payload);
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'F02_RESOLUTION' || fe.eventId === 'F02_ENDLESS' || fe.eventId === 'F02_IGNITE' || fe.eventId === 'F02_PEACE') {
      const map = {
        F02_RESOLUTION: 'applyF02ResolutionResult',
        F02_ENDLESS: 'applyF02EndlessResult',
        F02_IGNITE: 'applyF02IgniteResult',
        F02_PEACE: 'applyF02PeaceResult',
      };
      const r = Engine.factions[map[fe.eventId]](s, fe.payload, rng);
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
    const roll = Engine.rng.float(simRng);
    let choiceIdx, subChoice;
    if (neg.attitude === 'raise') {
      choiceIdx = roll < 0.7 ? 0 : (roll < 0.9 ? 1 : 2);
    } else {
      if (roll < 0.6) choiceIdx = 0;
      else if (roll < 0.8) { choiceIdx = 1; subChoice = 'retain'; }
      else choiceIdx = 2;
    }
    const resolveRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId));
    const result = Engine.contract.resolveNegotiation(resolveRng, state, neg, choiceIdx, subChoice);
    state = result.state;
    if (result.result.escalated) {
      const escResult = Engine.contract.resolveNegotiation(resolveRng, state, { ...neg, attitude: 'transfer' }, 0);
      state = escResult.state;
    }
  }
  const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = state;
  return clean;
}

function autoHandleScoutEvent(G, simRng) {
  if (G.weekPhase !== 'scoutEvent') return G;
  const ownCount = G.roster.filter(c => !c.isRental).length;
  if (ownCount >= (G.rosterCap || 18)) return G;
  const fa = G.freeAgents || [];
  if (fa.length === 0) return G;
  const shuffled = [...fa].sort(() => Engine.rng.float(simRng) - 0.5);
  const maxAcquire = ownCount < 12 ? 3 : 2;
  const toSign = shuffled.slice(0, Math.min(maxAcquire, (G.rosterCap || 18) - ownCount));
  let newRoster = [...G.roster];
  let newFA = [...fa];
  for (const f of toSign) {
    const cost = f.assessedValue || 100;
    if (ownCount >= 12 && G.funds - cost < 0) continue;
    newRoster.push({ ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance', wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0, injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 }, intensive: false, intensiveWeeks: 0 });
    newFA = newFA.filter(c => c.id !== f.id);
    G = { ...G, funds: G.funds - cost };
  }
  return { ...G, roster: newRoster, freeAgents: newFA };
}

// auto-sim.js の TRANSIENT_KEYS(現行版) と同一
const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
  '_pendingFactionEvent', '_pendingF08Directive',
  '_shownF08PreMatchIds', '_shownF08PostMatchIds', '_pendingF08Aftermath',
];
function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) { const { [k]: _, ...clean } = s; s = clean; }
  }
  return s;
}

// until(G) が true を返す週の頭(その週の興行・tickを処理する前)で停止して G を返す。
function advanceUntil({ seed, until, maxWeeks = 600 }) {
  loadEngines();
  let G = expandRosterForTest(Engine.createInitialState(seed, true));
  G = { ...G, debugLog: [], orgPop: Math.max(G.orgPop, 80) };
  const simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));

  for (let iter = 0; iter < maxWeeks; iter++) {
    if (until(G)) return G;
    if (G.weekPhase === 'gameover') {
      throw new Error(`headless進行中にGAME OVER (season=${G.season} week=${G.week})。シードを変えてください`);
    }

    // PPVフェーズバイパス(headlessではUI進行フェーズを飛ばす)
    if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
    if (G.weekPhase === 'ppvShow')  G = { ...G, ppvPhase: 'tv' };
    if (G.weekPhase === 'ppvTV')    G = { ...G, ppvPhase: null };

    // ジュニアトーナメント: エンジンで全試合処理
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

    // 春のタッグリーグ: プレイヤーチーム編成の自動化(サジェスト先頭)
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

    if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
    if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

    // 興行週: カード組→executeShow。大会が枠を占有する週(春タッグW12/秋対抗戦W36/天頂戦W48)は
    // 通常興行を組まない(auto-simと同じガード)
    const springTagOccupies = G.week === 12 && G.springTagLeague && !G.springTagLeague.cancelled
      && G.springTagLeague.matches && G.springTagLeague.matches.length > 0;
    const autumnWarOccupies = G.week === 36 && G.autumnWar && !G.autumnWar.cancelled
      && G.autumnWar.champion;
    const tenchosenOccupies = G.week === 48 && G.ppvTournament?.phase === 'done'
      && G.ppvTournament.season === G.season;
    if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage'
        && !springTagOccupies && !autumnWarOccupies && !tenchosenOccupies) {
      G = autoSetupShowCard(G, simRng);
      if (G.showCard && G.showCard.length > 0) {
        const showResult = Engine.executeShow(G);
        if (showResult && !showResult.error) G = showResult.state;
      }
    }

    G = autoHandleChoiceEvent(G, simRng);
    G = autoHandleLargeEvent(G, simRng);
    G = autoHandleFactionEvent(G, simRng);
    G = clearTransients(G);

    const tickResult = Engine.tickWeek(G);
    G = { ...tickResult.state, gameLog: [], debugLog: [] };
    if (G.orgPop < 80) G = { ...G, orgPop: 80 };
    G = autoHandleFactionEvent(G, simRng);
    G = clearTransients(G);

    const advResult = Engine.advanceWeek(G);
    G = { ...advResult.state, gameLog: [] };

    // 秋対抗戦: UIなしでも本番と同じく1フォールずつ完走させる(auto-simと同じ手順)
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
        const { _pendingAutumnWarReplay: _p, ...clean } = cancelledAutumn.state;
        G = { ...clean, gameLog: [] };
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
      if (G.autumnWar?.session?.phase !== 'complete') {
        throw new Error('秋対抗戦のセッションが20手で完走しませんでした');
      }
      const autumnResult = Engine.autumnWar.getProgress(G);
      const appliedAutumn = Engine.autumnWar.apply(G, autumnResult);
      const { _pendingAutumnWarReplay: _p, ...clean } = appliedAutumn.state;
      const { session: _s, ...autumnWarClean } = clean.autumnWar || {};
      G = { ...clean, autumnWar: autumnWarClean, gameLog: [] };
    }
  }
  throw new Error(`maxWeeks=${maxWeeks} 週進めても停止条件に到達しませんでした`);
}

// validateGameState は違反を console.warn('[WM Debug] ...') で報告する。捕まえて配列で返す。
function collectValidationWarnings(G) {
  loadEngines();
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const text = args.map(String).join(' ');
    if (text.includes('[WM Debug]')) warnings.push(text);
    else originalWarn.apply(console, args);
  };
  try {
    Engine.validateGameState(G);
  } finally {
    console.warn = originalWarn;
  }
  return warnings;
}

function toSaveState(G, note) {
  const saveState = JSON.parse(JSON.stringify(G));
  saveState.roster.forEach(c => { delete c._weekAction; c.intensive = false; });
  for (const k of TRANSIENT_KEYS) delete saveState[k];
  // UIで消化されるはずのフラグの残骸を実プレイ相当へ戻す。
  // pendingAwards は年末表彰のUI消化フラグで、headless進行では消えない。
  // 季中に true のまま残ると実UIの週進行が詰まる(2026-08-14 天頂戦シナリオで実証)
  delete saveState._juniorTournamentSelection;
  delete saveState._pendingAutumnWarReplay;
  saveState.pendingAwards = false;
  // 現行版で生成したセーブであることを明示する(無いとロード時に旧版セーブ扱いされ、
  // 53週カレンダー換算やキャップ再計算がfixtureの値を作り直してしまう)
  saveState._migrated_calendarWeek52_v1 = true;
  saveState._migrated_roster_cap_pop_v2 = true;
  saveState._migrated_roster_cap_away_guest_repair_v1 = true;
  saveState.debugLog = [];
  saveState.gameLog = [];
  saveState._saveVersion = '1.31';
  saveState._saveDate = '2026-01-01T00:00:00.000Z';
  saveState._saveNote = note;
  return saveState;
}

module.exports = { advanceUntil, clearTransients, collectValidationWarnings, loadEngines, toSaveState };
