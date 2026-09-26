#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage3-test.js — K-1「興行後の処理を一本化する」第3段の回帰ガード(2026-09-26)
//
//  ■ 何を守るか
//    3-1 通常興行の試合後の処理は Engine.show.finalize の1本。Engine.executeShow は
//        Engine.show.beginShow → 試合のシミュレーション → Engine.show.finalize を呼ぶだけ
//    - finalize は入力の状態を書き換えない(試合結果の配列には評価と印を書き足す=従来どおり)
//    - finalize の hooks(実プレイだけの処理を差し込む口)は決まった順に1回ずつ呼ばれる
//    - ctx.logStyle で、エンジンの文字列のログと実プレイの構造化ログを選ぶ
//
//  両経路の一致そのものは npm run test:k1:parity(実ブラウザ)と、その --dump / compare-dumps.js
//  (同じ経路の前後比較)が見る。ここは関数の形と中身を確かめる。
//
//  ■ 使い方
//    node test/k1-stage3-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { engineShowBody, finalizeBody } = require('./helpers/show-paths.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}
const clone = v => JSON.parse(JSON.stringify(v));

console.log('K-1 第3段 回帰ガード');

// 本物の進行で作った興行週の状態(seed 42 の2季目14週。k1-parity の fixture と同じ週)に、
// 健康な選手でシングル3試合+タッグ1試合のカードを組む
const showState = (() => {
  const G = clone(advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 14 && g.weekPhase === 'manage' && !g.offSeason }));
  const ids = G.roster.filter(c => !c.injury && !c.isRental && !c.forcedRest).map(c => c.id);
  assert.ok(ids.length >= 10, `健康な選手が足りない(${ids.length})`);
  G.showCard = [
    { left: ids[0], right: ids[1], isTitle: false },
    { left: ids[2], right: ids[3], isTitle: false },
    { left: ids[4], right: ids[5], isTitle: false },
    { matchType: 'tag', teamA: { fighter1: ids[6], fighter2: ids[7] }, teamB: { fighter1: ids[8], fighter2: ids[9] } },
  ];
  return G;
})();

// ── 3-1 エンジンの経路の形 ──
section('3-1: executeShow は beginShow → 試合のシミュレーション → Engine.show.finalize を呼ぶだけ', () => {
  const mgmt = readSource('src', 'management.js');
  const exe = mgmt.slice(mgmt.indexOf('  executeShow(state) {'), mgmt.indexOf('\n  },\n', mgmt.indexOf('  executeShow(state) {')));
  assert.ok(/const begun = Engine\.show\.beginShow\(intrusionOut\.state, validMatches\);/.test(exe), 'executeShow が Engine.show.beginShow を呼んでいない');
  // 第4段 4-A(K1-A14): 乱入の判定と差し替えは試合のシミュレーションの前(実プレイの App.executeShow と同じ関数)
  assert.ok(/const intrusionOut = Engine\.show\.rollIntrusion\(repaired, validMatches\);/.test(exe), 'executeShow が Engine.show.rollIntrusion を呼んでいない');
  assert.ok(/const fin = Engine\.show\.finalize\(s, validMatches, rawResults, \{/.test(exe), 'executeShow が Engine.show.finalize を呼んでいない');
  // 試合後の処理を executeShow の中に書き直していない(finalize の中にだけある)
  ['Engine.mq.finalize(', 'Engine.mq.updateRecord(', 'Engine.attendanceV2.calcAttendanceV2(', 'Engine.applyShowPopularity(',
    'Engine.show.resolveMatchInjury(', 'Engine.relationships.applyMatchResult(', 'Engine.show.applyMatchGrowth(',
    'Engine.show.applySuddenDepartures(', 'Engine.kaigan.processMatchResults('].forEach(call => {
    assert.ok(!exe.includes(call), `executeShow に試合後の処理(${call})が残っている`);
    assert.ok(finalizeBody().includes(call), `Engine.show.finalize が ${call} を呼んでいない`);
  });
  // engineShowBody(executeShow + finalize)で、第2段・第4段の共通の関数がすべて通っている
  const body = engineShowBody();
  ['resolvedRivalryEntry', 'applyMatchPopularity', 'resetPromoStacks', 'resolveMatchInjury', 'applyInjuryRetirementAftermath',
    'accrueFactionPoints', 'applyMatchGrowth', 'accumulateSeasonStats', 'recordShowH2h', 'applySuddenDepartures',
    'buildInjuryRetirementPresentations', 'buildShowNewspaperData',
    // 第4段 4-A(実プレイだけにあった処理をエンジンへ)
    'applyGrowthEvents', 'recordCareerMarks', 'settleFactionBookings'].forEach(fn => {
    assert.ok(body.includes(`Engine.show.${fn}(`), `エンジンの経路が Engine.show.${fn} を通っていない`);
  });
});

// ── 3-2 実プレイの経路の形 ──
section('3-2: App._finalizeShowImpl は beginShow → Engine.show.finalize(実プレイの指定と hooks つき)を呼ぶ', () => {
  const app = readSource('src', 'app.js');
  const implStart = app.indexOf('  _finalizeShowImpl() {');
  const impl = app.slice(implStart, app.indexOf('\n  },\n', implStart));
  assert.ok(/const begun = Engine\.show\.beginShow\(G, validMatches\);/.test(impl), '_finalizeShowImpl が Engine.show.beginShow を呼んでいない');
  assert.ok(/const fin = Engine\.show\.finalize\(begun\.state, validMatches, results, \{/.test(impl), '_finalizeShowImpl が Engine.show.finalize を呼んでいない');
  // 経路ごとの違い(第4段 4-A・第5段で寄せるまで残す指定)
  ["logStyle: 'structured'", "mqPath: 'App._finalizeShowImpl'", 'intrusion: App._intrusionData || null', 'rivalryBeforeTitles: true', 'f08AttendanceMark: true',
    'markDomeSellout: true', 'crossOrgRelationshipContext: true', 'resolveUnifiedTitle: false',
    'dict: WM_I18N.t', 'preShowState: G'].forEach(opt => {
    assert.ok(impl.includes(opt), `_finalizeShowImpl が ${opt} を渡していない`);
  });
  const hookNames = ['afterTitles: w => App._finalizeHookSpecialBouts(w)',
    'afterWriteback: w => App._finalizeHookGuests(w)'];
  hookNames.forEach(h => assert.ok(impl.includes(h), `hooks に ${h} が無い`));
  // 第4段 4-A でエンジンへ移した処理の hooks は残っていない
  assert.ok(!/afterGrowth:/.test(impl) && !/_finalizeHookGrowthEvents/.test(app), '成長イベントの hook(第4段 4-A でエンジンへ移した)が残っている');
  assert.ok(!/beforeKaigan:/.test(impl) && !/_finalizeHookCareerMarks/.test(app), '経歴の刻印の hook(第4段 4-A でエンジンへ移した)が残っている');
  assert.ok(!/afterRelationships:/.test(impl) && !/_finalizeHookFactionBookings/.test(app), '派閥の予約の清算の hook(第4段 4-A でエンジンへ移した)が残っている');
  // 共通の処理を実プレイ側に書き直していない(_finalizeShowImpl と hooks のどこにも無い)
  const hooks = ['_finalizeHookSpecialBouts', '_finalizeHookGuests']
    .map(name => {
      const st = app.indexOf(`\n  ${name}(`);
      assert.ok(st >= 0, `App.${name} が無い`);
      return app.slice(st, app.indexOf('\n  },\n', st));
    }).join('\n');
  ['Engine.mq.finalize(', 'Engine.mq.updateRecord(', 'Engine.attendanceV2.calcAttendanceV2(', 'Engine.applyShowPopularity(',
    'Engine.title.crownChampion(', 'Engine.title.recordRivalry(', 'Engine.show.resolveMatchInjury(', 'Engine.relationships.applyMatchResult(',
    'Engine.relationships.applyShowContextEffects(', 'Engine.show.accrueFactionPoints(', 'Engine.show.applyMatchGrowth(',
    'Engine.show.recordShowH2h(', 'Engine.pushRecentMatch(', 'Engine.kaigan.processMatchResults(', 'Engine.show.applySuddenDepartures(',
    'Engine.growthEvents.checkAndApplyBreakthrough(', 'Engine.growthEvents.checkSlump(', 'Engine.growthEvents.updateSlumpMomentumAfterMatch(',
    'Engine.factions.applyCommon1MatchResult(', 'Engine.factions.applyF09SweepBonus(', 'Engine.factions.applyInternalChallengeResult(', 'Engine.factions.applyF08PostMatchExtraEffects(']
    .forEach(call => {
      assert.ok(!impl.includes(call), `_finalizeShowImpl に共通の処理(${call})が残っている`);
      assert.ok(!hooks.includes(call), `実プレイの hooks に共通の処理(${call})が入っている`);
    });
});

// ── 3-3 派閥の予約の清算の信頼が書き戻しで消えない(§7 X05)。第4段 4-A からは Engine.show.settleFactionBookings(両経路) ──
section('3-3: 派閥の予約の清算(F07 メイン推薦)の信頼の変化が作業中のロスターに残る(状態の roster は興行前のまま返す)', () => {
  assert.ok(typeof Engine.show.settleFactionBookings === 'function', 'Engine.show.settleFactionBookings が無い');
  assert.ok(finalizeBody().includes('Engine.show.settleFactionBookings('), 'finalize が Engine.show.settleFactionBookings を呼んでいない');
  const base = clone(showState);
  const leader = base.roster.find(c => !c.injury && !c.isRental && c.trust != null && c.trust > 30 && c.trust < 90);
  const members = base.roster.filter(c => c.id !== leader.id).slice(0, 2).map(c => c.id);
  const fac = { id: 901, name: 'テスト派', leaderId: leader.id, memberIds: [leader.id, ...members] };
  const preShowRoster = base.roster;
  const working = base.roster.map(c => ({ ...c, popularity: (c.popularity || 0) + 1 })); // 作業中のロスター(興行で変わった)
  const others = base.roster.filter(c => !fac.memberIds.includes(c.id)).map(c => c.id);
  const state = { ...base, factions: [...(base.factions || []), fac], _pendingF07Directive: { type: 'DEMAND_MAIN', factionId: 901, remainingShows: 3 } };
  const stateBefore = clone(state);
  const out = Engine.show.settleFactionBookings(state,
    working,
    [{ left: others[0], right: others[1] }], // メインに派閥の選手がいない → リーダーの信頼 −2
    [{ winner: 'left', left: { id: others[0] }, right: { id: others[1] }, hpLeft: { final: 50, max: 100 }, hpRight: { final: 0, max: 100 } }]);
  assert.deepStrictEqual(state, stateBefore, 'settleFactionBookings が入力の状態を書き換えた');
  const before = working.find(c => c.id === leader.id).trust;
  const after = out.roster.find(c => c.id === leader.id).trust;
  assert.ok(after < before, `リーダーの信頼が下がっていない(${before} → ${after})`);
  assert.strictEqual(out.roster.find(c => c.id === leader.id).popularity, working.find(c => c.id === leader.id).popularity,
    '作業中のロスターの他の値(人気)が興行前の値に戻った');
  assert.strictEqual(out.state.roster, preShowRoster, '状態の roster を興行前のロスターに戻していない');
  assert.strictEqual(out.state._pendingF07Directive.remainingShows, 2, '残り興行数が減っていない');
  assert.strictEqual(out.common1MatchIdx, -1);
  assert.deepStrictEqual(out.presentations, { common1Result: null, f08Aftermath: [], f09Ending: null }, '予約の無い演出データが出た');
});

// ── finalize の中身 ──
function runFinalize(ctx = {}) {
  const input = clone(showState);
  const validMatches = (input.showCard || []).filter(m => m.matchType === 'tag'
    ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
    : (m.left > 0 && m.right > 0));
  assert.ok(validMatches.length > 0, 'fixture にカードが無い');
  const begun = Engine.show.beginShow(input, validMatches);
  let roster = begun.roster;
  const results = validMatches.map((m, i) => {
    if (m.matchType === 'tag') {
      const f = id => roster.find(c => c.id === id);
      const tag = Engine.showTagMatch.simulate({ ...begun.state, roster }, { fighter1: f(m.teamA.fighter1), fighter2: f(m.teamA.fighter2) }, { fighter1: f(m.teamB.fighter1), fighter2: f(m.teamB.fighter2) });
      roster = tag.roster;
      return tag.result;
    }
    const rng = Engine.rng.create(Engine.rng.derive(input.rngSeed, input.season, input.week, m.left, m.right));
    return Engine.battle.simulateMatch(roster.find(c => c.id === m.left), roster.find(c => c.id === m.right), rng, 1, {});
  });
  const inputBefore = clone(input);
  const beganBefore = clone(begun.state);
  const fin = Engine.show.finalize(begun.state, validMatches, results, { roster, preShowLosingStreaks: begun.preShowLosingStreaks, preShowState: input, ...ctx });
  return { input, inputBefore, begun, beganBefore, validMatches, results, fin };
}

section('beginShow: 興行数+1・weekPhase・休養願いの解除。入力とロスターの選手を書き換えない', () => {
  const s0 = clone(showState);
  s0.roster[0] = { ...s0.roster[0], forcedRest: true };
  const before = clone(s0);
  const begun = Engine.show.beginShow(s0, (s0.showCard || []).filter(m => m.left > 0 && m.right > 0));
  assert.deepStrictEqual(s0, before, 'beginShow が入力を書き換えた');
  assert.strictEqual(begun.state.totalShows, s0.totalShows + 1);
  assert.strictEqual(begun.state.weekPhase, 'showExec');
  assert.strictEqual(begun.state.roster, s0.roster, 'state.roster は興行前のロスターのまま(finalize の書き戻しまで)');
  assert.strictEqual(begun.roster[0].forcedRest, false, '作業用のロスターで休養願いを外していない');
  assert.ok(begun.roster[0] !== s0.roster[0], '作業用のロスターは写し');
  assert.ok(begun.preShowLosingStreaks instanceof Map && begun.preShowLosingStreaks.size === s0.roster.length);
});

section('finalize: 入力の状態を書き換えない(新しい状態を返す)', () => {
  const run = runFinalize();
  assert.deepStrictEqual(run.input, run.inputBefore, 'finalize が興行前の状態を書き換えた');
  assert.deepStrictEqual(run.begun.state, run.beganBefore, 'finalize が beginShow の状態を書き換えた');
  const s = run.fin.state;
  assert.ok(s !== run.begun.state);
  assert.strictEqual(s.lastShowResults, run.fin.results, '試合結果を lastShowResults に書き戻していない');
  assert.ok(run.fin.results.every(r => Number.isFinite(r.mq) && r.mqInventory), '評価の確定(mq・mqInventory)が付いていない');
  assert.strictEqual(s.totalShows, run.input.totalShows + 1);
  assert.ok(s.lastShowAttendance > 0 && s.lastShowRating, '集客・★を残していない');
  assert.ok(s.roster.every(c => !c.forcedRest), '書き戻したロスターに休養願いが残っている');
  assert.ok(Number.isFinite(run.fin.fp) && Number.isFinite(run.fin.venueHeat));
  assert.ok(Array.isArray(run.fin.titleMatchOutcomes) && Array.isArray(run.fin.showRivalryResolutions));
});

section('finalize: 同じ入力から同じ結果(乱数は状態の種からだけ引く)', () => {
  const a = runFinalize().fin;
  const b = runFinalize().fin;
  assert.deepStrictEqual(a.state, b.state);
  assert.deepStrictEqual(a.events, b.events);
});

section('finalize: hooks は決まった順に1回ずつ、作業中の値の入れ物を受け取って呼ばれる', () => {
  const calls = [];
  const mk = name => w => {
    calls.push(name);
    ['s', 'roster', 'titles', 'rivalries', 'events', 'titleMatchOutcomes', 'validMatches', 'results'].forEach(k => assert.ok(w[k], `${name}: w.${k} が無い`));
  };
  const names = ['afterTitles', 'afterWriteback'];
  const hooks = Object.fromEntries(names.map(n => [n, mk(n)]));
  const plain = runFinalize().fin;
  const hooked = runFinalize({ hooks }).fin;
  assert.deepStrictEqual(calls, names);
  // 何もしない hooks は結果を変えない
  assert.deepStrictEqual(hooked.state, plain.state);
});

section('finalize: hooks が作業中の値を差し替えると、その後の処理はそれを使う', () => {
  const run = runFinalize({ hooks: {
    afterTitles: w => { w.s = { ...w.s, _stage3HookMark: 1 }; },
    afterWriteback: w => {
      assert.strictEqual(w.s.roster, w.roster, 'afterWriteback の時点で書き戻しが済んでいない');
      w.s = { ...w.s, _stage3AfterWriteback: true };
    },
  } });
  assert.strictEqual(run.fin.state._stage3HookMark, 1, 'hooks の状態が引き継がれていない');
  assert.strictEqual(run.fin.state._stage3AfterWriteback, true, 'afterWriteback の状態が引き継がれていない');
});

section('K1-A07: タッグの直近戦績は1試合1枠(A1↔B1・A2↔B2、タッグの印つき)。両経路とも同じ', () => {
  const run = runFinalize();
  const idx = run.validMatches.findIndex(m => m.matchType === 'tag');
  const m = run.validMatches[idx];
  const r = run.results[idx];
  const pairs = [[m.teamA.fighter1, m.teamB.fighter1], [m.teamA.fighter2, m.teamB.fighter2]];
  const expectResult = (id) => {
    if (r.winner === 'draw') return 'draw';
    const inA = id === m.teamA.fighter1 || id === m.teamA.fighter2;
    return (r.winner === 'teamA') === inA ? 'win' : 'loss';
  };
  pairs.forEach(([a, b]) => {
    [[a, b], [b, a]].forEach(([self, opp]) => {
      const before = (run.input.roster.find(c => c.id === self).recentMatches || []);
      const after = run.fin.state.roster.find(c => c.id === self).recentMatches || [];
      const added = after.filter(e => e.season === run.input.season && e.week === run.input.week);
      assert.strictEqual(added.length, 1, `選手${self}のこの興行の直近戦績が ${added.length} 枠(1試合1枠のはず)`);
      assert.deepStrictEqual(added[0], { opponentId: opp, result: expectResult(self), season: run.input.season, week: run.input.week, tag: true });
      assert.ok(after.length <= 5 && after.length >= Math.min(5, before.length), '直近5戦の枠');
    });
  });
  // 実プレイも同じ(対角4組の指定は無い)
  const app = readSource('src', 'app.js');
  assert.ok(!/recentMatchesTagDiagonal/.test(app) && !/recentMatchesTagDiagonal/.test(finalizeBody()), '対角4組の記録が残っている');
  // 表示: タッグの印
  const ui = readSource('src', 'ui-common.js');
  assert.ok(/m\.tag \? `<span style="color:var\(--text-dim\)">\(\$\{WM_I18N\.t\('タッグ'\)\}\)<\/span>` : ''/.test(ui), '選手ポップアップの直近にタッグの印が無い');
});

section('finalize: ctx.logStyle — 省略時は文字列、structured は実プレイの gameLog の型', () => {
  const text = runFinalize().fin.events;
  const structured = runFinalize({ logStyle: 'structured' }).fin.events;
  assert.ok(text.some(e => typeof e === 'string' && e.startsWith('📊 ★')), 'エンジンの★の一文が無い');
  assert.ok(structured.some(e => e && (e.type === 'show_rating_org_pop_update' || e.type === 'show_rating_org_pop_update_small_venue')),
    '実プレイの★の構造化ログが無い');
  assert.ok(!structured.some(e => typeof e === 'string' && e.startsWith('📊 ★')), '構造化ログに文字列の★が混ざった');
});

// ── 第4段 4-A: 実プレイだけにあった処理がエンジンの経路でも起きる ──
section('4-A K1-A01: キャリア最高評価の更新と信頼ボーナス(+1.2)が finalize で付く(両経路共通)', () => {
  const run = runFinalize();
  let checked = 0;
  run.results.forEach((r, i) => {
    const m = run.validMatches[i];
    const ids = m.matchType === 'tag' ? [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2] : [m.left, m.right];
    ids.forEach(id => {
      const before = run.input.roster.find(c => c.id === id);
      const after = run.fin.state.roster.find(c => c.id === id);
      if (!before || !after || !(r.mq > (before.careerBestMQ || 0))) return;
      checked++;
      assert.strictEqual(after.careerBestMQ, r.mq, `選手${id}のキャリア最高評価が更新されていない`);
      assert.ok((after._trustBonusSources || []).includes('careerBestMQ'), `選手${id}に最高評価の信頼ボーナスが付いていない`);
    });
  });
  assert.ok(checked > 0, 'fixture に最高評価を更新する出場者がいない(検査にならない)');
});

section('4-A K1-A02: ブレークスルー・スランプの判定は finalize の中(Engine.show.applyGrowthEvents)。演出データは _pendingGrowthEvents', () => {
  const body = finalizeBody();
  assert.ok(body.includes('Engine.show.applyGrowthEvents('), 'finalize が Engine.show.applyGrowthEvents を呼んでいない');
  // 出場者の多い興行を何本か回し、ブレークスルー・スランプの演出データが状態に載ることを確かめる(乱数の種を変える)
  let events = 0;
  for (let k = 0; k < 12 && events === 0; k++) {
    const input = clone(showState);
    input.rngSeed = 1000 + k;
    const validMatches = input.showCard.filter(m => m.matchType === 'tag' || (m.left > 0 && m.right > 0));
    const begun = Engine.show.beginShow(input, validMatches);
    let roster = begun.roster;
    const results = validMatches.map(m => {
      if (m.matchType === 'tag') {
        const f = id => roster.find(c => c.id === id);
        const tag = Engine.showTagMatch.simulate({ ...begun.state, roster }, { fighter1: f(m.teamA.fighter1), fighter2: f(m.teamA.fighter2) }, { fighter1: f(m.teamB.fighter1), fighter2: f(m.teamB.fighter2) });
        roster = tag.roster;
        return tag.result;
      }
      const rng = Engine.rng.create(Engine.rng.derive(input.rngSeed, input.season, input.week, m.left, m.right));
      return Engine.battle.simulateMatch(roster.find(c => c.id === m.left), roster.find(c => c.id === m.right), rng, 1, {});
    });
    const fin = Engine.show.finalize(begun.state, validMatches, results, { roster, preShowLosingStreaks: begun.preShowLosingStreaks, preShowState: input });
    const ge = fin.state._pendingGrowthEvents || [];
    ge.forEach(e => assert.ok(['breakthrough', 'slump_start', 'motivation_loss_start'].includes(e.type), `知らない成長イベント ${e.type}`));
    events += ge.length;
  }
  assert.ok(events > 0, '12本回してブレークスルー・スランプが一度も起きない(エンジンの経路で判定していない疑い)');
});

section('4-A K1-A10・§7 X07: ドーム興行の経歴・ドーム回数・初ドームの節目と MVP 用の大試合が finalize で付く', () => {
  const dome = Engine.show.recordCareerMarks(
    { ...clone(showState), showVenue: 9, domeShowsThisSeason: 0, milestones: {} },
    clone(showState.roster),
    [{ left: showState.showCard[0].left, right: showState.showCard[0].right }, { left: showState.showCard[1].left, right: showState.showCard[1].right }],
    [{ winner: 'left', mq: 90 }, { winner: 'right', mq: 40 }]);
  assert.strictEqual(dome.state.domeShowsThisSeason, 1, 'ドーム回数が増えていない');
  assert.strictEqual(dome.state.milestones.first_dome_show, true, '初ドームの節目が立っていない');
  const main = dome.roster.find(c => c.id === showState.showCard[0].left);
  const hist = main.careerRecord.history.filter(e => e.season === showState.season && e.week === showState.week);
  assert.ok(hist.some(e => e.type === 'domeMain' && e.result === 'win' && e.matchType === 'main'), 'メインの勝者に domeMain が無い');
  assert.ok(hist.some(e => e.type === 'bigMatch' && e.mq === 90), '評価85以上の試合に bigMatch が無い');
  const second = dome.roster.find(c => c.id === showState.showCard[1].left);
  assert.ok(!(second.careerRecord?.history || []).some(e => e.season === showState.season && e.week === showState.week), 'メインでも王座戦でもない試合に経歴を刻んだ');
});

if (failed > 0) {
  console.log(`\nFAIL: ${failed} 件`);
  process.exit(1);
}
console.log('\nALL PASS');
