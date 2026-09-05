#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-extract-ui.js — UI文字列 抽出台帳ジェネレータ (Stage B P3b-1)
//
//  設計: docs/i18n-stage-b-p3b-design-v0.1.md D-B1/D-B5、工程1「抽出」
//
//  ■ 何をするか
//    src/{ui-render,ui-common,app,factions,battle-engine-main,tag-battle-main}.js の
//    全 WM_I18N.t('...') / WM_I18N.t("...") 第1引数リテラル(バッククォートの
//    静的テンプレートリテラルも含む。${}補間を含むものは翻訳不能なため除外・警告)と、
//    src/{index,battle-engine,tag-battle}.html の [data-i18n] 要素のtextContent原文・
//    [data-i18n-attr] 対象属性値を機械抽出し、i18n/ui-ledger.json を生成する。
//
//    台帳スキーマ: { key, en: "", files: [...], count, hasPlaceholder, hasProperNoun }
//    - key: 原文(=WM_I18N.t()の辞書キーそのもの。日本語原文を書き換えない・読み取り専用)
//    - hasPlaceholder: {name}形式のプレースホルダを含むか
//    - hasProperNoun: data.js の ALL_CHARS(name/surname)・ALL_COACHES(name)・
//      VENUES(name)・RIVAL_ORG_NAME_POOL・TITLES(name)・SPECIAL_EVENT_INTRO(title、
//      絵文字接頭辞を除いた本体)+ 明示リテラル(天頂戦/GRAND FINAL)との部分一致で判定。
//      D-B5: 固有名詞入りのUI文は名詞辞書確定後に訳す(先に警告フラグを立てておく)。
//
//  ■ 使い方
//    node test/i18n-extract-ui.js            i18n/ui-ledger.json を(再)生成
//
//  ■ 既存資産との関係
//    test/i18n-scan.js の文字列トークナイザ(scanJS のバッククォート/引用符走査)と
//    同じ考え方で自前の軽量パーサを実装している(scanJS は「全文字列」を対象にした
//    棚卸し用途で、WM_I18N.t()の第1引数だけを狙い撃ちする本スクリプトの用途とは
//    異なるため、ロジックは流用しつつ独立実装とした)。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');
const { loadAsGlobal } = require('./helpers/load-game.js');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'i18n');
const OUT_PATH = path.join(OUT_DIR, 'ui-ledger.json');

const JS_FILES = [
  'ui-render.js', 'ui-common.js', 'app.js',
  'factions.js', 'battle-engine-main.js', 'tag-battle-main.js',
];
const HTML_FILES = ['index.html', 'battle-engine.html', 'tag-battle.html'];

// ── DATA_TABLES モード (Stage B P7-1) ──────────────────────────────────────
// src/data.js のトップレベル表のうち、地の文プール(P7-2/P7-3)・プロフィール文(P7-4)・
// 技名(P7-5)を除いた「ラベル・短い定義の表」(docs/i18n-stage-b-p7-design-v0.1.md §1-C)。
// 表の形がバラバラ(オブジェクトのキー自体がラベルの表/配列の特定フィールドだけが
// 訳出対象の表/混在)なので、test/i18n-extract-templates.js の汎用再帰ウォーカーとは
// 別に、表ごとに「どのパスを拾うか」を明示する専用抽出器を書く(設計指示の
// 「明示リストの表(パス付き)」)。DECISION_DOCS/SPECIAL_EVENT_INTROはP6-13で
// kept:true の手動追加として既に台帳化・英訳済みだったものを、ここに載せることで
// 「kept扱いではなく走査対象として再現可能」(設計§1-C)にする(訳文はキー一致で
// 引き継がれるので再翻訳は発生しない)。
// data.js はトップレベル const の一部しか module.exports していない
// (例: DECISION_DOCS・COACHING_TYPE_LABELS は非export)ため、require() ではなく
// test/i18n-extract-templates.js と同じ loadAsGlobal(vm経由)で読み込む。
function extractByFields(value, fieldSet, onEntry, pathPrefix) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => extractByFields(v, fieldSet, onEntry, `${pathPrefix}[${i}]`));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => {
      const v = value[k];
      const p = `${pathPrefix}.${k}`;
      if (fieldSet.has(k)) {
        if (typeof v === 'string' && v) onEntry(v, p);
        else if (Array.isArray(v)) v.forEach((s, i) => { if (typeof s === 'string' && s) onEntry(s, `${p}[${i}]`); });
      }
      // 同じフィールド名が入れ子(例: MILESTONE_EVENTS[].choices[].label)にも
      // 出現しうるため、フィールド一致の有無に関わらず必ず再帰する。
      extractByFields(v, fieldSet, onEntry, p);
    });
  }
}

const DATA_TABLES = [
  {
    name: 'TRAIT_DEFS',
    // オブジェクトのキー自体(例: '華')が特性バッジの表示ラベル、descがツールチップ本文。
    // consumer: ui-common.js(選手ポップアップ特性バッジ×2)/app.js(選手ファイルTraits節)
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => {
        onEntry(key, `TRAIT_DEFS.${key}.$key`);
        if (table[key] && table[key].desc) onEntry(table[key].desc, `TRAIT_DEFS.${key}.desc`);
      });
    },
  },
  {
    name: 'COACH_ABILITY_CATALOG',
    // TRAIT_DEFSと同型: キー自体がコーチ特殊能力バッジのラベル。
    // consumer: ui-render.js(renderCoach)/ui-common.js(コーチツールチップ・招聘市場カード)
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => {
        onEntry(key, `COACH_ABILITY_CATALOG.${key}.$key`);
        if (table[key] && table[key].desc) onEntry(table[key].desc, `COACH_ABILITY_CATALOG.${key}.desc`);
      });
    },
  },
  {
    name: 'MILESTONE_EVENTS',
    // consumer: app.js(節目セレモニー演出。title/narration/選択肢)
    extract(table, onEntry) {
      const fields = new Set(['title', 'titleMain', 'titleSub', 'narration', 'continueLabel', 'label', 'result', 'effectLabel']);
      extractByFields(table, fields, onEntry, 'MILESTONE_EVENTS');
    },
  },
  {
    name: 'GLIMPSE_A_THRESHOLDS',
    // consumer: ui-render.js(道場「休憩中の選手」吹き出しのdialogueフォールバック)
    extract(table, onEntry) {
      table.forEach((th, i) => { if (th.label) onEntry(th.label, `GLIMPSE_A_THRESHOLDS[${i}:${th.id}].label`); });
    },
  },
  {
    name: 'RIVALRY_THRESHOLDS',
    // consumer: ui-common.js(選手ポップアップ「試合情報」の因縁バッジ。Engine.title.getRivalryBand経由)
    // i18n P7-6: 表示点(lvl.label)でt()を通していなかった穴の修正で新規追加
    extract(table, onEntry) {
      table.forEach((th, i) => { if (th.label) onEntry(th.label, `RIVALRY_THRESHOLDS[${i}:tier${th.tier}].label`); });
    },
  },
  {
    name: 'SPECIAL_EVENT_INTRO',
    // UI部分のみ(選手/コーチのセリフは既にdialogue-ledger)。P6-13でkept:true手動追加済み。
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => {
        const ev = table[key];
        ['title', 'travelLine', 'nextLabel'].forEach((f) => { if (ev && ev[f]) onEntry(ev[f], `SPECIAL_EVENT_INTRO.${key}.${f}`); });
      });
    },
  },
  {
    name: 'DECISION_DOCS',
    // 社長室の机に並ぶ決裁書類。P6-13でkept:true手動追加済み(表示点21箇所は配線済み)。
    extract(table, onEntry) {
      const fields = ['label', 'categoryLabel', 'costLabel', 'body', 'detailText', 'effectSummary', 'recommendation'];
      Object.keys(table).forEach((key) => {
        fields.forEach((f) => {
          const v = table[key] && table[key][f];
          if (typeof v === 'string' && v) onEntry(v, `DECISION_DOCS.${key}.${f}`);
        });
      });
    },
  },
  {
    name: 'PROMO_EVENT_NAMES',
    // consumer: management.js(Engine.season.processManage、プロモイベント名の抽選)
    extract(table, onEntry) {
      Object.keys(table).forEach((tier) => (table[tier] || []).forEach((s, i) => { if (s) onEntry(s, `PROMO_EVENT_NAMES.${tier}[${i}]`); }));
    },
  },
  {
    name: 'COACHING_TYPE_LABELS',
    // consumer: ui-render.js/ui-common.js(招聘市場パネルの職種ラベル)
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => { if (table[key]) onEntry(table[key], `COACHING_TYPE_LABELS.${key}`); });
    },
  },
  {
    name: 'COACH_STYLE_MAP',
    // consumer: ui-render.js/ui-common.js/management.js(コーチ得意スタイル表示)
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => { if (table[key]) onEntry(table[key], `COACH_STYLE_MAP.${key}`); });
    },
  },
  {
    name: 'STAT_TIPS',
    // consumer: ui-render.js(能力値バーのツールチップ)/ui-common.js(選手ポップアップ)
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => { if (table[key]) onEntry(table[key], `STAT_TIPS.${key}`); });
    },
  },
  {
    name: 'QUARTER_LABELS',
    extract(table, onEntry) {
      Object.keys(table).forEach((key) => { if (table[key]) onEntry(table[key], `QUARTER_LABELS.${key}`); });
    },
  },
  {
    name: 'SCANDAL_CONFIG',
    // messages以外(baseChance等)は数値設定のため対象外。
    extract(table, onEntry) {
      (table.messages || []).forEach((s, i) => { if (s) onEntry(s, `SCANDAL_CONFIG.messages[${i}]`); });
    },
  },
  {
    name: 'LOSING_STREAK_PENALTIES',
    extract(table, onEntry) {
      table.forEach((row, i) => { if (row.msg) onEntry(row.msg, `LOSING_STREAK_PENALTIES[${i}].msg`); });
    },
  },
  {
    name: 'DOJO_SHOUTS',
    // consumer: ui-render.js(_renderRosterDojoHeader、道場シーンの気合の掛け声)。
    // P7-7b: Fable裁定により演出として残さず英訳する(要素そのものが文字列の配列)。
    extract(table, onEntry) {
      table.forEach((s, i) => { if (s) onEntry(s, `DOJO_SHOUTS[${i}]`); });
    },
  },
  {
    name: 'GROWTH_LOG_LABELS',
    // P7-25: 成長経過タブの行動ラベル。management.js tickWeek の関数内直書き
    // (§10-2型)を data.js のトップレベル表へ移設したもの。値は growthLog[].detail /
    // .eventTag として**生JAのままGへ永続**し、消費点(ui-render.js の
    // `renderRosterDetail`)が値として t() を1回引く(動的キーなので t() の静的
    // 第1引数を見る extractJsCalls には載らない)。
    extract(table, onEntry) {
      Object.keys(table.schedule || {}).forEach((k) => onEntry(table.schedule[k], `GROWTH_LOG_LABELS.schedule.${k}`));
      ['promo', 'promo2', 'promo3', 'rest', 'autoRest', 'intensive', 'boycott', 'hotStreak']
        .forEach((k) => { if (table[k]) onEntry(table[k], `GROWTH_LOG_LABELS.${k}`); });
    },
  },
];

// ── JS_TABLES モード (Stage B P7-9) ────────────────────────────────────────
// 観戦iframe(battle-engine-main.js / tag-battle-main.js)の**地の文プール**。
// これらは `pk(pool)` で選ばれてから表示直前に t() へ渡る「動的キー」なので、
// WM_I18N.t() の静的第1引数だけを見る extractJsCalls には原理的に載らない。
// P6-8/P6-10 の LIVE_LINES・EMOTION_TEXTS は kept:true の手追加で凌いだが、
// P7-1 が確立した方針(「kept扱いではなく走査対象として再現可能にする」)に従い、
// ソースからトップレベル const の値リテラルだけを切り出して評価する
// (DATA_TABLES が data.js に対してやっていることの、iframe用JS版)。
//
// 制約と前提:
//  - 対象は**トップレベルの `const NAME = { … }` / `= [ … ]`** だけ(関数内は対象外。
//    そもそも「関数の中の配列は抽出器から永久に見えない」= specs §10-2 が禁じた形)
//  - ファイル全体は読み込まない(iframeのJSは document/window 依存の副作用を持つため)。
//    波かっこ/角かっこの深さカウントで当該リテラルの範囲だけを切り出し、
//    WM_I18N のスタブだけを与えた孤立スコープで評価する
//    (MOVE_PRESENTATION の label が `WM_I18N.t('打撃技')` を呼ぶため)
//  - 深さカウントは文字列・正規表現リテラル内の括弧も数えてしまうが、
//    対象表の値にそれらは含まれない(2026-09-04に実データで確認)
const JS_TABLES = [
  {
    file: 'battle-engine-main.js',
    name: 'MOVE_PRESENTATION',
    // label は WM_I18N.t() の静的リテラルとして既に抽出済み。ここでは guide のみ。
    extract(table, onEntry) {
      Object.keys(table).forEach((cat) => {
        const g = table[cat] && table[cat].guide;
        if (g) onEntry(g, `MOVE_PRESENTATION.${cat}.guide`);
      });
    },
  },
  {
    file: 'battle-engine-main.js',
    name: 'MOVE_GUIDE_OVERRIDES',
    extract(table, onEntry) {
      table.forEach((row, i) => { if (row && row.guide) onEntry(row.guide, `MOVE_GUIDE_OVERRIDES[${i}].guide`); });
    },
  },
  {
    file: 'battle-engine-main.js',
    name: 'PIN_INTRO_TEXTS',
    extract(table, onEntry) {
      Object.keys(table).forEach((k) => (table[k] || []).forEach((s, i) => { if (s) onEntry(s, `PIN_INTRO_TEXTS.${k}[${i}]`); }));
    },
  },
  {
    file: 'battle-engine-main.js',
    name: 'SUB_ATTEMPT_INTRO_TEXTS',
    extract(table, onEntry) {
      table.forEach((s, i) => { if (s) onEntry(s, `SUB_ATTEMPT_INTRO_TEXTS[${i}]`); });
    },
  },
  {
    file: 'tag-battle-main.js',
    name: 'TAG_MOVE_PRESENTATION',
    extract(table, onEntry) {
      Object.keys(table).forEach((cat) => {
        const g = table[cat] && table[cat].guide;
        if (g) onEntry(g, `TAG_MOVE_PRESENTATION.${cat}.guide`);
      });
    },
  },
  {
    file: 'tag-battle-main.js',
    name: 'MOVE_GUIDE_OVERRIDES',
    extract(table, onEntry) {
      table.forEach((row, i) => { if (row && row.guide) onEntry(row.guide, `MOVE_GUIDE_OVERRIDES[${i}].guide`); });
    },
  },
  {
    file: 'tag-battle-main.js',
    name: 'PIN_INTRO_TEXTS',
    extract(table, onEntry) {
      Object.keys(table).forEach((k) => (table[k] || []).forEach((s, i) => { if (s) onEntry(s, `PIN_INTRO_TEXTS.${k}[${i}]`); }));
    },
  },
  // P7-25: ドラフト交渉(セリ)画面。観戦iframeと同じ「動的キーなので t() の静的
  // 第1引数を見る extractJsCalls には載らない」層で、draft-negotiation.js は
  // loadAsGlobal に Engine 定義(management.js)を要するためJS_TABLESで切り出す。
  {
    file: 'draft-negotiation.js',
    name: 'DRAFT_HEAT_LABELS',
    // consumer: ui-render.js(交渉カードの粘り度ラベル。`WM_I18N.t(heat.labelJp)`)
    extract(table, onEntry) {
      Object.keys(table).forEach((k) => { if (table[k]) onEntry(table[k], `DRAFT_HEAT_LABELS.${k}`); });
    },
  },
  {
    file: 'draft-negotiation.js',
    name: 'DRAFT_UI_NARRATION',
    // consumer: ui-render.js のナレーション枠(ui-common.js が negState へ置く2文)
    extract(table, onEntry) {
      Object.keys(table).forEach((k) => { if (table[k]) onEntry(table[k], `DRAFT_UI_NARRATION.${k}`); });
    },
  },
  // P7-31: ui-render.js のトップレベル表2件。いずれも消費点は t() を通っているが、
  // 引数が変数(表の値)なので extractJsCalls には載らない層(§10-2 と同型)。
  {
    file: 'ui-render.js',
    name: 'UI_TIP_TEXTS',
    // consumer: renderTrainingFatigueSignal の title / 相関図の _tipAttr(WM_I18N.t(_RM_TIP_*))
    extract(table, onEntry) {
      Object.keys(table).forEach((k) => { if (table[k]) onEntry(table[k], `UI_TIP_TEXTS.${k}`); });
    },
  },
  {
    file: 'ui-render.js',
    name: 'DRAFT_STYLE_FLAIR',
    // consumer: _scoutComment(ドラフト新聞「記者の目」の {flair})
    extract(table, onEntry) {
      Object.keys(table).forEach((k) => { if (table[k]) onEntry(table[k], `DRAFT_STYLE_FLAIR.${k}`); });
    },
  },
];

// `const NAME = { … }` / `const NAME = [ … ]` の右辺リテラルだけを切り出して評価する。
// test/i18n-extract-templates.js の extractAppObjectLiteral / extractArrayLiteralProp と
// 同じ考え方(あちらは `prop: {…}` 形、こちらはトップレベル const 宣言形)。
function extractTopLevelConstLiteral(src, name, warnings, filename) {
  const marker = new RegExp('^const\\s+' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=\\s*([{[])', 'm');
  const m = marker.exec(src);
  if (!m) return null;
  const open = m[1];
  const close = open === '{' ? '}' : ']';
  const openIdx = src.indexOf(open, m.index);
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const literalSrc = src.slice(openIdx, i + 1);
        try {
          // eslint-disable-next-line no-new-func
          return new Function('WM_I18N', 'return (' + literalSrc + ');')({ t: (s) => s });
        } catch (e) {
          warnings.push(`JS_TABLES: ${filename} の ${name} を評価できませんでした: ${e.message}`);
          return null;
        }
      }
    }
  }
  warnings.push(`JS_TABLES: ${filename} の ${name} の閉じ括弧が見つかりません(構造変化の可能性)`);
  return null;
}

const PLACEHOLDER_RE = /\{[A-Za-z_][A-Za-z0-9_]*\}/g;

// ── 固有名詞リスト(data.js 由来 + 明示リテラル) ─────────────────────────────────
function buildProperNounList() {
  // data.js は module.exports 経由で Node から直接 require 可能(vm経由不要)。
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
    // 大会名は絵文字接頭辞付き("👑 天頂戦")。先頭の非文字(絵文字・記号・空白)を除いた本体を採用。
    const stripped = ev.title.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    add(stripped);
  });
  // 設計指示に明示された固有名詞(SPECIAL_EVENT_INTRO抽出で既にカバーされる場合も、
  // 表記ゆれ・将来の定義変更に備えて明示的に含めておく)。
  ['天頂戦', 'GRAND FINAL'].forEach(add);

  return Array.from(set).filter(Boolean);
}

function hasProperNoun(text, properNouns) {
  for (let i = 0; i < properNouns.length; i++) {
    if (text.indexOf(properNouns[i]) >= 0) return true;
  }
  return false;
}

// ── 他台帳(template-ledger/dialogue-ledger)が所有するキーの読み込み(P7-12) ─────
// specs §9/§15-3: 同じキーを2つの台帳へ載せない。ただしui側の実コードが独立して
// WM_I18N.t('…')を呼んでいる場合(=このスクリプトが**今回のスキャンで**見つけた行)は
// 本物の二重出現なので除外しない — 除外の対象は「今回のスキャンでは見つからず、
// 前回台帳の kept:true だけで生き残っていた行」に限る(=データ表由来の動的キーを
// 手作業でui-ledgerへも複製しただけの行。P7-9で見つかった合宿フレーバー等)。
// 所有判定は台帳のkeyそのもの(=source/kept区分で選別された「今回未発見」集合)を
// 突き合わせるだけで足りるため、他台帳側に専用のマーカーは追加しない。
function loadOtherLedgerOwnedKeys(warnings) {
  const set = new Set();
  ['template-ledger.json', 'dialogue-ledger.json'].forEach((filename) => {
    const p = path.join(OUT_DIR, filename);
    if (!fs.existsSync(p)) return;
    try {
      const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (Array.isArray(rows)) {
        rows.forEach((r) => { if (r && typeof r.key === 'string' && r.en) set.add(r.key); });
      }
    } catch (e) {
      warnings.push(`他台帳(${filename})の読み込みに失敗(所有チェックなしで続行): ${e.message}`);
    }
  });
  return set;
}

function hasPlaceholder(text) {
  PLACEHOLDER_RE.lastIndex = 0;
  return PLACEHOLDER_RE.test(text);
}

function lineOf(src, index) {
  let n = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') n++;
  return n;
}

// ── JS文字列リテラルのエスケープ解決(実行時の値と一致させる) ───────────────────
function unescapeJsLiteral(raw) {
  let out = '';
  for (let k = 0; k < raw.length; k++) {
    const c = raw[k];
    if (c !== '\\') { out += c; continue; }
    const next = raw[k + 1];
    switch (next) {
      case 'n': out += '\n'; k++; break;
      case 't': out += '\t'; k++; break;
      case 'r': out += '\r'; k++; break;
      case 'b': out += '\b'; k++; break;
      case 'f': out += '\f'; k++; break;
      case 'v': out += '\v'; k++; break;
      case '0': out += '\0'; k++; break;
      case '\n': k++; break; // 行継続(バックスラッシュ+改行) → 何も追加しない
      case 'u': {
        if (raw[k + 2] === '{') {
          const end = raw.indexOf('}', k + 3);
          if (end >= 0) {
            out += String.fromCodePoint(parseInt(raw.slice(k + 3, end), 16));
            k = end;
            break;
          }
        }
        out += String.fromCharCode(parseInt(raw.slice(k + 2, k + 6), 16));
        k += 5;
        break;
      }
      case 'x': {
        out += String.fromCharCode(parseInt(raw.slice(k + 2, k + 4), 16));
        k += 3;
        break;
      }
      default: out += next; k++; break; // \\ \' \" \` など → そのままの文字
    }
  }
  return out;
}

// ── WM_I18N.t('...') / WM_I18N.t("...") / WM_I18N.t(`静的テンプレート`) を抽出 ──
function extractJsCalls(src, filename, warnings) {
  const results = [];
  const marker = 'WM_I18N.t(';
  let searchFrom = 0;
  while (true) {
    const pos = src.indexOf(marker, searchFrom);
    if (pos === -1) break;
    let i = pos + marker.length;
    searchFrom = i;
    while (i < src.length && /\s/.test(src[i])) i++;
    const q = src[i];

    if (q === "'" || q === '"') {
      let j = i + 1; let raw = ''; let closed = false;
      while (j < src.length) {
        if (src[j] === '\\') { raw += src[j] + (src[j + 1] || ''); j += 2; continue; }
        if (src[j] === q) { closed = true; j++; break; }
        if (src[j] === '\n') break;
        raw += src[j]; j++;
      }
      if (closed) {
        const text = unescapeJsLiteral(raw);
        results.push({ text, line: lineOf(src, pos) });
      } else {
        warnings.push(`${filename}:${lineOf(src, pos)}: 未終端の文字列リテラル(解析失敗、スキップ)`);
      }
      searchFrom = j;
    } else if (q === '`') {
      let j = i + 1; let raw = ''; let hasInterp = false; let closed = false;
      while (j < src.length) {
        if (src[j] === '\\') { raw += src[j] + (src[j + 1] || ''); j += 2; continue; }
        if (src[j] === '`') { closed = true; j++; break; }
        if (src.substr(j, 2) === '${') {
          hasInterp = true;
          let depth = 1; j += 2;
          while (j < src.length && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            j++;
          }
          continue;
        }
        raw += src[j]; j++;
      }
      if (closed && !hasInterp) {
        const text = unescapeJsLiteral(raw);
        results.push({ text, line: lineOf(src, pos) });
      } else if (closed && hasInterp) {
        warnings.push(`${filename}:${lineOf(src, pos)}: テンプレートリテラルに\${}補間があり静的抽出不能(スキップ)`);
      } else {
        warnings.push(`${filename}:${lineOf(src, pos)}: 未終端のテンプレートリテラル(解析失敗、スキップ)`);
      }
      searchFrom = j;
    }
    // それ以外(識別子・関数呼び出し等の非リテラル引数)は対象外。次のWM_I18N.t(を探す。
  }
  return results;
}

// ── HTML: [data-i18n] / [data-i18n-attr] の機械抽出(引用符を意識した簡易タグパーサ) ──
function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseAttrs(attrsRaw) {
  const map = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let m;
  while ((m = re.exec(attrsRaw))) {
    const name = m[1];
    if (!name) continue;
    const val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : true);
    map[name] = val;
  }
  return map;
}

function extractHtmlI18n(rawSrc, filename, warnings) {
  const results = []; // {text, line, kind}
  // <script>/<style> の本体は同じ長さの空白へ潰す(オフセット=行番号を保つ)。
  let src = rawSrc.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  src = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => open + body.replace(/[^\n]/g, ' ') + close);
  src = src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, body, close) => open + body.replace(/[^\n]/g, ' ') + close);

  let i = 0;
  while (i < src.length) {
    if (src[i] !== '<') { i++; continue; }
    if (src.substr(i, 2) === '</' || src.substr(i, 4) === '<!--' || src.substr(i, 9).toLowerCase() === '<!doctype') { i++; continue; }
    let j = i + 1;
    const nameStart = j;
    while (j < src.length && /[A-Za-z0-9]/.test(src[j])) j++;
    if (j === nameStart) { i++; continue; } // '<' が実タグ開始ではない(比較演算子等)
    const tagName = src.slice(nameStart, j);

    let inQuote = null;
    while (j < src.length) {
      const c = src[j];
      if (inQuote) { if (c === inQuote) inQuote = null; j++; continue; }
      if (c === '"' || c === "'") { inQuote = c; j++; continue; }
      if (c === '>') { j++; break; }
      j++;
    }
    const tagEnd = j;
    const attrsRaw = src.slice(nameStart + tagName.length, tagEnd - 1);
    const attrs = parseAttrs(attrsRaw);
    const lineNo = lineOf(src, i);

    if (Object.prototype.hasOwnProperty.call(attrs, 'data-i18n')) {
      const closeTag = `</${tagName}`;
      const closeIdx = src.toLowerCase().indexOf(closeTag.toLowerCase(), tagEnd);
      if (closeIdx === -1) {
        warnings.push(`${filename}:${lineNo}: <${tagName} data-i18n> の閉じタグが見つからない(スキップ)`);
      } else {
        const rawText = src.slice(tagEnd, closeIdx);
        if (rawText.indexOf('<') >= 0) {
          warnings.push(`${filename}:${lineNo}: <${tagName} data-i18n> のtextContentに子要素混在の疑い(想定外構造、スキップ)`);
        } else {
          // trimして登録する: 実行時(applyDom)はtextContent.trim()で辞書を引くため、
          // ソースのインデント改行・CRLFを含む生テキストをキーにすると一致しない
          const text = decodeHtmlEntities(rawText).trim();
          if (text) results.push({ text, line: lineNo, kind: 'text' });
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(attrs, 'data-i18n-attr')) {
      const spec = attrs['data-i18n-attr'];
      const names = (typeof spec === 'string' ? spec : '').split(',').map((s) => s.trim()).filter(Boolean);
      names.forEach((name) => {
        if (!Object.prototype.hasOwnProperty.call(attrs, name)) {
          warnings.push(`${filename}:${lineNo}: data-i18n-attr="${spec}" が属性 "${name}" を参照しているが同タグに存在しない(スキップ)`);
          return;
        }
        const val = attrs[name];
        if (typeof val !== 'string' || !val.trim()) return;
        results.push({ text: decodeHtmlEntities(val), line: lineNo, kind: `attr:${name}` });
      });
    }

    i = tagEnd;
  }
  return results;
}

// ── メイン ──────────────────────────────────────────────────────────────────
function main() {
  const warnings = [];
  const properNouns = buildProperNounList();
  const ledgerMap = new Map(); // key -> { key, en, filesSet, count, hasPlaceholder, hasProperNoun }

  function getOrCreateEntry(text) {
    let entry = ledgerMap.get(text);
    if (!entry) {
      entry = {
        key: text,
        en: '',
        filesSet: new Set(),
        sourceSet: new Set(),
        count: 0,
        hasPlaceholder: hasPlaceholder(text),
        hasProperNoun: hasProperNoun(text, properNouns),
      };
      ledgerMap.set(text, entry);
    }
    return entry;
  }

  function record(text, filename) {
    if (typeof text !== 'string' || !text) return;
    const entry = getOrCreateEntry(text);
    entry.filesSet.add(filename);
    entry.count++;
  }

  // DATA_TABLES モード(Stage B P7-1): data.js の表から拾った値。files には
  // ソースファイル名('data.js')を、source にはテーブル内の正確なパスを記録する
  // (design: docs/i18n-stage-b-p7-design-v0.1.md §1-C「明示リストの表(パス付き)」)。
  function recordTable(text, tableName, tablePath) {
    if (typeof text !== 'string' || !text) return;
    const entry = getOrCreateEntry(text);
    entry.filesSet.add('data.js');
    entry.sourceSet.add(tablePath);
    entry.count++;
  }

  // JS_TABLES モード(Stage B P7-9): 観戦iframeのJSから拾った表。files にはソース
  // ファイル名を、source には `ファイル名:テーブル内パス` を記録する。
  function recordJsTable(text, filename, tablePath) {
    if (typeof text !== 'string' || !text) return;
    const entry = getOrCreateEntry(text);
    entry.filesSet.add(filename);
    entry.sourceSet.add(`${filename}:${tablePath}`);
    entry.count++;
  }

  const perFileStats = [];

  JS_FILES.forEach((filename) => {
    const filePath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(filePath)) { warnings.push(`${filename}: ファイルが存在しない(スキップ)`); return; }
    const src = fs.readFileSync(filePath, 'utf8');
    const calls = extractJsCalls(src, filename, warnings);
    calls.forEach((c) => record(c.text, filename));
    perFileStats.push({ file: filename, extracted: calls.length });
  });

  HTML_FILES.forEach((filename) => {
    const filePath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(filePath)) { warnings.push(`${filename}: ファイルが存在しない(スキップ)`); return; }
    const src = fs.readFileSync(filePath, 'utf8');
    const items = extractHtmlI18n(src, filename, warnings);
    items.forEach((it) => record(it.text, filename));
    perFileStats.push({ file: filename, extracted: items.length });
  });

  // ── DATA_TABLES モード(Stage B P7-1) ──
  // data.js を vm 経由でグローバルへ読み込む(module.exports されていない表
  // (DECISION_DOCS/COACHING_TYPE_LABELS等)にも require() を使わずアクセスするため)。
  const perTableStats = [];
  loadAsGlobal('data.js');
  DATA_TABLES.forEach(({ name, extract }) => {
    const table = global[name];
    if (table == null) {
      warnings.push(`DATA_TABLES: テーブル "${name}" が見つかりません(スキップ)`);
      perTableStats.push({ table: name, extracted: 0, missing: true });
      return;
    }
    let extracted = 0;
    extract(table, (text, tablePath) => { recordTable(text, name, tablePath); extracted++; });
    perTableStats.push({ table: name, extracted });
  });

  // ── JS_TABLES モード(Stage B P7-9) ──
  // 観戦iframeのJSソースからトップレベル const の値リテラルだけを切り出して評価する。
  const jsSrcCache = new Map();
  const perJsTableStats = [];
  JS_TABLES.forEach(({ file, name, extract }) => {
    if (!jsSrcCache.has(file)) {
      const p = path.join(SRC_DIR, file);
      jsSrcCache.set(file, fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
    }
    const src = jsSrcCache.get(file);
    if (src == null) {
      warnings.push(`JS_TABLES: ${file} が存在しない(スキップ)`);
      perJsTableStats.push({ table: `${file}:${name}`, extracted: 0, missing: true });
      return;
    }
    const table = extractTopLevelConstLiteral(src, name, warnings, file);
    if (table == null) {
      warnings.push(`JS_TABLES: ${file} の "${name}" が見つかりません(スキップ)`);
      perJsTableStats.push({ table: `${file}:${name}`, extracted: 0, missing: true });
      return;
    }
    let extracted = 0;
    extract(table, (text, tablePath) => { recordJsTable(text, file, tablePath); extracted++; });
    perJsTableStats.push({ table: `${file}:${name}`, extracted });
  });

  // ── 保全マージ(2026-09-04) ──
  // 再実行で既存台帳の en を消さない。走査で見つからなかった既存行は「動的キー」
  // (t() に変数で渡される値: 負傷ラベル・勝敗語・成形済み値・データ表の文字列など)
  // として kept:true を付けて残す。本当に廃止したキーは台帳から手で削る。
  const prevMap = new Map();
  if (fs.existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
      if (Array.isArray(prev)) prev.forEach((r) => { if (r && typeof r.key === 'string') prevMap.set(r.key, r); });
    } catch (e) {
      warnings.push(`既存台帳の読み込みに失敗(保全マージなしで続行): ${e.message}`);
    }
  }
  let carriedEn = 0;
  let newKeys = 0;
  const scanned = Array.from(ledgerMap.values())
    .map((e) => {
      const prev = prevMap.get(e.key);
      if (prev) { if (prev.en) carriedEn++; } else { newKeys++; }
      const row = {
        key: e.key,
        en: prev && typeof prev.en === 'string' ? prev.en : e.en,
        files: Array.from(e.filesSet).sort(),
        count: e.count,
        hasPlaceholder: e.hasPlaceholder,
        hasProperNoun: e.hasProperNoun,
      };
      if (e.sourceSet.size > 0) row.source = Array.from(e.sourceSet).sort();
      // P6-13が DECISION_DOCS/SPECIAL_EVENT_INTRO を「走査対象外につき手追加」の
      // kept:true で登録した際のnoteは、DATA_TABLESモードで走査対象になった今は
      // 事実と異なるため引き継がない(P7-1でsourceが付いた行に限り読み替え)。
      const staleKeptNote = row.source && prev && prev.note && /走査対象外/.test(prev.note);
      if (prev && prev.note && !staleKeptNote) row.note = prev.note;
      return row;
    });
  const scannedKeys = new Set(scanned.map((r) => r.key));
  const otherLedgerOwnedKeys = loadOtherLedgerOwnedKeys(warnings);
  const kept = [];
  const droppedForOwnership = [];
  prevMap.forEach((r, key) => {
    if (scannedKeys.has(key)) return; // 今回のスキャンで実際に見つかった行は無条件で残す(本物の二重出現)
    if (otherLedgerOwnedKeys.has(key)) { droppedForOwnership.push(key); return; } // template/dialogue台帳が所有 → ui側の複製は削る
    kept.push({ ...r, kept: true });
  });
  const ledger = scanned.concat(kept)
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
  console.log(`[i18n-extract-ui] 保全マージ: 既存台帳=${prevMap.size} en引き継ぎ=${carriedEn} 新規キー=${newKeys} 走査外で保持(kept)=${kept.length} 他台帳所有で除外=${droppedForOwnership.length}`);
  if (droppedForOwnership.length) {
    console.log('[i18n-extract-ui] 他台帳(template/dialogue-ledger)が所有するため除外(P7-12):');
    droppedForOwnership.forEach((k) => console.log(`  - ${k}`));
  }
  if (newKeys) {
    console.log('[i18n-extract-ui] 新規キー(en空):');
    scanned.filter((r) => !prevMap.has(r.key)).forEach((r) => console.log(`  + ${r.key}`));
  }

  // ── レポート ──
  const total = ledger.length;
  const properCount = ledger.filter((e) => e.hasProperNoun).length;
  const placeholderCount = ledger.filter((e) => e.hasPlaceholder).length;

  console.log(`[i18n-extract-ui] 台帳を生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-extract-ui] 総キー数=${total} hasProperNoun=${properCount} hasPlaceholder=${placeholderCount}`);
  console.log('[i18n-extract-ui] ファイル別抽出件数(呼び出し/要素の総数。キーの重複統合前):');
  perFileStats.forEach((s) => console.log(`  ${s.file.padEnd(24)} ${String(s.extracted).padStart(6)}`));
  console.log('[i18n-extract-ui] DATA_TABLES別抽出件数(Stage B P7-1):');
  perTableStats.forEach((s) => console.log(`  ${s.table.padEnd(24)} ${String(s.extracted).padStart(6)}${s.missing ? '  (テーブル未検出)' : ''}`));
  console.log('[i18n-extract-ui] JS_TABLES別抽出件数(Stage B P7-9・観戦iframeの地の文プール):');
  perJsTableStats.forEach((s) => console.log(`  ${s.table.padEnd(44)} ${String(s.extracted).padStart(6)}${s.missing ? '  (テーブル未検出)' : ''}`));
  console.log(`[i18n-extract-ui] 固有名詞リスト件数=${properNouns.length}`);

  if (warnings.length) {
    console.log(`[i18n-extract-ui] 警告 ${warnings.length}件:`);
    warnings.slice(0, 50).forEach((w) => console.log(`  ${w}`));
    if (warnings.length > 50) console.log(`  ...ほか${warnings.length - 50}件`);
  }
}

main();
