'use strict';

// 契約交渉の話者は、吹き出し・上半身画像・名前/役割を合わせると通常の横長壁より
// 高い。絶対配置で上へ逃がすとHUDに隠れるため、専用壁を通常フローで確保する。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const render = read('src/ui-render.js');
const ui = read('src/ui-common.js');
const css = read('src/index.html');

const renderStart = render.indexOf('function renderShachoshitsuNegotiation(');
const renderEnd = render.indexOf('\nfunction renderShachoshitsuReleaseInterview(', renderStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart, 'renderShachoshitsuNegotiation が見つからない');
const renderFn = render.slice(renderStart, renderEnd);

assert.ok(renderFn.includes('const wallHasSpeaker = /class="negc-speaker\\b/.test(wallInnerHtml || \'\');'),
  '話者がいる契約交渉だけを判定していない');
assert.ok(renderFn.includes("${wallHasSpeaker ? ' negotiation-wall-dialogue' : ''}"),
  '話者がいる壁へ専用クラスを付けていない');

const wallRule = (css.match(/\.shachoshitsu-wall\.negotiation-wall-dialogue\{[^}]*\}/) || [])[0];
assert.ok(wallRule, '契約交渉の話者用壁ルールが無い');
assert.ok(/aspect-ratio:auto/.test(wallRule), '通常壁の横長aspect-ratioを解除していない');
assert.ok(/min-height:380px/.test(wallRule), '長い吹き出し・194px画像・名前と上余白が収まる高さを確保していない');
assert.ok(/display:flex/.test(wallRule) && /align-items:flex-end/.test(wallRule),
  '話者を壁内の通常フローで下揃えしていない');
assert.ok(/padding:28px 0 18px/.test(wallRule), '吹き出し上側の余白を確保していない');

const speakerRule = (css.match(/\.negc-speaker\{[^}]*\}/) || [])[0];
assert.ok(speakerRule, '.negc-speaker のルールが無い');
assert.ok(/position:relative/.test(speakerRule), '話者が通常フローにいない');
assert.ok(!/position:absolute/.test(speakerRule), '話者を絶対配置すると再び上端が切れる');

const bubbleSlotRule = (css.match(/\.negc-speaker \.u3b-bubble-slot\{[^}]*\}/) || [])[0];
const bubbleTextRule = (css.match(/\.negc-speaker \.u3b-bubble-text\{[^}]*\}/) || [])[0];
assert.ok(bubbleSlotRule && /height:auto/.test(bubbleSlotRule) && /min-height:52px/.test(bubbleSlotRule),
  '契約台詞の吹き出し枠が内容に応じて伸びない');
assert.ok(bubbleTextRule && /display:block/.test(bubbleTextRule) && /overflow:visible/.test(bubbleTextRule)
  && /-webkit-line-clamp:unset/.test(bubbleTextRule),
  '契約台詞に共通の2行省略が残っている');

const speakerStart = ui.indexOf('function _negSpeakerHtml(');
const speakerEnd = ui.indexOf('\nfunction showContractSummaryModal(', speakerStart);
assert.ok(speakerStart >= 0 && speakerEnd > speakerStart, '_negSpeakerHtml が見つからない');
const speakerFn = ui.slice(speakerStart, speakerEnd);
assert.ok(speakerFn.includes("size: 'm'"), '現行の上半身画像サイズを変更している');
assert.ok(speakerFn.includes('u3b-theme-dark'), '現行のOffice/Dark配色ルールを外している');
assert.ok(speakerFn.includes('getUpperUrl(neg.fighterId)'), '現行の上半身画像を使っていない');

console.log('contract-negotiation-layout-test: ok');
