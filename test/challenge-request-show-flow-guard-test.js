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

const build = new Function(
  '_isPopupActive',
  '_popupQueue',
  'setTimeout',
  `${functionSource('showChallengeRequestResultModal')}; return showChallengeRequestResultModal;`
);

const checkedOptions = [];
const popupQueue = [];
const scheduled = [];
const showChallengeRequestResultModal = build(
  (opts) => {
    checkedOptions.push(opts);
    // Simulate showResultOverlay being the only active overlay.
    return !(opts && opts.ignoreShowResultOverlay);
  },
  popupQueue,
  (fn) => scheduled.push(fn)
);

showChallengeRequestResultModal({}, {}, {}, () => {});

assert.deepStrictEqual(
  checkedOptions[0],
  { ignoreShowResultOverlay: true },
  'challenge result modal should ignore the active show-result shell'
);
assert.strictEqual(
  popupQueue.length,
  0,
  'challenge result modal must not wait behind the shell whose rendering depends on its close callback'
);
assert.strictEqual(scheduled.length, 1, 'challenge result modal should proceed to its deferred render');

console.log('challenge-request-show-flow-guard-test: ok');
