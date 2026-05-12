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
assert.ok(focusBody.includes('jt-pre-hp-row'), 'pre-match JT card must render a start HP row under stand portraits');
assert.ok(focusBody.includes("_jtPreHpBlock('left', f1, match.hpLeft)"), 'pre-match JT left HP must use match max HP and jtCarryHpPct');
assert.ok(focusBody.includes("_jtPreHpBlock('right', f2, match.hpRight)"), 'pre-match JT right HP must use match max HP and jtCarryHpPct');

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

assert.ok(html.includes('.jt-pre-hp-row'), 'index CSS must style JT pre-match HP row');
assert.ok(html.includes('.jt-pre-hp-fill.is-danger'), 'index CSS must style low JT HP state');

console.log('junior-tournament-hp-ui-test: ok');
