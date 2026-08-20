'use strict';

// 天頂戦の事前紙面は、人物がいれば肖像、いなければ大会画像へ落とす。
// 開催年の告知とエントリー開始の両方で、前回覇者・特別招待・注目候補を保存する回帰テスト。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

const root = path.join(__dirname, '..');
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src', 'data.js'), 'utf8');

const fighter = (id, name, extra = {}) => ({
  id, name, pw: 65, sp: 65, te: 65, st: 65, mn: 65,
  popularity: 30, streak: 0, careerRecord: { history: [] }, ...extra,
});

const state = {
  season: 4, week: 1, ppvUnlocked: true, orgName: '戦妃門',
  roster: [fighter(101, '前回覇者'), fighter(102, '現MVP')],
  aiOrgs: { rival: { roster: [fighter(201, '特別招待'), fighter(202, '因縁の相手')], titles: { world: { championId: 201 } } } },
  titles: { world: { championId: 101 } },
  unifiedTitle: { championId: 101, orgId: 'player' },
  mvpRace: { rankings: [{ fighterId: 102, rank: 1 }] },
  h2h: { '102_202': { matches: 2 } },
};

const announcement = Engine.newspaper.buildTenchosenAnnouncementData(state);
assert.ok(announcement.characterIds.includes(101), '前回覇者を告知の肖像候補に残す');
assert.match(announcement.championWatch, /前回覇者/, '前回覇者への言及を残す');
assert.match(announcement.preview, /本紙が挙げる注目/, '実績ベースの注目選手を記事本文へ渡す');

const fieldState = {
  ...state,
  ppvTournament: {
    specialInvites: [{ id: 201, orgId: 'rival', kind: 'ranking' }],
    entries: [{ id: 101, orgId: 'player' }, { id: 201, orgId: 'rival', special: 'ranking' }, { id: 202, orgId: 'rival' }],
  },
};
const field = Engine.newspaper.buildTenchosenFieldData(fieldState);
assert.ok(field.characterIds.includes(201), '特別招待をエントリー記事の肖像候補に残す');
assert.match(field.invites, /特別招待/, '特別招待者名を見出し用データへ渡す');
assert.match(field.championWatch, /連覇/, '前回覇者の出場をエントリー記事で盛り上げる');

assert.match(render, /tenchosenFieldSet: 'arena_ext'/,
  '人物が紐付かない天頂戦記事は大会イベント画像へフォールバックする');
assert.match(render, /'tenchosenAnnounce', 'tenchosenFieldSet'/,
  '複数の主役がいる天頂戦記事は一面の並び肖像を使う');
assert.match(render, /np-v3-photo-kata-group.*?_npSubPhotoHtml\(story\)/s,
  '肩記事も複数主役なら肖像隊列を使う');
assert.match(render, /function _npV3JunTop\(story\)[\s\S]*?const photo = _npSubPhotoHtml\(story\)/,
  '準トップも人物なしを空白にせずイベント画像を表示する');
assert.match(data, /tenchosenFieldSet:/, '特別招待発表用の新聞テンプレートを持つ');

console.log('tenchosen-newspaper-preview-test: ok');
