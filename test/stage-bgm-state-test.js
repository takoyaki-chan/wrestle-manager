'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { readSource } = require('./helpers/source');

const appSource = readSource('src', 'app.js');

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

function extractWhole(source, signature) {
  return `function ${signature.replace(/^function\s+/, '')}{${extractFunction(source, signature)}}`;
}

// resolveActiveStageBgm は A/B 判定ヘルパーへ委譲しているので、まとめて評価環境へ持ち込む。
const HELPERS = [
  'function _isRivalryBgmMatch(match)',
  'function _stlStageTrack(spring)',
  'function _awStageTrack(autumn)',
  'function _ppvStageTrack(ppv)',
  'function _jtBoardTrack(jt)',
  'function resolveActiveStageBgm(app)',
].map((sig) => extractWhole(appSource, sig)).join('\n');

const RIVALRY_MIN_TIER = (() => {
  const m = appSource.match(/const RIVALRY_BGM_MIN_TIER\s*=\s*(\d+)/);
  assert.ok(m, 'RIVALRY_BGM_MIN_TIER must stay declared');
  return Number(m[1]);
})();

// G / Engine を差し替えて因縁判定を制御できるファクトリ
const PRELUDE = `const RIVALRY_BGM_MIN_TIER = ${RIVALRY_MIN_TIER};\n${HELPERS}`;

function makeResolver({ rivalryTier = 0 } = {}) {
  const G = { relationships: {}, rivalries: {} };
  const Engine = { title: { getRivalryLevel: () => ({ tier: rivalryTier }) } };
  return new Function('G', 'Engine', `${PRELUDE}\nreturn resolveActiveStageBgm;`)(G, Engine);
}
const resolveActiveStageBgm = makeResolver();

assert.strictEqual(resolveActiveStageBgm({}), null, 'ordinary screens must not claim a stage BGM');

assert.strictEqual(resolveActiveStageBgm({ _showPreview: { currentWatching: 0, validMatches: [{ isTitle: false }] } }), 'battle', 'ordinary watched show match must restore battle BGM');
assert.strictEqual(resolveActiveStageBgm({ _showPreview: { currentWatching: 0, validMatches: [{ isTitle: true }] } }), 'bigMatch', 'watched title match must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _showPreview: { currentWatching: 0, validMatches: [{ isTitle: true, teamA: {} }] } }), 'battle', 'watched title tag match must retain the tag-battle BGM choice');
assert.strictEqual(resolveActiveStageBgm({ _b3Preview: { watching: true } }), 'bigMatch', 'B3 challenge match must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _common1Preview: { watching: true } }), 'bigMatch', 'faction showdown must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _b2Preview: { watching: true } }), 'bigMatch', 'B2 special match must restore FB1');

// ── WM-M03 因縁戦（相互 rivalry が tier2「宿敵」以上でのみ差し替わる） ──
{
  const below = makeResolver({ rivalryTier: RIVALRY_MIN_TIER - 1 });
  const at = makeResolver({ rivalryTier: RIVALRY_MIN_TIER });
  const ordinary = { _showPreview: { currentWatching: 0, validMatches: [{ left: 'a', right: 'b', isTitle: false }] } };
  assert.strictEqual(below(ordinary), 'battle', 'rivalry below the line must stay on the ordinary match track');
  assert.strictEqual(at(ordinary), 'rivalry', 'rivalry at or above the line must switch to WM-M03');
  assert.strictEqual(at({ _showPreview: { currentWatching: 0, validMatches: [{ left: 'a', right: 'b', isTitle: true }] } }), 'bigMatch', 'title match must outrank the grudge track');
  assert.strictEqual(at({ _showPreview: { currentWatching: 0, validMatches: [{ left: 'a', right: 'b', teamA: {} }] } }), 'battle', 'tag matches must not use the grudge track');
}

assert.strictEqual(resolveActiveStageBgm({ _warPreview: { currentWatching: -1 } }), 'war', 'war card must restore its stage track');
assert.strictEqual(resolveActiveStageBgm({ _warPreview: { currentWatching: 1 } }), 'bigMatch', 'watched war match must restore FB1');

// ── 特別興行は大会別。A=前半 / B=決勝・大将戦・ラストマッチ以降（2026-07-26 Keisuke裁定） ──
assert.strictEqual(resolveActiveStageBgm({ _ppvPreview: { currentWatching: -1, results: [null, null, null, null, null] } }), 'ppvA', 'PPV undercard must use the winter A track');
assert.strictEqual(resolveActiveStageBgm({ _ppvPreview: { currentWatching: -1, results: [1, 1, 1, 1, null] } }), 'ppvB', 'PPV must switch to the winter B track once only the last match remains');
assert.strictEqual(resolveActiveStageBgm({ _ppvPreview: { currentWatching: 0, results: [null] } }), 'bigMatch', 'watched PPV match must restore FB1');

assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'table' } }), 'springA', 'Spring Tag round-robin must use the spring A track');
assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'watching' } }), 'springA', 'Spring Tag match must keep the spring A track');
assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'finalReady' } }), 'springB', 'Spring Tag final must switch to the spring B track');
assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'finalResult' } }), 'springB', 'Spring Tag final result must keep the spring B track');
assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'champion' } }), 'preserve', 'Spring Tag champion fanfare must not be overwritten');

assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'board' } }), 'autumnA', 'Autumn War board must use the autumn A track');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'watching' } }), 'autumnA', 'Autumn War match must keep the autumn A track');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'reorder' } }), 'autumnB', 'Autumn War captain round must switch to the autumn B track');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'result' } }), 'preserve', 'Autumn War champion fanfare must not be overwritten');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'mvp' } }), 'preserve', 'Autumn War MVP stinger must not be overwritten');

assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'bracket', bgmTrack: 'juniorA' } }), 'juniorA', 'JT bracket must restore the summer A track');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'bracket', bgmTrack: 'juniorB' } }), 'juniorB', 'JT final round must restore the summer B track');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'watching', bgmTrack: 'bigMatch' } }), 'bigMatch', 'JT final watch must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'matchResult', bgmTrack: 'juniorA' } }), 'juniorA', 'JT skipped result must keep its board track');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'bracket', bgmTrack: 'preserve' } }), 'preserve', 'JT final reveal must preserve its fanfare before the result screen opens');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'finalResult', bgmTrack: 'bigMatch' } }), 'preserve', 'JT champion screen must preserve its fanfare');

assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'bracket', bgmTrack: 'tencho' } }), 'tencho', 'Tenchosen bracket must restore its own track');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'watching', bgmTrack: 'bigMatch' } }), 'bigMatch', 'Tenchosen final watch must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'bracket', bgmTrack: 'preserve' } }), 'preserve', 'Tenchosen final reveal must preserve its fanfare before the result screen opens');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'finalResult', bgmTrack: 'bigMatch' } }), 'preserve', 'Tenchosen champion screen must preserve its fanfare');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { tvMode: true } }), null, 'Tenchosen TV mode must keep the ordinary state BGM');

// ── JT 盤面 A/B のしきい（決勝ラウンドに入ったら B） ──
{
  const jtBoardTrack = new Function(`${PRELUDE}\nreturn _jtBoardTrack;`)();
  const rounds = { result: { rounds: [{}, {}, {}] } };
  assert.strictEqual(jtBoardTrack({ ...rounds, currentRound: 0 }), 'juniorA');
  assert.strictEqual(jtBoardTrack({ ...rounds, currentRound: 1 }), 'juniorA');
  assert.strictEqual(jtBoardTrack({ ...rounds, currentRound: 2 }), 'juniorB', 'final round must move the board to the B track');
}

const playForState = extractFunction(appSource, 'playForState()');
assert.ok(playForState.includes('resolveActiveStageBgm(App)'), 'playForState must consult the active stage before ordinary state fallbacks');
assert.ok(playForState.includes("if (stageBgm === 'preserve') return"), 'playForState must preserve terminal fanfares');
assert.ok(playForState.includes("if (stageBgm === 'battle')"), 'playForState must restore ordinary watched-match BGM');
assert.ok(playForState.includes('BGM.playStage(stageBgm)'), 'playForState must restore the resolved stage track');

// ── 台帳どおりの枠が STAGE_BGM に居ること（音響刷新 Phase 2 / 2026-07-26） ──
for (const [key, file] of [
  ['bigMatch', 'production-ogg/wm_bgm_m04_v01.ogg'],   // WM-M04
  ['rivalry', 'production-ogg/wm_bgm_m03_v01.ogg'],    // WM-M03
  ['springA', 'production-ogg/wm_bgm_sp01_v01.ogg'],
  ['springB', 'production-ogg/wm_bgm_sp02_v01.ogg'],
  ['juniorA', 'production-ogg/wm_bgm_sp03_v01.ogg'],
  ['juniorB', 'production-ogg/wm_bgm_sp04_v01.ogg'],
  ['autumnA', 'production-ogg/wm_bgm_sp05_v01.ogg'],
  ['autumnB', 'production-ogg/wm_bgm_sp06_v01.ogg'],
  ['ppvA', 'production-ogg/wm_bgm_sp07_v01.ogg'],
  ['ppvB', 'production-ogg/wm_bgm_sp08_v01.ogg'],
  ['tencho', 'production-ogg/wm_bgm_sp09_v01.ogg'],
]) {
  const mapping = new RegExp(`${key}:\\s*\\{ file: '\\.\\./bgm/${file.replace(/\./g, '\\.')}'`);
  assert.ok(mapping.test(appSource), `${key} must retain its WM Audio Mixer file mapping`);
}

// 旧フリー素材（差し替え済み）へ戻っていないこと
for (const retired of ['MusMus-BGM-052.mp3', 'MusMus-BGM-125.mp3', '8bit-jo-jokyoku.mp3', '8bit-ending-theme_Loop.ogg']) {
  assert.ok(!appSource.includes(retired), `${retired} was replaced by the production set and must not come back`);
}

// ── 安全網の本体: 参照している音源が実在し、参照キーがすべて定義されていること ──
// 「曲を作ったのにゲームへ繋がっていない/繋いだつもりでパスが違う」を機械的に落とす。
{
  const stageBlock = appSource.slice(appSource.indexOf('const STAGE_BGM = {'), appSource.indexOf('\n  };', appSource.indexOf('const STAGE_BGM = {')));
  const sunoBlock = appSource.slice(appSource.indexOf('const SUNO_BGM = {'), appSource.indexOf('\n  };', appSource.indexOf('const SUNO_BGM = {')));
  const stageKeys = new Set([...stageBlock.matchAll(/^\s{4}([A-Za-z_]+):/gm)].map((m) => m[1]));
  const sunoKeys = new Set([...sunoBlock.matchAll(/^\s{4}([A-Za-z_]+):/gm)].map((m) => m[1]));

  const uiCommon = readSource('src', 'ui-common.js');
  const uiRender = readSource('src', 'ui-render.js');
  const allSource = [appSource, uiCommon, uiRender].join('\n');

  const special = new Set(['preserve', 'battle']);
  for (const m of allSource.matchAll(/playStage\('([a-zA-Z]+)'\)/g)) {
    assert.ok(stageKeys.has(m[1]) || special.has(m[1]), `playStage('${m[1]}') has no STAGE_BGM entry`);
  }
  for (const m of allSource.matchAll(/bgmTrack\s*[:=]\s*'([a-zA-Z]+)'/g)) {
    assert.ok(stageKeys.has(m[1]) || special.has(m[1]), `bgmTrack '${m[1]}' has no STAGE_BGM entry`);
  }
  for (const m of allSource.matchAll(/bgm:\s*'([a-zA-Z]+)'/g)) {
    assert.ok(stageKeys.has(m[1]) || special.has(m[1]), `scene bgm '${m[1]}' has no STAGE_BGM entry`);
  }
  for (const m of allSource.matchAll(/BGM\.play\('([a-zA-Z_]+)'\)/g)) {
    assert.ok(sunoKeys.has(m[1]), `BGM.play('${m[1]}') has no SUNO_BGM entry`);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const referenced = new Set([...allSource.matchAll(/'\.\.\/bgm\/([^']+\.(?:ogg|mp3))'/g)].map((m) => m[1]));
  assert.ok(referenced.size >= 20, 'expected the BGM/SE tables to reference a meaningful number of files');
  for (const rel of referenced) {
    assert.ok(fs.existsSync(path.join(repoRoot, 'bgm', rel)), `bgm/${rel} is referenced by src but does not exist`);
  }
}

console.log('stage-bgm-state-test: ok');
