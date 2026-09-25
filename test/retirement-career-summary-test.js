#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/retirement-career-summary-test.js — 引退セレモニーの経歴欄の回帰ガード
//  (2026-09-25 面白さ総点検 03-⑦「引退セレモニーの経歴欄が大会成績と受賞を拾わない」)
//
//  ■ 何を守るか
//    1. 経歴欄(Engine.retirement.buildCareerSummary)は「入団」+「その選手らしい瞬間」(最大3つ)+
//       「全盛期」。瞬間には天頂戦・PPV GRAND FINAL・ジュニアトーナメント・春のタッグリーグ・
//       4団体勝ち残り対抗戦・MVP・新人王・全国統一王座が入りうる(以前は1つも拾わなかった)
//    2. もう記録されない type 'summit' を探す旧実装に戻っていない
//    3. 王座に届かない選手にも瞬間が出る(大会の上位・大会ベストバウト・開眼など)
//    4. 同じ賞の繰り返しで枠が埋まらない(種類ごとに1件・系統ごとの上限)
//    5. 天頂戦の優勝と、それによる全国統一王座の戴冠を2行に割らない
//    6. 移籍で加わった選手は、移籍を入団の行として出す
//    7. EN: 日本語が残らない
//
//  ■ 使い方
//    node test/retirement-career-summary-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC_DIR = path.join(__dirname, '..', 'src');
const EN_DICT = Object.create(null);
global.window = global.window || {};
if (typeof global.window.IS_TRIAL === 'undefined') global.window.IS_TRIAL = false;
global.WM_I18N = {
  addDict(obj) { Object.assign(EN_DICT, obj); },
  addNames() {},
  addSurnames() {},
  t(text, params) {
    if (typeof text !== 'string' || !params) return text;
    let out = text;
    Object.keys(params).forEach((k) => { out = out.split('{' + k + '}').join(params[k]); });
    return out;
  },
};
const { loadGame } = require('./helpers/load-game.js');
loadGame({ full: true });
['lang-en.js', 'lang-en-templates.js'].forEach((f) => {
  new vm.Script(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'), { filename: f }).runInThisContext();
});
function enT(text, params) {
  let out = (typeof text === 'string' && EN_DICT[text] != null) ? EN_DICT[text] : text;
  if (typeof out === 'string' && params) {
    out = out.replace(/\{([A-Za-z_][A-Za-z0-9_]*)(?::[A-Za-z_]+)?\}/g, (m, k) => (params[k] != null ? String(params[k]) : m));
  }
  return out;
}
const JA_RE = /[぀-ヿ㐀-䶿一-鿿]/;

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

const mk = (history, peakOVR = 80) => ({
  id: 1, name: 'Retiree', age: 30,
  careerRecord: { ...Engine.career.createRecord(), history, peakOVR },
});
const STATE = { season: 12, orgName: 'Test Org', unifiedTitle: { history: [{ type: 'creation', season: 8, week: 48 }] } };
const texts = (items) => items.map(i => i.text);
const summaryOf = (f, dict) => Engine.retirement.buildCareerSummary(f, dict, STATE);
const assertShape = (items, label) => {
  assert.ok(items.length >= 2 && items.length <= 5, `${label}: 行数 ${items.length}(入団+瞬間最大3+全盛期)`);
  items.forEach(i => {
    assert.ok(i.icon && i.text, `${label}: icon/text が空`);
    assert.ok(!/\{[A-Za-z]+\}|undefined|null|NaN/.test(i.text), `${label}: 露出: ${i.text}`);
  });
};

section('1. 看板選手: 大会・受賞・王座から3つ選び、入団と全盛期で挟む', () => {
  const f = mk([
    { type: 'debut', season: 1, week: 1, via: 'scout' },
    { type: 'awardRookie', season: 1, week: 49 },
    { type: 'juniorTournament', season: 2, result: 'champion' },
    { type: 'titleWin', season: 3, week: 10, beltId: 'world', orgName: 'Test Org王座' },
    { type: 'titleDefense', season: 3, week: 30, beltId: 'world', orgName: 'Test Org王座', count: 5 },
    { type: 'titleLoss', season: 4, week: 20, beltId: 'world', orgName: 'Test Org王座', defenses: 5 },
    { type: 'titleWin', season: 5, week: 10, beltId: 'world', orgName: 'Test Org王座' },
    { type: 'titleLoss', season: 6, week: 20, beltId: 'world', orgName: 'Test Org王座', defenses: 2 },
    { type: 'titleWin', season: 7, week: 10, beltId: 'world', orgName: 'Test Org王座' },
    { type: 'awardMVP', season: 7, week: 49 },
    { type: 'ppvTournament', season: 8, result: 'champion' },
    { type: 'unifiedTitle', season: 8, week: 48, result: 'won' },
  ], 96);
  const items = summaryOf(f);
  assertShape(items, '看板');
  assert.deepStrictEqual(texts(items), [
    'S1 スカウト入団',
    'S7 MVP 受賞',
    'S7 Test Org王座 3度目の戴冠',
    'S8 天頂戦 優勝',
    '全盛期 OVR 96',
  ]);
  // 天頂戦の優勝と全国統一王座の戴冠(同じ瞬間)は2行に割らない
  assert.ok(!texts(items).some(t => /全国統一王座 戴冠/.test(t)), '天頂戦の優勝と統一王座の戴冠が2行に割れている');
});

section('2. 旧実装(type summit を探す・王座の獲得/陥落を1件ずつ並べる)に戻っていない', () => {
  const src = String(Engine.retirement.buildCareerSummary);
  assert.ok(!/type === 'summit'/.test(src), 'buildCareerSummary が summit を直接探している');
  assert.ok(/pickCareerMoments/.test(src), 'buildCareerSummary が瞬間の選定を通していない');
  // 王座を3度獲って3度落としても、王座の行は最大2(戴冠+防衛)
  const f = mk([
    { type: 'debut', season: 1, week: 1, via: 'draft' },
    ...[2, 4, 6].flatMap(s => [
      { type: 'titleWin', season: s, week: 10, beltId: 'world', orgName: 'Test Org王座' },
      { type: 'titleLoss', season: s + 1, week: 10, beltId: 'world', orgName: 'Test Org王座', defenses: 1 },
    ]),
  ], 85);
  const titleLines = texts(summaryOf(f)).filter(t => /王座/.test(t));
  assert.ok(titleLines.length <= 2, `王座の行が多すぎる: ${titleLines.join(' / ')}`);
});

section('3. 王座に届かない選手にも「その選手らしい瞬間」が出る(以前は入団と全盛期の2行だけ)', () => {
  const f = mk([
    { type: 'debut', season: 3, week: 1, via: 'draft' },
    { type: 'juniorTournament', season: 3, result: 'semiFinal' },
    { type: 'juniorTournamentBestBout', season: 4, week: 24, mq: 81, round: 'quarterFinal', won: true, opponentName: 'A' },
    { type: 'springTagLeague', season: 6, week: 12, result: 'runnerUp', partnerId: 2 },
    { type: 'war', season: 7, week: 20, won: true, opponentOrg: 'KINGS', opponentName: 'B' },
    { type: 'autumnWar', season: 8, result: 'semiFinal', wins: 1 },
    { type: 'ppvTournament', season: 8, result: 'firstRound' },
    { type: 'kaigan', season: 5, week: 16, opponentName: 'C', won: false, mq: 72 },
  ], 78);
  const items = summaryOf(f);
  assertShape(items, '無冠');
  assert.strictEqual(items.length, 5, '瞬間が3つ出ていない');
  assert.deepStrictEqual(texts(items).slice(1, 4), [
    'S4 ジュニアトーナメント 大会ベストバウト（試合評価 81）',
    'S5 格上との一戦を境に開眼',
    'S6 第6回 春のタッグリーグ 準優勝',
  ]);
});

section('4. 同じ賞の繰り返しで枠が埋まらない(MVP3回でも1行)', () => {
  const f = mk([
    { type: 'debut', season: 1, week: 1, via: 'draft' },
    { type: 'awardMVP', season: 5, week: 49 },
    { type: 'awardMVP', season: 6, week: 49 },
    { type: 'awardMVP', season: 7, week: 49 },
    { type: 'awardBestMatch', season: 6, week: 49, mq: 90 },
    { type: 'awardBestMatch', season: 7, week: 49, mq: 94 },
  ], 90);
  const t = texts(summaryOf(f));
  assert.strictEqual(t.filter(x => /MVP/.test(x)).length, 1, `MVP の行が複数: ${t.join(' / ')}`);
  // ベストマッチ賞は試合評価の最も高い回を代表にする
  assert.ok(t.includes('S7 ベストマッチ賞（試合評価 94）'), `ベストマッチ賞の代表が最高評価の回でない: ${t.join(' / ')}`);
});

section('5. 王座1回・長期防衛: 戴冠と防衛の両方を出す(王座の系統は2つまで)', () => {
  const f = mk([
    { type: 'debut', season: 1, week: 1, via: 'draft' },
    { type: 'titleWin', season: 3, week: 10, beltId: 'world', orgName: 'Test Org王座' },
    { type: 'titleDefense', season: 3, week: 20, beltId: 'world', orgName: 'Test Org王座', count: 3 },
    { type: 'titleDefense', season: 4, week: 20, beltId: 'world', orgName: 'Test Org王座', count: 12 },
  ], 88);
  const t = texts(summaryOf(f));
  assert.ok(t.includes('S3 Test Org王座 初戴冠'), t.join(' / '));
  assert.ok(t.includes('S4 Test Org王座 12度防衛'), `最も長い防衛が代表になっていない: ${t.join(' / ')}`);
});

section('6. 移籍で加わった選手は、移籍を入団の行として出す', () => {
  const f = mk([
    { type: 'debut', season: 1, week: 1, via: 'draft', orgName: 'KINGS' },
    { type: 'transfer', season: 5, week: 3, fromOrg: 'org_a', toOrg: 'player', via: 'poach' },
    { type: 'ppvMainEvent', season: 7, week: 48, won: false, isSummit: true, opponentName: 'D' },
  ], 84);
  const t = texts(summaryOf(f));
  assert.strictEqual(t[0], 'S5 引き抜きで加入');
  assert.ok(t.includes('S7 PPV GRAND FINAL 準優勝'), t.join(' / '));
});

section('7. EN: 経歴欄に日本語が残らない', () => {
  const f = mk([
    { type: 'debut', season: 1, week: 1, via: 'fa' },
    { type: 'juniorTournament', season: 2, result: 'runnerUp' },
    { type: 'ppvTournament', season: 4, result: 'runnerUp' },
    { type: 'autumnWar', season: 5, result: 'champion', wins: 3 },
    { type: 'mqAllTimeRecord', season: 6, week: 20, mq: 93, stage: '天頂戦', won: true, opponentName: 'Rival' },
    { type: 'unifiedTitle', season: 7, week: 12, result: 'captured' },
    { type: 'unifiedTitle', season: 7, week: 24, result: 'defense' },
  ], 91);
  const items = summaryOf(f, enT);
  assertShape(items, 'EN');
  items.forEach(i => assert.ok(!JA_RE.test(i.text), `EN の経歴欄に日本語: ${i.text}`));
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\nretirement-career-summary-test: all sections passed.');
