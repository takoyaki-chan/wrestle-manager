const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

function makeFighter(id, name, ovr, popularity) {
  return {
    id,
    name,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    style: 'Allround',
    popularity,
    condition: 80,
    traits: [],
  };
}

(function testB3CooldownCandidateGate() {
  const state = Engine.createInitialState(7777, true);
  const absWeek = Engine.util.absWeek(state.season, state.week);
  const roster = state.roster || [];
  const rng = Engine.rng.create(12345);

  const cooled = {
    ...state,
    orgPop: 80,
    lastLargeEventWeek: absWeek - 10,
    lastB3ChallengeWeek: absWeek - 8,
  };
  const event = Engine.eventSystem.generateLargeEvent(rng, cooled, roster);

  assert.notStrictEqual(event && event.type, 'B3', 'B3 should respect its dedicated cooldown');
})();

(function testB3ReducedPopularityInfluenceKeepsOvrGapMeaningful() {
  const strongLowPop = makeFighter(1, 'Strong', 80, 10);
  const weakStar = makeFighter(2, 'Popular Weak', 65, 100);

  let strongWins = 0;
  let weakWins = 0;
  for (let i = 0; i < 1000; i++) {
    const rng = Engine.rng.create(Engine.rng.derive(98765, i));
    const result = Engine.battle.simulateMatch(
      strongLowPop,
      weakStar,
      rng,
      2,
      { popularityInfluence: 0.35 }
    );
    if (result.winner === 'left') strongWins++;
    if (result.winner === 'right') weakWins++;
  }

  assert.ok(strongWins > weakWins, `OVR +15 should not be overturned by popularity alone: ${strongWins}-${weakWins}`);
  assert.ok(strongWins >= 650, `OVR +15 should remain a clear advantage in B3: ${strongWins}-${weakWins}`);
})();

console.log('b3-challenge-balance-test: ok');
