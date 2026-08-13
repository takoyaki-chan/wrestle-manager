'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { UNIFIED_TITLE_LINES, EVENT_LINES_BY_KEY } = require('../src/data.js');

const root = path.resolve(__dirname, '..');
const approvedDraft = fs.readFileSync(
  path.join(root, 'docs', 'dialogue', 'unified-title-lines-draft-v0.1.md'),
  'utf8'
);
const sceneKeys = [
  'coronation', 'return', 'challengerArrival', 'defenseWin',
  'beltLost', 'captureWin', 'challengeFailed',
];
const archetypes = [
  'standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive',
];

function parseApprovedLines(markdown) {
  const parsed = {};
  let sceneKey = null;
  let archetype = null;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const sceneHeading = rawLine.match(/^## 場面\d+ — `([A-Za-z]+)`/);
    if (sceneHeading) {
      sceneKey = sceneHeading[1];
      archetype = null;
      parsed[sceneKey] = {};
      continue;
    }
    if (rawLine === '---') {
      sceneKey = null;
      archetype = null;
      continue;
    }
    if (!sceneKey) continue;
    const archetypeHeading = rawLine.match(/^### ([a-z]+)\(/);
    if (archetypeHeading) {
      archetype = archetypeHeading[1];
      parsed[sceneKey][archetype] = [];
      continue;
    }
    const dialogue = rawLine.match(/^- `UT-[^`]+` (.+?) 〈[^〉]+〉/);
    if (dialogue && archetype) parsed[sceneKey][archetype].push(dialogue[1]);
  }
  return parsed;
}

const approved = parseApprovedLines(approvedDraft);
assert.deepStrictEqual(Object.keys(approved), sceneKeys, '承認稿の7場面を順番どおり取得する');
assert.deepStrictEqual(UNIFIED_TITLE_LINES, approved, '全国統一王座セリフ147本が承認稿と一字一句一致する');

let count = 0;
sceneKeys.forEach(sceneKey => {
  assert.deepStrictEqual(Object.keys(UNIFIED_TITLE_LINES[sceneKey]), archetypes, `${sceneKey}: 7口調を揃える`);
  archetypes.forEach(archetype => {
    assert.strictEqual(UNIFIED_TITLE_LINES[sceneKey][archetype].length, 3, `${sceneKey}.${archetype}: 3本`);
    count += UNIFIED_TITLE_LINES[sceneKey][archetype].length;
  });
  assert.strictEqual(EVENT_LINES_BY_KEY[sceneKey], UNIFIED_TITLE_LINES[sceneKey], `${sceneKey}: 動的マップに同一参照で登録する`);
});
assert.strictEqual(count, 147, '7場面×7口調×3本=147本');

console.log('unified-title-lines-test: ok');
