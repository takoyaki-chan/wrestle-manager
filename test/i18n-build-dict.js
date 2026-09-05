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
//    4. プレースホルダ直前の不定冠詞(P6-14): 黒田英文体 §3-4 規則25。`a {n}` / `an {name}`
//       のように a/an の直後にプレースホルダを置くと、a/an の正否が**充填値**で決まる
//       (a 92 / an 88、a Kaori / an Ayaka)。ハイフン付きの限定用法
//       (`a {n}-match run` = 規則24の逃がし方)だけは許可する
//    5. プレースホルダ直後の可算名詞複数形(P7-10で新設・P7-13でexit 1化): 黒田英文体
//       §3-4 規則23。`{n} wrestlers` のように数値PHの直後に可算名詞の複数形を置くと、
//       充填値が1のとき単複が食い違う(「1 wrestlers」)。コロン列挙型(`Wrestlers: {n}`)・
//       ハイフン限定用法(規則24)・単位を持たない形(`{n} in a row`)へ書き直して逃がす。
//       名前・団体名PH({name}等)+wins/reigns(三人称単数動詞)は誤検知として除外する
//       (PHが数値ではないため単複の食い違いが起こらない)
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
// P6-14: \u30D7\u30EC\u30FC\u30B9\u30DB\u30EB\u30C0\u76F4\u524D\u306E\u4E0D\u5B9A\u51A0\u8A5E(docs/en-kuroda-style-draft-v0.1.md \u00A73-4 \u898F\u524725)\u3002
// `a {n}` \u306F\u5145\u586B\u5024\u304C 8/11/18 \u306E\u3068\u304D "an" \u304C\u6B63\u3057\u304F\u306A\u308A\u3001`a {name}` \u306F\u540D\u524D\u306E\u982D\u97F3\u3067\u5272\u308C\u308B\u3002
// \u305F\u3060\u3057 `a {n}-match history` \u306E\u3088\u3046\u306A\u30CF\u30A4\u30D5\u30F3\u4ED8\u304D\u9650\u5B9A\u7528\u6CD5(\u898F\u524724\u306E\u9003\u304C\u3057\u65B9)\u306F
// \u5E38\u306B "a" \u3067\u6B63\u3057\u3044\u306E\u3067\u8A31\u53EF\u3059\u308B \u2014 `}` \u306E\u76F4\u5F8C\u304C\u30CF\u30A4\u30D5\u30F3\u304B\u3069\u3046\u304B\u3067\u6A5F\u68B0\u7684\u306B\u533A\u5225\u3059\u308B\u3002
// 3\u672C\u306Ebuild-dict(ui/template/dialogue)\u3067\u540C\u4E00\u306E\u5B9A\u7FA9\u3092\u6301\u3064(\u53F0\u5E33\u3054\u3068\u306B\u72EC\u7ACB\u5B9F\u884C\u3059\u308B\u305F\u3081)\u3002
const ARTICLE_BEFORE_PLACEHOLDER_RE = /\b(a|an)\s+\{[^}]+\}(?!-)/i;
// Stage B P7-10で新設・P7-13でexit 1化: プレースホルダ直後の可算名詞複数形
// (docs/en-kuroda-style-draft-v0.1.md §3-4 規則23)。
// `{n} wrestlers` / `{wins} wins` のような形は充填値が1のとき単複が食い違う(「1 wrestlers」)。
// P6-18が発見した ui-ledger の既訳2キー({n}名/{wins}勝)がこの型だった。P7-13で残存164件を
// コロン列挙型(`Wrestlers: {n}`)・ハイフン限定用法(規則24)・単位を持たない形へ書き直し、
// 本検査をwarningからexit 1へ格上げした。
const PLURAL_NOUN_AFTER_PLACEHOLDER_RE = /\{([a-zA-Z]+)\}\s+(wrestlers|wins|losses|defenses|reigns|matches|times|seasons|years|weeks|days|points)\b/gi;
// P7-13: 誤検知の除外。名前・団体名PH({name}/{winnerName}/{championName}/{championOrg}/
// {requesterName}) + wins/reigns は「Xが勝つ/君臨する」の三人称単数動詞であり、PHが数値では
// ないため単複の食い違いは起こらない({name}に何を充填しても"wins"は常に正しい)。
// 数値PH+名詞(`{count} reigns with the belt` 等)はこの除外の対象にしない。
const NAME_SUBJECT_VERB_EXEMPT_RE = /^(name|winnerName|championName|championOrg|requesterName)$/i;

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

    // 4. プレースホルダ直前の不定冠詞(§3-4 規則25)
    const artHit = ARTICLE_BEFORE_PLACEHOLDER_RE.exec(en);
    if (artHit) {
      violations.push(
        `PH直前の不定冠詞(規則25): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} `
        + `(検出="${artHit[0]}"。a/anが充填値で変わる。ハイフン限定用法 \`a {n}-…\` へ逃がすか冠詞を落とす)`
      );
    }

    // 5. プレースホルダ直後の可算名詞複数形(§3-4 規則23。P7-13でexit 1化)
    PLURAL_NOUN_AFTER_PLACEHOLDER_RE.lastIndex = 0;
    const pluralHits = [];
    let pluralMatch;
    while ((pluralMatch = PLURAL_NOUN_AFTER_PLACEHOLDER_RE.exec(en))) {
      const word = pluralMatch[2].toLowerCase();
      if ((word === 'wins' || word === 'reigns') && NAME_SUBJECT_VERB_EXEMPT_RE.test(pluralMatch[1])) {
        continue; // 誤検知除外(名前・団体名PH + 三人称単数動詞)
      }
      pluralHits.push(pluralMatch[0]);
    }
    if (pluralHits.length) {
      violations.push(
        `PH直後の可算名詞複数形(規則23): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} `
        + `(検出=[${pluralHits.join(', ')}]。充填値が1のとき単複不一致になりうる。`
        + `コロン列挙型(Label: {n})・ハイフン限定用法(規則24)・単位を持たない形へ書き直す)`
      );
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
