const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(start, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

function buildHandler(App, closeShowResult) {
  return new Function(
    'App',
    'closeShowResult',
    `${functionSource('_handlePatternBResultClose')}; return _handlePatternBResultClose;`
  )(App, closeShowResult);
}

function resultButtonEvent() {
  const calls = { prevented: 0, stopped: 0 };
  return {
    calls,
    event: {
      target: { closest: () => ({ className: 'pb-close-btn' }) },
      preventDefault() { calls.prevented += 1; },
      stopPropagation() { calls.stopped += 1; },
    },
  };
}

(function testTenchosenOwnNextMatchHandlerIsNotClosedByShowResultDelegate() {
  let closed = 0;
  const handler = buildHandler({ _jtPreview: null, _tcPreview: { phase: 'matchResult' } }, () => { closed += 1; });
  const { event, calls } = resultButtonEvent();

  handler(event);

  assert.strictEqual(closed, 0, 'the generic show-result closer must not end the Tenchosen flow');
  assert.deepStrictEqual(calls, { prevented: 0, stopped: 0 }, 'the Tenchosen inline next-match handler must retain control');
})();

(function testOrdinaryShowResultStillUsesGenericCloser() {
  let closed = 0;
  const handler = buildHandler({ _jtPreview: null, _tcPreview: null }, () => { closed += 1; });
  const { event, calls } = resultButtonEvent();

  handler(event);

  assert.strictEqual(closed, 1, 'ordinary show results must still close normally');
  assert.deepStrictEqual(calls, { prevented: 1, stopped: 1 });
})();

console.log('tenchosen-result-flow-guard-test: ok');
