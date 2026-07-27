'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractObjectMethodBody(signature) {
  const token = `${signature} {`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`${signature} not found`);
  const bodyStart = start + token.length;
  let depth = 1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(bodyStart, i);
  }
  throw new Error(`${signature} end not found`);
}

(function testLoadedTenchosenBeatsStalePpvPhase() {
  const body = extractObjectMethodBody('resumeLoadedSpecialPhase()');
  const run = new Function('App', 'G', body);
  const calls = [];
  const App = {
    _shouldStartTenchosenReplay: () => true,
    initTenchosenReplay: () => calls.push('tenchosen'),
    initPPVShow: () => calls.push('ppv'),
    initPPVTV: () => calls.push('ppvTV'),
  };

  const handled = run(App, { weekPhase: 'ppvShow' });

  assert.strictEqual(handled, true);
  assert.deepStrictEqual(calls, ['tenchosen'],
    'a loaded completed Tenchosen must never open the GRAND FINAL card intro');
})();

(function testAutomaticRoutesGuardBeforePpv() {
  const ppvNeedle = "if (G.weekPhase === 'ppvShow')";
  const tenchosenNeedle = 'if (App._shouldStartTenchosenReplay?.())';
  const ppvPositions = [];
  let cursor = 0;
  while ((cursor = source.indexOf(ppvNeedle, cursor)) >= 0) {
    ppvPositions.push(cursor++);
  }
  assert.ok(ppvPositions.length >= 3);
  ppvPositions.slice(0, 3).forEach(pos => {
    const tenchosenPos = source.lastIndexOf(tenchosenNeedle, pos);
    assert.ok(tenchosenPos >= 0 && pos - tenchosenPos < 1200,
      'Tenchosen guard must precede every automatic PPV launch branch');
  });
})();

console.log('tenchosen-ppv-opening-guard-test: ok');
