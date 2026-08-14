'use strict';

// 直訴(challengeRequest)の孤児化pending自浄ガード(2026-08-14 点火カタログR4で検出)。
//
// 背景: pendingThisWeek は解決されるまで週次モーダル枠を占有し、
//   ・新規直訴の抽選(processWeekly の持ち越し早期return)
//   ・統一王座「こちらの番」のUI表示(app.js processWeek の !crPending ガード)
// の両方を堰き止める。発起人/相手が移籍・引退・団体解散で不在になると、モーダルは
// 表示不能(onChoice(null))のまま毎週持ち越され、この堰が恒久化していた
// (実例: S2W4発行の直訴が発起人の移籍後3季残留し、playerTurnを四半期失効まで飲んだ)。
//
// 対策の3層をここで固定する:
//   1. Engine.challengeRequest.dropStalePending — 実効性検査と取り下げ(純関数)
//   2. processWeekly / tickWeek末尾での自浄呼び出し
//   3. validateGameState の参照整合性不変条件(パイプライン外の孤児持ち込み検出)
// あわせて、閉じ経路全数調査で見つけた無ドレイン経路2件(showTravelScene /
// _relmapClosePopup)の _drainPopupQueue 呼び出しをソースレベルで固定する。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadEngines, collectValidationWarnings } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

const base = Engine.createInitialState(42, true);
const orgIds = Object.keys(base.aiOrgs || {}).filter(id => {
  const org = base.aiOrgs[id];
  return org && !org.disbanded && Array.isArray(org.roster) && org.roster.length > 0;
});
assert(orgIds.length > 0, '初期状態にrosterを持つAI団体が存在すること(テスト前提)');
const orgId = orgIds[0];
const aiFighter = base.aiOrgs[orgId].roster[0];
const ownFighter = base.roster[0];
const MISSING_ID = -9999;

function withPending(state, pending) {
  const s = Engine.challengeRequest.ensureInit(state);
  return { ...s, challengeRequest: { ...s.challengeRequest, pendingThisWeek: pending } };
}

function forwardPending(selfId, otherId, otherOrgId) {
  return { selfId, otherId, otherOrgId, heat: 100, rivalry: 90, bond: 10, issuedSeason: 1, issuedWeek: 4 };
}

function inversePending(selfId, otherId, requesterOrgId) {
  return {
    _inverse: true, selfId, otherId, otherOrgId: 'player', requesterOrgId,
    heat: 100, rivalry: 90, bond: 10, issuedSeason: 1, issuedWeek: 4,
    memberIds: [selfId],
  };
}

// ── 1. dropStalePending: 実効性検査 ──
// 有効な forward pending は残す
{
  const s = Engine.challengeRequest.dropStalePending(
    withPending(base, forwardPending(ownFighter.id, aiFighter.id, orgId)));
  assert(s.challengeRequest.pendingThisWeek, '有効なforward直訴を取り下げてはいけない');
}
// 発起人不在(移籍/引退) → 取り下げ
{
  const s = Engine.challengeRequest.dropStalePending(
    withPending(base, forwardPending(MISSING_ID, aiFighter.id, orgId)));
  assert.strictEqual(s.challengeRequest.pendingThisWeek, null, '発起人不在のforward直訴は取り下げる');
}
// 相手不在 → 取り下げ
{
  const s = Engine.challengeRequest.dropStalePending(
    withPending(base, forwardPending(ownFighter.id, MISSING_ID, orgId)));
  assert.strictEqual(s.challengeRequest.pendingThisWeek, null, '相手不在のforward直訴は取り下げる');
}
// 相手団体が解散 → 取り下げ
{
  const disbanded = {
    ...base,
    aiOrgs: { ...base.aiOrgs, [orgId]: { ...base.aiOrgs[orgId], disbanded: true } },
  };
  const s = Engine.challengeRequest.dropStalePending(
    withPending(disbanded, forwardPending(ownFighter.id, aiFighter.id, orgId)));
  assert.strictEqual(s.challengeRequest.pendingThisWeek, null, '解散団体へのforward直訴は取り下げる');
}
// 有効な inverse pending は残す
{
  const s = Engine.challengeRequest.dropStalePending(
    withPending(base, inversePending(aiFighter.id, ownFighter.id, orgId)));
  assert(s.challengeRequest.pendingThisWeek, '有効なinverse直訴(果たし状)を取り下げてはいけない');
}
// inverse の発起人がAI団体から不在 → 取り下げ
{
  const s = Engine.challengeRequest.dropStalePending(
    withPending(base, inversePending(MISSING_ID, ownFighter.id, orgId)));
  assert.strictEqual(s.challengeRequest.pendingThisWeek, null, '発起人不在のinverse直訴は取り下げる');
}
// pending なしは素通し(参照同一性までは要求しない)
{
  const s = Engine.challengeRequest.dropStalePending(Engine.challengeRequest.ensureInit(base));
  assert.strictEqual(s.challengeRequest.pendingThisWeek, null);
}

// ── 2. processWeekly が自浄すること(持ち越し早期returnより前) ──
{
  // 非抽選週(week=5)なら自浄後そのまま返る。孤児が残っていれば旧実装は早期returnで残置していた
  const orphan = { ...withPending(base, forwardPending(MISSING_ID, aiFighter.id, orgId)), week: 5 };
  const rng = Engine.rng.create(1);
  const s = Engine.challengeRequest.processWeekly(orphan, rng);
  assert.strictEqual(s.challengeRequest.pendingThisWeek, null,
    'processWeekly は持ち越し判定より先に孤児pendingを取り下げること');
}

// ── 3. validateGameState 不変条件(パイプライン外の孤児検出) ──
{
  const orphan = withPending(base, forwardPending(MISSING_ID, aiFighter.id, orgId));
  const warnings = collectValidationWarnings(orphan).filter(w => w.includes('直訴pendingThisWeek'));
  assert(warnings.length === 1, `孤児pendingで不変条件が1件鳴ること(実際: ${warnings.length}件)`);
}
{
  const valid = withPending(base, forwardPending(ownFighter.id, aiFighter.id, orgId));
  const warnings = collectValidationWarnings(valid).filter(w => w.includes('直訴pendingThisWeek'));
  assert(warnings.length === 0, '有効なpendingで不変条件が鳴ってはいけない');
}

// ── 4. 配線のソースレベル固定 ──
const root = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const managementJs = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');
const uiCommonJs = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const uiRenderJs = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');

// null choice(表示不能)を無条件残置に戻さない
assert(appJs.includes('Engine.challengeRequest.dropStalePending(G)'),
  'handleChallengeRequest の null 分岐は dropStalePending で孤児を取り下げること(無条件残置へ戻さない)');
// tickWeek 末尾の自浄(validateGameState の直前)
assert(managementJs.includes('Engine.challengeRequest.dropStalePending(s)'),
  'tickWeek 末尾で dropStalePending による自浄を行うこと');

// 無ドレイン閉じ経路の再発防止: 動的オーバーレイ(MutationObserver対象外)は閉じ時に明示ドレイン必須
const travelFn = uiCommonJs.slice(
  uiCommonJs.indexOf('function showTravelScene('),
  uiCommonJs.indexOf('window.showTravelScene = showTravelScene'));
assert(travelFn.includes('_drainPopupQueue()'),
  'showTravelScene の閉じ(finish)は _drainPopupQueue を呼ぶこと(travelSceneOverlayは動的でObserver監視外)');
const relmapStart = uiRenderJs.indexOf('function _relmapClosePopup(');
const relmapFn = uiRenderJs.slice(relmapStart, uiRenderJs.indexOf('function ', relmapStart + 10));
assert(relmapFn.includes('_drainPopupQueue()'),
  '_relmapClosePopup は _drainPopupQueue を呼ぶこと(relmapPopupOverlayは動的でObserver監視外)');

console.log('challenge-request-stale-pending-test: ok');
