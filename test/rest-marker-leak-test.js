#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/rest-marker-leak-test.js — 休養の印を団体の「次の興行」までに限る(2026-09-26 Keisuke 裁定「直す」)
//
//  ■ 何を守るか
//    休養の印(休養願いの受諾・休暇辞令の forcedRest / 休暇の onLeave / 謹慎 suspended)は、付けた団体の次の興行までのもの。
//    自団体では週次処理と興行の開始(Engine.show.beginShow)で外れるが、以前は
//    - AI団体の休養願いの受諾(processAIWeeklyEvent → applyChoiceEffect の S3)で付いた forcedRest を AI団体では誰も外さず、
//      受諾した選手に何十週〜数季残っていた(seed 42 の大庭愛菜が S2W12 から 95週。直訴の発火と予約、団体の層の厚み
//      getDepthProfile がその選手を「出られない」と数えていた)
//    - 団体を離れる選手(フリーへ・他団体へ)が印を持ち出すと、行き先では誰も外さなかった
//    直したこと:
//    - AI団体の興行の開始(processAIWeek の通常興行週)で AI団体の休養の印を外す(自団体と同じ「次の興行」まで)
//    - 団体を離れる経路(releaseToMarket・引き抜き resolvePoach・契約満了/突然の退団の移籍・放出の獲得 claimDepartedStar)で外す
//    - ロード時の修復: フリーの選手と AI団体の onLeave・suspended は毎回、AI団体の forcedRest は古いセーブで1回だけ外す
//    - validateGameState: フリーの選手の印・AI団体の onLeave/suspended を不変条件に
//
//  変更前のコードでは §1〜§6 が失敗する(AI の印が残り続ける・手放した選手が印を持ち出す・ロード時に外れない)。
//  前後の件数(印の残り・直訴・団体の評価)は tools/rest-marker-leak-compare.js。
//
//  ■ 使い方
//    node test/rest-marker-leak-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n        ') : e)); }
}
const clone = o => JSON.parse(JSON.stringify(o));
const MARKERS = ['forcedRest', 'onLeave', 'suspended'];
const marked = f => !!f && MARKERS.some(k => !!f[k]);
const markerKeys = f => MARKERS.filter(k => f && Object.prototype.hasOwnProperty.call(f, k) && f[k]);
const withMarkers = f => ({ ...f, forcedRest: true, onLeave: { weeksLeft: 2, totalWeeks: 3 }, suspended: true });
const stubbed = (obj, key, fn, body) => {
  const orig = obj[key];
  obj[key] = fn;
  try { return body(); } finally { obj[key] = orig; }
};

console.log('休養の印を団体の「次の興行」までに限る 回帰ガード');

const base = Engine.createInitialState(42, true);

// ── 1. 実際の進行(seed 42 の S1〜S3): AI団体の印は次の AI の興行で外れる・フリーの選手と AI団体の休暇/謹慎は無い ──
section('seed 42 の S1〜S3: AI団体の休養の印が6週より長く残らない・フリーの選手に印が無い', () => {
  const streak = new Map();
  let maxStreak = 0;
  let maxWho = '';
  let everAi = 0;
  const faMarked = [];
  const aiLeave = [];
  advanceUntil({
    seed: 42,
    maxWeeks: 60 * 4,
    until: G => {
      if (G.season > 3) return true;
      const seen = new Set();
      Object.entries(G.aiOrgs || {}).forEach(([orgId, org]) => (org.roster || []).forEach(f => {
        if (f.onLeave || f.suspended) aiLeave.push(`${f.name}@S${G.season}W${G.week}`);
        if (!f.forcedRest) return;
        seen.add(f.id);
        everAi += 1;
        const n = (streak.get(f.id) || 0) + 1;
        streak.set(f.id, n);
        if (n > maxStreak) { maxStreak = n; maxWho = `${f.name}(${orgId}) S${G.season}W${G.week}`; }
      }));
      [...streak.keys()].forEach(id => { if (!seen.has(id)) streak.delete(id); });
      (G.freeAgents || []).forEach(f => { if (marked(f)) faMarked.push(`${f.name}@S${G.season}W${G.week}`); });
      return false;
    },
  });
  assert.ok(everAi > 0, 'seed 42 の S1〜S3 に AI団体の休養願いの受諾が1度も無い(標本が変わった。シードか季を見直す)');
  assert.ok(maxStreak <= 6, `AI団体の休養の印が ${maxStreak} 週残った(次の AI の興行で外れるはず): ${maxWho}`);
  assert.deepStrictEqual(faMarked, [], `フリーの選手に休養の印: ${faMarked.slice(0, 5).join(', ')}`);
  assert.deepStrictEqual(aiLeave, [], `AI団体の選手に休暇・謹慎の印: ${aiLeave.slice(0, 5).join(', ')}`);
});

// ── 2. processAIWeek: 通常興行週に外れる・興行の無い週は残る(AI 自身の休養は次の興行まで) ──
section('processAIWeek: AI団体の休養の印は通常興行週の興行の開始で外れ、興行の無い週は残る', () => {
  const orgDef = RIVAL_ORGS.find(o => base.aiOrgs[o.id] && (base.aiOrgs[o.id].roster || []).length >= 6);
  const org = base.aiOrgs[orgDef.id];
  const target = org.roster[0];
  const markedState = w => ({
    ...clone(base), week: w,
    aiOrgs: { ...clone(base.aiOrgs), [orgDef.id]: { ...clone(org), roster: org.roster.map(f => f.id === target.id ? { ...clone(f), forcedRest: true } : clone(f)) } },
  });
  const run = w => {
    const s = markedState(w);
    const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, w, 0x7E57));
    return Engine.rival.processAIWeek(rng, s, orgDef).roster.find(f => f.id === target.id);
  };
  assert.ok(Engine.util.isRegularShowWeek(14) && !Engine.util.isShowWeek(13) && !Engine.util.isRegularShowWeek(12));
  const afterShow = run(14);
  assert.ok(afterShow, 'AI団体の選手がいない');
  assert.ok(!afterShow.forcedRest, 'AI団体の通常興行週を過ぎても休養の印が残った(興行の開始で外すはず)');
  assert.strictEqual(run(13).forcedRest, true, '興行の無い週に AI団体の休養の印を外した(AI 自身の休養は次の興行まで)');
  assert.strictEqual(run(12).forcedRest, true, '大会の週(通常興行ではない)に AI団体の休養の印を外した');
});

// ── 3. releaseToMarket: フリーへ出す選手から印を外す(ほかの欄はそのまま) ──
section('releaseToMarket: 手放した選手はフリーで休養の印を持たない', () => {
  const f = withMarkers(clone(base.roster.find(c => Engine.life.hasDebuted(c)) || base.roster[0]));
  const s = Engine.util.releaseToMarket(clone(base), f, 'player');
  const fa = s.freeAgents.find(c => c.id === f.id);
  assert.ok(fa, 'フリーに入っていない');
  assert.deepStrictEqual(markerKeys(fa), [], `フリーの選手に印が残った: ${markerKeys(fa).join(',')}`);
  assert.strictEqual(fa.name, f.name);
  assert.strictEqual(fa.pw, f.pw);
  const plain = Engine.util.releaseToMarket(clone(base), clone(base.roster[1]), 'player').freeAgents.find(c => c.id === base.roster[1].id);
  assert.ok(plain && !('forcedRest' in plain && plain.forcedRest), '印の無い選手に何か付いた');
  assert.strictEqual(Engine.util.stripRestMarkers(base.roster[1]), base.roster[1], '印の無い選手は同じものを返す(写しを作らない)');
});

// ── 4. 引き抜き(resolvePoach): 移籍先の AI団体で印を持たない ──
section('引き抜き(受諾・引き留め失敗の両方の経路)で移籍した選手は印を持たない', () => {
  const orgDef = RIVAL_ORGS.find(o => base.aiOrgs[o.id]);
  const f = withMarkers(clone(base.roster[2]));
  const s = { ...clone(base), roster: base.roster.map(c => c.id === f.id ? f : clone(c)),
    pendingPoach: [{ fighter: f, org: { id: orgDef.id, name: orgDef.name }, fee: 100 }] };
  const accepted = Engine.transfer.resolvePoach(s, f.id, true).state;
  const moved = accepted.aiOrgs[orgDef.id].roster.find(c => c.id === f.id);
  assert.ok(moved, '引き抜きで移籍していない');
  assert.deepStrictEqual(markerKeys(moved), [], `引き抜きで移籍した選手に印が残った: ${markerKeys(moved).join(',')}`);
  // 引き留め失敗(乱数次第)。移籍したときだけ確かめる
  let forcedChecked = false;
  for (let seed = 1; seed <= 40 && !forcedChecked; seed += 1) {
    const r = Engine.transfer.resolvePoach({ ...s, rngSeed: seed, titles: { ...(s.titles || {}), world: { ...((s.titles || {}).world || {}), championId: null } } }, f.id, false).state;
    const mv = r.aiOrgs[orgDef.id].roster.find(c => c.id === f.id);
    if (mv) {
      forcedChecked = true;
      assert.deepStrictEqual(markerKeys(mv), [], `引き留め失敗で移籍した選手に印が残った: ${markerKeys(mv).join(',')}`);
    }
  }
  assert.ok(forcedChecked, '引き留め失敗の経路を1度も通せなかった(信頼の帯と乱数を見直す)');
});

// ── 5. 契約満了の移籍・突然の退団の移籍・放出の獲得(claimDepartedStar): 移籍先で印を持たない ──
section('契約満了/突然の退団の移籍・放出の獲得で移籍した選手は印を持たない', () => {
  const orgDef = RIVAL_ORGS.find(o => base.aiOrgs[o.id]);
  const notClaimed = () => ({ claimed: false });
  // 契約満了(processDeparture の 'rival')
  {
    const f = withMarkers(clone(base.roster[3]));
    const s = { ...clone(base), roster: base.roster.map(c => c.id === f.id ? f : clone(c)) };
    const out = stubbed(Engine.contract, 'determineDeparture', () => ({ type: 'rival', orgId: orgDef.id, orgName: orgDef.name }),
      () => stubbed(Engine.rival, 'claimDepartedStar', notClaimed,
        () => Engine.contract.processDeparture(Engine.rng.create(7), f, s)));
    const moved = out.state.aiOrgs[orgDef.id].roster.find(c => c.id === f.id);
    assert.ok(moved, '契約満了で移籍していない');
    assert.deepStrictEqual(markerKeys(moved), [], `契約満了で移籍した選手に印が残った: ${markerKeys(moved).join(',')}`);
  }
  // 突然の退団(applySuddenDepartures の 'rival')
  {
    const f = withMarkers(clone(base.roster[4]));
    const s = { ...clone(base), roster: base.roster.map(c => c.id === f.id ? f : clone(c)) };
    const rest = s.roster.filter(c => c.id !== f.id);
    const out = stubbed(Engine.trust, 'checkSuddenDepartures',
      () => ({ departed: [{ fighter: f, name: f.name, destination: 'rival' }], roster: rest, lockerRoomMorale: s.lockerRoomMorale }),
      () => stubbed(Engine.rival, 'claimDepartedStar', notClaimed, () => Engine.show.applySuddenDepartures(s)));
    const moved = Object.values(out.state.aiOrgs).flatMap(o => o.roster || []).find(c => c.id === f.id);
    assert.ok(moved, '突然の退団で移籍していない');
    assert.deepStrictEqual(markerKeys(moved), [], `突然の退団で移籍した選手に印が残った: ${markerKeys(moved).join(',')}`);
  }
  // 放出の獲得(claimDepartedStar 本体)。獲りに来る目安(OVR)を下げて必ず獲らせる
  {
    const top = [...base.roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
    const f = withMarkers(clone(top));
    const s = { ...clone(base), roster: base.roster.filter(c => c.id !== f.id).map(clone) };
    const r = Engine.rival.claimDepartedStar(Engine.rng.create(11), s, f, { fromOrgName: 'player', via: 'test', threshold: 1 });
    assert.ok(r.claimed, '放出の獲得が起きなかった(標本の選手を見直す)');
    const moved = r.state.aiOrgs[r.orgId].roster.find(c => c.id === f.id);
    assert.deepStrictEqual(markerKeys(moved), [], `放出の獲得で移籍した選手に印が残った: ${markerKeys(moved).join(',')}`);
  }
});

// ── 6. ロード時の修復 ──
section('ロード時の修復: 古いセーブの印は外れ、直したセーブでは AI 自身の休養を縮めない', () => {
  const orgDef = RIVAL_ORGS.find(o => base.aiOrgs[o.id] && (base.aiOrgs[o.id].roster || []).length >= 2);
  const flag = Engine.saveDoctor.REST_MARKER_MIGRATION_FLAG;
  const make = withFlag => {
    const s = clone(base);
    const org = s.aiOrgs[orgDef.id];
    org.roster[0] = { ...org.roster[0], forcedRest: true };
    org.roster[1] = { ...org.roster[1], onLeave: { weeksLeft: 1, totalWeeks: 2 }, suspended: true };
    s.freeAgents[0] = { ...s.freeAgents[0], forcedRest: true };
    if (withFlag) s[flag] = true; else delete s[flag];
    return { s, ids: [org.roster[0].id, org.roster[1].id, s.freeAgents[0].id] };
  };
  const findAny = (st, id) => [...Object.values(st.aiOrgs).flatMap(o => o.roster || []), ...st.freeAgents].find(c => c.id === id);
  // 古いセーブ(印なし): 全部外れて、印が付く
  {
    const { s, ids } = make(false);
    const r = Engine.saveDoctor.repairOnLoad(s);
    ids.forEach(id => assert.deepStrictEqual(markerKeys(findAny(r.state, id)), [], `古いセーブの印が外れていない: id ${id}`));
    assert.strictEqual(r.state[flag], true, '1回だけの取り外しの印が付いていない');
    assert.ok(r.changes.some(c => /^rest_markers_stripped:3$/.test(c)), `修復の記録が無い: ${r.changes.join(' / ')}`);
  }
  // 直したセーブ(印あり): AI 自身の休養(forcedRest)は残し、付かないはずの印(フリー・休暇・謹慎)だけ外す
  {
    const { s, ids } = make(true);
    const r = Engine.saveDoctor.repairOnLoad(s);
    assert.strictEqual(findAny(r.state, ids[0]).forcedRest, true, '直したセーブで AI 自身の休養の印を外した(保存→ロードで休養が縮む)');
    assert.deepStrictEqual(markerKeys(findAny(r.state, ids[1])), [], 'AI団体の休暇・謹慎の印が外れていない');
    assert.deepStrictEqual(markerKeys(findAny(r.state, ids[2])), [], 'フリーの選手の印が外れていない');
  }
  // 新しいゲームは印を持っている(ロードで AI の休養を縮めない)
  assert.strictEqual(base[flag], true, '新しいゲームに1回だけの取り外しの印が無い');
});

// ── 7. validateGameState: 持ち出された印を不変条件で拾う ──
section('validateGameState: フリーの選手の印・AI団体の休暇/謹慎を報告する(AI 自身の休養は報告しない)', () => {
  const orgDef = RIVAL_ORGS.find(o => base.aiOrgs[o.id] && (base.aiOrgs[o.id].roster || []).length >= 2);
  const s = clone(base);
  s.freeAgents[0] = { ...s.freeAgents[0], forcedRest: true };
  s.aiOrgs[orgDef.id].roster[0] = { ...s.aiOrgs[orgDef.id].roster[0], onLeave: { weeksLeft: 1, totalWeeks: 1 } };
  s.aiOrgs[orgDef.id].roster[1] = { ...s.aiOrgs[orgDef.id].roster[1], forcedRest: true };
  const warns = [];
  const origWarn = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try { Engine.validateGameState(s); } finally { console.warn = origWarn; }
  const hits = warns.filter(w => /休養の印/.test(w));
  assert.strictEqual(hits.length, 2, `休養の印の報告が ${hits.length} 件(2件のはず): ${hits.join(' / ')}`);
  assert.ok(hits.some(w => w.includes(s.freeAgents[0].name)) && hits.some(w => w.includes(s.aiOrgs[orgDef.id].roster[0].name)));
});

if (failed > 0) {
  console.log(`\nrest-marker-leak-test: ${failed} section(s) FAILED`);
  process.exit(1);
}
console.log('\nrest-marker-leak-test: ok');
