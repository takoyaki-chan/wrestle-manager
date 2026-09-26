#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage2-test.js — K-1「興行後の処理を一本化する」第2段(表示・記録だけの差を統一する)の回帰ガード
//  (2026-09-26)
//
//  ■ 何を守るか(エンジン Engine.executeShow と実プレイ App._finalizeShowImpl が同じ関数を通すこと)
//    1. K1-E08 因縁決着エントリ: Engine.show.resolvedRivalryEntry。lastShowNumber(何番目の興行か)と
//       宿怨の決着の勝者 bitterResolutionWinnerId の両方を持つ
//    2. K1-A06 対戦成績: Engine.show.recordShowH2h(印は Engine.show.buildMatchMeta)。シングルの履歴に
//       元同僚の初対面・派閥抗争中・ロッカー荒廃中・奪還戦の印を刻み、元同僚の初対面は業界ニュースに積む
//    3. K1-T01 奪還挑戦の予約の欄: Engine.saveDoctor.repairProgressionState が予約の無い状態に null を作らない
//    4. K1-A03 季節の統計: Engine.show.accumulateSeasonStats(興行数・決着数・引き分け・季の最高評価)
//    5. K1-A04 興行結果の新聞データ: Engine.show.buildShowNewspaperData(見出し・本文は専用の乱数系列で選ぶ。
//       テンプレの表は app.js に置いたまま Engine.show.registerNewspaperTextPools で登録)
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)が見る。ここは関数の中身と、
//  app.js / management.js が共通の関数を呼んでいること(文面)を確かめる。
//
//  ■ 使い方
//    node test/k1-stage2-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { engineShowBody, appShowBody } = require('./helpers/show-paths.js');
const { loadEngines } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

// 関数本文(次のメソッドの手前まで)
function methodBody(file, signature) {
  const src = readSource('src', file);
  const start = src.indexOf(signature);
  assert.ok(start >= 0, `${signature} が見つからない`);
  const end = src.indexOf('\n  },\n', start);
  return src.slice(start, end);
}
// K-1 第3段: 実プレイの試合後の処理は App._finalizeShowImpl → Engine.show.finalize(実プレイだけの処理は App._finalizeHook*)
const finalizeBody = () => appShowBody();
// K-1 第3段: エンジンの試合後の処理は Engine.show.finalize に切り出した(executeShow はそれを呼ぶ)
const executeShowBody = () => engineShowBody();

console.log('K-1 第2段 回帰ガード');

// ── 1. K1-E08 因縁決着エントリ ──
section('E08: 決着エントリは lastShowNumber と宿怨の勝者IDの両方を持つ', () => {
  assert.ok(Engine.show && typeof Engine.show.resolvedRivalryEntry === 'function', 'Engine.show.resolvedRivalryEntry が無い');
  const prev = { matches: 5, lastWeek: 10, resolutionCount: 1, lastBand: 2, oneSided: 'A', pendingClashBonus: 3, tier: 2 };
  const state = { season: 2, week: 14, totalShows: 24 };
  const bitter = Engine.show.resolvedRivalryEntry(prev, { newResolutionCount: 2, resolved: 'bitter' }, state, 81);
  assert.strictEqual(bitter.lastShowNumber, 24);
  assert.strictEqual(bitter.bitterResolutionWinnerId, 81);
  assert.strictEqual(bitter.resolved, 'bitter');
  assert.strictEqual(bitter.matches, 0);
  assert.strictEqual(bitter.resolutionCount, 2);
  assert.strictEqual(bitter.lastWeek, 14);
  assert.strictEqual(bitter.lastResolvedWeek, 14);
  assert.strictEqual(bitter.lastAbsWeek, Engine.util.absWeek(2, 14));
  assert.strictEqual(bitter.lastBand, 0);
  assert.strictEqual(bitter.oneSided, null);
  assert.strictEqual(bitter.pendingClashBonus, 0);
  assert.strictEqual(bitter.tier, 2, '前のエントリのほかの欄は残す');
  // 好敵手・初回の決着には宿怨の勝者IDを付けない
  const good = Engine.show.resolvedRivalryEntry(prev, { newResolutionCount: 2, resolved: 'goodRival' }, state, 81);
  assert.strictEqual(good.bitterResolutionWinnerId, undefined);
  assert.strictEqual(good.lastShowNumber, 24);
  const first = Engine.show.resolvedRivalryEntry(prev, { newResolutionCount: 1 }, state, 81);
  assert.strictEqual(first.resolved, undefined);
  assert.strictEqual(first.bitterResolutionWinnerId, undefined);
  // 入力のエントリを書き換えない
  assert.strictEqual(prev.matches, 5);
});

section('E08: 両経路が Engine.show.resolvedRivalryEntry を呼ぶ(自前のエントリを組まない)', () => {
  const fin = finalizeBody();
  const exe = executeShowBody();
  assert.ok(fin.includes('Engine.show.resolvedRivalryEntry(rivalries[key], resolution, s, winnerId)'), 'app.js が共通の関数を呼んでいない');
  assert.ok(exe.includes('Engine.show.resolvedRivalryEntry(rivalries[key], resolution, s, winnerId)'), 'management.js が共通の関数を呼んでいない');
  assert.ok(!/bitterResolutionWinnerId:\s*winnerId/.test(fin), 'app.js に自前の決着エントリが残っている');
  assert.ok(!/lastShowNumber:\s*s\.totalShows/.test(exe), 'management.js に自前の決着エントリが残っている');
});

// ── 2. K1-A06 対戦成績の履歴の印と元同僚の初対面の記事 ──
function h2hState() {
  const tl = (org, fs, fw, ts, tw) => ({ orgId: org, fromSeason: fs, fromWeek: fw, ...(ts ? { toSeason: ts, toWeek: tw } : {}) });
  return {
    season: 2, week: 14, h2h: {},
    roster: [
      // 1 と 2: 元は同じ他団体(org_a)にいて、別々の時期に自団体へ来た(離脱後の初対面)
      { id: 1, name: '選手1', orgTimeline: [tl('org_a', 1, 1, 2, 5), tl('player', 2, 5)] },
      { id: 2, name: '選手2', orgTimeline: [tl('org_a', 1, 1, 2, 10), tl('player', 2, 10)] },
      { id: 3, name: '選手3', orgTimeline: [tl('player', 1, 1)] },
      { id: 4, name: '選手4', orgTimeline: [tl('player', 1, 1)] },
      { id: 5, name: '選手5', orgTimeline: [tl('player', 1, 1)] },
      { id: 6, name: '選手6', orgTimeline: [tl('player', 1, 1)] },
    ],
    factions: [{ id: 1, memberIds: [3], inHostility: true }, { id: 2, memberIds: [4], inHostility: false }],
    _lockerCrisisWeek: Engine.util.absWeek(2, 14) - 2,
  };
}

section('A06: 履歴の印(元同僚の初対面・派閥抗争中・ロッカー荒廃中・奪還戦)', () => {
  assert.ok(typeof Engine.show.buildMatchMeta === 'function', 'Engine.show.buildMatchMeta が無い');
  const s = h2hState();
  assert.deepStrictEqual(Engine.show.buildMatchMeta(s, 1, 2, false), { betrayal: true, lockerStress: true });
  assert.deepStrictEqual(Engine.show.buildMatchMeta(s, 3, 4, true), { factionWar: true, lockerStress: true, reclaim: true });
  const calm = { ...s, _lockerCrisisWeek: Engine.util.absWeek(2, 14) - 5 };
  assert.deepStrictEqual(Engine.show.buildMatchMeta(calm, 5, 6, false), {}, '荒廃から5週たてば印なし');
});

section('A06: 通常興行の対戦成績 — シングルは印つき・元同僚の初対面は記事・タッグは対角4組・直訴は飛ばす', () => {
  assert.ok(typeof Engine.show.recordShowH2h === 'function', 'Engine.show.recordShowH2h が無い');
  const s = h2hState();
  const before = JSON.stringify(s);
  const validMatches = [
    { left: 1, right: 2 },
    { left: 3, right: 4, isTitle: true },
    { matchType: 'tag', teamA: { fighter1: 3, fighter2: 5 }, teamB: { fighter1: 4, fighter2: 6 } },
    { left: 5, right: 6, isCRMatch: true },
  ];
  const results = [
    { winner: 'left', mq: 60 },
    { winner: 'right', mq: 70, isTitleMatch: true },
    { matchType: 'tag', winner: 'teamB', mq: 50 },
    { winner: 'left', mq: 40 },
  ];
  const out = Engine.show.recordShowH2h(s, validMatches, results);
  assert.strictEqual(JSON.stringify(s), before, '入力の状態を書き換えた');
  const last = key => { const h = out.h2h[key].history; return h[h.length - 1]; };
  assert.strictEqual(last('1>2').bt, 1, '元同僚の初対面の印');
  assert.strictEqual(last('1>2').lc, 1, 'ロッカー荒廃中の印');
  assert.strictEqual(out.h2h['3>4'].history[0].fc, 1, '派閥抗争中の印');
  assert.strictEqual(out.h2h['3>4'].history[0].t, 1, '王座戦の印');
  // タッグ: 対角4組(3-4, 3-6, 5-4, 5-6)。勝ったのは teamB(4・6)。印は付けない
  assert.strictEqual(out.h2h['3>4'].matches, 2, 'シングル+タッグで2戦');
  assert.strictEqual(out.h2h['3>6'].winsB, 1);
  assert.strictEqual(out.h2h['4>5'].winsA, 1);
  assert.strictEqual(last('3>6').fc, undefined, 'タッグには印を付けない');
  // 直訴試合(5-6 のシングル)は記録しない(5-6 はタッグの1戦だけ)
  assert.strictEqual(out.h2h['5>6'].matches, 1, '直訴試合を二重に記録した');
  // 元同僚の初対面の記事は1本
  const news = (out._industryNewsEvents || []).filter(e => e.type === 'firstMeetSinceDeparture');
  assert.strictEqual(news.length, 1);
  assert.deepStrictEqual(news[0].data, { nameA: '選手1', nameB: '選手2' });
  // 同じ組の2度目の対戦(離脱後にもう会っている)は初対面ではない
  const again = Engine.show.recordShowH2h({ ...out, _industryNewsEvents: [] }, [validMatches[0]], [results[0]]);
  assert.strictEqual(again.h2h['1>2'].history[1].bt, undefined);
  assert.strictEqual((again._industryNewsEvents || []).length, 0);
});

section('A06: 両経路が Engine.show.recordShowH2h を呼ぶ(App._buildMatchMeta は無い)', () => {
  const fin = finalizeBody();
  const exe = executeShowBody();
  assert.ok(fin.includes('s = Engine.show.recordShowH2h({ ...s, roster }, validMatches, results);'), 'app.js が共通の関数を呼んでいない');
  assert.ok(exe.includes('s = Engine.show.recordShowH2h({ ...s, roster }, validMatches, results);'), 'management.js が共通の関数を呼んでいない');
  // B3(単発の挑戦状)の専用の記録(Engine.h2h.update(s.h2h || {}, b3.fighterId, …))は別枠なので残ってよい
  assert.ok(!/h2h = Engine\.h2h\.update\(h2h, (m\.left|aId)/.test(fin), 'app.js の通常興行に自前の h2h 記録が残っている');
  assert.ok(!exe.includes('Engine.h2h.update('), 'management.js の executeShow に自前の h2h 記録が残っている');
  const app = readSource('src', 'app.js');
  assert.ok(!app.includes('_buildMatchMeta('), 'App._buildMatchMeta が残っている(対抗戦・PPV も Engine.show.buildMatchMeta を使う)');
  assert.ok(app.includes('Engine.show.buildMatchMeta(G, r.playerFighter.id, r.aiFighter.id, false)'), '対抗戦の印');
  assert.ok(app.includes('Engine.show.buildMatchMeta(s, match.left.id, match.right.id, false)'), 'PPV の印');
});

// ── 3. K1-T01 奪還挑戦の予約の欄 ──
section('T01: 進行の修復は、奪還挑戦の予約が無い状態に null の欄を作らない', () => {
  const base = { season: 2, week: 14, weekPhase: 'manage', roster: [{ id: 1 }], showCard: [], coachAssign: {} };
  const none = Engine.saveDoctor.repairProgressionState(base).state;
  assert.ok(!Object.prototype.hasOwnProperty.call(none, '_pendingReclaim'), '予約が無いのに _pendingReclaim の欄ができた');
  const kept = Engine.saveDoctor.repairProgressionState({ ...base, _pendingReclaim: null }).state;
  assert.strictEqual(kept._pendingReclaim, null, 'もとから null の欄は null のまま');
  const valid = Engine.saveDoctor.repairProgressionState({ ...base, _pendingReclaim: { titleType: 'world', challengerId: 1 } }).state;
  assert.deepStrictEqual(valid._pendingReclaim, { titleType: 'world', challengerId: 1 }, '有効な予約は残す');
  const stale = Engine.saveDoctor.repairProgressionState({ ...base, _pendingReclaim: { titleType: 'world', challengerId: 99 } });
  assert.strictEqual(stale.state._pendingReclaim, null, '居ない挑戦者の予約は null にする(従来どおり)');
  assert.ok(stale.changes.includes('pendingReclaim_stale_ref_removed'));
});

// ── 4. K1-A03 季節の統計 ──
section('A03: 季節の統計に通常興行1回分を足す(興行数・決着数・引き分け・季の最高評価とその顔合わせ)', () => {
  assert.ok(typeof Engine.show.accumulateSeasonStats === 'function', 'Engine.show.accumulateSeasonStats が無い');
  const before = { wins: 3, losses: 0, draws: 1, showCount: 2, bestMQ: 60, bestMQMatch: '前の試合', totalRevenue: 100 };
  const roster = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }, { id: 4, name: 'D' }];
  const validMatches = [
    { left: 1, right: 2 },
    { matchType: 'tag', teamA: { fighter1: 1, fighter2: 2 }, teamB: { fighter1: 3, fighter2: 4 } },
    { left: 3, right: 4 },
  ];
  const results = [
    { winner: 'left', mq: 55, left: { name: 'A' }, right: { name: 'B' } },
    { matchType: 'tag', winner: 'teamB', mq: 72 },
    { winner: 'draw', mq: 40, left: { name: 'C' }, right: { name: 'D' } },
  ];
  const out = Engine.show.accumulateSeasonStats(before, validMatches, results, roster);
  assert.strictEqual(out.showCount, 3);
  assert.strictEqual(out.wins, 5, '決着のついた試合(シングル1+タッグ1)');
  assert.strictEqual(out.draws, 2);
  assert.strictEqual(out.bestMQ, 72);
  assert.strictEqual(out.bestMQMatch, 'A & B vs C & D', 'タッグの顔合わせ');
  assert.strictEqual(out.totalRevenue, 100, '収支の欄には触れない(K1-C05 は closeShowResult)');
  assert.strictEqual(before.showCount, 2, '入力を書き換えた');
});

section('A03: 両経路が Engine.show.accumulateSeasonStats を呼ぶ', () => {
  const fin = finalizeBody();
  const exe = executeShowBody();
  assert.ok(fin.includes('seasonStats: Engine.show.accumulateSeasonStats(s.seasonStats, validMatches, results, roster)'), 'app.js が共通の関数を呼んでいない');
  assert.ok(exe.includes('seasonStats: Engine.show.accumulateSeasonStats(s.seasonStats, validMatches, results, roster)'), 'management.js が共通の関数を呼んでいない');
  assert.ok(!/stats\.showCount\+\+/.test(fin), 'app.js に自前の集計が残っている');
});

// ── 5. K1-A04 興行結果の新聞データ ──
function paperState(extra = {}) {
  const f = (id, name, ovr) => ({ id, name, pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr, popularity: 40 });
  const A = f(1, '選手A', 60), B = f(2, '選手B', 58), C = f(3, '選手C', 50), D = f(4, '選手D', 49);
  return {
    rngSeed: 4242, season: 2, week: 14, totalShows: 25, showVenue: 2, orgName: 'テスト団体',
    roster: [A, B, C, D], rivalries: {}, relationships: {}, titles: { world: { championId: null } }, matchupLog: [],
    showCard: [{ left: 1, right: 2 }, { left: 3, right: 4 }],
    lastShowAttendance: 1234,
    lastShowResults: [
      { left: A, right: B, winner: 'left', mq: 66, turns: 12, finType: 'ピン', finMove: 'ラリアット', hpLeft: { final: 40, max: 100 }, hpRight: { final: 20, max: 100 } },
      { left: C, right: D, winner: 'right', mq: 45, turns: 8, finType: 'ピン', finMove: 'ドロップキック', hpLeft: { final: 10, max: 100 }, hpRight: { final: 30, max: 100 } },
    ],
    ...extra,
  };
}

section('A04: 新聞データを組む(テンプレ未登録の環境では見出し・本文は空、サブ見出しは組む)', () => {
  assert.ok(typeof Engine.show.buildShowNewspaperData === 'function', 'Engine.show.buildShowNewspaperData が無い');
  const saved = Engine.show._newspaperTextPools;
  Engine.show.registerNewspaperTextPools(null, null);
  try {
    const state = paperState();
    const before = JSON.stringify(state);
    const d = Engine.show.buildShowNewspaperData(state, { injuryResults: [
      { name: '選手C', injury: { type: '軽傷', weeksLeft: 2 } },
      { name: '選手D', injury: { type: '重傷', weeksLeft: 9 }, retireType: 'wear' },
    ] });
    assert.strictEqual(JSON.stringify(state), before, '入力の状態を書き換えた');
    assert.strictEqual(d.showName, '第25回 定期興行');
    assert.strictEqual(d.attendance, 1234);
    assert.strictEqual(d.headline, null);
    assert.strictEqual(d.article, null);
    assert.ok(typeof d.subheadline === 'string' && d.subheadline.length > 0, 'サブ見出しが無い');
    assert.strictEqual(d.winner.id, 1);
    assert.strictEqual(d.allMatches.length, 1);
    assert.strictEqual(d.allMatches[0].winnerName, '選手D');
    // 表示時の言語で組み直すための材料(決着文の生キー・成形済みの興行名の組み直し指示)
    assert.strictEqual(d.allMatches[0].finType, 'ピン');
    assert.strictEqual(d.allMatches[0].finMove, 'ドロップキック');
    assert.deepStrictEqual(d.subheadlineDerive, [{ key: 'showName', kind: 'tpl', tpl: '第{n}回 定期興行', vars: { n: 25 } }]);
    assert.deepStrictEqual(d.injuries, [{ name: '選手C', type: '軽傷', weeksLeft: 2 }], '引退した怪我は紙面に載せない');
    assert.strictEqual(d.generatedWeek, 14);
    assert.strictEqual(d.generatedSeason, 2);
    assert.strictEqual(Engine.show.buildShowNewspaperData({ ...state, lastShowResults: [] }), null, '試合が無ければ null');
  } finally {
    Engine.show._newspaperTextPools = saved;
  }
});

section('A04: 見出し・本文の文選びは専用の乱数系列(Math.random を使わない・同じ興行は同じ見出し)と防衛/奪取の見出し', () => {
  const saved = Engine.show._newspaperTextPools;
  const origRandom = Math.random;
  const HL = {
    normal: [d => `N1 ${d.winner.name}`, d => `N2 ${d.winner.name}`, d => `N3 ${d.winner.name}`],
    titleWin: [d => `奪取 ${d.winner.name}`], titleDefend: [d => `防衛 ${d.winner.name}`],
  };
  const AR = { normal: [d => `本文 ${d.loser.name}`], lowMQ: [d => `低調 ${d.loser.name}`] };
  Engine.show.registerNewspaperTextPools(HL, AR);
  Math.random = () => { throw new Error('Math.random を使った'); };
  try {
    const d1 = Engine.show.buildShowNewspaperData(paperState());
    const d2 = Engine.show.buildShowNewspaperData(paperState());
    assert.ok(/^N[123] 選手A$/.test(d1.headline), `見出し: ${d1.headline}`);
    assert.strictEqual(d1.headline, d2.headline, '同じ興行で見出しが変わった');
    assert.strictEqual(d1.article, '本文 選手B');
    // 週が変われば系列が変わる(3本のうちどれかが選ばれる。値そのものは系列しだい)
    const weeks = new Set([2, 4, 6, 8, 10, 14, 16, 18].map(w => Engine.show.buildShowNewspaperData(paperState({ week: w })).headline));
    assert.ok(weeks.size >= 2, `週ごとに見出しが散らない: ${[...weeks]}`);
    // 王座戦: 防衛か奪取かは titleOutcomes で決まる
    const titleState = paperState();
    titleState.lastShowResults = [{ ...titleState.lastShowResults[0], isTitleMatch: true }, titleState.lastShowResults[1]];
    const defend = Engine.show.buildShowNewspaperData(titleState, { titleOutcomes: [{ outcome: 'defense', champId: 1 }] });
    const change = Engine.show.buildShowNewspaperData(titleState, { titleOutcomes: [{ outcome: 'change', newChampId: 1 }] });
    assert.strictEqual(defend.headline, '防衛 選手A');
    assert.strictEqual(change.headline, '奪取 選手A');
  } finally {
    Math.random = origRandom;
    Engine.show._newspaperTextPools = saved;
  }
});

section('A04: 組んだ新聞データは同じ週の号に自団体の興行記事として載る', () => {
  const state = paperState();
  const paper = Engine.show.buildShowNewspaperData(state);
  const s = { ...state, currentNewspaper: paper };
  assert.ok(Engine.newspaper._isFreshPlayerShow(s), '今週の興行の新聞データとして扱われない');
  const np = Engine.newspaper.generate(s, Engine.rng.create(1));
  const stories = [np.topStory, ...(np.subStories || [])].filter(Boolean);
  const story = stories.find(st => st.type === 'playerShowNormal');
  assert.ok(story, `自団体の興行記事が載らない: ${stories.map(st => st.type)}`);
  // テンプレ未登録の環境(このテスト)は既定の見出し+サブ見出し。どちらも表示時に組み直せる Tpl を持つ
  if (!Engine.show._newspaperTextPools) {
    assert.strictEqual(story.headlineTpl, NEWS_FALLBACK_TEMPLATES.playerShowHeadline, '既定の見出しに Tpl が無い');
    assert.strictEqual(story.bodyTpl, paper.subheadlineTpl);
    assert.deepStrictEqual(story.bodyDerive, paper.subheadlineDerive, '興行名の組み直し指示が本文に渡らない');
  }
});

section('A04: 表示側は興行名(tpl)とダイジェストの決着文を表示時の言語で組み直す(ui-render.js)', () => {
  const ui = readSource('src', 'ui-render.js');
  const extract = (signature) => {
    const start = ui.indexOf(signature);
    assert.ok(start >= 0, `${signature} が見つからない`);
    let depth = 0;
    for (let i = ui.indexOf('{', start); i < ui.length; i++) {
      if (ui[i] === '{') depth++;
      else if (ui[i] === '}') { depth--; if (depth === 0) return ui.slice(start, i + 1); }
    }
    throw new Error('関数の終わりが見つからない');
  };
  const fake = new Function('WM_I18N', 'Engine', `${extract('function _npMaterializeVars(')}\n${extract('function _npResolvePlayerShowData(')}\nreturn { _npMaterializeVars, _npResolvePlayerShowData };`)(
    { t: (tpl, vars) => `EN[${tpl}]${vars ? JSON.stringify(vars) : ''}` },
    { formatFinish: (ft, fm) => `EN-finish(${ft}/${fm})` });
  const vars = fake._npMaterializeVars({ showName: '第25回 定期興行', venue: 'x' },
    { derive: [{ key: 'showName', kind: 'tpl', tpl: '第{n}回 定期興行', vars: { n: 25 } }] });
  assert.strictEqual(vars.showName, 'EN[第{n}回 定期興行]{"n":25}');
  assert.strictEqual(vars.venue, 'x');
  const psd = { allMatches: [{ finishLabel: 'JA', finType: 'ピン', finMove: 'ラリアット' }, { finishLabel: '旧データ' }] };
  const out = fake._npResolvePlayerShowData(psd);
  assert.strictEqual(out.allMatches[0].finishLabel, 'EN-finish(ピン/ラリアット)');
  assert.strictEqual(out.allMatches[1].finishLabel, '旧データ', '生キーの無い旧データは保存値のまま');
  assert.strictEqual(psd.allMatches[0].finishLabel, 'JA', '入力を書き換えた');
});

section('A04: 両経路が Engine.show.buildShowNewspaperData を呼ぶ(App の旧関数は無い・テンプレは app.js が登録)', () => {
  const fin = finalizeBody();
  const exe = executeShowBody();
  const app = readSource('src', 'app.js');
  assert.ok(fin.includes('Engine.show.buildShowNewspaperData(G, { titleOutcomes: titleMatchOutcomes, injuryResults, dict: WM_I18N.t })'), 'app.js が共通の関数を呼んでいない');
  assert.ok(exe.includes('Engine.show.buildShowNewspaperData(s, { titleOutcomes: titleMatchOutcomes, injuryResults })'), 'management.js が共通の関数を呼んでいない');
  assert.ok(!app.includes('_buildShowResultNewspaperData()') && !app.includes('_generateNewspaperTexts(d)'), 'App の旧関数が残っている');
  assert.ok(app.includes('Engine.show.registerNewspaperTextPools(App._NEWSPAPER_HEADLINES, App._NEWSPAPER_ARTICLES);'), 'テンプレの登録が無い');
  assert.ok(app.includes('  _NEWSPAPER_HEADLINES: {') && app.includes('  _NEWSPAPER_ARTICLES: {'), 'テンプレの表は app.js に置いたまま(i18n の抽出が読む)');
});

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
