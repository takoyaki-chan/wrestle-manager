#!/usr/bin/env node
'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  不仲タッグ(絆≤20)の「能力-3 / 連携不可 / 団体への信頼-1」回帰テスト(K-12)
//
//  ■ なぜこのテストがあるか
//    興行プレビューは絆20以下のタッグに「⚠ 不仲 / 能力-3 / 連携不可 / 団体への信頼-1」と
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
//
//  ■ K-12 追加3項目(2026-09-26 Keisuke 回答)
//    E. プレビューの3つ目の文言を実際の効果(団体への信頼-1)に合わせる(7月の「相手との関係-1」は
//       効果と食い違っていた)。JA/EN・台帳
//    F. 不仲の判定は「2人の絆の低い方」(A→B と B→A の min)。以前は `小さいID>大きいID` の片方向だけで、
//       相手からの絆だけが冷えたペアは不仲にならなかった。プレビュー・4経路で同じ判定・同じ数字
//    G. 春のタッグリーグ(自団体・他団体とも)にも同じ罰(能力-3・連携なし・試合後の信頼-1)
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
// 逆向き(大きいID→小さいID)のキー。変更前の実装はこちらを読んでいなかった
const revKey = (a, b) => `${Math.max(a, b)}>${Math.min(a, b)}`;
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
  // 絆0は完全に冷え切った仲。以前の `bond || 50` は0を50に化けさせ、⚠ 不仲 からも漏れていた
  const zero = { relationships: { [relKey(4, 8)]: { bond: 0 } } };
  eq(ST.pairBond(zero, 8, 4), 0, '絆0は0のまま(50に化けない)');
  ok(ST.isLowBond(ST.pairBond(zero, 4, 8)), '絆0のペアは不仲');
  eq(ST.pairBond({ relationships: { [relKey(4, 8)]: { bond: null } } }, 4, 8), 50, '絆が null なら50');
  eq(ST.pairBond({ relationships: { [relKey(4, 8)]: { bond: NaN } } }, 4, 8), 50, '絆が NaN なら50');
  ok(p._noCutin === true && !('_noCutin' in f), 'penalize は試合用コピーにだけ連携なしの印を付ける');
})();

// ══════════════════════════════════════════════════════════════════════════
//  F-1. 不仲の判定は「2人の絆の低い方」(K-12 追加)
// ══════════════════════════════════════════════════════════════════════════
(function pairBondIsTheLowerOfBothDirections() {
  // 小さいID→大きいID は良好、大きいID→小さいID だけ冷え切っている
  const coldReverse = { relationships: { [relKey(3, 9)]: { bond: 70 }, [revKey(3, 9)]: { bond: 8 } } };
  eq(ST.pairBond(coldReverse, 3, 9), 8, '絆は2人の絆の低い方(逆向きだけ冷えたペア)');
  eq(ST.pairBond(coldReverse, 9, 3), 8, '並び順に依らず同じ値');
  ok(ST.isDiscord(coldReverse, 9, 3) && ST.isDiscord(coldReverse, 3, 9), '逆向きだけ冷えたペアも不仲');
  // 逆の組み合わせ(従来から読んでいた向きが冷えている)
  const coldForward = { relationships: { [relKey(3, 9)]: { bond: 8 }, [revKey(3, 9)]: { bond: 70 } } };
  eq(ST.pairBond(coldForward, 9, 3), 8, '小さいID→大きいID が冷えていても低い方');
  // 片方向しか登録が無いとき、登録の無い向きは50(スナップショット・親友ゾーンと同じ作法)
  eq(ST.pairBond({ relationships: { [relKey(3, 9)]: { bond: 80 } } }, 3, 9), 50, '登録の無い向きは50として低い方を取る');
  eq(ST.pairBond({ relationships: { [revKey(3, 9)]: { bond: 0 } } }, 3, 9), 0, '逆向きの絆0も0のまま');
  ok(ST.isDiscord({ relationships: { [revKey(3, 9)]: { bond: 0 } } }, 3, 9), '逆向きだけ絆0のペアは不仲');
  ok(!ST.isDiscord({ relationships: { [relKey(3, 9)]: { bond: 21 }, [revKey(3, 9)]: { bond: 20.5 } } }, 3, 9), '両方向とも20超なら不仲でない');
  // ケミストリー用の値(試合エンジンへ渡す bond_A/bond_B)は従来どおり 小さいID>大きいID の片方向
  eq(ST.chemistryBond(coldReverse, 9, 3), 70, 'ケミストリー用の絆は従来の片方向(数値を不仲の3効果以外で動かさない)');
  eq(ST.chemistryBond(coldForward, 3, 9), 8, 'ケミストリー用の絆(従来の向き)');
  eq(ST.chemistryBond({}, 3, 9), 50, 'ケミストリー用の絆: 未登録なら50');
  // 信頼-1 のヘルパー
  const roster = [{ id: 1, trust: 40 }, { id: 2 }, { id: 3, trust: 0.4 }, { id: 4, trust: 70 }];
  eq(ST.applyTrustPenalty(roster, [1, 2, 3], 1).map(c => c.trust), [39, 49, 0, 70], '信頼-1(未設定は50から、0で止まる)');
  eq(ST.applyTrustPenalty(roster, [1], 4).map(c => c.trust), [36, undefined, 0.4, 70], '試合数ぶんまとめて引ける');
  ok(ST.applyTrustPenalty(roster, [], 1) === roster && ST.applyTrustPenalty(roster, [1], 0) === roster, '対象なし・0回なら同じ配列');
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
    teamA: [teamA.fighter1, teamA.fighter2].map(f => ({ id: f.id, ...Object.fromEntries(STATS.map(k => [k, f[k]])), noCutin: !!f._noCutin })),
    teamB: [teamB.fighter1, teamB.fighter2].map(f => ({ id: f.id, ...Object.fromEntries(STATS.map(k => [k, f[k]])), noCutin: !!f._noCutin })),
    opts: { ...opts },
    raw: JSON.parse(JSON.stringify(result)), // 後段で書き換えられる前の素の結果
  });
  return result;
};

// bondA/bondB は 小さいID>大きいID の向き(変更前から読んでいた向き)。
// rev を渡すと逆向き(大きいID>小さいID)の絆も登録する(K-12 追加: 判定は2人の絆の低い方)
function buildShowState(bondA, bondB, rev) {
  let G = Engine.createInitialState(4242, true);
  const [a1, a2, b1, b2] = G.roster;
  const relationships = { ...(G.relationships || {}) };
  relationships[relKey(a1.id, a2.id)] = { ...(relationships[relKey(a1.id, a2.id)] || {}), bond: bondA, rivalry: 0 };
  relationships[relKey(b1.id, b2.id)] = { ...(relationships[relKey(b1.id, b2.id)] || {}), bond: bondB, rivalry: 0 };
  if (rev && rev.A != null) relationships[revKey(a1.id, a2.id)] = { bond: rev.A, rivalry: 0 };
  if (rev && rev.B != null) relationships[revKey(b1.id, b2.id)] = { bond: rev.B, rivalry: 0 };
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

function runAllPaths(bondA, bondB, rev) {
  const { G: G0, pairA, pairB } = buildShowState(bondA, bondB, rev);
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
    // 連携不可: 絆をそのままエンジンへ渡す(calcCutinRate が絆≤20で0を返す)+ 不仲ペアの試合用コピーに連携なしの印
    eq([call.opts.bond_A, call.opts.bond_B], [10, 60], `${name}: 絆を bond_A/bond_B で渡す`);
    [...call.teamA, ...call.teamB].forEach(f => eq(f.noCutin, lowIds.has(f.id), `${name}: 選手${f.id} の連携なしの印`));
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

(function fourPathsTreatBondZeroAsDiscord() {
  // 絆ちょうど0のペアも4経路すべてで不仲扱い(能力-3・連携不可・trust-1)
  const { out, base, pairA, pairB } = runAllPaths(0, 60);
  for (const [name, { call, roster }] of Object.entries(out)) {
    eq(call.opts.bond_A, 0, `${name}: 絆0をそのままエンジンへ渡す(50に化けない)`);
    call.teamA.forEach(f => eq(PENALIZED.map(k => f[k]), PENALIZED.map(k => base[f.id][k] - 3), `${name}: 絆0のペアに -3`));
    pairA.forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust - 1, `${name}: 絆0のペアの trust -1`));
    pairB.forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust, `${name}: 相手ペアの trust 据え置き`));
  }
})();

(function fourPathsUseTheLowerOfBothDirections() {
  // K-12 追加: 表側は 小さいID→大きいID が60(従来の判定では良好)でも、逆向きが10なら不仲。
  // 裏側は 70 / 逆向き未登録(=50)で、低い方50 → 不仲でない
  const { out, base, pairA, pairB } = runAllPaths(60, 70, { A: 10 });
  const { G: G0 } = buildShowState(60, 70, { A: 10 });
  eq(ST.pairBond(G0, pairA[0], pairA[1]), 10, 'プレビューに出す絆(pairBond)は判定と同じ低い方の値');
  eq(ST.pairBond(G0, pairB[0], pairB[1]), 50, '裏側の絆は低い方(逆向き未登録=50)');
  for (const [name, { call, roster }] of Object.entries(out)) {
    call.teamA.forEach(f => {
      eq(PENALIZED.map(k => f[k]), PENALIZED.map(k => base[f.id][k] - 3), `${name}: 逆向きだけ冷えたペアに -3`);
      eq(f.noCutin, true, `${name}: 逆向きだけ冷えたペアは連携なし`);
    });
    call.teamB.forEach(f => {
      eq(STATS.map(k => f[k]), STATS.map(k => base[f.id][k]), `${name}: 裏側は素のまま`);
      eq(f.noCutin, false, `${name}: 裏側は連携あり`);
    });
    // ケミストリー用の絆は従来どおり(不仲の3効果以外の数値を動かさない)
    eq([call.opts.bond_A, call.opts.bond_B], [60, 70], `${name}: エンジンへ渡すケミストリー用の絆は従来の片方向`);
    pairA.forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust - 1, `${name}: 逆向きだけ冷えたペアの trust -1`));
    pairB.forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust, `${name}: 裏側の trust 据え置き`));
  }
  const ref = JSON.stringify(pick(out.skip.call.raw));
  ['watch', 'skipAll', 'headless'].forEach(name => eq(JSON.stringify(pick(out[name].call.raw)), ref, `${name} の試合結果が一致(逆向き不仲)`));
  // 連携なしが本当に効いている: 逆向き不仲ペアの救援(cutinSave)は0
  const lowCutins = out.skip.call.raw.dramaSummary.filter(d => d.type === 'cutinSave' && pairA.includes(d.by)).length;
  eq(lowCutins, 0, '逆向きだけ冷えたペアはカットインで救援しない');
})();

(function fourPathsLeaveAsymmetricGoodPairsAlone() {
  // 向きで絆が違っても、低い方が20超なら不仲でない(ペナルティなし・ケミストリー用の絆も従来どおり)
  const { out, base, pairA, pairB } = runAllPaths(45, 64.5, { A: 30, B: 21 });
  for (const [name, { call, roster }] of Object.entries(out)) {
    [...call.teamA, ...call.teamB].forEach(f => {
      eq(STATS.map(k => f[k]), STATS.map(k => base[f.id][k]), `${name}: 低い方が20超なら素のまま`);
      eq(f.noCutin, false, `${name}: 低い方が20超なら連携あり`);
    });
    eq([call.opts.bond_A, call.opts.bond_B], [45, 64.5], `${name}: ケミストリー用の絆は従来の片方向`);
    [...pairA, ...pairB].forEach(id => eq(roster.find(f => f.id === id).trust, base[id].trust, `${name}: trust 据え置き`));
  }
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
// 変更前と同じ「素のまま」の直接呼び出し(乱数の作り方は本体と同じ。絆は従来どおり 小さいID>大きいID の片方向)
function directSim(state, a1, a2, b1, b2) {
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week, a1.id, b1.id, 0x7A60));
  return Engine.tagMatch.simulateTagMatch({ fighter1: a1, fighter2: a2 }, { fighter1: b1, fighter2: b2 }, rng, {
    bond_A: ST.chemistryBond(state, a1.id, a2.id), bond_B: ST.chemistryBond(state, b1.id, b2.id),
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

(function reverseOnlyDiscordStopsCutins() {
  // K-12 追加: 逆向き(大きいID→小さいID)だけ冷えたペアも連携なし。変更前は救援していた。
  // 良好ペアとの対照と、変更前の直接呼び出し(罰なし)との対照で、印が本当に救援を止めていることを見る
  const N = 400;
  let lowCutins = 0, goodCutins = 0, oldLowCutins = 0;
  for (let i = 0; i < N; i++) {
    const [a1, a2, b1, b2] = [1, 2, 3, 4].map(id => flatFighter(id, 80));
    const state = {
      rngSeed: 630000 + i * 7919, season: 2, week: 20, tagExp: {}, roster: [a1, a2, b1, b2],
      relationships: { [relKey(1, 2)]: { bond: 60 }, [revKey(1, 2)]: { bond: 12 }, [relKey(3, 4)]: { bond: 60 }, [revKey(3, 4)]: { bond: 60 } },
    };
    const out = ST.simulate(state, { fighter1: a1, fighter2: a2 }, { fighter1: b1, fighter2: b2 });
    eq(out.lowBondIds, [1, 2], `逆向き不仲ペアだけが罰の対象(#${i})`);
    out.result.dramaSummary.filter(d => d.type === 'cutinSave').forEach(d => { if ([1, 2].includes(d.by)) lowCutins++; else goodCutins++; });
    directSim(state, a1, a2, b1, b2).dramaSummary.filter(d => d.type === 'cutinSave' && [1, 2].includes(d.by)).forEach(() => { oldLowCutins++; });
  }
  eq(lowCutins, 0, '逆向きだけ冷えたペアはカットインで救援しない');
  ok(goodCutins > 0, '(対照)良好なペアは救援する');
  ok(oldLowCutins > 0, `(対照)変更前(片方向判定)なら救援していた: ${oldLowCutins}回/${N}試合`);
})();

(function goodPairsAreByteIdentical() {
  // 不仲でないペアはヘルパーを通しても1バイトも変わらない(境界 20.1 を含む)。
  // K-12 追加: 逆向きの絆も登録し、向きで値が違う(低い方が20超の)ペアでも変わらないことを見る
  const pool = ALL_CHARS.slice(0, 40).map(c => ({ ...c, trust: 50 }));
  const bonds = [20.1, 21, 35, 50, 64.5, 99];
  for (let i = 0; i < 60; i++) {
    const a1 = pool[i % 40], a2 = pool[(i + 7) % 40], b1 = pool[(i + 13) % 40], b2 = pool[(i + 29) % 40];
    const roster = [a1, a2, b1, b2];
    const state = {
      rngSeed: 820000 + i * 104729, season: 5, week: 30, tagExp: { [relKey(a1.id, a2.id)]: i % 4 }, roster,
      relationships: {
        [relKey(a1.id, a2.id)]: { bond: bonds[i % 6] }, [relKey(b1.id, b2.id)]: { bond: bonds[(i + 3) % 6] },
        [revKey(a1.id, a2.id)]: { bond: bonds[(i + 1) % 6] }, [revKey(b1.id, b2.id)]: { bond: bonds[(i + 5) % 6] },
      },
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
  // management.js の直呼びは春のタッグリーグ(run / simulateReplay)の2か所だけ。連戦消耗(_hpOverride)と
  // 大会専用の乱数があるので Engine.showTagMatch.simulate は通さないが、不仲の判定と罰は
  // Engine.showTagMatch.isDiscord / penalize(_matchFighter 経由)/ applyTrustPenalty を呼ぶ(K-12 追加)。
  // 新しいタッグ戦の経路を足すときは、ここを増やす前に同じ判定・同じ罰を通すこと。
  eq((mgmtSource.match(/Engine\.tagMatch\.simulateTagMatch\(/g) || []).length, 2,
    'management.js の simulateTagMatch 直呼びは春のタッグリーグの2か所だけ');
  const springStart = mgmtSource.indexOf('\nEngine.springTagLeague = {');
  const springEnd = mgmtSource.indexOf('\nEngine.autumnWar = {', springStart);
  ok(springStart >= 0 && springEnd > springStart, 'Engine.springTagLeague の範囲が見つかる');
  const springSource = mgmtSource.slice(springStart, springEnd);
  const springRun = extractMethodBody(springSource, 'run(state, rng)');
  const springReplay = extractMethodBody(springSource, 'simulateReplay(state, match, options)');
  const springApply = extractMethodBody(springSource, 'apply(state, result)');
  ok(springRun.includes('Engine.showTagMatch.isDiscord(') && springRun.includes('discordTeamIds'),
    '春タッグ run: 不仲の判定は Engine.showTagMatch.isDiscord');
  [springRun, springReplay].forEach((body, i) => {
    eq((body.match(/matchFighter\(/g) || []).length, 4, `春タッグ ${i ? 'simulateReplay' : 'run'}: 4選手とも _matchFighter(罰の入口)を通す`);
    ok(!/\{\s*\.\.\.f[AB][12],\s*_hpOverride/.test(body), `春タッグ ${i ? 'simulateReplay' : 'run'}: 素の選手を直接エンジンへ渡さない`);
  });
  ok(springReplay.includes('replayContext.discordTeamIds'), '春タッグ simulateReplay: 大会開始時の判定(replayContext)に従う');
  ok(springApply.includes('Engine.showTagMatch.applyTrustPenalty('), '春タッグ apply: 試合後の信頼-1 は共通ヘルパー');

  const uiCommon = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');
  const uiRender = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
  ok(uiCommon.includes('Engine.showTagMatch.pairBond(G, tA1.id, tA2.id)') && uiCommon.includes('Engine.showTagMatch.isLowBond(bond)'),
    '興行プレビューの ⚠ 不仲 表示は試合と同じ絆・同じ閾値で判定する');
  ok(uiRender.includes('Engine.showTagMatch.pairBond(G, tA1.id, tA2.id)'), 'カード編成画面の絆表示も試合と同じ値');
})();

// ══════════════════════════════════════════════════════════════════════════
//  E. 警告の文言 = 実際の効果(K-12 追加)。信頼は数値で出さない(trust-system-spec §16)
//     E-2. 春のタッグリーグの編成画面にも同じ警告(同じ判定・同じ数字・同じ文言)
// ══════════════════════════════════════════════════════════════════════════
const uiCommonSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
function extractFunction(source, name) {
  const token = `\nfunction ${name}(`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`${name} が見つからない`);
  if (source.indexOf(token, start + token.length) >= 0) throw new Error(`${name} が複数ある`);
  const open = source.indexOf('{', source.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(start + 1, i + 1);
  }
  throw new Error(`${name} の終わりが見つからない`);
}

(function warningWordingMatchesTheEffect() {
  const JA = '能力-3 / 連携不可 / 団体への信頼が下がる';
  const EN = 'Ability -3 / no teamwork / trust in the promotion drops';
  const langEn = fs.readFileSync(path.join(__dirname, '..', 'src', 'lang-en.js'), 'utf8');
  const ledger = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'ui-ledger.json'), 'utf8'));
  eq((uiCommonSource.match(new RegExp(`WM_I18N\\.t\\('${JA.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}'\\)`, 'g')) || []).length, 1,
    '不仲の警告の2行目は「団体への信頼が下がる」(効果は試合後の trust -1)。文言は1か所(_tagDiscordEffectText)');
  ok(extractFunction(uiCommonSource, '_tagDiscordEffectText').includes(`WM_I18N.t('${JA}')`), '文言は _tagDiscordEffectText が持つ');
  ok(/\$\{WM_I18N\.t\('⚠ 不仲'\)\} \$\{Math\.round\(bond\)\}<div[^>]*>\$\{_tagDiscordEffectText\(\)\}<\/div>/.test(uiCommonSource),
    '興行プレビューの ⚠ 不仲 は共通の文言を使う');
  ok(!/WM_I18N\.t\('能力-3 \/ 連携不可 \/ (相手との関係-1|団体への信頼-1)'\)/.test(uiCommonSource), '旧文言(相手との関係-1 / 団体への信頼-1)が残っていない');
  ok(!/[-−+]\s*\d/.test(JA.split('/').pop()) && !/trust|morale/i.test(JA), '信頼の変化は数値で出さない・内部変数名を出さない');
  const row = ledger.find(r => r.key === JA);
  ok(row && row.en === EN, `UI台帳に新しい文言と英訳がある: ${row && row.en}`);
  ok(!ledger.some(r => /^能力-3 \/ 連携不可 \/ (相手との関係-1|団体への信頼-1)$/.test(r.key)), 'UI台帳から旧キーを削った');
  ok(langEn.includes(JSON.stringify(JA) + ': ' + JSON.stringify(EN)), 'lang-en.js を台帳から再生成した');
  ok(!langEn.includes('relationship -1') && !langEn.includes('promotion -1'), 'EN からも旧文言が消えている');
})();

(function springEntryModalShowsTheSameWarning() {
  const SL = Engine.springTagLeague;
  const src = ['_tagDiscordEffectText', '_stlDiscordWarnHtml', '_stlEntryModalHtml'].map(n => extractFunction(uiCommonSource, n)).join('\n');
  const stubs = {
    _mdlAHeader: () => '', escHtml: s => String(s), getUpperUrl: () => '', _stlFaceImg: () => '', _STL_STYLE_CREAM: {},
  };
  const i18n = { t: (text, params) => WM_I18N.t(text, params), pn: s => s };
  const build = (G, App) => new Function('G', 'App', 'Engine', 'WM_I18N', ...Object.keys(stubs),
    `${src}\nreturn { _stlEntryModalHtml, _stlDiscordWarnHtml };`)(G, App, Engine, i18n, ...Object.values(stubs));
  let G = Engine.createInitialState(4242, true);
  const announced = SL.announce(G);
  G = { ...G, week: SL.ENTRY_WEEK, springTagLeague: { ...announced, announcedSeason: G.season } };
  const [x, y, z] = SL._eligible(G.roster);
  // x と y: 逆向き(大きいID→小さいID)だけ冷えた → 低い方9で不仲。x と z は良好
  G = { ...G, relationships: { [relKey(x.id, y.id)]: { bond: 70 }, [revKey(x.id, y.id)]: { bond: 9 }, [relKey(x.id, z.id)]: { bond: 70 }, [revKey(x.id, z.id)]: { bond: 65 } } };
  const JA = WM_I18N.t('能力-3 / 連携不可 / 団体への信頼が下がる');
  const nPlayerSlots = G.springTagLeague.teams.filter(t => t.orgId === 'player').length;
  const pairsWith = (a, b) => Array.from({ length: nPlayerSlots }, (_, i) => (i === 0 ? { f1Id: a, f2Id: b } : { f1Id: null, f2Id: null }));

  const fnDiscord = build(G, { _stlEntrySelection: { activeSlot: 0, pairs: pairsWith(x.id, y.id) } });
  const warn = fnDiscord._stlDiscordWarnHtml(x.id, y.id, false);
  ok(warn.includes(`⚠ 不仲 ${Math.round(ST.pairBond(G, x.id, y.id))}`) && warn.includes('⚠ 不仲 9'), '編成画面の警告の数字は判定と同じ低い方の絆');
  ok(warn.includes(`<small>${JA}</small>`), '編成画面の警告の2行目は通常興行のプレビューと同じ文言');
  ok(/class="stl-discord-warn"/.test(warn), '編成画面の警告は専用クラス(色はトークン)');
  const compact = fnDiscord._stlDiscordWarnHtml(y.id, x.id, true);
  ok(compact.includes('⚠ 不仲 9') && !compact.includes('<small>'), 'おすすめペアのチップは1行だけ(並び順に依らず同じ判定)');
  eq(fnDiscord._stlDiscordWarnHtml(x.id, z.id, false), '', '不仲でないペアには警告を出さない');
  eq(fnDiscord._stlDiscordWarnHtml(x.id, null, false), '', '2人そろうまでは警告を出さない');

  const modalDiscord = fnDiscord._stlEntryModalHtml();
  const summary = modalDiscord.slice(modalDiscord.indexOf('stl-summary-bar'));
  ok(summary.includes('⚠ 不仲 9') && summary.includes(JA), '選んだ2人が不仲なら、編成画面の下の帯に警告が出る');
  ok(!summary.includes('stl-summary-chem'), '不仲のときは相性の記号の代わりに警告(通常興行のプレビューが 🤝 の代わりに出すのと同じ)');
  const modalGood = build(G, { _stlEntrySelection: { activeSlot: 0, pairs: pairsWith(x.id, z.id) } })._stlEntryModalHtml();
  ok(!modalGood.slice(modalGood.indexOf('stl-summary-bar')).includes('⚠ 不仲'), '良好なペアを選んだときは警告が出ない');
  ok(extractFunction(uiCommonSource, '_stlDiscordWarnHtml').includes('Engine.showTagMatch.isDiscord(G, f1Id, f2Id)'),
    '編成画面の判定は試合と同じ Engine.showTagMatch.isDiscord');

  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const css = (html.match(/\.stl-discord-warn[^{]*\{[^}]*\}/g) || []).join('\n');
  ok(css.includes('var(--cream-red)') && !/#[0-9a-fA-F]{3,6}\b/.test(css), '編成画面の警告の色はトークン(Cream の赤)で、16進の直書きなし');
})();

// ══════════════════════════════════════════════════════════════════════════
//  G. 春のタッグリーグにも同じ罰(K-12 追加)
//     判定は大会開始時に Engine.showTagMatch.isDiscord(2人の絆の低い方)で1回。
//     run(本番・自団体/他団体/AIどうし)と simulateReplay(観戦)で同じ罰、apply で試合数ぶん信頼-1
// ══════════════════════════════════════════════════════════════════════════
(function springTagLeagueAppliesTheSamePenalty() {
  const SL = Engine.springTagLeague;
  const orig = Engine.tagMatch.simulateTagMatch;
  const calls = [];
  Engine.tagMatch.simulateTagMatch = function (teamA, teamB, rng, opts) {
    const result = orig.call(this, teamA, teamB, rng, opts);
    const rec = f => ({ id: f.id, ...Object.fromEntries(STATS.map(k => [k, f[k]])), noCutin: !!f._noCutin, hp: f._hpOverride });
    calls.push({ A: [teamA.fighter1, teamA.fighter2].map(rec), B: [teamB.fighter1, teamB.fighter2].map(rec), opts: { ...opts }, result });
    return result;
  };
  try {
    let state = Engine.createInitialState(4242, true);
    const announced = SL.announce(state);
    ok(!announced.cancelled && announced.teams.length >= 6, '春タッグが開催できる');
    state = { ...state, week: SL.LEAGUE_WEEK, springTagLeague: { ...announced, announcedSeason: state.season } };
    const pp = SL.bestPair(state, state.roster);
    state = SL.confirmPlayerTeam(state, pp.f1Id, pp.f2Id);
    const teams0 = state.springTagLeague.teams;
    const playerTeam = teams0.find(t => t.orgId === 'player' && t.f1Id != null);
    const aiTeam = teams0.find(t => t.orgId !== 'player' && t.f1Id != null);
    // 自団体: 逆向きだけ冷えた(変更前の片方向判定なら良好)/ 他団体: 小さいID>大きいID が冷えた
    state = {
      ...state,
      relationships: {
        ...(state.relationships || {}),
        [relKey(playerTeam.f1Id, playerTeam.f2Id)]: { bond: 70, rivalry: 0 },
        [revKey(playerTeam.f1Id, playerTeam.f2Id)]: { bond: 9, rivalry: 0 },
        [relKey(aiTeam.f1Id, aiTeam.f2Id)]: { bond: 14, rivalry: 0 },
      },
    };
    const fighterById = {};
    SL.ORG_ORDER.forEach(orgId => SL._orgRoster(state, orgId).forEach(f => { fighterById[f.id] = f; }));
    const run = SL.run(state, Engine.rng.create(1));
    ok(!run.cancelled, '大会が成立する');
    const expectedDiscord = run.teams.filter(t => ST.isDiscord(state, t.f1Id, t.f2Id)).map(t => t.teamId).sort();
    eq([...run.replayContext.discordTeamIds].sort(), expectedDiscord, 'replayContext に大会開始時の不仲チームが残る');
    eq(expectedDiscord, [playerTeam.teamId, aiTeam.teamId].sort(), '不仲は自団体(逆向き)と他団体の2チームだけ');

    const discordIds = new Set([playerTeam.f1Id, playerTeam.f2Id, aiTeam.f1Id, aiTeam.f2Id].map(String));
    const allMatches = [...run.matches, run.finalMatch];
    eq(calls.length, allMatches.length, '1試合につき simulateTagMatch は1回');
    let penalizedSides = 0, aiVsAiPenalized = 0, discordCutins = 0;
    calls.forEach((call, i) => {
      const m = allMatches[i];
      eq([call.A[0].id, call.B[0].id], [m.teamA.f1Id, m.teamB.f1Id], `試合${i + 1}: 呼び出し順 = 記録順`);
      [['A', m.teamA], ['B', m.teamB]].forEach(([side, team]) => {
        const discord = discordIds.has(String(team.f1Id));
        if (discord) penalizedSides++;
        call[side].forEach(f => {
          const b = fighterById[f.id];
          STATS.forEach(k => eq(f[k], discord && PENALIZED.includes(k) ? b[k] - 3 : b[k], `試合${i + 1}: 選手${f.id} の ${k}`));
          eq(f.noCutin, discord, `試合${i + 1}: 選手${f.id} の連携なしの印`);
          ok(Number.isFinite(f.hp), `試合${i + 1}: 連戦消耗の開始HPはそのまま渡る`);
        });
      });
      // ケミストリー用の絆は従来どおり(大会の _bond)
      eq([call.opts.bond_A, call.opts.bond_B], [SL._bond(state, m.teamA.f1Id, m.teamA.f2Id), SL._bond(state, m.teamB.f1Id, m.teamB.f2Id)],
        `試合${i + 1}: ケミストリー用の絆は従来の値`);
      if (m.orgA !== 'player' && m.orgB !== 'player' && (discordIds.has(String(m.teamA.f1Id)) || discordIds.has(String(m.teamB.f1Id)))) aiVsAiPenalized++;
      call.result.dramaSummary.filter(d => d.type === 'cutinSave' && discordIds.has(String(d.by))).forEach(() => { discordCutins++; });
    });
    ok(penalizedSides >= 6, `不仲チームの出る試合すべてに罰(${penalizedSides}チーム・試合)`);
    ok(aiVsAiPenalized >= 1, `AIどうしの試合にも罰が掛かる(${aiVsAiPenalized}試合)`);
    eq(discordCutins, 0, '春タッグでも不仲チームは救援しない');

    // 試合後の信頼-1: 1試合ごと。自団体は roster、他団体は aiOrgs の roster
    const played = teamId => allMatches.filter(m => m.teamAId === teamId || m.teamBId === teamId).length;
    const applied = SL.apply(state, run).state;
    const trustOf = (s, orgId, id) => SL._orgRoster(s, orgId).find(f => f.id === id).trust;
    run.teams.forEach(team => {
      const times = expectedDiscord.includes(team.teamId) ? played(team.teamId) : 0;
      [team.f1Id, team.f2Id].forEach(id => eq(trustOf(applied, team.orgId, id), Math.max(0, trustOf(state, team.orgId, id) - times),
        `apply: ${team.orgId} 選手${id} の信頼 ${times ? `-${times}(${times}試合)` : '据え置き'}`));
    });
    ok(played(playerTeam.teamId) >= 3 && played(aiTeam.teamId) >= 3, '不仲チームはリーグ戦3試合以上');

    // 観戦(simulateReplay)は本番と同じ罰で同じ試合を再構築する。大会後に仲が戻っても罰は記録に従う
    // (大会後の関係値の変化でケミストリーが変わる分は従来からの挙動なので、仲が戻った版は罰の有無だけ見る)
    const healed = { ...applied, relationships: Object.fromEntries(Object.keys(applied.relationships).map(k => [k, { ...applied.relationships[k], bond: 90 }])) };
    [applied, healed].forEach((s, which) => {
      const stl = s.springTagLeague;
      [...stl.matches, stl.finalMatch].forEach((m, i) => {
        calls.length = 0;
        const isFinal = i === stl.matches.length;
        const replay = SL.simulateReplay(s, m, isFinal ? { isFinal: true, matchIndex: i } : { matchIndex: i });
        if (!which) {
          eq({ winner: replay.result.winner, mq: replay.result.mq, turns: replay.result.turns },
            { winner: m.winner, mq: m.mq, turns: m.turns },
            `観戦: 試合${i + 1} を本番どおり再構築`);
        }
        const discordA = discordIds.has(String(m.teamA.f1Id)), discordB = discordIds.has(String(m.teamB.f1Id));
        eq(calls[0].A.map(f => f.noCutin).concat(calls[0].B.map(f => f.noCutin)), [discordA, discordA, discordB, discordB],
          `観戦: 試合${i + 1} の罰は大会開始時の判定どおり`);
      });
    });
    // K-12 追加より前に確定した大会(記録なし)は罰なしで確定しているので、観戦でも罰を掛けない
    const legacy = { ...applied, springTagLeague: { ...applied.springTagLeague, replayContext: { ...applied.springTagLeague.replayContext } } };
    delete legacy.springTagLeague.replayContext.discordTeamIds;
    calls.length = 0;
    SL.simulateReplay(legacy, legacy.springTagLeague.matches.find(m => discordIds.has(String(m.teamA.f1Id)) || discordIds.has(String(m.teamB.f1Id))), { matchIndex: 0 });
    ok(calls[0].A.concat(calls[0].B).every(f => !f.noCutin), '記録の無い旧大会の観戦には罰を掛けない');

    // 不仲がいなければ何も変わらない(罰の入口を通っても素の選手のまま)
    const friendly = { ...state, relationships: {} };
    calls.length = 0;
    const run2 = SL.run(friendly, Engine.rng.create(1));
    eq(run2.replayContext.discordTeamIds, [], '不仲がいない大会は discordTeamIds が空');
    ok(calls.every(c => c.A.concat(c.B).every(f => !f.noCutin && STATS.every(k => f[k] === fighterById[f.id][k]))), '不仲がいなければ全試合素のまま');
    const applied2 = SL.apply(friendly, run2).state;
    run2.teams.forEach(team => [team.f1Id, team.f2Id].forEach(id => eq(trustOf(applied2, team.orgId, id), trustOf(friendly, team.orgId, id), `不仲なし: 選手${id} の信頼据え置き`)));
  } finally {
    Engine.tagMatch.simulateTagMatch = orig;
  }
})();

console.log(`tag-discord-penalty-test: ok (${checks} checks)`);
