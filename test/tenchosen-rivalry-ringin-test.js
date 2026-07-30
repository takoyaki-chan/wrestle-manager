'use strict';
// 天頂戦の因縁リング内効果（バグB）の回帰テスト。
//
// MQ再設計P3b(9cb70da, 2026-07-24)で因縁/タイトル/trustの外部固定加算を撤廃して
// simulateMatch への入力（リング内効果）へ移したとき、buildRingInOpts の呼び出しを
// 追加したのはプレイヤー通常興行とAI団体興行の2経路だけだった。
// 旧実装の finalize は profile==='ppv' に対して「因縁のみ」外部加算していたため、
// PPV GRAND FINAL と天頂戦は **因縁の効果がゼロに落ちた**（回帰）。
//
// ここでは simulateMatch に渡る opts を捕まえて、因縁のある組が実際に
// rivalryRing を受け取っていることを確認する（ソース文字列照合ではなく振る舞い検査）。

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

const SIZE = Engine.ppvTournament.SIZE;

function mkFighter(id, orgId) {
  return {
    id, name: `F${id}`, orgId, portrait: null, style: 'Allround',
    age: 25, popularity: 50, drawPower: 30, trust: 60, condition: 80,
    pw: 70, sp: 70, te: 70, st: 70, mn: 70,
    wins: 0, losses: 0, draws: 0, careerSeasons: 4,
    careerRecord: Engine.career.createRecord(),
  };
}

// 16名を4団体に散らす。seed は _bracketOrder が 1..16 で引く。
const ORGS = ['player', 'org_s', 'org_a', 'org_b'];
const fighters = [];
const entries = [];
for (let i = 0; i < SIZE; i++) {
  const orgId = ORGS[i % ORGS.length];
  const id = 100 + i;
  fighters.push(mkFighter(id, orgId));
  entries.push({ id, fighterId: id, orgId, seed: i + 1, name: `F${id}` });
}

// 1回戦で必ず当たる組（_bracketOrder の先頭ペア = seed 1 と seed 16）に強い因縁を置く。
const RIVAL_A = entries.find(e => e.seed === 1).id;
const RIVAL_B = entries.find(e => e.seed === 16).id;

function buildState() {
  const aiOrgs = {};
  ['org_s', 'org_a', 'org_b'].forEach(orgId => {
    aiOrgs[orgId] = { roster: fighters.filter(f => f.orgId === orgId).map(f => ({ ...f })) };
  });
  // 因縁は relationships の**方向別キー**に入り、判定は min(A→B, B→A) を見る（非対称2軸）。
  // 片方向だけ高いと isOneSided 扱いでリング内効果の対象外になるため、両方向を立てる。
  const relationships = {
    [`${RIVAL_A}>${RIVAL_B}`]: { rivalry: 85, bond: 20 },
    [`${RIVAL_B}>${RIVAL_A}`]: { rivalry: 85, bond: 20 },
  };
  return {
    season: 12, week: 48, rngSeed: 4242,
    orgName: 'PLAYER',
    roster: fighters.filter(f => f.orgId === 'player').map(f => ({ ...f })),
    aiOrgs,
    titles: { world: { championId: null, defenses: 0 } },
    relationships,
    rivalries: {},
    milestoneBuffs: [],
    ppvTournament: { phase: 'ready', entries, specialInvites: [], rounds: [], dramaEvents: [] },
  };
}

// simulateMatch に渡る opts を記録する
const captured = [];
const realSimulateMatch = Engine.battle.simulateMatch;
Engine.battle.simulateMatch = function (left, right, rng, tier, opts) {
  captured.push({ leftId: left && left.id, rightId: right && right.id, opts: opts || null });
  return realSimulateMatch.apply(this, arguments);
};

const state = buildState();
const result = Engine.ppvTournament.run(state, Engine.rng.create(999));
Engine.battle.simulateMatch = realSimulateMatch;

assert.ok(!result.cancelled, `天頂戦が成立すること (cancelled=${result.cancelled})`);
assert.strictEqual(captured.length, SIZE - 1, `15試合ぶん呼ばれること (実際=${captured.length})`);

// すべての試合が opts を受け取っている（呼び忘れの再発防止）
captured.forEach((c, i) => {
  assert.ok(c.opts, `第${i + 1}試合が opts を受け取っていること`);
  assert.ok('rivalryRing' in c.opts, `第${i + 1}試合の opts に rivalryRing チャネルがあること`);
});

// 因縁を張った組の試合では rivalryRing が実際に効いている
const rivalBout = captured.find(c =>
  (c.leftId === RIVAL_A && c.rightId === RIVAL_B) || (c.leftId === RIVAL_B && c.rightId === RIVAL_A));
assert.ok(rivalBout, '因縁を張った2名の対戦が1回戦で組まれていること');
assert.ok(rivalBout.opts.rivalryRing, '因縁のある試合は rivalryRing を受け取ること（バグBの本体）');
assert.ok(rivalBout.opts.rivalryRing.counterPt > 0, 'counterPt が乗ること');
assert.ok(rivalBout.opts.rivalryRing.escape > 0, 'escape が乗ること');

// rivalryOnly スコープ: 天頂戦はタイトル戦ではなく、プレイヤーのバフを他団体戦へ漏らさない。
// 旧v2.0 の profile==='ppv' の外部加算が「因縁のみ」だったスコープを踏み越えないこと。
assert.strictEqual(rivalBout.opts.titleMatch, false, '天頂戦をタイトル戦扱いにしないこと');
assert.deepStrictEqual(rivalBout.opts.ovBuff, [0, 0], 'プレイヤーのバフを持ち込まないこと');
assert.deepStrictEqual(rivalBout.opts.trustDebuff, [0, 0], 'trust 補正は ppv スコープ外なので載せないこと');

// 因縁の無い組では rivalryRing が立たない（無条件に付けていないことの確認）
const plainBout = captured.find(c => !c.opts.rivalryRing);
assert.ok(plainBout, '因縁の無い試合では rivalryRing が null であること');

console.log('tenchosen-rivalry-ringin-test: ok');
