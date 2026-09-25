'use strict';
// snapshot-scene-relation-fit-test.js — 同世代・相性の摩擦のスナップショットが、今の関係値と食い違う
// ペアに出ないことの確認
//
// 総点検 docs/fun-audit-v0.1/06-narrative-spotlight.md 発見⑧ / 04-drama-engine.md 発見⑦:
//   'generation' は年齢差3以内・週2%の抽選だけで関係値を見ず、文面4本はすべて親密な場面
//   (「一緒に帰っていく」「笑い合っていた」「仲がいいらしい」)。険悪なペア(bond≤30かつrivalry≥50)にも出ていた。
// 修正後の約束:
//   - 同世代(親密な場面)は 両方向 bond≥45 かつ 両方向 rivalry<50 のペアだけ
//   - 相性の摩擦(揉め事の場面)は 両方向 bond≥60(互いに好意)のペアには出ない
//   - 関係値の条件は抽選の後ろに置き、乱数の引き順は変えない(他の候補の出方を巻き込まない)

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

const origCompat = Engine.relationships.personalityCompatibility;
// 相性の摩擦の前提(相性 -3以下)を満たすよう相性だけ差し替える。年齢は同じにして同世代の前提も満たす
Engine.relationships.personalityCompatibility = () => -5;

const fighter = (id) => ({ id, name: `選手${id}`, age: 20, personality: 'normal', archetype: 'standard',
  pw: 50, sp: 50, te: 50, st: 50, mn: 50, popularity: 40 });
function pairState(bondAB, bondBA, rivAB, rivBA) {
  return {
    season: 3, week: 10, roster: [fighter(1), fighter(2)],
    relationships: {
      '1>2': { bond: bondAB, rivalry: rivAB },
      '2>1': { bond: bondBA, rivalry: rivBA },
    },
  };
}
// 2%の抽選を多数のシードで回し、出た候補の種類を数える
function census(state, seeds) {
  const count = { generation: 0, friction: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const cands = Engine.snapshot._collectCandidates(Engine.rng.create(seed), state);
    cands.forEach(c => { if (count[c.source] != null) count[c.source]++; });
  }
  return count;
}
const SEEDS = 3000;

console.log('=== スナップショット: 同世代・相性の摩擦 × 今の関係値 ===\n');

section('険悪なペア(bond 25/30・rivalry 80/60)に同世代の親密な場面は出ない。摩擦は出る', () => {
  const c = census(pairState(25, 30, 80, 60), SEEDS);
  assert.strictEqual(c.generation, 0, `険悪なペアに同世代が ${c.generation} 件出た`);
  assert.ok(c.friction > 0, '険悪なペアに摩擦が一度も出ない');
});

section('親しいペア(bond 70/65・rivalry 20/10)に同世代は出る。摩擦は出ない', () => {
  const c = census(pairState(70, 65, 20, 10), SEEDS);
  assert.ok(c.generation > 0, '親しいペアに同世代が一度も出ない');
  assert.strictEqual(c.friction, 0, `互いに好意のあるペアに摩擦が ${c.friction} 件出た`);
});

section('普通のペア(bond 50/48・rivalry 30/20)には両方出る', () => {
  const c = census(pairState(50, 48, 30, 20), SEEDS);
  assert.ok(c.generation > 0, '普通のペアに同世代が出ない');
  assert.ok(c.friction > 0, '普通のペアに摩擦が出ない');
});

section('境界: bond 45 は同世代可・44 は不可/rivalry 49 は可・50 は不可(両方向とも)', () => {
  assert.ok(census(pairState(45, 60, 49, 0), SEEDS).generation > 0, 'bond45・rivalry49で同世代が出ない');
  assert.strictEqual(census(pairState(44, 60, 0, 0), SEEDS).generation, 0, '片方向 bond44 で同世代が出た');
  assert.strictEqual(census(pairState(60, 60, 0, 50), SEEDS).generation, 0, '片方向 rivalry50 で同世代が出た');
  assert.ok(census(pairState(59, 90, 0, 0), SEEDS).friction > 0, '片方向 bond59 で摩擦が出ない');
  assert.strictEqual(census(pairState(60, 60, 0, 0), SEEDS).friction, 0, '両方向 bond60 で摩擦が出た');
});

section('関係値の違いは乱数の引き順を変えない(抽選の後ろで絞っている)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r1 = Engine.rng.create(seed);
    const r2 = Engine.rng.create(seed);
    Engine.snapshot._collectCandidates(r1, pairState(25, 30, 80, 60));
    Engine.snapshot._collectCandidates(r2, pairState(70, 65, 20, 10));
    assert.deepStrictEqual(r1, r2, `seed ${seed}: 関係値で乱数の消費量が変わった`);
  }
});

Engine.relationships.personalityCompatibility = origCompat;

console.log('');
if (failed > 0) {
  console.log(`FAIL: ${failed} section(s)`);
  process.exit(1);
}
console.log('ALL PASS');
