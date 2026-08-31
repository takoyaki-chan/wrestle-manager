'use strict';

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
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js',
].forEach(loadAsGlobal);

function fighter(overrides = {}) {
  return {
    id: 9001,
    name: '給与テスト選手',
    pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    popularity: 40,
    contractOVR: 50,
    contractPop: 20,
    salaryBonus: 0,
    trust: 50,
    careerSeasons: 2,
    careerRecord: Engine.career.createRecord(),
    ...overrides,
  };
}

function salary(f, titles = {}) {
  return Engine.util.getSalary(f, titles);
}

// I-2/I-3(v1.34改定): 上限内の成長は従来どおり一括追従。
// 上限(旧基本給×1.6+10)を超えるギャップは部分更新で止まり、数季で適正へ収束する。
{
  // ── 健全ケース(1季ぶんの成長=上限内): 従来挙動と完全一致 ──
  const healthy = fighter({
    pw: 74, sp: 74, te: 74, st: 74, mn: 74,
    popularity: 60,
    contractOVR: 70,
    contractPop: 55,
    salaryBonus: 12,
  });
  const healthyFair = salary({
    ...healthy, contractOVR: Engine.util.ov(healthy), contractPop: healthy.popularity, salaryBonus: 0,
  });
  const healthyAfter = Engine.contract.refixRoster([healthy])[0];
  assert.strictEqual(healthyAfter.contractOVR, Engine.util.ov(healthy),
    '上限内の成長はcontractOVRを現在値へ一括更新すること');
  assert.strictEqual(healthyAfter.contractPop, healthy.popularity);
  assert.ok(Math.abs(salary(healthyAfter) - Math.max(salary(healthy), healthyFair)) <= 1,
    '上限内の再固定後給与は従来どおり max(前給, 適正給) になること');

  // ── ギャップケース(旧版持ち越し級): 1季の上昇は capBP で止まる ──
  const before = fighter({
    pw: 75, sp: 75, te: 75, st: 75, mn: 75,
    popularity: 60,
    contractOVR: 45,
    contractPop: 10,
    salaryBonus: 30,
  });
  const oldBase = salary({ ...before, salaryBonus: 0 });
  const capBP = Math.round(oldBase * SALARY_REFIX_CAP.mult + SALARY_REFIX_CAP.flat);
  const fairSalary = salary({
    ...before,
    contractOVR: Engine.util.ov(before),
    contractPop: before.popularity,
    salaryBonus: 0,
  });
  assert.ok(fairSalary > capBP, '前提: このケースは上限を超えるギャップであること');
  const after = Engine.contract.refixRoster([before])[0];
  assert.ok(after.contractOVR > before.contractOVR && after.contractOVR < Engine.util.ov(before),
    'ギャップ超過時は部分更新(旧契約値と現在値の間)になること');
  assert.ok(salary({ ...after, salaryBonus: 0 }) <= capBP + 1,
    '1季の基本給上昇は上限(旧基本給×1.6+10)以内に収まること');
  assert.ok(after.salaryBonus >= 0 && after.salaryBonus <= before.salaryBonus,
    '吸収後bonusは負値にならず、再固定で増えないこと');

  // ── 収束: 毎季refixを繰り返すと単調非減少で有限季内に適正給へ到達する ──
  let cur = after;
  let prevBase = salary({ ...cur, salaryBonus: 0 });
  let converged = false;
  for (let seasonI = 0; seasonI < 8; seasonI++) {
    cur = Engine.contract.refixRoster([cur])[0];
    const base = salary({ ...cur, salaryBonus: 0 });
    assert.ok(base >= prevBase - 1, '段階追従中の基本給は単調非減少であること');
    prevBase = base;
    if (Math.abs(base - fairSalary) <= 1) { converged = true; break; }
  }
  assert.ok(converged, 'ギャップは8季以内に適正給へ収束すること');
}

// I-2/I-3: 衰えた選手は bonus を追加削減せず、base+pop部分だけが下がる。
{
  const before = fighter({
    pw: 48, sp: 48, te: 48, st: 48, mn: 48,
    popularity: 25,
    contractOVR: 80,
    contractPop: 75,
    salaryBonus: 18,
    wear: 55,
  });
  const after = Engine.contract.refixRoster([before])[0];
  const fairBase = salary({
    ...before,
    contractOVR: Engine.util.ov(before),
    contractPop: before.popularity,
    salaryBonus: 0,
  });
  assert.strictEqual(after.salaryBonus, before.salaryBonus,
    '衰えた選手のsalaryBonusを再固定で削らないこと');
  assert.ok(Math.abs(salary(after) - (fairBase + before.salaryBonus)) <= 1,
    '衰えた選手は適正base+pop+salaryBonusになること');
  assert.ok(salary(after) < salary(before), '衰えが翌季給与の下落へ反映されること');
}

// I-2: 吸収額がbonusを超えても0で止まり、レンタル選手は完全に対象外。
{
  const growing = fighter({
    pw: 90, sp: 90, te: 90, st: 90, mn: 90,
    popularity: 90,
    contractOVR: 30,
    contractPop: 0,
    salaryBonus: 2,
  });
  const rental = fighter({ id: 9002, isRental: true, salaryBonus: 25 });
  const [after, rentalAfter] = Engine.contract.refixRoster([growing, rental]);
  assert.strictEqual(after.salaryBonus, 0, 'salaryBonusは0未満にならないこと');
  assert.strictEqual(rentalAfter, rental, 'レンタル選手は再固定対象外であること');
}

// I-4: FA・スカウト・移籍のplayer加入履歴を刻む時点で、現在値へ契約を固定する。
{
  const staleContract = fighter({
    pw: 72, sp: 70, te: 68, st: 66, mn: 64,
    popularity: 57,
    contractOVR: 30,
    contractPop: 5,
  });
  const joinEvents = [
    { type: 'debut', orgId: 'player', via: 'freeagent' },
    { type: 'debut', orgId: 'player', via: 'scout' },
    { type: 'transfer', toOrg: 'player', via: 'negotiate' },
  ];
  joinEvents.forEach(event => {
    const joined = Engine.career.addEvent(staleContract, event);
    assert.strictEqual(joined.contractOVR, Engine.util.ov(staleContract),
      `${event.via}加入時のcontractOVRが現在OVRであること`);
    assert.strictEqual(joined.contractPop, staleContract.popularity,
      `${event.via}加入時のcontractPopが現在人気であること`);
  });

  const aiTransfer = Engine.career.addEvent(staleContract, {
    type: 'transfer', toOrg: 'org_s', via: 'negotiate',
  });
  assert.strictEqual(aiTransfer.contractOVR, staleContract.contractOVR,
    'AI団体への移籍はプレイヤー契約値を再設定しないこと');
  assert.strictEqual(aiTransfer.contractPop, staleContract.contractPop);
}

// I-4: UIを通らないスカウト確定経路も、候補生成時点の契約値を持ち越す。
{
  const template = ALL_CHARS[0];
  const report = Engine.scout.generateScoutReport(Engine.rng.create(8304), {
    rngSeed: 8304,
    season: 2,
    roster: [],
    aiOrgs: {},
    freeAgents: [],
    scoutCandidates: [],
    retiredIds: [],
    dormantPool: [{ id: template.id, age: 17 }],
  }, 'offseason');
  assert.strictEqual(report.candidates.length, 1);
  const candidate = report.candidates[0];
  assert.strictEqual(candidate.contractOVR, Engine.util.ov(candidate));
  assert.strictEqual(candidate.contractPop, candidate.popularity || 0);
}

function offseasonState(seed, f) {
  const base = Engine.createInitialState(seed, true);
  const rosterFighter = {
    ...base.roster[0],
    ...f,
    id: base.roster[0].id,
    name: base.roster[0].name,
    condition: 80,
  };
  return {
    ...base,
    season: 2,
    week: 49,
    offSeason: true,
    offWeek: 1,
    weekPhase: 'offseason',
    roster: [rosterFighter],
    pendingContractNegotiations: null,
    scoutCandidates: null,
    dormantPool: [],
  };
}

const originalRefixRoster = Engine.contract.refixRoster;
const originalGenerateScoutReport = Engine.scout.generateScoutReport;
let refixCalls = 0;
Engine.contract.refixRoster = roster => {
  refixCalls += 1;
  return originalRefixRoster(roster);
};
Engine.scout.generateScoutReport = () => ({ usedPoolIds: [], candidates: [] });

try {
  // I-1: 交渉発生季はoffWeek2で再固定せず、解決後のoffWeek3でちょうど1回走る。
  {
    refixCalls = 0;
    const underpaid = fighter({
      pw: 78, sp: 78, te: 78, st: 78, mn: 78,
      popularity: 65,
      contractOVR: 35,
      contractPop: 5,
      salaryBonus: 0,
      trust: 50,
    });
    const off2 = Engine.advanceWeek(offseasonState(8301, underpaid)).state;
    assert.strictEqual(off2.offWeek, 2);
    assert.strictEqual(off2.weekPhase, 'contractNegotiation');
    assert.ok(off2.pendingContractNegotiations.length > 0, '給与ギャップで交渉が発生すること');
    assert.strictEqual(refixCalls, 0, 'offWeek2の交渉発生時に再固定しないこと');
    assert.strictEqual(off2.roster[0].contractOVR, underpaid.contractOVR,
      '交渉判定は旧契約値のまま行うこと');

    const afterNegotiation = {
      ...off2,
      offWeek: 2,
      weekPhase: 'offseason',
      pendingContractNegotiations: null,
      roster: [{ ...off2.roster[0], salaryBonus: 30 }],
    };
    const off3 = Engine.advanceWeek(afterNegotiation).state;
    assert.strictEqual(off3.offWeek, 3);
    assert.strictEqual(refixCalls, 1, '交渉発生季もoffWeek3で再固定が1回だけ走ること');
    // v1.34: このケース(contractOVR 35→78級)は移行ギャップなので部分更新で止まる。
    // 前進していること+上限以内であることを検査する
    assert.ok(off3.roster[0].contractOVR > underpaid.contractOVR,
      '再固定でcontractOVRが前進していること');
    const _off3OldBase = Engine.util.getSalary({ ...underpaid, salaryBonus: 0 }, {});
    assert.ok(Engine.util.getSalary({ ...off3.roster[0], salaryBonus: 0 }, {})
      <= Math.round(_off3OldBase * SALARY_REFIX_CAP.mult + SALARY_REFIX_CAP.flat) + 1,
      'ギャップ持ちの再固定は上限給以内に収まること');
  }

  // I-1: 交渉なしの季もoffWeek2では走らず、offWeek3で1回だけ走る。
  {
    refixCalls = 0;
    const current = fighter({ trust: 100, contractOVR: 60, contractPop: 40 });
    const off2 = Engine.advanceWeek(offseasonState(8302, current)).state;
    assert.strictEqual(off2.offWeek, 2);
    assert.ok(!off2.pendingContractNegotiations || off2.pendingContractNegotiations.length === 0);
    assert.strictEqual(refixCalls, 0, '交渉なしでもoffWeek2では再固定しないこと');

    const off3 = Engine.advanceWeek(off2).state;
    assert.strictEqual(off3.offWeek, 3);
    assert.strictEqual(refixCalls, 1, '交渉なしの季も再固定は1回だけであること');
  }
} finally {
  Engine.contract.refixRoster = originalRefixRoster;
  Engine.scout.generateScoutReport = originalGenerateScoutReport;
}

console.log('salary-refix-test: PASS');
