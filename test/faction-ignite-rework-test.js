'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));
const data = require('../src/data.js');

const rootDir = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(rootDir, file), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const norm = value => JSON.parse(JSON.stringify(value));

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

function parseApprovedIgniteLines() {
  const approved = { provoke: {}, respond: {} };
  let side = null;
  let archetype = null;
  for (const line of read('docs/dialogue/faction-ignite-and-challenge-lines-draft-v0.1.md').split('\n')) {
    if (line.startsWith('## 場面1 ')) { side = 'provoke'; archetype = null; continue; }
    if (line.startsWith('## 場面2 ')) { side = 'respond'; archetype = null; continue; }
    if (line.startsWith('## 場面3 ')) break;
    const heading = line.match(/^### (standard|ojousama|cool|delinquent|polite|composed|seductive)\(/);
    if (side && heading) {
      archetype = heading[1];
      approved[side][archetype] = [];
      continue;
    }
    const entry = line.match(/^- (.*?) 〈/);
    if (side && archetype && entry) approved[side][archetype].push(entry[1]);
  }
  return approved;
}

const approved = parseApprovedIgniteLines();
assert.deepStrictEqual(norm(data.FACTION_IGNITE_LINES), norm(approved),
  'FACTION_IGNITE_LINES は承認草案の宣戦・応戦42本と一字一句一致する');
assert.strictEqual(Object.values(data.FACTION_IGNITE_LINES.provoke).flat().length, 21, '宣戦セリフは21本');
assert.strictEqual(Object.values(data.FACTION_IGNITE_LINES.respond).flat().length, 21, '応戦セリフは21本');
assert.strictEqual(data.EVENT_LINES_BY_KEY.factionIgniteProvoke, data.FACTION_IGNITE_LINES.provoke,
  '宣戦テーブルを編集ブック用レジストリへ登録する');
assert.strictEqual(data.EVENT_LINES_BY_KEY.factionIgniteRespond, data.FACTION_IGNITE_LINES.respond,
  '応戦テーブルを編集ブック用レジストリへ登録する');

loadGame({ factions: true });

const state = {
  rngSeed: 42,
  season: 3,
  week: 9,
  factionPendingIgnite: { factionAId: 10, factionBId: 20, leaderAId: 1, leaderBId: 2 },
  factions: [
    { id: 10, name: '東派', leaderId: 1, memberIds: [1, 3, 999] },
    { id: 20, name: '西派', leaderId: 2, memberIds: [2] },
  ],
  roster: [
    { id: 1, name: '東リーダー', archetype: 'cool' },
    { id: 2, name: '西リーダー', archetype: 'polite' },
    { id: 3, name: '東メンバー', archetype: 'standard' },
    { id: 999, name: '生成メンバー', archetype: 'standard' },
  ],
  factionHostility: { '10>20': 75, '20>10': 62 },
};
const trigger = Engine.factions.checkF02IgniteTrigger(state, [{ left: 1, right: 2, matchType: 'single' }]);
assert.strictEqual(trigger.eligible, true, '従来どおりリーダー同士のシングル戦で発火する');
assert.deepStrictEqual(trigger.payload.memberIdsA, [1, 3, 999], '派閥AのID配列を返す');
assert.deepStrictEqual(trigger.payload.memberIdsB, [2], '派閥BのID配列を返す');
assert.strictEqual(trigger.payload.memberCountA, 3, '派閥Aの人数を返す');
assert.strictEqual(trigger.payload.memberCountB, 1, '派閥Bの人数を返す');
assert.deepStrictEqual(trigger.payload.membersA, ['東リーダー', '東メンバー', '生成メンバー'],
  '互換用の氏名配列は残す');

const modalRoot = { innerHTML: '', querySelector() { return null; } };
const showIgnite = new Function(
  '_isPopupActive', '_popupQueue', '_factionUpperUrl', 'escHtml', 'Engine', 'FACTION_IGNITE_LINES',
  '_factionF02StageMount', '_factionF02StageBtnBind',
  `${functionSource(ui, '_factionIgniteLine')};${functionSource(ui, 'showFactionF02IgniteModal')};return showFactionF02IgniteModal;`
)(
  () => false,
  [],
  id => id === 999 ? '' : `upper-${id}.webp`,
  value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  Engine,
  data.FACTION_IGNITE_LINES,
  html => { modalRoot.innerHTML = html; return modalRoot; },
  () => {}
);

const before = JSON.stringify(state);
showIgnite(trigger.payload, state, () => {});
assert.strictEqual(JSON.stringify(state), before, '表示とローカルセリフ抽選はGameStateを変更しない');
assert.ok(modalRoot.innerHTML.includes('泥沼'), '両方向の高い方を既存ラベルへ変換して中央表示する');
assert.strictEqual((modalRoot.innerHTML.match(/fevt-ign-member-chip(?: |")/g) || []).length, 4,
  'memberIds経由で所属人数分のupperチップを描画する');
assert.ok(modalRoot.innerHTML.includes('upper-3.webp'), 'チップはupper素材URLを使う');
assert.ok(modalRoot.innerHTML.includes('fevt-ign-member-chip fevt-ign-initial'),
  'upper素材がない生成選手はイニシャル表示へフォールバックする');
assert.doesNotMatch(modalRoot.innerHTML, /敵対度\s*\d|HOSTILITY/, '開戦画面に敵対度の生数値や内部英語名を出さない');
for (const removed of ['相互 敵対度', '対戦マッチ数', 'メイン MQ 期待値', '集客見込み']) {
  assert.ok(!modalRoot.innerHTML.includes(removed), `ledger文言「${removed}」を出さない`);
}
assert.ok(modalRoot.innerHTML.includes('両派リーダー ・ 一騎打ち'), '承認済みカード帯を表示する');
assert.ok(modalRoot.innerHTML.includes('両派の対立は、後戻りできない段階に入った'), '定性事実を表示する');

function buildF09Modal(name, dependencies) {
  return Function(...Object.keys(dependencies), `${functionSource(ui, name)};return ${name};`)(...Object.values(dependencies));
}

function renderF09(name, payload) {
  const renderRoot = { innerHTML: '', querySelector() { return null; } };
  const dependencies = {
    _isPopupActive: () => false,
    _popupQueue: [],
    _factionUpperUrl: id => `upper-${id}.webp`,
    _factionSeasonLabel: () => 'S3W09',
    escHtml: value => String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _u3bSideHtml: () => '<div class="u3b-side"></div>',
    _factionEnsureOverlayRoot: () => renderRoot,
    _factionCloseCinematicOverlay: () => {},
    _f09BgmStart: () => {},
    _f09BgmStop: () => {},
    Audio: {},
  };
  buildF09Modal(name, dependencies)(payload, {}, () => {});
  return renderRoot.innerHTML;
}

const hostileNarration = '<img src=x onerror=alert(1)>';
const openingHtml = renderF09('showFactionF09OpeningModal', {
  narration: hostileNarration,
  factionA: { leaderId: 1, leaderName: 'A', name: '東派', leaderOvr: 70, members: [] },
  factionB: { leaderId: 2, leaderName: 'B', name: '西派', leaderOvr: 70, members: [] },
  lineA: '', lineB: '',
});
const endingHtml = renderF09('showFactionF09EndingModal', {
  narration: hostileNarration,
  winnerFaction: { leaderId: 1, leaderName: 'A', name: '東派' },
  loserFaction: { leaderId: 2, leaderName: 'B', name: '西派' },
  winnerLine: '', loserLine: '', scoreA: 3, scoreB: 1,
});
for (const [label, html] of [['開幕', openingHtml], ['結末', endingHtml]]) {
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'), `F09${label}ナレーションをescHtmlする`);
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'), `F09${label}ナレーションをHTMLとして解釈しない`);
}

console.log('faction-ignite-rework-test: PASS');
