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

// 実物の closest() は Element を返すので getAttribute を持つ。699a860 で
// _handlePatternBResultClose が onclick 属性を読むようになったため、スタブも実物に合わせる
// (PPV結果のボタンだけは専用ハンドラに任せるための判定。ここは通常の興行結果ボタン=onclick無し)
function resultButtonEvent(onclickAttr) {
  const calls = { prevented: 0, stopped: 0 };
  return {
    calls,
    event: {
      target: {
        closest: () => ({
          className: 'pb-close-btn',
          getAttribute: (name) => (name === 'onclick' ? (onclickAttr || null) : null),
        }),
      },
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

(function testPpvResultButtonKeepsItsOwnCloser() {
  // 699a860: PPV結果のボタンは inline onclick(closePPVResult)とこの委譲の両方に届き、
  // 委譲側が先にW48をtickすることで「幻の1週」が年1回余分に処理されていた。
  let closed = 0;
  const handler = buildHandler({ _jtPreview: null, _tcPreview: null }, () => { closed += 1; });
  const { event, calls } = resultButtonEvent('closePPVResult()');

  handler(event);

  assert.strictEqual(closed, 0, 'PPV結果のボタンには委譲しない(専用の closePPVResult に任せる)');
  assert.deepStrictEqual(calls, { prevented: 0, stopped: 0 }, 'インラインonclickを止めてはいけない');
})();

console.log('tenchosen-result-flow-guard-test: ok');
