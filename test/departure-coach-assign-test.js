'use strict';

// departure-coach-assign-test — 退場者のコーチ担当後始末の回帰テスト
//
// 2026-08-31 実セーブ棚(prerefix_S12W45)のオフシーズン走破で発見:
// 引退確定(commitRetirements)やラストラン期限切れ(advanceWeek offWeek1)が
// roster から選手を抜くとき coachAssign を掃除しておらず、次の renderWeekScreen で
// repairProgressionState の自己修復(coachAssign_stale_refs_removed)が鳴っていた。
// 解雇・引き抜き・モチベ喪失(engine側)は従来から unassignFromCoach を呼んでおり、
// 「退場者が残す参照の後始末」の漏れは引退族だけだった。
//
// 検査の物差しは修正箇所自身ではなく検出器(repairProgressionState)に置く:
// 退場処理後の state を渡して coachAssign_stale_refs_removed が出ないことを確認する。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\nif \(typeof module !== 'undefined'[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js',
].forEach(loadAsGlobal);

function staleAssignIds(state) {
  const rosterIds = new Set((state.roster || []).map(c => Number(c.id)));
  return Object.values(state.coachAssign || {})
    .flat()
    .filter(id => !rosterIds.has(Number(id)));
}

function assertDetectorSilent(state, label) {
  const repair = Engine.saveDoctor.repairProgressionState(state);
  assert.ok(
    !repair.changes.includes('coachAssign_stale_refs_removed'),
    `${label}: repairProgressionState が coachAssign_stale_refs_removed を報告した (changes=${JSON.stringify(repair.changes)})`
  );
}

function buildState() {
  let state = Engine.createInitialState(46101, true);
  const coachId = ALL_COACHES[0].id;
  const [departing, staying] = state.roster;
  state = {
    ...state,
    coaches: [coachId],
    coachAssign: { [coachId]: [departing.id, staying.id] },
    funds: 5000,
  };
  return { state, coachId, departing, staying };
}

// ── 1. commitRetirements(引退確定ダイアログ後の一括確定) ──────────────────────
function testCommitRetirementsUnassignsCoach() {
  const { state, coachId, departing, staying } = buildState();
  assert.strictEqual(staleAssignIds(state).length, 0, '前提: 初期状態に stale 参照なし');

  const result = Engine.retirement.commitRetirements(state, [departing]);
  const after = result.state;

  assert.ok(!after.roster.some(c => c.id === departing.id), '前提: 引退者は roster から抜けている');
  assert.deepStrictEqual(staleAssignIds(after), [], '引退者の担当が coachAssign に残っている');
  assert.ok(
    (after.coachAssign[coachId] || []).includes(staying.id),
    '残留選手の担当まで巻き添えで消えている'
  );
  assertDetectorSilent(after, 'commitRetirements後');
}

// ── 2. advanceWeek offWeek1 のラストラン期限切れ(commitを待たない即時除去) ──────
function testLastRunExpiryUnassignsCoach() {
  const { state, coachId, departing, staying } = buildState();
  const expired = {
    ...state,
    week: 49,
    offSeason: true,
    offWeek: 0,
    weekPhase: 'offseason',
    roster: state.roster.map(c => c.id === departing.id
      ? { ...c, lastRun: true, lastRunWeek: 1 } // 現在絶対週49に対して十分過去 → 期限切れ
      : c),
  };

  const after = Engine.advanceWeek(expired).state;

  assert.strictEqual(after.offWeek, 1, '前提: offWeek1 の処理が走っている');
  assert.ok(!after.roster.some(c => c.id === departing.id), '前提: 期限切れ選手は roster から抜けている');
  assert.deepStrictEqual(staleAssignIds(after), [], 'ラストラン期限切れ選手の担当が coachAssign に残っている');
  assert.ok(
    (after.coachAssign[coachId] || []).includes(staying.id),
    '残留選手の担当まで巻き添えで消えている'
  );
  assertDetectorSilent(after, 'advanceWeek(offWeek1)後');
}

// ── 3. 検出器の生存確認(逆向き): わざと stale を作れば必ず鳴く ─────────────────
function testDetectorStillBarks() {
  const { state, coachId } = buildState();
  const broken = { ...state, coachAssign: { [coachId]: [99999] } };
  const repair = Engine.saveDoctor.repairProgressionState(broken);
  assert.ok(
    repair.changes.includes('coachAssign_stale_refs_removed'),
    '検出器が stale coachAssign に反応しなくなっている(このテスト自体が無意味化)'
  );
}

const tests = [
  testCommitRetirementsUnassignsCoach,
  testLastRunExpiryUnassignsCoach,
  testDetectorStillBarks,
];

let failed = 0;
for (const t of tests) {
  try {
    t();
    console.log(`PASS ${t.name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL ${t.name}: ${e.message}`);
  }
}
if (failed > 0) {
  console.error(`departure-coach-assign-test: ${failed} failed`);
  process.exit(1);
}
console.log('departure-coach-assign-test: all passed');
