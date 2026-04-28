#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Relationship Distribution Analysis Script
//
//  ■ 目的
//    bond / rivalry の長期分布をヒストグラム形式で出力し、相性システム導入前後の
//    比較指標（特に「帯シフト指標」=|bond-50|の平均）を測定する。
//
//  ■ 出力
//    - bond / rivalry 5帯ヒストグラム × 3カテゴリ（全ペア / 同団体 / 他団体接触あり）
//    - 因縁称号分布（Engine.title.getRivalryLevel）
//    - ペア軌跡サンプル（S1/S10/S25/S50/S100 の bond/rivalry 推移、10組）
//    - サマリ（接触あり率、帯シフト指標、rivalry 60+ 比率、knownRival/frozen 比率）
//
//  ■ ベース
//    test/auto-sim.js のローダ機構と自動プレイロジックをコピペ流用。
//    違反検知/頻度計測/v2集客計測は本タスクで不要なため削除。
//
//  Usage: node test/relationship-distribution-analysis.js [seasons] [seed] [--json]
//  Example:
//    node test/relationship-distribution-analysis.js 10 12345
//    node test/relationship-distribution-analysis.js 100 12345 --json
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
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('factions.js');
loadAsGlobal('draft-negotiation.js');

if (typeof Engine === 'undefined') {
  console.error('ERROR: Engine が読み込めませんでした');
  process.exit(1);
}

// ── CLI ──
const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith('--'));
const flags = args.filter(a => a.startsWith('--'));
const targetSeasons = parseInt(positional[0], 10) || 100;
const userSeed = positional[1] ? parseInt(positional[1], 10) : (Date.now() ^ 0xABCD1234);
const writeJson = flags.includes('--json');
const saveFlagIdx = args.findIndex(a => a === '--save');
const savePath = saveFlagIdx >= 0 ? args[saveFlagIdx + 1] : null;

console.log('=== Relationship Distribution Analysis ===');
console.log(`Seed: ${userSeed}`);
console.log(`Seasons: ${targetSeasons}`);
console.log(`JSON output: ${writeJson ? 'yes' : 'no'}`);
if (savePath) console.log(`Save: ${savePath} (継続シミュレーション)`);
console.log('--------------------------------------');

// ── 初期化 ──
function initGame(seed) {
  if (savePath) {
    const raw = fs.readFileSync(savePath, 'utf-8');
    let G = JSON.parse(raw);
    // affinityAxis マイグレーション (ロード時相当)
    if (typeof Engine.relationships.migrateAffinityAxisV1 === 'function') {
      G = Engine.relationships.migrateAffinityAxisV1(G);
    }
    // 必須フィールド補完
    G.debugLog = G.debugLog || [];
    G.relationshipCounters = G.relationshipCounters || {};
    G.matchupLog = G.matchupLog || [];
    console.log(`[load] season=${G.season} week=${G.week} roster=${(G.roster||[]).length} relationships=${Object.keys(G.relationships||{}).length}`);
    return G;
  }
  let G = Engine.createInitialState(seed, true);
  G = { ...G, debugLog: G.debugLog || [] };
  return G;
}

// ── 自動プレイヤー判断（auto-sim.js から流用） ──

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
    } else if (['F04','F05','F06','F07','F08'].includes(fe.eventId)) {
      const choices = ['A', 'B', 'C'];
      const choiceId = choices[Math.floor(Engine.rng.float(simRng) * 3)];
      const fn = Engine.factions[`apply${fe.eventId}Choice`];
      if (typeof fn === 'function') {
        const r = fn.call(Engine.factions, s, fe.payload, choiceId, rng);
        if (r && r.state) s = r.state;
      }
    }
  } catch (_e) {}
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
      state = result.state; continue;
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
    delete clean._notion; delete clean._estimate; delete clean._isSeed; delete clean._hasCompetition;
    if (r.winner === 'player') {
      if (newFunds >= r.finalBid && playerPicks < maxPicks && newRoster.filter(c => !c.isRental).length < rosterCap) {
        newRoster.push(normFighter(clean)); newFunds -= r.finalBid; playerPicks++;
      } else { newFA.push(normFighter(clean)); }
    } else if (r.winner && r.winner !== 'player') {
      const orgData = newAiOrgs[r.winner];
      if (orgData) {
        const recruited = normFighter({ ...clean, orgId: r.winner });
        Engine.rival.pushUniqueFighter(orgData.roster, recruited);
      }
    } else { newFA.push(normFighter(clean)); }
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

  return { ...G, roster: newRoster, funds: newFunds, aiOrgs: newAiOrgs,
    freeAgents: newFA, dormantPool: newDormant, scoutCandidates: null, scoutPicks: null };
}

const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
  '_juniorTournamentSelection', '_juniorTournamentResult',
  '_pendingFactionEvent', '_pendingF08Directive',
];
function clearTransients(G) {
  let s = G;
  for (const k of TRANSIENT_KEYS) {
    if (s[k] !== undefined) { const { [k]: _, ...clean } = s; s = clean; }
  }
  return s;
}

// ── スナップショット取得 ──
function takeSnapshot(G, stats) {
  const season = G.season - 1;
  if (!stats.snapshots) stats.snapshots = {};
  const pairs = [];
  for (const key of Object.keys(G.relationships || {})) {
    const r = G.relationships[key];
    if (r.frozen) continue;
    const sepIdx = key.indexOf('>');
    if (sepIdx < 0) continue;
    const idA = parseInt(key.substring(0, sepIdx), 10);
    const idB = parseInt(key.substring(sepIdx + 1), 10);
    pairs.push({
      key, idA, idB,
      bond: r.bond,
      rivalry: r.rivalry,
      knownRival: !!r.knownRival,
    });
  }
  // 所属マップ・h2h・引退情報も保存（最終集計で使う）
  const charOrg = {};
  for (const f of G.roster || []) charOrg[f.id] = 'player';
  for (const orgId of Object.keys(G.aiOrgs || {})) {
    for (const f of G.aiOrgs[orgId].roster || []) charOrg[f.id] = orgId;
  }
  // h2h は最終週時点のものだけ保存（軌跡には不要）
  stats.snapshots[season] = { pairs, charOrg };
}

// ── 集計ロジック ──

const BOND_BANDS = [
  [0, 20, '嫌悪    (0-19)'],
  [20, 40, '苦手   (20-39)'],
  [40, 60, '普通   (40-59)'],
  [60, 80, '好意   (60-79)'],
  [80, 101, '深い絆(80-100)'],
];
const RIVALRY_BANDS = [
  [0, 20, '眼中にない(0-19)'],
  [20, 40, '少し意識 (20-39)'],
  [40, 60, 'ライバル視(40-59)'],
  [60, 80, '因縁    (60-79)'],
  [80, 101, '宿命   (80-100)'],
];

function describeStats(values) {
  if (!values.length) return null;
  const total = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / total;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / total;
  const stdDev = Math.sqrt(variance);
  return {
    n: total, mean, stdDev,
    min: sorted[0], max: sorted[total - 1],
    median: sorted[Math.floor(total / 2)],
    q1: sorted[Math.floor(total / 4)],
    q3: sorted[Math.floor(total * 3 / 4)],
  };
}

function renderHistogram(values, bands, totalLabel) {
  const total = values.length;
  console.log(`【${totalLabel} (n=${total})】`);
  if (total === 0) {
    console.log('  (no data)');
    return { bandPcts: bands.map(() => 0), stats: null };
  }
  const counts = bands.map(([lo, hi]) => values.filter(v => v >= lo && v < hi).length);
  const maxCount = Math.max(...counts, 1);
  const barWidth = 40;
  const pcts = [];
  bands.forEach(([lo, hi, label], i) => {
    const pct = counts[i] / total * 100;
    pcts.push(pct);
    const barLen = Math.round(counts[i] / maxCount * barWidth);
    const bar = '#'.repeat(barLen);
    console.log(`  ${label}: ${pct.toFixed(1).padStart(5)}% [${bar}]`);
  });
  const s = describeStats(values);
  console.log(`  平均: ${s.mean.toFixed(1)}, 標準偏差: ${s.stdDev.toFixed(1)}, min: ${s.min.toFixed(1)}, max: ${s.max.toFixed(1)}`);
  console.log(`  中央値: ${s.median.toFixed(1)}, Q1: ${s.q1.toFixed(1)}, Q3: ${s.q3.toFixed(1)}`);
  return { bandPcts: pcts, stats: s };
}

// 同団体・他団体接触あり判定
function hasRecentMatch(G, idA, idB, currentWeek, currentSeason) {
  const k1 = `${Math.min(idA, idB)}>${Math.max(idA, idB)}`;
  const entry = G.h2h && G.h2h[k1];
  if (!entry || !entry.lastMatch) return false;
  const lastSeason = entry.lastMatch.season;
  const lastWeek = entry.lastMatch.week;
  if (lastSeason == null || lastWeek == null) return false;
  if (lastSeason === currentSeason && currentWeek - lastWeek <= 4) return true;
  if (lastSeason === currentSeason - 1 && (52 - lastWeek) + currentWeek <= 4) return true;
  return false;
}

function classifyPairs(snapshot, G) {
  const sameOrgPairs = [];
  const crossOrgContactPairs = [];
  const otherPairs = [];
  for (const p of snapshot.pairs) {
    const orgA = snapshot.charOrg[p.idA];
    const orgB = snapshot.charOrg[p.idB];
    if (!orgA || !orgB) { otherPairs.push(p); continue; }
    if (orgA === orgB) sameOrgPairs.push(p);
    else if (hasRecentMatch(G, p.idA, p.idB, G.week, G.season)) crossOrgContactPairs.push(p);
    else otherPairs.push(p);
  }
  return { sameOrgPairs, crossOrgContactPairs, otherPairs };
}

// 軌跡サンプル選定（最終 snapshot から）
function pickTrajectorySamples(stats, G) {
  const final = stats.snapshots[stats.lastSnapshotSeason];
  if (!final) return [];
  const cls = classifyPairs(final, G);
  const sameOrg = cls.sameOrgPairs;
  const samples = [];
  const seen = new Set();
  const pick = (p, label) => {
    if (!p || seen.has(p.key)) return;
    seen.add(p.key);
    samples.push({ key: p.key, idA: p.idA, idB: p.idB, label });
  };
  if (sameOrg.length) {
    const byBondDesc = [...sameOrg].sort((a, b) => b.bond - a.bond);
    pick(byBondDesc[0], '最終 bond 最高（同団体）');
    pick(byBondDesc[byBondDesc.length - 1], '最終 bond 最低（同団体）');
    // rivalry帯別の同団体長期ペア
    const bandFilters = [
      ['同団体長期 - 眼中にない', p => p.rivalry < 20],
      ['同団体長期 - 少し意識', p => p.rivalry >= 20 && p.rivalry < 40],
      ['同団体長期 - ライバル視', p => p.rivalry >= 40 && p.rivalry < 60],
      ['同団体長期 - 因縁', p => p.rivalry >= 60 && p.rivalry < 80],
      ['同団体長期 - 宿命', p => p.rivalry >= 80],
    ];
    for (const [label, filt] of bandFilters) {
      const found = sameOrg.filter(filt).find(p => !seen.has(p.key));
      if (found) pick(found, label);
    }
  }
  // 全カテゴリから rivalry 60+ ペア
  const allPairs = [...cls.sameOrgPairs, ...cls.crossOrgContactPairs];
  const bitterCandidate = allPairs.find(p => p.rivalry >= 60 && !seen.has(p.key));
  if (bitterCandidate) pick(bitterCandidate, '因縁/宿命到達');
  // ランダムで埋める（10組を目標に）
  const rest = [...allPairs].sort((a, b) => a.key.localeCompare(b.key));
  for (const p of rest) {
    if (samples.length >= 10) break;
    if (!seen.has(p.key)) pick(p, 'ランダムサンプル');
  }
  return samples.slice(0, 10);
}

function buildTrajectory(stats, sample) {
  const checkpoints = [0, 9, 24, 49, 99];
  const traj = [];
  for (const cp of checkpoints) {
    const snap = stats.snapshots[cp];
    if (!snap) continue;
    const found = snap.pairs.find(p => p.key === sample.key);
    if (!found) continue;
    traj.push({ season: cp + 1, bond: found.bond, rivalry: found.rivalry });
  }
  return traj;
}

// 因縁称号分布
function rivalryTitleDistribution(snapshot, G) {
  const counts = {};
  const order = ['なし'];
  const bump = (label) => {
    if (!(label in counts)) { counts[label] = 0; order.push(label); }
    counts[label]++;
  };
  counts['なし'] = 0;
  const seen = new Set();
  for (const p of snapshot.pairs) {
    const canonical = `${Math.min(p.idA, p.idB)}>${Math.max(p.idA, p.idB)}`;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    let lvl = null;
    try { lvl = Engine.title.getRivalryLevel(G, p.idA, p.idB); } catch (_e) {}
    if (!lvl) counts['なし']++;
    else bump(lvl.label || '(label無し)');
  }
  return { counts, order };
}

// ── メインループ ──
function runSimulation(seed, seasons) {
  const errors = [];
  let totalWeeks = 0;
  let gameOverCount = 0;
  let currentSeed = seed;
  const MAX_ITER = seasons * 60;

  const stats = {
    seasons: 0,
    snapshots: {},
    lastSnapshotSeason: -1,
    lastSeasonSeen: 1,
  };

  let G;
  try { G = initGame(currentSeed); }
  catch (e) {
    errors.push({ error: `initGame failed: ${e.message}` });
    return { stats, errors, totalWeeks, gameOverCount, finalState: null };
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
      G = { ...tickResult.state, gameLog: [] };
      G = autoHandleFactionEvent(G, simRng);
      G = clearTransients(G);

      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };
      if (G.pendingRetirements && G.pendingRetirements.length > 0) {
        const confirmed = G.pendingRetirements.map(r => r.fighter);
        const commitRes = Engine.retirement.commitRetirements(G, confirmed);
        const { pendingRetirements: _drop, ...rest } = commitRes.state;
        G = rest;
      }
      totalWeeks++;

      // シーズン繰り上がり検出 → 完了したシーズンのスナップショット取得
      if (G.season > stats.lastSeasonSeen) {
        takeSnapshot(G, stats);
        stats.lastSnapshotSeason = G.season - 1;
        stats.lastSeasonSeen = G.season;
        completed++;
        stats.seasons++;
        if (completed % 10 === 0) {
          process.stdout.write(`  ... ${completed}/${seasons} seasons completed\r`);
        }
      }
    } catch (e) {
      errors.push({ season: G ? G.season : '?', week: G ? G.week : '?', error: e.message, stack: e.stack });
      gameOverCount++;
      currentSeed = (currentSeed * 1103515245 + 12345) | 0;
      try {
        G = initGame(currentSeed);
        simRng = Engine.rng.create(Engine.rng.derive(currentSeed, 0xABCD));
      } catch (e2) {
        errors.push({ error: `Re-init failed: ${e2.message}` });
        break;
      }
    }
  }

  if (iter >= MAX_ITER) {
    errors.push({ error: `MAX_ITER (${MAX_ITER}) に到達。無限ループの可能性` });
  }
  return { stats, errors, totalWeeks, gameOverCount, finalState: G };
}

// ── 実行 ──
const startTime = Date.now();
const result = runSimulation(userSeed, targetSeasons);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('');
console.log('--------------------------------------');

if (result.errors.length > 0) {
  result.errors.forEach(e => {
    console.log(`[ERROR] S${e.season ?? '?'} W${e.week ?? '?'}: ${e.error}`);
    if (e.stack) {
      const lines = e.stack.split('\n').slice(0, 4);
      lines.forEach(l => console.log(`  ${l.trim()}`));
    }
  });
}

console.log(`Total seasons: ${result.stats.seasons}`);
console.log(`Total weeks: ${result.totalWeeks}`);
console.log(`Game overs: ${result.gameOverCount}`);
console.log(`Elapsed: ${elapsed}s`);

// ── 集計レポート ──
const finalSnap = result.stats.snapshots[result.stats.lastSnapshotSeason];
if (!finalSnap) {
  console.log('\n[ERROR] 有効なスナップショットが取れませんでした');
  process.exit(1);
}

const finalState = result.finalState;
const cls = classifyPairs(finalSnap, finalState);
const allPairs = finalSnap.pairs;

console.log('\n========== Bond 分布 ==========');
const bondAll = renderHistogram(allPairs.map(p => p.bond), BOND_BANDS, 'Bond分布 — 全ペア');
console.log('');
const bondSame = renderHistogram(cls.sameOrgPairs.map(p => p.bond), BOND_BANDS, 'Bond分布 — 同団体ペア');
console.log('');
const bondCross = renderHistogram(cls.crossOrgContactPairs.map(p => p.bond), BOND_BANDS, 'Bond分布 — 他団体・接触ありペア');

console.log('\n========== Rivalry 分布 ==========');
const rivAll = renderHistogram(allPairs.map(p => p.rivalry), RIVALRY_BANDS, 'Rivalry分布 — 全ペア');
console.log('');
const rivSame = renderHistogram(cls.sameOrgPairs.map(p => p.rivalry), RIVALRY_BANDS, 'Rivalry分布 — 同団体ペア');
console.log('');
const rivCross = renderHistogram(cls.crossOrgContactPairs.map(p => p.rivalry), RIVALRY_BANDS, 'Rivalry分布 — 他団体・接触ありペア');

console.log('\n========== 因縁称号分布 ==========');
const titleDistResult = rivalryTitleDistribution(finalSnap, finalState);
const titleDist = titleDistResult.counts;
const titleTotal = Object.values(titleDist).reduce((s, v) => s + v, 0);
for (const k of titleDistResult.order) {
  const v = titleDist[k];
  const pct = titleTotal ? (v / titleTotal * 100).toFixed(1) : '0.0';
  console.log(`  ${String(k).padEnd(12)}: ${pct.padStart(5)}% (${v})`);
}

console.log('\n========== ペア軌跡サンプル ==========');
const samples = pickTrajectorySamples(result.stats, finalState);
for (const s of samples) {
  const traj = buildTrajectory(result.stats, s);
  if (traj.length === 0) continue;
  console.log(`[${s.label}] ${s.idA}-${s.idB}:`);
  for (const t of traj) {
    console.log(`  S${String(t.season).padStart(3, '0')}: bond=${t.bond.toFixed(1).padStart(5)} rivalry=${t.rivalry.toFixed(1).padStart(5)}`);
  }
}

console.log('\n========== サマリ ==========');
const sameCount = cls.sameOrgPairs.length;
const crossCount = cls.crossOrgContactPairs.length;
const totalActive = allPairs.length;
const contactRate = totalActive ? ((sameCount + crossCount) / totalActive * 100) : 0;
const bondShift = allPairs.length ? allPairs.reduce((s, p) => s + Math.abs(p.bond - 50), 0) / allPairs.length : 0;
const rivHigh = allPairs.filter(p => p.rivalry >= 60).length;
const knownRivalCount = allPairs.filter(p => p.knownRival).length;
// frozen 率は relationships 全体から（snapshot は frozen=false のみ）
const allRelKeys = Object.keys(finalState.relationships || {});
const frozenCount = allRelKeys.filter(k => finalState.relationships[k].frozen).length;
const frozenRate = allRelKeys.length ? (frozenCount / allRelKeys.length * 100) : 0;

console.log(`全ペア接触あり率: ${contactRate.toFixed(1)}% (同団体 ${sameCount} + 他団体接触 ${crossCount} / 全 ${totalActive})`);
console.log(`平均bond: ${bondAll.stats.mean.toFixed(2)} (50→${bondAll.stats.mean.toFixed(1)})`);
console.log(`帯シフト指標 |bond-50| 平均: ${bondShift.toFixed(2)}`);
console.log(`rivalry 60+ ペア比率: ${(rivHigh / totalActive * 100).toFixed(2)}% (${rivHigh}/${totalActive})`);
console.log(`knownRival 比率: ${(knownRivalCount / totalActive * 100).toFixed(2)}% (${knownRivalCount}/${totalActive})`);
console.log(`frozen ペア比率: ${frozenRate.toFixed(2)}% (${frozenCount}/${allRelKeys.length})`);

// ── JSON 出力 ──
if (writeJson) {
  const outPath = path.join(__dirname, `relationship-distribution-${userSeed}.json`);
  const json = {
    seed: userSeed,
    seasons: result.stats.seasons,
    totalWeeks: result.totalWeeks,
    gameOverCount: result.gameOverCount,
    elapsedSec: parseFloat(elapsed),
    bond: {
      all: { bandPcts: bondAll.bandPcts, stats: bondAll.stats },
      sameOrg: { bandPcts: bondSame.bandPcts, stats: bondSame.stats },
      crossOrgContact: { bandPcts: bondCross.bandPcts, stats: bondCross.stats },
    },
    rivalry: {
      all: { bandPcts: rivAll.bandPcts, stats: rivAll.stats },
      sameOrg: { bandPcts: rivSame.bandPcts, stats: rivSame.stats },
      crossOrgContact: { bandPcts: rivCross.bandPcts, stats: rivCross.stats },
    },
    rivalryTitleDistribution: titleDist,
    trajectorySamples: samples.map(s => ({
      label: s.label, idA: s.idA, idB: s.idB,
      points: buildTrajectory(result.stats, s),
    })),
    summary: {
      contactRate, bondShiftIndex: bondShift,
      rivalryHighPct: rivHigh / totalActive * 100,
      knownRivalPct: knownRivalCount / totalActive * 100,
      frozenPct: frozenRate,
      sameOrgPairs: sameCount, crossOrgContactPairs: crossCount, totalActivePairs: totalActive,
    },
    bondBands: BOND_BANDS.map(b => b[2]),
    rivalryBands: RIVALRY_BANDS.map(b => b[2]),
  };
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf-8');
  console.log(`\nJSON 出力: ${outPath}`);
}

console.log('--------------------------------------');
