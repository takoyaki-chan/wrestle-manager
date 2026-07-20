'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const ui = [read('src/ui-common.js'), read('src/ui-render.js')].join('\n');
const management = read('src/management.js');
const data = read('src/data.js');

const forbiddenUiFragments = [
  '信頼↑', '信頼↓', '信頼-1', 'リーダー信頼', 'メンバー信頼',
  '信頼度が即座にアップ', 'の信頼</span>', 'trust <strong>',
];
for (const fragment of forbiddenUiFragments) {
  assert.ok(!ui.includes(fragment), `organization trust leak remains in UI: ${fragment}`);
}

const buildChoicesStart = management.indexOf('buildChoices(event, state)');
const buildChoicesEnd = management.indexOf('// ── 選択型イベントの効果適用', buildChoicesStart);
assert.ok(buildChoicesStart >= 0 && buildChoicesEnd > buildChoicesStart);
const choiceHints = management.slice(buildChoicesStart, buildChoicesEnd);
assert.ok(!/hint:\s*['`][^'`]*(?:信頼|trust)/.test(choiceHints), 'choice hints must describe reactions, not trust changes');
assert.ok(!/return\s+['`][^'`]*信頼(?:が|を)[^'`]*['`]/.test(management),
  'organization trust helpers must return behavior or rumor wording, not direct trust-change labels');

const docsStart = data.indexOf('const DECISION_DOCS =');
const docsEnd = data.indexOf('// 決裁の信頼度効果', docsStart);
assert.ok(docsStart >= 0 && docsEnd > docsStart);
const decisionDocs = data.slice(docsStart, docsEnd);
assert.ok(!/effectSummary:\s*['`][^'`]*(?:信頼|trust)/.test(decisionDocs), 'decision summaries must not name hidden trust changes');

assert.ok(ui.includes('因縁 ${signed(delta.rivalry)} / 相手との関係 ${signed(delta.bond)}'),
  'challenge results should continue to show numeric inter-wrestler relationship changes');

console.log('org-trust-visibility-guard-test: ok');
