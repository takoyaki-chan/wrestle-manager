'use strict';
// 総点検 K-16 の AI団体側(2026-09-26)。K-9「AI団体とプレイヤーの人気の扱いを対称に」に揃える。
//   ① AI同士の対抗戦(Engine.rival.processAIWar): 自団体の対抗戦と同じ表(勝ち+5/引き分け+2/負け−3)に
//      節目の係数 (1+逓減)/2 を掛ける。係数はそれぞれの団体自身の人気で計算。旧来は固定の+2/−0.5/+0.5。
//   ② プレイヤーとの対抗戦(Engine.event.applyWarOutcome): 相手のAI団体の人気も、AIの立場から同じ表で動かす。
//   ③ 秋の4団体戦(Engine.autumnWar.apply): 出場したAI団体にも優勝+4/準優勝+1/準決勝敗退−2 と節目の係数。
//   人気20未満は係数1.0(素の値そのまま)。ログ・記事に人気の数値を新しく出さない。

const assert = require('assert');
const { loadGame } = require('./helpers/load-game.js');

global.window = { IS_TRIAL: false };
loadGame({ full: true });
if (!WM_I18N.pn) Object.assign(WM_I18N, { pn: x => x, pnSurname: x => x, mv: x => x, mvShort: x => x });

const near = (got, want, label) => {
  assert.ok(Math.abs(got - want) <= 1e-9, `${label}: got ${got}, want ${want}`);
};
// 節目の係数の表(spec rival-org §9.2)。エンジンの関数を使わずに独立に持つ
const mult = pop => pop < 20 ? 1 : pop < 40 ? 0.85 : pop < 55 ? 0.675 : pop < 85 ? 0.61 : pop < 95 ? 0.575 : 0.53;
const expectPop = (pop, raw) => Math.max(0, Math.min(100, pop + raw * mult(pop)));

function withStub(obj, key, value, fn) {
  const orig = obj[key];
  obj[key] = value;
  try { return fn(); } finally { obj[key] = orig; }
}

// ── 共通の表 ──
{
  assert.strictEqual(Engine.event.warRawPopDelta(3, 2), EVENT_CONFIG.warPopReward, '勝ち越しは warPopReward');
  assert.strictEqual(EVENT_CONFIG.warPopReward, 5);
  assert.strictEqual(Engine.event.warRawPopDelta(2, 2), 2, '引き分けは+2');
  assert.strictEqual(Engine.event.warRawPopDelta(2, 3), EVENT_CONFIG.warPopPenalty, '負け越しは warPopPenalty');
  assert.strictEqual(EVENT_CONFIG.warPopPenalty, -3);
  const aw = Engine.autumnWar;
  assert.strictEqual(aw.rawPopDelta('org_a', 'org_a', 'org_b', true), 4, '秋: 優勝+4');
  assert.strictEqual(aw.rawPopDelta('org_b', 'org_a', 'org_b', true), 1, '秋: 準優勝+1');
  assert.strictEqual(aw.rawPopDelta('org_s', 'org_a', 'org_b', true), -2, '秋: 出場して準決勝敗退−2');
  assert.strictEqual(aw.rawPopDelta('org_s', 'org_a', 'org_b', false), 0, '秋: 不出場は0');

  const next = Engine.orgPop.nextMilestonePop;
  near(next(75, 5), 78.05, '人気75の勝ち+5→+3.05');
  near(next(19.9, 4), 23.9, '人気20未満は係数1.0');
  near(next(10, -3), 7, '人気20未満の負けも素の値');
  assert.strictEqual(next(0, -3), 0, '人気0は0のまま(0を値なし扱いしない)');
  near(next(0, 5), 5, '人気0からの勝ちは+5');
  near(next(undefined, 5), 50 + 5 * 0.675, '欠損だけ50で補う');
  assert.strictEqual(next(99, 5), 100, '上限100');
}

// ── ② プレイヤーとの対抗戦: 相手のAI団体も動く ──
{
  const base = {
    orgPop: 75, battlePoints: { player: 0, org_s: 0, org_a: 0, org_b: 0 }, orgWarRecord: {}, season: 3, week: 22, ppvUnlocked: true,
    aiOrgs: { org_s: { orgPop: 82 }, org_a: { orgPop: 60 }, org_b: { orgPop: 15 } },
  };
  const win = Engine.event.applyWarOutcome(base, 3, 2, 'org_a');
  near(win.state.orgPop, 78.05, '自団体の勝ち越し(人気75)は従来どおり+3.05');
  near(win.state.aiOrgs.org_a.orgPop, 60 - 3 * 0.61, 'プレイヤーが勝ち越すと相手(人気60)は−3×0.61');
  assert.strictEqual(win.state.aiOrgs.org_s.orgPop, 82, '相手以外のAI団体は動かない');
  assert.strictEqual(win.state.aiOrgs.org_b.orgPop, 15, '相手以外のAI団体は動かない');
  assert.strictEqual(base.aiOrgs.org_a.orgPop, 60, '入力の state を書き換えない');
  assert.ok(win.events[0].includes('団体人気+3.1'), `ログは自団体の変化量だけ: ${win.events[0]}`);
  assert.ok(!win.events.some(e => e.includes('1.8') || e.includes('58.')), `AI団体の人気の数値をログに出さない: ${win.events.join(' / ')}`);

  const loss = Engine.event.applyWarOutcome(base, 2, 3, 'org_a');
  near(loss.state.orgPop, 73.17, '自団体の負け越し(人気75)は従来どおり−1.83');
  near(loss.state.aiOrgs.org_a.orgPop, 60 + 5 * 0.61, 'プレイヤーが負け越すと相手(人気60)は+5×0.61');

  const draw = Engine.event.applyWarOutcome(base, 2, 2, 'org_a');
  near(draw.state.aiOrgs.org_a.orgPop, 60 + 2 * 0.61, '引き分けは相手も+2×0.61');

  const lowWin = Engine.event.applyWarOutcome(base, 3, 2, 'org_b');
  assert.strictEqual(lowWin.state.aiOrgs.org_b.orgPop, 12, '相手の人気が20未満なら係数1.0(15−3)');
  const lowLoss = Engine.event.applyWarOutcome(base, 2, 3, 'org_b');
  assert.strictEqual(lowLoss.state.aiOrgs.org_b.orgPop, 20, '相手の人気が20未満なら係数1.0(15+5)');

  const zero = Engine.event.applyWarOutcome({ ...base, aiOrgs: { ...base.aiOrgs, org_b: { orgPop: 0 } } }, 3, 2, 'org_b');
  assert.strictEqual(zero.state.aiOrgs.org_b.orgPop, 0, '人気0の相手は0のまま(50へ戻らない)');

  const noAi = Engine.event.applyWarOutcome({ ...base, aiOrgs: undefined }, 3, 2, 'org_a');
  assert.strictEqual(noAi.state.aiOrgs, undefined, 'aiOrgs の無い state でも落ちない');
  const unknown = Engine.event.applyWarOutcome(base, 3, 2, 'org_x');
  assert.strictEqual(unknown.state.aiOrgs, base.aiOrgs, '相手が見つからなければ aiOrgs はそのまま');
}

// ── ① AI同士の対抗戦 ──
{
  const initial = Engine.createInitialState(4242, true);
  const mk = pops => ({
    ...initial, season: 3, week: 8, offSeason: false,
    aiOrgs: Object.fromEntries(Object.entries(initial.aiOrgs).map(([id, o]) => [id, { ...o, orgPop: pops[id], lastWarWeek: 0 }])),
  });
  // 対抗戦が起きる rng の seed を探す(発生率3.5%の抽選が先に来る)
  const warOrgs = (before, after) => Object.keys(after.aiOrgs).filter(id => after.aiOrgs[id].lastWarWeek !== before.aiOrgs[id].lastWarWeek);
  const findSeed = st => {
    for (let seed = 1; seed < 20000; seed++) {
      const out = Engine.rival.processAIWar(Engine.rng.create(seed), st);
      if (warOrgs(st, out).length === 2) return seed;
    }
    return null;
  };
  const scenarios = [
    { org_s: 75, org_a: 15, org_b: 12 },   // 仕掛けるのはSだけ(人気20以下は仕掛けない)。相手は20未満で係数1.0
    { org_s: 75, org_a: 30, org_b: 45 },   // 係数0.61 / 0.85 / 0.675 の組み合わせ
  ];
  const seenRoles = new Set();
  scenarios.forEach((pops, si) => {
    const st = mk(pops);
    const seed = findSeed(st);
    assert.ok(seed != null, `シナリオ${si}: 対抗戦が起きる seed が見つかる`);
    ['left', 'right', 'draw'].forEach(forced => {
      const origSim = Engine.battle.simulateMatch;
      const out = withStub(Engine.battle, 'simulateMatch',
        (...args) => ({ ...origSim.apply(Engine.battle, args), winner: forced }),
        () => Engine.rival.processAIWar(Engine.rng.create(seed), st));
      const involved = warOrgs(st, out);
      assert.strictEqual(involved.length, 2, `シナリオ${si}/${forced}: 2団体が対抗戦をした`);
      const news = involved.flatMap(id => out.aiOrgs[id]._newsAIWarResult || []).slice(-1)[0];
      assert.ok(news, 'ニュースフラグが立つ');
      involved.forEach(id => {
        let raw, role;
        if (forced === 'draw') { raw = 2; role = 'draw'; }
        else if (id === news.winnerOrgId) { raw = 5; role = 'win'; }
        else { assert.strictEqual(id, news.loserOrgId); raw = -3; role = 'loss'; }
        seenRoles.add(role);
        near(out.aiOrgs[id].orgPop, expectPop(pops[id], raw), `シナリオ${si}/${forced}: ${id}(人気${pops[id]})の${role}`);
      });
      Object.keys(pops).filter(id => !involved.includes(id)).forEach(id => {
        assert.strictEqual(out.aiOrgs[id].orgPop, pops[id], `シナリオ${si}/${forced}: 対抗戦に出ていない ${id} は動かない`);
      });
      if (si === 0) {
        const opp = involved.find(id => id !== 'org_s');
        assert.ok(pops[opp] < 20, '相手は人気20未満');
        const d = out.aiOrgs[opp].orgPop - pops[opp];
        assert.strictEqual(d, forced === 'draw' ? 2 : (news.winnerOrgId === opp ? 5 : -3), '人気20未満は素の値そのまま(係数1.0)');
      }
    });
  });
  assert.deepStrictEqual([...seenRoles].sort(), ['draw', 'loss', 'win'], '勝ち・負け・引き分けをすべて通った');
}

// ── ③ 秋の4団体戦 ──
{
  let state = Engine.createInitialState(4242, true);
  state = { ...state, season: 1, week: Engine.autumnWar.EVENT_WEEK };
  // 自団体を弱くして準決勝で負けさせ、AI側で優勝・準優勝・準決勝敗退の3役がそろうようにする
  state = {
    ...state,
    roster: state.roster.map(f => ({ ...f, pw: 5, sp: 5, te: 5, st: 5, mn: 5, condition: 100 })),
  };
  state = { ...state, rankings: Engine.ranking.updateRankings(state) };
  state = { ...state, autumnWar: Engine.autumnWar.announce(state), autumnWarPhase: 'entry' };
  const members = Engine.autumnWar._selectMembers(state, 'player');
  state = Engine.autumnWar.confirmPlayerTeam(state, members, Engine.autumnWar._defaultOrder(state, 'player', members));
  state = Engine.autumnWar.startSession(state);
  let guard = 0;
  while (state.autumnWar.session.phase !== 'complete' && guard++ < 30) {
    if (state.autumnWar.session.phase === 'finalOrder') {
      state = Engine.autumnWar.reorderForFinal(state, Engine.autumnWar.suggestFinalOrder(state, 'player'));
    } else {
      state = Engine.autumnWar.simulateNextBout(state).state;
    }
  }
  assert.strictEqual(state.autumnWar.session.phase, 'complete', '大会が完走する');
  const result = Engine.autumnWar.getProgress(state);
  const pops = { org_s: 75, org_a: 45, org_b: 15 };
  state = {
    ...state, orgPop: 30,
    aiOrgs: Object.fromEntries(Object.entries(state.aiOrgs).map(([id, o]) => [id, { ...o, orgPop: pops[id] }])),
  };
  const applied = Engine.autumnWar.apply(state, result);
  const roles = new Set();
  result.teams.forEach(team => {
    const raw = Engine.autumnWar.rawPopDelta(team.orgId, result.champion, result.runnerUp, team.available);
    if (team.orgId === 'player') {
      near(applied.state.orgPop, expectPop(30, raw), `自団体は従来どおり(素の値${raw})`);
      return;
    }
    roles.add(raw);
    near(applied.state.aiOrgs[team.orgId].orgPop, expectPop(pops[team.orgId], raw),
      `${team.orgId}(人気${pops[team.orgId]})は素の値${raw}×節目の係数`);
  });
  assert.ok(!applied.events.some(e => /人気/.test(e)), `秋の大会のログに人気の数値を出さない: ${applied.events.join(' / ')}`);
  if (result.champion !== 'player' && result.runnerUp !== 'player') {
    assert.deepStrictEqual([...roles].sort((a, b) => a - b), [-2, 1, 4], 'AI側で優勝・準優勝・準決勝敗退の3役を通った');
  }
  // 人気20未満(B=15)は係数1.0
  const rawB = Engine.autumnWar.rawPopDelta('org_b', result.champion, result.runnerUp, true);
  assert.strictEqual(applied.state.aiOrgs.org_b.orgPop, 15 + rawB, '人気20未満のAI団体は素の値そのまま');
  // 二重に掛からない(精算済みの印は従来どおり)
  assert.strictEqual(applied.state.autumnWar.applied, true);
  // 中止の大会ではAI団体も動かない
  const cancelled = Engine.autumnWar.apply(state, { cancelled: true });
  assert.strictEqual(cancelled.state.aiOrgs, state.aiOrgs, '中止なら動かない');
}

console.log('ai-orgpop-milestone-k16-test: ok');
