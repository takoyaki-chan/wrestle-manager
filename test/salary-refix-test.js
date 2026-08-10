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

// I-2/I-3: 成長分が基本給へ移った範囲だけ bonus を吸収し、総額を二重に増やさない。
{
  const before = fighter({
    pw: 75, sp: 75, te: 75, st: 75, mn: 75,
    popularity: 60,
    contractOVR: 45,
    contractPop: 10,
    salaryBonus: 30,
  });
  const beforeSalary = salary(before);
  const fairSalary = salary({
    ...before,
    contractOVR: Engine.util.ov(before),
    contractPop: before.popularity,
    salaryBonus: 0,
  });
  const after = Engine.contract.refixRoster([before])[0];
  assert.strictEqual(after.contractOVR, Engine.util.ov(before));
  assert.strictEqual(after.contractPop, before.popularity);
  assert.ok(Math.abs(salary(after) - Math.max(beforeSalary, fairSalary)) <= 1,
    '成長選手の再固定後給与は max(前給, 適正給) になること');
  assert.ok(after.salaryBonus >= 0 && after.salaryBonus <= before.salaryBonus,
    '吸収後bonusは負値にならず、再固定で増えないこと');
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
    assert.strictEqual(off3.roster[0].contractOVR, Engine.util.ov(off3.roster[0]));
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
