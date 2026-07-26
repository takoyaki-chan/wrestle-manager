// match-next-label-test.js
//
// 試合が終わったあとの「次へ」ボタンの文言を統一で保つ。
//
// 2026-07-26 まで、**同じ動作に8つの言い方**があった:
//   進む / 戦況ボードへ / 次の試合へ / 次のカードへ / リーグ表へ戻る /
//   大会結果へ / 優勝発表へ / オフシーズンへ
//
// うち半分は**行き先の名前**（戦況ボード・リーグ表・大会結果）で、
// その画面を既に知っている人にしか通じない。「戦況ボードへ」が分かりにくいのはこれ。
//
// **「次の試合が続くのか、終わったのか」の二択**だけで書く。
// 大会が増えても崩れないので、新しい画面もこの2語から選ぶ。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const uiCommon = read('src/ui-common.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

// ヘルパーだけを取り出して評価する
const ctx = {};
vm.createContext(ctx);
new vm.Script(uiCommon.match(/function _matchNextLabel\([\s\S]*?\n\}/)[0]).runInContext(ctx);

console.log('=== 試合後の「次へ」文言 ===\n');

section('1. 文言は2語だけ', () => {
  assert.strictEqual(typeof ctx._matchNextLabel, 'function', '_matchNextLabel が無い');
  const set = new Set([ctx._matchNextLabel(true), ctx._matchNextLabel(false)]);
  assert.strictEqual(set.size, 2, '2語になっていない');
  assert.ok(ctx._matchNextLabel(false).includes('次の試合'), '続くときは「次の試合へ」');
  assert.ok(ctx._matchNextLabel(true).includes('結果'), '終わりのときは「結果へ」');
});

section('2. 行き先の名前で呼ばない（旧文言が復活していない）', () => {
  // 画面の固有名で呼ぶと、その画面を知らない人には意味が取れない
  const banned = ['戦況ボードへ', 'リーグ表へ戻る', '次のカードへ', '大会結果へ', '優勝発表へ'];
  banned.forEach(w => {
    assert.ok(!uiCommon.includes(`'${w} →'`),
      `「${w}」が復活している。行き先の名前ではなく、何が起きるかで書くこと`);
  });
});

section('3. 「進む」のような中身のない語を使わない', () => {
  assert.ok(!/nextLabel: *'進む →'/.test(uiCommon),
    '「進む」が復活している。いちばん多く見る画面なのに、いちばん何も言っていない');
  assert.ok(!/opts\.nextLabel \|\| '進む →'/.test(uiCommon), '既定値が「進む」に戻っている');
});

section('4. すべての大会がヘルパー経由で文言を決めている', () => {
  const calls = uiCommon.match(/nextLabel: *[^,\n]+/g) || [];
  assert.ok(calls.length >= 6, `nextLabel の指定が ${calls.length} 箇所。少なすぎる`);
  const raw = calls.filter(c => !/\_matchNextLabel\(/.test(c));
  assert.strictEqual(raw.length, 0,
    'ヘルパーを通さず直接書いている:\n        ' + raw.join('\n        '));
});

section('5. 既定値もヘルパー経由', () => {
  assert.ok(/opts\.nextLabel \|\| _matchNextLabel\(/.test(uiCommon),
    '既定値がヘルパーを通っていない。指定を忘れた画面だけ旧文言に戻る');
});

section('6. 通常興行は最終試合だけ「結果へ」になる', () => {
  // idx/total から自動で出し分ける。手で最終試合を指定すると必ずずれる
  const hits = uiCommon.match(/_matchNextLabel\(idx >= total - 1\)/g) || [];
  assert.strictEqual(hits.length, 2,
    `通常興行の出し分けが ${hits.length} 箇所。シングルとタッグの2箇所であるべき`);
});

section('7. 勝ち残り戦は常に「次の試合へ」（大会結果は別画面が持つ）', () => {
  const at = uiCommon.indexOf('秋団体戦 ・ ');
  assert.ok(at > 0, '秋4団体戦の結果表示が見つからない');
  const body = uiCommon.slice(at - 200, at + 300);
  assert.ok(/_matchNextLabel\(false\)/.test(body),
    '勝ち残り戦の途中で「結果へ」が出ている。まだ試合は続く');
});



// ─────────────────────────────────────────────────────────────
// 試合が決まった音（2026-07-26）
//   Keisuke「1試合目を勝ったときの音が無い」→ 調べたら**どの大会の結果も無音**だった。
//   共通の入口で鳴らすので、大会を足しても付け忘れない。
// ─────────────────────────────────────────────────────────────

const appJs = read('src/app.js');

section('8. 試合結果で音が鳴る（共通の入口で）', () => {
  const at = uiCommon.indexOf('function showEventMatchResultPopup(opts)');
  assert.ok(at > 0, 'showEventMatchResultPopup が見つからない');
  const body = uiCommon.slice(at, at + 1400);
  assert.ok(/Audio\.play\(/.test(body),
    '試合結果が無音のまま。個別の大会ではなく**共通の入口**で鳴らすこと');
  assert.ok(/boutWin/.test(body), '勝利音が鳴っていない');
});

section('9. 引き分けでは勝利音を鳴らさない', () => {
  const at = uiCommon.indexOf('function showEventMatchResultPopup(opts)');
  const body = uiCommon.slice(at, at + 1400);
  assert.ok(/winnerSide === 'draw' \? 'boutDraw' : 'boutWin'/.test(body),
    '引き分けでも勝利音が鳴る。嘘になる');
});

section('10. 1試合ごとの音は、大会の優勝ファンファーレより控えめ', () => {
  assert.ok(/boutWin\(\)/.test(appJs), 'boutWin が定義されていない');
  const m = appJs.match(/boutWin:\s*\.?([0-9.]+)/);
  const f = appJs.match(/matchVictoryFanfare:\s*\.?([0-9.]+)/);
  assert.ok(m && f, 'ミキサー音量が読めない');
  assert.ok(parseFloat('0.' + m[1].replace('.', '')) < parseFloat('0.' + f[1].replace('.', '')),
    `1試合ごとの音(${m[1]})が大会ファンファーレ(${f[1]})以上。何度も鳴るので控えめにすること`);
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (10 sections)');
