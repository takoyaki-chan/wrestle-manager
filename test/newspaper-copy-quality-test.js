'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = fs.readFileSync(path.join(root, 'src', 'data.js'), 'utf8');
const extractor = fs.readFileSync(path.join(root, 'tools', 'extract-dialogue.js'), 'utf8');

const start = data.indexOf('const NEWS_HEADLINE_TEMPLATES = {');
const end = data.indexOf('\n};', start);
assert.ok(start >= 0 && end > start, 'NEWS_HEADLINE_TEMPLATES が見つからない');
const newspaperTemplates = data.slice(start, end + 3);

[
  '戴冠を残した',
  'が{enemy}を距離を取り始めた',
  'bond ≤30',
  'OVR上位常連',
  'OVR{ovr}',
  '王座を戴冠',
].forEach((badCopy) => {
  assert.ok(!newspaperTemplates.includes(badCopy), `新聞記事に不適切な表現が残っている: ${badCopy}`);
});

[
  "T('RETIREMENT_TEMPLATES', 'data.js', '10')",
  "T('DRAFT_PLAYER_RESULT_PARTS', 'data.js', '10')",
  "T('CHAMPION_CHANGE_TEMPLATES', 'data.js', '10')",
].forEach((entry) => {
  assert.ok(extractor.includes(entry), `新聞記事の抽出対象が不足している: ${entry}`);
});

console.log('newspaper-copy-quality-test: PASS');
