const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const ui = read('src/ui-common.js');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `${startMarker} missing`);
  assert.ok(end > start, `${endMarker} missing after ${startMarker}`);
  return source.slice(start, end);
}

(function testSpecialTournamentResultUsesApprovedMp3() {
  const playJingle = section(app, 'playJingle(name) {', 'stop() {');
  assert.ok(playJingle.includes("new window.Audio('../bgm/f10_victory_fanfare_v5.mp3')"));
  assert.ok(!playJingle.includes("new window.Audio('../bgm/fanfare_brass_v1.mp3')"));
})();

(function testAutumnChampionAndMvpHaveSeparateCues() {
  assert.ok(app.includes('matchVictoryFanfare:.50'), 'f10 synth must have an explicit parent SFX mix');
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
  const sideCopy = section(mvp, '<div class="agw-mvp-copy">', '</div>');
  assert.ok(!sideCopy.includes('blockquote'), 'dialogue must not remain in the side copy block');
})();

console.log('special-tournament-fanfare-test: ok');
