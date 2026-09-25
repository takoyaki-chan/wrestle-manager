const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractMethodBody(signature, nextMarker) {
  const startToken = `${signature} {`;
  const start = appSource.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} block not found`);
  const bodyStart = start + startToken.length;
  let depth = 1;
  for (let i = bodyStart; i < appSource.length; i++) {
    if (appSource[i] === '{') depth++;
    else if (appSource[i] === '}') depth--;
    if (depth === 0) return appSource.slice(bodyStart, i);
  }
  throw new Error(`${signature} block end not found`);
}

const fillMissingBody = extractMethodBody('_fillMissingShowPreviewResults()', '_afterMatchSettle(idx, opts)');
const skipAllMatchesBody = extractMethodBody('skipAllMatches()', '// Post-processing: apply titles, popularity, injuries (mirrors Engine.executeShow logic)');

const runFillMissing = new Function('App', 'G', `${fillMissingBody}`);
const runSkipAllMatches = new Function('App', 'G', 'Engine', 'Audio', `${skipAllMatchesBody}`);

(function testSkipAllMatchesSimulatesTagMatches() {
  let finalized = 0;
  const tagResult = { winner: 'teamA', mq: 77, finType: 'pin', finMove: 'Combo', turns: 14, log: [], matchType: 'tag' };
  const App = {
    _showPreview: {
      validMatches: [
        {
          matchType: 'tag',
          teamA: { fighter1: 1, fighter2: 2 },
          teamB: { fighter1: 3, fighter2: 4 },
        },
      ],
      results: [null],
    },
    _fillMissingShowPreviewResults() {
      return runFillMissing(App, G);
    },
    finalizeShow() {
      finalized += 1;
    },
  };
  const G = {
    rngSeed: 123,
    season: 1,
    week: 2,
    roster: [
      { id: 1, name: 'A1' },
      { id: 2, name: 'A2' },
      { id: 3, name: 'B1' },
      { id: 4, name: 'B2' },
    ],
    relationships: {},
  };
  // K-12: 通常興行のタッグ戦は4経路とも Engine.showTagMatch.simulate を通す。
  // 乱数・絆・タッグ経験・不仲ペナルティの中身は test/tag-discord-penalty-test.js が実エンジンで見る。
  const rosterAfterMatch = G.roster.map(c => ({ ...c }));
  const Engine = {
    battle: {
      simulateMatch() { throw new Error('singles simulation should not run for tag matches'); },
    },
    tagMatch: {
      simulateTagMatch() { throw new Error('skipAllMatches must go through Engine.showTagMatch.simulate'); },
    },
    showTagMatch: {
      simulate(state, teamA, teamB, extraOpts) {
        assert.strictEqual(state, G);
        assert.strictEqual(teamA.fighter1.id, 1);
        assert.strictEqual(teamA.fighter2.id, 2);
        assert.strictEqual(teamB.fighter1.id, 3);
        assert.strictEqual(teamB.fighter2.id, 4);
        assert.strictEqual(extraOpts, undefined, 'skip-all does not record frames');
        return { result: tagResult, roster: rosterAfterMatch, lowBondIds: [], bondA: 50, bondB: 50 };
      },
    },
  };
  const Audio = {
    play() {},
  };

  runSkipAllMatches(App, G, Engine, Audio);

  assert.strictEqual(finalized, 1);
  assert.strictEqual(App._showPreview.results[0], tagResult);
  assert.strictEqual(G.roster, rosterAfterMatch, 'skip-all writes back the post-match roster (discord trust -1)');
})();

(function testSkipAllMatchesMarksMissingTagRosterAsStale() {
  let finalized = 0;
  const App = {
    _showPreview: {
      validMatches: [
        {
          matchType: 'tag',
          teamA: { fighter1: 1, fighter2: 2 },
          teamB: { fighter1: 3, fighter2: 4 },
        },
      ],
      results: [null],
    },
    _fillMissingShowPreviewResults() {
      return runFillMissing(App, G);
    },
    finalizeShow() {
      finalized += 1;
    },
  };
  const G = {
    rngSeed: 123,
    season: 1,
    week: 2,
    roster: [
      { id: 1, name: 'A1' },
      { id: 2, name: 'A2' },
      { id: 3, name: 'B1' },
    ],
    relationships: {},
  };
  const Engine = {
    rng: {
      derive() { throw new Error('rng should not run when tag roster is incomplete'); },
      create() { throw new Error('rng should not run when tag roster is incomplete'); },
    },
    battle: {
      simulateMatch() { throw new Error('singles simulation should not run for tag matches'); },
    },
    tagExp: {
      getCount() { throw new Error('tag exp should not run when tag roster is incomplete'); },
    },
    tagMatch: {
      simulateTagMatch() { throw new Error('tag simulation should not run when tag roster is incomplete'); },
    },
    showTagMatch: {
      simulate() { throw new Error('tag simulation should not run when tag roster is incomplete'); },
    },
  };
  const Audio = {
    play() {},
  };

  runSkipAllMatches(App, G, Engine, Audio);

  assert.strictEqual(finalized, 1);
  assert.deepStrictEqual(App._showPreview.results[0], {
    winner: 'draw',
    mq: 0,
    finType: '',
    finMove: '',
    turns: 0,
    log: [],
    _stale: true,
    matchType: 'tag',
  });
})();

console.log('show-preview-tag-skip-test: ok');
