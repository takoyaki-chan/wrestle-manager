'use strict';
// K-11(2026-09-25 Keisuke 裁定)回帰テスト: 他団体の関係性ポップアップは、自団体の件数の2倍まで。
// Engine.relationships.flags.gateModalQueue(tickWeek 末尾で週1回)が
//   1) 他団体の件数を「直近12週(今週を含む)の自団体の件数×2(自団体0件なら1)」以内に抑える
//   2) 自団体の出来事は1件も落とさず、中身も変えない
//   3) 自団体が0件でも12週に1件は他団体の分を出す
//   4) 関係値(bond/rivalry)や他の状態を一切変えない
// ことを、合成 state の単体ケースと、実エンジンの tickWeek を「抑制あり/なし」で並走させる結合ケースで確かめる。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 表示専用の Math.random を決定化(並走する2本の tickWeek に同じ列を配るため、呼ぶ前に毎回巻き戻す)
let randState = 1;
Math.random = function seededRandom() {
  randState = (Math.imul(randState, 1664525) + 1013904223) >>> 0;
  return randState / 0x100000000;
};
const resetRandom = (seed) => { randState = seed >>> 0; };

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach((key) => { out = out.split('{' + key + '}').join(params[key]); });
  return out;
}, pn(str) { return str; }, pnSurname(str) { return str; }, mv(str) { return str; }, mvShort(str) { return str; } };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

const F = Engine.relationships.flags;
const gate = (s) => F.gateModalQueue(s);
const CFG = F.MODAL_GATE;
assert.strictEqual(CFG.WINDOW_WEEKS, 12, '窓は12週');
assert.strictEqual(CFG.OTHER_PER_OWN, 2, 'K-11 裁定: 自団体の2倍まで');
assert.strictEqual(CFG.MIN_OTHER_PER_WINDOW, 1, '自団体0件でも12週に1件');

// ── 合成 state ──────────────────────────────────────────────
// 自団体 1,2,3 / org_s: 101(王者) 102 103 / org_a: 201 202(自団体2と因縁55) 203(元所属)
// org_b: 301〜312(人気60。業界の人気上位10を占める) 313 314(無名)
const fighter = (id, extra) => ({ id, name: `F${id}`, popularity: 10, ...(extra || {}) });
function world(week, extra) {
  return {
    season: 2, week, offSeason: false, offWeek: 0, rngSeed: 7,
    roster: [fighter(1, { popularity: 20 }), fighter(2, { popularity: 20 }), fighter(3, { popularity: 20 })],
    aiOrgs: {
      org_s: { roster: [fighter(101, { popularity: 40 }), fighter(102), fighter(103)], titles: { world: { championId: 101 } } },
      org_a: { roster: [fighter(201), fighter(202), fighter(203, { orgTimeline: [
        { orgId: 'player', fromSeason: 1, fromWeek: 1, toSeason: 1, toWeek: 30 },
        { orgId: 'org_a', fromSeason: 1, fromWeek: 30 }] })], titles: { world: { championId: null } } },
      org_b: { roster: [...Array.from({ length: 12 }, (_, i) => fighter(301 + i, { popularity: 60 })),
        fighter(313, { popularity: 5 }), fighter(314, { popularity: 5 })], titles: { world: { championId: null } } },
    },
    freeAgents: [],
    relationships: { '2>202': { bond: 40, rivalry: 55 }, '202>2': { bond: 45, rivalry: 20 }, '1>2': { bond: 60, rivalry: 10 } },
    _modalQueue: [],
    relModalWindow: [],
    ...(extra || {}),
  };
}
const ev = (type, fromId, toId, week) => ({ type, payload: { fromId, toId }, season: 2, week });
const strip = (e) => { const { scope, ...rest } = e; return rest; };
// テスト側の独立した id 抽出(エンジンの _modalFighterIds とは別に書く)
const idsOf = (p) => {
  const out = [];
  const add = (v) => { if (typeof v === 'number') out.push(v); };
  if (!p) return out;
  ['fromId', 'toId', 'fighterId', 'targetId', 'departerId', 'masterId', 'discipleId', 'idA', 'idB', 'returnerId'].forEach(k => add(p[k]));
  (p.byIds || []).forEach(add);
  (p.affectedIds || []).forEach(add);
  (p.reactions || []).forEach(r => add(r && r.byId));
  return out;
};
const ownOf = (q) => q.filter(e => e.scope === 'own');
const otherOf = (q) => q.filter(e => e.scope === 'other');

// 1) 自団体の出来事はすべてそのまま通る(中身不変・順序不変)。他団体は枠まで
{
  const s = world(10);
  const q = [ev('M-19', 1, 2, 10), ev('M-19', 313, 314, 10), ev('M-15', 3, 101, 10), ev('M-18', 102, 103, 10),
    { type: 'M-24', payload: { hostileCount: 3, pairs: [['A', 'B']], season: 2, week: 10 }, season: 2, week: 10 },
    ev('M-19', 201, 202, 10), ev('M-19', 301, 302, 10), ev('M-19', 303, 304, 10), ev('M-19', 305, 306, 10),
    ev('M-19', 307, 308, 10), ev('M-19', 309, 310, 10), ev('M-19', 311, 312, 10), ev('M-19', 313, 102, 10)];
  s._modalQueue = q;
  const out = gate(s);
  const own = ownOf(out._modalQueue);
  // 自団体: 1-2 の M-19 / 3 が絡む M-15(相手は他団体) / 選手idを持たない M-24
  assert.deepStrictEqual(own.map(strip), [q[0], q[2], q[4]], '自団体の出来事は1件も落とさず、中身もそのまま');
  const other = otherOf(out._modalQueue);
  assert.strictEqual(other.length, 6, '自団体3件 → 他団体は2倍の6件まで');
  assert.deepStrictEqual(out.relModalWindow, [{ w: Engine.util.absWeekTotal(2, 10, false, 0), own: 3, other: 6 }], '直近12週の記録');
}

// 2) 自団体0件でも12週に1件は出る(毎週候補があっても 12週に1件だけ)
{
  let s = world(1);
  const shownWeeks = [];
  for (let week = 1; week <= 48; week++) {
    s = { ...s, week, _modalQueue: [ev('M-19', 313, 314, week), ev('M-18', 102, 103, week), ev('M-15', 201, 202, week)] };
    s = gate(s);
    const shown = otherOf(s._modalQueue);
    assert.ok(shown.length <= 1, `W${week}: 自団体0件の週に他団体が2件以上出ない`);
    if (shown.length) shownWeeks.push(week);
    s = { ...s, _modalQueue: [] }; // UI の drain
  }
  assert.deepStrictEqual(shownWeeks, [1, 13, 25, 37], '自団体0件なら12週に1件ずつ出る');
}

// 3) 上限を超えない: 自団体の件数が週ごとに揺れても、他団体を出す時点で「直近12週の他団体 ≤ max(2×自団体, 1)」
{
  let s = world(1);
  const log = [];
  const ownPattern = [0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let ownIn = 0, ownOut = 0;
  ownPattern.forEach((nOwn, i) => {
    const week = i + 1;
    const q = [];
    for (let k = 0; k < nOwn; k++) q.push(ev('M-19', 1 + (k % 3), 1 + ((k + 1) % 3), week));
    for (let k = 0; k < 4; k++) q.push(ev('M-19', 301 + 2 * k, 302 + 2 * k, week));
    ownIn += nOwn;
    s = gate({ ...s, week, _modalQueue: q });
    const own = ownOf(s._modalQueue).length;
    const other = otherOf(s._modalQueue).length;
    ownOut += own;
    log.push({ week, own, other });
    const win = log.filter(x => x.week > week - 12);
    const cap = Math.max(2 * win.reduce((a, x) => a + x.own, 0), 1);
    if (other > 0) {
      assert.ok(win.reduce((a, x) => a + x.other, 0) <= cap, `W${week}: 直近12週の他団体が上限(${cap})を超えない`);
    }
    s = { ...s, _modalQueue: [] };
  });
  assert.strictEqual(ownOut, ownIn, '自団体の件数は抑制の有無で変わらない');
  const otherTotal = log.reduce((a, x) => a + x.other, 0);
  assert.ok(otherTotal > 0 && otherTotal < 4 * ownPattern.length, `他団体は候補の一部だけ出る(候補 ${4 * ownPattern.length} / 出た ${otherTotal})`);
}

// 4) 優先順位: 同じ週に枠より多い候補があれば、王者・人気上位/自団体との縁が絡むものから
{
  const plain = ev('M-19', 313, 314, 20);          // 無名どうし
  const champ = ev('M-19', 102, 101, 20);          // 王者 101
  const former = ev('M-18', 201, 203, 20);         // 元所属 203
  const feud = ev('M-15', 201, 202, 20);           // 202 は自団体2と因縁55
  const starLinked = ev('M-19', 203, 301, 20);     // 人気上位 301 + 元所属 203
  const q = [plain, champ, former, feud, starLinked];
  const pick = (ownThisWeek) => {
    const ownEvents = Array.from({ length: ownThisWeek }, (_, k) => ev('M-24', 1, 2 + (k % 2), 20));
    ownEvents.forEach((e, k) => { e.payload.k = k; }); // 自団体の出来事を別々のものにする
    const out = gate({ ...world(20), _modalQueue: [...ownEvents, ...q] });
    return otherOf(out._modalQueue).map(strip);
  };
  assert.deepStrictEqual(pick(0), [starLinked], '枠1件: 人気上位+元所属の出来事が選ばれる');
  // 枠2件: 王者(同点の中で王者優先) → 出力はキューの順
  assert.deepStrictEqual(pick(1), [champ, starLinked], '枠2件: 次は王者が絡む出来事');
  const four = pick(2);
  assert.strictEqual(four.length, 4, '枠4件');
  assert.ok(!four.includes(plain), '無名どうしの出来事は最後まで残らない');
  assert.deepStrictEqual(pick(3).length, 5, '枠が候補より多ければ全部出る');
}

// 5) 同じ出来事の重複(show-result プレビュー tick が共有キューへ先に積んだ分)は1件として扱う
//    重複側を王者絡み(優先度が高い)にして、重複が枠を2つ食う実装なら落ちるようにしている
{
  const dup = ev('M-15', 101, 102, 5);
  const out = gate({ ...world(5), _modalQueue: [ev('M-19', 1, 2, 5), { ...dup }, { ...dup }, ev('M-18', 313, 314, 5)] });
  const other = otherOf(out._modalQueue);
  assert.strictEqual(other.length, 2, '重複を除いた2件(枠2件)');
  assert.strictEqual(other.filter(e => e.type === 'M-15').length, 1, '同じ番狂わせが2枚出ない');
  assert.strictEqual(other.filter(e => e.type === 'M-18').length, 1, '空いた枠は別の出来事に回る');
  assert.strictEqual(out.relModalWindow[0].other, 2, '記録も実際に出した件数');
}

// 6) 判定済み(scope 付き)の持ち越しは数え直さない(PPV 週など drain されない週)
{
  const first = gate({ ...world(30), _modalQueue: [ev('M-19', 1, 2, 30), ev('M-19', 313, 314, 30)] });
  const in31 = { ...first, week: 31 };
  assert.strictEqual(gate(in31), in31, '新しい項目が無ければ state をそのまま返す');
  const third = gate({ ...first, week: 32, _modalQueue: [...first._modalQueue, ev('M-18', 102, 103, 32)] });
  assert.deepStrictEqual(third._modalQueue.slice(0, 2), first._modalQueue, '持ち越し分はそのまま残る');
  const ownTotal = third.relModalWindow.reduce((a, x) => a + x.own, 0);
  const otherTotal = third.relModalWindow.reduce((a, x) => a + x.other, 0);
  assert.strictEqual(ownTotal, 1, '持ち越しの自団体分を二度数えない');
  assert.strictEqual(otherTotal, 2, '持ち越し1件 + 新しい1件(枠2件)');
}

// 7) 入力を書き換えない(プレビュー tick は本番 G と配列を共有したまま tickWeek を回す)/関係値に触れない
//    記録には今週の分も入れておく(同じ週に2回判定が走っても、入力側の記録を書き換えないこと)
{
  const s = world(40, { relModalWindow: [
    { w: Engine.util.absWeekTotal(2, 35, false, 0), own: 1, other: 0 },
    { w: Engine.util.absWeekTotal(2, 40, false, 0), own: 1, other: 0 }] });
  s._modalQueue = [ev('M-19', 1, 2, 40), ev('M-19', 313, 314, 40), ev('M-18', 102, 103, 40), ev('M-15', 201, 202, 40)];
  const before = JSON.stringify(s);
  const out = gate(s);
  assert.strictEqual(JSON.stringify(s), before, '入力 state(キュー・項目・記録)を書き換えない');
  assert.notStrictEqual(out._modalQueue, s._modalQueue, 'キューは新しい配列');
  assert.notStrictEqual(out.relModalWindow, s.relModalWindow, '記録は新しい配列');
  assert.strictEqual(out.relationships, s.relationships, '関係値には触れない(同じ参照のまま)');
  const changed = Object.keys(out).filter(k => out[k] !== s[k]).sort();
  assert.deepStrictEqual(changed, ['_modalQueue', 'relModalWindow'], '変わるのはキューと記録だけ');
}

// 8) 窓は12週でずれていく/旧セーブ(記録なし・壊れた記録・キューなし)は空として扱う
{
  const w1 = gate({ ...world(1), _modalQueue: [ev('M-19', 1, 2, 1)] });
  const w12 = gate({ ...w1, week: 12, _modalQueue: [ev('M-19', 313, 314, 12), ev('M-19', 301, 302, 12), ev('M-19', 303, 304, 12)] });
  assert.strictEqual(otherOf(w12._modalQueue).length, 2, 'W12: W1 の自団体1件はまだ窓の中 → 2件');
  const w13 = gate({ ...w12, week: 13, _modalQueue: [ev('M-19', 305, 306, 13)] });
  assert.strictEqual(otherOf(w13._modalQueue).length, 0, 'W13: 自団体分が窓から外れ、直近の他団体2件 > 1 → 出さない');
  assert.ok(w13.relModalWindow.every(x => x.w > Engine.util.absWeekTotal(2, 13, false, 0) - 12), '記録は窓の分だけ');

  const legacy = world(3);
  delete legacy.relModalWindow;
  legacy._modalQueue = [ev('M-19', 313, 314, 3)];
  const outLegacy = gate(legacy);
  assert.strictEqual(otherOf(outLegacy._modalQueue).length, 1, '記録の無い旧セーブ: 空として扱い12週に1件は出る');
  const broken = gate({ ...world(3), relModalWindow: 'x', _modalQueue: [ev('M-19', 313, 314, 3)] });
  assert.strictEqual(otherOf(broken._modalQueue).length, 1, '壊れた記録も空として扱う');
  const noQueue = world(3);
  delete noQueue._modalQueue;
  assert.strictEqual(gate(noQueue), noQueue, 'キューが無ければ何もしない');
}

// ── 結合: 実エンジンの tickWeek を「抑制あり/なし」で同じ入力から並走させる ─────────────
// 実ゲームと同じ関係値の初期化(app.js completeDraft: 経歴 → initialize → 過去対戦成績)
{
  let G = Engine.createInitialState(42, true);
  G = Engine.career.generateAllBackstories(G);
  G = Engine.relationships.initialize(G);
  G = Engine.career.generateInheritedRecords(G);
  const realGate = F.gateModalQueue;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const log = [];
  let ownTotal = 0, otherRaw = 0, otherShown = 0;
  for (let i = 0; i < 16; i++) {
    const seedForWeek = 1000 + i;
    resetRandom(seedForWeek);
    const gated = Engine.tickWeek(clone(G)).state;
    F.gateModalQueue = (s) => s;
    let ungated;
    try {
      resetRandom(seedForWeek);
      ungated = Engine.tickWeek(clone(G)).state;
    } finally {
      F.gateModalQueue = realGate;
    }
    const where = `S${gated.season}W${gated.week}`;
    assert.deepStrictEqual(gated.relationships, ungated.relationships, `${where}: 関係値(bond/rivalry)は抑制の有無で同一`);
    assert.deepStrictEqual(gated.relationshipFlagCounters, ungated.relationshipFlagCounters, `${where}: クールダウンも同一`);
    assert.deepStrictEqual(gated.roster, ungated.roster, `${where}: 選手の状態も同一`);
    // 抑制なし側を実エンジンとは別の物差しで仕分ける(自団体 = ロスターの選手が絡む/選手を特定できない)
    const rosterIds = new Set(ungated.roster.map(c => c.id));
    const isOwn = (e) => { const ids = idsOf(e.payload); return ids.length === 0 || ids.some(id => rosterIds.has(id)); };
    const rawOwn = ungated._modalQueue.filter(isOwn);
    const rawOther = ungated._modalQueue.filter(e => !isOwn(e));
    assert.deepStrictEqual(ownOf(gated._modalQueue).map(strip), rawOwn, `${where}: 自団体の出来事は抑制なしと全く同じ`);
    const rawSigs = new Set(rawOther.map(e => JSON.stringify(e)));
    otherOf(gated._modalQueue).forEach(e => assert.ok(rawSigs.has(JSON.stringify(strip(e))), `${where}: 出す他団体分は元の候補から選ぶ`));
    assert.strictEqual(gated._modalQueue.length, ownOf(gated._modalQueue).length + otherOf(gated._modalQueue).length, `${where}: 全項目が判定済み`);
    const own = rawOwn.length, other = otherOf(gated._modalQueue).length;
    ownTotal += own; otherRaw += rawOther.length; otherShown += other;
    const now = Engine.util.absWeekTotal(gated.season, gated.week, gated.offSeason, gated.offWeek);
    log.push({ w: now, own, other });
    if (other > 0) {
      const win = log.filter(x => x.w > now - 12);
      const cap = Math.max(2 * win.reduce((a, x) => a + x.own, 0), 1);
      assert.ok(win.reduce((a, x) => a + x.other, 0) <= cap, `${where}: 直近12週の他団体が上限(${cap})を超えない`);
    }
    // UI の drain → 週送り
    G = Engine.advanceWeek({ ...gated, _modalQueue: [] }).state;
  }
  assert.ok(otherRaw > otherShown, `前提: 他団体の候補が枠より多い(候補 ${otherRaw} / 出した ${otherShown})`);
  assert.ok(otherShown <= Math.max(2 * ownTotal, 1) * 2, '16週(窓2つ分弱)で出した他団体分は自団体の件数に見合う範囲');
}

console.log('relationship-modal-gate-test: ok');
