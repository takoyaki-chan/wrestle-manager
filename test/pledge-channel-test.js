'use strict';
// pledge-channel-test.js — 起用約束チャンネルのエンジン挙動(care-rework2 P2-G / task-101)
//
// 守るもの(指示書 §4 の不変条件と1対1):
//   1. bold に実効1.0超のケアが1つ存在する(履行 = 8 × finalMult × 1.3)
//      / 破約は -6 以内・連鎖なし / 非bold には成立しない
//   2. 判定は通常興行のみ・fail-open
//      / カード編成と試合結果に一切書き込まない / 判定機会なし12週で静かに失効
//   3. ⚡1・CD16週・同時1件
//
// メインイベントは results[0](= showCard[0])。このコードベースの規約で、
// management.js の mainEventIdx = 0 / isMainEvent: matchIndex === 0 と同じ。

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 起用約束チャンネル(pledge)のエンジン挙動 ===\n');

function makeFighter(id, over) {
  return Object.assign({
    id, name: `F${id}`, orgId: 'player',
    pw: 60, sp: 60, te: 60, st: 60, mn: 50,
    style: 'Allround', personality: 'bold', archetype: 'standard',
    trust: 50, condition: 70, popularity: 20,
    wins: 0, losses: 0, draws: 0, streak: 0,
    age: 24, salary: 30, contractYears: 2,
    slump: null, motivationLoss: null,
    _decisionWeekUsed: {},
  }, over || {});
}

function makeState(over) {
  return Object.assign({
    season: 1, week: 10, offSeason: false,
    roster: [makeFighter(1), makeFighter(2, { personality: 'normal' })],
    funds: 10000, decisionPoints: 6, decisionPointsMax: 6,
    orgPop: 50, lockerRoomMorale: 60,
    titles: [], relationships: {}, gameLog: [],
    _decisionWeekUsed: {},
    rngSeed: 12345,
  }, over || {});
}

// 通常興行の週を1つ選ぶ(特別興行週・PPV週を避ける)
function findRegularShowWeek() {
  for (let w = 1; w <= 48; w++) if (Engine.util.isRegularShowWeek(w)) return w;
  throw new Error('通常興行週が見つからない');
}
function findSpecialShowWeek() {
  for (let w = 1; w <= 48; w++) if (Engine.util.isShowWeek(w) && Engine.util.isSeasonSpecialEventWeek(w)) return w;
  return null;
}
const REG_WEEK = findRegularShowWeek();

// 1試合ぶんの results エントリ(シングル)
function singleResult(leftId, rightId) {
  return { matchType: 'single', left: { id: leftId }, right: { id: rightId }, mq: 60 };
}

// ─────────────────────────────────────────────────────────────
// 3: 入口(⚡1・CD16週・同時1件・bold限定)
// ─────────────────────────────────────────────────────────────

section('bold選手に約束が成立し、⚡を1消費する', () => {
  const s = makeState();
  const r = Engine.shachoshitsu.execute('pledge', 1, s);
  assert.ok(r && !r.error, `execute が失敗した: ${r && r.error}`);
  assert.ok(r.pledge, 'result.pledge が返っていない');
  assert.strictEqual(r.pledge.fighterId, 1);
  assert.strictEqual(r.pledge.madeWeek, Engine.util.absWeek(s.season, s.week), 'madeWeek が絶対週でない');
  assert.strictEqual(r.decisionPoints, 5, `⚡消費が1でない(${6} → ${r.decisionPoints})`);
  assert.strictEqual(r.cost, 0, '費用は0のはず');
  assert.strictEqual(r.reactionKey, 'pledge_accept');
});

section('約束の時点では trust を動かさない(果たしてから動く)', () => {
  const s = makeState();
  const before = s.roster[0].trust;
  const r = Engine.shachoshitsu.execute('pledge', 1, s);
  const after = r.roster.find(f => f.id === 1).trust;
  assert.strictEqual(after, before, `約束しただけで trust が動いた(${before} → ${after})`);
});

section('非bold(強気以外)には成立しない', () => {
  const s = makeState();
  const r = Engine.shachoshitsu.execute('pledge', 2, s);
  assert.ok(r && r.error === 'not_bold', `not_bold が返らない: ${r && r.error}`);
});

section('同時1件 — 有効な約束がある間は他の選手に約束できない', () => {
  const s = makeState({ roster: [makeFighter(1), makeFighter(3)] });
  const first = Engine.shachoshitsu.execute('pledge', 1, s);
  const s2 = Object.assign({}, s, { roster: first.roster, pledge: first.pledge, decisionPoints: first.decisionPoints });
  const second = Engine.shachoshitsu.execute('pledge', 3, s2);
  assert.ok(second && second.error === 'pledge_exists', `pledge_exists が返らない: ${second && second.error}`);
});

section('CDは16週 — 15週後は不可、16週後は可', () => {
  const doc = Engine.shachoshitsu.getDoc('pledge');
  assert.strictEqual(doc.cooldown, 16, `doc.cooldown が16でない(${doc.cooldown})`);
  assert.strictEqual(doc.decisionCost, 1, `decisionCost が1でない(${doc.decisionCost})`);

  const base = makeState({ week: 1 });
  const first = Engine.shachoshitsu.execute('pledge', 1, base);
  const rosterAfter = first.roster;

  const at15 = Object.assign({}, base, { week: 16, roster: rosterAfter });   // 16 - 1 = 15週経過
  assert.strictEqual(Engine.shachoshitsu.execute('pledge', 1, at15).error, 'cooldown', '15週後に撃ててしまう');

  const at16 = Object.assign({}, base, { week: 17, roster: rosterAfter });   // 17 - 1 = 16週経過
  const ok = Engine.shachoshitsu.execute('pledge', 1, at16);
  assert.ok(ok && !ok.error, `16週後に撃てない: ${ok && ok.error}`);
});

section('机(社長室)には並ばない — encourage と同じ扱い', () => {
  assert.ok(!DECISION_DOC_ORDER.includes('pledge'), 'pledge が DECISION_DOC_ORDER に入っている(机に並んでしまう)');
});

// ─────────────────────────────────────────────────────────────
// 1: 履行 / 破約 の効き
// ─────────────────────────────────────────────────────────────

section('履行 — メイン(results[0])に出ていれば trust が上がる', () => {
  const s = makeState({
    week: REG_WEEK,
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    lastShowResults: [singleResult(1, 2), singleResult(3, 4)],
  });
  const out = Engine.shachoshitsu.settlePledge(s);
  assert.ok(out, '判定が返らない');
  assert.strictEqual(out.outcome, 'kept', `履行にならない(${out.outcome})`);
  const after = out.roster.find(f => f.id === 1).trust;
  assert.ok(after > 50, `trust が上がっていない(50 → ${after})`);
});

section('破約 — メインに出ていなければ trust が下がる', () => {
  const s = makeState({
    week: REG_WEEK,
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    // メインは 3 vs 4。約束した1番は第2試合に出ている(出番はあるがメインではない)
    lastShowResults: [singleResult(3, 4), singleResult(1, 2)],
  });
  const out = Engine.shachoshitsu.settlePledge(s);
  assert.strictEqual(out.outcome, 'broken', `破約にならない(${out.outcome})`);
  const after = out.roster.find(f => f.id === 1).trust;
  assert.ok(after < 50, `trust が下がっていない(50 → ${after})`);
});

section('タッグのメインでも履行になる', () => {
  const s = makeState({
    week: REG_WEEK,
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    lastShowResults: [{ matchType: 'tag', perFighter: { 1: {}, 2: {}, 3: {}, 4: {} }, mq: 60 }],
  });
  const out = Engine.shachoshitsu.settlePledge(s);
  assert.strictEqual(out.outcome, 'kept', 'タッグのメイン出場が履行にならない');
});

section('不変条件: 破約の下げ幅は 6 を超えない(mn/OVRを振っても)', () => {
  const worst = [];
  for (const mn of [1, 20, 50, 80, 100]) {
    for (const ovr of [20, 50, 80]) {
      const f = makeFighter(1, { mn, pw: ovr, sp: ovr, te: ovr, st: ovr, trust: 90 });
      const s = makeState({
        week: REG_WEEK, roster: [f, makeFighter(2)],
        pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
        lastShowResults: [singleResult(3, 4)],
      });
      const out = Engine.shachoshitsu.settlePledge(s);
      const drop = 90 - out.roster.find(x => x.id === 1).trust;
      worst.push(drop);
      assert.ok(drop <= 6 + 1e-9, `mn=${mn} ovr=${ovr} で下げ幅が ${drop.toFixed(3)}(-6 を超えた)`);
    }
  }
  console.log(`        最大下げ幅 ${Math.max(...worst).toFixed(2)}pt / 最小 ${Math.min(...worst).toFixed(2)}pt`);
});

section('不変条件: 履行の実効倍率が 1.0 を超える(boldで初めて効くケア)', () => {
  // finalMult は pledge 列を持たないので 1.00。実効は PLEDGE_BOLD_MULT = 1.3
  const f = makeFighter(1, { mn: 50, trust: 50 });
  assert.strictEqual(Engine.shachoshitsu.calcUncertainty('pledge', f), 1.0,
    'pledge の finalMult が 1.00 でない(DECISION_PERSONALITY_MULT に pledge 列を足すと設計意図が壊れる)');
  assert.ok(PLEDGE_BOLD_MULT > 1.0, 'PLEDGE_BOLD_MULT が 1.0 以下');
  // 同条件の encourage(bold は ×0.70)より確実に大きく効くこと
  assert.ok(Engine.shachoshitsu.calcUncertainty('encourage', f) < 1.0,
    'bold の encourage 倍率が 1.0 未満でない(前提が変わった)');
});

section('履行はスランプ/モチベ喪失の recoveryMomentum を押し上げる', () => {
  const f = makeFighter(1, { slump: { recoveryMomentum: 0, weeksSinceStart: 3, ovrDebuff: -1 } });
  const s = makeState({
    week: REG_WEEK, roster: [f, makeFighter(2)],
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    lastShowResults: [singleResult(1, 2)],
  });
  const out = Engine.shachoshitsu.settlePledge(s);
  const after = out.roster.find(x => x.id === 1);
  assert.strictEqual(after.slump.recoveryMomentum, PLEDGE_KEPT_MOMENTUM,
    `recoveryMomentum が ${PLEDGE_KEPT_MOMENTUM} 増えていない(${after.slump.recoveryMomentum})`);
});

// ─────────────────────────────────────────────────────────────
// 2: 通常興行のみ・fail-open・失効
// ─────────────────────────────────────────────────────────────

section('特別興行では判定しない(fail-open)', () => {
  const sp = findSpecialShowWeek();
  if (sp == null) { console.log('        (特別興行週が定義されていないためスキップ)'); return; }
  const s = makeState({
    week: sp,
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, sp) },
    lastShowResults: [singleResult(3, 4)],   // メインに出ていない = 通常興行なら破約
  });
  const out = Engine.shachoshitsu.settlePledge(s);
  assert.ok(out === null, `特別興行で判定してしまった(${out && out.outcome})`);
});

section('興行のない週は判定しない(約束は持ち越す)', () => {
  const s = makeState({
    week: REG_WEEK,
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    lastShowResults: [],
  });
  assert.strictEqual(Engine.shachoshitsu.settlePledge(s), null, '興行がないのに判定した');
});

section('判定機会がないまま12週で静かに失効する', () => {
  const made = Engine.util.absWeek(1, 2);
  // 11週経過: まだ有効
  const s11 = makeState({ season: 1, week: 13, pledge: { fighterId: 1, madeWeek: made }, lastShowResults: [] });
  assert.strictEqual(Engine.shachoshitsu.settlePledge(s11), null, '11週で失効してしまった');
  // 12週経過: 失効
  const s12 = makeState({ season: 1, week: 14, pledge: { fighterId: 1, madeWeek: made }, lastShowResults: [] });
  const out = Engine.shachoshitsu.settlePledge(s12);
  assert.ok(out && out.outcome === 'expired', `12週で失効しない(${out && out.outcome})`);
  // 失効はペナルティなし
  assert.strictEqual(out.roster.find(f => f.id === 1).trust, 50, '失効で trust が動いた(罰してはいけない)');
});

section('対象が名簿から消えたら静かに解消する', () => {
  const s = makeState({
    week: REG_WEEK, roster: [makeFighter(2, { personality: 'normal' })],
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    lastShowResults: [singleResult(2, 3)],
  });
  const out = Engine.shachoshitsu.settlePledge(s);
  assert.ok(out && out.outcome === 'expired', `退団時に解消されない(${out && out.outcome})`);
});

section('約束が無ければ何もしない', () => {
  assert.strictEqual(Engine.shachoshitsu.settlePledge(makeState()), null);
});

section('判定はカード・試合結果を書き換えない(読み取り専用)', () => {
  const results = [singleResult(3, 4), singleResult(1, 2)];
  const snapshot = JSON.stringify(results);
  const showCard = [{ left: 3, right: 4 }, { left: 1, right: 2 }];
  const cardSnapshot = JSON.stringify(showCard);
  const s = makeState({
    week: REG_WEEK, showCard,
    pledge: { fighterId: 1, madeWeek: Engine.util.absWeek(1, REG_WEEK) },
    lastShowResults: results,
  });
  Engine.shachoshitsu.settlePledge(s);
  assert.strictEqual(JSON.stringify(results), snapshot, 'lastShowResults が書き換えられた');
  assert.strictEqual(JSON.stringify(showCard), cardSnapshot, 'showCard が書き換えられた');
});

console.log('');
if (failed > 0) { console.log(`結果: ${failed} 件 FAIL`); process.exit(1); }
console.log('結果: 全項目 PASS');
