'use strict';

const assert = require('assert');
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

const resolverBody = extractFunction(appSource, 'function resolveActiveStageBgm(app)');
const resolveActiveStageBgm = new Function('app', resolverBody);

assert.strictEqual(resolveActiveStageBgm({}), null, 'ordinary screens must not claim a stage BGM');

assert.strictEqual(resolveActiveStageBgm({ _showPreview: { currentWatching: 0, validMatches: [{ isTitle: false }] } }), 'battle', 'ordinary watched show match must restore battle BGM');
assert.strictEqual(resolveActiveStageBgm({ _showPreview: { currentWatching: 0, validMatches: [{ isTitle: true }] } }), 'bigMatch', 'watched title match must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _showPreview: { currentWatching: 0, validMatches: [{ isTitle: true, teamA: {} }] } }), 'battle', 'watched title tag match must retain the tag-battle BGM choice');
assert.strictEqual(resolveActiveStageBgm({ _b3Preview: { watching: true } }), 'bigMatch', 'B3 challenge match must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _common1Preview: { watching: true } }), 'bigMatch', 'faction showdown must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _b2Preview: { watching: true } }), 'bigMatch', 'B2 special match must restore FB1');

assert.strictEqual(resolveActiveStageBgm({ _warPreview: { currentWatching: -1 } }), 'war', 'war card must restore FB3');
assert.strictEqual(resolveActiveStageBgm({ _warPreview: { currentWatching: 1 } }), 'bigMatch', 'watched war match must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _ppvPreview: { currentWatching: -1 } }), 'tournament', 'PPV card must restore FB2');
assert.strictEqual(resolveActiveStageBgm({ _ppvPreview: { currentWatching: 0 } }), 'bigMatch', 'watched PPV match must restore FB1');

assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'table' } }), 'tournament', 'Spring Tag board must restore FB2');
assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'watching' } }), 'tournament', 'Spring Tag match must keep FB2');
assert.strictEqual(resolveActiveStageBgm({ _stlPreview: { phase: 'champion' } }), 'preserve', 'Spring Tag champion fanfare must not be overwritten');

assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'board' } }), 'tournament', 'Autumn War board must restore FB2');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'watching' } }), 'tournament', 'Autumn War match must keep FB2');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'result' } }), 'preserve', 'Autumn War champion fanfare must not be overwritten');
assert.strictEqual(resolveActiveStageBgm({ _awPreview: { phase: 'mvp' } }), 'preserve', 'Autumn War MVP stinger must not be overwritten');

assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'bracket', bgmTrack: 'tournament' } }), 'tournament', 'JT bracket must restore FB2');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'watching', bgmTrack: 'bigMatch' } }), 'bigMatch', 'JT final watch must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'matchResult', bgmTrack: 'tournament' } }), 'tournament', 'JT skipped final result must keep FB2');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'bracket', bgmTrack: 'preserve' } }), 'preserve', 'JT final reveal must preserve its fanfare before the result screen opens');
assert.strictEqual(resolveActiveStageBgm({ _jtPreview: { phase: 'finalResult', bgmTrack: 'bigMatch' } }), 'preserve', 'JT champion screen must preserve its fanfare');

assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'bracket', bgmTrack: 'tournament' } }), 'tournament', 'Tenchosen bracket must restore FB2');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'watching', bgmTrack: 'bigMatch' } }), 'bigMatch', 'Tenchosen final watch must restore FB1');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'bracket', bgmTrack: 'preserve' } }), 'preserve', 'Tenchosen final reveal must preserve its fanfare before the result screen opens');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { phase: 'finalResult', bgmTrack: 'bigMatch' } }), 'preserve', 'Tenchosen champion screen must preserve its fanfare');
assert.strictEqual(resolveActiveStageBgm({ _tcPreview: { tvMode: true } }), null, 'Tenchosen TV mode must keep the ordinary state BGM');

const playForState = extractFunction(appSource, 'playForState()');
assert.ok(playForState.includes('resolveActiveStageBgm(App)'), 'playForState must consult the active stage before ordinary state fallbacks');
assert.ok(playForState.includes("if (stageBgm === 'preserve') return"), 'playForState must preserve terminal fanfares');
assert.ok(playForState.includes("if (stageBgm === 'battle')"), 'playForState must restore ordinary watched-match BGM');
assert.ok(playForState.includes('BGM.playStage(stageBgm)'), 'playForState must restore the resolved stage track');

for (const [key, file] of [
  ['tournament', 'MusMus-BGM-052.mp3'],
  ['war', 'MusMus-BGM-125.mp3'],
  // Audio redesign phase 1 (f4dd425) moved bigMatch to the production-ogg set (WM-M04).
  ['bigMatch', 'production-ogg/wm_bgm_m04_v01.ogg'],
]) {
  const mapping = new RegExp(`${key}:\\s*\\{ file: '\\.\\./bgm/${file.replace('.', '\\.')}'`);
  assert.ok(mapping.test(appSource), `${key} must retain its WM Audio Mixer file mapping`);
}

for (const key of ['tournament', 'war', 'bigMatch']) {
  assert.ok(appSource.includes(`playStage('${key}')`), `${key} stage track must use the centralized player`);
}

console.log('stage-bgm-state-test: ok');
