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
    bestTagTeam: null, chronicle: null,
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

// ── ケース4: 新人王＝ジュニアトーナメント優勝者 ──
{
  const rookie = fighter(7, '若手', []);
  rookie.age = 18;
  const a = Engine.awards.generate(rng, buildState({
    roster: [rookie],
    jt: { champion: Object.assign({}, rookie, { _orgId: 'player', _orgName: 'PLAYER' }), runnerUp: null },
  }));
  assert.ok(a.jtChampion, 'JT優勝者が生成されること');
  assert.strictEqual(a.rookieOfYear, a.jtChampion, '新人王はJT優勝者と同一であること');
  assert.strictEqual(a.rookieOfYear.age, 18, '年齢が引き継がれること（スライド表示用）');
}

// ── ケース5: JT未開催なら新人王も出ない ──
{
  const a = Engine.awards.generate(rng, buildState({ roster: [fighter(8, '誰か', [])] }));
  assert.strictEqual(a.jtChampion, null);
  assert.strictEqual(a.rookieOfYear, null, 'JT未開催年は新人王なし');
}

console.log('year-end-awards-generate-test: ok');
