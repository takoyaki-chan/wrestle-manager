'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const battleJs = fs.readFileSync(path.join(root, 'src', 'battle-engine-main.js'), 'utf8');
const battleHtml = fs.readFileSync(path.join(root, 'src', 'battle-engine.html'), 'utf8');
const baseline = fs.readFileSync(path.join(root, 'docs', 'ui', 'mockup-baseline-v0.1.md'), 'utf8');

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

assert.ok(baseline.includes('セリフの吹き出しは白（クリーム）に黒文字。例外なし'), '基準文書から吹き出し色の原則が消えている');
assert.ok(baseline.includes('キャラ画像の上'), '基準文書から縦順の原則が消えている');

// 旧A型の絶対配置・名前入り吹き出しは描画側にもCSS側にも戻さない。
assert.ok(!ui.includes('mdl-a-speech-pending'), '旧A型の絶対配置待機枠が残っている');
assert.ok(!ui.includes('mdl-a-speech-speaker'), '旧A型の吹き出し内話者名が残っている');
assert.ok(!html.includes('.mdl-a-speech {'), '旧A型のabsolute吹き出しCSSが残っている');
assert.ok(!html.includes('.mdl-a-speech-speaker'), '旧A型の話者名CSSが残っている');

const subject = fnSource(ui, '_mdlASubjectStage');
assert.ok(subject.indexOf('u3b-bubble-slot') < subject.indexOf('mdl-a-subject-portrait-wrap'), 'A型人物段が予約枠→画像の順ではない');
assert.ok(subject.includes('escHtml(speech)'), 'A型人物段のセリフが未エスケープ');

for (const name of ['_mdlAReporterStrip', '_inviteCoachReporterStrip', '_factionReporterStrip']) {
  const src = fnSource(ui, name);
  assert.ok(src.includes('_u3bSideHtml'), `${name} が共通人物ブロックを使っていない`);
  assert.ok(!/reporter-(?:line|name|portrait)/.test(src), `${name} に横長の旧記者帯が残っている`);
}

for (const name of ['_renderGlimpseA', '_renderGlimpseB']) {
  const src = fnSource(ui, name);
  assert.ok(src.includes('_renderGlimpseCardHtml'), `${name} が複数件版の共通人物カードを使っていない`);
  assert.ok(!src.includes('notif-modal-dialogue'), `${name} に画像下の暗いセリフ欄が残っている`);
}

const notif = fnSource(ui, 'showNotifEventToast');
assert.ok(notif.includes("if (event.dialogue && f1Id != null)"), '人物セリフ通知の分岐が無い');
assert.ok(notif.includes('_u3bSideHtml'), '人物セリフ通知が共通人物ブロックを使っていない');
assert.ok(!notif.includes('mdl-d-body italic'), '人物セリフ通知に画像下の暗い欄が残っている');

const ending = fnSource(ui, 'showEndingCeremony');
const gameover = fnSource(ui, 'showGameOverCeremony');
assert.ok(ending.indexOf('_awSpeechSlot(line)') < ending.indexOf('_endingPortrait(f.id'), '年度末セリフが画像より下にある');
assert.ok(gameover.indexOf('_awSpeechSlot(line)') < gameover.indexOf('_gameoverPortrait(f.id'), '解散セリフが画像より下にある');
assert.ok(!gameover.includes('background:rgba(40,16,16'), '暗背景専用の暗い人物セリフ枠が残っている');

const negotiation = fnSource(ui, '_negSpeakerHtml');
assert.ok(negotiation.includes('_u3bSideHtml'), '契約交渉の話者が共通人物ブロックを使っていない');
assert.ok(!negotiation.includes('<strong'), '契約交渉の吹き出し内に名前が残っている');

const f07 = fnSource(ui, 'showFactionF07Modal');
assert.ok(f07.indexOf('fevt-leader-bubble-slot') < f07.indexOf('fevt-subject-portrait-wrap'), 'F07が予約枠→画像の順ではない');
assert.ok(!f07.includes('fevt-leader-bubble-speaker'), 'F07の吹き出し内に名前が残っている');

const tcDrama = fnSource(ui, '_tcDramaActor');
assert.ok(!tcDrama.includes('class="sp"'), '天頂戦ドラマの吹き出し内に名前が残っている');

const rivalry = fnSource(ui, '_rivalryBubblePairHtml');
assert.ok((rivalry.match(/jt-bub-slot/g) || []).length >= 2, 'JT/秋大会の左右予約枠が揃っていない');
assert.ok(!rivalry.includes('class="sp '), 'JT/秋大会の吹き出し内に名前が残っている');
assert.ok(!ui.includes('ppvprog-dlsp'), 'PPV試合前の吹き出し内に名前が残っている');

const dojoBubble = render.indexOf('dojo-scene-bubble-slot');
const dojoAvatar = render.indexOf('dojo-scene-coach-avatar', dojoBubble);
const dojoName = render.indexOf('dojo-scene-coach-name', dojoAvatar);
assert.ok(dojoBubble >= 0 && dojoBubble < dojoAvatar && dojoAvatar < dojoName, '道場コーチが吹き出し→画像→名前の順ではない');

const panel = fnSource(battleJs, '_panelHtml');
assert.ok(panel.indexOf('battle-speech-slot') < panel.indexOf('portrait-area'), '試合中セリフが画像より上の予約枠にない');
assert.ok(!/\.speech-bubble\{position:absolute/.test(battleHtml), '試合中セリフが画像上へabsolute配置されている');
assert.ok(!/\.speech-bubble\.t-(?:def|counter)\{[^}]*color:#fff/.test(battleHtml), '試合中セリフの状態別白文字が戻っている');
assert.ok(battleJs.indexOf('vic-speech-slot') < battleJs.indexOf('winner-portrait'), '勝利セリフが勝者画像より上にない');

console.log('dialogue-layout-global-test: ok');
