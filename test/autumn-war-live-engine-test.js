const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js',
  'data.js',
  'coach-lines.js',
  'data-faction-dialogue.js',
  'management.js',
  'match-engine.js',
  'relationships.js',
  'flag-dialogue.js',
  'factions.js',
  'draft-negotiation.js',
].forEach(loadAsGlobal);

let state = Engine.createInitialState(4242, true);
state = { ...state, season: 1, week: Engine.autumnWar.EVENT_WEEK };
state = {
  ...state,
  roster: state.roster.map(f => ({ ...f, pw: 100, sp: 100, te: 100, st: 100, mn: 100, condition: 100 })),
  aiOrgs: Object.fromEntries(Object.entries(state.aiOrgs).map(([orgId, org]) => [orgId, {
    ...org,
    roster: org.roster.map(f => ({ ...f, pw: 5, sp: 5, te: 5, st: 5, mn: 5, condition: 100 })),
  }])),
};
state = { ...state, rankings: Engine.ranking.updateRankings(state) };
state = { ...state, autumnWar: Engine.autumnWar.announce(state), autumnWarPhase: 'entry' };
const seedByOrg = Object.fromEntries(state.autumnWar.teams.map(team => [team.orgId, team.seed]));
const playerBracketSides = new Set();
for (let season = 1; season <= 16; season += 1) {
  const bracket = Engine.autumnWar._buildBracket(state.autumnWar.teams, { ...state, season });
  const seedPairs = bracket.map(pair => [seedByOrg[pair.orgA], seedByOrg[pair.orgB]].sort((a, b) => a - b));
  assert.deepStrictEqual(seedPairs, [[1, 4], [2, 3]], 'side randomization must preserve the seeded semifinal matchups');
  const playerPair = bracket.find(pair => pair.orgA === 'player' || pair.orgB === 'player');
  playerBracketSides.add(playerPair.orgA === 'player' ? 'left' : 'right');
}
assert.deepStrictEqual([...playerBracketSides].sort(), ['left', 'right'], 'the player organization must be able to appear on either bracket side across seasons');
const announcedBracket = JSON.parse(JSON.stringify(state.autumnWar.bracket));
const members = Engine.autumnWar._selectMembers(state, 'player');
const order = Engine.autumnWar._defaultOrder(state, 'player', members);
state = Engine.autumnWar.confirmPlayerTeam(state, members, order);
state = Engine.autumnWar.startSession(state);
assert.deepStrictEqual(state.autumnWar.session.bracket, announcedBracket, 'the announced bracket sides must remain stable when the live session starts');

assert.strictEqual(state.autumnWar.session.results.length, 0, '大会開始時点では終了済み団体戦があってはならない');
assert.strictEqual(state.autumnWar.session.activeMatch.bouts.length, 0, '大会開始時点ではフォール結果を生成しない');
const initialRng = { ...state.autumnWar.session.rng };

const first = Engine.autumnWar.simulateNextBout(state);
assert.ok(first.bout, '最初の操作で1フォールが解決される');
const watchedFirst = Engine.autumnWar.simulateNextBout(
  JSON.parse(JSON.stringify(state)),
  { recordFrames: true }
);
assert.deepStrictEqual(watchedFirst.bout, first.bout, 'watched and skipped bouts must resolve identically');
assert.deepStrictEqual(watchedFirst.state.autumnWar, first.state.autumnWar, 'watched and skipped tournament state must match');
assert.ok(watchedFirst.replay?.result?.frames?.length > 0, 'watched bout must include replay frames');
assert.strictEqual(Engine.autumnWar.MATCH_TIER, 1, 'autumn war must use normal match rules');
const expectedLeftFullHp = Math.round(ENG.hpBase + Engine.util.eff(watchedFirst.replay.left.st) * ENG.hpScale);
assert.strictEqual(Engine.autumnWar._fullHp(watchedFirst.replay.left), expectedLeftFullHp, 'carry HP must use the normal-match HP scale');
assert.strictEqual(
  watchedFirst.replay.left._hpOverride,
  Engine.wear.toHpOverride(Engine.autumnWar.INITIAL_CONDITION, expectedLeftFullHp),
  'first fall must start from 80% of normal-match full HP'
);
assert.strictEqual(watchedFirst.replay.result.hpLeft.max, expectedLeftFullHp, 'normal-match full HP must remain the replay meter maximum');
const firstProgress = Engine.autumnWar.getProgress(first.state);
const firstBoutCount = firstProgress.results.reduce((sum, match) => sum + match.bouts.length, 0);
assert.strictEqual(firstBoutCount, 1, '1回の操作で未来のフォールまで生成してはならない');
assert.notDeepStrictEqual(first.state.autumnWar.session.rng, initialRng, 'フォール後のRNG状態を保存する');

const saved = JSON.parse(JSON.stringify(first.state));
const uninterrupted = Engine.autumnWar.simulateNextBout(first.state);
const resumed = Engine.autumnWar.simulateNextBout(saved);
assert.deepStrictEqual(resumed.bout, uninterrupted.bout, '保存・再開後も次フォールは同じ結果になる');
assert.deepStrictEqual(
  resumed.state.autumnWar.session.rng,
  uninterrupted.state.autumnWar.session.rng,
  '保存・再開後もRNG進行が一致する'
);

state = first.state;
let steps = 1;
let sawFinalOrder = false;
while (state.autumnWar.session.phase !== 'complete' && steps < 20) {
  if (state.autumnWar.session.phase === 'finalOrder') {
    sawFinalOrder = true;
    const finalOrder = Engine.autumnWar.suggestFinalOrder(state, 'player');
    state = Engine.autumnWar.reorderForFinal(state, finalOrder);
    assert.strictEqual(state.autumnWar.session.phase, 'final', '布陣確定後に初めて決勝へ進む');
    assert.strictEqual(state.autumnWar.session.activeMatch.bouts.length, 0, '決勝も未シミュレートで開始する');
  } else {
    const next = Engine.autumnWar.simulateNextBout(state);
    assert.ok(next.bout, `step ${steps + 1} must produce one bout`);
    state = next.state;
    steps += 1;
  }
}

assert.strictEqual(state.autumnWar.session.phase, 'complete', '大会は最大15フォールで完走する');
assert.ok(steps >= 3 && steps <= 15, `unexpected bout count: ${steps}`);
assert.ok(sawFinalOrder, '固定seedではプレイヤーが決勝進出し、布陣確定停止を検証する');
const result = Engine.autumnWar.getProgress(state);
assert.ok(result.champion && result.finalResult && result.mvpId, '最終フォール後に優勝・決勝・MVPが確定する');
const revenue = Engine.autumnWar.calcRevenueDistribution(state, result);
assert.strictEqual(revenue.venueName, '大会場×2規模', '秋大会は大会場2興行分の特別大会として収益計算する');
assert.strictEqual(revenue.attendance, 12000, '満員の大会場を基準にする');
// 5076 は TICKET_PRICE_TIERS(2026-07-31 に単価-10%へ調整)から導かれる値。
// 秋大会は「大会場×2興行分」を基準にするため calcTieredTicketRevenue(12000) とは一致しない。
// **単価を調整したらこの期待値も更新する**(検査の主旨は段階制計算を通っていること)。
assert.strictEqual(revenue.benchmarkTicketRevenue, 5076, '通常興行と同じ段階制チケット計算を基準値に使う');
assert.strictEqual(revenue.ticketRevenue, 7000, '秋大会の特別興行収入は固定7000万にする');
assert.strictEqual(revenue.venueCost, 0, '大会主催側負担の会場費を参加団体の分配原資から控除しない');
assert.strictEqual(revenue.gateNet, 7000, '秋大会の固定興行収入を参加枠へ分配する');
assert.deepStrictEqual(revenue.pools.gate, { equal: 2100, appearances: 4900 },
  '固定興行収入は均等30%・延べ出場70%で分ける');
assert.strictEqual(revenue.brandRevenue, revenue.shares.reduce((sum, share) => sum + share.brandAmount, 0),
  'ブランド収入は固定原資でなく、各団体の通常興行基準額から積み上げる');
assert.strictEqual(revenue.pools.brand.base, revenue.shares.reduce((sum, share) => sum + share.brandBase, 0),
  '各団体の通常興行ブランド基礎額を合計表示する');
assert.strictEqual(revenue.pools.brand.bonus, revenue.shares.reduce((sum, share) => sum + share.brandBonusAmount, 0),
  '大会結果による割合ボーナスを基礎額と分離して記録する');
assert.strictEqual(revenue.totalPool, revenue.gateNet + revenue.brandRevenue,
  '大会総収入は共同興行原資と団体別ブランド収入の合計になる');
assert.strictEqual(revenue.shares.reduce((sum, share) => sum + share.amount, 0), revenue.totalPool,
  '端数処理後も全団体への分配額合計は原資と一致する');
assert.strictEqual(revenue.shares.reduce((sum, share) => sum + share.gateAmount, 0), revenue.gateNet,
  '興行分配の合計はチケット純収益と一致する');
assert.ok(revenue.shares.every(share => share.brandBase === share.brandGoodsBase + share.brandMediaBase),
  '通常興行と同じグッズ・興行放映の合計をブランド基礎額にする');
revenue.shares.forEach(share => {
  const team = result.teams.find(entry => entry.orgId === share.orgId);
  const roster = Engine.autumnWar._orgRoster(state, share.orgId);
  const memberIds = new Set(team.memberIds);
  const expectedGoods = Math.round(roster.reduce((sum, fighter) => memberIds.has(fighter.id)
    ? sum + (fighter.popularity || 0) * GOODS_CONFIG.showBoostPerPop
    : sum, 0) * Engine.autumnWar.EVENT_FINANCE.venueScale);
  const orgPop = share.orgId === 'player' ? state.orgPop : state.aiOrgs[share.orgId].orgPop;
  const expectedMedia = Engine.economy.calcShowMediaRev(
    revenue.eventStars,
    Engine.autumnWar.EVENT_FINANCE.venueIndex,
    orgPop
  ) * Engine.autumnWar.EVENT_FINANCE.venueScale;
  assert.strictEqual(share.brandGoodsBase, expectedGoods,
    `${share.orgId}: 代表3名の通常興行グッズ収入を大会場2興行分で計算する`);
  assert.strictEqual(share.brandMediaBase, expectedMedia,
    `${share.orgId}: 団体人気と大会★評価による通常興行メディア収入を2興行分で計算する`);
});
assert.ok(revenue.shares.every(share => share.brandAmount === share.brandBase + share.brandBonusAmount),
  'ブランド収入は基礎額へ結果割合ボーナスを加えた額にする');
assert.strictEqual(revenue.shares.reduce((sum, share) => sum + share.appearances, 0),
  result.results.reduce((sum, match) => sum + match.bouts.length * 2, 0),
  '出場枠は勝敗でなく各フォールの延べ出場人数を数える');
const championShare = revenue.shares.find(share => share.orgId === result.champion);
const runnerUpShare = revenue.shares.find(share => share.orgId === result.runnerUp);
const semiFinalShares = revenue.shares.filter(share => ![result.champion, result.runnerUp].includes(share.orgId));
assert.strictEqual(championShare.placementBonusRate, 1.00, '優勝団体は通常ブランド収入へ100%加算する');
assert.strictEqual(runnerUpShare.placementBonusRate, 0.50, '準優勝団体は通常ブランド収入へ50%加算する');
assert.ok(semiFinalShares.every(share => share.placementBonusRate === 0.20),
  '準決勝敗退団体にも大会露出として20%加算する');
assert.strictEqual(championShare.winBonusRate, 0.25,
  '優勝団体のフォール勝利加算は上限25%で止める');
assert.ok(revenue.shares.every(share => share.winBonusRate === Math.min(0.25, share.wins * 0.05)),
  '団体のフォール勝利数を5%ずつブランド収入へ反映する');
const mvpShare = revenue.shares.find(share => share.mvpBonusRate > 0);
assert.ok(mvpShare && mvpShare.mvpBonusRate === 0.15, 'MVP所属団体へ15%のブランド加算を付ける');
assert.ok(revenue.shares.filter(share => share !== mvpShare).every(share => share.mvpBonusRate === 0),
  'MVP加算を他団体へ重複適用しない');
assert.ok(revenue.shares.every(share => share.brandBonusAmount === Math.round(share.brandBase * share.brandBonusRate)),
  '結果ボーナスは固定賞金でなく通常ブランド基礎額への割合として計算する');
const playerShare = revenue.shares.find(share => share.orgId === 'player');
const expectedPrize = result.champion === 'player' ? Engine.autumnWar.PRIZE.champion
  : result.runnerUp === 'player' ? Engine.autumnWar.PRIZE.runnerUp : 0;
const fundsBeforeApply = state.funds;
const revenueBeforeApply = state.seasonStats.totalRevenue;
const applied = Engine.autumnWar.apply(state, result);
assert.strictEqual(applied.state.autumnWar.champion, result.champion);
assert.strictEqual(applied.state.autumnWarPhase, 'result');
assert.strictEqual(applied.state.funds - fundsBeforeApply, playerShare.amount + expectedPrize,
  '自団体資金へ共同興行分配金と入賞賞金を一度に加算する');
assert.strictEqual(applied.state.seasonStats.totalRevenue - revenueBeforeApply, playerShare.amount + expectedPrize,
  '大会収入をシーズン収入にも記録する');
assert.deepStrictEqual(applied.state.autumnWar.revenueDistribution, revenue,
  '全団体の分配内訳を大会結果へ保存する');
assert.ok(applied.events.some(event => event.includes(`分配金${playerShare.amount}万`)),
  'ゲームログに自団体の分配金内訳を残す');
assert.ok(applied.events.some(event => event.includes(`通常興行基準のブランド収入${playerShare.brandAmount}万`)),
  'ゲームログに通常ブランド基礎額と大会結果の割合ボーナスを残す');

console.log(`autumn-war-live-engine-test: ok (${steps} bouts)`);
