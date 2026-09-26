#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/b3-guest-from-real-fighter-test.js — 挑戦状(B3)の挑戦者を、試合の時点の本物の選手から作る(2026-09-26 Keisuke 裁定「直す」)
//
//  ■ 何を守るか
//    受けた挑戦状の試合は次の通常興行のメインで行う。挑戦者(他団体の選手)のゲストは以前、挑戦状が届いた時点の写し
//    event.challenger(能力・人気・特性だけ)から作られていた。写しに体調が無いため試合後の怪我の判定の確率が NaN になり
//    (Engine.injury.check の rng > NaN が常に偽)、挑戦者は毎回必ず怪我をした。年齢も無く成長は17歳扱い、自己最高評価・
//    信頼も欠けたまま試合をし、予約の後に本人が怪我・移籍しても試合に出てきた。
//    - Engine.challengeRequest.getScheduledSingleChallenge は、予約を消化する時点の本物(挑戦してきた団体の最新のロスター)を返す
//      (直訴 getScheduledCard・全国統一王座戦 getIncomingMatch と同じ作り方)
//    - 本人が出られない(怪我・移籍・引退・団体の解散・自団体に来ている)なら予約は成立しない(呼び出し側が解除する「消滅」)。
//      他団体の選手の「出られない」は怪我だけで見る(休養・謹慎の印は自団体のもので、AI団体に古いまま残ることがある)
//    - 本物の興行の処理を通すと、挑戦者の怪我は普通の確率になり、返却(mergeReturningGuest)は興行で起きたことだけを反映する
//    - 返却の調子の波: 本物が興行の間に動いていなければ、試合後の処理の結果(勢いの変化・終わり)もそのまま持ち帰る
//
//  変更前のコードでは「写しではなく本物」「怪我をした本人は予約が成立しない」「怪我が毎回にならない」などで失敗する。
//  前後の差(勝率・怪我の率)の広い標本は tools/b3-guest-source-compare.js。
//
//  ■ 使い方
//    node test/b3-guest-from-real-fighter-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadEngines, advanceUntil, collectValidationWarnings } = require('./ui-walkthrough/fixtures/headless-sim');
const { buildB3Event, makeBooking, runB3Show, clone } = require('./helpers/b3-show');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n        ') : e)); }
}
const MARKERS = ['isB3ChallengeGuest', '_b3GuestOrgId', 'isCRGuest', '_crGuestOrgId', 'isAwayChallengeGuest', 'isUnifiedTitleGuest', '_unifiedGuestOrgId'];

console.log('挑戦状(B3)の挑戦者を試合の時点の本物から作る 回帰ガード');

// seed 42 の2季目を headless で進め、manage の週を控える(挑戦状が届いて受けた週 → 次の通常興行週)
const weeks = [];
advanceUntil({
  seed: 42,
  until: g => {
    if (g.season > 2) return true;
    if (g.season === 2 && g.weekPhase === 'manage' && !g.offSeason) weeks.push(clone(g));
    return false;
  },
});
const showIdx = weeks.findIndex((g, i) => i > 0 && g.week === 14 && Engine.challengeRequest.isEligibleHomeShow(g));
assert.ok(showIdx > 0, 'fixture の興行週(S2W14)が無い');
const baseShow = weeks[showIdx];
const baseAccepted = weeks[showIdx - 1];
const baseEvent = buildB3Event(baseAccepted);
assert.ok(baseEvent && baseEvent.challenger && baseEvent.orgId, 'fixture の週に挑戦状(B3)が作れない');
const baseRep = baseShow.roster.filter(f => !f.isRental && !f.injury && !f.forcedRest && !f.suspended)
  .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];

// 予約を置いた興行週の状態。edit(G, real) で本物の選手をいじれる
function withBooking(edit, bookingEdit) {
  const G = clone(baseShow);
  const booking = makeBooking(baseEvent, baseRep.id, baseAccepted);
  if (bookingEdit) bookingEdit(booking);
  G._pendingIncomingB3Match = booking;
  const org = G.aiOrgs[baseEvent.orgId];
  const real = org.roster.find(f => f.id === baseEvent.challenger.id);
  if (edit) edit(G, real, org);
  return G;
}

section('予約の消化の時点の本物を返す(届いた時点の写しではない): 伸びた能力・体調・年齢・自己最高評価を持つ', () => {
  const G = withBooking((s, real) => { real.pw += 7; real.condition = 64; real.popularity = Math.min(100, (real.popularity || 0) + 5); });
  const sch = Engine.challengeRequest.getScheduledSingleChallenge(G);
  assert.ok(sch, '予約が成立しない');
  const real = G.aiOrgs[baseEvent.orgId].roster.find(f => f.id === baseEvent.challenger.id);
  assert.strictEqual(sch.challenger, real, '挑戦者が所属団体のロスターの本物ではない(届いた時点の写しのまま)');
  assert.strictEqual(sch.challenger.pw, baseEvent.challenger.pw + 7, '予約の後に伸びた能力が入っていない');
  assert.strictEqual(sch.challenger.condition, 64, '体調が無い(写しのまま)');
  assert.ok(Number.isFinite(sch.challenger.age) && sch.challenger.age > 0, '年齢が無い(成長が17歳扱いになる)');
  assert.strictEqual(sch.orgId, baseEvent.orgId);
  assert.deepStrictEqual(sch.reservedIds, [baseRep.id, real.id]);
  const reserved = Engine.challengeRequest.reserveScheduledSingleMatch(G, []);
  assert.ok(reserved && reserved.card[0]._b3ChallengeMatch && reserved.card[0].right === real.id, 'メインに挑戦状の試合が固定されない');
  // 予約の写しは id・名前を引くためだけに残る(書き換えない)
  assert.strictEqual(G._pendingIncomingB3Match.challenger.pw, baseEvent.challenger.pw);
});

section('本人が予約の後に出られなくなったら予約は成立しない(消滅): 怪我・移籍・引退・団体の解散・自団体に来ている', () => {
  const cases = {
    怪我: (s, real) => { real.injury = { type: '中傷', weeksLeft: 3, totalWeeks: 3 }; },
    移籍: (s, real, org) => {
      const other = Object.keys(s.aiOrgs).find(id => id !== baseEvent.orgId && Array.isArray(s.aiOrgs[id].roster));
      org.roster = org.roster.filter(f => f.id !== real.id);
      s.aiOrgs[other].roster.push(real);
    },
    引退: (s, real, org) => { org.roster = org.roster.filter(f => f.id !== real.id); },
    団体の解散: (s, real, org) => { org.disbanded = true; },
    自団体に来ている: (s, real) => { s.roster.push({ ...real, isRental: true, rentalFromOrg: baseEvent.orgId }); },
  };
  Object.entries(cases).forEach(([label, edit]) => {
    const G = withBooking(edit);
    assert.strictEqual(Engine.challengeRequest.getScheduledSingleChallenge(G), null, `${label}: 予約が成立した`);
    assert.strictEqual(Engine.challengeRequest.reserveScheduledSingleMatch(G, []), null, `${label}: 試合が固定された`);
  });
  // 代表(自団体)が怪我をしたときも従来どおり成立しない
  const G = withBooking(s => { s.roster.find(f => f.id === baseRep.id).injury = { type: '軽傷', weeksLeft: 1, totalWeeks: 1 }; });
  assert.strictEqual(Engine.challengeRequest.getScheduledSingleChallenge(G), null, '代表が怪我でも成立した');
});

section('他団体の選手の「出られない」は怪我だけ: 自団体から持ち出した古い休養・謹慎の印では予約を消さない', () => {
  const G = withBooking((s, real) => { real.forcedRest = true; real.suspended = true; });
  const sch = Engine.challengeRequest.getScheduledSingleChallenge(G);
  assert.ok(sch && sch.challenger.id === baseEvent.challenger.id, '古い休養・謹慎の印で予約が消えた');
});

section('挑戦してきた団体が記録に無い古い予約は、いまいる AI団体から引く', () => {
  const G = withBooking(null, booking => { booking.orgId = null; });
  const sch = Engine.challengeRequest.getScheduledSingleChallenge(G);
  assert.ok(sch, '予約が成立しない');
  assert.strictEqual(sch.orgId, baseEvent.orgId, '所属団体を引けていない');
  assert.strictEqual(sch.challenger, G.aiOrgs[baseEvent.orgId].roster.find(f => f.id === baseEvent.challenger.id));
});

// ── 本物の興行の処理を通す(seed 42 の2季目の通常興行週 × 自団体の OVR 上位3人の代表) ──
const runs = [];
const snapRuns = [];
let cancelled = 0;
for (let i = 1; i < weeks.length; i += 1) {
  const show = weeks[i];
  if (!Engine.challengeRequest.isEligibleHomeShow(show)) continue;
  const event = buildB3Event(weeks[i - 1]);
  if (!event || !event.challenger) continue;
  const reps = show.roster.filter(f => !f.isRental && !f.injury && !f.forcedRest && !f.suspended)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 3);
  reps.forEach(rep => {
    const booking = makeBooking(event, rep.id, weeks[i - 1]);
    const snap = runB3Show(show, booking, { guestMode: 'snapshot' });
    if (snap.reserved) snapRuns.push(snap);
    const run = runB3Show(show, booking, { guestMode: 'game' });
    if (run.reserved) runs.push({ ...run, show, rep });
    else cancelled += 1;
  });
}
const rate = (list, fn) => `${list.filter(fn).length}/${list.length}(${(100 * list.filter(fn).length / Math.max(1, list.length)).toFixed(1)}%)`;
console.log(`        前(届いた時点の写し): 挑戦者の怪我 ${rate(snapRuns, r => r.guestPost && r.guestPost.injury)} / 代表の勝ち ${rate(snapRuns, r => r.main.winner === 'left')}`);
console.log(`        後(開催の時点の本物): 挑戦者の怪我 ${rate(runs, r => r.guestPost && r.guestPost.injury)} / 代表の勝ち ${rate(runs, r => r.main.winner === 'left')} / 予約の解除 ${cancelled}`);

section('本物の興行: ゲストは開催の時点の本物の写し(体調・年齢を持つ)で、挑戦者の怪我は毎回にならない(普通の確率)', () => {
  assert.ok(runs.length >= 20, `標本が少ない(${runs.length})`);
  runs.forEach(r => {
    const { isB3ChallengeGuest, _b3GuestOrgId, ...pre } = r.guestPre;
    assert.strictEqual(isB3ChallengeGuest, true);
    assert.deepStrictEqual(pre, r.realBefore, 'ゲストが開催の時点の本物の写しではない');
    assert.ok(Number.isFinite(pre.condition) && Number.isFinite(pre.age), '体調・年齢の無いゲスト');
  });
  const injured = runs.filter(r => r.guestPost.injury).length;
  assert.ok(injured < runs.length / 2, `挑戦者が ${injured}/${runs.length} 試合で怪我をした(写しのときは毎回)`);
  // 代表(自団体の選手)の怪我の率と同じ桁(本物どうしの同じ判定)
  const repInjured = runs.filter(r => (r.fin.state.roster.find(f => f.id === r.rep.id) || {}).injury).length;
  assert.ok(Math.abs(injured - repInjured) <= Math.max(4, runs.length * 0.15), `挑戦者 ${injured} と代表 ${repInjured} の怪我の数がかけ離れている`);
});

section('本物の興行: 返却は興行で起きたことだけ(怪我をした試合・しなかった試合)・不変条件の違反なし', () => {
  const hurt = runs.find(r => r.guestPost.injury);
  const fine = runs.find(r => !r.guestPost.injury);
  assert.ok(hurt, '標本に挑戦者が怪我をした試合が無い');
  assert.ok(fine, '標本に挑戦者が怪我をしなかった試合が無い');
  [hurt, fine].forEach(r => {
    const { realBefore: before, realAfter: after, guestPre, guestPost, guestId } = r;
    MARKERS.forEach(k => assert.ok(!(k in after), `本物に一時印 ${k} が残った`));
    assert.ok(!r.fin.state.roster.some(f => f.id === guestId), 'ゲストが自団体のロスターに残った');
    assert.ok(Number.isFinite(after.condition), `本物の体調が不正値(${after.condition})`);
    if (guestPost.injury) {
      assert.deepStrictEqual(after.injury, guestPost.injury, '怪我が本物に反映されていない');
      assert.strictEqual(after.condition, Math.min(before.condition, 30), '怪我の体調は min(本物, 30)');
      assert.strictEqual(after.seasonInjuries, (before.seasonInjuries || 0) + 1, '今季の怪我数');
      // ゲストは本物の写しなので、興行の処理が付けた値と本物への反映が一致する
      assert.strictEqual(after.condition, guestPost.condition, '興行の処理の体調と本物の体調が違う');
    } else {
      assert.strictEqual(after.condition, before.condition, '怪我をしていないのに体調が変わった');
      assert.strictEqual(after.injury, before.injury);
    }
    assert.ok(Math.abs(after.popularity - Engine.util.clamp(before.popularity + (guestPost.popularity - guestPre.popularity), 1, 100)) < 1e-6, '人気の差');
    assert.strictEqual(after.careerBestMQ, Math.max(before.careerBestMQ || 0, r.main.mq), '自己最高評価');
    assert.strictEqual(after.recentMatches.length, Math.min(5, (before.recentMatches || []).length + 1), '直近戦績');
    const warnings = collectValidationWarnings(r.fin.state).filter(w => w.includes(`(id:${guestId})`) || /NaN/.test(w));
    assert.deepStrictEqual(warnings, [], `返却後に不変条件の違反: ${warnings.join(' / ')}`);
  });
});

// ── mergeReturningGuest: 調子の波(本物がゲストの写しと同じなら試合後の結果をそのまま) ──
section('返却の調子の波: 本物が興行の間に動いていなければ、スランプの終わり・勢いの変化も持ち帰る', () => {
  const slump = { recoveryMomentum: 1, weeksSinceStart: 3, ovrDebuff: -1 };
  const real = { id: 7, name: '本物', pw: 60, sp: 55, te: 58, st: 52, mn: 50, popularity: 50, condition: 70, hotStreak: null, slump, motivationLoss: null };
  const pre = { ...real };
  // 終わった
  const ended = Engine.challengeRequest.mergeReturningGuest(real, pre, { ...pre, slump: null, isB3ChallengeGuest: true });
  assert.strictEqual(ended.slump, null, 'スランプの終わりを持ち帰っていない');
  // 勢いが変わった
  const moved = Engine.challengeRequest.mergeReturningGuest(real, pre, { ...pre, slump: { ...slump, recoveryMomentum: 3 } });
  assert.deepStrictEqual(moved.slump, { ...slump, recoveryMomentum: 3 }, 'スランプの勢いの変化を持ち帰っていない');
  // 新しく始まった(本物は何も持っていない)
  const calm = { ...real, slump: null };
  const started = Engine.challengeRequest.mergeReturningGuest(calm, { ...calm }, { ...calm, hotStreak: { remainingWeeks: 8, ovrBuff: 2 } });
  assert.deepStrictEqual(started.hotStreak, { remainingWeeks: 8, ovrBuff: 2 });
  // 本物が興行の間に別に動いていたら、本物の調子の波を上書きしない
  const drifted = { ...real, slump: { ...slump, weeksSinceStart: 4 } };
  const kept = Engine.challengeRequest.mergeReturningGuest(drifted, pre, { ...pre, slump: null });
  assert.deepStrictEqual(kept.slump, drifted.slump, '本物の(別に動いた)スランプを上書きした');
});

if (failed > 0) {
  console.log(`\nb3-guest-from-real-fighter-test: ${failed} 件失敗`);
  process.exit(1);
}
console.log('\nb3-guest-from-real-fighter-test: ok');
