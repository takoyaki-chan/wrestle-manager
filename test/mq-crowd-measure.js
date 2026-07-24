#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  MQ再設計 P3c 前段計測 — 観客帯×注目度の設計材料
//
//  目的: docs/mq-redesign-proposal-v0.4.md §3.2「観客補正=会場の熱(venueHeat)×
//  試合注目度(engagement)」の閾値・係数を設計するための実測データ収集。
//
//  収集内容:
//    1. 満員率(occupancy = 動員/会場キャパ)の分布 — 全体/シーズン帯別/会場別percentile
//       + 現行の観客熱バンド(CROWD_HEAT_MQ)の各帯に落ちた興行の割合
//    2. カード内スロット別(メイン=index0/セミ=index1/それ以下)の注目度材料
//       — 参加選手の人気(平均/最大)、因縁ありの割合、タイトル戦の割合
//    3. ロスター全体の人気の分布(p10〜p99)
//
//  本スクリプトは test/auto-sim.js のheadless実行方法(vm経由でのsrc読み込み、
//  Engine.createInitialState/executeShow/tickWeek/advanceWeek 等の直接呼び出し、
//  プレイヤー判断のランダム自動化)を参考にしているが、独立した新規ファイルであり
//  test/auto-sim.js 自体は一切変更していない。
//
//  規律:
//    - Math.random()は新規に使わない。乱数はEngine.rng系(Engine.rng.create/derive/float)
//      またはauto-sim.jsと同じ「非決定パスの保険」としての決定的Math.random置換のみ使用
//    - src/ は一切変更しない。ゲーム状態への副作用はauto-sim.jsと同じ自動化ロジックの
//      範囲内(カード編成・選択イベント応答など)にとどめ、それ以外は観測のみ
//
//  Usage: node test/mq-crowd-measure.js [シーズン数=40] [シード...]
//  Example: node test/mq-crowd-measure.js 40 42 7919 15838
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');

// CLI:
//   node test/mq-crowd-measure.js [シーズン数=40] [シード...]      … 従来モード（1プロセスで全シード実行→レポート出力）
//   node test/mq-crowd-measure.js <シーズン数> --seed <n> --out <path.json>
//                                                                    … 1シードのみ実行し、生サンプルをJSONへダンプ（レポートは書かない）
//   node test/mq-crowd-measure.js --merge <path1.json,path2.json,...> --seasons <n>
//                                                                    … 複数のJSONダンプを合算してレポートを書く
const rawArgs = process.argv.slice(2);
const flags = { seasons: null, seed: null, out: null, merge: null };
const positional = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--seed') { flags.seed = parseInt(rawArgs[++i], 10); }
  else if (a === '--out') { flags.out = rawArgs[++i]; }
  else if (a === '--merge') { flags.merge = rawArgs[++i].split(',').filter(Boolean); }
  else if (a === '--seasons') { flags.seasons = parseInt(rawArgs[++i], 10); }
  else positional.push(a);
}
const SEASONS_PER_SEED = flags.seasons || parseInt(positional[0], 10) || 40;
const SEEDS = flags.seed != null
  ? [flags.seed]
  : (positional.length > 1 ? positional.slice(1).map(s => parseInt(s, 10)) : [42, 7919, 15838]);

// 非決定パスの保険（auto-sim.jsと同じ方式）: 一部の非戦闘シミュレーション経路が
// まだ Math.random() を使っているため、CLIシードから導出した決定的PRNGで置換する。
let legacyRandomState = (SEEDS[0] || 42) >>> 0;
Math.random = function seededLegacyRandom() {
  legacyRandomState = (Math.imul(legacyRandomState, 1664525) + 1013904223) >>> 0;
  return legacyRandomState / 0x100000000;
};

// window stub（Engine内で IS_TRIAL 参照がある）
global.window = { IS_TRIAL: false };

// ── ソースコードをグローバルスコープで読み込む（auto-sim.jsと同じ手法） ──
const vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');

function readSource(filename) {
  return fs.readFileSync(path.join(srcDir, filename), 'utf-8');
}

function loadAsGlobal(filename) {
  let code = readSource(filename);
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
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

if (typeof Engine === 'undefined') {
  console.error('ERROR: Engine が読み込めませんでした');
  process.exit(1);
}
if (typeof ALL_CHARS === 'undefined') {
  console.error('ERROR: ALL_CHARS が読み込めませんでした');
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════════════════════
//  プレイヤー判断のランダム自動化（test/auto-sim.jsから移植・同一ロジック）
// ══════════════════════════════════════════════════════════════════════════════

function initGame(seed) {
  let G = Engine.createInitialState(seed, true); // skipDraft=true
  G = { ...G, debugLog: G.debugLog || [] };
  return G;
}

// 興行カード自動編成（auto-sim.jsと同一：ランダムシャッフル代用）
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
    card.push({
      left: shuffled[i].id,
      right: shuffled[i + 1].id,
      isTitle: false,
    });
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
    } else if (fe.eventId === 'F02_IGNITE') {
      const r = Engine.factions.applyF02IgniteResult ? Engine.factions.applyF02IgniteResult(s, fe.payload, rng) : null;
      if (r && r.state) s = r.state;
    } else if (fe.eventId === 'COMMON_1') {
      const choices = ['A', 'B'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 2)];
      const r = Engine.factions.applyCommon1Choice(s, fe.payload, choiceId, rng);
      if (r && r.state) s = r.state;
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

// ══════════════════════════════════════════════════════════════════════════════
//  計測プローブ
// ══════════════════════════════════════════════════════════════════════════════

// 現行の観客熱バンド（src/data.js CROWD_HEAT_MQ と同一の閾値）
const CURRENT_CROWD_BANDS = CROWD_HEAT_MQ.map(c => ({ min: c.min, bonus: c.bonus, label: c.label || '(普通)' }));
function classifyCurrentBand(occRate) {
  const entry = CURRENT_CROWD_BANDS.find(c => occRate >= c.min) || CURRENT_CROWD_BANDS[CURRENT_CROWD_BANDS.length - 1];
  return entry.label + `(bonus${entry.bonus >= 0 ? '+' : ''}${entry.bonus})`;
}

function seasonBandOf(season) {
  if (season <= 10) return 'S1-10';
  if (season <= 25) return 'S11-25';
  return 'S26-40';
}

const probe = {
  occupancySamples: [],   // { seed, season, seasonBand, venueIdx, venueName, cap, attendance, occupancy }
  slotSamples: [],        // { seed, slotBand, matchType, avgPop, maxPop, hasRivalry, isTitle }
  popularitySamples: [],  // number[]
};

function recordSlotStats(preShowState, seed) {
  const card = preShowState.showCard || [];
  const roster = preShowState.roster;
  card.forEach((m, idx) => {
    const slotBand = idx === 0 ? 'main' : idx === 1 ? 'semi' : 'other';
    if (m.matchType === 'tag') {
      const ids = [m.teamA?.fighter1, m.teamA?.fighter2, m.teamB?.fighter1, m.teamB?.fighter2];
      const fighters = ids.map(id => roster.find(c => c.id === id)).filter(Boolean);
      if (fighters.length < 4) return;
      const pops = fighters.map(f => f.popularity || 0);
      probe.slotSamples.push({
        seed, slotBand, matchType: 'tag',
        avgPop: pops.reduce((a, b) => a + b, 0) / pops.length,
        maxPop: Math.max(...pops),
        hasRivalry: false, // タッグの因縁判定は本計測のスコープ外
        isTitle: false,
      });
      return;
    }
    const fA = roster.find(c => c.id === m.left);
    const fB = roster.find(c => c.id === m.right);
    if (!fA || !fB) return;
    const popA = fA.popularity || 0;
    const popB = fB.popularity || 0;
    let rivalryLevel = null;
    try {
      rivalryLevel = Engine.title.getRivalryLevel(preShowState, m.left, m.right);
    } catch (_e) { rivalryLevel = null; }
    probe.slotSamples.push({
      seed, slotBand, matchType: 'single',
      avgPop: (popA + popB) / 2,
      maxPop: Math.max(popA, popB),
      hasRivalry: !!rivalryLevel,
      isTitle: !!m.isTitle,
    });
  });
}

function recordOccupancy(preShowState, postShowState, seed) {
  const venueIdx = preShowState.showVenue || 0;
  const venue = VENUES[venueIdx];
  const attendance = postShowState.lastShowAttendance;
  if (typeof attendance !== 'number' || !venue) return;
  const occupancy = attendance / venue.cap;
  probe.occupancySamples.push({
    seed,
    season: preShowState.season,
    seasonBand: seasonBandOf(preShowState.season),
    venueIdx,
    venueName: venue.name,
    cap: venue.cap,
    attendance,
    occupancy,
  });
}

function recordPopularitySnapshot(state) {
  for (const c of state.roster || []) {
    if (typeof c.popularity === 'number') probe.popularitySamples.push(c.popularity);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  シミュレーションメインループ（test/auto-sim.jsの本体ロジックを踏襲。
//  ただし本スクリプトに不要な残バランス系プローブ・頻度統計は省略し、
//  観客帯×注目度の計測フックのみを追加している）
// ══════════════════════════════════════════════════════════════════════════════

function runSimulation(seed, seasons) {
  const violations = [];
  const errors = [];
  let totalWeeks = 0;
  let gameOverCount = 0;
  let currentSeed = seed;
  const MAX_ITER = seasons * 60;

  let G;
  try {
    G = initGame(currentSeed);
  } catch (e) {
    errors.push({ season: 0, week: 0, seed: currentSeed, error: `initGame failed: ${e.message}` });
    return { violations, errors, totalWeeks, gameOverCount, completed: 0 };
  }

  let simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
  let completed = 0;
  let iter = 0;

  while (completed < seasons && iter < MAX_ITER) {
    iter++;
    try {
      if (G.weekPhase === 'gameover') {
        gameOverCount++;
        violations.push({ season: G.season, week: G.week, message: `GAMEOVER: 資金 ${Math.round(G.funds)}万 で破産` });
        currentSeed = (currentSeed * 1103515245 + 12345) | 0;
        G = initGame(currentSeed);
        simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
        continue;
      }

      // ── 特殊weekPhaseの即座処理（UIが処理するフェーズをバイパス） ──
      if (G.ppvTournament?.phase === 'entry') {
        G = Engine.ppvTournament.confirmPlayerEntries(G, Engine.ppvTournament.suggestPlayerEntries(G));
      }
      if (G.weekPhase === 'ppvEntry') {
        G = { ...G, ppvPhase: 'locked' };
      }
      if (G.weekPhase === 'ppvShow') {
        G = { ...G, ppvPhase: 'tv' };
      }
      if (G.weekPhase === 'ppvTV') {
        G = { ...G, ppvPhase: null };
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
      if (G.weekPhase === 'scoutEvent') {
        G = autoHandleScoutEvent(G, simRng);
      }
      if (G.weekPhase === 'contractNegotiation') {
        G = autoHandleContractNegotiation(G, simRng);
      }

      // ── 興行週: カード自動編成→executeShow（計測フック本体） ──
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
          recordPopularitySnapshot(G);
          recordSlotStats(G, seed);
          const preShowState = G;
          const showResult = Engine.executeShow(G);
          if (showResult && !showResult.error) {
            recordOccupancy(preShowState, showResult.state, seed);
            G = showResult.state;
          }
        }
      }

      // ── transientイベント消化 ──
      G = autoHandleChoiceEvent(G, simRng);
      G = autoHandleLargeEvent(G, simRng);
      G = clearTransients(G);

      // ── tickWeek ──
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);
      G = collectViolations(G, violations);

      // ── advanceWeek ──
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

      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
        if (completed % 10 === 0) {
          process.stdout.write(`  ... seed ${seed}: ${completed}/${seasons} seasons\r`);
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
        errors.push({ season: '?', week: '?', seed: currentSeed, error: `Re-init failed: ${e2.message}` });
        break;
      }
    }
  }

  if (iter >= MAX_ITER) {
    errors.push({ season: G.season, week: G.week, seed: currentSeed, error: `MAX_ITER (${MAX_ITER}) に到達。無限ループの可能性` });
  }

  return { violations, errors, totalWeeks, gameOverCount, completed };
}

// ══════════════════════════════════════════════════════════════════════════════
//  実行
// ══════════════════════════════════════════════════════════════════════════════

// ── merge モード: 複数の単発ダンプJSONを合算してレポートのみ書く ──
if (flags.merge) {
  console.log('=== MQ再設計 P3c前段計測: 合算レポート生成 ===');
  const runSummaries = [];
  const mergedSeeds = [];
  for (const p of flags.merge) {
    const dump = JSON.parse(fs.readFileSync(p, 'utf-8'));
    mergedSeeds.push(dump.seed);
    runSummaries.push({ seed: dump.seed, ...dump.summary });
    probe.occupancySamples.push(...dump.occupancySamples);
    probe.slotSamples.push(...dump.slotSamples);
    probe.popularitySamples.push(...dump.popularitySamples);
    console.log(`loaded ${p}: seed=${dump.seed} completed=${dump.summary.completed} occ=${dump.occupancySamples.length} slot=${dump.slotSamples.length} pop=${dump.popularitySamples.length}`);
  }
  writeReport(runSummaries, SEASONS_PER_SEED, mergedSeeds);
  process.exit(0);
}

// ── 単発ダンプモード: 1シードだけ実行し、生サンプルをJSONへ保存（レポートは書かない） ──
if (flags.seed != null && flags.out) {
  console.log('=== MQ再設計 P3c前段計測: 単発ダンプモード ===');
  console.log(`Seed: ${flags.seed} / Seasons: ${SEASONS_PER_SEED}`);
  const startTime = Date.now();
  const summary = runSimulation(flags.seed, SEASONS_PER_SEED);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`seed ${flags.seed}: completed=${summary.completed}/${SEASONS_PER_SEED} weeks=${summary.totalWeeks} gameOverCount=${summary.gameOverCount} errors=${summary.errors.length} (${elapsed}s)`);
  if (summary.errors.length > 0) {
    summary.errors.slice(0, 10).forEach(e => console.log(`  [ERROR] S${e.season}W${e.week}: ${e.error}`));
  }
  const dump = {
    seed: flags.seed,
    seasons: SEASONS_PER_SEED,
    summary: {
      completed: summary.completed,
      totalWeeks: summary.totalWeeks,
      gameOverCount: summary.gameOverCount,
      errors: summary.errors.map(e => ({ season: e.season, week: e.week, error: e.error })),
    },
    occupancySamples: probe.occupancySamples,
    slotSamples: probe.slotSamples,
    popularitySamples: probe.popularitySamples,
  };
  fs.writeFileSync(flags.out, JSON.stringify(dump), 'utf-8');
  console.log(`ダンプ出力: ${flags.out} (occ=${probe.occupancySamples.length} slot=${probe.slotSamples.length} pop=${probe.popularitySamples.length})`);
  process.exit(0);
}

// ── 従来モード: 1プロセスで全シード実行→レポート出力 ──
console.log('=== MQ再設計 P3c前段計測: 観客帯×注目度の設計材料 ===');
console.log(`Seasons/seed: ${SEASONS_PER_SEED}`);
console.log(`Seeds: ${SEEDS.join(', ')}`);
console.log('--------------------------------------');

const startTime = Date.now();
const runSummaries = [];
for (const seed of SEEDS) {
  const summary = runSimulation(seed, SEASONS_PER_SEED);
  runSummaries.push({ seed, ...summary });
  console.log(`seed ${seed}: completed=${summary.completed} weeks=${summary.totalWeeks} gameOverCount=${summary.gameOverCount} errors=${summary.errors.length}`);
  if (summary.errors.length > 0) {
    summary.errors.slice(0, 5).forEach(e => console.log(`  [ERROR] S${e.season}W${e.week} seed=${e.seed}: ${e.error}`));
  }
}
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`--------------------------------------`);
console.log(`計測完了 (${elapsed}s)。 occupancySamples=${probe.occupancySamples.length} slotSamples=${probe.slotSamples.length} popularitySamples=${probe.popularitySamples.length}`);
writeReport(runSummaries, SEASONS_PER_SEED, SEEDS);

// ── 集計＋レポート出力（関数化: 単発モード/merge モード/従来モード 共通） ──
function writeReport(runSummaries, seasonsPerSeed, seeds) {
function percentile(sortedArr, p) {
  if (!sortedArr.length) return null;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  const frac = idx - lo;
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * frac;
}
const PCTS = [10, 25, 50, 75, 90, 95, 99];
function percentileSet(arr, digits) {
  const sorted = [...arr].sort((a, b) => a - b);
  const out = { n: sorted.length };
  for (const p of PCTS) {
    out['p' + p] = sorted.length ? Number(percentile(sorted, p).toFixed(digits)) : null;
  }
  out.mean = sorted.length ? Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(digits)) : null;
  return out;
}

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

// 1. 満員率(occupancy)分布
const occAll = probe.occupancySamples.map(s => s.occupancy);
const occOverall = percentileSet(occAll, 4);

const occBySeasonBand = new Map();
for (const [band, items] of groupBy(probe.occupancySamples, s => s.seasonBand)) {
  occBySeasonBand.set(band, percentileSet(items.map(i => i.occupancy), 4));
}

const occByVenue = new Map();
for (const [venueIdx, items] of groupBy(probe.occupancySamples, s => s.venueIdx)) {
  occByVenue.set(venueIdx, {
    venueName: items[0].venueName,
    cap: items[0].cap,
    ...percentileSet(items.map(i => i.occupancy), 4),
  });
}

// 現行観客熱バンド別の割合
const bandCounts = new Map();
for (const s of probe.occupancySamples) {
  const label = classifyCurrentBand(s.occupancy);
  bandCounts.set(label, (bandCounts.get(label) || 0) + 1);
}

// 2. スロット別データ
const slotBands = ['main', 'semi', 'other'];
const slotAgg = {};
for (const band of slotBands) {
  const items = probe.slotSamples.filter(s => s.slotBand === band);
  const singles = items.filter(s => s.matchType === 'single');
  const avgPopArr = items.map(s => s.avgPop);
  const maxPopArr = items.map(s => s.maxPop);
  slotAgg[band] = {
    n: items.length,
    nSingles: singles.length,
    nTag: items.length - singles.length,
    avgPopMean: avgPopArr.length ? Number((avgPopArr.reduce((a, b) => a + b, 0) / avgPopArr.length).toFixed(2)) : null,
    maxPopMean: maxPopArr.length ? Number((maxPopArr.reduce((a, b) => a + b, 0) / maxPopArr.length).toFixed(2)) : null,
    rivalryRate: singles.length ? Number((singles.filter(s => s.hasRivalry).length / singles.length * 100).toFixed(2)) : null,
    titleRate: singles.length ? Number((singles.filter(s => s.isTitle).length / singles.length * 100).toFixed(2)) : null,
  };
}

// 3. 人気分布
const popPercentiles = percentileSet(probe.popularitySamples, 2);

// ══════════════════════════════════════════════════════════════════════════════
//  レポート出力
// ══════════════════════════════════════════════════════════════════════════════

const lines = [];
lines.push('# MQ観客帯×注目度 実測ベースライン v0.1');
lines.push('');
lines.push(`計測日: 2026-07-24`);
lines.push(`設計材料: docs/mq-redesign-proposal-v0.4.md §3.2「観客補正 = venueHeat(満員率) × engagement(試合注目度)」`);
lines.push('');
lines.push('## 計測条件');
lines.push('');
lines.push(`- シード: ${seeds.join(', ')} × 各${seasonsPerSeed}シーズン`);
lines.push('- スクリプト: `test/mq-crowd-measure.js`（新規。`test/auto-sim.js` は変更なし）');
lines.push('- 対象: プレイヤー通常興行（`Engine.executeShow`経由）。PPV・天頂戦・春タッグ・秋対抗戦は対象外');
lines.push('- カード編成はauto-sim.jsと同じくランダムシャッフル代用（プレイヤーの戦略的判断は未反映）');
lines.push('- 乱数はEngine.rng系（シード管理済み）のみ使用。src/は無変更');
lines.push('');
runSummaries.forEach(s => {
  lines.push(`- seed ${s.seed}: 完了シーズン=${s.completed} / 総週数=${s.totalWeeks} / 破産(再init)回数=${s.gameOverCount} / エラー=${s.errors.length}`);
});
lines.push('');
lines.push(`サンプル数: 興行(occupancy)=${probe.occupancySamples.length} / カードスロット=${probe.slotSamples.length} / 人気スナップショット=${probe.popularitySamples.length}`);
lines.push('');

lines.push('## 1. 満員率(occupancy = 動員/会場キャパ)の分布');
lines.push('');
lines.push('### 1.1 全体');
lines.push('');
lines.push('| n | mean | p10 | p25 | p50 | p75 | p90 | p95 | p99 |');
lines.push('|---|------|-----|-----|-----|-----|-----|-----|-----|');
lines.push(`| ${occOverall.n} | ${occOverall.mean} | ${occOverall.p10} | ${occOverall.p25} | ${occOverall.p50} | ${occOverall.p75} | ${occOverall.p90} | ${occOverall.p95} | ${occOverall.p99} |`);
lines.push('');
lines.push('### 1.2 シーズン帯別');
lines.push('');
lines.push('| シーズン帯 | n | mean | p10 | p25 | p50 | p75 | p90 | p95 | p99 |');
lines.push('|---|---|------|-----|-----|-----|-----|-----|-----|-----|');
for (const band of ['S1-10', 'S11-25', 'S26-40']) {
  const p = occBySeasonBand.get(band);
  if (!p) { lines.push(`| ${band} | 0 | - | - | - | - | - | - | - | - |`); continue; }
  lines.push(`| ${band} | ${p.n} | ${p.mean} | ${p.p10} | ${p.p25} | ${p.p50} | ${p.p75} | ${p.p90} | ${p.p95} | ${p.p99} |`);
}
lines.push('');
lines.push('### 1.3 会場ティア別（VENUES index順）');
lines.push('');
lines.push('| venueIdx | 会場名 | cap | n | mean | p10 | p25 | p50 | p75 | p90 | p95 | p99 |');
lines.push('|---|---|---|---|------|-----|-----|-----|-----|-----|-----|-----|');
for (let vi = 0; vi < VENUES.length; vi++) {
  const p = occByVenue.get(vi);
  if (!p) continue;
  lines.push(`| ${vi} | ${p.venueName} | ${p.cap} | ${p.n} | ${p.mean} | ${p.p10} | ${p.p25} | ${p.p50} | ${p.p75} | ${p.p90} | ${p.p95} | ${p.p99} |`);
}
lines.push('');
lines.push('### 1.4 現行の観客熱バンド（CROWD_HEAT_MQ）別の興行割合');
lines.push('');
lines.push('| バンド | 興行数 | 割合 |');
lines.push('|---|---|---|');
const totalOcc = probe.occupancySamples.length || 1;
// CURRENT_CROWD_BANDS の定義順（閾値降順）で出力
CURRENT_CROWD_BANDS.forEach(c => {
  const label = c.label + `(bonus${c.bonus >= 0 ? '+' : ''}${c.bonus})`;
  const count = bandCounts.get(label) || 0;
  lines.push(`| ${label} 満員率≥${c.min} | ${count} | ${(count / totalOcc * 100).toFixed(2)}% |`);
});
lines.push('');

lines.push('## 2. カード内スロット別の注目度材料（メイン=index0 / セミ=index1 / それ以下=index2+）');
lines.push('');
lines.push('| スロット | n(全体) | n(シングル) | n(タッグ) | 参加者人気 平均の平均 | 参加者人気 最大の平均 | 因縁ありの割合(シングルのみ) | タイトル戦の割合(シングルのみ) |');
lines.push('|---|---|---|---|---|---|---|---|');
for (const band of slotBands) {
  const a = slotAgg[band];
  const label = band === 'main' ? 'メイン(index0)' : band === 'semi' ? 'セミ(index1)' : 'それ以下(index2+)';
  lines.push(`| ${label} | ${a.n} | ${a.nSingles} | ${a.nTag} | ${a.avgPopMean} | ${a.maxPopMean} | ${a.rivalryRate != null ? a.rivalryRate + '%' : '-'} | ${a.titleRate != null ? a.titleRate + '%' : '-'} |`);
}
lines.push('');
lines.push('注: タッグスロットは「参加者人気」を4名平均/4名中最大で算出。因縁・タイトルの判定はシングルのみ対象（タッグの因縁判定は本計測のスコープ外）。');
lines.push('');
lines.push('**⚠️既知の制約: タイトル戦の割合が常に0%になっている。** `state.titleEstablished` は本番では `App.checkTitleEstablishment()`(app.js、UI層)が興行3回+人気15+ロスター5人の条件を満たした週に立てるフラグだが、'
  + 'headless計測（本スクリプト・`test/auto-sim.js` とも共通の制約）はapp.jsを読み込まないためこのフラグが一度も立たず、`autoSetupShowCard`のタイトルマッチ組成が常にスキップされる。'
  + '実際のプレイでは団体王座設立後にタイトル戦が発生するため、この0%は実測ではなく計測手法の欠落であり、engagementのタイトル戦係数設計では別途実測が必要。');
lines.push('');

lines.push('## 3. ロスター全体の人気の分布（p10〜p99）');
lines.push('');
lines.push('興行週ごとのプレイヤーロスター全選手のpopularity値をスナップショットした累積分布（時間加重）。');
lines.push('');
lines.push('| n | mean | p10 | p25 | p50 | p75 | p90 | p95 | p99 |');
lines.push('|---|------|-----|-----|-----|-----|-----|-----|-----|');
lines.push(`| ${popPercentiles.n} | ${popPercentiles.mean} | ${popPercentiles.p10} | ${popPercentiles.p25} | ${popPercentiles.p50} | ${popPercentiles.p75} | ${popPercentiles.p90} | ${popPercentiles.p95} | ${popPercentiles.p99} |`);
lines.push('');

lines.push('## 実行ログ');
lines.push('');
runSummaries.forEach(s => {
  lines.push(`- seed ${s.seed}: completed=${s.completed}/${seasonsPerSeed}, totalWeeks=${s.totalWeeks}, gameOverCount=${s.gameOverCount}, errors=${s.errors.length}`);
  (s.errors || []).slice(0, 10).forEach(e => lines.push(`  - [ERROR] S${e.season}W${e.week}: ${e.error}`));
});
lines.push('');

const outPath = path.join(__dirname, '..', 'docs', 'mq-crowd-baseline-v0.1.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`レポート出力: ${outPath}`);
}
