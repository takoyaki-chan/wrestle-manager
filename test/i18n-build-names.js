#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-build-names.js — 名前辞書(src/lang-en-names.js)ジェネレータ (Stage B P6-1)
//
//  設計: docs/i18n-stage-b-p6-design-v0.1.md D-P6-1(名前辞書PN_EN)
//  表記の正: docs/en-proper-nouns-draft-v0.1.md(2026-09-02 Keisuke裁定確定分)
//
//  ■ 何をするか
//    i18n/names-ledger.json(中間台帳・手編集の正)を src/data.js の実データと突合検証し、
//    src/lang-en-names.js(WM_I18N.addNames({...}) の列挙)を生成する。
//    ドラフトのMD表は書式が2種類(確定案/要読み確認)混在で機械パースしにくいため、
//    このリポジトリでは i18n/names-ledger.json を正とする(D-P6-1の指示どおり)。
//    その代わり、本スクリプトが src/data.js の実データと台帳を全数突合し、
//    ドラフトからの転記漏れ・data.js側のズレ(キャラ追加/名前変更等)を検出する。
//
//  ■ 台帳のスキーマ(i18n/names-ledger.json)
//    - characters: [{ id, ja, jaSurname, en, enSurname, confirmed }] (127件)
//    - coaches:    [{ id, ja, jaSurname, en, enSurname, confirmed }] (35件)
//    - orgs / events / titles / venues / schools / npc: [{ ja, en }]
//    - moves:      [{ ja, en, short?, confirmed }] (242件・Stage B P7-5)
//    confirmed:false は「要読み確認」49件(選手35+コーチ14)の暫定読み(第一案)。
//    Keisukeの訂正が入ったら該当行のja/en/jaSurname/enSurnameを書き換えて再実行するだけでよい。
//
//  ■ 技名(moves)は名前辞書とは別領域(P7-5、docs/en-move-names-draft-v0.1.md §7)
//    表記の正: docs/en-move-names-draft-v0.1.md(2026-09-04 Keisuke裁定確定)。
//    出力は WM_I18N.addMoves() / addMoveShorts() で、pn()が引く names とは混ざらない。
//    **技名の日本語は絶対に置き換えない** — battle-sfx.js の効果音判定・_movePresentation の
//    解説文選択・セーブ値 finMove が日本語名を安定キーとして使っているため(§7-2)。
//
//  ■ 機械検査(1件でも違反があれば exit 1・lang-en-names.js は書き換えない)
//    1. 完全性: src/data.js の ALL_CHARS(127)/ALL_COACHES(35)全idが台帳に存在し、
//       ja/jaSurnameが台帳のja/jaSurnameと一致する(data.js側の変更を検知するガード)
//    2. VENUES/TITLES/RIVAL_ORG_NAME_POOL の全名称、SPECIAL_EVENT_INTROの全題名
//       (絵文字接頭辞を除いた本体。test/i18n-extract-ui.jsと同じ正規表現)が
//       台帳(venues/titles/orgs/events)に存在する
//    3. 台帳内の重複ja(キャラ+コーチ+org+event+title+venue+school+npcの全域)で
//       en値が食い違うものが無い(同一ja→同一enは許容・上書きにすぎない)
//    4. 技名の完全性: commonMoves / styleMoves / STYLE_TAG_MOVES の全 `n` と
//       STYLE_TAG_MOVES.__default__(getTagMoveの既定値)が moves 節に存在する
//       (data.js側の技追加・改名を検知するガード)。逆に台帳にあってdata.jsに無い技も違反
//    5. 技名の重複検査: moves 節内で ja / en がそれぞれ一意(§5-D の英語衝突の再発防止)。
//       さらに moves の ja が names 側(選手・団体等)の ja と衝突しないこと
//       (t()のパラメータ値自動変換が names→moves の順で引くため、衝突すると技名が
//        人名として訳される)
//
//  ■ 使い方
//    node test/i18n-build-names.js            src/lang-en-names.js を(再)生成
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'i18n', 'names-ledger.json');
const OUT_PATH = path.join(ROOT, 'src', 'lang-en-names.js');
const DATA_PATH = path.join(ROOT, 'src', 'data.js');

function stripEmojiPrefix(title) {
  // test/i18n-extract-ui.js の hasProperNoun 判定と同じ正規表現(D-P6-1整合)。
  // 大会名は絵文字接頭辞付き("👑 天頂戦")。先頭の非文字(絵文字・記号・空白)を除く。
  return title.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

function main() {
  if (!fs.existsSync(LEDGER_PATH)) {
    console.error(`[i18n-build-names] 台帳が見つかりません: ${path.relative(ROOT, LEDGER_PATH)}`);
    process.exit(1);
  }
  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch (e) {
    console.error(`[i18n-build-names] 台帳のJSONパースに失敗しました: ${e.message}`);
    process.exit(1);
  }

  const data = require(DATA_PATH);
  const violations = [];

  // ── 1. キャラ127名/コーチ35名の完全性検査 ──
  const charLedgerById = new Map((ledger.characters || []).map((c) => [c.id, c]));
  (data.ALL_CHARS || []).forEach((c) => {
    const entry = charLedgerById.get(c.id);
    if (!entry) {
      violations.push(`characters: id=${c.id}(${c.name}) が台帳に存在しません`);
      return;
    }
    if (entry.ja !== c.name) {
      violations.push(`characters: id=${c.id} ja不一致 台帳="${entry.ja}" data.js="${c.name}"`);
    }
    if (entry.jaSurname !== c.surname) {
      violations.push(`characters: id=${c.id} jaSurname不一致 台帳="${entry.jaSurname}" data.js="${c.surname}"`);
    }
  });
  if ((ledger.characters || []).length !== (data.ALL_CHARS || []).length) {
    violations.push(`characters: 件数不一致 台帳=${(ledger.characters || []).length} data.js=${(data.ALL_CHARS || []).length}`);
  }

  const coachLedgerById = new Map((ledger.coaches || []).map((c) => [c.id, c]));
  (data.ALL_COACHES || []).forEach((c) => {
    const entry = coachLedgerById.get(c.id);
    if (!entry) {
      violations.push(`coaches: id=${c.id}(${c.name}) が台帳に存在しません`);
      return;
    }
    if (entry.ja !== c.name) {
      violations.push(`coaches: id=${c.id} ja不一致 台帳="${entry.ja}" data.js="${c.name}"`);
    }
    const expectedSurname = c.name.split(' ')[0];
    if (entry.jaSurname !== expectedSurname) {
      violations.push(`coaches: id=${c.id} jaSurname不一致 台帳="${entry.jaSurname}" data.js由来="${expectedSurname}"`);
    }
  });
  if ((ledger.coaches || []).length !== (data.ALL_COACHES || []).length) {
    violations.push(`coaches: 件数不一致 台帳=${(ledger.coaches || []).length} data.js=${(data.ALL_COACHES || []).length}`);
  }

  // ── 2. 団体・大会・ベルト・会場の完全性検査 ──
  const orgJaSet = new Set((ledger.orgs || []).map((o) => o.ja));
  Object.values(data.RIVAL_ORG_NAME_POOL || {}).forEach((arr) => {
    (arr || []).forEach((name) => {
      if (!orgJaSet.has(name)) violations.push(`orgs: RIVAL_ORG_NAME_POOL の "${name}" が台帳に存在しません`);
    });
  });

  const eventJaSet = new Set((ledger.events || []).map((e) => e.ja));
  Object.values(data.SPECIAL_EVENT_INTRO || {}).forEach((ev) => {
    if (!ev || !ev.title) return;
    const stripped = stripEmojiPrefix(ev.title);
    if (!eventJaSet.has(stripped)) violations.push(`events: SPECIAL_EVENT_INTRO の "${stripped}"(元="${ev.title}") が台帳に存在しません`);
  });

  const titleJaSet = new Set((ledger.titles || []).map((t) => t.ja));
  (data.TITLES || []).forEach((t) => {
    if (!titleJaSet.has(t.name)) violations.push(`titles: TITLES の "${t.name}" が台帳に存在しません`);
  });

  const venueJaSet = new Set((ledger.venues || []).map((v) => v.ja));
  (data.VENUES || []).forEach((v) => {
    if (!venueJaSet.has(v.name)) violations.push(`venues: VENUES の "${v.name}" が台帳に存在しません`);
  });

  // ── 3. 台帳全域でのja重複・en食い違い検査 ──
  const merged = Object.create(null);
  const conflictSeen = new Set();
  function record(ja, en, tag) {
    if (!ja || typeof ja !== 'string') {
      violations.push(`${tag}: jaが空/非文字列です(en="${en}")`);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(merged, ja) && merged[ja] !== en) {
      const key = ja;
      if (!conflictSeen.has(key)) {
        conflictSeen.add(key);
        violations.push(`重複ja・en食い違い: "${ja}" → 既存="${merged[ja]}" 新規="${en}"(${tag})`);
      }
      return;
    }
    merged[ja] = en;
  }

  (ledger.characters || []).forEach((c) => {
    record(c.ja, c.en, `characters#${c.id}`);
    record(c.jaSurname, c.enSurname, `characters#${c.id}-surname`);
  });
  (ledger.coaches || []).forEach((c) => {
    record(c.ja, c.en, `coaches#${c.id}`);
    record(c.jaSurname, c.enSurname, `coaches#${c.id}-surname`);
  });
  ['orgs', 'events', 'titles', 'venues', 'schools', 'npc'].forEach((cat) => {
    (ledger[cat] || []).forEach((p) => record(p.ja, p.en, cat));
  });

  // ── 4/5. 技名242件の完全性・重複検査(P7-5) ──
  // 技名は「表示のときだけEN、日本語は安定キーとして不変」なので names とは別領域で扱う。
  const moveLedger = ledger.moves || [];
  const moveByJa = new Map();
  moveLedger.forEach((m) => {
    if (!m || typeof m.ja !== 'string' || !m.ja) {
      violations.push(`moves: jaが空/非文字列の行があります(en="${m && m.en}")`);
      return;
    }
    if (moveByJa.has(m.ja)) {
      violations.push(`moves: ja重複 "${m.ja}"`);
      return;
    }
    if (typeof m.en !== 'string' || !m.en) {
      violations.push(`moves: en が空です(ja="${m.ja}")`);
      return;
    }
    moveByJa.set(m.ja, m);
  });

  // data.js の技名を全数収集(commonMoves / styleMoves / STYLE_TAG_MOVES + 既定値)。
  // STYLE_TAG_MOVES はのべ89エントリだがユニーク82(6文字列が2〜3組で再利用されている
  // = docs/en-move-names-draft-v0.1.md §5-C)。Setで潰してユニークで数える。
  const dataMoveNames = new Set();
  (data.commonMoves || []).forEach((m) => dataMoveNames.add(m.n));
  Object.keys(data.styleMoves || {}).forEach((style) => {
    (data.styleMoves[style] || []).forEach((m) => dataMoveNames.add(m.n));
  });
  Object.keys(data.STYLE_TAG_MOVES || {}).forEach((pair) => {
    (data.STYLE_TAG_MOVES[pair] || []).forEach((m) => dataMoveNames.add(m.n));
  });
  if (!(data.STYLE_TAG_MOVES && Array.isArray(data.STYLE_TAG_MOVES['__default__'])
    && data.STYLE_TAG_MOVES['__default__'].length)) {
    // §5-A: getTagMove のフォールバックが表外へ戻ると、また辞書から漏れる。
    violations.push('moves: STYLE_TAG_MOVES.__default__(getTagMoveの既定値)が見つかりません');
  }

  dataMoveNames.forEach((n) => {
    if (!moveByJa.has(n)) violations.push(`moves: data.js の技 "${n}" が台帳に存在しません`);
  });
  moveByJa.forEach((_m, ja) => {
    if (!dataMoveNames.has(ja)) violations.push(`moves: 台帳の技 "${ja}" が data.js に存在しません`);
  });

  // en の一意性(§5-D の英語衝突の再発防止。Diving Splash/Top-Rope Splash 等)
  const moveEnSeen = new Map();
  moveByJa.forEach((m, ja) => {
    if (moveEnSeen.has(m.en)) {
      violations.push(`moves: en重複 "${m.en}"("${moveEnSeen.get(m.en)}" と "${ja}")`);
    } else {
      moveEnSeen.set(m.en, ja);
    }
  });

  // names側(選手・団体・会場等)とのja衝突。t()のパラメータ値自動変換は names→moves の
  // 順で引くので、衝突すると技名が人名として訳されてしまう。
  moveByJa.forEach((_m, ja) => {
    if (Object.prototype.hasOwnProperty.call(merged, ja)) {
      violations.push(`moves: ja "${ja}" が名前辞書(names)側と衝突しています`);
    }
  });

  if (violations.length) {
    console.error(`[i18n-build-names] NG: 機械検査で${violations.length}件の違反を検出しました。src/lang-en-names.js は生成していません。`);
    violations.slice(0, 100).forEach((v) => console.error(`  - ${v}`));
    if (violations.length > 100) console.error(`  ...ほか${violations.length - 100}件`);
    process.exit(1);
  }

  // ── P6-11: 姓のみ辞書(フルネームJA → 姓のみEN)の構築 ──
  // names(pn)とは別領域。.flink/.jtc-fn/.nm-tag等の固定幅1行枠でフルネームだと
  // 折り返し・はみ出しが起きる箇所向け(docs/i18n-en-layout-overflow-report-v0.1.md)。
  // 選手・コーチのみ対象(団体・大会等は「姓」という概念が無い)。
  const surnameByFullName = Object.create(null);
  (ledger.characters || []).forEach((c) => { surnameByFullName[c.ja] = c.enSurname; });
  (ledger.coaches || []).forEach((c) => { surnameByFullName[c.ja] = c.enSurname; });

  // ── P7-5: 技名辞書(技名JA → 技名EN)と短縮形辞書の構築 ──
  const moveMap = Object.create(null);
  const moveShortMap = Object.create(null);
  moveByJa.forEach((m, ja) => {
    moveMap[ja] = m.en;
    if (m.short) moveShortMap[ja] = m.short;
  });

  // ── 生成 ──
  const charCount = (ledger.characters || []).length;
  const coachCount = (ledger.coaches || []).length;
  const unconfirmedChar = (ledger.characters || []).filter((c) => c.confirmed === false).length;
  const unconfirmedCoach = (ledger.coaches || []).filter((c) => c.confirmed === false).length;

  const header = [
    '// ══════════════════════════════════════════════════════════════════════════════',
    '//  src/lang-en-names.js — 名前辞書 PN_EN (Stage B P6-1, 自動生成)',
    '//',
    '//  このファイルは test/i18n-build-names.js が i18n/names-ledger.json から生成する。',
    '//  手動で編集しないこと。訂正は i18n/names-ledger.json の該当行(ja/en/jaSurname/enSurname)',
    '//  を書き換え、node test/i18n-build-names.js を再実行して再生成する。',
    '//',
    '//  表記の正: docs/en-proper-nouns-draft-v0.1.md(2026-09-02 Keisuke裁定確定分)',
    `//  生成元: i18n/names-ledger.json (選手${charCount}名・うち暫定読み${unconfirmedChar}名 / `
      + `コーチ${coachCount}名・うち暫定読み${unconfirmedCoach}名 / 団体・大会・ベルト・会場・付録)`,
    '//  WM_I18N.pn()/t()のパラメータ値自動変換(D-P6-2/D-P6-3)経由でenのときだけ参照される。',
    '//  jaのときは無関係(1バイト不変)。辞書に無い名前はfail-openで原文のまま表示される。',
    '//  addSurnames(P6-11): フルネームJA→姓のみEN。WM_I18N.pnSurname()経由でenのときだけ参照。',
    '//  addMoves/addMoveShorts(P7-5): 技名JA→技名EN / 狭い枠向け短縮EN。WM_I18N.mv()/mvShort()',
    '//  とt()のパラメータ値自動変換(D-P6-2)経由でenのときだけ参照。技名の日本語は効果音判定・',
    '//  解説文選択・セーブ値(finMove)の安定キーなので、この辞書は「表示の直前」でのみ引くこと。',
    '//  技名表記の正: docs/en-move-names-draft-v0.1.md(2026-09-04 Keisuke裁定確定分)',
    '// ══════════════════════════════════════════════════════════════════════════════',
    '(function () {',
    '  \'use strict\';',
    '  if (typeof WM_I18N === \'undefined\' || !WM_I18N.addNames) return;',
    '  WM_I18N.addNames(',
  ].join('\n');
  const footer = '\n  );\n';

  const body = JSON.stringify(merged, null, 2)
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');

  const surnameHeader = [
    '  if (WM_I18N.addSurnames) {',
    '    WM_I18N.addSurnames(',
  ].join('\n');
  const surnameBody = JSON.stringify(surnameByFullName, null, 2)
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');
  const surnameFooter = '\n    );\n  }\n';

  const moveHeader = [
    '  if (WM_I18N.addMoves) {',
    '    WM_I18N.addMoves(',
  ].join('\n');
  const moveBody = JSON.stringify(moveMap, null, 2)
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');
  const moveMid = [
    '\n    );',
    '  }',
    '  if (WM_I18N.addMoveShorts) {',
    '    WM_I18N.addMoveShorts(',
  ].join('\n');
  const moveShortBody = JSON.stringify(moveShortMap, null, 2)
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');
  const moveFooter = '\n    );\n  }\n})();\n';

  fs.writeFileSync(
    OUT_PATH,
    header + '\n' + body + footer
      + surnameHeader + '\n' + surnameBody + surnameFooter
      + moveHeader + '\n' + moveBody + moveMid + '\n' + moveShortBody + moveFooter,
    'utf8',
  );

  const totalKeys = Object.keys(merged).length;
  const surnameKeys = Object.keys(surnameByFullName).length;
  console.log(`[i18n-build-names] 生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-build-names] 選手=${charCount}(暫定読み${unconfirmedChar}) コーチ=${coachCount}(暫定読み${unconfirmedCoach}) `
    + `団体=${(ledger.orgs || []).length} 大会=${(ledger.events || []).length} ベルト=${(ledger.titles || []).length} `
    + `会場=${(ledger.venues || []).length} 学校地名=${(ledger.schools || []).length} 媒体NPC=${(ledger.npc || []).length}`);
  console.log(`[i18n-build-names] 辞書エントリ総数(フルネーム+姓のみ+その他を統合)=${totalKeys}`);
  console.log(`[i18n-build-names] 姓のみ辞書(フルネームJA→姓のみEN)エントリ数=${surnameKeys}`);
  console.log(`[i18n-build-names] 技名辞書(技名JA→技名EN)エントリ数=${Object.keys(moveMap).length}`
    + ` / 短縮形=${Object.keys(moveShortMap).length}(data.js実データ=${dataMoveNames.size}件と全数一致)`);
}

main();
