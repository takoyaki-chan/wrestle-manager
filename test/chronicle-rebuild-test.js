#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('data.js');
loadAsGlobal('management.js');

function makeRetiredFighter(id = 101) {
  return {
    id,
    name: '年代記 テスト',
    style: 'striker',
    personality: 'normal',
    archetype: 'normal',
    age: 25,
    pw: 88,
    sp: 86,
    te: 82,
    st: 84,
    mn: 80,
    pop: 88,
    careerRecord: {
      history: [
        { type: 'debut', season: 1 },
        { type: 'titleWin', season: 2, orgName: 'Test Org' },
        { type: 'awardMVP', season: 4 },
        { type: 'retire', season: 5 }
      ],
      totalTitleWins: 2,
      totalDefenses: 4,
      peakOVR: 88,
      peakOVRSeason: 4
    },
    traits: []
  };
}

(function refreshBuildsConfirmedChapterFromArchive() {
  let state = {
    rngSeed: 42,
    season: 25,
    orgName: 'Test Org',
    roster: [],
    chronicle: Engine.chronicle.createEmpty()
  };

  const retired = makeRetiredFighter();
  state = Engine.chronicle.archiveFighter(state, retired);
  state = Engine.chronicle.applySpiritContribution(state, retired);

  assert.strictEqual(state.chronicle.chaptersCache.chapters.length, 0);

  state = Engine.chronicle.refreshChapters(state);
  const chapters = state.chronicle.chaptersCache.chapters;

  assert.ok(chapters.length > 0, 'refreshChapters should build chapters');
  assert.ok(chapters.some(c => c.status === 'confirmed'), 'retired-only era should become confirmed');
})();

(function chapterStatusOnlyHidesActiveLatestChapter() {
  assert.strictEqual(
    Engine.chronicle._chapterStatus({ seasonStart: 14, seasonEnd: 21, _hasActiveParticipants: true }, false),
    'confirmed',
    'previous chapter should confirm even if side participants are still active'
  );
  assert.strictEqual(
    Engine.chronicle._chapterStatus({ seasonStart: 22, seasonEnd: 26, _hasActiveParticipants: true }, true),
    'in_progress',
    'active latest chapter should remain in progress'
  );
  assert.strictEqual(
    Engine.chronicle._chapterStatus({ seasonStart: 1, seasonEnd: 5, _hasActiveParticipants: false }, true),
    'confirmed',
    'retired-only chapter should confirm even when it is the only chapter'
  );
})();

console.log('chronicle-rebuild-test: ok');
