'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'flight-recorder.js'), 'utf8');
const MAX_STORAGE_BYTES = 150 * 1024;

function createStorage(initial = {}, quota = Infinity) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  const setCalls = [];
  const removeCalls = [];
  return {
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      const text = String(value);
      const next = new Map(values);
      next.set(String(key), text);
      const bytes = Array.from(next.values()).reduce((sum, item) => sum + Buffer.byteLength(item, 'utf8'), 0);
      if (bytes > quota) {
        const error = new Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      }
      setCalls.push([String(key), text]);
      values.set(String(key), text);
    },
    removeItem(key) {
      removeCalls.push(String(key));
      values.delete(String(key));
    },
    setCalls,
    removeCalls,
    values,
  };
}

function makeElement(tagName) {
  const listeners = Object.create(null);
  const element = {
    tagName: String(tagName).toUpperCase(),
    id: '',
    type: '',
    title: '',
    textContent: '',
    value: '',
    hidden: false,
    className: '',
    classList: [],
    style: {},
    attributes: {},
    children: [],
    parentNode: null,
    clicked: false,
    selected: false,
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      child.parentNode = null;
      return child;
    },
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    click() {
      this.clicked = true;
      for (const handler of listeners.click || []) handler({ target: this });
    },
    select() { this.selected = true; },
    _listeners: listeners,
  };
  return element;
}

function createEnvironment({ storage = createStorage(), initial = null } = {}) {
  if (initial) storage = createStorage(initial);
  const documentListeners = Object.create(null);
  const windowListeners = Object.create(null);
  const timers = new Map();
  const created = [];
  const anchors = [];
  const consoleCalls = { error: [], warn: [] };
  let createElementCalls = 0;
  let timerId = 0;
  let execCommandCalls = 0;
  const body = makeElement('body');
  const head = makeElement('head');
  const documentElement = makeElement('html');
  const document = {
    body,
    head,
    documentElement,
    createElement(tag) {
      createElementCalls += 1;
      const element = makeElement(tag);
      created.push(element);
      if (String(tag).toLowerCase() === 'a') anchors.push(element);
      return element;
    },
    addEventListener(type, handler, options) {
      (documentListeners[type] ||= []).push({ handler, options });
    },
    execCommand(command) {
      execCommandCalls += 1;
      return command === 'copy';
    },
  };
  const fakeURL = {
    created: [],
    revoked: [],
    createObjectURL(blob) {
      this.created.push(blob);
      return 'blob:wm-test';
    },
    revokeObjectURL(url) { this.revoked.push(url); },
  };
  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  }
  const consoleObject = {
    error(...args) { consoleCalls.error.push(args); },
    warn(...args) { consoleCalls.warn.push(args); },
  };
  const window = {
    document,
    localStorage: storage,
    console: consoleObject,
    navigator: { userAgent: 'WM Guard Test' },
    innerWidth: 1280,
    innerHeight: 720,
    URL: fakeURL,
    onerror: null,
    confirm() { return true; },
    getComputedStyle(element) {
      return {
        display: element.style.display || 'block',
        visibility: element.style.visibility || 'visible',
        opacity: element.style.opacity == null ? '1' : String(element.style.opacity),
      };
    },
    addEventListener(type, handler) {
      (windowListeners[type] ||= []).push(handler);
    },
    setTimeout(handler) {
      timerId += 1;
      timers.set(timerId, handler);
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); },
  };
  window.window = window;
  const safeMath = Object.create(Math);
  safeMath.random = function () { throw new Error('Math.random must not be called'); };
  const context = {
    window,
    document,
    localStorage: storage,
    console: consoleObject,
    Blob: FakeBlob,
    Math: safeMath,
  };
  vm.runInNewContext(source, context, { filename: 'flight-recorder.js' });
  return {
    window,
    document,
    storage,
    body,
    head,
    created,
    anchors,
    consoleCalls,
    documentListeners,
    windowListeners,
    timers,
    fakeURL,
    get createElementCalls() { return createElementCalls; },
    get execCommandCalls() { return execCommandCalls; },
    dispatchDocument(type, event) {
      for (const item of documentListeners[type] || []) item.handler(event);
    },
    dispatchWindow(type, event) {
      for (const handler of windowListeners[type] || []) handler(event);
    },
    bundle() { return window.__wmFlightRecorder.exportBundle(); },
  };
}

function findById(root, id) {
  if (root.id === id) return root;
  for (const child of root.children || []) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

function findButtons(root) {
  const result = [];
  if (root.tagName === 'BUTTON') result.push(root);
  for (const child of root.children || []) result.push(...findButtons(child));
  return result;
}

// エラーゼロでは、境界記録とフック設置だけを行いDOMを一切生成しない。
{
  const env = createEnvironment();
  assert.strictEqual(env.createElementCalls, 0, 'zero-error startup must not create DOM nodes');
  assert.deepStrictEqual(Array.from(env.bundle().actions[0] && Object.keys(env.bundle().actions[0])), ['t', 'kind', 'session']);
  assert.strictEqual(env.createElementCalls, 0, 'zero-error export must not create DOM nodes');
  assert.ok(env.storage.setCalls.every(([key]) => key === 'wm_flight'), 'recorder must only write its own key');
}

// window.onerror は false を返し、30件リングを維持し、同一連続エラーを集約する。
{
  const env = createEnvironment();
  for (let index = 0; index < 35; index += 1) {
    const returned = env.window.onerror(`E${index}`, `file:///tmp/data-${index}.js?cache=1`, index, 2, new Error(`E${index}`));
    assert.strictEqual(returned, false);
  }
  let errors = env.bundle().errors;
  assert.strictEqual(errors.length, 30);
  assert.strictEqual(errors[0].msg, 'E5');
  assert.strictEqual(errors[0].src, 'data-5.js');
  assert.deepStrictEqual(Array.from(Object.keys(errors[0])), ['t', 'type', 'msg', 'src', 'line', 'col', 'stack', 'count']);

  env.window.onerror('REPEAT', 'app.js', 1, 1, new Error('REPEAT'));
  env.window.onerror('REPEAT', 'app.js', 1, 1, new Error('REPEAT'));
  env.window.onerror('REPEAT', 'app.js', 1, 1, new Error('REPEAT'));
  errors = env.bundle().errors;
  assert.strictEqual(errors[errors.length - 1].msg, 'REPEAT');
  assert.strictEqual(errors[errors.length - 1].count, 3);

  assert.ok(env.createElementCalls > 0, 'first error must create the badge lazily');
  const badge = findById(env.body, 'wmFlightBadge');
  assert.ok(badge);
  assert.strictEqual(badge.title, '不具合の記録');
  badge.click();
  const panel = findById(env.body, 'wmFlightPanel');
  assert.ok(panel && panel.hidden === false);
  assert.strictEqual(findById(panel, 'wmFlightHeading').textContent, '不具合の記録');
  assert.strictEqual(panel.children[1].textContent, '直前のプレイで不具合が記録されました。「記録をコピー」または「ファイルで保存」で書き出して、報告に添えてください。ゲームはそのまま続けられます。');
  assert.deepStrictEqual(findButtons(panel).map(button => button.textContent), ['記録をコピー', 'ファイルで保存', '記録を消去', '閉じる']);
}

// consoleの原関数を必ず先に呼び、warnはWM前置のものだけを記録する。
{
  const env = createEnvironment();
  env.window.console.error('boom', 7);
  assert.deepStrictEqual(env.consoleCalls.error[0], ['boom', 7]);
  assert.strictEqual(env.bundle().errors[0].msg, 'boom 7');

  env.window.console.warn('ordinary warning');
  env.window.console.warn('[WM Debug] invalid state');
  env.window.console.warn('[WM] autosave failed');
  assert.strictEqual(env.consoleCalls.warn.length, 3);
  assert.deepStrictEqual(Array.from(env.bundle().errors, item => item.msg), [
    'boom 7',
    '[WM Debug] invalid state',
    '[WM] autosave failed',
  ]);
}

// 未処理Promise拒否もエラーリングへ合流する。
{
  const env = createEnvironment();
  const reason = new Error('promise failed');
  env.dispatchWindow('unhandledrejection', { reason });
  const error = env.bundle().errors[0];
  assert.strictEqual(error.type, 'unhandledrejection');
  assert.strictEqual(error.msg, 'Error: promise failed');
}

// クリックはcapture-phaseの読み取り専用で、pagehide前は保存せず、境界を跨いで残る。
{
  const storage = createStorage();
  const first = createEnvironment({ storage });
  const clickListener = first.documentListeners.click[0];
  assert.strictEqual(clickListener.options, true, 'click listener must use capture phase');
  const target = makeElement('button');
  target.id = 'advance';
  target.classList = ['one', 'two', 'three', 'four'];
  target.textContent = '  1234567890123456789012345678901234567890EXTRA  ';
  first.dispatchDocument('click', {
    target,
    preventDefault() { throw new Error('must not prevent default'); },
    stopPropagation() { throw new Error('must not stop propagation'); },
  });
  let stored = JSON.parse(storage.getItem('wm_flight'));
  assert.strictEqual(stored.actions.filter(item => item.kind === 'click').length, 0, 'click write must be throttled');
  first.dispatchWindow('pagehide', {});
  stored = JSON.parse(storage.getItem('wm_flight'));
  const click = stored.actions.find(item => item.kind === 'click');
  assert.ok(click);
  assert.deepStrictEqual(click.cls, ['one', 'two', 'three']);
  assert.strictEqual(click.text.length, 40);

  const second = createEnvironment({ storage });
  const actions = second.bundle().actions;
  assert.strictEqual(actions.filter(item => item.kind === 'boundary').length, 2);
  assert.ok(actions.some(item => item.kind === 'click' && item.id === 'advance'));
}

// 150KBを超える既存記録は古い操作から破棄し、QuotaExceededでも読み込みを止めない。
{
  const huge = 'x'.repeat(1800);
  const actions = Array.from({ length: 100 }, (_, index) => ({
    t: index,
    kind: 'click',
    tag: 'button',
    id: huge,
    cls: [huge, huge, huge],
    text: 'old action',
  }));
  const initial = JSON.stringify({ v: 1, session: 4, errors: [], actions });
  const storage = createStorage({ wm_flight: initial });
  createEnvironment({ storage });
  const raw = storage.getItem('wm_flight');
  const trimmed = JSON.parse(raw);
  assert.ok(Buffer.byteLength(raw, 'utf8') <= MAX_STORAGE_BYTES);
  assert.ok(trimmed.actions.length < 100, 'oversized history must discard entries');
  assert.ok(!trimmed.actions.some(item => item.kind === 'click' && item.t === 0), 'oldest action must be discarded first');

  const quotaStorage = createStorage({ wm_flight: initial }, 1000);
  assert.doesNotThrow(() => createEnvironment({ storage: quotaStorage }));
  assert.ok(Buffer.byteLength(quotaStorage.getItem('wm_flight'), 'utf8') <= 1000);
}

// エクスポートの固定キー、autosave本文、手動スロットはサイズのみ、context復元を検査する。
{
  const autosave = JSON.stringify({ season: 7, week: 23, roster: ['AUTOSAVE_BODY'] });
  const storage = createStorage({
    wrestle_manager_save_1: 'SECRET_SLOT_BODY',
    wrestle_manager_autosave: autosave,
  });
  const env = createEnvironment({ storage });
  const visible = makeElement('div');
  visible.id = 'contractModal';
  visible.classList = ['modal', 'active'];
  env.body.appendChild(visible);
  const hidden = makeElement('div');
  hidden.id = 'hiddenModal';
  hidden.style.display = 'none';
  env.body.appendChild(hidden);
  const bundle = env.bundle();
  assert.deepStrictEqual(Array.from(Object.keys(bundle)), [
    'v', 'exportedAt', 'userAgent', 'viewport', 'errors', 'actions', 'openLayers', 'saves', 'context',
  ]);
  assert.deepStrictEqual(Array.from(Object.keys(bundle.saves)), ['slots', 'autosave']);
  assert.deepStrictEqual(Array.from(Object.keys(bundle.saves.slots[0])), ['key', 'bytes']);
  assert.strictEqual(bundle.saves.slots[0].key, 'wrestle_manager_save_1');
  assert.strictEqual(bundle.saves.autosave, autosave);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(bundle.context)), { season: 7, week: 23 });
  assert.deepStrictEqual(Array.from(bundle.openLayers), ['div#contractModal.modal.active']);
  assert.ok(!JSON.stringify(bundle).includes('SECRET_SLOT_BODY'));
  assert.ok(env.storage.setCalls.every(([key]) => key === 'wm_flight'));
}

// LZStringはレコーダーより後に読み込まれても、書き出し時にautosaveの文脈を復元する。
{
  const storage = createStorage({ wrestle_manager_autosave: 'WM_LZ|encoded' });
  const env = createEnvironment({ storage });
  env.window.LZString = {
    decompressFromUTF16(value) {
      assert.strictEqual(value, 'encoded');
      return JSON.stringify({ season: 9, week: 41 });
    },
  };
  assert.deepStrictEqual(JSON.parse(JSON.stringify(env.bundle().context)), { season: 9, week: 41 });
}

// パネルのコピーfallback・Blob保存・消去は、確定文言と自キーだけで動作する。
{
  const storage = createStorage({ wrestle_manager_save_1: 'keep-me' });
  const env = createEnvironment({ storage });
  env.window.onerror('UI_TEST', 'ui.js', 1, 1, new Error('UI_TEST'));
  findById(env.body, 'wmFlightBadge').click();
  const panel = findById(env.body, 'wmFlightPanel');
  const buttons = findButtons(panel);
  buttons[0].click();
  assert.strictEqual(env.execCommandCalls, 1);
  assert.strictEqual(findById(panel, 'wmFlightStatus').textContent, 'コピーしました');

  buttons[1].click();
  assert.strictEqual(env.fakeURL.created.length, 1);
  assert.ok(env.anchors.some(anchor => /^wm_bugreport_\d{4}-\d{2}-\d{2}\.json$/.test(anchor.download)));

  buttons[2].click();
  assert.strictEqual(storage.getItem('wm_flight'), null);
  assert.strictEqual(storage.getItem('wrestle_manager_save_1'), 'keep-me');
  assert.deepStrictEqual(storage.removeCalls, ['wm_flight']);
}

console.log('flight-recorder-guard-test: OK');
