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

class ClassList {
  constructor() { this.values = new Set(); }
  add(v) { this.values.add(v); }
  remove(v) { this.values.delete(v); }
  contains(v) { return this.values.has(v); }
}

class Element {
  constructor(id = '') {
    this.id = id;
    this.children = [];
    this.classList = new ClassList();
    this.listeners = {};
    this._html = '';
  }

  set innerHTML(value) {
    this._html = value;
    this.children = [];
    if (value.includes('id="fevtF03Overlay"')) {
      const overlay = new Element('fevtF03Overlay');
      overlay.classList.add('fevt-overlay-stage');
      overlay.classList.add('sepia');
      overlay.classList.add('f03-dissolution');
      const button = new Element('fevtF03Continue');
      button.tagName = 'BUTTON';
      overlay.children.push(button);
      this.children.push(overlay);
    }
  }

  get innerHTML() { return this._html; }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  contains(target) {
    return this._all().includes(target);
  }

  querySelector(selector) {
    const all = this._all();
    if (selector === '.fevt-overlay-stage, .fevt-overlay-office, .fevt-overlay-arena, .fevt-narration-act') {
      return all.find(el => el.classList.contains('fevt-overlay-stage')) || null;
    }
    if (selector === '.fevt-overlay-stage') return all.find(el => el.classList.contains('fevt-overlay-stage')) || null;
    if (selector === '#fevtF03Continue') return all.find(el => el.id === 'fevtF03Continue') || null;
    return null;
  }

  addEventListener(type, fn) { this.listeners[type] = fn; }
  click() { if (this.listeners.click) this.listeners.click(); }

  _all() {
    return [this, ...this.children.flatMap(child => child._all())];
  }
}

const rootById = new Map();
const body = new Element('body');
const documentStub = {
  body,
  createElement(tag) {
    const el = new Element();
    el.tagName = tag.toUpperCase();
    return el;
  },
  getElementById(id) {
    if (id === 'factionEventRoot') return rootById.get(id) || null;
    return body._all().find(el => el.id === id) || null;
  },
};

body.appendChild = function(child) {
  Element.prototype.appendChild.call(this, child);
  if (child.id) rootById.set(child.id, child);
  return child;
};

const build = new Function(
  'document',
  'Audio',
  '_isPopupActive',
  '_popupQueue',
  '_drainPopupQueue',
  'setTimeout',
  [
    functionSource('_factionUpperUrl'),
    functionSource('_factionEnsureOverlayRoot'),
    functionSource('_factionCloseCinematicOverlay'),
    functionSource('showFactionF03Modal'),
    'return { showFactionF03Modal };',
  ].join('\n')
);

let drained = 0;
const { showFactionF03Modal } = build(
  documentStub,
  { play() {} },
  () => false,
  [],
  () => { drained++; },
  fn => fn()
);

let continued = 0;
showFactionF03Modal(null, { roster: [], week: 25 }, () => { continued++; });

const root = documentStub.getElementById('factionEventRoot');
assert.ok(root, 'F03 modal should create factionEventRoot');
assert.ok(root.innerHTML.includes('f03-dissolution'), 'F03 modal should use scroll-safe class');

const button = root.querySelector('#fevtF03Continue');
assert.ok(button, 'F03 modal should render a continue button');
button.click();

assert.strictEqual(continued, 1, 'F03 continue button should call onContinue');
assert.strictEqual(root.innerHTML, '', 'F03 close should clear cinematic root');
assert.strictEqual(drained, 1, 'F03 close should drain queued popups after clearing');

console.log('faction-f03-modal-flow-test: ok');
