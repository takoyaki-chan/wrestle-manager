'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(start, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

const build = new Function(
  'Engine',
  'CHALLENGE_REQUEST_OPPONENT_REACTIONS',
  `${functionSource('_challengeRequestResultReaction')};
   ${functionSource('_challengeRequestOpponentReaction')};
   return { self: _challengeRequestResultReaction, foe: _challengeRequestOpponentReaction };`
);
const built = build(Engine, CHALLENGE_REQUEST_OPPONENT_REACTIONS);
const reactionFor = built.self;
const foeReactionFor = built.foe;
const state = { rngSeed: 42, season: 3, week: 12 };

// challenge-request-lines-redesign: 自団体代表の勝利セリフは汎用 VICTORY_LINES ではなく
// 挑戦試合専用テーブル CHALLENGE_LINES の archetype_personality.win から引く。
const ourRepresentative = { id: 101, name: '自団体代表', archetype: 'normal', personality: 'normal' };
const homeOpponent = { id: 202, name: '迎撃側代表', archetype: 'ojousama' };
const forwardCard = { isInverse: false, teamA: [ourRepresentative], teamB: [homeOpponent], otherOrgName: 'テスト団体' };
const forward = reactionFor(forwardCard, { teamWin: 'A' }, state, true, false);
assert.strictEqual(forward.fighter, ourRepresentative,
  'when our organization challenges and wins, our representative must speak');
assert.ok(CHALLENGE_LINES.standard_normal.win.includes(forward.line),
  'forward victory uses a CHALLENGE_LINES win line matched to archetype/personality');
assert.strictEqual(forward.defeated, false, 'the winning representative portrait stays in full color');

// 敗戦回も「社長への報告」は自団体代表が行う（2026-07-25 Keisuke裁定）。
// 自団体が挑んで敗れた場合、勝った相手ではなく敗れた自陣代表が lose セリフを話す。
const forwardLost = reactionFor(forwardCard, { teamWin: 'B' }, state, false, true);
assert.strictEqual(forwardLost.fighter, ourRepresentative,
  'when our organization challenges and loses, our representative still reports');
assert.ok(CHALLENGE_LINES.standard_normal.lose.includes(forwardLost.line),
  'forward defeat uses a CHALLENGE_LINES lose line');
assert.strictEqual(forwardLost.defeated, true, 'the defeated representative portrait is marked for grayscale styling');

const awayChallenger = { id: 303, name: '相手挑戦者', archetype: 'ojousama' };
const ourDefender = { id: 404, name: '自団体迎撃者', archetype: 'normal', personality: 'normal' };
const inverseCard = { isInverse: true, teamA: [awayChallenger], teamB: [ourDefender] };
const inverse = reactionFor(inverseCard, { teamWin: 'B' }, state, true, false);
assert.strictEqual(inverse.fighter, ourDefender,
  'when the opponent challenges and is repelled, our defender reports the win');
assert.ok(CHALLENGE_LINES.standard_normal.win.includes(inverse.line),
  'a repelled challenge uses a CHALLENGE_LINES win line for our defender');
assert.strictEqual(inverse.defeated, false, 'the winning defender portrait stays in full color');

// 勝った回は、報告の前に「敗れた相手団体の代表」の顔を挟む（Keisuke 要望）。
const foe = foeReactionFor(inverseCard, { teamWin: 'B' }, state, true, false);
assert.strictEqual(foe.fighter, awayChallenger, 'the beaten opposing representative is the one shown');
assert.ok(CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.lose.includes(foe.line),
  'the defeated challenger uses an archetype-specific loss line');
assert.strictEqual(foe.defeated, true, 'the defeated challenger portrait is marked for grayscale styling');
// 併記の並び順は「勝者を左、敗者を右」。純粋関数へ切り出したので振る舞いで検査する
// （ソース文字列の照合はリファクタで陳腐化するため置かない。test/stale-lint.js 参照）。
const orderOf = new Function(
  `${functionSource('_challengeRequestReactionOrder')}; return _challengeRequestReactionOrder;`
)();

const selfRx = { fighter: ourDefender, line: 'x', label: 'self' };
const foeRx = { fighter: awayChallenger, line: 'y', label: 'foe' };

assert.deepStrictEqual(orderOf(selfRx, foeRx, false), [selfRx, foeRx],
  '自団体が勝った回は自団体（勝者）が左');
assert.deepStrictEqual(orderOf(selfRx, foeRx, true), [foeRx, selfRx],
  '自団体が負けた回は相手（勝者）が左 — 敗戦時だけ左右が逆にならないこと');
assert.deepStrictEqual(orderOf(selfRx, null, false), [selfRx], '相手側が無いときは1人だけ');
assert.deepStrictEqual(orderOf(selfRx, null, true), [selfRx], '敗戦で相手側が無いときも1人だけ');

// 2026-07-30 裁定: 自団体が敗れた回も相手の勝ち名乗りを併記する（当初は出さない裁定だった）。
const foeWhenWeLost = foeReactionFor(inverseCard, { teamWin: 'A' }, state, false, true);
assert.strictEqual(foeWhenWeLost.fighter, awayChallenger,
  '自団体が敗れた回は、勝った相手団体の代表が話す');
assert.ok(CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.win.includes(foeWhenWeLost.line),
  '勝った挑戦者は archetype 別の勝利セリフを使う');
assert.strictEqual(foeWhenWeLost.defeated, false, '勝者のポートレートはグレースケールにしない');
assert.strictEqual(foeWhenWeLost.label, '挑戦を実らせた代表',
  'inverse で相手が勝った場合のラベルは「挑戦を実らせた代表」');

assert.ok(ui.includes('crrm-reaction-bubble'), 'the reaction line is rendered as a speech bubble');
assert.ok(ui.includes('crrm-reaction-portrait'), 'the speaker upper-body portrait is rendered below the bubble');
assert.ok(ui.includes('.crrm-reaction-scene.is-defeated .crrm-reaction-portrait'),
  'defeated portraits have a dedicated grayscale treatment');

console.log('challenge-request-result-reaction-test: ok');
