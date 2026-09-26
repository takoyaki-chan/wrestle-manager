'use strict';

// 試合後の「敗者の心」が興行中の試合一覧の殻(showResultOverlay)の上に出て、1.8秒で閉じて次へ1回だけ進む(2026-09-26 Keisuke 裁定「出す」)
//
// 観戦した試合の結果画面を閉じると、負けた選手の一言を小さなポップアップで1.8秒だけ出す(specs/match-flavor-popup-spec-v0.1.md §4.6)。
// 以前は showEventPopup → _enqueuePopup を通していて、興行中ずっと active な試合一覧の殻を「開いている別の画面」と数えて
// 殻の後ろの待ち行列に積まれ、一度も出ないまま _runPostMatchFlavorForMatch の保険のタイマー(N×2.2秒+1.5秒)が
// 毎試合発火していた([WM] postMatchFlavor safety net fired。点火 *-watch で発見)。
//
// ここでは ui-common.js のポップアップの待ち行列まわりと app.js の試合後の流れを本物のまま取り出し、
// 小さな偽の DOM と偽の時計の上で動かして確かめる:
//   1. 殻だけが開いている → すぐ出る(待ち行列に積まれない)・中身は敗者の一言(減彩)・1.8秒で閉じ・次へ1回だけ・警告なし
//   2. 殻の後ろで止まったままの試合前の一言(初対決)が汎用の列の先頭にいても、敗者の心は出る
//   3. OK の早押しと自動で閉じるタイマーが重なっても次へ1回だけ(1操作=1進行)
//   4. 殻以外の画面が本当に開いている → 保険が1回だけ発火して先へ進み、取り下げた一言は後から出ない
//   5. タッグ・引き分けは出さない(すぐ次へ)

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function balancedFrom(src, start) {
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('終端が見つからない');
}
function fnSource(name, optional) {
  const start = ui.indexOf(`\nfunction ${name}(`);
  if (start < 0) {
    if (optional) return '';
    throw new Error(`${name} が ui-common.js に無い`);
  }
  return balancedFrom(ui, start + 1);
}
function methodSource(name) {
  const start = app.indexOf(`\n  ${name}(`);
  assert.ok(start >= 0, `App.${name} が app.js に無い`);
  return balancedFrom(app, start + 1);
}
function constSource(name) {
  const start = ui.indexOf(`const ${name} = [`);
  assert.ok(start >= 0, `${name} が無い`);
  return ui.slice(start, ui.indexOf('];', start) + 2);
}

// ── 偽の DOM ──
function makeEl(id) {
  const classes = new Set();
  const el = {
    id, className: '', style: {}, listeners: {},
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
    },
    get offsetWidth() { return 1; },
    addEventListener(type, fn, opts) {
      (el.listeners[type] = el.listeners[type] || []).push({ fn, once: !!(opts && opts.once) });
    },
    click() {
      const list = el.listeners.click || [];
      el.listeners.click = list.filter(l => !l.once);
      list.forEach(l => l.fn());
    },
    querySelector() { return null; },
  };
  return el;
}

function build() {
  const clock = { now: 0, seq: 0, timers: [] };
  const warns = [];
  const sides = [];
  const elements = {};
  const el = id => (elements[id] = elements[id] || makeEl(id));
  // mdl-c のカード: 中身を差し替えるたびに OK ボタンを作り直す
  let cardHtml = '';
  let okBtn = null;
  const card = el('mdlCCard');
  Object.defineProperty(card, 'innerHTML', {
    get: () => cardHtml,
    set: v => {
      cardHtml = String(v);
      okBtn = cardHtml.includes('id="postMatchFlavorOkBtn"') ? makeEl('postMatchFlavorOkBtn') : null;
    },
  });
  const document = {
    getElementById: id => (id === 'postMatchFlavorOkBtn' ? okBtn : el(id)),
    querySelector: sel => (sel === '#mdlCCard .post-match-flavor'
      ? (cardHtml.includes('post-match-flavor') ? {} : null)
      : null),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const ctx = {
    document,
    console: { warn: (...a) => warns.push(a.join(' ')), error: (...a) => warns.push('ERROR ' + a.join(' ')), log() {} },
    setTimeout: (fn, ms) => { const id = ++clock.seq; clock.timers.push({ id, at: clock.now + (ms || 0), fn }); return id; },
    clearTimeout: id => { clock.timers = clock.timers.filter(t => t.id !== id); },
    WM_I18N: { t: s => s, pn: s => s },
    escHtml: s => String(s),
    _u3bSideHtml: o => { sides.push(o); return `<side line="${o.line}"></side>`; },
    getUpperUrl: id => `upper_${id}.webp`,
    Audio: { play() {} },
    showFighterPopup() {},
    pickDialogueLine: pool => pool[0],
    POST_MATCH_FLAVOR_LINES: { loser: ['……次は、こうはいかない'] },
    G: { roster: [{ id: 1, name: '勝った子' }, { id: 2, name: '負けた子' }, { id: 3, name: '三人目' }] },
    ALL_CHARS: [],
  };
  const code = [
    'let _popupQueue = [];',
    'let _eventPopupQueue = [];',
    'let _autoCloseTimer = null;',
    'let _onEventPopupQueueEmpty = null;',
    constSource('_POPUP_OVERLAY_IDS'),
    ...['_isPopupActive', '_enqueuePopup', '_drainPopupQueue', '_mdlCOpen', '_mdlCClose', 'showEventPopup',
      '_renderEventPopupAsC3', 'closeEventPopup', '_consumeEventPopupQueueEmpty', '_chainEventPopupQueueEmpty'].map(n => fnSource(n)),
    fnSource('showPostMatchFlavorPopups', true), // 修正前のコードには無い(そのときは showEventPopup の経路で動く)
    'var App = {',
    methodSource('_collectPostMatchPopupsForMatch') + ',',
    methodSource('_runPostMatchFlavorForMatch') + ',',
    '};',
    'this.App = App;',
    'this.showEventPopup = showEventPopup;',
    'this._drainPopupQueue = _drainPopupQueue;',
    'this._queues = () => ({ popup: _popupQueue.length, event: _eventPopupQueue.length });',
  ].join('\n');
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const advance = ms => {
    const end = clock.now + ms;
    for (;;) {
      clock.timers.sort((a, b) => a.at - b.at || a.id - b.id);
      const next = clock.timers[0];
      if (!next || next.at > end) break;
      clock.timers.shift();
      clock.now = next.at;
      next.fn();
    }
    clock.now = end;
  };
  const overlayActive = id => el(id).classList.contains('active');
  el('showResultOverlay').classList.add('active'); // 興行中ずっと出ている試合一覧の殻
  ctx.App._showPreview = { validMatches: [{ left: 1, right: 2 }], results: [{ winner: 'left' }] };
  return { ctx, advance, warns, sides, el, overlayActive, card: () => cardHtml, okBtn: () => okBtn };
}

const SAFETY = /postMatchFlavor safety net fired/;

// ── 1. 殻だけが開いている → すぐ出て、1.8秒で閉じ、次へ1回だけ ──
{
  const t = build();
  let then = 0;
  t.ctx.App._runPostMatchFlavorForMatch(0, { winner: 'left' }, () => { then += 1; });
  t.advance(0);
  assert.ok(t.overlayActive('mdlCOverlay'), '敗者の心が試合一覧の殻の後ろに積まれて出ていない(殻の上に出す)');
  assert.strictEqual(t.ctx._queues().popup, 0, '敗者の心が汎用の待ち行列(_popupQueue)に積まれた');
  assert.ok(t.card().includes('— 敗者の心 —'), '「— 敗者の心 —」の見出しが無い');
  const side = t.sides[t.sides.length - 1];
  assert.strictEqual(side.line, '……次は、こうはいかない', '吹き出しに敗者の一言が入っていない');
  assert.strictEqual(side.name, '負けた子', '負けた選手ではなく勝った選手を出している');
  assert.strictEqual(side.isLoser, true, '敗者の画像を減彩していない(is-loser)');
  t.advance(1799);
  assert.ok(t.overlayActive('mdlCOverlay'), '1.8秒より前に閉じた');
  assert.strictEqual(then, 0, '敗者の心が出ている間に次へ進んだ(次の試合の一覧と重なる)');
  t.advance(1);
  assert.ok(!t.overlayActive('mdlCOverlay'), '1.8秒で閉じていない');
  t.advance(200);
  assert.strictEqual(then, 1, '閉じた後に次へ進んでいない');
  t.advance(10000);
  assert.strictEqual(then, 1, '次へ2回以上進んだ');
  assert.ok(!t.warns.some(w => SAFETY.test(w)), `保険のタイマーが発火した: ${t.warns.join(' / ')}`);
}

// ── 2. 殻の後ろで止まった試合前の一言(初対決)が汎用の列にいても、敗者の心は出る ──
{
  const t = build();
  t.ctx.showEventPopup({ type: 'fighter', id: 1, name: '勝った子', speech: 'はじめまして', detail: '✨ 初対決', autoCloseMs: 1800 });
  t.ctx.showEventPopup({ type: 'fighter', id: 2, name: '負けた子', speech: 'よろしく', detail: '✨ 初対決', autoCloseMs: 1800 });
  t.advance(0);
  assert.ok(!t.overlayActive('mdlCOverlay'), '前提: 試合前の一言は殻の後ろで止まっている');
  let then = 0;
  t.ctx.App._runPostMatchFlavorForMatch(0, { winner: 'right' }, () => { then += 1; });
  t.advance(0);
  assert.ok(t.overlayActive('mdlCOverlay') && t.card().includes('— 敗者の心 —'), '汎用の列の先頭に止まった項目があると敗者の心が出ない');
  assert.strictEqual(t.sides[t.sides.length - 1].name, '勝った子', '右が勝った試合で左の選手(敗者)を出していない');
  t.advance(2000);
  assert.strictEqual(then, 1, '次へ進んでいない');
  assert.ok(!t.card().includes('初対決') || !t.overlayActive('mdlCOverlay'), '止まっていた試合前の一言が興行中に出た');
  assert.ok(!t.warns.some(w => SAFETY.test(w)), '保険のタイマーが発火した');
}

// ── 3. OK の早押しと自動で閉じるタイマーが重なっても次へ1回だけ ──
{
  const t = build();
  let then = 0;
  t.ctx.App._runPostMatchFlavorForMatch(0, { winner: 'left' }, () => { then += 1; });
  t.advance(500);
  const btn = t.okBtn();
  assert.ok(btn, 'OK ボタンが無い');
  btn.click();
  btn.click(); // 二度押し
  assert.ok(!t.overlayActive('mdlCOverlay'), 'OK で閉じない');
  t.advance(10000);
  assert.strictEqual(then, 1, `OK の早押しと自動で閉じるタイマーで次へ ${then} 回進んだ(1回のはず)`);
  assert.ok(!t.warns.some(w => SAFETY.test(w)), '保険のタイマーが発火した');
}

// ── 4. 殻以外の画面が本当に開いている → 保険が1回だけ発火して先へ進み、取り下げた一言は後から出ない ──
if (fnSource('showPostMatchFlavorPopups', true)) {
  const t = build();
  t.el('fighterPopupOverlay').classList.add('active');
  let then = 0;
  t.ctx.App._runPostMatchFlavorForMatch(0, { winner: 'left' }, () => { then += 1; });
  t.advance(0);
  assert.ok(!t.overlayActive('mdlCOverlay'), 'ほかの画面が開いているのに上に重ねて出した');
  assert.strictEqual(t.ctx._queues().popup, 1, 'ほかの画面が開いているのに待ち行列に積んでいない');
  t.advance(3699);
  assert.strictEqual(then, 0, '保険の時限より前に進んだ');
  t.advance(1);
  assert.strictEqual(then, 1, '保険のタイマーで先へ進んでいない');
  assert.strictEqual(t.warns.filter(w => SAFETY.test(w)).length, 1, '本当に止まったときの保険の警告が1回ではない');
  // 画面も殻も閉じた後に待ち行列が流れても、取り下げた一言は出ない
  t.el('fighterPopupOverlay').classList.remove('active');
  t.el('showResultOverlay').classList.remove('active');
  t.ctx._drainPopupQueue();
  t.advance(1000);
  assert.ok(!t.overlayActive('mdlCOverlay'), '取り下げた敗者の心が遅れて出た');
  assert.strictEqual(then, 1, '次へ2回以上進んだ');
}

// ── 5. タッグ・引き分けは出さない ──
for (const [label, result, match] of [
  ['引き分け', { winner: 'draw' }, { left: 1, right: 2 }],
  ['タッグ', { winner: 'left', matchType: 'tag' }, { matchType: 'tag', teamA: { fighter1: 1, fighter2: 3 }, teamB: { fighter1: 2, fighter2: 3 } }],
]) {
  const t = build();
  t.ctx.App._showPreview = { validMatches: [match], results: [result] };
  let then = 0;
  t.ctx.App._runPostMatchFlavorForMatch(0, result, () => { then += 1; });
  assert.strictEqual(then, 1, `${label}ですぐ次へ進んでいない`);
  t.advance(10000);
  assert.ok(!t.overlayActive('mdlCOverlay'), `${label}で敗者の心を出した`);
  assert.strictEqual(then, 1, `${label}で次へ2回以上進んだ`);
}

console.log('post-match-flavor-over-show-shell-test: ok');
