const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractMethodBody(signature, nextMarker) {
  const startToken = `${signature} {`;
  const start = appSource.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} block not found`);
  const bodyStart = start + startToken.length;
  const end = appSource.indexOf(`\n\n  ${nextMarker}`, bodyStart);
  if (end < 0) throw new Error(`${signature} block end not found`);
  const body = appSource.slice(bodyStart, end);
  return body.replace(/\n  \},\s*$/, '');
}

const fillMissingBody = extractMethodBody('_fillMissingShowPreviewResults()', '// Skip a single match');
const skipMatchBody = extractMethodBody('skipMatch(idx)', '// Watch match in battle engine iframe');
const watchMatchBody = extractMethodBody('watchMatch(idx)', '// タッグマッチを tag-battle.html で観戦');

const runFillMissing = new Function('App', 'G', `${fillMissingBody}`);
const runSkipMatch = new Function('App', 'G', 'Engine', 'Audio', 'renderMatchPreview', 'idx', `${skipMatchBody}`);
const runWatchMatch = new Function('App', 'G', 'renderMatchPreview', 'idx', `${watchMatchBody}`);

(function testFillMissingMarksStaleResults() {
  const App = {
    _showPreview: {
      validMatches: [{ left: 1, right: 2 }],
      results: [null],
    },
  };
  const G = { roster: [{ id: 1, name: 'Alice' }] };

  const filled = runFillMissing(App, G);

  assert.strictEqual(filled, true);
  assert.deepStrictEqual(App._showPreview.results[0], {
    winner: 'draw',
    mq: 0,
    finType: '',
    finMove: '',
    turns: 0,
    log: [],
    _stale: true,
  });
})();

(function testSkipMatchFinalizesWhenTargetIsMissing() {
  let renderCalls = 0;
  let finalizeCalls = 0;
  const App = {
    _showPreview: {
      validMatches: [{ left: 1, right: 2 }],
      results: [null],
    },
    _fillMissingShowPreviewResults() {
      return runFillMissing(App, G);
    },
    finalizeShow() {
      finalizeCalls += 1;
    },
  };
  const G = { roster: [{ id: 1, name: 'Alice' }] };
  const Engine = {
    rng: {
      create() { throw new Error('simulate should not run'); },
      derive() { throw new Error('simulate should not run'); },
    },
    battle: {
      simulateMatch() { throw new Error('simulate should not run'); },
    },
  };
  const Audio = { play() { throw new Error('audio should not run'); } };

  runSkipMatch(App, G, Engine, Audio, () => { renderCalls += 1; }, 0);

  assert.strictEqual(renderCalls, 1);
  assert.strictEqual(finalizeCalls, 1);
  assert.strictEqual(App._showPreview.results[0]._stale, true);
})();

(function testWatchMatchDoesNotEnterWatchingForMissingTarget() {
  let renderCalls = 0;
  let finalizeCalls = 0;
  const App = {
    _showPreview: {
      validMatches: [{ left: 1, right: 2 }],
      results: [null],
      currentWatching: -1,
    },
    _fillMissingShowPreviewResults() {
      return runFillMissing(App, G);
    },
    finalizeShow() {
      finalizeCalls += 1;
    },
  };
  const G = { roster: [{ id: 1, name: 'Alice' }] };

  runWatchMatch(App, G, () => { renderCalls += 1; }, 0);

  assert.strictEqual(renderCalls, 1);
  assert.strictEqual(finalizeCalls, 1);
  assert.strictEqual(App._showPreview.currentWatching, -1);
  assert.strictEqual(App._showPreview.results[0]._stale, true);
})();

console.log('show-preview-stale-guard-test: ok');
