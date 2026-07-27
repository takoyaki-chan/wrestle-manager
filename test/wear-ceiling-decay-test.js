// wear-ceiling-decay-test.js
//
// 消耗による衰退で **天井（trainCap）ごと下げる**。一度落ちた天井は戻らない。
// 落ちた分は能力値バーに「失われた伸びしろ」として残し、衰えを可視化する。
// （2026-07-27 Keisuke）
//
// それまでは:
//   ・現在値だけが下がり、練習すれば元の天井まで戻せた（消耗戦）
//   ・**衰えがどこにも記録されていなかった**。growthLog にも残らず、
//     「今シーズン累計」はプラスしか出さないので、削られた事実が消えていた
//
// 気をつける点が2つある。
//
//   1. trainCap は**成長速度の分母**でもある（convergenceFactor）。
//      天井が下がると伸びしろが縮み、成長が鈍って衰退が加速する複利が効く。
//      だから削り幅は現在値と同じにせず、割合（wearCapDecayRatio）で抑える。
//      実測（40シーズン・seed 7919）: 平均引退年齢 28.06 → 27.39（−0.67歳）。
//      仕様書 §4-1 の不変条件（26〜27歳 ±1.5歳）の範囲内。
//
//   2. **衰えの履歴を捏造しない。** 元の天井（trainCapOrigin）は
//      「初めて衰退したとき」に控える。既存セーブや、まだ衰えていない選手には
//      何も表示しない。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const data = read('src/data.js');
const mgmt = read('src/management.js');
const ui = read('src/ui-common.js');
const uiRender = read('src/ui-render.js');
const html = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 消耗は天井ごと削る ===\n');

const decaySrc = (mgmt.match(/applyDecay\(rng, fighter, decayReduction = 0\) \{[\s\S]*?\n    \},/) || [])[0];

// ─────────────────────────────────────────────────────────────
// A. 天井が削れるか
// ─────────────────────────────────────────────────────────────

section('1. 削り幅は設定値で持つ', () => {
  assert.ok(/wearCapDecayRatio: *[0-9.]+/.test(data), 'wearCapDecayRatio が無い');
  const v = parseFloat((data.match(/wearCapDecayRatio: *([0-9.]+)/) || [])[1]);
  assert.ok(v > 0, '天井が削れない設定になっている');
  assert.ok(v <= 1, '天井が現在値より速く削れる。伸びしろが逆に増えることがある');
});

section('2. 衰退が天井も削る', () => {
  assert.ok(decaySrc, 'applyDecay が見つからない');
  assert.ok(/f\.trainCap = cap;/.test(decaySrc), '天井を書き戻していない');
  assert.ok(/Math\.round\(loss \* capRatio\)/.test(decaySrc), '現在値の削り幅に連動していない');
});

section('3. 天井は現在値を下回らない', () => {
  // 下回ると「伸びしろが負」になり、バーの表示が壊れる
  assert.ok(/Math\.max\(f\[s\], \(cap\[s\] \|\| f\[s\]\) - capLoss\)/.test(decaySrc),
    '天井が現在値を割り込む');
});

section('4. 元の天井は「初めて衰退したとき」に控える', () => {
  // 生成時に持たせると、既存セーブに無い＝移行が要る。
  // 遅延で控えれば、まだ衰えていない選手には何も出ない（履歴を捏造しない）
  assert.ok(/if \(hasCap && capRatio > 0 && !f\.trainCapOrigin\) f\.trainCapOrigin = \{ \.\.\.f\.trainCap \};/.test(decaySrc),
    '元の天井を控えていない、または毎回上書きしている');
  // 上書きしてしまうと「失われた分」が常に0になる
  assert.ok(!/f\.trainCapOrigin = \{ \.\.\.cap \}/.test(decaySrc),
    '削ったあとの天井を元の高さとして控えている。失われた分が消える');
});

section('5. 衰退しない帯では何も起きない', () => {
  // 全盛期(wear 0-19)と確定引退(80+)は decayMax が 0
  assert.ok(/if \(decayMax <= 0\) return fighter;/.test(decaySrc),
    '衰退しない帯でも天井に触っている');
});

// ─────────────────────────────────────────────────────────────
// B. 見せ方
// ─────────────────────────────────────────────────────────────

const viewSrc = (ui.match(/function statDecayView[\s\S]*?\n\}/) || [])[0];

section('6. 失われた幅の計算は1本', () => {
  // 2画面で別々に計算すると、片方だけずれる
  assert.ok(viewSrc, 'statDecayView が無い');
  assert.ok(/origin - cap/.test(viewSrc), '元の天井と今の天井の差を取っていない');
});

section('7. 元の天井を持たない選手には何も出さない', () => {
  // 既存セーブ・まだ衰えていない選手。衰えの履歴を捏造しない。
  // 2026-07-27: 帯の起点を trainCap から現在値へ移した際に式の形が変わったため、
  // 字面ではなく**実際に呼んで**確かめる（帯の幾何は stat-decay-bar-test.js が持つ）
  assert.ok(/origin != null && cap != null/.test(viewSrc),
    '元の天井が無い選手でも差を出そうとしている');
  // eslint-disable-next-line no-eval
  const view = eval('(' + viewSrc + ')');
  assert.strictEqual(view({ S: 100, trainCap: { S: 110 } }, 'S', 150).lostPct, 0,
    '元の天井が無い選手に帯を描いている');
  assert.strictEqual(view({ S: 90, trainCap: { S: 100 }, trainCapOrigin: { S: 100 } }, 'S', 150).lostPct, 0,
    '削られていないのに帯を描いている');
  assert.strictEqual(view({ S: 80 }, 'S', 150).lostPct, 0,
    'trainCap を持たない選手に帯を描いている');
});

section('8. 色はトークンで持つ', () => {
  // ハードコード16進は禁止（CLAUDE.md）
  assert.ok(/--stat-decayed: *#[0-9a-f]{6}/i.test(html), '--stat-decayed トークンが無い');
  ['.rd-stat-bar-lost', '.fighter-popup-stat-lost'].forEach(cls => {
    const at = html.indexOf(cls + '{');
    assert.ok(at > 0, `${cls} が無い`);
    const body = html.slice(at, html.indexOf('}', at));
    assert.ok(/var\(--stat-decayed/.test(body), `${cls}: 色を直書きしている`);
  });
});

section('9. MN の紫と別の色にする', () => {
  // MN は #7040a0 / #9b59b6。同じ色だと「メンタルが伸びた」ように見える
  const tone = (html.match(/--stat-decayed: *(#[0-9a-f]{6})/i) || [])[1];
  assert.ok(tone, '色が読めない');
  ['#7040a0', '#9b59b6'].forEach(mn => {
    assert.notStrictEqual(tone.toLowerCase(), mn, `MN の紫(${mn})と同じ色になっている`);
  });
});

section('10. 団体画面と選手詳細の両方に出す', () => {
  assert.ok(/statDecayView\(c, s, 150\)/.test(uiRender),
    '団体画面(ロスター詳細)に出ていない');
  assert.ok(/statDecayView\(c, s\.key, 100\)/.test(ui),
    '選手詳細ポップアップに出ていない');
  // どちらもバーの目盛りに合った barMax を渡していること
  assert.ok(!/statDecayView\([^)]*, *undefined\)/.test(uiRender + ui), '目盛りを渡していない');
});

section('11. 数字でも下がり幅を出す', () => {
  // バーだけだと何ポイント落ちたか分からない
  assert.ok(/▼\$\{dv\.lostPts\}/.test(uiRender), '団体画面に下がり幅の数字が無い');
  assert.ok(/▼\$\{dv\.lostPts\}/.test(ui), '選手詳細に下がり幅の数字が無い');
});

section('12. 成長中の表示を潰さない', () => {
  // 今季伸びた選手は「+3」が優先。伸びていないときだけ「▼8」を出す
  assert.ok(/sg > 0 \? '\+' \+ sg : lostTag \|\| '—'/.test(uiRender),
    '団体画面で成長表示と衰え表示がぶつかっている');
  assert.ok(/\+\$\{sg\}<\/span>` : lostTag\}/.test(ui),
    '選手詳細で成長表示と衰え表示がぶつかっている');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (12 sections)');
