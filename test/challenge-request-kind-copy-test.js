'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

const root = path.join(__dirname, '..', 'src');
const ui = fs.readFileSync(path.join(root, 'ui-common.js'), 'utf8');

assert.ok(ui.includes('団体戦挑戦の直訴'),
  'three-match challenge requests must be titled as organization challenges from the first screen');
assert.ok(ui.includes('シングル挑戦の直訴'),
  'B3 one-on-one challenge letters must be titled separately from organization challenges');
// task-87追補(2026-08-13): 直訴セリフは二軸34セル(CHALLENGE_LINES.petition、団体戦文脈へ改修済み102本)を使う。
// 旧アーキタイプ単軸14本(pickGroupRequesterLine/CHALLENGE_GROUP_PETITION_LINES)は撤去済み
assert.ok(ui.includes('Engine.challengeRequest.pickRequesterLine'),
  'the organization challenge request screen must use the two-axis petition pool');
assert.ok(!ui.includes('pickGroupRequesterLine('),
  'the retired archetype-only group petition picker must not be called anywhere');

loadGame({ full: true });

// 撤去確認: 旧テーブル・旧ピッカーが本体から消えている
assert.strictEqual(typeof CHALLENGE_GROUP_PETITION_LINES, 'undefined',
  'CHALLENGE_GROUP_PETITION_LINES must be removed (replaced by reworked CHALLENGE_LINES.petition)');
assert.strictEqual(Engine.challengeRequest.pickGroupRequesterLine, undefined,
  'pickGroupRequesterLine must be removed');

// 団体戦文脈: petition 全102本が {org} と1対1前提の語を含まない(2026-08-12 Keisuke承認の改修契約)
const petitionCells = Object.entries(CHALLENGE_LINES).filter(([, cell]) => Array.isArray(cell.petition));
const allPetition = petitionCells.flatMap(([, cell]) => cell.petition);
assert.strictEqual(allPetition.length, 102, 'petition must stay 34 cells x 3 lines = 102');
for (const line of allPetition) {
  assert.ok(!line.includes('{org}'), `petition must not embed the org name (badges carry it): ${line}`);
  assert.ok(!/あの人と|あの方と|あいつと|そいつと|あの相手と/.test(line),
    `petition must not read as a one-on-one challenge: ${line}`);
}
// 集団性: 内気帯の言い淀み2本(承認済みの変更なし)以外は、1本単独で団体戦と読み取れる
const collective = /三人|三つ|三連戦|私たち|私ら|わたくしたち|全員|みんな|そろって|一緒/;
const nonCollective = allPetition.filter(line => !collective.test(line));
assert.ok(nonCollective.length <= 2,
  `at most the two approved shy lines may omit an explicit collective marker: ${nonCollective.join(' / ')}`);

// 実抽選: 団体名を渡しても本文へ混入しない(名称はヘッダー/バッジが背負う)
const fighter = { archetype: 'standard', personality: 'normal' };
const rng = Engine.rng.create(12345);
const line = Engine.challengeRequest.pickRequesterLine(fighter, rng, '桜翔プロレス');
assert.ok(typeof line === 'string' && line.length > 0, 'two-axis petition pool must return a line');
assert.ok(CHALLENGE_LINES.standard_normal.petition.includes(line),
  'picked line must come from the requester cell pool');
assert.ok(!line.includes('桜翔プロレス'),
  'petition dialogue must not name the challenged organization in the bubble');

console.log('challenge-request-kind-copy-test: ok');
