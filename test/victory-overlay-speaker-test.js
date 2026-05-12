const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readSource(file) {
  return fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8').replace(/\r\n/g, '\n');
}

const single = readSource('battle-engine-main.js');
const singleQuoteIdx = single.indexOf('const vLine = winner');
assert.ok(singleQuoteIdx >= 0, 'single-match victory quote must be selected from winner');

const bottomIdx = single.indexOf('<div class="vic-bottom" id="rBottom">', singleQuoteIdx);
assert.ok(bottomIdx > singleQuoteIdx, 'single-match victory overlay must render an identity card under the quote');

const statsIdx = single.indexOf('<div class="vic-stats">', bottomIdx);
assert.ok(statsIdx > bottomIdx, 'single-match victory identity card must be followed by stats');

const singleSpeakerCard = single.slice(bottomIdx, statsIdx);
assert.ok(singleSpeakerCard.includes('_getFaceUrl(winner)'), 'single-match quote card must use the winner portrait');
assert.ok(singleSpeakerCard.includes('escHtml(winner.name)'), 'single-match quote card must use the winner name');
assert.ok(singleSpeakerCard.includes('WINNER'), 'single-match quote card must label the speaker as WINNER');
assert.ok(!singleSpeakerCard.includes('_getFaceUrl(loser)'), 'single-match quote card must not show the loser portrait');
assert.ok(!singleSpeakerCard.includes('escHtml(loser.name)'), 'single-match quote card must not show the loser name');

const tag = readSource('tag-battle-main.js');
const tagQuoteIdx = tag.indexOf('const winLine = pickTagWinLine');
assert.ok(tagQuoteIdx >= 0, 'tag-match victory quote must be selected from the winning finisher');

const tagWinLineIdx = tag.indexOf('vic-win-line', tagQuoteIdx);
assert.ok(tagWinLineIdx > tagQuoteIdx, 'tag-match victory overlay must render a winner line');

const tagLoserIdx = tag.indexOf('const loserEl = document.getElementById(\'vicLoser\')', tagWinLineIdx);
assert.ok(tagLoserIdx > tagWinLineIdx, 'tag-match loser block must be separate from the winner line');

const tagWinnerLine = tag.slice(tagWinLineIdx, tagLoserIdx);
assert.ok(tagWinnerLine.includes('winFinisher.name'), 'tag-match winner quote must name the winning finisher as speaker');
assert.ok(!tagWinnerLine.includes('lossPinned.name'), 'tag-match winner quote must not name the pinned loser as speaker');

console.log('victory-overlay-speaker-test: ok');
