'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

function fresh(seed = 9200) {
  return {
    ...Engine.createInitialState(seed, true),
    season: 5,
    week: 1,
    offSeason: false,
    weekPhase: 'manage',
    industryNewsQueue: [],
  };
}

function awardTo(state, fighterId) {
  return Engine.unifiedTitle.awardTournamentWinner(state, fighterId).state;
}

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} end not found`);
}

// A: 戴冠・防衛・奪取を別イベントとして記録し、世代番号も履歴と個人記録で揃える。
{
  let state = { ...fresh(), season: 4, week: 48 };
  const champion = state.roster[0];
  const challenger = state.aiOrgs.org_s.roster[0];
  state = awardTo(state, champion.id);
  assert.deepStrictEqual(
    state.roster.find(f => f.id === champion.id).careerRecord.history.at(-1),
    { type: 'unifiedTitle', result: 'won', season: 4, week: 48 },
  );
  state = { ...state, season: 5, week: 12 };
  state = Engine.unifiedTitle.resolveMatch(state, {
    championId: champion.id, challengerId: challenger.id, winnerId: champion.id,
  });
  assert.strictEqual(
    state.roster.find(f => f.id === champion.id).careerRecord.history.at(-1).result,
    'defense',
  );
  state = { ...state, week: 24 };
  state = Engine.unifiedTitle.resolveMatch(state, {
    championId: champion.id, challengerId: challenger.id, winnerId: challenger.id,
  });
  const captured = state.aiOrgs.org_s.roster.find(f => f.id === challenger.id).careerRecord.history.at(-1);
  assert.deepStrictEqual(captured, {
    type: 'unifiedTitle', result: 'captured', season: 5, week: 24,
  });
  assert.strictEqual(Object.hasOwn(state.unifiedTitle.history.at(-1), 'generation'), false);
}

// I-1: 統一イベントを含まない導入前フィクスチャは35.5ptのまま。
const legacyHofFixture = { history: [
  { type: 'debut', season: 1, week: 1 },
  { type: 'titleWin', season: 2, week: 2 },
  { type: 'titleDefense', season: 2, week: 4, count: 2 },
  { type: 'juniorTournament', season: 2, result: 'champion' },
  { type: 'springTagLeague', season: 3, result: 'champion' },
  { type: 'autumnWar', season: 3, result: 'champion', wins: 2 },
  { type: 'ppvTournament', season: 4, result: 'runnerUp' },
  { type: 'ppvMainEvent', season: 5, isSummit: true, won: true },
  { type: 'war', season: 5, won: true },
  { type: 'awardMVP', season: 5 },
  { type: 'awardRookie', season: 2 },
  { type: 'awardBestMatch', season: 5 },
  { type: 'awardMedia', season: 5 },
  { type: 'domeMain', season: 6, result: 'win' },
] };
assert.strictEqual(Engine.awards.calcHofPoints(legacyHofFixture), 35.5);

// B: 殿堂+2/+2/+0と実績リストは共通集計経路で一致する。
{
  const record = { history: legacyHofFixture.history.concat([
    { type: 'unifiedTitle', result: 'won', season: 4, week: 48 },
    { type: 'unifiedTitle', result: 'captured', season: 5, week: 12 },
    { type: 'unifiedTitle', result: 'defense', season: 5, week: 24 },
  ]) };
  assert.strictEqual(Engine.awards.calcHofPoints(record), 39.5);
  const texts = Engine.awards.buildCareerHighlights(record, 'PLAYER', {
    unifiedTitle: { history: [
      { type: 'creation', season: 4, week: 48 },
      { type: 'move', season: 5, week: 12 },
    ] },
  }).map(row => row.text);
  assert.ok(texts.includes('全国統一王座 戴冠(第1代)'));
  assert.ok(texts.includes('全国統一王座 奪取'));
  assert.ok(texts.includes('全国統一王座 防衛1度'));
}

// I-2: 既存POINTSキーと、統一イベントなしのcalcSeasonPointsを導入前値で固定する。
{
  const existingPoints = {
    PPV_CHAMPION: 30, PPV_RUNNER_UP: 15, PPV_OTHER_WIN: 10, PPV_OTHER_LOSS: 5,
    TITLE_WIN: 11, TITLE_DEFENSE_PER: 13, TITLE_HOLD_AT_END: 8,
    DOME_MAIN_APPEARANCE: 4, BIG_MATCH_MQ85: 3, BIG_MATCH_MQ90: 4, BIG_MATCH_MQ95: 5,
    SEASON_BEST_MQ_BASE: 70, WAR_WIN: 16, WAR_LOSS: -12, B3_DECLINE: -4, B3_REJECTED: 4,
    ORG_RANK_1: 10, ORG_RANK_2: 5, POP_THRESHOLD: 50, POP_MULT: 0.4,
    DRAW_THRESHOLD: 30, DRAW_MULT: 0.3,
    TENCHOSEN_WIN_R1: 3, TENCHOSEN_WIN_QF: 5, TENCHOSEN_WIN_SF: 8,
    TENCHOSEN_WIN_FINAL: 12, TENCHOSEN_CHAMPION_BONUS: 6, TENCHOSEN_RUNNER_UP_BONUS: 3,
    AUTUMN_WAR_PER_WIN: 3, AUTUMN_WAR_TEAM_CHAMPION: 7, AUTUMN_WAR_TEAM_RUNNER_UP: 3,
    SPRING_TAG_CHAMPION: 8, SPRING_TAG_RUNNER_UP: 4, MQ_RECORD_BREAK: 5,
  };
  Object.entries(existingPoints).forEach(([key, value]) => assert.strictEqual(Engine.mvpRace.POINTS[key], value, key));
  const fighter = {
    id: 77, name: 'fixture', pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    popularity: 55, drawPower: 35, age: 24,
    careerRecord: { history: [
      { type: 'debut', season: 1, week: 1 },
      { type: 'ppvMainEvent', season: 5, isSummit: false, won: true },
      { type: 'titleWin', season: 5 }, { type: 'titleDefense', season: 5 },
      { type: 'domeMain', season: 5 }, { type: 'bigMatch', season: 5, mq: 90 },
      { type: 'war', season: 5, won: true }, { type: 'b3Rejected', season: 5 },
      { type: 'ppvTournament', season: 5, result: 'quarterFinal' },
      { type: 'autumnWar', season: 5, result: 'runnerUp', wins: 2 },
      { type: 'springTagLeague', season: 5, result: 'champion' },
    ] },
  };
  const state = {
    season: 5, rankings: [{ orgId: 'player', rank: 2 }],
    titles: { world: { championId: 77 } }, aiOrgs: {}, seasonStats: {},
    mqRecord: null, mqRecordTag: null, unifiedTitle: null,
  };
  const result = Engine.mvpRace.calcSeasonPoints(fighter, 'player', 5, state);
  assert.strictEqual(result.points, 158.5);
  assert.strictEqual(Object.hasOwn(result.breakdown, 'unified'), false);
}

// C: MVPは防衛20/奪取20/年末保持12、wonは0。
{
  const fighter = {
    id: 91, pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    popularity: 0, drawPower: 0, age: 24,
    careerRecord: { history: [
      { type: 'debut', season: 1, week: 1 },
      { type: 'unifiedTitle', result: 'won', season: 5 },
      { type: 'unifiedTitle', result: 'captured', season: 5 },
      { type: 'unifiedTitle', result: 'defense', season: 5 },
      { type: 'unifiedTitle', result: 'defense', season: 5 },
    ] },
  };
  const baseState = {
    season: 5, rankings: [], titles: { world: { championId: null } }, aiOrgs: {},
    seasonStats: {}, mqRecord: null, mqRecordTag: null, unifiedTitle: null,
  };
  const withoutUnified = Engine.mvpRace.calcSeasonPoints(
    { ...fighter, careerRecord: { history: fighter.careerRecord.history.slice(0, 1) } },
    'player', 5, baseState,
  );
  const result = Engine.mvpRace.calcSeasonPoints(fighter, 'player', 5, {
    ...baseState, unifiedTitle: { championId: fighter.id },
  });
  assert.strictEqual(result.breakdown.unified, 72);
  assert.strictEqual(result.points - withoutUnified.points, 72);
  assert.deepStrictEqual(
    Engine.mvpRace._collectFactChips(fighter, 5, result.breakdown.meta).slice(0, 3),
    [
      { icon: '🌐', text: '統一王座防衛2回' },
      { icon: '🌐', text: '統一王座奪取' },
      { icon: '🌐', text: '現統一王者' },
    ],
  );
}

// D/I-4: 非天頂戦年だけ年末統一王者データを作り、天頂戦年・空位は静かに省略する。
{
  let state = { ...fresh(9210), season: 4, week: 48 };
  const champion = state.aiOrgs.org_s.roster[0];
  const challenger = state.roster[0];
  state = awardTo(state, champion.id);
  state = { ...state, season: 5, week: 12 };
  state = Engine.unifiedTitle.resolveMatch(state, {
    championId: champion.id, challengerId: challenger.id, winnerId: champion.id,
  });
  state = { ...state, week: 48 };
  const normalAwards = Engine.awards.generate(Engine.rng.create(1), state);
  assert.strictEqual(normalAwards.unifiedChampion.id, champion.id);
  assert.strictEqual(normalAwards.unifiedChampion.isPlayerOrg, false);
  assert.strictEqual(normalAwards.unifiedChampion.defensesThisSeason, 1);
  assert.strictEqual(Engine.awards.hasDisplayableAwards({ unifiedChampion: normalAwards.unifiedChampion }), true);
  const tournamentAwards = Engine.awards.generate(Engine.rng.create(2), { ...state, season: 8 });
  assert.strictEqual(tournamentAwards.unifiedChampion, undefined);
  const vacantAwards = Engine.awards.generate(Engine.rng.create(3), {
    ...state, unifiedTitle: { ...state.unifiedTitle, championId: null, orgId: null },
  });
  assert.strictEqual(vacantAwards.unifiedChampion, undefined);
}

// D/I-4 UI配線: オーロラ帯、今年の大会への条件追加、一回化ガード、時限保険。
{
  const ui = read('src/ui-common.js');
  const ceremony = functionSource(ui, 'showAwardsCeremony');
  assert.ok(ui.includes('function _buildUnifiedChampionAward(d)'));
  assert.ok(ui.includes('<div class="unified-beltband">全国統一王者</div>'));
  assert.ok(ceremony.includes('if (awards.unifiedChampion)'));
  assert.ok(/function finishCeremony\([^)]*\) \{\s*if \(finished\) return;/.test(ceremony));
  assert.ok(ceremony.includes("completionTimer = setTimeout(() => finishCeremony('timeout')"));
}

// E/I-5: historyを世代別に復元し、未創設ならセクションごと返さない。
{
  const ui = read('src/ui-render.js');
  const makeReigns = new Function('G', 'Engine',
    `${functionSource(ui, '_recordBookUnifiedReigns')}; return _recordBookUnifiedReigns;`)(
    {
      season: 8, week: 48,
      unifiedTitle: {
        championId: null, defenses: 0,
        history: [
          { type: 'creation', season: 4, week: 48, championId: 1, orgId: 'player' },
          { type: 'defense', season: 5, week: 12, defenses: 1 },
          { type: 'move', season: 5, week: 24, winnerId: 2, winnerOrgId: 'org_s' },
          { type: 'defense', season: 6, week: 12, defenses: 1 },
          { type: 'return', season: 8, week: 47 },
          { type: 'crown', season: 8, week: 48, championId: 3, orgId: 'org_a' },
          { type: 'vacate', season: 8, week: 48 },
        ],
      },
    },
    Engine,
  );
  const sources = [1, 2, 3].map(id => ({ fighter: { id, name: `選手${id}` }, orgName: '' }));
  const reigns = makeReigns(sources);
  assert.deepStrictEqual(reigns.map(row => row.generation), [1, 2, 3]);
  assert.deepStrictEqual(reigns.map(row => row.endReason), ['陥落', '返還', '返上']);
  const renderUnified = functionSource(ui, '_renderDbUnifiedTitleRecords');
  assert.ok(renderUnified.includes("if (!G.unifiedTitle) return '';"));
  assert.ok(!renderUnified.includes('残っていません'));
}

console.log('unified-title-p4-test: ok');
