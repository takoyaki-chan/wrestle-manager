'use strict';

const assert = require('assert');
const path = require('path');
const data = require(path.resolve(__dirname, '..', 'src', 'data.js'));

// 年末表彰式で到達し得る personality × archetype の全組み合わせ。
// standard は全性格、固有アーキタイプは既存の会話設計と同じ対応表を使う。
const required = {
  standard: ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'],
  ojousama: ['normal', 'bold', 'shy', 'easygoing', 'earnest'],
  delinquent: ['normal', 'bold', 'shy', 'easygoing'],
  cool: ['normal', 'bold', 'quiet'],
  seductive: ['normal', 'bold', 'quiet', 'easygoing', 'earnest', 'emotional'],
  polite: ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest'],
  composed: ['normal', 'bold', 'quiet', 'easygoing', 'earnest', 'emotional'],
};

for (const awardKey of ['springTagChampion', 'autumnWarChampion']) {
  const table = data.AWARD_LINES[awardKey];
  assert.ok(table, `${awardKey} table must exist`);
  for (const [archetype, personalities] of Object.entries(required)) {
    for (const personality of personalities) {
      const lines = table[archetype] && table[archetype][personality];
      assert.ok(Array.isArray(lines) && lines.length > 0, `${awardKey}.${archetype}.${personality} needs a dedicated line`);
      lines.forEach(line => {
        assert.ok(typeof line === 'string' && line.trim().length > 0, `${awardKey}.${archetype}.${personality} must not be empty`);
        assert.ok(!line.includes('…'), `${awardKey}.${archetype}.${personality} must not store an abbreviated ending`);
      });
    }
  }
}

console.log('awards-event-dialogue-test: ok');
