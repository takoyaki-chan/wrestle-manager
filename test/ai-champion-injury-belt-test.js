'use strict';
// task-67: AI王者が負傷しただけでベルトを剥奪される不具合の回帰テスト。
//
// 背景(docs/codex-tasks/task-67-ai-champion-injury-belt.md §1、
// docs/ai-title-defense-survey-v0.1.md): Engine.rival.processAIWeek は
// `champAlive = champId && roster.find(f => f.id === champId && !f.injury)` と
// 「ロスターに居るか」と「負傷していないか」を同じ条件で判定していたため、
// 軽傷1週間でも試合をせずにベルトが移っていた(防衛回数0リセット)。
// プレイヤー側の Engine.title.validateChampion(ロスターから居なくなったときだけ空位化)に
// 揃え、負傷では剥奪しない(§1(a): 期間によらず保持)ようにした。
//
// あわせて task-65 §1/§2(本タスク§2/§3)の回帰も検査する:
// - AI王座戦だけ matchTier=2(ビッグマッチ)、AI通常興行は matchTier=1 のまま
// - getEligibleChallengers の ai は上位4人(旧3人)、maxOvrGapは5のまま、player(5/8)は不変

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
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    trainCap: { pw: capOvr, sp: capOvr, te: capOvr, st: capOvr, mn: capOvr },
    condition: 80,
    injury: null,
    wins: 0, losses: 0, draws: 0,
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
    week: 2, // isShowWeek(2)===true, PPV_SHOW_WEEK(48)ではない
    titles: { world: { championId: 999, defenses: 0 } }, // プレイヤー団体(混同検出用のダミー)
    aiOrgs: {
      org_s: {
        roster, titles,
        coaches: [], coachAssign: {},
        orgPop: 75, lockerRoomMorale: 60,
        matchupLog: [], showCount: 0,
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

// ── Test 1: 負傷中の王者はロスターに残っている限りベルトを保持する ──────────────
// (試合には出られないので、王者を含まないカードがそのまま処理される想定)
function testInjuredChampionKeepsTitle() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120, {
    injury: { type: '軽傷', weeksLeft: 1, severity: 'minor', color: '#f39c12' },
  });
  const other1 = makeRosterFighter(31, 'Other1', 40, 60);
  const other2 = makeRosterFighter(32, 'Other2', 41, 60);
  const titles = Engine.rival.createAITitles({
    championId: champ.id, defenses: 2, wonSeason: 1, wonWeek: 2, lastTitleMatchWeek: Engine.util.absWeek(1, 2),
  });
  const state = makeShowState([champ, other1, other2], titles);

  let result;
  withStubs({
    ...AI_PROCESS_STUBS,
    // 負傷中の王者は generateAIMatchCard の available フィルタで除外される想定を再現
    'Engine.rival.generateAIMatchCard': () => [{ left: other1, right: other2 }],
    'Engine.battle.simulateMatch': () => ({
      left: other1, right: other2, winner: 'left', mq: 40,
      hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
    }),
  }, () => {
    result = Engine.rival.processAIWeek(Engine.rng.create(21), state, { id: 'org_s', tier: 'S' });
  });

  assert.strictEqual(result.titles.world.championId, champ.id, '負傷中でもロスターに残っていれば王座はそのまま');
  assert.strictEqual(result.titles.world.defenses, 2, '防衛回数もリセットされない');
  assert.strictEqual(
    result.titles.world.lastTitleMatchWeek, titles.world.lastTitleMatchWeek,
    'クールダウンの起点(lastTitleMatchWeek)も負傷週で書き換わらない'
  );
}

// ── Test 2: ロスターから居なくなった(離脱・引退・解雇)ときは従来どおり空位化→再戴冠 ──
function testDepartedChampionVacatesTitle() {
  // champ(id=20)は既にロスターから除かれている想定(離脱処理は本テストの対象外)
  const remaining1 = makeRosterFighter(31, 'Other1', 55, 80);
  const remaining2 = makeRosterFighter(32, 'Other2', 41, 60);
  const titles = Engine.rival.createAITitles({ championId: 20, defenses: 3, wonSeason: 1, wonWeek: 2 });
  const state = makeShowState([remaining1, remaining2], titles);

  let result;
  withStubs({
    ...AI_PROCESS_STUBS,
    'Engine.rival.generateAIMatchCard': () => [{ left: remaining1, right: remaining2 }],
    'Engine.battle.simulateMatch': () => ({
      left: remaining1, right: remaining2, winner: 'left', mq: 40,
      hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
    }),
  }, () => {
    result = Engine.rival.processAIWeek(Engine.rng.create(22), state, { id: 'org_s', tier: 'S' });
  });

  assert.strictEqual(result.titles.world.championId, remaining1.id, 'ロスターに残る最高OVR選手が新王者になる(空位戴冠)');
  assert.strictEqual(result.titles.world.defenses, 0, '空位戴冠は防衛0からスタート');
}

// ── Test 3: AI王座戦は matchTier=2、AI通常興行は matchTier=1 のまま ─────────────
function testAiTitleCardUsesBigMatchTier() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const challenger = makeRosterFighter(21, 'Challenger', 88, 118); // OVR差2 → ai挑戦資格あり
  const titles = Engine.rival.createAITitles({ championId: champ.id, defenses: 2, wonSeason: 1, wonWeek: 2 });
  const state = makeShowState([champ, challenger], titles);

  const capturedTiers = [];
  withStubs({
    ...AI_PROCESS_STUBS,
    'Engine.rival.generateAIMatchCard': () => [{ left: champ, right: challenger }],
    'Engine.battle.simulateMatch': (l, r, rng, matchTier) => {
      capturedTiers.push(matchTier);
      return {
        left: champ, right: challenger, winner: 'left', mq: 60,
        hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
      };
    },
  }, () => {
    Engine.rival.processAIWeek(Engine.rng.create(23), state, { id: 'org_s', tier: 'S' });
  });

  assert.strictEqual(capturedTiers.length, 1);
  assert.strictEqual(capturedTiers[0], 2, 'AI王座戦は matchTier=2(ビッグマッチ)で呼ばれること');
}

function testAiNonTitleCardStaysNormalTier() {
  const champ = makeRosterFighter(20, 'Champion', 90, 120);
  const other1 = makeRosterFighter(31, 'Other1', 40, 60);
  const other2 = makeRosterFighter(32, 'Other2', 41, 60);
  // クールダウン中(12週未満)にして、王者が出場していても王座戦扱いにしない
  const titles = Engine.rival.createAITitles({
    championId: champ.id, defenses: 1, wonSeason: 3, wonWeek: 1, lastTitleMatchWeek: Engine.util.absWeek(3, 1),
  });
  const state = makeShowState([champ, other1, other2], titles);

  const capturedTiers = [];
  withStubs({
    ...AI_PROCESS_STUBS,
    'Engine.rival.generateAIMatchCard': () => [{ left: other1, right: other2 }],
    'Engine.battle.simulateMatch': (l, r, rng, matchTier) => {
      capturedTiers.push(matchTier);
      return {
        left: other1, right: other2, winner: 'left', mq: 40,
        hpLeft: { final: 60, max: 100 }, hpRight: { final: 30, max: 100 },
      };
    },
  }, () => {
    Engine.rival.processAIWeek(Engine.rng.create(24), state, { id: 'org_s', tier: 'S' });
  });

  assert.strictEqual(capturedTiers.length, 1);
  assert.strictEqual(capturedTiers[0], 1, '王座と無関係のAI通常試合は matchTier=1 のまま');
}

// ── Test 4: getEligibleChallengers の ai は上位4人(旧3人)/ maxOvrGapは5のまま。
//    player(5/8)は不変。値は src/data.js の AI_TITLE_ELIGIBILITY_CFG から読むこと ──────
function testEligibleChallengersRankingLimits() {
  assert.deepStrictEqual(
    AI_TITLE_ELIGIBILITY_CFG,
    { rankingLimit: 4, maxOvrGap: 5 },
    'AI_TITLE_ELIGIBILITY_CFG が src/data.js に定義され、期待値であること'
  );

  // OVR降順で11人(champ以外10人)のロスターを作り、4位・5位境界を確認する
  const champ = makeRosterFighter(0, 'Champ', 100, 100);
  const others = [];
  for (let i = 1; i <= 10; i++) {
    others.push(makeRosterFighter(i, `F${i}`, 100 - i, 100)); // OVR: 99,98,...,90
  }
  const roster = [champ, ...others];

  const aiIds = new Set(Engine.title.getEligibleChallengers(roster, champ.id, 'ai'));
  // maxOvrGapの基準はロスター最高OVR(champ自身=100。getEligibleChallengers内のmaxOvrは
  // champIdを除外せずroster全体から取るため)。差が5以内(ovr>=95)なのはF1(99)〜F5(95)。
  // rankingLimit=4は上位4人(F1〜F4)なので、資格者集合は「上位4人 ∪ 差5以内」= F1〜F5。
  assert.ok(aiIds.has(1) && aiIds.has(2) && aiIds.has(3) && aiIds.has(4), '上位4人(F1〜F4)は資格あり');
  assert.ok(aiIds.has(5), 'F5は上位4人には入らないがOVR差5以内(champ100-95=5)で資格あり');
  assert.ok(!aiIds.has(6), 'F6はOVR差6(100-94)で対象外');

  const playerIds = new Set(Engine.title.getEligibleChallengers(roster, champ.id, 'player'));
  // player: 上位5人 or 差8以内(champ100基準)→ F1(99)〜F8(92)が対象、F9(91)は差9で対象外
  assert.ok(playerIds.has(5) && playerIds.has(8), 'player側は上位5人/差8以内のまま(不変)');
  assert.ok(!playerIds.has(9), 'player側の境界(差8超)も不変');
}

// ── Test 5: プレイヤー側の王座ロジックは一切変えていないこと ──────────────────
function testPlayerTitleLogicUnchanged() {
  // 5a: validateChampionは負傷では剥奪しない(元々そうだった。挙動が変わっていないことの確認)
  const injuredButPresent = {
    titles: { world: { championId: 7, defenses: 3 } },
    roster: [{ id: 7, name: 'PlayerChamp', injury: { type: '軽傷', weeksLeft: 1 } }],
  };
  const vc1 = Engine.title.validateChampion(injuredButPresent);
  assert.strictEqual(vc1.msg, null, '負傷していてもロスターに居れば空位化しない(従来どおり)');
  assert.strictEqual(vc1.titles.world.championId, 7);

  // 5b: ロスターから居なくなったときは従来どおり空位化する
  const departed = {
    titles: { world: { championId: 7, defenses: 3 } },
    roster: [{ id: 8, name: 'Someone else' }],
  };
  const vc2 = Engine.title.validateChampion(departed);
  assert.notStrictEqual(vc2.msg, null, 'ロスターから消えたら空位化する(従来どおり)');
  assert.strictEqual(vc2.titles.world.championId, null);
  assert.strictEqual(vc2.titles.world.defenses, 0);

  // 5c: ソース上も、プレイヤー通常興行のbuildRingInOpts呼び出し形にAI専用オプションが
  //     追加されていないこと(task-61と同型の静的裏付け)
  const src = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  const callSite = src.slice(src.indexOf("buildRingInOpts({ ...s, roster }, m.left, m.right,"));
  const snippet = callSite.slice(0, callSite.indexOf(');') + 2);
  assert.ok(!/championId/.test(snippet), 'プレイヤー通常興行のbuildRingInOpts呼び出しにchampionIdが追加されていないこと');

  // 5d: getEligibleChallengers内、player分岐の数値リテラル(5/8)が直書きのまま(不変)であること
  const geSrc = src.slice(src.indexOf('getEligibleChallengers(roster, champId'));
  const geSnippet = geSrc.slice(0, geSrc.indexOf('},') + 2);
  assert.ok(/policy === 'ai' \? AI_TITLE_ELIGIBILITY_CFG\.rankingLimit : 5/.test(geSnippet),
    'ai側はAI_TITLE_ELIGIBILITY_CFG経由・player側は5直書きのまま');
  assert.ok(/policy === 'ai' \? AI_TITLE_ELIGIBILITY_CFG\.maxOvrGap : 8/.test(geSnippet),
    'ai側はAI_TITLE_ELIGIBILITY_CFG経由・player側は8直書きのまま');
}

testInjuredChampionKeepsTitle();
testDepartedChampionVacatesTitle();
testAiTitleCardUsesBigMatchTier();
testAiNonTitleCardStaysNormalTier();
testEligibleChallengersRankingLimits();
testPlayerTitleLogicUnchanged();

console.log('ai-champion-injury-belt-test: ok');
