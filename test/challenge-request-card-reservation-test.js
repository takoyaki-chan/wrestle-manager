'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

function fighter(id, name) {
  return {
    id, name,
    pw: 65, sp: 65, te: 65, st: 65, mn: 65,
    popularity: 50, condition: 100, traits: [],
  };
}

const own = Array.from({ length: 7 }, (_, i) => fighter(i + 1, `Own ${i + 1}`));
const away = Array.from({ length: 3 }, (_, i) => fighter(101 + i, `Away ${i + 1}`));
const pending = {
  requesterId: own[0].id,
  opponentId: away[0].id,
  requesterOrgId: 'PLAYER',
  opponentOrgId: 'AWAY',
  requesterOrgName: 'Player Org',
  opponentOrgName: 'Away Org',
  teamAIds: own.slice(0, 3).map(f => f.id),
  teamBIds: away.map(f => f.id),
  isInverse: false,
};

function makeState(showVenue = 8) {
  return {
    season: 2,
    week: 1,
    showVenue,
    roster: own.map(f => ({ ...f })),
    aiOrgs: { AWAY: { roster: away.map(f => ({ ...f })) } },
    _pendingChallengeMatch: { ...pending },
    relationships: {},
    factions: [],
    titles: { world: { championId: null } },
    orgPop: 50,
  };
}

(function reservesTopThreeInsideVenueLimitAndRemovesDuplicates() {
  const state = makeState(8); // 7-match venue
  const original = [
    { left: 1, right: 4 },
    { left: 2, right: 5 },
    { left: 3, right: 6 },
    { left: 4, right: 5 },
    { left: 6, right: 7 },
    { left: 0, right: 0 },
    { left: 0, right: 0 },
  ];
  const reserved = Engine.challengeRequest.reserveScheduledMatches(state, original);

  assert.ok(reserved, 'healthy accepted challenge should be reservable');
  assert.strictEqual(Engine.util.getCardWeight(reserved.card), 7, 'challenge matches must stay inside the venue cap');
  assert.strictEqual(reserved.card.length, 7);
  assert.deepStrictEqual(
    reserved.card.slice(0, 3).map(m => [m.left, m.right]),
    [[1, 101], [2, 102], [3, 103]],
    'main, semi-main and third-from-top must be the three challenge matches'
  );
  assert.ok(reserved.card.slice(0, 3).every(m => m._crMatchLocked && m.isCRMatch));

  const allIds = reserved.card.flatMap(m => m.matchType === 'tag'
    ? [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2]
    : [m.left, m.right]).filter(Boolean);
  for (const id of reserved.scheduled.reservedIds) {
    assert.strictEqual(allIds.filter(x => x === id).length, 1, `fighter ${id} must work only one match`);
  }

  const again = Engine.challengeRequest.reserveScheduledMatches(state, reserved.card);
  assert.deepStrictEqual(again.card, reserved.card, 're-rendering show prep must keep the reservation stable');
})();

(function challengeSeriesCanFillAThreeMatchVenueWithoutOverflow() {
  const state = makeState(0);
  const reserved = Engine.challengeRequest.reserveScheduledMatches(state, []);
  assert.strictEqual(Engine.util.getCardWeight(reserved.card), 3);
  assert.strictEqual(reserved.card.length, 3);
  assert.ok(reserved.card.every(m => m._crMatchLocked));
})();

(function unavailableParticipantCancelsReservation() {
  const state = makeState();
  state.roster[0].forcedRest = true;
  assert.strictEqual(Engine.challengeRequest.reserveScheduledMatches(state, []), null);
})();

(function challengeAppealBonusIsDedicatedAndVisibleInBreakdown() {
  const state = makeState();
  const baseContext = {
    isTitle: false,
    isFanExpect: false,
    isChallengeRequest: false,
    pendingClashBonus: 0,
    isFirstMeet: false,
    freshnessCount: 0,
  };
  const base = Engine.attendanceV2.calcMatchAppeal(own[0], away[0], baseContext, state);
  const challenge = Engine.attendanceV2.calcMatchAppeal(
    own[0], away[0], { ...baseContext, isChallengeRequest: true }, state
  );
  const breakdown = Engine.attendanceV2.calcMatchAppealBreakdown(
    own[0], away[0], { ...baseContext, isChallengeRequest: true }, state
  );

  assert.ok(
    Math.abs((challenge - base) - MATCH_APPEAL_CONFIG.challengeRequestAppeal) < 1e-9,
    'challenge appeal should add exactly the configured amount'
  );
  assert.strictEqual(breakdown.challengeRequestBonus, 12);
})();

console.log('challenge-request-card-reservation-test: ok');
