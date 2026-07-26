// ai-turnover-test.js
//
// 世代交代（retirement-drama-spec v0.2 §6）の安全網。
//
// 実測でAI団体のロスターは 1年に 12〜17% しか入れ替わらず、全員一巡に6〜9年かかっていた。
// 引退・契約退団に**上乗せ**して毎年少しだけ余分に放出することで加速する。
//
// **数値そのもの（何人出すか）は較正で動く前提なので固定しない。**
// 守るのは「団体の顔が残る」「痩せ細らない」「trainCap の低い層から出す」という規則。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const management = read('src/management.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

global.window = { IS_TRIAL: false };
(function load() {
  const srcDir = path.join(root, 'src');
  ['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
   'management.js', 'match-engine.js', 'relationships.js'].forEach(f => {
    let code = fs.readFileSync(path.join(srcDir, f), 'utf-8')
      .replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '')
      .replace(/^(const|let) /gm, 'var ');
    new vm.Script(code, { filename: f }).runInThisContext();
  });
})();

/** ロスターを作る。ovr は5statに均等、trainCap は cap で指定 */
function mk(id, ovr, cap, peak) {
  const f = { id, name: 'F' + id, age: 22,
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    trainCap: { pw: cap, sp: cap, te: cap, st: cap },
    careerRecord: { peakOVR: peak != null ? peak : ovr },
    orgTimeline: [{ orgId: 'org_s', fromSeason: 1, fromWeek: 1 }] };
  return f;
}
function baseState() {
  return { season: 5, freeAgents: [], dormantPool: [], relationships: {}, aiOrgs: {} };
}

console.log('=== 世代交代（AI団体の余分な放出） ===\n');

section('1. 設定表が data.js にある（実装にベタ書きしない）', () => {
  assert.ok(typeof AI_TURNOVER_CFG === 'object', 'AI_TURNOVER_CFG が無い');
  ['extraReleaseByTier', 'protectTopN', 'protectPeakDrop', 'releaseFromRank', 'minRosterAfter']
    .forEach(k => assert.ok(AI_TURNOVER_CFG[k] != null, `${k} が無い`));
  ['S', 'A', 'B'].forEach(t => {
    const r = AI_TURNOVER_CFG.extraReleaseByTier[t];
    assert.ok(Array.isArray(r) && r.length === 2 && r[0] <= r[1], `${t}級の放出数がおかしい`);
  });
});

section('2. ティアで放出数に差がつく（S ≧ A ≧ B）', () => {
  const c = AI_TURNOVER_CFG.extraReleaseByTier;
  assert.ok(c.S[1] >= c.A[1], 'S級の上限が A級を下回っている');
  assert.ok(c.A[1] >= c.B[1], 'A級の上限が B級を下回っている');
});

section('3. 実際に放出される', () => {
  const roster = [];
  for (let i = 1; i <= 14; i++) roster.push(mk(i, 60, 90 - i));
  const s = baseState();
  const r = Engine.rival.applyExtraTurnover(Engine.rng.create(1), roster, 'org_s', 'S', s);
  assert.ok(r.released.length >= 1, 'S級なのに1人も出ていない');
  assert.strictEqual(r.roster.length, roster.length - r.released.length, '人数が合わない');
});

section('4. 団体の顔（OVR上位3名）は放出されない', () => {
  const roster = [];
  // 上位3名は OVR を高く、trainCap は**わざと最低**にして候補に入りやすくする
  for (let i = 1; i <= 14; i++) roster.push(mk(i, i <= 3 ? 95 : 50, i <= 3 ? 10 : 90));
  const s = baseState();
  for (let seed = 1; seed <= 30; seed++) {
    const r = Engine.rival.applyExtraTurnover(Engine.rng.create(seed), roster, 'org_s', 'S', baseState());
    const gone = r.released.map(f => f.id);
    assert.ok(!gone.some(id => id <= 3),
      `seed=${seed}: 上位3名が放出された(${gone.join(',')})。団体の顔が残らない`);
  }
});

section('5. ピークから大きく落ちた顔は、保護を外れる', () => {
  // 上位3名だが「ピーク95 → 現在80」で protectPeakDrop(3) を大きく超えて落ちている
  const roster = [];
  for (let i = 1; i <= 14; i++) roster.push(mk(i, i <= 3 ? 80 : 50, i <= 3 ? 10 : 90, i <= 3 ? 95 : 50));
  let everReleased = false;
  for (let seed = 1; seed <= 30; seed++) {
    const r = Engine.rival.applyExtraTurnover(Engine.rng.create(seed), roster, 'org_s', 'S', baseState());
    if (r.released.some(f => f.id <= 3)) { everReleased = true; break; }
  }
  assert.ok(everReleased,
    'ピークから落ちきっても保護されたまま。永久に居座る選手ができる');
});

section('6. trainCap が高い選手は放出候補に入らない', () => {
  const roster = [];
  // id 1..7 は cap 高、id 8..14 は cap 低
  for (let i = 1; i <= 14; i++) roster.push(mk(i, 50, i <= 7 ? 95 : 40));
  for (let seed = 1; seed <= 30; seed++) {
    const r = Engine.rival.applyExtraTurnover(Engine.rng.create(seed), roster, 'org_s', 'S', baseState());
    const gone = r.released.map(f => f.id);
    assert.ok(!gone.some(id => id <= 7),
      `seed=${seed}: 伸びしろのある選手が出された(${gone.join(',')})`);
  }
});

section('7. 痩せ細らせない（minRosterAfter を下回らない）', () => {
  const min = AI_TURNOVER_CFG.minRosterAfter;
  for (let n = 5; n <= min + 2; n++) {
    const roster = [];
    for (let i = 1; i <= n; i++) roster.push(mk(i, 50, 40));
    const r = Engine.rival.applyExtraTurnover(Engine.rng.create(7), roster, 'org_s', 'S', baseState());
    assert.ok(r.roster.length >= Math.min(n, min),
      `${n}人から ${r.released.length}人 出して ${r.roster.length}人になった。下限 ${min} を割っている`);
  }
});

section('8. 出した選手は FA へ回る（消滅させない）', () => {
  const roster = [];
  for (let i = 1; i <= 14; i++) roster.push(mk(i, 60, 90 - i));
  const s = baseState();
  const r = Engine.rival.applyExtraTurnover(Engine.rng.create(3), roster, 'org_s', 'S', s);
  const moved = (s.freeAgents || []).length + (s.dormantPool || []).length;
  assert.strictEqual(moved, r.released.length,
    '放出したのに FA にも休眠プールにも居ない。選手が消えている');
});

section('9. 所属履歴が閉じられる（年代記が壊れない）', () => {
  const roster = [];
  for (let i = 1; i <= 14; i++) roster.push(mk(i, 60, 90 - i));
  const s = baseState();
  const r = Engine.rival.applyExtraTurnover(Engine.rng.create(5), roster, 'org_s', 'S', s);
  assert.ok(r.released.length > 0, '放出が起きなかった');
  r.released.forEach(f => {
    const first = (f.orgTimeline || [])[0];
    assert.ok(first && first.toSeason != null,
      `${f.name}: 前の所属が閉じられていない。在籍年数が無限になる`);
  });
});

section('10. 季末処理に配線されている', () => {
  assert.ok(/Engine\.rival\.applyExtraTurnover\(/.test(management),
    '定義しただけで呼ばれていない');
  const at = management.indexOf('Step 5c');
  assert.ok(at > 0, 'Step 5c のコメントが無い（配線位置が追えない）');
});

section('11. 同じ選手を二重に出さない', () => {
  const roster = [];
  for (let i = 1; i <= 14; i++) roster.push(mk(i, 60, 40));
  for (let seed = 1; seed <= 20; seed++) {
    const r = Engine.rival.applyExtraTurnover(Engine.rng.create(seed), roster, 'org_s', 'S', baseState());
    const ids = r.released.map(f => f.id);
    assert.strictEqual(new Set(ids).size, ids.length, `seed=${seed}: 重複して放出している`);
    ids.forEach(id => assert.ok(!r.roster.some(f => f.id === id), '残留側にも居る'));
  }
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (11 sections)');
