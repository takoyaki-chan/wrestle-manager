'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
const data = read('src/data.js');
const ui = read('src/ui-common.js');
const draft = read('docs/autumn-war-match-dialogue-draft-v0.1.md');

function objectLiteralAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  assert.ok(markerAt >= 0, `${marker} not found`);
  const start = source.indexOf('{', markerAt);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${marker} object did not close`);
}

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `${startMarker} section not found`);
  return source.slice(start, end);
}

const blocks = [...draft.matchAll(/```javascript\n([\s\S]*?)\n```/g)].map(match => match[1].trim());
assert.strictEqual(blocks.length, 3, 'confirmed draft must contain exactly three JavaScript blocks');

const expected = Function(`"use strict"; return ({${blocks.join('\n')}});`)();
const actualLiteral = objectLiteralAfter(data, 'const AUTUMN_WAR_MATCH_LINES =');
const actual = Function(`"use strict"; return (${actualLiteral});`)();
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(actual)),
  JSON.parse(JSON.stringify(expected)),
  'implementation must match the confirmed draft exactly'
);
assert.deepStrictEqual(Object.keys(actual), ['preMatch', 'preFinal', 'survivor']);

const getter = section(data, 'function getAutumnWarMatchLine', '// §6.1.5 シーズン総括');
// 2026-08-01 の軸入れ替えで、独自のフォールバックをやめて getDialoguePool に寄せた
// (アーキタイプを保ったまま性格を落とす → 標準の口調へ、の共通探索順)。
assert.ok(getter.includes('getDialoguePool(contextData'), 'getter must resolve via the shared getDialoguePool');
assert.ok(data.includes('AWARD_LINES, AUTUMN_WAR_MATCH_LINES,'), 'Node export must include the Autumn War match table');

const preBout = section(ui, 'function _agwPreBoutDialogueHtml', 'function _agwSurvivorLine');
assert.ok(preBout.includes("getAutumnWarMatchLine(timing"), 'preMatch/preFinal must use the Autumn War table');
assert.ok(!preBout.includes('getJuniorTournamentLine'), 'pre-bout dialogue must not reuse Junior Tournament lines');

const survivor = section(ui, 'function _agwSurvivorLine', 'function _agwChampionSpeech');
assert.ok(survivor.includes("getAutumnWarMatchLine('survivor'"), 'survivor dialogue must use the Autumn War table');
assert.ok(!survivor.includes('getJuniorTournamentLine'), 'survivor dialogue must not reuse Junior Tournament lines');
assert.ok(survivor.includes('AUTUMN_WAR_MVP_LINES[context]'), 'team victory dialogue must use the Autumn War archetype table');
assert.ok(survivor.includes('getDialoguePool(lineSet, winner)'), 'team victory dialogue must resolve by the winner personality and archetype');

assert.ok(ui.includes('preBout: 0.55, survivor: 0.60, champion: 1.00'), '進行中の抽選率を維持し、最多勝選手の優勝台詞だけは無言にしない');

console.log('autumn-war-match-dialogue-test: ok');
