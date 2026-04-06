#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — テスト用セーブデータ生成スクリプト
//
//  ゲームをN年分自動プレイしてGameStateをJSONに書き出す。
//  生成したJSONをブラウザのlocalStorageに注入することで
//  NEW GAMEなしに任意状態を再現できる。
//
//  Usage:
//    node test/make-save.js [年数] [シード]
//    例: node test/make-save.js 3 42
//
//  出力: test/fixtures/save-<N>seasons-seed<SEED>.json
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
  new vm.Script(code, { filename }).runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

const args = process.argv.slice(2);
const targetSeasons = parseInt(args[0], 10) || 3;
const seed = args[1] ? parseInt(args[1], 10) : 42;

console.log(`=== Make Save: ${targetSeasons}年 seed=${seed} ===`);

// ── auto-sim.js からそのまま流用 ──

function expandRosterForTest(G) {
  const TARGET = 14;
  let s = { ...G, rosterCap: 18, funds: Math.max(G.funds, 8000) };
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

// ── メインシミュレーション（auto-sim.jsと同じloop構造） ──

let G = expandRosterForTest(Engine.createInitialState(seed, true));
G = { ...G, debugLog: [], orgPop: Math.max(G.orgPop, 80) };  // orgPop floor for S級環境

const simRng = Engine.rng.create(Engine.rng.derive(seed, 0xABCD));
let completed = 0;
let iter = 0;
const MAX_ITER = targetSeasons * 70;

while (completed < targetSeasons && iter < MAX_ITER) {
  iter++;

  try {
    if (G.weekPhase === 'gameover') {
      console.error('GAME OVER — 資金が尽きました。シードを変えるか年数を減らしてください。');
      process.exit(1);
    }

    // PPVフェーズバイパス
    if (G.weekPhase === 'ppvEntry') G = { ...G, ppvPhase: 'locked' };
    if (G.weekPhase === 'ppvShow')  G = { ...G, ppvPhase: 'tv' };
    if (G.weekPhase === 'ppvTV')    G = { ...G, ppvPhase: null };

    // スカウト・契約交渉
    if (G.weekPhase === 'scoutEvent') G = autoHandleScoutEvent(G, simRng);
    if (G.weekPhase === 'contractNegotiation') G = autoHandleContractNegotiation(G, simRng);

    // 興行週: カード組→executeShow
    if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
      G = autoSetupShowCard(G, simRng);
      if (G.showCard && G.showCard.length > 0) {
        const showResult = Engine.executeShow(G);
        if (showResult && !showResult.error) G = showResult.state;
      }
    }

    // transientイベント消化
    G = autoHandleChoiceEvent(G, simRng);
    G = autoHandleLargeEvent(G, simRng);
    G = clearTransients(G);

    // tickWeek
    const tickResult = Engine.tickWeek(G);
    G = { ...tickResult.state, gameLog: [], debugLog: [] };
    if (G.orgPop < 80) G = { ...G, orgPop: 80 };
    G = clearTransients(G);

    // advanceWeek
    const advResult = Engine.advanceWeek(G);
    G = { ...advResult.state, gameLog: [] };

    // シーズン遷移検出
    if (!G.offSeason && G.week === 1 && G.season > 1) {
      completed++;
      process.stdout.write(`\r  シーズン ${completed}/${targetSeasons} 完了 (roster=${G.roster.length}, pop=${G.orgPop.toFixed(1)}, 資金=${Math.round(G.funds)}万)`);
    }
  } catch (e) {
    console.error(`\nERROR at season=${G.season} week=${G.week}: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }
}
console.log('\n');

// ── セーブデータ書き出し ──

const saveState = JSON.parse(JSON.stringify(G));
saveState.roster.forEach(c => { delete c._weekAction; c.intensive = false; });
saveState._saveVersion = '1.0b';
saveState._saveDate = new Date().toISOString();
saveState._saveNote = `auto-generated test fixture: ${targetSeasons} seasons, seed=${seed}`;
// transientフィールドはクリア済みだが念のため
for (const k of TRANSIENT_KEYS) delete saveState[k];
delete saveState.debugLog;
delete saveState.gameLog;

const json = JSON.stringify(saveState);

const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);

const filename = `save-${targetSeasons}seasons-seed${seed}.json`;
const filepath = path.join(fixturesDir, filename);
fs.writeFileSync(filepath, json, 'utf-8');

const sizeKB = Math.round(Buffer.byteLength(json) / 1024);
console.log(`✅ 保存完了: ${filepath} (${sizeKB}KB)`);
console.log(`   シーズン: ${saveState.season}年目 ${saveState.week}週  roster: ${saveState.roster.length}名  orgPop: ${saveState.orgPop.toFixed(1)}  資金: ${Math.round(saveState.funds)}万`);
console.log('');
console.log('── ブラウザ注入方法 ──');
console.log('DevTools > Console に貼り付け → リロード:');
console.log('');
console.log(`  fetch('/test/fixtures/${filename}').then(r=>r.text()).then(d=>{localStorage.setItem('wrestle_manager_autosave',d);location.reload()})`);
