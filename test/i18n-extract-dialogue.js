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
//    一致するキーをベストエフォートで拾う。同一原文が複数セルに再利用され判定が割れる場合は
//    cellをnullにする(誤ったセル文脈を翻訳者に提示するより、判定不能として明示する方が安全)。
//
//    【軸判定は「兄弟キー集合」で確定する(2026-09-04 根治)】
//    あるオブジェクトノードの直下キー(`_default` を除く)を1つずつ classifyAxisKey() で
//    判定し(a) archetype語彙7種のいずれかに完全一致 / (b) personality語彙7種のいずれかに
//    完全一致 / (c) "_" で分割してちょうど2トークンになり、片方がarchetype・もう片方が
//    personalityに完全一致(`archetype_personality` 形式、または `bold_delinquent` のような
//    逆順の実例もある)、のいずれかに全キーが一致する場合に限り、そのノードを「軸として
//    実際に分岐しているノード」とみなし、各キー(`_default` を除く)の判定結果をcellへ
//    反映する。**1つでも上記(a)〜(c)に当てはまらない兄弟キー(docId等)が混じっていたら、
//    そのノードはどのキーもcellに反映しない**(単一キーを取り出して`_`分解し部分一致を
//    拾う旧実装は、`faction_decree_seal_quiet` のようなdocId名の語尾 `quiet` を性格キーと
//    誤検出していた=P5-2hで発見・台帳側で手修正 済み。実データ全数調査
//    (2026-09-04・全288トップレベルテーブルの全ノードを機械分類)で、この兄弟キー集合
//    条件が「archetype」「personality」「compound」「other」のいずれか単一種別にきれいに
//    分かれ、`other`(docId等)が実軸キーと混在するノードは0件、複合種別が混在するのは
//    `FACTION_F05_DISSIDENT_LINES.standard`(`bold_delinquent: []` という空配列の予約キーが
//    personality帯に同居する1ノードのみ・値が空なので実害なし)だけであることを確認済み。
//    `_default` は「そのノードのキー集合が軸かどうか」の判定・分岐選択のどちらからも除外し
//    (=軸性の判定材料にしない、選ばれても contribution なし=性格/アーキタイプ無拘束のまま)、
//    実効軸が `_default` → 別軸のブロック(例: faction_decree_seal_quiet の
//    `_default → archetype`)では、`_default` に対応する軸は正しくnull(無拘束)のまま残る。
//
//  ■ ID軸テーブルのセル解決(P5基盤修正で追加)
//    VICTORY_LINES のようにキャラID(ALL_CHARSのid)をキーとするテーブルはarchetype/
//    personalityの語彙キーを持たないため、上記のキーワード一致だけではcellが取れない。
//    そこで、ある祖先オブジェクトのキー集合が**すべて**ALL_CHARSの実在idと一致し、かつ
//    キー数が閾値(ID_AXIS_MIN_KEYS=5件)以上のとき、そのオブジェクトを「ID軸ノード」と
//    みなし、配下の各キー(=charId)をALL_CHARSで引いてarchetype/personalityへ解決する
//    (キーワード一致で何も取れなかった場合のみのフォールバック)。閾値とall-match条件は
//    偶然の数値衝突を避けるための安全策 — 実データ調査の結果、この条件に一致するのは
//    victory-lines.js:VICTORY_LINES(127キー全一致)のみで、CONTRACT_NEGOTIATION_LINES.tenure
//    のような小さい部分一致(4キー中1つがたまたま有効idと衝突)は弾かれることを確認済み
//    (2026-09-03実データ検証)。
//
//  ■ 台帳の保持マージ(P5基盤修正で追加)
//    既存の i18n/dialogue-ledger.json が存在する場合、そのen列(非空)とcell列(非null)は
//    再生成時に上書きしない(翻訳バッチ・ネイティブ検品で手作業投入された内容を機械抽出の
//    再実行で消さないため — ID軸セル解決が無かった旧世代の抽出器が生成した台帳に対し、
//    翻訳エージェントがcell欄を手動で導出・補完していた実績があった)。既存en/cellが無い
//    (=新規行、またはen/cellが元々空)行にのみ、今回の抽出結果(新規解決したcell含む)を書く。
//    ソースから消えたJA原文の既存行は当然ながら出力に含まれない(通常の再生成と同じ)。
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

// ── ID軸(キャラID)セル解決用マップ: charId(文字列) -> {archetype, personality} ──
function buildCharIdCellMap() {
  const data = require(path.join(SRC_DIR, 'data.js'));
  const map = new Map();
  (data.ALL_CHARS || []).forEach((c) => {
    if (!c || c.id === undefined || c.id === null) return;
    if (!c.archetype && !c.personality) return;
    const cell = {};
    if (c.archetype) cell.archetype = c.archetype;
    if (c.personality) cell.personality = c.personality;
    map.set(String(c.id), cell);
  });
  return map;
}
// 「祖先オブジェクトの全キーがALL_CHARSの実在idと一致」を要求する閾値。小さすぎると
// 無関係な数値キー(週数・年数等)がたまたまid集合と衝突して誤判定するため、
// 実データ調査(2026-09-03)で確認した唯一の真陽性(VICTORY_LINES=127キー)に十分な
// 安全マージンを持たせつつ、他の偶然一致(最大でも4キー中1個の部分一致どまりだった)
// を弾ける値として5に設定。
const ID_AXIS_MIN_KEYS = 5;

function hasPlaceholder(text) {
  PLACEHOLDER_RE.lastIndex = 0;
  return PLACEHOLDER_RE.test(text);
}

// ── セル(archetype/personality)軸検出 ──────────────────────────────────
const ARCHETYPES = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
const PERSONALITIES = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
const ARCHETYPE_SET = new Set(ARCHETYPES);
const PERSONALITY_SET = new Set(PERSONALITIES);

// キー単体を「archetype/personality語彙」に照合する。一致すれば { archetype? , personality? }
// を返し、一致しなければ null(=このキー単体では軸を名乗れない)。
//   (a) archetype 7種のいずれかに完全一致
//   (b) personality 7種のいずれかに完全一致
//   (c) "_" でちょうど2トークンに割れ、片方がarchetype・もう片方がpersonalityに完全一致
//       ("archetype_personality" 形式、または "bold_delinquent" のような逆順の実例もある)
// docId名(`faction_decree_seal_quiet` 等、3〜4トークン以上に割れる複合語)はどの条件にも
// 一致しないため null になる — これが根治の要(旧実装は "_" を含むキーなら何トークンでも
// 分解して部分一致を拾っており、docId語尾の性格語を誤って拾っていた)。
function classifyAxisKey(key) {
  if (ARCHETYPE_SET.has(key)) return { archetype: key };
  if (PERSONALITY_SET.has(key)) return { personality: key };
  if (key.indexOf('_') >= 0) {
    const parts = key.split('_').filter(Boolean);
    if (parts.length === 2) {
      const [p0, p1] = parts;
      if (ARCHETYPE_SET.has(p0) && PERSONALITY_SET.has(p1)) return { archetype: p0, personality: p1 };
      if (PERSONALITY_SET.has(p0) && ARCHETYPE_SET.has(p1)) return { archetype: p1, personality: p0 };
    }
  }
  return null;
}

// ID軸(charId)フォールバック込みでcellを確定する。vocab軸(archetype/personality語彙一致)で
// 何も取れなかった場合のみ、ID軸ノード配下で見つかったcharIdをALL_CHARSで引く(VICTORY_LINES等)。
function resolveCell(axis, idAxisSegments, charIdCellMap) {
  let archetype = (axis && axis.archetype) || null;
  let personality = (axis && axis.personality) || null;
  if (!archetype && !personality && idAxisSegments && idAxisSegments.length && charIdCellMap) {
    const charId = idAxisSegments[idAxisSegments.length - 1];
    const charCell = charIdCellMap.get(charId);
    if (charCell) {
      archetype = charCell.archetype || null;
      personality = charCell.personality || null;
    }
  }
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

// ── 値の再帰ウォーカー: 文字列の葉を全て拾いつつ、ここまでの経路で確定した軸
//    (archetype/personality。まだ何も確定していなければ両方null)と、ID軸ノード配下で
//    確認できたcharId列を渡す。
//
//    軸ノード判定(2026-09-04 根治): あるオブジェクトノードの直下キー(`_default` を除く)
//    が「1つ残らず」classifyAxisKey() で非nullに分類できる場合に限り、そのノードを
//    「軸として実際に分岐しているノード」とみなし、各キー(`_default` を除く)の分類結果を
//    軸へ反映して子へ渡す。1つでも分類できない兄弟キー(docId等)が混じっていたら、
//    そのノードのキーはどれも軸に反映しない(=docId階層を軸判定から除外する)。
//    `_default` はキー集合の分類にもcontributionにも参加しない(選ばれても軸は変化しない
//    =その軸は無拘束のまま)。
//
//    idAxisSegments は「祖先オブジェクトの全キーがcharIdCellMapの実在idと一致し、
//    かつキー数がID_AXIS_MIN_KEYS以上」の条件を満たしたノードでのみ積まれる
//    (偶然の数値衝突を弾くための厳格な条件。ID_AXIS_MIN_KEYS宣言側のコメント参照)。
//    ID軸ノードはvocab軸ノードと排他(charId集合がarchetype/personality語彙と衝突する
//    ことは実データ上ない安全策)。
// ──────────────────────────────────────────────────────────────────────
function walkStrings(value, axis, idAxisSegments, charIdCellMap, onString) {
  if (typeof value === 'string') {
    onString(value, axis, idAxisSegments);
  } else if (Array.isArray(value)) {
    value.forEach((v) => walkStrings(v, axis, idAxisSegments, charIdCellMap, onString));
  } else if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    const isIdAxisNode = charIdCellMap
      && keys.length >= ID_AXIS_MIN_KEYS
      && keys.every((k) => charIdCellMap.has(k));
    const nonDefaultKeys = keys.filter((k) => k !== '_default');
    const isVocabAxisNode = !isIdAxisNode
      && nonDefaultKeys.length > 0
      && nonDefaultKeys.every((k) => classifyAxisKey(k) !== null);
    keys.forEach((k) => {
      let nextAxis = axis;
      if (isVocabAxisNode && k !== '_default') {
        const c = classifyAxisKey(k);
        nextAxis = {
          archetype: c.archetype || axis.archetype,
          personality: c.personality || axis.personality,
        };
      }
      const nextIdAxis = isIdAxisNode ? idAxisSegments.concat([k]) : idAxisSegments;
      walkStrings(value[k], nextAxis, nextIdAxis, charIdCellMap, onString);
    });
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
    console.error(`[i18n-extract-dialogue] 警告: 既存台帳の読み込みに失敗しました(新規生成として扱います): ${err.message}`);
    return new Map();
  }
}

function main() {
  DIALOGUE_FILES.forEach((f) => loadAsGlobal(f));

  const properNouns = buildProperNounList();
  const charIdCellMap = buildCharIdCellMap();
  const existingLedger = loadExistingLedger();
  const ledgerMap = new Map(); // key(JA原文) -> entry
  const perTableStats = [];
  const skippedCandidates = []; // LINES/DIALOGUE(S)命名に一致しなかった隣接テーブル(参考記録)
  let dialogueTableCount = 0;

  function record(text, fileName, tableName, axis, idAxisSegments) {
    if (typeof text !== 'string' || !text) return;
    let entry = ledgerMap.get(text);
    const cell = resolveCell(axis, idAxisSegments, charIdCellMap);
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
          walkStrings(v, { archetype: null, personality: null }, [], null, (s) => strs.push(s));
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
      walkStrings(table, { archetype: null, personality: null }, [], charIdCellMap, (text, axis, idAxisSegments) => {
        record(text, fileName, name, axis, idAxisSegments);
        extracted++;
      });
      perTableStats.push({ file: fileName, table: name, extracted });
    });
  });

  // ── 既存台帳とのマージ: en非空・cell非nullは上書きしない ─────────────────
  let preservedEnCount = 0;
  let preservedCellCount = 0;
  let newlyResolvedCellCount = 0;

  const ledger = Array.from(ledgerMap.values())
    .map((e) => {
      const cellResolved = (e._cellObj && e._cellObj !== 'CONFLICT') ? e._cellObj : null;
      const existing = existingLedger.get(e.key);
      const existingEn = existing && typeof existing.en === 'string' ? existing.en : '';
      const en = existingEn.trim() ? existingEn : e.en;
      if (existingEn.trim()) preservedEnCount++;
      let cell;
      if (existing && existing.cell) {
        cell = existing.cell;
        preservedCellCount++;
      } else {
        cell = cellResolved;
        if (cellResolved) newlyResolvedCellCount++;
      }
      return {
        key: e.key,
        en,
        files: Array.from(e.filesSet).sort(),
        count: e.count,
        hasPlaceholder: e.hasPlaceholder,
        hasProperNoun: e.hasProperNoun,
        cell,
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
  console.log(`[i18n-extract-dialogue] マージ: 既存台帳${existingLedger.size}件 / en保持=${preservedEnCount} / cell保持=${preservedCellCount} / cell新規解決=${newlyResolvedCellCount}`);
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
