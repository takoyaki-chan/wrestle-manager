'use strict';

// 出口ゼロの全画面演出を二度と作らないための回帰ガード(task-103の型の横展開・2026-08-31)。
//
// task-103(ppvTVフリーズ根治)で確定した構造欠陥の型:
//   進行手段が「素の要素への addEventListener('click')」しか無く、<button> / onclick属性 /
//   role="button" のいずれも持たない全画面は、(a)クリック面が限定され (b)キーボードで進めず
//   (c)描画や進行が一度転ぶと出口ゼロで恒久停止する。
// 同型だった3画面を renderPPVTvBroadcast と同じ「実ボタン+キーボード+二重起動防止+
// fail-open」に作り直した。このテストはその不変条件を守る:
//   1. 各画面に押せる実<button>の出口がある(素のdivの点滅テキストではない)
//   2. キーボード(Enter/Space/→/ESC)でも進める
//   3. 1操作=1進行(二重送り・二重終了しない)
//   4. 進行が転んだら fail-open(閉じ込めずに出口へ抜ける)
//   5. 画面を降りたらリスナーを外す/漏らさない
//
// 方式は test/u6-org-identity-safety-net-test.js を踏襲: ソース文字列一致ではなく実関数を
// new Function で取り出し、最小スタブ上で実行して振る舞いを検査する。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const appSrc = readSource('src', 'app.js');
const uiCommon = readSource('src', 'ui-common.js');
const uiRender = readSource('src', 'ui-render.js');
const cssIndex = readSource('src', 'index.html');

function makeFnReader(src, label) {
  return function functionSource(name) {
    const start = src.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} not found in ${label}`);
    const brace = src.indexOf('{', start);
    let depth = 0;
    for (let i = brace; i < src.length; i++) {
      if (src[i] === '{') depth++;
      if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
    }
    throw new Error(`${name} end not found in ${label}`);
  };
}

// App オブジェクトリテラルのメソッド簡易記法(`completeDraft() {`)用の抽出器
function methodSource(src, name, label) {
  const sig = `\n  ${name}() {`;
  const start = src.indexOf(sig);
  assert.ok(start >= 0, `${name}() method not found in ${label}`);
  const brace = src.indexOf('{', start + sig.length - 1);
  let depth = 0;
  for (let i = brace; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') { depth--; if (depth === 0) return `function ${name}() ${src.slice(brace, i + 1)}`; }
  }
  throw new Error(`${name} end not found in ${label}`);
}

const uiFn = makeFnReader(uiCommon, 'ui-common.js');
const uiRenderFn = makeFnReader(uiRender, 'ui-render.js');

let sectionsRun = 0;
function section(name, fn) {
  fn();
  sectionsRun++;
  console.log(`  [ok] ${name}`);
}

// 共通: 手動フラッシュ式タイマー(演出の setTimeout 連鎖を決定的に進める)
function makeTimers() {
  let queue = [];
  return {
    setTimeout: (fn, ms) => { queue.push({ fn, ms: ms || 0 }); return queue.length; },
    clearTimeout: (id) => { if (id >= 1 && id <= queue.length) queue[id - 1] = null; },
    flush() {
      // 実行中に積まれた分も併せて、固定点まで流す(上限つき)
      for (let round = 0; round < 30 && queue.some(Boolean); round++) {
        const batch = queue; queue = [];
        batch.forEach(t => { if (t) t.fn(); });
      }
    },
    pending() { return queue.filter(Boolean).length; },
  };
}

// 共通: classList/イベントを追跡できる最小エレメントスタブ
function makeEl(id) {
  const classes = new Set();
  const listeners = {};
  return {
    id,
    style: {},
    dataset: {},
    textContent: '',
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) { this._innerHTML = v; },
    classList: {
      add: (...cs) => cs.forEach(c => classes.add(c)),
      remove: (...cs) => cs.forEach(c => classes.delete(c)),
      contains: (c) => classes.has(c),
    },
    _classes: classes,
    addEventListener(evt, cb) { (listeners[evt] = listeners[evt] || []).push(cb); },
    removeEventListener(evt, cb) {
      if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== cb);
    },
    _fire(evt, e) { (listeners[evt] || []).slice().forEach(cb => cb(e || { target: { closest: () => null } })); },
    _listenerCount(evt) { return (listeners[evt] || []).length; },
    click() { this._fire('click', { target: this, stopPropagation() {} }); },
    remove() { this._removed = true; },
    appendChild() {},
    querySelector: () => null,
    offsetWidth: 0,
  };
}

// ===========================================================================
// 1. App.completeDraft — 旗揚げ完成演出(.completion-overlay)の出口(app.js)
//    z-index:400 の不透明幕が全ボタンを塞ぐ画面。旧実装は overlay click 1本のみだった。
// ===========================================================================
(function completeDraftSuite() {
  const src = methodSource(appSrc, 'completeDraft', 'app.js');
  const build = new Function(
    'G', 'Engine', 'Audio', 'Storage', 'refreshAll', 'document', 'DRAFT_CONFIG', 'ALL_CHARS',
    'getUpperUrl', 'requestAnimationFrame', 'setTimeout', 'alert',
    `var sessionRng; ${src} return { completeDraft };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const timers = makeTimers();
    const keydowns = [];
    const created = [];
    const documentStub = {
      createElement: (tag) => { const el = makeEl(`created-${tag}-${created.length}`); el.tagName = tag; created.push(el); return el; },
      body: { appendChild() {} },
      querySelector: (sel) => (sel === '.app' ? makeEl('app-root') : null),
      getElementById: () => null,
      addEventListener: (evt, cb) => { if (evt === 'keydown') keydowns.push(cb); },
      removeEventListener: (evt, cb) => {
        if (evt === 'keydown') { const i = keydowns.indexOf(cb); if (i >= 0) keydowns.splice(i, 1); }
      },
    };
    const calls = { refreshAll: 0, autoSave: 0, bgm: 0 };
    const identity = (s) => s;
    const EngineStub = {
      draft: { isValidPicks: () => true, canAffordSelection: () => true, completeDraft: identity },
      career: { generateAllBackstories: identity, generateInheritedRecords: identity, addEvent: (c) => c },
      relationships: { initialize: identity },
      mq: { registerBignewsHire: (state, c) => ({ state, fighter: c }) },
      prologue: { create: identity },
      rng: { create: () => ({}) },
    };
    const GStub = {
      weekPhase: 'draft', _draftPicks: [11, 12, 13], rngSeed: 1, season: 1, week: 1,
      orgName: 'テスト団体', roster: [1, 2, 11, 12, 13].map(id => ({ id, name: `選手${id}` })),
    };
    const refreshAll = opts.refreshAll || (() => { calls.refreshAll++; });
    const built = build(
      GStub, EngineStub,
      { play() {}, bgm: { play() { calls.bgm++; } } },
      { autoSave() { calls.autoSave++; } },
      refreshAll, documentStub,
      { fixed: [1, 2] }, [],
      opts.getUpperUrl || (() => ''),
      (fn) => fn(), timers.setTimeout, () => {}
    );
    const overlay = () => created.find(el => el.className === 'completion-overlay');
    return { built, calls, timers, created, overlay, keydowns };
  }

  section('completion overlay carries a real, pressable exit button (task-103 type)', () => {
    const { built, overlay } = makeBundle({});
    built.completeDraft();
    const ov = overlay();
    assert.ok(ov, '完成演出のオーバーレイが作られる');
    assert.ok(ov.innerHTML.includes('<button type="button" class="comp-continue-btn" data-comp-continue>'),
      '出口の実ボタンが無い(素のdivクリックだけの出口ゼロ画面を作ってはいけない)');
    assert.ok(ov._listenerCount('click') >= 1, '暗幕クリックの委譲も生きている(ボタンとどちらでも出られる)');
  });

  section('click and keyboard both leave; 1操作=1進行 (double-fire prevention)', () => {
    const a = makeBundle({});
    a.built.completeDraft();
    a.overlay()._fire('click');
    assert.strictEqual(a.calls.refreshAll, 1, 'クリック1回で本編へ1回だけ進む');
    a.overlay()._fire('click');
    assert.strictEqual(a.calls.refreshAll, 1, '二重クリックでも進行は1回だけ');

    const b = makeBundle({});
    b.built.completeDraft();
    assert.strictEqual(b.keydowns.length, 1, 'キーボードの出口が登録されている');
    b.keydowns[0]({ key: 'Enter', preventDefault() {} });
    assert.strictEqual(b.calls.refreshAll, 1, 'Enterでも本編へ進める');
    assert.strictEqual(b.keydowns.length, 0, '出た後は keydown リスナーを外す(他画面の操作を奪わない)');
  });

  section('fail-open: even if refreshAll throws, the curtain still drops', () => {
    const { built, overlay, timers } = makeBundle({ refreshAll: () => { throw new Error('boom'); } });
    built.completeDraft();
    const ov = overlay();
    ov._fire('click');
    assert.strictEqual(ov.style.opacity, '0', '本編差し替えが転んでも幕のフェードは始まる');
    timers.flush();
    assert.ok(ov._removed, '幕は必ず取り除かれる(z-400の不透明幕に閉じ込めない)');
  });

  section('fail-open: if the ceremony cannot be built, skip straight to the office', () => {
    // 画像URL解決が転ぶ状況(innerHTML組み立て中の例外)を再現
    const { built, calls } = makeBundle({ getUpperUrl: () => { throw new Error('asset gone'); } });
    built.completeDraft();
    assert.strictEqual(calls.refreshAll, 1, '演出を諦めて本編へ直行する(旗揚げ自体は完了している)');
  });
})();

// ===========================================================================
// 2. renderOpeningScreen — オープニング4幕(.opening-overlay)の出口(ui-render.js)
//    旧実装: 進行は overlay click と ESC のみ。skip は div への onclick プロパティ代入で
//    実ボタンでなく、幕送りロックが転ぶと解けなかった。
// ===========================================================================
(function openingSuite() {
  const build = new Function(
    'G', 'Engine', 'Audio', 'document', 'getUpperUrl', 'refreshAll',
    'requestAnimationFrame', 'setTimeout', 'clearTimeout',
    `let _openingAct = 0;
     let _openingOverlay = null;
     let _openingTransitioning = false;
     let _openingLockSafety = null;
     let _openingFinishing = false;
     ${uiRenderFn('renderOpeningScreen')}
     ${uiRenderFn('_advanceOpening')}
     ${uiRenderFn('_finishOpening')}
     return { renderOpeningScreen };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const timers = makeTimers();
    const keydowns = [];
    const byId = {};
    const created = [];
    const broken = { acts: false }; // テスト側から後付けで幕要素を壊すためのスイッチ
    const getEl = (id) => (byId[id] = byId[id] || makeEl(id));
    const documentStub = {
      getElementById: (id) => {
        if (broken.acts && /^openingAct/.test(id)) throw new Error('acts unreachable');
        return getEl(id);
      },
      createElement: (tag) => { const el = makeEl(`created-${tag}-${created.length}`); el.tagName = tag; created.push(el); return el; },
      body: { appendChild() {} },
      addEventListener: (evt, cb) => { if (evt === 'keydown') keydowns.push(cb); },
      removeEventListener: (evt, cb) => {
        if (evt === 'keydown') { const i = keydowns.indexOf(cb); if (i >= 0) keydowns.splice(i, 1); }
      },
    };
    const calls = { refreshAll: 0 };
    const GStub = { orgName: 'テスト団体', weekPhase: 'opening' };
    const built = build(
      GStub,
      { draft: { getFixedInfo: () => [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] } },
      { bgm: { playForState() {} } },
      documentStub, () => '', () => { calls.refreshAll++; },
      (fn) => fn(), timers.setTimeout, timers.clearTimeout
    );
    const overlay = () => created.find(el => el.className === 'opening-overlay');
    const skip = () => created.find(el => el.className === 'opening-skip');
    const pressKey = (key, target) => keydowns.slice().forEach(cb => cb({
      key, preventDefault() {}, target: target || { closest: () => null },
    }));
    return { built, G: GStub, calls, timers, overlay, skip, keydowns, pressKey, broken };
  }

  section('opening: CLICK TO CONTINUE and skip are real <button>s (task-103 type)', () => {
    const { built, overlay, skip } = makeBundle({});
    built.renderOpeningScreen();
    assert.ok(overlay().innerHTML.includes('<button type="button" class="opening-click-hint" data-opening-next>'),
      '進行導線が実ボタンではない(素のdivの点滅テキストに戻してはいけない)');
    const sk = skip();
    assert.ok(sk && sk.tagName === 'button' && sk.type === 'button',
      'skip はプロパティ代入の div ではなく実<button>で作る');
    assert.ok(sk._listenerCount('click') >= 1, 'skip はクリックで発火する');
  });

  section('opening: keyboard advances acts and ESC exits to draft', () => {
    const { built, G, calls, timers, pressKey } = makeBundle({});
    built.renderOpeningScreen();
    pressKey('Enter');
    timers.flush(); // 幕1→幕2 の 450ms+700ms 連鎖を流す
    pressKey('Escape');
    assert.strictEqual(G.weekPhase, 'draft', 'ESCでオープニングを抜けてドラフトへ遷移する');
    assert.strictEqual(calls.refreshAll, 1, '遷移の描画が1回走る');
  });

  section('opening: 1操作=1進行 — double ESC/click exits once, and re-render leaves exactly one keydown listener', () => {
    const a = makeBundle({});
    a.built.renderOpeningScreen();
    a.pressKey('Escape');
    a.pressKey('Escape');
    assert.strictEqual(a.calls.refreshAll, 1, '二重ESCでも遷移は1回だけ');

    const b = makeBundle({});
    b.built.renderOpeningScreen();
    b.built.renderOpeningScreen(); // 二重起動(再描画)
    assert.strictEqual(b.keydowns.length, 1, '再描画しても document の keydown リスナーは常に1本(漏らさない)');
  });

  section('opening: fail-open — a broken act transition exits to draft instead of freezing', () => {
    const bundle = makeBundle({});
    bundle.built.renderOpeningScreen();
    bundle.broken.acts = true; // 描画後に幕要素へ到達できなくなる状況(旧実装なら永久ロックで恒久停止)
    bundle.pressKey('Enter');
    bundle.timers.flush();
    assert.strictEqual(bundle.G.weekPhase, 'draft', '幕送りが転んだら暗幕に閉じ込めずドラフトへ抜ける');
  });
})();

// ===========================================================================
// 3. showLeagueElevationCeremony — 業界底上げ演出スライド2(ui-common.js)
//    旧実装: step 0〜4 の進行は素の全画面div #leClickArea のみ。#leCloseBtn は step 5 まで
//    opacity:0。ロックは setTimeout の unlock() だけが解き、1ステップ転ぶと永久ロックだった。
// ===========================================================================
(function leagueElevationSuite() {
  const build = new Function(
    'document', 'Audio', 'window', 'Engine', 'RIVAL_ORGS', 'getUpperUrl', 'orgIconHtml',
    'setTimeout', 'Date',
    `${uiFn('showLeagueElevationCeremony')} return { showLeagueElevationCeremony };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const timers = makeTimers();
    const clock = { t: 100000 };
    const keydowns = [];
    const byId = {};
    const broken = { ids: [] }; // テスト側から後付けで要素を壊すためのスイッチ
    const getEl = (id) => (byId[id] = byId[id] || makeEl(id));
    const overlayEl = getEl('awardsOverlay');
    const documentStub = {
      getElementById: (id) => {
        if (broken.ids.includes(id)) return null;
        return getEl(id);
      },
      addEventListener: (evt, cb) => { if (evt === 'keydown') keydowns.push(cb); },
      removeEventListener: (evt, cb) => {
        if (evt === 'keydown') { const i = keydowns.indexOf(cb); if (i >= 0) keydowns.splice(i, 1); }
      },
    };
    const built = build(
      documentStub,
      { play() {}, fileBgm: { play() {}, fadeOut() {} } },
      { Audio: function () { return { volume: 0, play: () => ({ catch() {} }) }; } },
      { util: { ov: () => 50 } },
      [{ name: 'S団体', emoji: '', color: '#111' }, { name: 'A団体', emoji: '', color: '#222' }, { name: 'B団体', emoji: '', color: '#333' }],
      () => '', () => '',
      timers.setTimeout, { now: () => clock.t }
    );
    const pressKey = (key, target) => keydowns.slice().forEach(cb => cb({
      key, preventDefault() {}, target: target || { closest: () => null },
    }));
    return { built, timers, clock, byId, getEl, overlayEl, keydowns, pressKey, broken };
  }

  function startSlide2(bundle) {
    bundle.getEl('leNextBtn').click();  // スライド1→2
    bundle.timers.flush();              // 200ms 遷移 + step 0 自動実行
    bundle.clock.t += 5000;             // step 0 のロックを確実に過ぎる
  }

  section('league elevation: the advance hint is a real, pressable <button> (task-103 type)', () => {
    const bundle = makeBundle({});
    bundle.built.showLeagueElevationCeremony({ orgName: 'テスト団体', aiOrgs: {} }, () => {});
    assert.ok(bundle.overlayEl.innerHTML.includes('<button type="button" class="le-click-hint" id="leClickHint" data-le-next>'),
      '場面送りの導線が実ボタンではない(素の #leClickArea だけに依存してはいけない)');
    assert.ok(bundle.getEl('leClickHint')._listenerCount('click') >= 1, 'ヒントボタンは押すと進む');
    assert.strictEqual(bundle.keydowns.length, 1, 'キーボードの進行導線が登録されている');
  });

  section('league elevation: keyboard walks slide 1 → all steps → close; 1操作=1進行; listener removed on close', () => {
    const bundle = makeBundle({});
    let done = 0;
    bundle.built.showLeagueElevationCeremony({ orgName: 'テスト団体', aiOrgs: {} }, () => { done++; });
    bundle.overlayEl.classList.add('active'); // 実装は show 側で active を付ける(スタブでは innerHTML 代入が後追いなので明示)

    pressThrough: {
      bundle.pressKey('Enter'); // スライド1の「次へ」
      bundle.timers.flush();
      bundle.clock.t += 5000;
      for (let i = 0; i < 10; i++) { // step 1〜5 を歩き切る(上限つき)
        if (bundle.getEl('leCloseBtn').classList.contains('visible')) break pressThrough;
        bundle.pressKey('ArrowRight');
        bundle.timers.flush();
        bundle.clock.t += 5000;
      }
    }
    assert.ok(bundle.getEl('leCloseBtn').classList.contains('visible'),
      'キーボードだけで締めの「続ける ▶」まで到達できる');
    bundle.pressKey('Enter'); // 出口
    assert.strictEqual(done, 1, 'Enterで閉じられる');
    bundle.pressKey('Enter');
    assert.strictEqual(done, 1, '二重Enterでも onDone は1回だけ(1操作=1進行)');
    assert.strictEqual(bundle.keydowns.length, 0, '閉じたら keydown リスナーを外す(他画面の操作を奪わない)');
  });

  section('league elevation: a locked step auto-expires instead of freezing forever (§5-D 鉄則1)', () => {
    const bundle = makeBundle({});
    bundle.built.showLeagueElevationCeremony({ orgName: 'テスト団体', aiOrgs: {} }, () => {});
    bundle.getEl('leNextBtn').click();
    bundle.timers.flush(); // step 0 実行(unlock(600) が予約されるが、時間は clock で管理)
    const hint = bundle.getEl('leClickHint');
    hint.click(); // ロック中(直後)の連打 — 進まない
    assert.ok(!bundle.getEl('leNarr1').classList.contains('visible'), 'ロック中は場面が進まない');
    bundle.clock.t += 5000; // 保険期限(4s)を過ぎる — unlock が来なくても自然解除
    hint.click();
    assert.ok(bundle.getEl('leNarr1').classList.contains('visible'),
      'ロックは期限付き(永久ロックで出口ゼロにならない)');
  });

  section('league elevation: fail-open — a throwing step reveals the closing exit instead of freezing', () => {
    const bundle = makeBundle({});
    bundle.built.showLeagueElevationCeremony({ orgName: 'テスト団体', aiOrgs: {} }, () => {});
    bundle.getEl('leNextBtn').click();
    bundle.timers.flush(); // step 0 自動実行
    bundle.clock.t += 5000;
    bundle.broken.ids.push('leNarr1'); // 描画後に step 1 の要素へ到達できなくなる状況
    bundle.getEl('leClickHint').click(); // step 1 → showNarr('leNarr1') が throw → forceExit
    assert.ok(bundle.getEl('leCloseBtn').classList.contains('visible'),
      'ステップが転んだら締めの出口(続ける ▶)を強制表示する(出口ゼロにしない)');
  });

  section('league elevation: fail-open — a throwing onDone still drops the curtain', () => {
    const bundle = makeBundle({});
    bundle.built.showLeagueElevationCeremony({ orgName: 'テスト団体', aiOrgs: {} }, () => { throw new Error('boom'); });
    bundle.overlayEl.classList.add('active');
    bundle.getEl('leCloseBtn').click();
    bundle.timers.flush();
    assert.ok(!bundle.overlayEl.classList.contains('active'),
      'onDone が転んでも overlay は必ず畳む(不透明幕に閉じ込めない)');
  });
})();

// ===========================================================================
// 4. showSeasonFanfare — シーズン開幕ファンファーレ(ui-common.js)
//    60秒の自己復帰があるため恒久停止はしないが、同じ型(実ボタン+キーボード)に揃えた。
// ===========================================================================
(function seasonFanfareSuite() {
  const build = new Function(
    'document', 'Audio', 'window', '_isPopupActive', '_popupQueue', '_drainPopupQueue',
    'setTimeout', 'clearTimeout',
    `${uiFn('showSeasonFanfare')} return { showSeasonFanfare };`
  );

  section('season fanfare: real continue button + keyboard exit + single keydown listener', () => {
    const timers = makeTimers();
    const keydowns = [];
    const overlay = makeEl('seasonFanfareOverlay');
    const box = makeEl('seasonFanfareBox');
    const documentStub = {
      getElementById: (id) => (id === 'seasonFanfareOverlay' ? overlay : id === 'seasonFanfareBox' ? box : null),
      addEventListener: (evt, cb) => { if (evt === 'keydown') keydowns.push(cb); },
      removeEventListener: (evt, cb) => {
        if (evt === 'keydown') { const i = keydowns.indexOf(cb); if (i >= 0) keydowns.splice(i, 1); }
      },
    };
    const windowStub = {};
    let done = 0;
    const built = build(
      documentStub, { play() {} }, windowStub,
      () => false, [], () => {},
      timers.setTimeout, () => {}
    );
    built.showSeasonFanfare(3, () => { done++; });
    assert.ok(box.innerHTML.includes('<button type="button" class="sf-continue-btn" data-sf-continue>'),
      '「タップで続行」は実ボタンで出す');
    built.showSeasonFanfare(3, () => { done++; }); // 二重起動
    assert.strictEqual(keydowns.length, 1, '二重起動しても keydown リスナーは常に1本だけ');
    keydowns[0]({ key: 'Enter', preventDefault() {} });
    timers.flush();
    assert.strictEqual(done, 1, 'Enterで閉じられる(onDoneは1回だけ)');
    assert.strictEqual(keydowns.length, 0, '閉じたら keydown リスナーを外す');
    assert.ok(!overlay.classList.contains('show'), 'オーバーレイは畳まれる');
  });
})();

// ===========================================================================
// 5. CSS側の出口が消えていないこと(スタイルの回帰で「押せるのに見えない/見えるのに
//    押せない」へ戻さない)
// ===========================================================================
(function cssSuite() {
  section('css: each exit control keeps its pressable styling', () => {
    assert.ok(cssIndex.includes('.comp-continue-btn{'), '旗揚げ完成演出の出口ボタンのCSSがある');
    assert.ok(cssIndex.includes('.completion-overlay.show .comp-continue-btn{opacity:1}'),
      '出口ボタンは show で浮かび上がる');
    assert.ok(/\.le-click-hint\.visible\{[^}]*pointer-events:auto/.test(cssIndex),
      'le-click-hint は visible のとき押せる(pointer-events:auto)');
    assert.ok(/\.opening-click-hint\{[^}]*cursor:pointer/.test(cssIndex),
      'opening-click-hint はボタンとして押せる見た目を持つ');
  });
})();

console.log(`fullscreen-exit-zero-guard-test: ${sectionsRun} sections ok`);
