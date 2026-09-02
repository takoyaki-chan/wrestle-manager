#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-extract-templates.js — テンプレ台帳ジェネレータ (Stage B P4-2)
//
//  設計: docs/i18n-stage-b-p4-design-v0.1.md D-P4-1、工程2
//
//  ■ 何をするか
//    src/data.js の対象テーブル(GAMELOG_TEMPLATES/FINISH_TEXT/PPV_SUMMIT_*/
//    PPV_UNDERCARD_*/AI_INJURY_RETIREMENT_TEMPLATES/AI_CONTRACT_DEPARTURE_TEMPLATES/
//    CROSS_WAR_RESULT_TEXT/LEAGUE_ELEVATION_TEXT/NEWSPAPER_SUB_TEMPLATES/
//    NEWS_HEADLINE_TEMPLATES/NEWS_TICKER_TEMPLATES)から全JAテンプレ文字列を再帰的に
//    抽出し、i18n/template-ledger.json を生成する(test/i18n-extract-ui.jsのUI台帳とは
//    別ファイル・別スキーマ運用だが、行の形は同一: { key, en, files, count,
//    hasPlaceholder, hasProperNoun })。
//
//    - key: テーブルに書かれたJA原文の完全文(=WM_I18N.t()の辞書キーそのもの)
//    - files: この原文を含んでいたテーブル名の配列(ui-ledgerでは「ソースファイル名」の
//      役割だったものを、ここでは「テーブル名」に読み替える。設計指示「テーブル名を
//      files欄に記録」に対応)
//    - hasProperNoun: test/i18n-extract-ui.js と同じ固有名詞リストとの部分一致判定
//
//    対象テーブルの値は文字列・文字列配列・{headline,body}等のオブジェクト・それらの
//    ネストが混在する(例: NEWS_HEADLINE_TEMPLATES は type -> [{headline,body}, ...])。
//    テーブル形状ごとに専用の取り出しコードを書くと保守が破綻するため、値を再帰的に
//    走査して文字列の葉を全て拾う汎用ウォーカーで対応する(数値・関数などの非文字列は
//    無視する。対象テーブルは元々文字列専用データなので実際には出現しない想定)。
//
//  ■ 対象外(意図的にテーブルへ含めない)
//    - PPV_SUMMIT_VICTORY_LINES: 選手個人のセリフ(セリフ層/P5対象)であり、汎用テンプレ
//      ではないため対象外(docs/i18n-stage-b-p4-design-v0.1.md「対象外」節)
//
//  ■ 使い方
//    node test/i18n-extract-templates.js       i18n/template-ledger.json を(再)生成
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');
const { loadAsGlobal } = require('./helpers/load-game.js');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'i18n');
const OUT_PATH = path.join(OUT_DIR, 'template-ledger.json');

// 対象テーブル名(data.js上のconst名)。列挙順=指示書の列挙順。
const TARGET_TABLES = [
  'GAMELOG_TEMPLATES',
  'FINISH_TEXT',
  'PPV_SUMMIT_HEADLINE_TEMPLATES',
  'PPV_SUMMIT_MATCHPART_TEMPLATES',
  'PPV_SUMMIT_HPNOTE_TEMPLATES',
  'PPV_UNDERCARD_HEADLINE_TEMPLATES',
  'PPV_UNDERCARD_BODY_TEMPLATES',
  'AI_INJURY_RETIREMENT_TEMPLATES',
  'AI_CONTRACT_DEPARTURE_TEMPLATES',
  'CROSS_WAR_RESULT_TEXT',
  'LEAGUE_ELEVATION_TEXT',
  'NEWSPAPER_SUB_TEMPLATES',
  'NEWS_HEADLINE_TEMPLATES',
  'NEWS_TICKER_TEMPLATES',
];

const PLACEHOLDER_RE = /\{[A-Za-z_][A-Za-z0-9_]*\}/g;

// ── 固有名詞リスト(test/i18n-extract-ui.js buildProperNounList と同一ロジック) ──
// 別ファイルへ切り出して共有すると i18n-extract-ui.js 側(P3b-6が同時作業中で
// 触ってはいけない)に手を入れることになるため、ここでは独立実装として複製する。
function buildProperNounList() {
  const data = require(path.join(SRC_DIR, 'data.js'));
  const set = new Set();
  const add = (s) => { if (s && typeof s === 'string' && s.trim()) set.add(s.trim()); };

  (data.ALL_CHARS || []).forEach((c) => { add(c.name); add(c.surname); });
  (data.ALL_COACHES || []).forEach((c) => add(c.name));
  (data.VENUES || []).forEach((v) => add(v.name));
  Object.values(data.RIVAL_ORG_NAME_POOL || {}).forEach((arr) => (arr || []).forEach(add));
  (data.TITLES || []).forEach((t) => add(t.name));
  Object.values(data.SPECIAL_EVENT_INTRO || {}).forEach((ev) => {
    if (!ev || !ev.title) return;
    const stripped = ev.title.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    add(stripped);
  });
  ['天頂戦', 'GRAND FINAL'].forEach(add);

  return Array.from(set).filter(Boolean);
}

function hasProperNoun(text, properNouns) {
  for (let i = 0; i < properNouns.length; i++) {
    if (text.indexOf(properNouns[i]) >= 0) return true;
  }
  return false;
}

function hasPlaceholder(text) {
  PLACEHOLDER_RE.lastIndex = 0;
  return PLACEHOLDER_RE.test(text);
}

// ── 値の再帰ウォーカー: 文字列/配列/オブジェクトの任意のネストから文字列の葉を全て拾う ──
function walkStrings(value, onString) {
  if (typeof value === 'string') {
    onString(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => walkStrings(v, onString));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => walkStrings(value[k], onString));
  }
  // 数値・関数・null等は対象テーブルには出現しない想定のため無視する。
}

function main() {
  loadAsGlobal('data.js');

  const properNouns = buildProperNounList();
  const ledgerMap = new Map(); // key(JA原文) -> { key, en, filesSet, count, hasPlaceholder, hasProperNoun }
  const perTableStats = [];

  function record(text, tableName) {
    if (typeof text !== 'string' || !text) return;
    let entry = ledgerMap.get(text);
    if (!entry) {
      entry = {
        key: text,
        en: '',
        filesSet: new Set(),
        count: 0,
        hasPlaceholder: hasPlaceholder(text),
        hasProperNoun: hasProperNoun(text, properNouns),
      };
      ledgerMap.set(text, entry);
    }
    entry.filesSet.add(tableName);
    entry.count++;
  }

  TARGET_TABLES.forEach((tableName) => {
    const table = global[tableName];
    if (table == null) {
      console.error(`[i18n-extract-templates] 警告: テーブル "${tableName}" が data.js に見つかりません(スキップ)`);
      perTableStats.push({ table: tableName, extracted: 0, missing: true });
      return;
    }
    let extracted = 0;
    walkStrings(table, (text) => { record(text, tableName); extracted++; });
    perTableStats.push({ table: tableName, extracted });
  });

  const ledger = Array.from(ledgerMap.values())
    .map((e) => ({
      key: e.key,
      en: e.en,
      files: Array.from(e.filesSet).sort(),
      count: e.count,
      hasPlaceholder: e.hasPlaceholder,
      hasProperNoun: e.hasProperNoun,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

  // ── レポート ──
  const total = ledger.length;
  const properCount = ledger.filter((e) => e.hasProperNoun).length;
  const placeholderCount = ledger.filter((e) => e.hasPlaceholder).length;
  const rawTotal = perTableStats.reduce((sum, s) => sum + s.extracted, 0);

  console.log(`[i18n-extract-templates] 台帳を生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-extract-templates] 総テンプレ数(ユニークキー)=${total} hasProperNoun=${properCount} hasPlaceholder=${placeholderCount}`);
  console.log(`[i18n-extract-templates] テーブル別抽出件数(生値の総数。重複統合前。抽出総数=${rawTotal}):`);
  perTableStats.forEach((s) => {
    console.log(`  ${s.table.padEnd(32)} ${String(s.extracted).padStart(6)}${s.missing ? '  (テーブル未検出)' : ''}`);
  });
  console.log(`[i18n-extract-templates] 固有名詞リスト件数=${properNouns.length}`);
}

main();
