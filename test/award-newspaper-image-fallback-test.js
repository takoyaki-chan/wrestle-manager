'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const management = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');

function body(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} is missing`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end >= 0 ? end : source.length);
}

const bestMatch = body(ui, '_buildBestMatchAward');
const resolveAwardFighter = body(ui, '_awResolveAwardFighter');
const selectBestMatchStart = management.indexOf('  selectBestMatch(rng, state) {');
const selectBestMatchEnd = management.indexOf('\n  /** ③ MVP:', selectBestMatchStart);
assert.ok(selectBestMatchStart >= 0 && selectBestMatchEnd > selectBestMatchStart, 'selectBestMatch is missing');
const selectBestMatch = management.slice(selectBestMatchStart, selectBestMatchEnd);
const topStory = body(render, '_npV3TopStory');

assert.ok(bestMatch.includes('_awResolveAwardFighter(d.fighter1)'), 'best-match left participant must resolve stale IDs');
assert.ok(bestMatch.includes('_awResolveAwardFighter(d.fighter2)'), 'best-match right participant must resolve stale IDs');
assert.ok(resolveAwardFighter.includes('G.aiOrgs') && resolveAwardFighter.includes('ALL_CHARS'),
  'award portraits must recover fighters after transfers or releases');
assert.ok(selectBestMatch.includes('Object.values(state.aiOrgs || {})'),
  'new best-match snapshots must retain IDs for fighters outside the player roster');
assert.ok(topStory.includes('const photoBg = isTagPhoto ? \'\' : _npPhotoBg(primaryId, ts);'),
  'top stories must resolve a generic event photo when no fighter is attached');
assert.ok(topStory.includes('const photoHtml = (isTagPhoto || photoBg)'),
  'a generic event photo must render in the v3 top-story frame');
assert.ok(render.includes("tenchosenAnnounce: 'arena_ext'"), 'tenchosen announcement must use the arena event-image set');

console.log('award-newspaper-image-fallback-test: ok');
