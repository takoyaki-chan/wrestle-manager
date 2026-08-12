'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js',
].forEach(loadAsGlobal);

function fighter({ id, currentOvr, contractOvr, popularity, contractPop, trust, salaryBonus = 0, ...rest }) {
  return {
    id,
    name: `査定テスト${id}`,
    pw: currentOvr, sp: currentOvr, te: currentOvr, st: currentOvr, mn: currentOvr,
    popularity,
    contractOVR: contractOvr,
    contractPop,
    salaryBonus,
    trust,
    careerSeasons: 5,
    careerRecord: Engine.career.createRecord(),
    orgTimeline: [{ orgId: 'player', fromSeason: 1, fromWeek: 1 }],
    archetype: 'standard',
    personality: 'normal',
    ...rest,
  };
}

function stateFor(roster, overrides = {}) {
  return {
    season: 6,
    week: 49,
    rngSeed: 8400,
    roster,
    titles: {},
    relationships: null,
    lockerRoomMorale: 50,
    orgName: '給与テスト団体',
    seasonStats: { showCount: 24 },
    ...overrides,
  };
}

function basePay(f, useCurrent = false) {
  return Engine.util.getSalary({
    ...f,
    salaryBonus: 0,
    ...(useCurrent ? { contractOVR: Engine.util.ov(f), contractPop: f.popularity || 0 } : {}),
  }, {});
}

function declineMath(f) {
  const oldBP = basePay(f);
  const newBP = basePay(f, true);
  return { oldBP, newBP, bpRatio: newBP / oldBP, declineAmount: oldBP - newBP };
}

function generate(roster, seed = 8401) {
  return Engine.contract.generateNegotiations(Engine.rng.create(seed), stateFor(roster));
}

const mid = fighter({
  id: 8401, currentOvr: 72, contractOvr: 75,
  popularity: 35, contractPop: 40, trust: 60, salaryBonus: 10,
});
const large = fighter({
  id: 8402, currentOvr: 65, contractOvr: 75,
  popularity: 40, contractPop: 60, trust: 60, salaryBonus: 25,
});

// §4.1: bonusを除く基本給同士の査定比でmid/largeを分け、減額10万未満は除外する。
{
  const midMath = declineMath(mid);
  assert.ok(midMath.bpRatio > 0.75 && midMath.bpRatio <= 0.90 && midMath.declineAmount >= 10,
    'mid用fixtureが判定帯に入ること');
  const midNeg = generate([mid]).negotiations[0];
  assert.strictEqual(midNeg.declineLevel, 'mid');
  assert.strictEqual(midNeg.declineAmount, midMath.declineAmount);
  assert.strictEqual(midNeg.bpRatio, midMath.bpRatio);

  const largeMath = declineMath(large);
  assert.ok(largeMath.bpRatio <= 0.75 && largeMath.declineAmount >= 10,
    'large用fixtureが判定帯に入ること');
  const largeNeg = generate([large]).negotiations[0];
  assert.strictEqual(largeNeg.declineLevel, 'large');

  const smallAmount = fighter({
    id: 8403, currentOvr: 40, contractOvr: 50,
    popularity: 0, contractPop: 0, trust: 60,
  });
  const smallMath = declineMath(smallAmount);
  assert.ok(smallMath.bpRatio <= 0.90 && smallMath.declineAmount < 10,
    '10万未満fixtureが比率条件だけを満たすこと');
  assert.ok(!generate([smallAmount]).negotiations.some(n => n.attitude.startsWith('decline')),
    '減額幅10万未満は下りカードにしないこと');
}

// §4.2/I-2/I-6: trust帯どおりに態度を分け、40未満とレンタルには出さない。
{
  const voluntary = { ...large, id: 8410, trust: 75 };
  const notified = { ...large, id: 8411, trust: 74 };
  const lowTrust = { ...large, id: 8412, trust: 39 };
  const rental = { ...large, id: 8413, trust: 90, isRental: true };
  const negotiations = generate([voluntary, notified, lowTrust, rental]).negotiations;
  assert.strictEqual(negotiations.find(n => n.fighterId === voluntary.id)?.attitude, 'decline_voluntary');
  assert.strictEqual(negotiations.find(n => n.fighterId === notified.id)?.attitude, 'decline');
  assert.ok(!negotiations.some(n => n.fighterId === lowTrust.id && n.attitude.startsWith('decline')),
    'trust 40未満には下りカードを出さないこと');
  assert.ok(!negotiations.some(n => n.fighterId === rental.id), 'レンタル選手を交渉対象にしないこと');
}

// §4.2/I-2: 下りカードは減額幅の大きい順に季2枚まで。
{
  const candidates = [
    fighter({ id: 8420, currentOvr: 45, contractOvr: 90, popularity: 20, contractPop: 80, trust: 60 }),
    fighter({ id: 8421, currentOvr: 55, contractOvr: 80, popularity: 25, contractPop: 70, trust: 60 }),
    fighter({ id: 8422, currentOvr: 65, contractOvr: 75, popularity: 40, contractPop: 60, trust: 60 }),
  ];
  const expectedIds = candidates
    .map(f => ({ id: f.id, amount: declineMath(f).declineAmount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 2)
    .map(row => row.id)
    .sort();
  const declineCards = generate(candidates).negotiations.filter(n => n.attitude === 'decline');
  assert.strictEqual(declineCards.length, 2, '下りカードは季2枚までであること');
  assert.deepStrictEqual(declineCards.map(n => n.fighterId).sort(), expectedIds,
    '減額幅の大きい2名が残ること');
}

// 深刻度ソートは下り方向も絶対値で評価し、gapRatio=0の端点を1扱いしない。
{
  const zeroGap = fighter({
    id: 8425, currentOvr: 20, contractOvr: 90,
    popularity: 0, contractPop: 80, trust: 74,
  });
  assert.strictEqual(Engine.contract.calcGapRatio(zeroGap, stateFor([zeroGap])), 0,
    '端点fixtureのgapRatioが0であること');
  const moderateRaise = fighter({
    id: 8426, currentOvr: 74, contractOvr: 70,
    popularity: 50, contractPop: 40, trust: 74,
  });
  const negotiations = generate([moderateRaise, zeroGap]).negotiations;
  assert.strictEqual(negotiations[0].fighterId, zeroGap.id,
    'gapRatio=0の下りカードを最大深刻度として扱うこと');
}

// 据え置き: 予約をoffWeek3再固定が1回だけ消費し、給与を維持する。
{
  const state = stateFor([mid]);
  const neg = generate([mid]).negotiations[0];
  const beforeSalary = Engine.util.getSalary(mid, {});
  const held = Engine.contract.resolveNegotiation(Engine.rng.create(8425), state, neg, 0);
  assert.strictEqual(held.result.trustDelta, 6);
  assert.strictEqual(held.result.moraleDelta, 2);
  assert.strictEqual(held.state.lockerRoomMorale, 52);
  assert.strictEqual(held.state.roster[0].salaryDeclineHold, neg.declineAmount);

  const refixed = Engine.contract.refixRoster(held.state.roster)[0];
  assert.strictEqual(Engine.util.getSalary(refixed, {}), beforeSalary,
    '据え置き選択後の再固定で給与総額を維持すること');
  assert.ok(refixed.salaryBonus >= 0 && refixed.salaryBonus <= 100);
  assert.ok(!Object.prototype.hasOwnProperty.call(refixed, 'salaryDeclineHold'),
    '据え置き予約を再固定後に残さないこと');
  const refixedAgain = Engine.contract.refixRoster([refixed])[0];
  assert.strictEqual(refixedAgain.salaryBonus, refixed.salaryBonus,
    '消費済み予約を翌季に再適用しないこと');
}

// I-3: 据え置きでもsalaryBonus上限100を超えず、超過分は据え置ききれない。
{
  const nearCap = { ...large, id: 8430, salaryBonus: 95 };
  const neg = generate([nearCap]).negotiations[0];
  const beforeSalary = Engine.util.getSalary(nearCap, {});
  const held = Engine.contract.resolveNegotiation(Engine.rng.create(8430), stateFor([nearCap]), neg, 0);
  const refixed = Engine.contract.refixRoster(held.state.roster)[0];
  assert.strictEqual(refixed.salaryBonus, 100);
  assert.ok(Engine.util.getSalary(refixed, {}) < beforeSalary,
    '上限を超える減額幅までは据え置かないこと');
}

// 厳格改定: bonusを清算し、再固定後は現在実力・人気の適正給ちょうどになる。
{
  const strictFighter = { ...large, id: 8440, trust: 60, salaryBonus: 25 };
  const neg = generate([strictFighter]).negotiations[0];
  const resolved = Engine.contract.resolveNegotiation(
    Engine.rng.create(8440), stateFor([strictFighter]), neg, 2
  );
  assert.strictEqual(resolved.result.trustDelta, -10);
  assert.strictEqual(resolved.result.salaryDelta, -25);
  assert.strictEqual(resolved.state.roster[0].salaryBonus, 0);
  assert.strictEqual(resolved.result.escalated, false);
  const refixed = Engine.contract.refixRoster(resolved.state.roster)[0];
  assert.strictEqual(
    Engine.util.getSalary(refixed, {}),
    basePay(strictFighter, true),
    '厳格改定後の給与が適正給ちょうどになること'
  );

  const fragileTrust = { ...large, id: 8441, trust: 40, salaryBonus: 10 };
  const fragileNeg = generate([fragileTrust]).negotiations[0];
  const originalFloat = Engine.rng.float;
  Engine.rng.float = () => 0;
  try {
    const escalated = Engine.contract.resolveNegotiation(
      Engine.rng.create(8441), stateFor([fragileTrust]), fragileNeg, 2
    );
    assert.ok(escalated.state.roster[0].trust < 40);
    assert.strictEqual(escalated.result.escalated, true,
      '厳格改定でtrust 40未満になった場合は40%判定を行うこと');
  } finally {
    Engine.rng.float = originalFloat;
  }
}

// I-4: trust上昇は据え置きとvoluntary受け入れだけ。通常受入は60未満だけ低下。
{
  const trust70 = { ...mid, id: 8450, trust: 70 };
  const accept70 = Engine.contract.resolveNegotiation(
    Engine.rng.create(8450), stateFor([trust70]), generate([trust70]).negotiations[0], 1
  );
  assert.strictEqual(accept70.result.trustDelta, 0);

  const trust50 = { ...mid, id: 8451, trust: 50 };
  const accept50 = Engine.contract.resolveNegotiation(
    Engine.rng.create(8451), stateFor([trust50]), generate([trust50]).negotiations[0], 1
  );
  assert.strictEqual(accept50.result.trustDelta, -4);

  const voluntary = { ...mid, id: 8452, trust: 80 };
  const voluntaryAccept = Engine.contract.resolveNegotiation(
    Engine.rng.create(8452), stateFor([voluntary]), generate([voluntary]).negotiations[0], 1
  );
  assert.strictEqual(voluntaryAccept.result.trustDelta, 2);
  assert.strictEqual(voluntaryAccept.result.moraleDelta, 0);
}

// 承認済みセリフ: 7×7×7=343本。マーカーを含まず、差し込みも解決される。
{
  const phases = [
    'decline_open', 'decline_voluntary_open', 'decline_hold', 'decline_accept',
    'decline_strict', 'decline_voluntary_hold', 'decline_voluntary_accept',
  ];
  const archetypes = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
  const personalities = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
  let count = 0;
  for (const phase of phases) {
    for (const archetype of archetypes) {
      for (const personality of personalities) {
        const pool = CONTRACT_NEGOTIATION_LINES[phase]?.[archetype]?.[personality];
        assert.ok(Array.isArray(pool) && pool.length === 1,
          `${phase}/${archetype}/${personality} が1本であること`);
        assert.ok(!pool[0].includes('※'), 'レビュー用マーカーを取り込まないこと');
        count += pool.length;
      }
    }
  }
  assert.strictEqual(count, 343);
  const line = Engine.contract.selectDialogue(
    Engine.rng.create(8455),
    { ...large, archetype: 'standard', personality: 'normal' },
    'decline_voluntary_open',
    { tenureSeasons: 5, isFounder: false, record: 'good', wins: 0, losses: 0, rivalName: '' }
  );
  assert.ok(!line.includes('{tenure}') && !line.includes('{record}'),
    '既存の差し込み経路でテンプレ変数を解決すること');
}

// UI/auto-sim: 新画面を作らず既存モーダルに明示表示し、指定確率で自動応答する。
{
  const uiSource = fs.readFileSync(path.join(srcDir, 'ui-common.js'), 'utf8');
  const modalStart = uiSource.indexOf('function showContractNegotiationModal(');
  const modalEnd = uiSource.indexOf('\nfunction showContractReactionModal(', modalStart);
  const modal = uiSource.slice(modalStart, modalEnd);
  for (const text of [
    '📉 契約査定', '🤝 減俸申し出', '現在の週給:', '→ 査定:',
    '据え置く', '査定どおり改定', '厳しく改定', '受け入れる',
  ]) assert.ok(modal.includes(text), `既存交渉モーダルに「${text}」を表示すること`);
  assert.ok(!/#[0-9a-f]{3,8}/i.test(modal), '新分岐に16進色をハードコードしないこと');

  const autoSource = fs.readFileSync(path.join(root, 'test', 'auto-sim.js'), 'utf8');
  const autoStart = autoSource.indexOf('function autoHandleContractNegotiation(');
  const autoEnd = autoSource.indexOf('\nfunction autoHandleScoutEvent(', autoStart);
  const auto = autoSource.slice(autoStart, autoEnd);
  assert.ok(auto.includes("neg.attitude === 'decline'"));
  assert.ok(auto.includes("neg.attitude === 'decline_voluntary'"));
  assert.ok(auto.includes('roll < 0.3 ? 0 : (roll < 0.8 ? 1 : 2)'),
    'declineのA30/B50/C20%を維持すること');
  assert.ok(auto.includes('roll < 0.3 ? 0 : 1'),
    'decline_voluntaryのA30/B70%を維持すること');
}

console.log('salary-decline-cards-test: PASS');
