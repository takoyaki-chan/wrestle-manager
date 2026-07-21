'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const tagBattle = fs.readFileSync(path.join(root, 'src', 'tag-battle-main.js'), 'utf8').replace(/\r\n/g, '\n');

function bracedBody(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const brace = source.indexOf('{', start);
  assert.ok(brace >= 0, `${signature} body start not found`);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(brace + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

const springWatch = bracedBody(app, 'stlWatchMatch()');
const springResult = bracedBody(app, '_receiveSpringTagLeagueBattleResult(data)');
const jtWatch = bracedBody(app, 'App.jtWatchMatch = function(roundIdx, matchIdx)');
const jtResult = bracedBody(app, 'App._receiveJTBattleResult = function(data)');
const jtAdvance = bracedBody(app, 'App.jtAdvanceAfterResult = function(roundIdx, matchIdx)');
const jtInternal = bracedBody(app, 'App._jtAdvanceInternal = function(roundIdx, matchIdx)');
const tcWatch = bracedBody(app, 'App.tcWatchMatch = function(roundIdx, matchIdx)');
const tcResult = bracedBody(app, 'App._receiveTcBattleResult = function(data)');
const tcAdvance = bracedBody(app, 'App.tcAdvanceAfterResult = function(roundIdx, matchIdx)');
const escapeBattle = bracedBody(app, 'escapeBattle()');
const tagFinishCue = bracedBody(tagBattle, 'function _notifyFinishCue()');
const finishListener = ui.slice(
  ui.indexOf("if (e.data && e.data.type === 'BATTLE_FINISH_CUE')"),
  ui.indexOf("if (e.data && e.data.type === 'MATCH_RESULT')")
);

assert.ok(springWatch.includes('preserveParentFileBgm: true'), 'Spring watch must preserve the active tournament track');
assert.ok(!springWatch.includes('Audio.fileBgm.stop()'), 'Spring watch must not stop the tournament track');
assert.ok(!springWatch.includes("Audio.bgm.play('battle')"), 'Spring watch must not switch to the standard battle BGM');
assert.ok(!springResult.includes('Audio.fileBgm.play('), 'Spring result must not restart the tournament track from the beginning');
assert.ok(!springResult.includes('Audio.bgm.stop()'), 'Spring result must not stop a replacement battle BGM');

for (const [label, watch, result, advance, championshipTransition] of [
  ['Junior Tournament', jtWatch, jtResult, jtAdvance, jtInternal],
  ['Tenchosen', tcWatch, tcResult, tcAdvance, tcAdvance],
]) {
  assert.ok(watch.includes('preserveParentFileBgm: true'), `${label} watch must preserve its active track through the result`);
  assert.ok(watch.includes("if (isFinal)") && watch.includes("iwashiro_elevate_perfect.ogg"), `${label} final must retain its dedicated big-match BGM switch`);
  assert.ok(!result.includes('Audio.fileBgm.fadeOut(') && !result.includes('Audio.fileBgm.stop()'), `${label} result must not stop or fade the active track`);
  assert.ok(!advance.includes('MusMus-BGM-052.mp3'), `${label} result advance must not restart the tournament loop from its beginning`);
  assert.ok(championshipTransition.includes('Audio.fileBgm.fadeOut(800)'), `${label} championship transition must still replace the final track with the fanfare`);
}

assert.ok(tagFinishCue.includes('S.matchInfo.preserveParentFileBgm'), 'tag battle finish cue must propagate the Spring preservation flag');
assert.ok(finishListener.includes('if (!e.data.preserveParentFileBgm)') && finishListener.includes('Audio.fileBgm.stop()'), 'the parent listener must preserve flagged tournaments while retaining ordinary-match stop behavior');
assert.ok(escapeBattle.includes('const preserveTournamentFileBgm') && escapeBattle.includes('if (!preserveTournamentFileBgm)'), 'escape must keep the active Spring/Summer/Autumn/Winter tournament track');

console.log('seasonal-tournament-bgm-continuity-test: ok');
