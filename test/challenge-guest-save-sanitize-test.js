'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function methodBody(signature) {
  const token = `${signature} {`;
  const start = app.indexOf(token);
  assert.ok(start >= 0, `${signature} must exist`);
  const bodyStart = start + token.length;
  let depth = 1;
  for (let i = bodyStart; i < app.length; i++) {
    if (app[i] === '{') depth++;
    else if (app[i] === '}') depth--;
    if (depth === 0) return app.slice(bodyStart, i);
  }
  throw new Error(`${signature} end not found`);
}

let serializedJson = '';
const serialize = new Function(
  'SAVE_TRIM',
  'LZString',
  'SAVE_COMPRESS_MARKER',
  'Storage',
  `return function serialize(G, saveNameOverride) {${methodBody('serialize(G, saveNameOverride)')}};`
)(
  { gameLogMax: 200, growthLogMax: 100, financeKeepSeasons: 2, matchupLogMax: 60, aiMatchupLogMax: 40, h2hHistoryMax: 50 },
  { compressToUTF16(json) { serializedJson = json; return json; } },
  'WM_LZ|',
  { _sanitizeSaveNameLabel() { return ''; } }
);

serialize({
  season: 2,
  roster: [
    { id: 1, name: 'Own' },
    { id: 101, name: 'Away guest', isAwayChallengeGuest: true },
    { id: 102, name: 'Incoming guest', isCRGuest: true },
    { id: 103, name: 'B3 guest', isB3ChallengeGuest: true },
    { id: 105, name: 'Unified-title guest', isUnifiedTitleGuest: true },
    // レンタル元の一時フラグが紛れ込んでいても、契約済み選手は保存対象。
    { id: 104, name: 'Rental', isRental: true, isAwayChallengeGuest: true },
  ],
  gameLog: [],
  debugLog: [],
}, undefined);

const saved = JSON.parse(serializedJson);
assert.deepStrictEqual(saved.roster.map(f => f.id), [1, 104], 'temporary challenge opponentsだけを除外し、契約中レンタルは保持する');

console.log('challenge-guest-save-sanitize-test: ok');
