const assert = require('assert');
const { Engine } = require('../src/management.js');

function baseState(overrides = {}) {
  return {
    season: 2,
    week: 11,
    offSeason: false,
    weekPhase: 'manage',
    roster: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
      { id: 4, name: 'D' },
    ],
    showCard: [],
    lastShowResults: [],
    weeklyFinance: { income: 0, expense: 0, details: [] },
    ...overrides,
  };
}

{
  const repair = Engine.saveDoctor.repairProgressionState(baseState({ weekPhase: 'showExec' }));
  assert.strictEqual(repair.changed, true);
  assert.strictEqual(repair.state.weekPhase, 'manage');
  assert.ok(repair.changes.includes('weekPhase_showExec_recovered'));
}

{
  const repair = Engine.saveDoctor.repairProgressionState(baseState({ week: 11, weekPhase: 'showPrep' }));
  assert.strictEqual(repair.changed, true);
  assert.strictEqual(repair.state.weekPhase, 'manage');
  assert.ok(repair.changes.includes('weekPhase_showPrep_non_show_week'));
}

{
  const repair = Engine.saveDoctor.repairProgressionState(baseState({
    week: 12,
    weekPhase: 'showPrep',
    coachAssign: { c1: [1, 99, 2] },
    _pendingReclaim: { titleType: 'world', challengerId: 99 },
    showCard: [
      null,
      { left: 1, right: 99, isTitle: true },
      { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 77 } },
      { matchType: 'tag' },
    ],
  }));
  assert.strictEqual(repair.state.weekPhase, 'showPrep');
  assert.deepStrictEqual(repair.state.showCard[0], { left: 0, right: 0, isTitle: false });
  assert.deepStrictEqual(repair.state.showCard[1], { left: 1, right: 0, isTitle: false });
  assert.strictEqual(repair.state.showCard[2].teamB.fighter2, 0);
  assert.deepStrictEqual(repair.state.showCard[3].teamA, { fighter1: 0, fighter2: 0 });
  assert.deepStrictEqual(repair.state.coachAssign, { c1: [1, 2] });
  assert.strictEqual(repair.state._pendingReclaim, null);
  assert.ok(repair.changes.includes('showCard_stale_refs_removed'));
  assert.ok(repair.changes.includes('coachAssign_stale_refs_removed'));
  assert.ok(repair.changes.includes('pendingReclaim_stale_ref_removed'));
}

{
  const repair = Engine.saveDoctor.repairProgressionState(baseState({
    offSeason: true,
    weekPhase: 'settled',
  }));
  assert.strictEqual(repair.changed, true);
  assert.strictEqual(repair.state.weekPhase, 'offseason');
  assert.ok(repair.changes.some(c => c.startsWith('offseason_phase_recovered')));
}

{
  const result = Engine.executeShow(baseState({
    week: 12,
    showCard: [null, { matchType: 'tag' }, { left: 99, right: 1, isTitle: true }],
  }));
  assert.strictEqual(typeof result.error, 'string');
}

console.log('progression-repair-test: ok');
