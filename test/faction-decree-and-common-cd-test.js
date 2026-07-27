// faction-decree-and-common-cd-test.js
//
// 2026-07-27 の派閥見直しの安全網。守りたいのは次の3つ。
//
//  (1) Common-1（派閥内対決）の個別クールダウンが「効いている」こと
//      実測では共通イベント67件中65件(97%)が Common-1 で、Common-5(取材)/Common-7(合同企画) は
//      条件を満たしても順番が来ず0件だった。原因は Common-1 だけ個別 CD が無かったこと。
//      ここで一番こわいのは「配線したつもりで数字が効いていない」状態なので、
//      値そのもの（枠CDより長いか）と、実際に checkCommon1Conditions が弾くかの両方を見る。
//
//  (2) 社長命令による解散・封印が、派閥の state を残らず畳むこと
//      進行中の予約（_pendingF09 等）が残ると、派閥が消えたあとにモーダルだけ出る。
//
//  (3) 封印中は tickWeek が派閥を1つも作らないこと
//      結成条件を満たしたロスターを渡しても増えないことを、実物の tickWeek で確かめる。

'use strict';
const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ factions: true });

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 派閥: 解散命令 と Common-1 クールダウン ===\n');

// ─────────────────────────────────────────────────────────────
// テスト用の素材
// ─────────────────────────────────────────────────────────────

function makeFighter(id) {
  return {
    id, name: `F${id}`, orgId: 'player',
    pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    style: 'Allround', personality: 'normal', archetype: 'normal',
    injury: null, isRental: false, age: 22,
    popularity: 40, condition: 80, trust: 60,
  };
}

// リーダー1 + メンバー2、内部に rivalry 40 のペアを1組持つ派閥ひとつ。
// Common-1 の発動条件（派閥内2名 rivalry>=40）をちょうど満たす形。
function makeStateWithOneFaction(overrides = {}) {
  const roster = [1, 2, 3].map(makeFighter);
  const relationships = {};
  for (const a of [1, 2, 3]) {
    for (const b of [1, 2, 3]) {
      if (a === b) continue;
      relationships[`${a}>${b}`] = { bond: 70, rivalry: 0 };
    }
  }
  // 2>3 だけ因縁を立てる
  relationships['2>3'] = { bond: 55, rivalry: 60 };
  relationships['3>2'] = { bond: 55, rivalry: 60 };

  return Object.assign({
    season: 2, week: 10, offSeason: false, rngSeed: 12345,
    roster, relationships,
    factions: [{
      id: 1, name: 'テスト組', leaderId: 1, memberIds: [1, 2, 3],
      flavor: 'bond_first', archetypeId: 'BOND', type: 'loyal', status: 'active',
      momentum: 50, inHostility: false,
      authoritativeTag: false, dictatorTag: false,
      createdWeek: 1, formedAbsWeek: 1,
      hostilityTo: {},
    }],
    factionEventCooldowns: {}, factionHostility: {},
    factionReconciliationStreak: {}, factionEndlessStreak: {},
    f02MediationWatches: [],
    lockerRoomMorale: 60,
  }, overrides);
}

const rng = () => Engine.rng.create(1);

// ─────────────────────────────────────────────────────────────
// (1) Common-1 の個別クールダウン
// ─────────────────────────────────────────────────────────────

section('1-a. Common-1 の個別CDは、派閥ごとの共通イベント枠CDより長い', () => {
  const indiv = FACTION_CONFIG.commonEventIndividualCooldowns.COMMON_1;
  const team = FACTION_CONFIG.commonEventFactionCooldown;
  assert.ok(typeof indiv === 'number', 'COMMON_1 の個別CDが未定義');
  assert.ok(
    indiv > team,
    `COMMON_1 個別CD(${indiv}) が派閥枠CD(${team}) 以下。` +
    'この関係が崩れると個別CDは枠CDに飲まれて完全に無効になり、' +
    'Common-1 がまた共通イベント枠を独占する（2026-07-27 の実測: 97%）'
  );
});

section('1-b. 直前に Common-1 を出した派閥は、個別CDの間 Common-1 に選ばれない', () => {
  const cd = FACTION_CONFIG.commonEventIndividualCooldowns.COMMON_1;
  const s = makeStateWithOneFaction();
  // 24週前（＝派閥枠CD 24 は明けているが、個別CD 48 は明けていない）に Common-1 を出した状態
  const lastWeek = Engine.util.absWeekTotal(s.season, s.week, s.offSeason, s.offWeek) - (cd - 1);
  s.factions[0]._commonEventCooldowns = { COMMON_1: lastWeek };
  s.factions[0]._commonEventLastWeek = lastWeek;

  const r = Engine.factions.checkCommon1Conditions(s, rng());
  assert.strictEqual(r.eligible, false, '個別CDの途中なのに Common-1 が選ばれた');
});

section('1-c. 個別CDが明ければ Common-1 は再び選ばれる', () => {
  const cd = FACTION_CONFIG.commonEventIndividualCooldowns.COMMON_1;
  const s = makeStateWithOneFaction();
  const lastWeek = Engine.util.absWeekTotal(s.season, s.week, s.offSeason, s.offWeek) - (cd + 1);
  s.factions[0]._commonEventCooldowns = { COMMON_1: lastWeek };
  s.factions[0]._commonEventLastWeek = lastWeek;

  const r = Engine.factions.checkCommon1Conditions(s, rng());
  assert.strictEqual(r.eligible, true, 'CD が明けたのに Common-1 が選ばれない（条件を締めすぎ）');
});

section('1-d. Common-1 の保留イベントは ID 型揺れを吸収し、退団済みの相手は無効にする', () => {
  const s = makeStateWithOneFaction();
  const resolved = Engine.factions.resolveCommon1Fighters(s, {
    fighterAId: '2', fighterBId: '3', leaderId: '1',
  });
  assert.strictEqual(resolved.valid, true, '数値と文字列の ID が混在すると対戦者を見失う');
  assert.strictEqual(resolved.fighterA.id, 2, 'A側を誤って解決した');
  assert.strictEqual(resolved.fighterB.id, 3, 'B側を誤って解決した');

  const stale = Engine.factions.resolveCommon1Fighters(s, {
    fighterAId: 2, fighterBId: 999, leaderId: 1,
  });
  assert.strictEqual(stale.valid, false, '退団済みの相手を含む保留イベントが有効になっている');
});

// ─────────────────────────────────────────────────────────────
// (2) 社長命令による解散・封印
// ─────────────────────────────────────────────────────────────

section('2-a. 解散のみ: 派閥は消えるが、封印フラグは立たない', () => {
  const s = makeStateWithOneFaction();
  const { state: out, dissolved } = Engine.factions.dissolveAllByDecree(s, { seal: false });
  assert.strictEqual(out.factions.length, 0, '派閥が残っている');
  assert.strictEqual(dissolved.length, 1, '解散した派閥の内訳が返っていない');
  assert.strictEqual(dissolved[0].name, 'テスト組');
  assert.ok(!out.factionsSealed, 'seal:false なのに封印されている');
});

section('2-b. 解散して封印: factionsSealed が立つ', () => {
  const s = makeStateWithOneFaction();
  const { state: out } = Engine.factions.dissolveAllByDecree(s, { seal: true });
  assert.strictEqual(out.factions.length, 0, '派閥が残っている');
  assert.strictEqual(out.factionsSealed, true, '封印フラグが立っていない');
});

section('2-c. 進行中の派閥イベント・予約が残らない', () => {
  const s = makeStateWithOneFaction({
    _pendingFactionEvent: { eventId: 'F07', payload: {} },
    _pendingF09: { factionAId: 1, factionBId: 2 },
    _pendingInternalChallenge: { factionId: 1 },
    _pendingF08Directive: { factionId: 1 },
    factionPendingIgnite: { factionAId: 1 },
    factionRivalryPoints: { '1_2': { points: 40 } },
    _commonEventTeamCooldownUntil: 999,
  });
  const { state: out } = Engine.factions.dissolveAllByDecree(s, { seal: true });

  for (const k of ['_pendingFactionEvent', '_pendingF09', '_pendingInternalChallenge', '_pendingF08Directive']) {
    assert.ok(!(k in out), `${k} が残っている（派閥が消えた後にモーダルだけ出る）`);
  }
  assert.strictEqual(out.factionPendingIgnite, null, 'factionPendingIgnite が残っている');
  assert.deepStrictEqual(out.factionRivalryPoints, {}, '抗争ポイントが残っている');
  assert.deepStrictEqual(out.factionHostility, {}, '対立度が残っている');
  assert.strictEqual(out._commonEventTeamCooldownUntil, 0, '共通イベント枠CDが残っている');
});

section('2-d. リーダーの信頼度は、一般メンバーより深く落ちる', () => {
  const s = makeStateWithOneFaction();
  const before = new Map(s.roster.map(f => [f.id, f.trust]));
  const { state: out } = Engine.factions.dissolveAllByDecree(s, { seal: true });

  const dropOf = id => before.get(id) - out.roster.find(f => f.id === id).trust;
  const leaderDrop = dropOf(1);
  const memberDrop = dropOf(2);
  assert.ok(memberDrop > 0, 'メンバーの信頼度が落ちていない');
  assert.ok(
    leaderDrop > memberDrop,
    `リーダー(${leaderDrop.toFixed(2)}) がメンバー(${memberDrop.toFixed(2)}) より深く落ちていない。` +
    '自分が束ねた場所を上から畳まれる痛みが消えている'
  );
});

section('2-e. 勢いに乗っていた派閥のリーダーほど深く落ちる', () => {
  const hot = makeStateWithOneFaction();
  hot.factions[0].momentum = 100;
  const cold = makeStateWithOneFaction();
  cold.factions[0].momentum = -50;

  const dropIn = (st) => {
    const { state: out } = Engine.factions.dissolveAllByDecree(st, { seal: false });
    return st.roster.find(f => f.id === 1).trust - out.roster.find(f => f.id === 1).trust;
  };
  const hotDrop = dropIn(hot);
  const coldDrop = dropIn(cold);
  assert.ok(
    hotDrop > coldDrop,
    `勢い100(${hotDrop.toFixed(2)}) が勢い-50(${coldDrop.toFixed(2)}) より深くない。` +
    '固定値に戻すと「潰されたタイミング」の説得力が消える'
  );
});

section('2-f. 封印解除でフラグが消える / 封印していなければ何も起きない', () => {
  const sealed = Object.assign(makeStateWithOneFaction(), { factionsSealed: true });
  const un = Engine.factions.unsealFactions(sealed);
  assert.strictEqual(un.changed, true, '解除されたことが返っていない');
  assert.ok(!('factionsSealed' in un.state), 'factionsSealed が残っている');

  const plain = makeStateWithOneFaction();
  const noop = Engine.factions.unsealFactions(plain);
  assert.strictEqual(noop.changed, false, '封印していないのに解除扱いになった');
});

// ─────────────────────────────────────────────────────────────
// (3) 封印中は tickWeek が派閥を作らない（実物のパイプラインで確認）
// ─────────────────────────────────────────────────────────────

section('3. 封印中は、結成条件を満たしても派閥が1つも生まれない', () => {
  // 素の初期状態にロスターを積んで、派閥が自然発生しうる規模まで持っていく
  function seededGame(sealed) {
    let G = Engine.createInitialState(4242, true);
    const rngP = Engine.rng.create(0x1234);
    const existing = new Set(G.roster.map(x => x.id));
    const extra = (ALL_CHARS || []).filter(x => !existing.has(x.id)).slice(0, 12)
      .map(t => {
        const f = Engine.makeChar(t, rngP, G.orgId);
        return { ...f, orgJoinWeek: 1, contractOVR: Engine.util.ov(f), contractPop: f.popularity || 0 };
      });
    G = { ...G, roster: [...G.roster, ...extra], funds: 5000, rosterCap: 20, orgPop: 30 };
    // 全員の相互 bond を結成閾値の上へ引き上げる
    const rel = { ...(G.relationships || {}) };
    const ids = G.roster.map(c => c.id);
    for (const a of ids) for (const b of ids) {
      if (a === b) continue;
      rel[`${a}>${b}`] = { ...(rel[`${a}>${b}`] || { rivalry: 0 }), bond: 85, rivalry: 0 };
    }
    G = { ...G, relationships: rel, factions: [] };
    if (sealed) G = { ...G, factionsSealed: true };
    return G;
  }

  // tickWeek は「その週の処理」だけを行い、時計は進めない。同じ週で回すと派閥抽選の
  // 乱数シード（season/week から導出）が毎回同じになり、何度回しても結果が変わらない。
  // 本物の advanceWeek は興行やドラフトまで巻き込むので、ここでは週だけを手で進める。
  const runWeeks = (G, weeks) => {
    for (let i = 0; i < weeks; i++) {
      G = Engine.tickWeek(G).state;
      if ((G.factions || []).length > 0 || G._pendingFactionEvent) break;
      let week = (G.week || 1) + 1;
      let season = G.season || 1;
      if (week > Engine.util.WEEKS_PER_SEASON) { week = 1; season += 1; }
      G = { ...G, week, season };
    }
    return G;
  };

  // 対照: 封印していなければ結成イベントが立ちうること（テスト自体が空振りしていない保証）
  const openEnd = runWeeks(seededGame(false), 40);
  const openFired = (openEnd.factions || []).length > 0 || !!openEnd._pendingFactionEvent;
  assert.ok(openFired, '封印なしでも派閥の動きが1度も起きなかった。この検査は空振りしている');

  const sealedEnd = runWeeks(seededGame(true), 40);
  assert.strictEqual((sealedEnd.factions || []).length, 0, '封印中なのに派閥が生まれた');
  assert.ok(!sealedEnd._pendingFactionEvent, '封印中なのに派閥イベントが立った');
});

// ─────────────────────────────────────────────────────────────
// (4) 封印中の見え方（2026-07-27 実機で「タブごと消える」が発覚したため追加）
// ─────────────────────────────────────────────────────────────

section('4. 封印中はデータベースの派閥タブが残り、理由と解除導線が出る', () => {
  const fs = require('fs');
  const uiRender = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');

  // タブの出し分けが factions.length だけを見ていると、封印中はタブごと消えて
  // 「なぜ派閥が出ないのか」を確かめる場所が無くなる（社長室への導線にも辿り着けない）
  const m = uiRender.match(/const hasFactions = [^\n]*/);
  assert.ok(m, 'データベースの派閥タブ出し分けが見つからない');
  assert.ok(
    /factionsSealed/.test(m[0]),
    '派閥タブの出し分けが factionsSealed を見ていない。' +
    '封印すると派閥が0になるので、タブごと消えて封印中の説明に辿り着けなくなる'
  );

  // 封印中の文面（「まだ生まれていない」ではなく「作らせていない」と書き分ける）
  const at = uiRender.indexOf('function _renderDbFactions()');
  assert.ok(at > 0, '_renderDbFactions が見つからない');
  const body = uiRender.slice(at, at + 1800);
  assert.ok(/G\.factionsSealed/.test(body), '封印中の分岐が無い');
  assert.ok(/認めていません/.test(body), '封印中であることが書かれていない');
  assert.ok(/派閥解散命令/.test(body), '解除導線（社長室）が案内されていない');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
