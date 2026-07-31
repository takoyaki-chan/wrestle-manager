'use strict';
// task-62: AI団体の王座で「挑戦者に幅を持たせる」修正の回帰テスト。
//
// 背景(docs/ai-title-defense-survey-v0.1.md, docs/codex-tasks/task-62-ai-title-challenger-variety.md):
// 旧Fix3ブロック(management.js ~9130行付近)は、王者の対戦相手が挑戦資格者
// (Engine.title.getEligibleChallengers policy='ai')でない場合、資格者中の**最高OVR1人**へ
// 決め打ちで差し替えていた。このため王者は毎回その時点の最強と当たり続け、防衛が続かなかった
// (修正前 平均0.7〜0.8回/AI3団体)。この修正は「決め打ち1名」を「上位候補からの重み付き抽選」に
// 変える。挑戦資格の判定(getEligibleChallengers)そのものは変えない。調整値は
// src/data.js の AI_TITLE_CHALLENGER_CFG に集約する(コード直書き禁止)。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

function withStubs(stubs, fn) {
  const originals = [];
  Object.entries(stubs).forEach(([pathKey, value]) => {
    const parts = pathKey.split('.');
    let target = global;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
    const key = parts[parts.length - 1];
    originals.push({ target, key, value: target[key] });
    target[key] = value;
  });
  try {
    fn();
  } finally {
    originals.reverse().forEach(({ target, key, value }) => {
      target[key] = value;
    });
  }
}

function makeRosterFighter(id, name, ovr, capOvr, extra = {}) {
  return {
    id,
    name,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    trainCap: { pw: capOvr, sp: capOvr, te: capOvr, st: capOvr, mn: capOvr },
    condition: 80,
    injury: null,
    wins: 0,
    losses: 0,
    draws: 0,
    popularity: 40,
    style: 'Allround',
    role: 'Face',
    age: 24,
    traits: [],
    trust: 50,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    ...extra,
  };
}

function makeShowState(roster, titles, extra = {}) {
  return {
    rngSeed: 777,
    season: 5,
    week: 20, // 偶数 = isShowWeek、かつ PPV_SHOW_WEEK(48)ではない
    titles: { world: { championId: null, defenses: 0 } },
    aiOrgs: {
      org_s: {
        roster,
        titles,
        coaches: [],
        coachAssign: {},
        orgPop: 75,
        lockerRoomMorale: 60,
        matchupLog: [],
        showCount: 0,
      },
    },
    ...extra,
  };
}

const AI_PROCESS_STUBS = {
  // 注意: Engine.rng.float はここで固定値にスタブしない。挑戦者の重み付き抽選
  // (Engine.rng.weighted)が内部でEngine.rng.floatを使うため、固定してしまうと
  // 常に同じ候補しか選ばれなくなり、抽選そのものをテストできなくなる。
  'Engine.trust.applyShowTrust': roster => ({ roster }),
  'Engine.coach.getMatchGrowthBonus': () => 0,
  'Engine.coach.getCondBonus': () => 0,
  'Engine.coach.getInjuryMult': () => 1,
  'Engine.growthEvents.checkAndApplyBreakthrough': () => null,
  'Engine.growthEvents.checkSlump': () => false,
  'Engine.growthEvents.applySlump': fighter => fighter,
  'Engine.growthEvents.updateSlumpMomentumAfterMatch': fighter => fighter,
  'Engine.growthEvents.checkMotivationLoss': () => false,
  'Engine.growthEvents.applyMotivationLoss': fighter => fighter,
  'Engine.growthEvents.updateMotivationLossMomentumAfterMatch': fighter => fighter,
  'Engine.popularity.applyDiminishing': () => 0,
  'Engine.popularity.checkLosingStreak': () => ({ popDelta: 0, losingStreak: 0 }),
  'Engine.rival.buildAICoachAssignments': () => ({}),
};

// 王者に組まれた実際の挑戦者IDを1回のprocessAIWeekから読み取る。
// generateAIMatchCard を「王者 vs 無関係の格下filler」で固定し、Fix3が実際に誰を
// 王者の相手として選び直すか(buildRingInOptsに渡るleftId/rightId)を観測する。
function runOnceAndGetChallengerId(roster, titles, champ, filler, stateExtra = {}, rngSeedForProcess = 9) {
  const state = makeShowState(roster, titles, stateExtra);
  const realBuildRingInOpts = Engine.mq.buildRingInOpts;
  const captured = [];
  withStubs({
    ...AI_PROCESS_STUBS,
    'Engine.rival.generateAIMatchCard': () => [{ left: champ, right: filler }],
    'Engine.mq.buildRingInOpts': function (st, leftId, rightId, options) {
      const r = realBuildRingInOpts(st, leftId, rightId, options);
      captured.push({ leftId, rightId });
      return r;
    },
    'Engine.battle.simulateMatch': (charL, charR) => ({
      left: charL, right: charR, winner: 'left', mq: 50,
      hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
    }),
  }, () => {
    Engine.rival.processAIWeek(Engine.rng.create(rngSeedForProcess), state, { id: 'org_s', tier: 'S' });
  });
  const champCard = captured.find(c => c.leftId === champ.id || c.rightId === champ.id);
  assert.ok(champCard, '王者を含むカードでbuildRingInOptsが呼ばれること');
  return champCard.leftId === champ.id ? champCard.rightId : champCard.leftId;
}

// ── Test 1: 同じ state・同じシードから2回選んで同じ結果になること(再現性) ──────────
function testReproducibility() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const c1 = makeRosterFighter(21, 'C1', 85, 115);
  const c2 = makeRosterFighter(22, 'C2', 83, 113);
  const c3 = makeRosterFighter(23, 'C3', 81, 111);
  const filler = makeRosterFighter(99, 'Filler', 40, 60);
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 2, wonSeason: 1, wonWeek: 2 });
  const roster = [champ, c1, c2, c3, filler];

  const first = runOnceAndGetChallengerId(roster, titles, champ, filler);
  const second = runOnceAndGetChallengerId(roster, titles, champ, filler);
  assert.strictEqual(first, second, '同じstate/シードなら同じ挑戦者が選ばれること(再現性)');
}

// ── Test 2: 最強以外が選ばれ得ること(重みが偏りすぎていない) ────────────────────
function testVarietyAmongTopChallengers() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const c1 = makeRosterFighter(21, 'C1', 85, 115); // 資格者中の最高OVR
  const c2 = makeRosterFighter(22, 'C2', 83, 113);
  const c3 = makeRosterFighter(23, 'C3', 81, 111);
  const filler = makeRosterFighter(99, 'Filler', 40, 60);
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 2, wonSeason: 1, wonWeek: 2 });
  const roster = [champ, c1, c2, c3, filler];

  const picked = new Set();
  // season/weekを振って抽選シードを変え、複数試行の分布を見る
  for (let w = 2; w <= 120; w += 2) {
    if (w === 48) continue; // PPV週は除外
    const id = runOnceAndGetChallengerId(roster, titles, champ, filler, { week: w });
    picked.add(id);
  }
  assert.ok(picked.size > 1, `複数試行で最強(${c1.id})以外も選ばれること(実際に選ばれたID: ${[...picked].join(',')})`);
  assert.ok(picked.has(c1.id), '最強候補が選ばれることも普通にあること(重みはOVR基準を維持)');
}

// ── Test 3: 王者本人が挑戦者に選ばれないこと ─────────────────────────────────
function testChampionNeverSelectsItself() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const c1 = makeRosterFighter(21, 'C1', 89, 115); // 王者に極めて近いOVR
  const c2 = makeRosterFighter(22, 'C2', 88, 113);
  const filler = makeRosterFighter(99, 'Filler', 40, 60);
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 0, wonSeason: 1, wonWeek: 2 });
  const roster = [champ, c1, c2, filler];

  for (let w = 2; w <= 40; w += 2) {
    const id = runOnceAndGetChallengerId(roster, titles, champ, filler, { week: w });
    assert.notStrictEqual(id, champ.id, '王者本人が自分自身の挑戦者に選ばれてはならない');
  }
}

// ── Test 4: 資格者が1人しかいない場合は従来どおりその1人 ────────────────────────
// getEligibleChallengers は「王者を除くOVR上位3位以内」を無条件で資格者に含めるため、
// 資格者を厳密に1人だけにするには「王者以外の在籍者がそもそも1人しかいない」ロスターが必要
// (在籍者が2人以上いれば上位3位以内の条件だけで2人以上が資格者になってしまう)。
function testSingleEligibleChallengerFallsThrough() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const onlyOne = makeRosterFighter(21, 'OnlyOne', 85, 115);
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 1, wonSeason: 1, wonWeek: 2 });
  const roster = [champ, onlyOne];

  const eligible = Engine.title.getEligibleChallengers(roster, champ.id, 'ai');
  assert.deepStrictEqual(eligible, [onlyOne.id], 'テスト前提: 資格者がonlyOneの1人だけであること');

  // ロスターに他の在籍者がいないため、自然なカード生成も王者×onlyOneの1試合になる
  const id = runOnceAndGetChallengerId(roster, titles, champ, onlyOne);
  assert.strictEqual(id, onlyOne.id, '資格者が1人なら従来どおりその1人が選ばれること');
}

// ── Test 5: 調整値が src/data.js にあり、コードに直書きされていないこと ─────────────
function testTunableConstantsLiveInDataJs() {
  assert.strictEqual(typeof AI_TITLE_CHALLENGER_CFG, 'object', 'AI_TITLE_CHALLENGER_CFG がグローバルに定義されていること(data.js由来)');
  assert.strictEqual(typeof AI_TITLE_CHALLENGER_CFG.poolSize, 'number');
  assert.strictEqual(typeof AI_TITLE_CHALLENGER_CFG.weightDecay, 'number');
  assert.strictEqual(typeof AI_TITLE_CHALLENGER_CFG.rivalryWeightBonus, 'number');
  assert.ok(AI_TITLE_CHALLENGER_CFG.weightDecay > 0 && AI_TITLE_CHALLENGER_CFG.weightDecay < 1,
    '最強が必ず選ばれるほど尖らせない(0<decay<1)');

  // data.js 側に定数定義があること
  const dataSrc = fs.readFileSync(path.join(srcDir, 'data.js'), 'utf8');
  assert.ok(/const AI_TITLE_CHALLENGER_CFG = \{/.test(dataSrc), 'data.js に AI_TITLE_CHALLENGER_CFG の定義があること');

  // management.js のFix3ブロックが AI_TITLE_CHALLENGER_CFG のプロパティ経由で参照していること
  // (数値を直書きしていないことの静的裏付け)
  const mgmtSrc = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  const anchor = mgmtSrc.indexOf('task-62: 挑戦者を');
  assert.ok(anchor >= 0, 'management.js に task-62 のFix3ブロックが存在すること');
  const block = mgmtSrc.slice(anchor, anchor + 2500);
  assert.ok(block.includes('AI_TITLE_CHALLENGER_CFG.poolSize'), 'poolSizeが定数経由で参照されていること');
  assert.ok(block.includes('AI_TITLE_CHALLENGER_CFG.weightDecay'), 'weightDecayが定数経由で参照されていること');
  assert.ok(block.includes('AI_TITLE_CHALLENGER_CFG.rivalryWeightBonus'), 'rivalryWeightBonusが定数経由で参照されていること');
}

testReproducibility();
testVarietyAmongTopChallengers();
testChampionNeverSelectsItself();
testSingleEligibleChallengerFallsThrough();
testTunableConstantsLiveInDataJs();

console.log('ai-title-challenger-variety-test: ok');
