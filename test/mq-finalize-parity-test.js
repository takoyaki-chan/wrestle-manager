#!/usr/bin/env node
'use strict';

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
  milestoneBuffs: [
    { type: 'mq_boost', amount: 3 },
    { type: 'next_match_mq', amount: 3, pair: [1, 2] },
  ],
};
const rivalryLevel = { tier: 4, mqBonus: 5 };

const single = assertNormalParity(
  'normal single full stack',
  state,
  { mq: 96, left, right, rivalryBonus: rivalryLevel },
  { left: 1, right: 2, isTitle: true },
  { roster: state.roster, rivalryLevel, matchIndex: 0, crowdVenueBonus: 6 },
  'normal-single');
assert.strictEqual(single.mq, 121.47);
assert.strictEqual(single.consumedNextMatchMqBuff, true);
assert.strictEqual(single.mqInventory.cap, null);
assert.strictEqual(single.mqInventory.upperClampApplied, false);
assert.strictEqual(single.mqInventory.freshness, undefined);

const secondMatch = assertNormalParity(
  'next-match buff already consumed',
  state,
  { mq: 96, left, right, rivalryBonus: rivalryLevel },
  { left: 1, right: 2, isTitle: true },
  {
    roster: state.roster,
    rivalryLevel,
    matchIndex: 1,
    crowdVenueBonus: 6,
    allowNextMatchMq: false,
  },
  'normal-single');
assert.strictEqual(secondMatch.mqInventory.nextMatchMq, 0);
assert.strictEqual(secondMatch.consumedNextMatchMqBuff, false);

const low = assertNormalParity(
  'lower clamp only',
  { ...state, roster: [fighter(11, { trust: 10 }), fighter(12, { trust: 10 })], milestoneBuffs: [] },
  { mq: 5, left: { id: 11 }, right: { id: 12 } },
  { left: 11, right: 12 },
  { matchIndex: 1, crowdVenueBonus: -3 },
  'normal-single');
assert.strictEqual(low.mq, 5);
assert.strictEqual(low.mqInventory.lowerClampHit, true);

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
  { roster: state.roster, matchIndex: 0, crowdVenueBonus: 6 },
  'normal-tag');
assert.strictEqual(tag.mq, 110);
assert.strictEqual(tag.mqInventory.title, 0);
assert.strictEqual(tag.mqInventory.milestoneMqBoost, 0);
assert.strictEqual(tag.mqInventory.trust, 0);

const baseResult = { mq: 97, left, right };
const ppv = Engine.mq.finalize(state, baseResult, {
  rivalryBonus: 5,
  participantFighters: [left, right],
}, 'ppv');
const aiShow = Engine.mq.finalize(state, baseResult, {
  rivalryBonus: 5,
  participantFighters: [left, right],
}, 'ai-show');
const raw = Engine.mq.finalize(state, baseResult, {
  rivalryBonus: 5,
  participantFighters: [left, right],
}, 'raw');
assert.strictEqual(ppv.mq, 102);
assert.strictEqual(aiShow.mq, 102);
assert.strictEqual(raw.mq, 97);

console.log('MQ finalize parity: PASS');
console.log('Profiles: normal-single / normal-tag / ppv / ai-show / raw');
