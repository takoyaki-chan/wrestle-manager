#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-build-template-dict.js — EN辞書(src/lang-en-templates.js)ジェネレータ
//  (Stage B P4-2)
//
//  設計: docs/i18n-stage-b-p4-design-v0.1.md D-P4-1/D-P4-4、
//        機械検査は test/i18n-build-dict.js(UI台帳側)のD-B4を踏襲 + 黒田禁止語grep追加
//
//  ■ 何をするか
//    i18n/template-ledger.json の en 列が非空の行だけを対象に、機械検査を通した上で
//    src/lang-en-templates.js(WM_I18N.addDict({...}) の列挙)を生成する。
//    src/lang-en.js(UI文字列辞書・P3b-6が同時作業中)とは別ファイルに分離して
//    WM_I18N.addDict() を2回呼ぶ形にする(WM_I18N.addDict は既存辞書へのマージなので
//    どちらを先に読み込んでも安全 — src/i18n.js addDict実装参照)。
//
//  ■ 機械検査(1件でも違反があれば exit 1・lang-en-templates.js は書き換えない)
//    1. プレースホルダ完全性: en内の{name}集合がja(key)内の{name}集合と完全一致
//       (test/i18n-build-dict.js D-B4-1と同じ。Stage B P6 D-P6-5のフィルタ記法
//       `{name:filter}` にも対応し、比較は基底名で行う — `{cost:man}`と`{cost}`は同一視)
//    2. 重複キー検出: 台帳内に同一keyが複数存在しないか
//    3. en内の日本語残り検出: 翻訳し忘れ検出(絵文字はBMP外のため誤検出しないレンジを使う。
//       test/i18n-build-dict.js のJA_RE修正コメント参照)
//    4. 黒田禁止語grep(docs/en-kuroda-style-draft-v0.1.md §3-6): タブロイド語彙・誇張・
//       慨嘆の暴走・スポーツ面常套句・翻訳調・声の取り違え・用語の取り違えを検出する。
//       このリストは黒田幸子(週刊グラップル記者)の署名記事(kuroda-text.js)向けに
//       書かれたものだが、指示書で「en-kuroda-style-draft-v0.1.mdの禁止語リストを読み込んで
//       検査」と明示されているため、テンプレ全体(新聞記事文言全般)に対して適用する。
//    5. プレースホルダ直前の不定冠詞(P6-14): 同 §3-4 規則25。`a {bestMQ}` は充填値が
//       88 のとき "an" が正しくなる。ハイフン限定用法(`a {n}-year …`)のみ許可。
//
//  ■ 使い方
//    node test/i18n-build-template-dict.js       src/lang-en-templates.js を(再)生成
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'i18n', 'template-ledger.json');
const OUT_PATH = path.join(ROOT, 'src', 'lang-en-templates.js');

// Stage B P6 D-P6-5: `{name}` と `{name:filter}` の両方にマッチし、キャプチャグループ1に
// 基底名(filter抜きの名前)を取る(test/i18n-build-dict.jsと同じ拡張)。
const PLACEHOLDER_RE = /\{([A-Za-z_][A-Za-z0-9_]*)(?::[A-Za-z_][A-Za-z0-9_]*)?\}/g;
// test/i18n-build-dict.js と同じ理由・同じレンジ(BMP外の絵文字を「日本語残り」と
// 誤検出しないよう、サロゲート範囲を含む豈-﫿(U+8C48-U+FAFF)ではなく
// 互換漢字の正しい始点U+F900からのレンジを使う)。
const JA_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/;

// P6-14: プレースホルダ直前の不定冠詞(docs/en-kuroda-style-draft-v0.1.md §3-4 規則25)。
// 定義は test/i18n-build-dict.js と同一(台帳ごとに独立実行するため各スクリプトが持つ)。
const ARTICLE_BEFORE_PLACEHOLDER_RE = /\b(a|an)\s+\{[^}]+\}(?!-)/i;

// ── 黒田禁止語grep(docs/en-kuroda-style-draft-v0.1.md §3-6を機械可読な形に移植) ──
const KURODA_FORBIDDEN = [
  { label: 'タブロイド語彙・誇張(slam/blast/shock等)', re: /\b(slams?|blasts?|rocked|stunner|shock(ing|ed)?|chaos|erupts?|bombshell|meltdown|savage|destroys?)\b/i },
  { label: 'タブロイド語彙・誇張(epic/insane等)', re: /\b(epic|insane|absolute|legendary|iconic|must-see|star-studded)\b/i },
  { label: '慨嘆の暴走', re: /\b(heartbreaking|gut-wrenching|tragic|poignant|bittersweet)\b/i },
  { label: '慨嘆の暴走(定型句)', re: /one cannot help but|there is something beautiful/i },
  { label: 'スポーツ面常套句(根性論)', re: /leave it all in the ring|wants it more|dig deep|heart of a champion/i },
  { label: 'スポーツ面常套句(決まり文句)', re: /make no mistake|at the end of the day|statement win|put on notice|tale of the tape/i },
  { label: '翻訳調', re: /It can't be helped|As expected of|It has been revealed that|Attention is gathering/i },
  { label: '声の取り違え', re: /\bwe at the\b|yours truly|IMHO|Let the record show/i },
  { label: '用語の取り違え(mq/points)', re: /\{?mq\}?\s*points|[0-9]+\s*points\b/i },
];

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
    console.error(`[i18n-build-template-dict] 台帳が見つかりません: ${path.relative(ROOT, LEDGER_PATH)}`);
    console.error('[i18n-build-template-dict] 先に `node test/i18n-extract-templates.js` を実行してください。');
    process.exit(1);
  }

  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch (e) {
    console.error(`[i18n-build-template-dict] 台帳のJSONパースに失敗しました: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(ledger)) {
    console.error('[i18n-build-template-dict] 台帳の形式が不正です(配列ではありません)。');
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
    if (!en.trim()) return; // 未訳行はfail-open対象。ここでは対象外。
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

    // 4. 黒田禁止語grep(docs/en-kuroda-style-draft-v0.1.md §3-6)
    KURODA_FORBIDDEN.forEach(({ label, re }) => {
      if (re.test(en)) {
        violations.push(`禁止語[${label}]: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)}`);
      }
    });

    // 5. プレースホルダ直前の不定冠詞(§3-4 規則25)
    const artHit = ARTICLE_BEFORE_PLACEHOLDER_RE.exec(en);
    if (artHit) {
      violations.push(
        `PH直前の不定冠詞(規則25): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} `
        + `(検出="${artHit[0]}"。a/anが充填値で変わる。ハイフン限定用法 \`a {n}-…\` へ逃がすか冠詞を落とす)`
      );
    }

    if (Object.prototype.hasOwnProperty.call(dict, entry.key)) {
      return;
    }
    dict[entry.key] = en;
  });

  if (violations.length) {
    console.error(`[i18n-build-template-dict] NG: 機械検査で${violations.length}件の違反を検出しました。src/lang-en-templates.js は生成していません。`);
    violations.slice(0, 100).forEach((v) => console.error(`  - ${v}`));
    if (violations.length > 100) console.error(`  ...ほか${violations.length - 100}件`);
    process.exit(1);
  }

  const header = [
    '// ══════════════════════════════════════════════════════════════════════════════',
    '//  src/lang-en-templates.js — EN辞書・テンプレ層 (Stage B P4-2, 自動生成)',
    '//',
    '//  このファイルは test/i18n-build-template-dict.js が i18n/template-ledger.json から',
    '//  生成する。手動で編集しないこと。翻訳の追加・修正は i18n/template-ledger.json の',
    '//  en 列を編集し、node test/i18n-build-template-dict.js を再実行して再生成する。',
    '//',
    '//  src/lang-en.js(UI文字列辞書)とは別ファイル。WM_I18N.addDict()は既存辞書への',
    '//  マージなので、読み込み順は問わない(src/i18n.js addDict実装参照)。',
    '//',
    `//  生成元: i18n/template-ledger.json (総キー${ledger.length}件、訳文あり${translatedCount}件)`,
    '//  辞書に無いキーは原文のままfail-openで表示される(D-B2と同じ規約)。',
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

  console.log(`[i18n-build-template-dict] 生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-build-template-dict] 台帳総キー数=${ledger.length} 訳文あり=${translatedCount} 未訳(fail-open)=${ledger.length - translatedCount}`);
}

main();
