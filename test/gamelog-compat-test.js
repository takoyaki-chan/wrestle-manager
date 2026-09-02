'use strict';

// test/gamelog-compat-test.js — i18n Stage A P3a-3(gameLog構造化)の後方互換回帰テスト
//
// 目的: docs/i18n-stage-a-p3a-design-v0.1.md バッチ3(D-G1〜D-G5)で導入した
//   G.gameLog の新形式 { type, data, s, w } と、既存セーブに残る旧形式(文字列)・
//   既存の { type:'snapshot', text } 系オブジェクトが「静かに共存」し、表示/分類の
//   どちらも例外を投げずに動くことを機械的に確認する(指示書の不変条件2)。
//
// 検査内容:
//   1. GAMELOG_TEMPLATES 全型が gameLogEntryText() で例外なく解決でき、
//      プレースホルダの取りこぼし({xxx}の残存)が無い(データキー欠落の検出)
//   2. 文字列エントリ・snapshot系エントリ・新形式エントリが混在する配列を
//      gameLogEntryText / gameLogEntryCategory に通しても例外が出ない
//   3. renderLog()(ui-render.js)の分類フィルタと同じロジックを再現し、
//      旧文字列エントリはキーワード判定・新形式はtypeの族判定という
//      「二刀流」が実際に成立することを確認する

const assert = require('assert');
const {
  GAMELOG_TEMPLATES,
  gameLogEntryText,
  gameLogEntryCategory,
  GAMELOG_TYPE_CATEGORY,
  GAMELOG_OFFSEASON_REPORT_TYPES,
} = require('../src/data.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.stack); }
}

console.log('=== gameLog構造化: 後方互換回帰テスト ===\n');

// 各テンプレ文字列に含まれるプレースホルダキーを自動抽出し、ダミー値を機械的に割り当てる。
// (type別にキー一覧を手書きすると更新漏れが起きるため、テンプレそのものから逆算する)
function extractPlaceholderKeys(tpl) {
  const keys = new Set();
  const re = /\{(\w+)\}/g;
  let m;
  while ((m = re.exec(tpl))) keys.add(m[1]);
  return [...keys];
}

function dummyDataFor(tplOrNested, variant) {
  const tpl = variant != null ? tplOrNested[variant] : tplOrNested;
  const data = {};
  extractPlaceholderKeys(tpl).forEach(k => { data[k] = `《${k}》`; });
  if (variant != null) data.variant = variant;
  return data;
}

section('1. GAMELOG_TEMPLATES全型がgameLogEntryText()で例外なく解決できる', () => {
  const types = Object.keys(GAMELOG_TEMPLATES);
  assert.ok(types.length >= 60, `型の登録数が少なすぎる(${types.length}件) — テーブルの読み込みに失敗している疑い`);
  for (const type of types) {
    const tplOrNested = GAMELOG_TEMPLATES[type];
    const isNested = tplOrNested && typeof tplOrNested === 'object';
    const variants = isNested ? Object.keys(tplOrNested) : [null];
    for (const variant of variants) {
      const data = dummyDataFor(tplOrNested, variant);
      const entry = { type, data, s: 1, w: 1 };
      const text = gameLogEntryText(entry);
      assert.strictEqual(typeof text, 'string', `${type}${variant ? '.' + variant : ''}: 文字列を返さない`);
      assert.ok(text.length > 0, `${type}${variant ? '.' + variant : ''}: 空文字列になった`);
      assert.ok(!/\{[a-zA-Z_]\w*\}/.test(text),
        `${type}${variant ? '.' + variant : ''}: プレースホルダの取りこぼしがある(データキー不足の疑い) → "${text}"`);
    }
  }
});

section('2. GAMELOG_TYPE_CATEGORYに登録されたtypeは全てGAMELOG_TEMPLATESにも存在する', () => {
  for (const type of Object.keys(GAMELOG_TYPE_CATEGORY)) {
    assert.ok(Object.prototype.hasOwnProperty.call(GAMELOG_TEMPLATES, type),
      `GAMELOG_TYPE_CATEGORYにあるtype "${type}" がGAMELOG_TEMPLATESに無い(タイプミスの疑い)`);
    const cats = GAMELOG_TYPE_CATEGORY[type];
    assert.ok(Array.isArray(cats) && cats.length > 0, `${type}: カテゴリ配列が空`);
    cats.forEach(c => assert.ok(['show', 'finance', 'event', 'season'].includes(c), `${type}: 未知のカテゴリ "${c}"`));
  }
});

section('3. GAMELOG_OFFSEASON_REPORT_TYPESの全typeもGAMELOG_TEMPLATESに存在する', () => {
  for (const type of GAMELOG_OFFSEASON_REPORT_TYPES) {
    assert.ok(Object.prototype.hasOwnProperty.call(GAMELOG_TEMPLATES, type),
      `GAMELOG_OFFSEASON_REPORT_TYPESにあるtype "${type}" がGAMELOG_TEMPLATESに無い`);
  }
});

// D-G2: 「静かに共存」— 旧文字列 / 既存snapshotオブジェクト / 新{type,data}オブジェクトが
// 同じ配列に混在していても例外なく動くこと(既存セーブ相当のGを模す)。
const mixedGameLog = [
  '📝 旧セーブ由来の文字列エントリ（契約金100万）',              // 旧形式(生成時言語のまま)
  '🏟️ 興行の生文字列（評価A・勝利）',                              // 旧形式・'show'系キーワード
  { type: 'snapshot', text: '💭 垣間見えの既存object形', source: 'daily', fighterId: 1 }, // 既存object形(text持ち)
  { type: 'fighter_signed', data: { name: 'テスト選手', cost: 500, tierLabel: 'A', scoutDiscSuffix: '' }, s: 1, w: 1 },
  { type: 'contract_renewal_complete', data: { stayCount: 5, departCount: 1 }, s: 1, w: 2 },
  { type: 'unified_title_result', data: { variant: 'taken', name: 'テスト王者' }, s: 2, w: 1 },
  { type: 'not_a_real_type_xyz', data: {}, s: 1, w: 1 }, // 未登録type(将来の取りこぼし・破損データを模す)
  null, undefined, // 防御的: 万一混じっても例外を出さない
];

section('4. 混在配列を1件ずつgameLogEntryText/gameLogEntryCategoryに通しても例外が出ない', () => {
  for (const entry of mixedGameLog) {
    assert.doesNotThrow(() => gameLogEntryText(entry), `gameLogEntryText が例外: ${JSON.stringify(entry)}`);
    assert.doesNotThrow(() => gameLogEntryCategory(entry), `gameLogEntryCategory が例外: ${JSON.stringify(entry)}`);
  }
});

section('5. 未登録typeは空文字列/空カテゴリに落ちる(例外にならず安全側)', () => {
  const entry = { type: 'not_a_real_type_xyz', data: {}, s: 1, w: 1 };
  assert.strictEqual(gameLogEntryText(entry), '');
  assert.deepStrictEqual(gameLogEntryCategory(entry), []);
});

section('6. null/undefinedエントリはgameLogEntryTextが空文字列を返す', () => {
  assert.strictEqual(gameLogEntryText(null), '');
  assert.strictEqual(gameLogEntryText(undefined), '');
  assert.deepStrictEqual(gameLogEntryCategory(null), []);
});

section('7. snapshot系(text持ち)はGAMELOG_TYPE_CATEGORYを経由せずtextをそのまま返す', () => {
  const snap = { type: 'snapshot', text: '💭 これはそのまま表示される', source: 'daily' };
  assert.strictEqual(gameLogEntryText(snap), '💭 これはそのまま表示される');
  assert.deepStrictEqual(gameLogEntryCategory(snap), [], 'snapshot系は「全て」タブのみ(カテゴリ配列は空)');
});

// ── renderLog()(ui-render.js)の分類ロジックを再現し、実際にD-G3の「二刀流」が
//    成立することを確認する。DOM無しで検査できるよう、フィルタ判定だけを移植する ──
const CATEGORY_MATCH = {
  show: l => l.includes('興行') || l.includes('評価') || l.includes('勝利') || l.includes('防衛'),
  finance: l => l.includes('収入') || l.includes('支出') || l.includes('万') || l.includes('残高'),
  event: l => l.includes('対抗') || l.includes('挑戦') || l.includes('頂上') || l.includes('移籍') || l.includes('レンタル') || l.includes('引き抜き'),
  season: l => l.includes('シーズン') || l.includes('オフ') || l.includes('引退') || l.includes('開幕') || l.includes('ランキング'),
};
function filterGameLogLikeRenderLog(gameLog, filterKey) {
  if (filterKey === 'all') return gameLog;
  return gameLog.filter(entry => {
    if (typeof entry === 'string') {
      const fn = CATEGORY_MATCH[filterKey];
      return fn ? fn(entry) : true;
    }
    if (entry && typeof entry === 'object' && entry.type === 'snapshot') return false;
    const cats = gameLogEntryCategory(entry);
    return cats.includes(filterKey);
  });
}

section('8. renderLog()同等フィルタ: 旧文字列はキーワード判定・新形式はtypeの族判定', () => {
  const log = [
    '🏟️ 興行の旧文字列（評価あり・勝利）',                 // show一致(旧)
    { type: 'fighter_signed', data: { name: 'X', cost: 1, tierLabel: 'A', scoutDiscSuffix: '' }, s: 1, w: 1 }, // finance一致(新)
    { type: 'war_challenge_declined', data: { opponentName: 'Y' }, s: 1, w: 1 }, // event一致(新)
    { type: 'coach_fired', data: { name: 'Z' }, s: 1, w: 1 }, // どのカテゴリにも一致しない(新)
    { type: 'snapshot', text: '💭 興行という単語を含むsnapshot', source: 'x' }, // 全てのみ(keyword一致していても対象外)
  ];
  assert.strictEqual(filterGameLogLikeRenderLog(log, 'all').length, 5, '全てタブは全件表示');
  assert.deepStrictEqual(filterGameLogLikeRenderLog(log, 'show'), [log[0]], '旧文字列のみ興行タブに乗る');
  assert.deepStrictEqual(filterGameLogLikeRenderLog(log, 'finance'), [log[1]], '新形式はtypeの族で財務タブに乗る');
  assert.deepStrictEqual(filterGameLogLikeRenderLog(log, 'event'), [log[2]], '新形式はtypeの族でイベントタブに乗る');
  assert.strictEqual(filterGameLogLikeRenderLog(log, 'season').length, 0, 'どのtypeもseason族に無いので0件');
  assert.strictEqual(filterGameLogLikeRenderLog(log, 'show').includes(log[4]), false,
    'snapshotは本文に興行を含んでいても興行タブに漏れない(全てのみの既存仕様を維持)');
});

console.log(failed === 0 ? '\n結果: 全項目 PASS' : `\n結果: ${failed} 件 FAIL`);
process.exitCode = failed === 0 ? 0 : 1;
