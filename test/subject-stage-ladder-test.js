'use strict';

// A型モーダルの選手画像は M 132×194 の一段だけ (2026-07-31 Keisuke 決定)
//
// 以前: 既定 140×184 / small 120×160 の2種類。どちらも 3:4 寄りで、
//       2:3 素材(upper 256×384)を background-size:cover で入れていたため
//       **脚側が約1割切れていた**。梯子(mockup-baseline §2)にも載っていない。
//
// 決定: 比率は「目的」で決める(§2-0)。人物を見せる枠なので 2:3。
//       段は M 132×194 に一本化し、small という区別は廃止する
//       — 画面ごとに大小を選べると「その場で決める」が戻ってくるため。
//
// 影響: 派閥イベント / 選手ケア / 社長室 / 王座防衛 が同じ部品を共有する。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const stripComments = t => t.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

const LADDER = [[172, 258], [150, 224], [132, 194], [108, 162], [46, 66]];
const onLadder = (w, h) => LADDER.some(([lw, lh]) => lw === w && lh === h);

// ── 1. JS 側が M 132×194 の一段だけを返す ──
{
  const src = stripComments(ui);
  const at = src.indexOf('function _mdlASubjectStage');
  assert.ok(at > 0, '_mdlASubjectStage が無い');
  const body = src.slice(at, at + 900);

  const m = body.match(/const size = \{ w: (\d+), h: (\d+) \};/);
  assert.ok(m, '画像サイズが一段の固定値になっていない');
  const [w, h] = [Number(m[1]), Number(m[2])];
  assert.ok(onLadder(w, h), `${w}×${h} は 2:3 の梯子に無い値`);
  assert.strictEqual(`${w}x${h}`, '132x194', 'A型モーダルの主役は M 132×194');

  assert.ok(!/opts && opts\.small\) \? \{/.test(body),
    'small でサイズを分けるコードが戻っている。段を画面ごとに選べると「その場で決める」が復活する');
}

// ── 2. CSS の既定値も同じ段 ──
{
  const m = html.match(/\.mdl-a-subject-portrait-wrap \{[\s\S]{0,300}?width: (\d+)px; height: (\d+)px;/);
  assert.ok(m, '.mdl-a-subject-portrait-wrap の既定サイズが読めない');
  const [w, h] = [Number(m[1]), Number(m[2])];
  assert.strictEqual(`${w}x${h}`, '132x194',
    'CSS の既定値が JS と食い違っている。片方だけ古くなる');
}

// ── 3. 切れ落ちが実用上ゼロであること ──
{
  // 素材は upper/stand 256×384、full 512×768 = すべて 2:3。
  // background-size:cover は幅を合わせるので、枠の高さが (幅×1.5) に足りない分だけ下が切れる。
  //
  // 梯子の段は**厳密な 2:3 ではない**（XL 172×258 と S 108×162 だけがぴったり）。
  // M 132×194 は 2.0%、chip 46×66 は 4.3% 切れる。丸めのぶんで、目には出ない。
  // 一方 3:4（旧 140×184）は 12.4% 切れて、脚がはっきり欠ける。
  // ここで見たいのは「厳密な 2:3 か」ではなく「切れが目に見えるか」なので、5% を境にする。
  const cropPct = (w, h) => (1 - h / (w * 1.5)) * 100;
  const m = 132, mh = 194;
  assert.ok(cropPct(m, mh) < 5,
    `M ${m}×${mh} で ${cropPct(m, mh).toFixed(1)}% 切れる。5%を超えると目に見える`);
  // 旧サイズが戻っていないことも見る（これは12%切れる）
  assert.ok(cropPct(140, 184) > 10, 'テストの計算式が壊れている（旧3:4は12%切れるはず）');
}

// ── 4. ルールが文書に残っていること ──
{
  const base = fs.readFileSync(path.join(root, 'docs', 'ui', 'mockup-baseline-v0.1.md'), 'utf8');
  assert.ok(/## 2-0\. 縦横比は「目的」で決める/.test(base),
    'mockup-baseline に比率の決め方が書かれていない。'
    + 'コードだけ直しても、次に画面を足すときまた迷う');
  assert.ok(/A型モーダル（社長室型）の主役は `M 132×194` に一本化する/.test(base),
    'A型モーダルの段が文書に固定されていない');
}

console.log('subject-stage-ladder-test: ok');
