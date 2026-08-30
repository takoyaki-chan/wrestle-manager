'use strict';

// 全国統一王座の来訪防衛戦はカード編成前から1枠を占有し、開催確定時に
// 二重挿入されて通常試合を落とさない。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGame } = require('./helpers/load-game.js');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function functionSource(name) {
  const token = `function ${name}(`;
  const start = ui.indexOf(token);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 1;
  for (let i = brace + 1; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    else if (ui[i] === '}') depth--;
    if (depth === 0) return ui.slice(start, i + 1);
  }
  throw new Error(`${name} end not found`);
}

loadGame({ full: true });

const champion = { id: 1, name: '王者' };
const challenger = { id: 90, name: '挑戦者' };
const incoming = { champion, challenger, championId: 1, challengerId: 90 };

// 自動編成は会場4枠のうち1枠を最初から統一王座戦へ割り当てる。
{
  const context = {
    G: { season: 3, week: 2, showCard: [] },
    Engine: { unifiedTitle: { getIncomingMatch() { return incoming; } } },
    getScheduledChallengeCard() { return null; },
    getChallengeUnavailableIds() { return new Set([1]); },
  };
  vm.runInNewContext(`${functionSource('_preserveTagSlots')}; this.run = _preserveTagSlots;`, context);
  const staged = context.run(4);
  assert.strictEqual(staged.prefix.length, 1);
  assert.strictEqual(staged.singlesCount, 3);
  assert.strictEqual(staged.prefix[0]._unifiedTitleLocked, true);
}

// 旧セーブの編成済みカードでも、王者を含む旧試合を丸ごと外して4枠を維持する。
{
  const context = {
    G: {
      week: 2, showVenue: 0,
      showCard: [
        { left: 1, right: 2 },
        { left: 3, right: 4 },
        { left: 5, right: 6 },
        { left: 7, right: 8 },
      ],
    },
    Engine: {
      unifiedTitle: {
        getIncomingMatch() { return incoming; },
        removeParticipantsFromCard: Engine.unifiedTitle.removeParticipantsFromCard.bind(Engine.unifiedTitle),
      },
      util: { normalizeShowCardForVenue(card) { return card.slice(0, 4); } },
    },
    getScheduledChallengeCard() { return null; },
  };
  vm.runInNewContext(`${functionSource('stageIncomingUnifiedTitleCard')}; this.run = stageIncomingUnifiedTitleCard;`, context);
  assert.strictEqual(context.run(), true);
  assert.strictEqual(context.G.showCard.length, 4);
  assert.strictEqual(context.G.showCard[0]._unifiedTitleMatch, true);
  assert.ok(!context.G.showCard.slice(1).some(m => m.left === 1 || m.right === 1));
  assert.deepStrictEqual(Array.from(context.G.showCard.slice(1), m => [m.left, m.right]), [[3, 4], [5, 6], [7, 8]]);
}

// 開催確定側も、表示済み予約枠を除いてから確定枠を挿入する。
const reservation = app.indexOf('const withoutStagedUnified = (G.showCard || []).filter');
const insert = app.indexOf('[scheduled.slot, ...cleared]', reservation);
assert.ok(reservation >= 0 && insert > reservation, '確定時の統一王座枠が二重挿入される');
assert.ok(app.includes("stageIncomingUnifiedTitleCard === 'function'"), '全クリアで統一王座の予約枠まで消える');

// 予約が無効化されたら、マーカーとロックを両方落とす。片方だけ残すと
// 「動かせない空白枠」が生まれ、操作のたびに枠が1つずつずれる(v1.31報告)。
{
  const state = { unifiedTitle: { championId: 1, orgId: 'player' }, roster: [], titles: { world: { championId: null } } };
  const card = [{ left: 1, right: 0, isTitle: true, _unifiedTitleMatch: true, _unifiedTitleLocked: true }];
  const out = Engine.title.sanitizeShowCardTitles(state, card);
  assert.ok(!out[0]._unifiedTitleMatch && !out[0]._unifiedTitleLocked && !out[0].isTitle,
    '無効化された統一王座枠にロック/マーカーが残る');
}

// renderShowPrep 内の第3の挿入パスは stageIncomingUnifiedTitleCard に一本化されている。
// 旧実装(「枠を残す」removeFightersFromCard による0埋め+先頭差し込み)は空白枠を増殖させた。
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
assert.ok(!render.includes('removeFightersFromCard(G.showCard, [scheduled.championId'),
  'renderShowPrep が「枠を残す」削除で統一枠を挿入している(空白枠が増殖する旧実装)');
assert.ok(render.includes('stageIncomingUnifiedTitleCard();'),
  'renderShowPrep の統一枠挿入が stageIncomingUnifiedTitleCard に一本化されていない');

// 統一王座戦は自団体王座のクールダウンを消費しない。エンジン(management.js)と
// UIミラー(app.js)の判定式は同一であること(v1.31: app.js側だけ除外漏れで、
// 統一戦をやっただけで12週クールタイムが消費されていた)。
const mgmt = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');
const cdExpr = 'validMatches.some(m => m.isTitle && !m._unifiedTitleMatch)';
assert.ok(app.includes(cdExpr), 'app.js の executedTitleMatch が統一王座戦を除外していない');
assert.ok(mgmt.includes(cdExpr), 'management.js の executedTitleMatch が統一王座戦を除外していない');
assert.ok(!app.includes('validMatches.some(m => m.isTitle);'),
  'app.js に統一王座戦を除外しない旧 executedTitleMatch が残っている');

console.log('unified-title-show-card-staging-test: ok');
