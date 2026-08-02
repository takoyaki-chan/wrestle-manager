'use strict';

// 2026-07-31 再発防止: PPVテレビ中継が「GRAND FINAL を準備中…」で止まった不具合。
// _chainEventPopupQueueEmpty は「登録するだけ」で、閉じるポップアップが1つも無いと
// closeEventPopup が呼ばれず、コールバックが永久に発火しなかった。
// (1) キューが空なら即実行 (2) initPPVTV 側に保険の時限、の2重で担保する。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const commonSource = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const appSource = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must be defined`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`could not extract ${name}`);
}

// ── (1) キューが空のとき、コールバックが実行されること ──
{
  const ctx = {
    _eventPopupQueue: [],
    _onEventPopupQueueEmpty: null,
    setTimeout: (fn) => { fn(); return 0; },
    console,
  };
  const code = extractFunction(commonSource, '_consumeEventPopupQueueEmpty')
    + '\n' + extractFunction(commonSource, '_chainEventPopupQueueEmpty')
    + '\n;this.__chain = _chainEventPopupQueueEmpty;';
  vm.runInNewContext(code, ctx);

  let fired = false;
  ctx.__chain(() => { fired = true; });
  assert.strictEqual(fired, true, 'キューが空なら即座にコールバックが走る(準備中で固まらない)');
}

// ── (2) キューに残りがあるときは、登録に留まること(従来の連結動作を壊さない) ──
{
  const ctx = {
    _eventPopupQueue: [{ dummy: true }],
    _onEventPopupQueueEmpty: null,
    setTimeout: (fn) => { fn(); return 0; },
    console,
  };
  const code = extractFunction(commonSource, '_consumeEventPopupQueueEmpty')
    + '\n' + extractFunction(commonSource, '_chainEventPopupQueueEmpty')
    + '\n;this.__chain = _chainEventPopupQueueEmpty; this.__peek = () => _onEventPopupQueueEmpty;';
  vm.runInNewContext(code, ctx);

  let fired = false;
  ctx.__chain(() => { fired = true; });
  assert.strictEqual(fired, false, 'ポップアップが残っているうちは待つ');
  assert.strictEqual(typeof ctx.__peek(), 'function', 'コールバックが登録されている');
}

// ── (3) initPPVTV に保険の時限があること ──
// Regression: an event can be enqueued during the 200ms empty-queue gap.
// In that case the later modal must wait until the event popup is closed.
{
  const timers = [];
  const ctx = {
    _eventPopupQueue: [],
    _onEventPopupQueueEmpty: null,
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    console,
  };
  const code = extractFunction(commonSource, '_consumeEventPopupQueueEmpty')
    + '\n' + extractFunction(commonSource, '_chainEventPopupQueueEmpty')
    + '\n;this.__chain = _chainEventPopupQueueEmpty;'
    + 'this.__push = value => _eventPopupQueue.push(value);'
    + 'this.__clear = () => { _eventPopupQueue.length = 0; };'
    + 'this.__consume = _consumeEventPopupQueueEmpty;';
  vm.runInNewContext(code, ctx);

  let fired = false;
  ctx.__chain(() => { fired = true; });
  assert.strictEqual(timers.length, 1, 'empty queue should reserve one transition timer');

  ctx.__push({ type: 'tvAppearance' });
  timers.shift()();
  assert.strictEqual(fired, false, 'a late event must keep the following modal waiting');

  ctx.__clear();
  const queuedCallback = ctx.__consume();
  assert.strictEqual(typeof queuedCallback, 'function', 'callback must be chained behind the late event');
  queuedCallback();
  assert.strictEqual(fired, true, 'following modal should open after the event queue empties');
}

// Regression: the next C3 event must also honor the shared overlay queue.
{
  const closeEventPopup = extractFunction(commonSource, 'closeEventPopup');
  assert.ok(
    /setTimeout\(\(\)\s*=>\s*_enqueuePopup\(\(\)\s*=>\s*_renderEventPopupAsC3\(\)\),\s*200\)/.test(closeEventPopup),
    'the next C3 event should re-enter the shared popup queue'
  );
}

{
  const start = appSource.indexOf('App.initPPVTV = function()');
  assert.ok(start >= 0, 'App.initPPVTV must exist');
  const body = appSource.slice(start, start + 4000);
  assert.ok(/ppvTV safety net/.test(body), 'PPV中継の起動に保険の時限がある');
  assert.ok(/_ppvTvStarted/.test(body), '二重起動を防ぐフラグがある');
}

console.log('ppv-tv-start-test: ok');
