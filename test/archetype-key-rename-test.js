#!/usr/bin/env node
'use strict';

// test/archetype-key-rename-test.js
//
// task-68: アーキタイプの内部キー 'normal' を 'standard' に改名した(表示ラベル
// 「標準」は不変)。このテストは以下を検証する:
//   1. アーキタイプのキー集合に 'normal' が残っていないこと(性格の 'normal' とは別)
//   2. 全キャラの archetype が新しい綴りの集合に収まること
//   3. 旧セーブ(archetype:'normal')を読むと 'standard' に移行されること
//      (Engine.saveDoctor.repairOnLoad 経由。roster/freeAgents/scoutCandidates/
//      retiredFighters/aiOrgs[].roster すべてが対象)
//   4. 移行前後で同じセリフプールが引けること(移行によって挙動が変わらない)
//   5. 代表的な改名テーブルで、旧綴りのキーが完全に消え、新綴りに置き換わって
//      いること。かつ本数が保持されていること
//   6. 複合キー(archetype_personality)テーブル(CHALLENGE_LINES)の改名
//   7. 今回あえて改名していないテーブル(factions.js 依存で読み手を直せない
//      ため)は 'normal' キーのまま残り、実際のキャラ(archetype='standard')
//      でも引き続き正しく引けること(フォールバック経由。退行がないことの証明)
//   8. tools/dialogue-workbook.js の detectMeta が、改名後のキーをアーキタイプ
//      として正しく判定すること(性格の 'normal' は従来通り性格と判定される)

const assert = require('assert');
const path = require('path');
const { loadGame, loadAsGlobal } = require('./helpers/load-game');

loadGame({ factions: true });

let failures = 0;
function check(cond, message) {
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`ok - ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. アーキタイプ/性格のキー集合
// ─────────────────────────────────────────────────────────────────────────
const ARCHETYPE_KEYS = new Set(['standard', 'composed', 'ojousama', 'delinquent', 'cool', 'seductive', 'polite']);
const PERSONALITY_KEYS = new Set(['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional']);

check(!ARCHETYPE_KEYS.has('normal'), 'アーキタイプのキー集合に normal が残っていない');
check(ARCHETYPE_KEYS.has('standard'), 'アーキタイプのキー集合に standard が存在する');
check(PERSONALITY_KEYS.has('normal'), '性格のキー集合には normal が残っている(性格は改名対象外)');

// ─────────────────────────────────────────────────────────────────────────
// 2. 全キャラの archetype が新しい綴りに収まる
// ─────────────────────────────────────────────────────────────────────────
const badArchetype = ALL_CHARS.filter(c => !ARCHETYPE_KEYS.has(c.archetype));
check(badArchetype.length === 0, `全キャラの archetype が既知の集合に収まる(逸脱: ${badArchetype.map(c => `${c.name}:${c.archetype}`).join(', ')})`);
check(ALL_CHARS.filter(c => c.archetype === 'normal').length === 0, 'ALL_CHARS に archetype=normal のキャラが残っていない');
check(ALL_CHARS.filter(c => c.archetype === 'standard').length === 33, 'ALL_CHARS の archetype=standard は33名(旧 normal 33名から1:1移行)');
// personality の 'normal' は触っていないので現状維持のはず
check(ALL_CHARS.filter(c => c.personality === 'normal').length === 37, 'ALL_CHARS の personality=normal は37名のまま(性格は不変)');

// ─────────────────────────────────────────────────────────────────────────
// 3. 旧セーブ移行(Engine.saveDoctor.repairOnLoad)
// ─────────────────────────────────────────────────────────────────────────
const legacyState = {
  season: 5, week: 3, rngSeed: 1,
  roster: [{ id: 1, name: 'ロスター太郎', archetype: 'normal', personality: 'bold' }],
  freeAgents: [{ id: 2, name: 'FA次郎', archetype: 'normal', personality: 'quiet' }],
  scoutCandidates: [{ id: 3, name: 'スカウト三郎', archetype: 'normal', personality: 'earnest' }],
  dormantPool: [],
  retiredIds: [],
  retiredSeasons: {},
  retiredFighters: [{ id: 4, name: '引退四郎', archetype: 'normal', personality: 'shy' }],
  aiOrgs: { ai1: { roster: [{ id: 5, name: 'AI五郎', archetype: 'normal', personality: 'easygoing' }] } },
};
const { state: repaired } = Engine.saveDoctor.repairOnLoad(legacyState);

check(repaired.roster[0].archetype === 'standard', 'roster: 旧セーブの archetype=normal が standard に移行される');
check(repaired.freeAgents[0].archetype === 'standard', 'freeAgents: 同上');
check(repaired.scoutCandidates[0].archetype === 'standard', 'scoutCandidates: 同上');
check(repaired.retiredFighters[0].archetype === 'standard', 'retiredFighters: 同上');
check(repaired.aiOrgs.ai1.roster[0].archetype === 'standard', 'aiOrgs[].roster: 同上');
check(repaired.roster[0].personality === 'bold', '移行時に personality は一切変更されない');

// すでに新綴りのキャラは触らない(冪等性)
const alreadyStandard = Engine.saveDoctor._normArchetype({ id: 9, archetype: 'standard', personality: 'cool' });
check(alreadyStandard.archetype === 'standard', 'すでに standard のキャラは変化しない(冪等)');
// archetype フィールドを持たないオブジェクト(dormantPool 等)は no-op
const noArchetypeObj = { id: 10, age: 17 };
check(Engine.saveDoctor._normArchetype(noArchetypeObj) === noArchetypeObj, 'archetype を持たないオブジェクトはそのまま返す(参照同一)');

// ─────────────────────────────────────────────────────────────────────────
// 4. 移行前後で同じセリフが引けること(RELEASE_INTERVIEW_LINES で検証)
// ─────────────────────────────────────────────────────────────────────────
const nativeStandardPool = RELEASE_INTERVIEW_LINES['standard'] || RELEASE_INTERVIEW_LINES.standard;
const legacyFixture = { archetype: 'normal' };
const migratedFixture = Engine.saveDoctor._normArchetype(legacyFixture);
const migratedPool = RELEASE_INTERVIEW_LINES[migratedFixture.archetype] || RELEASE_INTERVIEW_LINES.standard;
check(Array.isArray(nativeStandardPool) && nativeStandardPool.length > 0, 'RELEASE_INTERVIEW_LINES.standard は空でない');
check(migratedPool === nativeStandardPool, '移行後のキャラは、最初から standard だったキャラと全く同じ配列を引く(===)');

// ─────────────────────────────────────────────────────────────────────────
// 5. 代表テーブルで旧キーが完全に消え、新キーに置換されている(かつ本数維持)
// ─────────────────────────────────────────────────────────────────────────
function countLines(obj) {
  if (Array.isArray(obj)) {
    if (obj.length === 0 || obj.every(x => typeof x === 'string')) return obj.length;
    return obj.reduce((s, x) => s + countLines(x), 0);
  }
  if (obj && typeof obj === 'object') return Object.values(obj).reduce((s, v) => s + countLines(v), 0);
  return 0;
}

['bold', 'earnest', 'quiet', 'easygoing', 'emotional', 'normal'].forEach(p => {
  check(!!(FACTION_F02_LEADER_LINES[p] && FACTION_F02_LEADER_LINES[p].standard),
    `FACTION_F02_LEADER_LINES.${p}.standard が存在する(normal から改名)`);
  check(!(FACTION_F02_LEADER_LINES[p] && FACTION_F02_LEADER_LINES[p].normal),
    `FACTION_F02_LEADER_LINES.${p}.normal はもう存在しない`);
});
check(countLines(FACTION_F02_LEADER_LINES) === 12, 'FACTION_F02_LEADER_LINES の総セリフ本数は12本のまま(改名で減っていない)');
check(countLines(FACTION_F03_SURVIVOR_LINES) === 15, 'FACTION_F03_SURVIVOR_LINES の総セリフ本数は15本のまま(改名で減っていない)');

// ─────────────────────────────────────────────────────────────────────────
// 6. 複合キー(archetype_personality)テーブル: CHALLENGE_LINES
// ─────────────────────────────────────────────────────────────────────────
check(!!CHALLENGE_LINES.standard_bold, 'CHALLENGE_LINES.standard_bold が存在する(normal_bold から改名)');
check(!CHALLENGE_LINES.normal_bold, 'CHALLENGE_LINES.normal_bold はもう存在しない');
check(!!CHALLENGE_LINES.standard_normal, 'CHALLENGE_LINES.standard_normal が存在する(archetype=standard, personality=normal)');
const compoundFixture = { archetype: 'standard', personality: 'bold' };
const compoundLine = Engine.challengeRequest.pickLine(compoundFixture, 'petition', null, null);
check(typeof compoundLine === 'string' && compoundLine.length > 0,
  'Engine.challengeRequest.pickLine が standard×bold のキャラでセリフを引ける');

// ─────────────────────────────────────────────────────────────────────────
// 7. 2026-08-01: 取り残されていた31テーブル(派閥系・タッグ系・カットイン系ほか)
//    も standard に改名し、読み手のフォールバックも揃えた。
//    旧 archetype='normal' の**セーブデータ**は management.js の移行処理で
//    'standard' に直されるが、万一素通りしても同じプールに落ちること。
// ─────────────────────────────────────────────────────────────────────────
check(!!FACTION_F01_LEADER_LINES.bold.standard, 'FACTION_F01_LEADER_LINES.bold.standard が存在する(normal から改名)');
check(!FACTION_F01_LEADER_LINES.bold.normal, 'FACTION_F01_LEADER_LINES.bold.normal はもう存在しない');
const standardFighter = { id: 90001, personality: 'bold', archetype: 'standard' };
const legacyNormalFighter = { id: 90002, personality: 'bold', archetype: 'normal' };
const lineForStandard = Engine.factions.getFactionLine(FACTION_F01_LEADER_LINES, standardFighter, null);
const lineForLegacy = Engine.factions.getFactionLine(FACTION_F01_LEADER_LINES, legacyNormalFighter, null);
check(typeof lineForStandard === 'string' && lineForStandard.length > 0,
  'archetype=standard の実キャラが FACTION_F01_LEADER_LINES からセリフを引ける');
check(lineForStandard === lineForLegacy,
  '旧 archetype=normal のキャラも standard フォールバックで同じセリフプールに落ちる(退行なし)');

// 改名し残しがないことの全数チェック。アーキタイプ位置の 'normal' が1つでも
// 残っていれば、そのテーブルは Excel でアーキタイプ列が空になる。
const AXIS = require(path.join(__dirname, '..', 'tools', 'axis-rewrite.js'));
const EXTRACT = require(path.join(__dirname, '..', 'tools', 'extract-dialogue.js'));
const _origErr = console.error;
console.error = () => {};
const _decls = EXTRACT.loadAllDecls();
console.error = _origErr;
const _sandbox = EXTRACT.evalAll(_decls.allDecls);
const leftover = AXIS.collectTargets(_sandbox).report;
check(leftover.length === 0,
  `アーキタイプ位置に旧キー normal が残っているテーブルは0件(実際: ${leftover.length}件 ${leftover.map(r => r.table).join(', ')})`);

// ─────────────────────────────────────────────────────────────────────────
// 8. tools/dialogue-workbook.js の detectMeta
// ─────────────────────────────────────────────────────────────────────────
const DW = require(path.join(__dirname, '..', 'tools', 'dialogue-workbook.js'));

const metaArch = DW.detectMeta('FACTION_F02_LEADER_LINES.bold.standard[1]', 'FACTION_F02_LEADER_LINES');
check(metaArch.archetype === '標準', `改名後の standard キーはアーキタイプ「標準」と判定される(実際: "${metaArch.archetype}")`);
check(metaArch.personality === '強気', `同じパスの bold は性格「強気」と判定される(実際: "${metaArch.personality}")`);

const metaPersonalityNormal = DW.detectMeta('FACTION_F02_LEADER_LINES.normal.standard[1]', 'FACTION_F02_LEADER_LINES');
check(metaPersonalityNormal.personality === 'ノーマル', `第一階層の normal は性格「ノーマル」と判定される(実際: "${metaPersonalityNormal.personality}")`);
check(metaPersonalityNormal.archetype === '標準', `第二階層の standard はアーキタイプ「標準」と判定される(実際: "${metaPersonalityNormal.archetype}")`);

// 2026-08-01 の改名で、派閥系テーブルもアーキタイプ列が埋まるようになった。
// (以前はここが空欄になり、標準アーキタイプの行だけ キャラタイプ別/ に
//  振り分けられず落ちていた)
const metaFaction = DW.detectMeta('FACTION_F01_LEADER_LINES.bold.standard[1]', 'FACTION_F01_LEADER_LINES');
check(metaFaction.personality === '強気' && metaFaction.archetype === '標準',
  `派閥テーブルもアーキタイプ列が埋まる(実際: personality="${metaFaction.personality}" archetype="${metaFaction.archetype}")`);

console.log('');
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('All archetype-key-rename checks passed.');
}
