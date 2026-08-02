'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

const start = ui.indexOf('function _buildDraftGetPage(');
const end = ui.indexOf('\nfunction _finalizeDraft(', start);
assert.ok(start >= 0 && end > start, '_buildDraftGetPage が見つからない');
const getPage = ui.slice(start, end);

assert.match(getPage, /const DRAFT_CARD_BACKGROUNDS = \[/, '獲得カードの明色パレットが無い');
const palette = getPage.match(/linear-gradient\(145deg,#[0-9a-f]{6} 0%,#[0-9a-f]{6} 100%\)/gi) || [];
assert.ok(palette.length >= 8, '獲得カードの背景色は8種類以上必要');
assert.match(getPage, /draftColorHash = \(\(draftColorHash \* 31\)/,
  '再描画で色が変わらない決定的な色選択になっていない');
assert.match(getPage, /\(draftColorStart \+ \(\(f\._draftVisualIndex \|\| 0\) \* 5\)\)/,
  '同一画面のカード背景を分散させていない');

const normalCardStart = getPage.indexOf('function _card(f)');
const normalCardEnd = getPage.indexOf('\n  // 超逸材を分離', normalCardStart);
assert.ok(normalCardStart >= 0 && normalCardEnd > normalCardStart, '通常獲得カードが見つからない');
const normalCard = getPage.slice(normalCardStart, normalCardEnd);
assert.match(normalCard, /getUpperUrl\(f\.id\)/, '通常獲得カードがアッパー画像を使っていない');
assert.doesNotMatch(normalCard, /getPortraitUrl\(/, '通常獲得カードに顔アイコン画像が残っている');
assert.match(getPage, /class="b1-upper-img"/, 'アッパー画像用クラスが無い');
assert.match(getPage, /style="--b1-portrait-bg:\$\{draftCardBackground\(f\)\}"/,
  'カードへ選択した背景色を渡していない');

assert.match(css, /\.b1-portrait\{[^}]*background:var\(--b1-portrait-bg,[^}]*overflow:hidden[^}]*\}/,
  '通常カードの人物領域へ明色背景を適用していない');
assert.match(css, /\.b1-upper-img\{[^}]*object-fit:contain[^}]*object-position:center bottom[^}]*\}/,
  'アッパー画像を欠けずに下揃え表示していない');
assert.match(css, /\.b1-hero-img\{[^}]*background:var\(--b1-portrait-bg/,
  '超逸材カードへ明色背景を適用していない');

console.log('draft-get-card-visual-test: ok');
