'use strict';
// Engine.awards.generate の実データ検証。
//  - 秋の4団体勝ち残り対抗戦の優勝チームが careerRecord から復元できること
//  - 新人王がジュニアトーナメント優勝者と同一であること
//  - 中止年・前シーズンの履歴を拾わないこと

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js'].forEach(loadAsGlobal);

const SEASON = 4;

function fighter(id, name, history) {
  return {
    id, name, portrait: null, style: 'Allround', age: 24, popularity: 40, drawPower: 20,
    pw: 60, sp: 60, te: 60, st: 60, mn: 60, condition: 70, trust: 60,
    wins: 5, losses: 3, draws: 0, careerSeasons: 3,
    careerRecord: Object.assign(Engine.career.createRecord(), { history: history || [] }),
  };
}
const awEv = (season, result, wins) => ({ type: 'autumnWar', season, result, wins });
const stEv = (season, result, partnerId) => ({ type: 'springTagLeague', season, result, partnerId });
const jtEv = (season, result, finalOpponentName) => ({ type: 'juniorTournament', season, result, finalOpponentName });

function buildState(opts) {
  const o = opts || {};
  return {
    season: SEASON, week: 48, offSeason: true, offWeek: 1,
    orgName: 'PLAYER', rngSeed: 99,
    roster: o.roster || [],
    aiOrgs: o.aiOrgs || {},
    titles: { world: { championId: null, defenses: 0 } },
    titleEstablished: false,
    rankings: [{ orgId: 'player', rank: 1, name: 'PLAYER' }],
    mvpRace: { rankings: [] },
    seasonStats: { bestMQ: 0, bestMQMatch: '' },
    allHallOfFame: {}, hallOfFame: [], retiredFighters: [], freeAgents: [],
    bestTagTeam: o.bestTagTeam || null, chronicle: null,
    _juniorTournamentResult: o.jt || null,
  };
}

const rng = Engine.rng.create(1234);

// ── ケース1: プレイヤー団体が秋の対抗戦を制した年 ──
{
  const champs = [
    fighter(1, '先鋒', [awEv(SEASON, 'champion', 1)]),
    fighter(2, '中堅', [awEv(SEASON, 'champion', 2)]),
    fighter(3, '大将', [awEv(SEASON, 'champion', 0)]),
  ];
  const others = [fighter(4, '控え', []), fighter(5, '敗退組', [awEv(SEASON, 'runnerUp', 1)])];
  const a = Engine.awards.generate(rng, buildState({ roster: champs.concat(others) }));

  assert.ok(a.autumnWarChampion, '優勝チームが生成されること');
  assert.strictEqual(a.autumnWarChampion.orgName, 'PLAYER');
  assert.strictEqual(a.autumnWarChampion.isPlayerOrg, true);
  assert.strictEqual(a.autumnWarChampion.season, SEASON);
  assert.deepStrictEqual(
    a.autumnWarChampion.fighters.map(f => f.name), ['先鋒', '中堅', '大将'],
    '優勝チームの3名だけが載ること（準優勝・不出場は除外）'
  );
}

// ── ケース2: 前シーズンの優勝履歴は拾わない ──
{
  const stale = [
    fighter(1, '去年の先鋒', [awEv(SEASON - 1, 'champion', 2)]),
    fighter(2, '去年の中堅', [awEv(SEASON - 1, 'champion', 1)]),
  ];
  const a = Engine.awards.generate(rng, buildState({ roster: stale }));
  assert.strictEqual(a.autumnWarChampion, null, '前年の優勝は今年の表彰に出ないこと');
}

// ── ケース3: 中止年（出場履歴なし）は該当なし ──
{
  const a = Engine.awards.generate(rng, buildState({ roster: [fighter(1, '誰か', [])] }));
  assert.strictEqual(a.autumnWarChampion, null, '中止年は静かに該当なしとなること');
}

// ── ケース4: 新人王＝ジュニアトーナメント優勝者。**careerRecord から導出する** ──
// `_juniorTournamentResult` は新聞生成後に null 化されるため、offWeek1 時点では常に空。
// state 側を渡さなくても履歴だけで復元できることを保証する（2026-07-30 の回帰修正）。
{
  const rookie = fighter(7, '若手', [jtEv(SEASON, 'champion', '決勝の相手')]);
  rookie.age = 18;
  const alsoRan = fighter(9, '準優勝', [jtEv(SEASON, 'runnerUp', '若手')]);
  const a = Engine.awards.generate(rng, buildState({ roster: [rookie, alsoRan], jt: null }));

  assert.ok(a.jtChampion, '_juniorTournamentResult が無くてもJT優勝者が復元されること');
  assert.strictEqual(a.jtChampion.name, '若手');
  assert.strictEqual(a.rookieOfYear, a.jtChampion, '新人王はJT優勝者と同一であること');
  assert.strictEqual(a.rookieOfYear.age, 18, '年齢が引き継がれること（スライド表示用）');
  assert.strictEqual(a.jtChampion.runnerUp.name, '決勝の相手', '決勝の相手が履歴から引けること');
}

// ── ケース5: JT未開催なら新人王も出ない ──
{
  const a = Engine.awards.generate(rng, buildState({ roster: [fighter(8, '誰か', [])] }));
  assert.strictEqual(a.jtChampion, null);
  assert.strictEqual(a.rookieOfYear, null, 'JT未開催年は新人王なし');
}

// ── ケース6: 春のタッグリーグ優勝も careerRecord から導出する ──
// 旧実装は state.bestTagTeam の2名を現ロスターから引けないと丸ごと捨てていた。
{
  const pair = [
    fighter(21, 'タッグ上', [stEv(SEASON, 'champion', 22)]),
    fighter(22, 'タッグ下', [stEv(SEASON, 'champion', 21)]),
  ];
  const losers = [fighter(23, '準優勝組', [stEv(SEASON, 'runnerUp', 24)])];
  const a = Engine.awards.generate(rng, buildState({ roster: pair.concat(losers), bestTagTeam: null }));

  assert.ok(a.springTagChampion, 'bestTagTeam が無くても優勝ペアが復元されること');
  assert.deepStrictEqual(
    a.springTagChampion.fighters.map(f => f.name), ['タッグ上', 'タッグ下'],
    '優勝ペアの2名だけが載ること（準優勝は除外）'
  );
  assert.strictEqual(a.springTagChampion.orgName, 'PLAYER');
}

// ── ケース7: 前シーズンの春タッグ／JT履歴は拾わない ──
{
  const stale = [
    fighter(31, '去年のタッグ', [stEv(SEASON - 1, 'champion', 32)]),
    fighter(32, '去年の相棒', [stEv(SEASON - 1, 'champion', 31)]),
    fighter(33, '去年のJT王者', [jtEv(SEASON - 1, 'champion', '誰か')]),
  ];
  const a = Engine.awards.generate(rng, buildState({ roster: stale }));
  assert.strictEqual(a.springTagChampion, null, '前年のタッグ優勝は出ないこと');
  assert.strictEqual(a.jtChampion, null, '前年のJT優勝は出ないこと');
  assert.strictEqual(a.rookieOfYear, null, '前年のJT優勝者が新人王にならないこと');
}

// ── ケース8: 現ロスターから消えた選手も FA / 引退者から引ける ──
{
  const state = buildState({ roster: [fighter(41, '在籍組', [awEv(SEASON, 'champion', 2)])] });
  state.freeAgents = [fighter(42, '解雇組', [awEv(SEASON, 'champion', 1)])];
  state.retiredFighters = [fighter(43, '引退組', [awEv(SEASON, 'champion', 0)])];
  const a = Engine.awards.generate(rng, state);
  assert.ok(a.autumnWarChampion, '優勝チームが生成されること');
  assert.deepStrictEqual(
    a.autumnWarChampion.fighters.map(f => f.name), ['在籍組', '解雇組', '引退組'],
    'ロスター外の出場者も欠けずに載ること'
  );
}

console.log('year-end-awards-generate-test: ok');
