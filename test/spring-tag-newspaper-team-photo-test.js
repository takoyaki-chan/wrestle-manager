'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const uiSource = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

function extractFunctionBody(source, signature) {
  const startToken = `${signature} {`;
  const start = source.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} not found`);
  const bodyStart = start + startToken.length;
  let depth = 1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(bodyStart, i);
  }
  throw new Error(`${signature} end not found`);
}

assert.match(uiSource, /function _npSpringTagStoryIds\(state, story, seasonNum\)/,
  'spring tag newspaper must resolve a two-wrestler photo set');
assert.match(uiSource, /league\.announcedSeason === seasonNum/,
  'pre-fix saves must recover champion IDs only from the matching tournament season');
assert.match(uiSource, /best\.awardedSeason === seasonNum/,
  'pre-fix saves must also recover the matching best-tag record');
assert.match(uiSource, /_npTopTagPhotoHtml\(tagPhotoIds\)/,
  'page-one rendering must emit the paired champion photo');
assert.match(uiSource, /tsName = photoIds[\s\S]*?\.join\('\s\/\s'\)/,
  'the paired photo caption must name both wrestlers');

const resolveIds = new Function('state', 'story', 'seasonNum',
  extractFunctionBody(uiSource, 'function _npSpringTagStoryIds(state, story, seasonNum)'));
assert.deepStrictEqual(resolveIds({}, { type: 'springTagResult', characterIds: [11, 12] }, 3), [11, 12],
  'newspapers generated after the fix must use their stored pair IDs');
assert.deepStrictEqual(resolveIds({
  springTagLeague: {
    announcedSeason: 3, champion: 'player', cancelled: false,
    teams: [{ orgId: 'player', f1Id: 21, f2Id: 22 }],
  },
}, { type: 'springTagResult' }, 3), [21, 22],
  'a pre-fix current newspaper must recover the matching tournament pair');
assert.deepStrictEqual(resolveIds({
  springTagLeague: {
    announcedSeason: 4, champion: 'player', cancelled: false,
    teams: [{ orgId: 'player', f1Id: 31, f2Id: 32 }],
  },
  bestTagTeam: { awardedSeason: 3, f1Id: 41, f2Id: 42 },
}, { type: 'springTagResult' }, 3), [41, 42],
  'a pre-fix back number must not borrow the following season tournament pair');
assert.deepStrictEqual(resolveIds({
  springTagLeague: {
    announcedSeason: 4, champion: 'player', cancelled: false,
    teams: [{ orgId: 'player', f1Id: 31, f2Id: 32 }],
  },
  bestTagTeam: { awardedSeason: 4, f1Id: 41, f2Id: 42 },
}, { type: 'springTagResult' }, 3), [],
  'unrelated seasons must not show a false champion pair');

assert.match(htmlSource, /\.np-top-tag-photo-member\s*\{[^}]*width:\s*58%/,
  'each wrestler must occupy enough width to overlap slightly');
assert.match(htmlSource, /\.np-top-tag-photo-member-1\s*\{[^}]*left:\s*0[^}]*z-index:\s*1/,
  'the first wrestler must be positioned on the left layer');
assert.match(htmlSource, /\.np-top-tag-photo-member-2\s*\{[^}]*right:\s*0[^}]*z-index:\s*2/,
  'the second wrestler must overlap from the right layer');

console.log('spring-tag-newspaper-team-photo-test: ok');
