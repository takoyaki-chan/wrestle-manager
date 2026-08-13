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
  state = {
    ...state,
    week: Engine.springTagLeague.LEAGUE_WEEK,
    springTagLeague: { ...announced, announcedSeason: state.season },
  };
  const playerPair = Engine.springTagLeague.bestPair(state, state.roster);
  assert.ok(playerPair, `player team should be selectable for seed ${seed}`);
  state = Engine.springTagLeague.confirmPlayerTeam(state, playerPair.f1Id, playerPair.f2Id);

  const leagueResult = Engine.springTagLeague.run(state, Engine.rng.create(seed));
  assert.strictEqual(leagueResult.cancelled, false);
  assert.strictEqual(leagueResult.matches.length, 12);
  assert.strictEqual(leagueResult.format, 2);
  assert.deepStrictEqual(leagueResult.matches.map(match => match.seedTag), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.strictEqual(leagueResult.finalMatch.seedTag, 12);
  assert.ok(leagueResult.replayContext, 'league must preserve its compact replay context');
  assert.ok(!leagueResult.matches.some(match => Object.prototype.hasOwnProperty.call(match, 'frames')),
    'canonical league results should not bloat saves with replay frames');
  [...leagueResult.matches, leagueResult.finalMatch].forEach((match, matchIndex) => {
    assert.ok(Object.prototype.hasOwnProperty.call(match, 'finType')
      && Object.prototype.hasOwnProperty.call(match, 'finMove'),
    `match ${matchIndex + 1} must preserve its finish`);
    assert.ok(Object.prototype.hasOwnProperty.call(match, 'winAttribution'),
      `match ${matchIndex + 1} must preserve who finished whom`);
  });

  const applied = Engine.springTagLeague.apply(state, leagueResult).state;
  assert.strictEqual(applied.springTagLeagueCompletedSeason, applied.season,
    'a completed league must record its season so it cannot run again');
  assert.strictEqual(Engine.springTagLeague.isCompletedThisSeason(applied), true,
    'the completed-season guard must recognize a normal completed league');
  const legacyEarlyResult = {
    ...applied,
    springTagLeagueCompletedSeason: undefined,
    springTagLeague: { ...applied.springTagLeague, replayWeek: 2 },
  };
  assert.strictEqual(Engine.springTagLeague.isCompletedThisSeason(legacyEarlyResult), true,
    'an old save with an out-of-week result must not schedule the league again at Week 12');
  assert.strictEqual(Engine.springTagLeague.isReplayReady(applied), true,
    '開催年の第12週に確定した完全チームだけがリプレイ可能');
  assert.strictEqual(Engine.springTagLeague.isReplayReady({ ...applied, week: 2 }), false,
    '開発者モードなどで開催週を越えた予約を再生してはいけない');
  assert.strictEqual(Engine.springTagLeague.isReplayReady({ ...applied, season: applied.season + 1 }), false,
    '翌シーズンへ持ち越した予約を再生してはいけない');
  assert.strictEqual(Engine.springTagLeague.isReplayReady({ ...applied, roster: applied.roster.filter(f => f.id !== applied.springTagLeague.teams.find(t => t.orgId === 'player').f1Id) }), false,
    '参加者が欠けた予約を再生してはいけない');
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
    { isFinal: true, matchIndex: 12 }
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
assert.ok(app.includes('_shouldStartSpringTagLeagueReplay()') && app.includes('_discardStaleSpringTagLeagueReplay()'),
  'spring tag league must discard replay reservations outside the scheduled week');
assert.ok(!app.includes('_showSpringTagCardIntro(stl,'),
  'spring tag league must not reuse the PPV-style vertical card intro');
assert.ok(ui.includes('onclick="App.stlWatchMatch()">🎬 観戦する</button>') && ui.includes('結果を見る ▶'),
  'league matches and the final must offer watch or result choices');
assert.ok(mobile.includes('.stl-progress-btn-row .btn { flex: 1 1 130px;') && mobile.includes('min-height: 44px;'),
  'spring tag watch choices must remain tappable on phones');

console.log('spring-tag-league-watch-test: ok');
