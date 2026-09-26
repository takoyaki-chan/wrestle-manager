'use strict';

// test/helpers/b3-show.js — 挑戦状(B3)の試合を実プレイと同じ手順で1興行分通す(テスト・計測の共通部品)
//
// App.executeShow と同じく、受けた挑戦状を次の通常興行のメインに固定して挑戦者(他団体の選手)を一時ゲストで入れ、
// 試合をシミュレーションし(本体と同じく試合ごとに新品の rng)、Engine.show.finalize を実プレイの指定と
// hooks(app.js から取り出した本物の _finalizeHookGuests。成長イベント・経歴の刻印は第4段 4-A から finalize の中)で通す。
// test/b3-guest-return-test.js の runB3Show と同じ組み立て。
//
// guestMode:
//   'game'     — いまのゲームの作り方(Engine.challengeRequest.reserveScheduledSingleMatch が返す挑戦者 = 開催の時点の本物)
//   'snapshot' — 2026-09-26 以前の作り方(挑戦状が届いた時点の写し event.challenger。計測の比較用)
//
// 先に test/ui-walkthrough/fixtures/headless-sim の loadEngines() を呼んでおくこと。

const { readSource } = require('./source.js');

const clone = v => JSON.parse(JSON.stringify(v));
let hooksInstalled = false;

function installAppHooks() {
  if (hooksInstalled) return global.App;
  const app = readSource('src', 'app.js');
  const method = name => {
    const st = app.indexOf(`\n  ${name}(`);
    if (st < 0) throw new Error(`App.${name} が app.js に無い`);
    return app.slice(st, app.indexOf('\n  },\n', st) + 5);
  };
  const App = global.App || {};
  global.App = App;
  if (typeof global.isPPV !== 'function') global.isPPV = w => Engine.util.isPPV(w);
  Object.assign(App, new Function(`return ({${method('_finalizeHookGuests')}\n});`)());
  hooksInstalled = true;
  return App;
}

/** 挑戦状(B3)の大型イベントを、その週の状態から generateLargeEvent の本物で作る(クールダウンだけ外した写しで。点火カタログと同じ) */
function buildB3Event(state) {
  const s = { ...state, lastLargeEventWeek: 0, lastB3ChallengeWeek: 0 };
  const roster = (s.roster || []).filter(f => !f.injury && !f.isRental);
  for (let k = 0; k < 400; k += 1) {
    const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB3E1, k));
    const raw = Engine.eventSystem.generateLargeEvent(rng, s, roster);
    if (raw && raw.type === 'B3') return raw;
  }
  return null;
}

/** 受けた挑戦状の予約(app.js _executeLargeEventMatch が置く形) */
function makeBooking(event, fighterId, acceptedAt) {
  return {
    event, fighterId, challenger: { ...event.challenger },
    orgId: event.orgId || null, orgName: event.orgName || '相手団体',
    acceptedSeason: acceptedAt.season, acceptedWeek: acceptedAt.week,
  };
}

/**
 * 興行週の状態 G0 に予約 booking を置き、挑戦状の試合をメインにした興行を1回通す。
 * extraCard: メインの下に並べる通常カード([{ left, right }])。
 * 戻り値: { reserved: false } — ゲームの作り方で予約が成立しない(本人が出られない)
 *         { reserved: true, main, guestPre, guestPost, realBefore, realAfter, fin, orgId, guestId }
 */
function runB3Show(G0, booking, { guestMode = 'game', extraCard = [] } = {}) {
  const App = installAppHooks();
  let G = { ...clone(G0), showCard: extraCard.map(m => ({ left: m.left, right: m.right, isTitle: false })) };
  G._pendingIncomingB3Match = clone(booking);
  let scheduled;
  let card;
  let groupId;
  if (guestMode === 'snapshot') {
    // 以前の作り方: 代表の健康だけを見て、挑戦者は写しのまま(本物の怪我・移籍を見ない)
    const playerFighter = G.roster.find(f => f.id === booking.fighterId);
    if (!playerFighter || playerFighter.injury || playerFighter.forcedRest || playerFighter.suspended) return { reserved: false };
    scheduled = { ...booking, playerFighter, challenger: clone(booking.challenger), reservedIds: [playerFighter.id, booking.challenger.id] };
    groupId = `b3_${playerFighter.id}_${booking.challenger.id}_${G.season}_${G.week}`;
    const rest = Engine.challengeRequest.removeFightersFromCard(G.showCard, scheduled.reservedIds);
    card = Engine.util.normalizeShowCardForVenue([{ left: playerFighter.id, right: booking.challenger.id, isTitle: false, isCRMatch: true,
      _crMatchLocked: true, _b3ChallengeMatch: true, _crGroupId: groupId, _crSlot: 0 }, ...rest], G.week, G.showVenue);
  } else {
    const reserved = Engine.challengeRequest.reserveScheduledSingleMatch(G, G.showCard);
    if (!reserved) return { reserved: false };
    ({ scheduled, card, groupId } = reserved);
  }
  const existingIds = new Set(G.roster.map(f => f.id));
  const guest = existingIds.has(scheduled.challenger.id) ? null
    : { ...scheduled.challenger, isB3ChallengeGuest: true, _b3GuestOrgId: scheduled.orgId };
  const { _pendingIncomingB3Match: _consumed, ...rest } = G;
  G = { ...rest, showCard: card, roster: guest ? [...rest.roster, guest] : rest.roster };
  App._b3ShowData = { ...scheduled, groupId, guestIds: guest ? [guest.id] : [] };
  App._unifiedTitleShowData = null;
  App._crGuestSyncData = null;

  const orgId = scheduled.orgId;
  const guestId = scheduled.challenger.id;
  const realOf = s => ((s.aiOrgs && s.aiOrgs[orgId] && s.aiOrgs[orgId].roster) || []).find(f => f.id === guestId) || null;
  const realBefore = clone(realOf(G));
  const validMatches = G.showCard.filter(m => m.left > 0 && m.right > 0);
  const target = Engine.mq.resolveNextMatchMqTargetIndex(validMatches, G.milestoneBuffs);
  const results = validMatches.map((m, idx) => {
    const L = G.roster.find(c => c.id === m.left);
    const R = G.roster.find(c => c.id === m.right);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    const ringIn = Engine.mq.buildRingInOpts(G, m.left, m.right, { roster: G.roster, isTitle: !!m.isTitle,
      applyNextMatchMq: idx === target, normalShowRingExtras: true, isMainEvent: idx === 0, unifiedTitleMatch: false });
    return Engine.battle.simulateMatch(L, R, rng, (m.isTitle || (idx === 0 && G.showVenue === 9)) ? 2 : 1, ringIn.simOpts);
  });
  const begun = Engine.show.beginShow(G, validMatches);
  let guestPost = null;
  const fin = Engine.show.finalize(begun.state, validMatches, results, {
    roster: begun.roster, preShowLosingStreaks: begun.preShowLosingStreaks, preShowState: G,
    logStyle: 'structured', mqPath: 'App._finalizeShowImpl', intrusion: null, dict: WM_I18N.t,
    hooks: {
      afterWriteback: w => {
        guestPost = clone(w.roster.find(c => c.id === guestId) || null);
        App._finalizeHookGuests(w);
      },
    },
  });
  const mainIdx = validMatches.findIndex(m => m._b3ChallengeMatch);
  return {
    reserved: true, orgId, guestId, fin, main: results[mainIdx], mainMatch: validMatches[mainIdx],
    guestPre: guest ? clone(guest) : null, guestPost, realBefore, realAfter: clone(realOf(fin.state)),
  };
}

module.exports = { installAppHooks, buildB3Event, makeBooking, runB3Show, clone };
