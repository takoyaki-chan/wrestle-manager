'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

function fnSource(src, name) {
  const start = src.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const brace = src.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

const render = fnSource(ui, '_renderEventPopupAsC3');
assert.ok(render.includes("line: o.speech || ''"), '人物の発話が speech から吹き出しへ渡されていない');
assert.ok(!/line:\s*o\.message/.test(render), 'message が人物の吹き出しへ混入している');
assert.ok(render.includes('class="event-popup-prose"'), '非発話本文の専用表示が無い');
assert.ok(render.includes('escHtml(o.message)'), '非発話本文がエスケープされていない');
assert.ok(render.includes('reserveBubble: !!o.speech'), '非発話だけの人物通知で空の吹き出し枠を消していない');

const choice = fnSource(ui, '_showEventPopupAsChoice');
assert.ok(choice.includes("speech: opts.speech || ''"), '選択型ポップアップが speech を発話として扱っていない');
assert.ok(!/speech:\s*opts\.message/.test(choice), '選択型ポップアップで message が吹き出しへ混入している');
assert.ok(choice.includes('escHtml(opts.message)'), '選択型ポップアップの非発話本文がエスケープされていない');

const side = fnSource(ui, '_u3bSideHtml');
assert.ok(side.includes('o.reserveBubble !== false'), '発話の無い単独人物から予約枠を除けない');
assert.ok(html.includes('.event-popup-prose{'), '非発話本文が既存モーダルの組版を持っていない');

// 雑誌・TV見出しはスクリーンショットで発覚した代表例。人物付きでも地の文のままにする。
const headlineCalls = app.match(/message:\s*ev\.headline/g) || [];
assert.ok(headlineCalls.length >= 2, '雑誌・TV見出しが message として保持されていない');
assert.ok(!/speech:\s*ev\.headline/.test(app), '雑誌・TV見出しが人物の発話に分類されている');

// 辞書から選ぶ明示的な本人・コーチの台詞は speech に分類する。
for (const marker of [
  "speech: getTraitQuote('release'",
  "speech: getTraitQuote('injury'",
  "speech: pickCoachVoiceQuote('coachHire'",
  "speech: pickCoachVoiceQuote('coachFire'",
  'speech: winnerLine',
  'speech: dialogue',
]) {
  assert.ok(app.includes(marker), `${marker} が speech に分類されていない`);
}
assert.ok(!/message:\s*(?:getTraitQuote|pickCoachVoiceQuote|winnerLine|dialogue)\b/.test(app), '明示的な人物台詞が message に残っている');

// Glimpse の関係ラベルは説明であり、台詞が無ければ吹き出しを出さない。
const glimpse = fnSource(ui, '_renderGlimpseCardHtml');
assert.ok(glimpse.includes("const dialogue = g.dialogue || ''"), 'Glimpse が dialogue 以外を発話にしている');
assert.ok(!/dialogue\s*=.*g\.label/.test(glimpse), 'Glimpse の説明ラベルが吹き出しへ混入している');
assert.ok(glimpse.includes('reserveBubble: !!dialogue'), 'Glimpse の非発話表示で空の吹き出し枠を消していない');

console.log('event-popup-speech-semantics-test: ok');
