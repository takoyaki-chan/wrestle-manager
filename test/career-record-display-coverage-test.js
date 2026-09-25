#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/career-record-display-coverage-test.js — 記録の「描き漏れ」回帰ガード
//  (2026-09-25 面白さ総点検 06-①「経歴年表・年代記・殿堂の実績欄が最大級の実績を描かない」)
//
//  ■ 何を守るか
//    A. 経歴年表(Engine.milestone.get)が、careerRecord.history に記録される
//       天頂戦(ppvTournament)/全国統一王座(unifiedTitle)/4団体勝ち残り対抗戦(autumnWar)/
//       歴代最高評価(mqAllTimeRecord)/大会ベストバウト(tenchosenBestBout・juniorTournamentBestBout)/
//       確執(feud)/開眼(kaigan)を行として描く(以前は default で読み捨てていた)
//    B. 「特記事項なし」は**その年の記録の有無**で決まる(行の有無ではない)。
//       天頂戦で優勝した年が「特記事項なし」にならない
//    C. 引退行の注記は実際に記録される reason 値(wearInjury/careerEnding/lastrun/motivation…)で引く
//    D. 不変条件: calcHofPoints が数える type は、すべて殿堂の実績欄(buildCareerHighlights)と
//       経歴年表が描く。数える type はソースから機械的に拾うので、加点の種類を増やしたのに
//       ここへフィクスチャを足さないと失敗する
//    E. 殿堂の実績欄: 「○○王座王座」の二重表記が無い/PPV GRAND FINAL の優勝を描く
//    F. 年代記の章ハイライトに天頂戦・4団体勝ち残り対抗戦・全国統一王座が出る
//    G. 開眼の発火が careerRecord.history に刻まれる(数値の欄は変えない)
//    H. EN: 新しく描く行が EN 辞書で引ける(日本語が残らない)
//
//  ■ 使い方
//    node test/career-record-display-coverage-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC_DIR = path.join(__dirname, '..', 'src');

// EN辞書を集めるため、エンジン読み込み前に addDict を持つ WM_I18N スタブを置く
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

// EN の辞書参照関数(WM_I18N.t と同じ (text, params) 契約。辞書に無ければ原文 = fail-open)
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

const FID = 9001;
// 1選手だけのGを作る。debut は S1 なので「キャリアN年目」= シーズンN
function stateWith(history, opts = {}) {
  const fighter = {
    id: FID, name: 'Test Fighter', age: 24, pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    careerRecord: { ...Engine.career.createRecord(), history: [{ type: 'debut', season: 1, week: 1, via: 'draft' }, ...history] },
    careerHistory: opts.careerHistory || [],
  };
  return {
    season: opts.season || 10, week: 10, orgName: 'Test Org',
    roster: [fighter], aiOrgs: {}, retiredFighters: [], freeAgents: [],
    unifiedTitle: opts.unifiedTitle || null,
  };
}
const rowsOf = (G, dict) => Engine.milestone.get(G, FID, dict);
const eventRows = (rows) => rows.filter(r => r.type !== 'season_end' && r.type !== 'debut');
const assertCleanRow = (r, label) => {
  assert.ok(r && typeof r.text === 'string' && r.text.length > 0, `${label}: 行の本文が空`);
  assert.ok(!/\{[A-Za-z]+\}/.test(r.text + (r.detail || '')), `${label}: プレースホルダが残っている: ${r.text} / ${r.detail}`);
  assert.ok(!/undefined|null|NaN/.test(r.text + (r.detail || '')), `${label}: undefined 等が露出: ${r.text} / ${r.detail}`);
};

// ── A. 7種+開眼を年表に描く ──
section('A. 天頂戦・全国統一王座・4団体戦・歴代最高評価・大会ベストバウト・確執・開眼を年表に描く', () => {
  const cases = [
    { ev: { type: 'ppvTournament', season: 4, result: 'champion' }, rowType: 'tenchosen', text: '天頂戦 優勝' },
    { ev: { type: 'ppvTournament', season: 4, result: 'runnerUp' }, rowType: 'tenchosen', text: '天頂戦 準優勝' },
    { ev: { type: 'ppvTournament', season: 4, result: 'semiFinal' }, rowType: 'tenchosen', text: '天頂戦 準決勝敗退' },
    { ev: { type: 'ppvTournament', season: 4, result: 'quarterFinal' }, rowType: 'tenchosen', text: '天頂戦 準々決勝敗退' },
    { ev: { type: 'ppvTournament', season: 4, result: 'firstRound' }, rowType: 'tenchosen', text: '天頂戦 出場（1回戦敗退）' },
    { ev: { type: 'unifiedTitle', season: 4, week: 48, result: 'won' }, rowType: 'unified_title', text: '全国統一王座 戴冠' },
    { ev: { type: 'unifiedTitle', season: 5, week: 12, result: 'captured' }, rowType: 'unified_title', text: '全国統一王座 奪取' },
    { ev: { type: 'autumnWar', season: 3, result: 'champion', wins: 3 }, rowType: 'autumn_war', text: '4団体勝ち残り対抗戦 優勝', detail: '個人3勝' },
    { ev: { type: 'autumnWar', season: 3, result: 'semiFinal', wins: 0 }, rowType: 'autumn_war', text: '4団体勝ち残り対抗戦 準決勝敗退', detail: undefined },
    { ev: { type: 'mqAllTimeRecord', season: 6, week: 20, mq: 92, stage: '天頂戦', won: true, opponentName: 'Rival' },
      rowType: 'mq_record', text: '歴代最高評価を更新（試合評価 92）', detail: '天頂戦・Rival に勝利' },
    { ev: { type: 'tenchosenBestBout', season: 4, week: 48, mq: 88, round: '準決勝', won: false, opponentName: 'Rival' },
      rowType: 'best_bout', text: '天頂戦 大会ベストバウト（試合評価 88）', detail: '準決勝・Rival に敗れる' },
    { ev: { type: 'juniorTournamentBestBout', season: 2, week: 24, mq: 80, round: 'final', won: true, opponentName: 'Rival' },
      rowType: 'best_bout', text: 'ジュニアトーナメント 大会ベストバウト（試合評価 80）', detail: '決勝・Rival に勝利' },
    { ev: { type: 'feud', season: 5, week: 7, resolution: 'match', won: true, opponentName: 'Rival' },
      rowType: 'feud', text: 'Rival との確執', detail: 'リング上の決着戦に勝利' },
    { ev: { type: 'feud', season: 5, week: 7, resolution: 'ignore', won: null, opponentName: 'Rival' },
      rowType: 'feud', text: 'Rival との確執', detail: '団体は静観' },
    { ev: { type: 'kaigan', season: 3, week: 16, opponentName: 'Rival', won: false, mq: 75 },
      rowType: 'kaigan', text: '格上との一戦を境に開眼', detail: 'Rival に敗れる' },
  ];
  cases.forEach(c => {
    const rows = eventRows(rowsOf(stateWith([c.ev])));
    const row = rows.find(r => r.type === c.rowType);
    assert.ok(row, `${c.ev.type}/${c.ev.result || ''}: 年表に行が出ない`);
    assertCleanRow(row, c.ev.type);
    assert.strictEqual(row.text, c.text);
    if ('detail' in c) assert.strictEqual(row.detail, c.detail, `${c.ev.type}: 注記`);
    assert.strictEqual(row.season, c.ev.season, `${c.ev.type}: キャリア年(debut=S1なので絶対季と同じ)`);
  });
  // 天頂戦・4団体戦は週を持たないので開催週に置く(年内の並び順)
  const tRow = eventRows(rowsOf(stateWith([{ type: 'ppvTournament', season: 4, result: 'champion' }])))[0];
  assert.strictEqual(tRow.week, Engine.ppvTournament.SHOW_WEEK);
  const aRow = eventRows(rowsOf(stateWith([{ type: 'autumnWar', season: 3, result: 'runnerUp', wins: 1 }])))[0];
  assert.strictEqual(aRow.week, Engine.autumnWar.EVENT_WEEK);
});

section('A2. 全国統一王座: 第N代の注記と、防衛の通し番号(戴冠ごとに1から)', () => {
  const G = stateWith([
    { type: 'unifiedTitle', season: 4, week: 48, result: 'won' },
    { type: 'unifiedTitle', season: 5, week: 12, result: 'defense' },
    { type: 'unifiedTitle', season: 5, week: 24, result: 'defense' },
    { type: 'unifiedTitle', season: 6, week: 12, result: 'captured' },
    { type: 'unifiedTitle', season: 6, week: 24, result: 'defense' },
  ], { unifiedTitle: { history: [
    { type: 'creation', season: 4, week: 48 },
    { type: 'move', season: 5, week: 36 },
    { type: 'move', season: 6, week: 12 },
  ] } });
  const texts = eventRows(rowsOf(G)).filter(r => r.type === 'unified_title').map(r => r.text);
  assert.deepStrictEqual(texts, [
    '全国統一王座 戴冠(第1代)', '全国統一王座 1度目の防衛', '全国統一王座 2度目の防衛',
    '全国統一王座 奪取', '全国統一王座 1度目の防衛',
  ]);
});

// ── B. 「特記事項なし」は記録の有無で決まる ──
section('B. 天頂戦で優勝した年は「特記事項なし」にならない/記録が1件も無い年だけが「特記事項なし」', () => {
  const G = stateWith([
    { type: 'ppvTournament', season: 3, result: 'champion' },
    { type: 'unifiedTitle', season: 3, week: 48, result: 'won' },
    { type: 'bigMatch', season: 5, week: 8, mq: 88 }, // 年表の行にならない内部記録
  ], { season: 7 });
  const rows = rowsOf(G);
  const inYear = y => rows.filter(r => r.season === y);
  assert.ok(inYear(3).some(r => r.type === 'tenchosen'), '天頂戦優勝の年に行が無い');
  assert.ok(!inYear(3).some(r => r.type === 'season_end'), '天頂戦優勝の年に「特記事項なし」の区切りが付いている');
  // 記録が1件も無い年(2・4・6)は従来どおり「特記事項なし」
  [2, 4, 6].forEach(y => {
    const se = inYear(y).find(r => r.type === 'season_end');
    assert.ok(se && se.detail === '特記事項なし' && se.quiet === true, `キャリア${y}年目は「特記事項なし」のはず`);
  });
  // 記録はあるが年表の行にならない年(5)は、「特記事項なし」と書かない
  const se5 = inYear(5).find(r => r.type === 'season_end');
  assert.ok(se5, 'キャリア5年目の見出し(区切り)が無い');
  assert.strictEqual(se5.quiet, false, '記録のある年が quiet 扱い');
  assert.strictEqual(se5.detail, undefined, '記録のある年に「特記事項なし」が付いている');
  // UI は quiet:false の年に「特記事項なし」を書かない(本文は記号だけ)
  const ui = fs.readFileSync(path.join(SRC_DIR, 'ui-common.js'), 'utf8');
  assert.ok(/summary\.quiet !== false/.test(ui), 'ui-common.js の年表が quiet を見ていない');
});

// ── C. 引退理由 ──
section('C. 引退行の注記は実際に記録される reason 値で引く', () => {
  const expect = {
    wearInjury: '度重なる怪我により', careerEnding: '重傷により現役続行不可', injury: '怪我による引退',
    lastrun: 'ラストランを終えて', motivation: 'モチベーション喪失により',
    contractEnd: '契約満了を機に', sudden: '突然の退団とともに',
    // 旧来の想定キーも互換で引ける
    injury_wear: '度重なる怪我により', injury_career_ending: '重傷により現役続行不可', age: '年齢による引退',
  };
  Object.keys(expect).forEach(reason => {
    const row = rowsOf(stateWith([{ type: 'retire', season: 8, week: 30, age: 29, reason }]))
      .find(r => r.type === 'retire');
    assert.ok(row, `${reason}: 引退行が無い`);
    assert.strictEqual(row.text, '引退（29歳）');
    assert.strictEqual(row.detail, expect[reason], `${reason}: 注記`);
  });
  // 季末の自然な引退(理由なし)・AIの季末引退('career')は注記なし
  [undefined, 'career'].forEach(reason => {
    const ev = { type: 'retire', season: 8, age: 29 };
    if (reason) ev.reason = reason;
    const row = rowsOf(stateWith([ev])).find(r => r.type === 'retire');
    assert.strictEqual(row.detail, undefined, `${reason}: 注記が付いている`);
  });
});

// ── D. 不変条件: 殿堂ptが数える type ⊆ 実績欄・年表が描く type ──
// calcHofPoints と、それが集計に使う補助関数のソースから `type === 'X'` を拾う
function countedTypes() {
  const srcs = [
    Engine.awards.calcHofPoints, Engine.awards._unifiedCareerStats,
    Engine.career.countTitleStats, Engine.career.collectTitleReigns,
  ].map(fn => String(fn));
  const set = new Set();
  srcs.forEach(s => {
    const re = /type\s*[!=]==\s*'([A-Za-z_]+)'/g;
    let m;
    while ((m = re.exec(s))) set.add(m[1]);
  });
  return set;
}
// type ごとに「加点が付く」代表的な履歴(debut は stateWith が先頭に足す)
const POINT_FIXTURES = {
  titleWin: [{ type: 'titleWin', season: 2, week: 10, beltId: 'world', orgName: 'Test Org王座' }],
  titleDefense: [
    { type: 'titleWin', season: 2, week: 10, beltId: 'world', orgName: 'Test Org王座' },
    { type: 'titleDefense', season: 2, week: 30, beltId: 'world', orgName: 'Test Org王座', count: 3 },
  ],
  titleLoss: [
    { type: 'titleWin', season: 2, week: 10, beltId: 'world', orgName: 'Test Org王座' },
    { type: 'titleLoss', season: 3, week: 10, beltId: 'world', orgName: 'Test Org王座', defenses: 2 },
  ],
  juniorTournament: [{ type: 'juniorTournament', season: 2, result: 'champion' }],
  springTagLeague: [{ type: 'springTagLeague', season: 2, week: 12, result: 'champion' }],
  autumnWar: [{ type: 'autumnWar', season: 2, result: 'champion', wins: 2 }],
  ppvTournament: [{ type: 'ppvTournament', season: 4, result: 'champion' }],
  ppvMainEvent: [{ type: 'ppvMainEvent', season: 3, week: 48, won: true, isSummit: true, opponentName: 'Rival' }],
  war: [
    { type: 'war', season: 2, week: 20, won: true, opponentOrg: 'Rival Org' },
    { type: 'war', season: 3, week: 20, won: true, opponentOrg: 'Rival Org' },
  ],
  awardMVP: [{ type: 'awardMVP', season: 3, week: 49 }],
  awardRookie: [{ type: 'awardRookie', season: 1, week: 49 }],
  awardBestMatch: [{ type: 'awardBestMatch', season: 3, week: 49, mq: 90 }],
  awardMedia: [{ type: 'awardMedia', season: 3, week: 49 }],
  domeMain: [{ type: 'domeMain', season: 4, week: 40, result: 'win', matchType: 'main', opponentName: 'Rival' }],
  unifiedTitle: [{ type: 'unifiedTitle', season: 5, week: 12, result: 'captured' }],
};
section('D. 不変条件: calcHofPoints が数える type は、すべて殿堂の実績欄と経歴年表が描く', () => {
  const counted = countedTypes();
  assert.ok(counted.size >= 10, `集計 type の抽出に失敗している(${[...counted].join(',')})`);
  counted.forEach(type => {
    const fx = POINT_FIXTURES[type];
    assert.ok(fx, `calcHofPoints が数える '${type}' のフィクスチャが無い。加点の種類を増やしたら、`
      + '実績欄(buildCareerHighlights)と年表(milestone.get)に描いてからここへ足すこと');
    const G = stateWith(fx);
    const rec = G.roster[0].careerRecord;
    const pts = Engine.awards.calcHofPoints(rec);
    assert.ok(pts > 0, `'${type}': フィクスチャに加点が付いていない(${pts})`);
    const hl = Engine.awards.buildCareerHighlights(rec, 'Test Org', G);
    assert.ok(hl.some(r => r.type === type), `'${type}': 殿堂ptは付くのに実績欄に出ない`);
    hl.forEach(r => assertCleanRow(r, `HOF ${type}`));
    const rows = eventRows(rowsOf(G));
    const lastSeason = fx[fx.length - 1].season;
    assert.ok(rows.some(r => r.season === lastSeason), `'${type}': 殿堂ptは付くのに経歴年表に出ない`);
    rows.forEach(r => assertCleanRow(r, `年表 ${type}`));
  });
});

// ── E. 殿堂の実績欄 ──
section('E. 殿堂の実績欄: 王座の二重表記が無い/天頂戦・4団体戦・PPV・開眼を描く', () => {
  const G = stateWith([
    { type: 'titleWin', season: 2, week: 10, beltId: 'world', orgName: '天頂プロレス王座' },
    { type: 'titleDefense', season: 2, week: 30, beltId: 'world', orgName: '天頂プロレス王座', count: 3 },
    { type: 'titleLoss', season: 3, week: 10, beltId: 'world', orgName: '天頂プロレス王座', defenses: 3 },
    { type: 'titleWin', season: 5, week: 10, beltId: 'world', orgName: '天頂プロレス王座' },
    { type: 'ppvTournament', season: 4, result: 'champion' },
    { type: 'ppvTournament', season: 8, result: 'runnerUp' },
    { type: 'autumnWar', season: 3, result: 'champion', wins: 1 },
    { type: 'autumnWar', season: 6, result: 'semiFinal', wins: 3 },
    { type: 'ppvMainEvent', season: 7, week: 48, won: true, isSummit: true },
    { type: 'kaigan', season: 2, week: 16, opponentName: 'Rival', won: true, mq: 70 },
  ]);
  const texts = Engine.awards.buildCareerHighlights(G.roster[0].careerRecord, 'Test Org', G).map(r => r.text);
  assert.ok(!texts.some(t => /王座王座/.test(t)), `王座の二重表記: ${texts.join(' / ')}`);
  ['天頂プロレス王座 初戴冠', '天頂プロレス王座 3度防衛', '天頂プロレス王座 陥落（3度防衛の末に）',
    '天頂プロレス王座 2度目の戴冠', '天頂戦 優勝', '天頂戦 準優勝', '4団体勝ち残り対抗戦 優勝',
    '4団体勝ち残り対抗戦 3人抜き', '4団体勝ち残り対抗戦 通算4勝', 'PPV GRAND FINAL 優勝', '格上との一戦を境に開眼',
  ].forEach(t => assert.ok(texts.includes(t), `実績欄に「${t}」が無い: ${texts.join(' / ')}`));
  // 殿堂の保存値の形は変えない(kind/order は opts.withKind のときだけ)
  const plain = Engine.awards.buildCareerHighlights(G.roster[0].careerRecord, 'Test Org', G);
  assert.ok(plain.every(r => !('kind' in r) && !('order' in r)), '保存される実績欄の行に kind/order が混ざった');
  const withKind = Engine.awards.buildCareerHighlights(G.roster[0].careerRecord, 'Test Org', G, undefined, { withKind: true });
  assert.ok(withKind.every(r => typeof r.kind === 'string' && r.kind.length > 0), 'withKind の行に kind が無い');
});

// ── F. 年代記 ──
section('F. 年代記の章ハイライトに天頂戦・4団体勝ち残り対抗戦・全国統一王座が出る', () => {
  const chapter = { seasonStart: 1, seasonEnd: 9 };
  const ace = {
    id: 606, name: 'Chronicle Ace',
    careerRecord: { history: [
      { type: 'ppvTournament', season: 4, result: 'champion' },
      { type: 'ppvTournament', season: 8, result: 'runnerUp' },
      { type: 'autumnWar', season: 3, result: 'champion', wins: 2 },
      { type: 'autumnWar', season: 4, result: 'champion', wins: 1 },
      { type: 'autumnWar', season: 6, result: 'semiFinal', wins: 3 },
      { type: 'unifiedTitle', season: 4, week: 48, result: 'won' },
    ] },
  };
  const text = Engine.chronicle._buildHighlights(chapter, [ace], []).map(h => h.text).join('\n');
  ['天頂戦優勝', '天頂戦準優勝', '4団体勝ち残り対抗戦 2度優勝・2連覇', '4団体勝ち残り対抗戦 3人抜き', '全国統一王座 戴冠']
    .forEach(t => assert.ok(text.includes(t), `年代記に「${t}」が無い:\n${text}`));
});

// ── G. 開眼の発火が履歴に刻まれる ──
section('G. 開眼の発火が careerRecord.history に刻まれる(数値の欄は変えない)', () => {
  const sId = RIVAL_ORGS.find(org => org.tier === 'S').id;
  const mk = (id, name, ovr, cap, extra = {}) => ({
    id, name, pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    pot: { pw: 90, sp: 110, te: 100, st: 105, mn: 95 },
    trainCap: { pw: cap, sp: cap, te: cap, st: cap, mn: cap },
    age: 21, traits: [], popularity: 30, condition: 80, injury: null,
    careerRecord: { ...Engine.career.createRecord(), history: [{ type: 'debut', season: 1, week: 1 }], peakOVR: 55 },
    ...extra,
  });
  const candidate = mk(8, 'Kaigan Cand', 55, 90, { kaiganSeed: true });
  const opponent = mk(9, 'Upper Hand', 70, 105);
  const state = {
    rngSeed: 424242, season: 5, week: 16, orgName: 'Test Org', roster: [candidate, opponent],
    aiOrgs: { [sId]: { roster: [95, 94, 93, 92].map((o, i) => mk(900 + i, `S${i}`, o, 120 - i)) } },
  };
  const oldTrigger = Engine.kaigan.TRIGGER_RATE;
  Engine.kaigan.TRIGGER_RATE = 1;
  let out;
  try {
    out = Engine.kaigan.processMatchResults(state, [candidate, opponent], [{
      left: { ...candidate }, right: { ...opponent }, winner: 'right', mq: 75,
    }], { orgId: 'player', orgName: state.orgName });
  } finally {
    Engine.kaigan.TRIGGER_RATE = oldTrigger;
  }
  assert.strictEqual(out.occurrences.length, 1, '開眼が発火していない(前提)');
  const awakened = out.roster.find(f => f.id === candidate.id);
  const hist = awakened.careerRecord.history;
  const ev = hist[hist.length - 1];
  assert.deepStrictEqual(ev, { type: 'kaigan', season: 5, week: 16, opponentId: 9, opponentName: 'Upper Hand', won: false, mq: 75 });
  // 履歴以外の careerRecord の欄は元のまま
  const { history: _h1, ...restAfter } = awakened.careerRecord;
  const { history: _h0, ...restBefore } = candidate.careerRecord;
  assert.deepStrictEqual(restAfter, restBefore, 'careerRecord の数値の欄が変わった');
  assert.ok(awakened.kaiganState, '開眼状態が付いていない');
  // 年表と実績欄に出る
  const G = { season: 7, week: 1, orgName: 'Test Org', roster: [awakened], aiOrgs: {}, retiredFighters: [], freeAgents: [] };
  const row = Engine.milestone.get(G, candidate.id).find(r => r.type === 'kaigan');
  assert.ok(row && row.text === '格上との一戦を境に開眼' && row.detail === 'Upper Hand に敗れる', '年表に開眼の行が無い');
  assert.ok(Engine.awards.buildCareerHighlights(awakened.careerRecord, 'Test Org', G).some(r => r.type === 'kaigan'),
    '殿堂の実績欄に開眼が無い');
});

// ── H. EN ──
section('H. EN: 新しく描く年表・実績欄・年代記の行に日本語が残らない', () => {
  const G = stateWith([
    { type: 'ppvTournament', season: 2, result: 'champion' },
    { type: 'ppvTournament', season: 6, result: 'firstRound' },
    { type: 'unifiedTitle', season: 2, week: 48, result: 'won' },
    { type: 'unifiedTitle', season: 3, week: 12, result: 'defense' },
    { type: 'unifiedTitle', season: 3, week: 36, result: 'captured' },
    { type: 'autumnWar', season: 3, result: 'champion', wins: 3 },
    { type: 'autumnWar', season: 4, result: 'runnerUp', wins: 2 },
    { type: 'mqAllTimeRecord', season: 4, week: 20, mq: 92, stage: '天頂戦', won: true, opponentName: 'Rival' },
    { type: 'tenchosenBestBout', season: 2, week: 48, mq: 88, round: '準決勝', won: false, opponentName: 'Rival' },
    { type: 'juniorTournamentBestBout', season: 2, week: 24, mq: 80, round: 'quarterFinal', won: true, opponentName: 'Rival' },
    { type: 'feud', season: 5, week: 7, resolution: 'talk', won: null, opponentName: 'Rival' },
    { type: 'kaigan', season: 5, week: 16, opponentName: 'Rival', won: true, mq: 70 },
    { type: 'retire', season: 7, week: 20, age: 30, reason: 'lastrun' },
  ], { season: 9 });
  const rows = rowsOf(G, enT).filter(r => r.type !== 'debut');
  rows.forEach(r => {
    const s = `${r.text} / ${r.detail || ''}`;
    assert.ok(!JA_RE.test(s), `EN の年表に日本語が残っている: ${s}`);
  });
  const hl = Engine.awards.buildCareerHighlights({ history: [
    { type: 'debut', season: 1 }, { type: 'ppvTournament', season: 2, result: 'champion' },
    { type: 'ppvTournament', season: 6, result: 'semiFinal' },
    { type: 'autumnWar', season: 3, result: 'champion', wins: 3 }, { type: 'autumnWar', season: 4, result: 'runnerUp', wins: 3 },
    { type: 'kaigan', season: 5, week: 16 },
  ] }, 'Test Org', G, enT);
  hl.forEach(r => assert.ok(!JA_RE.test(r.text), `EN の実績欄に日本語が残っている: ${r.text}`));
  const chapter = { seasonStart: 1, seasonEnd: 9 };
  const ace = { id: 707, name: 'Ace', careerRecord: { history: [
    { type: 'ppvTournament', season: 2, result: 'champion' }, { type: 'ppvTournament', season: 6, result: 'runnerUp' },
    { type: 'autumnWar', season: 3, result: 'champion', wins: 1 }, { type: 'autumnWar', season: 5, result: 'semiFinal', wins: 4 },
    { type: 'unifiedTitle', season: 2, week: 48, result: 'won' },
  ] } };
  Engine.chronicle._buildHighlights(chapter, [ace], []).forEach(h => {
    const en = Engine.chronicle.narrativeText(h.textParts, enT);
    assert.ok(!JA_RE.test(en), `EN の年代記に日本語が残っている: ${en}`);
  });
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\ncareer-record-display-coverage-test: all sections passed.');
