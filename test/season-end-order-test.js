// season-end-order-test.js
//
// シーズン末の演出の**順序**を守る（2026-07-27 Keisuke）。
//
//   引退の【判断】 → 新聞 → エンディング判定 → 年末表彰式 → 引退の【あいさつ】 → シーズンレポート
//
// なぜこの順でなければならないか:
//
//   ・**引退の判断は表彰式より前**でなければならない。
//     殿堂入りの判定は `retiredFighters`（引退が**確定した**選手）だけを見ている。
//     引退を確定しないまま表彰式を作ると、**殿堂入りが静かに0件になる**。
//     実測（2026-07-27）: 殿堂入り相当36ポイントの選手で
//        引退を確定しない → 殿堂候補 0人
//        引退を確定した   → 殿堂候補 1人
//     例外は出ないので、壊れても気づけない。だからここで固定する。
//
//   ・**あいさつは表彰式の後**。旅立ちの一枚は締めくくりに置く。
//
//   ・**シーズンレポートは最後**。演出が終わるまで伏せる。
//
// 引退の一枚は「あいさつ」と「引き留めるかの判断」が同じ画面だったので、2段に割った。
// 枠はどちらも既存の mdl-b で、新しい画面は作っていない。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const ui = read('src/ui-common.js');
const uiRender = read('src/ui-render.js');
const mgmt = read('src/management.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== シーズン末の演出の順序 ===\n');

// ─────────────────────────────────────────────────────────────
// A. なぜ判断が先でなければならないか（依存の証拠）
// ─────────────────────────────────────────────────────────────

section('1. 殿堂入りは「引退が確定した選手」だけを見ている', () => {
  // ここが変わったら、この順序の前提そのものが変わる
  const src = (mgmt.match(/checkHallOfFame\(state\) \{[\s\S]*?\n  \},/) || [])[0];
  assert.ok(src, 'checkHallOfFame が見つからない');
  assert.ok(/state\.retiredFighters/.test(src),
    '殿堂の判定が retiredFighters を見ていない。前提が変わったので順序を見直すこと');
  assert.ok(!/state\.roster/.test(src),
    '殿堂の判定が在籍者も見るようになった。順序の前提を見直すこと');
});

section('2. 引退の確定が殿堂リストを作り直す', () => {
  // 引き留めで引退が取り消された場合も、ここで正しく反映される
  const src = (mgmt.match(/commitRetirements\(state[\s\S]*?\n  \},/) || [])[0] || mgmt;
  assert.ok(/pendingAwards: \{ \.\.\.s\.pendingAwards, hallOfFame: Engine\.awards\.checkHallOfFame\(s\) \}/.test(src),
    '引退確定後に殿堂リストを作り直していない');
});

// ─────────────────────────────────────────────────────────────
// B. 引退が2段に割れているか
// ─────────────────────────────────────────────────────────────

const showFn = (ui.match(/function showRetirementPopups[\s\S]*?\n\}/) || [])[0];
const renderFn = (ui.match(/function _renderRetirementPopup[\s\S]*?\n\}\n/) || [])[0];

section('3. 引退の見せ方に段がある', () => {
  assert.ok(showFn, 'showRetirementPopups が無い');
  assert.ok(/opts && opts\.phase === 'decision'/.test(showFn), '段を受け取っていない');
  assert.ok(/_retirementPopupPhase/.test(renderFn), '描画が段を見ていない');
});

section('4. 判断の段ではセリフを出さない', () => {
  // あいさつは表彰式の後にとっておく
  assert.ok(/const isDecision = _retirementPopupPhase === 'decision';/.test(renderFn),
    '段の分岐が無い');
  const decisionBlock = (renderFn.match(/isDecision\s*\?\s*`([\s\S]*?)`\s*\n\s*:/) || [])[1] || '';
  assert.ok(decisionBlock, '判断の段のHTMLが取り出せない');
  assert.ok(/_mdlBSoloStage\(f, null,/.test(decisionBlock),
    '判断の段でセリフを出している。あいさつは表彰式の後');
  assert.ok(!/careerHtml/.test(decisionBlock), '判断の段に軌跡まで出している');
});

section('5. 引き留められるのは判断の段だけ', () => {
  // あいさつの段でひっくり返せてはいけない（もう引退は確定している）
  assert.ok(/canRetain = r\.canRetain && !isInjury && _retirementPopupPhase === 'decision'/.test(renderFn),
    'あいさつの段でも引き留められる。確定済みの引退が覆る');
});

section('6. 新しい画面を作っていない', () => {
  // どちらの段も既存の mdl-b 枠
  ['_mdlBTitleBand', '_mdlBSoloStage', '_mdlBActions'].forEach(fn => {
    assert.ok(new RegExp(fn).test(renderFn), `${fn} を使っていない`);
  });
});

// ─────────────────────────────────────────────────────────────
// C. 呼ぶ順序
// ─────────────────────────────────────────────────────────────

section('7. 判断は表彰式より前に呼ばれる', () => {
  assert.ok(/showRetirementPopups\(pendingRetirements[\s\S]{0,1600}?\{ phase: 'decision' \}\)/.test(app),
    '季末の引退が判断の段で呼ばれていない');
  const at = app.indexOf('showRetirementPopups(pendingRetirements');
  const chainAt = app.indexOf('App._safeAwardsChain()', at);
  assert.ok(chainAt > at, '判断のあとに表彰式のチェーンが来ていない');
});

section('8. あいさつは表彰式の後に呼ばれる', () => {
  const fn = (app.match(/_showFarewellsThenReport\(\) \{[\s\S]*?\n  \},/) || [])[0];
  assert.ok(fn, '_showFarewellsThenReport が無い');
  assert.ok(/showRetirementPopups\(farewells, finish, \{ phase: 'farewell' \}\)/.test(fn),
    'あいさつの段で呼んでいない');
  // 表彰式の完了コールバックから呼ばれること
  const cer = app.indexOf('showAwardsCeremony(pendingAwards, () => {');
  assert.ok(cer > 0, 'showAwardsCeremony が見つからない');
  const body = app.slice(cer, cer + 1200);
  assert.ok(/_showFarewellsThenReport\(\)/.test(body),
    '表彰式のあとにあいさつへ繋がっていない');
});

section('9. 表彰式が無い年も同じ終わり方をする', () => {
  // 賞が無い年だけ、あいさつが出ないまま終わる、が起きないこと
  const at = app.indexOf('if (!pendingAwards) {');
  assert.ok(at > 0, '表彰式なしの分岐が見つからない');
  assert.ok(/_showFarewellsThenReport\(\)/.test(app.slice(at, at + 260)),
    '表彰式が無い年にあいさつが出ない');
});

section('10. あいさつは実際に引退した人だけ', () => {
  // 引き留めた選手が「旅立ち」を語ってはいけない
  assert.ok(/App\._pendingFarewells = pendingRetirements\.filter\(r => !retained\.has\(r\.fighter\.id\)\)/.test(app),
    '引き留めた選手を除いていない');
});

// ─────────────────────────────────────────────────────────────
// D. シーズンレポートは最後
// ─────────────────────────────────────────────────────────────

section('11. レポートは演出が終わるまで出さない', () => {
  assert.ok(/App\._seasonEndChainActive = true;/.test(app), '演出中の目印を立てていない');
  const fn = (app.match(/_showFarewellsThenReport\(\) \{[\s\S]*?\n  \},/) || [])[0];
  assert.ok(/App\._seasonEndChainActive = false;/.test(fn),
    '目印が下ろされない。レポートが二度と出なくなる');
  assert.ok(/const seasonEndBusy = \(typeof App !== 'undefined' && App\._seasonEndChainActive\);/.test(uiRender)
    && /if \(offW <= 1 && !seasonEndBusy\)/.test(uiRender),
    'シーズン総括が演出中でも描かれる');
});

section('12. 目印を下ろしたら必ず描き直す', () => {
  const fn = (app.match(/_showFarewellsThenReport\(\) \{[\s\S]*?\n  \},/) || [])[0];
  assert.ok(/App\._seasonEndChainActive = false;[\s\S]{0,80}?refreshAll\(\);/.test(fn),
    '目印を下ろしたのに画面を更新していない。レポートが出ない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (12 sections)');
