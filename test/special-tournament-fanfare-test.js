const assert = require('assert');
const { readSource } = require('./helpers/source');

const app = readSource('src/app.js');
const ui = readSource('src/ui-common.js');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `${startMarker} missing`);
  assert.ok(end > start, `${endMarker} missing after ${startMarker}`);
  return source.slice(start, end);
}

(function testSpecialTournamentResultUsesApprovedAudioFile() {
  // Audio redesign phase 1 (f4dd425) swapped the championship jingle source from the
  // f10 mp3 to the WM Audio Mixer production set (WM-SE-RS04, formerly the J04
  // championship-belt-move theme). Assert on the CURRENT approved file, and that the
  // two prior sources are no longer used for this jingle.
  const playJingle = section(app, 'playJingle(name) {', 'stop() {');
  assert.ok(playJingle.includes("new window.Audio('../bgm/production-ogg/wm_se_rs04_v01.ogg')"));
  assert.ok(!playJingle.includes("new window.Audio('../bgm/f10_victory_fanfare_v5.mp3')"));
  assert.ok(!playJingle.includes("new window.Audio('../bgm/fanfare_brass_v1.mp3')"));
})();

(function testAutumnChampionAndMvpHaveSeparateCues() {
  // 音量そのものは bgm/audio-mixer.html で耳で決める値なので、数値を焼き付けない
  // （2026-07-27 の書き出しで .50 → .33 になり、この行だけで suite が落ちた）。
  // ここで守りたいのは「SE_MIX に明示の枠があること」であって、いくつであるかではない。
  assert.ok(/matchVictoryFanfare:\s*\.?\d/.test(app), 'f10 synth must have an explicit parent SFX mix');
  assert.ok(app.includes('matchVictoryFanfare() {'), 'parent audio system must implement the f10 synth sequence');
  assert.ok(app.includes('rawNoise(t + 0.9, 0.3, 0.03)'), 'f10 synth must retain its unfiltered noise hit');
  const autumnAudio = section(app, '_playAutumnWarChampionFanfare() {', 'finalizeAutumnWarReplay() {');
  assert.ok(autumnAudio.includes("Audio.bgm.playJingle('championship')"), 'champion result must play the approved special-tournament fanfare');
  assert.ok(autumnAudio.includes("Audio.play('matchVictoryFanfare')"), 'MVP must play the f10 synth fanfare');
  const mvp = section(app, 'awShowMvpScene() {', 'finalizeAutumnWarReplay() {');
  assert.ok(!mvp.includes("playJingle('championship')"), 'MVP must not replay the higher-value championship fanfare');
})();

(function testMvpDialogueIsAboveThePortrait() {
  const mvp = section(ui, 'function renderAutumnWarMvpScene()', 'function _awEntryScreenHtml()');
  assert.ok(mvp.includes('class="agw-mvp-speech"'));
  assert.ok(mvp.indexOf('class="agw-mvp-speech"') < mvp.indexOf('class="agw-mvp-portrait"'), 'speech bubble must render before and above the portrait');
  // 縦の並び順は優勝発表と共通: 吹き出し→画像→名前→役割→所属
  assert.ok(mvp.indexOf('class="agw-mvp-portrait"') < mvp.indexOf('class="agw-mvp-name"'), 'name must render below the portrait, not beside it');
  assert.ok(mvp.indexOf('class="agw-mvp-name"') < mvp.indexOf('class="agw-mvp-role"'), 'role label must follow the name');
})();

(function testMvpIsSmallerThanTheThreeChampions() {
  // MVPは優勝3名の「おまけ」。3名の表彰(大将 150x224)より格が上がってはいけない
  const css = readSource('src/index.html');
  const portrait = section(css, '.agw-mvp-portrait{', '}');
  const m = portrait.match(/width:(\d+)px;height:(\d+)px/);
  assert.ok(m, 'MVP portrait size must be declared in px');
  const aceW = 150;
  assert.ok(Number(m[1]) < aceW, `MVP portrait (${m[1]}px) must be smaller than the 大将 portrait (${aceW}px)`);
  assert.ok(!css.includes('.agw-mvp-copy'), '横並びの側カラムは廃止済み');
  assert.ok(!css.includes('.agw-mvp-figure'), '横並びのfigureラッパは廃止済み');
})();

console.log('special-tournament-fanfare-test: ok');
