'use strict';
// rivalry-band-log-filter-test.js — 週のログの「因縁帯の上下」行を自団体が絡むペアに絞り、
// 引退者・休眠者のペアを外しても、因縁の記録(数値)は従来とまったく同じであることの確認
//
// 総点検 docs/fun-audit-v0.1/04-drama-engine.md 発見⑨ / 06-narrative-spotlight.md 発見⑨:
//   週のログ約468行/季のうち約308行が因縁帯の上下で、その8割は自団体が絡まないペア。
//   名前が引けない相手(引退者・休眠者)は「? vs ?」で出ていた。
// 修正後の約束:
//   - ログは自団体の選手が絡むペアだけ。「?」は出ない
//   - 引退者・休眠者が絡むペアは団体判定・帯の変化判定・ログから外す
//   - それでも rivalries の記録(lastBand / oneSided)は修正前と1件残らず同じ

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

// 修正前の checkRivalryTitles の記録部分(ログを除く)をそのまま再現した参照実装
function referenceRivalries(state) {
  const rivalries = { ...(state.rivalries || {}) };
  const pairs = new Set(Object.keys(rivalries));
  Object.keys(state.relationships || {}).forEach(key => {
    const i = key.indexOf('>');
    pairs.add(Engine.title.getRivalryKey(parseInt(key.substring(0, i), 10), parseInt(key.substring(i + 1), 10)));
  });
  for (const key of pairs) {
    const [id1, id2] = key.split('-').map(Number);
    const ps = Engine.title.getRivalryPairState(state, id1, id2);
    const entry = rivalries[key] || { matches: 0, lastWeek: 0, resolutionCount: 0, lastBand: 0, oneSided: null };
    const nextBand = ps.band ? ps.band.tier : 0;
    rivalries[key] = {
      ...entry,
      lastBand: ps.resolvedType ? 0 : nextBand,
      oneSided: ps.resolvedType ? null : (ps.isOneSided ? ps.aggressor : null),
    };
  }
  return rivalries;
}

const f = (id, name) => ({ id, name, pw: 50, sp: 50, te: 50, st: 50, mn: 50, popularity: 40 });
function rel(rels, a, b, rivAB, rivBA, bond) {
  rels[`${a}>${b}`] = { bond: bond == null ? 50 : bond, rivalry: rivAB };
  rels[`${b}>${a}`] = { bond: bond == null ? 50 : bond, rivalry: rivBA };
}

// 自団体: 1,2 / 他団体: 11,12 / FA: 21 / 引退者: 91 / 休眠者: 92
function buildState() {
  const rels = {};
  rel(rels, 1, 2, 55, 55);     // 自団体同士: 帯0→宿敵(ログ対象)
  rel(rels, 1, 11, 35, 35);    // 自団体×他団体: 帯0→因縁(ログ対象)
  rel(rels, 11, 12, 75, 75);   // 他団体同士: 帯0→宿命(ログ対象外・記録は更新)
  rel(rels, 1, 91, 80, 80);    // 自団体×引退者: 帯0→宿命(ログ対象外・記録は更新)
  rel(rels, 12, 92, 60, 20);   // 他団体×休眠者: 片側因縁(ログ対象外・oneSided は記録)
  rel(rels, 2, 21, 10, 10);    // 自団体×FA: 帯2→0(静まった — ログ対象)
  return {
    season: 5, week: 10, orgId: 'player',
    roster: [f(1, '甲'), f(2, '乙')],
    aiOrgs: { org_s: { roster: [f(11, '丙'), f(12, '丁')] } },
    freeAgents: [f(21, '戊')],
    dormantPool: [{ id: 92, age: 18 }],
    retiredIds: [91],
    relationships: rels,
    rivalries: { '2-21': { matches: 3, lastWeek: 8, resolutionCount: 0, lastBand: 2, oneSided: null } },
  };
}

console.log('=== 因縁帯の上下ログ: 自団体に絞る/引退者・休眠者を外す ===\n');

section('ログは自団体の選手が絡むペアだけ。「?」は出ない', () => {
  const s = buildState();
  const r = Engine.title.checkRivalryTitles(s);
  const lines = r.events;
  assert.ok(lines.every(l => !l.includes('?')), `「?」が出ている: ${JSON.stringify(lines)}`);
  assert.ok(lines.some(l => l.includes('甲 vs 乙') && l.includes('宿敵が深まっている')), '自団体同士の帯の上昇が出ない');
  assert.ok(lines.some(l => l.includes('甲 vs 丙') && l.includes('因縁が深まっている')), '自団体×他団体の帯の上昇が出ない');
  assert.ok(lines.some(l => l.includes('乙 vs 戊') && l.includes('因縁はひとまず静まった')), '自団体×FAの沈静が出ない');
  assert.ok(!lines.some(l => l.includes('丙 vs 丁')), '他団体同士のペアがログに出た');
  assert.strictEqual(lines.length, 3, `想定外の行数: ${JSON.stringify(lines)}`);
});

section('記録(lastBand / oneSided)は修正前の式と1件残らず一致する(引退者・休眠者のペアも更新される)', () => {
  const s = buildState();
  const got = Engine.title.checkRivalryTitles(s).state.rivalries;
  const want = referenceRivalries(s);
  assert.deepStrictEqual(got, want);
  assert.strictEqual(got['1-91'].lastBand, 3, '引退者のペアの記録が止まっている');
  assert.strictEqual(got['12-92'].oneSided, 12, '休眠者のペアの片側因縁の記録が止まっている');
  assert.strictEqual(got['11-12'].lastBand, 3, '他団体同士の記録が止まっている');
});

section('2週目: 帯が変わらなければ何も出ない/変わった自団体ペアだけ出る', () => {
  let s = buildState();
  s = Engine.title.checkRivalryTitles(s).state;
  let r = Engine.title.checkRivalryTitles({ ...s, week: 11 });
  assert.deepStrictEqual(r.events, [], '帯が変わっていないのにログが出た');
  const rels = { ...r.state.relationships };
  rel(rels, 1, 2, 45, 45);       // 宿敵 → 因縁
  rel(rels, 1, 91, 20, 20);      // 引退者のペアが動いても(通常は凍結)ログは出ない
  const s3 = { ...r.state, week: 12, relationships: rels };
  r = Engine.title.checkRivalryTitles(s3);
  assert.deepStrictEqual(r.events, ['⚡ 甲 vs 乙 — 因縁に落ち着いた']);
  assert.deepStrictEqual(r.state.rivalries, referenceRivalries(s3));
});

section('getRivalryPairState は切り出した共通部分と同じ値を返す(団体判定・対戦数を足しただけ)', () => {
  const s = buildState();
  const core = Engine.title.getRivalryPairCore(s, 1, 2);
  const full = Engine.title.getRivalryPairState(s, 1, 2);
  Object.keys(core).forEach(k => assert.deepStrictEqual(full[k], core[k], `${k} が食い違う`));
  assert.strictEqual(full.isCrossOrg, false);
  assert.strictEqual(Engine.title.getRivalryPairState(s, 1, 11).isCrossOrg, true);
  assert.strictEqual(full.idA, 1);
  assert.strictEqual(full.idB, 2);
});

console.log('');
if (failed > 0) {
  console.log(`FAIL: ${failed} section(s)`);
  process.exit(1);
}
console.log('ALL PASS');
