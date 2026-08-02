'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');

const files = ['app.js', 'ui-common.js', 'ui-render.js', 'management.js', 'factions.js'];
const runtime = files.map(file => readSource('src', file)).join('\n');

const removed = [
  'getWelcomeQuote',
  'getHeatStateQuote',
  '_showSpringTagCardIntro',
  '_common1Preview',
  'common1WatchMatch',
  'common1SkipMatch',
  '_receiveCommon1BattleResult',
  '_finalizeCommon1Match',
  '_renderCommon1MatchPreview',
  'checkSummitMatch',
  'applySummitOutcome',
  'focusDraftCandidate',
  'setSchedule',
  'setIntensive',
  'cancelIntensive',
  'addTagSlot',
  'pickRandomChoice',
  'runLegacy',
  '_legacySelectMVP',
];

removed.forEach(symbol => {
  assert.ok(!runtime.includes(symbol), `休眠実装 ${symbol} を本番コードへ戻さない`);
});

assert.ok(runtime.includes('function getJoinGreeting('), '加入挨拶の現行経路を保持する');
assert.ok(runtime.includes('HEAT_STATE_COACH_LINES[heatState]'), '道場コーチの現行熱量経路を保持する');
assert.ok(runtime.includes('function renderSpringTagLeagueBoard('), '春タッグの現行ボードを保持する');
assert.ok(runtime.includes('bookedCommon1'), 'Common-1の現行興行予約を保持する');
assert.ok(runtime.includes('Engine.ppv.getSummitPair('), 'PPV内頂上決戦を保持する');
assert.ok(runtime.includes('mergeToTagSlot(idx)'), '現行のタッグ枠作成操作を保持する');

console.log('dormant-code-cleanup-test: PASS');
