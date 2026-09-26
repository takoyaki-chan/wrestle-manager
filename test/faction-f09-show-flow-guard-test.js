const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(start, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

// 興行の最中(showResultOverlay の殻が active のまま)に出す派閥の画面は、殻を「開いている別の画面」と
// 見なさない。F09 は 6cbf231e、F08 の試合前・試合後と派閥内序列戦の試合前・試合後は 2026-09-26
// (点火 faction-f08 で、F08 の試合後の画面が殻の後ろに積まれたまま興行が止まるのを発見)
const functionNames = [
  'showFactionF09OpeningModal',
  'showFactionF09MatchPreModal',
  'showFactionF09MatchPostModal',
  'showFactionF09EndingModal',
  'showFactionF08PreMatchModal',
  'showFactionF08AftermathModal',
  'showInternalChallengePreModal',
  'showInternalChallengePostModal',
];

for (const name of functionNames) {
  const build = new Function(
    '_isPopupActive',
    '_popupQueue',
    `${functionSource(name)}; return ${name};`
  );

  const checkedOptions = [];
  const popupQueue = [];
  const fn = build(
    (opts) => {
      checkedOptions.push(opts);
      // Simulate showResultOverlay being the only active overlay.
      return !(opts && opts.ignoreShowResultOverlay);
    },
    popupQueue
  );

  let continued = 0;
  fn(null, {}, () => { continued += 1; });

  assert.strictEqual(continued, 1, `${name} should not wait behind the active show-result shell`);
  assert.strictEqual(popupQueue.length, 0, `${name} should not enter the popup queue for showResultOverlay`);
  assert.deepStrictEqual(
    checkedOptions[0],
    { ignoreShowResultOverlay: true },
    `${name} should ignore showResultOverlay when checking popup conflicts`
  );
}

console.log('faction-f09-show-flow-guard-test: ok');
