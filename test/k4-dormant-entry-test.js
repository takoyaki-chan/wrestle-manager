'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S1: 休眠プールの入口(docs/fun-audit-v0.1/k4-separate-lives-design.md §6)
//
//  R1 休眠プールに入れてよいのは、まだデビューしていない見込み選手だけ
//  R2 デビュー済みの選手を手放すときは FA へ(上限なし・faSince)。Engine.util.releaseToMarket に一本化
//  R3 デビュー済みでFA入りが今季より前の選手は、オフ第1週に「フリーのまま引退」(記録・殿堂判定・新聞)
//  R4 FAの月次入れ替えで休眠プールへ戻すのは見込み選手だけ
//  R5 FA加齢の若返り(休眠プール行き)は見込み選手だけ
//  R6 休眠プールで21歳を超えた子は、引退枠を経ずにその場で17〜19歳へ戻る
//
//  WM_TEST_SRC_DIR で読み込む src を差し替えられる(変更前のコードで落ちることの確認用)。
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach(k => { out = out.split('{' + k + '}').join(params[k]); });
  return out;
}, pn(s) { return s; }, pnSurname(s) { return s; }, mv(s) { return s; }, mvShort(s) { return s; } };

const srcDir = process.env.WM_TEST_SRC_DIR || path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n${e.stack}`); process.exitCode = 1; }
}
function withStub(obj, key, impl, fn) {
  const orig = obj[key];
  obj[key] = impl;
  try { return fn(); } finally { obj[key] = orig; }
}

const TPL = id => ALL_CHARS.find(c => c.id === id);
const IDS = ALL_CHARS.map(c => c.id);
function mk(id, extra = {}) {
  const t = TPL(id) || ALL_CHARS[0];
  return {
    id, name: t.name, age: 22, pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    notionValue: { pw: 60, sp: 60, te: 60, st: 60, mn: 60 }, pot: { pw: 90, sp: 90, te: 90, st: 90, mn: 90 },
    trainCap: { pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
    style: t.style, traits: [], personality: 'normal', archetype: 'standard', popularity: 30, trust: 50,
    careerStage: 'active', careerSeasons: 3, careerRecord: Engine.career.createRecord(),
    orgTimeline: [{ orgId: 'org_s', fromSeason: 1, fromWeek: 1 }], orgId: 'org_s',
    ...extra,
  };
}
const prospect = (id, extra = {}) => mk(id, { careerStage: 'prospect', careerSeasons: 0, orgId: null,
  orgTimeline: [{ orgId: 'fa', fromSeason: 1, fromWeek: 1 }], ...extra });
const fullFA = (ids) => ids.map(id => prospect(id, { age: 19 }));
const inDormant = (s, id) => (s.dormantPool || []).some(e => Number(e.id) === id);
const inFA = (s, id) => (s.freeAgents || []).find(f => Number(f.id) === id) || null;

// 使うIDを散らしておく(実在IDで作る = テンプレ参照のある処理にも耐える)
const [A1, A2, A3, A4, A5, A6, A7, A8] = IDS.slice(0, 8);
const FA_IDS = IDS.slice(100, 100 + ROSTER_CFG.fa);

console.log('k4-dormant-entry-test');

// ── R1/R2 の土台 ──
test('releaseToMarket: デビュー済みは FA が満杯でも FA へ(faSince・faFromOrgId)', () => {
  assert.strictEqual(typeof Engine.util.releaseToMarket, 'function', 'Engine.util.releaseToMarket がある');
  const s0 = { season: 7, week: 20, freeAgents: fullFA(FA_IDS), dormantPool: [] };
  const s1 = Engine.util.releaseToMarket(s0, mk(A1), 'org_a');
  const f = inFA(s1, A1);
  assert.ok(f, 'FA に入る');
  assert.strictEqual(f.faSince, 7);
  assert.strictEqual(f.faFromOrgId, 'org_a');
  assert.strictEqual(inDormant(s1, A1), false, '休眠プールに入らない');
  assert.strictEqual(s1.freeAgents.length, ROSTER_CFG.fa + 1, 'デビュー済みにFA上限は掛からない');
  assert.strictEqual(s0.freeAgents.length, ROSTER_CFG.fa, '入力は書き換えない');
});
test('releaseToMarket: 見込み選手は FA 上限の内なら FA・超えたら休眠プール(従来どおり)', () => {
  const full = Engine.util.releaseToMarket({ season: 7, freeAgents: fullFA(FA_IDS), dormantPool: [] }, prospect(A2));
  assert.ok(inDormant(full, A2) && !inFA(full, A2), '満杯なら休眠プール');
  const room = Engine.util.releaseToMarket({ season: 7, freeAgents: [], dormantPool: [] }, prospect(A2));
  assert.ok(inFA(room, A2) && !inDormant(room, A2), '空きがあれば FA');
  assert.strictEqual(inFA(room, A2).faSince, undefined, '見込み選手には faSince を付けない');
});
test('hasDebuted: prospect で debutSeason が無い子だけが未デビュー', () => {
  assert.strictEqual(Engine.life.hasDebuted(prospect(A1)), false);
  assert.strictEqual(Engine.life.hasDebuted(prospect(A1, { debutSeason: 3 })), true);
  assert.strictEqual(Engine.life.hasDebuted(mk(A1)), true);
});

// ── B3: AI団体の契約退団 / 世代交代の放出 ──
test('processAIContracts: デビュー済みの契約退団は FA 満杯でも FA へ', () => {
  const origF = Engine.rng.float, origI = Engine.rng.int;
  Engine.rng.float = (() => { const r = [0.0, 0.6]; return () => (r.length ? r.shift() : 0.0); })();
  Engine.rng.int = () => 0;
  try {
    const dep = mk(A1, { trust: 5, age: 27 });
    const roster = [dep, ...[A2, A3, A4, A5, A6].map(id => mk(id, { trust: 80 }))];
    const state = { season: 3, aiOrgs: { org_s: { roster: roster.map(f => ({ ...f })), titles: {} } },
      freeAgents: fullFA(FA_IDS), dormantPool: [], relationships: {} };
    const r = Engine.rival.processAIContracts({}, roster.map(f => ({ ...f })), 'org_s', 'S', state);
    assert.strictEqual(r.departures.length, 1);
    assert.strictEqual(r.departures[0].destination, 'fa');
    assert.ok(inFA(state, A1) && !inDormant(state, A1));
  } finally { Engine.rng.float = origF; Engine.rng.int = origI; }
});
test('applyExtraTurnover: 世代交代の放出(デビュー済み)は FA 満杯でも FA へ', () => {
  const roster = IDS.slice(10, 22).map((id, i) => mk(id, {
    pw: 50 + i, sp: 50 + i, te: 50 + i, st: 50 + i, mn: 50 + i,
    trainCap: { pw: 60 + i, sp: 60 + i, te: 60 + i, st: 60 + i, mn: 60 + i } }));
  const state = { season: 4, freeAgents: fullFA(FA_IDS), dormantPool: [], relationships: {} };
  const out = withStub(Engine.rng, 'int', (rng, lo, hi) => hi, () =>
    Engine.rival.applyExtraTurnover({}, roster, 'org_s', 'S', state));
  assert.ok(out.released.length >= 1, '放出が起きる');
  out.released.forEach(f => {
    assert.ok(inFA(state, f.id), `${f.id} は FA`);
    assert.strictEqual(inDormant(state, f.id), false, `${f.id} は休眠プールに入らない`);
  });
});

// ── B4: AIの戦力外(解雇)・受け入れ時の押し出し ──
test('aiMidseasonFAAcquire: 戦力外(デビュー済み)は遺恨を持ったまま FA へ', () => {
  const idealS = AI_SCOUT_CFG.S.idealRoster;
  const sRoster = IDS.slice(30, 30 + idealS).map((id, i) => mk(id, { pw: 40 + i, sp: 40 + i, te: 40 + i, st: 40 + i, mn: 40 + i }));
  const worst = sRoster[0];
  const star = prospect(IDS[70], { pw: 90, sp: 90, te: 90, st: 90, mn: 90, pot: { pw: 100, sp: 100, te: 100, st: 100, mn: 100 } });
  const fa = [star, ...IDS.slice(71, 71 + ROSTER_CFG.fa - 1).map(id => prospect(id, { age: 19 }))];
  const state = { rngSeed: 5, season: 6, week: 8, relationships: {}, roster: [],
    aiOrgs: { org_s: { roster: sRoster }, org_a: { roster: [] }, org_b: { roster: [] } },
    freeAgents: fa, dormantPool: [] };
  const out = withStub(Engine.rng, 'float', () => 0, () => Engine.rival.aiMidseasonFAAcquire({}, state));
  assert.ok(!out.aiOrgs.org_s.roster.some(f => f.id === worst.id), '最弱が外れる');
  const f = out.freeAgents.find(x => x.id === worst.id);
  assert.ok(f, '戦力外は FA へ');
  assert.strictEqual(f.faFromOrgId, 'org_s');
  assert.strictEqual(out.dormantPool.some(e => e.id === worst.id), false, '休眠プールに入らない');
});
test('claimDepartedStar: 押し出された選手(デビュー済み)は FA へ', () => {
  const mkOrg = (base, n, ovr, org) => Array.from({ length: n }, (_, i) =>
    mk(IDS[base + i], { orgId: org, orgTimeline: [{ orgId: org, fromSeason: 1, fromWeek: 1 }],
      pw: ovr + i, sp: ovr + i, te: ovr + i, st: ovr + i, mn: ovr + i }));
  const state = { rngSeed: 123, season: 3, week: 6, roster: [], freeAgents: fullFA(FA_IDS), dormantPool: [],
    aiOrgs: { org_s: { roster: mkOrg(20, AI_SCOUT_CFG.S.idealRoster, 40, 'org_s') },
      org_a: { roster: mkOrg(40, AI_SCOUT_CFG.A.idealRoster, 38, 'org_a') },
      org_b: { roster: mkOrg(60, AI_SCOUT_CFG.B.idealRoster, 35, 'org_b') } } };
  const starF = mk(A7, { pw: 80, sp: 80, te: 80, st: 80, mn: 80, orgId: 'player', orgTimeline: [{ orgId: 'player', fromSeason: 1, fromWeek: 1 }] });
  const r = Engine.rival.claimDepartedStar(Engine.rng.create(1), state, starF);
  assert.ok(r.claimed && r.ejected, '引き取られ、最弱が押し出される');
  assert.ok(inFA(r.state, r.ejected.id), '押し出された選手は FA');
  assert.strictEqual(inDormant(r.state, r.ejected.id), false);
});

// ── B5: レンタル帰還 ──
test('processWeeklyRental: FAから借りたデビュー済みの選手は FA 満杯でも FA へ戻る', () => {
  const rentalF = mk(A3, { isRental: true, rentalSource: 'fa', rentalWeeksLeft: 1, orgId: null });
  const state = { rngSeed: 9, season: 5, week: 10, roster: [rentalF], aiOrgs: {}, relationships: {},
    rentals: [{ fighterId: A3, fromSource: 'fa', fromOrgId: null, weeksLeft: 1 }],
    freeAgents: fullFA(FA_IDS), dormantPool: [] };
  const r = Engine.rental.processWeeklyRental(state);
  assert.ok(inFA(r.state, A3), 'FA に戻る');
  assert.strictEqual(inDormant(r.state, A3), false);
  const pState = { ...state, roster: [prospect(A3, { isRental: true, rentalSource: 'fa', rentalWeeksLeft: 1 })] };
  const p = Engine.rental.processWeeklyRental(pState);
  assert.ok(inDormant(p.state, A3) && !inFA(p.state, A3), '見込み選手は従来どおり休眠プールへ');
});

// ── B6: 自団体の突然の退団・契約退団(エンジン側) ──
function baseState(seed) {
  const s = Engine.createInitialState(seed || 4242, true);
  // 今の FA に引退枠のIDを足して FA を満杯(ROSTER_CFG.fa)にする(ID の重複を作らない)
  const oldFA = (s.freeAgents || []).map(f => f.id);
  const need = Math.max(0, ROSTER_CFG.fa - oldFA.length);
  const fromRetired = (s.retiredIds || []).slice(0, need);
  const pick = [...oldFA, ...fromRetired];
  assert.strictEqual(pick.length, ROSTER_CFG.fa, 'FA を満杯にできる');
  const retiredSeasons = { ...(s.retiredSeasons || {}) };
  fromRetired.forEach(id => { delete retiredSeasons[id]; });
  return { ...s, freeAgents: fullFA(pick), retiredIds: (s.retiredIds || []).filter(id => !fromRetired.includes(id)), retiredSeasons };
}
test('applySuddenDepartures: 突然の退団(FA行き)は FA 満杯でも FA へ', () => {
  const s0 = baseState(11);
  const leaver = s0.roster[0];
  const rest = s0.roster.slice(1);
  const out = withStub(Engine.trust, 'checkSuddenDepartures', () => ({
    departed: [{ fighter: leaver, name: leaver.name, destination: 'freeAgent' }], roster: rest, lockerRoomMorale: 50 }),
  () => withStub(Engine.rival, 'claimDepartedStar', (rng, st) => ({ state: st, claimed: false }),
    () => Engine.show.applySuddenDepartures(s0)));
  const f = inFA(out.state, leaver.id);
  assert.ok(f, 'FA へ');
  assert.strictEqual(f.faFromOrgId, 'player');
  assert.strictEqual(inDormant(out.state, leaver.id), false);
});
test('processDeparture(freeAgent): 自団体の契約退団は FA 満杯でも FA へ', () => {
  const s0 = baseState(12);
  const leaver = s0.roster[1];
  const out = withStub(Engine.contract, 'determineDeparture', () => ({ type: 'freeAgent' }),
    () => withStub(Engine.rival, 'claimDepartedStar', (rng, st) => ({ state: st, claimed: false }),
      () => Engine.contract.processDeparture(Engine.rng.create(1), leaver, s0, 'contractEnd')));
  assert.ok(inFA(out.state, leaver.id), 'FA へ');
  assert.strictEqual(inDormant(out.state, leaver.id), false);
});

// ── R4: FAの月次入れ替え ──
test('R4: FA の月次入れ替えで休眠プールへ戻るのは見込み選手だけ', () => {
  const s0 = baseState(13);
  const debutedIds = s0.freeAgents.slice(0, 6).map(f => f.id);
  const state = { ...s0, week: 4, weekPhase: 'manage',
    freeAgents: s0.freeAgents.map((f, i) => (i < 6 ? mk(f.id, { orgId: null, faSince: 1, faFromOrgId: 'org_b', age: 24 }) : f)) };
  const out = Engine.tickWeek(state).state;
  debutedIds.forEach(id => assert.strictEqual(inDormant(out, id), false, `デビュー済みFA ${id} は休眠プールへ戻らない`));
  const newlyDormant = (out.dormantPool || []).map(e => e.id).filter(id => !inDormant(state, id));
  newlyDormant.forEach(id => assert.ok(!debutedIds.includes(id)));
});

// ── R3/R5/R6: オフ第1週 ──
test('R3/R5/R6: オフ第1週の FA 加齢・フリーのまま引退・休眠プールの若返り', () => {
  const s0 = baseState(14);
  const season = 5;
  const ids = s0.freeAgents.map(f => f.id);
  const [dOld, dNew, dLegacy, dAged, pOld] = ids;
  const fa = [
    mk(dOld, { orgId: null, faSince: season - 1, faFromOrgId: 'org_a', age: 20 }),
    mk(dNew, { orgId: null, faSince: season, faFromOrgId: 'org_b', age: 20 }),
    mk(dLegacy, { orgId: null, age: 20 }),                                   // 旧セーブ: faSince 無し
    mk(dAged, { orgId: null, faSince: season, faFromOrgId: 'org_s', age: 31 }), // 22歳超でも若返らない
    prospect(pOld, { age: 23 }),                                              // 見込み選手の22歳超は休眠プールへ
    ...s0.freeAgents.slice(5),
  ];
  const poolOld = IDS.find(id => !ids.includes(id) && !s0.roster.some(f => f.id === id)
    && !Object.values(s0.aiOrgs).some(o => o.roster.some(f => f.id === id)) && !(s0.dormantPool || []).some(e => e.id === id));
  const state = { ...s0, season, offSeason: true, offWeek: 0, weekPhase: 'offseason', freeAgents: fa,
    dormantPool: [...(s0.dormantPool || []).filter(e => e.id !== poolOld), { id: poolOld, age: 21 }],
    retiredIds: (s0.retiredIds || []).filter(id => id !== poolOld) };
  const out = Engine.advanceWeek(state).state;
  // R3
  assert.strictEqual(inFA(out, dOld), null, '丸1季拾われなかったデビュー済みFAは引退');
  assert.ok((out.retiredIds || []).includes(dOld), '引退枠に入る');
  assert.strictEqual(out.retiredSeasons[dOld], season);
  const aNews = ((out.aiOrgs.org_a || {})._newsRetirements || []).find(e => e.id === dOld);
  assert.ok(aNews, '最後に所属した団体の引退記事として積まれる');
  assert.ok(inFA(out, dNew), '今季FA入りはまだ残る');
  assert.strictEqual(inFA(out, dLegacy).faSince, season, 'faSince の無い旧データは今季を刻んで残す');
  // R5
  assert.ok(inFA(out, dAged), 'デビュー済みの22歳超は若返らず FA に残る');
  assert.strictEqual(inDormant(out, dAged), false);
  assert.ok(inDormant(out, pOld) && !inFA(out, pOld), '見込み選手の22歳超は休眠プールへ');
  // R6
  const pe = (out.dormantPool || []).find(e => e.id === poolOld);
  assert.ok(pe, '21歳超の休眠プールの子は引退枠へ行かずプールに残る');
  assert.ok(pe.age >= 17 && pe.age <= 19, `17〜19歳に戻る(${pe.age})`);
  assert.strictEqual((out.retiredIds || []).includes(poolOld), false);
});

test('R3: 1季後の引退(faSince=S は S のオフでは残り、S+1 のオフで引退)・自団体OGは player の欄と記事', () => {
  const hofRec = Engine.career.createRecord();
  hofRec.history = [1, 2, 3, 4].map(s => ({ type: 'juniorTournament', result: 'champion', season: s }));
  const og = mk(A8, { orgId: null, faSince: 6, faFromOrgId: 'player', age: 26, careerRecord: hofRec,
    orgTimeline: [{ orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 6, toWeek: 20 }, { orgId: 'fa', fromSeason: 6, fromWeek: 20 }] });
  const base = { rngSeed: 3, season: 6, week: 1, orgName: 'テスト団体', freeAgents: [og], retiredIds: [], retiredSeasons: {},
    allHallOfFame: { player: [], org_s: [], org_a: [], org_b: [] }, hallOfFame: [], aiOrgs: {} };
  const same = Engine.util.retireUnsignedFreeAgents(base);
  assert.strictEqual(same.retired.length, 0, 'FA入りした季のオフでは引退しない');
  const next = Engine.util.retireUnsignedFreeAgents({ ...base, season: 7 });
  assert.strictEqual(next.retired.length, 1, '翌季のオフで引退');
  const r = next.retired[0];
  assert.strictEqual(r.lastOrgId, 'player');
  assert.ok(r.hofJudged && r.inducted && r.newsQueued);
  assert.ok(next.state.allHallOfFame.player.some(h => h.id === A8), '殿堂は自団体の欄');
  assert.strictEqual(next.state.hallOfFame, next.state.allHallOfFame.player);
  const ev = (next.state._industryNewsEvents || []).find(e => e.type === 'retirementDeclare' && e.characterId === A8);
  assert.ok(ev && ev.data.retiredSeason === 7 && ev.data.org === 'テスト団体', '自団体OGは引退記事(前所属=自団体)');
  assert.strictEqual(next.state.freeAgents.length, 0, 'FA から抜ける');
  assert.ok((next.state.retiredIds || []).includes(A8) && next.state.retiredSeasons[A8] === 7, '引退枠に入る');
});

// ── 置き換えの取りこぼし(静的): 手放す経路に休眠プール直行が残っていない ──
test('静的: 手放す経路は releaseToMarket を通る(redirectToDormantPool / canAddToFA の直呼びが残っていない)', () => {
  const app = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
  const mgmt = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  assert.strictEqual((app.match(/redirectToDormantPool\(/g) || []).length, 0, 'app.js に redirectToDormantPool の直呼びが無い');
  assert.strictEqual((app.match(/canAddToFA\(/g) || []).length, 0, 'app.js に canAddToFA の直呼びが無い');
  assert.strictEqual((app.match(/releaseToMarket\(/g) || []).length, 3, 'app.js の3経路(放出・解雇・イベント退団)');
  // management.js: redirectToDormantPool は定義と releaseToMarket の中だけ
  assert.strictEqual((mgmt.match(/redirectToDormantPool\(/g) || []).length, 2);
  // FA上限の直判定は marketDestination の中だけ(+定義)
  assert.strictEqual((mgmt.match(/canAddToFA\(/g) || []).length, 2);
  ['dormantPool.push({ id: firedFighter.id', 'dormantPool.push({ id: ejected.id', 'pool.push({ id: dep.id',
    'pool.push({ id: cleanFWithHist.id'].forEach(snip => assert.ok(!mgmt.includes(snip), `残っていない: ${snip}`));
});

console.log(`k4-dormant-entry-test: ${passed} passed${process.exitCode ? ' (FAILED)' : ''}`);
