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
  const Engine = {
    rng: {
      derive(...args) { return args.join(':'); },
      create(seed) { return { seed }; },
    },
    battle: {
      simulateMatch() { throw new Error('singles simulation should not run for tag matches'); },
    },
    tagExp: {
      getCount() { return 0; },
    },
    tagMatch: {
      simulateTagMatch(teamA, teamB, rng, context) {
        assert.strictEqual(teamA.fighter1.id, 1);
        assert.strictEqual(teamA.fighter2.id, 2);
        assert.strictEqual(teamB.fighter1.id, 3);
        assert.strictEqual(teamB.fighter2.id, 4);
        assert.strictEqual(rng.seed, '123:1:2:1:3:31328');
        assert.deepStrictEqual(context, { bond_A: 50, bond_B: 50, tagExp_A: 0, tagExp_B: 0 });
        return tagResult;
      },
    },
  };
  const Audio = {
    play() {},
  };

  runSkipAllMatches(App, G, Engine, Audio);

  assert.strictEqual(finalized, 1);
  assert.strictEqual(App._showPreview.results[0], tagResult);
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
