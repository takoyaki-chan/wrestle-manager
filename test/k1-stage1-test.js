#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/k1-stage1-test.js — K-1「興行後の処理を一本化する」第1段の回帰ガード(2026-09-26)
//
//  ■ 何を守るか
//    1. K1-P01: tickWeek が入力の入れ子(逓減カウンターの項目・W-1 の累計回数・関係フラグの
//       クールダウン・ブレークスルー記録)をその場で書き換えない。結果画面の先読み tick が
//       本番 G と中身を共有したまま回っても、本番 G が変わらないための前提
//       (先読みには G の複製も渡している → 下の 4 で文面を確認)
//    2. §7 X09: 通常興行で歴代最高評価を更新したとき、勝者・敗者の経歴に mqAllTimeRecord が
//       ちょうど1件ずつ残る(後段の roster の書き戻しで消えていた)。刻み直しは冪等
//    3. 節目の台詞の二重表示: 興行週・PPV の週送りでも、週の一覧(weekLogFeed)を tickWeek の前に
//       空にする(processWeek と同じ)。空にしていなかったため、前週の垣間見えが翌週の道場にも残った
//    4. 先読み: prepareShowResultInlinePopups が G そのものではなく複製を tickWeek に渡す
//
//  実プレイ経路(E06/E07 と両経路の一致)は npm run test:k1:parity が見る。
//
//  ■ 使い方
//    node test/k1-stage1-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}
const clone = v => JSON.parse(JSON.stringify(v));

const origWarn = console.warn;
console.warn = () => {};
const BASE = advanceUntil({ seed: 42, until: g => g.season === 1 && g.week === 20 && g.weekPhase === 'manage' && !g.offSeason });
console.warn = origWarn;

function healthyPair(G) {
  const list = G.roster.filter(f => !f.injury && !f.isRental && !f.forcedRest).sort((a, b) => a.id - b.id);
  assert.ok(list.length >= 2, 'fixture needs 2 healthy fighters');
  return [list[0], list[1]];
}

console.log('K-1 第1段 回帰ガード');

// ── 1. tickWeek は入力の入れ子を書き換えない ──
section('P01: tickWeek が逓減カウンター・W-1 回数・フラグのクールダウン・ブレークスルー記録をその場で書き換えない', () => {
  const [a, b] = healthyPair(BASE);
  const absWeek = Engine.util.absWeek(BASE.season, BASE.week);
  const w1Key = `${Math.min(a.id, b.id)}_${Math.max(a.id, b.id)}`;
  const rel = { bond: 20, rivalry: 60 };
  const input = {
    ...clone(BASE),
    relationships: { ...clone(BASE.relationships || {}), [`${a.id}>${b.id}`]: { ...rel }, [`${b.id}>${a.id}`]: { ...rel } },
    // 減衰の条件を満たすカウンター(最後の加算から十分に時間が経っている)
    relationshipCounters: { ...clone(BASE.relationshipCounters || {}), [`${a.id}>${b.id}:k1test`]: { count: 2, lastWeek: absWeek - 60 } },
    w1FireCount: { [w1Key]: 2 },
    relationshipFlagCounters: { ...clone(BASE.relationshipFlagCounters || {}) },
    _pendingGrowthEvents: [{ type: 'breakthrough', fighterId: a.id, stat: 'pw', gain: 3 }],
  };
  // ブレークスルーの埋め込みスナップショットを確実に出す(抽選は別に回帰がある)
  const realGenerate = Engine.snapshot.generate;
  Engine.snapshot.generate = function (rng, s) {
    const r = realGenerate.call(this, rng, s);
    return { ...r, snapshots: [...r.snapshots, { embedded: true, source: 'breakthrough', fighterId: a.id, text: 'k1', tpl: 'k1', vars: {}, voiceLead: 'k1' }] };
  };
  const before = {
    relationshipCounters: clone(input.relationshipCounters),
    w1FireCount: clone(input.w1FireCount),
    relationshipFlagCounters: clone(input.relationshipFlagCounters),
    pendingGrowthEvents: clone(input._pendingGrowthEvents),
  };
  let out;
  try {
    out = Engine.tickWeek(input).state;
  } finally {
    Engine.snapshot.generate = realGenerate;
  }
  assert.deepStrictEqual(input.relationshipCounters, before.relationshipCounters, '入力の relationshipCounters が書き換わった');
  assert.deepStrictEqual(input.w1FireCount, before.w1FireCount, '入力の w1FireCount が書き換わった');
  assert.deepStrictEqual(input.relationshipFlagCounters, before.relationshipFlagCounters, '入力の relationshipFlagCounters が書き換わった');
  assert.deepStrictEqual(input._pendingGrowthEvents, before.pendingGrowthEvents, '入力の _pendingGrowthEvents の項目が書き換わった');
  // 戻り値の側には反映されている(処理そのものは従来どおり)
  assert.strictEqual(out.w1FireCount[w1Key], 3, 'W-1 の回数が戻り値で1増えていない');
  const decayed = out.relationshipCounters[`${a.id}>${b.id}:k1test`];
  assert.ok(decayed && decayed.count === 1 && decayed.lastWeek === absWeek, `逓減カウンターが戻り値で減っていない: ${JSON.stringify(decayed)}`);
  const bt = (out._pendingGrowthEvents || []).find(e => e.type === 'breakthrough' && e.fighterId === a.id);
  assert.ok(bt && bt.snapshotText === 'k1', 'ブレークスルー記録へのスナップショット台詞が戻り値に無い');
});

section('P01: 関係フラグのクールダウン付きの積み込みは、入力のクールダウン記録を書き換えない', () => {
  const counters = { 'k1:other': { lastWeek: 1 } };
  const s = { season: 3, week: 10, relationshipFlagCounters: counters, _modalQueue: [] };
  const out = Engine.relationships.flags._enqueueModalWithCooldown(s, 'M-19', { fromId: 1, toId: 2 }, 'k1:key', 26);
  assert.deepStrictEqual(counters, { 'k1:other': { lastWeek: 1 } }, '入力のクールダウン記録に書き込んだ');
  assert.ok(out.relationshipFlagCounters['k1:key'], '戻り値にクールダウンが無い');
  assert.strictEqual(out._modalQueue.length, 1, 'ポップアップが積まれていない');
});

// ── 2. 記録更新の経歴の刻印 ──
section('X09: updateRecord は careerStamp を返し、applyRecordCareerStamp は冪等', () => {
  const [a, b] = healthyPair(BASE);
  const s0 = { ...clone(BASE), mqRecord: { value: 1, holderIds: null } };
  const upd = Engine.mq.updateRecord(s0, { mq: 50 }, { holderIds: [a.id, b.id], orgId: 'player', stage: 'normal', matchType: 'singles', winnerId: a.id });
  assert.ok(upd.updated && upd.careerStamp, 'careerStamp が返らない');
  // updateRecord の中で一度刻まれている。もう一度呼んでも増えない
  const again = Engine.mq.applyRecordCareerStamp(upd.state, upd.careerStamp);
  const count = (G, id) => (G.roster.find(f => f.id === id).careerRecord.history || []).filter(e => e.type === 'mqAllTimeRecord').length;
  assert.strictEqual(count(again, a.id), 1);
  assert.strictEqual(count(again, b.id), 1);
  // 書き戻しで消えた状態(元の roster)から刻み直すと、1件ずつ入る
  const restored = Engine.mq.applyRecordCareerStamp({ ...upd.state, roster: s0.roster }, upd.careerStamp);
  assert.strictEqual(count(restored, a.id), 1);
  assert.strictEqual(count(restored, b.id), 1);
  const ev = restored.roster.find(f => f.id === a.id).careerRecord.history.find(e => e.type === 'mqAllTimeRecord');
  assert.strictEqual(ev.won, true);
  assert.strictEqual(ev.opponentId, b.id);
  // タッグは刻まない(記事だけ)
  const tag = Engine.mq.updateRecord({ ...s0, mqRecordTag: { value: 1 } }, { mq: 50 }, { holderIds: [a.id, b.id, 900, 901], matchType: 'tag', winnerIds: [a.id, b.id] });
  assert.strictEqual(tag.careerStamp, null);
});

section('X09: 通常興行(executeShow)で歴代最高評価を更新すると、勝者・敗者の経歴に1件ずつ残る', () => {
  const [a, b] = healthyPair(BASE);
  let G0 = { ...clone(BASE), mqRecord: { value: 1, holderIds: null, orgId: null, season: null, week: null, stage: null } };
  const card = Engine.util.normalizeShowCardForVenue([{ left: a.id, right: b.id, isTitle: false }], G0.week, 0);
  G0 = { ...G0, showVenue: 0, showCard: card, weekPhase: 'manage' };
  const res = Engine.executeShow(G0);
  assert.ok(res && !res.error, `executeShow failed: ${res && res.error}`);
  const S = res.state;
  assert.ok(S.mqRecord && S.mqRecord.value > 1, '記録が更新されていない');
  const holders = S.mqRecord.holderIds || [];
  const findAny = id => S.roster.find(f => f.id === id)
    || Object.values(S.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === id)
    || (S.freeAgents || []).find(f => f.id === id);
  holders.forEach(id => {
    const f = findAny(id);
    if (!f) return; // 突然の退団などで経歴の置き場が変わった場合は対象外
    const n = ((f.careerRecord && f.careerRecord.history) || []).filter(e => e.type === 'mqAllTimeRecord' && e.mq === S.mqRecord.value).length;
    assert.strictEqual(n, 1, `選手${id} の記録の経歴が ${n} 件`);
  });
});

// ── 3/4. 画面側(app.js)の文面 ──
section('節目の二重表示: 週送りの tickWeek のたびに weekLogFeed を空にしている(通常の週・興行週・PPV×2)', () => {
  const app = readSource('src', 'app.js');
  const lines = app.split('\n');
  const sites = [];
  lines.forEach((line, i) => {
    if (!/const result = Engine\.tickWeek\(G, \{ lang: WM_I18N\.lang, dict: WM_I18N\.t \}\);/.test(line)) return;
    // tickWeek の前で空にする(processWeek)か、直後に G を作り直すときに空にする(興行週・PPV)
    const before = lines.slice(Math.max(0, i - 8), i).join('\n');
    const afterAssign = lines.slice(i + 1, i + 16).find(l => /G = \{ \.\.\.result\.state,/.test(l)) || '';
    sites.push({ line: i + 1, ok: /G = \{ \.\.\.G, weekLogFeed: \[\] \};/.test(before) || /weekLogFeed: \[\]/.test(afterAssign) });
  });
  assert.ok(sites.length >= 4, `週送りの tickWeek が ${sites.length} か所しか見つからない(文面が変わった?)`);
  const bad = sites.filter(s => !s.ok).map(s => s.line);
  assert.deepStrictEqual(bad, [], `weekLogFeed を空にしていない週送り: app.js:${bad.join(', ')}`);
});

section('P01: 結果画面の先読みは G の複製を tickWeek に渡す', () => {
  const app = readSource('src', 'app.js');
  const start = app.indexOf('  prepareShowResultInlinePopups() {');
  assert.ok(start >= 0, 'prepareShowResultInlinePopups が見つからない');
  const body = app.slice(start, app.indexOf('\n  },', start));
  assert.ok(/structuredClone\(G\)/.test(body), '複製(structuredClone)を作っていない');
  assert.ok(!/_buildShowResultPreviewState\(G\)/.test(body), 'G そのものを先読みに渡している');
});

if (failed > 0) {
  console.log(`\nFAIL: ${failed} 件`);
  process.exit(1);
}
console.log('\nPASS');
