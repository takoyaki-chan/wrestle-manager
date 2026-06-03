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

function makeFighter() {
  return {
    id: 909,
    name: 'Defense Counter',
    style: 'Allround',
    personality: 'normal',
    archetype: 'normal',
    age: 26,
    pw: 80,
    sp: 80,
    te: 80,
    st: 80,
    mn: 80,
    wins: 10,
    losses: 2,
    draws: 0,
    popularity: 70,
    careerBestMQ: 88,
    careerRecord: {
      history: [
        { type: 'debut', season: 1, week: 1 },
        { type: 'titleWin', season: 2, week: 1, beltId: 'world', orgName: 'Test Crown' },
        { type: 'titleDefense', season: 2, week: 8, beltId: 'world', orgName: 'Test Crown', count: 1 },
        { type: 'titleDefense', season: 2, week: 16, beltId: 'world', orgName: 'Test Crown', count: 2 },
        { type: 'titleLoss', season: 2, week: 24, beltId: 'world', orgName: 'Test Crown', defenses: 2 },
        { type: 'retire', season: 5, week: 1 },
      ],
      totalTitleWins: 1,
      totalDefenses: 2,
      peakOVR: 80,
      peakOVRSeason: 2,
      peakPopularity: 70,
      peakPopularitySeason: 2,
      juniorTournamentWins: 0,
      juniorTournamentAppearances: 0,
      ppvMainEventWins: 0,
    },
    traits: [],
  };
}

(function careerSummaryCountsEachReignOnce() {
  const summary = Engine.career.buildSummary(makeFighter());
  assert.strictEqual(summary.totalTitleWins, 1);
  assert.strictEqual(summary.totalDefenses, 2);
  assert.deepStrictEqual(summary.titleByOrg, [{ orgName: 'Test Crown', wins: 1, defenses: 2 }]);
})();

(function hallOfFameStatsCountEachReignOnce() {
  const fighter = makeFighter();
  const entry = Engine.awards._buildHofEntry(fighter, 'player', 'Test Org', { season: 5 });
  assert.strictEqual(entry.titleReigns, 1);
  assert.strictEqual(entry.totalDefenses, 2);
  assert.strictEqual(entry.careerRecord.totalTitleWins, 1);
  assert.strictEqual(entry.careerRecord.totalDefenses, 2);
  assert.strictEqual(Engine.awards.calcHofPoints(fighter.careerRecord), 3);
})();

(function hallOfFameIgnoresStaleDefenseCache() {
  const fighter = makeFighter();
  fighter.careerRecord.totalTitleWins = 4;
  fighter.careerRecord.totalDefenses = 12;

  const entry = Engine.awards._buildHofEntry(fighter, 'player', 'Test Org', { season: 5, rngSeed: 1 });
  assert.strictEqual(entry.titleReigns, 1);
  assert.strictEqual(entry.totalDefenses, 2);
  assert.strictEqual(entry.careerRecord.totalTitleWins, 1);
  assert.strictEqual(entry.careerRecord.totalDefenses, 2);

  const staleEntry = {
    ...entry,
    totalDefenses: 12,
    careerRecord: { ...fighter.careerRecord },
    hofPoints: 99,
    hofLevel: 3,
  };
  const applied = Engine.awards.applyHallOfFame({
    season: 5,
    retiredFighters: [fighter],
    retiredIds: [],
    retiredSeasons: {},
    allHallOfFame: { player: [], org_s: [], org_a: [], org_b: [] },
  }, [staleEntry]);
  assert.strictEqual(applied.hallOfFame[0].titleReigns, 1);
  assert.strictEqual(applied.hallOfFame[0].totalDefenses, 2);
  assert.strictEqual(applied.hallOfFame[0].careerRecord.totalDefenses, 2);
  assert.strictEqual(applied.hallOfFame[0].hofPoints, 3);
})();

console.log('title-defense-count-test: ok');
