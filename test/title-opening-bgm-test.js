'use strict';

// タイトル〜オープニング〜ドラフトのBGM進行を固定する安全網。
//   タイトル/団体設定/難易度 = WM-C01 → オープニング4幕 = 無音 → ドラフト = WM-C08
// 「タイトル画面で鳴らず、ニューゲーム後に鳴り始める」不具合の再発を機械的に落とす。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const appSource = readSource('src', 'app.js');
const uiRenderSource = readSource('src', 'ui-render.js');

function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const brace = source.indexOf('{', start);
  assert.ok(brace >= 0, `${signature} body start not found`);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(brace + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

// ── 1. タイトル導線の判定は3画面すべてを見ていること ──
{
  const body = extractFunction(appSource, 'function _isTitleFlowVisible()');
  for (const id of ['titleScreen', 'orgSetupScreen', 'difficultyScreen']) {
    assert.ok(body.includes(`'${id}'`), `_isTitleFlowVisible must cover ${id}`);
  }

  const fn = new Function('document', `${appSource.slice(appSource.indexOf('function _isTitleFlowVisible()'), appSource.indexOf('const BGM = {'))}\nreturn _isTitleFlowVisible;`);
  const makeDoc = (visible) => ({
    getElementById: (id) => ({ style: { display: id === visible ? 'flex' : 'none' } }),
  });
  assert.strictEqual(fn(makeDoc('titleScreen'))(), true, 'title screen must count as the title flow');
  assert.strictEqual(fn(makeDoc('orgSetupScreen'))(), true, 'org setup must count as the title flow');
  assert.strictEqual(fn(makeDoc('difficultyScreen'))(), true, 'difficulty select must count as the title flow');
  assert.strictEqual(fn(makeDoc(null))(), false, 'in-game screens must not count as the title flow');
}

// ── 2. playForState: タイトル導線の判定が weekPhase より先に来ること ──
// G はロード時に weekPhase:'draft' で初期化されるので、後ろに置くと
// タイトル画面でドラフト曲(WM-C08)が鳴ってしまう。
{
  const body = extractFunction(appSource, 'playForState()');
  const titleIdx = body.indexOf('_isTitleFlowVisible()');
  assert.ok(titleIdx >= 0, 'playForState must consult _isTitleFlowVisible');
  assert.ok(/_isTitleFlowVisible\(\)\) \{ BGM\.play\('kaimaku'\)/.test(body), 'title flow must play WM-C01 kaimaku');
  assert.ok(titleIdx < body.indexOf('if (!G) return'), 'the title check must precede the G guard');
  assert.ok(titleIdx < body.indexOf("G.weekPhase === 'draft'"), 'the title check must precede the weekPhase fallbacks');

  // オープニング4幕は無音（タイトル曲を引きずらない）
  assert.ok(/weekPhase === 'opening'\) \{ BGM\.stop\(\); return/.test(body), 'the opening acts must be silent');
  assert.ok(!/weekPhase === 'opening'[^\n]*kaimaku/.test(body), 'the opening acts must not reclaim the title track');
  assert.ok(/weekPhase === 'draft'\) \{ BGM\.play\('draftPick'\)/.test(body), 'the draft must use WM-C08');
}

// ── 3. 画面遷移側の配線 ──
{
  const showTitle = extractFunction(appSource, 'showTitleScreen()');
  assert.ok(showTitle.includes("Audio.bgm.play('kaimaku')"), 'showTitleScreen must start the title track');

  const confirmDifficulty = extractFunction(appSource, 'confirmDifficulty()');
  assert.ok(confirmDifficulty.includes('Audio.bgm.fadeOutStop('), 'starting the game must fade the title track out');
  assert.ok(!confirmDifficulty.includes("play('kaimaku')"), 'starting the game must not (re)start the title track');

  const finishOpening = extractFunction(uiRenderSource, 'function _finishOpening()');
  assert.ok(finishOpening.includes("G.weekPhase = 'draft'"), '_finishOpening must hand over to the draft phase');
  assert.ok(finishOpening.includes('Audio.bgm.playForState()'), '_finishOpening must bring the BGM back (refreshAll does not touch audio)');
  assert.ok(finishOpening.indexOf("G.weekPhase = 'draft'") < finishOpening.indexOf('Audio.bgm.playForState()'), 'the phase must be set before the BGM is resolved');
}

// ── 4. 自動再生ブロック時のリカバリ ──
// タイトル画面はページ読込直後に出るためユーザー操作が一度も無い。
// play() が蹴られたまま _audio が残ると BGM.play の重複ガードに阻まれて二度と鳴らない。
{
  const fileBgm = appSource.slice(appSource.indexOf('const FileBGM = {'));
  assert.ok(/a\.play\(\)\.catch\(\(\) => \{[^}]*_armGestureRetry\(\)/.test(fileBgm), 'a blocked play() must arm the gesture retry');
  const retry = extractFunction(appSource, '_armGestureRetry()');
  for (const evt of ['pointerdown', 'keydown']) {
    assert.ok(retry.includes(`addEventListener('${evt}'`), `the retry must listen for ${evt}`);
    assert.ok(retry.includes(`removeEventListener('${evt}'`), `the retry must clean up its ${evt} listener`);
  }
  assert.ok(retry.includes('_bgmMuted') && retry.includes('_muted'), 'the retry must respect the mute settings');
}

console.log('title-opening-bgm-test: ok');
