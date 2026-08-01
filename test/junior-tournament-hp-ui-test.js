const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function bodyOf(signature) {
  const start = ui.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const parenEnd = ui.indexOf(') {', start);
  const brace = parenEnd >= 0 ? parenEnd + 2 : ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(brace + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

const focusBody = bodyOf('function _jtFocusCard');
assert.ok(focusBody.includes('_jtStartHp(f1, match.hpLeft)'), 'pre-match JT left HP must use match max HP and jtCarryHpPct');
assert.ok(focusBody.includes('_jtStartHp(f2, match.hpRight)'), 'pre-match JT right HP must use match max HP and jtCarryHpPct');
assert.ok(focusBody.includes("_jtcFcHpBlock('left', startL.final, startL.max, startL.pct)"), 'pre-match JT card must render the shared left start HP block');
assert.ok(focusBody.includes("_jtcFcHpBlock('right', startR.final, startR.max, startR.pct)"), 'pre-match JT card must render the shared right start HP block');

const focusCoreBody = bodyOf('function _jtcFcCore');
assert.ok(focusCoreBody.includes('jtc-fc-hp-row'), 'shared tournament focus card must render a start HP row under stand portraits');
assert.ok(focusCoreBody.includes('jtc-fc-statline') && focusCoreBody.includes('jtc-fc-ovr'),
  'JT pre-match card must present OVR as a dedicated fighter stat line');
assert.ok(focusCoreBody.includes('f.style') && focusCoreBody.includes('f.age'),
  'JT pre-match card must present style and age alongside OVR');

// mockup-baseline-v0.1 §4「縦の並び順(顔出しブロック)」は固定:
//   吹き出し → 選手画像 → 名前 → 役割ラベル → 団体バッジ → 数値(OVR等)
// 以前はここだけ名前ブロックが吹き出しより上にあり、_u3bSideHtml を使う他の顔出し画面と
// 逆になっていた(2026-08-01 Keisuke 指摘で是正)。JTと天頂戦が共有する部品なので、
// ここが戻ると2画面まとめて崩れる。
{
  const at = s => focusCoreBody.indexOf(s);
  const bubbleAt = at('if (extraHtml) h += extraHtml');
  const upperAt = at('jtc-fc-uppers');
  const nameAt = at('fighterInfo(f1');
  const hpAt = at('jtc-fc-hp-row');
  assert.ok(bubbleAt >= 0 && upperAt >= 0 && nameAt >= 0 && hpAt >= 0,
    '対戦カードの構成要素(吹き出し/画像/名前/HP)が揃っていない');
  assert.ok(bubbleAt < upperAt,
    '吹き出しが選手画像より下にある。baseline §4 は 吹き出し → 画像 の順で固定');
  assert.ok(upperAt < nameAt,
    '名前ブロックが選手画像より上にある。baseline §4 は 画像 → 名前 の順で固定');
  assert.ok(nameAt < hpAt, '名前ブロックがHP行より下にある');
  assert.ok(!focusCoreBody.includes('jtc-fc-names') && !focusCoreBody.includes('jtc-fc-vl'),
    '画像の上に名前を並べる旧レイアウト(.jtc-fc-names / .jtc-fc-vl)が復活している');
}
// 名前は「中央寄せの成り行き」ではなく各画像の真下に来る必要があるので、
// 左右の別がクラスで付いていること(CSSがグリッドの列を明示できる)
assert.ok(/jtc-fc-upper is-l/.test(focusCoreBody) && /jtc-fc-upper is-r/.test(focusCoreBody),
  '画像に左右クラスが無い。名前を画像の真下に置く列指定ができない');
assert.ok(/jtc-fc-nm is-\$\{side\}/.test(focusCoreBody),
  '名前ブロックに左右クラスが無い。名前を画像の真下に置く列指定ができない');
assert.ok(/\.jtc-fc-nm\.is-l\{grid-area:2\/1\}/.test(html) && /\.jtc-fc-nm\.is-r\{grid-area:2\/3\}/.test(html),
  'index CSS が名前ブロックを画像と同じ列の2行目に置いていない');

const resultBody = bodyOf('function renderJuniorTournamentMatchResult');
assert.ok(resultBody.includes("className: 'is-jt-recovery'"), 'JT match result HP mini bar must be marked for recovery animation');
assert.ok(resultBody.includes("_jtRecoveredHpTarget(match, 'left', isFinal)"), 'JT match result must compute left recovery target');
assert.ok(resultBody.includes("_jtRecoveredHpTarget(match, 'right', isFinal)"), 'JT match result must compute right recovery target');
assert.ok(resultBody.includes('setTimeout(_jtAnimateHpRecoveryBars'), 'JT match result must start recovery animation after rendering');

const hpMiniBody = bodyOf('function _pbHpMini');
assert.ok(hpMiniBody.includes('dataAttrs(lData)'), 'shared HP mini bar must allow per-side animation data attributes');
assert.ok(hpMiniBody.includes('opts.label'), 'shared HP mini bar must allow JT recovery labeling');

const animBody = bodyOf('function _jtAnimateHpRecoveryBars');
assert.ok(animBody.includes('data-jt-recover-pct'), 'JT recovery animation must target data-marked HP fills');
assert.ok(animBody.includes('requestAnimationFrame(tick)'), 'JT recovery animation must animate with requestAnimationFrame');

const impressionBody = bodyOf('function _showJTImpressionChain');
assert.ok(impressionBody.includes('getUpperUrl(f.id)'),
  'JT post-tournament comment must use a portrait that fits the shared tall upper frame');
assert.ok(impressionBody.includes("isLoser: timing === 'postLose'"),
  'JT defeat comment must visually mark the fighter as a loser');
assert.ok(impressionBody.includes("statLabel: 'OVR'"),
  'JT post-tournament comment must retain the fighter OVR');

assert.ok(html.includes('.jtc-fc-hp-row'), 'index CSS must style the shared tournament pre-match HP row');
assert.ok(html.includes('.jtc-fc-hp-fill'), 'index CSS must style shared tournament HP fills');
assert.ok(html.includes('.jtc-fc-statline'), 'index CSS must style the JT fighter stat line');
assert.ok(html.includes('.u3b-theme-stage.is-junior'), 'index CSS must give JT comment popups their tournament theme');

console.log('junior-tournament-hp-ui-test: ok');
