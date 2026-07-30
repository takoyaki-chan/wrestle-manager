'use strict';
// MVPレースが近年追加された大会結果とMQ歴代記録を集計することの振る舞い検証。

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
const FIGHTER_ID = 101;
const OPPONENT_ID = 202;

function fighter(id, history) {
  return {
    id, name: `選手${id}`, portrait: null, style: 'Allround', age: 24,
    popularity: 40, drawPower: 20, pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    condition: 70, trust: 60, wins: 5, losses: 3, draws: 0, careerSeasons: 3,
    careerRecord: Object.assign(Engine.career.createRecord(), { history: history || [] }),
  };
}

function state(overrides) {
  return Object.assign({
    season: SEASON, week: 48, rngSeed: 99,
    roster: [], aiOrgs: {}, retiredFighters: [],
    titles: { world: { championId: null } },
    rankings: [], seasonStats: { bestMQ: 0 },
    mqRecord: null, mqRecordTag: null,
  }, overrides || {});
}

function score(history, stateOverrides, fighterId) {
  const id = fighterId == null ? FIGHTER_ID : fighterId;
  return Engine.mvpRace.calcSeasonPoints(fighter(id, history), 'player', SEASON, state(stateOverrides));
}

function delta(history, stateOverrides, fighterId) {
  return score(history, stateOverrides, fighterId).points - score([], stateOverrides, fighterId).points;
}

// 天頂戦: 最終順位から単一敗退トーナメントの勝ち星を正しく復元する。
const tenchosenExpected = {
  champion: 34,
  runnerUp: 19,
  semiFinal: 8,
  quarterFinal: 3,
  firstRound: 0,
};
Object.entries(tenchosenExpected).forEach(([result, expected]) => {
  const event = { type: 'ppvTournament', season: SEASON, result };
  assert.strictEqual(delta([event]), expected, `天頂戦 ${result} の増分`);
  assert.strictEqual(score([event]).breakdown.tenchosen, expected, `天頂戦 ${result} の内訳`);
});
assert.strictEqual(delta([{ type: 'ppvTournament', season: SEASON - 4, result: 'champion' }]), 0,
  '天頂戦の過去シーズン履歴は今季に寄与しない');

// 秋の4団体勝ち残り対抗戦: 勝ち星とチーム順位を合算する。
[
  [{ result: 'champion', wins: 2 }, 13],
  [{ result: 'semiFinal', wins: 1 }, 3],
  [{ result: 'runnerUp', wins: 0 }, 3],
].forEach(([data, expected]) => {
  const event = { type: 'autumnWar', season: SEASON, ...data };
  assert.strictEqual(delta([event]), expected, `対抗戦 ${data.result}/${data.wins}勝 の増分`);
  assert.strictEqual(score([event]).breakdown.autumnWar, expected, '対抗戦内訳');
});

// 春のタッグリーグ: 個人ごとの最終順位だけを読む。
[
  ['champion', 8],
  ['runnerUp', 4],
  ['third', 0],
].forEach(([result, expected]) => {
  const event = { type: 'springTagLeague', season: SEASON, result, partnerId: OPPONENT_ID };
  assert.strictEqual(delta([event]), expected, `春タッグ ${result} の増分`);
  assert.strictEqual(score([event]).breakdown.springTag, expected, '春タッグ内訳');
});

// MQ歴代記録: 勝敗を問わず保持者全員に加点し、単複はスタックする。
const singleRecord = { value: 96, holderIds: [FIGHTER_ID, OPPONENT_ID], season: SEASON };
const tagRecord = { value: 97, holderIds: [FIGHTER_ID, 303, OPPONENT_ID, 404], season: SEASON };
assert.strictEqual(score([], { mqRecord: singleRecord }).points - score([]).points, 5, 'シングル歴代記録の保持者は+5');
assert.strictEqual(score([], { mqRecord: singleRecord }, OPPONENT_ID).points - score([], {}, OPPONENT_ID).points, 5,
  'シングル歴代記録の敗者側保持者も+5');
assert.strictEqual(score([], { mqRecord: singleRecord, mqRecordTag: tagRecord }).points - score([]).points, 10,
  '単複の歴代記録は+10');
assert.strictEqual(score([], { mqRecord: { ...singleRecord, season: SEASON - 1 } }).points - score([]).points, 0,
  '過去シーズンのMQ歴代記録は寄与しない');
assert.strictEqual(score([], { mqRecord: singleRecord, mqRecordTag: tagRecord }).breakdown.meta.mqRecordBroken, 2,
  'MQ記録更新数を表示用メタデータにも保持する');

// 回帰: 新カテゴリがない選手は既存の合計を変えず、新しい内訳は0のまま。
const baseline = score([]);
assert.strictEqual(baseline.breakdown.tenchosen, 0, '天頂戦内訳は0');
assert.strictEqual(baseline.breakdown.autumnWar, 0, '対抗戦内訳は0');
assert.strictEqual(baseline.breakdown.springTag, 0, '春タッグ内訳は0');
assert.strictEqual(baseline.points,
  baseline.breakdown.ovr + baseline.breakdown.ppv + baseline.breakdown.title + baseline.breakdown.dome
  + baseline.breakdown.mq + baseline.breakdown.war + baseline.breakdown.b3 + baseline.breakdown.orgRank
  + baseline.breakdown.draw,
  '新カテゴリなしでは合計が既存カテゴリの和に一致する');
assert.strictEqual(delta([{ type: 'juniorTournament', season: SEASON, result: 'champion' }]), 0,
  'ジュニアトーナメントにはMVP加点を追加しない');

// 引退年の選手も recalcRanking が同じ集計関数を通し、大会加点を保持する。
const retiredId = 909;
const retired = fighter(retiredId, [{ type: 'ppvTournament', season: SEASON, result: 'champion' }]);
retired._orgIdAtRetire = 'player';
const retiredRanking = Engine.mvpRace.recalcRanking(state({
  retiredFighters: [retired],
  retiredSeasons: { [retiredId]: SEASON },
})).rankings;
assert.strictEqual(retiredRanking[0].breakdown.tenchosen, 34, '当年引退選手にも天頂戦加点が効く');

// 4面が利用する表示用データは、内部トークンではなくプレイヤー向けの大会名を返す。
const displayScore = score([{ type: 'ppvTournament', season: SEASON, result: 'champion' }]);
const displayLabels = Engine.mvpRace._topElements(displayScore.breakdown.meta);
assert.ok(displayLabels.includes('天頂戦優勝'), 'トップ要素に天頂戦の日本語ラベルが出る');
assert.ok(!displayLabels.some(label => /ppvTournament|autumnWar|springTagLeague|MQ/.test(label)),
  'トップ要素に内部トークンを出さない');

console.log('mvp-race-new-events-test: ok');
