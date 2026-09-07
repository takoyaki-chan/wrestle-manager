#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-build-dialogue-dict.js — EN辞書(src/lang-en-dialogue.js)ジェネレータ
//  (Stage B P5-1)
//
//  設計: docs/i18n-stage-b-p5-design-v0.1.md D-P5-1/D-P5-3、
//        機械検査の土台は test/i18n-build-dict.js(UI台帳側)のD-B4を踏襲 +
//        セル別検査(D-P5-3)を追加
//
//  ■ 何をするか
//    i18n/dialogue-ledger.json の en 列が非空の行だけを対象に、機械検査を通した上で
//    src/lang-en-dialogue.js(WM_I18N.addDict({...}) の列挙)を生成する。
//    src/lang-en.js(UI文字列辞書)・src/lang-en-templates.js(テンプレ辞書)とは
//    別ファイルに分離して WM_I18N.addDict() を3個目として呼ぶ形にする
//    (addDict は既存辞書へのマージなので読み込み順は問わない — src/i18n.js参照)。
//
//  ■ 機械検査(1件でも違反があれば exit 1・lang-en-dialogue.js は書き換えない)
//    既存(D-B4踏襲・全帯):
//    1. プレースホルダ完全性: en内の{name}集合がja(key)内の{name}集合と完全一致
//       (`{name:filter}`は基底名で比較 — test/i18n-build-dict.jsと同じ拡張)
//    2. 重複キー検出: 台帳内に同一keyが複数存在しないか
//    3. en内の日本語残り検出(絵文字誤検出を避ける正しいレンジ。同ファイルの注記参照)
//    4. 吹き出し長110半角字上限(D-P5-3。en文字列長 > 110 で違反)
//    4b. プレースホルダ直前の不定冠詞(P6-14): docs/en-kuroda-style-draft-v0.1.md §3-4 規則25。
//       `a {name}` は名前の頭音で、`a {n}` は数値の読みで a/an が割れる。ハイフン限定用法
//       (`a {n}-match …`)のみ許可。セリフ層も同じ規約に従う(充填値は同じdata由来のため)
//    4c. プレースホルダ直後の可算名詞複数形(P7-10で新設・P7-13でexit 1化): 同 §3-4 規則23。
//       `{n} years` のように数値PHの直後に可算名詞の複数形を置くと、充填値が1のとき単複が
//       食い違う。ハイフン限定用法(規則24)・単位を持たない形へ書き直して逃がす(セリフの声を
//       崩さない範囲で)。名前・団体名PH+wins/reignsの三人称単数動詞は誤検知として除外。
//
//    セル別(D-P5-3。docs/en-tone-bible-draft-v0.1.md §1-1/§2-2/§2-3/§2-4/§4-6準拠。
//    5〜6(ojousama/cool)は entry.cell が取れている行にのみ適用(cell不明の行は対象外)。
//    7(hell/damn禁止)は**cell不明の行も対象に含む厳格運用**(実装どおり — 「delinquent帯
//    **以外**は禁止」という条件は「cell.archetype==='delinquent'と確定できる行だけを免除し、
//    それ以外(他archetype確定・cell不明の両方)は禁止」という意味で書かれている。cell不明を
//    甘く見て通してしまうと、ID軸未解決だった時期のVICTORY_LINES等でhell/damnが軸不明のまま
//    素通りしかねないため、意図的に厳しい側へ倒している。2026-09-03のP5基盤修正でID軸セル
//    解決を追加した後もこの厳格運用は変えていない — cellが取れない行はそもそもdelinquent確定
//    ではない以上、禁止側に倒すのが安全側)):
//    5. ojousama帯: 短縮形禁止(don't/can't等。所有格's・"'ll"等の非対象記号は誤検出しないよう
//       実在する英語短縮形の固定リストでgrepする — 汎用の「'sを含む語」判定だと
//       "Keisuke's plan"のような所有格まで誤検出するため)
//    6. cool帯: 感嘆符(!)禁止・3文超禁止(「...」を文区切りとして数えない専用センテンス
//       カウンタで判定。docs/en-tone-bible-draft-v0.1.md §2-3「NG: 感嘆符、…3文以上の連続」を
//       機械検査可能な形に落とし込んだもの — D-P5-3の指示語「3文超禁止」に従い閾値は3)
//    7. delinquent帯**確定**以外は禁止: hell/damn禁止(§2-4「卑語はhell/damn上限・低頻度」・
//       §6裁定2「hell/damnをヤンキー骨格内のみ」。cell不明の行も本検査の対象——上記注記参照)
//    8. 全帯: f/sワード禁止(§6裁定2「f/sワード全帯禁止」。日本語原文に卑語が無いため)
//
//    ── P7-57(内部レビュー第5弾・2026-09-07)で追加 ────────────────────────────
//    ネイティブ検品が届いていない3帯(丁寧/蠱惑/鷹揚)を内部レビューするにあたり、
//    トーンバイブル §2-5/§2-6/§2-7 の「NG」と §4-6 検品①④のルールのうち、
//    grepで判定できるものをセル検査へ昇格させた。**追加時点で台帳17,096行に対する
//    違反は全規則0件**(9〜13は元から0件、14〜16は本タスクで12行を改稿して0件にした)。
//    9〜10 は7(hell/damn)と同じ厳格運用(delinquent確定でない行=cell不明も禁止側に倒す)。
//     9. delinquent帯確定以外は禁止: g落とし(-in')禁止(§4-6 検品④「荒っぽさはg落としで作る…
//        ヤンキー限定。標準・丁寧・お嬢様では使わない」)。丁寧帯の規則その1
//    10. delinquent帯確定以外は禁止: ain't禁止(§2-4 NG「ギャング方言の記号(ain'tの乱用等)」。
//        ヤンキー骨格内の道具であり他帯へ貼らない)。丁寧帯の規則その2
//    11. seductive帯: 少女的感嘆詞(yay/hooray/woohoo等)禁止(§2-7 NG「少女的感嘆」)
//    12. seductive帯: キャンプな呼びかけ(darling/dearie等)禁止(§2-7 NG「キャンプな
//        芝居がかり("darling"乱発)」。色気は温度の低さと余裕で出す)
//    13. seductive帯: 露骨な性的語彙禁止(§2-7 NG「露骨な性的語彙」)
//    14. composed帯: 若者スラング禁止(§2-6 NG「若者スラング」。鷹揚=大人の余裕=急がない英語)
//    15. 全帯: 文末の "maybe" 禁止(§4-6 検品①「文末の『かも』= "... I think."。
//        **"maybe"は文頭専用**。"... maybe."と文末に置かない」)。コンマ+maybe と
//        「…」+小文字maybe が行末に来る形だけを違反とし、独立した1文としての "...Maybe."
//        (文頭扱い・英語として自然な後置のためらい)は許可する
//    16. 全帯: 「武器」をweaponと直訳しない(§4-6 検品④「『武器』は訳さない」)。比喩の武器
//        (my weapon / the best weapon / is a weapon)だけを捕まえ、リング上の実物の凶器を
//        weapon と書く用法は残す(現時点で該当行は無いが将来のために逃がしてある)
//    17. 全帯: 翻訳調定型句禁止(§1-5「"It can't be helped" / "I'll do my best" /
//        "As expected of..." 型の直訳英語は使わない」)
//
//  ■ 使い方
//    node test/i18n-build-dialogue-dict.js       src/lang-en-dialogue.js を(再)生成
//
//  ■ 運用ルール
//    P5-1時点(本コミット)ではen列は全行空のため、生成される辞書は空(addDict({}))。
//    以後の翻訳バッチ(Opus主筆)が台帳のen列を埋めるたびに本スクリプトを再実行する。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'i18n', 'dialogue-ledger.json');
const OUT_PATH = path.join(ROOT, 'src', 'lang-en-dialogue.js');

// Stage B P6 D-P6-5: `{name}` と `{name:filter}` の両方にマッチし、キャプチャグループ1に
// 基底名(filter抜きの名前)を取る(test/i18n-build-dict.js / i18n-build-template-dict.jsと同じ拡張)。
const PLACEHOLDER_RE = /\{([A-Za-z_][A-Za-z0-9_]*)(?::[A-Za-z_][A-Za-z0-9_]*)?\}/g;
// test/i18n-build-dict.js と同じ理由・同じレンジ(BMP外の絵文字を「日本語残り」と
// 誤検出しないよう、サロゲート範囲を含む豈-﫿(U+8C48-U+FAFF)ではなく
// 互換漢字の正しい始点U+F900からのレンジを使う)。
const JA_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/;

const MAX_LEN = 110;

// P6-14: プレースホルダ直前の不定冠詞(docs/en-kuroda-style-draft-v0.1.md §3-4 規則25)。
// 定義は test/i18n-build-dict.js と同一(台帳ごとに独立実行するため各スクリプトが持つ)。
const ARTICLE_BEFORE_PLACEHOLDER_RE = /\b(a|an)\s+\{[^}]+\}(?!-)/i;
// Stage B P7-10で新設・P7-13でexit 1化: プレースホルダ直後の可算名詞複数形
// (docs/en-kuroda-style-draft-v0.1.md §3-4 規則23)。定義は test/i18n-build-dict.js と同一
// (台帳ごとに独立実行するため各スクリプトが持つ)。
const PLURAL_NOUN_AFTER_PLACEHOLDER_RE = /\{([a-zA-Z]+)\}\s+(wrestlers|wins|losses|defenses|reigns|matches|times|seasons|years|weeks|days|points)\b/gi;
// P7-13: 誤検知の除外。定義は test/i18n-build-dict.js と同一。
const NAME_SUBJECT_VERB_EXEMPT_RE = /^(name|winnerName|championName|championOrg|requesterName)$/i;

// ── D-P5-3 セル別検査 ────────────────────────────────────────────────────
// 実在する英語短縮形の固定リスト(所有格'sを誤検出しないための語彙リスト方式)。
const CONTRACTION_RE = new RegExp(
  '\\b('
  + "don't|doesn't|didn't|can't|cannot've|won't|wouldn't|couldn't|shouldn't|mustn't|"
  + "isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|"
  + "I'm|you're|he's|she's|it's|we're|they're|"
  + "I've|you've|we've|they've|"
  + "I'll|you'll|he'll|she'll|it'll|we'll|they'll|"
  + "I'd|you'd|he'd|she'd|it'd|we'd|they'd|"
  + "let's|that's|there's|here's|what's|who's|how's|y'all|ain't"
  + ')\\b',
  'i'
);

const EXCLAMATION_RE = /!/;
// 語尾を\w*で緩く拾うと "hell" が "Hello" ("hell"+"o") に誤爆する(2026-09-03 実装時に
// smoke testで発見)。実在する屈折形を列挙した固定リストでgrepする。
const HELL_DAMN_RE = /\b(hell|hells|hellish|damn|damns|damned|damning|goddamn|dammit|damnit)\b/i;
const F_WORD_RE = /\b(fuck|fucks|fucked|fucking|fucker|fuckers)\b/i;
const S_WORD_RE = /\b(shit|shits|shitty|shitting)\b/i;

// ── P7-57(内部レビュー第5弾)で追加した検査 9〜17 ─────────────────────────────
// 9. g落とし(-in')。「所有格の 's」「'em」等を拾わないよう、アポストロフィの直後に
//    英字が続かない場合だけを違反とする(Kevin's / origin's は否定先読みで除外される)。
//    先頭の大文字("Nothin'")も拾うため文字クラスは [A-Za-z]。
const G_DROPPING_RE = /\b[A-Za-z]{2,}in'(?![A-Za-z])/;
// 10. ain't(ギャング方言の記号)。
const AINT_RE = /\bain'?t\b/i;
// 11. 少女的感嘆詞(蠱惑帯)。
const GIRLISH_INTERJECTION_RE = /\b(yay+|hooray|hurray|yippee|woo-?hoo|whee)\b/i;
// 12. キャンプな呼びかけ(蠱惑帯)。
const CAMP_ENDEARMENT_RE = /\b(darling|dearie|sweetie|sweetheart|my dear)\b/i;
// 13. 露骨な性的語彙(蠱惑帯)。
const EXPLICIT_VOCAB_RE = /\b(orgasm\w*|horny|aroused|arousal|climax\w*|nipples?|panties|lewd)\b/i;
// 14. 若者スラング(鷹揚帯)。
const YOUTH_SLANG_RE = /\b(lol|lmao|omg|omfg|bruh|sus|totes|fam|bae|yeet|deadass|vibes|dude|gurl)\b/i;
// 15. 文末の "maybe"。大文字始まりの独立文 "...Maybe." は許可するため、
//     第2枝はあえて小文字 maybe のみに限定している(全体に /i を付けない)。
const TRAILING_MAYBE_RE = /(,\s*[Mm]aybe\b[.?!…]*\s*$)|(\.{2,}\s*maybe\b[.?!…]*\s*$)/;
// 16. 比喩の「武器」= weapon。限定詞+(最大2語の修飾)+weapon、または be/become + 冠詞 + weapon。
const METAPHORICAL_WEAPON_RE = /\b(?:my|your|her|his|our|their|the)\s+(?:[A-Za-z]+\s+){0,2}weapons?\b|\b(?:is|are|was|were|becomes?|became)\s+(?:a|an|my|the)\s+(?:[A-Za-z]+\s+){0,2}weapons?\b/i;
// 17. 翻訳調定型句(§1-5に列挙されている型)。
const TRANSLATIONESE_RE = /\b(it can'?t be helped|it cannot be helped|as expected of|i'?ll do my best|i will do my best)\b/i;

// 「3文超」判定用のセンテンスカウンタ。"..."(または連続するピリオド)は文区切りとして
// 数えない — 溜めの"..."自体はcool帯の定番記号(§0対応表)であり、これを文区切りに
// 数えると短い断片文の連続が誤って「複数文」判定されてしまうため。
function countSentences(text) {
  const withoutEllipsis = text.replace(/\.{2,}/g, ' '); // "..." "...." 等を除去(区切りとして数えない)
  const parts = withoutEllipsis.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  return parts.length;
}

function checkCellRules(entry, en, violations) {
  const cell = entry.cell;
  if (cell && cell.archetype === 'ojousama') {
    // 2026-09-04 ネイティブ検品②: 「〜かしら？」を受ける付加疑問("won't you?" / "isn't it?")は
    // お嬢様帯の礼節表現であり短縮形禁止の対象外。文末の「, <短縮形> <代名詞>?」だけを除いて検査する
    const enNoTag = en.replace(/,\s*(won't|isn't|aren't|wasn't|weren't|don't|doesn't|didn't|can't|couldn't|wouldn't|shouldn't|hasn't|haven't|hadn't)\s+(you|it|she|he|they|we|I)\?/gi, '?');
    const m = enNoTag.match(CONTRACTION_RE);
    if (m) {
      violations.push(`[cell:ojousama]短縮形禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${m[0]}")`);
    }
  }
  if (cell && cell.archetype === 'cool') {
    if (EXCLAMATION_RE.test(en)) {
      violations.push(`[cell:cool]感嘆符禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)}`);
    }
    const n = countSentences(en);
    if (n > 3) {
      violations.push(`[cell:cool]3文超禁止(検出${n}文): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)}`);
    }
  }
  if (!cell || cell.archetype !== 'delinquent') {
    const m = en.match(HELL_DAMN_RE);
    if (m) {
      violations.push(`[cell:${cell ? cell.archetype : '不明'}]hell/damn禁止(delinquent帯以外): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${m[0]}")`);
    }
  }
  // 全帯: f/sワード禁止
  if (F_WORD_RE.test(en) || S_WORD_RE.test(en)) {
    violations.push(`[全帯]f/sワード禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)}`);
  }

  // ── P7-57 追加(9〜17) ──────────────────────────────────────────────────
  const archLabel = cell ? cell.archetype : '不明';
  // 9〜10. delinquent帯の道具を他帯へ貼らない(7と同じ厳格運用: cell不明も禁止側)
  if (!cell || cell.archetype !== 'delinquent') {
    const gm = en.match(G_DROPPING_RE);
    if (gm) {
      violations.push(`[cell:${archLabel}]g落とし(-in')禁止(delinquent帯以外): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${gm[0]}")`);
    }
    const am = en.match(AINT_RE);
    if (am) {
      violations.push(`[cell:${archLabel}]ain't禁止(delinquent帯以外): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${am[0]}")`);
    }
  }
  // 11〜13. seductive帯
  if (cell && cell.archetype === 'seductive') {
    const im = en.match(GIRLISH_INTERJECTION_RE);
    if (im) {
      violations.push(`[cell:seductive]少女的感嘆詞禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${im[0]}")`);
    }
    const cm = en.match(CAMP_ENDEARMENT_RE);
    if (cm) {
      violations.push(`[cell:seductive]キャンプな呼びかけ禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${cm[0]}")`);
    }
    const xm = en.match(EXPLICIT_VOCAB_RE);
    if (xm) {
      violations.push(`[cell:seductive]露骨な性的語彙禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${xm[0]}")`);
    }
  }
  // 14. composed帯
  if (cell && cell.archetype === 'composed') {
    const sm = en.match(YOUTH_SLANG_RE);
    if (sm) {
      violations.push(`[cell:composed]若者スラング禁止: ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${sm[0]}")`);
    }
  }
  // 15〜17. 全帯
  const mm = en.match(TRAILING_MAYBE_RE);
  if (mm) {
    violations.push(`[全帯]文末の"maybe"禁止(検品①: 文末の「かも」は "... I think."。maybeは文頭専用): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${mm[0].trim()}")`);
  }
  const wm = en.match(METAPHORICAL_WEAPON_RE);
  if (wm) {
    violations.push(`[全帯]比喩の「武器」をweaponと訳さない(検品④): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${wm[0]}")`);
  }
  const tm = en.match(TRANSLATIONESE_RE);
  if (tm) {
    violations.push(`[全帯]翻訳調定型句禁止(§1-5): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} (検出="${tm[0]}")`);
  }
}

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
    console.error(`[i18n-build-dialogue-dict] 台帳が見つかりません: ${path.relative(ROOT, LEDGER_PATH)}`);
    console.error('[i18n-build-dialogue-dict] 先に `node test/i18n-extract-dialogue.js` を実行してください。');
    process.exit(1);
  }

  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch (e) {
    console.error(`[i18n-build-dialogue-dict] 台帳のJSONパースに失敗しました: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(ledger)) {
    console.error('[i18n-build-dialogue-dict] 台帳の形式が不正です(配列ではありません)。');
    process.exit(1);
  }

  const violations = [];
  const seenKeys = new Set();
  const dict = {};
  let translatedCount = 0;
  let cellCheckedCount = 0;

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

    // 4. 吹き出し長110半角字上限
    if (en.length > MAX_LEN) {
      violations.push(`吹き出し長上限(${MAX_LEN}字)超過(${en.length}字): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)}`);
    }

    // 4b. プレースホルダ直前の不定冠詞(§3-4 規則25)
    const artHit = ARTICLE_BEFORE_PLACEHOLDER_RE.exec(en);
    if (artHit) {
      violations.push(
        `PH直前の不定冠詞(規則25): ${JSON.stringify(entry.key)} → ${JSON.stringify(en)} `
        + `(検出="${artHit[0]}"。a/anが充填値で変わる。ハイフン限定用法 \`a {n}-…\` へ逃がすか冠詞を落とす)`
      );
    }

    // 5〜8. セル別検査(D-P5-3)
    if (entry.cell) cellCheckedCount++;
    checkCellRules(entry, en, violations);

    // 9. プレースホルダ直後の可算名詞複数形(§3-4 規則23。P7-13でexit 1化)
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
        + `ハイフン限定用法(規則24)・単位を持たない形へ書き直す)`
      );
    }

    if (Object.prototype.hasOwnProperty.call(dict, entry.key)) {
      return;
    }
    dict[entry.key] = en;
  });

  if (violations.length) {
    console.error(`[i18n-build-dialogue-dict] NG: 機械検査で${violations.length}件の違反を検出しました。src/lang-en-dialogue.js は生成していません。`);
    violations.slice(0, 100).forEach((v) => console.error(`  - ${v}`));
    if (violations.length > 100) console.error(`  ...ほか${violations.length - 100}件`);
    process.exit(1);
  }

  const header = [
    '// ══════════════════════════════════════════════════════════════════════════════',
    '//  src/lang-en-dialogue.js — EN辞書・セリフ層 (Stage B P5-1, 自動生成)',
    '//',
    '//  このファイルは test/i18n-build-dialogue-dict.js が i18n/dialogue-ledger.json から',
    '//  生成する。手動で編集しないこと。翻訳の追加・修正は i18n/dialogue-ledger.json の',
    '//  en 列を編集し、node test/i18n-build-dialogue-dict.js を再実行して再生成する。',
    '//',
    '//  src/lang-en.js(UI文字列辞書)・src/lang-en-templates.js(テンプレ辞書)とは',
    '//  別ファイル。WM_I18N.addDict()は既存辞書へのマージなので、読み込み順は問わない',
    '//  (src/i18n.js addDict実装参照)。',
    '//',
    `//  生成元: i18n/dialogue-ledger.json (総キー${ledger.length}件、訳文あり${translatedCount}件、cell判定済み${cellCheckedCount}件)`,
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

  console.log(`[i18n-build-dialogue-dict] 生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-build-dialogue-dict] 台帳総キー数=${ledger.length} 訳文あり=${translatedCount} 未訳(fail-open)=${ledger.length - translatedCount} cell判定済み(訳文あり中)=${cellCheckedCount}`);
}

main();
