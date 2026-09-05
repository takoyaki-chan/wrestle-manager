#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/glimpse-a-dojo-i18n-test.js — Glimpse A層(道場「休憩中の選手」吹き出し)の
//  EN解決ガード (i18n Stage B P7-42)
//
//  ■ 何を守るか
//    2026-08-13 の「関係性の変化は試合後に通知しない」裁定で Glimpse モーダルを全廃した
//    あと、A層の受け皿として残った唯一の表示点が **今週タブ→道場シーンの「休憩中の選手」
//    頭上吹き出し**(ui-render.js `_renderRosterDojoHeader` の `.dojo-rest-bubble`)。
//    ここには relationships.js `Engine.glimpse.checkALayer` が積んだ
//      g.dialogue … GLIMPSE_A_LINES から pickDialogueLine で選ばれた **生のJA原文**
//      g.label    … GLIMPSE_A_THRESHOLDS[].label(「宿命のライバル」等)
//    が流れ、表示直前に `WM_I18N.t()` を通る。この経路のどこかが欠けると
//    EN プレイ時に日本語がそのまま吹き出しに出る(fail-open のため例外にはならず、
//    走破テストでも「文字が出ている」以上のことは分からない)ので機械で押さえる。
//
//  ■ 4つの検査
//    1. プール網羅: 11閾値 × (7アーキタイプ × 7性格 の合成選手 + ALL_CHARS 実選手) で
//       `getDialoguePool()`(= pickDialogueLine が引く実関数)が返す**全行**が
//       EN辞書(src/lang-en-dialogue.js)に存在し、訳文にJAが残っていないこと
//    2. ラベル: GLIMPSE_A_THRESHOLDS の label 11本が EN辞書(src/lang-en.js)にあること
//    3. チャンネル: `Engine.glimpse.checkALayer` を実際に呼び、返る glimpse の
//       `dialogue` が**プレースホルダ置換済みの完成文ではなく辞書キーそのもの**であること
//       (§13-2 型2/型5 の再発防止。完成文を保存すると t() が引けなくなる)
//    4. 表示点: ui-render.js の `.dojo-rest-bubble` が g.dialogue / g.label の両方を
//       `WM_I18N.t()` に通していること
//
//  ■ 使い方
//    node test/glimpse-a-dojo-i18n-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { readSource } = require('./helpers/source.js');

const SRC_DIR = path.join(__dirname, '..', 'src');

// ── EN辞書の収集 ────────────────────────────────────────────────────────────
// lang-en*.js は WM_I18N.addDict() を呼ぶだけの純データ。addDict を捕まえて集める。
const EN_DICT = Object.create(null);
global.window = global.window || {};
if (typeof global.window.IS_TRIAL === 'undefined') global.window.IS_TRIAL = false;
global.WM_I18N = {
  addDict(obj) { Object.assign(EN_DICT, obj); },
  // エンジン読み込み時に呼ばれる可能性のある t は ja 素通し(load-game.js のスタブと同契約)
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
assert.ok(Object.keys(EN_DICT).length > 10000, 'EN辞書が読み込めていません');

const JA_RE = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
const ARCHETYPES = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
const PERSONALITIES = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];

function assertResolves(line, where, misses) {
  const en = EN_DICT[line];
  if (typeof en !== 'string' || !en.trim()) { misses.push(`${where}: 辞書に無い → ${JSON.stringify(line)}`); return; }
  if (JA_RE.test(en)) misses.push(`${where}: 訳文にJAが残る → ${JSON.stringify(line)} => ${JSON.stringify(en)}`);
}

// ── 1. プール網羅 ───────────────────────────────────────────────────────────
const misses = [];
let probed = 0;
const covered = new Set();
const speakers = [];
ARCHETYPES.forEach((a) => PERSONALITIES.forEach((p) => speakers.push({ archetype: a, personality: p })));
GLIMPSE_A_THRESHOLDS.forEach((th) => {
  const table = GLIMPSE_A_LINES[th.id];
  assert.ok(table, `GLIMPSE_A_LINES に閾値 ${th.id} のセリフ表がありません`);
  speakers.concat(ALL_CHARS).forEach((f) => {
    const pool = getDialoguePool(table, f);
    assert.ok(Array.isArray(pool) && pool.length, `${th.id} のプールが空です`);
    assert.notDeepStrictEqual(pool, ['…'], `${th.id} が省略記号フォールバックに落ちています`);
    probed++;
    pool.forEach((line) => { covered.add(line); assertResolves(line, `${th.id}`, misses); });
  });
});
assert.strictEqual(misses.length, 0, `Glimpse A層のEN未解決 ${misses.length}件:\n  ${misses.slice(0, 20).join('\n  ')}`);

// ── 2. ラベル ───────────────────────────────────────────────────────────────
const labelMisses = [];
GLIMPSE_A_THRESHOLDS.forEach((th) => assertResolves(th.label, `label:${th.id}`, labelMisses));
assert.strictEqual(labelMisses.length, 0, `Glimpse A層ラベルのEN未解決:\n  ${labelMisses.join('\n  ')}`);

// ── 3. チャンネル(checkALayer の実行) ───────────────────────────────────────
// rate ゲート(0.80〜1.00)を確定通過させるため float を 0 に固定する。抽選の当否ではなく
// 「積まれた glimpse の dialogue が辞書キーそのものか」を見るテストなので副作用はない。
const realFloat = Engine.rng.float;
Engine.rng.float = () => 0;
let glimpses;
try {
  const roster = [];
  let id = 9000;
  // group A: bond↑ / rivalry↑ / trust↓、group B: bond↓ / rivalry↓ / trust↑
  ['up', 'down'].forEach((dir) => {
    speakers.forEach((s) => {
      roster.push({
        id: id++, name: `T${id}`, archetype: s.archetype, personality: s.personality,
        trust: dir === 'up' ? 15 : 80, injury: 0, isRental: false,
      });
    });
  });
  const target = { id: 8000, name: 'Target', archetype: 'standard', personality: 'normal' };
  const relationships = {};
  const prevValues = {};
  roster.forEach((f, i) => {
    const key = Engine.relationships._key(f.id, target.id);
    const up = i < speakers.length;
    relationships[key] = up ? { bond: 85, rivalry: 75 } : { bond: 30, rivalry: 10 };
    prevValues[key] = up ? { bond: 10, rivalry: 0 } : { bond: 70, rivalry: 60 };
  });
  const prevTrust = {};
  roster.forEach((f) => { prevTrust[f.id] = 50; });

  const state = {
    season: 2, week: 10, rngSeed: 12345, roster, relationships,
    aiOrgs: { x: { roster: [target] } },
    _glimpseAPrevValues: prevValues,
    _glimpseAPrevTrust: prevTrust,
  };
  const res = Engine.glimpse.checkALayer(state, Engine.rng.create(1));
  glimpses = res.glimpses;
} finally {
  Engine.rng.float = realFloat;
}

assert.ok(glimpses.length > 0, 'checkALayer が1件も glimpse を積みませんでした(テスト前提が壊れています)');
const firedTypes = new Set(glimpses.map((g) => g.type));
GLIMPSE_A_THRESHOLDS.forEach((th) => {
  assert.ok(firedTypes.has(th.id), `閾値 ${th.id} が発火していません(テスト前提が壊れています)`);
});
const channelMisses = [];
glimpses.forEach((g) => {
  // §13-2 型2/型5: 保存値が「完成文」だと t() が引けない。dialogue は辞書キーそのもの。
  assertResolves(g.dialogue, `checkALayer:${g.type}:dialogue`, channelMisses);
  assertResolves(g.label, `checkALayer:${g.type}:label`, channelMisses);
  assert.ok(!/\{[A-Za-z_][A-Za-z0-9_]*\}/.test(g.dialogue),
    `dialogue に未置換プレースホルダが残っています: ${JSON.stringify(g.dialogue)}`);
});
assert.strictEqual(channelMisses.length, 0,
  `checkALayer が積んだ glimpse のEN未解決 ${channelMisses.length}件:\n  ${channelMisses.slice(0, 20).join('\n  ')}`);

// ── 4. 表示点(ui-render.js `.dojo-rest-bubble`) ────────────────────────────
const uiRender = readSource('src', 'ui-render.js');
const bubbleLine = uiRender.split('\n').find((l) => l.includes('dojo-rest-bubble'));
assert.ok(bubbleLine, 'ui-render.js に .dojo-rest-bubble の描画行が見つかりません');
assert.ok(bubbleLine.includes('WM_I18N.t(g.dialogue)'),
  '.dojo-rest-bubble が g.dialogue を WM_I18N.t() に通していません');
assert.ok(bubbleLine.includes('WM_I18N.t(g.label)'),
  '.dojo-rest-bubble が g.label を WM_I18N.t() に通していません');

console.log(`glimpse-a-dojo-i18n-test: ok (プール検査 ${probed}件 / 実行時セリフ ${covered.size}行 / `
  + `checkALayer産 ${glimpses.length}件 / ラベル ${GLIMPSE_A_THRESHOLDS.length}本)`);
