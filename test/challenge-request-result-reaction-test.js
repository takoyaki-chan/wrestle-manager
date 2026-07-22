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
  'VICTORY_LINES',
  'CHALLENGE_REQUEST_OPPONENT_REACTIONS',
  `${functionSource('_challengeRequestResultReaction')}; return _challengeRequestResultReaction;`
);
const reactionFor = build(Engine, VICTORY_LINES, CHALLENGE_REQUEST_OPPONENT_REACTIONS);
const state = { rngSeed: 42, season: 3, week: 12 };

const ourRepresentative = { id: 101, name: '自団体代表', archetype: 'normal', voiceLines: ['勝利の喜び'] };
const homeOpponent = { id: 202, name: '迎撃側代表', archetype: 'ojousama' };
const forwardCard = { isInverse: false, teamA: [ourRepresentative], teamB: [homeOpponent] };
const forward = reactionFor(forwardCard, { teamWin: 'A' }, state, true, false);
assert.strictEqual(forward.fighter, ourRepresentative,
  'when our organization challenges and wins, our representative must speak');
assert.strictEqual(forward.line, '勝利の喜び', 'forward victory uses the representative victory line');
assert.strictEqual(forward.defeated, false, 'the winning representative portrait stays in full color');

const awayChallenger = { id: 303, name: '相手挑戦者', archetype: 'ojousama' };
const ourDefender = { id: 404, name: '自団体迎撃者', archetype: 'normal' };
const inverseCard = { isInverse: true, teamA: [awayChallenger], teamB: [ourDefender] };
const inverse = reactionFor(inverseCard, { teamWin: 'B' }, state, true, false);
assert.strictEqual(inverse.fighter, awayChallenger,
  'when the opponent challenges and loses, the opponent challenger must speak');
assert.ok(CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama.lose.includes(inverse.line),
  'the defeated challenger uses an archetype-specific loss line');
assert.strictEqual(inverse.defeated, true, 'the defeated challenger portrait is marked for grayscale styling');

assert.ok(ui.includes('crrm-reaction-bubble'), 'the reaction line is rendered as a speech bubble');
assert.ok(ui.includes('crrm-reaction-portrait'), 'the speaker upper-body portrait is rendered below the bubble');
assert.ok(ui.includes('.crrm-reaction-scene.is-defeated .crrm-reaction-portrait'),
  'defeated portraits have a dedicated grayscale treatment');

console.log('challenge-request-result-reaction-test: ok');
