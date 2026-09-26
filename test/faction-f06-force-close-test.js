#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/faction-f06-force-close-test.js — 総点検 第4回の確認 3・4(2026-09-26 Keisuke 裁定)の回帰ガード
//
//  ■ 何を守るか
//    裁定3 通常興行のメインの勝利にも上乗せ(specs/faction-rivalry-points-spec-v0.1.md §2.2 +0.3 /
//          faction-internal-rank-spec-v0.2.md §3.2 +2pt)。メイン=興行カードの先頭(validMatches[0])。
//          PPV の頂上決戦(isSummit)は従来どおりメイン
//    裁定4 40週の「和解させる/続けさせる」の2択(§4.3 F06 強制発火)
//      - 40週に達した記録があっても、同じ週のほかの記録の判定(自然沈静化など)は続ける(以前は毎週そこで止まった)
//      - tickWeek が派閥イベント F06_FORCE を立てる(旧 _pendingForceCloseRivalry は拾う処理が無かった)
//      - A 和解させる: 記録を閉じる(RIVALRY_CLOSED / F06_RECONCILE)・両方向 hostility -30・勝者敗者の効果なし
//      - B 続けさせる: ポイント維持・次の判定は選んだ週から +20週
//      - 出してから選ぶまでに記録/派閥が消えていたら何もしない(pending の自浄)
//      - 画面(app.js/ui-common.js)とヘッドレス(auto-sim/headless-sim)が F06_FORCE を扱う
//
//  ■ 使い方
//    node test/faction-f06-force-close-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

// factions.js の結果文は派閥名を _factionDisplayName(WM_I18N.pn)に通す。headless-sim は src/i18n.js を 'ja' で
// 読み込む(test/helpers/wm-i18n-ja.js。以前の t だけのスタブを置き換えるための先置きは 2026-09-26 に不要になった)
loadEngines();
const { FACTION_F06_FORCE_AHEAD_LINES, FACTION_F06_FORCE_BEHIND_LINES } = require('../src/data-faction-dialogue.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

const CFG = FACTION_CONFIG;
const clone = (x) => JSON.parse(JSON.stringify(x));

function fighter(id, extra = {}) {
  return { id, name: `選手${id}`, popularity: 40, trust: 50, traits: [], role: 'Face', pw: 50, sp: 50, te: 50, st: 50, mn: 50, personality: 'normal', archetype: 'standard', ...extra };
}

// 派閥1: リーダー1・2番手2 / 派閥2: リーダー3・2番手4(抗争中の2派閥)
function factionState(extra = {}) {
  const roster = [fighter(1, { pw: 70 }), fighter(2, { pw: 60 }), fighter(3, { pw: 70 }), fighter(4, { pw: 60 }), fighter(5)];
  return {
    season: 3, week: 10, offSeason: false, offWeek: 0, rngSeed: 42, roster,
    factions: [
      { id: 1, name: '一派', leaderId: 1, memberIds: [1, 2], status: 'active', type: 'rivalrous', momentum: 10, archetypeId: 'COMBAT' },
      { id: 2, name: '三派', leaderId: 3, memberIds: [3, 4], status: 'active', type: 'rivalrous', momentum: 10, archetypeId: 'COMBAT' },
    ],
    factionHostility: { '1>2': 60, '2>1': 55 },
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: 5, pointsB: 0, startedSeason: 3, startedWeek: 1, lastUpdatedSeason: 3, lastUpdatedWeek: 1, naturalCalmStreak: 0 } },
    factionEventCooldowns: {},
    factionTimeline: [],
    ...extra,
  };
}
const single = (left, right, extra = {}) => ({ left, right, ...extra });
const singleRes = (winner) => ({ winner, mq: 50, left: { id: 0 }, right: { id: 0 } });
const nowAbsOf = (s) => Engine.util.absWeekTotal(s.season, s.week, s.offSeason, s.offWeek);
const hostOf = (s, a, b) => (s.factionHostility || {})[Engine.factions._hostKey(a, b)] || 0;

console.log('派閥抗争 裁定3(メインの上乗せ)・裁定4(40週の2択)回帰ガード');

// ── 裁定3 ──
section('裁定3: 通常興行のメイン(先頭の試合)の勝利に抗争ポイント +0.3 が掛かる。2試合目以降は掛からない', () => {
  // 2番手どうし(second=6pt)。先頭=メインは 6×1.3=7.8→8、2試合目は 6
  const main = Engine.show.accrueFactionPoints(factionState(), [single(2, 4), single(5, 1)], [singleRes('left'), singleRes('left')]);
  assert.strictEqual(main.factionRivalryPoints['1-2'].pointsA, 5 + Math.round(CFG.pointsByRank.second * (1 + CFG.pointsMainEventBonus)), 'メインの加点');
  const under = Engine.show.accrueFactionPoints(factionState(), [single(5, 1), single(2, 4)], [singleRes('left'), singleRes('left')]);
  assert.strictEqual(under.factionRivalryPoints['1-2'].pointsA, 5 + CFG.pointsByRank.second, '2試合目に上乗せが掛かった');
});

section('裁定3: 通常興行のメインで非リーダーが勝つと派閥内ポイント +2(§3.2)。2試合目は +0', () => {
  const main = Engine.show.accrueFactionPoints(factionState(), [single(2, 5)], [singleRes('left')]);
  assert.strictEqual(((main.factionInternalPoints || {})[1] || {})[2], CFG.internalPointsExternalMainWin, 'メイン勝利の派閥内ポイント');
  const under = Engine.show.accrueFactionPoints(factionState(), [single(5, 3), single(2, 5)], [singleRes('left'), singleRes('left')]);
  assert.ok(!((under.factionInternalPoints || {})[1] || {})[2], '2試合目の勝利に派閥内ポイントが入った');
  // メイン+王座戦は高い方(+3)だけ
  const title = Engine.show.accrueFactionPoints(factionState(), [single(2, 5, { isTitle: true })], [singleRes('left')]);
  assert.strictEqual(title.factionInternalPoints[1][2], CFG.internalPointsExternalTitleWin, 'メイン+王座戦は +3 のみ');
});

section('裁定3: PPV の頂上決戦の印(isSummit)は先頭でなくてもメイン(従来どおり)', () => {
  const s = Engine.show.accrueFactionPoints(factionState(), [single(5, 1), single(2, 4, { isSummit: true })], [singleRes('left'), singleRes('left')]);
  assert.strictEqual(s.factionRivalryPoints['1-2'].pointsA, 5 + Math.round(CFG.pointsByRank.second * (1 + CFG.pointsMainEventBonus)));
});

section('裁定3: 実プレイとエンジンは同じ関数を通す(メインの判定は1か所)', () => {
  const mgmt = readSource('src', 'management.js');
  assert.ok(/isMain: !!m\.isSummit \|\| i === 0,/.test(mgmt), 'accrueFactionPoints のメイン判定が「isSummit または先頭」になっていない');
});

// ── 裁定4 ──
function twoEntryState() {
  // 1-2: 40週経過(2択の対象) / 5-6: 敵対度が低く、自然沈静化まであと1週。
  // 派閥は3人以上(minFactionSize。週次処理で消滅しないように)
  const s = factionState();
  s.roster.push(fighter(6), fighter(7), fighter(8), fighter(9), fighter(10), fighter(11), fighter(12));
  s.factions[0].memberIds.push(9);
  s.factions[1].memberIds.push(10);
  s.factions.push(
    { id: 5, name: '六派', leaderId: 6, memberIds: [6, 8, 11], status: 'active', type: 'rivalrous', momentum: 0 },
    { id: 6, name: '七派', leaderId: 7, memberIds: [7, 5, 12], status: 'active', type: 'rivalrous', momentum: 0 },
  );
  s.factionHostility['5>6'] = 5; s.factionHostility['6>5'] = 5;
  const start = Engine.util.absWeekTotal(3, 10, false, 0) - CFG.pointsForceCloseWeeks; // ちょうど40週前
  const startSeason = Math.floor((start - 1) / 52) + 1;
  const startWeek = start - (startSeason - 1) * 52;
  s.factionRivalryPoints['1-2'] = { ...s.factionRivalryPoints['1-2'], pointsA: 62, pointsB: 41, startedSeason: startSeason, startedWeek: startWeek };
  s.factionRivalryPoints['5-6'] = { factionAId: 5, factionBId: 6, pointsA: 4, pointsB: 2, startedSeason: 3, startedWeek: 6, lastUpdatedSeason: 3, lastUpdatedWeek: 6, naturalCalmStreak: CFG.pointsNaturalCalmWeeks - 1 };
  return s;
}

section('裁定4: 40週の記録があっても同じ週のほかの記録の自然沈静化を判定する(以前は毎週そこで止まった)', () => {
  const s = twoEntryState();
  const r = Engine.factions.checkRivalryResolution(s, null);
  assert.ok(r && r.forceClose && r.forceClose.pairKey === '1-2', `40週の記録が2択に回っていない: ${JSON.stringify(r)}`);
  assert.strictEqual(r.reason, 'CALM', `後ろの記録の自然沈静化が判定されていない: ${JSON.stringify(r)}`);
  assert.ok(!s.factionRivalryPoints['5-6'], '自然沈静化した記録が残っている');
  assert.ok(s.factionRivalryPoints['1-2'], '2択の対象の記録を勝手に閉じた');
  assert.strictEqual(s._pendingForceCloseRivalry, undefined, '拾う処理の無い旧い印を立てている');
});

section('裁定4: 40週未満は2択を出さない / 2件が同時に40週でも1週に1件だけ', () => {
  const s = twoEntryState();
  s.week = 9; // 39週
  const r = Engine.factions.checkRivalryResolution(s, null);
  assert.ok(!r || !r.forceClose, `39週で2択が出た: ${JSON.stringify(r)}`);
  const s2 = twoEntryState();
  s2.factionRivalryPoints['5-6'] = { ...s2.factionRivalryPoints['1-2'], factionAId: 5, factionBId: 6 };
  const r2 = Engine.factions.checkRivalryResolution(s2, null);
  assert.strictEqual(r2.reason, 'FORCE_CLOSE_PENDING');
  assert.strictEqual(r2.forceClose.pairKey, '1-2');
});

section('裁定4: tickWeek が派閥イベント F06_FORCE を立て、同じ週にほかの記録の自然沈静化も進む', () => {
  const base = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 6 && g.weekPhase === 'manage' && !g.offSeason });
  const syn = twoEntryState();
  // 合成した派閥の選手を実ロスターの先頭12人に割り当てる
  const ids = base.roster.filter(c => !c.isRental).slice(0, 12).map(c => c.id);
  assert.strictEqual(ids.length, 12, `ロスターが12人に満たない: ${ids.length}`);
  const map = new Map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k, i) => [k, ids[i]]));
  const factions = syn.factions.map(f => ({ ...f, leaderId: map.get(f.leaderId), memberIds: f.memberIds.map(x => map.get(x)), createdSeason: 1, createdWeek: 1 }));
  const nowAbs = nowAbsOf(base);
  const at = (abs) => { const se = Math.floor((abs - 1) / 52) + 1; return { startedSeason: se, startedWeek: abs - (se - 1) * 52 }; };
  let G = {
    ...base,
    factions,
    factionHostility: { '1>2': 60, '2>1': 55, '5>6': 5, '6>5': 5 },
    factionRivalryPoints: {
      '1-2': { factionAId: 1, factionBId: 2, pointsA: 62, pointsB: 41, ...at(nowAbs - 40), lastUpdatedSeason: base.season, lastUpdatedWeek: base.week, naturalCalmStreak: 0 },
      '5-6': { factionAId: 5, factionBId: 6, pointsA: 4, pointsB: 2, ...at(nowAbs - 4), lastUpdatedSeason: base.season, lastUpdatedWeek: base.week, naturalCalmStreak: CFG.pointsNaturalCalmWeeks - 1 },
    },
    _pendingForceCloseRivalry: { pairKey: '1-2', factionAId: 1, factionBId: 2 }, // 旧セーブの残骸
  };
  delete G._pendingFactionEvent;
  // 週の抽選の派閥イベント(F07 等)が先に立つと決着判定は来週に回り、メンバーの出入りで合成の派閥が
  // 3人を割ると消滅する。配線だけを見るため、この週は抽選とメンバーの出入りを止める
  const origPick = Engine.factions.pickWeeklyEvent;
  const origMembers = Engine.factions.processWeeklyMemberChanges;
  Engine.factions.pickWeeklyEvent = () => ({ eventId: null });
  Engine.factions.processWeeklyMemberChanges = (st) => st;
  let out;
  try { out = Engine.tickWeek(G).state; } finally {
    Engine.factions.pickWeeklyEvent = origPick;
    Engine.factions.processWeeklyMemberChanges = origMembers;
  }
  const fe = out._pendingFactionEvent;
  assert.ok(fe && fe.eventId === 'F06_FORCE', `F06_FORCE が立っていない: ${JSON.stringify(fe && fe.eventId)}`);
  assert.strictEqual(fe.payload.pairKey, '1-2');
  assert.strictEqual(fe.payload.pointsA, 62);
  assert.strictEqual(fe.payload.pointsB, 41);
  assert.strictEqual(fe.payload.leaderAId, map.get(1));
  assert.strictEqual(fe.payload.leaderBId, map.get(3));
  assert.ok(fe.payload.weeks >= 40, `週数 ${fe.payload.weeks}`);
  assert.ok(!out.factionRivalryPoints['5-6'], '同じ週の自然沈静化が進んでいない');
  assert.strictEqual(out._pendingForceCloseRivalry, undefined, '旧い印が残っている');
});

section('裁定4 A 和解させる: 記録を閉じ(F06_RECONCILE)・両方向 hostility -30・勝者敗者の効果なし・入力を書き換えない', () => {
  const s = twoEntryState();
  const payload = Engine.factions.buildF06ForcePayload(s, { pairKey: '1-2' });
  assert.ok(payload && payload.pointsA === 62 && payload.pointsB === 41 && payload.weeks === 40, JSON.stringify(payload));
  const before = clone(s);
  const r = Engine.factions.applyF06ForceChoice(s, payload, 'A', null);
  assert.deepStrictEqual(s, before, '入力の状態が書き換わった');
  const o = r.state;
  assert.ok(!o.factionRivalryPoints['1-2'], '記録が残っている');
  assert.ok(o.factionRivalryPoints['5-6'], '別の記録まで消えた');
  assert.strictEqual(hostOf(o, 1, 2), 60 + CFG.forceCloseHostilityDecayOnA);
  assert.strictEqual(hostOf(o, 2, 1), 55 + CFG.forceCloseHostilityDecayOnA);
  const tl = o.factionTimeline[o.factionTimeline.length - 1];
  assert.strictEqual(tl.type, 'RIVALRY_CLOSED');
  assert.strictEqual(tl.reason, 'F06_RECONCILE');
  assert.ok(tl.winnerFactionId == null && tl.loserFactionId == null, '和解に勝者・敗者が付いた');
  // 勝者敗者の効果なし(§5.4): 勢い・信頼・勝者の集客ボーナス・敗者の寝返り倍率は動かない
  assert.deepStrictEqual(o.factions.map(f => f.momentum), before.factions.map(f => f.momentum));
  assert.deepStrictEqual(o.roster.map(c => c.trust), before.roster.map(c => c.trust));
  assert.ok(!o._factionAppealBoost && !o._factionDefectionBoost, '勝者/敗者の効果が付いた');
  // §5.3 決着後の即時再発火防止(F08/F09 のクールダウン)
  const nowAbs = Engine.factions._absWeek(o);
  assert.strictEqual(o.factionEventCooldowns[Engine.factions._f08Key(1, 2)].lastTriggeredWeek, nowAbs);
  assert.strictEqual(o.factionEventCooldowns[Engine.factions._f09Key(1, 2)].lastTriggeredWeek, nowAbs);
  assert.ok(r.resultText && r.resultText.includes('一派') && r.resultText.includes('三派'), r.resultText);
});

section('裁定4 B 続けさせる: ポイント維持・次の判定は選んだ週から +20週', () => {
  const s = twoEntryState();
  const payload = Engine.factions.buildF06ForcePayload(s, { pairKey: '1-2' });
  const r = Engine.factions.applyF06ForceChoice(s, payload, 'B', null);
  const e = r.state.factionRivalryPoints['1-2'];
  assert.strictEqual(e.pointsA, 62);
  assert.strictEqual(e.pointsB, 41);
  assert.strictEqual(e.forceCloseDeferredUntil, nowAbsOf(s) + CFG.forceCloseDelayWeeks);
  assert.strictEqual(e.forceCloseExtensions, 1);
  assert.strictEqual(hostOf(r.state, 1, 2), 60, 'B で対立度が動いた');
  // 19週後は出ない / 20週後に再び2択
  const later = (weeks) => {
    const t = clone(r.state);
    delete t.factionRivalryPoints['5-6'];
    const abs = nowAbsOf(s) + weeks;
    t.season = Math.floor((abs - 1) / 52) + 1; t.week = abs - (t.season - 1) * 52;
    return Engine.factions.checkRivalryResolution(t, null);
  };
  const r19 = later(CFG.forceCloseDelayWeeks - 1);
  assert.ok(!r19 || !r19.forceClose, `延長中に2択が出た: ${JSON.stringify(r19)}`);
  const r20 = later(CFG.forceCloseDelayWeeks);
  assert.ok(r20 && r20.forceClose && r20.forceClose.pairKey === '1-2', `延長の終わりに2択が出ない: ${JSON.stringify(r20)}`);
  // 延長中も先取100は最優先で決まる
  const t = clone(r.state);
  t.factionRivalryPoints['1-2'].pointsA = CFG.pointsResolutionThreshold;
  const rp = Engine.factions.checkRivalryResolution(t, null);
  assert.strictEqual(rp.reason, 'POINTS');
});

section('裁定4: 出してから選ぶまでに記録/派閥が消えていたら何もしない(pending の自浄)', () => {
  const s = twoEntryState();
  const payload = Engine.factions.buildF06ForcePayload(s, { pairKey: '1-2' });
  const gone = clone(s); delete gone.factionRivalryPoints['1-2'];
  assert.strictEqual(Engine.factions.isF06ForceStillValid(gone, payload), false);
  const r1 = Engine.factions.applyF06ForceChoice(gone, payload, 'A', null);
  assert.ok(r1.skipped && r1.state === gone, '消えた記録に適用した');
  const remade = clone(s); remade.factionRivalryPoints['1-2'].startedWeek += 1; // 同じ組で作り直された記録
  assert.strictEqual(Engine.factions.isF06ForceStillValid(remade, payload), false, '作り直された記録を同じものとみなした');
  const noFaction = clone(s); noFaction.factions = noFaction.factions.filter(f => f.id !== 2);
  assert.strictEqual(Engine.factions.isF06ForceStillValid(noFaction, payload), false);
  assert.strictEqual(Engine.factions.buildF06ForcePayload(noFaction, { pairKey: '1-2' }), null, '消えた派閥で payload を組んだ');
});

section('一言の表: 先行側/追う側とも、7つの口調×7つの性格のどれでも同じ口調の一言が引ける', () => {
  const ARCH = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
  const PERS = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
  for (const [tname, table] of [['AHEAD', FACTION_F06_FORCE_AHEAD_LINES], ['BEHIND', FACTION_F06_FORCE_BEHIND_LINES]]) {
    for (const a of ARCH) {
      assert.ok(table[a] && Array.isArray(table[a].normal) && table[a].normal.length > 0, `${tname}.${a}.normal が無い(口調が標準へ落ちる)`);
      for (const p of PERS) {
        const line = Engine.factions.getFactionLine(table, { archetype: a, personality: p }, null);
        assert.ok(line && line.length >= 5 && line.length <= 70, `${tname} ${a}×${p}: ${line}`);
        const own = (table[a][p] || table[a].normal);
        assert.ok(own.includes(line), `${tname} ${a}×${p} が別の口調の一言になった: ${line}`);
      }
    }
  }
});

section('画面とヘッドレスが F06_FORCE を扱う(app.js / ui-common.js / auto-sim / headless-sim)', () => {
  const app = readSource('src', 'app.js');
  const body = app.slice(app.indexOf("} else if (eventId === 'F06_FORCE') {"), app.indexOf("} else if (eventId === 'F07') {"));
  assert.ok(body.length > 0, 'handleFactionEvent に F06_FORCE の分岐が無い');
  assert.ok(/Engine\.factions\.isF06ForceStillValid\(G, payload\)/.test(body), '出す前に有効か確かめていない');
  assert.ok(/showFactionF06ForceModal\(payload, G,/.test(body), '2択の画面を出していない');
  assert.ok(/Engine\.factions\.applyF06ForceChoice\(G, payload, choiceId, rng\)/.test(body), '選択をエンジン経由で反映していない');
  assert.ok(/F06_FORCE:\s*\{ src: FACTION_AUDIO\./.test(app), 'BGM の割り当てが無い');
  const ui = readSource('src', 'ui-common.js');
  const modal = ui.slice(ui.indexOf('function showFactionF06ForceModal('), ui.indexOf('// F07 v0.4'));
  assert.ok(modal.length > 0, 'showFactionF06ForceModal が無い');
  assert.ok(/_isPopupActive\(\)\) \{ _popupQueue\.push/.test(modal), 'ほかのポップアップの後ろに並ばない');
  assert.ok(/fevt-overlay-office/.test(modal) && !/fevt-overlay-stage/.test(modal), 'いつものモーダル(Office)になっていない');
  assert.ok(!/fevt-quote/.test(modal), '下段クリームパネル(.fevt-quote)を使っている');
  assert.ok(/let decided = false;/.test(modal) && /if \(decided\) return;/.test(modal), '二度押しを防いでいない');
  assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(modal), 'ハードコード16進カラーがある');
  for (const f of [['test', 'auto-sim.js'], ['test', 'ui-walkthrough', 'fixtures', 'headless-sim.js']]) {
    const src = readSource(...f);
    assert.ok(/fe\.eventId === 'F06_FORCE'/.test(src) && /applyF06ForceChoice/.test(src), `${f.join('/')} が F06_FORCE を処理しない`);
  }
});

if (failed > 0) {
  console.log(`\n${failed} 件 FAIL`);
  process.exit(1);
}
console.log('\nfaction-f06-force-close-test: ALL PASS');
