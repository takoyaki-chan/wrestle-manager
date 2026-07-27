'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractObjectMethodBody(signature) {
  const token = `${signature} {`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`${signature} not found`);
  const bodyStart = start + token.length;
  let depth = 1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(bodyStart, i);
  }
  throw new Error(`${signature} end not found`);
}

const serializeBody = extractObjectMethodBody('serialize(G, saveNameOverride)');
const SAVE_TRIM = {
  gameLogMax: 200, growthLogMax: 100, financeKeepSeasons: 2,
  matchupLogMax: 60, aiMatchupLogMax: 40, h2hHistoryMax: 50,
};
const SAVE_COMPRESS_MARKER = 'WM_LZ|';
const LZString = { compressToUTF16: value => value };
const Storage = { _sanitizeSaveNameLabel: () => '' };
const serialize = new Function(
  'G', 'saveNameOverride', 'SAVE_TRIM', 'SAVE_COMPRESS_MARKER', 'LZString', 'Storage',
  serializeBody
);

(function testRentalAndCardReferencesSurviveSaveWriting() {
  const state = {
    season: 2, week: 8,
    roster: [
      { id: 77, name: 'Rental 77', isRental: true, rentalSource: 'rival',
        rentalFromOrg: 'org_a', rentalWeeksLeft: 11, growthLog: [] },
      { id: 1, name: 'Owned', growthLog: [] },
    ],
    rentals: [{ fighterId: 77, fromSource: 'rival', fromOrgId: 'org_a', weeksLeft: 11, fee: 100 }],
    showCard: [{ matchType: 'singles', left: 77, right: 1, isTitle: false }],
    gameLog: [], debugLog: [], financeHistory: [], matchupLog: [], aiOrgs: {}, freeAgents: [],
  };

  const encoded = serialize(state, undefined, SAVE_TRIM, SAVE_COMPRESS_MARKER, LZString, Storage);
  const saved = JSON.parse(encoded.slice(SAVE_COMPRESS_MARKER.length));

  assert.ok(saved.roster.some(f => f.id === 77 && f.isRental));
  assert.deepStrictEqual(saved.rentals, state.rentals);
  assert.deepStrictEqual(saved.showCard, state.showCard);
})();

console.log('rental-save-roundtrip-test: ok');
