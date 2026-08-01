// org-compare-tone-test.js
//
// 団体比較(新聞2面)の語調。
//
// Keisuke 指摘(2026-08-01):
//   「団体比較が中途半端なことしか言ってない印象がある。劣っている状況なら、
//     劣っている状況なりに手厳しく言う必要があるし、互角なら互角なりに言う必要があるし、
//     こちらの方が勝ってるならそれをちゃんと言う必要がある。ちゃんと差異をつけて比較してほしい」
//
// 実装を読んで分かっていた3つの穴:
//   1. 各軸の文面が ±10 の1段しきい値しかなく、+12 でも +80 でも同じ一文だった
//   2. グレード(D/C/B/B+/A)を出しているのに、本文がそれを一切見ていなかった
//   3. kuroda-text.js に5段階の語調(devastating/behind/even/ahead/dominant)で
//      158本が書かれていたのに、src のどこからも参照されていなかった(死蔵)
//
// ここで守るのは「差の大きさで言葉が変わること」と「死蔵に戻さないこと」。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame, loadAsGlobal } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });
loadAsGlobal('kuroda-text.js'); // 黒田の文章は別ファイル。loadGame の既定には入っていない

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const mgmt = read('src/management.js');
const render = read('src/ui-render.js');
const kuroda = read('src/kuroda-text.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== 団体比較の語調 ===\n');

const BANDS = ['devastating', 'behind', 'even', 'ahead', 'dominant'];

// ─────────────────────────────────────────────────────────────
// A. 語調帯 — グレードと同じ境界で、5帯すべてに文章がある
// ─────────────────────────────────────────────────────────────

section('A1. グレードと同時に語調帯(band)を決めている', () => {
  BANDS.forEach(b => {
    assert.ok(new RegExp(`band = '${b}'`).test(mgmt), `band '${b}' を割り当てていない`);
  });
  assert.ok(/grade, gradeDesc, totalDiff,[\s\S]{0,200}?\n {6}band,/.test(mgmt),
    'band を比較データとして返していない。描画側が語調を選べない');
});

section('A2. 5帯すべてに見出しと論説が書かれている(死蔵していた158本)', () => {
  [['KURODA_HEADLINES', 15], ['KURODA_EDITORIAL', 10]].forEach(([name, min]) => {
    const block = kuroda.match(new RegExp(`const ${name} = \\{[\\s\\S]*?\\n\\};`));
    assert.ok(block, `${name} が kuroda-text.js に無い`);
    BANDS.forEach(b => {
      const seg = block[0].split(new RegExp(`\\n  ${b}: \\[`))[1];
      assert.ok(seg, `${name}.${b} が無い`);
      const n = (seg.split(/\n  \w+: \[/)[0].match(/^\s+d =>/gm) || []).length;
      assert.ok(n >= min, `${name}.${b} が ${n} 本しかない(${min}本以上あるはず)`);
    });
  });
});

section('A3. 見出しと論説が実際に紙面へ配線されている', () => {
  assert.ok(/_npKurodaBandLine\('headlines'/.test(render),
    '見出し(KURODA_HEADLINES)が使われていない。死蔵に戻っている');
  assert.ok(/_npKurodaBandLine\('editorial'/.test(render),
    '論説(KURODA_EDITORIAL)が使われていない。死蔵に戻っている');
  assert.ok(/pool\[d\.band\]/.test(render), '語調帯で引いていない');
});

section('A4. 同じ一文をページ内で二度出さない', () => {
  // 以前は見出しの引用も記者コラムも同じ summaryText を出していた
  const at = render.indexOf('np-headline-quote');
  const seg = render.slice(at - 400, at + 200);
  assert.ok(!/np-headline-quote">「\$\{d\.summaryText/.test(seg),
    '見出しの引用が summaryText のまま。記者コラムと同じ文が1ページに二度並ぶ');
});

// ─────────────────────────────────────────────────────────────
// B. 差の大きさで言葉が変わる
// ─────────────────────────────────────────────────────────────

section('B1. 各軸に「圧倒」「完敗」の段がある(±10 の1段しきい値ではない)', () => {
  const meta = mgmt.match(/const AXIS_META = \[[\s\S]*?\n {4}\];/);
  assert.ok(meta, 'AXIS_META が読めない');
  ['ace', 'depth', 'popularity', 'starPower'].forEach(k => {
    const axis = meta[0].split(new RegExp(`key: '${k}'`))[1].split(/\n {6}\{ key:/)[0];
    assert.ok(/leadBig:/.test(axis), `${k} に leadBig(圧倒)が無い`);
    assert.ok(/trailBig:/.test(axis), `${k} に trailBig(完敗)が無い`);
  });
  assert.ok(/AXIS_BIG = \d+/.test(mgmt), '大差のしきい値が定義されていない');
});

section('B2. 少し勝っている状態と圧倒している状態で文が変わる', () => {
  // fragOf 相当の分岐をソースから取り出して直接確かめる
  const bigMatch = mgmt.match(/const AXIS_BIG = (\d+)/);
  const BIG = Number(bigMatch[1]);
  assert.ok(BIG > 10, `大差のしきい値(${BIG})が優勢のしきい値(10)と同じかそれ以下`);
  const meta = mgmt.match(/const AXIS_META = \[[\s\S]*?\n {4}\];/)[0];
  const axis = meta.split(/key: 'ace'/)[1].split(/\n {6}\{ key:/)[0];
  const grab = key => (axis.match(new RegExp(`${key}: '([^']+)'`)) || [])[1];
  const [leadBig, lead, trail, trailBig, even] =
    ['leadBig', 'lead', 'trail', 'trailBig', 'even'].map(grab);
  const all = [leadBig, lead, trail, trailBig, even];
  all.forEach((s, i) => assert.ok(s, `${['leadBig','lead','trail','trailBig','even'][i]} が空`));
  assert.strictEqual(new Set(all).size, 5, `5段の文面に重複がある: ${all.join(' / ')}`);
});

section('B3. 全軸で優勢/劣勢しか無い分岐が残っていない', () => {
  assert.ok(!/return d >= 10 \? ax\.lead : d <= -10 \? ax\.trail : ax\.even;/.test(mgmt),
    '旧しきい値の分岐が残っている。+12 も +80 も同じ文になる');
  assert.ok(/const fragOf = \(ax\) =>/.test(mgmt), '段を選ぶ共通処理(fragOf)が無い');
  // 片側しか無い週の特殊文も fragOf を通すこと(ここだけ旧 .lead/.trail 直参照だった)
  assert.ok(!/\$\{negativeAxes\[0\]\.trail\}/.test(mgmt) && !/\$\{positiveAxes\[0\]\.lead\}/.test(mgmt),
    '特殊ケースの文が段を無視して .lead/.trail を直に読んでいる');
});

// ─────────────────────────────────────────────────────────────
// C. エンジンを回して実際の出力を見る
// ─────────────────────────────────────────────────────────────

section('C1. 比較データが band を返し、グレードと矛盾しない', () => {
  const G = Engine.createInitialState(4242, true);
  const target = Object.keys(G.aiOrgs || {})[0];
  assert.ok(target, 'AI団体がいない');
  const d = Engine.database.getOrgCompareAnalysis(G, target);
  assert.ok(BANDS.includes(d.band), `band が5帯のどれでもない: ${d.band}`);
  const expected = d.totalDiff <= -60 ? 'devastating'
    : d.totalDiff <= -25 ? 'behind'
    : d.totalDiff <= 10 ? 'even'
    : d.totalDiff <= 40 ? 'ahead' : 'dominant';
  assert.strictEqual(d.band, expected, `totalDiff=${d.totalDiff} に対する band が食い違う`);
  const gradeOf = { devastating: 'D', behind: 'C', even: 'B', ahead: 'B+', dominant: 'A' };
  assert.strictEqual(d.grade, gradeOf[d.band], 'グレードと語調帯が食い違う');
});

section('C2. テンプレートが要求する差し込み語を比較データが全部持っている', () => {
  const tpl = (kuroda.match(/const KURODA_HEADLINES = \{[\s\S]*?\n\};/)[0]
    + kuroda.match(/const KURODA_EDITORIAL = \{[\s\S]*?\n\};/)[0]);
  const keys = [...new Set([...tpl.matchAll(/d\.(\w+)/g)].map(m => m[1]))];
  const G = Engine.createInitialState(4242, true);
  const target = Object.keys(G.aiOrgs || {})[0];
  const d = Engine.database.getOrgCompareAnalysis(G, target);
  keys.forEach(k => {
    assert.ok(d[k] != null && d[k] !== '',
      `テンプレートが {${k}} を使うのに比較データが持っていない(見出しが欠ける)`);
  });
});

section('C3. 5帯すべての見出し・論説が例外なく組み立てられる', () => {
  const G = Engine.createInitialState(4242, true);
  const target = Object.keys(G.aiOrgs || {})[0];
  const base = Engine.database.getOrgCompareAnalysis(G, target);
  BANDS.forEach(b => {
    [KURODA_HEADLINES, KURODA_EDITORIAL].forEach((pool, pi) => {
      (pool[b] || []).forEach((fn, i) => {
        let out;
        assert.doesNotThrow(() => { out = fn({ ...base, band: b }); },
          `${pi === 0 ? 'HEADLINES' : 'EDITORIAL'}.${b}[${i}] が例外を投げる`);
        assert.ok(typeof out === 'string' && out.length > 0,
          `${pi === 0 ? 'HEADLINES' : 'EDITORIAL'}.${b}[${i}] が空文字`);
        assert.ok(!/undefined|\[object/.test(out),
          `${pi === 0 ? 'HEADLINES' : 'EDITORIAL'}.${b}[${i}] に undefined が出る: ${out}`);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
