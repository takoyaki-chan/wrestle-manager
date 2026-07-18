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
    popularity: 55,
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
      peakOVRSeason: 4,
      peakPopularity: 88,
      peakPopularitySeason: 4
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

(function primeWindowFocusesPeakEra() {
  const prime = Engine.chronicle._primeWindow({
    careerSeasonsStart: 1,
    careerSeasonsEnd: 12,
    peakOVRSeason: 8,
    peakPopularitySeason: 8,
    careerRecord: { history: [] }
  });
  assert.deepStrictEqual(prime, { primeStart: 6, primeEnd: 10 });
})();

(function careerTracksPeakPopularity() {
  const fighter = Engine.career.updatePeakPopularity({
    id: 202,
    name: 'Peak Pop',
    popularity: 77,
    pw: 50,
    sp: 50,
    te: 50,
    st: 50,
    mn: 50,
    careerRecord: Engine.career.createRecord()
  }, 6);

  assert.strictEqual(fighter.careerRecord.peakPopularity, 77);
  assert.strictEqual(fighter.careerRecord.peakPopularitySeason, 6);
})();

(function archiveUsesCareerPeakPopularityOverCurrentPopularity() {
  let state = {
    rngSeed: 42,
    season: 12,
    orgName: 'Test Org',
    roster: [],
    chronicle: Engine.chronicle.createEmpty()
  };
  state = Engine.chronicle.archiveFighter(state, makeRetiredFighter(303));

  const archived = state.chronicle.fighterArchive.find(f => f.id === 303);
  assert.strictEqual(archived.peakPopularity, 88);
  assert.strictEqual(archived.peakPopularitySeason, 4);
  assert.strictEqual(archived.careerRecord.peakPopularity, 88);
})();

(function activeCandidatesUseCareerPeakPopularity() {
  const state = {
    season: 11,
    roster: [{
      id: 404,
      name: 'Active Peak',
      style: 'striker',
      personality: 'normal',
      popularity: 43,
      age: 24,
      pw: 70,
      sp: 70,
      te: 70,
      st: 70,
      mn: 70,
      careerRecord: {
        history: [{ type: 'debut', season: 3 }],
        peakOVR: 70,
        peakOVRSeason: 8,
        peakPopularity: 91,
        peakPopularitySeason: 9
      }
    }],
    chronicle: Engine.chronicle.createEmpty()
  };
  const candidate = Engine.chronicle._collectCandidates(state).find(f => f.id === 404);
  assert.strictEqual(candidate.peakPopularity, 91);
  assert.strictEqual(candidate.peakPopularitySeason, 9);
})();

(function highlightsSummarizeRepeatedEraEvents() {
  const chapter = { seasonStart: 1, seasonEnd: 5 };
  const ace = {
    id: 505,
    name: 'Summary Ace',
    careerRecord: {
      history: [
        { type: 'titleWin', season: 1, orgName: 'Test Title' },
        { type: 'titleWin', season: 3, orgName: 'Test Title' },
        { type: 'titleDefense', season: 2, orgName: 'Test Title', count: 3 },
        { type: 'titleDefense', season: 4, orgName: 'Test Title', count: 5 },
        { type: 'awardBestMatch', season: 2, mq: 88 },
        { type: 'awardBestMatch', season: 3, mq: 94 },
        { type: 'juniorTournament', season: 3, result: 'champion' },
        { type: 'juniorTournament', season: 4, result: 'champion' },
        { type: 'ppvMainEvent', season: 4, result: 'champion' },
        { type: 'ppvMainEvent', season: 5, result: 'champion' }
      ]
    }
  };
  const highlights = Engine.chronicle._buildHighlights(chapter, [ace], []);
  const text = highlights.map(h => h.text).join('\n');

  assert.ok(text.includes('2度戴冠'), 'title wins should be summarized');
  assert.ok(text.includes('5度防衛'), 'title defenses should keep the highest defense count');
  assert.ok(text.includes('ベストマッチ賞 2度受賞・2年連続'), 'best match awards should summarize repeats and streaks');
  assert.ok(text.includes('ジュニアトーナメント 2度優勝・2連覇'), 'junior tournament streaks should be summarized');
  assert.ok(text.includes('PPVメインイベント 2度制覇・2連覇'), 'PPV main event streaks should be summarized');
})();

(function chapterSegmentationUsesFourToSevenSeasonWindows() {
  const candidates = [
    { peakOVRSeason: 4, peakOVR: 80, peakPopularity: 70 },
    { peakOVRSeason: 9, peakOVR: 82, peakPopularity: 75 },
    { peakOVRSeason: 14, peakOVR: 84, peakPopularity: 80 },
    { peakOVRSeason: 20, peakOVR: 86, peakPopularity: 85 }
  ];
  const chapters = Engine.chronicle._segmentChapters(candidates, { season: 22 });
  assert.ok(chapters.length > 0, 'segmentation should create chapter bounds');
  chapters.forEach(ch => {
    const len = ch.seasonEnd - ch.seasonStart + 1;
    if (ch._fledgling) {
      assert.strictEqual(len, 2, 'fledgling chapter should cover seasons 1-2');
    } else {
      assert.ok(len >= 4 && len <= 7, `chapter length should be 4-7 seasons, got ${len}`);
    }
  });
})();

console.log('chronicle-rebuild-test: ok');
