// relationship-flags-spec-v1.0 §7-2: F-2 出戻り検出ユニットテスト
// 仕様書 §7.3 で必須指定: 誤検出は致命的事故
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
loadAsGlobal('relationships.js');

const isReturning = Engine.relationships.flags._isReturning;

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); pass++; }
  catch (e) { console.log(`  ✗ ${name}: ${e.message}`); fail++; }
}

console.log('=== F-2 出戻り検出ユニットテスト ===');

test('orgTimeline 未定義 → false', () => {
  assert.strictEqual(isReturning({ id: 1 }), false);
});

test('空 orgTimeline → false', () => {
  assert.strictEqual(isReturning({ id: 1, orgTimeline: [] }), false);
});

test('通常入団（player 在籍中、過去離脱なし）→ false', () => {
  const f = { id: 1, orgTimeline: [
    { orgId: 'player', fromSeason: 1, fromWeek: 1 }
  ]};
  assert.strictEqual(isReturning(f), false);
});

test('player → fa（解雇後）、まだ復帰していない → false', () => {
  const f = { id: 1, orgTimeline: [
    { orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 2, toWeek: 10 },
    { orgId: 'fa', fromSeason: 2, fromWeek: 10 }
  ]};
  assert.strictEqual(isReturning(f), false);
});

test('AI 団体出戻り（player → org_a → player 在籍中）→ true', () => {
  const f = { id: 1, orgTimeline: [
    { orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 2, toWeek: 10 },
    { orgId: 'org_a', fromSeason: 2, fromWeek: 10, toSeason: 3, toWeek: 5 },
    { orgId: 'player', fromSeason: 3, fromWeek: 5 }
  ]};
  assert.strictEqual(isReturning(f), true);
});

test('レンタル復帰（player → fa → player、間に他組織なし）→ false', () => {
  // 解雇 → FA → 再入団のケース。間に他 AI 団体経由していない
  const f = { id: 1, orgTimeline: [
    { orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 1, toWeek: 20 },
    { orgId: 'fa', fromSeason: 1, fromWeek: 20, toSeason: 1, toWeek: 30 },
    { orgId: 'player', fromSeason: 1, fromWeek: 30 }
  ]};
  assert.strictEqual(isReturning(f), false);
});

test('解雇後 AI 団体経由復帰 → true（fa は無視される）', () => {
  const f = { id: 1, orgTimeline: [
    { orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 1, toWeek: 20 },
    { orgId: 'fa', fromSeason: 1, fromWeek: 20, toSeason: 1, toWeek: 25 },
    { orgId: 'org_b', fromSeason: 1, fromWeek: 25, toSeason: 2, toWeek: 5 },
    { orgId: 'player', fromSeason: 2, fromWeek: 5 }
  ]};
  assert.strictEqual(isReturning(f), true);
});

test('複数回出戻り（最新の出戻りで true）', () => {
  const f = { id: 1, orgTimeline: [
    { orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 2, toWeek: 10 },
    { orgId: 'org_a', fromSeason: 2, fromWeek: 10, toSeason: 3, toWeek: 5 },
    { orgId: 'player', fromSeason: 3, fromWeek: 5, toSeason: 5, toWeek: 1 },
    { orgId: 'org_b', fromSeason: 5, fromWeek: 1, toSeason: 6, toWeek: 10 },
    { orgId: 'player', fromSeason: 6, fromWeek: 10 }
  ]};
  assert.strictEqual(isReturning(f), true);
});

test('player 在籍中に直接他組織記録のみ（不正データ）→ false', () => {
  const f = { id: 1, orgTimeline: [
    { orgId: 'org_a', fromSeason: 1, fromWeek: 1 }
  ]};
  assert.strictEqual(isReturning(f), false);
});

console.log(`\nResult: ${pass} pass / ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
