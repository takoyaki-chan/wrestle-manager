#!/usr/bin/env node
// 派閥人数変遷チェック: 各シーズンの派閥サイズとメンバー推移を追跡する
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

// console.log を抑制（[WM Faction]以外のノイズを消す）
const origLog = console.log;
const factionLogs = [];
console.log = () => {};
console.warn = () => {};

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('factions.js');
loadAsGlobal('draft-negotiation.js');

console.log = origLog;

const args = process.argv.slice(2);
const targetSeasons = parseInt(args[0], 10) || 30;
const seed = args[1] ? parseInt(args[1], 10) : 42;

origLog(`=== Faction Size Tracking (${targetSeasons} seasons, seed=${seed}) ===`);

let G = Engine.createInitialState(seed, true);
G = { ...G, debugLog: [] };

// テスト用: ロスターを14人に拡充（派閥発生条件 minRosterSize:10 を満たすため）
{
  const rng = Engine.rng.create(seed ^ 0x1234);
  const existingIds = new Set(G.roster.map(c => c.id));
  const candidates = (ALL_CHARS || []).filter(c => !existingIds.has(c.id)).slice(0, 12);
  const newMembers = candidates.map(template => {
    const f = Engine.makeChar(template, rng, G.orgId);
    return { ...f, orgJoinWeek: 1, contractOVR: Engine.util.ov(f), contractPop: f.popularity || 0 };
  });
  G = { ...G, roster: [...G.roster, ...newMembers], funds: 5000, rosterCap: 16, orgPop: 30 };
}

// シミュレーション中: WM Faction ログのみ収集
console.log = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('[WM Faction]')) factionLogs.push(msg);
};
console.warn = () => {};

const simRng = Engine.rng.create(seed ^ 0xFACE);

// テスト用: 派閥を直接注入 + 非メンバーのbondを65〜80に設定
{
  const sorted = [...G.roster].filter(c => !c.isRental).sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const leader = sorted[0];
  const members = [leader.id, sorted[1].id, sorted[2].id];
  const memberSet = new Set(members);
  // 非メンバーのbondを派閥メンバーに対して65〜80に引き上げ（加入判定テスト用）
  const newRel = { ...(G.relationships || {}) };
  const rng2 = Engine.rng.create(seed ^ 0xBEEF);
  for (const c of sorted.slice(3)) {  // メンバー以外
    for (const mId of members) {
      const bondVal = 65 + Engine.rng.float(rng2) * 15; // 65〜80
      // 非対称2軸: 両方向に設定
      newRel[`${c.id}>${mId}`] = { ...(newRel[`${c.id}>${mId}`] || { bond: 50, rivalry: 0 }), bond: bondVal };
      newRel[`${mId}>${c.id}`] = { ...(newRel[`${mId}>${c.id}`] || { bond: 50, rivalry: 0 }), bond: bondVal };
    }
  }
  G = { ...G, relationships: newRel };
  G = Engine.factions.createFaction(G, leader.id, members, { type: 'loyal' });
  origLog(`[初期派閥] ${leader.name}組 (${members.length}人) を注入 / 非メンバー bond 65-80 に設定`);
}

function autoSetupShow(G) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = (typeof VENUES !== 'undefined' ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < maxMatches; i += 2) {
    card.push({ left: shuffled[i].id, right: shuffled[i + 1].id, isTitle: false });
  }
  G = { ...G, showCard: card };
  const result = Engine.executeShow(G);
  return result.state;
}

// シーズン変遷記録
const history = [];

for (let season = 1; season <= targetSeasons; season++) {
  // 通常週処理
  for (let week = 1; week <= 16; week++) {
    G = Engine.tickWeek(G).state;
    if (G.currentPhase === 'show') {
      G = autoSetupShow(G);
    }
  }
  // シーズン末
  G = Engine.advanceWeek(G).state;

  const rosterSize = (G.roster || []).filter(c => !c.isRental).length;
  const factions = G.factions || [];

  // デバッグ: bond分布確認（season 3のみ）
  if ((season === 5 || season === 10 || season === 20) && G.relationships) {
    // bond値をrelキーから直接取得
    const allVals = Object.values(G.relationships).map(r => Math.round(r.bond)).filter(b => !isNaN(b));
    allVals.sort((a, b) => b - a);
    origLog(`[S3 bond] max:${allVals[0]} top5:${allVals.slice(0,5).join(',')} 60超:${allVals.filter(b=>b>=60).length}件 総ペア:${allVals.length}`);

    // F01条件チェック
    const f01 = Engine.factions.checkLoyalFormationConditions(G);
    origLog(`[S3 F01条件] eligible:${f01.eligible}${f01.leaderId ? ` leader:${f01.leaderId} followers:${f01.followerIds?.length}` : ''}`);
  }

  const record = {
    season,
    rosterSize,
    factionCount: factions.length,
    sizes: factions.map(f => f.memberIds.length),
  };
  history.push(record);
}

console.log = origLog;

// 結果表示
origLog('\n--- 派閥サイズ変遷 ---');
origLog('Season | Roster | 派閥数 | サイズ');
origLog('-------|--------|--------|-------');
for (const r of history) {
  const sizesStr = r.sizes.length === 0 ? '(なし)' : r.sizes.join(', ');
  origLog(`  ${String(r.season).padStart(3)}  |  ${String(r.rosterSize).padStart(3)}   |   ${r.factionCount}   | ${sizesStr}`);
}

// 加入ログ集計
const joinCount = factionLogs.filter(l => l.includes('joined')).length;
const leaveCount = factionLogs.filter(l => l.includes('left')).length;
origLog(`\n加入イベント合計: ${joinCount}件 / 離脱: ${leaveCount}件`);

const maxSize = Math.max(0, ...history.flatMap(r => r.sizes));
origLog(`最大派閥サイズ: ${maxSize}人`);
const withFaction = history.filter(r => r.factionCount > 0).length;
origLog(`派閥が存在したシーズン: ${withFaction}/${targetSeasons}`);
