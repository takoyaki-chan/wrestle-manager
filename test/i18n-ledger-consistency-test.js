#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-ledger-consistency-test.js — 3台帳(ui/template/dialogue)間の
//  重複キー一致検査 (P7-12)
//
//  背景: specs/i18n-runtime-spec-v1.0.md §9/§15-3 は「同じキーを2つの台帳へ
//  載せない」ことを原則にしているが、P7-9で ui∩(template|dialogue) の既存
//  重複キー22件が見つかった。内訳を精査すると2種類あった:
//    (a) データ表(data.js等)由来の文字列を、動的キー([t(変数)]で辞書を
//        引くため機械抽出できない箇所)向けに ui-ledger へも手作業で複製した
//        だけの行 → 本物の二重出現ではない。所有台帳(template/dialogue)へ
//        一本化し、ui-ledger 側は削除する(P7-12でtest/i18n-extract-ui.jsの
//        「他台帳所有キーの除外」ロジックにより自動的に削除・復活しない)。
//    (c) UI側のコード自身が独立して WM_I18N.t('…') を呼んでおり(多くは
//        Engine関数の防御的フォールバック値)、たまたまデータ表側の文言と
//        一致しているだけの行 → 本物の二重出現。両台帳に残してよいが、
//        addDict() のマージは「後勝ち」(読み込み順依存)なので、訳文が
//        食い違っているとどちらの英訳が実際に出るかスクリプト読み込み順で
//        変わってしまう(§9が禁じた症状そのもの)。この検査は「訳文が一致
//        している限り読み込み順に依存しない」(§15-3)を機械的に保証する。
//
//  ■ 何を検査するか
//    ui-ledger.json / template-ledger.json / dialogue-ledger.json の3本を
//    読み込み、同一key(=WM_I18N.t()の辞書キーそのもの、日本語原文)が
//    2台帳以上に存在する行を集める。en が非空の行同士で文言が食い違って
//    いれば違反として exit 1(訳文が空の行は「まだ訳していないだけ」の
//    通常状態なので対象外 — 各台帳の未訳検査は i18n-build-*.js 側が担う)。
//
//  ■ いつ違反が起きるか
//    - 新しい重複キーが生まれた(データ表とUIコードが同じ文言を独立に使い
//      始めた)のに、訳文だけ食い違ったまま追加された
//    - 既存の重複キーの片方だけ訳文を修正し、もう片方を直し忘れた
//
//  ■ 直し方
//    2箇所の en を同じ文言へ揃えたうえで、該当する i18n-build-*.js
//    (ui→i18n-build-dict.js / template→i18n-build-template-dict.js /
//    dialogue→i18n-build-dialogue-dict.js)を再実行する。
//    「本当は片方だけが所有すべきキー」だった場合は、ui-ledger.json から
//    該当行を削除して `node test/i18n-extract-ui.js` を再実行する
//    (他台帳所有キーの除外ロジックにより復活しない)。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEDGERS = [
  { name: 'ui-ledger', file: path.join(ROOT, 'i18n', 'ui-ledger.json') },
  { name: 'template-ledger', file: path.join(ROOT, 'i18n', 'template-ledger.json') },
  { name: 'dialogue-ledger', file: path.join(ROOT, 'i18n', 'dialogue-ledger.json') },
];

function loadLedger(l) {
  assert.ok(fs.existsSync(l.file), `台帳が見つかりません: ${path.relative(ROOT, l.file)}`);
  const rows = JSON.parse(fs.readFileSync(l.file, 'utf8'));
  assert.ok(Array.isArray(rows), `${l.name} の形式が不正です(配列ではありません)`);
  return rows;
}

function main() {
  const perLedger = LEDGERS.map((l) => ({ name: l.name, rows: loadLedger(l) }));

  // key -> [{ ledger, en }]  (en が非空の出現だけを集める)
  const occurrences = new Map();
  perLedger.forEach(({ name, rows }) => {
    rows.forEach((r) => {
      if (!r || typeof r.key !== 'string') return;
      const en = typeof r.en === 'string' ? r.en : '';
      if (!en.trim()) return; // 未訳行は対象外(各台帳のbuild-dict側の担当)
      if (!occurrences.has(r.key)) occurrences.set(r.key, []);
      occurrences.get(r.key).push({ ledger: name, en });
    });
  });

  const violations = [];
  let dualOwnedKeys = 0;
  occurrences.forEach((list, key) => {
    if (list.length < 2) return; // 単一台帳のみ = 通常状態
    dualOwnedKeys++;
    const distinctEn = new Set(list.map((o) => o.en));
    if (distinctEn.size > 1) {
      violations.push({ key, list });
    }
  });

  if (violations.length) {
    console.error(`[i18n-ledger-consistency] NG: 台帳間で訳文が食い違うキーが${violations.length}件あります。`);
    violations.forEach((v) => {
      console.error(`  - ${JSON.stringify(v.key)}`);
      v.list.forEach((o) => console.error(`      ${o.ledger.padEnd(16)} → ${JSON.stringify(o.en)}`));
    });
    console.error('[i18n-ledger-consistency] 直し方: 訳文を揃えて該当する i18n-build-*.js を再実行するか、');
    console.error('[i18n-ledger-consistency] 片方が所有すべきキーならui-ledger.jsonから削り node test/i18n-extract-ui.js を再実行する。');
    process.exit(1);
  }

  console.log(`i18n-ledger-consistency-test: ok (2台帳以上に存在するキー=${dualOwnedKeys}件、すべて訳文一致)`);
}

main();
