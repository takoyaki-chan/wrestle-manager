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

function score(history, stateOverrides, fighterId, fighterOverrides) {
  const id = fighterId == null ? FIGHTER_ID : fighterId;
  const f = Object.assign(fighter(id, history), fighterOverrides || {});
  return Engine.mvpRace.calcSeasonPoints(f, 'player', SEASON, state(stateOverrides));
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
  [{ result: 'champion', wins: 2 }, 36],   // v3(2026-09-17): 1勝8 + 優勝20
  [{ result: 'semiFinal', wins: 1 }, 8],
  [{ result: 'runnerUp', wins: 0 }, 10],
].forEach(([data, expected]) => {
  const event = { type: 'autumnWar', season: SEASON, ...data };
  assert.strictEqual(delta([event]), expected, `対抗戦 ${data.result}/${data.wins}勝 の増分`);
  assert.strictEqual(score([event]).breakdown.autumnWar, expected, '対抗戦内訳');
});

// 春のタッグリーグ: 個人ごとの最終順位だけを読む。
[
  ['champion', 30],   // v3: PPV優勝と同格
  ['runnerUp', 15],
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
assert.strictEqual(baseline.breakdown.upset + baseline.breakdown.growth + baseline.breakdown.junior, 0,
  'v3の新カテゴリ(格上撃破/伸び/JT)も該当なしなら0');

// ── v3(2026-09-17): ジュニアトーナメント・防衛の中身・格上撃破・人気の伸び ──
{
  const P = Engine.mvpRace.POINTS;
  assert.strictEqual(delta([{ type: 'juniorTournament', season: SEASON, result: 'champion' }]), P.JUNIOR_TOURNAMENT_CHAMPION,
    'ジュニアトーナメント優勝の加点');
  assert.strictEqual(delta([{ type: 'juniorTournament', season: SEASON, result: 'runnerUp' }]), P.JUNIOR_TOURNAMENT_RUNNER_UP,
    'ジュニアトーナメント準優勝の加点');
  assert.strictEqual(delta([{ type: 'juniorTournament', season: SEASON, result: 'semiFinal' }]), 0, 'JTベスト4は加点なし');

  // 不変条件1: 記録の無い旧イベントは難度1.0(旧セーブ互換=従来と同じ13点)
  const def = (selfOvr, oppOvr) => ({ type: 'titleDefense', season: SEASON, ...(selfOvr != null ? { selfOvr, oppOvr } : {}) });
  assert.strictEqual(delta([def()]), P.TITLE_DEFENSE_PER, '格の記録が無い防衛は従来どおり');
  assert.strictEqual(Engine.mvpRace.titleDifficulty({ selfOvr: 90, oppOvr: 90 }), 1, '互角の相手は難度1.0');
  // 不変条件2: 同じ防衛回数なら、相手が強いほど高い(単調)。下限・上限で頭打ち
  const gaps = [30, 20, 14, 10, 5, 0, -5, -10, -20];
  const diffs = gaps.map(g => Engine.mvpRace.titleDifficulty({ selfOvr: 100, oppOvr: 100 - g }));
  for (let i = 1; i < diffs.length; i++) assert.ok(diffs[i] >= diffs[i - 1], `難度は相手が強いほど非減少 (${gaps[i - 1]}→${gaps[i]})`);
  assert.strictEqual(diffs[0], P.TITLE_DIFFICULTY_MIN, '大差の格下相手は下限');
  assert.strictEqual(diffs[diffs.length - 1], P.TITLE_DIFFICULTY_MAX, '大差の格上相手は上限');
  assert.ok(delta([def(100, 85)]) < delta([def(100, 100)]), '相手不在の防衛は互角の防衛より安い');
  assert.ok(delta([def(100, 85)]) > 0, 'それでも防衛は必ず加点(負の点にならない)');
  // 不変条件3: 統一王座戦も同じ物差し。奪取=防衛の1勝対称は難度込みでも維持
  const uni = result => ({ type: 'unifiedTitle', result, season: SEASON, selfOvr: 100, oppOvr: 92 });
  assert.strictEqual(delta([uni('captured')]), delta([uni('defense')]), '同じ相手なら奪取と防衛は同点');

  // 不変条件4: 格上撃破は単調増加・負けは減点しない・季が違えば数えない
  const withUpsets = (normal, big, season = SEASON) => score([], {}, FIGHTER_ID, { seasonUpsets: { season, normal, big } }).points - score([]).points;
  assert.strictEqual(withUpsets(1, 0), P.UPSET_NORMAL);
  assert.strictEqual(withUpsets(0, 1), P.UPSET_BIG_MATCH);
  assert.strictEqual(withUpsets(2, 1), P.UPSET_NORMAL * 2 + P.UPSET_BIG_MATCH);
  assert.strictEqual(withUpsets(3, 0, SEASON - 1), 0, '前季の撃破は今季に寄与しない');
  const f0 = { id: 1 };
  assert.strictEqual(Engine.mvpRace.creditUpset(f0, 80, 80 + P.UPSET_MIN_GAP - 1, false, SEASON), f0, '差が閾値未満なら数えない(同じ参照)');
  const f1 = Engine.mvpRace.creditUpset(f0, 80, 80 + P.UPSET_MIN_GAP, false, SEASON);
  assert.deepStrictEqual(f1.seasonUpsets, { season: SEASON, normal: 1, big: 0 });
  const f2 = Engine.mvpRace.creditUpset(f1, 80, 95, true, SEASON);
  assert.deepStrictEqual(f2.seasonUpsets, { season: SEASON, normal: 1, big: 1 });
  assert.deepStrictEqual(Engine.mvpRace.creditUpset(f2, 80, 95, false, SEASON + 1).seasonUpsets, { season: SEASON + 1, normal: 1, big: 0 },
    '季が変わればカウンタは新しく始まる');

  // 不変条件5: 人気の伸びは上限つき・下がっても減点なし・季首スナップショットが無ければ0
  const withPop = (start, now) => score([], {}, FIGHTER_ID, { seasonStartPop: start, popularity: now }).points
    - score([], {}, FIGHTER_ID, { popularity: now }).points;
  assert.strictEqual(withPop(20, 30), 10 * P.POP_GROWTH_MULT);
  assert.strictEqual(withPop(10, 90), P.POP_GROWTH_CAP, '伸びの加点は上限で止まる(決め手にしない)');
  assert.strictEqual(withPop(60, 40), 0, '人気が下がっても減点しない');
}

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
