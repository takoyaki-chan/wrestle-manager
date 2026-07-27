// stat-decay-bar-test.js
//
// 2026-07-27: 能力バーの「消耗で失われた伸びしろ」帯について。
//
// Keisuke「トレインキャップの部分から色を入れてるので、それだと結構下隠しにしている
//          トレインキャップの数値が諸バレになってしまうので、それはやめてほしい。
//          あくまで今まで一番高くまで行った能力値の上限のところから始まる感じで。
//          もう今の能力値のところまで全部染め上げて、繋がるようにしてほしい」
//
// 元の実装は帯を [trainCap, trainCapOrigin] に置いていた。そのため
//   ・帯の左端がそのまま trainCap の位置になり、**伏せてある天井の値が読めた**
//   ・現在値と帯のあいだに「現在値→trainCap」の隙間が空き、バーが分断されて見えた
//
// 守るもの:
//   1. 帯は現在値のすぐ右から始まる（隙間ゼロ＝色が繋がる）
//   2. 帯の左端が trainCap と一致しない（＝天井の位置が読めない）
//   3. 帯の右端は trainCapOrigin（自己最高の天井）を超えない
//   4. まだ衰えていない選手・既存セーブには帯を出さない（履歴を捏造しない）

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/ui-common.js'), 'utf8');
const fnSrc = (src.match(/function statDecayView[\s\S]*?\n\}/) || [])[0];

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 能力バーの減衰帯 ===\n');

assert.ok(fnSrc, 'statDecayView が見つからない');
// eslint-disable-next-line no-eval
const statDecayView = eval('(' + fnSrc + ')');

// 帯の左右端(バー全体に対する%)を求める
function band(f, stat, max) {
  const d = statDecayView(f, stat, max);
  return {
    cur: d.curPct,
    left: 100 - d.lostFromRightPct - d.lostPct,
    right: 100 - d.lostFromRightPct,
    width: d.lostPct,
    lostPts: d.lostPts,
  };
}
const pctOf = (v, max) => (v / max) * 100;

const CASES = [
  { label: '現在値115 / 今の天井120 / 元の天井126', cur: 115, cap: 120, origin: 126, max: 150 },
  { label: '現在値が今の天井に到達済み 120/120/126', cur: 120, cap: 120, origin: 126, max: 150 },
  { label: '大きく削られた 70/75/100',              cur: 70,  cap: 75,  origin: 100, max: 150 },
  { label: '100スケール(選手詳細) 60/64/72',        cur: 60,  cap: 64,  origin: 72,  max: 100 },
];

section('1. 帯は現在値のすぐ右から始まる（色が途切れない）', () => {
  for (const c of CASES) {
    const f = { S: c.cur, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    const b = band(f, 'S', c.max);
    assert.ok(b.width > 0, `${c.label}: 帯が出ていない`);
    assert.ok(Math.abs(b.left - b.cur) < 0.01,
      `${c.label}: 現在値(${b.cur.toFixed(2)}%)と帯の左端(${b.left.toFixed(2)}%)が離れている。バーが分断されて見える`);
  }
});

section('2. 帯の左端が trainCap と一致しない（天井の位置が読めない）', () => {
  for (const c of CASES) {
    if (c.cur === c.cap) continue; // 現在値＝天井のときは一致して当然（そこは現在値の情報）
    const f = { S: c.cur, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    const b = band(f, 'S', c.max);
    const capPct = pctOf(c.cap, c.max);
    assert.ok(Math.abs(b.left - capPct) > 0.01,
      `${c.label}: 帯の左端(${b.left.toFixed(2)}%)が今の天井(${capPct.toFixed(2)}%)と同じ。伏せている天井が読めてしまう`);
  }
});

section('3. 帯の右端は自己最高の天井で止まる', () => {
  for (const c of CASES) {
    const f = { S: c.cur, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    const b = band(f, 'S', c.max);
    const originPct = pctOf(c.origin, c.max);
    assert.ok(Math.abs(b.right - originPct) < 0.01,
      `${c.label}: 帯の右端(${b.right.toFixed(2)}%)が自己最高の天井(${originPct.toFixed(2)}%)と違う`);
    assert.ok(b.right <= 100.01, `${c.label}: 帯がバーからはみ出している`);
  }
});

section('4. ▼の数字は「失った天井の量」のまま', () => {
  for (const c of CASES) {
    const f = { S: c.cur, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    assert.strictEqual(band(f, 'S', c.max).lostPts, c.origin - c.cap,
      `${c.label}: ▼の数字が origin-cap になっていない`);
  }
});

section('5. まだ衰えていない選手には帯を出さない', () => {
  // trainCapOrigin を持たない（一度も衰退していない / 既存セーブ）
  const f1 = { S: 100, trainCap: { S: 110 } };
  assert.strictEqual(statDecayView(f1, 'S', 150).lostPct, 0, '衰えていないのに帯が出ている');
  assert.strictEqual(statDecayView(f1, 'S', 150).lostPts, 0, '衰えていないのに▼が出ている');
  // trainCap をまったく持たない選手でも落ちない
  const f2 = { S: 80 };
  assert.strictEqual(statDecayView(f2, 'S', 150).lostPct, 0, 'trainCap 無しで帯が出ている');
  // origin と cap が同じ（削られていない）
  const f3 = { S: 90, trainCap: { S: 100 }, trainCapOrigin: { S: 100 } };
  assert.strictEqual(statDecayView(f3, 'S', 150).lostPct, 0, '削られていないのに帯が出ている');
});

section('6. 両方の描画箇所が同じヘルパーを通っている', () => {
  const uiRender = fs.readFileSync(path.join(root, 'src/ui-render.js'), 'utf8');
  assert.ok(/statDecayView\(c, s\.key, 100\)/.test(src),
    '選手詳細ポップアップがヘルパーを通っていない');
  assert.ok(/statDecayView\(c, s, 150\)/.test(uiRender),
    'ロスター詳細がヘルパーを通っていない');
  // 幅と位置を直接組み立てている箇所が無いこと（2箇所に規則を書くと必ず片方が古くなる）
  const inline = (src + uiRender).match(/trainCapOrigin\[[^\]]+\]\s*-\s*/g) || [];
  assert.strictEqual(inline.length, 0,
    '描画側で天井の差を直接計算している。計算はヘルパー1箇所に集約すること');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
