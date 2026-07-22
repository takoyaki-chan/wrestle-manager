'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

const managementSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
[
  ['springTagLeague', 'standard'],
  ['juniorTournament', 'standard'],
  ['autumnWar', 'standard'],
  ['ppvGrandFinal', 'premium'],
  ['tenchosen', 'premium'],
].forEach(([eventId, tier]) => {
  const pattern = new RegExp(`eventId:\\s*['"]${eventId}['"][\\s\\S]{0,80}tier:\\s*['"]${tier}['"]`);
  assert.ok(pattern.test(managementSource), `${eventId} must use the shared ${tier} finance tier`);
});

const state = Engine.createInitialState(5150, true);
const playerIds = state.roster.slice(0, 4).map(f => f.id);
const rivalIds = state.aiOrgs.org_s.roster.slice(0, 4).map(f => f.id);
const baseEntries = [
  { entryId: 'p1', orgId: 'player', memberIds: [playerIds[0], playerIds[1]], placement: 'champion', appearances: 4, wins: 4 },
  { entryId: 's1', orgId: 'org_s', memberIds: [rivalIds[0], rivalIds[1]], placement: 'runnerUp', appearances: 4, wins: 3 },
];
const doubledEntries = [
  ...baseEntries,
  { entryId: 'p2', orgId: 'player', memberIds: [playerIds[2], playerIds[3]], placement: 'semiFinal', appearances: 2, wins: 1 },
  { entryId: 's2', orgId: 'org_s', memberIds: [rivalIds[2], rivalIds[3]], placement: 'semiFinal', appearances: 2, wins: 1 },
];

const standard = Engine.specialEventFinance.calculate(state, {
  eventId: 'testStandard', tier: 'standard', entries: baseEntries, matchMqs: [70, 75, 80],
});
const doubled = Engine.specialEventFinance.calculate(state, {
  eventId: 'testDoubled', tier: 'standard', entries: doubledEntries, matchMqs: [70, 75, 80],
});
const premium = Engine.specialEventFinance.calculate(state, {
  eventId: 'testPremium', tier: 'premium', entries: baseEntries, matchMqs: [70, 75, 80],
});

assert.strictEqual(standard.fixedRevenue, 7000, 'three standard special events use fixed 7000 revenue');
assert.strictEqual(premium.fixedRevenue, 11000, 'PPV and Tenchosen use fixed 11000 revenue');
assert.deepStrictEqual(standard.pools.gate, { equal: 2100, appearances: 4900 },
  'standard event revenue uses a 30% equal and 70% appearance split');
assert.deepStrictEqual(premium.pools.gate, { equal: 3300, appearances: 7700 },
  'premium event revenue uses the same 30% equal and 70% appearance split');
assert.strictEqual(doubled.fixedRevenue, standard.fixedRevenue,
  'doubling entries must not inflate the fixed special-event revenue');
assert.ok(doubled.brandRevenue > standard.brandRevenue,
  'doubling entries must add each new team brand income');
assert.strictEqual(doubled.entryShares.length, doubledEntries.length,
  'finance must preserve a separate brand calculation for every entry, including same-org teams');
assert.strictEqual(doubled.orgShares.find(s => s.orgId === 'player').entryCount, 2,
  'multiple teams from the same organization must aggregate after entry-level calculation');
assert.strictEqual(doubled.entryShares.reduce((sum, share) => sum + share.gateAmount, 0), 7000,
  'entry expansion must only redistribute the fixed event revenue');
assert.strictEqual(doubled.entryShares.reduce((sum, share) => sum + share.amount, 0), doubled.totalPool,
  'event total must equal fixed revenue plus all entry brand incomes');
assert.strictEqual(standard.entryShares.find(s => s.entryId === 'p1').placementBonusRate, 1,
  'champion receives a 100% result bonus on ordinary brand income');

const fundsBefore = state.funds;
const credited = Engine.specialEventFinance.creditPlayer(state, doubled);
const playerIncome = doubled.orgShares.find(s => s.orgId === 'player').amount;
assert.strictEqual(credited.state.funds - fundsBefore, playerIncome,
  'all same-org entry shares must be credited once as an organization total');

console.log('special-event-finance-test: ok');
