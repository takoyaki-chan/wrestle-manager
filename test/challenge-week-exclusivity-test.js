'use strict';

// 同一週の挑戦系コンテナ排他 (2026-08-13 Keisuke報告):
// 別団体からの受け挑戦と自団体からの遠征が同じ週に同時発生し、
// 同じ選手が同一週に複数回試合できた。
// 不変条件:
//   I-1 同一週にプレイヤー選手が遠征シリーズと自団体興行の両方で試合しない
//   I-2 後発の予約は消滅せず次の通常興行週へ繰り越される
//   I-3 既存の8週失効ルール(releaseExpiredAwayBooking)は変わらない

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

const resolve = s => Engine.challengeRequest.resolveWeeklyChallengeContainer(s);

const awayBooking = (season, week) => ({
  requesterOrgId: 'player', opponentOrgId: 'AWAY',
  teamAIds: [1, 2, 3], teamBIds: [101, 102, 103],
  acceptedSeason: season, acceptedWeek: week,
});
const incomingBooking = (season, week) => ({
  requesterOrgId: 'AWAY', opponentOrgId: 'player', isInverse: true,
  teamAIds: [101, 102, 103], teamBIds: [1, 2, 3],
  acceptedSeason: season, acceptedWeek: week,
});

(function singleContainerCases() {
  assert.strictEqual(resolve(null), null);
  assert.strictEqual(resolve({ season: 3, week: 6 }), null);
  assert.strictEqual(resolve({ season: 3, week: 6, _pendingAwayChallengeMatch: awayBooking(3, 4) }), 'away');
  assert.strictEqual(resolve({ season: 3, week: 6, _pendingIncomingChallengeMatch: incomingBooking(3, 4) }), 'incoming');
  assert.strictEqual(resolve({
    season: 3, week: 6,
    _pendingIncomingB3Match: { fighterId: 1, challenger: { id: 999 }, acceptedSeason: 3, acceptedWeek: 5 },
  }), 'incoming');
})();

(function firstAcceptedWinsTheWeek() {
  const awayFirst = {
    season: 3, week: 6,
    _pendingAwayChallengeMatch: awayBooking(3, 4),
    _pendingIncomingChallengeMatch: incomingBooking(3, 5),
  };
  assert.strictEqual(resolve(awayFirst), 'away', '先着の遠征が今週のコンテナになる');

  const incomingFirst = {
    season: 3, week: 6,
    _pendingAwayChallengeMatch: awayBooking(3, 5),
    _pendingIncomingChallengeMatch: incomingBooking(3, 4),
  };
  assert.strictEqual(resolve(incomingFirst), 'incoming', '先着の受け挑戦が勝ち、遠征は繰り越し');

  const tie = {
    season: 3, week: 6,
    _pendingAwayChallengeMatch: awayBooking(3, 5),
    _pendingIncomingChallengeMatch: incomingBooking(3, 5),
  };
  assert.strictEqual(resolve(tie), 'away', '同着は従来の消化順どおり遠征が先');
})();

(function b3AndUnifiedContainersArbitrateToo() {
  const b3 = { event: {}, fighterId: 1, challenger: { id: 999 }, acceptedSeason: 3, acceptedWeek: 3 };
  assert.strictEqual(resolve({
    season: 3, week: 6,
    _pendingAwayChallengeMatch: awayBooking(3, 4),
    _pendingIncomingB3Match: b3,
  }), 'incoming', '挑戦状(B3)も受理週で裁定される');

  assert.strictEqual(resolve({
    season: 3, week: 6,
    _pendingUnifiedAwayMatch: { championId: 900, challengerId: 1, issuedAbsWeek: Engine.util.absWeek(3, 5) },
    _pendingIncomingB3Match: { ...b3, acceptedSeason: 3, acceptedWeek: 6 },
  }), 'away', '統一王座系の予約は issuedAbsWeek で受理週を読む');
})();

(function consumedAwayLocksTheRestOfTheWeek() {
  // I-1: 遠征を今週すでに消化済みなら、受け挑戦は(先着でも)今週は持ち越し
  const s = {
    season: 3, week: 6,
    _awayChallengeUsedIds: { season: 3, week: 6, ids: [1, 2, 3] },
    _pendingIncomingChallengeMatch: incomingBooking(3, 1),
  };
  assert.strictEqual(resolve(s), 'away');
  assert.strictEqual(Engine.challengeRequest.hasAwayRunThisWeek(s), true);

  // 先週の遠征実績は今週に影響しない
  const lastWeek = {
    season: 3, week: 6,
    _awayChallengeUsedIds: { season: 3, week: 5, ids: [1, 2, 3] },
    _pendingIncomingChallengeMatch: incomingBooking(3, 1),
  };
  assert.strictEqual(resolve(lastWeek), 'incoming');
  assert.strictEqual(Engine.challengeRequest.hasAwayRunThisWeek(lastWeek), false);
})();

(function legacyBookingsCountAsOldest() {
  const s = {
    season: 3, week: 6,
    _pendingAwayChallengeMatch: { ...awayBooking(3, 4), acceptedSeason: undefined, acceptedWeek: undefined },
    _pendingIncomingChallengeMatch: incomingBooking(3, 1),
  };
  assert.strictEqual(resolve(s), 'away', '受理週の無い旧データは最古(先着)扱い');
})();

(function arbitrationIsPureAndKeepsBothBookings() {
  // I-2: 裁定は読み取り専用。後発の予約を消さない
  const s = {
    season: 3, week: 6,
    _pendingAwayChallengeMatch: awayBooking(3, 5),
    _pendingIncomingChallengeMatch: incomingBooking(3, 4),
  };
  const before = JSON.stringify(s);
  resolve(s);
  assert.strictEqual(JSON.stringify(s), before, '裁定関数は state を変更してはならない');
})();

(function carriedAwayBookingFollowsTheExistingGracePeriod() {
  // I-3: 持ち越した遠征予約は既存の8週失効ルールの内側では消えない(外側では従来どおり失効)
  const carried = Engine.challengeRequest.releaseExpiredAwayBooking({
    season: 3, week: 9, _pendingAwayChallengeMatch: awayBooking(3, 5),
  });
  assert.ok(carried._pendingAwayChallengeMatch, '繰り越し中の遠征予約は8週の猶予内なら残る');

  const expired = Engine.challengeRequest.releaseExpiredAwayBooking({
    season: 3, week: 13, _pendingAwayChallengeMatch: awayBooking(3, 5),
  });
  assert.ok(!expired._pendingAwayChallengeMatch, '8週を超えた予約は従来どおり失効する');
})();

// ── 呼び出し元の配線: 予約成立地点・消化地点のすべてが同じ裁定を通ること ──
const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const uiCommon = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');
const uiRender = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');

assert.ok((app.match(/weeklyChallengeSide !== 'incoming'/g) || []).length >= 2,
  'executeShow: 受け挑戦が先着の週は両方の遠征(統一王座/敵地)を見送ること');
assert.ok((app.match(/weeklyChallengeSide !== 'away'/g) || []).length >= 4,
  'executeShow: 遠征の週は 果たし状予約・統一王座迎撃・挑戦状(B3)・果たし状消化 の4箇所を持ち越すこと');
assert.ok((app.match(/!awayRanThisWeek/g) || []).length >= 2,
  'executeShow: 遠征を1本消化済みの週は2本目の遠征を見送ること');
assert.ok(app.includes('hasAwayRunThisWeek?.(G)) return false'),
  '_startAwayChallengeShow: 直接呼び出しに対する保険を残すこと');
assert.ok(app.includes('awayUsedThisWeek'),
  'executeShow: 今週遠征済みの選手をカードから外す I-1 保険を持つこと');
assert.ok((uiCommon.match(/ChallengeSide !== 'incoming'/g) || []).length >= 4,
  'startShowPrep/resumeShowPrep: 受け挑戦が先着の週は移動演出ごと遠征を見送ること');
assert.ok((uiCommon.match(/AwayRan &&/g) || []).length >= 4,
  'startShowPrep/resumeShowPrep: 遠征消化済みの週は2本目の遠征を見送ること');
assert.ok((uiRender.match(/weeklyChallengeSide !== 'away'/g) || []).length >= 3,
  'renderShowPrep: 遠征の週は 果たし状・統一王座迎撃・挑戦状(B3) の予約をスキップすること');
assert.ok(uiRender.includes('incomingDeferredByAway'),
  'renderShowPrep: 持ち越しをプレイヤーに知らせるバナーを出すこと(破棄ではない)');

console.log('challenge-week-exclusivity-test: ok');
