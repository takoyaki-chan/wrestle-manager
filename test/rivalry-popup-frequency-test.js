'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');
const { RIVALRY_POPUP_CONFIG } = require('../src/data.js');

const ui = readSource('src', 'ui-common.js');
const app = readSource('src', 'app.js');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `section not found: ${startMarker}`);
  return source.slice(start, end);
}

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

const popupCode = section(ui, 'let _pendingMatchDialogues = [];', '\nfunction _pbShowSummaryTheme');

function makeHarness(state) {
  const characters = [
    { id: 1, name: 'A', ovr: 50 },
    { id: 2, name: 'B', ovr: 51 },
    { id: 3, name: 'C', ovr: 52 },
    { id: 4, name: 'D', ovr: 53 },
  ];
  return new Function('deps', `
    let G = deps.state;
    const Engine = deps.Engine;
    const ALL_CHARS = deps.characters;
    const RIVALRY_POPUP_CONFIG = deps.config;
    const RIVALRY_MATCH_REACTION = { winnerLines: {}, loserLines: {} };
    const UPSET_RIVALRY_LINES = { winnerLines: {}, loserLines: {} };
    const pickDialogueLine = () => 'line';
    const _sameSinglesPair = (match, result) => match.left === result.left.id && match.right === result.right.id;
    ${popupCode}
    return {
      queue: _queueRivalryMatchDialogue,
      markSeen: _markRivalryMatchDialoguesSeen,
      pending: () => _pendingMatchDialogues,
    };
  `)({
    state,
    characters,
    config: RIVALRY_POPUP_CONFIG,
    Engine: { util: { absWeek: (season, week) => ((season - 1) * 48) + week, ov: fighter => fighter.ovr } },
  });
}

function result(rivalry, leftId = 1, rightId = 2, extraBonus = {}, extraResult = {}) {
  return {
    left: { id: leftId, name: `F${leftId}`, ovr: 50 },
    right: { id: rightId, name: `F${rightId}`, ovr: 51 },
    rivalryBonus: { rivalry, ...extraBonus },
    ...extraResult,
  };
}

function queue(harness, r) {
  harness.queue(r, true, false, 'Match 1', { left: r.left.id, right: r.right.id });
}

assert.deepStrictEqual(RIVALRY_POPUP_CONFIG, {
  normalMinRivalry: 60,
  maxNormalPerShow: 1,
  normalPairCooldownWeeks: 8,
  bitterPairCooldownWeeks: 16,
}, '因縁ポップアップの設定値を data.js に集約する');

for (const rivalry of [30, 45]) {
  const h = makeHarness({ season: 1, week: 1 });
  queue(h, result(rivalry));
  assert.strictEqual(h.pending().length, 0, `rivalry ${rivalry} は通常ポップアップを出さない`);
}
{
  const h = makeHarness({ season: 1, week: 1 });
  queue(h, result(60));
  assert.strictEqual(h.pending().length, 1, 'rivalry 60 は通常ポップアップを出す');
}

for (const rivalTitle of ['isGoodRival', 'isBitterRival']) {
  const h = makeHarness({ season: 1, week: 1 });
  queue(h, result(5, 1, 2, { [rivalTitle]: true }));
  assert.strictEqual(h.pending().length, 1, `${rivalTitle} は閾値未満でも通常ポップアップ対象`);
}

{
  const h = makeHarness({ season: 1, week: 1 });
  queue(h, result(60, 1, 2));
  queue(h, result(80, 3, 4));
  assert.strictEqual(h.pending().length, 1, '1興行の通常ポップアップは1件まで');
  assert.strictEqual(h.pending()[0]._rivalryPopupRivalry, 80, '複数候補では rivalry が最も高いカードを選ぶ');
}

{
  const state = { season: 1, week: 1 };
  const first = makeHarness(state);
  queue(first, result(60));
  first.markSeen(first.pending());
  assert.deepStrictEqual(state._rivalryPopupSeen, { '1-2': 1 }, '表示予約したペアを絶対週で記録する');

  state.week = 8;
  const duringCooldown = makeHarness(state);
  queue(duringCooldown, result(60));
  assert.strictEqual(duringCooldown.pending().length, 0, '8週のクールダウン期間内は同じペアを再表示しない');

  state.week = 9;
  const afterCooldown = makeHarness(state);
  queue(afterCooldown, result(60));
  assert.strictEqual(afterCooldown.pending().length, 1, '8週経過後は同じペアを再表示できる');
  assert.deepStrictEqual(state._rivalryPopupSeen, {}, '期限切れの表示済み記録を自然に削除する');
}

{
  const h = makeHarness({ season: 1, week: 1 });
  queue(h, result(60, 1, 2, {}, { rivalryResolved: true }));
  assert.strictEqual(h.pending().length, 0, '決着試合へ通常の「因縁の一戦」を重ねない');

  let enqueued = false;
  const showRivalryPopups = new Function('_enqueuePopup', `${extractFunction(ui, 'function showRivalryPopups(')}; return showRivalryPopups;`)(() => { enqueued = true; });
  showRivalryPopups([{ phase: 'resolution', resolutionType: 'first' }]);
  assert.strictEqual(enqueued, true, '決着演出は通常ポップアップの判定を通らず専用キューへ渡る');
  assert.ok((app.match(/showRivalryPopups\(pendingResolutions/g) || []).length >= 2,
    '通常興行・PPVとも決着演出を専用キューへ渡す');
}

console.log('rivalry-popup-frequency-test: ok');
