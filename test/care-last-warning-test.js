#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/care-last-warning-test.js — 退団寸前の引き留め(docs/care-last-warning-design-v0.1.md)の回帰ガード
//
//  ■ 何を守るか(設計書 §6 の不変条件のうち、単体で確かめられるもの)
//    A  言葉だけでは届かない帯: 声かけ・S4「励ましの言葉」の信頼の伸びに帯の倍率(25以上 ×1・20以下 ×0.25)。
//       25以上の効き目は1ビットも変えない / スランプの回復促進・周りとの絆の微増は帯の中でも変えない(I-1 の対)
//    B  原因の帳簿(trustStrain)・噂の原因(lastWarning)・原因に合った手当て。
//       戻る量は帳簿のその原因の分の半分を超えない / 外し続けてから入れ直した子は入れ続けた子を必ず下回る(I-2 の対)
//       手当てが無い世界(帳簿を持たない呼び出し・AI 団体)では何も変わらない(I-6)/ 古いセーブで壊れない(I-8)
//    見せ方: 噂のログの一節(cause 付き)・古いログは今の文 / セリフの器は口調を越えて落ちない
//
//  ■ 使い方
//    node test/care-last-warning-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── 選手と状態の組み立て(実在の表に依存しない最小の形) ──
// orgJoinWeek は大きくして「在籍8週未満」にし、孤立(R2)の減りが立たないようにする(式の検算を単純にするため)
function mk(id, over = {}) {
  return {
    id, name: `選手${id}`, pw: 50, sp: 50, te: 50, st: 50, mn: 50, age: 24, trust: 40,
    popularity: 20, condition: 80, traits: [], personality: 'normal', archetype: 'standard',
    noAppearStreak: 0, orgJoinWeek: 9999, wins: 0, losses: 0, draws: 0,
    ...over,
  };
}
function mkState(roster, over = {}) {
  return {
    rngSeed: 4242, season: 2, week: 10, offSeason: false, orgPop: 40, funds: 100000, decisionPoints: 6,
    lockerRoomMorale: 60, roster, titles: { world: { championId: null } }, coaches: [], coachAssign: {},
    relationships: {}, _decisionWeekUsed: {},
    ...over,
  };
}
const single = (a, b, mq = 55) => ({ matchType: 'single', left: { id: a }, right: { id: b }, winner: 'left', mq });
const trustOf = (roster, id) => roster.find(f => f.id === id).trust;
const fOf = (roster, id) => roster.find(f => f.id === id);

// 興行1回ぶん: ids の選手が2人ずつ当たる通常興行の結果
function showResults(ids) {
  const out = [];
  for (let i = 0; i + 1 < ids.length; i += 2) out.push(single(ids[i], ids[i + 1]));
  return out;
}

// ══════════════════════════════════════════════════════════════════════════════
//  A: 言葉だけでは届かない帯
// ══════════════════════════════════════════════════════════════════════════════
section('A: 帯の倍率 — 25以上 ×1・20以下 ×0.25・間はなだらか(smoothstep)。数値は CARE_LAST_WARNING', () => {
  assert.strictEqual(typeof CARE_LAST_WARNING, 'object', 'CARE_LAST_WARNING(data.js)が無い');
  const m = t => Engine.trust.encourageBandMult(t);
  assert.strictEqual(m(60), 1); assert.strictEqual(m(25), 1); assert.strictEqual(m(25.0001), 1);
  assert.strictEqual(m(20), 0.25); assert.strictEqual(m(12), 0.25); assert.strictEqual(m(0), 0.25);
  assert.ok(near(m(22.5), 0.625), `22.5 → 0.625 のはずが ${m(22.5)}`);
  assert.ok(m(24) > 0.9 && m(24) < 0.95, `24 → 約0.92 のはずが ${m(24)}`);
  assert.ok(m(21) > 0.3 && m(21) < 0.36, `21 → 約0.33 のはずが ${m(21)}`);
  // 坂の最大の傾きは信頼1あたり 0.23 以下(隣り合う値で体感が跳ねない)
  for (let t = 20; t < 25; t += 0.1) assert.ok(m(t + 0.1) - m(t) <= 0.0226, `坂が急すぎる(${t})`);
});

function encourageAt(trust, extra = {}) {
  const f = mk(1, { trust, ...extra });
  const others = [mk(2), mk(3)];
  const state = mkState([f, ...others], { relationships: {} });
  return { state, result: Engine.shachoshitsu.execute('encourage', 1, state) };
}
function encourageFormula(fighter) {
  // 現行の式(A を入れる前と同じ): applyCoeff(0.77 × 不確実性, メンタル) × OVR傾斜 × 高帯の逓減
  const doc = Engine.shachoshitsu.getDoc('encourage');
  const fm = Engine.shachoshitsu.calcUncertainty('encourage', fighter);
  let adj = Engine.trust.applyCoeff((doc.effect.trust ?? 0.77) * fm, fighter.mn || 50);
  adj *= 0.7 + (100 - Engine.util.ov(fighter)) / 100 * 0.9;
  if (adj > 0) adj *= Engine.trust.gainMult(fighter.trust);
  return Engine.util.clamp(fighter.trust + adj, 0, 100);
}

section('A(I-1 の対): 信頼25以上の声かけは現行の式と1ビットも違わない。反応の鍵も今のまま', () => {
  for (const t of [25, 30, 42.37, 49.9]) {
    const { state, result } = encourageAt(t);
    assert.ok(!result.error, `error ${result.error}`);
    assert.strictEqual(trustOf(result.roster, 1), encourageFormula(state.roster[0]), `信頼${t}で式と一致しない`);
    assert.strictEqual(result.reactionKey, 'encourage');
  }
});

section('A: 信頼20以下の伸びは現行の ×0.25、坂の中は m(t) 倍。20未満は反応の鍵 encourage_last_warning と「表情は硬いまま」', () => {
  for (const t of [8, 15, 19.9, 20, 22.5, 24]) {
    const { state, result } = encourageAt(t);
    const base = encourageFormula(state.roster[0]) - t;
    const got = trustOf(result.roster, 1) - t;
    assert.ok(near(got, base * Engine.trust.encourageBandMult(t), 1e-12), `信頼${t}: 伸び ${got} ≠ ${base} × m`);
    if (t < 20) {
      assert.strictEqual(result.reactionKey, 'encourage_last_warning', `信頼${t}の反応の鍵`);
      const texts = result.changes.map(c => c.text).filter(Boolean);
      assert.ok(texts.includes('話は最後まで聞いてくれた。けれど、表情は硬いままだ'), '「表情は硬いまま」が出ていない');
      assert.ok(!texts.includes('話を聞いてもらえたことで、少しだけ救われたようだ'), '救われた、が残っている');
      assert.ok(!result.changes.some(c => c.label === '本人の様子'), '「本人の様子: 和らいだ」が硬いままと食い違う');
    } else {
      assert.strictEqual(result.reactionKey, 'encourage');
    }
  }
});

section('A(I-1 の対): スランプの回復促進と周りとの絆の微増は、帯の中でも帯の外と同じ', () => {
  const slump = { type: 'defeat', weeksLeft: 4, recoveryMomentum: 0 };
  const low = encourageAt(15, { slump }).result;
  const mid = encourageAt(35, { slump }).result;
  assert.strictEqual(fOf(low.roster, 1).slump.recoveryMomentum, fOf(mid.roster, 1).slump.recoveryMomentum, 'スランプの回復促進が帯で変わった');
  assert.deepStrictEqual(low.relationships, mid.relationships, '周りとの絆の微増が帯で変わった');
  assert.ok(low.changes.some(c => c.label === 'スランプ回復'), 'スランプ回復の行が消えた');
});

section('A: S4「励ましの言葉」にも同じ帯の倍率。AI 団体のイベント(opts.ai)には掛けない', () => {
  const run = (trust, opts) => {
    const state = mkState([mk(7, { trust }), mk(8)]);
    const ev = { type: 'S4', fighter: 7, name: '選手7' };
    const out = Engine.eventSystem.applyChoiceEffect(ev, 3, state, Engine.rng.create(1), opts);
    return trustOf(out.roster, 7) - trust;
  };
  const full = Engine.trust.applyCoeff(2.30, 50);
  assert.ok(near(run(30), full), `信頼30は今の効き目(${full})のはずが ${run(30)}`);
  assert.ok(near(run(15), full * 0.25), `信頼15は ×0.25 のはずが ${run(15)}`);
  assert.ok(near(run(15, { ai: true }), full), 'AI 団体の S4 にまで帯の倍率が掛かった');
});

// ══════════════════════════════════════════════════════════════════════════════
//  B: 原因の帳簿と原因に合った手当て
// ══════════════════════════════════════════════════════════════════════════════
section('B: 帳簿 — 自団体の通常興行(ledger)だけが積む。出場しなかった減りは出番、興行ごとに ×0.8。帳簿を持たない呼び出しの信頼は1ビットも違わない', () => {
  const roster = [1, 2, 3, 4, 5].map(id => mk(id, { trust: 35 }));
  roster[4] = { ...roster[4], trustStrain: { stage: 10, bonds: 5 } };
  const state = mkState(roster);
  const results = showResults([1, 2, 3, 4]);          // 5 は出番なし
  const off = Engine.trust.applyShowTrust(roster, results, state.titles, state);
  const on = Engine.trust.applyShowTrust(roster, results, state.titles, state, { ledger: true });
  roster.forEach(f => assert.strictEqual(trustOf(on.roster, f.id), trustOf(off.roster, f.id), `選手${f.id}の信頼が帳簿の有無で変わった`));
  assert.ok(off.roster.every(f => f.id === 5 || f.trustStrain === undefined), '帳簿を持たない呼び出しが帳簿を作った');
  assert.deepStrictEqual(fOf(off.roster, 5).trustStrain, { stage: 10, bonds: 5 }, '帳簿を持たない呼び出しが帳簿を薄めた');
  const s5 = fOf(on.roster, 5).trustStrain;
  const lossBench = -Engine.trust.applyCoeff(-2.64, 50) * Engine.trust.trustSensitivity(35);
  assert.ok(near(s5.stage, Math.round((8 + lossBench) * 1000) / 1000, 0.002), `出番の帳簿 ${s5.stage} ≠ 10×0.8 + 不出場の減り ${lossBench}`);
  assert.ok(near(s5.bonds, 4, 0.002), `人間関係の帳簿 ${s5.bonds} ≠ 5×0.8`);
  assert.ok(s5.other > 0, '自然減(その他)が積まれていない');
  const s1 = fOf(on.roster, 1).trustStrain;
  assert.ok(!s1.stage, '出場した選手に出番の減りが積まれた');
});

section('B: 噂の原因 — その他を除いていちばん重いまとまり。全体の3割未満・帳簿が空(古いセーブ)は「はっきりしない」', () => {
  const p = s => Engine.trust.pickWarningCause({ trustStrain: s });
  assert.strictEqual(p({ stage: 6, bonds: 3, other: 1 }), 'stage');
  assert.strictEqual(p({ stage: 2, bonds: 5, other: 1 }), 'bonds');
  assert.strictEqual(p({ stage: 2, bonds: 2, pay: 2, other: 2 }), 'general', '25%しかないのに決めつけた');
  assert.strictEqual(p({ other: 9 }), 'general');
  assert.strictEqual(p({}), 'general');
  assert.strictEqual(Engine.trust.pickWarningCause(mk(1)), 'general', '帳簿の無い選手(古いセーブ)');
  assert.strictEqual(p({ stage: 3, bonds: 3 }), 'stage', '同じ重さなら並びが先(出番)');
});

function answerScenario({ lw = { cause: 'stage', week: 90, answered: false }, trust = 16, strain = { stage: 10 }, play = true } = {}) {
  const hero = mk(9, { trust, trustStrain: strain, lastWarning: lw });
  const twin = mk(10, { trust, trustStrain: strain });  // 噂の状態が無い同じ選手
  const roster = [hero, twin, mk(1), mk(2), mk(3), mk(4)];
  const state = mkState(roster);
  // 先頭の試合はメイン(舞台の加点)なので、主役と双子はメインの外で同じ条件の試合に出す
  const ids = play ? [3, 4, 9, 1, 10, 2] : [1, 2, 3, 4];
  return { state, out: Engine.trust.applyShowTrust(roster, showResults(ids), state.titles, state, { ledger: true }) };
}

section('B: 出番の手当て — 噂の状態の選手を通常興行に出すと、帳簿の出番の分(×0.8 の後)の半分がすぐ戻り、戻りの鈍りが外れる', () => {
  const { state, out } = answerScenario();
  const hero = fOf(out.roster, 9), twin = fOf(out.roster, 10);
  const rm = Engine.trust.recoveryMult(16);
  const unDull = Engine.trust.applyCoeff(1.53 * (1 - rm), 50) * Engine.trust.trustSensitivity(16);
  const relief = 0.5 * 8;
  assert.ok(near(hero.trust - twin.trust, relief + unDull, 1e-9), `差 ${hero.trust - twin.trust} ≠ 戻り ${relief} + 鈍り外し ${unDull}`);
  assert.strictEqual(hero.lastWarning.answered, true);
  assert.strictEqual(hero.lastWarning.answeredBy, 'card');
  assert.strictEqual(hero.lastWarning.answeredWeek, Engine.util.absWeek(state.season, state.week));
  assert.ok(!hero.trustStrain.stage, '応えた原因の帳簿が0に戻っていない');
  // 戻る量は帳簿のその原因の分の半分を超えない(I-2 の対)
  assert.ok(hero.lastWarning.relief <= 0.5 * 8 + 1e-9, `戻った量 ${hero.lastWarning.relief} が帳簿の半分を超えた`);
  // 応えられるのは噂1回につき1度: 次の興行では戻らない(鈍りの解除だけ続く)
  const again = Engine.trust.applyShowTrust(out.roster, showResults([9, 1, 10, 2]), state.titles, state, { ledger: true });
  const hero2 = fOf(again.roster, 9);
  assert.strictEqual(hero2.lastWarning.relief, hero.lastWarning.relief, '2度目も応えた扱いになった');
});

section('B: その興行の試合で怪我をした噂の状態の選手も、カードに入れた手当ては成立(興行の信頼の更新はしない規則のまま、戻る分だけ)', () => {
  const hero = mk(9, { trust: 16, trustStrain: { stage: 10 }, lastWarning: { cause: 'stage', week: 90, answered: false }, injury: { type: 'x', weeksLeft: 3 } });
  const roster = [hero, mk(1), mk(2), mk(3)];
  const state = mkState(roster);
  const out = Engine.trust.applyShowTrust(roster, showResults([2, 3, 9, 1]), state.titles, state, { ledger: true });
  const h = fOf(out.roster, 9);
  assert.ok(near(h.trust, 16 + 4), `怪我をした選手: 信頼 ${h.trust} ≠ 16 + 帳簿の半分(10×0.8×0.5)`);
  assert.strictEqual(h.lastWarning.answered, true);
  assert.strictEqual(h.noAppearStreak, 0 + (hero.noAppearStreak || 0), '怪我をした選手の連続不出場を動かした');
  // 出場していない怪我人・休暇中の選手には何も起きない(帳簿を薄めるだけ)
  const idle = mk(8, { trust: 16, trustStrain: { stage: 10 }, lastWarning: { cause: 'stage', week: 90, answered: false }, injury: { type: 'x', weeksLeft: 3 } });
  const out2 = Engine.trust.applyShowTrust([idle, mk(1), mk(2)], showResults([1, 2]), state.titles, mkState([idle, mk(1), mk(2)]), { ledger: true });
  assert.strictEqual(fOf(out2.roster, 8).trust, 16);
  assert.strictEqual(fOf(out2.roster, 8).lastWarning.answered, false);
  assert.ok(near(fOf(out2.roster, 8).trustStrain.stage, 8), '怪我中の選手の帳簿が薄まっていない');
});

section('B: 合わない原因・応えた後・噂の状態が解けた(信頼30以上)・出場しなかった選手には何も起きない', () => {
  const cmp = (opts) => {
    const { out } = answerScenario(opts);
    return { hero: fOf(out.roster, 9), twin: fOf(out.roster, 10) };
  };
  let r = cmp({ lw: { cause: 'bonds', week: 90, answered: false }, strain: { stage: 10, bonds: 4 } });
  assert.strictEqual(r.hero.trust, r.twin.trust, '人間関係が原因なのに出番で戻った');
  r = cmp({ lw: { cause: 'stage', week: 90, answered: false }, trust: 31 });
  assert.strictEqual(r.hero.trust, r.twin.trust, '噂の状態が解けた後(信頼31)に戻った');
  r = cmp({ play: false });
  assert.strictEqual(r.hero.trust, r.twin.trust, '出場していないのに戻った');
  assert.strictEqual(r.hero.lastWarning.answered, false);
});

section('B(I-2 の対): 外し続けてから入れ直した子の信頼は、入れ続けた子を必ず下回る(出し惜しみで得をしない)', () => {
  for (const [t0, st0] of [[18, 8], [14, 12], [19.5, 4], [12, 20]]) {
    for (const hold of [1, 2, 3]) {
      const start = () => mk(9, { trust: t0, trustStrain: { stage: st0 }, lastWarning: { cause: 'stage', week: 90, answered: false } });
      const fill = [mk(1), mk(2), mk(3), mk(4), mk(5)];
      const run = benchShows => {
        let roster = [start(), ...fill];
        for (let i = 0; i < 4; i++) {
          const state = mkState(roster, { week: 10 + 2 * i });
          const ids = i < benchShows ? [1, 2, 3, 4] : [9, 1, 2, 3];
          roster = Engine.trust.applyShowTrust(roster, showResults(ids), state.titles, state, { ledger: true }).roster;
        }
        return trustOf(roster, 9);
      };
      const always = run(0), delayed = run(hold);
      assert.ok(always > delayed, `信頼${t0}・出番の帳簿${st0}・${hold}回外した: 入れ続け ${always} ≦ 入れ直し ${delayed}`);
    }
  }
});

section('B: 慰労会は人間関係・空気の手当て(帳簿の半分)。出番が原因の子には上乗せなし。慰労会そのものの効き目は変わらない', () => {
  const lwB = { cause: 'bonds', week: 90, answered: false };
  const lwS = { cause: 'stage', week: 90, answered: false };
  const roster = [
    mk(1, { trust: 15, trustStrain: { bonds: 6 }, lastWarning: lwB }), mk(2, { trust: 15, trustStrain: { bonds: 6 } }),
    mk(3, { trust: 15, trustStrain: { stage: 6 }, lastWarning: lwS }), mk(4, { trust: 15, trustStrain: { stage: 6 } }),
    mk(5, { trust: 15, trustStrain: { air: 4 }, lastWarning: { cause: 'air', week: 90, answered: false } }),
  ];
  const r = Engine.shachoshitsu.execute('party', null, mkState(roster, { lockerRoomMorale: 30 }));
  assert.ok(!r.error, r.error);
  assert.ok(near(trustOf(r.roster, 1) - trustOf(r.roster, 2), 3), `人間関係: 差 ${trustOf(r.roster, 1) - trustOf(r.roster, 2)} ≠ 3`);
  assert.strictEqual(trustOf(r.roster, 3), trustOf(r.roster, 4), '出番が原因の子に慰労会で上乗せが付いた');
  assert.ok(near(trustOf(r.roster, 5) - trustOf(r.roster, 4), 2), '空気が原因の子に帳簿の半分が戻っていない');
  assert.strictEqual(fOf(r.roster, 1).lastWarning.answeredBy, 'party');
  assert.strictEqual(fOf(r.roster, 3).lastWarning.answered, false);
});

section('B: ボーナスは給与の手当て(相場以上 r≥0.8 だけ)。相場未満・出番が原因の子には上乗せなし', () => {
  const run = (lw, presetIndex) => {
    const f = mk(1, { trust: 15, trustStrain: { pay: 8, stage: 8 }, lastWarning: lw });
    const twin = mk(1, { trust: 15, trustStrain: { pay: 8, stage: 8 } });
    const a = Engine.shachoshitsu.execute('bonus', 1, mkState([f, mk(2)]), { presetIndex });
    const b = Engine.shachoshitsu.execute('bonus', 1, mkState([twin, mk(2)]), { presetIndex });
    const props = Engine.shachoshitsu.getBonusProposals(f, mkState([f, mk(2)]));
    return { diff: trustOf(a.roster, 1) - trustOf(b.roster, 1), r: props[presetIndex].r, lw: fOf(a.roster, 1).lastWarning };
  };
  const pay = { cause: 'pay', week: 90, answered: false };
  const hi = run(pay, 2);
  assert.ok(hi.r >= 0.8, `案3の r=${hi.r}`);
  assert.ok(near(hi.diff, 4), `相場以上: 差 ${hi.diff} ≠ 4(帳簿の給与8の半分)`);
  assert.strictEqual(hi.lw.answeredBy, 'bonus');
  const lo = run(pay, 0);
  assert.ok(lo.r < 0.8, `案1の r=${lo.r}`);
  assert.strictEqual(lo.diff, 0, '相場未満のボーナスで給与の手当てが成立した');
  const stage = run({ cause: 'stage', week: 90, answered: false }, 2);
  assert.strictEqual(stage.diff, 0, '出番が原因の子にボーナスで上乗せが付いた');
});

section('B: 契約更改 — 信頼が下がった分は給与の帳簿へ。昇給を受けたら給与の手当て', () => {
  const neg = (f, attitude, extra = {}) => ({ fighterId: f.id, fighterName: f.name, attitude, context: { isFounder: false }, gapRatio: 1.0, raiseAmount: 5, ...extra });
  const f = mk(1, { trust: 20 });
  const out = Engine.contract.resolveNegotiation(Engine.rng.create(3), mkState([f, mk(2)]), neg(f, 'raise'), 2);
  const nf = fOf(out.state.roster, 1);
  assert.ok(nf.trustStrain && near(nf.trustStrain.pay, 20 - nf.trust, 0.002), `昇給を断った減りが給与に積まれていない: ${JSON.stringify(nf.trustStrain)}`);
  const g = mk(3, { trust: 18, trustStrain: { pay: 6 }, lastWarning: { cause: 'pay', week: 90, answered: false } });
  const twin = mk(3, { trust: 18, trustStrain: { pay: 6 } });
  const a = Engine.contract.resolveNegotiation(Engine.rng.create(3), mkState([g, mk(2)]), neg(g, 'raise'), 0);
  const b = Engine.contract.resolveNegotiation(Engine.rng.create(3), mkState([twin, mk(2)]), neg(twin, 'raise'), 0);
  assert.ok(near(trustOf(a.state.roster, 3) - trustOf(b.state.roster, 3), 3), '昇給を受けたのに給与の帳簿の半分が戻らない');
});

section('B: 派閥・週次の関係の出来事・仲間の退団・破約の減りも帳簿へ(派閥/人間関係/人間関係/約束)。AI 団体の退団の波及は積まない', () => {
  const s = mkState([mk(1, { trust: 40 }), mk(2)]);
  const fac = Engine.factions._applyTrustToMembers(s, [1], -3);
  assert.ok(fOf(fac.roster, 1).trustStrain.faction > 0, '派閥の減りが積まれていない');
  const rels = { '1>5': { bond: 80, rivalry: 0 }, '5>1': { bond: 80, rivalry: 0 } };
  const dep = Engine.trust.applyDepartureTrustImpact([mk(1, { trust: 40 })], 5, rels, { name: 'x', reason: '突然退団' });
  assert.ok(dep[0].trustStrain.bonds > 0, '仲間の退団の減りが人間関係に積まれていない');
  const depAI = Engine.trust.applyDepartureTrustImpact([mk(1, { trust: 40 })], 5, rels, { name: 'x', reason: 'AI引退', ledger: false });
  assert.strictEqual(depAI[0].trustStrain, undefined, 'AI 団体の退団の波及が帳簿に積まれた');
  assert.ok(depAI[0].trust < 40);
  // 破約(メインを約束したのにメインに出さなかった)
  const ps = mkState([mk(1, { trust: 40, personality: 'bold' }), mk(2), mk(3), mk(4)], {
    week: 10, pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(2, 9) }, lastShowResults: [single(2, 3)],
  });
  const settled = Engine.shachoshitsu.settlePledge(ps);
  assert.strictEqual(settled.outcome, 'broken');
  assert.ok(near(fOf(settled.roster, 1).trustStrain.promise, 40 - trustOf(settled.roster, 1), 0.002), '破約の減りが約束に積まれていない');
  // 週次の関係の出来事(片思い: A→B 絆70以上・B→A 40以下)
  const ws = mkState([mk(1, { trust: 40 }), mk(2, { trust: 40 })], {
    week: 11, relationships: { '1>2': { bond: 80, rivalry: 0 }, '2>1': { bond: 30, rivalry: 0 } }, lastShowResults: [],
  });
  const wk = Engine.relationships.processWeeklyStoryEvents(ws, Engine.rng.create(7));
  const w1 = fOf(wk.state.roster, 1);
  assert.ok(w1.trust < 40 && near(w1.trustStrain.bonds, 40 - w1.trust, 0.002), `片思いの減りが人間関係に積まれていない: ${JSON.stringify(w1.trustStrain)}`);
});

section('B: 団体を移った選手は帳簿と噂の状態を持ち越さない(orgTimeline.transfer)', () => {
  const f = mk(1, { trustStrain: { stage: 3 }, lastWarning: { cause: 'stage', week: 90, answered: false }, orgTimeline: [{ orgId: 'player', fromSeason: 1, fromWeek: 1 }] });
  const moved = Engine.orgTimeline.transfer(f, 'fa', 3, 5);
  assert.strictEqual(moved.trustStrain, undefined);
  assert.strictEqual(moved.lastWarning, undefined);
  assert.ok(f.trustStrain, '入力を書き換えた');
});

// ══════════════════════════════════════════════════════════════════════════════
//  見せ方: ログの一節・セリフの器
// ══════════════════════════════════════════════════════════════════════════════
section('見せ方: 噂のログ — cause 付きは原因の一節、cause の無い古いログ・原因がはっきりしない回は今の文', () => {
  const text = (variant, cause) => gameLogEntryText({ type: 'trust_departure_rumor', data: cause ? { name: 'C', variant, cause } : { name: 'C', variant } });
  assert.strictEqual(text('below20'), '💬 Cが退団を考えているという噂がある');
  assert.strictEqual(text('below15'), '💬 Cが退団を決めかけているという噂がある');
  assert.strictEqual(text('below20', 'stage'), '💬 Cが退団を考えているという噂がある。出番のない興行が続いている');
  assert.strictEqual(text('below15', 'stage'), '💬 Cが退団を決めかけているという噂がある。控室で出番表を見ていたという');
  assert.strictEqual(text('below20', 'bonds'), '💬 Cが退団を考えているという噂がある。控室で浮いているらしい');
  assert.strictEqual(text('below15', 'bonds'), '💬 Cが退団を決めかけているという噂がある。控室で誰とも口をきいていないという');
  assert.strictEqual(text('below15', 'air'), '💬 Cが退団を決めかけているという噂がある。団体の空気に嫌気がさしているらしい');
  assert.strictEqual(text('below20', 'promise'), '💬 Cが退団を考えているという噂がある', '約束には一節を作らない');
  // 地の文の一節は7本(出番・人間関係は20/15で別、空気・給与・王座は共通)。数値を含まない
  const T = GAMELOG_TEMPLATES.trust_departure_rumor;
  const clauses = new Set(Object.keys(T).filter(k => k.includes('_')).map(k => T[k].split('。')[1]));
  assert.strictEqual(clauses.size, 7, `一節が ${clauses.size} 本`);
  clauses.forEach(c => assert.ok(!/[0-9０-９]/.test(c), `一節に数字: ${c}`));
});

section('見せ方: セリフの器 — 原因×アーキタイプ×性格で引き、無ければ同じ口調の normal、それも無ければ null(別の口調に落ちない)', () => {
  const saved = clone(LAST_WARNING_ENCOURAGE_LINES);
  try {
    LAST_WARNING_ENCOURAGE_LINES.stage = { delinquent: { bold: ['口だけならいくらでも言えんだろ'] }, standard: { normal: ['話はわかった'] } };
    LAST_WARNING_ENCOURAGE_LINES.general = { standard: { normal: ['話は聞いた'] } };
    const pool = (cause, a, p) => Engine.trust.lastWarningLinePool('encourage', cause, { archetype: a, personality: p });
    assert.deepStrictEqual(pool('stage', 'delinquent', 'bold'), ['口だけならいくらでも言えんだろ']);
    assert.deepStrictEqual(pool('stage', 'standard', 'shy'), ['話はわかった'], '同じ口調の normal に落ちていない');
    assert.strictEqual(pool('stage', 'ojousama', 'normal'), null, 'お嬢様が標準の口調のセリフに落ちた');
    assert.strictEqual(pool('stage', 'delinquent', 'quiet'), null);
    assert.deepStrictEqual(pool('pay', 'standard', 'normal'), ['話は聞いた'], '給与は「はっきりしない」の表で引く');
    // 反応文: 引ければ原因の表、引けなければ今の声かけの反応文
    const hero = { archetype: 'standard', personality: 'normal', lastWarning: { cause: 'stage' } };
    assert.strictEqual(Engine.shachoshitsu.getReactionText('encourage_last_warning', hero), '話はわかった');
    const ojou = { archetype: 'ojousama', personality: 'normal', lastWarning: { cause: 'stage' } };
    const fallback = getDialoguePool(CARE_REACTION_DIALOGUES.encourage, ojou);
    assert.ok(fallback.includes(Engine.shachoshitsu.getReactionText('encourage_last_warning', ojou)), '今の反応文に落ちていない');
  } finally {
    Object.keys(LAST_WARNING_ENCOURAGE_LINES).forEach(k => { LAST_WARNING_ENCOURAGE_LINES[k] = saved[k]; });
  }
});

section('見せ方: 20割れの噂の本人の一言 — 出番・人間関係は原因の表(引ければ)。応えてもらえた一言は表にあるときだけ確定枠へ', () => {
  const savedR = clone(LAST_WARNING_RUMOR_LINES), savedA = clone(LAST_WARNING_ANSWERED_LINES);
  try {
    LAST_WARNING_RUMOR_LINES.stage = { standard: { normal: ['今週も出番表に名前がなかった'] } };
    LAST_WARNING_ANSWERED_LINES.stage = { standard: { normal: ['名前、あった'] } };
    const f = mk(1, { trust: 19, trustStrain: { stage: 9, other: 1 } });
    const g2 = mk(2, { trust: 19, archetype: 'ojousama', trustStrain: { stage: 9, other: 1 } });
    const g3 = mk(3, { trust: 19, trustStrain: { other: 3 } });
    const state = mkState([f, g2, g3], { _glimpseAPrevTrust: { 1: 22, 2: 22, 3: 22 } });
    const out = Engine.glimpse.checkALayer(state, Engine.rng.create(5));
    const by = id => out.glimpses.find(g => g.speakerId === id && g.type === 'trust_below_20');
    assert.strictEqual(by(1).cause, 'stage');
    assert.strictEqual(by(1).dialogue, '今週も出番表に名前がなかった');
    assert.strictEqual(by(2).cause, 'stage');
    assert.ok(getDialoguePool(GLIMPSE_A_LINES.trust_below_20, g2).includes(by(2).dialogue), 'お嬢様が今の表に落ちていない');
    assert.strictEqual(by(3).cause, 'general');
    // 応えてもらえた一言(出番のみ・応えた週だけ)
    const abs = Engine.util.absWeek(2, 10);
    const h = mk(4, { trust: 22, lastWarning: { cause: 'stage', week: abs - 4, answered: true, answeredBy: 'card', answeredWeek: abs } });
    const o = mk(5, { trust: 22, archetype: 'cool', lastWarning: { cause: 'stage', week: abs - 4, answered: true, answeredBy: 'card', answeredWeek: abs } });
    const old = mk(6, { trust: 22, lastWarning: { cause: 'stage', week: abs - 8, answered: true, answeredBy: 'card', answeredWeek: abs - 2 } });
    const st2 = mkState([h, o, old], { _glimpseAPrevTrust: { 4: 22, 5: 22, 6: 22 } });
    const out2 = Engine.glimpse.checkALayer(st2, Engine.rng.create(5));
    const ans = out2.glimpses.filter(g => g.type === 'last_warning_answered');
    assert.deepStrictEqual(ans.map(g => g.speakerId), [4], '応えた週の、表で引ける選手だけ');
    assert.strictEqual(ans[0].tone, 'positive');
    assert.strictEqual(ans[0].milestone, true);
    assert.strictEqual(ans[0].dialogue, '名前、あった');
  } finally {
    Object.keys(LAST_WARNING_RUMOR_LINES).forEach(k => { LAST_WARNING_RUMOR_LINES[k] = savedR[k]; });
    Object.keys(LAST_WARNING_ANSWERED_LINES).forEach(k => { LAST_WARNING_ANSWERED_LINES[k] = savedA[k]; });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  tickWeek を通して: 噂の週に噂の状態と原因の一節、信頼30で外れる
// ══════════════════════════════════════════════════════════════════════════════
section('tickWeek: 20を割った週に噂の状態(原因つき)が付き、ログに原因の一節。信頼30に戻った選手からは外れる', () => {
  // 興行のない週(奇数週)の頭。信頼を直接置き、前週の信頼のスナップショットだけ20以上にして「割った週」を作る
  const G0 = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 5 && g.weekPhase === 'manage' && !g.offSeason });
  const pool = G0.roster.filter(f => !f.isRental && !f.injury && !f.onLeave);
  const hero = pool[0], calm = pool[1];
  const roster = G0.roster.map(f => {
    if (f.id === hero.id) return { ...f, trust: 18, trustStrain: { stage: 9, bonds: 2, other: 1 } };
    if (f.id === calm.id) return { ...f, trust: 35, lastWarning: { cause: 'bonds', week: 1, answered: false } };
    return f;
  });
  const G = { ...G0, roster, _glimpseAPrevTrust: { ...(G0._glimpseAPrevTrust || {}), [hero.id]: 24, [calm.id]: 35 } };
  const r = Engine.tickWeek(G);
  const rumor = r.events.find(e => e && e.type === 'trust_departure_rumor' && e.data.name === hero.name);
  assert.ok(rumor, '噂のログが無い');
  assert.strictEqual(rumor.data.variant, 'below20');
  assert.strictEqual(rumor.data.cause, 'stage');
  const h2 = fOf(r.state.roster, hero.id);
  assert.deepStrictEqual({ cause: h2.lastWarning.cause, answered: h2.lastWarning.answered }, { cause: 'stage', answered: false });
  assert.strictEqual(h2.lastWarning.week, Engine.util.absWeek(2, 5));
  assert.strictEqual(fOf(r.state.roster, calm.id).lastWarning, undefined, '信頼30以上の選手から噂の状態が外れていない');
});

section('古いセーブ(I-8): 帳簿・噂の状態の無い選手でも興行の更新・声かけ・慰労会が動き、噂の原因は「はっきりしない」', () => {
  const roster = [mk(1, { trust: 12 }), mk(2, { trust: 12 }), mk(3), mk(4)];
  const state = mkState(roster);
  const out = Engine.trust.applyShowTrust(roster, showResults([1, 3, 2, 4]), state.titles, state, { ledger: true });
  assert.ok(out.roster.every(f => Number.isFinite(f.trust)));
  assert.strictEqual(Engine.trust.pickWarningCause(roster[0]), 'general');
  const e = Engine.shachoshitsu.execute('encourage', 1, state);
  assert.ok(!e.error && e.reactionKey === 'encourage_last_warning');
  assert.ok(Engine.shachoshitsu.getReactionText('encourage_last_warning', roster[0]), '反応文が空');
  const p = Engine.shachoshitsu.execute('party', null, { ...state, lockerRoomMorale: 30 });
  assert.ok(!p.error, p.error);
});

// ══════════════════════════════════════════════════════════════════════════════
//  セリフの表の本文(2026-09-26 Keisuke 承認の204本。docs/care-last-warning-lines-draft.md)
//  表を合成せず、実際の表・実在の選手で「出る」ことを確かめる
// ══════════════════════════════════════════════════════════════════════════════
const LW_TABLES = [
  ['rumor', 'LAST_WARNING_RUMOR_LINES', () => LAST_WARNING_RUMOR_LINES, ['stage', 'bonds']],
  ['encourage', 'LAST_WARNING_ENCOURAGE_LINES', () => LAST_WARNING_ENCOURAGE_LINES, ['stage', 'bonds', 'general']],
  ['answered', 'LAST_WARNING_ANSWERED_LINES', () => LAST_WARNING_ANSWERED_LINES, ['stage']],
];
const realCells = () => {
  const set = new Set();
  ALL_CHARS.forEach(c => set.add(`${c.archetype || 'standard'}/${c.personality || 'normal'}`));
  return set;
};
const allLwLines = () => {
  const out = [];
  LW_TABLES.forEach(([, name, get, causes]) => causes.forEach(cause => {
    Object.entries(get()[cause]).forEach(([a, byP]) => Object.entries(byP).forEach(([p, arr]) => arr.forEach(line => out.push({ name, cause, a, p, line }))));
  }));
  return out;
};
const fighterOf = (c, over = {}) => mk(c.id, { name: c.name, archetype: c.archetype, personality: c.personality, ...over });

section('セリフの表(承認済み): 6つの原因の表がどれも実在の34セル×1本(計204本)。重複なし・プレースホルダなし', () => {
  const cells = realCells();
  assert.strictEqual(cells.size, 34, `実在のセルが ${cells.size}`);
  LW_TABLES.forEach(([, name, get, causes]) => {
    assert.deepStrictEqual(Object.keys(get()).sort(), causes.slice().sort(), `${name} の原因のキー`);
    causes.forEach(cause => {
      const got = new Set();
      Object.entries(get()[cause]).forEach(([a, byP]) => Object.entries(byP).forEach(([p, arr]) => {
        assert.ok(Array.isArray(arr) && arr.length === 1 && typeof arr[0] === 'string' && arr[0], `${name}.${cause}.${a}.${p} が1本でない`);
        got.add(`${a}/${p}`);
      }));
      assert.deepStrictEqual([...got].sort(), [...cells].sort(), `${name}.${cause} のセルが実在の34セルと違う`);
    });
  });
  const lines = allLwLines();
  assert.strictEqual(lines.length, 204);
  assert.strictEqual(new Set(lines.map(l => l.line)).size, 204, '同じ文が2か所にある');
  lines.forEach(l => assert.ok(!/[{}]/.test(l.line), `プレースホルダ: ${l.line}`));
  lines.forEach(l => assert.ok(!/[0-9０-９]/.test(l.line), `数字: ${l.line}`));
});

section('セリフの表(承認済み): 全127人が、3表のどの原因でも自分のセル(口調×性格)の1本を引く(normal への落ち・null なし)', () => {
  ALL_CHARS.forEach(c => {
    const f = fighterOf(c);
    LW_TABLES.forEach(([kind, name, get, causes]) => causes.forEach(cause => {
      const pool = Engine.trust.lastWarningLinePool(kind, cause, f);
      assert.strictEqual(pool, get()[cause][c.archetype][c.personality], `${c.name}(${c.archetype}/${c.personality}) ${name}.${cause}`);
    }));
    // 声かけは stage/bonds 以外の原因(給与・王座・空気・約束・派閥・原因なし)を general の表で引く
    ['pay', 'title', 'air', 'promise', 'faction', null].forEach(cause => {
      assert.strictEqual(Engine.trust.lastWarningLinePool('encourage', cause, f), LAST_WARNING_ENCOURAGE_LINES.general[c.archetype][c.personality]);
    });
  });
});

section('セリフの表(承認済み): 20割れの噂の本人の一言・応えてもらえた一言・声かけの反応が、実在の選手で表の1本になる', () => {
  // 口調の違う実在の選手を7人(アーキタイプごとに1人)
  const picks = [...new Set(ALL_CHARS.map(c => c.archetype))].map(a => ALL_CHARS.find(c => c.archetype === a));
  assert.strictEqual(picks.length, 7);
  const abs = Engine.util.absWeek(2, 10);
  // 噂の週: 出番(stage)・人間関係(bonds)が重い子は原因の表、はっきりしない子は今の20割れの表
  ['stage', 'bonds'].forEach(cause => {
    const roster = picks.map(c => fighterOf(c, { trust: 19, trustStrain: { [cause]: 9, other: 1 } }));
    const prev = {}; roster.forEach(f => { prev[f.id] = 22; });
    const out = Engine.glimpse.checkALayer(mkState(roster, { _glimpseAPrevTrust: prev }), Engine.rng.create(5));
    roster.forEach(f => {
      const g = out.glimpses.find(x => x.speakerId === f.id && x.type === 'trust_below_20');
      if (!g) return;  // 20割れの噂は率の抽選(roll)がある。出た子だけ確かめる
      assert.strictEqual(g.cause, cause);
      assert.strictEqual(g.dialogue, LAST_WARNING_RUMOR_LINES[cause][f.archetype][f.personality][0], `${f.name} ${cause}`);
    });
    assert.ok(out.glimpses.some(x => x.type === 'trust_below_20'), `${cause}: 噂が1本も出ない(前提)`);
  });
  // 応えてもらえた一言(出番のみ): 応えた週の checkALayer に1本、道場の確定枠(tone positive・milestone)
  const ansRoster = picks.map(c => fighterOf(c, { trust: 22, lastWarning: { cause: 'stage', week: abs - 4, answered: true, answeredBy: 'card', answeredWeek: abs } }));
  const prevA = {}; ansRoster.forEach(f => { prevA[f.id] = 22; });
  const outA = Engine.glimpse.checkALayer(mkState(ansRoster, { _glimpseAPrevTrust: prevA }), Engine.rng.create(5));
  ansRoster.forEach(f => {
    const g = outA.glimpses.find(x => x.speakerId === f.id && x.type === 'last_warning_answered');
    assert.ok(g, `${f.name}: 応えてもらえた一言が出ない`);
    assert.strictEqual(g.dialogue, LAST_WARNING_ANSWERED_LINES.stage[f.archetype][f.personality][0]);
    assert.strictEqual(g.tone, 'positive');
    assert.strictEqual(g.milestone, true);
  });
  // 声かけ(信頼20未満): execute の反応の鍵が encourage_last_warning、反応文は原因の表(給与などは general)
  picks.forEach(c => {
    [['stage', 'stage'], ['bonds', 'bonds'], ['pay', 'general'], [null, 'general']].forEach(([cause, table]) => {
      const f = fighterOf(c, { trust: 17, lastWarning: cause ? { cause, week: abs - 2, answered: false } : undefined });
      const e = Engine.shachoshitsu.execute('encourage', f.id, mkState([f, mk(9001), mk(9002)]));
      assert.ok(!e.error, e.error);
      assert.strictEqual(e.reactionKey, 'encourage_last_warning');
      const text = Engine.shachoshitsu.getReactionText(e.reactionKey, fOf(e.roster, f.id));
      assert.strictEqual(text, LAST_WARNING_ENCOURAGE_LINES[table][c.archetype][c.personality][0], `${c.name} ${cause}`);
    });
  });
});

section('tickWeek を通して(実表・実在の選手): 20を割った週の噂(出番)の本人の一言が原因の表の1本', () => {
  const G0 = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 5 && g.weekPhase === 'manage' && !g.offSeason });
  const pool = G0.roster.filter(f => !f.isRental && !f.injury && !f.onLeave);
  let hit = 0;
  // 20割れの噂は率の抽選があるので、選手を替えて最初に出た1人で確かめる
  for (const hero of pool) {
    const roster = G0.roster.map(f => (f.id === hero.id ? { ...f, trust: 18, trustStrain: { stage: 9, bonds: 2, other: 1 } } : f));
    const G = { ...G0, roster, _glimpseAPrevTrust: { ...(G0._glimpseAPrevTrust || {}), [hero.id]: 24 } };
    const r = Engine.tickWeek(G);
    const g = (r.state._pendingGlimpseA || []).find(x => x.speakerId === hero.id && x.type === 'trust_below_20');
    if (!g) continue;
    assert.strictEqual(g.cause, 'stage');
    assert.strictEqual(g.dialogue, LAST_WARNING_RUMOR_LINES.stage[hero.archetype][hero.personality][0], `${hero.name}`);
    hit++;
    break;
  }
  assert.strictEqual(hit, 1, '噂が一度も出なかった(前提)');
});

section('EN: 204本すべてに英訳があり(日本語が残らない・吹き出し110字以内)、表示の t() で英語になる', () => {
  const fs = require('fs');
  const path = require('path');
  const vm = require('vm');
  const srcDir = path.join(__dirname, '..', 'src');
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  ['i18n.js', 'lang-en.js', 'lang-en-templates.js', 'lang-en-dialogue.js', 'lang-en-names.js'].forEach(f => {
    new vm.Script(fs.readFileSync(path.join(srcDir, f), 'utf8'), { filename: f }).runInContext(sandbox);
  });
  const EN = sandbox.WM_I18N;
  EN.setLang('en');
  const JA_RE = /[぀-ヿ㐀-鿿]/;
  allLwLines().forEach(l => {
    const en = EN.t(l.line);
    assert.ok(en !== l.line && !JA_RE.test(en), `EN が無い: ${l.name}.${l.cause}.${l.a}.${l.p} ${l.line} => ${en}`);
    assert.ok(en.length <= 110, `EN が吹き出しの長さを超える(${en.length}): ${en}`);
  });
});

if (failed > 0) {
  console.log(`\n${failed} section(s) FAILED`);
  process.exit(1);
}
console.log('\nALL PASS');
