#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Auto-Simulation Script
//  UIなしでゲームロジックを高速実行し、validateGameStateの違反を検出する。
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
loadAsGlobal('engine.js');

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

  // タイトルマッチ判定（確立済み＆クールダウンOK＆王者がカードにいる場合）
  if (G.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(G);
    if (cd.allowed) {
      const champId = G.titles.world.championId;
      const titleMatch = card.find(m => m.left === champId || m.right === champId);
      if (titleMatch) {
        titleMatch.isTitle = true;
      }
    }
  }

  return { ...G, showCard: card, showVenue: venueIdx };
}

// 選択型イベントのランダム応答
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

// スカウトイベント自動処理
function autoHandleScoutEvent(G, simRng) {
  if (G.weekPhase !== 'scoutEvent') return G;
  // FA から1-2名をランダムに獲得（キャップに空きがある場合）
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
    newRoster.push({ ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance', wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0, injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 }, intensive: false, intensiveWeeks: 0 });
    newFA = newFA.filter(c => c.id !== f.id);
    G = { ...G, funds: G.funds - cost };
  }
  return { ...G, roster: newRoster, freeAgents: newFA };
}

// transientフィールドを一括消化するヘルパー
const TRANSIENT_KEYS = [
  '_pendingChoiceEvent', '_pendingNotifEvent', '_pendingLargeEvent',
  '_pendingTeamSpirit', '_pendingGrowthEvents', '_pendingMotivationRetirements',
  '_pendingCoachReport', '_flavorEvents', '_pendingEliteTicket',
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
function runSimulation(seed, seasons) {
  const violations = [];
  const errors = [];
  let totalWeeks = 0;
  let gameOverCount = 0;
  let currentSeed = seed;
  const MAX_ITER = seasons * 60; // 安全弁（1シーズン≒52+4週）

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
      if (G.weekPhase === 'ppvEntry') {
        G = { ...G, ppvPhase: 'locked' };
      }
      if (G.weekPhase === 'ppvShow') {
        G = { ...G, ppvPhase: 'tv' };
      }
      if (G.weekPhase === 'ppvTV') {
        G = { ...G, ppvPhase: null };
      }
      if (G.weekPhase === 'event' || G.weekPhase === 'transfer' || G.weekPhase === 'scoutEvent') {
        // スカウトでFA獲得を試みる
        if (G.weekPhase === 'scoutEvent') {
          G = autoHandleScoutEvent(G, simRng);
        }
      }

      // ── 興行週: カード自動編成→executeShow ──
      if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') {
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

      // ── tickWeek（週次パイプライン） ── validateGameStateはtickWeek内で実行される
      const tickResult = Engine.tickWeek(G);
      G = { ...tickResult.state, gameLog: [] };
      G = clearTransients(G);
      G = collectViolations(G, violations);

      // ── advanceWeek（次の週へ） ──
      const advResult = Engine.advanceWeek(G);
      G = { ...advResult.state, gameLog: [] };
      totalWeeks++;

      // advanceWeek後にもvalidate
      G = Engine.validateGameState(G);
      G = collectViolations(G, violations);

      // ── シーズン遷移検出 ──
      if (!G.offSeason && G.week === 1 && G.season > 1) {
        completed++;
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

  return { violations, errors, totalWeeks, gameOverCount };
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

console.log('--------------------------------------');
console.log(`Total violations: ${result.violations.length} (${uniqueViolations.length} unique)`);
console.log(`Total errors: ${result.errors.length}`);
console.log(`Total weeks simulated: ${result.totalWeeks}`);
console.log(`Game overs: ${result.gameOverCount}`);
console.log(`Elapsed: ${elapsed}s`);
console.log(`Result: ${uniqueViolations.length === 0 && result.errors.length === 0 ? 'ALL CLEAR ✓' : 'ISSUES FOUND'}`);
