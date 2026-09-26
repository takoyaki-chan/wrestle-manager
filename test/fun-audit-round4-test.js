#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/fun-audit-round4-test.js — 総点検 第4回の確認 5〜8(2026-09-26 Keisuke 裁定)の回帰ガード
//
//  ■ 何を守るか
//    5. 関係性のポップアップ(M-1〜M-24)は出さないまま、たまり続ける列(G._modalQueue)だけ直す。
//       エンジンは tickWeek の末尾とセーブの読み込み時に、直近12週の項目だけ残す(pruneModalQueue)。
//       画面側の消費関数 _drainFlagModalQueue(window.G を見ていて一度も動いていなかった)は削除した
//
//  ■ 使い方
//    node test/fun-audit-round4-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n        ') : e)); }
}

const clone = (o) => JSON.parse(JSON.stringify(o));

// ── 5. 関係性のポップアップの列 ──
section('5: pruneModalQueue — 直近12週(今週を含む)の項目だけ残し、古い項目・壊れた項目を落とす。入力は書き換えない', () => {
  const F = Engine.relationships.flags;
  assert.strictEqual(typeof F.pruneModalQueue, 'function', 'Engine.relationships.flags.pruneModalQueue が無い');
  const ev = (season, week, type = 'M-19') => ({ type, payload: { fromId: 1, toId: 2 }, season, week, scope: 'own' });
  // 今 = 3季20週。窓は 3季9週〜20週(12週)
  const queue = [ev(1, 5), ev(2, 47), ev(3, 8), ev(3, 9), ev(3, 20), null, { type: 'M-1', payload: {} }, 'x'];
  const s = { season: 3, week: 20, offSeason: false, offWeek: 0, _modalQueue: queue, relModalWindow: [{ w: 1, own: 1, other: 0 }] };
  const before = clone(s);
  const out = F.pruneModalQueue(s);
  assert.deepStrictEqual(out._modalQueue.map(e => `${e.season}:${e.week}`), ['3:9', '3:20'], '窓の中(3季9週〜20週)だけ残る');
  assert.deepStrictEqual(s, before, '入力の状態・配列を書き換えた');
  assert.notStrictEqual(out._modalQueue, queue, '新しい配列で返していない');
  assert.deepStrictEqual(out.relModalWindow, s.relModalWindow, '件数の記録(relModalWindow)に触れた');
  // 落とすものが無ければ同じ状態をそのまま返す
  const fresh = { season: 3, week: 20, _modalQueue: [ev(3, 19), ev(3, 20)] };
  assert.strictEqual(F.pruneModalQueue(fresh), fresh, '落とすものが無いのに状態を作り直した');
  // 列が無い旧セーブ・壊れた値はそのまま(fail-open。_ensureInit が作る)
  const legacy = { season: 3, week: 20 };
  assert.strictEqual(F.pruneModalQueue(legacy), legacy);
  const broken = { season: 3, week: 20, _modalQueue: 'x' };
  assert.strictEqual(F.pruneModalQueue(broken), broken);
  // 季をまたぐ窓(4季2週 → 3季43週から。1季=通常48週+オフ4週=52週)
  const cross = F.pruneModalQueue({ season: 4, week: 2, _modalQueue: [ev(3, 41), ev(3, 42), ev(3, 43), ev(4, 1)] });
  assert.deepStrictEqual(cross._modalQueue.map(e => `${e.season}:${e.week}`), ['3:43', '4:1']);
});

section('5: tickWeek の末尾で列を縮める — 2季ぶん進めても、列には直近12週の項目しか残らない(以前は季をまたいで増え続けた)', () => {
  // 3季3週(興行なしの週)の頭で止め、その週の tickWeek を1回回した直後の列を見る
  const G0 = advanceUntil({ seed: 42, until: g => g.season === 3 && g.week === 3 && g.weekPhase === 'manage' && !g.offSeason });
  const G = Engine.tickWeek(G0).state;
  const q = G._modalQueue || [];
  const now = Engine.util.absWeekTotal(G.season, G.week, G.offSeason, G.offWeek);
  const old = q.filter(e => !(e && Number.isFinite(e.season) && Number.isFinite(e.week)
    && Engine.util.absWeekTotal(e.season, e.week, false, 0) > now - 12));
  assert.strictEqual(old.length, 0, `12週より古い項目が ${old.length}件残っている(列の長さ ${q.length})`);
  console.log(`        (3季3週の tickWeek 直後の列の長さ ${q.length}件)`);
});

section('5: セーブの読み込み(Storage.deserialize)で旧セーブの肥大した列を同じ規則で縮める', () => {
  const app = readSource('src', 'app.js');
  const start = app.indexOf('  deserialize(json) {');
  assert.ok(start >= 0, 'Storage.deserialize が見つからない');
  const body = app.slice(start, app.indexOf('repairOnLoad(G)', start));
  assert.ok(/Engine\.relationships\.flags\.pruneModalQueue\(G\)/.test(body), '読み込み時に pruneModalQueue を通していない');
});

section('5: 関係性のポップアップを出す経路は無い — _drainFlagModalQueue は削除、画面のコードは window.G を見ない', () => {
  // 行コメント(// 以降)は除いて見る(削除の経緯を書いた注記は残してよい)
  const code = (text) => text.split('\n').map(l => l.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');
  ['ui-common.js', 'app.js', 'ui-render.js'].forEach(f => {
    const src = code(readSource('src', f));
    assert.ok(!/function _drainFlagModalQueue\s*\(/.test(src), `${f} に _drainFlagModalQueue の定義が残っている`);
    assert.ok(!/_drainFlagModalQueue\s*\(\s*\)/.test(src), `${f} が _drainFlagModalQueue を呼んでいる`);
    assert.ok(!/window\.G\b/.test(src), `${f} が window.G を見ている(G は app.js の let 宣言で window に載らない)`);
  });
  // 組み立て関数は後日の「世界の側」の表示の材料として残す
  const ui = readSource('src', 'ui-common.js');
  ['const FLAG_MODAL_META', 'function _findFighterById(', 'function _flagBuildPopupOpts('].forEach(sig => {
    assert.ok(ui.includes(sig), `ui-common.js から ${sig} が消えている`);
  });
});

// ── 6. 引退の週は、本人の別れのポップアップを先に出す ──
// 画面の流れそのものは手動チェック node test/ui-walkthrough/injury-retire-departure-check.js(実UI)が見る。
// ここは closeShowResult の組み立て(文面)を押さえる
function closeShowResultBody() {
  const app = readSource('src', 'app.js');
  const start = app.indexOf('  closeShowResult() {');
  assert.ok(start >= 0, 'closeShowResult が見つからない');
  const end = app.indexOf('\n  },\n', start);
  return app.slice(start, end);
}
function appMethodBody(name) {
  const app = readSource('src', 'app.js');
  const start = app.indexOf(`  ${name}(`);
  assert.ok(start >= 0, `App.${name} が見つからない`);
  return app.slice(start, app.indexOf('\n  },\n', start));
}

section('6: 引退の週は別れのポップアップを週の表示の先頭で出し、ほかの表示は別れが閉じ切ってから始める', () => {
  const close = closeShowResultBody();
  assert.ok(/const farewells = \[\.\.\.pendingLastRunRetirements, \.\.\.pendingInjuryRetirements\]/.test(close), 'ラストランと怪我の引退をまとめた別れの一覧が無い');
  assert.ok(/App\._showFarewellsFirst\(farewells, afterFarewell\)/.test(close), 'closeShowResult が別れを先に出す App._showFarewellsFirst を呼んでいない');
  // 以前の出し方(節目・王座の式典の後に popupActions の中で出す)が残っていない
  assert.ok(!/popupActions\.push\([^\n]*showRetirementPopups/.test(close), '引退のポップアップがまだ popupActions の連鎖(通知の後)に入っている');
  // 別れの前に始まってはいけない表示の開始が、すべて whenFarewellDone に預けられている
  const deferred = [
    ['因縁の試合後コメント', /whenFarewellDone\(\(\) => setTimeout\(\(\) => showPostMatchDialogues/],
    ['引退でない怪我のポップアップ', /whenFarewellDone\(\(\) => setTimeout\(\(\) => \{\s*showEventPopup\(\{\s*type: 'fighter', id: ch\.id/],
    ['突然の退団のトースト', /whenFarewellDone\(\(\) => App\._showSuddenDepartureToasts\(/],
    ['節目・王座の式典・成長・因縁の連鎖', /whenFarewellDone\(\(\) => _chainEventPopupQueueEmpty\(runPopupActions\)\)/],
    ['派閥加入・アーキタイプ遷移', /whenFarewellDone\(\(\) => setTimeout\(\(\) => \{\s*App\._drainFactionJoinNotices\(\)/],
    ['大ニュース', /App\._maybeShowBigNewsPopup\(1200, whenFarewellDone\)/],
    ['派閥イベント・直訴(1.4秒後)', /whenFarewellDone\(\(\) => setTimeout\(\(\) => \{\s*if \(!G \|\| G\.weekPhase !== 'manage'\) return;/],
  ];
  deferred.forEach(([label, re]) => assert.ok(re.test(close), `${label}の開始が別れの後に預けられていない`));
  // 預けたものは、引退の無い週はその場で始める(従来どおり)
  assert.ok(/if \(holdForFarewell\) afterFarewell\.push\(start\);\s*else start\(\);/.test(close), '引退の無い週の扱いが変わっている');
});

section('6: App._showFarewellsFirst — 待ちに時限の保険と二重起動防止(§5-D 鉄則1)', () => {
  const body = appMethodBody('_showFarewellsFirst');
  assert.ok(/showRetirementPopups\(farewells, release\)/.test(body), '別れのポップアップが閉じ切ったら預けた表示を始める形になっていない');
  assert.ok(/if \(released\) return;\s*released = true;/.test(body), '預けた表示を二重に始めない印が無い');
  assert.ok(/FAREWELL_LOST_MS/.test(body) && /setTimeout\(watch, App\.FAREWELL_POLL_MS\)/.test(body), '別れが押し流されたときの時限の保険が無い');
  assert.ok(/setTimeout\(\(\) => \{\s*try \{\s*showRetirementPopups/.test(body), '週送りの全消去の後に開くタイマーに載っていない');
});

if (failed > 0) {
  console.log(`\nfun-audit-round4-test: ${failed} 件の FAIL`);
  process.exit(1);
}
console.log('\nfun-audit-round4-test: ALL PASS');
