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
  // 2026-07-27: 基準を trainCapOrigin(伸ばせる上限) から statPeak(実際に到達した最高値) へ
  // 変えた。上限は一度も届いていない高さなので、そこまで帯を伸ばすと
  // 「そんなに高かったはずがない」表示になる（MN で顕著）。幾何は stat-decay-bar-test.js。
  assert.ok(/statPeak/.test(viewSrc), '自己最高値(statPeak)を基準にしていない');
  assert.ok(/peak - cur/.test(viewSrc), '「自己最高値 − 現在値」を取っていない');
  // AIに限っては statPeak を保存していないため、実際に削れた天井差を明示指定で復元する。
  // 通常経路はこの情報を使わず、既存セーブの履歴を捏造しない。
  assert.ok(/recoverKnownCapLoss/.test(viewSrc), 'AI用の明示的な復元経路が無い');
  // eslint-disable-next-line no-eval
  const view = eval('(' + viewSrc + ')');
  global.GROWTH_CONFIG = { wearCapDecayRatio: 0.5 };
  const ai = { S: 80, trainCap: { S: 116 }, trainCapOrigin: { S: 120 } };
  assert.strictEqual(view(ai, 'S', 150).lostPts, 0,
    '通常経路が天井を見て履歴を捏造している');
  assert.strictEqual(view(ai, 'S', 150, true).lostPts, 8,
    'AI用復元が実際に削れた天井差を表示していない');
});

section('7. まだ落ちていない選手・既存セーブには何も出さない', () => {
  // 衰えの履歴を捏造しない。字面ではなく**実際に呼んで**確かめる
  // eslint-disable-next-line no-eval
  const view = eval('(' + viewSrc + ')');
  assert.strictEqual(view({ S: 100, statPeak: { S: 100 } }, 'S', 150).lostPct, 0,
    '落ちていないのに帯を描いている');
  assert.strictEqual(view({ S: 80, trainCap: { S: 140 }, trainCapOrigin: { S: 148 } }, 'S', 150).lostPct, 0,
    'statPeak が無いのに帯を描いている（天井を見て履歴を捏造している）');
  assert.strictEqual(view({ S: 80 }, 'S', 150).lostPct, 0, '素の選手で帯を描いている');
});

section('7-b. 自己最高値は毎週控える（年をまたがなくても出る）', () => {
  // trainCapOrigin は初回衰退時にしか記録されず、年をまたぐまで表示が出なかった
  assert.ok(/trackStatPeaks\(state\)/.test(mgmt), 'trackStatPeaks が無い');
  assert.ok(mgmt.indexOf('Engine.growth.trackStatPeaks(s)') > 0,
    'tickWeek から毎週呼んでいない');
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
  assert.ok(/statDecayView\(c, s\.key, 150, isAiFighter\)/.test(ui),
    '選手詳細ポップアップに出ていない');
  // どちらもバーの目盛りに合った barMax を渡していること
  assert.ok(!/statDecayView\([^)]*, *undefined\)/.test(uiRender + ui), '目盛りを渡していない');
});

section('11. 数字でも下がり幅を出す', () => {
  // バーだけだと何ポイント落ちたか分からない
  assert.ok(/▼\$\{dv\.lostPts\}/.test(uiRender), '団体画面に下がり幅の数字が無い');
  // 選手詳細はtask-91で共通数値表記(statOverBarHtml)へ移行。▼は is-lost マークが背負う
  assert.ok(/▼\$\{_statOverBarEsc\(lost\)\}/.test(ui), '選手詳細(共通表記)に下がり幅の数字が無い');
  assert.ok(/lost: decay\.lostPts/.test(ui), '選手詳細が消耗量(lostPts)をバーへ渡していない');
});

section('12. 成長中の表示を潰さない', () => {
  // 団体画面: 今季伸びた選手は「+3」が優先。伸びていないときだけ「▼8」を出す
  assert.ok(/sg > 0 \? '\+' \+ sg : lostTag \|\| '—'/.test(uiRender),
    '団体画面で成長表示と衰え表示がぶつかっている');
  // 選手詳細(共通表記): +Nと▼Nは別チップで併記し、互いに潰し合わない(task-90/91確定デザイン)
  assert.ok(/lost > 0 \? `<span class="stat-over-mark is-lost">▼/.test(ui),
    '選手詳細で衰えマークが独立に出ない');
  assert.ok(/gain > 0 \? `<span class="stat-over-mark is-gain">\+/.test(ui),
    '選手詳細で成長マークが独立に出ない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (12 sections)');
