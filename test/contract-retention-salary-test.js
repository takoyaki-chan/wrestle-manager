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
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js'].forEach(loadAsGlobal);

const fighter = {
  id: 1, name: '引き留め対象', pw: 60, sp: 60, te: 60, st: 60, mn: 60,
  popularity: 40, trust: 100, careerSeasons: 2, salaryBonus: 10,
  careerRecord: Engine.career.createRecord(),
};
const state = {
  season: 1, week: 49, funds: 1000, roster: [fighter], titles: {},
  orgName: 'テスト団体', lockerRoomMorale: 50, relationships: null,
};
const neg = {
  fighterId: fighter.id, fighterName: fighter.name, attitude: 'transfer',
  raiseAmount: 12, counterOffer: 6, retentionBonus: 160, gapRatio: 1.3,
  context: { isFounder: false },
};

const success = Engine.contract.resolveNegotiation(Engine.rng.create(1), state, neg, 0);
assert.strictEqual(success.result.type, 'stay', '十分に高い信頼度なら引き留めに成功すること');
assert.strictEqual(success.result.salaryDelta, neg.raiseAmount, '引き留め昇給は本人の要求額を使うこと');
assert.strictEqual(success.state.roster[0].salaryBonus, 22, '引き留め成功時に給与へ反映されること');
assert.strictEqual(success.result.fundsCost, neg.retentionBonus, '一時金は従来どおり支払うこと');

const capped = Engine.contract.calcRetentionRaiseAmount({ ...neg, raiseAmount: 12 }, { ...fighter, salaryBonus: 95 }, state);
assert.strictEqual(capped, 5, '給与上限100万/週を超えないこと');

const failedState = { ...state, roster: [{ ...fighter, trust: 0 }] };
const originalFloat = Engine.rng.float;
Engine.rng.float = () => 0.99;
const failed = Engine.contract.resolveNegotiation(Engine.rng.create(1), failedState, neg, 0);
Engine.rng.float = originalFloat;
assert.strictEqual(failed.result.type, 'depart', '引き留め失敗時は従来どおり退団すること');
assert.strictEqual(failed.result.salaryDelta, 0, '引き留め失敗時は昇給しないこと');

const uiSource = fs.readFileSync(path.join(srcDir, 'ui-common.js'), 'utf8');
assert.ok(uiSource.includes('一時金${neg.retentionBonus}万 + 給与+${retentionRaise}万/週'),
  '引き留め選択肢に一時金と昇給の両方を表示すること');

console.log('contract-retention-salary-test: PASS');
