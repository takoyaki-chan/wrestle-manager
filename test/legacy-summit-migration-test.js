'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');

const app = readSource('src', 'app.js');
const management = readSource('src', 'management.js');
const uiCommon = readSource('src', 'ui-common.js');
const uiRender = readSource('src', 'ui-render.js');
const data = readSource('src', 'data.js');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

const migrate = new Function(`${extractFunction(app, 'migrateLegacySummitPendingEvent')}; return migrateLegacySummitPendingEvent;`)();

const ordinary = { weekPhase: 'event', pendingEvent: { type: 'war' }, gameLog: ['before'] };
assert.strictEqual(migrate(ordinary), ordinary, '現行イベントは参照も内容も変えない');

const legacy = {
  weekPhase: 'event',
  pendingEvent: { type: 'summit', opponentOrgId: 'org_s' },
  gameLog: ['before'],
};
const migrated = migrate(legacy);
assert.notStrictEqual(migrated, legacy, '旧頂上決戦だけ新しいstateへ移す');
assert.strictEqual(migrated.pendingEvent, null, '旧予約を解除する');
assert.strictEqual(migrated.weekPhase, 'manage', '旧イベント画面から経営画面へ戻す');
assert.deepStrictEqual(migrated.gameLog.slice(0, 1), ['before'], '既存ログを保持する');
assert.ok(migrated.gameLog.at(-1).includes('PPV GRAND FINALへ統合済み'), '解除理由をログへ残す');
assert.strictEqual(legacy.pendingEvent.type, 'summit', '入力stateを破壊しない');

assert.ok(app.includes('G = migrateLegacySummitPendingEvent(G);'), 'deserializeへ移行を配線する');
for (const [name, source] of Object.entries({ management, uiCommon, uiRender, data })) {
  assert.ok(!source.includes('checkSummitMatch'), `${name}: 旧生成判定を残さない`);
  assert.ok(!source.includes('applySummitOutcome'), `${name}: 旧単独精算を残さない`);
  assert.ok(!source.includes('summitPopReward'), `${name}: 旧単独報酬を残さない`);
  assert.ok(!source.includes('summitMinRank'), `${name}: 旧単独発火条件を残さない`);
}
assert.ok(!uiCommon.includes("ev.type === 'summit'"), '旧単独試合の実行・辞退分岐を残さない');
assert.ok(!uiRender.includes("ev.type === 'summit'"), '旧単独試合画面を残さない');

console.log('legacy-summit-migration-test: PASS');
