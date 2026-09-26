'use strict';

// 直訴・果たし状を出す直前に、発起人・相手がいま出られるかを見直す(2026-09-26)。
//
// 背景: 直訴・果たし状(pendingThisWeek)は、その週のモーダル枠を大型イベント・派閥イベントに取られると持ち越される。
// 持ち越しの間の自浄 dropStalePending は発起人・相手の「在籍」しか見ず、出す側 App.handleChallengeRequest も怪我を
// 見直さないため、持ち越した週に怪我・休養をした発起人の果たし状が画面に出ていた。受けると buildMatchCard は発起人・
// 相手の健康を見ないのでカードが組めて予約され、次の興行で getScheduledCard(6人とも健康が条件)が予約を解除して
// 「⚠ 挑戦試合の出場条件が整わないため、予約を解除しました」のトーストが出るだけだった(壊れはしない)。
//
// 直したこと(表示だけ。週次処理 tickWeek・processWeekly・dropStalePending は変えない):
//   - Engine.challengeRequest.dropUnplayablePending(純関数): 発起人・相手のどちらかが怪我・休養・謹慎なら取り下げる
//     (予約の消化 getScheduledCard と同じ基準。不在の打診を取り下げる dropStalePending と同じ扱いで、CD・クォータは付けない)
//   - App.handleChallengeRequest の頭と processWeek の出す判定の直前で呼ぶ。取り下げた週は統一王座「こちらの番」を塞がない
//
// 変更前のコードでは §1(関数が無い)・§3(出られない発起人の果たし状を出す)で失敗する。§2 は「受けると予約が解除される」
// 経路がエンジンにあることの確認(前後とも同じ)。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadEngines } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

const clone = o => JSON.parse(JSON.stringify(o));
const base = Engine.createInitialState(42, true);
const orgId = Object.keys(base.aiOrgs).find(id => (base.aiOrgs[id].roster || []).length >= 4);
const ai = base.aiOrgs[orgId].roster;
const own = base.roster.filter(f => !f.isRental);
const requesterAi = ai[0];
const targetOwn = own[0];

function withPending(state, pending) {
  const s = Engine.challengeRequest.ensureInit(state);
  return { ...s, challengeRequest: { ...s.challengeRequest, pendingThisWeek: pending } };
}
const inversePending = () => ({
  _inverse: true, selfId: requesterAi.id, otherId: targetOwn.id, otherOrgId: 'player', requesterOrgId: orgId,
  heat: 100, rivalry: 92, bond: 10, issuedSeason: base.season, issuedWeek: base.week,
  memberIds: [requesterAi.id, ai[1].id, ai[2].id],
});
const forwardPending = () => ({
  selfId: targetOwn.id, otherId: requesterAi.id, otherOrgId: orgId,
  heat: 100, rivalry: 92, bond: 10, issuedSeason: base.season, issuedWeek: base.week,
});
const INJURY = { type: '中程度の負傷', weeksLeft: 3, totalWeeks: 3, severity: 'mid' };
// id の選手に patch を当てた写し(自団体・AI団体のどちらにいても)
function patchFighter(state, id, patch) {
  const s = clone(state);
  s.roster = s.roster.map(f => (f.id === id ? { ...f, ...patch } : f));
  Object.values(s.aiOrgs).forEach(org => { org.roster = (org.roster || []).map(f => (f.id === id ? { ...f, ...patch } : f)); });
  return s;
}
const pendingOf = s => s.challengeRequest && s.challengeRequest.pendingThisWeek;

// ── 1. dropUnplayablePending ──
{
  assert.strictEqual(typeof Engine.challengeRequest.dropUnplayablePending, 'function',
    'Engine.challengeRequest.dropUnplayablePending が無い(出す直前に発起人・相手の怪我を見直していない)');
  const drop = s => Engine.challengeRequest.dropUnplayablePending(s);
  // 出られる2人の打診は残す(両方向)
  assert.ok(pendingOf(drop(withPending(base, inversePending()))), '出られる2人の果たし状を取り下げた');
  assert.ok(pendingOf(drop(withPending(base, forwardPending()))), '出られる2人の直訴を取り下げた');
  // 出られない発起人・相手(怪我・休養・謹慎)は取り下げる
  const cases = [
    ['果たし状の発起人(他団体)が怪我', inversePending, requesterAi.id, { injury: INJURY }],
    ['果たし状の発起人(他団体)が休養', inversePending, requesterAi.id, { forcedRest: true }],
    ['果たし状の相手(自団体)が怪我', inversePending, targetOwn.id, { injury: INJURY }],
    ['果たし状の相手(自団体)が休暇中', inversePending, targetOwn.id, { forcedRest: true, onLeave: { weeksLeft: 2, totalWeeks: 2 } }],
    ['直訴の発起人(自団体)が怪我', forwardPending, targetOwn.id, { injury: INJURY }],
    ['直訴の発起人(自団体)が謹慎', forwardPending, targetOwn.id, { suspended: true }],
    ['直訴の相手(他団体)が怪我', forwardPending, requesterAi.id, { injury: INJURY }],
  ];
  for (const [label, make, id, patch] of cases) {
    const s = withPending(patchFighter(base, id, patch), make());
    const out = drop(s);
    assert.strictEqual(pendingOf(out), null, `${label}: 取り下げていない`);
    // 取り下げは CD・クォータを付けない(dropStalePending と同じ。治って熱が残っていればまた届きうる)
    assert.deepStrictEqual(
      { ...out.challengeRequest, pendingThisWeek: null },
      { ...s.challengeRequest, pendingThisWeek: null },
      `${label}: 取り下げで CD・クォータが動いた`);
  }
  // 不在(移籍・引退)も取り下げる(dropStalePending を通す)
  assert.strictEqual(pendingOf(drop(withPending(base, { ...inversePending(), selfId: -9999 }))), null, '不在の発起人の果たし状を残した');
  // 打診が無ければそのまま
  assert.strictEqual(pendingOf(drop(Engine.challengeRequest.ensureInit(clone(base)))), null);
  // 週次処理(tickWeek の自浄 dropStalePending)は怪我を見ない=数値は変えない(表示だけの修正)
  const injuredReq = withPending(patchFighter(base, requesterAi.id, { injury: INJURY }), inversePending());
  assert.ok(pendingOf(Engine.challengeRequest.dropStalePending(injuredReq)), 'dropStalePending が怪我で取り下げた(週次処理の数値が変わる)');
}

// ── 2. 受けた場合に何が起きていたか(前後とも同じ。出す直前の見直しが無いと「受けても解除」になる理由) ──
{
  const s = withPending(patchFighter(base, requesterAi.id, { injury: INJURY }), inversePending());
  const card = Engine.challengeRequest.buildMatchCard(s);
  assert.ok(card, 'buildMatchCard が怪我をした発起人でカードを組まなかった(前提が変わった)');
  const booked = {
    ...Engine.challengeRequest.acceptPending(s),
    _pendingIncomingChallengeMatch: {
      isInverse: true, requesterId: card.requesterId, opponentId: card.opponentId,
      requesterOrgId: card.requesterOrgId, opponentOrgId: card.opponentOrgId,
      teamAIds: card.teamA.map(f => f.id), teamBIds: card.teamB.map(f => f.id),
    },
  };
  const showWeek = { ...booked, week: [2, 4, 6, 8, 10, 14, 16].find(w => Engine.challengeRequest.isEligibleHomeShow({ ...booked, week: w })) };
  assert.strictEqual(Engine.challengeRequest.getScheduledCard(showWeek), null,
    '怪我をした発起人の予約が次の興行で消化できてしまう(前提が変わった)');
}

// ── 3. App.handleChallengeRequest: 出られない発起人・相手の打診は出さずに取り下げる ──
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
function methodSource(name) {
  const start = app.indexOf(`\n  ${name}(`);
  assert.ok(start >= 0, `App.${name} が app.js に無い`);
  const open = app.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < app.length; i += 1) {
    if (app[i] === '{') depth += 1;
    else if (app[i] === '}') { depth -= 1; if (depth === 0) return app.slice(start + 1, i + 1); }
  }
  throw new Error('終端が見つからない');
}
function runHandle(state) {
  const shown = [];
  const ctx = {
    G: state, Engine, console,
    Storage: { autoSave() {} },
    WM_I18N: { t: s => s, pn: s => s },
    Audio: { play() {} },
    showToast() {},
    renderWeekScreen() {},
    _factionAudioOpen() {}, _factionAudioClose() {},
    showChallengeRequestModal: payload => { shown.push(payload); },
  };
  vm.createContext(ctx);
  vm.runInContext(`var App = {\n${methodSource('handleChallengeRequest')}\n};\nApp.handleChallengeRequest(G.challengeRequest.pendingThisWeek);`, ctx);
  return { shown, G: ctx.G };
}
{
  const ok = runHandle(withPending(clone(base), inversePending()));
  assert.strictEqual(ok.shown.length, 1, '出られる2人の果たし状を出していない');
  const injured = runHandle(withPending(patchFighter(base, requesterAi.id, { injury: INJURY }), inversePending()));
  assert.strictEqual(injured.shown.length, 0, '持ち越しの間に怪我をした発起人の果たし状を出した(受けても次の興行で予約が解除される)');
  assert.strictEqual(pendingOf(injured.G), null, '出さなかった果たし状が残った(取り下げていない)');
  const resting = runHandle(withPending(patchFighter(base, targetOwn.id, { forcedRest: true }), forwardPending()));
  assert.strictEqual(resting.shown.length, 0, '休養中の発起人の直訴を出した');
}

// ── 4. processWeek: 出す判定の直前に見直し、取り下げた週は「こちらの番」を塞がない ──
{
  const pw = methodSource('processWeek');
  const drop = pw.indexOf('Engine.challengeRequest.dropUnplayablePending(G)');
  const crPending = pw.indexOf('const crPending = ');
  const unified = pw.indexOf('unifiedPlayerTurn && !pendingLargeEvent && !pendingFactionEvent && !crPending');
  assert.ok(drop > 0, 'processWeek が出す直前に dropUnplayablePending を通していない');
  assert.ok(drop < crPending && crPending < unified, 'processWeek の見直しが「出す判定」「こちらの番の判定」より前にない');
}

console.log('challenge-request-unplayable-pending-test: ok');
