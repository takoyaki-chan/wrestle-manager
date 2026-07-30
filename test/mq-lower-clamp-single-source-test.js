'use strict';
// バグA: MQ の下限クランプを finalize 1箇所に集約する（2026-07-30）。
//
// 以前は match-engine.js(シングル/タッグ) と management.js(finalize) の2箇所で
// Math.max(5, ...) がかかっていた。エンジン内部で床上げされた生スコアに finalize で
// crowd(会場の熱×注目度)が乗るため、生スコア -8 の凡戦が 5 に持ち上げられた上に
// crowd +8 で 13 になっていた。正しくは -8+8=0 → 床で 5。
//
// **床は finalize だけが持つ。エンジンは生スコアをそのまま返す。**
// そのうえで**プレイヤーに見える最終MQの下限は5のまま**。床の撤去ではなく一本化。
//
// 振る舞いで検査する（ソース文字列の照合はリファクタで陳腐化するため置かない。
// test/stale-lint.js / test/README.md 参照）。

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

function fighter(id, pop) {
  return {
    id, name: `F${id}`, style: 'Allround', archetype: 'normal', personality: 'normal',
    age: 25, popularity: pop, drawPower: 30, trust: 60, condition: 80,
    pw: 70, sp: 70, te: 70, st: 70, mn: 70,
    careerRecord: Engine.career.createRecord(),
  };
}

function stateFor(pop) {
  return {
    season: 3, week: 10, rngSeed: 7, orgName: 'P',
    roster: [fighter(1, pop), fighter(2, pop)],
    aiOrgs: {}, titles: { world: { championId: null, defenses: 0 } },
    relationships: {}, rivalries: {}, milestoneBuffs: [],
  };
}

function finalize(rawMq, profile, opts = {}) {
  const pop = opts.pop != null ? opts.pop : 90;
  const st = stateFor(pop);
  return Engine.mq.finalize(st, { mq: rawMq, matchType: 'singles' }, {
    path: 'test',
    matchType: 'singles',
    participantFighters: st.roster,
    venueHeat: opts.venueHeat != null ? opts.venueHeat : 0,
    isMainEvent: false,
  }, profile);
}

// ── 1. 床は finalize が持つ。生スコアが負でも最終MQは5を下回らない ──
{
  const r = finalize(-30, 'normal-single', { venueHeat: 0 });
  assert.strictEqual(r.mq, 5, `生スコア -30 でも最終MQはちょうど5 (実際=${r.mq})`);
  assert.strictEqual(r.mqInventory.lowerClampHit, true, '床にあたったことを記録する');
}

// ── 2. 凡戦の水増しが消えている（本体） ──
// 修正前はエンジン側で 5 に床上げされた上に crowd が乗っていた。
// いまは「生スコア + crowd」を計算してから床をかけるので、生スコアが低い試合は
// crowd があっても持ち上がらない。
{
  const low = finalize(-8, 'normal-single', { venueHeat: 40, pop: 95 });
  const crowd = low.mqInventory.crowd;
  assert.ok(crowd > 0, `この条件では crowd が正であること (実際=${crowd})`);
  const expected = Math.max(5, -8 + crowd);
  assert.strictEqual(low.mq, expected,
    `最終MQは max(5, 生スコア + crowd) = ${expected} (実際=${low.mq})`);
  const oldBehaviour = Math.max(5, 5 + crowd);
  assert.notStrictEqual(low.mq, oldBehaviour,
    `床上げ後に crowd を乗せる旧挙動(水増し ${oldBehaviour})に戻っていないこと`);
}

// ── 3. raw / ppv / ai-show は crowd 加算が無いので床だけが効く ──
// これらは contributions が全て0。数学的に「生スコア→床」しか起きない。
// ジュニア/春タッグ/秋勝ち残り/対抗戦/挑戦状/PPV/天頂戦がこの帯。
['raw', 'ppv', 'ai-show'].forEach(profile => {
  const r = finalize(-12, profile, { venueHeat: 40, pop: 95 });
  assert.strictEqual(r.mqInventory.crowd, 0, `${profile} は crowd を加算しない`);
  assert.strictEqual(r.mq, 5, `${profile} の最終MQは床の5 (実際=${r.mq})`);

  const good = finalize(72, profile, { venueHeat: 40, pop: 95 });
  assert.strictEqual(good.mq, 72, `${profile} は素点がそのまま最終MQ (実際=${good.mq})`);
});

// ── 4. 良い試合は影響を受けない ──
// 生スコアが5以上の試合は、床が二重でも一重でも結果が同じ。
[20, 55, 70, 88].forEach(raw => {
  const r = finalize(raw, 'normal-single', { venueHeat: 20, pop: 80 });
  assert.strictEqual(r.mq, raw + r.mqInventory.crowd,
    `生スコア ${raw} は床に触れず crowd 加算のみ (実際=${r.mq})`);
  assert.strictEqual(r.mqInventory.lowerClampHit, false, '床にあたっていないこと');
});

// ── 5. エンジン側は床を持たない ──
// finalize を通す前の生スコアが 5 に張り付かないこと。極端に弱い者同士でも
// 必ず5未満になる保証は無いので、最小値が5でクリップされていないことで示す。
{
  const weak = { ...fighter(11, 5), pw: 1, sp: 1, te: 1, st: 1, mn: 1 };
  const weak2 = { ...fighter(12, 5), pw: 1, sp: 1, te: 1, st: 1, mn: 1 };
  let sawBelowFive = false;
  let minSeen = Infinity;
  for (let i = 0; i < 300; i++) {
    const r = Engine.battle.simulateMatch(weak, weak2, Engine.rng.create(1000 + i), 1);
    assert.ok(Number.isFinite(r.mq), 'エンジンのMQは有限値');
    minSeen = Math.min(minSeen, r.mq);
    if (r.mq < 5) sawBelowFive = true;
  }
  assert.ok(sawBelowFive || minSeen !== 5,
    `エンジンが5で床上げしていないこと (観測最小=${minSeen})`);
}

console.log('mq-lower-clamp-single-source-test: ok');
