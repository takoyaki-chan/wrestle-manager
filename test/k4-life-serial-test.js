'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S2: 人生番号の土台(docs/fun-audit-v0.1/k4-separate-lives-design.md §2)
//
//  - Engine.life.current / of / stamp / beginNewLife(番号部分)
//  - 番号は転生(引退枠→休眠プール)の時だけ進む。3つの転生経路(季末の補充・ロード時修復・CLI修復)が
//    すべて beginNewLife を通る
//  - 印付け(stamp)は何度呼んでも同じ。tickWeek・advanceWeek・repairOnLoad・createInitialState に置く
//  - 在籍履歴の季(makeAIFighter の最初の項目が作られた季になる)
//  - 不変条件 I-1(validateGameState)
//  - 旧セーブ(実セーブ棚)で落ちない
//
//  WM_TEST_SRC_DIR で読み込む src を差し替えられる(変更前のコードで落ちることの確認用)。
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach(k => { out = out.split('{' + k + '}').join(params[k]); });
  return out;
}, pn(s) { return s; }, pnSurname(s) { return s; }, mv(s) { return s; }, mvShort(s) { return s; } };

const ROOT = path.join(__dirname, '..');
const srcDir = process.env.WM_TEST_SRC_DIR || path.join(ROOT, 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n${e.stack}`); process.exitCode = 1; }
}
const L = () => Engine.life;
const allFighters = s => [
  ...(s.roster || []).map(f => ['roster', f]),
  ...Object.entries(s.aiOrgs || {}).flatMap(([o, org]) => ((org && org.roster) || []).map(f => [o, f])),
  ...(s.freeAgents || []).map(f => ['fa', f]),
  ...(s.scoutCandidates || []).map(f => ['scout', f]),
];

console.log('k4-life-serial-test');

test('current / of: lifeSerial が無ければ 1(fail-open)。選手の lifeNo を優先', () => {
  assert.strictEqual(typeof L().current, 'function');
  assert.strictEqual(L().current({}, 5), 1);
  assert.strictEqual(L().current({ lifeSerial: { 5: 3 } }, 5), 3);
  assert.strictEqual(L().of({ lifeSerial: { 5: 3 } }, { id: 5 }), 3, 'lifeNo が無ければ今の人生');
  assert.strictEqual(L().of({ lifeSerial: { 5: 3 } }, { id: 5, lifeNo: 2 }), 2, 'lifeNo があればそれ');
  assert.strictEqual(L().of({ lifeSerial: { 5: 3 } }, 5), 3);
});

test('beginNewLife: 番号を1つ進める(入力は書き換えない)', () => {
  const s0 = { season: 9, lifeSerial: { 7: 2 } };
  const s1 = L().beginNewLife(s0, 7);
  assert.strictEqual(s1.lifeSerial[7], 3);
  assert.strictEqual(s0.lifeSerial[7], 2, '入力は不変');
  const s2 = L().beginNewLife({ season: 9 }, 8);
  assert.strictEqual(s2.lifeSerial[8], 2, '番号の無いIDは 1 → 2(欠番はあってよい)');
});

test('createInitialState: lifeSerial={}・全員 lifeNo=1・団体ロスターは debutSeason=1', () => {
  const s = Engine.createInitialState(777, true);
  assert.deepStrictEqual(s.lifeSerial, {});
  allFighters(s).forEach(([where, f]) => {
    assert.strictEqual(f.lifeNo, 1, `${where} ${f.id} lifeNo`);
    if (where === 'roster' || where.startsWith('org_')) assert.strictEqual(f.debutSeason, 1, `${where} ${f.id} debutSeason`);
    else assert.strictEqual(f.debutSeason, undefined, `${where} ${f.id} は未デビュー`);
  });
});

test('stamp: 何度呼んでも同じ(2回目は同じ state を返す)・オフ中の獲得は翌季デビュー', () => {
  const s = Engine.createInitialState(778, true);
  const bare = { ...s, lifeSerial: { [s.roster[0].id]: 4 },
    roster: s.roster.map(({ lifeNo, debutSeason, ...rest }) => rest),
    freeAgents: s.freeAgents.map(({ lifeNo, ...rest }) => rest), season: 6, offSeason: true, offWeek: 3 };
  const a = L().stamp(bare);
  assert.notStrictEqual(a, bare);
  assert.strictEqual(a.roster[0].lifeNo, 4, 'lifeSerial から番号を引く');
  assert.strictEqual(a.roster[1].lifeNo, 1);
  assert.strictEqual(a.roster[1].debutSeason, 7, 'オフ中に団体へ入った選手は翌季デビュー');
  assert.strictEqual(a.freeAgents[0].debutSeason, undefined, 'FA(見込み選手)には debutSeason を付けない');
  const b = L().stamp(a);
  assert.strictEqual(b, a, '2回目は変化なし=同じ state');
  const c = L().stamp({ ...a, season: 7, offSeason: false });
  assert.strictEqual(c.roster[1].debutSeason, 7, '一度付いた debutSeason は変わらない');
});

test('stamp: 旧セーブ(lifeSerial 無し)の団体ロスターは debutSeason を在籍季数から推定する', () => {
  const s = Engine.createInitialState(779, true);
  const legacy = { ...s, season: 12, offSeason: false,
    roster: s.roster.map(({ lifeNo, debutSeason, ...rest }, i) => ({ ...rest, careerSeasons: i })) };
  delete legacy.lifeSerial;
  const a = L().stamp(legacy);
  assert.deepStrictEqual(a.lifeSerial, {});
  a.roster.forEach((f, i) => assert.strictEqual(f.debutSeason, Math.max(1, 12 - i), `roster[${i}]`));
});

test('tickWeek / advanceWeek の入口で印を付ける', () => {
  const s = Engine.createInitialState(780, true);
  const strip = st => ({ ...st,
    roster: st.roster.map(({ lifeNo, ...r }) => r),
    aiOrgs: Object.fromEntries(Object.entries(st.aiOrgs).map(([k, o]) => [k, { ...o, roster: o.roster.map(({ lifeNo, ...r }) => r) }])),
    freeAgents: st.freeAgents.map(({ lifeNo, ...r }) => r) });
  const t = Engine.tickWeek(strip({ ...s, week: 3 })).state;
  allFighters(t).forEach(([w, f]) => assert.ok(Number.isFinite(f.lifeNo), `tickWeek: ${w} ${f.id}`));
  const a = Engine.advanceWeek(strip({ ...s, offSeason: true, offWeek: 1, weekPhase: 'offseason' })).state;
  allFighters(a).forEach(([w, f]) => assert.ok(Number.isFinite(f.lifeNo), `advanceWeek: ${w} ${f.id}`));
  // 入口は tickWeek の呼び名の更新(updateGivenNameCalls)の直前
  const mg = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  const tick = mg.indexOf('  tickWeek(state, opts) {');
  const stampAt = mg.indexOf('Engine.life.stamp(state)', tick);
  const callAt = mg.indexOf('Engine.relationships.updateGivenNameCalls(state)', tick);
  assert.ok(tick > 0 && stampAt > tick && stampAt < callAt, 'tickWeek: 印付けは呼び名の更新の直前');
});

test('季末の補充(A1): 引退枠→休眠プールに戻ったIDだけ番号が進む', () => {
  const s = Engine.createInitialState(781, true);
  const season = 12;
  const retired = (s.retiredIds || []).slice(0, 10);
  const retiredSeasons = { ...(s.retiredSeasons || {}) };
  retired.forEach(id => { retiredSeasons[id] = 1; }); // 休みは十分
  const state = { ...s, season, offSeason: true, offWeek: 0, weekPhase: 'offseason', retiredSeasons,
    lifeSerial: { [retired[0]]: 2 } };
  const out = Engine.advanceWeek(state).state;
  const wasRetired = new Set(state.retiredIds || []);
  const back = (out.dormantPool || []).map(e => e.id).filter(id => wasRetired.has(id));
  assert.ok(back.length > 0, '戻ったIDがある');
  back.forEach(id => {
    const before = id === retired[0] ? 2 : 1;
    assert.strictEqual(out.lifeSerial[id], before + 1, `${id} は番号が進む`);
  });
  const others = Object.keys(out.lifeSerial).map(Number).filter(id => !back.includes(id) && id !== retired[0]);
  assert.deepStrictEqual(others, [], '戻っていないIDの番号は作らない(休眠プールの子・FA・引退枠に残った子は進まない)');
  if (!back.includes(retired[0])) assert.strictEqual(out.lifeSerial[retired[0]], 2, '戻らなかったIDの番号はそのまま');
});

test('ロード時修復(A2): 補充で戻したIDは関所を通る・lifeSerial が無ければ初期化', () => {
  const s = Engine.createInitialState(782, true);
  const state = { ...s, season: 20, dormantPool: [], retiredSeasons: Object.fromEntries((s.retiredIds || []).map(id => [id, 1])) };
  delete state.lifeSerial;
  const rep = Engine.saveDoctor.repairOnLoad(state);
  assert.ok(rep.changes.includes('life_serial_initialized'), 'lifeSerial の初期化を記録');
  const back = (rep.state.dormantPool || []).map(e => e.id);
  assert.ok(back.length > 0, '補充が走る');
  back.forEach(id => assert.strictEqual(rep.state.lifeSerial[id], 2, `${id} は番号が進む`));
  allFighters(rep.state).forEach(([w, f]) => assert.ok(Number.isFinite(f.lifeNo), `${w} ${f.id} に印`));
});

test('CLI の修復(A3): tools/save-doctor.js --repair で戻したIDも関所を通る', () => {
  const s = Engine.createInitialState(783, true);
  const state = { ...s, season: 20, dormantPool: [], retiredSeasons: Object.fromEntries((s.retiredIds || []).map(id => [id, 1])) };
  delete state.lifeSerial;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'k4-life-'));
  const inFile = path.join(dir, 'in.json');
  const outFile = path.join(dir, 'out.json');
  fs.writeFileSync(inFile, JSON.stringify(state));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'save-doctor.js'), inFile, '--repair', '--output', outFile, '--json'],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env } });
  assert.strictEqual(r.status, 0, (r.stdout || '') + (r.stderr || ''));
  const out = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  const back = (out.dormantPool || []).map(e => e.id);
  assert.ok(back.length > 0, 'CLI の補充が走る');
  back.forEach(id => assert.ok((out.lifeSerial || {})[id] >= 2, `${id} は番号が進む`));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('在籍履歴の季: makeAIFighter の最初の項目は作られた季', () => {
  const t = ALL_CHARS[0];
  const f = Engine.rival.makeAIFighter(t, Engine.rng.create(1), null, 18, undefined, { season: 14, week: 9 });
  assert.deepStrictEqual(f.orgTimeline[0], { orgId: 'fa', fromSeason: 14, fromWeek: 9 });
  const g = Engine.rival.makeAIFighter(t, Engine.rng.create(1), 'org_a', 18);
  assert.strictEqual(g.orgTimeline[0].fromSeason, 1, '季を渡さなければ従来どおり 1');
});

test('不変条件 I-1: 選手の人生番号と今の人生が食い違えば validateGameState が報告する', () => {
  const s = Engine.createInitialState(784, true);
  const ok = Engine.validateGameState(s);
  assert.ok(!(ok.debugLog || []).some(e => /人生番号/.test(e.message)), '整合していれば出ない');
  const bad = { ...s, lifeSerial: { [s.roster[0].id]: 2 } };
  const v = Engine.validateGameState(bad);
  assert.ok((v.debugLog || []).some(e => /人生番号/.test(e.message) && e.message.includes(String(s.roster[0].id))), 'I-1 違反を報告');
});

test('実セーブ棚: repairOnLoad→tickWeek で落ちず、I-1 違反が出ない', () => {
  const shelf = path.join(ROOT, 'test', 'ui-walkthrough', 'fixtures', 'legacy-saves');
  const saves = fs.readdirSync(shelf).filter(f => f.endsWith('.json')).sort();
  assert.ok(saves.length > 0);
  saves.forEach(name => {
    const raw = fs.readFileSync(path.join(shelf, name), 'utf8');
    const G = JSON.parse(raw.startsWith('WM_LZ|') ? require('lz-string').decompressFromUTF16(raw.slice(6)) : raw);
    const rep = Engine.saveDoctor.repairOnLoad(G);
    const st = rep.state;
    assert.ok(st.lifeSerial && typeof st.lifeSerial === 'object', `${name}: lifeSerial`);
    const v = Engine.validateGameState({ ...st, debugLog: [] });
    const lifeViol = (v.debugLog || []).filter(e => /人生番号/.test(e.message));
    assert.deepStrictEqual(lifeViol.map(e => e.message), [], `${name}: I-1`);
    allFighters(st).forEach(([w, f]) => assert.ok(Number.isFinite(f.lifeNo), `${name}: ${w} ${f.id} に印`));
    if (!st.offSeason && st.weekPhase !== 'gameover') {
      const t = Engine.tickWeek({ ...st, weekPhase: 'manage' }).state;
      assert.ok(t && t.lifeSerial, `${name}: tickWeek が通る`);
    }
  });
});

console.log(`k4-life-serial-test: ${passed} passed${process.exitCode ? ' (FAILED)' : ''}`);
