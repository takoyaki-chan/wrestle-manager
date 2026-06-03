const assert = require('assert');
const fs = require('fs');
const path = require('path');

const uiSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function extractFunctionBody(name) {
  const startToken = `function ${name}() {`;
  const start = uiSource.indexOf(startToken);
  if (start < 0) throw new Error(`${name} block not found`);
  const bodyStart = start + startToken.length;
  let depth = 1;
  for (let i = bodyStart; i < uiSource.length; i++) {
    if (uiSource[i] === '{') depth++;
    else if (uiSource[i] === '}') depth--;
    if (depth === 0) return uiSource.slice(bodyStart, i);
  }
  throw new Error(`${name} block end not found`);
}

const closeBody = extractFunctionBody('_factionCloseCinematicOverlay');
const runClose = new Function('document', 'setTimeout', '_drainPopupQueue', closeBody);

function makeOverlay(name) {
  return {
    name,
    removed: [],
    classList: {
      remove(cls) { this.owner.removed.push(cls); },
      owner: null,
    },
  };
}

function makeRoot(initialOverlay) {
  const root = {
    children: initialOverlay ? [initialOverlay] : [],
    cleared: false,
    querySelector() { return this.children[0] || null; },
    contains(node) { return this.children.includes(node); },
  };
  Object.defineProperty(root, 'innerHTML', {
    get() { return this.children.length ? '<overlay>' : ''; },
    set(value) {
      this.cleared = value === '';
      if (value === '') this.children = [];
    },
  });
  return root;
}

(function testCloseDoesNotClearReplacementOverlay() {
  const oldOverlay = makeOverlay('old');
  oldOverlay.classList.owner = oldOverlay;
  const newOverlay = makeOverlay('new');
  newOverlay.classList.owner = newOverlay;
  const root = makeRoot(oldOverlay);
  let timer = null;
  let drained = 0;

  runClose(
    { getElementById(id) { return id === 'factionEventRoot' ? root : null; } },
    (fn) => { timer = fn; },
    () => { drained += 1; }
  );

  root.children = [newOverlay];
  timer();

  assert.deepStrictEqual(oldOverlay.removed, ['active']);
  assert.deepStrictEqual(root.children, [newOverlay]);
  assert.strictEqual(root.cleared, false);
  assert.strictEqual(drained, 1);
})();

(function testCloseClearsOriginalOverlayWhenStillMounted() {
  const oldOverlay = makeOverlay('old');
  oldOverlay.classList.owner = oldOverlay;
  const root = makeRoot(oldOverlay);
  let timer = null;

  runClose(
    { getElementById(id) { return id === 'factionEventRoot' ? root : null; } },
    (fn) => { timer = fn; },
    () => {}
  );

  timer();

  assert.deepStrictEqual(root.children, []);
  assert.strictEqual(root.cleared, true);
})();

console.log('faction-overlay-close-test: ok');
