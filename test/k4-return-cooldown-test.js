'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S5: 戻ってくるまでの休み(docs/fun-audit-v0.1/k4-separate-lives-design.md §5)
//
//  - 「注目の人生」(その人生で殿堂入りした・王座を獲った・自団体に在籍した)は15季、通常は5季
//  - 判定の材料は retiredLives(引退時の要約)。無いとき(旧データ)は殿堂と年代記アーカイブで (a)(c)
//  - 3つの転生経路のうち、季末の補充(advanceWeek)とロード時修復(repairOnLoad)が同じ判定を通す
//    (CLI は S7 で repairOnLoad に一本化)
//  - ロード時の「重症」の非常補充は、通常の人生だけ休みを無視する。注目の人生は非常時でも戻さない
//
//  WM_TEST_SRC_DIR で読み込む src を差し替えられる(変更前のコードで落ちることの確認用)。
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach(k => { out = out.split('{' + k + '}').join(params[k]); });
  return out;
}, pn(s) { return s; }, pnSurname(s) { return s; }, mv(s) { return s; }, mvShort(s) { return s; } };

const srcDir = process.env.WM_TEST_SRC_DIR || path.join(__dirname, '..', 'src');
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

const summary = (extra) => ({ lifeNo: 1, debutSeason: 1, endSeason: 10, lastOrgId: 'org_a', titleReigns: 0,
  crowned: false, alumni: false, hof: false, ...extra });

// 開始時の引退枠のIDから2つ借り、他の引退枠を空にした状態(season 16・引退は S10 = 6季前)
function base(seed) {
  const s0 = Engine.createInitialState(seed, true);
  const pool = (s0.retiredIds || []).slice();
  assert.ok(pool.length >= 4, '開始時の引退枠');
  const [A, B, C, D] = pool;
  const s = { ...s0, season: 16, week: 1, retiredIds: [A, B, C, D],
    retiredSeasons: { [A]: 10, [B]: 10, [C]: 10, [D]: 10 }, retiredLives: {} };
  return { s, A, B, C, D };
}

test('休みの長さ: 注目の人生(殿堂・王座・自団体)は15季、通常は5季', () => {
  const { s, A, B, C, D } = base(6001);
  const st = { ...s, retiredLives: {
    [A]: summary({ hof: true }), [B]: summary({ crowned: true }), [C]: summary({ alumni: true }), [D]: summary({}),
  } };
  [A, B, C].forEach(id => assert.strictEqual(Engine.life.returnCooldown(st, id), 15, `注目 ${id}`));
  assert.strictEqual(Engine.life.returnCooldown(st, D), 5);
  assert.strictEqual(DORMANT_POOL_CFG.retiredCooldownNotable, 15);
});

test('旧データ(retiredLives 無し): 殿堂と年代記アーカイブで判定する', () => {
  const { s, A, B, D } = base(6002);
  const st = { ...s, retiredLives: undefined,
    allHallOfFame: { player: [], org_s: [{ id: A, name: 'a', lifeNo: 1, inductionSeason: 10, activeSeasonsEnd: 10 }], org_a: [], org_b: [] },
    chronicle: { ...(s.chronicle || {}), fighterArchive: [{ id: B, name: 'b', lifeNo: 1, retiredSeason: 10, careerSeasonsEnd: 10 }] } };
  assert.strictEqual(Engine.life.returnCooldown(st, A), 15, '殿堂入り');
  assert.strictEqual(Engine.life.returnCooldown(st, B), 15, '自団体OG(年代記に載る)');
  assert.strictEqual(Engine.life.returnCooldown(st, D), 5);
});

test('季末の補充(advanceWeek): 6季前に引退した通常の人生は戻り、注目の人生は戻らない', () => {
  const { s, A, B, C, D } = base(6003);
  const st = { ...s, offSeason: true, offWeek: 0, weekPhase: 'offseason', retiredLives: {
    [A]: summary({ hof: true }), [B]: summary({ alumni: true }), [C]: summary({}), [D]: summary({}),
  } };
  const out = Engine.advanceWeek(st).state;
  const pooled = new Set((out.dormantPool || []).map(e => e.id));
  assert.ok(pooled.has(C) && pooled.has(D), '通常の人生は5季で戻る');
  assert.ok(!pooled.has(A) && !pooled.has(B), '注目の人生は15季まで戻らない');
  assert.ok((out.retiredIds || []).includes(A) && (out.retiredIds || []).includes(B));
  // 15季たてば戻る
  const later = Engine.advanceWeek({ ...st, retiredSeasons: { [A]: 1, [B]: 1, [C]: 10, [D]: 10 } }).state;
  const pooled2 = new Set((later.dormantPool || []).map(e => e.id));
  assert.ok(pooled2.has(A) && pooled2.has(B), '15季たった注目の人生は戻る');
});

test('ロード時修復: 非常補充でも注目の人生は戻さない(通常の人生は休みを無視して戻す)', () => {
  const { s, A, B, C, D } = base(6004);
  // 休眠プールを空にして「重症」にする。引退は今季(休み0季)
  const st = { ...s, dormantPool: [], retiredSeasons: { [A]: 16, [B]: 16, [C]: 16, [D]: 16 }, retiredLives: {
    [A]: summary({ hof: true, endSeason: 16 }), [B]: summary({ crowned: true, endSeason: 16 }),
    [C]: summary({ endSeason: 16 }), [D]: summary({ endSeason: 16 }),
  } };
  const r = Engine.saveDoctor.repairOnLoad(st);
  assert.ok(r.severe, '重症');
  const pooled = new Set((r.state.dormantPool || []).map(e => e.id));
  assert.ok(pooled.size > 0, '非常補充で休眠プールが埋まる');
  assert.ok(!pooled.has(A) && !pooled.has(B), '注目の人生は非常補充でも戻らない');
  assert.ok(r.state.retiredIds.includes(A) && r.state.retiredIds.includes(B));
  // 通常の人生しか残っていなければ、休みを無視して戻す
  const only = { ...st, retiredIds: [C, D] };
  assert.deepStrictEqual(Engine.saveDoctor._eligibleRetired(only, true).sort((a, b) => a - b), [C, D].sort((a, b) => a - b));
  // 通常の補充(重症でない)では休みを終えた人生だけ
  const eligible = Engine.saveDoctor._eligibleRetired({ ...st, retiredSeasons: { [A]: 10, [B]: 1, [C]: 10, [D]: 14 } }, false);
  assert.deepStrictEqual(eligible.sort((a, b) => a - b), [B, C].sort((a, b) => a - b));
  // 非常時の並び: 休みを終えた人生が先
  const em = Engine.saveDoctor._eligibleRetired({ ...st, retiredSeasons: { [A]: 10, [B]: 1, [C]: 10, [D]: 14 } }, true);
  assert.deepStrictEqual(em.slice(0, 2).sort((a, b) => a - b), [B, C].sort((a, b) => a - b));
  assert.ok(em.includes(D) && !em.includes(A));
});

console.log(`\nk4-return-cooldown-test: ${passed} passed${process.exitCode ? ' (FAILURES)' : ''}`);
