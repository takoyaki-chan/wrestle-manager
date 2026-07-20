'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame();

function fighter(id, name) {
  return { id, name, pw: 60, sp: 60, te: 60, st: 60, mn: 60, style: 'Allround', personality: 'normal', archetype: 'normal' };
}

function state() {
  return {
    season: 2,
    week: 9,
    rngSeed: 1234,
    roster: [fighter(1, 'Player')],
    aiOrgs: { org_a: { id: 'org_a', name: 'Away', roster: [fighter(2, 'Opponent')] } },
    matchupLog: [],
    relationships: {
      '1>2': { bond: 50, rivalry: 10 },
      '2>1': { bond: 50, rivalry: 10 },
    },
    relationshipCounters: {},
  };
}

function context(winner) {
  return {
    mq: 70,
    winner,
    hpA: { final: winner === 'lose' ? 0 : 35, max: 100 },
    hpB: { final: winner === 'win' ? 0 : 35, max: 100 },
    turns: 12,
    stage: 'challenge',
    isTitleMatch: false,
    rivalryResolved: true,
    rivalryResolutionValue: 0,
    injuredId: null,
    isCareerBestA: false,
    isCareerBestB: false,
    losingStreakA: 0,
    losingStreakB: 0,
    isProveModeA: false,
    isProveModeB: false,
    isCrossOrg: true,
    isChallengeShowMatch: true,
    ovrA: 60,
    ovrB: 60,
  };
}

{
  const ctx = context('win');
  const next = Engine.relationships.applyMatchResult(state(), 1, 2, ctx, Engine.rng.create(10));
  const winnerView = ctx._challengeRelationshipDelta[1];
  const loserView = ctx._challengeRelationshipDelta[2];
  assert.ok(winnerView.rivalry >= 2 && winnerView.rivalry <= 6, 'winner rivalry should rise only slightly');
  assert.ok(loserView.rivalry >= 20 && loserView.rivalry <= 30, 'loser resentment should rise sharply');
  assert.ok(winnerView.bond <= -1 && winnerView.bond >= -3, 'winner bond should fall slightly');
  assert.ok(loserView.bond <= -8 && loserView.bond >= -14, 'loser bond should fall sharply');
  assert.notStrictEqual(next.relationships['1>2'].rivalry, 0, 'challenge must suppress rivalry resolution');
}

{
  const ctx = context('draw');
  Engine.relationships.applyMatchResult(state(), 1, 2, ctx, Engine.rng.create(20));
  Object.values(ctx._challengeRelationshipDelta).forEach(delta => {
    assert.ok(delta.rivalry >= 10 && delta.rivalry <= 16, 'draw rivalry should rise on both sides');
    assert.ok(delta.bond <= -4 && delta.bond >= -7, 'draw bond should fall on both sides');
  });
}

{
  const ctx = { ...context('win'), mq: 90, ovrA: 45, ovrB: 65 };
  Engine.relationships.applyMatchResult(state(), 1, 2, ctx, Engine.rng.create(30));
  const loserView = ctx._challengeRelationshipDelta[2];
  assert.ok(loserView.rivalry >= 28 && loserView.rivalry <= 45,
    'high-quality underdog upset should add extra resentment without the ordinary cross-org cap');
}

console.log('challenge-show-relationship-test: ok');
