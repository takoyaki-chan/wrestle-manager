'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { BITTER_PREMATCH_LINES, EVENT_LINES_BY_KEY, RIVALRY_POPUP_CONFIG } = require('../src/data.js');
const { readSource } = require('./helpers/source');

const root = path.join(__dirname, '..');
const draft = fs.readFileSync(path.join(root, 'docs', 'dialogue', 'bitter-prematch-lines-draft-v0.1.md'), 'utf8');
const app = readSource('src', 'app.js');
const ui = readSource('src', 'ui-common.js');

function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${signature} body end not found`);
}

function countLines(value) {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== 'object') return 0;
  return Object.values(value).reduce((sum, child) => sum + countLines(child), 0);
}

// 草案のコードブロックを直接評価して、本文・構造ともに完全一致させる。
const draftBlock = draft.match(/const BITTER_PREMATCH_LINES = \{[\s\S]*?\n\};/);
assert.ok(draftBlock, '草案から BITTER_PREMATCH_LINES を取得できない');
const draftLines = new Function(`${draftBlock[0]}; return BITTER_PREMATCH_LINES;`)();
assert.deepStrictEqual(BITTER_PREMATCH_LINES, draftLines, '実装した宿怨セリフが草案と一字一句一致する');
assert.strictEqual(countLines(BITTER_PREMATCH_LINES.ahead), 28, 'ahead は28本');
assert.strictEqual(countLines(BITTER_PREMATCH_LINES.behind), 28, 'behind は28本');
assert.strictEqual(EVENT_LINES_BY_KEY.bitterPrematch, BITTER_PREMATCH_LINES, '動的セリフマップに登録する');

assert.strictEqual(RIVALRY_POPUP_CONFIG.bitterPairCooldownWeeks, 16, '宿怨ペアのクールダウンは16週');
const bitterSeen = new Function('deps', `
  let G = deps.state;
  const Engine = deps.Engine;
  const RIVALRY_POPUP_CONFIG = deps.config;
  ${extractFunction(ui, 'function _getRivalryPopupSeen(')}
  return () => _getRivalryPopupSeen();
`)({
  state: { season: 1, week: 16, _rivalryPopupSeen: { 'bitter:1-2': 1 } },
  Engine: { util: { absWeek: (season, week) => ((season - 1) * 48) + week } },
  config: RIVALRY_POPUP_CONFIG,
});
assert.deepStrictEqual(bitterSeen().seen, { 'bitter:1-2': 1 }, '宿怨は15週後まで表示済み記録を保持する');
const bitterExpiry = new Function('deps', `
  let G = deps.state;
  const Engine = deps.Engine;
  const RIVALRY_POPUP_CONFIG = deps.config;
  ${extractFunction(ui, 'function _getRivalryPopupSeen(')}
  return () => _getRivalryPopupSeen();
`)({
  state: { season: 1, week: 17, _rivalryPopupSeen: { 'bitter:1-2': 1 } },
  Engine: { util: { absWeek: (season, week) => ((season - 1) * 48) + week } },
  config: RIVALRY_POPUP_CONFIG,
});
assert.deepStrictEqual(bitterExpiry().seen, {}, '宿怨は16週後に再表示可能になる');
assert.ok(app.includes('rivalLvl && rivalLvl.isBitterRival'), '宿怨は通常因縁と独立して検出する');
assert.ok(app.includes('confrontations.splice(RIVALRY_POPUP_CONFIG.maxNormalPerShow)'), '興行あたりの上限に合流する');
assert.ok(app.includes('a.isBitter ? -1 : 1'), '宿怨を通常因縁より優先する');
assert.ok(app.includes('bitterResolutionWinnerId'), '決着戦の勝者IDを記録する');
assert.ok(app.includes('旧セーブには決着戦勝者IDが無い'), '旧セーブ用H2Hフォールバックの理由を残す');

const sideFn = new Function('Engine', `return (${extractFunction(app, 'function _bitterPrematchSide(')});`)({
  title: { getRivalryKey: (a, b) => [a, b].sort((x, y) => x - y).join('-') },
  h2h: { getRecordFor: (_state, self) => ({ wins: self === 2 ? 3 : 1, losses: self === 2 ? 1 : 3 }) },
});
const recorded = { rivalries: { '1-2': { bitterResolutionWinnerId: 2 } } };
assert.strictEqual(sideFn(recorded, 2, 1), 'ahead', '決着戦勝者は ahead を引く');
assert.strictEqual(sideFn(recorded, 1, 2), 'behind', '決着戦敗者は behind を引く');
assert.strictEqual(sideFn({ rivalries: {} }, 2, 1), 'ahead', '勝者IDがない旧セーブはH2Hでフォールバックする');

for (const phrase of [
  "title = '遺 恨 再 燃'",
  "sub = 'GRUDGE REKINDLED'",
  "toneCls = 'tone-bitter'",
  "vsLabel = '再 燃'",
  '💀 消えなかったものが、また火を持った',
]) assert.ok(ui.includes(phrase), `宿怨専用表示がない: ${phrase}`);

for (const phrase of [
  "title = rivalryVal >= 70 ? '因 縁 勃 発' : '宿 敵 対 決'",
  "resultHtml = `<div class=\"vd-tag\">⚡ ふたりの間に火花が散った</div>`;",
]) assert.ok(ui.includes(phrase), `通常の宣戦布告文言が変わっている: ${phrase}`);

console.log('bitter-prematch-test: ok');
