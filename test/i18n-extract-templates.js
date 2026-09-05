#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-extract-templates.js — テンプレ台帳ジェネレータ (Stage B P4-2 / P4-5拡張)
//
//  設計: docs/i18n-stage-b-p4-design-v0.1.md D-P4-1、工程2
//        P4-5拡張: 黒田記事プール(kuroda-text.js)+自団体新聞プール(app.js)の追加
//
//  ■ 何をするか(P4-2時点)
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
//    走査して文字列の葉を全て拾う汎用ウォーカーで対応する。
//
//  ■ P4-5で追加した対象
//    1. src/kuroda-text.js の全プール(KURODA_HEADLINES/KURODA_EDITORIAL/
//       KURODA_WAR_RECORD/KURODA_MATCHUP_FLAVOR/FAN_OPINIONS/NEWSPAPER_DIGEST_COMMENTS/
//       KURODA_SHOW_RATING/KURODA_PREVIEW/KURODA_SPOTLIGHT/KURODA_NEWS_COMMENT/
//       KURODA_RELATION_NARRATIVE/KURODA_CRISIS/KURODA_GAMEOVER)。
//       NEWSPAPER_DIGEST_COMMENTS/FAN_OPINIONS は指示書では「data.jsに存在すれば」と
//       言及されていたが、実体はどちらも kuroda-text.js にのみ定義されている
//       (data.js側に同名テーブルは無い。2026-09-04 grep確認)ため、ここに含めた。
//       FAN_HANDLES(ファンハンドル名 'wrestling_fan' 等)は日本語を含まない識別子文字列
//       そのものが両言語で表示される値のため対象外。
//    2. src/app.js の App._NEWSPAPER_HEADLINES / App._NEWSPAPER_ARTICLES
//       (自団体新聞の見出し/本文プール。App オブジェクトのプロパティなので
//       loadAsGlobal では取れない — 後述の isolated eval で取り出す)。
//
//  ■ 関数値(d => `...${d.x}...`)の扱い(P4-5で追加)
//    kuroda-text.js/app.js のプールの多くは、値が「JSテンプレートリテラルで補間まで
//    済ませる関数」であり、既存14テーブルの「{name}プレースホルダ文字列」とは形が
//    異なる。素直には辞書キー(=補間前のJA原文)を取れないため、src/kuroda-text.js に
//    追加した kurodaTemplateOf(fn) で関数ソースを軽量パースし、`${d.prop}` 等を
//    `{propName}` へ正規化してから抽出する(詳細は同ファイルのコメント参照)。
//    三項演算子分岐・入れ子テンプレートリテラル・Math.abs()等の計算式を含む関数は
//    正規化できない(null)ため台帳に載らない=「保留」として集計だけ行う
//    (docs/i18n-p4-5-kuroda-holdout-audit.md に一覧を出力)。
//    kurodaTemplateOf は kuroda-text.js 側で実装し、loadAsGlobal で読み込んだこの
//    ファイルの実行時(=表示時)と全く同じロジックを抽出時にも使う(二重実装を避ける)。
//
//  ■ 対象外(意図的にテーブルへ含めない)
//    - PPV_SUMMIT_VICTORY_LINES: 選手個人のセリフ(セリフ層/P5対象)であり、汎用テンプレ
//      ではないため対象外(docs/i18n-stage-b-p4-design-v0.1.md「対象外」節)
//    - Engine.mvpRace.generateKurodaComment 等「関数内実行文プール」(テーブルではなく
//      メソッド本体に直書きされた配列リテラル)は今回テーブル化しない
//      (P4-5指示書③。保留理由は worklog/preformatted-values-audit.md 参照)
//
//  ■ 台帳の保持マージ(P4-5で追加。test/i18n-extract-dialogue.jsと同じ作法)
//    既存の i18n/template-ledger.json が存在する場合、そのen列(非空)は再生成時に
//    上書きしない(翻訳バッチが投入した既存209+341本超の訳文を、抽出器の再実行で
//    消さないため)。既存enが無い(=新規行)行にのみ空文字のenを書く。
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
const HOLDOUT_DOC_PATH = path.join(ROOT, 'docs', 'i18n-p4-5-kuroda-holdout-audit.md');

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
  // P6-10で追加。引退記事のティア別テンプレ({L,A,B,C} × 3変種 × headline/body = 24本)。
  // AI_INJURY_RETIREMENT_TEMPLATES は最初から対象だったのに、通常引退の本表だけが
  // 対象一覧から漏れていた(EMOTION_TEXTSと同型の「見えないテーブル」)。消費点は
  // Engine.newspaper._fillRetirementTemplate(P6-10でdict-opts化済み)。
  'RETIREMENT_TEMPLATES',
  // P6-14で追加。殿堂入り選手の語り文プール(導入6分岐×3 + 核心19分岐×2〜3 +
  // 余韻3系統 + 連結様式 join = 85本)。P6-10までは Engine.awards.generateBiography()
  // の関数本体に直書きされた配列リテラルで、§10-2 の「関数の中の配列は抽出器から
  // 永久に見えない」型だった。消費点は generateBiography(entry, dict)(P6-14でdict-opts化)。
  'HOF_BIOGRAPHY_TEMPLATES',
  // P6-15で追加。§13-2の突合表A「兄弟表は対象なのに本表だけ漏れている」型の4表。
  // いずれも消費点(composer)がdictを持たず、台帳へ載せるだけでは辞書を引く機会が
  // 無かったため、composerのdict-opts化と同時に対象へ入れた。
  //   UNIFIED_TITLE_TEMPLATES  96行 — composeUnifiedTitleArticle(type, data, seed, dict)
  //   CHAMPION_CHANGE_TEMPLATES 26行 — composeChampionChangeBody(ev, seed, dict)
  //   DRAFT_PLAYER_RESULT_PARTS 14行 — composeDraftPlayerResult(org, fighters, seed, dict)
  //   PPV_HYPE_TEMPLATES       10行 — Engine.ppv.buildHype(match) が hypeTpl/hypeVars を併記
  //   ARTICLE_COMPOSE_TEMPLATES 4行 — 上記composerの連結様式+差し込みラベル(P6-14のjoinと同型)
  'UNIFIED_TITLE_TEMPLATES',
  'CHAMPION_CHANGE_TEMPLATES',
  'DRAFT_PLAYER_RESULT_PARTS',
  'PPV_HYPE_TEMPLATES',
  'ARTICLE_COMPOSE_TEMPLATES',
  // P7-2で追加(§13-2の突合表B「A. 地の文プール」前半7表)。Engine/UIが直に読む
  // 状況描写・演出文のプールで、消費点がt()もdictも持たなかったためENでもJAのまま
  // 出ていた層。表そのものは無改修(並び順・要素数を変えると乱数の出目が変わる)。
  //   SNAPSHOT_TEXTS     282 — 相関図/週次ログの垣間見え(scene/voice/staff/modal)
  //   ATMOSPHERE_TEXTS    33 — 道場ヘッダーの雰囲気文(emojiフィールドは対象外・下記フィルタ)
  //   FAREWELL_KIND_TEXT  15 — 引退セレモニーの型別 見出し/リード/地の文
  //   LOCKER_AIR_TEXTS    14 — ロッカールームの空気ログ
  //   CAMP_FLAVOR_TEXTS   12 — 合宿フレーバー
  //   PRE_WINDOW_TEXTS     9 — 移籍ウィンドウ前週の予兆
  //   TEAM_SPIRIT_TEXTS    8 — 逆境チームスピリット(text+detail)
  'SNAPSHOT_TEXTS',
  'ATMOSPHERE_TEXTS',
  'FAREWELL_KIND_TEXT',
  'LOCKER_AIR_TEXTS',
  'CAMP_FLAVOR_TEXTS',
  'PRE_WINDOW_TEXTS',
  'TEAM_SPIRIT_TEXTS',
  // P7-3(2026-09-04): 地の文プール後半3表(docs/i18n-stage-b-p7-design-v0.1.md §1分類A)。
  //   NOTIF_EVENT_TEXTS   102行 — 通知型イベント(N1〜N5/N_isolation/N_coach_report/
  //                               N_sudden_departure)の見出し+状況説明。消費点は
  //                               Engine.eventSystem.pickText(rng,key,vars,dict)(P6-13でdict-opts化済み)
  //   LARGE_EVENT_TEXTS    86行 — 大型イベント(B1〜B4+B4_*サブタイプ)の同上。消費点は同じpickText
  //   WEEKLY_STORY_TICKER  65行 — 週次の人間関係ティッカー文。**消費点はgameLogのレガシー
  //                               文字列エントリのみ**(relationships.js processWeeklyStoryEvents)で、
  //                               specs §2-4/§12-1により表示はJA固定。台帳へは載せる(§13-2 Bを閉じる+
  //                               gameLog再設計時に訳が揃っている状態にする)が、現時点で辞書は引かれない。
  //                               詳細はworklogのP7-3エントリを参照。
  'NOTIF_EVENT_TEXTS',
  'LARGE_EVENT_TEXTS',
  'WEEKLY_STORY_TICKER',
  // P6-16で追加。specs §14-5 が起票した同型4件の移設先。
  //   PPV_SUMMIT_STORY_TEMPLATES 13行 — 頂上決戦記事の地の文(P3a-2が3表だけ移設して残した分)
  //   NEWS_FALLBACK_TEMPLATES     3行 — composerがnullのときの直書きJAフォールバック
  //   AUTUMN_WAR_NEWS_PARTS      10行 — 秋対抗戦ニュースの生キー→文(specs §8)
  //   CHRONICLE_*                    — 年代記の記者の目/叙述文(Engineプロパティ+関数内直書きの移設)
  'PPV_SUMMIT_STORY_TEMPLATES',
  'NEWS_FALLBACK_TEMPLATES',
  'AUTUMN_WAR_NEWS_PARTS',
  'CHRONICLE_QUOTE_CLAUSES',
  'CHRONICLE_QUOTE_TEMPLATES_V2',
  'CHRONICLE_QUOTE_TEMPLATES_V1',
  'CHRONICLE_QUOTE_TEMPLATES_DUAL',
  'CHRONICLE_NARRATIVE_TEMPLATES',
  // P7-4で追加(§13-2の突合表B「B. プロフィール文」3表)。人物紹介の地の文で、
  // 消費点がt()もdictも持たなかったためENでもJAのまま出ていた層。
  //   CHAR_PROFILES     127 — 選手紹介文(選手ポップアップ/選手ファイル/観戦画面の選手パネル)
  //   ALL_COACHES       112 — コーチの desc/profile/origin/gender/flavor(下記フィルタ。
  //                           name は名前辞書、abilities は COACH_ABILITY_CATALOG(P7-1のui台帳)の領分)
  //   COACH_FLAVOR_DEFS  11 — フレーバー能力の効果説明文(キー名はALL_COACHES.flavor側で拾われる)
  'CHAR_PROFILES',
  'ALL_COACHES',
  'COACH_FLAVOR_DEFS',
  // P6-17: 年代記の章タイトル / サブタイトル / 章末 / ハイライト行(Engineプロパティ+
  // 関数内直書きの移設)と、週次ストーリーイベント(gameLogレガシー文字列)の文面。
  'CHRONICLE_CHAPTER_TEMPLATES',
  'WEEKLY_STORY_EVENT_TEXTS',
  // P6-18: 序章(G.prologue)の章題/記者の見立て/章末/ハイライト12種と、年代記カードの
  // 「数値+単位語」(specs §4 が積み残していた族・§21-6-2)。
  //   PROLOGUE_TEMPLATES   17行 — Engine.prologue が焼くハイライト/章末 + UIの静的文
  //   CHRONICLE_UNIT_TEXTS 13行 — 期/戴冠/度防衛/勝敗/中黒連結。ENは充填値で単複が
  //                               変わらない形(規則23/24)。マークアップはテンプレ側に持つ
  'PROLOGUE_TEMPLATES',
  'CHRONICLE_UNIT_TEXTS',
  // P7-8で追加。自団体興行結果の**繰り上げ記事**フォールバック本文(specs §23-6)。
  // ui-render.js `_npSwapMainToSecondCard` の関数内直書きJSテンプレートリテラル
  // (§10-2「関数の中のリテラルはどの抽出器からも見えない」型)をdata.jsのトップレベル
  // テーブルへ移設したもの。消費点は同関数で `WM_I18N.t(FB.xxx, vars)`(UI層なので
  // opts糸通しは不要 — §6「UI層からの直接t()配線」)。
  'NEWSPAPER_SHOW_FALLBACK_TEMPLATES',
  // P7-11で追加。新聞2面「団体比較号」の紹介文プール(specs §29-6 の発見2)。
  // `Engine.database.getOrgCompareAnalysis()` の**関数本体に直書き**されていた
  // (§10-2型)ものを data.js のトップレベルテーブルへ移設した。消費点は
  // ui-render.js `_npRenderPage2` 1箇所で、そこから `WM_I18N.t` を dict として
  // Engineへ糸通しする(§6のlang糸通し規約 — Engineは WM_I18N を直接呼ばない)。
  //   GRADE_DESCS  5 / AXIS_TEXTS 20 / SUMMARY 7 / EDITORIAL 36 / TAGS 6 / ACTIONS 20 / ORG 2
  // 軸ラベル(TOP5実力/選手層/団体人気/TOP5人気)はここに含めない — ui-ledger との
  // 二重登録を避けるため management.js に JA を1本だけ置いて `_wmDictLabel` で引く(§15-3)。
  'ORG_COMPARE_GRADE_DESCS',
  'ORG_COMPARE_AXIS_TEXTS',
  'ORG_COMPARE_SUMMARY_TEMPLATES',
  'ORG_COMPARE_EDITORIAL_TEXTS',
  'ORG_COMPARE_TAG_TEMPLATES',
  'ORG_COMPARE_ACTION_TEXTS',
  'ORG_COMPARE_ORG_TEMPLATES',
  // P7-11: 比較対象団体の副題に入る一行紹介(`Tier {tier} / {desc}` の {desc})。
  // 同表の他フィールドは識別子・色・絵文字・空文字列なので desc だけをパスフィルタで拾う。
  'RIVAL_ORGS',
  // P7-16で追加(specs §34-7 が起票した `Engine.newspaper` の残83行)。
  // management.js の関数本体に直書きされていた見出し・本文(§10-2型)の移設先。
  // 消費点は Engine.newspaper.generate / eventContenders / eventPreviewParagraph で、
  // いずれも generate のローカル dict を _wmFillWithDict へ渡す(§6のlang糸通し)。
  //   NEWS_CONTENDER_TEXTS         12 — 優勝候補の選出理由と事前記事の一段落
  //   NEWS_JUNIOR_TOURNAMENT_TEXTS 24 — ジュニアTNの結果面/特集面/前週プレビュー
  //   NEWS_AI_ORG_TEXTS            41 — AI団体の業界ニュース(引退/退団/殿堂/興行/対抗戦/挑戦状…)
  // `現王者`/`決勝`/`準決勝`/`準々決勝`/`殿堂入り`/`勝者`/`決勝の相手`/`プレイヤー団体`と
  // 大会名4種は ui-ledger に既訳があるのでここに入れない(§15-3)。
  'NEWS_CONTENDER_TEXTS',
  'NEWS_JUNIOR_TOURNAMENT_TEXTS',
  'NEWS_AI_ORG_TEXTS',
  // P7-19で追加。`_wmNewsStamp`(management.js)の suffix が ui-ledger の1語ラベル
  // (`定期興行`→ナビ用複数形/`挑戦状`→見出し語)を文脈違いのまま借りていたバグの修正先。
  // ui-ledgerの2キーとは別のキー(`{stamp} 定期興行`/`{stamp} 挑戦状`)としてスタンプ専用の
  // 訳を持たせる(specs §35-7-2 → §37)。
  'NEWS_STAMP_SUFFIX_TEXTS',
  // P7-23で追加。新聞4面「年間MVPレース」の地の文システム(docs/i18n-coverage-report-v0.1.md
  // A分類 #1、285件/4,924字)。`Engine.mvpRace` の叙述family(generateNarrative /
  // _traitPhrase / generateTagline / generatePageHeadline / generatePageLead /
  // generateKurodaComment / _topElements / _collectFactChips / _composeChaseLine /
  // _composeFlavorLine / generateRichBlocks)の**関数本体に直書きされた配列リテラル**
  // (§10-2型)を data.js のトップレベル表へ移設したもの。消費点は同family(dict-opts)で、
  // ui-render.js の4面描画が `WM_I18N.t` を dict として糸通しする。
  // 役割6種・季4種・試合種別3種・実績ラベル7種・特性名は ui-ledger に既訳があるので
  // 本表へは入れない(§15-3。JA原文は management.js に1本だけ置き `_wmDictLabel` で引く)。
  'MVP_RACE_TEXTS',
];

// P7-2: テーブル全体ではなく特定の部分木だけを台帳へ載せるためのパスフィルタ
// (test/i18n-extract-dialogue.js の INCLUDE_PATH_FILTER と同じ作法)。
// `pathKeys` はテーブル直下から数えたオブジェクトキー列(配列インデックスは含まない)。
// ATMOSPHERE_TEXTS は `{ emoji, text }` の対で、emoji は絵文字1文字=訳出対象ではない
// (表示側も `${atmo.emoji} ${t(atmo.text)}` と分けて出す)。
const TABLE_PATH_FILTER = {
  ATMOSPHERE_TEXTS: (pathKeys) => pathKeys[pathKeys.length - 1] !== 'emoji',
  // P7-4: `ALL_COACHES` はオブジェクト配列で、訳出対象は人物紹介の地の文と
  // プロフィール欄のラベル値だけ。P6-10の `extractArrayLiteralProp`(ソース文字列から
  // `prop: [ ... ]` を切り出す)と同じ「配列のプロパティだけを台帳へ載せる」目的だが、
  // `ALL_COACHES` はトップレベル`const`でそのまま評価済みの値が取れるため、
  // ソースの切り出しではなくパスフィルタで同じことをする(配列インデックスは
  // pathKeys に含まれないので、要素の直下キー名がそのまま最後の要素になる)。
  //   ○ desc/profile … 紹介文・プロフィール文(本バッチの主題)
  //   ○ origin/gender … プロフィール欄の値(`{origin}出身` `{gender}性` で差し込まれる)
  //   ○ flavor        … フレーバー能力名。COACH_FLAVOR_DEFS のキーと同一文字列で、
  //                      キーは走査対象にならない(walkStringsは値だけを拾う)ため
  //                      ここで拾わないと能力名が台帳に載らない
  //   ✕ name          … 人名。固有名詞辞書(src/lang-en-names.js)の領分
  //   ✕ abilities     … 特殊能力名。`COACH_ABILITY_CATALOG` と同一文字列で、
  //                      そちらはP7-1のui台帳(DATA_TABLESモード)の領分
  //   ✕ その他(grade/style/coachingType/observation/emoji) … 日本語を含まない識別子
  ALL_COACHES: (pathKeys) => ['desc', 'profile', 'origin', 'gender', 'flavor']
    .indexOf(pathKeys[pathKeys.length - 1]) >= 0,
  // P7-11: `RIVAL_ORGS` もオブジェクト配列。訳出対象は団体比較号の副題に入る一行紹介
  // (`desc`)だけで、id/tier/scoutStyle/color は識別子、emoji は絵文字、name は空文字
  // (実際の団体名は RIVAL_ORG_NAME_POOL から生成され名前辞書の領分)。
  RIVAL_ORGS: (pathKeys) => pathKeys[pathKeys.length - 1] === 'desc',
};

// P4-5: src/kuroda-text.js の対象プール(FAN_HANDLESは日本語を含まない識別子文字列の
// ため対象外。KURODA_PREVIEWは消費点が見つからない死蔵テーブルだが、テーブルとして
// 実在するため抽出は行う — 保留理由はworklogへ記録)。
const KURODA_TABLES = [
  'KURODA_HEADLINES',
  'KURODA_EDITORIAL',
  'KURODA_WAR_RECORD',
  'KURODA_MATCHUP_FLAVOR',
  'FAN_OPINIONS',
  'NEWSPAPER_DIGEST_COMMENTS',
  'KURODA_SHOW_RATING',
  'KURODA_PREVIEW',
  'KURODA_SPOTLIGHT',
  'KURODA_NEWS_COMMENT',
  'KURODA_RELATION_NARRATIVE',
  'KURODA_CRISIS',
  'KURODA_GAMEOVER',
];

// P4-5: src/app.js の App.プロパティ(トップレベルconstではないためloadAsGlobalでは
// 取れない。isolated evalで単独取得する)。
const APP_NEWSPAPER_PROPS = ['_NEWSPAPER_HEADLINES', '_NEWSPAPER_ARTICLES'];

// P6-10: src/management.js の Engine.flavor.プロパティ(雑誌取材・TV出演の見出しプール)。
// app.jsの2プールと同じ理由(トップレベルconstではない)でisolated evalで取り出す。
// management.js全体はEngine定義の巨大な単一オブジェクトリテラルで、loadAsGlobalすると
// data.js等の読み込み順依存を抱えるため、対象の配列リテラルだけを切り出して評価する。
const MANAGEMENT_FLAVOR_PROPS = ['MAGAZINE_HEADLINES', 'TV_HEADLINES'];

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

// ── 値の再帰ウォーカー: 文字列/配列/オブジェクト/関数の任意のネストから
//    「訳出可能な文字列」の葉を全て拾う ──
// 関数値は src/kuroda-text.js の kurodaTemplateOf() で { template, paths } へ
// 正規化できたときだけ template(=辞書キー)を拾う。正規化できない(三項分岐・
// 入れ子テンプレート・計算式混入)関数は onHeldFn へ通知するだけで台帳には載せない。
// P7-2: `pathFilter`(任意)は「テーブル直下から数えたオブジェクトキー列」を受け取り、
// falseを返した文字列を台帳から除外する(配列インデックスはパスに含めない)。
function walkStrings(value, onString, onHeldFn, pathFilter, pathKeys) {
  const keys = pathKeys || [];
  if (typeof value === 'string') {
    if (!pathFilter || pathFilter(keys)) onString(value);
  } else if (typeof value === 'function') {
    // P4-7: 条件分岐ラッパ(kurodaVariants)は枝(=単一テンプレの関数)へ分解して全枝拾う。
    // 分岐は関数本体ではなくデータ側に出ているので、枝は普通に正規化できる。
    if (Array.isArray(value.variants)) {
      value.variants.forEach((v) => walkStrings(v && v.text, onString, onHeldFn, pathFilter, keys));
      return;
    }
    const tpl = (typeof kurodaTemplateOf === 'function') ? kurodaTemplateOf(value) : null;
    if (tpl && typeof tpl.template === 'string' && tpl.template) {
      onString(tpl.template);
    } else if (onHeldFn) {
      onHeldFn(value);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v) => walkStrings(v, onString, onHeldFn, pathFilter, keys));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => walkStrings(value[k], onString, onHeldFn, pathFilter, keys.concat(k)));
  }
  // 数値・null等は対象テーブルには出現しない想定のため無視する。
}

// ── P4-5: src/app.js から App.<propName> = { ... } のオブジェクト直値を単独取得する ──
// app.js全体をloadAsGlobalすると、ロード時副作用(DOM/window依存コード)を抱える
// リスクがあるため避ける。単純な波かっこ深さカウントで対象プロパティの右辺
// (オブジェクトリテラル)の範囲だけをテキストとして切り出し、その部分文字列だけを
// 孤立した式として評価する(app.js本体は一切実行しない)。
// 波かっこ深さカウントは文字列/テンプレートリテラル内の中かっこも数えてしまうが、
// 対象2プロパティの中身は `${d.prop}` 形の補間のみ(地の文に生の { / } を含まない
// ことを2026-09-04に実データで確認済み)であり、`${` と `}` は常に対で出現するため
// 深さカウントは狂わない。
function extractAppObjectLiteral(appSrc, propName) {
  const marker = new RegExp('\\b' + propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*\\{');
  const m = marker.exec(appSrc);
  if (!m) return null;
  const openIdx = appSrc.indexOf('{', m.index);
  if (openIdx < 0) return null;
  let depth = 0;
  for (let i = openIdx; i < appSrc.length; i++) {
    const ch = appSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const literalSrc = appSrc.slice(openIdx, i + 1);
        try {
          // eslint-disable-next-line no-eval
          return eval('(' + literalSrc + ')');
        } catch (e) {
          console.error(`[i18n-extract-templates] 警告: app.js の ${propName} を評価できませんでした: ${e.message}`);
          return null;
        }
      }
    }
  }
  return null; // 対応する閉じかっこが見つからなかった(構造変化の可能性)
}

// ── P6-10: src/management.js から `<propName>: [ ... ]` の配列リテラルを単独取得する ──
// extractAppObjectLiteral の角かっこ版。対象2配列は「絵文字+日本語+{name}」の
// 素の文字列リテラルだけを要素に持つ(関数値でもネスト構造でもない)ため、
// 角かっこ深さカウントで範囲を切り出して孤立評価すれば安全に取れる。
// 文字列内に生の [ / ] が現れないことは 2026-09-04 に実データで確認済み。
function extractArrayLiteralProp(src, propName) {
  const marker = new RegExp('\\b' + propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*\\[');
  const m = marker.exec(src);
  if (!m) return null;
  const openIdx = src.indexOf('[', m.index);
  if (openIdx < 0) return null;
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        const literalSrc = src.slice(openIdx, i + 1);
        try {
          // eslint-disable-next-line no-eval
          return eval('(' + literalSrc + ')');
        } catch (e) {
          console.error(`[i18n-extract-templates] 警告: ${propName} を評価できませんでした: ${e.message}`);
          return null;
        }
      }
    }
  }
  return null;
}

// ── 既存台帳の読み込み(マージ用。無ければ空マップ) ─────────────────────────
function loadExistingLedger() {
  if (!fs.existsSync(OUT_PATH)) return new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    if (!Array.isArray(raw)) return new Map();
    const map = new Map();
    raw.forEach((e) => { if (e && typeof e.key === 'string') map.set(e.key, e); });
    return map;
  } catch (err) {
    console.error(`[i18n-extract-templates] 警告: 既存台帳の読み込みに失敗しました(新規生成として扱います): ${err.message}`);
    return new Map();
  }
}

function main() {
  loadAsGlobal('data.js');
  // kuroda-text.js はデータ+kurodaTemplateOf等の純粋関数のみで、DOM/window等の
  // 実行時副作用を持たない(app.js/ui-render.jsより前に読み込まれる設計 — src/index.html
  // のscriptタグ順序を参照)ため、data.js同様にloadAsGlobalで安全に評価できる。
  loadAsGlobal('kuroda-text.js');

  const properNouns = buildProperNounList();
  const existingLedger = loadExistingLedger();
  const ledgerMap = new Map(); // key(JA原文) -> { key, en, filesSet, count, hasPlaceholder, hasProperNoun }
  const perTableStats = [];
  const heldFnStats = []; // { table, count } — 正規化できず台帳に載らなかった関数の数

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

  function walkTable(tableName, table) {
    if (table == null) {
      console.error(`[i18n-extract-templates] 警告: テーブル "${tableName}" が見つかりません(スキップ)`);
      perTableStats.push({ table: tableName, extracted: 0, missing: true });
      return;
    }
    let extracted = 0;
    let held = 0;
    walkStrings(
      table,
      (text) => { record(text, tableName); extracted++; },
      () => { held++; },
      TABLE_PATH_FILTER[tableName] || null,
      []
    );
    perTableStats.push({ table: tableName, extracted });
    if (held > 0) heldFnStats.push({ table: tableName, count: held });
  }

  // ── 1. data.js の既存14テーブル ──
  TARGET_TABLES.forEach((tableName) => walkTable(tableName, global[tableName]));

  // ── 2. kuroda-text.js の13プール(P4-5) ──
  KURODA_TABLES.forEach((tableName) => walkTable(tableName, global[tableName]));

  // ── 3. app.js の自団体新聞2プール(P4-5、isolated eval) ──
  const appSrc = fs.readFileSync(path.join(SRC_DIR, 'app.js'), 'utf8');
  APP_NEWSPAPER_PROPS.forEach((propName) => {
    const obj = extractAppObjectLiteral(appSrc, propName);
    walkTable(`app.js:${propName}`, obj);
  });

  // ── 4. management.js の Engine.flavor 見出しプール2本(P6-10、isolated eval) ──
  const mgmtSrc = fs.readFileSync(path.join(SRC_DIR, 'management.js'), 'utf8');
  MANAGEMENT_FLAVOR_PROPS.forEach((propName) => {
    const arr = extractArrayLiteralProp(mgmtSrc, propName);
    walkTable(`management.js:${propName}`, arr);
  });

  const ledger = Array.from(ledgerMap.values())
    .map((e) => {
      const existing = existingLedger.get(e.key);
      const existingEn = existing && typeof existing.en === 'string' ? existing.en : '';
      const en = existingEn.trim() ? existingEn : e.en;
      return {
        key: e.key,
        en,
        files: Array.from(e.filesSet).sort(),
        count: e.count,
        hasPlaceholder: e.hasPlaceholder,
        hasProperNoun: e.hasProperNoun,
      };
    })
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  let preservedEnCount = 0;
  ledger.forEach((e) => {
    const existing = existingLedger.get(e.key);
    if (existing && typeof existing.en === 'string' && existing.en.trim()) preservedEnCount++;
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

  // ── 保留(正規化不能な関数)一覧をdocsへ出力 ──
  const totalHeld = heldFnStats.reduce((sum, s) => sum + s.count, 0);
  if (heldFnStats.length > 0) {
    const lines = [
      '# i18n P4-5 黒田/新聞プール 保留一覧(自動生成)',
      '',
      `- 生成元: test/i18n-extract-templates.js(実行のたびに上書きされる。手編集禁止)`,
      `- 対象: kurodaTemplateOf()が正規化できなかった関数値(三項演算子で分岐する関数本体・`,
      '  入れ子テンプレートリテラル・Math.abs()等の計算式を含むもの)。台帳には載らず、',
      '  消費点でも従来どおり entry(d) を直接呼ぶ(fail-open。ENでもJA文のまま)。',
      `- 合計: ${totalHeld}件`,
      '',
      '| テーブル | 保留件数 |',
      '|---|---|',
      ...heldFnStats.map((s) => `| ${s.table} | ${s.count} |`),
      '',
    ].join('\n');
    fs.writeFileSync(HOLDOUT_DOC_PATH, lines, 'utf8');
  } else {
    // P4-7で保留が0件になった。ドキュメントを消すとroadmap/specs/worklogからの参照が
    // 宙に浮くため、「全件解消済み」の記録として書き出す(内容は依然として自動生成)。
    fs.writeFileSync(HOLDOUT_DOC_PATH, [
      '# i18n P4-5 黒田/新聞プール 保留一覧(自動生成)',
      '',
      '- 生成元: test/i18n-extract-templates.js(実行のたびに上書きされる。手編集禁止)',
      '- 対象: kurodaTemplateOf()が正規化できなかった関数値(三項演算子で分岐する関数本体・',
      '  入れ子テンプレートリテラル、Math.abs()等の計算式を含むもの)。台帳には載らず、',
      '  消費点でも従来どおり entry(d) を直接呼ぶ(fail-open。ENでもJA文のまま)。',
      '- 合計: **0件**',
      '',
      '## ✅ P4-5の保留16件はP4-7(2026-09-04)で全件解消済み',
      '',
      'いずれも「分岐を関数本体からデータ側へ出し、各エントリを単一テンプレートリテラルに',
      '保つ」方針で解消した。JA出力は分岐前と1バイト不変(条件ごとの出力突合で確認)。',
      '',
      '| テーブル | 保留だった件数 | 保留の理由 | ✅ 解消方法 |',
      '|---|---|---|---|',
      '| KURODA_WAR_RECORD | 8 | `loseStreak`が連敗数を`Math.abs(d.streak)`で算出(計算式入り補間は正規化不能) | ✅ 絶対値の計算を消費点(ui-render.js の warComment)へ移し、`d.streakAbs`を渡すようにした。プール側は素の`{streakAbs}`を読むだけ |',
      '| KURODA_SPOTLIGHT | 7 | `star`プール全7本が`d.ovr>=90 ? … : d.ovr>=75 ? … : …`の三項分岐 | ✅ 総合力帯ごとに独立プール`starAce`/`starSolid`/`starPopular`(各7本・並び順は旧`star`と同一)へ分割。帯の選択は`kurodaSpotlightStarKey(ovr)`が担う |',
      '| KURODA_RELATION_NARRATIVE | 1 | `destined_rival.bodies[0]`が入れ子テンプレートリテラルの三項分岐(対戦済み/未対戦) | ✅ `kurodaVariants([{when,text},…])`で分岐をデータ側へ出した。配列の要素数は5のまま(消費点が`pool.length`でpick/ペア選択しているため) |',
      '',
      '詳細は docs/worklog.md の P4-7 エントリを参照。',
      '',
    ].join('\n'), 'utf8');
  }

  // ── レポート ──
  const total = ledger.length;
  const properCount = ledger.filter((e) => e.hasProperNoun).length;
  const placeholderCount = ledger.filter((e) => e.hasPlaceholder).length;
  const rawTotal = perTableStats.reduce((sum, s) => sum + s.extracted, 0);

  console.log(`[i18n-extract-templates] 台帳を生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-extract-templates] 総テンプレ数(ユニークキー)=${total} hasProperNoun=${properCount} hasPlaceholder=${placeholderCount}`);
  console.log(`[i18n-extract-templates] マージ: 既存台帳${existingLedger.size}件 / en保持=${preservedEnCount}`);
  console.log(`[i18n-extract-templates] テーブル別抽出件数(生値の総数。重複統合前。抽出総数=${rawTotal}):`);
  perTableStats.forEach((s) => {
    console.log(`  ${s.table.padEnd(40)} ${String(s.extracted).padStart(6)}${s.missing ? '  (テーブル未検出)' : ''}`);
  });
  if (heldFnStats.length > 0) {
    console.log(`[i18n-extract-templates] 保留(正規化不能な関数、台帳未収録)=${totalHeld}件 → ${path.relative(ROOT, HOLDOUT_DOC_PATH)}`);
    heldFnStats.forEach((s) => console.log(`  ${s.table.padEnd(40)} ${String(s.count).padStart(6)}`));
  }
  console.log(`[i18n-extract-templates] 固有名詞リスト件数=${properNouns.length}`);
}

main();
