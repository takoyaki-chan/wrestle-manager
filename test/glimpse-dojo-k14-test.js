#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/glimpse-dojo-k14-test.js — 道場「休憩中の選手」に出る Glimpse B層の回帰ガード
//  (2026-09-25 K-14裁定「GL-01・GL-08 を道場に出す」+ 付随する発火不具合3件)
//
//  ■ 何を守るか
//    1. GL-01(試合後の感情)の勝敗: 旧実装は存在しない f._lastMatchResult を見ていて常に 'win'。
//       負けた選手にも「勝てた」を積んでいた(30季実測で52%が勝敗と食い違い)。
//       勝敗は f.lastMatchResult、試合評価は今週の lastShowResults[].mq を正とする
//    2. GL-09(連勝の自信): 旧実装は存在しない f.winStreak を見ていて一度も出なかった。f.streak が正
//    3. GL-03(信頼度の揺れ): checkALayer が _glimpseAPrevTrust を今週値で上書きした後に
//       checkBLayer が同じ値と比べていて差が常に0。tickWeek が上書き前の前週値を渡す
//    4. 道場の許可リスト: GL-01/GL-08/GL-09 を含む GL-01〜GL-12 が出せる(hotstreak_end は出さない)
//    5. EN: 許可された B層の全セリフ(アーキタイプ×性格の全セル+実選手)とラベルが EN 辞書で引ける
//
//  ■ 使い方
//    node test/glimpse-dojo-k14-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { readSource } = require('./helpers/source.js');

const SRC_DIR = path.join(__dirname, '..', 'src');

// EN辞書を集めるため、エンジン読み込み前に addDict を持つ WM_I18N スタブを置く
const EN_DICT = Object.create(null);
global.window = global.window || {};
if (typeof global.window.IS_TRIAL === 'undefined') global.window.IS_TRIAL = false;
global.WM_I18N = {
  addDict(obj) { Object.assign(EN_DICT, obj); },
  t(text, params) {
    if (typeof text !== 'string' || !params) return text;
    let out = text;
    Object.keys(params).forEach((k) => { out = out.split('{' + k + '}').join(params[k]); });
    return out;
  },
};

const { loadGame } = require('./helpers/load-game.js');
loadGame();
['lang-en.js', 'lang-en-templates.js', 'lang-en-dialogue.js', 'lang-en-names.js'].forEach((f) => {
  const p = path.join(SRC_DIR, f);
  if (!fs.existsSync(p)) return;
  new vm.Script(fs.readFileSync(p, 'utf8'), { filename: f }).runInThisContext();
});

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message)); }
}

// checkBLayer を「確率の関門を全部通す」条件で呼び、重み抽選に入る前の候補を丸ごと取り出す。
// 抽選(週2枠)の当否ではなく「どの候補がどの subType で積まれるか」を見るため。
function candidatesOf(state, prevTrust) {
  const realFloat = Engine.rng.float;
  const realSample = Engine.glimpse._weightedSample;
  let pool = [];
  Engine.rng.float = () => 0;
  Engine.glimpse._weightedSample = function (rng, p, max, used) { pool = p.slice(); return realSample.call(this, rng, p, max, used); };
  try {
    const args = [state, Engine.rng.create(1), null];
    if (prevTrust !== undefined) args.push(prevTrust);
    Engine.glimpse.checkBLayer(...args);
  } finally {
    Engine.rng.float = realFloat;
    Engine.glimpse._weightedSample = realSample;
  }
  return pool;
}

// 他の種類が混ざらない素の選手(練習でも欠場でもなく、関係値・負傷・不調・連勝連敗なし)
function fighter(id, extra) {
  return { id, name: `F${id}`, archetype: 'standard', personality: 'normal', trust: 50, condition: 100,
    injury: null, isRental: false, _weekAction: 'rest', losingStreak: 0, streak: 0, ...extra };
}
function baseState(roster, extra) {
  return { season: 3, week: 11, rngSeed: 4242, roster, relationships: {}, aiOrgs: {}, lastShowResults: [], ...extra };
}
const inPool = (table, f, line) => getDialoguePool(table, f).includes(line);

console.log('=== Glimpse B層: K-14 道場表示と発火不具合 ===\n');

section('GL-01: 勝敗と試合評価が subType に正しく反映される(シングル/タッグ)', () => {
  const roster = [
    fighter(1, { _weekAction: 'show', lastMatchResult: 'win' }),
    fighter(2, { _weekAction: 'show', lastMatchResult: 'loss' }),
    fighter(3, { _weekAction: 'show', lastMatchResult: 'win' }),
    fighter(4, { _weekAction: 'show', lastMatchResult: 'loss' }),
    fighter(5, { _weekAction: 'show', lastMatchResult: 'draw' }),
  ];
  const lastShowResults = [
    { left: { id: 1 }, right: { id: 2 }, winner: 'left', mq: 55 },
    { matchType: 'tag', winner: 'teamA', mq: 82, teamA: { f1Id: 3, f2Id: 90 }, teamB: { f1Id: 4, f2Id: 91 },
      perFighter: { 3: {}, 90: {}, 4: {}, 91: {} } },
    { left: { id: 5 }, right: { id: 92 }, winner: 'draw', mq: 60 },
  ];
  const pool = candidatesOf(baseState(roster, { lastShowResults }), null);
  const by = Object.fromEntries(pool.filter(c => c.type === 'GL-01').map(c => [c.fighterId, c]));
  const expect = { 1: 'win', 2: 'loss', 3: 'greatWin', 4: 'goodLoss' };
  Object.entries(expect).forEach(([id, sub]) => {
    const c = by[id];
    assert.ok(c, `選手${id} の GL-01 候補が積まれていない`);
    assert.strictEqual(c.subType, sub, `選手${id}: subType ${c.subType} (期待 ${sub})`);
    const f = roster.find(x => x.id === Number(id));
    assert.ok(inPool(GLIMPSE_B_LINES['GL-01'][sub], f, c.dialogue), `選手${id}: ${sub} のプール外のセリフ ${c.dialogue}`);
  });
  assert.strictEqual(by[2].tone, 'negative', '負け(loss)の tone は negative');
  assert.ok(!by[5], '引き分けに合うセリフは無いので GL-01 を積まない');
});

section('GL-01: 存在しない _lastMatchResult には依存しない(負けを勝ちと取り違えない)', () => {
  const f = fighter(7, { _weekAction: 'show', lastMatchResult: 'loss', _lastMatchResult: { won: true, mq: 90 } });
  const pool = candidatesOf(baseState([f], { lastShowResults: [{ left: { id: 7 }, right: { id: 93 }, winner: 'right', mq: 40 }] }), null);
  const c = pool.find(x => x.type === 'GL-01');
  assert.ok(c && c.subType === 'loss', `負けた選手の GL-01 が loss でない: ${c && c.subType}`);
});

section('GL-09: 連勝数 f.streak(3以上)で発火し、連敗・2連勝・旧フィールド winStreak では出ない', () => {
  const roster = [
    fighter(11, { streak: 3 }),
    fighter(12, { streak: 2 }),
    fighter(13, { streak: -4, losingStreak: 4 }),
    fighter(14, { streak: 0, winStreak: 6 }),
  ];
  const ids = candidatesOf(baseState(roster), null).filter(c => c.type === 'GL-09').map(c => c.fighterId);
  assert.deepStrictEqual(ids, [11], `GL-09 の候補: ${JSON.stringify(ids)}`);
});

section('GL-08: 2連敗以上で発火する(道場に出す対象)', () => {
  const ids = candidatesOf(baseState([fighter(21, { losingStreak: 2, streak: -2 }), fighter(22, { losingStreak: 1, streak: -1 })]), null)
    .filter(c => c.type === 'GL-08').map(c => c.fighterId);
  assert.deepStrictEqual(ids, [21]);
});

section('GL-03: 渡された前週値との差(±3以上)で up/down。前週値が無い選手は比べない', () => {
  const roster = [
    fighter(31, { trust: 60 }),   // 55 → 60: up
    fighter(32, { trust: 50 }),   // 56 → 50: down
    fighter(33, { trust: 52 }),   // 50 → 52: 差2 → 出ない
    fighter(34, { trust: 80 }),   // 前週値なし(新加入) → 出ない
  ];
  const prev = { 31: 55, 32: 56, 33: 50 };
  // state 側のスナップショットは checkALayer が今週値で上書きした後の姿(=差0)にしておく
  const stateAfterA = baseState(roster, { _glimpseAPrevTrust: { 31: 60, 32: 50, 33: 52, 34: 80 } });
  const got = Object.fromEntries(candidatesOf(stateAfterA, prev).filter(c => c.type === 'GL-03').map(c => [c.fighterId, c.subType]));
  assert.deepStrictEqual(got, { 31: 'up', 32: 'down' });
  // 前週値そのものが無い週(初週)は何も出さない
  assert.strictEqual(candidatesOf(stateAfterA, null).filter(c => c.type === 'GL-03').length, 0);
  // 単体呼び出し(第4引数省略)は state 上の前週スナップショットを使う
  const standalone = candidatesOf(baseState(roster, { _glimpseAPrevTrust: prev }));
  assert.deepStrictEqual(Object.fromEntries(standalone.filter(c => c.type === 'GL-03').map(c => [c.fighterId, c.subType])), { 31: 'up', 32: 'down' });
});

section('GL-03: 実 tickWeek が checkALayer の上書き前の前週値を checkBLayer へ渡す', () => {
  let G = Engine.createInitialState(20260925, true);
  G = Engine.tickWeek(G).state;           // 1週目で _glimpseAPrevTrust ができる
  assert.ok(G._glimpseAPrevTrust, '1週回しても前週スナップショットができない');
  const snapshotBefore = { ...G._glimpseAPrevTrust };
  const target = G.roster.find(f => !f.isRental);
  G = { ...G, roster: G.roster.map(f => (f.id === target.id ? { ...f, trust: Math.min(100, (f.trust || 50) + 6) } : f)) };
  const realB = Engine.glimpse.checkBLayer;
  let seen = null;
  Engine.glimpse.checkBLayer = function (state, rng, dict, prevTrust) {
    seen = { prevTrust, overwritten: state._glimpseAPrevTrust };
    return realB.apply(this, arguments);
  };
  try { Engine.tickWeek(G); } finally { Engine.glimpse.checkBLayer = realB; }
  assert.ok(seen, 'tickWeek が checkBLayer を呼んでいない');
  assert.deepStrictEqual(seen.prevTrust, snapshotBefore, 'checkBLayer に渡る前週値が、tick 前のスナップショットと一致しない');
  assert.notStrictEqual(seen.overwritten[target.id], snapshotBefore[target.id],
    '前提: checkALayer は state 上のスナップショットを今週値で上書きする(ここが変わったらこのテストを見直す)');
});

section('道場の許可リスト: GL-01〜GL-12 を出し、hotstreak_end は出さない', () => {
  const ui = readSource('src', 'ui-render.js');
  const a = ui.indexOf('const DOJO_REST_B_TYPES');
  const b = ui.indexOf('function _renderRosterDojoHeader');
  assert.ok(a >= 0 && b > a, 'ui-render.js に DOJO_REST_B_TYPES / _renderRosterDojoHeader が見つからない');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(ui.slice(a, b) + '\nthis.__eligible = _isDojoRestEligibleGlimpse;', ctx);
  for (let n = 1; n <= 12; n++) {
    const type = 'GL-' + String(n).padStart(2, '0');
    assert.ok(ctx.__eligible({ layer: 'B', type }), `${type} が道場に出せない`);
  }
  assert.ok(!ctx.__eligible({ layer: 'B', type: 'hotstreak_end' }), 'hotstreak_end は出さない');
  ['bond', 'rivalry', 'trust'].forEach(axis => assert.ok(ctx.__eligible({ layer: 'A', axis }), `A層 ${axis} が出せない`));
  // 休憩中の枠の文は restText に1回だけ作り、吹き出しと地の文(GL-12・2026-09-26)の両方が使う
  const bubbleLine = ui.split('\n').find(l => l.includes('const restText ='));
  assert.ok(bubbleLine && bubbleLine.includes('WM_I18N.t(g.dialogue)') && bubbleLine.includes('WM_I18N.t(g.label)'),
    '休憩中の吹き出しがセリフ/ラベルを WM_I18N.t() に通していない');
});

section('EN: 道場に出る B層の全セリフとラベルが辞書で引け、訳文にJAが残らない', () => {
  const JA_RE = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
  const ARCH = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
  const PERS = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
  const speakers = [];
  ARCH.forEach(a => PERS.forEach(p => speakers.push({ archetype: a, personality: p })));
  const tables = [];
  ['win', 'loss', 'goodLoss', 'greatWin'].forEach(s => tables.push([`GL-01.${s}`, GLIMPSE_B_LINES['GL-01'][s]]));
  ['up', 'down'].forEach(s => tables.push([`GL-03.${s}`, GLIMPSE_B_LINES['GL-03'][s]]));
  ['GL-02', 'GL-02-hostile', 'GL-04', 'GL-05', 'GL-06', 'GL-07', 'GL-08', 'GL-09', 'GL-10', 'GL-11']
    .forEach(k => tables.push([k, GLIMPSE_B_LINES[k]]));
  const misses = [];
  let lines = 0;
  const check = (key, where) => {
    const en = EN_DICT[key];
    if (typeof en !== 'string' || !en.trim()) misses.push(`${where}: 辞書に無い ${JSON.stringify(key)}`);
    else if (JA_RE.test(en)) misses.push(`${where}: 訳文にJA ${JSON.stringify(key)}`);
  };
  tables.forEach(([name, table]) => {
    assert.ok(table, `${name} のセリフ表が無い`);
    const set = new Set();
    speakers.concat(ALL_CHARS).forEach(f => getDialoguePool(table, f).forEach(l => set.add(l)));
    set.forEach(l => { lines++; check(l, name); });
  });
  (GLIMPSE_B_LINES['GL-12']._narration || []).forEach(l => { lines++; check(l, 'GL-12'); });
  ['試合後の感情', '連敗のストレス', '連勝の自信', '表情が和らいだ', '距離を置く気配'].forEach(l => check(l, 'label'));
  assert.strictEqual(misses.length, 0, `EN未解決 ${misses.length}件:\n  ${misses.slice(0, 15).join('\n  ')}`);
  console.log(`        検査したセリフ ${lines}行`);
});

console.log(failed ? `\nFAIL: ${failed}件` : '\nglimpse-dojo-k14-test: ok');
process.exit(failed ? 1 : 0);
