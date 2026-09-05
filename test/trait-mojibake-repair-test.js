#!/usr/bin/env node
'use strict';

// test/trait-mojibake-repair-test.js
//
// 2026-09-05: data.js:60 高橋まゆみ(id:49)の特性 '名勝負製造機' の「勝」が U+FFFD×3 に化けて
// TRAIT_DEFS と一致せず、Traits.has() が常に false = 特性の効果もバッジも出ない状態で出荷されていた
// (マスタ側は db9ce9a5 で修正)。特性は選手オブジェクトに焼かれてセーブへ永続するため、マスタを
// 直しても既存セーブには届かない。その穴を Engine.saveDoctor.repairOnLoad の _normTraits で塞ぐ。
// このテストは以下を検証する:
//   1. マスタ(ALL_CHARS)の全特性が TRAIT_DEFS のキーに一致し、U+FFFD を含まない(データ退行ガード。
//      これがあれば data.js:60 型の破損はコミット前に落ちる)
//   2. 旧セーブの化けた特性名が、全プール(roster/freeAgents/scoutCandidates/retiredFighters/
//      aiOrgs[].roster)で '名勝負製造機' に修復され、他の特性と並び順は不変、changes に記録される
//   3. 修復後は Traits.has() が真になる(=効果が出る状態に戻る)
//   4. マスタを持たない選手(生成ルーキー)でも TRAIT_DEFS 全キーとの突合で修復される
//   5. 正常な選手は参照同一で返る(冪等・毎ロード実行で無害)。候補が一意に決まらない化け方は
//      触らない(fail-open)。既に正しい特性を併せ持つ場合も二重付与しない
//   6. 実フィクスチャ(走破ハーネスの S1W1 セーブ・化けたまま保存されている)を通すと id:49 が修復される

const path = require('path');
const fs = require('fs');
const { loadGame } = require('./helpers/load-game');

loadGame({ draft: true });

let failures = 0;
function check(cond, message) {
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`ok - ${message}`);
  }
}

const BROKEN = '名���負製造機';
const FIXED = '名勝負製造機';
const LABEL = 'trait_mojibake_repaired';

// ────────────────────────────────────────────────────
// 1. マスタのデータ退行ガード
// ────────────────────────────────────────────────────
const badMaster = [];
ALL_CHARS.forEach(c => (c.traits || []).forEach(t => {
  if (typeof t !== 'string' || !TRAIT_DEFS[t] || t.includes('�')) badMaster.push(`${c.id}:${t}`);
}));
check(badMaster.length === 0, `ALL_CHARS の全特性が TRAIT_DEFS に一致し U+FFFD を含まない(逸脱: ${badMaster.join(', ') || 'なし'})`);
const mayumi = ALL_CHARS.find(c => c.id === 49);
check(!!mayumi && mayumi.traits.includes(FIXED), 'マスタの id:49 高橋まゆみは 名勝負製造機 を持つ(db9ce9a5 の修正が残っている)');
const holders = ALL_CHARS.filter(c => c.id !== 49 && (c.traits || []).includes(FIXED)).map(c => c.id);
check(holders.length >= 4, `名勝負製造機 を持つ他キャラが4名以上いる(テスト用: ${holders.slice(0, 4).join(', ')})`);
const keysMatching = Object.keys(TRAIT_DEFS).filter(k => /^名.+負製造機$/.test(k));
check(keysMatching.length === 1 && keysMatching[0] === FIXED, `TRAIT_DEFS で ^名.+負製造機$ に合うキーは 名勝負製造機 の1つだけ(実際: ${keysMatching.join(', ')})`);

// ────────────────────────────────────────────────────
// 2/3. 旧セーブ移行(Engine.saveDoctor.repairOnLoad)— 全プール
// ────────────────────────────────────────────────────
const mk = (id, traits) => ({
  id, name: `t${id}`, archetype: 'polite', personality: 'earnest',
  pw: 60, sp: 60, te: 60, st: 60, mn: 60, age: 24,
  traits: traits || ['ファンサービス', BROKEN, '華'],
});
const [faId, scoutId, retiredId, aiId] = holders;
const legacy = {
  season: 3, week: 5, rngSeed: 1,
  roster: [mk(49)],
  freeAgents: [mk(faId)],
  scoutCandidates: [mk(scoutId)],
  dormantPool: [],
  retiredIds: [retiredId],
  retiredSeasons: { [retiredId]: 1 },
  retiredFighters: [mk(retiredId)],
  aiOrgs: { org1: { roster: [mk(aiId), mk(90001, ['早熟', BROKEN])] } },
};
const repair = Engine.saveDoctor.repairOnLoad(legacy);
const repaired = repair.state;
const find = (arr, id) => (arr || []).find(f => f && f.id === id);

const cases = [
  ['roster', find(repaired.roster, 49)],
  ['freeAgents', find(repaired.freeAgents, faId)],
  ['scoutCandidates', find(repaired.scoutCandidates, scoutId)],
  ['retiredFighters', find(repaired.retiredFighters, retiredId)],
  ['aiOrgs[].roster', find(repaired.aiOrgs.org1.roster, aiId)],
];
cases.forEach(([pool, f]) => {
  check(!!f, `${pool}: 対象選手が修復後も同じプールに残っている`);
  if (!f) return;
  check(JSON.stringify(f.traits) === JSON.stringify(['ファンサービス', FIXED, '華']),
    `${pool}: 化けた特性名だけが 名勝負製造機 に直り、他の特性と並び順は不変(実際: ${JSON.stringify(f.traits)})`);
  check(Traits.has(f, FIXED), `${pool}: 修復後は Traits.has(f, '名勝負製造機') が真(=効果が出る)`);
});
check(repair.changed === true, 'repairOnLoad が changed=true を返す(app.js 側が repair.state を採用する条件)');
const label = repair.changes.find(c => c.startsWith(LABEL + ':'));
check(!!label, `changes に ${LABEL} が記録される(実際: ${repair.changes.join(', ')})`);
check(!!label && label.includes(`49:${FIXED}`), `記録に id:49 の修復が含まれる(実際: ${label})`);

// ────────────────────────────────────────────────────
// 4. マスタを持たない選手(生成ルーキー)は TRAIT_DEFS 全キーで突合
// ────────────────────────────────────────────────────
const rookie = find(repaired.aiOrgs.org1.roster, 90001);
check(!!rookie && JSON.stringify(rookie.traits) === JSON.stringify(['早熟', FIXED]),
  `マスタに無い id(90001) でも TRAIT_DEFS 全キーとの突合で修復される(実際: ${rookie && JSON.stringify(rookie.traits)})`);

// ────────────────────────────────────────────────────
// 5. 冪等性と fail-open(_normTraits 単体)
// ────────────────────────────────────────────────────
const norm = Engine.saveDoctor._normTraits;
const healthy = mk(49, ['ファンサービス', FIXED, '華']);
check(norm(healthy) === healthy, '正常な特性しか持たない選手は参照同一で返る(冪等)');
const noTraits = { id: 3, age: 17 };
check(norm(noTraits) === noTraits, 'traits を持たないオブジェクト(dormantPool 等)はそのまま返す');
check(norm(null) === null, 'null はそのまま返す');

const ambiguous = norm(mk(49, ['�']));
check(JSON.stringify(ambiguous.traits) === JSON.stringify(['�']), '候補が複数に当たる化け方(U+FFFD 単独)は触らない(fail-open)');
const noHit = norm(mk(49, ['��存在しない特性名']));
check(JSON.stringify(noHit.traits) === JSON.stringify(['��存在しない特性名']), 'どのキーにも当たらない化け方は触らない(fail-open)');
const alreadyHas = norm(mk(49, [BROKEN, FIXED]));
check(JSON.stringify(alreadyHas.traits) === JSON.stringify([BROKEN, FIXED]), '正しい特性を既に併せ持つ場合は二重付与しない(化けた方はそのまま)');
const log = [];
norm(mk(49), log);
check(JSON.stringify(log) === JSON.stringify([`49:${FIXED}`]), `log 引数に "id:特性名" が積まれる(実際: ${JSON.stringify(log)})`);
const noLog = [];
norm(healthy, noLog);
check(noLog.length === 0, '修復が無ければ log には何も積まれない');

// ────────────────────────────────────────────────────
// 6. 実フィクスチャ(走破ハーネス S1W1・化けたまま保存されている)
// ────────────────────────────────────────────────────
const fixturePath = path.join(__dirname, 'ui-walkthrough', 'fixtures', 'season-1-week-1-seed42.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const rawMayumi = Object.values(fixture.aiOrgs || {}).flatMap(o => o.roster || []).concat(fixture.roster || []).find(f => f.id === 49);
check(!!rawMayumi && rawMayumi.traits.includes(BROKEN), 'フィクスチャは化けた特性名のまま保存されている(このテストの前提。修復したら退行ガードにならない)');
const fx = Engine.saveDoctor.repairOnLoad(fixture);
const fxMayumi = Object.values(fx.state.aiOrgs || {}).flatMap(o => o.roster || []).concat(fx.state.roster || []).find(f => f.id === 49);
check(!!fxMayumi && Traits.has(fxMayumi, FIXED) && !fxMayumi.traits.includes(BROKEN),
  `実フィクスチャを repairOnLoad に通すと id:49 の特性が修復される(実際: ${fxMayumi && JSON.stringify(fxMayumi.traits)})`);
check(fx.changes.some(c => c.startsWith(LABEL + ':') && c.includes(`49:${FIXED}`)), '実フィクスチャでも changes に記録される');
const fxLeft = [];
const scan = (arr, tag) => (arr || []).forEach(f => (f && f.traits || []).forEach(t => { if (typeof t === 'string' && t.includes('�')) fxLeft.push(`${tag}:${f.id}:${t}`); }));
scan(fx.state.roster, 'roster'); scan(fx.state.freeAgents, 'fa'); scan(fx.state.scoutCandidates, 'scout'); scan(fx.state.retiredFighters, 'retired');
Object.entries(fx.state.aiOrgs || {}).forEach(([k, o]) => scan(o.roster, k));
check(fxLeft.length === 0, `修復後のフィクスチャに U+FFFD を含む特性名が残っていない(残: ${fxLeft.join(', ') || 'なし'})`);

console.log('');
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('All trait-mojibake-repair checks passed.');
}
