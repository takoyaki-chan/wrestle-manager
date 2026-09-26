'use strict';

// 試合前の「✨ 初対決」を、本当に初めて当たる2人のときだけ、観戦を選んだ試合の前に試合一覧の殻の上へ短く出す
// (2026-09-26 Keisuke 裁定「判定を直して出す」。specs/match-flavor-popup-spec-v0.1.md §4.2.1)
//
// 以前は2つ壊れていて、一度も出ていなかった:
//   ・判定が G.matchupLog の項目を e.left / e.right で見ていた(項目は leftId / rightId)ため、毎試合「初対決」と判定していた
//   ・フォーカスの時点で showEventPopup → _enqueuePopup を通していて、興行中ずっと active な試合一覧の殻(showResultOverlay)を
//     「開いている別の画面」と数えて殻の後ろの待ち行列に積まれていた(敗者の心と同じ。2026-09-26 に直した)
// 興行は前座からメインへ進み、フォーカスの時点で出すと「一度スキップしたら以降は出さない」規則でメインの初対決がまず出ない。
// 敗者の心(観戦した試合の後)と対にして、「🎬 試合を観る」を押した後・観戦の画面を開く前に出す(App._runFirstMeetBeforeWatch)。
//
// ここでは ui-common.js のポップアップの待ち行列まわりと app.js の試合前の流れを本物のまま取り出し、
// 小さな偽の DOM と偽の時計の上で動かして確かめる:
//   1. 判定: matchupLog(leftId/rightId・向きも文字列の id も)か対戦成績(h2h)に1試合でもあれば出さない。無ければ左右の2人
//   2. 観戦を押す → 殻の上に左→右の順に1.8秒ずつ(待ち行列に積まれない)・閉じてから観戦へ1回だけ進む
//   3. OK の早押し・二度押しと自動で閉じるタイマーが重なっても、次の1枚・観戦へは1回だけ
//   4. 初めてでない2人・同じ試合の2回目・タッグ・派閥の試合前の画面がある試合 → 出さずにすぐ観戦へ(再入しても止まらない)
//   5. 前の試合をスキップしていても、観戦を選んだ試合には出す(敗者の心と同じ)
//   6. 殻以外の画面が開いている → 待ち行列に積み、時限の保険で観戦へ1回だけ進む。取り下げた一言は後から出ない
//   7. フォーカスの時点(_runPreMatchFlavorForMatch)では出さない。F08 の試合前の画面はフォーカスの時点で従来どおり
//   8. watchMatch の中の位置: 選手不在の片付けの後・試合のシミュレーションの前

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

function makeEl(id) {
  const classes = new Set();
  const el = {
    id, className: '', style: {}, listeners: {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
    get offsetWidth() { return 1; },
    addEventListener(type, fn, opts) { (el.listeners[type] = el.listeners[type] || []).push({ fn, once: !!(opts && opts.once) }); },
    click() {
      const list = el.listeners.click || [];
      el.listeners.click = list.filter(l => !l.once);
      list.forEach(l => l.fn());
    },
    querySelector() { return null; },
  };
  return el;
}

const ROSTER = [
  { id: 1, name: '左の子', archetype: 'standard' },
  { id: 2, name: '右の子', archetype: 'standard' },
  { id: 3, name: '三人目', archetype: 'standard' },
];
const SAFETY = /firstMeet safety net fired/;

function build({ matchupLog = [], h2h = {}, match = { left: 1, right: 2 } } = {}) {
  const clock = { now: 0, seq: 0, timers: [] };
  const warns = [];
  const sides = [];
  const calls = { f08: 0, proceed: 0 };
  const elements = {};
  const el = id => (elements[id] = elements[id] || makeEl(id));
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
    querySelector: sel => {
      const m = /^#mdlCCard \.(.+)$/.exec(sel);
      if (m) return cardHtml.includes(m[1]) ? {} : null;
      return null;
    },
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
    _u3bSideHtml: o => { sides.push(o); return `<side name="${o.name}" line="${o.line}"></side>`; },
    getUpperUrl: id => `upper_${id}.webp`,
    Audio: { play() {} },
    showFighterPopup() {},
    pickDialogueLine: (pool, f) => `${f.name}です、はじめまして`,
    FIRST_MEET_LINES: { normal: { _default: ['はじめまして'] } },
    G: { season: 2, week: 14, roster: ROSTER.map(f => ({ ...f })), matchupLog, h2h },
    ALL_CHARS: [],
    Engine: {
      // 本物(relationships.js Engine.h2h.getRecord)と同じ引き方
      h2h: { getRecord: (state, a, b) => (state.h2h || {})[`${Math.min(a, b)}>${Math.max(a, b)}`] || null },
      factions: { getF08PreMatchData: () => ({ stub: true }) },
    },
    showFactionF08PreMatchModal: () => { calls.f08 += 1; },
  };
  const code = [
    'let _popupQueue = [];',
    'let _eventPopupQueue = [];',
    'let _autoCloseTimer = null;',
    'let _onEventPopupQueueEmpty = null;',
    constSource('_POPUP_OVERLAY_IDS'),
    ...['_isPopupActive', '_enqueuePopup', '_drainPopupQueue', '_mdlCOpen', '_mdlCClose', 'showEventPopup',
      '_renderEventPopupAsC3', 'closeEventPopup', '_consumeEventPopupQueueEmpty', '_chainEventPopupQueueEmpty'].map(n => fnSource(n)),
    fnSource('showMatchFlavorPopups', true), // 修正前のコードには無い
    fnSource('showPreMatchFlavorPopups', true),
    'var App = {',
    methodSource('_collectPreMatchPopupsForMatch') + ',',
    methodSource('_runPreMatchFlavorForMatch') + ',',
    methodSource('_runFirstMeetBeforeWatch') + ',',
    '};',
    'this.App = App;',
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
  // メイン(0)の下に前座(1)。興行は前座から進むので、メインは最後の試合
  ctx.App._showPreview = { validMatches: [match, { left: 3, right: 1 }], results: [null, { winner: 'left' }] };
  // 観戦を押した(watchMatch がここを呼ぶ)。proceed は観戦を始める代わりに数えるだけ
  const pressWatch = (idx = 0) => ctx.App._runFirstMeetBeforeWatch(idx, () => { calls.proceed += 1; });
  const shownName = () => (overlayActive('mdlCOverlay') && cardHtml.includes('pre-match-flavor') ? sides[sides.length - 1].name : null);
  return { ctx, advance, warns, sides, el, overlayActive, calls, shownName, pressWatch, card: () => cardHtml, okBtn: () => okBtn };
}

// ── 1. 判定 ──
{
  const collect = opts => build(opts).ctx.App._collectPreMatchPopupsForMatch(0);
  assert.strictEqual(collect({ matchupLog: [{ leftId: 1, rightId: 2, showCount: 3 }] }).length, 0,
    '自団体の興行で当たったことのある2人に「初対決」を出した(matchupLog を e.left/e.right で見ていないか)');
  assert.strictEqual(collect({ matchupLog: [{ leftId: 2, rightId: 1, showCount: 3 }] }).length, 0, '向きが逆の記録を見落とした');
  assert.strictEqual(collect({ matchupLog: [{ leftId: '1', rightId: '2', showCount: 0 }] }).length, 0, '文字列の id の記録を見落とした');
  assert.strictEqual(collect({ h2h: { '1>2': { matches: 2, winsA: 1, winsB: 1, draws: 0 } } }).length, 0,
    '他団体の興行・開始前の経歴で当たったことのある2人(対戦成績)に「初対決」を出した');
  const fresh = collect({ matchupLog: [{ leftId: 1, rightId: 3, showCount: 3 }], h2h: { '2>3': { matches: 1 } } });
  assert.strictEqual(fresh.length, 2, '本当に初めて当たる2人に「初対決」を出していない');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(fresh.map(p => [p.id, p.name, p.detail, p.autoCloseMs]))),
    [[1, '左の子', '✨ 初対決', 1800], [2, '右の子', '✨ 初対決', 1800]]);
  assert.ok(fresh.every(p => p.speech), '一言が無い');
  assert.strictEqual(collect({ match: { matchType: 'tag', teamA: { fighter1: 1, fighter2: 3 }, teamB: { fighter1: 2, fighter2: 3 } } }).length, 0, 'タッグに出した');
}

// ── 2. 観戦を押す → 殻の上に左→右の順に1.8秒ずつ・閉じてから観戦へ1回だけ ──
{
  const t = build();
  t.pressWatch(0);
  assert.ok(t.overlayActive('mdlCOverlay'), '「初対決」が試合一覧の殻の後ろに積まれて出ていない(殻の上に出す)');
  assert.strictEqual(t.ctx._queues().popup, 0, '「初対決」が汎用の待ち行列(_popupQueue)に積まれた');
  assert.strictEqual(t.ctx._queues().event, 0, '「初対決」が showEventPopup の列(_eventPopupQueue)に積まれた');
  assert.ok(t.card().includes('pre-match-flavor') && t.card().includes('✨ 初対決'), '初対決のカードではない');
  assert.strictEqual(t.shownName(), '左の子');
  assert.strictEqual(t.sides[t.sides.length - 1].line, '左の子です、はじめまして', '吹き出しに一言が入っていない');
  assert.ok(!t.sides[t.sides.length - 1].isLoser, '試合前の選手を減彩した');
  assert.strictEqual(t.calls.proceed, 0, '初対決が出ている間に観戦を始めた(重なる)');
  t.advance(1799);
  assert.strictEqual(t.shownName(), '左の子', '1.8秒より前に閉じた');
  t.advance(1);
  assert.ok(!t.overlayActive('mdlCOverlay'), '1.8秒で閉じていない');
  t.advance(200);
  assert.strictEqual(t.shownName(), '右の子', '2枚目(右の選手)が出ていない');
  assert.strictEqual(t.calls.proceed, 0, '2枚目が出ている間に観戦を始めた');
  t.advance(1800);
  assert.ok(!t.overlayActive('mdlCOverlay'), '2枚目が閉じていない');
  t.advance(200);
  assert.strictEqual(t.calls.proceed, 1, '初対決が閉じた後に観戦へ進んでいない');
  t.advance(10000);
  assert.strictEqual(t.calls.proceed, 1, `観戦へ ${t.calls.proceed} 回進んだ(1回のはず)`);
  assert.strictEqual(t.sides.length, 2, `カードを ${t.sides.length} 枚描いた(2枚のはず)`);
  assert.ok(!t.warns.some(w => SAFETY.test(w)), `保険のタイマーが発火した: ${t.warns.join(' / ')}`);
}

// ── 3. OK の早押し・二度押しと自動で閉じるタイマーが重なっても1回だけ ──
{
  const t = build();
  t.pressWatch(0);
  t.advance(1799);
  const btn1 = t.okBtn();
  btn1.click();
  btn1.click();
  t.advance(1); // 自動で閉じるタイマーの時刻
  t.advance(200);
  assert.strictEqual(t.shownName(), '右の子');
  t.okBtn().click();
  t.advance(200);
  assert.strictEqual(t.calls.proceed, 1, 'OK の早押しで観戦へ進んでいない');
  t.advance(10000);
  assert.strictEqual(t.sides.length, 2, `OK の早押しとタイマーで ${t.sides.length} 枚描いた(2枚のはず)`);
  assert.strictEqual(t.calls.proceed, 1, `観戦へ ${t.calls.proceed} 回進んだ(1回のはず)`);
}

// ── 4. 出さずにすぐ観戦へ: 初めてでない・同じ試合の2回目・タッグ・派閥の試合前の画面がある試合 ──
{
  const met = build({ matchupLog: [{ leftId: 1, rightId: 2, showCount: 1 }] });
  met.pressWatch(0);
  assert.strictEqual(met.calls.proceed, 1, '初めてでない2人ですぐ観戦へ進んでいない');
  assert.strictEqual(met.sides.length, 0);
  const again = build();
  again.pressWatch(0);
  again.advance(10000);
  again.pressWatch(0); // 同じ試合でもう一度(再入)
  assert.strictEqual(again.calls.proceed, 2, '同じ試合の2回目ですぐ進んでいない');
  assert.strictEqual(again.sides.length, 2, '同じ試合で2回出した');
  for (const [label, match] of [
    ['タッグ', { matchType: 'tag', teamA: { fighter1: 1, fighter2: 3 }, teamB: { fighter1: 2, fighter2: 3 } }],
    ['F08', { left: 1, right: 2, _f08Locked: true }],
    ['F09', { left: 1, right: 2, _f09Locked: true }],
    ['派閥内序列戦', { left: 1, right: 2, _internalChallengeLocked: true }],
  ]) {
    const t = build({ match });
    t.pressWatch(0);
    t.pressWatch(0); // 再入しても止まらない(無限の呼び返しにならない)
    t.advance(10000);
    assert.strictEqual(t.calls.proceed, 2, `${label}: すぐ観戦へ進んでいない`);
    assert.strictEqual(t.sides.length, 0, `${label}: 初対決を出した`);
  }
}

// ── 5. 前の試合をスキップしていても、観戦を選んだ試合には出す ──
{
  const t = build();
  t.ctx.App._showPreview._suppressFlavor = true; // 前座をスキップした興行(旧の印。2026-09-26 に廃止され、立っていても見ない)
  t.pressWatch(0);
  assert.strictEqual(t.shownName(), '左の子', '前座をスキップした興行でメインの初対決を出していない');
  t.advance(10000);
  assert.strictEqual(t.calls.proceed, 1);
}

// ── 6. 殻以外の画面が開いている → 待ち行列に積み、時限の保険で観戦へ1回だけ。取り下げた一言は後から出ない ──
{
  const t = build();
  t.el('fighterPopupOverlay').classList.add('active'); // 選手の詳細を開いていた
  t.pressWatch(0);
  assert.ok(!t.overlayActive('mdlCOverlay'), 'ほかの画面が開いているのに上に重ねて出した');
  assert.strictEqual(t.ctx._queues().popup, 1, 'ほかの画面が開いているのに待ち行列に積んでいない');
  t.advance(2 * 2200 + 1500 - 1);
  assert.strictEqual(t.calls.proceed, 0, '保険の時限より前に観戦へ進んだ');
  t.advance(1);
  assert.strictEqual(t.calls.proceed, 1, '保険のタイマーで観戦へ進んでいない');
  assert.strictEqual(t.warns.filter(w => SAFETY.test(w)).length, 1, '本当に止まったときの保険の警告が1回ではない');
  t.ctx.App._showPreview.results[0] = { winner: 'left' }; // 観戦が始まった(結果は押した時点で入る)
  t.el('fighterPopupOverlay').classList.remove('active');
  t.el('showResultOverlay').classList.remove('active');
  t.ctx._drainPopupQueue();
  t.advance(10000);
  assert.strictEqual(t.sides.length, 0, '取り下げた初対決が遅れて出た');
  assert.strictEqual(t.calls.proceed, 1, '観戦へ2回以上進んだ');
  assert.strictEqual(t.ctx._queues().popup, 0, '待ち行列に残った');
}

// ── 7. フォーカスの時点では出さない。F08 の試合前の画面はフォーカスの時点で従来どおり ──
{
  const t = build();
  t.ctx.App._runPreMatchFlavorForMatch(0);
  t.advance(10000);
  assert.strictEqual(t.sides.length, 0, 'フォーカスの時点(観るかスキップかを選ぶ前)に初対決を出した');
  assert.strictEqual(t.ctx._queues().popup + t.ctx._queues().event, 0, 'フォーカスの時点で初対決を待ち行列に積んだ');
  const f = build({ match: { left: 1, right: 2, _f08Locked: true } });
  f.ctx.App._runPreMatchFlavorForMatch(0);
  assert.strictEqual(f.calls.f08, 1, 'F08 の試合前の画面が出ていない');
}

// ── 8. watchMatch の中の位置 ──
{
  const watch = methodSource('watchMatch');
  const hook = watch.indexOf('App._runFirstMeetBeforeWatch(idx, () => App.watchMatch(idx))');
  assert.ok(hook > 0, 'watchMatch が観戦の前に初対決を通していない');
  assert.ok(watch.indexOf('if (!charL || !charR)') < hook, '選手不在の片付けより前に初対決を出している(不在の試合に出る)');
  assert.ok(hook < watch.indexOf('Engine.battle.simulateMatch'), '試合のシミュレーション(結果の確定)より後に初対決を出している');
  assert.ok(watch.indexOf("matchType === 'tag'") < hook, 'タッグの分岐より後ろでない');
}

console.log('pre-match-first-meet-over-show-shell-test: ok');
