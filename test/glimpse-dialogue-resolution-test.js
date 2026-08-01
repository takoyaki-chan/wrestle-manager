'use strict';

const assert = require('assert');
const path = require('path');
const D = require(path.resolve(__dirname, '..', 'src', 'data.js'));

const fallback = String.fromCodePoint(0x2026);
const isFallback = pool => Array.isArray(pool) && pool.length === 1 && pool[0] === fallback;
const cases = [];

for (const threshold of D.GLIMPSE_A_THRESHOLDS) {
  cases.push([`A:${threshold.id}`, D.GLIMPSE_A_LINES[threshold.id]]);
}
for (const subtype of ['win', 'loss', 'goodLoss', 'greatWin']) {
  cases.push([`B:GL-01.${subtype}`, D.GLIMPSE_B_LINES['GL-01'][subtype]]);
}
for (const id of ['GL-02', 'GL-02-hostile', 'GL-04', 'GL-05', 'GL-06', 'GL-07', 'GL-08', 'GL-09', 'GL-10', 'GL-11']) {
  cases.push([`B:${id}`, D.GLIMPSE_B_LINES[id]]);
}
for (const subtype of ['up', 'down']) {
  cases.push([`B:GL-03.${subtype}`, D.GLIMPSE_B_LINES['GL-03'][subtype]]);
}
cases.push(['B:hotstreak_end', D.GLIMPSE_HOTSTREAK_END_LINES]);

for (const [name, table] of cases) {
  const missing = D.ALL_CHARS
    .filter(fighter => isFallback(D.getDialoguePool(table, fighter)))
    .map(fighter => fighter.id);
  assert.deepStrictEqual(missing, [], `${name} falls back to an ellipsis for: ${missing.join(', ')}`);
}

assert.deepStrictEqual(
  D.getDialoguePool({ standard: { normal: ['archetype first'] } }, { personality: 'normal', archetype: 'standard' }),
  ['archetype first'],
  'the established archetype-first layout must remain supported',
);
assert.deepStrictEqual(
  D.getDialoguePool({ normal: { standard: ['personality first'] } }, { personality: 'normal', archetype: 'standard' }),
  ['personality first'],
  'the personality-first Glimpse layout must resolve before its placeholder',
);

console.log('glimpse-dialogue-resolution-test: ok');
