'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame();

let state = Engine.createInitialState(42, true);
state = {
  ...state,
  rankings: ['org_s', 'org_a', 'org_b', 'player'].map((orgId, index) => ({
    orgId, rank: index + 1, rating: 100 - index,
    name: Engine.springTagLeague._orgName(state, orgId),
  })),
};
const announced = Engine.springTagLeague.announce(state);
assert.strictEqual(announced.cancelled, false);
state = { ...state, springTagLeague: announced };
const playerPair = Engine.springTagLeague.bestPair(state, state.roster);
state = Engine.springTagLeague.confirmPlayerTeam(state, playerPair.f1Id, playerPair.f2Id);

const simulated = Engine.springTagLeague.run(state, Engine.rng.create(42));
assert.strictEqual(simulated.cancelled, false);

// バグ条件を固定して再現: ブロック順位とは別に、決勝勝者を優勝として配布する。
const playerTeam = simulated.teams.find(team => team.orgId === 'player');
const aiFinalist = simulated.teams.find(team => team.orgId !== 'player');
const fallbackPlacement = team => {
  const standing = simulated.standings[team.block].find(row => row.teamId === team.teamId);
  return {
    teamId: team.teamId, orgId: team.orgId, block: team.block, blockRank: standing.rank,
    result: standing.rank === 2 ? 'third' : 'fourth',
    prizeKey: standing.rank === 2 ? 'blockSecond' : standing.rank === 3 ? 'blockThird' : 'blockFourth',
  };
};
const placements = simulated.teams.map(team => {
  if (team.teamId === playerTeam.teamId) return { ...fallbackPlacement(team), result: 'champion', prizeKey: 'champion' };
  if (team.teamId === aiFinalist.teamId) return { ...fallbackPlacement(team), result: 'runnerUp', prizeKey: 'runnerUp' };
  return fallbackPlacement(team);
});
const finalResult = {
  ...simulated,
  placements,
  championTeamId: playerTeam.teamId,
  runnerUpTeamId: aiFinalist.teamId,
  champion: 'player',
  runnerUp: aiFinalist.orgId,
  finalMatch: {
    ...simulated.finalMatch,
    teamAId: playerTeam.teamId,
    teamBId: aiFinalist.teamId,
    orgA: 'player',
    orgB: aiFinalist.orgId,
    teamA: playerTeam,
    teamB: aiFinalist,
    winner: 'teamA',
  },
};

const fundsBefore = state.funds;
const applied = Engine.springTagLeague.apply(state, finalResult).state;
const springFinance = applied.springTagLeague.revenueDistribution;
const playerFinance = springFinance.orgShares.find(share => share.orgId === 'player');
assert.strictEqual(springFinance.fixedRevenue, 7000, 'spring special-event revenue must be fixed at 7000');
assert.strictEqual(applied.funds - fundsBefore, Engine.springTagLeague.PRIZE.champion + playerFinance.amount,
  'final winner must receive both the champion prize and special-event income');
assert.strictEqual(playerFinance.placementBonusRate, 1, 'final winner must receive the 100% champion brand bonus');

const resultNewsEvent = applied._industryNewsEvents.find(event => event.type === 'springTagResult');
assert.ok(resultNewsEvent, 'spring tag result must enqueue an industry-news event');
assert.strictEqual(resultNewsEvent.characterId, playerTeam.f1Id,
  'spring tag result must keep a primary winner ID for legacy newspaper consumers');
assert.deepStrictEqual(resultNewsEvent.characterIds, [playerTeam.f1Id, playerTeam.f2Id],
  'spring tag result must preserve both champion IDs for the page-one team photo');

const newspaper = Engine.newspaper.generate(applied, Engine.rng.create(42012));
assert.strictEqual(newspaper.topStory.type, 'springTagResult');
assert.deepStrictEqual(newspaper.topStory.characterIds, [playerTeam.f1Id, playerTeam.f2Id],
  'generated newspaper must retain both champion IDs');

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
