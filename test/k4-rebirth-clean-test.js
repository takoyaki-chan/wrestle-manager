'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S3: 転生の関所 closeLiveRecords(docs/fun-audit-v0.1/k4-separate-lives-design.md §3-A)
//
//  (1) 合成状態: §3-A の19の保存先(+実装時に見つけた2つ)すべてに転生するID(55)と他のIDを置き、
//      Engine.life.beginNewLife を呼ぶ →
//      - 21の保存先に 55 への参照が残っていない(検査側の物差し test/helpers/k4-live-stores.js)
//      - 他IDの項目は無傷(55 を含まない項目は前後で同一)
//      - 意味のある関係(対戦1回以上・競争意識20以上・絆が50から±10以上・因縁の段位あり)だけが
//        relationshipHistory.retiredRivalries に1組1件で退避される(reason 'lifeEnd'・lives・h2h の要約)
//      - 入力は書き換えない
//  (2) 実際の状態(新規ゲーム+16週)で、状態全体を走査し、恒久記録以外に 55 相当のIDへの
//      ペアキー・ID欄が残っていないこと(表に載っていない保存先の見落とし検出)
//  (3) 年代記の2つの読み手が、退避した対戦の要約(bySeason)を章の季の窓で数えること
//
//  WM_TEST_SRC_DIR で読み込む src を差し替えられる(変更前のコードで落ちることの確認用)。
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { findLiveRefs, LIVE_STORES, itemHasId, glimpseKeyHas } = require('./helpers/k4-live-stores');

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
const clone = v => JSON.parse(JSON.stringify(v));

const X = 55;
const h2hRec = (hist, extra = {}) => ({
  matches: hist.length, winsA: hist.filter(h => h.win === 'A').length, winsB: hist.filter(h => h.win === 'B').length,
  draws: hist.filter(h => h.win === 'd').length, bestMQ: Math.max(0, ...hist.map(h => h.mq || 0)),
  hadTitleMatch: hist.some(h => h.t), hadPPV: hist.some(h => h.p),
  lastMatch: hist.length ? { season: hist[hist.length - 1].s, week: hist[hist.length - 1].w } : undefined,
  history: hist, ...extra,
});

function syntheticState() {
  return {
    season: 10, week: 1, offSeason: true, offWeek: 1,
    lifeSerial: { [X]: 1, 3: 2 },
    roster: [{ id: 3, name: 'A', age: 24 }, { id: 7, name: 'B', age: 21 }],
    aiOrgs: {
      org_s: { roster: [{ id: 90, name: 'D', age: 29 }, { id: 12, name: 'C', age: 26 }],
        matchupLog: [{ leftId: X, rightId: 90, showCount: 1 }, { leftId: 90, rightId: 12, showCount: 2 }],
        coachAssign: { 1: [X, 90], 2: [12] } },
      org_a: { roster: [{ id: 5, name: 'E' }, { id: 550, name: 'F' }], matchupLog: [{ leftId: 5, rightId: 550, showCount: 1 }] },
    },
    freeAgents: [], scoutCandidates: [],
    dormantPool: [{ id: X, age: 17, grudge: { vsOrgId: 'org_s' } }, { id: 7 + 1000, age: 18 }],
    relationships: {
      [`${X}>3`]: { bond: 70, rivalry: 10 }, [`3>${X}`]: { bond: 45, rivalry: 25 },
      [`${X}>7`]: { bond: 50, rivalry: 0 }, [`7>${X}`]: { bond: 51, rivalry: 3 },
      [`${X}>12`]: { bond: 52, rivalry: 5 }, [`12>${X}`]: { bond: 50, rivalry: 0 },
      [`${X}>90`]: { bond: 50, rivalry: 2 }, [`90>${X}`]: { bond: 50, rivalry: 1 },
      '5>550': { bond: 60, rivalry: 0 }, '550>5': { bond: 58, rivalry: 0 },
      '155>3': { bond: 40, rivalry: 0 }, '3>155': { bond: 44, rivalry: 0 }, '3>7': { bond: 66, rivalry: 12 },
    },
    relationshipCounters: { [`${X}>3:match:normal`]: { count: 2 }, [`3>${X}:match:normal`]: { count: 2 },
      '5>550:match:normal': { count: 1 }, '155>3:match:normal': { count: 1 } },
    relationshipFlags: {
      betrayer: [{ targetId: X, byIds: [3, 7] }, { targetId: 12, byIds: [X, 3] }, { targetId: 90, byIds: [X] }, { targetId: 5, byIds: [550] }],
      returner: [{ fighterId: X, returnedSeason: 4 }, { fighterId: 7, returnedSeason: 5 }],
      master: [{ masterId: X, discipleId: 3 }, { masterId: 3, discipleId: 7 }],
      cohort: [{ idA: X, idB: 12 }, { idA: 3, idB: 7 }],
      rivalCohort: [{ idA: 90, idB: X }],
      admire: [{ fromId: 3, toId: X }, { fromId: 3, toId: 7 }],
      envy: [{ fromId: X, toId: 7 }],
    },
    relationshipFlagLockouts: { [`master:${X}>3`]: true, [`admire:3>${X}`]: true, 'master:3>7': true, 'master:5>550': true },
    relationshipFlagCounters: { [`modal:M19:${X}>3`]: { lastWeek: 1 }, [`admireDraws:3>${X}`]: 2, [`masterCandidate:${X}>7`]: 1,
      'modal:M55:3>7': { lastWeek: 4 }, 'modal:M19:5>550': { lastWeek: 3 } },
    givenNameCalls: { [`${X}>3`]: true, [`3>${X}`]: true, '3>7': true },
    rivalries: { [`3-${X}`]: { matches: 3, lastBand: 1, resolutionCount: 0 }, [`${X}-90`]: { matches: 1, lastBand: 2, resolutionCount: 0 },
      '3-7': { matches: 2, lastBand: 1, resolutionCount: 1 } },
    h2h: {
      [`3>${X}`]: h2hRec([{ s: 2, w: 4, win: 'A', mq: 40 }, { s: 2, w: 10, win: 'B', mq: 62, t: 1 }, { s: 3, w: 6, win: 'A', mq: 51 }, { s: 5, w: 20, win: 'd', mq: 30, p: 1 }]),
      [`12>${X}`]: h2hRec([{ s: 6, w: 2, win: 'B', mq: 44 }]),
      '3>7': h2hRec([{ s: 8, w: 3, win: 'A', mq: 50 }]),
      '5>550': h2hRec([{ s: 9, w: 3, win: 'B', mq: 35 }]),
    },
    matchupLog: [{ leftId: X, rightId: 3, showCount: 2 }, { leftId: 3, rightId: 7, showCount: 1 }, { leftId: 12, rightId: X, showCount: 1 }],
    tagExp: { [`${X}>3`]: 4, [`3>${X}`]: 4, '3>7': 2 },
    popOvertakeTriggered: { [`${X}>3`]: true, [`7>${X}`]: true, '3>7': true },
    w1FireCount: { [`3_${X}`]: 2, [`${X}_90`]: 1, '3_7': 5, '5_550': 1 },
    _contagionLastWeek: { [`${X}>3`]: 100, '3>7': 90 },
    n06CooldownWeeks: { [`3>${X}`]: 120, '3>7': 80 },
    _glimpseAPrevValues: { [`${X}>3`]: { bond: 70, rivalry: 10 }, [`3>${X}`]: { bond: 45, rivalry: 25 }, '3>7': { bond: 66, rivalry: 12 } },
    _snapshotCooldowns: { [`pair_3_${X}`]: 500, [`fighter_${X}`]: 400, 'pair_3_7': 300, 'fighter_550': 200, 'pair_5_550': 100 },
    newsSeen: { injury: { [X]: 3, 7: 2 }, streak: { [X]: -5, 3: 5 }, org: { [X]: 'org_s', 3: 'player' },
      retired: { [X]: 1, 12: 1 }, followUp: { [X]: 300, 7: 200 } },
    coachAssign: { c1: [X, 3], c2: [7] },
    _glimpseAFired: { [`bond_39_down_${X}_3`]: true, [`rivalry_30_up_3_${X}`]: true, [`trust_trust_20_down_${X}`]: true,
      'bond_39_down_3_7': true, 'rivalry_30_up_5_550': true, 'trust_trust_20_down_550': true },
    _glimpseACooldowns: { [`bond_39_down_${X}_3`]: 10, 'bond_39_down_3_7': 11 },
    relationshipHistory: { betrayalRecord: [{ departerId: 12 }], retiredRivalries: [{ id1: 3, id2: 7, reason: 'retirement', retiredFighterId: 7 }] },
    allHallOfFame: { player: [{ id: X, name: 'X' }], org_s: [], org_a: [], org_b: [] },
  };
}

// 保存先ごとに「55 を含まない部分」を取り出す(他IDが無傷かの比較用)
const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const keyIds = k => String(k).split(/[^0-9]+/).filter(Boolean).map(Number);
function otherPart(state, name) {
  const pick = (obj, hasX) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !hasX(k)));
  const arrow = k => { const s = String(k); const seg = s.includes(':') ? (/^\d+>\d+:/.test(s) ? s.split(':')[0] : s.split(':').pop()) : s; return seg.split('>').map(toNum).includes(X); };
  switch (name) {
    case 'relationshipFlags': return Object.fromEntries(Object.entries(state.relationshipFlags || {}).map(([k, arr]) => [k, (arr || []).filter(it => !itemHasId(it, X))]));
    case 'matchupLog': return (state.matchupLog || []).filter(e => e.leftId !== X && e.rightId !== X);
    case 'aiOrgs.matchupLog': return Object.fromEntries(Object.entries(state.aiOrgs || {}).map(([k, o]) => [k, (o.matchupLog || []).filter(e => e.leftId !== X && e.rightId !== X)]));
    case 'rivalries': return pick(state.rivalries, k => k.split('-').map(toNum).includes(X));
    case 'w1FireCount': return pick(state.w1FireCount, k => k.split('_').map(toNum).includes(X));
    case '_snapshotCooldowns': return pick(state._snapshotCooldowns, k => k.split('_').slice(1).map(toNum).includes(X));
    case 'newsSeen': return Object.fromEntries(Object.entries(state.newsSeen || {}).map(([k, m]) => [k, pick(m, kk => toNum(kk) === X)]));
    case 'coachAssign': return { player: Object.fromEntries(Object.entries(state.coachAssign || {}).map(([c, l]) => [c, l.filter(i => i !== X)])),
      ai: Object.fromEntries(Object.entries(state.aiOrgs || {}).map(([k, o]) => [k, Object.fromEntries(Object.entries(o.coachAssign || {}).map(([c, l]) => [c, l.filter(i => i !== X)]))])) };
    case '_glimpseAFired': case '_glimpseACooldowns': return pick(state[name], k => glimpseKeyHas(k, X));
    default: return pick(state[name], arrow);
  }
}

console.log('k4-rebirth-clean-test');

test('合成状態: 21の保存先から転生したIDの記録が消え、他IDは無傷', () => {
  const s0 = syntheticState();
  const before = clone(s0);
  assert.strictEqual(typeof Engine.life.closeLiveRecords, 'function', 'Engine.life.closeLiveRecords がある');
  const refs0 = findLiveRefs(s0, X);
  assert.strictEqual(Object.keys(refs0).length, LIVE_STORES.length, `全保存先に置けている: ${Object.keys(refs0).join(',')}`);
  const out = Engine.life.beginNewLife(s0, X);
  assert.deepStrictEqual(findLiveRefs(out, X), {}, '転生したIDへの参照が残っていない');
  assert.deepStrictEqual(s0, before, '入力は書き換えない');
  LIVE_STORES.forEach(([name]) => {
    if (name === 'relationshipFlags') return; // 下で個別に
    assert.deepStrictEqual(otherPart(out, name), otherPart(before, name), `${name}: 他IDの項目は無傷`);
  });
  assert.strictEqual(out.lifeSerial[X], 2, '人生番号が進む');
  assert.strictEqual(out.lifeSerial[3], 2, '他IDの番号は変わらない');
  // 関係フラグ: 55 が当事者の項目は消え、55 が「裏切られた側」の一人なら 55 だけ外す
  const f = out.relationshipFlags;
  assert.deepStrictEqual(f.betrayer, [{ targetId: 12, byIds: [3] }, { targetId: 5, byIds: [550] }]);
  assert.deepStrictEqual(f.returner, [{ fighterId: 7, returnedSeason: 5 }]);
  assert.deepStrictEqual(f.master, [{ masterId: 3, discipleId: 7 }]);
  assert.deepStrictEqual(f.cohort, [{ idA: 3, idB: 7 }]);
  assert.deepStrictEqual(f.rivalCohort, []);
  assert.deepStrictEqual(f.admire, [{ fromId: 3, toId: 7 }]);
  assert.deepStrictEqual(f.envy, []);
  // 休眠プールの遺恨は落とす(誰も読まないが念のため)
  const pe = out.dormantPool.find(e => e.id === X);
  assert.ok(pe && pe.grudge === undefined, '休眠プールの項目から grudge を落とす');
  assert.deepStrictEqual(out.dormantPool.find(e => e.id === 1007), { id: 1007, age: 18 });
  // 恒久記録には触れない
  assert.deepStrictEqual(out.allHallOfFame, before.allHallOfFame);
  assert.deepStrictEqual(out.relationshipHistory.betrayalRecord, before.relationshipHistory.betrayalRecord);
});

test('合成状態: 意味のある関係だけを retiredRivalries に1組1件で退避(lifeEnd・lives・h2h の要約)', () => {
  const out = Engine.life.beginNewLife(syntheticState(), X);
  const rr = out.relationshipHistory.retiredRivalries;
  assert.deepStrictEqual(rr[0], { id1: 3, id2: 7, reason: 'retirement', retiredFighterId: 7 }, '既存の退避は無傷');
  const life = rr.filter(e => e.reason === 'lifeEnd');
  const pairs = life.map(e => [e.id1, e.id2].join('-')).sort();
  assert.deepStrictEqual(pairs, [`12-${X}`, `3-${X}`, `${X}-90`], '絆70の3・対戦1回の12・因縁の段位の90。7(ほぼ初期値)は退避しない');
  life.forEach(e => {
    assert.strictEqual(e.retiredFighterId, X);
    assert.strictEqual(e.lives[X], 1, '終わった人生の番号');
    assert.ok(e.season === 10, '退避した季');
  });
  const e3 = life.find(e => e.id1 === 3);
  assert.strictEqual(e3.lives[3], 2, '相手の今の人生の番号');
  assert.strictEqual(e3.bond12, 45); assert.strictEqual(e3.bond21, 70);
  assert.strictEqual(e3.rivalry12, 25); assert.strictEqual(e3.rivalry21, 10);
  assert.deepStrictEqual(e3.rivalryMeta, { matches: 3, lastBand: 1, resolutionCount: 0 });
  const h = e3.h2h;
  assert.ok(h, 'h2h の要約');
  assert.strictEqual(h.aId, 3);
  assert.strictEqual(h.matches, 4); assert.strictEqual(h.winsA, 2); assert.strictEqual(h.winsB, 1); assert.strictEqual(h.draws, 1);
  assert.strictEqual(h.bestMQ, 62); assert.strictEqual(h.hadTitleMatch, true); assert.strictEqual(h.hadPPV, true);
  assert.strictEqual(h.firstSeason, 2); assert.strictEqual(h.lastSeason, 5);
  assert.deepStrictEqual(h.bySeason, { 2: 2, 3: 1, 5: 1 });
  assert.strictEqual(h.history, undefined, '全履歴は持たない(セーブの肥大を防ぐ)');
  const e90 = life.find(e => e.id2 === 90);
  assert.strictEqual(e90.h2h, null, '対戦の無い組は h2h の要約なし');
  assert.strictEqual(e90.rivalryMeta.lastBand, 2);
});

test('関所を2度通しても記録が増えない(2度目は何も残っていない)', () => {
  const once = Engine.life.beginNewLife(syntheticState(), X);
  const n = once.relationshipHistory.retiredRivalries.length;
  const twice = Engine.life.closeLiveRecords(once, X);
  assert.strictEqual(twice.relationshipHistory.retiredRivalries.length, n);
});

// ── (2) 実際の状態で状態全体を走査 ──
// 恒久記録(人生番号で分ける S4 以降の対象)と選手オブジェクト(人生ごとに作り直される)は走査しない
const PERMANENT_ROOTS = new Set(['roster', 'freeAgents', 'scoutCandidates', 'retiredFighters', 'dormantPool', 'retiredIds',
  'retiredSeasons', 'lifeSerial', 'relationshipHistory', 'allHallOfFame', 'hallOfFame', 'chronicle', 'prologue',
  'newspaperArchive', 'weeklyNewspaper', 'currentNewspaper', '_industryNewsEvents', 'gameLog', 'transferLog', 'unifiedTitle',
  'mqRecord', 'mqRecordTag', 'streakRecord', 'seasonHistory', 'lastAwards', 'pendingAwards', 'titles', 'rankings', 'mvpRace',
  'debugLog', 'showCard', 'lastShowResults', 'matchHistory', 'orgWarRecord', 'factionTimeline', 'achievementItems',
  '_modalQueue', 'weekLogFeed', 'seasonStats', 'rentals', 'pendingRetirements']);
const AI_PERMANENT = new Set(['roster', 'titles', 'streakRecord', 'seasonBestMQMatch', 'history']);
function scanRefs(state, id) {
  const hits = [];
  const idStr = String(id);
  const keyHas = k => {
    const s = String(k);
    if (s === idStr) return true;
    if (/^\d+[>\-_]\d+$/.test(s)) return keyIds(s).includes(id);
    if (/^(pair|fighter|B)_\d+(_\d+)?$/.test(s)) return keyIds(s).includes(id);
    if (/^\d+>\d+:/.test(s)) return keyIds(s.split(':')[0]).includes(id);
    if (/:\d+>\d+$/.test(s)) return keyIds(s.split(':').pop()).includes(id);
    if (/^(bond|rivalry|trust)_/.test(s)) return glimpseKeyHas(s, id);
    return false;
  };
  const walk = (node, p, depth) => {
    if (!node || typeof node !== 'object' || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => {
        if (typeof v === 'number' && v === id && /coachAssign/.test(p)) hits.push(`${p}[${i}]`);
        else if (v && typeof v === 'object') {
          if (itemHasId(v, id)) hits.push(`${p}[${i}]`);
          walk(v, `${p}[${i}]`, depth + 1);
        }
      });
      return;
    }
    Object.keys(node).forEach(k => {
      if (keyHas(k)) hits.push(`${p}.${k}`);
      walk(node[k], `${p}.${k}`, depth + 1);
    });
  };
  Object.keys(state).forEach(root => {
    if (PERMANENT_ROOTS.has(root)) return;
    if (root === 'aiOrgs') {
      Object.entries(state.aiOrgs || {}).forEach(([orgId, org]) => Object.keys(org || {}).forEach(k => {
        if (AI_PERMANENT.has(k) || /^_news/.test(k)) return;
        if (keyHas(k)) hits.push(`aiOrgs.${orgId}.${k}`);
        walk(org[k], `aiOrgs.${orgId}.${k}`, 2);
      }));
      return;
    }
    if (keyHas(root)) hits.push(root);
    walk(state[root], root, 1);
  });
  return hits;
}

test('実際の状態(新規ゲーム+16週): 状態全体を走査して、恒久記録以外に転生したIDが残らない', () => {
  let s = Engine.createInitialState(4321, true);
  for (let i = 0; i < 16; i++) s = Engine.tickWeek({ ...s, weekPhase: 'manage' }).state;
  // いちばん記録を抱えているAI選手を選ぶ
  const ids = Object.values(s.aiOrgs).flatMap(o => o.roster.map(f => f.id));
  const score = id => Object.values(findLiveRefs(s, id)).reduce((a, b) => a + b, 0);
  const target = ids.sort((a, b) => score(b) - score(a))[0];
  const before = scanRefs(s, target);
  assert.ok(before.length >= 10, `走査が参照を拾えている(${before.length})`);
  const out = Engine.life.beginNewLife(s, target);
  const after = scanRefs(out, target);
  assert.deepStrictEqual(after, [], `関所の後に残った参照: ${after.slice(0, 10).join(' / ')}`);
  // 他の選手の記録は減らない(関係値の件数は 55 相当の組の分だけ減る)
  const other = ids.find(id => id !== target);
  const lost = Object.keys(s.relationships).filter(k => !out.relationships[k]);
  assert.ok(lost.every(k => k.split('>').map(Number).includes(target)), '消えた関係値は転生したIDの組だけ');
  assert.ok(Object.keys(findLiveRefs(out, other)).length > 0, '他の選手の記録は残る');
});

// ── (3) 年代記の読み手 ──
test('年代記: 退避した対戦の要約(bySeason)を章の季の窓で数える', () => {
  assert.strictEqual(typeof Engine.chronicle._archivedPairCountsInWindow, 'function');
  const out = Engine.life.beginNewLife(syntheticState(), X);
  const c = Engine.chronicle._archivedPairCountsInWindow(out, 3, 2, 3);
  assert.deepStrictEqual(c, [{ otherId: X, count: 3 }], '3 から見て章(S2〜S3)の 55 との対戦は3回');
  assert.deepStrictEqual(Engine.chronicle._archivedPairCountsInWindow(out, X, 5, 9).sort((a, b) => a.otherId - b.otherId),
    [{ otherId: 3, count: 1 }, { otherId: 12, count: 1 }]);
  assert.deepStrictEqual(Engine.chronicle._archivedPairCountsInWindow(out, 3, 6, 9), []);
  const mg = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  assert.strictEqual((mg.match(/Engine\.chronicle\._archivedPairCountsInWindow\(state, /g) || []).length, 2, 'エースの宿敵・同世代の宿敵の2か所が読む');
});

console.log(`k4-rebirth-clean-test: ${passed} passed${process.exitCode ? ' (FAILED)' : ''}`);
