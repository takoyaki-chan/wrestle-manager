'use strict';
// newspaper-news-value-test.js — 新聞P2「採点の合成点化」
//
// 固定点では「無名の怪我」と「王者の怪我」が同じ点になる。
//   最終点 = 基礎点(何が起きたか) + 主役補正(誰に起きたか) + 強度補正(どれくらい大きいか)
//
// ここで固定するのは spec §2-5 の検算不変条件4件。
// **数値目標だけ渡すと最短経路で目標だけ満たされて設計意図が壊れる**ので、
// 「届く」条件と「届かない」条件を対で書く。

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== 新聞P2 ニュースバリュー採点 ===\n');

const NP = Engine.newspaper;
const LINE = NP.SLOT_LINE;

// ── フィクスチャ ─────────────────────────────────────────────────────
const f = (id, name, ovr, extra) => Object.assign({
  id, name, pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
  popularity: 30, streak: 0, careerSeasons: 5, careerRecord: { history: [] },
}, extra || {});

function makeState(extra) {
  // 自団体7名 + AI 1団体。王者は 101(自団体のエース)
  const roster = [f(101, 'エース', 70), f(102, '主力', 65), f(103, '中堅', 60),
    f(104, '若手A', 50), f(105, '若手B', 48), f(106, '若手C', 46), f(107, '無名', 44)];
  return Object.assign({
    season: 3, week: 20, orgName: 'テスト団体', roster,
    titles: { world: { championId: 101, defenses: 2 } },
    aiOrgs: { org_a: { roster: [f(201, '敵エース', 75)], titles: { world: { championId: 201 } } } },
    mvpRace: { rankings: [] },
    factions: [],
  }, extra || {});
}

const story = (type, priority, characterId, newsData) => ({ type, priority, characterId, newsData: newsData || {} });
const valueOf = (state, s) => NP.newsValue(state, s, NP.buildValueContext(state));

// ── §2-5 の検算不変条件 ─────────────────────────────────────────────
section('不変条件1. 無補正の日常ネタ・練習怪我は、強度を積んでも一面トップに届かない', () => {
  const st = makeState();
  // 107=無名(王座なし/MVP圏外/OVR最下位/人気圏外/連勝なし)
  const cases = [
    story('aiPracticeInjury', NP.PRIORITY.aiPracticeInjury, 107, { weeksOut: 20 }),
    story('aiMediaSpotlight', NP.PRIORITY.aiMediaSpotlight, 107, {}),
    story('general', NP.PRIORITY.general, 107, {}),
  ];
  cases.forEach(s => {
    const v = valueOf(st, s);
    assert.ok(v < LINE.top, `${s.type} が ${v} 点で一面トップ(${LINE.top})に届いてしまう`);
  });
});

section('不変条件2. 王者/MVP首位の長期離脱(全治10週+)は必ず一面トップ資格に届く', () => {
  // 王者(101)の重傷
  const champ = makeState();
  const vChamp = valueOf(champ, story('topChampionInjury', NP.PRIORITY.topChampionInjury, 101, { weeks: 10 }));
  assert.ok(vChamp >= LINE.top, `王者の全治10週が ${vChamp} 点でトップ(${LINE.top})に届かない`);

  // MVP首位(103=中堅。王者でもエースでもない)の重傷
  const mvp = makeState({ mvpRace: { rankings: [{ fighterId: 103, rank: 1 }] } });
  const vMvp = valueOf(mvp, story('topChampionInjury', NP.PRIORITY.topChampionInjury, 103, { weeks: 10 }));
  assert.ok(vMvp >= LINE.top, `MVP首位の全治10週が ${vMvp} 点でトップ(${LINE.top})に届かない`);
});

section('不変条件3. C帯の基礎点(70以下)は主役補正が上限でも一面トップに届かない', () => {
  const st = makeState({ mvpRace: { rankings: [{ fighterId: 101, rank: 1 }] } });
  // 101 は 世界王者+MVP首位+団体エース+業界人気 — 主役補正が上限に張り付く条件
  const bonus = NP.protagonistBonus(st, 101, NP.buildValueContext(st));
  assert.strictEqual(bonus, NP.PROTAGONIST_CAP, `主役補正が上限(${NP.PROTAGONIST_CAP})に達していない: ${bonus}`);
  [70, 60, 45, 30].forEach(base => {
    const v = valueOf(st, story('general', base, 101, {}));
    assert.ok(v < LINE.top, `基礎点 ${base} が ${v} 点で一面トップに届いてしまう`);
  });
});

section('不変条件4. 同週にトップ資格が2本以上なら、2本目以降は下の枠へ落ちる', () => {
  // 資格線は「その記事単体の資格」。実際の枠は合成点の**降順**で上から詰めるので、
  // 2本目は自動的にトップの次(肩)へ回る。ここでは順序が点で決まることを固定する
  const st = makeState();
  const a = story('topChampionInjury', NP.PRIORITY.topChampionInjury, 101, { weeks: 14 });
  const b = story('topChampionInjury', NP.PRIORITY.topChampionInjury, 201, { weeks: 10 });
  const va = valueOf(st, a), vb = valueOf(st, b);
  assert.ok(va >= LINE.top && vb >= LINE.top, `両方トップ資格でない (${va} / ${vb})`);
  assert.ok(va > vb, `長期離脱のほうが上に来ていない (${va} <= ${vb})`);
  const sorted = [b, a].map(s => ({ s, v: valueOf(st, s) })).sort((x, y) => y.v - x.v);
  assert.strictEqual(sorted[0].s, a, '合成点の降順に並んでいない');
});

// ── 設計の芯: 誰に起きたかで価値が変わる ────────────────────────────
section('同じ怪我でも、無名と主力と王者で価値が変わる(§2 の芯)', () => {
  const st = makeState();
  const v = (id, weeks) => valueOf(st, story('aiPracticeInjury', 140, id, { weeksOut: weeks }));
  const noName = v(107, 6), core = v(102, 10), champ = v(101, 14);
  assert.ok(noName < core, `無名(${noName}) < 主力(${core}) になっていない`);
  assert.ok(core < champ, `主力(${core}) < 王者(${champ}) になっていない`);
  // spec の作例と同じ並び: 中記事 / 肩 / 一面トップ
  assert.strictEqual(NP.slotOf(noName, true), 'jun', `無名の大怪我が ${noName} 点で中記事にならない`);
  assert.ok(['kata', 'top'].includes(NP.slotOf(core, true)), `主力の大怪我が ${core} 点で肩以上にならない`);
  assert.strictEqual(NP.slotOf(champ, true), 'top', `王者の大怪我が ${champ} 点でトップにならない`);
});

section('主役補正は上位2属性だけ(1位 + 2位×0.5)。全部盛りでも上限を超えない', () => {
  const st = makeState({ mvpRace: { rankings: [{ fighterId: 101, rank: 1 }] } });
  const ctx = NP.buildValueContext(st);
  const b = NP.protagonistBonus(st, 101, ctx);
  assert.ok(b <= NP.PROTAGONIST_CAP, `上限(${NP.PROTAGONIST_CAP})を超えている: ${b}`);
  // 王者(90)+MVP首位(80)×0.5 = 130 → 上限で 120 に丸まる
  assert.strictEqual(b, 120, `上位2属性の計算が想定と違う: ${b}`);
  // 該当なしは 0
  assert.strictEqual(NP.protagonistBonus(st, 107, ctx), 0, '無名に補正が乗っている');
  assert.strictEqual(NP.protagonistBonus(st, null, ctx), 0, 'idが無いのに補正が乗っている');
});

section('写真が無い記事は一面トップの資格を持たない(§3「一面なのに写真がない」を防ぐ)', () => {
  assert.strictEqual(NP.slotOf(400, false), 'kata', '写真の無い高得点記事がトップに座れてしまう');
  assert.strictEqual(NP.slotOf(400, true), 'top', '写真がある高得点記事がトップにならない');
});

section('generate() が合成点で並べ、記事に内訳を残している(死蔵にしない)', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
  assert.ok(/s\.newsValue = Engine\.newspaper\.newsValue\(/.test(src),
    'generate() が newsValue を当てていない（採点だけ作って使っていない）');
  assert.ok(/stories\.sort\(\(a, b\) => \(b\.newsValue - a\.newsValue\)/.test(src),
    '並べ替えが合成点になっていない（基礎点のまま並んでいる）');
  assert.ok(/s\.newsSlot = Engine\.newspaper\.slotOf\(/.test(src),
    '資格線の判定結果が記事に残っていない');
});

console.log('');
if (failed > 0) { console.log(`newspaper-news-value-test: ${failed} FAILED`); process.exit(1); }
console.log('newspaper-news-value-test: ok');
