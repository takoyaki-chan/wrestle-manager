'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

const root = path.resolve(__dirname, '..');
const dataSource = fs.readFileSync(path.join(root, 'src', 'data.js'), 'utf8');
const managementSource = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');

const announceTemplates = NEWS_HEADLINE_TEMPLATES.springTagAnnounce;
const resultTemplates = NEWS_HEADLINE_TEMPLATES.springTagResult;
assert.strictEqual(announceTemplates.length, 2, 'headline template pattern count must stay unchanged');
assert.strictEqual(resultTemplates.length, 2, 'result headline template pattern count must stay unchanged');
announceTemplates.forEach(template => {
  assert.match(template.headline + template.body, /チーム|ブロック/);
  assert.ok(!/出場4団体|4団体総当たり/.test(template.headline + template.body));
});
resultTemplates.forEach(template => {
  assert.match(template.body, /A・B|両ブロック/);
  assert.ok(!template.body.includes('4団体総当たり'));
});
assert.ok(dataSource.includes('A・Bブロックの総当たりを勝ち抜いた1位同士が、その日の決勝でぶつかります。'));
assert.ok(dataSource.includes('ブロック総当たりを勝ち抜き、決勝でも相棒と頂点をつかんだ。'));

assert.deepStrictEqual(BATTLE_POINT_CFG.springTag, { champion: 12, runnerUp: 5, third: 0, fourth: -8 });
assert.strictEqual(ACHIEVEMENT_CONFIG.pt.springTag, 8);
assert.match(managementSource, /springTagPt = hist\.filter\([\s\S]{0,100}\)\.length \* 3/,
  'Hall of Fame award must remain +3 per champion');

let state = Engine.createInitialState(96, true);
state = Engine.industryNews.push(state, {
  type: 'springTagAnnounce',
  data: {
    season: state.season,
    teamCount: 8,
    entrySummary: 'A団体 3枠、B団体 2枠、C団体 2枠、D団体 1枠',
    preview: '',
  },
});
const paper = Engine.newspaper.generate(state, Engine.rng.create(96));
assert.strictEqual(paper.topStory.type, 'springTagAnnounce');
assert.ok(!/[{}](teamCount|entrySummary)/.test(paper.topStory.headline + paper.topStory.body),
  'new announcement placeholders must be fully resolved');
assert.match(paper.topStory.headline + paper.topStory.body, /8チーム|計8チーム/);

console.log('spring-tag-league-v02-copy-test: ok');
