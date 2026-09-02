#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-build-dict.js — EN辞書(src/lang-en.js)ジェネレータ (Stage B P3b-1)
//
//  設計: docs/i18n-stage-b-p3b-design-v0.1.md D-B1/D-B4
//
//  ■ 何をするか
//    i18n/ui-ledger.json の en 列が非空の行だけを対象に、機械検査(D-B4)を通した上で
//    src/lang-en.js(WM_I18N.addDict({...}) の列挙)を生成する。
//
//  ■ 機械検査(D-B4。1件でも違反があれば exit 1・lang-en.js は書き換えない)
//    1. プレースホルダ完全性: en内の{name}集合がja(key)内の{name}集合と完全一致
//       (Stage B P6 D-P6-5: `{name:filter}` はフィルタ記法。ja側は常に`{name}`のままで
//       良い設計のため、比較は「基底名」で行う — `{cost:man}` と `{cost}` は同一視する)
//    2. 重複キー検出: 台帳内に同一keyが複数存在しないか
//    3. en内の日本語残り検出: 翻訳し忘れ(原文の日本語文字がそのまま残っている)を検出
//
//  ■ 使い方
//    node test/i18n-build-dict.js            src/lang-en.js を(再)生成
//
//  ■ 運用ルール
//    P3b-1時点(本コミット)ではen列は全行空のため、生成される辞書は空(addDict({}))。
//    以後の翻訳バッチ(Opus主筆)で台帳のen列を埋めるたびに本スクリプトを再実行する。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'i18n', 'ui-ledger.json');
const OUT_PATH = path.join(ROOT, 'src', 'lang-en.js');

// Stage B P6 D-P6-5: `{name}` と `{name:filter}` の両方にマッチし、キャプチャグループ1に
// 基底名(filter抜きの名前)を取る。プレースホルダ集合の比較は常にこの基底名で行う。
const PLACEHOLDER_RE = /\{([A-Za-z_][A-Za-z0-9_]*)(?::[A-Za-z_][A-Za-z0-9_]*)?\}/g;
// JA 判定(ひらがな/カタカナ/CJK統合漢字+拡張A/CJK互換漢字/半角カナ)をコードポイントで明示する。
// test/i18n-scan.js は同じ意図のレンジを生文字で書いているが、「豈-﫿」の始点が
// 互換漢字 U+F900 ではなく通常漢字 U+8C48 に潰れており、実効レンジが U+8C48〜U+FAFF まで
// 広がってサロゲート(U+D800〜U+DFFF)を巻き込む。そのため 🏋 🔥 🤖 のような
// BMP外の絵文字が「日本語が残っている」と誤検出される。D-B3 は絵文字を原文位置のまま
// 残すことを要求しているので、EN辞書の検査ではこの誤検出を踏んではならない。
// scan側は「生日本語文字列の本数が増えていないか」を見るラチェット用で基準値が
// この計上を前提に焼かれているため、ここでは触らずこちらだけ正しいレンジにする。
const JA_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF66-\uFF9F]/;

function placeholderSet(str) {
  const set = new Set();
  let m;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((m = PLACEHOLDER_RE.exec(str))) set.add(m[1]); // 基底名のみ集合に入れる(D-P6-5)
  return set;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function main() {
  if (!fs.existsSync(LEDGER_PATH)) {
    console.error(`[i18n-build-dict] 台帳が見つかりません: ${path.relative(ROOT, LEDGER_PATH)}`);
    console.error('[i18n-build-dict] 先に `node test/i18n-extract-ui.js` を実行してください。');
    process.exit(1);
  }

  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch (e) {
    console.error(`[i18n-build-dict] 台帳のJSONパースに失敗しました: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(ledger)) {
    console.error('[i18n-build-dict] 台帳の形式が不正です(配列ではありません)。');
    process.exit(1);
  }

  const violations = [];
  const seenKeys = new Set();
  const dict = {};
  let translatedCount = 0;

  ledger.forEach((entry, idx) => {
    if (!entry || typeof entry.key !== 'string') {
      violations.push(`entry[${idx}]: key が文字列ではありません`);
      return;
    }
    // 1. 重複キー検出(台帳全体、en の有無にかかわらず)
    if (seenKeys.has(entry.key)) {
      violations.push(`重複キー: ${JSON.stringify(entry.key)}`);
    } else {
      seenKeys.add(entry.key);
    }

    const en = typeof entry.en === 'string' ? entry.en : '';
    if (!en.trim()) return; // 未訳行はfail-open対象(D-B2)。ここでは対象外。
    translatedCount++;

    // 2. プレースホルダ完全性
    const jaSet = placeholderSet(entry.key);
    const enSet = placeholderSet(en);
    if (!setsEqual(jaSet, enSet)) {
      violations.push(
        `プレースホルダ不一致: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} `
        + `(ja=[${Array.from(jaSet).join(',')}] en=[${Array.from(enSet).join(',')}])`
      );
    }

    // 3. en内の日本語残り検出
    if (JA_RE.test(en)) {
      violations.push(`enに日本語が残っています: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)}`);
    }

    if (Object.prototype.hasOwnProperty.call(dict, entry.key)) {
      // seenKeysで既に検出済みのはずだが、防御的に二重登録は上書きせず警告のみに留める。
      return;
    }
    dict[entry.key] = en;
  });

  if (violations.length) {
    console.error(`[i18n-build-dict] NG: 機械検査で${violations.length}件の違反を検出しました。src/lang-en.js は生成していません。`);
    violations.slice(0, 100).forEach((v) => console.error(`  - ${v}`));
    if (violations.length > 100) console.error(`  ...ほか${violations.length - 100}件`);
    process.exit(1);
  }

  const header = [
    '// ══════════════════════════════════════════════════════════════════════════════',
    '//  src/lang-en.js — EN辞書 (Stage B P3b, 自動生成)',
    '//',
    '//  このファイルは test/i18n-build-dict.js が i18n/ui-ledger.json から生成する。',
    '//  手動で編集しないこと。翻訳の追加・修正は i18n/ui-ledger.json の en 列を編集し、',
    '//  node test/i18n-build-dict.js を再実行して再生成する。',
    '//',
    `//  生成元: i18n/ui-ledger.json (総キー${ledger.length}件、訳文あり${translatedCount}件)`,
    '//  D-B2(i18n-stage-b-p3b-design-v0.1.md): 辞書に無いキーは原文のままfail-openで表示される。',
    '//  よってこのファイルは訳文を部分的に持つ状態のまま安全にコミットできる。',
    '// ══════════════════════════════════════════════════════════════════════════════',
    '(function () {',
    '  \'use strict\';',
    '  if (typeof WM_I18N === \'undefined\' || !WM_I18N.addDict) return;',
    '  WM_I18N.addDict(',
  ].join('\n');
  const footer = '\n  );\n})();\n';

  const body = JSON.stringify(dict, null, 2)
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');

  fs.writeFileSync(OUT_PATH, header + '\n' + body + footer, 'utf8');

  console.log(`[i18n-build-dict] 生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-build-dict] 台帳総キー数=${ledger.length} 訳文あり=${translatedCount} 未訳(fail-open)=${ledger.length - translatedCount}`);
}

main();
