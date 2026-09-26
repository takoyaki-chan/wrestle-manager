'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S7: 既存セーブの移行と CLI の一本化(docs/fun-audit-v0.1/k4-separate-lives-design.md §7)
//
//  (1) 合成の旧セーブ: 殿堂の二重登録(同じIDが S6 と S20 に殿堂入り)・転生済みの現役・他団体へ移った
//      自団体OG(同じ人生)・休眠プールのID・引退枠のID・統一王座の旧履歴 → 移行で正しい人生番号
//  (2) 2回かけても同じ結果(repairOnLoad の2回目は何もしない。印を外して数え直しても同じ番号)
//  (3) S1〜S3 期のセーブ(lifeSerial あり・選手は全員 lifeNo=1 の印)でも既存の lifeNo を正としない。
//      移行前に関所を通った転生の番号は下げない(lifeSerial = max(既存, 数え直し))
//  (4) 移行後に不変条件 I-1・I-2 の違反が出ない
//  (5) CLI(tools/save-doctor.js --repair)は repairOnLoad と同じ結果
//  (6) 実セーブ棚: 殿堂の二重登録が別の人生に分かれ、repairOnLoad を2回かけても同じ
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
const clone = v => JSON.parse(JSON.stringify(v));
const FLAG = '_migrated_k4_lives_v1';

const A = 55; // 殿堂の二重登録 + 転生済みの現役(3番目の人生)
const B = 56; // 自団体OG が他団体へ移籍(同じ人生のまま AI 団体で現役)
const C = 57; // 休眠プール(前の人生は殿堂入り)
const D = 58; // 引退枠(S19 に引退・殿堂入り)
const hof = (id, orgId, start, end, extra) => ({ id, name: `n${id}`, orgId, orgName: orgId, activeSeasonsStart: start,
  activeSeasonsEnd: end, activeYears: `S${start}〜S${end}`, inductionSeason: end, hofLevel: 1, hofPoints: 20,
  titleReigns: 1, totalDefenses: 2, careerRecord: { history: [] }, ...(extra || {}) });

function stripLives(f) {
  if (!f || typeof f !== 'object') return f;
  const { lifeNo: _l, debutSeason: _d, ...rest } = f;
  return rest;
}

// K-4 以前の旧セーブ(lifeSerial も印も無い)
function legacySave() {
  const s0 = Engine.createInitialState(9191, true);
  const tmpl = clone(s0.roster[0]);
  const orgIds = Object.keys(s0.aiOrgs);
  const ids = new Set([A, B, C, D]);
  const s = clone(s0);
  delete s.lifeSerial; delete s[FLAG];
  s.season = 25; s.week = 10; s.offSeason = false;
  s.roster = s.roster.filter(f => !ids.has(f.id)).map(stripLives);
  orgIds.forEach(o => { s.aiOrgs[o].roster = s.aiOrgs[o].roster.filter(f => !ids.has(f.id)).map(stripLives); });
  s.freeAgents = (s.freeAgents || []).filter(f => !ids.has(f.id)).map(stripLives);
  s.scoutCandidates = (s.scoutCandidates || []).filter(f => !ids.has(f.id)).map(stripLives);
  s.dormantPool = (s.dormantPool || []).filter(e => !ids.has(e.id));
  s.retiredIds = (s.retiredIds || []).filter(id => !ids.has(id));
  // A: 3番目の人生で自団体の現役(在籍3季 → デビュー推定 S22 > 最後の記録 S20)
  s.roster.push({ ...stripLives(tmpl), id: A, name: 'nA', careerStage: 'active', careerSeasons: 3, age: 20 });
  // B: 自団体OG。S18 に他団体へ(年代記に登録)、同じ人生のまま AI 団体で現役(在籍15季 → デビュー S10)
  s.aiOrgs[orgIds[0]].roster.push({ ...stripLives(tmpl), id: B, name: 'nB', careerStage: 'active', careerSeasons: 15, age: 30, orgId: orgIds[0] });
  // C: 休眠プール(前の人生の関係値が残っている)
  s.dormantPool.push({ id: C, age: 17 });
  // D: 引退枠(S19 に引退)
  s.retiredIds.push(D); s.retiredSeasons = { ...(s.retiredSeasons || {}), [D]: 19 };
  s.allHallOfFame = { player: [hof(D, 'player', 8, 19)], org_s: [hof(A, 'org_s', 1, 6), hof(C, 'org_s', 1, 9)],
    org_a: [hof(A, 'org_a', 1, 20)], org_b: [] };
  s.hallOfFame = clone(s.allHallOfFame.player);
  s.chronicle = { ...(s.chronicle || {}), fighterArchive: [
    { id: B, name: 'nB', careerSeasonsStart: 10, careerSeasonsEnd: 18, retiredSeason: 18, careerRecord: { history: [] } },
    { id: D, name: 'nD', careerSeasonsStart: 8, careerSeasonsEnd: 19, retiredSeason: 19, careerRecord: { history: [] } },
  ] };
  s.relationships = { ...(s.relationships || {}), [`${C}>${B}`]: { bond: 80, rivalry: 30 }, [`${B}>${C}`]: { bond: 75, rivalry: 20 } };
  s.h2h = { ...(s.h2h || {}), [`${B}>${C}`]: { matches: 2, winsA: 1, winsB: 1, draws: 0, history: [{ s: 7, w: 'A' }, { s: 8, w: 'B' }] } };
  s.newsSeen = { ...(s.newsSeen || {}), retired: { [String(A)]: 20 } };
  s.unifiedTitle = { championId: A, orgId: 'player', defenses: 0, history: [
    { type: 'creation', season: 4, week: 10, championId: A, orgId: 'org_s' },
    { type: 'vacate', season: 6, week: 40, championId: A, orgId: 'org_s' },
    { type: 'crown', season: 24, week: 10, championId: A, orgId: 'player' },
  ] };
  return s;
}
const allLiving = st => [...(st.roster || []), ...Object.values(st.aiOrgs || {}).flatMap(o => o.roster || []),
  ...(st.freeAgents || []), ...(st.scoutCandidates || []), ...(st.retiredFighters || [])];
const hofOf = (st, id) => Object.values(st.allHallOfFame || {}).flatMap(l => l || []).filter(h => h.id === id)
  .sort((a, b) => a.activeSeasonsEnd - b.activeSeasonsEnd);

test('合成の旧セーブ: 殿堂の二重登録・転生済みの現役・移籍したOG・休眠プール・引退枠が正しい人生になる', () => {
  const r = Engine.saveDoctor.repairOnLoad(legacySave());
  const st = r.state;
  assert.strictEqual(st[FLAG], true, '移行の印');
  assert.ok(r.changes.some(c => /^k4_lives_migrated:/.test(c)), '修復ログ');
  // M2: 殿堂の二重登録は別の人生
  assert.deepStrictEqual(hofOf(st, A).map(h => h.lifeNo), [1, 2]);
  // M3: 転生済みの現役は3番目の人生・移籍したOGは同じ人生
  const a = allLiving(st).find(f => f.id === A);
  const b = allLiving(st).find(f => f.id === B);
  assert.strictEqual(a.lifeNo, 3); assert.strictEqual(st.lifeSerial[A], 3);
  assert.strictEqual(b.lifeNo, 1); assert.strictEqual(st.lifeSerial[B], 1);
  assert.strictEqual(st.chronicle.fighterArchive.find(e => e.id === B).lifeNo, 1);
  // M4・M6: 休眠プールのIDは次の人生、前の人生の生きた記録は閉じる
  assert.strictEqual(st.lifeSerial[C], 2);
  assert.ok(!Object.keys(st.relationships || {}).some(k => k.split('>').map(Number).includes(C)), 'C の関係値が残っている');
  assert.ok(!Object.keys(st.h2h || {}).some(k => k.split('>').map(Number).includes(C)), 'C の対戦成績が残っている');
  // M5: 引退枠のIDは引退した人生(殿堂・年代記と同じ人生)
  assert.strictEqual(st.lifeSerial[D], 1);
  assert.strictEqual(hofOf(st, D)[0].lifeNo, 1);
  // M8: 転生済みの現役の報道済みの引退の印は消す
  assert.ok(!(st.newsSeen.retired && st.newsSeen.retired[String(A)]), 'newsSeen.retired');
  // M9: 始まりの信用できない旧AI殿堂
  assert.ok(hofOf(st, A).every(h => h.startUnknown === true));
  assert.ok(!hofOf(st, D)[0].startUnknown, '自団体の殿堂は始まりが信用できる');
  // 旧 hallOfFame(allHallOfFame.player の写し)にも同じ番号
  assert.strictEqual(st.hallOfFame.find(h => h.id === D).lifeNo, 1);
  // 統一王座の旧履歴: S4〜S6 は1番目の人生、S24 は今の人生
  assert.deepStrictEqual(st.unifiedTitle.history.map(e => e.lives && e.lives[A]), [1, 1, 3]);
  // 殿堂詳細: 1番目の人生の殿堂エントリを「ID+人生番号」で引ける
  assert.strictEqual(Engine.life.findHofEntry(st, A, 1).activeSeasonsEnd, 6);
  assert.strictEqual(Engine.life.findHofEntry(st, A, 3), null);
});

test('2回かけても同じ結果', () => {
  const once = Engine.saveDoctor.repairOnLoad(legacySave()).state;
  const twice = Engine.saveDoctor.repairOnLoad(clone(once)).state;
  assert.ok(!Engine.saveDoctor.repairOnLoad(clone(once)).changes.some(c => /^k4_lives_migrated/.test(c)), '2回目は移行しない');
  const pick = st => ({ lifeSerial: st.lifeSerial, hof: st.allHallOfFame, arch: st.chronicle.fighterArchive,
    living: allLiving(st).map(f => [f.id, f.lifeNo, f.debutSeason]).sort((x, y) => x[0] - y[0]),
    unified: st.unifiedTitle.history });
  assert.deepStrictEqual(pick(twice), pick(once));
  // 印を外して数え直しても同じ番号
  const noFlag = clone(once); delete noFlag[FLAG];
  const again = Engine.life.migrateLegacyLives(noFlag).state;
  assert.deepStrictEqual(pick(again).lifeSerial, pick(once).lifeSerial);
  assert.deepStrictEqual(pick(again).living, pick(once).living);
  assert.deepStrictEqual(pick(again).hof, pick(once).hof);
});

test('S1〜S3 期のセーブ: 既存の lifeNo(全員1)を正としない・関所を通った転生の番号は下げない', () => {
  // lifeSerial あり・選手は全員 lifeNo=1 の印。A は殿堂の記録が2つ(k=2)なのに lifeNo=1 と印が付いている
  const s = legacySave();
  s.lifeSerial = {};
  s.roster = s.roster.map(f => ({ ...f, lifeNo: 1 }));
  const r1 = Engine.saveDoctor.repairOnLoad(clone(s)).state;
  assert.strictEqual(allLiving(r1).find(f => f.id === A).lifeNo, 3, '既存の lifeNo=1 を上書き');
  // 移行前に関所を通って lifeSerial が 4 になっていた(記録の無い人生があった)なら、4 を下げない
  const s2 = clone(s); s2.lifeSerial = { [A]: 4 }; s2.roster = s2.roster.map(f => (f.id === A ? { ...f, lifeNo: 4 } : f));
  const r2 = Engine.saveDoctor.repairOnLoad(s2).state;
  assert.strictEqual(r2.lifeSerial[A], 4);
  assert.strictEqual(allLiving(r2).find(f => f.id === A).lifeNo, 4);
});

test('移行後に不変条件 I-1・I-2 の違反が出ない', () => {
  const st = Engine.saveDoctor.repairOnLoad(legacySave()).state;
  const v = Engine.validateGameState(st);
  const bad = (v.debugLog || []).filter(e => /人生番号|二重登録/.test(e.message));
  assert.deepStrictEqual(bad.map(e => e.message), []);
});

test('新しいゲームは移行しない(印つきで始まる)', () => {
  const s = Engine.createInitialState(9192, true);
  assert.strictEqual(s[FLAG], true);
  const r = Engine.saveDoctor.repairOnLoad(s);
  assert.ok(!r.changes.some(c => /^k4_lives_migrated/.test(c)));
});

test('CLI(tools/save-doctor.js --repair)は repairOnLoad と同じ結果', () => {
  const save = legacySave();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'k4-mig-'));
  const inFile = path.join(dir, 'in.json');
  const outFile = path.join(dir, 'out.json');
  fs.writeFileSync(inFile, JSON.stringify(save));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'save-doctor.js'), inFile, '--repair', '--output', outFile, '--json'],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env } });
  assert.strictEqual(r.status, 0, (r.stdout || '') + (r.stderr || ''));
  const cli = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  const eng = JSON.parse(JSON.stringify(Engine.saveDoctor.repairOnLoad(clone(save)).state));
  fs.rmSync(dir, { recursive: true, force: true });
  assert.deepStrictEqual(cli.lifeSerial, eng.lifeSerial);
  assert.deepStrictEqual(cli.dormantPool, eng.dormantPool);
  assert.deepStrictEqual(cli.retiredIds, eng.retiredIds);
  assert.deepStrictEqual(cli.allHallOfFame, eng.allHallOfFame);
  assert.strictEqual(cli[FLAG], true);
});

test('実セーブ棚: 殿堂の二重登録が別の人生に分かれ、2回かけても同じ', () => {
  const shelf = path.join(ROOT, 'test', 'ui-walkthrough', 'fixtures', 'legacy-saves');
  const LZ = (() => { try { return require('lz-string'); } catch (e) { return null; } })();
  const read = f => {
    const raw = fs.readFileSync(path.join(shelf, f), 'utf8');
    if (raw.trim().startsWith('{')) return JSON.parse(raw);
    if (!LZ) return null;
    const mk = raw.startsWith('WM_LZ|') ? 6 : 6;
    return JSON.parse(LZ.decompressFromUTF16(raw.slice(mk)));
  };
  fs.readdirSync(shelf).filter(f => f.endsWith('.json')).sort().forEach(f => {
    const save = read(f);
    if (!save) return;
    const once = Engine.saveDoctor.repairOnLoad(clone(save)).state;
    const twice = Engine.saveDoctor.repairOnLoad(clone(once)).state;
    assert.deepStrictEqual(twice.lifeSerial, once.lifeSerial, `${f}: lifeSerial`);
    assert.deepStrictEqual(twice.allHallOfFame, once.allHallOfFame, `${f}: 殿堂`);
    // 殿堂の (id, 人生) の二重が無く、全エントリに人生番号
    const hofAll = Object.values(once.allHallOfFame || {}).flatMap(l => l || []);
    const keys = hofAll.map(h => `${h.id}#${h.lifeNo}`);
    assert.strictEqual(new Set(keys).size, keys.length, `${f}: 殿堂の (id,人生) の二重`);
    assert.ok(hofAll.every(h => Number.isFinite(h.lifeNo)), `${f}: 人生番号の無い殿堂エントリ`);
    // 生きた選手は今の人生と一致(I-1)
    allLiving(once).forEach(p => assert.strictEqual(p.lifeNo, Engine.life.current(once, p.id), `${f}: I-1 ${p.id}`));
    if (/ultralong/.test(f)) {
      const byId = new Map(); hofAll.forEach(h => byId.set(h.id, (byId.get(h.id) || 0) + 1));
      const multi = [...byId.values()].filter(n => n >= 2).length;
      assert.strictEqual(multi, 2, 'ultralong の殿堂の二重登録2件が別の人生に');
    }
  });
});

console.log(`\nk4-migration-test: ${passed} passed${process.exitCode ? ' (FAILURES)' : ''}`);
