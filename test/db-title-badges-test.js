'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function extractFunction(name) {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' must be defined');
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('could not extract ' + name);
}

const context = { Set, Number };
vm.runInNewContext(
  extractFunction('_dbBuildTournamentTitleChampions') + '\n'
  + extractFunction('_dbBuildFighterTitleBadges') + '\n'
  + 'this.build = _dbBuildTournamentTitleChampions; this.badges = _dbBuildFighterTitleBadges;',
  context
);

const fighter = (id, history) => ({ id, careerRecord: { history } });
const gameState = {
  roster: [
    fighter(1, [
      { type: 'juniorTournament', season: 1, result: 'champion' },
      { type: 'autumnWar', season: 1, result: 'champion' },
      { type: 'ppvMainEvent', season: 1, isSummit: true, won: true },
      { type: 'ppvTournament', season: 4, result: 'champion' },
    ]),
    fighter(2, [{ type: 'juniorTournament', season: 2, result: 'champion' }]),
    fighter(3, [{ type: 'autumnWar', season: 2, result: 'champion' }]),
  ],
  aiOrgs: {
    org_a: { roster: [fighter(4, [{ type: 'ppvMainEvent', season: 2, isSummit: true, won: true }])] },
    org_b: { roster: [fighter(5, [{ type: 'ppvTournament', season: 8, result: 'champion' }])] },
  },
  freeAgents: [fighter(6, [{ type: 'juniorTournament', season: 2, result: 'runnerUp' }])],
  retiredFighters: [fighter(7, [{ type: 'autumnWar', season: 2, result: 'champion' }])],
};
const allFighters = [
  ...gameState.roster,
  ...gameState.aiOrgs.org_a.roster,
  ...gameState.aiOrgs.org_b.roster,
  ...gameState.freeAgents,
  ...gameState.retiredFighters,
];
const titles = context.build(allFighters);

assert.deepStrictEqual([...titles.junior.ids], [2], 'ジュニアは直近開催の優勝者だけを保持する');
assert.deepStrictEqual([...titles.autumn.ids].sort((a, b) => a - b), [3, 7], '秋対抗戦は直近開催で同時に優勝した全選手を保持する');
assert.deepStrictEqual([...titles.ppv.ids], [4], 'PPVは直近のサミット勝者だけを保持する');
assert.deepStrictEqual([...titles.summit.ids], [5], '天頂戦は次回天頂戦まで直近優勝者だけを保持する');
assert.ok(!titles.junior.ids.has(1) && !titles.autumn.ids.has(1) && !titles.ppv.ids.has(1) && !titles.summit.ids.has(1),
  '前シーズンの優勝者には大会バッジが残らない');

const allCurrentTitles = {
  summit: { season: 8, ids: new Set([8]) },
  ppv: { season: 2, ids: new Set([8]) },
  junior: { season: 2, ids: new Set([8]) },
  autumn: { season: 2, ids: new Set([8]) },
};
const multi = context.badges(8, new Set([8]), allCurrentTitles, new Set([8]), 2);
const emojiOrder = [...multi.matchAll(/>([^<]+)<\/span>/g)].map(match => match[1]);
assert.deepStrictEqual(emojiOrder, ['👑', '⛰️', '🏆', '🏟️', '⚔️', '🌸'], '複数称号は規定の格順に並ぶ');
assert.match(multi, /title="王座保持者"/, '王座バッジには日本語ツールチップがある');
assert.match(multi, /title="天頂戦優勝\(第8回\)"/, '大会バッジには回数入りの日本語ツールチップがある');
assert.match(multi, /--db-title-color:var\(--ev-summer\)/, '大会色はトークンを経由する');

const malformed = context.build([
  { id: undefined, careerRecord: { history: [{ type: 'juniorTournament', season: 3, result: 'champion' }] } },
  fighter(9, [{ type: 'juniorTournament', season: undefined, result: 'champion' }]),
]);
const malformedHtml = context.badges(9, new Set(), malformed, new Set(), undefined);
assert.ok(!malformedHtml.includes('undefined') && !malformedHtml.includes('NaN'), '不完全な履歴でもundefined/NaNを表示しない');

assert.ok(html.includes('--db-title-spring: #ff6f9c;'), '既存春タッグ色はトークンとして定義される');
assert.ok(html.includes('.db-title-badge{') && html.includes('white-space:nowrap'), 'バッジは折り返さない');
assert.ok(!extractFunction('_dbBuildFighterTitleBadges').includes('#'), '追加バッジの色は16進カラーを直接使わない');
assert.ok(source.includes('...(G.retiredFighters || [])'), 'DB一覧は引退者も同じ称号判定の対象に含める');

console.log('db-title-badges-test: ok');
