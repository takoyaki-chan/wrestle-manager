#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/b3-guest-return-test.js — 挑戦状(B3)のゲストを所属団体へ戻すときの回帰ガード(2026-09-26)
//
//  ■ 何を守るか
//    挑戦状のゲスト(他団体の選手)は、2026-09-26 まで挑戦状が届いた時点の写し event.challenger(能力・人気・
//    特性など試合に要る欄だけ)から作られていた(同日の裁定で開催の時点の本物から作る形へ。
//    test/b3-guest-from-real-fighter-test.js)。以前の返却(App._finalizeHookGuests)はその写しを本物の選手へ
//    { ...本物, ...ゲスト } で丸ごと被せていたため、ゲストが怪我をすると本物の体調が NaN になり、
//    自己最高評価が今回の評価に下がり、今季の伸びが0に戻り、直近戦績が1戦だけになり、一時印
//    (isB3ChallengeGuest / _b3GuestOrgId)と信頼の即時ボーナスが残っていた。
//    - 返却は「この興行で起きたこと」(怪我・試合の記録・人気・成長)だけを本物へ反映する
//      (Engine.challengeRequest.mergeReturningGuest)。怪我をしなかった場合は体調も怪我も本物のまま
//    - 返却後の状態で validateGameState がその選手の不正値(NaN)を出さない
//    - 一時印は挑戦状・直訴・遠征のどの返却でも外す。既存セーブに残った印はロード時の修復で外す
//
//  本物の興行の処理(Engine.show.finalize)と実プレイの hooks(app.js から取り出した本物の関数)を通す。
//  変更前のコードでは「体調が有限」「自己最高評価が下がらない」などで失敗する。
//
//  ■ 使い方
//    node test/b3-guest-return-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines, advanceUntil, collectValidationWarnings } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n        ') : e)); }
}
const clone = v => JSON.parse(JSON.stringify(v));
const MARKERS = ['isB3ChallengeGuest', '_b3GuestOrgId', 'isCRGuest', '_crGuestOrgId', 'isAwayChallengeGuest', 'isUnifiedTitleGuest', '_unifiedGuestOrgId'];

console.log('挑戦状(B3)のゲスト返却 回帰ガード');

// ── 実プレイの hooks(app.js の本物の関数)を取り出す ──
const app = readSource('src', 'app.js');
function method(name) {
  const st = app.indexOf(`\n  ${name}(`);
  assert.ok(st >= 0, `App.${name} が無い`);
  return app.slice(st, app.indexOf('\n  },\n', st) + 5);
}
const App = {};
global.App = App;
global.isPPV = w => Engine.util.isPPV(w);
// 成長イベント・経歴の刻印は K-1 第4段 4-A から finalize の中(Engine.show.applyGrowthEvents / recordCareerMarks)
Object.assign(App, new Function(`return ({${method('_finalizeHookGuests')}\n});`)());

// 本物の進行で作った興行週(seed 42 の2季目14週。k1-stage3-test と同じ週)
const baseState = clone(advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 14 && g.weekPhase === 'manage' && !g.offSeason }));

// 挑戦状は generateLargeEvent の本物の B3(クールダウンだけ外した写しで作る。点火カタログの _buildB3LargeEvent と同じ)
const b3Event = (() => {
  const s = { ...baseState, lastLargeEventWeek: 0, lastB3ChallengeWeek: 0 };
  const roster = (s.roster || []).filter(f => !f.injury && !f.isRental);
  for (let k = 0; k < 400; k += 1) {
    const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB3E1, k));
    const raw = Engine.eventSystem.generateLargeEvent(rng, s, roster);
    if (raw && raw.type === 'B3') return raw;
  }
  return null;
})();
assert.ok(b3Event && b3Event.challenger, 'fixture の週に挑戦状(B3)が作れない');

// App.executeShow と同じ手順で、挑戦状の試合を次の通常興行のメインに固定してゲストを入れ、
// 試合をシミュレーションし、Engine.show.finalize を実プレイの指定・hooks で通す
function runB3Show({ repIndex = 0, challengerExtra = {} } = {}) {
  const G0 = clone(baseState);
  const healthy = G0.roster.filter(c => !c.injury && !c.isRental && !c.forcedRest && !c.suspended);
  const rep = healthy[repIndex];
  const others = healthy.filter(c => c.id !== rep.id);
  let G = { ...G0, showCard: [
    { left: others[0].id, right: others[1].id, isTitle: false },
    { left: others[2].id, right: others[3].id, isTitle: false },
  ] };
  const challenger = { ...b3Event.challenger, ...challengerExtra };
  G._pendingIncomingB3Match = { event: b3Event, fighterId: rep.id, challenger, orgId: b3Event.orgId, orgName: b3Event.orgName, acceptedSeason: G.season, acceptedWeek: G.week - 1 };
  const reserved = Engine.challengeRequest.reserveScheduledSingleMatch(G, G.showCard);
  assert.ok(reserved, '挑戦状の試合を予約できない');
  const scheduled = reserved.scheduled;
  const guest = { ...scheduled.challenger, isB3ChallengeGuest: true, _b3GuestOrgId: scheduled.orgId };
  const { _pendingIncomingB3Match: _consumed, ...rest } = G;
  G = { ...rest, showCard: reserved.card, roster: [...rest.roster, guest] };
  App._b3ShowData = { ...scheduled, groupId: reserved.groupId, guestIds: [guest.id] };
  App._unifiedTitleShowData = null;
  App._crGuestSyncData = null;

  const realBefore = clone(G.aiOrgs[scheduled.orgId].roster.find(f => f.id === guest.id));
  const validMatches = G.showCard.filter(m => m.left > 0 && m.right > 0);
  assert.ok(validMatches[0]._b3ChallengeMatch, '挑戦状の試合がメインに無い');
  const target = Engine.mq.resolveNextMatchMqTargetIndex(validMatches, G.milestoneBuffs);
  const results = validMatches.map((m, idx) => {
    const L = G.roster.find(c => c.id === m.left);
    const R = G.roster.find(c => c.id === m.right);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    const ringIn = Engine.mq.buildRingInOpts(G, m.left, m.right, { roster: G.roster, isTitle: !!m.isTitle, applyNextMatchMq: idx === target, normalShowRingExtras: true, isMainEvent: idx === 0, unifiedTitleMatch: false });
    return Engine.battle.simulateMatch(L, R, rng, (m.isTitle || (idx === 0 && G.showVenue === 9)) ? 2 : 1, ringIn.simOpts);
  });
  const begun = Engine.show.beginShow(G, validMatches);
  let guestPost = null;
  const fin = Engine.show.finalize(begun.state, validMatches, results, {
    roster: begun.roster, preShowLosingStreaks: begun.preShowLosingStreaks, preShowState: G,
    logStyle: 'structured', mqPath: 'App._finalizeShowImpl', intrusion: null, dict: WM_I18N.t,
    hooks: {
      afterWriteback: w => {
        guestPost = clone(w.roster.find(c => c.id === guest.id) || null);
        App._finalizeHookGuests(w);
      },
    },
  });
  assert.ok(guestPost, 'ゲストが返却の前にロスターから消えている');
  const realAfter = fin.state.aiOrgs[scheduled.orgId].roster.find(f => f.id === guest.id);
  assert.ok(realAfter, '所属団体のロスターから本物の選手が消えた');
  return { fin, rep, guestId: guest.id, orgId: scheduled.orgId, guestPre: clone(scheduled.challenger), guestPost, realBefore, realAfter, main: results[0] };
}

function assertReturned(run) {
  const { fin, rep, guestId, guestPre, guestPost, realBefore, realAfter, main } = run;
  const mq = main.mq;
  // 体調・自己最高評価(以前の返却で壊れていた2つ)
  assert.ok(Number.isFinite(realAfter.condition), `本物の体調が不正値(${realAfter.condition})`);
  assert.strictEqual(realAfter.careerBestMQ, Math.max(realBefore.careerBestMQ || 0, mq), `自己最高評価は max(本物, 今回)(${realBefore.careerBestMQ} / ${mq} → ${realAfter.careerBestMQ})`);
  // 一時印・ゲストの残り
  MARKERS.forEach(k => assert.ok(!(k in realAfter), `本物に一時印 ${k} が残っている`));
  assert.ok(!fin.state.roster.some(c => c.id === guestId), 'ゲストが自団体のロスターに残っている');
  // 怪我
  if (guestPost.injury) {
    assert.deepStrictEqual(realAfter.injury, guestPost.injury, '怪我が本物に反映されていない');
    assert.strictEqual(realAfter.condition, Math.min(realBefore.condition, 30), '怪我の体調は min(本物の体調, 30)');
    assert.strictEqual(realAfter.seasonInjuries, (realBefore.seasonInjuries || 0) + 1, '今季の怪我数が1つ増えていない');
    assert.ok(realAfter.growthPenalty, '怪我の成長の減速が本物に反映されていない');
  } else {
    assert.strictEqual(realAfter.condition, realBefore.condition, '怪我をしていないのに体調が変わった');
    assert.strictEqual(realAfter.injury, realBefore.injury, '怪我をしていないのに怪我が変わった');
    assert.strictEqual(realAfter.seasonInjuries, realBefore.seasonInjuries, '怪我をしていないのに今季の怪我数が変わった');
    assert.deepStrictEqual(realAfter.growthPenalty, realBefore.growthPenalty, '怪我をしていないのに成長の減速が変わった');
  }
  // 試合の記録
  const expectedResult = main.winner === 'draw' ? 'draw' : (main.winner === 'right' ? 'win' : 'loss');
  const newEntry = { opponentId: rep.id, result: expectedResult, season: fin.state.season, week: fin.state.week };
  assert.deepStrictEqual(realAfter.recentMatches, [...(realBefore.recentMatches || []), newEntry].slice(-5), '直近戦績は本物の末尾に今回の1戦を足した5戦');
  assert.strictEqual(realAfter.lastMatchResult, expectedResult);
  assert.strictEqual(realAfter.losingStreak, expectedResult === 'loss' ? (realBefore.losingStreak || 0) + 1 : 0, '連敗数');
  const beforeHist = (realBefore.careerRecord && realBefore.careerRecord.history) || [];
  const afterHist = (realAfter.careerRecord && realAfter.careerRecord.history) || [];
  assert.deepStrictEqual(afterHist.slice(0, beforeHist.length), beforeHist, '本物の経歴が失われた');
  assert.ok(afterHist.some(h => h.type === 'b3Challenge' && h.season === fin.state.season && h.week === fin.state.week), '挑戦状の経歴(b3Challenge)が無い');
  // 人気・能力・今季の伸び
  const popDelta = guestPost.popularity - guestPre.popularity;
  assert.ok(Math.abs(realAfter.popularity - Engine.util.clamp(realBefore.popularity + popDelta, 1, 100)) < 1e-6,
    `人気は本物 + 興行の前後の差(${realBefore.popularity} + ${popDelta} → ${realAfter.popularity})`);
  ['pw', 'sp', 'te', 'st', 'mn'].forEach(k => {
    assert.ok(realAfter[k] >= realBefore[k], `能力 ${k} が下がった(${realBefore[k]} → ${realAfter[k]})`);
    assert.ok((realAfter.seasonGrowth || {})[k] >= ((realBefore.seasonGrowth || {})[k] || 0), `今季の伸び ${k} が戻った`);
  });
  // 信頼の即時ボーナスは他団体の興行から持ち帰らない
  assert.strictEqual(realAfter._trustBonus, realBefore._trustBonus, '信頼の即時ボーナスが持ち込まれた');
  assert.deepStrictEqual(realAfter._trustBonusSources, realBefore._trustBonusSources);
  // 触らない欄(契約・年齢など)は本物のまま
  ['age', 'contractPop', 'contractOVR', 'trainCap', 'pot', 'style', 'role', 'traits', 'name', 'wins', 'losses'].forEach(k => {
    assert.deepStrictEqual(realAfter[k], realBefore[k], `触らない欄 ${k} が変わった`);
  });
  // validateGameState: この選手の不正値(NaN)を出さない
  const warnings = collectValidationWarnings(fin.state);
  const mine = warnings.filter(w => w.includes(`(id:${guestId})`));
  assert.deepStrictEqual(mine, [], `返却後の選手に不変条件の違反: ${mine.join(' / ')}`);
  assert.ok(!warnings.some(w => /NaN/.test(w)), `NaN の違反: ${warnings.filter(w => /NaN/.test(w)).join(' / ')}`);
}

section('ゲームと同じ入れ方(開催の時点の本物から作った挑戦者): 返却で本物の選手の記録が壊れない・一時印が残らない', () => {
  const run = runB3Show();
  assertReturned(run);
  console.log(`        (挑戦者 ${run.guestId}: 怪我 ${run.guestPost.injury ? run.guestPost.injury.type : 'なし'} / 体調 ${run.realBefore.condition}→${run.realAfter.condition} / 自己最高評価 ${run.realBefore.careerBestMQ}→${run.realAfter.careerBestMQ} / 今回 ${run.main.mq})`);
});

section('怪我をしなかった場合: 体調・怪我・成長の減速は本物のまま、試合の記録だけ増える', () => {
  // 挑戦者は開催の時点の本物(体調を持つ)なので怪我の判定は通常の確率。代表を替えて怪我をしなかった試合を探す
  // (怪我をした試合の返却は test/b3-guest-from-real-fighter-test.js が本物の興行で確かめる)
  let run = null;
  for (let i = 0; i < 8 && !run; i += 1) {
    const r = runB3Show({ repIndex: i });
    if (!r.guestPost.injury) run = r;
  }
  assert.ok(run, '怪我をしなかった挑戦状の試合が作れない');
  assertReturned(run);
  assert.ok(!run.realAfter.injury && run.realAfter.condition === run.realBefore.condition);
});

// ── mergeReturningGuest の規則(合成データ) ──
const deepFreeze = o => { if (o && typeof o === 'object') { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
const realBase = () => ({
  id: 7, name: '本物', age: 24, pw: 60, sp: 55, te: 58, st: 52, mn: 50, trainCap: { pw: 60, sp: 90, te: 90, st: 90, mn: 90 },
  popularity: 50, condition: 72, careerBestMQ: 80, losingStreak: 2, lastMatchResult: 'loss', promoStack: 2,
  seasonGrowth: { pw: 1, sp: 2, te: 0, st: 0, mn: 0 }, seasonInjuries: 1, injury: null, preInjuryPop: null,
  growthPenalty: null, _trustBonus: 0.5, _trustBonusSources: ['aiShow'],
  recentMatches: [1, 2, 3, 4, 5].map(i => ({ opponentId: 100 + i, result: 'loss', season: 2, week: i })),
  careerRecord: { history: [{ type: 'debut', season: 1, week: 1 }], totalTitleWins: 0 },
  careerHistory: [{ type: 'debut', season: 1, week: 1 }],
});
const snap = () => ({ id: 7, name: '本物', pw: 58, sp: 55, te: 58, st: 50, mn: 50, style: 'Allround', role: 'Face', popularity: 48, traits: [] });

section('規則: 怪我 — 体調は min(本物, 30)・記録済みの怪我の前の人気は据え置き・重い方の成長の減速を残す', () => {
  const real = deepFreeze({ ...realBase(), preInjuryPop: 44, growthPenalty: { remainingWeeks: 10, multiplier: 0.5, source: 'major' } });
  const pre = deepFreeze(snap());
  const post = deepFreeze({ ...snap(), popularity: 47, condition: NaN, injury: { type: '軽傷', weeksLeft: 1, totalWeeks: 1 }, preInjuryPop: 47,
    seasonInjuries: 1, growthPenalty: { remainingWeeks: 6, multiplier: 0.7, source: 'minor' }, careerBestMQ: 40, losingStreak: 1, lastMatchResult: 'loss',
    recentMatches: [{ opponentId: 44, result: 'loss', season: 2, week: 14 }], _trustBonus: 1.2, _trustBonusSources: ['careerBestMQ'], isB3ChallengeGuest: true, _b3GuestOrgId: 'org_x' });
  const out = Engine.challengeRequest.mergeReturningGuest(real, pre, post);
  assert.strictEqual(out.condition, 30);
  assert.deepStrictEqual(out.injury, post.injury);
  assert.strictEqual(out.preInjuryPop, 44, '記録済みの怪我の前の人気を上書きした');
  assert.deepStrictEqual(out.growthPenalty, real.growthPenalty, '重い成長の減速を軽い方で上書きした');
  assert.strictEqual(out.seasonInjuries, 2);
  assert.strictEqual(out.careerBestMQ, 80, '自己最高評価を下げた');
  assert.strictEqual(out.popularity, 49, '人気は本物 + (47 - 48)');
  assert.strictEqual(out.losingStreak, 3, '連敗は本物 + 1');
  assert.strictEqual(out.recentMatches.length, 5);
  assert.deepStrictEqual(out.recentMatches[4], post.recentMatches[0]);
  assert.deepStrictEqual(out.recentMatches[0], real.recentMatches[1], '直近戦績は古い方から押し出す');
  assert.strictEqual(out._trustBonus, 0.5);
  assert.deepStrictEqual(out._trustBonusSources, ['aiShow']);
  MARKERS.forEach(k => assert.ok(!(k in out), `一時印 ${k} が残った`));
  // 本物の体調が既に壊れている(旧セーブ)ときは 30
  const broken = Engine.challengeRequest.mergeReturningGuest({ ...realBase(), condition: null }, pre, post);
  assert.strictEqual(broken.condition, 30);
  // 本物に記録が無ければ、怪我をした時点の人気 = 本物 + (ゲストの怪我時点 - 興行前)
  const fresh = Engine.challengeRequest.mergeReturningGuest(realBase(), pre, post);
  assert.strictEqual(fresh.preInjuryPop, 49);
  assert.deepStrictEqual(fresh.growthPenalty, post.growthPenalty);
});

section('規則: 怪我なし・勝ち — 体調と怪我は本物のまま・連敗は0・能力は本物の上限まで・今季の伸びは足せた分だけ', () => {
  const real = deepFreeze(realBase());
  const pre = deepFreeze(snap());
  // ゲストは pw +2(写しは上限を知らない)・st +1(ブレークスルー 1 のうち今季の伸びは 0)
  const post = deepFreeze({ ...snap(), pw: 60, st: 51, popularity: 49.5, seasonGrowth: { pw: 2, sp: 0, te: 0, st: 0, mn: 0 },
    careerBestMQ: 91, losingStreak: 0, lastMatchResult: 'win', promoStack: 0, hotStreak: { remainingWeeks: 9, ovrBuff: 2 },
    careerRecord: { history: [{ type: 'bigMatch', season: 2, week: 14, mq: 91 }], totalTitleWins: 0 },
    careerHistory: [{ type: 'breakthrough', season: 2, week: 14, detail: 'ST +1' }] });
  const out = Engine.challengeRequest.mergeReturningGuest(real, pre, post);
  assert.strictEqual(out.condition, 72);
  assert.strictEqual(out.injury, null);
  assert.strictEqual(out.seasonInjuries, 1);
  assert.strictEqual(out.pw, 60, '本物の上限(trainCap.pw=60)を超えた');
  assert.strictEqual(out.st, 53, 'ブレークスルーの +1 が足されていない');
  assert.deepStrictEqual(out.seasonGrowth, { pw: 1, sp: 2, te: 0, st: 0, mn: 0 }, '今季の伸びは能力に足せた分だけ(pw は上限で0、st はブレークスルーで今季の伸びに入らない)');
  assert.strictEqual(out.popularity, 51.5);
  assert.strictEqual(out.careerBestMQ, 91);
  assert.strictEqual(out.losingStreak, 0);
  assert.strictEqual(out.lastMatchResult, 'win');
  assert.strictEqual(out.promoStack, 0);
  assert.deepStrictEqual(out.hotStreak, post.hotStreak, '本物が調子の波を持っていなければ絶好調を持ち帰る');
  assert.deepStrictEqual(out.careerRecord.history.map(h => h.type), ['debut', 'bigMatch']);
  assert.strictEqual(out.careerRecord.totalTitleWins, 0);
  assert.deepStrictEqual(out.careerHistory.map(h => h.type), ['debut', 'breakthrough']);
  // 本物がスランプ中ならゲストの絶好調は持ち帰らない(エンジンはスランプ中の選手にブレークスルーを起こさない)
  const inSlump = Engine.challengeRequest.mergeReturningGuest({ ...realBase(), slump: { recoveryMomentum: 1, weeksSinceStart: 3, ovrDebuff: -1 } }, pre, post);
  assert.ok(!inSlump.hotStreak && inSlump.slump && inSlump.slump.weeksSinceStart === 3);
});

section('規則: 返却するゲストが見つからない(post なし)ときは一時印を外すだけ・入力を書き換えない', () => {
  const real = deepFreeze({ ...realBase(), isB3ChallengeGuest: true, _b3GuestOrgId: 'org_x', isAwayChallengeGuest: true });
  const out = Engine.challengeRequest.mergeReturningGuest(real, snap(), null);
  MARKERS.forEach(k => assert.ok(!(k in out), `一時印 ${k} が残った`));
  const { isB3ChallengeGuest, _b3GuestOrgId, isAwayChallengeGuest, ...rest } = real;
  assert.deepStrictEqual(out, rest);
  const clean = deepFreeze(realBase());
  assert.strictEqual(Engine.challengeRequest.stripGuestMarkers(clean), clean, '印が無い選手は同じものを返す');
});

// ── 既存セーブに残った一時印はロード時の修復で外す ──
section('ロード時の修復: AI団体のロスターとフリーの選手に残った一時印を外す(自団体のロスターの選手は触らない)', () => {
  const G = clone(baseState);
  const orgId = Object.keys(G.aiOrgs).find(id => (G.aiOrgs[id].roster || []).length >= 2);
  const [a, b] = G.aiOrgs[orgId].roster;
  Object.assign(a, { isB3ChallengeGuest: true, _b3GuestOrgId: orgId });
  Object.assign(b, { isAwayChallengeGuest: true });
  if (G.freeAgents.length > 0) Object.assign(G.freeAgents[0], { isCRGuest: true, _crGuestOrgId: orgId });
  const expected = 2 + (G.freeAgents.length > 0 ? 1 : 0);
  const repaired = Engine.saveDoctor.repairOnLoad(G);
  assert.ok(repaired.changes.includes(`guest_markers_stripped:${expected}`), `修復の記録が無い(${repaired.changes.join(', ')})`);
  const s = repaired.state;
  [...Object.values(s.aiOrgs).flatMap(o => o.roster || []), ...s.freeAgents].forEach(f => {
    MARKERS.forEach(k => assert.ok(!(k in f), `${f.name} に一時印 ${k} が残った`));
  });
  assert.ok(s.aiOrgs[orgId].roster.some(f => f.id === a.id) && s.aiOrgs[orgId].roster.some(f => f.id === b.id), '印を外した選手がロスターから消えた');
  // 印の無いセーブには何もしない
  const again = Engine.saveDoctor.repairOnLoad(s);
  assert.ok(!again.changes.some(c => c.startsWith('guest_markers_stripped')), '印の無いセーブを修復した');
});

// ── 返却の3経路が一時印を外す(本文の形) ──
section('返却の経路: 挑戦状は mergeReturningGuest・直訴と遠征は stripGuestMarkers を通す', () => {
  const guests = method('_finalizeHookGuests');
  assert.ok(guests.includes('Engine.challengeRequest.mergeReturningGuest(f, b3.challenger, updatedGuest)'), '挑戦状の返却が mergeReturningGuest を通っていない');
  assert.ok(!/\.\.\.f, \.\.\.updatedGuest/.test(guests), '挑戦状の返却にゲストを丸ごと被せる形が残っている');
  assert.ok(/Engine\.challengeRequest\.stripGuestMarkers\(\{ \.\.\.f, \.\.\.updated,/.test(guests), '直訴の返却が一時印を外していない');
  const away = method('_finalizeAwayChallengeShow');
  assert.ok(/Engine\.challengeRequest\.stripGuestMarkers\(allById\.get\(f\.id\)\)/.test(away), '遠征の返却が一時印を外していない');
});

if (failed > 0) {
  console.log(`\nb3-guest-return-test: ${failed} 件失敗`);
  process.exit(1);
}
console.log('\nb3-guest-return-test: ok');
