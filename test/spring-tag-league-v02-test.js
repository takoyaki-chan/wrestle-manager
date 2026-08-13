'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame();

function rankedState(seed, eligibleCounts) {
  const base = Engine.createInitialState(seed, true);
  const order = ['player', 'org_s', 'org_a', 'org_b'];
  let state = {
    ...base,
    rankings: order.map((orgId, index) => ({
      orgId,
      name: Engine.springTagLeague._orgName(base, orgId),
      rating: 100 - index,
      rank: index + 1,
    })),
  };
  const limit = (roster, count) => (roster || []).map((fighter, index) => (
    index < count ? { ...fighter, injury: null, isRental: false } : { ...fighter, injury: { weeksLeft: 2 } }
  ));
  const playerPool = [...(state.roster || [])];
  (state.freeAgents || []).forEach(fighter => {
    if (playerPool.length < eligibleCounts[0] && !playerPool.some(row => row.id === fighter.id)) playerPool.push(fighter);
  });
  state = { ...state, roster: limit(playerPool, eligibleCounts[0]) };
  const aiOrgs = { ...state.aiOrgs };
  order.slice(1).forEach((orgId, index) => {
    aiOrgs[orgId] = { ...aiOrgs[orgId], roster: limit(aiOrgs[orgId].roster, eligibleCounts[index + 1]) };
  });
  return { ...state, aiOrgs };
}

// I-1: full 3/2/2/1, and all allowed 6-8 team fallback sizes.
const expectedByCount = [
  { roster: [6, 4, 4, 2], teams: 8, slots: [3, 2, 2, 1], cancelled: false },
  { roster: [4, 4, 4, 2], teams: 7, slots: [2, 2, 2, 1], cancelled: false },
  { roster: [4, 4, 2, 2], teams: 6, slots: [2, 2, 1, 1], cancelled: false },
  { roster: [2, 2, 2, 4], teams: 5, slots: [1, 1, 1, 2], cancelled: true },
];
expectedByCount.forEach((fixture, index) => {
  const state = rankedState(900 + index, fixture.roster);
  const announced = Engine.springTagLeague.announce(state);
  assert.strictEqual(announced.format, 2);
  assert.strictEqual(announced.teams.length, fixture.teams);
  assert.deepStrictEqual(['player', 'org_s', 'org_a', 'org_b'].map(id => announced.slotAllocation[id]), fixture.slots);
  assert.strictEqual(announced.cancelled, fixture.cancelled);
});

let state = rankedState(42, [8, 8, 8, 8]);
const announced = Engine.springTagLeague.announce(state);
assert.strictEqual(announced.cancelled, false);
assert.strictEqual(announced.teams.length, 8);
assert.deepStrictEqual(['player', 'org_s', 'org_a', 'org_b'].map(id => announced.slotAllocation[id]), [3, 2, 2, 1]);
assert.deepStrictEqual(Object.keys(announced.blocks).sort(), ['A', 'B']);
assert.strictEqual(announced.blocks.A.length, 4);
assert.strictEqual(announced.blocks.B.length, 4);

// Fable裁定: AIの2組目以降は未選出OVR上位で、全経路に掛け持ちがない。
['org_s', 'org_a', 'org_b'].forEach(orgId => {
  const teams = announced.teams.filter(team => team.orgId === orgId);
  const ids = teams.flatMap(team => [team.f1Id, team.f2Id]);
  assert.strictEqual(new Set(ids.map(String)).size, ids.length, `${orgId}: AI team overlap`);
});

state = { ...state, week: 12, springTagLeague: { ...announced, announcedSeason: state.season } };
const playerTeams = announced.teams.filter(team => team.orgId === 'player');
const playerPairs = Engine.springTagLeague.autoSelectPairs(state, state.roster, playerTeams.length);
state = Engine.springTagLeague.confirmPlayerTeams(state, playerPairs);
assert.strictEqual(state.springTagPhase, 'entry_done');
const duplicated = playerPairs.map(pair => ({ ...pair }));
duplicated[1] = { ...duplicated[1], f1Id: duplicated[0].f1Id };
assert.strictEqual(Engine.springTagLeague.confirmPlayerTeams(state, duplicated), state,
  'duplicate player assignment must be rejected without mutating state');

const firstRun = Engine.springTagLeague.run(state, Engine.rng.create(42));
const secondRun = Engine.springTagLeague.run(state, Engine.rng.create(999));
assert.strictEqual(firstRun.cancelled, false);
assert.strictEqual(firstRun.matches.length, 12);
assert.strictEqual(firstRun.finalMatch.round, 13);
assert.deepStrictEqual(firstRun.matches.map(match => match.seedTag), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
assert.strictEqual(firstRun.finalMatch.seedTag, 12);
assert.deepStrictEqual(
  { matches: firstRun.matches, standings: firstRun.standings, finalMatch: firstRun.finalMatch },
  { matches: secondRun.matches, standings: secondRun.standings, finalMatch: secondRun.finalMatch },
  'external rng argument must not disturb deterministic seed mapping'
);

// I-2/I-3: block-local standings only, no triple-org block, final=A1 vs B1.
assert.ok(!Array.isArray(firstRun.standings), 'v0.2 must not create a global 1-8 standings array');
['A', 'B'].forEach(block => {
  assert.ok(firstRun.standings[block].length === 4);
  const orgCounts = {};
  firstRun.blocks[block].forEach(teamId => {
    const team = firstRun.teams.find(row => row.teamId === teamId);
    orgCounts[team.orgId] = (orgCounts[team.orgId] || 0) + 1;
  });
  assert.ok(Object.values(orgCounts).every(count => count <= 2), `${block}: same-org triple`);
});
assert.strictEqual(firstRun.finalMatch.teamAId, firstRun.standings.A[0].teamId);
assert.strictEqual(firstRun.finalMatch.teamBId, firstRun.standings.B[0].teamId);
assert.notStrictEqual(firstRun.standings.A[0].block, firstRun.standings.B[0].block);

// v0.2 §4: 決勝引き分けは勝ち点→接戦ボーナス数→総MQ（直接対決なし）。
const tieBase = { points: 7, mqBonusCount: 1, mqTotal: 180 };
assert.deepStrictEqual(
  Engine.springTagLeague.decideFinalDraw(state, { ...tieBase, points: 8 }, tieBase),
  { winner: 'teamA', tieBreakDecision: 'points' }
);
assert.deepStrictEqual(
  Engine.springTagLeague.decideFinalDraw(state, tieBase, { ...tieBase, mqBonusCount: 2 }),
  { winner: 'teamB', tieBreakDecision: 'mqBonus' }
);
assert.deepStrictEqual(
  Engine.springTagLeague.decideFinalDraw(state, { ...tieBase, mqTotal: 181 }, tieBase),
  { winner: 'teamA', tieBreakDecision: 'mqTotal' }
);
assert.deepStrictEqual(
  Engine.springTagLeague.decideFinalDraw(state, tieBase, tieBase),
  Engine.springTagLeague.decideFinalDraw(state, tieBase, tieBase),
  'complete equality fallback must remain deterministic'
);

// I-4/I-5: every fighter appears once; finalists inherit the last block condition.
const allIds = firstRun.teams.flatMap(team => [team.f1Id, team.f2Id]);
assert.strictEqual(new Set(allIds.map(String)).size, allIds.length);
[firstRun.finalMatch.teamAId, firstRun.finalMatch.teamBId].forEach(teamId => {
  const last = firstRun.matches.filter(match => match.teamAId === teamId || match.teamBId === teamId).at(-1);
  assert.strictEqual(Math.round(firstRun.finalMatch.conditionBefore[teamId]), last.conditionAfter[teamId]);
});

// I-7: all block matches and the final reproduce winner/MQ/turns through Replay.
const applied = Engine.springTagLeague.apply(state, firstRun).state;
assert.strictEqual(applied.springTagLeague.format, 2);
firstRun.matches.forEach((canonical, matchIndex) => {
  const replay = Engine.springTagLeague.simulateReplay(applied, applied.springTagLeague.matches[matchIndex], { matchIndex });
  assert.ok(replay && replay.result.frames.length > 0);
  assert.deepStrictEqual(
    { winner: replay.result.winner, mq: replay.result.mq, turns: replay.result.turns },
    { winner: canonical.winner, mq: canonical.mq, turns: canonical.turns }
  );
});
const finalReplay = Engine.springTagLeague.simulateReplay(applied, applied.springTagLeague.finalMatch, { isFinal: true });
assert.deepStrictEqual(
  { winner: finalReplay.result.winner, mq: finalReplay.result.mq, turns: finalReplay.result.turns },
  { winner: firstRun.finalMatch.winner, mq: firstRun.finalMatch.mq, turns: firstRun.finalMatch.turns }
);

// I-6/I-9: champion-only popularity/title and unchanged career event keys.
const championTeam = firstRun.teams.find(team => team.teamId === firstRun.championTeamId);
const championRosterBefore = championTeam.orgId === 'player' ? state.roster : state.aiOrgs[championTeam.orgId].roster;
const championRosterAfter = championTeam.orgId === 'player' ? applied.roster : applied.aiOrgs[championTeam.orgId].roster;
assert.deepStrictEqual(applied.bestTagTeam, {
  f1Id: championTeam.f1Id, f2Id: championTeam.f2Id,
  orgId: championTeam.orgId, awardedSeason: state.season,
});
[championTeam.f1Id, championTeam.f2Id].forEach(fighterId => {
  const before = championRosterBefore.find(row => Engine.springTagLeague._sameId(row.id, fighterId));
  const after = championRosterAfter.find(row => Engine.springTagLeague._sameId(row.id, fighterId));
  assert.strictEqual(after.popularity, Math.min(100, (before.popularity || 0) + 10));
});
assert.deepStrictEqual(
  { champion: Engine.springTagLeague.PRIZE.champion, runnerUp: Engine.springTagLeague.PRIZE.runnerUp,
    blockSecond: Engine.springTagLeague.PRIZE.blockSecond, blockThird: Engine.springTagLeague.PRIZE.blockThird,
    blockFourth: Engine.springTagLeague.PRIZE.blockFourth },
  { champion: 1500, runnerUp: 800, blockSecond: 400, blockThird: 200, blockFourth: 0 }
);
const achievement = (applied.achievementItems[championTeam.orgId] || []).find(row => row.id === `springTag_${state.season}`);
assert.strictEqual(achievement.originalPt, 8);
assert.strictEqual(Engine.awards.calcHofPoints({ history: [
  { type: 'springTagLeague', season: state.season, result: 'champion', partnerId: 999 },
] }), 3);

// I-6: 対戦ポイントはv0.1と同じく**各団体1回だけ**(最良成績のチームで代表)。
// チーム単位で積むと3枠団体がブロック敗退時に-8×3を食う歪みが出る(Fableマージレビューで修正)。
{
  const stCfg = (typeof BATTLE_POINT_CFG !== 'undefined' && BATTLE_POINT_CFG.springTag)
    || { champion: 12, runnerUp: 5, third: 0, fourth: -8 };
  const priority = { champion: 0, runnerUp: 1, third: 2, fourth: 3 };
  const bestByOrg = {};
  applied.springTagLeague.placements.forEach(row => {
    if (!bestByOrg[row.orgId] || priority[row.result] < priority[bestByOrg[row.orgId].result]) bestByOrg[row.orgId] = row;
  });
  ['player', 'org_s', 'org_a', 'org_b'].forEach(orgId => {
    const before = (state.battlePoints || {})[orgId] || 0;
    const delta = (applied.battlePoints[orgId] || 0) - before;
    const expected = bestByOrg[orgId] ? (stCfg[bestByOrg[orgId].result] || 0) : 0;
    assert.strictEqual(delta, expected, `${orgId} の対戦ポイントは最良成績1回分だけ動く`);
    assert.ok(delta >= stCfg.fourth && delta <= stCfg.champion,
      `${orgId} の変動が1チーム分の範囲を出ない(重複加算の禁止)`);
  });
  assert.strictEqual(
    (applied.battlePoints[championTeam.orgId] || 0) - ((state.battlePoints || {})[championTeam.orgId] || 0),
    stCfg.champion, '優勝団体は+12を1回だけ受け取る'
  );
}
firstRun.teams.forEach(team => {
  const roster = team.orgId === 'player' ? applied.roster : applied.aiOrgs[team.orgId].roster;
  [team.f1Id, team.f2Id].forEach((fighterId, memberIndex) => {
    const fighter = roster.find(row => Engine.springTagLeague._sameId(row.id, fighterId));
    const event = fighter.careerRecord.history.find(row => row.type === 'springTagLeague' && row.season === state.season);
    assert.deepStrictEqual(Object.keys(event).sort(), ['partnerId', 'result', 'season', 'type']);
    assert.strictEqual(event.partnerId, memberIndex === 0 ? team.f2Id : team.f1Id);
  });
});

// I-8: formatなしの完了済み4チーム記録もReplay可否判定で落ちない。
const legacy = {
  ...applied,
  springTagLeagueCompletedSeason: undefined,
  springTagLeague: {
    ...applied.springTagLeague,
    format: undefined,
    teams: applied.springTagLeague.teams.slice(0, 4),
    championTeamId: undefined,
  },
};
assert.doesNotThrow(() => Engine.springTagLeague.isCompletedThisSeason(legacy));
assert.doesNotThrow(() => Engine.springTagLeague.isReplayReady(legacy));

console.log('spring-tag-league-v02-test: ok');
