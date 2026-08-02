'use strict';

const assert = require('assert');
const { loadGame } = require('./helpers/load-game');
const { readSource } = require('./helpers/source');

loadGame({ full: true });

function playerMatchInjury(severityRoll, durationRoll) {
  const originalFloat = Engine.rng.float;
  const rolls = [0, severityRoll, durationRoll]; // 怪我発生 → 重症度 → 離脱期間
  Engine.rng.float = () => rolls.shift() ?? 0;
  try {
    return Engine.injury.check(
      {},
      { id: 1, name: 'テスト選手', condition: 70, popularity: 30, wear: 0, traits: [] },
      {
        left: { id: 1 }, right: { id: 2 },
        hpLeft: { final: 0, max: 100 }, hpRight: { final: 50, max: 100 },
        turns: 15,
      },
      1, 12, 1, 0, {}
    );
  } finally {
    Engine.rng.float = originalFloat;
  }
}

// 怪我した後の重症度ロールを 65% / 25% / 8% / 2% に分ける。
assert.strictEqual(Engine.injury.severityBand(0.00), INJURY_TABLE[0]);
assert.strictEqual(Engine.injury.severityBand(0.649999), INJURY_TABLE[0]);
assert.strictEqual(Engine.injury.severityBand(0.65), INJURY_TABLE[1]);
assert.strictEqual(Engine.injury.severityBand(0.899999), INJURY_TABLE[1]);
assert.strictEqual(Engine.injury.severityBand(0.90), INJURY_TABLE[2]);
assert.strictEqual(Engine.injury.severityBand(0.979999), INJURY_TABLE[2]);
assert.strictEqual(Engine.injury.severityBand(0.98), LONG_TERM_INJURY);
assert.strictEqual(Engine.injury.severityBand(0.999999), LONG_TERM_INJURY);

assert.deepStrictEqual(
  [LONG_TERM_INJURY.type, LONG_TERM_INJURY.minWeeks, LONG_TERM_INJURY.maxWeeks, LONG_TERM_INJURY.longTerm],
  ['重傷', 10, 16, true],
  '長期重傷は既存の重傷キーを保ったまま10〜16週にする'
);

// プレイヤー試合の本線が、通常重傷6〜8週と長期重傷10〜16週を実際に生成する。
assert.strictEqual(playerMatchInjury(0.90, 0).newFighter.injury.weeksLeft, 6);
assert.strictEqual(playerMatchInjury(0.979999, 0.999999).newFighter.injury.weeksLeft, 8);
assert.strictEqual(playerMatchInjury(0.98, 0).newFighter.injury.weeksLeft, 10);
assert.strictEqual(playerMatchInjury(0.999999, 0.999999).newFighter.injury.weeksLeft, 16);

// AI通常試合も同じ重症度帯を参照し、独自の4〜8週固定へ戻さない。
const management = readSource('src', 'management.js');
assert.ok(management.includes('const injuryBand = Engine.injury.severityBand(sevRoll);'));
assert.ok(management.includes('injuryBand.minWeeks + Engine.rng.int(matchRng, 0, injuryBand.maxWeeks - injuryBand.minWeeks)'));

console.log('injury-duration-band-test: ok');
