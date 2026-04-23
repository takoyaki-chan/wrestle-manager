// Phase 1b smoke test: faction 加入判定のサイズ倍率 + 単独凍結
// processWeeklyMemberChanges 単体で、以下のコードパスが期待通り動くかを検証:
//   1. サイズ 3 の派閥: 加入可能（rate 倍率 1.0、複数派閥なら凍結なし）
//   2. サイズ 8 の派閥: サイズ倍率 0.0 で誰も加入しない
//   3. 単独派閥サイズ 5: 凍結で加入判定スキップ（bond 80+ 候補でも加入 0）
//   4. 単独派閥サイズ 4: 凍結なし（境界）
//   5. 2 派閥並立サイズ 5: 凍結条件が外れて加入判定が走る
// _getJoinSizeMult ヘルパ単体値のアサートも併せて。

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

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('factions.js');

function makeFighter(id) {
  return {
    id,
    name: `F${id}`,
    orgId: 'player',
    pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    style: 'Allround',
    personality: 'normal',
    archetype: 'normal',
    injury: null,
    isRental: false,
    age: 22,
    popularity: 40,
    condition: 80,
    trust: 60,
    ovr: 60,
  };
}

// 全ペア間の bond を設定したヘルパ（非対称でも対称でも同じ値を両方向に入れる）
function setBond(state, fromId, toId, bond) {
  state.relationships[`${fromId}>${toId}`] = { bond, rivalry: 0 };
}

function setBondUniform(state, ids, bondValue) {
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      setBond(state, a, b, bondValue);
    }
  }
}

function makeStateWithFactions(factionSpecs, outsiderCount, bondBetweenOutsiderAndMembers = 85) {
  // factionSpecs: [{ size }]
  // outsider: 加入候補（全メンバーに対し bond 85）
  const state = {
    season: 1,
    week: 10,
    rngSeed: 12345,
    roster: [],
    relationships: {},
    factions: [],
    factionEventCooldowns: {},
    factionHostility: {},
    factionReconciliationStreak: {},
    factionEndlessStreak: {},
    f02MediationWatches: [],
  };

  let nextId = 1;
  const factionData = [];
  for (const spec of factionSpecs) {
    const memberIds = [];
    for (let i = 0; i < spec.size; i++) {
      const f = makeFighter(nextId);
      state.roster.push(f);
      memberIds.push(nextId);
      nextId++;
    }
    // 派閥内メンバーは相互 bond 70（加入判定以外には影響しない）
    setBondUniform(state, memberIds, 70);
    factionData.push({
      id: factionData.length + 1,
      name: `F${factionData.length + 1}組`,
      leaderId: memberIds[0],
      memberIds: [...memberIds],
      type: 'loyal',
      momentum: 0,
      inHostility: false,
      authoritativeTag: false,
      dictatorTag: false,
      f07RebukeCount: 0,
      createdWeek: 1,
      timeline: [],
    });
  }
  state.factions = factionData;

  // outsider（派閥未所属候補）
  const outsiderIds = [];
  for (let i = 0; i < outsiderCount; i++) {
    const f = makeFighter(nextId);
    state.roster.push(f);
    outsiderIds.push(nextId);
    nextId++;
  }

  // outsider と 全 派閥メンバーの bond を 85 に（加入率 60% トリガー）
  for (const oid of outsiderIds) {
    for (const fac of factionData) {
      for (const mid of fac.memberIds) {
        setBond(state, oid, mid, bondBetweenOutsiderAndMembers);
        setBond(state, mid, oid, bondBetweenOutsiderAndMembers);
      }
    }
  }

  return { state, outsiderIds };
}

function countFactionMembers(state) {
  return state.factions.map(f => f.memberIds.length);
}

// RNG を stub: Engine.rng.float を 0 固定に差し替え（加入率 > 0 なら必ず加入）
// 各テスト後に restore する
const _origFloat = Engine.rng.float;
function withZeroRng(fn) {
  Engine.rng.float = () => 0;
  try { fn(); } finally { Engine.rng.float = _origFloat; }
}
function makeZeroRng() { return {}; }

let passed = 0;
let failed = 0;
function check(label, fn) {
  try {
    withZeroRng(fn);
    console.log(`  [PASS] ${label}`);
    passed++;
  } catch (e) {
    console.log(`  [FAIL] ${label}: ${e.message}`);
    failed++;
  }
}

// ── 1) _getJoinSizeMult 単体値 ──
console.log('\n[1] _getJoinSizeMult 値テーブル');
check('size=3 → 1.0', () => assert.strictEqual(Engine.factions._getJoinSizeMult(3), 1.0));
check('size=4 → 1.0', () => assert.strictEqual(Engine.factions._getJoinSizeMult(4), 1.0));
check('size=5 → 0.6', () => assert.strictEqual(Engine.factions._getJoinSizeMult(5), 0.6));
check('size=6 → 0.6', () => assert.strictEqual(Engine.factions._getJoinSizeMult(6), 0.6));
check('size=7 → 0.3', () => assert.strictEqual(Engine.factions._getJoinSizeMult(7), 0.3));
check('size=8 → 0.0', () => assert.strictEqual(Engine.factions._getJoinSizeMult(8), 0.0));
check('size=10 → 0.0', () => assert.strictEqual(Engine.factions._getJoinSizeMult(10), 0.0));

// ── 2) サイズ 8 派閥: rate×0 で誰も加入しない ──
console.log('\n[2] サイズ 8 派閥: 加入 0');
check('size=8 の派閥 + 2 派閥並立（凍結なし）+ outsider 5 → 加入 0', () => {
  const { state } = makeStateWithFactions([{ size: 8 }, { size: 3 }], 5);
  const rng = makeZeroRng();
  const s2 = Engine.factions.processWeeklyMemberChanges(state, rng);
  const sizes = countFactionMembers(s2);
  assert.strictEqual(sizes[0], 8, `size8 派閥のサイズは 8 のまま。実際: ${sizes[0]}`);
});

// ── 3) サイズ 7 派閥: rate×0.3 で一部加入（RNG=0 なら加入） ──
console.log('\n[3] サイズ 7 派閥: 減衰はあるが rate>0');
check('size=7 + 2 派閥並立 + outsider 1 (RNG=0) → 加入する', () => {
  const { state } = makeStateWithFactions([{ size: 7 }, { size: 3 }], 1);
  const rng = makeZeroRng();
  const s2 = Engine.factions.processWeeklyMemberChanges(state, rng);
  const sizes = countFactionMembers(s2);
  assert.strictEqual(sizes[0], 8, `size7 派閥は +1 加入すべき。実際: ${sizes[0]}`);
});

// ── 4) 単独派閥サイズ 5: 凍結で加入判定スキップ ──
console.log('\n[4] 単独派閥サイズ 5: 加入凍結');
check('単独 size=5 + outsider 5 (bond 85, RNG=0) → 加入 0（凍結）', () => {
  const { state } = makeStateWithFactions([{ size: 5 }], 5);
  const rng = makeZeroRng();
  const s2 = Engine.factions.processWeeklyMemberChanges(state, rng);
  const sizes = countFactionMembers(s2);
  assert.strictEqual(sizes[0], 5, `凍結中は加入なし。実際: ${sizes[0]}`);
});

// ── 5) 単独派閥サイズ 4: 凍結境界（凍結なし、加入可） ──
console.log('\n[5] 単独派閥サイズ 4: 凍結境界');
check('単独 size=4 + outsider 1 (bond 85, RNG=0) → 加入する', () => {
  const { state } = makeStateWithFactions([{ size: 4 }], 1);
  const rng = makeZeroRng();
  const s2 = Engine.factions.processWeeklyMemberChanges(state, rng);
  const sizes = countFactionMembers(s2);
  assert.strictEqual(sizes[0], 5, `サイズ 4 は凍結されない（+1 加入）。実際: ${sizes[0]}`);
});

// ── 6) 2 派閥並立サイズ 5: 凍結なし（解除条件「第二派閥誕生」） ──
console.log('\n[6] 2 派閥並立サイズ 5: 凍結解除');
check('size=5 が 2 つ + outsider 2 (bond 85, RNG=0) → どちらかに加入する', () => {
  const { state } = makeStateWithFactions([{ size: 5 }, { size: 5 }], 2);
  const rng = makeZeroRng();
  const s2 = Engine.factions.processWeeklyMemberChanges(state, rng);
  const sizes = countFactionMembers(s2);
  const total = sizes.reduce((a, b) => a + b, 0);
  assert.ok(total > 10, `2 派閥並立なら凍結されず、少なくとも 1 名加入。実際 total=${total}`);
});

// ── 7) 既存の勢い修正との合成（rivalrous & momentum>30 の size=7 は 1.5×0.3=0.45） ──
console.log('\n[7] 勢い修正との合成');
check('抗争中 momentum=50 size=7 + outsider 1 (bond 85, RNG=0) → rate=0.6*1.5*0.3=0.27 で加入', () => {
  const { state } = makeStateWithFactions([{ size: 7 }, { size: 3 }], 1);
  state.factions[0].inHostility = true;
  state.factions[0].momentum = 50;
  state.factions[1].inHostility = true;
  state.factions[1].momentum = -50;
  const rng = makeZeroRng();
  const s2 = Engine.factions.processWeeklyMemberChanges(state, rng);
  const sizes = countFactionMembers(s2);
  assert.strictEqual(sizes[0], 8, `rate>0 なので RNG=0 で加入する。実際: ${sizes[0]}`);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
