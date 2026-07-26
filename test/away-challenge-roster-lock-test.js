// away-challenge-roster-lock-test.js
//
// 遠征（挑戦試合）に出る選手を、同じ週の通常興行に**入れられないようにする**。
//
// 2026-07-27 Keisuke 報告:
//   「挑戦試合の興行週に、興行準備画面でおすすめ編成すると遠征選手が戻ってきてしまい、
//     挑戦試合がキャンセルされる」
//   「挑戦試合の後に通常興行がある場合、おすすめを選ぶと遠征隊も再登場できるので二重出場できる」
//
// 実測すると、原因は**除外セットが空になる場面が2つある**ことだった。
//
//   ① 特別興行週(W12)・PPV週(W48)
//      除外の判定が `isEligibleHomeShow` で絞られていた。あれは
//      「**この興行が挑戦試合を開催できるか**」の判定であって、
//      「選手が空いているか」とは別。特別興行週・PPV週で false になり、
//      おすすめ編成が遠征メンバーを呼び戻して**挑戦試合が中止**になっていた。
//
//   ② 遠征が終わった後
//      予約(_pendingAwayChallengeMatch)は試合が終わると消える。
//      予約だけを見ていたので、あとに続く通常興行に同じ選手が並び、
//      **同じ週に二重出場**していた。
//
// 直し方は「予約」と「出た事実」の両方を見ること。
// 出た事実はシーズンと週で持ち、**週が変われば解ける**。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const app = read('src/app.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 遠征メンバーを通常興行に入れない ===\n');

const src = (ui.match(/function getChallengeUnavailableIds[\s\S]*?\n\}/) || [])[0];

section('1. 除外セットを決める関数がある', () => {
  assert.ok(src, 'getChallengeUnavailableIds が無い');
});

section('2. 週の種類で除外をやめない', () => {
  // isEligibleHomeShow は「この興行が挑戦試合を開催できるか」。
  // 選手が空いているかとは別なので、除外の条件に混ぜてはいけない
  assert.ok(!/isEligibleHomeShow/.test(src),
    '除外を週の種類で絞っている。特別興行週・PPV週で遠征メンバーが呼び戻される');
  assert.ok(/const away = G && G\._pendingAwayChallengeMatch;[\s\S]{0,40}?if \(away\) \{/.test(src),
    '遠征の予約を無条件に見ていない');
});

section('3. 「今週すでに遠征に出た」も見る', () => {
  // 予約は試合が終わると消えるので、それだけでは二重出場を防げない
  assert.ok(/_awayChallengeUsedIds/.test(src), '出た事実を見ていない');
  assert.ok(/used\.season === G\.season && used\.week === G\.week/.test(src),
    'シーズンと週を照合していない。別の週まで縛る／別のシーズンに漏れる');
});

section('4. 出た事実は遠征の開始時に記録される', () => {
  assert.ok(/_awayChallengeUsedIds: \{ season: G\.season, week: G\.week, ids:/.test(app),
    '遠征を始めても出場記録が残らない');
  // 自団体側のIDだけを記録すること（相手団体の選手を縛らない）
  assert.ok(/booking\.requesterOrgId === 'player' \? booking\.teamAIds : booking\.teamBIds/.test(app),
    '自団体側のメンバーを取り出していない');
});

section('5. 3つのおまかせ編成すべてが除外セットを通る', () => {
  // ここを1つでも素通りさせると、その編成方式だけ穴が開く
  ['autoFillCard', 'autoFillCardByAppeal', 'autoFillCardByDraw'].forEach(fn => {
    const body = (ui.match(new RegExp(`function ${fn}\\(\\)[\\s\\S]*?\\n\\}`)) || [])[0];
    assert.ok(body, `${fn} が無い`);
    assert.ok(/_preserveTagSlots\(maxMatches\)/.test(body), `${fn}: 予約枠の保持を通っていない`);
    assert.ok(/!reservedIds\.has\(c\.id\)/.test(body), `${fn}: 除外セットで絞っていない`);
  });
  // 除外セットの出どころが1本であること
  const tag = (ui.match(/function _preserveTagSlots[\s\S]*?\n\}/) || [])[0];
  assert.ok(/const reservedIds = getChallengeUnavailableIds\(\);/.test(tag),
    '除外セットの出どころが共通になっていない');
});

section('6. 手動の選手一覧も同じ除外を使う', () => {
  // おまかせだけ塞いでも、手で並べれば同じことができてしまう
  const hits = (read('src/ui-render.js').match(/getChallengeUnavailableIds\(\)/g) || []).length;
  assert.ok(hits >= 2, `興行準備の一覧で ${hits} 箇所しか使っていない`);
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (6 sections)');
