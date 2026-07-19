'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

for (const seed of [42, 12345, 98765]) {
  let state = Engine.createInitialState(seed, true);
  const announced = Engine.springTagLeague.announce(state);
  assert.strictEqual(announced.cancelled, false, `league should be available for seed ${seed}`);
  state = { ...state, springTagLeague: announced };
  const playerPair = Engine.springTagLeague.bestPair(state, state.roster);
  assert.ok(playerPair, `player team should be selectable for seed ${seed}`);
  state = Engine.springTagLeague.confirmPlayerTeam(state, playerPair.f1Id, playerPair.f2Id);

  const leagueResult = Engine.springTagLeague.run(state, Engine.rng.create(seed));
  assert.strictEqual(leagueResult.cancelled, false);
  assert.strictEqual(leagueResult.matches.length, 6);
  assert.ok(leagueResult.replayContext, 'league must preserve its compact replay context');
  assert.ok(!leagueResult.matches.some(match => Object.prototype.hasOwnProperty.call(match, 'frames')),
    'canonical league results should not bloat saves with replay frames');

  const applied = Engine.springTagLeague.apply(state, leagueResult).state;
  leagueResult.matches.forEach((canonical, matchIndex) => {
    const replay = Engine.springTagLeague.simulateReplay(
      applied,
      applied.springTagLeague.matches[matchIndex],
      { matchIndex }
    );
    assert.ok(replay && replay.result.frames.length > 0, `match ${matchIndex + 1} must have watch frames`);
    assert.deepStrictEqual(
      { winner: replay.result.winner, mq: replay.result.mq, turns: replay.result.turns },
      { winner: canonical.winner, mq: canonical.mq, turns: canonical.turns },
      `match ${matchIndex + 1} replay must reproduce the canonical result`
    );
  });

  const finalReplay = Engine.springTagLeague.simulateReplay(
    applied,
    applied.springTagLeague.finalMatch,
    { isFinal: true, matchIndex: 6 }
  );
  assert.ok(finalReplay && finalReplay.result.frames.length > 0, 'final must have watch frames');
  assert.deepStrictEqual(
    { winner: finalReplay.result.winner, mq: finalReplay.result.mq, turns: finalReplay.result.turns },
    {
      winner: leagueResult.finalMatch.winner,
      mq: leagueResult.finalMatch.mq,
      turns: leagueResult.finalMatch.turns,
    },
    'final replay must reproduce the canonical result'
  );
}

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const mobile = fs.readFileSync(path.join(root, 'src', 'mobile.css'), 'utf8');
assert.ok(app.includes('stlWatchMatch()') && app.includes("type: 'START_TAG_MATCH'"),
  'spring tag league must launch the tag battle replay');
assert.ok(app.includes('_receiveSpringTagLeagueBattleResult(data)') && app.includes("stlPre.phase === 'watching'"),
  'spring tag league replay completion must return to league progression');
assert.ok(ui.includes('onclick="App.stlWatchMatch()">🎬 観戦する</button>') && ui.includes('結果を見る ▶'),
  'league matches and the final must offer watch or result choices');
assert.ok(mobile.includes('.stl-progress-btn-row .btn { flex: 1 1 130px;') && mobile.includes('min-height: 44px;'),
  'spring tag watch choices must remain tappable on phones');

console.log('spring-tag-league-watch-test: ok');
