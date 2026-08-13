'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const draft = fs.readFileSync(
  path.join(root, 'docs', 'dialogue', 'away-challenge-result-lines-draft-v0.1.md'),
  'utf8'
).replace(/\r\n/g, '\n');
const dataSource = fs.readFileSync(path.join(root, 'src', 'data.js'), 'utf8');
const { AWAY_CHALLENGE_RESULT_LINES } = require('../src/data.js');

function parseScene(markdown, startHeading, endHeading) {
  const start = markdown.indexOf(startHeading);
  const end = markdown.indexOf(endHeading, start + startHeading.length);
  assert.ok(start >= 0 && end > start, `${startHeading} section not found`);
  const parsed = {};
  for (const rawLine of markdown.slice(start, end).split('\n')) {
    const match = rawLine.match(/^- ([a-z]+)\[\d+\]: (.+)$/);
    if (!match) continue;
    if (!parsed[match[1]]) parsed[match[1]] = [];
    parsed[match[1]].push(match[2]);
  }
  return parsed;
}

const approved = {
  seriesWin: parseScene(draft, '## 場面1:', '## 場面2:'),
  regretOwnWin: parseScene(draft, '## 場面2:', '## 実装時の割当メモ'),
};

assert.deepStrictEqual(
  AWAY_CHALLENGE_RESULT_LINES,
  approved,
  '遠征結果42本が承認稿と一字一句一致すること'
);
assert.strictEqual(Object.values(AWAY_CHALLENGE_RESULT_LINES.seriesWin).flat().length, 21, '場面1は21本');
assert.strictEqual(Object.values(AWAY_CHALLENGE_RESULT_LINES.regretOwnWin).flat().length, 21, '場面2は21本');
for (const scene of Object.values(AWAY_CHALLENGE_RESULT_LINES)) {
  assert.deepStrictEqual(Object.keys(scene).sort(), ['composed', 'cool', 'delinquent', 'ojousama', 'polite', 'seductive', 'standard']);
  Object.values(scene).forEach(lines => assert.strictEqual(lines.length, 3, '各archetypeは3本'));
}
assert.ok(!/AWAY_CHALLENGE_RESULT_LINES\s*\[/.test(dataSource), '新テーブルへブラケット代入しない');

console.log('away-challenge-result-lines-test: ok');
