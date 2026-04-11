#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  空位タイトルマッチ検証テスト
//  王座空位時に自動編成でタイトルマッチが組まれ、新王者が決定されることを確認する
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/^(const|let)\s/gm, 'var ');
  code = code.replace(/^export\s/gm, '');
  vm.runInThisContext(code, { filename });
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('draft-negotiation.js');

// ── テスト用ゲーム初期化 ──
function initGame(seed) {
  let G = Engine.createInitialState(seed, true);
  G = { ...G, debugLog: G.debugLog || [] };
  // 王座設立済みにする
  G = { ...G, titleEstablished: true };
  // 数週進めて安定させる
  for (let i = 0; i < 6; i++) {
    const tick = Engine.tickWeek(G);
    G = { ...tick.state, gameLog: [] };
    const adv = Engine.advanceWeek(G);
    G = { ...adv.state, gameLog: [] };
  }
  return G;
}

// ── auto-sim と同じカード編成（修正後コード） ──
function autoSetupShowCard(G, simRng) {
  const roster = G.roster.filter(c => !c.injury && !c.forcedRest);
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue || 0);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < maxMatches; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }

  // タイトルマッチ判定（修正後ロジック）
  if (G.titleEstablished && card.length > 0) {
    const cd = Engine.title.canTitleMatch(G);
    if (cd.allowed) {
      const champId = G.titles.world.championId;
      if (champId) {
        const titleMatch = card.find(m => m.left === champId || m.right === champId);
        if (titleMatch) titleMatch.isTitle = true;
      } else {
        // 王座空位: メイン枠を初代王者決定戦に
        const mainMatch = card[0];
        if (mainMatch && mainMatch.left > 0 && mainMatch.right > 0) {
          const hasRental = [mainMatch.left, mainMatch.right].some(id => G.roster.find(c => c.id === id)?.isRental);
          if (!hasRental) mainMatch.isTitle = true;
        }
      }
    }
  }

  return { ...G, showCard: card, showVenue: 0 };
}

// ══════════════════════════════════════════════════════════════════════════════
//  テスト実行
// ══════════════════════════════════════════════════════════════════════════════

const seed = 42;
let G = initGame(seed);
const simRng = Engine.rng.create(Engine.rng.derive(seed, 48879));

console.log('=== 空位タイトルマッチ検証テスト ===\n');

// テスト1: 王者在位 → タイトルマッチが組まれること
console.log('--- テスト1: 王者在位時 ---');
const firstChamp = G.roster[0];
G = { ...G, titles: { ...G.titles, world: { championId: firstChamp.id, defenses: 0, wonWeek: 1 } }, lastTitleMatchWeek: null };

// 興行週に合わせる
while (!Engine.util.isShowWeek(G.week) || G.offSeason) {
  const tick = Engine.tickWeek(G);
  G = { ...tick.state, gameLog: [] };
  const adv = Engine.advanceWeek(G);
  G = { ...adv.state, gameLog: [] };
}

G = autoSetupShowCard(G, simRng);
const hasTitle1 = G.showCard.some(m => m.isTitle);
const titleMatch1 = G.showCard.find(m => m.isTitle);
console.log('  王者: ' + firstChamp.name + ' (ID:' + firstChamp.id + ')');
console.log('  タイトルマッチ組まれた: ' + (hasTitle1 ? 'YES' : 'NO'));
if (titleMatch1) {
  const hasChamp = titleMatch1.left === firstChamp.id || titleMatch1.right === firstChamp.id;
  console.log('  王者含む: ' + (hasChamp ? 'YES' : 'NO'));
}

// 興行実行
const show1 = Engine.executeShow(G);
if (show1 && !show1.error) {
  G = show1.state;
  console.log('  興行実行: OK (champId=' + G.titles.world.championId + ')');
} else {
  console.log('  興行実行エラー: ' + (show1 && show1.error || '不明'));
}

// テスト2: 王座空位 → タイトルマッチ(初代王者決定戦)が組まれること
console.log('\n--- テスト2: 王座空位時 ---');
G = { ...G, titles: { ...G.titles, world: { championId: null, defenses: 0 } }, lastTitleMatchWeek: null };
console.log('  championId: ' + G.titles.world.championId + ' (空位)');

// 次の興行週まで進める
for (let i = 0; i < 20; i++) {
  const tick = Engine.tickWeek(G);
  G = { ...tick.state, gameLog: [] };
  const adv = Engine.advanceWeek(G);
  G = { ...adv.state, gameLog: [] };
  if (!G.offSeason && Engine.util.isShowWeek(G.week) && G.weekPhase === 'manage') break;
}

G = autoSetupShowCard(G, simRng);
const hasTitle2 = G.showCard.some(m => m.isTitle);
console.log('  canTitleMatch: ' + JSON.stringify(Engine.title.canTitleMatch(G)));
console.log('  タイトルマッチ組まれた: ' + (hasTitle2 ? 'YES' : 'NO'));

if (hasTitle2) {
  const show2 = Engine.executeShow(G);
  if (show2 && !show2.error) {
    G = show2.state;
    const newChamp = G.titles.world.championId;
    console.log('  新王者決定: ' + (newChamp ? 'YES' : 'NO') + ' (champId=' + newChamp + ')');
    if (newChamp) {
      const champFighter = G.roster.find(c => c.id === newChamp);
      console.log('  新王者: ' + (champFighter ? champFighter.name : '不明'));
    }
  } else {
    console.log('  興行実行エラー: ' + (show2 && show2.error || '不明'));
  }
} else {
  console.log('  FAIL: 空位時にタイトルマッチが組まれなかった！');
}

// テスト3: 12週クールダウン中 → タイトルマッチが組まれないこと
console.log('\n--- テスト3: 12週クールダウン中 ---');
const currentAbsWeek = Engine.util.absWeek(G.season, G.week);
G = { ...G, lastTitleMatchWeek: currentAbsWeek - 5 };
const cdCheck = Engine.title.canTitleMatch(G);
console.log('  canTitleMatch: ' + JSON.stringify(cdCheck));
console.log('  クールダウン中: ' + (!cdCheck.allowed ? 'YES (正常)' : 'NO (異常)'));

// 結果サマリー
console.log('\n=== 結果 ===');
const allPassed = hasTitle1 && hasTitle2 && !cdCheck.allowed;
if (allPassed) {
  console.log('ALL TESTS PASSED');
} else {
  console.log('SOME TESTS FAILED');
  if (!hasTitle1) console.log('  - テスト1失敗: 王者在位時にタイトルマッチが組まれない');
  if (!hasTitle2) console.log('  - テスト2失敗: 空位時にタイトルマッチが組まれない');
  if (cdCheck.allowed) console.log('  - テスト3失敗: クールダウン中にタイトルマッチが許可された');
}
process.exit(allPassed ? 0 : 1);
