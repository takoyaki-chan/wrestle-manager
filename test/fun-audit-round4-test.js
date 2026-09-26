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

// ── 7. 怪我による引退と突然の退団をログに1行(英語つき) ──
// K-1 第3段: 実プレイの試合後の処理は App._finalizeShowImpl → Engine.show.finalize(logStyle: 'structured')
function finalizeShowBody() {
  return require('./helpers/show-paths.js').appShowBody();
}
const EN_TEMPLATES = (() => {
  const src = readSource('src', 'lang-en-templates.js');
  const dict = {};
  const sandbox = { WM_I18N: { addDict(o) { Object.assign(dict, o); } } };
  require('vm').runInNewContext(src, sandbox);
  return dict;
})();

section('7: ログの文(テンプレ)— 怪我による引退2型・突然の退団2型。事実だけを書き、英訳がある', () => {
  const T = GAMELOG_TEMPLATES;
  assert.ok(T.injury_retirement && T.sudden_departure, 'GAMELOG_TEMPLATES に injury_retirement / sudden_departure が無い');
  const text = (type, data) => gameLogEntryText({ type, data, s: 2, w: 14 });
  assert.strictEqual(text('injury_retirement', { name: 'A', age: 26, variant: 'wear' }), '🏁 A(26歳)が度重なる怪我により引退');
  assert.strictEqual(text('injury_retirement', { name: 'A', age: 24, variant: 'careerEnding' }), '🏁 A(24歳)が試合中の重傷により引退');
  assert.strictEqual(text('sudden_departure', { name: 'B', variant: 'org', orgName: 'X' }), '🚪 Bが突然退団し、Xへ移籍した');
  assert.strictEqual(text('sudden_departure', { name: 'B', variant: 'free' }), '🚪 Bが突然退団し、フリーとなった');
  // ログのタブの分類: 既存の引退の行(シーズン)・移籍の行(イベント)にそろえる
  assert.deepStrictEqual(gameLogEntryCategory({ type: 'injury_retirement', data: {} }), ['season']);
  assert.deepStrictEqual(gameLogEntryCategory({ type: 'sudden_departure', data: {} }), ['event']);
  // 英訳(テンプレ辞書)
  [T.injury_retirement.wear, T.injury_retirement.careerEnding, T.sudden_departure.org, T.sudden_departure.free].forEach(ja => {
    const en = EN_TEMPLATES[ja];
    assert.ok(typeof en === 'string' && en && !/[぀-ヿ一-鿿]/.test(en), `英訳が無い/日本語が残る: ${ja} => ${en}`);
  });
});

section('7: 実プレイ(_finalizeShowImpl)が怪我による引退・突然の退団の行をログに積む(行き先は処理後の状態から)', () => {
  const body = finalizeShowBody();
  // K-1 第3段: ログの行は Engine.show.finalize の log('injury_retirement', …) / 構造化ログの sudden_departure
  // (実プレイは logStyle: 'structured')
  assert.ok(/log\('injury_retirement'/.test(body) && /if \(res\.retired\)/.test(body), '怪我による引退の行を積んでいない');
  assert.ok(/logStyle: 'structured'/.test(body), '実プレイが構造化ログを選んでいない');
  assert.ok(/type: 'sudden_departure'/.test(body) && /Engine\.show\.suddenDepartureDestination\(s, d\.id\)/.test(body), '突然の退団の行を積んでいない');
  // 行き先の引き方: 他団体のロスターにいればその団体名、それ以外は null(フリー)
  const app = readSource('src', 'app.js');
  const start = app.indexOf('  _suddenDepartureDestination(');
  assert.ok(start >= 0, 'App._suddenDepartureDestination が無い');
  assert.ok(/return Engine\.show\.suddenDepartureDestination\(state, fighterId\);/.test(app.slice(start, app.indexOf('\n  },', start))),
    'App._suddenDepartureDestination が興行後のログと同じ関数を使っていない');
  const realGetOrgName = Engine.contract._getOrgName;
  Engine.contract._getOrgName = (id, st) => (st.rivalOrgNames || {})[id] || id;
  try {
    const st = { aiOrgs: { kings: { roster: [{ id: 5 }] }, glow: { roster: [] } }, rivalOrgNames: { kings: 'KINGS' }, freeAgents: [{ id: 6 }] };
    assert.strictEqual(JSON.stringify(Engine.show.suddenDepartureDestination(st, 5)), JSON.stringify({ orgId: 'kings', orgName: 'KINGS' }));
    assert.strictEqual(Engine.show.suddenDepartureDestination(st, 6), null);
  } finally {
    Engine.contract._getOrgName = realGetOrgName;
  }
  // 退団のトーストも実際の行き先で書く(判定時の区分=人気40以上だけで書かない)
  const toast = app.slice(app.indexOf('  _showSuddenDepartureToasts('), app.indexOf('\n  },', app.indexOf('  _showSuddenDepartureToasts(')));
  assert.ok(/App\._suddenDepartureDestination\(G, d\.id\)/.test(toast), '退団のトーストが実際の行き先を見ていない');
});

// ── 8. 信頼15未満の前兆 ──
function trustState(pairs, extra) {
  // pairs: [[id, prevTrust, curTrust], ...]
  const roster = pairs.map(([id, , cur], i) => ({ id, name: `S${id}`, archetype: ['standard', 'cool', 'ojousama', 'delinquent'][i % 4], personality: 'normal', trust: cur, injury: null }));
  const prev = {};
  pairs.forEach(([id, p]) => { prev[id] = p; });
  return { season: 2, week: 10, rngSeed: 4242, roster, relationships: {}, aiOrgs: {}, _glimpseAPrevValues: {}, _glimpseAPrevTrust: prev, ...(extra || {}) };
}
function countingRng(seed) {
  const r = Engine.rng.create(seed);
  let calls = 0;
  const realFloat = Engine.rng.float;
  return {
    rng: r,
    run(fn) {
      Engine.rng.float = (x) => { if (x === r) calls++; return realFloat(x); };
      const realRandom = Math.random;
      let mr = 0;
      Math.random = () => { mr++; return realRandom(); };
      try { return { out: fn(), calls, mathRandom: mr }; }
      finally { Engine.rng.float = realFloat; Math.random = realRandom; }
    },
  };
}

section('8: 信頼15を割った週に「退団を決めかけている」噂。20と同じ週に両方をまたいだら1回にまとめる', () => {
  const th = GLIMPSE_A_THRESHOLDS.find(t => t.id === 'trust_below_15');
  assert.ok(th, 'GLIMPSE_A_THRESHOLDS に trust_below_15 が無い');
  assert.strictEqual(th.tone, 'danger', '道場の確定枠・ログの1行は danger 級だけ');
  // 18 → 13: 15 だけをまたぐ(20 は前にまたぎ済み)/ 25 → 12: 20 と 15 を同じ週に / 25 → 17: 20 だけ
  const s = trustState([[1, 18, 13], [2, 25, 12], [3, 25, 17]]);
  const c = countingRng(99);
  const { out, calls, mathRandom } = c.run(() => Engine.glimpse.checkALayer(s, c.rng));
  const of = (id) => out.glimpses.filter(g => g.speakerId === id).map(g => g.type).sort();
  assert.deepStrictEqual(of(1), ['trust_below_15'], '15 だけをまたいだ選手に噂が出ない');
  assert.deepStrictEqual(of(2), ['trust_below_15'], '同じ週に 20 と 15 をまたいだら 15 の噂1回にまとめる');
  assert.deepStrictEqual(of(3), ['trust_below_20'], '20 だけをまたいだ選手の噂が変わった');
  // まとめた 20 の発火の記録は残す(あとで 20 の噂が遅れて出ない)
  assert.ok(out.state._glimpseAFired['trust_trust_below_20_2'] && out.state._glimpseAFired['trust_trust_below_15_2'], '発火の記録が残っていない');
  // 乱数: 15 は抽選しない(率1.00)。引くのは 20 をまたいだ2人の2回だけ(以前と同じ回数)
  assert.strictEqual(calls, 2, `共有の乱数を引いた回数が変わった(${calls})`);
  // 15 のセリフの文選びは Math.random を使わない(20 の2人ぶんの2回だけ)
  assert.strictEqual(mathRandom, 2, `Math.random を引いた回数が変わった(${mathRandom})`);
  // 同じ状態なら同じ一言(専用の種)
  const again = Engine.glimpse.checkALayer(s, Engine.rng.create(99)).glimpses.find(g => g.speakerId === 1);
  assert.strictEqual(again.dialogue, out.glimpses.find(g => g.speakerId === 1).dialogue, '同じ状態で一言が変わる');
  // 翌週: 13 → 11(もう 15 の下)なら出直さない。26 まで戻ってから 14 に落ちたら出直す(再武装は 15+10 を超えたら)
  const next = { ...out.state, week: 11, roster: out.state.roster.map(f => (f.id === 1 ? { ...f, trust: 11 } : f)) };
  assert.strictEqual(Engine.glimpse.checkALayer(next, Engine.rng.create(1)).glimpses.filter(g => g.speakerId === 1).length, 0, '15 の下のまま噂が出直した');
});

section('8: 道場の一言はアーキタイプごとに書き分け(実在の34セル)。全選手がアーキタイプを保ったまま引ける', () => {
  const table = GLIMPSE_A_LINES.trust_below_15;
  assert.ok(table, 'GLIMPSE_A_LINES.trust_below_15 が無い');
  const ARCH = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
  ARCH.forEach(a => assert.ok(table[a] && Array.isArray(table[a].normal) && table[a].normal.length, `${a} のノーマルが無い`));
  let cells = 0;
  ARCH.forEach(a => { cells += Object.keys(table[a]).length; });
  assert.strictEqual(cells, 34, `実在の34セルぶん書いていない(${cells})`);
  const lines20 = new Set();
  const walk = (n) => { if (typeof n === 'string') lines20.add(n); else if (n && typeof n === 'object') Object.values(n).forEach(walk); };
  walk(GLIMPSE_A_LINES.trust_below_20);
  ALL_CHARS.forEach(f => {
    const pool = getDialoguePool(table, f);
    const own = Object.values(table[f.archetype || 'standard'] || {}).flat();
    pool.forEach(l => {
      assert.ok(own.includes(l), `#${f.id} ${f.name}(${f.archetype})がほかのアーキタイプの一言を引く: ${l}`);
      assert.ok(!lines20.has(l), `20 の噂と同じ一言: ${l}`);
    });
  });
});

section('8: ログの1行 — 20 は以前と同じ文、15 は「決めかけている」。英訳・ラベルの英訳がある', () => {
  const text = (variant) => gameLogEntryText({ type: 'trust_departure_rumor', data: { name: 'C', variant }, s: 2, w: 10 });
  assert.strictEqual(text('below20'), '💬 Cが退団を考えているという噂がある', '20 の噂の文が以前と変わった');
  assert.strictEqual(text('below15'), '💬 Cが退団を決めかけているという噂がある');
  const T = GAMELOG_TEMPLATES.trust_departure_rumor;
  [T.below20, T.below15].forEach(ja => {
    const en = EN_TEMPLATES[ja];
    assert.ok(typeof en === 'string' && en && !/[぀-ヿ一-鿿]/.test(en), `英訳が無い/日本語が残る: ${ja}`);
  });
  // エンジン(tickWeek)は噂を {type,data} で積み、15 の噂は below15
  const mgmt = readSource('src', 'management.js');
  assert.ok(/type: 'trust_departure_rumor'/.test(mgmt) && /g\.type === 'trust_below_15' \? 'below15' : 'below20'/.test(mgmt), 'tickWeek が噂の行を積んでいない');
  assert.ok(!/退団を考えているという噂がある`\)/.test(mgmt), '文字列の噂のログが残っている');
});

if (failed > 0) {
  console.log(`\nfun-audit-round4-test: ${failed} 件の FAIL`);
  process.exit(1);
}
console.log('\nfun-audit-round4-test: ALL PASS');
