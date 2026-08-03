'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

const retired = (id, season) => ({
  id,
  name: `Retired ${id}`,
  careerRecord: { history: [{ type: 'retire', season }], totalTitleWins: 0, totalDefenses: 0 },
});

(function testFinalizingOnlyTheStaleBufferKeepsCurrentSeasonRetirees() {
  const stale = retired(201, 2);
  const current = retired(202, 4);
  const state = {
    season: 4,
    retiredFighters: [stale, current],
    retiredIds: [201, 202],
    retiredSeasons: { 201: 2, 202: 4 },
    allHallOfFame: { player: [], org_s: [], org_a: [], org_b: [] },
    hallOfFame: [],
  };

  const next = Engine.awards.finalizeRetireeBuffer(state, [stale]);
  assert.deepStrictEqual(next.retiredFighters.map(f => f.id), [202], 'current-season retiree stays until awards');
  assert.ok(next.retiredIds.includes(201), 'recycle cooldown ID survives buffer cleanup');
  assert.strictEqual(next.retiredSeasons[201], 2, 'recycle cooldown season survives buffer cleanup');
})();

(function testLoadRepairClearsAStaleRetirementBuffer() {
  const state = Engine.createInitialState(90210, true);
  const id = state.dormantPool[0].id;
  state.season = 4;
  state.dormantPool = state.dormantPool.filter(entry => entry.id !== id);
  state.retiredFighters = [retired(id, 2)];
  state.retiredIds = [...(state.retiredIds || []), id];
  state.retiredSeasons = { ...(state.retiredSeasons || {}), [id]: 2 };

  const repaired = Engine.saveDoctor.repairOnLoad(state).state;
  assert.ok(!repaired.retiredFighters.some(f => f.id === id), 'load repair clears previous-season retirement records');
  assert.ok(repaired.retiredIds.includes(id), 'load repair retains the recycle cooldown ID');

  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
  assert.ok(source.includes('stale_retirement_buffer_cleared:'), 'load repair has a stale-buffer marker');
  assert.ok(source.includes('retiredSeason < currentSeason'), 'current-season retirement records are preserved');
  assert.ok(source.includes('Engine.awards.finalizeRetireeBuffer(s);'), 'new-season transition also clears an interrupted buffer');
})();

console.log('retirement-buffer-lifecycle-test: ok');
