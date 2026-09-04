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
];

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
function walkStrings(value, onString, onHeldFn) {
  if (typeof value === 'string') {
    onString(value);
  } else if (typeof value === 'function') {
    // P4-7: 条件分岐ラッパ(kurodaVariants)は枝(=単一テンプレの関数)へ分解して全枝拾う。
    // 分岐は関数本体ではなくデータ側に出ているので、枝は普通に正規化できる。
    if (Array.isArray(value.variants)) {
      value.variants.forEach((v) => walkStrings(v && v.text, onString, onHeldFn));
      return;
    }
    const tpl = (typeof kurodaTemplateOf === 'function') ? kurodaTemplateOf(value) : null;
    if (tpl && typeof tpl.template === 'string' && tpl.template) {
      onString(tpl.template);
    } else if (onHeldFn) {
      onHeldFn(value);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v) => walkStrings(v, onString, onHeldFn));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => walkStrings(value[k], onString, onHeldFn));
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
      () => { held++; }
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
