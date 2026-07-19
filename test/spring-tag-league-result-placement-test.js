'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame();

let state = Engine.createInitialState(42, true);
const announced = Engine.springTagLeague.announce(state);
assert.strictEqual(announced.cancelled, false);
state = { ...state, springTagLeague: announced };
const playerPair = Engine.springTagLeague.bestPair(state, state.roster);
state = Engine.springTagLeague.confirmPlayerTeam(state, playerPair.f1Id, playerPair.f2Id);

const simulated = Engine.springTagLeague.run(state, Engine.rng.create(42));
assert.strictEqual(simulated.cancelled, false);

// バグ条件を固定して再現: プレイヤーはリーグ2位だが、決勝でリーグ1位に勝つ。
const aiFinalist = simulated.teams.find(team => team.orgId !== 'player');
const remaining = simulated.teams.filter(team => team.orgId !== 'player' && team.orgId !== aiFinalist.orgId);
const standings = simulated.standings.map(standing => {
  if (standing.orgId === aiFinalist.orgId) return { ...standing, rank: 1 };
  if (standing.orgId === 'player') return { ...standing, rank: 2 };
  return { ...standing, rank: standing.orgId === remaining[0].orgId ? 3 : 4 };
});
const playerTeam = simulated.teams.find(team => team.orgId === 'player');
const finalResult = {
  ...simulated,
  standings,
  champion: 'player',
  runnerUp: aiFinalist.orgId,
  third: remaining[0].orgId,
  fourth: remaining[1].orgId,
  finalMatch: {
    ...simulated.finalMatch,
    orgA: aiFinalist.orgId,
    orgB: 'player',
    teamA: aiFinalist,
    teamB: playerTeam,
    winner: 'teamB',
  },
};

const fundsBefore = state.funds;
const applied = Engine.springTagLeague.apply(state, finalResult).state;
assert.strictEqual(applied.funds - fundsBefore, Engine.springTagLeague.PRIZE.champion,
  'league-second final winner must receive the champion prize');

for (const fighterId of [playerTeam.f1Id, playerTeam.f2Id]) {
  const fighter = applied.roster.find(item => item.id === fighterId);
  const event = fighter.careerRecord.history.find(item =>
    item.type === 'springTagLeague' && item.season === state.season
  );
  assert.strictEqual(event.result, 'champion', 'final winner must record champion regardless of league rank');
}

const runnerRoster = applied.aiOrgs[aiFinalist.orgId].roster;
for (const fighterId of [aiFinalist.f1Id, aiFinalist.f2Id]) {
  const fighter = runnerRoster.find(item => item.id === fighterId);
  const event = fighter.careerRecord.history.find(item =>
    item.type === 'springTagLeague' && item.season === state.season
  );
  assert.strictEqual(event.result, 'runnerUp', 'final loser must record runnerUp regardless of league rank');
}

console.log('spring-tag-league-result-placement-test: ok');
