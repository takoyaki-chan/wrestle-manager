// tenchosen-preevent-speaker-test.js
//
// 2026-07-27: 天頂戦の開催前ミニイベント(Week42)の語り手について。
//
// Keisuke「こういうのが合間で入ってくるのは嬉しいけど、毎回同じ3人が出てきてる感じがする。
//          もう1人だけでいいし、それがある程度ランダムに出るんでもいい」
//
// 原因は選び方だった。OVR 上位3人を **slice(0,3) で固定** して並べていたため、
// 開催のたびに同じ顔ぶれが同じ並びで出ていた。ランダムなのはセリフだけ。
// セリフ側には条件分岐(veteran / notPriorEntrant)があるのに、話し手が動かないので
// その違いも見えにくかった。
//
// 守るもの:
//   1. 語り手はひとり
//   2. 開催のたびに変わる（同じ人に張り付かない）
//   3. 出場を狙える圏内から選ぶ（セリフが「あの狭き門をくぐれるか」なので、
//      圏外の選手が言うと言葉が浮く）
//   4. 条件付きセリフ(veteran / notPriorEntrant)の仕組みが生きている

'use strict';
const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 天頂戦 開催前ミニイベントの語り手 ===\n');

function makeGame() {
  let G = Engine.createInitialState(4242, true);
  const rngP = Engine.rng.create(0x1234);
  const ex = new Set(G.roster.map(x => x.id));
  const extra = (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS : [])
    .filter(x => !ex.has(x.id)).slice(0, 10)
    .map(t => {
      const f = Engine.makeChar(t, rngP, G.orgId);
      return { ...f, orgJoinWeek: 1, contractOVR: Engine.util.ov(f), contractPop: f.popularity || 0 };
    });
  return { ...G, roster: [...G.roster, ...extra], rosterCap: 20 };
}

const G = makeGame();
const build = (season) => Engine.ppvTournament.buildPreEvent(
  { ...G, season },
  Engine.rng.create(Engine.rng.derive(G.rngSeed, season, 0x7C0))
);

section('1. 語り手はひとりだけ', () => {
  for (const s of [4, 8, 12, 16, 20]) {
    const ev = build(s);
    assert.strictEqual((ev.fighters || []).length, 1,
      `S${s} の語り手が ${(ev.fighters || []).length} 人。ひとりに絞ること`);
  }
});

section('2. 開催のたびに語り手が変わる（同じ人に張り付かない）', () => {
  const names = [];
  for (let s = 4; s <= 80; s += 4) {
    const f = (build(s).fighters || [])[0];
    if (f) names.push(f.name);
  }
  assert.ok(names.length >= 15, `サンプルが少なすぎる(${names.length})`);
  const uniq = new Set(names);
  assert.ok(uniq.size >= 4,
    `20回で語り手が ${uniq.size} 人しかいない。上位固定に戻っている疑い（内訳: ${[...uniq].join(', ')}）`);
  // 特定の1人が半分以上を占めていたら、実質固定と同じ
  const top = [...uniq].map(n => names.filter(x => x === n).length).sort((a, b) => b - a)[0];
  assert.ok(top <= names.length * 0.5,
    `1人が ${top}/${names.length} 回を占めている。偏りすぎ`);
});

section('3. 語り手は出場を狙える圏内から選ばれる', () => {
  const ordered = [...G.roster]
    .filter(f => f && !f.injury && !f.isRental && !f.isIntrusion)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const limit = Math.max(3, Math.min(8, Math.ceil(ordered.length / 2)));
  // 境界のOVR同点は「圏内」に含める。実装は同点を id の安定ソートで切るため、
  // ここで同点処理なしに上位N名だけを集合にすると、境界に同点者が並んだとき
  // 実装が選んだ正当な語り手を「圏外」と誤判定する(2026-07-30 に露出)
  const cutOv = Engine.util.ov(ordered[limit - 1]);
  const eligibleNames = new Set(
    ordered.filter((f, i) => i < limit || Engine.util.ov(f) === cutOv).map(f => f.name));
  for (let s = 4; s <= 80; s += 4) {
    const f = (build(s).fighters || [])[0];
    if (!f) continue;
    assert.ok(eligibleNames.has(f.name),
      `S${s}: 圏外の ${f.name} が語っている。「狭き門をくぐれるか」のセリフが浮く`);
  }
});

section('4. 条件付きセリフの仕組みが生きている', () => {
  const L = typeof TENCHOSEN_PREEVENT_LINES !== 'undefined' ? TENCHOSEN_PREEVENT_LINES : null;
  assert.ok(L && L.fighter, 'セリフ定義が読めない');
  let veteran = 0, notPrior = 0;
  Object.values(L.fighter).forEach(pool => pool.forEach(l => {
    if (l.veteran) veteran++;
    if (l.notPriorEntrant) notPrior++;
  }));
  assert.ok(veteran > 0, 'ベテラン専用セリフが無くなっている');
  assert.ok(notPrior > 0, '前回未出場セリフが無くなっている');

  // 31歳以上の選手には veteran 行が優先されること（buildPreEvent の分岐が生きている確認）
  const vetRoster = G.roster.map((f, i) => i === 0 ? { ...f, age: 34 } : f);
  const ordered = [...vetRoster]
    .filter(f => f && !f.injury && !f.isRental && !f.isIntrusion)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const oldest = ordered[0];
  const vetG = { ...G, roster: vetRoster.map(f => f.id === oldest.id ? { ...f, age: 34 } : f) };
  let sawVeteranLine = false;
  for (let s = 4; s <= 200; s += 4) {
    const ev = Engine.ppvTournament.buildPreEvent(
      { ...vetG, season: s }, Engine.rng.create(Engine.rng.derive(vetG.rngSeed, s, 0x7C0)));
    const f = (ev.fighters || [])[0];
    if (!f || f.id !== oldest.id) continue;
    const pool = L.fighter[f.archetype] || L.fighter.normal;
    const line = pool.find(l => l.text === f.line);
    if (line && line.veteran) { sawVeteranLine = true; break; }
  }
  assert.ok(sawVeteranLine,
    '31歳以上の選手にベテラン専用セリフが一度も回っていない。条件分岐が死んでいる');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
