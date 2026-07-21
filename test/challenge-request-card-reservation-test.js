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
  requesterId: away[0].id,
  opponentId: own[0].id,
  requesterOrgId: 'AWAY',
  opponentOrgId: 'player',
  requesterOrgName: 'Away Org',
  opponentOrgName: 'Player Org',
  teamAIds: away.map(f => f.id),
  teamBIds: own.slice(0, 3).map(f => f.id),
  isInverse: true,
};

function makeState(showVenue = 8) {
  return {
    season: 2,
    week: 2,
    showVenue,
    roster: own.map(f => ({ ...f })),
    aiOrgs: { AWAY: { roster: away.map(f => ({ ...f })) } },
    _pendingIncomingChallengeMatch: { ...pending },
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
    [[101, 1], [102, 2], [103, 3]],
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

(function releasesOnlyStaleAwayReservations() {
  const booking = {
    requesterOrgId: 'player', opponentOrgId: 'AWAY',
    teamAIds: [1, 2, 3], teamBIds: [101, 102, 103],
    acceptedSeason: 2, acceptedWeek: 2,
  };
  const recent = Engine.challengeRequest.releaseExpiredAwayBooking({
    season: 2, week: 9, _pendingAwayChallengeMatch: booking,
  });
  assert.ok(recent._pendingAwayChallengeMatch, 'away bookings remain active during the eight-week grace period');

  const expired = Engine.challengeRequest.releaseExpiredAwayBooking({
    season: 2, week: 10, _pendingAwayChallengeMatch: booking,
  });
  assert.ok(!expired._pendingAwayChallengeMatch, 'stale away bookings must release their reserved wrestlers');
  assert.strictEqual(expired._expiredAwayChallengeNotice.age, 8, 'expiry keeps diagnostic context for the restored save');
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

(function fixedSeasonalShowsDoNotConsumeChallengeBookings() {
  const special = makeState();
  special.week = 12;
  assert.strictEqual(Engine.challengeRequest.reserveScheduledMatches(special, []), null);
  assert.ok(special._pendingIncomingChallengeMatch, 'booking remains pending outside an ordinary show');

  const ppv = makeState();
  ppv.week = 48;
  assert.strictEqual(Engine.challengeRequest.reserveScheduledMatches(ppv, []), null);
})();

(function challengeLettersAreSampledOnlyAtOrdinaryShowHeads() {
  assert.strictEqual(Engine.challengeRequest._isSamplingWeek({ week: 3 }), false);
  assert.strictEqual(Engine.challengeRequest._isSamplingWeek({ week: 4 }), true);
  assert.strictEqual(Engine.challengeRequest._isSamplingWeek({ week: 8 }), true);
  assert.strictEqual(Engine.challengeRequest._isSamplingWeek({ week: 12 }), false, 'seasonal show keeps its fixed card');
  assert.strictEqual(Engine.challengeRequest._isSamplingWeek({ week: 48 }), false, 'PPV keeps its fixed card');
})();

(function challengeCooldownsUseTheFortyEightWeekSeasonClock() {
  const self = own[0];
  const other = away[0];
  const pairKey = Engine.challengeRequest._pairKey(self.id, other.id);
  const state = makeState();
  state.season = 2;
  state.week = 4;
  state.challengeRequest = {
    pendingThisWeek: null,
    acceptedThisSeason: 0,
    perOrgThisSeason: {},
    cdByFighter: { [self.id]: Engine.util.absWeek(1, 30) },
    cdByPair: { [pairKey]: { lastWeek: Engine.util.absWeek(1, 30), coolWeeks: 36 } },
  };
  assert.strictEqual(
    Engine.challengeRequest._passesCD(state, self, other),
    false,
    'a cross-season pair cooldown must still be active after only 22 show weeks'
  );

  state.challengeRequest.cdByFighter[self.id] = Engine.util.absWeek(1, 1);
  state.challengeRequest.cdByPair[pairKey] = { lastWeek: Engine.util.absWeek(1, 1), coolWeeks: 36 };
  assert.strictEqual(
    Engine.challengeRequest._passesCD(state, self, other),
    true,
    'a cross-season cooldown must expire after the configured active weeks'
  );
})();

(function reservesOneOffChallengeAsMainEvent() {
  const state = makeState();
  delete state._pendingIncomingChallengeMatch;
  state._pendingIncomingB3Match = {
    fighterId: own[0].id,
    challenger: { ...away[0] },
    orgId: 'AWAY',
    orgName: 'Away Org',
  };
  const reserved = Engine.challengeRequest.reserveScheduledSingleMatch(state, [
    { left: own[0].id, right: own[3].id, isTitle: true },
    { left: own[1].id, right: own[4].id },
  ]);
  assert.ok(reserved);
  assert.strictEqual(reserved.card[0].left, own[0].id);
  assert.strictEqual(reserved.card[0].right, away[0].id);
  assert.ok(reserved.card[0]._b3ChallengeMatch && reserved.card[0]._crMatchLocked);
  assert.ok(!reserved.card.slice(1).some(m => m.left === own[0].id || m.right === own[0].id));
})();

(function removesAwayTravelersFromExistingSinglesAndTags() {
  const cleared = Engine.challengeRequest.removeFightersFromCard([
    { left: 1, right: 4, isTitle: true },
    { matchType: 'tag', teamA: { fighter1: 2, fighter2: 5 }, teamB: { fighter1: 6, fighter2: 3 } },
  ], [1, 2, 3]);
  assert.deepStrictEqual(cleared[0], { left: 0, right: 4, isTitle: false });
  assert.deepStrictEqual(cleared[1].teamA, { fighter1: 0, fighter2: 5 });
  assert.deepStrictEqual(cleared[1].teamB, { fighter1: 6, fighter2: 0 });
})();

(function detectsAwayConflictWithoutConsumingTheIncomingBooking() {
  const state = makeState();
  state._pendingAwayChallengeMatch = {
    teamAIds: [own[0].id, own[1].id, own[2].id],
    teamBIds: away.map(f => f.id),
  };
  assert.strictEqual(
    Engine.challengeRequest.hasAwayParticipantConflict(state, [own[0].id, 999]),
    true,
    'a B3 match sharing either side with the away card must wait'
  );
  assert.strictEqual(
    Engine.challengeRequest.hasAwayParticipantConflict(state, [own[4].id, 999]),
    false
  );
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
