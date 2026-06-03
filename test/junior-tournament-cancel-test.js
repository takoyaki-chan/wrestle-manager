const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame();

function fighter(id, age = 20) {
  return {
    id,
    name: `F${id}`,
    age,
    pw: 50,
    sp: 50,
    te: 50,
    st: 50,
    mn: 50,
    style: 'Allround',
    injury: null,
  };
}

const state = {
  season: 2,
  week: Engine.juniorTournament.WEEK,
  weekPhase: 'juniorTournament',
  rngSeed: 12345,
  orgName: 'Test Org',
  roster: [fighter(1), fighter(2), fighter(3)],
  aiOrgs: {},
};

const selection = Engine.juniorTournament.select(state);
assert.strictEqual(selection.cancelled, true, 'selection should cancel when fewer than 4 eligible fighters exist');

const result = Engine.juniorTournament.run(state, selection.participants, Engine.rng.create(1));
assert.strictEqual(result.cancelled, true, 'run should return a cancelled result for invalid participant lists');

const applied = Engine.juniorTournament.apply(state, result);
assert.strictEqual(applied.state.weekPhase, 'manage', 'cancelled tournament should restore manage phase');
assert.strictEqual(applied.state._juniorTournamentSelection, undefined, 'cancelled tournament should clear selection');
assert.strictEqual(applied.state._juniorTournamentResult.cancelled, true, 'cancelled tournament should be marked processed');

const weekAdvanceState = {
  ...state,
  week: Engine.juniorTournament.WEEK - 1,
  weekPhase: 'weekSummary',
  _juniorTournamentResult: null,
  _juniorTournamentSelection: null,
};
const advanced = Engine.advanceWeek(weekAdvanceState);
assert.strictEqual(advanced.state.week, Engine.juniorTournament.WEEK, 'advance should move into tournament week');
assert.strictEqual(advanced.state.weekPhase, 'manage', 'insufficient participants should not enter tournament phase');
assert.strictEqual(advanced.state._juniorTournamentSelection, undefined, 'advance cancellation should clear selection');
assert.strictEqual(advanced.state._juniorTournamentResult.cancelled, true, 'advance cancellation should mark tournament processed');
assert.strictEqual(advanced.state._juniorTournamentResult.reason, 'insufficientParticipants');

console.log('junior-tournament-cancel-test: ok');
