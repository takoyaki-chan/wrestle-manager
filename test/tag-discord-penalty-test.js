#!/usr/bin/env node
'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  不仲タッグ(絆≤20)の「能力-3 / 連携不可 / 相手との関係-1」回帰テスト(K-12)
//
//  ■ なぜこのテストがあるか
//    興行プレビューは絆20以下のタッグに「⚠ 不仲 / 能力-3 / 連携不可 / 相手との関係-1」と
//    表示する(spec relationship-system-spec-v2.3 §D.1)。ところが 2026-09 の監査
//    (docs/fun-audit-v0.1/02-match-engine.md F5)まで:
//      - 能力-3 はどの経路でも効いていなかった(存在しないキー power/speed/technique/spirit を
//        減らしていた。エンジンが読むのは pw/sp/te/st/mn)
//      - 「残り全試合スキップ」と headless(Engine.executeShow)は試合後の信頼-1 も抜けていて、
//        押したボタンで結果が変わった
//    K-12 裁定(表示どおり効かせる)で、4つの呼び出し元を Engine.showTagMatch.simulate に
//    一本化した。このテストはその形を固定する。
//
//  ■ 何を見るか
//    A. ヘルパー単体: 下げるキー(pw/sp/te/mn)・閾値(絆≤20)・選手本体を変えないこと
//    B. 4経路(観戦 / 1試合スキップ / 残り全試合スキップ / headless)で、同じ入力に同じ
//       ペナルティが掛かり、同じ試合結果・同じ試合後処理(不仲ペアの trust-1)になること。
//       app.js の経路はメソッド本体を取り出して実エンジンで実行する(auto-sim は app.js を
//       読まないので、UI経路の漏れはこのテストでしか拾えない)
//    C. ペナルティが本当に試合を動かすこと・連携不可が効くこと・不仲でないペアは
//       ヘルパーを通しても結果が1バイトも変わらないこと
//    D. 経路ガード: simulateTagMatch の直呼び / 不仲処理の書き写しが通常興行へ戻っていないこと
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

const ST = Engine.showTagMatch;
const STATS = ['pw', 'sp', 'te', 'st', 'mn'];
const PENALIZED = ['pw', 'sp', 'te', 'mn'];
const relKey = (a, b) => `${Math.min(a, b)}>${Math.max(a, b)}`;
const clone = (x) => JSON.parse(JSON.stringify(x));
let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }
function eq(actual, expected, msg) { checks++; assert.deepStrictEqual(actual, expected, msg); }

// ══════════════════════════════════════════════════════════════════════════
//  A. ヘルパー単体
// ══════════════════════════════════════════════════════════════════════════
(function helperBasics() {
  eq([...ST.PENALTY_STATS], ['pw', 'sp', 'te', 'mn'],
    '下げる能力は spec §D.1 の power/speed/technique/spirit に当たる pw/sp/te/mn(ST=スタミナは下げない)');
  eq(ST.STAT_PENALTY, 3, '表示どおり -3');
  ok(ST.isLowBond(20) && ST.isLowBond(0.5), '絆20以下は不仲');
  ok(!ST.isLowBond(20.1) && !ST.isLowBond(50), '絆20超は不仲でない');

  const f = { id: 7, name: 'X', pw: 60, sp: 55, te: 50, st: 45, mn: 40, trust: 50, style: 'Striker' };
  const before = clone(f);
  const p = ST.penalize(f);
  eq(f, before, 'penalize は選手本体を書き換えない(試合用の一時コピーだけ)');
  eq([p.pw, p.sp, p.te, p.st, p.mn], [57, 52, 47, 45, 37], 'pw/sp/te/mn だけ -3、st はそのまま');
  ok(!('power' in p) && !('spirit' in p), '旧実装の無効キー(power/spirit 等)を足さない');

  const state = { relationships: { [relKey(3, 9)]: { bond: 12 } } };
  eq(ST.pairBond(state, 9, 3), 12, '絆は小さいID>大きいIDのキーで読む(並び順に依らない)');
  eq(ST.pairBond(state, 1, 2), 50, '関係が未登録なら50');
  eq(ST.pairBond({}, 1, 2), 50, 'relationships が無くても50');
})();

// ══════════════════════════════════════════════════════════════════════════
//  B. 4経路の一致(観戦 / 1試合スキップ / 残り全試合スキップ / headless)
// ══════════════════════════════════════════════════════════════════════════
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const mgmtSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');

function extractMethodBody(source, signature) {
  const token = `\n  ${signature} {`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`${signature} が見つからない`);
  if (source.indexOf(token, start + token.length) >= 0) throw new Error(`${signature} が複数ある`);
  const bodyStart = start + token.length;
  let depth = 1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(bodyStart, i);
  }
  throw new Error(`${signature} の終わりが見つからない`);
}

const bodies = {
  fillMissing: extractMethodBody(appSource, '_fillMissingShowPreviewResults()'),
  skip: extractMethodBody(appSource, 'skipMatch(idx)'),
  watch: extractMethodBody(appSource, '_watchTagMatch(idx)'),
  skipAll: extractMethodBody(appSource, 'skipAllMatches()'),
  executeShow: extractMethodBody(mgmtSource, 'executeShow(state)'),
};
const runFillMissing = new Function('App', 'G', bodies.fillMissing);
const runSkip = new Function('App', 'G', 'Engine', 'Audio', 'idx', bodies.skip);
const runWatch = new Function('App', 'G', 'Engine', 'Audio', 'renderMatchPreview', 'document',
  'getPortraitUrl', 'CHAR_PROFILES', 'WM_I18N', 'setTimeout', 'clearTimeout', 'idx', bodies.watch);
const runSkipAll = new Function('App', 'G', 'Engine', 'Audio', bodies.skipAll);

// simulateTagMatch への入力と素の結果を記録する(ヘルパーはプロパティ経由で呼ぶので全経路で拾える)
const simCalls = [];
const originalSimulateTagMatch = Engine.tagMatch.simulateTagMatch;
Engine.tagMatch.simulateTagMatch = function (teamA, teamB, rng, opts) {
  const result = originalSimulateTagMatch.call(this, teamA, teamB, rng, opts);
  simCalls.push({
    teamA: [teamA.fighter1, teamA.fighter2].map(f => ({ id: f.id, ...Object.fromEntries(STATS.map(k => [k, f[k]])) })),
    teamB: [teamB.fighter1, teamB.fighter2].map(f => ({ id: f.id, ...Object.fromEntries(STATS.map(k => [k, f[k]])) })),
    opts: { ...opts },
    raw: JSON.parse(JSON.stringify(result)), // 後段で書き換えられる前の素の結果
  });
  return result;
};

function buildShowState(bondA, bondB) {
  let G = Engine.createInitialState(4242, true);
  const [a1, a2, b1, b2] = G.roster;
  const relationships = { ...(G.relationships || {}) };
  relationships[relKey(a1.id, a2.id)] = { ...(relationships[relKey(a1.id, a2.id)] || {}), bond: bondA, rivalry: 0 };
  relationships[relKey(b1.id, b2.id)] = { ...(relationships[relKey(b1.id, b2.id)] || {}), bond: bondB, rivalry: 0 };
  G = {
    ...G, week: 2, weekPhase: 'manage', showVenue: 2, orgName: 'テスト団体', relationships,
    showCard: [{ matchType: 'tag', teamA: { fighter1: a1.id, fighter2: a2.id }, teamB: { fighter1: b1.id, fighter2: b2.id } }],
  };
  return { G, pairA: [a1.id, a2.id], pairB: [b1.id, b2.id] };
}

function makeApp(G) {
  const App = {
    _showPreview: { validMatches: clone(G.showCard), results: [null], currentWatching: -1 },
    settled: 0,
    finalized: 0,
    _fillMissingShowPreviewResults() { return runFillMissing(App, G); },
    _afterMatchSettle() { App.settled++; },
    finalizeShow() { App.finalized++; },
  };
  return App;
}
const AudioStub = { play() {}, bgm: { play() {} }, sfxMasterVol: 1, bgmMasterVol: 1 };

const PATHS = {
  // 1試合スキップ
  skip(G) {
    const App = makeApp(G);
    runSkip(App, G, Engine, AudioStub, 0);
    ok(App.settled === 1, 'skipMatch は結果確定後に _afterMatchSettle へ進む');
    return { result: App._showPreview.results[0], roster: G.roster };
  },
  // 観戦(tag-battle.html へ送る結果も同じもの)
  watch(G) {
    const App = makeApp(G);
    const posted = [];
    const timers = [];
    const el = {
      battleOverlay: { style: {} },
      battleEscapeBtn: { style: {} },
      battleIframe: { contentWindow: { postMessage(msg) { posted.push(msg); } } },
    };
    const documentStub = { getElementById(id) { return el[id] || null; } };
    runWatch(App, G, Engine, AudioStub, () => {}, documentStub, () => '', {}, WM_I18N,
      (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, () => {}, 0);
    const fallback = timers.find(t => t.ms === 800);
    ok(fallback, '観戦は iframe へ送る保険タイマーを掛ける');
    fallback.fn();
    ok(posted.length === 1 && posted[0].result === App._showPreview.results[0],
      '観戦で iframe に送る結果 = 興行に記録される結果');
    ok(Array.isArray(App._showPreview.results[0].frames), '観戦は recordFrames 付きで回す');
    return { result: App._showPreview.results[0], roster: G.roster };
  },
  // 残り全試合スキップ
  skipAll(G) {
    const App = makeApp(G);
    runSkipAll(App, G, Engine, AudioStub);
    ok(App.finalized === 1, 'skipAllMatches は全試合を埋めて finalizeShow へ進む');
    return { result: App._showPreview.results[0], roster: G.roster };
  },
  // headless(auto-sim / dev-tools の経路)
  headless(G) {
    const res = Engine.executeShow(G);
    ok(!res.error, `executeShow が実行できること: ${res.error || ''}`);
    return { result: res.results.find(r => r && r.matchType === 'tag'), roster: res.state.roster };
  },
};

const pick = (r) => { const { frames, ...rest } = r; return rest; };

function runAllPaths(bondA, bondB) {
  const { G: G0, pairA, pairB } = buildShowState(bondA, bondB);
  const base = Object.fromEntries(G0.roster.map(f => [f.id, clone(f)]));
  const out = {};
  for (const [name, run] of Object.entries(PATHS)) {
    simCalls.length = 0;
    const G = clone(G0);
    const { result, roster } = run(G);
    ok(simCalls.length === 1, `${name}: タッグ1試合につき simulateTagMatch はちょうど1回`);
    ok(result && result.matchType === 'tag', `${name}: タッグの結果が記録される`);
    out[name] = { call: simCalls[0], result, roster };
  }
  return { out, base, pairA, pairB };
}

(function fourPathsApplyTheSamePenalty() {
  // 表側(teamA)が不仲(絆10)、裏側(teamB)は良好(絆60)
  const { out, base, pairA, pairB } = runAllPaths(10, 60);
  const lowIds = new Set(pairA);
  for (const [name, { call, roster }] of Object.entries(out)) {
    // 能力-3: 不仲ペアだけ pw/sp/te/mn が -3、st と相手チームは素のまま
    [...call.teamA, ...call.teamB].forEach(f => {
      const b = base[f.id];
      STATS.forEach(k => {
        const expected = lowIds.has(f.id) && PENALIZED.includes(k) ? b[k] - 3 : b[k];
        eq(f[k], expected, `${name}: 選手${f.id} の ${k} は ${lowIds.has(f.id) && PENALIZED.includes(k) ? '-3' : '素のまま'}`);
      });
    });
    // 連携不可: 絆をそのままエンジンへ渡す(calcCutinRate が絆≤20で0を返す)
    eq([call.opts.bond_A, call.opts.bond_B], [10, 60], `${name}: 絆を bond_A/bond_B で渡す`);
    eq(!!call.opts.recordFrames, name === 'watch', `${name}: recordFrames は観戦のときだけ`);
    // 試合後: 不仲ペア両者の trust -1、他は据え置き
    [...pairA, ...pairB].forEach(id => {
      const after = roster.find(f => f.id === id);
      eq(after.trust, base[id].trust - (lowIds.has(id) ? 1 : 0), `${name}: 選手${id} の trust ${lowIds.has(id) ? '-1' : '据え置き'}`);
      // 能力値は恒久的には下がらない(headless は興行後の成長が乗るので -3 が残っていないことだけ見る)
      STATS.forEach(k => {
        if (name === 'headless') ok(after[k] > base[id][k] - 3, `${name}: 選手${id} の ${k} に -3 が残っていない`);
        else eq(after[k], base[id][k], `${name}: 選手${id} の ${k} は試合後も元の値`);
      });
    });
  }
  // 4経路で試合そのものが一致する(乱数・入力・ペナルティが同じ)
  const ref = JSON.stringify(pick(out.skip.call.raw));
  for (const name of ['watch', 'skipAll', 'headless']) {
    eq(JSON.stringify(pick(out[name].call.raw)), ref, `${name} の試合結果が1試合スキップと一致(frames 以外)`);
  }
  eq(JSON.stringify(out.skip.call.teamA), JSON.stringify(out.headless.call.teamA), 'UI経路と headless で同じ入力');
})();

(function fourPathsAgreeWhenTeamBIsTheDiscordPair() {
  // 裏側(teamB)が不仲のときも同じ(ID順と teamA/teamB の取り違えがないこと)
  const { out, base, pairA, pairB } = runAllPaths(70, 5);
  for (const [name, { call, roster }] of Object.entries(out)) {
    call.teamB.forEach(f => eq(PENALIZED.map(k => f[k]), PENALIZED.map(k => base[f.id][k] - 3), `${name}: teamB の不仲ペアに -3`));
    call.teamA.forEach(f => eq(PENALIZED.map(k => f[k]), PENALIZED.map(k => base[f.id][k]), `${name}: teamA は素のまま`));
    pairB.forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust - 1, `${name}: teamB 不仲ペアの trust -1`));
    pairA.forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust, `${name}: teamA の trust 据え置き`));
  }
  const ref = JSON.stringify(pick(out.skip.call.raw));
  ['watch', 'skipAll', 'headless'].forEach(name => eq(JSON.stringify(pick(out[name].call.raw)), ref, `${name} の試合結果が一致(teamB 不仲)`));
})();

(function fourPathsLeaveGoodPairsAlone() {
  // 両ペアとも不仲でなければ、どの経路でもペナルティも trust 変動も無い
  const { out, base, pairA, pairB } = runAllPaths(45, 80);
  for (const [name, { call, roster }] of Object.entries(out)) {
    [...call.teamA, ...call.teamB].forEach(f => eq(STATS.map(k => f[k]), STATS.map(k => base[f.id][k]), `${name}: 不仲でなければ素のまま`));
    [...pairA, ...pairB].forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust, `${name}: 不仲でなければ trust 据え置き`));
  }
})();

// ══════════════════════════════════════════════════════════════════════════
//  C. ペナルティの実効 / 連携不可 / 不仲でないペアの完全不変
// ══════════════════════════════════════════════════════════════════════════
Engine.tagMatch.simulateTagMatch = originalSimulateTagMatch;

function flatFighter(id, v) {
  return { id, name: `F${id}`, pw: v, sp: v, te: v, st: v, mn: v, style: 'Allround', popularity: 50, traits: [], trust: 50 };
}
// 変更前と同じ「素のまま」の直接呼び出し(乱数の作り方は本体と同じ)
function directSim(state, a1, a2, b1, b2) {
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week, a1.id, b1.id, 0x7A60));
  return Engine.tagMatch.simulateTagMatch({ fighter1: a1, fighter2: a2 }, { fighter1: b1, fighter2: b2 }, rng, {
    bond_A: ST.pairBond(state, a1.id, a2.id), bond_B: ST.pairBond(state, b1.id, b2.id),
    tagExp_A: Engine.tagExp.getCount(state, a1.id, a2.id), tagExp_B: Engine.tagExp.getCount(state, b1.id, b2.id),
  });
}

(function penaltyActuallyMovesTheMatch() {
  // 同格(平坦OVR80)・不仲 bond15 vs 標準 bond50。不仲側を試合ごとに左右入れ替える。
  // 乱数は試合ごとに新品(rngSeed を試合ごとに変え、ヘルパー内で create(derive(...)))。
  // 効果は約-8pt(3000試合で計測)。300試合だと標本の揺れで逆転する区間があったので1000試合で見る。
  const N = 1000;
  let changed = 0, oldLowWins = 0, newLowWins = 0, lowCutins = 0, goodCutins = 0;
  for (let i = 0; i < N; i++) {
    const flip = i % 2 === 1;
    const [a1, a2, b1, b2] = [1, 2, 3, 4].map(id => flatFighter(id, 80));
    const state = {
      rngSeed: 510000 + i * 7919, season: 3, week: 14, tagExp: {}, roster: [a1, a2, b1, b2],
      relationships: { [relKey(1, 2)]: { bond: flip ? 50 : 15 }, [relKey(3, 4)]: { bond: flip ? 15 : 50 } },
    };
    const lowTeam = flip ? 'teamB' : 'teamA';
    const lowIds = flip ? [3, 4] : [1, 2];
    const before = directSim(state, a1, a2, b1, b2);
    const after = ST.simulate(state, { fighter1: a1, fighter2: a2 }, { fighter1: b1, fighter2: b2 }).result;
    if (JSON.stringify(before) !== JSON.stringify(after)) changed++;
    if (before.winner === lowTeam) oldLowWins++;
    if (after.winner === lowTeam) newLowWins++;
    after.dramaSummary.filter(d => d.type === 'cutinSave').forEach(d => { if (lowIds.includes(d.by)) lowCutins++; else goodCutins++; });
  }
  ok(changed >= N * 0.9, `能力-3が試合を実際に動かす(変更前と違う結果 ${changed}/${N})`);
  ok(newLowWins < oldLowWins, `不仲ペアの勝率が下がる(${(100 * oldLowWins / N).toFixed(1)}% → ${(100 * newLowWins / N).toFixed(1)}% / ${N}試合)`);
  eq(lowCutins, 0, '連携不可: 不仲ペアはカットインで救援しない');
  ok(goodCutins > 0, '(対照)良好なペアはカットインで救援する');
  console.log(`  不仲ペア勝率 ${(100 * oldLowWins / N).toFixed(1)}% → ${(100 * newLowWins / N).toFixed(1)}%(同格・${N}試合)/ 結果が変わった試合 ${changed}/${N}`);
})();

(function goodPairsAreByteIdentical() {
  // 不仲でないペアはヘルパーを通しても1バイトも変わらない(境界 20.1 を含む)
  const pool = ALL_CHARS.slice(0, 40).map(c => ({ ...c, trust: 50 }));
  const bonds = [20.1, 21, 35, 50, 64.5, 99];
  for (let i = 0; i < 60; i++) {
    const a1 = pool[i % 40], a2 = pool[(i + 7) % 40], b1 = pool[(i + 13) % 40], b2 = pool[(i + 29) % 40];
    const roster = [a1, a2, b1, b2];
    const state = {
      rngSeed: 820000 + i * 104729, season: 5, week: 30, tagExp: { [relKey(a1.id, a2.id)]: i % 4 }, roster,
      relationships: { [relKey(a1.id, a2.id)]: { bond: bonds[i % 6] }, [relKey(b1.id, b2.id)]: { bond: bonds[(i + 3) % 6] } },
    };
    const out = ST.simulate(state, { fighter1: a1, fighter2: a2 }, { fighter1: b1, fighter2: b2 });
    eq(JSON.stringify(out.result), JSON.stringify(directSim(state, a1, a2, b1, b2)), `不仲でないペアの結果は変わらない(#${i})`);
    ok(out.roster === roster && out.lowBondIds.length === 0, `不仲でなければ roster を触らない(#${i})`);
  }
})();

// ══════════════════════════════════════════════════════════════════════════
//  D. 経路ガード(不仲処理の書き写し・simulateTagMatch の直呼びを戻さない)
// ══════════════════════════════════════════════════════════════════════════
(function routeGuards() {
  for (const name of ['skip', 'watch', 'skipAll']) {
    ok(bodies[name].includes('Engine.showTagMatch.simulate('), `app.js ${name}: Engine.showTagMatch.simulate を通す`);
    ok(bodies[name].includes('G.roster = tag.roster'), `app.js ${name}: 試合後の roster(trust-1)を書き戻す`);
    ok(!bodies[name].includes('simulateTagMatch('), `app.js ${name}: simulateTagMatch を直接呼ばない`);
  }
  ok(bodies.executeShow.includes('Engine.showTagMatch.simulate('), 'executeShow: Engine.showTagMatch.simulate を通す');
  ok(bodies.executeShow.includes('roster = tag.roster'), 'executeShow: 試合後の roster(trust-1)を書き戻す');
  ok(!bodies.executeShow.includes('simulateTagMatch('), 'executeShow: simulateTagMatch を直接呼ばない');
  ok(!/_penalize|power:\s*c\.power/.test(appSource), 'app.js に旧 _penalize(無効キー)が残っていない');
  eq((appSource.match(/simulateTagMatch\(/g) || []).length, 0, 'app.js から simulateTagMatch を直接呼ぶ箇所は0');
  // management.js の直呼びは春のタッグリーグ(run / simulateReplay)の2か所だけ。
  // 通常興行ではない大会なので不仲ペナルティの対象外(spec §D.1 は通常興行のタッグ編成)。
  // 新しいタッグ戦の経路を足すときは、ここを増やす前に Engine.showTagMatch を通すべきか判断すること。
  eq((mgmtSource.match(/Engine\.tagMatch\.simulateTagMatch\(/g) || []).length, 2,
    'management.js の simulateTagMatch 直呼びは春のタッグリーグの2か所だけ');

  const uiCommon = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');
  const uiRender = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
  ok(uiCommon.includes('Engine.showTagMatch.pairBond(G, tA1.id, tA2.id)') && uiCommon.includes('Engine.showTagMatch.isLowBond(bond)'),
    '興行プレビューの ⚠ 不仲 表示は試合と同じ絆・同じ閾値で判定する');
  ok(uiRender.includes('Engine.showTagMatch.pairBond(G, tA1.id, tA2.id)'), 'カード編成画面の絆表示も試合と同じ値');
})();

console.log(`tag-discord-penalty-test: ok (${checks} checks)`);
