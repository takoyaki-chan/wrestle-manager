#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/faction-dissolution-log-test.js — 派閥が消えたときの週のログ1行(2026-09-26 Keisuke 承認)の回帰ガード
//
//  ■ 何を守るか
//    1. Engine.factions.buildDissolutionLogs(直前・直後の state を比べる純関数)が、消えた派閥ごとに1行を
//       事実どおりの理由で組む: 人数割れ(members_last / members_alone / members)・リーダー不在の解散
//       (leader / leader_alone)・一派閥の独占(dominance / dominance_other)。消えていなければ何も返さない
//    2. 出る経路: tickWeek の消滅判定(人数割れ)で週のログに1行(抗争の決着「相手の派閥の消滅で終わった」より前)、
//       季末の引退の確定(commitRetirements)でリーダーの後継が立たずに消えたら引退の行の後に1行
//    3. 二重にしない経路: 社長の派閥解散命令(既存のログ「⚖️ 社長命令により…」)・F03(結果モーダル+記事)では出さない
//    4. 文面: JA は事実だけ(数値・内部名なし)、EN は日本語が残らず派閥名・選手名が英語になる。記事は出さない。
//       表示だけで数値は動かさない(ログの有無で state が変わらない)
//
//  ■ 使い方
//    node test/faction-dissolution-log-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n        ') : e)); }
}

const F = Engine.factions;
const CFG = FACTION_CONFIG;
const JA_RE = /[぀-ヿ㐀-鿿]/;
const DIGIT_RE = /[0-9０-９]/;
const VARIANTS = ['members_last', 'members_alone', 'members', 'leader', 'leader_alone', 'dominance', 'dominance_other'];

// 実在の選手(EN の名前辞書を通すため)
const chars = ALL_CHARS.slice(0, 12);
const fighter = (c, extra = {}) => ({ id: c.id, name: c.name, surname: c.surname, archetype: c.archetype, personality: c.personality, popularity: 40, trust: 60, traits: [], pw: 60, sp: 60, te: 60, st: 60, mn: 60, ...extra });
const fname = (c) => `${c.surname || c.name}派`;
const fac = (id, leader, members, extra = {}) => ({ id, name: fname(leader), leaderId: leader.id, memberIds: [leader.id, ...members.map(m => m.id)], status: 'active', type: 'loyal', momentum: 0, createdSeason: 1, createdWeek: 5, ...extra });
const logsOf = (events, type = 'faction_dissolved') => (events || []).filter(e => e && typeof e === 'object' && e.type === type);

console.log('派閥が消えたときの週のログ1行 回帰ガード');

section('1. buildDissolutionLogs: 人数割れ — 残った1人の名前 / 誰も残らない / それ以外。消えていなければ何も返さない', () => {
  const [L, A, B, C, D] = chars;
  const roster = [L, A, B, C, D].map(c => fighter(c));
  const before = { roster, factions: [fac(1, L, [A]), fac(2, B, []), fac(3, C, [D, A], { memberIds: [D.id, A.id] })] };
  const after = { roster, factions: [] };
  const logs = F.buildDissolutionLogs(before, after);
  assert.strictEqual(logs.length, 3);
  assert.deepStrictEqual(logs[0], { type: 'faction_dissolved', data: { variant: 'members_last', factionName: fname(L), leaderName: L.name, remainName: A.name } });
  assert.deepStrictEqual(logs[1], { type: 'faction_dissolved', data: { variant: 'members_alone', factionName: fname(B), leaderName: B.name } });
  // リーダーが memberIds に居ない壊れた形でも、名前を取り違えず一般の文にする
  assert.deepStrictEqual(logs[2].data, { variant: 'members', factionName: fname(C) });
  assert.deepStrictEqual(F.buildDissolutionLogs(before, before), [], '消えていないのに行が出た');
  assert.deepStrictEqual(F.buildDissolutionLogs({ roster, factions: [] }, after), []);
  assert.deepStrictEqual(F.buildDissolutionLogs(null, after), []);
});

section('2. buildDissolutionLogs: リーダー不在(後継が立たない)— 残った者の有無で2通り', () => {
  const [L, A, B, M] = chars;
  const before = { roster: [L, A, B, M].map(c => fighter(c)), factions: [fac(1, L, [A, B]), fac(2, M, [])] };
  const after = { roster: [A, B].map(c => fighter(c)), factions: [] };
  const logs = F.buildDissolutionLogs(before, after);
  assert.deepStrictEqual(logs.map(l => l.data), [
    { variant: 'leader', factionName: fname(L) },
    { variant: 'leader_alone', factionName: fname(M) },
  ]);
});

section('3. checkDissolutionConditions を通して: 人数割れは members_*、一派閥の独占(全派閥が消える)は dominance / dominance_other', () => {
  const ten = chars.slice(0, 10);
  const roster = ten.map(c => fighter(c));
  // 人数割れ: 3人の派閥は残り、2人の派閥だけ消える
  const s1 = { roster, factions: [fac(1, ten[0], [ten[1], ten[2]]), fac(2, ten[3], [ten[4]])], factionHostility: { '1>2': 30 } };
  const a1 = F.checkDissolutionConditions(s1);
  assert.deepStrictEqual(a1.factions.map(f => f.id), [1]);
  assert.deepStrictEqual(F.buildDissolutionLogs(s1, a1).map(l => l.data), [{ variant: 'members_last', factionName: fname(ten[3]), leaderName: ten[3].name, remainName: ten[4].name }]);
  // 独占: 10人中8人(= dissolveRatioThreshold)を抱える派閥があれば、全派閥が消える
  assert.ok(8 / 10 >= CFG.dissolveRatioThreshold);
  const s2 = { roster, factions: [fac(1, ten[0], ten.slice(1, 8)), fac(2, ten[8], [ten[9]])] };
  const a2 = F.checkDissolutionConditions(s2);
  assert.strictEqual(a2.factions.length, 0);
  assert.deepStrictEqual(F.buildDissolutionLogs(s2, a2).map(l => l.data), [
    { variant: 'dominance', factionName: fname(ten[0]) },
    { variant: 'dominance_other', factionName: fname(ten[8]) },
  ]);
});

section('4. 文面(JA): 事実だけ・数値なし・内部名なし。7通りすべて組める', () => {
  const [L, A] = chars;
  const T = (variant, extra = {}) => gameLogEntryText({ type: 'faction_dissolved', data: { variant, factionName: '根岸派', leaderName: L.name, remainName: A.name, ...extra }, s: 3, w: 10 });
  assert.strictEqual(T('members_last'), `🎭 根岸派が解散した。メンバーが抜けていき、${L.name}のもとに残ったのは${A.name}だけだった`);
  assert.strictEqual(T('members_alone'), `🎭 根岸派が解散した。メンバーが抜けていき、${L.name}のもとには誰も残らなかった`);
  assert.strictEqual(T('leader'), '🎭 根岸派が解散した。まとめ役を失い、メンバーは散り散りになった');
  VARIANTS.forEach(v => {
    const t = T(v);
    assert.ok(t && t.startsWith('🎭 根岸派が解散した。'), `${v}: ${t}`);
    assert.ok(!DIGIT_RE.test(t) && !/[{}]/.test(t) && !/members|leader|dominance/.test(t), `${v}: ${t}`);
  });
  assert.deepStrictEqual(Object.keys(GAMELOG_TEMPLATES.faction_dissolved).sort(), VARIANTS.slice().sort());
  assert.deepStrictEqual(GAMELOG_TYPE_CATEGORY.faction_dissolved, ['event']);
});

section('5. 文面(EN): 7通りとも日本語が残らず、派閥名(Group)と選手名が英語になる', () => {
  const srcDir = path.join(__dirname, '..', 'src');
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  ['i18n.js', 'lang-en.js', 'lang-en-templates.js', 'lang-en-dialogue.js', 'lang-en-names.js'].forEach(f => {
    new vm.Script(fs.readFileSync(path.join(srcDir, f), 'utf8'), { filename: f }).runInContext(sandbox);
  });
  const EN = sandbox.WM_I18N;
  EN.setLang('en');
  const jaI18n = global.WM_I18N;
  global.WM_I18N = EN;   // 派閥名の表示(_factionDisplayName)とログの整形は実行時の WM_I18N を読む
  try {
    const [L, A] = chars;
    VARIANTS.forEach(v => {
      const t = gameLogEntryText({ type: 'faction_dissolved', data: { variant: v, factionName: fname(L), leaderName: L.name, remainName: A.name }, s: 3, w: 10 });
      assert.ok(t && !JA_RE.test(t), `${v} EN に日本語: ${t}`);
      assert.ok(/Group/.test(t) && /disbanded/.test(t), `${v} EN: ${t}`);
      assert.ok(!DIGIT_RE.test(t) && !/[{}]/.test(t), `${v} EN: ${t}`);
    });
    const last = gameLogEntryText({ type: 'faction_dissolved', data: { variant: 'members_last', factionName: fname(L), leaderName: L.name, remainName: A.name } });
    assert.ok(last.includes(EN.pn(L.name)) && last.includes(EN.pn(A.name)), `EN に選手名が無い: ${last}`);
  } finally {
    global.WM_I18N = jaI18n;
  }
});

// tickWeek・commitRetirements は実際に進めた状態(seed42・2季目)に派閥を差し込んで通す
const base = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 6 && g.weekPhase === 'manage' && !g.offSeason });
const pool = base.roster.filter(c => !c.isRental && !c.injury);
const clean = (G) => { const x = { ...G }; delete x._pendingFactionEvent; delete x._pendingF09; delete x._pendingInternalChallenge; return x; };
function withStubs(fn) {
  const origPick = F.pickWeeklyEvent;
  const origMembers = F.processWeeklyMemberChanges;
  F.pickWeeklyEvent = () => ({ eventId: null });
  F.processWeeklyMemberChanges = (st) => st;
  try { return fn(); } finally { F.pickWeeklyEvent = origPick; F.processWeeklyMemberChanges = origMembers; }
}

section('6. tickWeek: 人数割れで消えた週に1行(抗争の決着「相手の派閥の消滅で終わった」より前)。記事は出さない', () => {
  const [a1, a2, b1, b2, b3] = pool;
  const G = clean({
    ...base,
    factions: [
      { id: 1, name: `${a1.surname || a1.name}派`, leaderId: a1.id, memberIds: [a1.id, a2.id], status: 'active', type: 'rivalrous', momentum: 10, createdSeason: 1, createdWeek: 5 },
      { id: 2, name: `${b1.surname || b1.name}派`, leaderId: b1.id, memberIds: [b1.id, b2.id, b3.id], status: 'active', type: 'rivalrous', momentum: 10, createdSeason: 1, createdWeek: 8 },
    ],
    factionHostility: { '1>2': 70, '2>1': 60 },
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: 30, pointsB: 40, startedSeason: 2, startedWeek: 1, naturalCalmStreak: 0 } },
    factionEventCooldowns: {}, factionTimeline: [],
  });
  const res = withStubs(() => Engine.tickWeek(G));
  assert.deepStrictEqual(res.state.factions.map(f => f.id), [2], '人数割れの派閥が消えていない(前提)');
  const logs = logsOf(res.events);
  assert.strictEqual(logs.length, 1, `ログの行数 ${logs.length}`);
  assert.deepStrictEqual(logs[0].data, { variant: 'members_last', factionName: G.factions[0].name, leaderName: a1.name, remainName: a2.name });
  assert.strictEqual(logs[0].s, 2);
  assert.strictEqual(logs[0].w, 6);
  const idxD = res.events.indexOf(logs[0]);
  const cons = logsOf(res.events, 'faction_rivalry_decided');
  assert.strictEqual(cons.length, 1, '抗争の決着(consolation)が出ない(前提)');
  assert.strictEqual(cons[0].data.variant, 'consolation');
  assert.ok(idxD < res.events.indexOf(cons[0]), '解散の行が抗争の決着の行より後');
  const np = res.state.weeklyNewspaper || {};
  const stories = [np.topStory, ...(np.subStories || [])].filter(Boolean);
  assert.ok(!stories.some(st => /faction(Dissolution|Dissolved)/.test(st.type || '')), '記事が出た');
  assert.ok(!(res.state._industryNewsEvents || []).some(e => /factionDissol/.test(e.type || '')), '記事がキューに積まれた');
  // 消える派閥が無い週は何も出ない
  const G2 = clean({ ...base, factions: [G.factions[1]], factionHostility: {}, factionRivalryPoints: {}, factionEventCooldowns: {}, factionTimeline: [] });
  const res2 = withStubs(() => Engine.tickWeek(G2));
  assert.strictEqual(logsOf(res2.events).length, 0);
});

section('7. tickWeek: 表示だけ — ログを組む関数が無くても state は1ビットも変わらない', () => {
  const [a1, a2] = pool;
  const G = clean({
    ...base,
    factions: [{ id: 1, name: `${a1.surname || a1.name}派`, leaderId: a1.id, memberIds: [a1.id, a2.id], status: 'active', type: 'loyal', momentum: 0, createdSeason: 1, createdWeek: 5 }],
    factionHostility: {}, factionRivalryPoints: {}, factionEventCooldowns: {}, factionTimeline: [],
  });
  const withLog = withStubs(() => Engine.tickWeek(G));
  const orig = F.buildDissolutionLogs;
  let without;
  try { F.buildDissolutionLogs = undefined; without = withStubs(() => Engine.tickWeek(G)); } finally { F.buildDissolutionLogs = orig; }
  assert.strictEqual(JSON.stringify(withLog.state), JSON.stringify(without.state), 'ログの有無で state が変わった');
  assert.strictEqual(logsOf(withLog.events).length, 1);
  assert.strictEqual(logsOf(without.events).length, 0);
  assert.deepStrictEqual(withLog.events.filter(e => !(e && e.type === 'faction_dissolved')), without.events, 'ほかのログが変わった');
});

section('8. 季末の引退の確定: 引退したリーダーの後継が立たず消えたら、引退の行の後に1行(leader)', () => {
  const [lead, m1, m2] = pool;
  const strong = { pw: 95, sp: 95, te: 95, st: 95, mn: 95 };
  const weak = { pw: 40, sp: 40, te: 40, st: 40, mn: 40 };
  const roster = base.roster.map(c => (c.id === lead.id ? { ...c, ...strong } : (c.id === m1.id || c.id === m2.id) ? { ...c, ...weak } : c));
  const G = clean({
    ...base, roster,
    factions: [{ id: 1, name: `${lead.surname || lead.name}派`, leaderId: lead.id, memberIds: [lead.id, m1.id, m2.id], status: 'active', type: 'loyal', momentum: 0, createdSeason: 1, createdWeek: 5 }],
    factionHostility: {}, factionRivalryPoints: {}, factionEventCooldowns: {}, factionTimeline: [],
  });
  const retiree = roster.find(c => c.id === lead.id);
  const r = Engine.retirement.commitRetirements(G, [retiree]);
  assert.strictEqual((r.state.factions || []).length, 0, '後継の立たない派閥が消えていない(前提)');
  const logs = logsOf(r.events);
  assert.strictEqual(logs.length, 1);
  assert.deepStrictEqual(logs[0].data, { variant: 'leader', factionName: G.factions[0].name });
  const iRetire = r.events.findIndex(e => typeof e === 'string' && e.includes(retiree.name) && e.includes('引退を表明'));
  assert.ok(iRetire >= 0 && iRetire < r.events.indexOf(logs[0]), '解散の行が引退の行より前');
  // 後継が立つ(派閥が残る)ときは出ない
  const G2 = clean({ ...G, roster: base.roster, factions: [{ ...G.factions[0] }] });
  const r2 = Engine.retirement.commitRetirements(G2, [base.roster.find(c => c.id === lead.id)]);
  if ((r2.state.factions || []).length === 1) assert.strictEqual(logsOf(r2.events).length, 0, '派閥が残ったのに行が出た');
});

section('9. 二重にしない: 社長の派閥解散命令(既存のログ「⚖️ 社長命令により…」)と F03 の結果では出さない', () => {
  const [a1, a2, a3] = pool;
  const G = clean({
    ...base,
    factions: [{ id: 1, name: `${a1.surname || a1.name}派`, leaderId: a1.id, memberIds: [a1.id, a2.id, a3.id], status: 'active', type: 'loyal', momentum: 20, createdSeason: 1, createdWeek: 5 }],
    factionHostility: {}, factionRivalryPoints: {}, factionEventCooldowns: {}, factionTimeline: [],
  });
  const dec = Engine.shachoshitsu.execute('faction_decree', null, G, { mode: 'dissolve' });
  assert.ok(!dec.error, dec.error);
  assert.ok((dec.events || []).some(e => typeof e === 'string' && e.startsWith('⚖️ 社長命令により')), '解散命令の既存のログが無い(前提)');
  assert.strictEqual(logsOf(dec.events).length, 0, '解散命令で解散のログが二重に出た');
  // F03(リーダー喪失の結果)は結果モーダル+記事。applyF03Result は events を返さず、tickWeek もその週の消滅判定を回さない
  const f03 = F.applyF03Result(G, { factionId: 1, branch: 'dissolution', oldLeaderName: a1.name }, Engine.rng.create(3));
  assert.strictEqual((f03.state.factions || []).length, 0);
  assert.ok(!('events' in f03), 'F03 の結果がログを返すようになった');
  const Gf03 = clean({ ...G, roster: G.roster.filter(c => c.id !== a1.id) });  // リーダー不在 → F03 が立つ週
  const res = Engine.tickWeek(Gf03);
  assert.ok(res.state._pendingFactionEvent && res.state._pendingFactionEvent.eventId === 'F03', 'F03 が立たない(前提)');
  assert.strictEqual(logsOf(res.events).length, 0, 'F03 の週に解散のログが出た');
});

if (failed > 0) {
  console.log(`\n${failed} section(s) FAILED`);
  process.exit(1);
}
console.log('\nALL PASS');
