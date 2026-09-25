'use strict';
// 総点検 K-9(A) の残り(2026-09-26)。挑戦状(B3)とメディア密着の団体人気を、AI団体とプレイヤーでそろえる。
//   ① AI同士の挑戦状(Engine.rival.processAIB3Challenge): 勝ち+3/引き分け双方+1 に、自団体と同じ興行の逓減
//      (Engine.orgPop.applyOrgPopChange)を、その団体自身の人気で掛ける。負け−1・辞退(受けた側)−1 はそのまま。
//   ② プレイヤーが受けた挑戦状の決着(applyLargeEventEffect B3 step2。画面の2経路=観戦/スキップと興行内の
//      どちらもここを通る): 挑戦してきたAI団体の人気も、AIの立場から同じ表で動かす。辞退は挑戦側が動かない
//      (AI同士の辞退と同じ)。
//   ③ AI団体のメディア密着の完了(Engine.rival.processAIWeek): +3/+1 に同じ逓減を、その団体自身の人気で掛ける。
//   人気の欠損だけ50で補い、0は0のまま。ログ・新聞に人気の数値を新しく出さない。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game.js');

global.window = { IS_TRIAL: false };
loadGame({ full: true });
if (!WM_I18N.pn) Object.assign(WM_I18N, { pn: x => x, pnSurname: x => x, mv: x => x, mvShort: x => x });

const near = (got, want, label) => {
  assert.ok(Math.abs(got - want) <= 1e-9, `${label}: got ${got}, want ${want}`);
};
// 興行の逓減の表(Engine.orgPop.getDiminishingMultiplier)。エンジンの関数を使わずに独立に持つ
const dim = pop => pop < 20 ? 1 : pop < 40 ? 0.70 : pop < 55 ? 0.35 : pop < 85 ? 0.22 : pop < 95 ? 0.15 : 0.06;
const expectPop = (pop, raw) => Math.max(0, Math.min(100, pop + (raw > 0 ? raw * dim(pop) : raw)));

function withStub(obj, key, value, fn) {
  const orig = obj[key];
  obj[key] = value;
  try { return fn(); } finally { obj[key] = orig; }
}

const failures = [];
function block(name, fn) {
  try { fn(); } catch (e) { failures.push(name); console.error(`NG [${name}] ${e.message}`); }
}

// ── 共通の表と関数 ──
block('共通の表と関数', () => {
  assert.deepStrictEqual(Engine.orgPop.B3_RAW_DELTA, { win: 3, draw: 1, loss: -1, decline: -1 }, '挑戦状の素の値');
  assert.deepStrictEqual(Engine.orgPop.MEDIA_RAW_DELTA, { great: 3, fair: 1 }, 'メディア密着の素の値');
  const next = Engine.orgPop.nextPop;
  near(next(75, 3), 75.66, '人気75の+3→+0.66');
  near(next(75, 1), 75.22, '人気75の+1→+0.22');
  near(next(45, 3), 46.05, '人気45の+3→+1.05');
  near(next(19.9, 3), 22.9, '人気20未満は素の値');
  near(next(60, -1), 59, '下げ幅は逓減しない');
  assert.strictEqual(next(0, -1), 0, '人気0は0のまま(0を値なし扱いしない)');
  near(next(0, 3), 3, '人気0からの+3');
  near(next(undefined, 3), 50 + 3 * 0.35, '欠損だけ50で補う');
  assert.strictEqual(next(99.99, 3), Math.min(100, 99.99 + 3 * 0.06), '上限100');
  const ai = { org_a: { orgPop: 45, x: 1 }, org_b: { orgPop: 30 } };
  const moved = Engine.orgPop.applyToAiOrg(ai, 'org_a', 3);
  near(moved.org_a.orgPop, 46.05, 'applyToAiOrg はその団体自身の人気で逓減');
  assert.strictEqual(moved.org_a.x, 1, 'ほかの項目は保つ');
  assert.strictEqual(moved.org_b, ai.org_b, 'ほかの団体はそのまま');
  assert.strictEqual(ai.org_a.orgPop, 45, '入力を書き換えない');
  assert.strictEqual(Engine.orgPop.applyToAiOrg(ai, 'org_x', 3), ai, '団体が無ければそのまま');
  assert.strictEqual(Engine.orgPop.applyToAiOrg(undefined, 'org_a', 3), undefined, 'aiOrgs が無くても落ちない');
});

// ── ① AI同士の挑戦状 ──
block('① AI同士の挑戦状', () => {
  const initial = Engine.createInitialState(4242, true);
  const mk = pops => ({
    ...initial, season: 3, week: 8, offSeason: false,
    aiOrgs: Object.fromEntries(Object.entries(initial.aiOrgs).map(([id, o]) => [id, { ...o, orgPop: pops[id], lastB3Week: 0 }])),
  });
  const b3Orgs = (before, after) => Object.keys(after.aiOrgs).filter(id => after.aiOrgs[id].lastB3Week !== before.aiOrgs[id].lastB3Week);
  const lastNews = out => Object.keys(out.aiOrgs).flatMap(id => out.aiOrgs[id]._newsAIB3Result || []).slice(-1)[0];
  // 挑戦状が起きる rng の seed を探す(発生率5%の抽選が先に来る)。受諾/辞退のどちらになったかも返す
  const findSeed = (st, wantDeclined) => {
    for (let seed = 1; seed < 40000; seed++) {
      const out = Engine.rival.processAIB3Challenge(Engine.rng.create(seed), st);
      if (b3Orgs(st, out).length !== 2) continue;
      if (!!lastNews(out).declined === wantDeclined) return seed;
    }
    return null;
  };
  const scenarios = [
    { org_s: 75, org_a: 45, org_b: 30 },   // 逓減 0.22 / 0.35 / 0.70
    { org_s: 88, org_a: 60, org_b: 0 },    // 0.15 / 0.22 / 人気0(係数1.0・0は0のまま)
  ];
  const seenRoles = new Set();
  scenarios.forEach((pops, si) => {
    const st = mk(pops);
    const seed = findSeed(st, false);
    assert.ok(seed != null, `シナリオ${si}: 受諾される挑戦状の seed が見つかる`);
    ['left', 'right', 'draw'].forEach(forced => {
      const origSim = Engine.battle.simulateMatch;
      const out = withStub(Engine.battle, 'simulateMatch',
        (...args) => ({ ...origSim.apply(Engine.battle, args), winner: forced }),
        () => Engine.rival.processAIB3Challenge(Engine.rng.create(seed), st));
      const involved = b3Orgs(st, out);
      assert.strictEqual(involved.length, 2, `シナリオ${si}/${forced}: 2団体が挑戦状で戦った`);
      const news = lastNews(out);
      assert.ok(news && !news.declined, 'ニュースフラグが立つ');
      involved.forEach(id => {
        let raw, role;
        if (forced === 'draw') { raw = 1; role = 'draw'; }
        else if (id === news.winnerOrgId) { raw = 3; role = 'win'; }
        else { assert.strictEqual(id, news.loserOrgId); raw = -1; role = 'loss'; }
        seenRoles.add(role);
        near(out.aiOrgs[id].orgPop, expectPop(pops[id], raw), `シナリオ${si}/${forced}: ${id}(人気${pops[id]})の${role}`);
      });
      Object.keys(pops).filter(id => !involved.includes(id)).forEach(id => {
        assert.strictEqual(out.aiOrgs[id].orgPop, pops[id], `シナリオ${si}/${forced}: 挑戦状に出ていない ${id} は動かない`);
      });
      assert.ok(!JSON.stringify(news).includes('orgPop'), 'ニュースフラグに人気の数値を載せない');
    });
  });
  assert.deepStrictEqual([...seenRoles].sort(), ['draw', 'loss', 'win'], '勝ち・負け・引き分けをすべて通った');

  // 辞退: 受けた側だけ−1(下げ幅は逓減しない)、挑戦側は動かない
  const pops = { org_s: 75, org_a: 45, org_b: 30 };
  const st = mk(pops);
  const seed = findSeed(st, true);
  assert.ok(seed != null, '辞退される挑戦状の seed が見つかる');
  const out = Engine.rival.processAIB3Challenge(Engine.rng.create(seed), st);
  const news = lastNews(out);
  const defId = Object.keys(pops).find(id => RIVAL_ORGS.find(o => o.id === id).name === news.defenderOrg);
  const chId = Object.keys(pops).find(id => RIVAL_ORGS.find(o => o.id === id).name === news.challengerOrg);
  near(out.aiOrgs[defId].orgPop, pops[defId] - 1, '辞退した側は−1');
  assert.strictEqual(out.aiOrgs[chId].orgPop, pops[chId], '断られた挑戦側は動かない');
});

// ── ② プレイヤーが受けた挑戦状: 挑戦してきたAI団体も動く ──
block('② プレイヤーが受けた挑戦状', () => {
  const initial = Engine.createInitialState(4242, true);
  const aiRoster = initial.aiOrgs.org_a.roster;
  const challenger = aiRoster[0];
  const me = initial.roster[0];
  const base = {
    ...initial, season: 3, week: 10, orgPop: 75, relationships: null,
    battlePoints: { player: 0, org_s: 0, org_a: 0, org_b: 0 },
    aiOrgs: {
      org_s: { ...initial.aiOrgs.org_s, orgPop: 82 },
      org_a: { ...initial.aiOrgs.org_a, orgPop: 45 },
      org_b: { ...initial.aiOrgs.org_b, orgPop: 15 },
    },
  };
  const ev = (winner, extra = {}) => ({
    type: 'B3', orgId: 'org_a', orgName: RIVAL_ORGS.find(o => o.id === 'org_a').name,
    challenger: { id: challenger.id, name: challenger.name },
    matchResult: { winner, mq: 60 }, selectedFighterId: me.id, ...extra,
  });
  const run = (winner, state = base) => Engine.eventSystem.applyLargeEventEffect(ev(winner), 2, 0, state,
    Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week, 0xB1B6)));

  const win = run('left');
  near(win.orgPopDelta, 3 * 0.22, '自団体の勝ち(人気75)は従来どおり+0.66');
  near(win.aiOrgs.org_a.orgPop, 44, 'プレイヤーが勝つと挑戦してきた団体は−1');
  const loss = run('right');
  near(loss.orgPopDelta, -1, '自団体の負けは従来どおり−1');
  near(loss.aiOrgs.org_a.orgPop, 45 + 3 * 0.35, 'プレイヤーが負けると挑戦してきた団体(人気45)は+3×0.35');
  const draw = run('draw');
  near(draw.orgPopDelta, 1 * 0.22, '自団体の引き分けは従来どおり+0.22');
  near(draw.aiOrgs.org_a.orgPop, 45 + 1 * 0.35, '引き分けは挑戦してきた団体も+1×0.35');
  [win, loss, draw].forEach(r => {
    assert.strictEqual(r.aiOrgs.org_s.orgPop, 82, '相手以外のAI団体は動かない');
    assert.strictEqual(r.aiOrgs.org_b.orgPop, 15, '相手以外のAI団体は動かない');
    const ch = r.aiOrgs.org_a.roster.find(f => f.id === challenger.id);
    assert.ok((ch.careerRecord?.history || []).some(h => h.type === 'b3Challenge'), 'AI挑戦者の b3Challenge 履歴は従来どおり');
    assert.strictEqual(r.events.length, 1, 'ログは1行のまま');
    assert.ok(!/46\.|45\.|44/.test(r.events[0]), `AI団体の人気の数値をログに出さない: ${r.events[0]}`);
  });
  assert.strictEqual(base.aiOrgs.org_a.orgPop, 45, '入力の state を書き換えない');

  const low = { ...base, aiOrgs: { ...base.aiOrgs, org_a: { ...base.aiOrgs.org_a, orgPop: 0 } } };
  assert.strictEqual(run('left', low).aiOrgs.org_a.orgPop, 0, '人気0の挑戦団体は負けても0のまま(50へ戻らない)');
  near(run('right', low).aiOrgs.org_a.orgPop, 3, '人気0の挑戦団体の勝ちは+3(係数1.0)');
  const missing = { ...base, aiOrgs: { ...base.aiOrgs, org_a: { ...base.aiOrgs.org_a, orgPop: undefined } } };
  near(run('right', missing).aiOrgs.org_a.orgPop, 50 + 3 * 0.35, '欠損だけ50で補う');
  const noRoster = { ...base, aiOrgs: { ...base.aiOrgs, org_a: { orgPop: 45 } } };
  near(run('right', noRoster).aiOrgs.org_a.orgPop, 45 + 3 * 0.35, '名簿が無い団体でも人気は動く');
  const noAi = run('right', { ...base, aiOrgs: undefined });
  assert.strictEqual(noAi.aiOrgs, undefined, 'aiOrgs の無い state でも落ちない');

  // 辞退(step0 の2つ目の選択): 自団体−1、挑戦してきた団体は動かない(AI同士の辞退と同じ)
  const decline = Engine.eventSystem.applyLargeEventEffect(ev(null), 0, 1, base, Engine.rng.create(1));
  near(decline.orgPopDelta, -1, '辞退した自団体は−1');
  assert.strictEqual((decline.aiOrgs || base.aiOrgs).org_a.orgPop, 45, '断られた挑戦側のAI団体は動かない');

  // 画面の2経路が結果の aiOrgs をそのまま G に反映していること(観戦/スキップ=_applyLargeEventResult、
  // 興行内の挑戦状=_finalizeShowImpl の b3Updates)。ここが落ちるとAI団体の人気の変化が画面側で消える
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert.ok(/if \(result\.aiOrgs\) updates\.aiOrgs = result\.aiOrgs;/.test(app), '_applyLargeEventResult が aiOrgs を反映する');
  assert.ok(/if \(b3Result\.aiOrgs\) b3Updates\.aiOrgs = b3Result\.aiOrgs;/.test(app), '興行内の挑戦状が aiOrgs を反映する');
});

// ── ③ AI団体のメディア密着の完了 ──
block('③ AI団体のメディア密着', () => {
  const initial = Engine.createInitialState(4242, true);
  let week = 1;
  while (!Engine.util.isShowWeek(week) || week === PPV_SHOW_WEEK) week++;
  const org = RIVAL_ORGS.find(o => o.id === 'org_a');
  const target = initial.aiOrgs.org_a.roster[0];
  const mk = (orgPop, remainingShows, totalMQ, matchCount) => ({
    ...initial, season: 3, week, offSeason: false,
    aiOrgs: {
      ...initial.aiOrgs,
      org_a: {
        ...initial.aiOrgs.org_a, orgPop,
        mediaSpotlight: { fighterId: target.id, fighterName: target.name, outletName: 'テスト', remainingShows, totalMQ, matchCount },
      },
    },
  });
  const cases = [
    { pop: 45, totalMQ: 1000, matchCount: 10, raw: 3, label: '大成功(平均MQ60以上)' },
    { pop: 75, totalMQ: 1000, matchCount: 10, raw: 3, label: '大成功・人気75' },
    { pop: 45, totalMQ: 520, matchCount: 10, raw: 1, label: 'まずまず(平均MQ45〜59)' },
    { pop: 10, totalMQ: 1000, matchCount: 10, raw: 3, label: '大成功・人気20未満' },
  ];
  cases.forEach(c => {
    const rngSeed = Engine.rng.derive(initial.rngSeed, 3, week, 0xA1);
    // 同じ週・同じ乱数で「まだ続く密着」と比べると、差がちょうど密着の完了の分になる
    const notDone = Engine.rival.processAIWeek(Engine.rng.create(rngSeed), mk(c.pop, 2, c.totalMQ, c.matchCount), org);
    const done = Engine.rival.processAIWeek(Engine.rng.create(rngSeed), mk(c.pop, 1, c.totalMQ, c.matchCount), org);
    assert.ok(notDone.mediaSpotlight, `${c.label}: 残り2興行の密着は続く`);
    assert.strictEqual(done.mediaSpotlight, null, `${c.label}: 残り1興行の密着はこの興行で完了する`);
    assert.ok(done._newsMediaResult && done._newsMediaResult.success, `${c.label}: 成功のニュースフラグが立つ`);
    assert.ok(!('orgPop' in done._newsMediaResult), 'ニュースフラグに人気の数値を載せない');
    near(done.orgPop, expectPop(notDone.orgPop, c.raw), `${c.label}: 興行後の人気${notDone.orgPop.toFixed(2)}に+${c.raw}×逓減`);
  });

  // 自団体のメディア密着は従来どおり(同じ逓減)
  const me = initial.roster[0];
  const pState = { ...initial, season: 3, week, orgPop: 75, relationships: null,
    mediaSpotlight: { fighterId: me.id, fighterName: me.name, remainingShows: 1, totalMQ: 1000, matchCount: 10 } };
  const pr = Engine.eventSystem.processMediaSpotlight(pState, [], [], Engine.rng.create(1));
  near(pr.orgPopDelta, 3 * 0.22, '自団体の密着(人気75)は従来どおり+0.66');
});

if (failures.length) {
  console.error(`ai-orgpop-challenge-media-k9-test: FAIL (${failures.join(' / ')})`);
  process.exit(1);
}
console.log('ai-orgpop-challenge-media-k9-test: ok');
