'use strict';
// task-61: AI団体の内部王座戦にもタイトル戦のリング内効果(脱出率+0.10・カウンター率+4pt・
// 王者専用の逃げ切り+0.02)を効かせる修正の回帰テスト。
//
// 背景(docs/ai-title-defense-survey-v0.1.md): Engine.rival.processAIWeek は
// Engine.mq.buildRingInOpts を呼ぶとき isTitle / normalShowRingExtras を渡していなかった
// ため、AIの王座戦がバトルエンジン側からは「タイトル戦だと一切知られないまま」処理されていた。
// さらに buildRingInOpts 内の championId は state.titles.world.championId(プレイヤー団体の
// 王者)を見ていたため、championId を渡すだけでは「王者専用エスケープ」が別団体の王者IDと
// 突き合わされて機能しない。この2点を検査する。

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
    rngSeed: 12345,
    season: 3,
    week: 2,
    // プレイヤー団体の王者ID(999)をAI団体の王者IDと意図的に違えておく。
    // buildRingInOpts が championId オプションを無視して state.titles.world.championId に
    // フォールバックしてしまう回帰を検出するため。
    titles: { world: { championId: 999, defenses: 0 } },
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
  'Engine.rng.float': () => 0.99, // practiceRateを外す(試合週の学習分岐を避ける)
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

// ── Test 1: processAIWeek の王座戦が isTitle / normalShowRingExtras / 正しい championId を
//    buildRingInOpts に渡していること ─────────────────────────────────────────────
function testProcessAIWeekPassesTitleFlagsForChampionMatch() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const challenger = makeRosterFighter(21, 'Challenger', 88, 118); // OVR差2 → policy='ai'(差5以内)で挑戦資格あり
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 2, wonSeason: 1, wonWeek: 2 });
  const state = makeShowState([champ, challenger], titles);

  const realBuildRingInOpts = Engine.mq.buildRingInOpts;
  const captured = [];

  withStubs({
    ...AI_PROCESS_STUBS,
    'Engine.rival.generateAIMatchCard': () => [{ left: champ, right: challenger }],
    'Engine.mq.buildRingInOpts': function (st, leftId, rightId, options) {
      const result = realBuildRingInOpts(st, leftId, rightId, options);
      captured.push({ leftId, rightId, options, result });
      return result;
    },
    'Engine.battle.simulateMatch': () => ({
      left: champ, right: challenger, winner: 'left', mq: 60,
      hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
    }),
  }, () => {
    Engine.rival.processAIWeek(Engine.rng.create(11), state, { id: 'org_s', tier: 'S' });
  });

  assert.strictEqual(captured.length, 1, '王座戦の1カードで buildRingInOpts が1回呼ばれること');
  const { options, result } = captured[0];

  assert.strictEqual(options.isTitle, true, 'AI王座戦で options.isTitle が渡ること');
  assert.strictEqual(options.normalShowRingExtras, true, 'AI王座戦で options.normalShowRingExtras が渡ること');
  assert.strictEqual(options.championId, champ.id, 'AI団体自身の王者IDが渡ること(state.titles.world.championId=999は使わない)');

  assert.strictEqual(result.simOpts.titleMatch, true, 'simOptsにtitleMatch=trueが伝播すること');
  assert.deepStrictEqual(
    result.simOpts.championDefenseEscape,
    [Engine.mq.CHAMPION_DEFENSE_ESCAPE_BONUS, 0],
    '王者側(left=champ)にだけ王者専用エスケープボーナスが乗ること'
  );
}

// ── Test 2: 王座戦でない通常のAI内マッチ(挑戦資格外・クールダウン中など)は
//    従来どおり isTitle=false のまま(プレイヤー扱いに寄せて過剰適用しない) ──────────
function testProcessAIWeekNonTitleCardStaysPlain() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const other1 = makeRosterFighter(31, 'Other1', 40, 60);
  const other2 = makeRosterFighter(32, 'Other2', 41, 60);
  // クールダウン中(12週未満)にして、王者が試合していてもタイトル戦扱いにしない
  const titles = Engine.rival.createAITitles({
    championId: champ.id, defenses: 1, wonSeason: 3, wonWeek: 1, lastTitleMatchWeek: Engine.util.absWeek(3, 1),
  });
  const state = makeShowState([champ, other1, other2], titles);

  const realBuildRingInOpts = Engine.mq.buildRingInOpts;
  const captured = [];

  withStubs({
    ...AI_PROCESS_STUBS,
    'Engine.rival.generateAIMatchCard': () => [{ left: other1, right: other2 }],
    'Engine.mq.buildRingInOpts': function (st, leftId, rightId, options) {
      const result = realBuildRingInOpts(st, leftId, rightId, options);
      captured.push({ leftId, rightId, options, result });
      return result;
    },
    'Engine.battle.simulateMatch': () => ({
      left: other1, right: other2, winner: 'left', mq: 40,
      hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
    }),
  }, () => {
    Engine.rival.processAIWeek(Engine.rng.create(12), state, { id: 'org_s', tier: 'S' });
  });

  assert.strictEqual(captured.length, 1, '通常カードで buildRingInOpts が1回呼ばれること');
  const { options, result } = captured[0];
  assert.strictEqual(options.isTitle, false, '王座と無関係のカードは isTitle=false のまま');
  assert.strictEqual(result.simOpts.titleMatch, false, 'simOptsにも波及しないこと');
  assert.deepStrictEqual(result.simOpts.championDefenseEscape, [0, 0], '王者専用ボーナスも乗らないこと');
}

// ── Test 3: buildRingInOpts が options.championId を受け取ること。
//    未指定なら従来どおり state.titles.world.championId にフォールバックすること(後方互換) ──
function testBuildRingInOptsChampionIdOverrideAndFallback() {
  const state = { titles: { world: { championId: 999, defenses: 3 } } };
  const roster = [
    { id: 999, name: 'PlayerChamp', trust: 60 },
    { id: 20, name: 'AiChamp', trust: 60 },
    { id: 21, name: 'AiChallenger', trust: 60 },
  ];

  // 後方互換: championId を渡さなければ、従来どおり state.titles.world.championId(=999) を使う。
  const fallback = Engine.mq.buildRingInOpts(state, 999, 21, {
    roster, isTitle: true, normalShowRingExtras: true,
  });
  assert.deepStrictEqual(
    fallback.simOpts.championDefenseEscape,
    [Engine.mq.CHAMPION_DEFENSE_ESCAPE_BONUS, 0],
    'championId未指定時はstateのプレイヤー王者IDにボーナスが付くこと(従来挙動)'
  );

  // 明示指定: options.championId=20 を渡すと、leftId=999(プレイヤー王者)であっても
  // AIの王者(20)ではないのでボーナスは付かない。
  const overrideNoBonus = Engine.mq.buildRingInOpts(state, 999, 21, {
    roster, isTitle: true, normalShowRingExtras: true, championId: 20,
  });
  assert.deepStrictEqual(
    overrideNoBonus.simOpts.championDefenseEscape,
    [0, 0],
    'championId明示指定時はstateのプレイヤー王者IDを無視すること'
  );

  // 明示指定: leftId=20(AIの王者)・championId=20 が一致すればボーナスが付く。
  const overrideBonus = Engine.mq.buildRingInOpts(state, 20, 21, {
    roster, isTitle: true, normalShowRingExtras: true, championId: 20,
  });
  assert.deepStrictEqual(
    overrideBonus.simOpts.championDefenseEscape,
    [Engine.mq.CHAMPION_DEFENSE_ESCAPE_BONUS, 0],
    'championId明示指定と対戦者が一致すればボーナスが付くこと'
  );
}

// ── Test 4: プレイヤー経路(通常興行)の呼び出しが変わっていないこと ───────────────
// management.js のプレイヤー通常興行呼び出し(Engine.mq.buildRingInOpts({ ...s, roster }, m.left,
// m.right, { roster, rivalries, isTitle: !!m.isTitle, applyNextMatchMq, normalShowRingExtras: true,
// isMainEvent })) は championId を渡さない。この呼び出し形をそのまま再現し、結果が
// 「championId未指定 = state由来」という従来どおりの解決になることを確認する。
function testPlayerCallShapeStillOmitsChampionId() {
  const state = { titles: { world: { championId: 55, defenses: 4 } } };
  const roster = [
    { id: 55, name: 'PlayerChamp', trust: 60 },
    { id: 56, name: 'PlayerChallenger', trust: 60 },
  ];
  // プレイヤー通常興行の実際の呼び出し形(management.js ~12573行)を再現。championId は渡さない。
  const ringIn = Engine.mq.buildRingInOpts({ ...state, roster }, 55, 56, {
    roster, rivalries: {}, isTitle: true,
    applyNextMatchMq: false, normalShowRingExtras: true, isMainEvent: true,
  });
  assert.deepStrictEqual(
    ringIn.simOpts.championDefenseEscape,
    [Engine.mq.CHAMPION_DEFENSE_ESCAPE_BONUS, 0],
    'プレイヤー通常興行の呼び出し形は championId 追加前と同じ結果になること(state由来のまま)'
  );

  // ソース上も、プレイヤー呼び出しに championId が追加されていないことを直接確認する
  // (task-61の変更が processAIWeek 側だけに閉じていることの静的裏付け)。
  const src = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  const callSite = src.slice(src.indexOf("buildRingInOpts({ ...s, roster }, m.left, m.right,"));
  const snippet = callSite.slice(0, callSite.indexOf(');') + 2);
  assert.ok(!/championId/.test(snippet),
    'プレイヤー通常興行のbuildRingInOpts呼び出しに championId が追加されていないこと');
}

testProcessAIWeekPassesTitleFlagsForChampionMatch();
testProcessAIWeekNonTitleCardStaysPlain();
testBuildRingInOptsChampionIdOverrideAndFallback();
testPlayerCallShapeStillOmitsChampionId();

console.log('ai-title-ringin-test: ok');
