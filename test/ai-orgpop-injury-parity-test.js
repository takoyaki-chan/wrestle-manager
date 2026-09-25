'use strict';
// K-9(A) / K-13(A) 2026-09-25 Keisuke裁定の回帰テスト。
//   K-9 ① AI団体の人気0を「値なし」と扱わない(旧 `orgPop || 50` で0→約50へワープしていた)
//       ①追補 低人気の下支え(人気15未満/30未満)もAI団体の興行に自団体と同じ関数で掛ける
//       ② AI団体の人気にも自団体と同じ年次減衰を、同じタイミング(オフ第1週)で掛ける
//       ③ 大会などの実績ptは獲得した季だけ満額(graceAge 0)。翌季50%・2季後25%…
//   K-13 AI団体の試合の怪我を自団体と同じ Engine.injury.check で判定する
//       (試合前の体調・残りHP・ターン数を見る。重さ・離脱週数・成長ペナルティも同じ表)。
//       成長ペナルティは自団体と同じく練習にも掛かる。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

function withStubs(stubs, fn) {
  const originals = [];
  Object.entries(stubs).forEach(([pathKey, value]) => {
    const parts = pathKey.split('.');
    let target = global;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
    const key = parts[parts.length - 1];
    originals.push({ target, key, value: target[key] });
    target[key] = value;
  });
  try { return fn(); } finally { originals.reverse().forEach(({ target, key, value }) => { target[key] = value; }); }
}
const ORG_S = RIVAL_ORGS.find(o => o.id === 'org_s');
function firstShow(state, orgId, fromWeek) {
  const org = RIVAL_ORGS.find(o => o.id === orgId);
  for (let w = fromWeek; w <= 47; w++) {
    if (!Engine.util.isRegularShowWeek(w)) continue;
    const s2 = { ...state, week: w };
    const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, w));
    return { week: w, before: s2.aiOrgs[orgId], out: Engine.rival.processAIWeek(rng, s2, org) };
  }
  return null;
}

// ── K-9 ①: 人気0の団体が興行1回で約50へ戻らない ─────────────────────────────
{
  const src = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf-8');
  assert.ok(!/\.orgPop\s*\|\|\s*50/.test(src), 'management.js に `x.orgPop || 50`(0を値なし扱いする書き方)を残さない');

  const base = { ...Engine.createInitialState(4242, true), season: 3, offSeason: false, weekPhase: 'manage', industryNewsQueue: [] };
  const state = { ...base, aiOrgs: { ...base.aiOrgs, org_b: { ...base.aiOrgs.org_b, orgPop: 0 } } };
  const show = firstShow(state, 'org_b', 2);
  assert.ok(show && (show.out._lastMatchResults || []).length > 0, 'B団体の興行が立つ');
  // 人気0からの1興行は、低人気の下支えを含めても 0〜+3(★5) に収まる(旧実装は約49〜52へ跳ねた)
  assert.ok(show.out.orgPop >= 0 && show.out.orgPop <= 3, `人気0から1興行で ${show.out.orgPop}(0〜3であるべき)`);
}

// ── K-9 ①追補: 低人気の下支えもAI団体の興行に自団体と同じ関数(applyShowPopularity)で掛かる ──
// 試合の評価を固定(平均MQ40=★2、★2の素の増減は−0.5)して、人気帯ごとの1興行の結果を見る。
//   人気0 : 15未満は下落なし+★2で+0.5 → 0.5  (下支えなし=旧AIなら 0 のまま)
//   人気20: 30未満は下落半減(−0.25)+★2で+0.3 → +0.05、逓減×0.70 → 20.035 (旧AIなら 19.5)
//   人気50: 下支えの対象外。★2の−0.5がそのまま → 49.5 (旧AIと同じ。下支え以外は変えない)
{
  const base = { ...Engine.createInitialState(4343, true), season: 3, offSeason: false, weekPhase: 'manage', industryNewsQueue: [] };
  const cases = [[0, 0.5], [20, 20.035], [50, 49.5]];
  cases.forEach(([pop, expected]) => {
    const state = { ...base, aiOrgs: { ...base.aiOrgs, org_b: { ...base.aiOrgs.org_b, orgPop: pop } } };
    const calls = [];
    const origShowPop = Engine.applyShowPopularity;
    const show = withStubs({
      'Engine.mq.finalize': () => ({ mq: 40, mqInventory: null }),
      'Engine.applyShowPopularity': function (roster, results, orgPop, rng, stars) {
        calls.push({ orgPop, stars, hasRng: !!rng });
        return origShowPop.apply(this, arguments);
      },
    }, () => firstShow(state, 'org_b', 2));
    assert.ok(show && (show.out._lastMatchResults || []).length > 0, 'B団体の興行が立つ');
    assert.strictEqual(calls.length, 1, 'AI興行の人気変化は applyShowPopularity を1回通る(自団体と同じ関数)');
    assert.deepStrictEqual(calls[0], { orgPop: pop, stars: 2, hasRng: true }, '★は平均MQから、逓減を有効にして渡す');
    assert.ok(Math.abs(show.out.orgPop - expected) < 1e-9, `人気${pop}・★2の1興行 → ${show.out.orgPop}(${expected}であるべき)`);
  });
}

// ── K-9 ②: オフ第1週に自団体と同じ年次減衰がAI団体にも掛かる ────────────────────
{
  const base = Engine.createInitialState(5151, true);
  const pops = { org_s: 100, org_a: 70, org_b: 10 };
  const aiOrgs = {};
  Object.keys(base.aiOrgs).forEach(id => { aiOrgs[id] = { ...base.aiOrgs[id], orgPop: pops[id] }; });
  const state = { ...base, season: 2, week: 48, offSeason: true, offWeek: 0, orgPop: 60, aiOrgs };
  const out = Engine.advanceWeek(state).state;
  assert.strictEqual(out.offWeek, 1, 'オフ第1週を処理した');
  assert.strictEqual(out.orgPop, 60 - Engine.orgPop.calcAnnualDecay(60), '自団体の年次減衰(従来どおり)');
  Object.keys(pops).forEach(id => {
    const expected = Math.max(0, pops[id] - Engine.orgPop.calcAnnualDecay(pops[id]));
    assert.strictEqual(out.aiOrgs[id].orgPop, expected, `${id}: ${pops[id]} → ${expected}(自団体と同じ calcAnnualDecay)`);
  });
  assert.strictEqual(out.aiOrgs.org_s.orgPop, 90, '人気100は−10(100張り付きが解ける)');
  assert.strictEqual(out.aiOrgs.org_b.orgPop, 10, '人気15未満は減衰なし(自団体と同じ創設期保護)');
}

// ── K-9 ③: 実績ptの満額は獲得した季だけ ──────────────────────────────────────
{
  assert.strictEqual(ACHIEVEMENT_CONFIG.graceAge, 0);
  const pt = age => Engine.achievement.currentPt({ originalPt: 10, age });
  assert.strictEqual(pt(0), 10, '獲得した季は満額');
  assert.strictEqual(pt(1), 5, '翌季は50%');
  assert.strictEqual(pt(2), 2.5, '2季後は25%');
  const s = { achievementItems: { player: [], org_s: [
    { id: 'a', originalPt: 10, age: 0 }, { id: 'b', originalPt: 4, age: 1 }, { id: 'c', originalPt: 5, age: 2 },
  ], org_a: [], org_b: [] } };
  Engine.achievement.tickAge(s);
  assert.deepStrictEqual(s.achievementItems.org_s.map(it => [it.id, it.age]), [['a', 1], ['b', 2]],
    '季をまたぐと加齢し、1pt未満(5pt×1/8)は除去');
  assert.strictEqual(Engine.achievement.totalPt(s, 'org_s'), 6, '10×0.5 + 4×0.25 = 6');
}

// ── K-13: AI団体の試合の怪我は Engine.injury.check を試合前の体調・残りHP・ターン数で通る ──
{
  const base = { ...Engine.createInitialState(7070, true), season: 2, offSeason: false, weekPhase: 'manage', industryNewsQueue: [] };
  const calls = [];
  const origCheck = Engine.injury.check;
  let state = base;
  let injured = [];
  let showsChecked = 0;
  let week = 2;
  withStubs({
    'Engine.injury.check': function (rng, fighter, matchResult, ...rest) {
      // 呼び出し時点の体調を控える(呼び出し元はこの後で同じ選手オブジェクトから試合の消耗を引く)
      const condAtCheck = fighter.condition;
      const res = origCheck.call(this, rng, fighter, matchResult, ...rest);
      calls.push({ fighter, condAtCheck, matchResult, res });
      return res;
    },
  }, () => {
    while (week <= 47 && injured.length === 0) {
      const callStart = calls.length;
      const show = firstShow(state, 'org_s', week);
      if (!show) break;
      week = show.week + 1;
      const results = show.out._lastMatchResults || [];
      const myCalls = calls.slice(callStart);
      assert.strictEqual(myCalls.length, results.length * 2, '興行の全出場選手(シングル×2)を1回ずつ判定する');
      myCalls.forEach(({ fighter, condAtCheck, matchResult }) => {
        assert.ok(Number.isFinite(matchResult.turns) && matchResult.turns > 0, 'ターン数を渡す');
        const hp = matchResult.left.id === fighter.id ? matchResult.hpLeft : matchResult.hpRight;
        assert.ok(hp && Number.isFinite(hp.final) && Number.isFinite(hp.max) && hp.max > 0, '残りHPを渡す');
        const pre = matchResult.left.id === fighter.id ? matchResult.left : matchResult.right;
        assert.strictEqual(condAtCheck, pre.condition, `体調は試合前の値で判定する(自団体と同じ順序) week${show.week} id${fighter.id}`);
      });
      showsChecked++;
      const beforeIds = new Map((show.before.roster || []).map(f => [f.id, f]));
      injured = myCalls.filter(c => c.res).map(c => ({ call: c, after: show.out.roster.find(f => f.id === c.fighter.id)
        || (show.out._midSeasonRetirees || []).find(f => f.id === c.fighter.id), before: beforeIds.get(c.fighter.id) }));
      state = { ...state, aiOrgs: { ...state.aiOrgs, org_s: { ...show.out } } };
    }
  });
  assert.ok(injured.length > 0, `S団体の興行${showsChecked}回のうちに試合の怪我が起きる(実効およそ8%/試合)`);
  injured.forEach(({ call, after, before }) => {
    assert.ok(after, '怪我をした選手を追跡できる');
    const inj = after.injury;
    const band = [...INJURY_TABLE, LONG_TERM_INJURY].filter(b => b.type === inj.type);
    assert.ok(band.length > 0, `重さは自団体と同じ表(${inj.type})`);
    const minW = Math.min(...band.map(b => b.minWeeks)) - 2; // 不屈/鉄人/理学療法の短縮分
    const maxW = Math.max(...band.map(b => b.maxWeeks));
    assert.ok(inj.totalWeeks >= Math.max(1, minW) && inj.totalWeeks <= maxW, `離脱${inj.totalWeeks}週は ${inj.type} の帯`);
    assert.ok(inj.weeksLeft <= inj.totalWeeks, 'weeksLeft は totalWeeks 以下');
    const debuff = INJURY_DEBUFF_TABLE[inj.type];
    assert.ok(after.growthPenalty && after.growthPenalty.multiplier <= debuff.multiplier,
      `成長ペナルティ(${inj.type} ×${debuff.multiplier})が付く`);
    assert.strictEqual(after.seasonInjuries, (before.seasonInjuries || 0) + 1, '今季の怪我数(季末wear)に数える');
    assert.ok(after.condition <= 30, '負傷時は体調30以下(自団体と同じ)');
    assert.ok(call.res.injuryInfo && call.res.injuryInfo.injury.type === inj.type);
  });
}

// ── K-13: 怪我の成長ペナルティはAIの練習にも掛かる(自団体の練習と同じ) ────────────
{
  const mk = (id, extra) => ({
    id, name: 'F' + id, pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    trainCap: { pw: 90, sp: 90, te: 90, st: 90, mn: 90 }, pot: { pw: 90, sp: 90, te: 90, st: 90, mn: 90 },
    condition: 90, injury: null, wins: 0, losses: 0, draws: 0, popularity: 40, style: 'Allround', role: 'Face',
    age: 20, traits: [], trust: 50, seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 }, _growthFrac: 0,
    intensiveWeeks: 9, // 連続追い込み上限を超えた状態にして通常練習へ(追い込みの負傷判定を避ける)
    ...extra,
  });
  const run = (fighter) => withStubs({
    'Engine.rng.float': () => 0,               // 練習に入る
    'Engine.coach.pickGrowthStat': () => 'pw',
    'Engine.growth.calcGrowth': () => 2.0,     // 練習の素の伸びを固定
    'Engine.rival.processAIWeeklyEvent': () => null,
    'Engine.rival.processAICare': (rng, roster) => ({ roster }),
    'Engine.rival.buildAICoachAssignments': () => ({}),
  }, () => {
    const state = { rngSeed: 1, season: 3, week: 3, titles: {}, aiOrgs: { org_s: {
      roster: [fighter], titles: null, coaches: [], coachAssign: {}, orgPop: 70, lockerRoomMorale: 60, matchupLog: [], showCount: 0,
    } } };
    const out = Engine.rival.processAIWeek(Engine.rng.create(3), state, ORG_S);
    return out.roster.find(f => f.id === fighter.id);
  });
  const free = run(mk(1));
  const hurt = run(mk(2, { growthPenalty: { remainingWeeks: 10, multiplier: 0.15, source: 'severe' } }));
  const adapt = run(mk(3, { traits: ['適応力'], growthPenalty: { remainingWeeks: 10, multiplier: 0.15, source: 'severe' } }));
  assert.strictEqual(free.pw - 60, 2, 'ペナルティなしは素の伸び(2.0)');
  assert.strictEqual(hurt.pw - 60, 0, '重傷ペナルティ×0.15で練習の伸びは0.3(端数持ち越し)');
  assert.ok(Math.abs((hurt._growthFrac || 0) - 0.3) < 1e-9, `端数0.3を持ち越す(実際 ${hurt._growthFrac})`);
  assert.ok(Math.abs((adapt._growthFrac || 0) - 0.7) < 1e-9, `適応力は0.2軽減(×0.35→0.7。実際 ${adapt._growthFrac})`);
}

console.log('ai-orgpop-injury-parity-test: ok');
