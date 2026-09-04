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
//    confirmed:false は「要読み確認」49件(選手35+コーチ14)の暫定読み(第一案)。
//    Keisukeの訂正が入ったら該当行のja/en/jaSurname/enSurnameを書き換えて再実行するだけでよい。
//
//  ■ 機械検査(1件でも違反があれば exit 1・lang-en-names.js は書き換えない)
//    1. 完全性: src/data.js の ALL_CHARS(127)/ALL_COACHES(35)全idが台帳に存在し、
//       ja/jaSurnameが台帳のja/jaSurnameと一致する(data.js側の変更を検知するガード)
//    2. VENUES/TITLES/RIVAL_ORG_NAME_POOL の全名称、SPECIAL_EVENT_INTROの全題名
//       (絵文字接頭辞を除いた本体。test/i18n-extract-ui.jsと同じ正規表現)が
//       台帳(venues/titles/orgs/events)に存在する
//    3. 台帳内の重複ja(キャラ+コーチ+org+event+title+venue+school+npcの全域)で
//       en値が食い違うものが無い(同一ja→同一enは許容・上書きにすぎない)
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
  const surnameFooter = '\n    );\n  }\n})();\n';

  fs.writeFileSync(
    OUT_PATH,
    header + '\n' + body + footer + surnameHeader + '\n' + surnameBody + surnameFooter,
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
}

main();
