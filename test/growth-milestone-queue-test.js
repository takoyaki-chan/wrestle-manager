'use strict';
// growth-milestone-queue-test.js — 成長の節目通知が「興行で越えた分」と「同じ週に重なった分」を落とさないことの確認
//
// 総点検 docs/fun-audit-v0.1/03-career-lifecycle.md 発見⑥:
//   (i)  試合成長は興行処理(tickWeek の外)で入るのに、節目の検出は tickWeek 冒頭のスナップショットとの
//        差分しか見ていなかった → 興行で閾値を越えた分は一度も差分に現れない
//   (ii) 通知は2週に1件・同じ週の候補から1件だけ選び、残りは保留されずに消えていた
// 修正後の約束:
//   - 前回の検出時の値(同じシーズンの前週以前)を基準にするので、検出と検出の間の伸びは全部拾う
//   - 落ちた節目は選手×種別で保留され、通知枠(2週に1件)が空いたときに出る(頻度の上限は不変)
//   - 同じ選手・同じ種別の古い節目は新しい節目へ畳まれ、下の閾値も通知済みになる
//   - 団体を去った選手・閾値を下回った節目は出さない(下回った分は通知済みにしない)

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

const GM = Engine.growthMilestone;
const ALL_OVR = GM.OVR_THRESHOLDS.slice();
const ALL_POP = GM.POP_THRESHOLDS.slice();
const ALL_CAP = ['pw', 'sp', 'te', 'st', 'mn'];

// 総合力 = 5能力の平均(四捨五入)。全能力を同じ値にすれば OVR = その値
function fighter(id, ovr, pop, extra) {
  return Object.assign({
    id, name: `選手${id}`, pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr, popularity: pop,
    trainCap: { pw: 99, sp: 99, te: 99, st: 99, mn: 99 },
    _milestonesNotified: {
      ovr: ALL_OVR.filter(t => ovr >= t),
      pop: ALL_POP.filter(t => pop >= t),
      cap: [],
    },
  }, extra || {});
}
function withOvr(f, ovr) { return { ...f, pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr }; }
function state(season, week, roster, extra) {
  return Object.assign({ season, week, offSeason: false, roster, _lastMilestoneAbsWeek: 0 }, extra || {});
}
// tickWeek 内と同じ手順で1回検出する(基準点 → 検出 → 保留列と基準の更新)
function runDetect(s) {
  const prev = GM.baselineFor(s);
  const r = GM.detect(null, s, prev);
  let next = { ...s, roster: r.roster, _milestoneQueue: r.queue, _milestoneBaseline: GM.captureBaseline(s) };
  if (r.milestone) next = { ...next, _pendingMilestone: r.milestone, _lastMilestoneAbsWeek: (s.season - 1) * 48 + s.week };
  return { state: next, milestone: r.milestone, queue: r.queue };
}

console.log('=== 成長の節目通知: 基準点と保留列 ===\n');

section('(i) 前回の検出時の値を基準にすると、興行(tickWeek の外)で越えた閾値を拾う', () => {
  let s = state(3, 10, [fighter(1, 63, 40)]);
  s = runDetect(s).state; // 第10週の検出。基準 = 総合力63
  // 第11週: 興行で伸びた(tickWeek の前に 63 → 66)
  s = { ...s, week: 11, roster: [withOvr(s.roster[0], 66)] };
  const r = runDetect(s);
  assert.ok(r.milestone, '興行で総合力65を越えたのに通知されない');
  assert.strictEqual(r.milestone.type, 'ovr');
  assert.strictEqual(r.milestone.value, 65);
  assert.strictEqual(r.milestone.fighterId, 1);
});

section('(i) 旧来の「冒頭の値」基準では同じ伸びが見えない(修正の必要性の確認)', () => {
  // 基準が無い(旧セーブ・開幕週)と冒頭の値=66 と比べることになり、差分が出ない
  const s = state(3, 11, [fighter(1, 66, 40, { _milestonesNotified: { ovr: [], pop: [], cap: [] } })]);
  const r = runDetect(s);
  assert.strictEqual(r.milestone, null, '基準が無いのに通知が出た(冒頭基準のはず)');
});

section('(i) シーズンをまたいだ基準・オフ中は使わない(冒頭の値へ戻る)', () => {
  const base = GM.captureBaseline(state(2, 47, [fighter(1, 60, 40)]));
  const f66 = withOvr(fighter(1, 60, 40), 66);
  const nextSeason = state(3, 1, [f66], { _milestoneBaseline: base });
  assert.strictEqual(GM.baselineFor(nextSeason)[0].ovr, 66, '前シーズンの基準を使ってしまう');
  const offSeason = state(2, 48, [f66], { offSeason: true, _milestoneBaseline: base });
  assert.strictEqual(GM.baselineFor(offSeason)[0].ovr, 66, 'オフ中に基準を使ってしまう');
  const sameWeek = state(2, 47, [f66], { _milestoneBaseline: base });
  assert.strictEqual(GM.baselineFor(sameWeek)[0].ovr, 66, '同じ週の基準を使ってしまう(二重検出の恐れ)');
  const nextWeek = state(2, 48, [f66], { _milestoneBaseline: base });
  assert.strictEqual(GM.baselineFor(nextWeek)[0].ovr, 60, '同じシーズンの前週の基準が使われない');
});

section('(i) 基準の後に加入した選手は冒頭の値で補う(加入前の閾値を通知しない)', () => {
  const base = GM.captureBaseline(state(3, 10, [fighter(1, 60, 40)]));
  const newcomer = fighter(2, 72, 40, { _milestonesNotified: { ovr: [], pop: [], cap: [] } });
  const s = state(3, 11, [fighter(1, 60, 40), newcomer], { _milestoneBaseline: base });
  const r = runDetect(s);
  assert.strictEqual(r.milestone, null, '加入時点で既に越えていた閾値を通知した');
  assert.strictEqual(r.queue.length, 0);
});

section('(ii) 同じ週に2人が越えたら1件出し、残りは保留して2週後に出す', () => {
  let s = state(3, 10, [fighter(1, 63, 40), fighter(2, 68, 40)]);
  s = runDetect(s).state;
  s = { ...s, week: 11, roster: [withOvr(s.roster[0], 66), withOvr(s.roster[1], 71)] };
  let r = runDetect(s);
  assert.ok(r.milestone, '1件目が出ない');
  assert.strictEqual(r.milestone.fighterId, 2, '優先度(高い閾値)の順になっていない');
  assert.strictEqual(r.milestone.value, 70);
  assert.strictEqual(r.queue.length, 1, '2件目が保留されていない');
  assert.strictEqual(r.queue[0].fighterId, 1);
  // 翌週(第12週)は枠が空いていない(2週に1件)。保留は残る
  s = { ...r.state, week: 12 };
  r = runDetect(s);
  assert.strictEqual(r.milestone, null, '通知の頻度の上限(2週に1件)を破った');
  assert.strictEqual(r.queue.length, 1, '枠待ちの間に保留が消えた');
  // 第13週で出る
  s = { ...r.state, week: 13 };
  r = runDetect(s);
  assert.ok(r.milestone, '保留した節目が出ない');
  assert.strictEqual(r.milestone.fighterId, 1);
  assert.strictEqual(r.milestone.value, 65);
  assert.strictEqual(r.queue.length, 0);
  assert.ok(r.state.roster.find(c => c.id === 1)._milestonesNotified.ovr.includes(65), '通知済みに記録されない');
});

section('(ii) 同じ選手の古い節目は新しい節目へ畳み、下の閾値も通知済みにする', () => {
  let s = state(3, 10, [fighter(1, 63, 40), fighter(2, 68, 40)], { _lastMilestoneAbsWeek: (3 - 1) * 48 + 10 });
  s = runDetect(s).state; // 枠が埋まっている週(直前に別の通知が出た)
  s = { ...s, week: 11, roster: [withOvr(s.roster[0], 66), s.roster[1]] };
  let r = runDetect(s);
  assert.strictEqual(r.milestone, null);
  assert.deepStrictEqual(r.queue.map(e => [e.fighterId, e.value]), [[1, 65]]);
  // 保留中にさらに伸びて70も越えた → 70の1件に畳まれる
  s = { ...r.state, week: 12, roster: [withOvr(r.state.roster[0], 71), r.state.roster[1]] };
  r = runDetect(s);
  assert.ok(r.milestone, '畳んだ節目が出ない');
  assert.strictEqual(r.milestone.value, 70, '新しい節目に畳まれていない');
  assert.strictEqual(r.queue.length, 0, '古い節目が別に残っている');
  const n = r.state.roster.find(c => c.id === 1)._milestonesNotified.ovr;
  assert.ok(n.includes(65) && n.includes(70), `下の閾値が通知済みにならない: ${JSON.stringify(n)}`);
});

section('(ii) 団体を去った選手・閾値を下回った節目は出さない(下回った分は通知済みにしない)', () => {
  let s = state(3, 10, [fighter(1, 63, 40), fighter(2, 63, 40), fighter(3, 68, 40)]);
  s = runDetect(s).state;
  s = { ...s, week: 11, roster: [withOvr(s.roster[0], 66), withOvr(s.roster[1], 66), withOvr(s.roster[2], 71)] };
  let r = runDetect(s);
  assert.strictEqual(r.milestone.fighterId, 3);
  assert.strictEqual(r.queue.length, 2);
  // 選手1は退団、選手2は衰えて64に下がった
  s = { ...r.state, week: 13, roster: [withOvr(r.state.roster[1], 64), r.state.roster[2]] };
  r = runDetect(s);
  assert.strictEqual(r.milestone, null, '去った選手/下回った節目を通知した');
  assert.strictEqual(r.queue.length, 0, '出せない節目が保留に残っている');
  assert.ok(!r.state.roster.find(c => c.id === 2)._milestonesNotified.ovr.includes(65),
    '下回った節目を通知済みにした(また越えたときに拾えない)');
});

section('人気・限界到達も同じ保留列に乗る(限界到達は能力ごと)', () => {
  let s = state(3, 10, [fighter(1, 60, 48, { trainCap: { pw: 61, sp: 61, te: 99, st: 99, mn: 99 } })]);
  s = runDetect(s).state;
  const grown = { ...s.roster[0], pw: 61, sp: 61, popularity: 52 };
  s = { ...s, week: 11, roster: [grown] };
  let r = runDetect(s);
  assert.ok(r.milestone);
  // 優先度は既存の表のまま(人気50 = 40+50 = 90 > 限界到達 = 75)
  assert.strictEqual(r.milestone.type, 'pop');
  assert.deepStrictEqual(r.queue.map(e => e.type + ':' + e.stat).sort(), ['cap:pw', 'cap:sp']);
});

section('実 tickWeek: 興行相当の伸び(tickWeek の前)が次の tickWeek で通知される', () => {
  let G = Engine.createInitialState(20260925, true);
  assert.ok(!G.offSeason, '初期状態がオフシーズン');
  // 対象以外は全閾値を通知済みにして、対象の総合力65だけが候補になるようにする
  const target = G.roster[0];
  const lock = (c) => ({ ...c, _milestonesNotified: { ovr: ALL_OVR.slice(), pop: ALL_POP.slice(), cap: ALL_CAP.slice() } });
  G = { ...G, roster: G.roster.map(c => c.id === target.id
    ? { ...withOvr(c, 58), _milestonesNotified: { ovr: [], pop: ALL_POP.slice(), cap: ALL_CAP.slice() } }
    : lock(c)) };
  let r = Engine.tickWeek(G);
  G = r.state;
  assert.ok(G._milestoneBaseline && G._milestoneBaseline.entries[target.id], 'tickWeek が基準を残さない');
  G = Engine.advanceWeek(G).state;
  assert.ok(!G.offSeason && G.season === G._milestoneBaseline.season, '想定外の季節遷移');
  // 興行で伸びた(ここで tickWeek の外から総合力を66へ)
  G = { ...G, roster: G.roster.map(c => c.id === target.id ? withOvr(c, 66) : c) };
  r = Engine.tickWeek(G);
  const m = r.state._pendingMilestone;
  assert.ok(m, '興行で越えた閾値が tickWeek で通知されない');
  assert.strictEqual(m.fighterId, target.id);
  assert.strictEqual(m.type, 'ovr');
  assert.strictEqual(m.value, 65);
});

console.log('');
if (failed > 0) {
  console.log(`FAIL: ${failed} section(s)`);
  process.exit(1);
}
console.log('ALL PASS');
