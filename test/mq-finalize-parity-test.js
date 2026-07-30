#!/usr/bin/env node
'use strict';

// MQ再設計P3d(§3.8a)時点の新契約に合わせた経路一致テスト。
// P3b/P3c以降、finalize側の外部加算は「crowd(venueHeat×engagement)」のみに整理され、
// 因縁/タイトル/trust/バフ/ラストランはリング内化(buildRingInOptsのovBuffチャネル)済み
// ——finalizeの責務からは外れている。旧契約(crowdVenueBonus/milestoneBuffs直読み)を
// 前提にした期待値は破綻するため、UI経路(App._finalizeShowImpl)とheadless経路
// (Engine.executeShow)が同一入力から同一MQ/inventoryを返すことを新契約で検証し直す。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js',
].forEach(loadAsGlobal);

function fighter(id, overrides = {}) {
  return {
    id,
    name: `F${id}`,
    pw: 90,
    sp: 90,
    te: 90,
    st: 90,
    mn: 90,
    condition: 80,
    trust: 50,
    popularity: 90,
    traits: [],
    ...overrides,
  };
}

function normalizedInventory(inventory) {
  const { path, ...rest } = inventory;
  return rest;
}

function assertNormalParity(label, state, matchResult, slot, options, profile) {
  const before = JSON.stringify(state);
  const uiContext = Engine.mq.buildNormalContext(state, matchResult, slot, {
    ...options,
    path: 'App._finalizeShowImpl',
  });
  const headlessContext = Engine.mq.buildNormalContext(state, matchResult, slot, {
    ...options,
    path: 'Engine.executeShow',
  });
  const ui = Engine.mq.finalize(state, matchResult, uiContext, profile);
  const headless = Engine.mq.finalize(state, matchResult, headlessContext, profile);
  assert.strictEqual(ui.mq, headless.mq, `${label}: final MQ`);
  assert.deepStrictEqual(
    normalizedInventory(ui.mqInventory),
    normalizedInventory(headless.mqInventory),
    `${label}: inventory`);
  assert.strictEqual(JSON.stringify(state), before, `${label}: state mutated`);
  return ui;
}

// 全シナリオ共通: popularity90で normPop=(90-35)/55=1.0 に揃え、engagementの手計算を単純化する。
const left = fighter(1, {
  trust: 20,
  lastRun: { remainingWeeks: 4 },
  traits: ['名勝負製造機'],
});
const right = fighter(2, { traits: ['引き出し上手'] });
const tagA2 = fighter(3);
const tagB2 = fighter(4, { trust: 10 });
const state = {
  roster: [left, right, tagA2, tagB2],
  rivalries: {},
  relationships: {},
};
const rivalryLevel = { tier: 4, resolvedType: 'bitter' };

// ── シナリオ1: 通常シングル・フルスタック(因縁+タイトル+メイン+ラストラン) ──
// raw = 0.5 + 0.5*1.0 + 0.15(rivalry) + 0.2(title) + 0.12(main) + 0.25(lastRun) = 1.72
// → lastRun+main上限(1.4)でクランプ。crowd = round(6×1.4) = 8。mq = 96+8 = 104。
const single = assertNormalParity(
  'normal single full stack',
  state,
  { mq: 96, left, right },
  { left: 1, right: 2, isTitle: true },
  { roster: state.roster, rivalryLevel, matchIndex: 0, venueHeat: 6 },
  'normal-single');
assert.strictEqual(single.mq, 104);
assert.strictEqual(single.mqInventory.engagement, 1.4);
assert.strictEqual(single.mqInventory.crowd, 8);
assert.strictEqual(single.consumedNextMatchMqBuff, false);
assert.strictEqual(single.mqInventory.cap, null);
assert.strictEqual(single.mqInventory.upperClampApplied, false);
assert.strictEqual(single.mqInventory.freshness, undefined);

// ── シナリオ2: next_match_mqバフ消費フラグ(非メイン・因縁/タイトルなし) ──
// raw = 0.5 + 0.5*1.0 + 0.25(lastRun) = 1.25 → 非メインlastRun上限(1.25)ちょうど。
// crowd = round(6×1.25) = 8。mq = 90+8 = 98。nextMatchMqApplied:true はconsumedNextMatchMqBuffへ伝播。
const secondMatch = assertNormalParity(
  'next-match buff already consumed',
  state,
  { mq: 90, left, right },
  { left: 1, right: 2 },
  {
    roster: state.roster,
    rivalryLevel: null,
    matchIndex: 1,
    venueHeat: 6,
    nextMatchMqApplied: true,
  },
  'normal-single');
assert.strictEqual(secondMatch.mq, 98);
assert.strictEqual(secondMatch.mqInventory.engagement, 1.25);
assert.strictEqual(secondMatch.consumedNextMatchMqBuff, true);

// ── シナリオ3: 下限クランプ(観客熱マイナス・低人気) ──
// avgPop=10 → normPop=0 → raw=0.5(下限0.35は超えるためクランプなし)。
// crowd = round(-3×0.5) = -1。preLowerClampMq = 5-1 = 4 < 5 → lowerClampHit。
const low = assertNormalParity(
  'lower clamp only',
  {
    ...state,
    roster: [fighter(11, { trust: 10, popularity: 10 }), fighter(12, { trust: 10, popularity: 10 })],
  },
  { mq: 5, left: { id: 11 }, right: { id: 12 } },
  { left: 11, right: 12 },
  { matchIndex: 1, rivalryLevel: null, venueHeat: -3 },
  'normal-single');
assert.strictEqual(low.mq, 5);
assert.strictEqual(low.mqInventory.engagement, 0.5);
assert.strictEqual(low.mqInventory.crowd, -1);
assert.strictEqual(low.mqInventory.lowerClampHit, true);

// ── シナリオ4: タッグprofile(メイン・タイトルはタッグでは常に0扱い) ──
// 4名平均popularity=90 → normPop=1.0。isTitleはisTagで常にfalse、lastRunFighterIdは
// 4名中left(lastRun保持)がヒットしhasLastRun=true。
// raw = 0.5 + 0.5*1.0 + 0.12(main) + 0.25(lastRun) = 1.37 (lastRun+main上限1.4未満のためクランプなし)。
// crowd = round(6×1.37) = 8。mq = 99+8 = 107。
const tag = assertNormalParity(
  'normal tag profile',
  state,
  { mq: 99, matchType: 'tag' },
  {
    matchType: 'tag',
    teamA: { fighter1: 1, fighter2: 3 },
    teamB: { fighter1: 2, fighter2: 4 },
    isTitle: true,
  },
  { roster: state.roster, rivalryLevel: null, matchIndex: 0, venueHeat: 6 },
  'normal-tag');
assert.strictEqual(tag.mq, 107);
assert.strictEqual(tag.mqInventory.engagement, 1.37);
assert.strictEqual(tag.mqInventory.crowd, 8);
assert.strictEqual(tag.mqInventory.title, 0);
assert.strictEqual(tag.mqInventory.milestoneMqBoost, 0);
assert.strictEqual(tag.mqInventory.trust, 0);

// ── シナリオ5: ppv/ai-show/rawはcrowd加算なし(リング内化がシム側で完結する外部scope) ──
const baseResult = { mq: 97, left, right };
const ppv = Engine.mq.finalize(state, baseResult, {
  rivalryLevel: null,
  participantFighters: [left, right],
}, 'ppv');
const aiShow = Engine.mq.finalize(state, baseResult, {
  rivalryLevel: null,
  participantFighters: [left, right],
}, 'ai-show');
const raw = Engine.mq.finalize(state, baseResult, {
  rivalryLevel: null,
  participantFighters: [left, right],
}, 'raw');
assert.strictEqual(ppv.mq, 97);
assert.strictEqual(aiShow.mq, 97);
assert.strictEqual(raw.mq, 97);

console.log('MQ finalize parity: PASS');
console.log('Profiles: normal-single / normal-tag / ppv / ai-show / raw');
