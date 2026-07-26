// tooltip-click-passthrough-test.js
//
// **説明文を足しただけでボタンが死ぬ**のを防ぐ。
//
// 2026-07-26 の実害:
//   ⚡追い込みボタンに data-tip（押す前に代償が分かるようにする説明）を付けた。
//   それだけで **ボタンが完全に無反応**になった。
//
// 犯人は data-tip のタップ表示リスナー。capture 段階で拾って、
// 無条件に stopPropagation() していた:
//
//   document.addEventListener('click', (e) => {
//     const el = e.target.closest('[data-tip]');
//     if (el) { e.stopPropagation(); showCustomTooltip(...); }   ← ボタン自身でも止まる
//   }, true);
//
// このリスナーが止めてよいのは「ℹ️ や見出しの ? のように、押しても何も起きない印」だけ。
// 押せる部品(button / a / input / select / onclick 付き)の click は本人のものなので通す。
//
// 静的検査なので「動くか」までは見られない。**動くことは実機で確認した**
// (localhost:3000 で ⚡ を click() → intensive が false→true→false)。
// ここで守るのは、あの無条件 stopPropagation が戻ってこないこと。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const uiRender = read('src/ui-render.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== data-tip がクリックを飲み込まないこと ===\n');

// capture 段階の click リスナー本体を取り出す
const capture = (ui.match(/document\.addEventListener\('click',[\s\S]*?\}, true\);/) || [])[0];

section('1. タップ表示のリスナーが capture 段階にいる', () => {
  assert.ok(capture, 'data-tip の capture リスナーが見つからない');
  assert.ok(/data-tip/.test(capture), '取り出したリスナーが data-tip のものではない');
});

section('2. 無条件に stopPropagation していない', () => {
  // これがこのテストの本体。`if (el) { e.stopPropagation(); ... }` の形に戻ったら落とす
  assert.ok(!/if \(el\) \{ e\.stopPropagation\(\);/.test(capture),
    'data-tip があるだけで click を止めている。説明文を足した部品が無反応になる');
});

section('3. 押せる部品なら通す判定がある', () => {
  assert.ok(/closest\('button,a,input,select,textarea,\[onclick\]'\)/.test(capture),
    '押せる部品かどうかを見ていない');
  assert.ok(/ctrl === el \|\| el\.contains\(ctrl\)/.test(capture),
    'data-tip の「内側」の部品かどうかを見ていない。' +
    '祖先まで通してしまうと、見出しの ? を押しただけで列ソートが走る');
  assert.ok(/return;[\s\S]{0,80}e\.stopPropagation\(\);/.test(capture),
    '通す場合に早期 return していない');
});

section('4. 説明を出す処理自体は残っている', () => {
  assert.ok(/showCustomTooltip\(el, el\.getAttribute\('data-tip'\)\)/.test(capture),
    'ツールチップが出なくなっている');
});

section('5. 止める側（押しても何も起きない印）は残す', () => {
  // ℹ️/? の印は親の onclick より先に止める必要がある。両立していること
  assert.ok(/e\.stopPropagation\(\);/.test(capture),
    'stopPropagation が消えている。見出しの ? を押すと列ソートが誤発火する');
});

// ─────────────────────────────────────────────────────────────
// 実際に罠にかかっていた部品
// ─────────────────────────────────────────────────────────────

section('6. ⚡追い込みボタンは説明文つきのまま押せる形になっている', () => {
  const line = uiRender.split('\n').find(l => l.includes('class="btn-intensive'));
  assert.ok(line, '⚡ボタンが見つからない');
  assert.ok(/onclick="toggleIntensive\(/.test(line), 'onclick が外れている');
  assert.ok(/intTip/.test(line), '説明文(data-tip)が外れている。代償が押す前に分からなくなる');
  // 「説明を消して直す」は直したことにならない。両方あって初めて正しい
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (6 sections)');
