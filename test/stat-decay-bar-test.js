// stat-decay-bar-test.js
//
// 2026-07-27: 能力バーの「自己最高値からどれだけ落ちたか」の帯について。
//
// Keisuke「トレインキャップの部分から色を入れてるので、それだと結構下隠しにしている
//          トレインキャップの数値が諸バレになってしまうので、それはやめてほしい。
//          あくまで今まで一番高くまで行った能力値の上限のところから始まる感じで。
//          もう今の能力値のところまで全部染め上げて、繋がるようにしてほしい」
//
// 2度直している。
//   1度目: 帯を [trainCap, trainCapOrigin] に置いていた。帯の左端がそのまま trainCap の
//          位置になり、**伏せてある天井の値が読めた**。現在値との間に隙間も空いていた。
//   2度目: 起点を現在値へ寄せただけでは足りなかった。
//          **trainCapOrigin は「伸ばせる上限」で、実際に到達した値ではない**。
//          MN のように上限まで伸びにくいステータスでは、一度も届いていない高さまで
//          帯が伸びて「そんなに高かったはずがない」表示になっていた（Keisuke 指摘）。
//          さらに初回衰退時にしか記録されないので**年をまたぐまで出なかった**。
//          → 実際に到達した最高値(statPeak)を毎週控え、そこを基準にする。
//
// 守るもの:
//   1. 帯は現在値のすぐ右から始まる（隙間ゼロ＝色が繋がる）
//   2. 基準は statPeak。trainCap / trainCapOrigin を見ない（天井が読めない・届かない高さに伸びない）
//   3. 帯の右端は自己最高値で止まる
//   4. まだ落ちていない選手・既存セーブには帯を出さない（履歴を捏造しない）
//   5. 自己最高値は毎週控えられる（年をまたがなくても出る）

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

// cap/origin は「基準に使ってはいけない値」としてわざと大きく入れてある。
// これらを見てしまう実装に戻ると、帯が届いていない高さまで伸びて項目2が落ちる。
const CASES = [
  { label: '現在値115 / 自己最高120', cur: 115, peak: 120, cap: 140, origin: 148, max: 150 },
  { label: '現在値70 / 自己最高100',  cur: 70,  peak: 100, cap: 130, origin: 145, max: 150 },
  { label: 'MN型: 上限は高いが到達は僅か 71/73', cur: 71, peak: 73, cap: 127, origin: 127, max: 150 },
  { label: '100スケール(選手詳細) 60/72', cur: 60, peak: 72, cap: 90, origin: 96, max: 100 },
];

section('1. 帯は現在値のすぐ右から始まる（色が途切れない）', () => {
  for (const c of CASES) {
    const f = { S: c.cur, statPeak: { S: c.peak }, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    const b = band(f, 'S', c.max);
    assert.ok(b.width > 0, `${c.label}: 帯が出ていない`);
    assert.ok(Math.abs(b.left - b.cur) < 0.01,
      `${c.label}: 現在値(${b.cur.toFixed(2)}%)と帯の左端(${b.left.toFixed(2)}%)が離れている。バーが分断されて見える`);
  }
});

section('2. 基準は自己最高値。天井(trainCap/trainCapOrigin)を見ていない', () => {
  for (const c of CASES) {
    const f = { S: c.cur, statPeak: { S: c.peak }, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    const b = band(f, 'S', c.max);
    assert.ok(Math.abs(b.right - pctOf(c.peak, c.max)) < 0.01,
      `${c.label}: 帯の右端(${b.right.toFixed(2)}%)が自己最高値(${pctOf(c.peak, c.max).toFixed(2)}%)と違う`);
    assert.ok(Math.abs(b.right - pctOf(c.origin, c.max)) > 0.01,
      `${c.label}: 帯が trainCapOrigin(${pctOf(c.origin, c.max).toFixed(2)}%)まで伸びている。`
      + '到達していない高さまで塗ってしまう');
    assert.ok(Math.abs(b.left - pctOf(c.cap, c.max)) > 0.01,
      `${c.label}: 帯の左端が今の天井と同じ。伏せている天井が読めてしまう`);
    assert.strictEqual(b.lostPts, c.peak - c.cur,
      `${c.label}: ▼の数字が「自己最高値 − 現在値」になっていない`);
  }
});

section('3. 帯がバーからはみ出さない', () => {
  for (const c of CASES) {
    const f = { S: c.cur, statPeak: { S: c.peak }, trainCap: { S: c.cap }, trainCapOrigin: { S: c.origin } };
    assert.ok(band(f, 'S', c.max).right <= 100.01, `${c.label}: 帯がバーからはみ出している`);
  }
});

section('4. まだ落ちていない選手・既存セーブには帯を出さない', () => {
  // 自己最高値＝現在値（落ちていない）
  const f1 = { S: 100, statPeak: { S: 100 }, trainCap: { S: 130 } };
  assert.strictEqual(statDecayView(f1, 'S', 150).lostPct, 0, '落ちていないのに帯が出ている');
  assert.strictEqual(statDecayView(f1, 'S', 150).lostPts, 0, '落ちていないのに▼が出ている');
  // statPeak をまだ持たない（既存セーブの初回ロード前）。天井だけ高くても出さない
  const f2 = { S: 80, trainCap: { S: 140 }, trainCapOrigin: { S: 148 } };
  assert.strictEqual(statDecayView(f2, 'S', 150).lostPct, 0,
    'statPeak が無いのに帯が出ている。天井を見て履歴を捏造している');
  assert.strictEqual(statDecayView(f2, 'S', 150).lostPts, 0, 'statPeak が無いのに▼が出ている');
  // 何も持たない選手でも落ちない
  assert.strictEqual(statDecayView({ S: 80 }, 'S', 150).lostPct, 0, '素の選手で帯が出ている');
});

section('5. 自己最高値は毎週控えられる（年をまたがなくても出る）', () => {
  const mgmt = fs.readFileSync(path.join(root, 'src/management.js'), 'utf8');
  assert.ok(/trackStatPeaks\(state\)/.test(mgmt), 'trackStatPeaks が無い');
  // tickWeek(毎週)から呼ばれていること。シーズン末処理からだけだと年をまたぐまで出ない
  const at = mgmt.indexOf('Engine.growth.trackStatPeaks(s)');
  assert.ok(at > 0, 'tickWeek から trackStatPeaks を呼んでいない');
  const tickAt = mgmt.indexOf('tickWeek(state) {');
  const tickEnd = mgmt.indexOf('\n  // ══', tickAt);
  assert.ok(tickAt > 0 && at > tickAt && at < tickEnd,
    'trackStatPeaks の呼び出しが tickWeek の外にある。年をまたぐまで表示が出なくなる');
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
