'use strict';
// 因縁のリング内効果（mq-system-spec-v1.0 §4.1）が**シングルの全経路**に通っていることを守る。
//
// なぜこのテストが要るか:
//   match-engine.js は ringOpts.rivalryRing を読むだけで因縁を自前計算しない。
//   つまり buildRingInOpts を呼び忘れた経路は**静かに因縁ゼロになる**。
//   実際 MQ再設計P3b(2026-07-24) でリング内化したとき天頂戦とPPVのTV放送が呼び忘れられ、
//   6日間気づかれなかった（バグB）。呼び忘れは症状が出ないので、テストで縛る。
//
// 2026-07-30 Keisuke裁定「当然因縁を効かせます」により、raw プロファイル
// （ジュニア/秋勝ち残り/対抗戦/挑戦状/団体内紛）にも通すことになった。
// タッグ（春タッグリーグ）は仕様どおり対象外（§4 のスコープ）。
//
// 検査方法: Engine.battle.simulateMatch をスパイし、各大会エンジンを実際に走らせて
// 渡された opts に rivalryRing チャネルがあることを見る（ソース文字列は照合しない）。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js'].forEach(loadAsGlobal);

function mkFighter(id, orgId, age) {
  return {
    id, name: `F${id}`, orgId, portrait: null, style: 'Allround',
    archetype: 'normal', personality: 'normal',
    age: age != null ? age : 24, popularity: 50, drawPower: 30, trust: 60, condition: 80,
    pw: 70, sp: 70, te: 70, st: 70, mn: 70,
    wins: 0, losses: 0, draws: 0, careerSeasons: 3,
    careerRecord: Engine.career.createRecord(),
  };
}

// 相互の因縁（min(A→B, B→A) を見る非対称2軸。片方向だけだと isOneSided で対象外）
function rivalry(aId, bId, value) {
  return {
    [`${aId}>${bId}`]: { rivalry: value, bond: 20 },
    [`${bId}>${aId}`]: { rivalry: value, bond: 20 },
  };
}

const captured = [];
const real = Engine.battle.simulateMatch;
function spyOn() {
  captured.length = 0;
  Engine.battle.simulateMatch = function (left, right, rng, tier, opts) {
    captured.push({ leftId: left && left.id, rightId: right && right.id, opts: opts || null });
    return real.apply(this, arguments);
  };
}
function spyOff() { Engine.battle.simulateMatch = real; }

function assertAllHaveRivalryChannel(label, minCalls) {
  assert.ok(captured.length >= minCalls,
    `${label}: 試合が走っていない (calls=${captured.length}, 期待>=${minCalls})`);
  captured.forEach((c, i) => {
    assert.ok(c.opts, `${label}: 第${i + 1}試合に opts が渡っていない`);
    assert.ok('rivalryRing' in c.opts,
      `${label}: 第${i + 1}試合の opts に rivalryRing が無い（buildRingInOpts の呼び忘れ）`);
  });
}
function boutBetween(aId, bId) {
  return captured.find(c =>
    (c.leftId === aId && c.rightId === bId) || (c.leftId === bId && c.rightId === aId));
}

// ── ジュニアトーナメント（raw プロファイル） ──────────────────────
{
  // U-20 が4名。seed 順に 1v4 / 3v2 で組まれる（_seedBracket）
  const fs4 = [mkFighter(101, 'player', 19), mkFighter(102, 'player', 19),
               mkFighter(103, 'org_s', 20), mkFighter(104, 'org_s', 20)];
  const participants = fs4.map((f, i) => ({ ...f, _orgId: f.orgId, _orgName: f.orgId, _seed: i + 1 }));
  const state = {
    season: 4, week: 24, rngSeed: 11, orgName: 'P',
    roster: fs4.filter(f => f.orgId === 'player').map(f => ({ ...f })),
    aiOrgs: { org_s: { roster: fs4.filter(f => f.orgId === 'org_s').map(f => ({ ...f })) } },
    titles: { world: { championId: null, defenses: 0 } },
    relationships: rivalry(101, 104, 85), rivalries: {}, milestoneBuffs: [],
  };
  spyOn();
  Engine.juniorTournament.run(state, participants, Engine.rng.create(5));
  spyOff();
  assertAllHaveRivalryChannel('ジュニアトーナメント', 3);
  const bout = boutBetween(101, 104);
  assert.ok(bout, '因縁を張った2名の対戦が1回戦で組まれていること');
  assert.ok(bout.opts.rivalryRing, '因縁のある試合は rivalryRing が立つこと');
  assert.ok(bout.opts.rivalryRing.counterPt > 0 && bout.opts.rivalryRing.escape > 0,
    'counterPt / escape が乗ること');
  // rivalryOnly スコープ: タイトル扱いにせず、プレイヤーのバフを持ち込まない
  assert.strictEqual(bout.opts.titleMatch, false, '大会戦をタイトル戦扱いにしないこと');
  assert.deepStrictEqual(bout.opts.ovBuff, [0, 0], 'プレイヤーのバフを持ち込まないこと');
  assert.deepStrictEqual(bout.opts.trustDebuff, [0, 0], 'trust 補正はスコープ外');
  assert.ok(captured.some(c => !c.opts.rivalryRing),
    '因縁の無い試合では rivalryRing が null（無条件に付けていない）');
}

// ── 天頂戦（ppv プロファイル。バグBの再発防止） ────────────────────
{
  const SIZE = Engine.ppvTournament.SIZE;
  const ORGS = ['player', 'org_s', 'org_a', 'org_b'];
  const fighters = [];
  const entries = [];
  for (let i = 0; i < SIZE; i++) {
    const orgId = ORGS[i % ORGS.length];
    const id = 200 + i;
    fighters.push(mkFighter(id, orgId));
    entries.push({ id, fighterId: id, orgId, seed: i + 1, name: `F${id}` });
  }
  const A = entries.find(e => e.seed === 1).id;
  const B = entries.find(e => e.seed === 16).id;
  const aiOrgs = {};
  ['org_s', 'org_a', 'org_b'].forEach(o => {
    aiOrgs[o] = { roster: fighters.filter(f => f.orgId === o).map(f => ({ ...f })) };
  });
  const state = {
    season: 12, week: 48, rngSeed: 4242, orgName: 'P',
    roster: fighters.filter(f => f.orgId === 'player').map(f => ({ ...f })),
    aiOrgs, titles: { world: { championId: null, defenses: 0 } },
    relationships: rivalry(A, B, 85), rivalries: {}, milestoneBuffs: [],
    ppvTournament: { phase: 'ready', entries, specialInvites: [], rounds: [], dramaEvents: [] },
  };
  spyOn();
  const res = Engine.ppvTournament.run(state, Engine.rng.create(999));
  spyOff();
  assert.ok(!res.cancelled, '天頂戦が成立すること');
  assertAllHaveRivalryChannel('天頂戦', SIZE - 1);
  const bout = boutBetween(A, B);
  assert.ok(bout && bout.opts.rivalryRing, '因縁のある試合は rivalryRing が立つこと');
}

console.log('ringin-coverage-test: ok');
