'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const data = require('../src/data.js');

const root = path.join(__dirname, '..');
const victorySource = fs.readFileSync(path.join(root, 'src', 'victory-lines.js'), 'utf8');
const commonSource = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must be defined`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`could not extract ${name}`);
}

const victoryContext = {};
vm.runInNewContext(`${victorySource}\nthis.__victoryLines = VICTORY_LINES;`, victoryContext);

const lineContext = {
  G: { season: 1, week: 1 },
  VICTORY_LINES: victoryContext.__victoryLines,
  POST_MATCH_FLAVOR_LINES: data.POST_MATCH_FLAVOR_LINES,
  getDialoguePool: data.getDialoguePool,
};
vm.runInNewContext(`${extractFunction(commonSource, '_emrVictoryLine')}\nthis.pickVictoryLine = _emrVictoryLine;`, lineContext);

// 2026-07-31 Keisuke裁定: **キャラ固有セリフが最優先**(その子だけの言葉を見せるのが本作の芯)。
// 汎用プールは固有セリフを持たないキャラの受け皿であり、固有セリフを上書きしてはならない。
const withOwnLines = { id: 45, personality: 'quiet', archetype: 'seductive' };
const ownSelected = lineContext.pickVictoryLine(withOwnLines);
assert.ok(victoryContext.__victoryLines['45'].includes(ownSelected),
  '固有セリフを持つキャラは汎用プールに奪われず本人のセリフを話す');

// 固有セリフを持たない quiet×seductive は _default(素の寡黙)ではなく専用セルへ落ちる
const quietSeductivePool = data.POST_MATCH_FLAVOR_LINES.winner.quiet.seductive;
const noOwn = { id: 999999, personality: 'quiet', archetype: 'seductive' };
const pooled = lineContext.pickVictoryLine(noOwn);
assert.ok(quietSeductivePool.includes(pooled),
  '固有セリフ無しの quiet×seductive は専用セルから引く(_defaultへ落ちない)');

const personalities = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
const archetypes = ['normal', 'cool', 'polite', 'ojousama', 'delinquent', 'seductive', 'composed'];
for (const personality of personalities) {
  for (const archetype of archetypes) {
    const pool = data.getDialoguePool(data.POST_MATCH_FLAVOR_LINES.winner, { personality, archetype });
    assert.ok(Array.isArray(pool) && pool.length > 0, `${personality}×${archetype} resolves a victory line`);
    for (const line of pool) {
      assert.strictEqual(typeof line, 'string', `${personality}×${archetype} has no undefined line`);
      assert.ok(line.length <= 43, `${personality}×${archetype} line fits the 43-character limit`);
    }
  }
}

console.log('victory line archetype coverage checks: PASS');
