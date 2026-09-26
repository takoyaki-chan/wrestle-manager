'use strict';

// 因縁の宣戦布告を、フォーカスした試合の前に試合一覧の殻の上へ出し、閉じてから派閥の試合前の画面へ進む
// (2026-09-26 Keisuke 裁定「出す」。specs/match-flavor-popup-spec-v0.1.md §4.2.2)
//
// 以前は renderMatchPreview のフォーカスの 400ms 後に showRivalryPopups → _enqueuePopup を殻の例外なしで通していて、
// 興行中ずっと active な試合一覧の殻(showResultOverlay)を「開いている別の画面」と数えて殻の後ろの待ち行列に積まれ、
// 興行中に一度も出ていなかった(表示済みの記録 _rivalryPopupSeen だけが付いた)。その完了を待つ派閥の試合前の画面
// (派閥内序列戦・F09)も、宣戦布告がある試合では出ていなかった。
//
// ここでは ui-common.js のポップアップの待ち行列まわり・宣戦布告の描画と、renderMatchPreview のフォーカスの口(本物の
// ソースを切り出す)、app.js の試合前の流れを本物のまま取り出し、小さな偽の DOM と偽の時計の上で動かして確かめる:
//   1. 殻だけが開いている → フォーカスの 400ms 後に殻の上に出る(待ち行列に積まれない)・派閥の試合前の画面は
//      「見届ける」を押すまで出ない → 押すと 200ms 後に1回だけ出る(重ならない)
//   2. 「見届ける」の二度押しでも派閥の試合前の画面は1回だけ。宣戦布告の無い試合はすぐ派閥の試合前の画面へ
//   3. 表示済みの記録(宿怨のクールダウン)は実際に出たときに付く
//   4. 殻以外の画面が開いている → 積んで待ち、その画面が閉じたら 0.5秒以内に殻の上に出る(保険は発火しない)
//   5. 殻以外の画面が開いたまま → 10秒で保険が1回だけ発火して先へ進み、取り下げた宣戦布告は後から出ない
//   6. 出る前にその試合が始まった → 出さずに先へ(派閥の試合前の画面も出さない)
//   7. 宣戦布告が出ている間の描き直し(同じ試合) → 重ねて出さない・派閥の試合前の画面を先に出さない
//   8. 興行の後の決着の画面(opts なし)は従来どおり殻が閉じるのを待つ
//   9. 前座をスキップしても、メインの派閥の試合前の画面(派閥内序列戦・F08・F09)と宣戦布告は出る(節目。2026-09-26 裁定)。
//      スキップした試合の敗者の心は従来どおり省略(App.skipMatch を本物のまま通す)

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
function fnSource(name) {
  const start = ui.indexOf(`\nfunction ${name}(`);
  assert.ok(start >= 0, `${name} が ui-common.js に無い`);
  return balancedFrom(ui, start + 1);
}
function methodSource(name, optional) {
  const start = app.indexOf(`\n  ${name}(`);
  if (start < 0 && optional) return '';
  assert.ok(start >= 0, `App.${name} が app.js に無い`);
  return balancedFrom(app, start + 1);
}
function constSource(name) {
  const start = ui.indexOf(`const ${name} = [`);
  assert.ok(start >= 0, `${name} が無い`);
  return ui.slice(start, ui.indexOf('];', start) + 2);
}
// renderMatchPreview の末尾、次の試合にフォーカスしたときの口(本物のソース)
function focusHookSource() {
  const fn = fnSource('renderMatchPreview');
  const start = fn.indexOf('\n  if (nextIdx >= 0) {');
  assert.ok(start >= 0, 'renderMatchPreview にフォーカスの口が無い');
  return balancedFrom(fn, start + 1);
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
    scrollIntoView() {},
  };
  return el;
}

const ROSTER = [
  { id: 1, name: '左の子', archetype: 'standard' },
  { id: 2, name: '右の子', archetype: 'standard' },
  { id: 3, name: '三人目', archetype: 'standard' },
];
const SAFETY = /confrontation safety net fired/;

function build({ conf = { phase: 'confrontation', leftId: 1, rightId: 2, leftName: '左の子', rightName: '右の子', rivalry: 55 },
  match = { left: 1, right: 2, _internalChallengeLocked: true }, unplayed = false } = {}) {
  const clock = { now: 0, seq: 0, timers: [] };
  const warns = [];
  const calls = { faction: [], f08: 0 };
  const elements = {};
  const el = id => (elements[id] = elements[id] || makeEl(id));
  let boxHtml = '';
  let closeBtn = null;
  let renders = 0;
  const box = el('notifModalBox');
  Object.defineProperty(box, 'innerHTML', {
    get: () => boxHtml,
    set: v => {
      boxHtml = String(v);
      renders += 1;
      closeBtn = boxHtml.includes('id="mdlBRivalryClose"') ? makeEl('mdlBRivalryClose') : null;
    },
  });
  const document = {
    getElementById: id => {
      if (id === 'mdlBRivalryClose') return closeBtn;
      if (id === 'factionEventRoot') return null;
      return el(id);
    },
    querySelector: () => null,
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
    _u3bSideHtml: o => `<side name="${o.name}" line="${o.line}"></side>`,
    getUpperUrl: id => `upper_${id}.webp`,
    findFighter: id => ROSTER.find(f => f.id === id) || null,
    Audio: { play() {} },
    pickDialogueLine: (pool, f) => `${f ? f.name : '?'}の一言`,
    RIVALRY_CONFRONTATION_LINES: { attacker: ['a'], defender: ['d'], fateAttacker: ['fa'], fateDefender: ['fd'] },
    RIVALRY_CONFRONTATION_LINES_70: { attacker: ['a'], defender: ['d'] },
    RIVALRY_CONFRONTATION_LINES_90: { attacker: ['a'], defender: ['d'] },
    BITTER_PREMATCH_LINES: { ahead: {}, behind: {} },
    RIVALRY_POPUP_CONFIG: { normalMinRivalry: 60, maxNormalPerShow: 1, normalPairCooldownWeeks: 8, bitterPairCooldownWeeks: 16 },
    ALL_CHARS: ROSTER,
    G: { season: 2, week: 14, roster: ROSTER.map(f => ({ ...f })) },
    Engine: {
      util: { ov: () => 60, absWeek: (s, w) => s * 52 + w },
      factions: {
        getInternalChallengePreData: () => ({ stub: 'internal' }),
        getF08PreMatchData: () => ({ stub: 'f08' }),
      },
    },
    showInternalChallengePreModal: () => {
      calls.faction.push({ at: clock.now, rivalryOpen: el('notifModalOverlay').classList.contains('active') });
    },
    showFactionF08PreMatchModal: () => { calls.f08 += 1; },
  };
  const confMethod = methodSource('_runConfrontationForMatch', true); // 修正前のコードには無い
  const code = [
    'let _popupQueue = [];',
    'let _rivalryPopupQueue = [];',
    'let _rivalryPopupCallback = null;',
    constSource('_POPUP_OVERLAY_IDS'),
    ...['_isPopupActive', '_enqueuePopup', '_drainPopupQueue', 'showRivalryPopups', '_rivalryCol', '_renderRivalryPopup',
      'closeRivalryPopup', '_rivalryPopupPairKey', '_getRivalryPopupSeen', '_markRivalryMatchDialoguesSeen'].map(fnSource),
    `function focusHook(sp, nextIdx, box) {\n${focusHookSource()}\n}`,
    'var App = {',
    methodSource('_runPreMatchFlavorForMatch') + ',',
    confMethod ? confMethod + ',' : '',
    methodSource('skipMatch') + ',',
    methodSource('_fillMissingShowPreviewResults') + ',',
    '};',
    'this.App = App;',
    'this.focusHook = focusHook;',
    'this.showRivalryPopups = showRivalryPopups;',
    'this._drainPopupQueue = _drainPopupQueue;',
    'this._queues = () => ({ popup: _popupQueue.length });',
  ].join('\n');
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  // スキップ(App.skipMatch)を本物のまま通すための周り。試合の中身と結果の画面は数えるだけ
  Object.assign(ctx.Engine, {
    rng: { create: () => ({}), derive: () => 1 },
    battle: { simulateMatch: () => ({ winner: 'left', mq: 50 }) },
  });
  Object.assign(ctx.App, {
    _normalShowMatchTier: () => 1,
    _normalShowRingInOpts: () => ({}),
    _afterMatchSettle: (idx, opts) => { calls.settled.push({ idx, skipFlavor: !!(opts && opts.skipFlavor) }); },
    _buildF09OpeningData: () => ({ stub: 'f09-opening' }),
    _buildF09MatchPreData: () => ({ stub: 'f09-pre' }),
  });
  calls.settled = [];
  calls.f09 = [];
  ctx.showFactionF09OpeningModal = (data, state, onContinue) => { calls.f09.push('opening'); onContinue(); };
  ctx.showFactionF09MatchPreModal = () => { calls.f09.push('pre'); };
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
  // メイン(0)の下に前座(1)。前座は済んでいて、次はメイン(unplayed: true なら前座もまだ)
  const sp = {
    validMatches: [match, { left: 3, right: 1 }],
    results: [null, unplayed ? null : { winner: 'left' }],
    confrontationMap: conf ? { 0: { ...conf, idx: 0 } } : {},
    _shownConfrontations: new Set(),
  };
  ctx.App._showPreview = sp;
  const focus = (idx = 0) => ctx.focusHook(sp, idx, { querySelector: () => null });
  const rivalryShown = () => overlayActive('notifModalOverlay') && boxHtml.includes('mdlBRivalryClose');
  const pressWitness = () => { assert.ok(closeBtn, '「見届ける」のボタンが無い'); closeBtn.click(); };
  return { ctx, sp, advance, warns, el, overlayActive, calls, focus, rivalryShown, pressWitness,
    box: () => boxHtml, renders: () => renders };
}

// ── 1. 殻の上に出る → 見届けてから派閥の試合前の画面へ1回だけ ──
{
  const t = build();
  t.focus(0);
  t.advance(399);
  assert.ok(!t.rivalryShown(), 'フォーカスの 400ms より前に出た');
  t.advance(1);
  assert.ok(t.rivalryShown(), '宣戦布告が試合一覧の殻の後ろに積まれて出ていない(殻の上に出す)');
  assert.strictEqual(t.ctx._queues().popup, 0, '宣戦布告が汎用の待ち行列(_popupQueue)に積まれた');
  assert.ok(t.box().includes('宿 敵 対 決') && t.box().includes('左の子') && t.box().includes('右の子'), '宣戦布告の中身ではない');
  t.advance(5000);
  assert.ok(t.rivalryShown(), '宣戦布告が本人の操作を待たずに閉じた');
  assert.strictEqual(t.calls.faction.length, 0, '宣戦布告が出ている間に派閥の試合前の画面を出した(重なる)');
  t.pressWitness();
  assert.ok(!t.overlayActive('notifModalOverlay'), '「見届ける」で閉じていない');
  t.advance(199);
  assert.strictEqual(t.calls.faction.length, 0, '閉じる間(200ms)を待たずに次の画面を出した');
  t.advance(1);
  assert.strictEqual(t.calls.faction.length, 1, '宣戦布告を閉じた後に派閥の試合前の画面へ進んでいない');
  assert.strictEqual(t.calls.faction[0].rivalryOpen, false, '宣戦布告の上に派閥の試合前の画面を重ねた');
  t.advance(20000);
  assert.strictEqual(t.calls.faction.length, 1, `派閥の試合前の画面を ${t.calls.faction.length} 回出した(1回のはず)`);
  assert.strictEqual(t.renders(), 1, `宣戦布告を ${t.renders()} 回描いた(1回のはず)`);
  assert.ok(!t.warns.some(w => SAFETY.test(w)), `保険のタイマーが発火した: ${t.warns.join(' / ')}`);
}

// ── 2. 二度押しでも1回だけ・宣戦布告の無い試合はすぐ派閥の試合前の画面へ ──
{
  const t = build();
  t.focus(0);
  t.advance(460);
  t.pressWitness();
  t.pressWitness();
  t.advance(20000);
  assert.strictEqual(t.calls.faction.length, 1, `「見届ける」の二度押しで派閥の試合前の画面を ${t.calls.faction.length} 回出した`);
  const plain = build({ conf: null });
  plain.focus(0);
  plain.advance(400);
  assert.strictEqual(plain.calls.faction.length, 1, '宣戦布告の無い試合で派閥の試合前の画面へすぐ進んでいない');
  assert.strictEqual(plain.renders(), 0);
  plain.advance(20000);
  assert.strictEqual(plain.calls.faction.length, 1);
  // F08 の直接対決(宣戦布告の対象外)も従来どおりフォーカスの時点で出る
  const f08 = build({ conf: null, match: { left: 1, right: 2, _f08Locked: true } });
  f08.focus(0);
  f08.advance(400);
  assert.strictEqual(f08.calls.f08, 1, 'F08 の試合前の画面が出ていない');
}

// ── 3. 表示済みの記録(宿怨のクールダウン)は実際に出たときに付く ──
{
  const bitter = { phase: 'confrontation', leftId: 1, rightId: 2, leftName: '左の子', rightName: '右の子', rivalry: 35,
    isBitter: true, leftSide: 'ahead', rightSide: 'behind', _rivalryPopupPairKey: 'bitter:1-2' };
  const t = build({ conf: bitter });
  t.focus(0);
  t.advance(400);
  assert.ok(t.rivalryShown() && t.box().includes('遺 恨 再 燃'), '宿怨の再燃が出ていない');
  assert.strictEqual(t.ctx.G._rivalryPopupSeen['bitter:1-2'], 2 * 52 + 14, '表示済みの記録が付いていない');
  // 出られない間は記録しない(積まれたまま捨てられた分でクールダウンが始まらない)
  const blocked = build({ conf: bitter });
  blocked.el('fighterPopupOverlay').classList.add('active');
  blocked.focus(0);
  blocked.advance(400);
  assert.ok(!blocked.rivalryShown());
  assert.ok(!(blocked.ctx.G._rivalryPopupSeen && blocked.ctx.G._rivalryPopupSeen['bitter:1-2']),
    'まだ出ていない宿怨の再燃に表示済みの記録を付けた');
}

// ── 4. 殻以外の画面が開いている → 積んで待ち、閉じたら 0.5秒以内に出る ──
{
  const t = build();
  t.el('fighterPopupOverlay').classList.add('active'); // 選手の詳細を開いていた
  t.focus(0);
  t.advance(400);
  assert.ok(!t.rivalryShown(), 'ほかの画面が開いているのに上に重ねて出した');
  t.advance(3000);
  assert.ok(!t.rivalryShown());
  assert.strictEqual(t.calls.faction.length, 0, '宣戦布告を待たずに派閥の試合前の画面を出した');
  t.el('fighterPopupOverlay').classList.remove('active');
  t.advance(500);
  assert.ok(t.rivalryShown(), 'ほかの画面が閉じた後に宣戦布告が出ていない(殻がある間は汎用の待ち行列が流れない)');
  t.advance(50); // ボタンに押し手が付くまで(描画の 50ms 後)
  t.pressWitness();
  t.advance(20000);
  assert.strictEqual(t.calls.faction.length, 1, '派閥の試合前の画面が1回ではない');
  assert.strictEqual(t.renders(), 1, `宣戦布告を ${t.renders()} 回描いた(待ち行列の残りが後から出た)`);
  t.el('showResultOverlay').classList.remove('active'); // 興行が終わって殻が閉じる → 待ち行列の残りが流れる
  t.ctx._drainPopupQueue();
  t.advance(1000);
  assert.strictEqual(t.renders(), 1, '待ち行列に残った宣戦布告が興行の後に出た');
  assert.ok(!t.warns.some(w => SAFETY.test(w)), `保険のタイマーが発火した: ${t.warns.join(' / ')}`);
}

// ── 5. 殻以外の画面が開いたまま → 10秒で保険が1回。取り下げた宣戦布告は後から出ない ──
{
  const t = build();
  t.el('fighterPopupOverlay').classList.add('active');
  t.focus(0);
  t.advance(400 + 10000 - 1);
  assert.strictEqual(t.warns.filter(w => SAFETY.test(w)).length, 0, '保険の時限より前に取り下げた');
  t.advance(1);
  assert.strictEqual(t.warns.filter(w => SAFETY.test(w)).length, 1, '出られないままの宣戦布告に保険が発火していない');
  assert.strictEqual(t.calls.faction.length, 1, '保険の後に派閥の試合前の画面へ進んでいない');
  t.el('fighterPopupOverlay').classList.remove('active');
  t.el('showResultOverlay').classList.remove('active');
  t.ctx._drainPopupQueue();
  t.advance(20000);
  assert.strictEqual(t.renders(), 0, '取り下げた宣戦布告が遅れて出た');
  assert.strictEqual(t.warns.filter(w => SAFETY.test(w)).length, 1, '保険が2回以上発火した');
  assert.strictEqual(t.calls.faction.length, 1);
}

// ── 6. 出る前にその試合が始まった → 出さずに先へ(派閥の試合前の画面も出さない) ──
{
  const t = build();
  t.el('fighterPopupOverlay').classList.add('active');
  t.focus(0);
  t.advance(400);
  t.sp.results[0] = { winner: 'left' }; // 試合が始まった(結果は押した時点で入る)
  t.el('fighterPopupOverlay').classList.remove('active');
  t.advance(20000);
  assert.strictEqual(t.renders(), 0, '始まった試合の宣戦布告を出した');
  assert.strictEqual(t.calls.faction.length, 0, '始まった試合の派閥の試合前の画面を出した');
  assert.ok(!t.warns.some(w => SAFETY.test(w)), '試合が始まったのに保険として扱った');
}

// ── 7. 宣戦布告が出ている間の描き直し(同じ試合) → 重ねない・先に進めない ──
{
  const t = build();
  t.focus(0);
  t.advance(400);
  assert.ok(t.rivalryShown());
  t.focus(0); // 同じ試合で描き直し
  t.advance(400);
  assert.strictEqual(t.renders(), 1, '描き直しで宣戦布告を重ねた');
  assert.strictEqual(t.calls.faction.length, 0, '描き直しで宣戦布告の下に派閥の試合前の画面を出した');
  t.pressWitness();
  t.advance(20000);
  assert.strictEqual(t.calls.faction.length, 1, '派閥の試合前の画面が1回ではない');
}

// ── 8. 興行の後の決着の画面(opts なし)は従来どおり殻が閉じるのを待つ ──
{
  const t = build({ conf: null });
  let done = 0;
  const res = { phase: 'resolution', winnerId: 1, loserId: 2, winnerName: '左の子', loserName: '右の子',
    resolutionType: 'first', popBonus: 2, orgPopBonus: 0.5 };
  t.ctx.Engine.util.formatSignedStatDelta = v => `+${v}`;
  t.ctx.RIVALRY_MATCH_REACTION = { winnerLines: ['w'], loserLines: ['l'] };
  t.ctx.showRivalryPopups([res], () => { done += 1; });
  assert.strictEqual(t.renders(), 0, '決着の画面が殻の上に出た(従来は殻が閉じるのを待つ)');
  t.el('showResultOverlay').classList.remove('active');
  t.ctx._drainPopupQueue();
  t.advance(200);
  assert.ok(t.overlayActive('notifModalOverlay') && t.box().includes('宿 敵 戦 勝 利'), '殻が閉じた後に決着の画面が出ていない');
  t.advance(50);
  t.pressWitness();
  t.advance(200);
  assert.strictEqual(done, 1, '決着の画面を閉じた後に先へ1回進んでいない');
}

// ── 9. 前座をスキップしても、メインの派閥の試合前の画面(と宣戦布告)は出る(2026-09-26 Keisuke 裁定) ──
// 以前は App.skipMatch が sp._suppressFlavor を立て、_runPreMatchFlavorForMatch がそれを見て以降の試合の派閥の
// 試合前の画面(F08・F09・派閥内序列戦)を出さなかった。メインは最後の試合なので、前座を1つでもスキップすると出なかった
for (const [label, match, expect] of [
  ['派閥内序列戦', { left: 1, right: 2, _internalChallengeLocked: true }, t => t.calls.faction.length === 1],
  ['F08', { left: 1, right: 2, _f08Locked: true }, t => t.calls.f08 === 1],
  ['F09', { left: 1, right: 2, _f09Locked: true }, t => t.calls.f09.join(',') === 'opening,pre'],
]) {
  const t = build({ conf: null, match, unplayed: true });
  t.ctx.App.skipMatch(1); // 前座をスキップ
  assert.deepStrictEqual(JSON.parse(JSON.stringify(t.calls.settled)), [{ idx: 1, skipFlavor: true }],
    `${label}: スキップした前座の試合後の小さな演出(敗者の心)を省略していない`);
  t.focus(0); // メインにフォーカス
  t.advance(400);
  assert.ok(expect(t), `${label}: 前座をスキップした興行でメインの試合前の画面が出ていない`);
  t.advance(20000);
  assert.ok(expect(t), `${label}: 試合前の画面が2回以上出た`);
}
{
  // 宣戦布告のある派閥内序列戦: スキップの後も 宣戦布告 → 派閥の試合前の画面 の順
  const t = build({ unplayed: true });
  t.ctx.App.skipMatch(1);
  t.focus(0);
  t.advance(400);
  assert.ok(t.rivalryShown(), '前座をスキップした興行でメインの宣戦布告が出ていない(節目の演出)');
  assert.strictEqual(t.calls.faction.length, 0);
  t.advance(50);
  t.pressWitness();
  t.advance(200);
  assert.strictEqual(t.calls.faction.length, 1, 'スキップの後、宣戦布告を閉じても派閥の試合前の画面へ進まない');
  assert.strictEqual(t.calls.faction[0].rivalryOpen, false);
}

console.log('rivalry-confrontation-over-show-shell-test: ok');
