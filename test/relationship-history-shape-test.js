'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

(function testInitialStateUsesUnifiedHistoryStore() {
  const state = Engine.createInitialState(42, true);
  assert.deepStrictEqual(state.relationshipHistory, {
    betrayalRecord: [],
    retiredRivalries: [],
  });
})();

(function testLegacyArrayMigratesWithoutLosingRetiredRivalries() {
  const legacyEntry = { id1: 1, id2: 2, reason: 'retirement' };
  const normalized = Engine.relationships.normalizeHistoryStore([legacyEntry]);
  assert.deepStrictEqual(normalized.betrayalRecord, []);
  assert.deepStrictEqual(normalized.retiredRivalries, [legacyEntry]);
})();

(function testObjectStorePreservesBothHistoryKindsAndExtraFields() {
  const betrayal = { departerId: 3 };
  const retired = { id1: 4, id2: 5 };
  const normalized = Engine.relationships.normalizeHistoryStore({
    betrayalRecord: [betrayal],
    retiredRivalries: [retired],
    futureField: 'kept',
  });
  assert.deepStrictEqual(normalized.betrayalRecord, [betrayal]);
  assert.deepStrictEqual(normalized.retiredRivalries, [retired]);
  assert.strictEqual(normalized.futureField, 'kept');
})();

(function testFlagInitAlsoRepairsLegacySaves() {
  const legacyEntry = { id1: 6, id2: 7, reason: 'retirement' };
  const state = { relationshipHistory: [legacyEntry] };
  Engine.relationships.flags._ensureInit(state);
  assert.deepStrictEqual(state.relationshipHistory.retiredRivalries, [legacyEntry]);
  assert.deepStrictEqual(state.relationshipHistory.betrayalRecord, []);
})();

(function testRetirementArchiveUsesNestedStore() {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const match = appSource.match(/function archiveRetiredRivalryState[\s\S]*?\n}\n\/\/ ── App Commands/);
  assert(match, 'archiveRetiredRivalryState source must be extractable');
  const functionSource = match[0].replace(/\n\/\/ ── App Commands[\s\S]*$/, '');
  const archive = new Function('Engine', `${functionSource}; return archiveRetiredRivalryState;`)(Engine);
  const betrayal = { departerId: 9 };
  const fighter = { id: 1, name: 'Retiree', age: 36 };
  const state = {
    season: 3,
    week: 48,
    roster: [{ id: 2, name: 'Rival', age: 28 }],
    retiredFighters: [fighter],
    freeAgents: [],
    aiOrgs: {},
    relationships: {
      '1>2': { bond: 30, rivalry: 80 },
      '2>1': { bond: 35, rivalry: 75 },
    },
    rivalries: { '1-2': { tier: 2, matches: 5 } },
    relationshipHistory: { betrayalRecord: [betrayal], retiredRivalries: [] },
  };

  const archived = archive(state, fighter);
  assert.deepStrictEqual(archived.relationshipHistory.betrayalRecord, [betrayal]);
  assert.strictEqual(archived.relationshipHistory.retiredRivalries.length, 1);
  assert.strictEqual(archived.relationshipHistory.retiredRivalries[0].retiredFighterId, 1);
  assert.strictEqual(archived.relationships['1>2'], undefined);
  assert.strictEqual(archived.rivalries['1-2'], undefined);
})();

(function testRelmapReadsOnlyRetiredRivalryArray() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
  const functionSource = source.match(/function _relmapBuildLinks[\s\S]*?\n}\n\nfunction _relmap/);
  assert(functionSource, '_relmapBuildLinks source must be extractable');
  assert(functionSource[0].includes('normalizeHistoryStore(G.relationshipHistory)'));
  assert(functionSource[0].includes('historyStore.retiredRivalries'));
  assert(!functionSource[0].includes('const history = G.relationshipHistory || []'));
})();

console.log('relationship-history-shape-test: ok');
