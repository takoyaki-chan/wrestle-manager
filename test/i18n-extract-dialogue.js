#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-extract-dialogue.js — セリフ台帳ジェネレータ (Stage B P5-1)
//
//  設計: docs/i18n-stage-b-p5-design-v0.1.md D-P5-1/D-P5-2、
//        specs/i18n-runtime-spec-v1.0.md §5〜6(既存2パイプラインの流儀を踏襲)
//
//  ■ 何をするか
//    セリフ層(キャラクターが喋る言葉)を格納するテーブルを src/data.js + 専用の
//    セリフファイル群から機械抽出し、i18n/dialogue-ledger.json を生成する。
//    台帳スキーマは既存2パイプライン(ui-ledger/template-ledger)と同一の
//    { key, en, files, count, hasPlaceholder, hasProperNoun } に、
//    セリフ層固有の `cell`(軸キーから読み取れた archetype/personality)を追加する。
//
//  ■ どのテーブルを「セリフ格納テーブル」とみなすか(D-P5-1指示: 判断に迷うテーブルは
//    含めてfiles欄で識別可能にする — 偽陰性(拾い漏れ)より偽陽性(誤って含める)を選ぶ)
//    1. 対象ファイル: src/data.js + セリフ専用ファイル群
//       (src/victory-lines.js / battle-lines.js / coach-lines.js /
//        data-faction-dialogue.js / flag-dialogue.js / ppv-lines.js /
//        tag-battle-lines.js / tenchosen-final-lines.js)
//       — kuroda-text.js(黒田記事・ナレーション層、P4系)/ dev-event-catalog.js
//       (開発パネル専用のBGM/SFXカタログ、プレイヤー非公開)は対象外(D-P5設計「対象外」節、
//       dialogue-tone-spec-v1.0 §5)。CHAR_PROFILES(プロフィール文)も同spec「対象外」節で
//       明示的にP5末尾送りのため対象外。
//    2. テーブル名の判定: 各ファイルの**トップレベル const 宣言名**を "_" で分割し、
//       セグメントに LINES / DIALOGUE / DIALOGUES のいずれかを含むテーブルを機械的に
//       セリフ格納テーブルとみなす(実地調査の結果、コードベースの命名規約として
//       ほぼ100%一貫している — 全288トップレベルテーブルを目視分類した結果、
//       この命名規則とセリフ/非セリフの実態が完全に一致した)。
//       これにより新規セリフテーブルが今後追加されても本抽出器は無改修で追随する。
//    3. 手動の例外(命名規約からの逸脱3件のみ):
//       - EXTRA_INCLUDE: CHALLENGE_REQUEST_OPPONENT_REACTIONS / RIVALRY_MATCH_REACTION
//         (LINES/DIALOGUE(S)を含まないが実質は選手セリフの配列。サンプル目視で確認)
//       - EXTRA_EXCLUDE: EVENT_LINES_BY_KEY
//         (他の EVENT_*_LINES テーブルへの参照を束ねただけの再エクスポート集約表。
//          実体を含まないため対象に入れると同一文言が二重計上される)
//    4. 意図的に対象外とした「LINES/DIALOGUE(S)を含まない」隣接テーブル群
//       (ファン・観客の声/ナレーション/ラベル/固有名詞リスト等)は
//       dialogue-tone-spec-v1.0 §5 の「対象外: 話者不特定の軸なしセリフ(ファンの声等)」
//       に該当するか、そもそも「セリフ」ではなくUIラベル・ナレーション・固有名詞であるため
//       (例: FAN_EXPECT_REACTIONS=ファンの声/WEEKLY_STORY_TICKER・CAMP_FLAVOR_TEXTS・
//       SNAPSHOT_TEXTS等の"_TEXTS"/"_TICKER"/"_EVENTS"系=第三者視点のナレーション/
//       ALL_CHARS・ALL_COACHES・VENUES・TITLES等=固有名詞/INJURY_LABEL・
//       RIVALRY_THRESHOLDS・TRAIT_DEFS等=UIラベル・ツールチップ)。
//       これらは本台帳の対象外だが、機械抽出のみでは判別しづらい「積み残し候補」として
//       レポートに件数を出す(将来のナレーション層台帳・ラベル層の参考用)。
//
//  ■ セル情報(D-P5-1: テーブルの軸キーからarchetype/personalityを取れる行はcell欄に記録)
//    各文字列の祖先オブジェクトキー列(配列インデックスは除く)を根から末端まで辿り、
//    archetype 7種(standard/ojousama/cool/delinquent/polite/composed/seductive)・
//    personality 7種(normal/bold/quiet/shy/easygoing/earnest/emotional)のいずれかに
//    一致するキー(単独一致、または "archetype_personality" 形式の複合キーの構成要素)を
//    ベストエフォートで拾う。同一原文が複数セルに再利用され判定が割れる場合はcellをnullにする
//    (誤ったセル文脈を翻訳者に提示するより、判定不能として明示する方が安全なため)。
//    VICTORY_LINES 等キャラID軸のテーブルはcell=null(archetype/personality軸を持たない
//    個人セリフのため。P5設計 D-P5-1 のスコープ通り台帳には含めるが軸情報は無い)。
//
//  ■ 使い方
//    node test/i18n-extract-dialogue.js       i18n/dialogue-ledger.json を(再)生成
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');
const { loadAsGlobal } = require('./helpers/load-game.js');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'i18n');
const OUT_PATH = path.join(OUT_DIR, 'dialogue-ledger.json');

// data.js を先頭、専用セリフファイル群を後続で読み込む(victory-lines.jsを先頭に置く
// test/helpers/load-game.js の既存慣行に合わせる。全ファイル純データ宣言のため
// 読み込み順自体に依存関係は無い — 2026-09-03 動作確認済み)。
const DIALOGUE_FILES = [
  'victory-lines.js',
  'data.js',
  'battle-lines.js',
  'coach-lines.js',
  'data-faction-dialogue.js',
  'flag-dialogue.js',
  'ppv-lines.js',
  'tag-battle-lines.js',
  'tenchosen-final-lines.js',
];

const PLACEHOLDER_RE = /\{[A-Za-z_][A-Za-z0-9_]*\}/g;

const EXTRA_INCLUDE = new Set(['CHALLENGE_REQUEST_OPPONENT_REACTIONS', 'RIVALRY_MATCH_REACTION']);
const EXTRA_EXCLUDE = new Set(['EVENT_LINES_BY_KEY']);

function isDialogueTableName(name) {
  if (EXTRA_EXCLUDE.has(name)) return false;
  if (EXTRA_INCLUDE.has(name)) return true;
  const segs = name.split('_');
  return segs.includes('LINES') || segs.includes('DIALOGUE') || segs.includes('DIALOGUES');
}

// ── 固有名詞リスト(test/i18n-extract-ui.js buildProperNounList と同一ロジック) ──
// 別ファイルへ切り出して共有すると i18n-extract-ui.js 側(並行エージェントの領分・
// 触ってはいけない)に手を入れることになるため、test/i18n-extract-templates.js と
// 同様に独立実装として複製する。
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

// ── セル(archetype/personality)軸検出 ──────────────────────────────────
const ARCHETYPES = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
const PERSONALITIES = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
const ARCHETYPE_SET = new Set(ARCHETYPES);
const PERSONALITY_SET = new Set(PERSONALITIES);

function detectCellFromPath(pathSegments) {
  let archetype = null;
  let personality = null;
  pathSegments.forEach((seg) => {
    if (ARCHETYPE_SET.has(seg)) { archetype = seg; return; }
    if (PERSONALITY_SET.has(seg)) { personality = seg; return; }
    if (seg.indexOf('_') >= 0) {
      // 複合キー("ojousama_bold"/"bold_delinquent"等、archetype_personality形式または
      // その例外的な逆順)の構成要素を個別に照合する。
      const parts = seg.split('_');
      let a = null;
      let p = null;
      parts.forEach((part) => {
        if (ARCHETYPE_SET.has(part)) a = part;
        else if (PERSONALITY_SET.has(part)) p = part;
      });
      if (a) archetype = a;
      if (p) personality = p;
    }
  });
  if (!archetype && !personality) return null;
  const cell = {};
  if (archetype) cell.archetype = archetype;
  if (personality) cell.personality = personality;
  return cell;
}

function cellKey(cell) {
  if (!cell) return 'null';
  return `${cell.archetype || ''}|${cell.personality || ''}`;
}

// ── 値の再帰ウォーカー: 文字列の葉を全て拾いつつ、祖先オブジェクトキー列(配列
//    インデックスは含めない)を渡す。 ──────────────────────────────────────
function walkStrings(value, pathSegments, onString) {
  if (typeof value === 'string') {
    onString(value, pathSegments);
  } else if (Array.isArray(value)) {
    value.forEach((v) => walkStrings(v, pathSegments, onString));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => walkStrings(value[k], pathSegments.concat([k]), onString));
  }
}

// ── ファイルごとのトップレベル const/var/let 宣言名を宣言順に列挙 ──────────────
function listTopLevelNames(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const names = [];
  const re = /^(?:const|var|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/gm;
  let m;
  while ((m = re.exec(src))) names.push(m[1]);
  return names;
}

function main() {
  DIALOGUE_FILES.forEach((f) => loadAsGlobal(f));

  const properNouns = buildProperNounList();
  const ledgerMap = new Map(); // key(JA原文) -> entry
  const perTableStats = [];
  const skippedCandidates = []; // LINES/DIALOGUE(S)命名に一致しなかった隣接テーブル(参考記録)
  let dialogueTableCount = 0;

  function record(text, fileName, tableName, pathSegments) {
    if (typeof text !== 'string' || !text) return;
    let entry = ledgerMap.get(text);
    const cell = detectCellFromPath(pathSegments);
    if (!entry) {
      entry = {
        key: text,
        en: '',
        filesSet: new Set(),
        count: 0,
        hasPlaceholder: hasPlaceholder(text),
        hasProperNoun: hasProperNoun(text, properNouns),
        cellCandidates: new Set(),
      };
      ledgerMap.set(text, entry);
    }
    entry.filesSet.add(`${fileName}:${tableName}`);
    entry.count++;
    entry.cellCandidates.add(cellKey(cell));
    if (cell && !entry._cellObj) entry._cellObj = cell;
    else if (cell && entry._cellObj && cellKey(cell) !== cellKey(entry._cellObj)) entry._cellObj = 'CONFLICT';
  }

  DIALOGUE_FILES.forEach((fileName) => {
    const filePath = path.join(SRC_DIR, fileName);
    const names = listTopLevelNames(filePath);
    names.forEach((name) => {
      if (!isDialogueTableName(name)) {
        // 参考記録: LINES/DIALOGUE(S)命名に一致しない隣接テーブルのうち、日本語文字列を
        // 1つでも含むもの(=セリフ層かどうか人間判断が必要になり得る「積み残し候補」)。
        const v = global[name];
        if (v !== undefined) {
          const strs = [];
          walkStrings(v, [], (s) => strs.push(s));
          const JA_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/;
          const jaCount = strs.filter((s) => JA_RE.test(s)).length;
          if (jaCount > 0) skippedCandidates.push({ file: fileName, table: name, jaStringCount: jaCount });
        }
        return;
      }
      const table = global[name];
      if (table === undefined) {
        console.error(`[i18n-extract-dialogue] 警告: テーブル "${name}" (${fileName}) が読み込み後に見つかりません(スキップ)`);
        perTableStats.push({ file: fileName, table: name, extracted: 0, missing: true });
        return;
      }
      dialogueTableCount++;
      let extracted = 0;
      walkStrings(table, [], (text, pathSegments) => {
        record(text, fileName, name, pathSegments);
        extracted++;
      });
      perTableStats.push({ file: fileName, table: name, extracted });
    });
  });

  const ledger = Array.from(ledgerMap.values())
    .map((e) => {
      const cellResolved = (e._cellObj && e._cellObj !== 'CONFLICT') ? e._cellObj : null;
      return {
        key: e.key,
        en: e.en,
        files: Array.from(e.filesSet).sort(),
        count: e.count,
        hasPlaceholder: e.hasPlaceholder,
        hasProperNoun: e.hasProperNoun,
        cell: cellResolved,
      };
    })
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

  // ── レポート ──
  const total = ledger.length;
  const properCount = ledger.filter((e) => e.hasProperNoun).length;
  const placeholderCount = ledger.filter((e) => e.hasPlaceholder).length;
  const cellResolvedCount = ledger.filter((e) => e.cell).length;
  const rawTotal = perTableStats.reduce((sum, s) => sum + s.extracted, 0);

  console.log(`[i18n-extract-dialogue] 台帳を生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-extract-dialogue] 対象テーブル数=${dialogueTableCount} 総行数(ユニークキー)=${total} (生抽出総数=${rawTotal})`);
  console.log(`[i18n-extract-dialogue] hasProperNoun=${properCount} hasPlaceholder=${placeholderCount} cell判定済み=${cellResolvedCount} (${total ? Math.round(cellResolvedCount / total * 1000) / 10 : 0}%)`);
  console.log('[i18n-extract-dialogue] ファイル別テーブル数:');
  const byFile = {};
  perTableStats.forEach((s) => { byFile[s.file] = (byFile[s.file] || 0) + 1; });
  Object.keys(byFile).forEach((f) => console.log(`  ${f.padEnd(28)} ${byFile[f]}テーブル`));
  console.log('[i18n-extract-dialogue] テーブル別抽出件数(生値の総数。重複統合前):');
  perTableStats.forEach((s) => {
    console.log(`  ${(s.file + ':' + s.table).padEnd(56)} ${String(s.extracted).padStart(6)}${s.missing ? '  (テーブル未検出)' : ''}`);
  });
  console.log(`[i18n-extract-dialogue] 固有名詞リスト件数=${properNouns.length}`);

  if (skippedCandidates.length) {
    console.log(`[i18n-extract-dialogue] 参考: LINES/DIALOGUE(S)命名に一致しない日本語含有テーブル ${skippedCandidates.length}件(意図的に対象外。ナレーション層・ラベル層・固有名詞層の可能性):`);
    skippedCandidates.forEach((c) => console.log(`  ${c.file}:${c.table} (ja文字列${c.jaStringCount}件)`));
  }
}

main();
