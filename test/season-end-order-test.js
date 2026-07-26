// season-end-order-test.js
//
// シーズン末の演出の**順序**を守る。
//
//   引退（確定＋あいさつ） → 新聞 → エンディング判定 → 年末表彰式 → シーズン総括
//
// 2026-07-27 に二度直している。経緯を残す:
//
//   一度目: 「あいさつも表彰式の後に」というご要望で、引退の一枚を
//           「判断」と「あいさつ」の2段に割った。
//   二度目: **分ける必要はなかった**（Keisuke）。
//           「普通に表彰式の前に引退の挨拶を済ませてしまってよかったので、
//             引退の確定と引退の挨拶はもう続けてやるようにしましょう」
//           → 1枚に戻した。
//
// **動かせない線が2つある。**
//
//   1. 引退の確定は**表彰式より前**。
//      殿堂入りの判定は `retiredFighters`（引退が確定した選手）だけを見ている。
//      確定前に表彰式を作ると、**殿堂入りが静かに0件になる**。
//      実測（2026-07-27）: 殿堂入り相当36ポイントの選手で
//         引退を確定しない → 殿堂候補 0人 ／ 引退を確定した → 1人
//      例外は出ないので、壊れても気づけない。
//
//   2. シーズン総括は**いちばん最後**。
//      「最後に出すものは最後に出てくるようにしないといけない」（Keisuke）。
//      一度目の修正では目印を「引退者がいる年」の分岐の中でしか立てておらず、
//      **引退ゼロの年は表彰式より先に総括が見えていた**。目印は無条件に立てる。

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
// A. なぜ引退の確定が先でなければならないか（依存の証拠）
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
  assert.ok(/pendingAwards: \{ \.\.\.s\.pendingAwards, hallOfFame: Engine\.awards\.checkHallOfFame\(s\) \}/.test(mgmt),
    '引退確定後に殿堂リストを作り直していない');
});

// ─────────────────────────────────────────────────────────────
// B. 引退は1枚（確定＋あいさつ）
// ─────────────────────────────────────────────────────────────

const showFn = (ui.match(/function showRetirementPopups[\s\S]*?\n\}/) || [])[0];
const renderFn = (ui.match(/function _renderRetirementPopup[\s\S]*?\n\}\n/) || [])[0];

section('3. 引退は1枚にまとまっている', () => {
  assert.ok(showFn, 'showRetirementPopups が無い');
  assert.ok(!/opts/.test(showFn), '段を受け取る形が残っている。分ける必要は無かった');
  assert.ok(!/_retirementPopupPhase/.test(ui), '段の状態が残っている');
});

section('4. 1枚の中に、あいさつも引き留めも両方ある', () => {
  assert.ok(renderFn, '_renderRetirementPopup が無い');
  assert.ok(/text: r\.line/.test(renderFn), 'あいさつ（セリフ）が出ていない');
  assert.ok(/careerHtml/.test(renderFn), 'キャリアの軌跡が出ていない');
  assert.ok(/const canRetain = r\.canRetain && !isInjury;/.test(renderFn),
    '引き留めの条件が壊れている');
});

section('5. 新しい画面を作っていない', () => {
  ['_mdlBTitleBand', '_mdlBSoloStage', '_mdlBActions'].forEach(fn => {
    assert.ok(new RegExp(fn).test(renderFn), `${fn} を使っていない`);
  });
});

// ─────────────────────────────────────────────────────────────
// C. 呼ぶ順序
// ─────────────────────────────────────────────────────────────

section('6. 引退は表彰式より前に呼ばれる', () => {
  const at = app.indexOf('showRetirementPopups(pendingRetirements');
  assert.ok(at > 0, '季末の引退が呼ばれていない');
  const chainAt = app.indexOf('App._safeAwardsChain()', at);
  assert.ok(chainAt > at, '引退のあとに表彰式のチェーンが来ていない');
});

section('7. 引退の確定は表彰式の前に済む', () => {
  const at = app.indexOf('showRetirementPopups(pendingRetirements');
  const body = app.slice(at, app.indexOf('App._safeAwardsChain()', at));
  assert.ok(/Engine\.retirement\.commitRetirements\(G, confirmed\)/.test(body),
    '表彰式の前に引退を確定していない。殿堂入りが空になる');
});

section('8. 表彰式のあとは総括へ繋がる', () => {
  const cer = app.indexOf('showAwardsCeremony(pendingAwards, () => {');
  assert.ok(cer > 0, 'showAwardsCeremony が見つからない');
  const body = app.slice(cer, cer + 1200);
  assert.ok(/_showFarewellsThenReport\(\)/.test(body),
    '表彰式のあとに総括へ繋がっていない');
});

section('9. 表彰式が無い年も同じ終わり方をする', () => {
  const at = app.indexOf('if (!pendingAwards) {');
  assert.ok(at > 0, '表彰式なしの分岐が見つからない');
  assert.ok(/_showFarewellsThenReport\(\)/.test(app.slice(at, at + 260)),
    '表彰式が無い年に総括が出ない');
});

// ─────────────────────────────────────────────────────────────
// D. シーズン総括はいちばん最後
// ─────────────────────────────────────────────────────────────

section('10. 目印は無条件に立てる（引退ゼロの年が抜けない）', () => {
  // 一度目の修正では「引退者がいる年」の分岐の中でしか立てておらず、
  // 引退ゼロの年は表彰式より先に総括が見えていた
  const at = app.indexOf('App._seasonEndChainActive = true;');
  assert.ok(at > 0, '目印を立てていない');
  const retAt = app.indexOf('if (pendingRetirements && pendingRetirements.length > 0) {');
  assert.ok(retAt > 0, '引退の分岐が見つからない');
  assert.ok(at < retAt,
    '目印が「引退者がいる年」の分岐の中にある。引退ゼロの年に総括が先に見える');
});

section('11. 目印より先に画面を描かない', () => {
  // 目印を立てる前に refreshAll すると、その一瞬だけ総括が見える
  const at = app.indexOf('App._seasonEndChainActive = true;');
  const before = app.slice(Math.max(0, at - 700), at);
  assert.ok(!/\n\s*refreshAll\(\);/.test(before),
    '目印を立てる直前に画面を描いている。総括が一瞬見える');
});

section('12. 総括は目印が下りるまで描かれない', () => {
  assert.ok(/const seasonEndBusy = \(typeof App !== 'undefined' && App\._seasonEndChainActive\);/.test(uiRender)
    && /if \(offW <= 1 && !seasonEndBusy\)/.test(uiRender),
    'シーズン総括が演出中でも描かれる');
});

section('13. 目印を下ろしたら必ず描き直す', () => {
  const fn = (app.match(/_showFarewellsThenReport\(\) \{[\s\S]*?\n  \},/) || [])[0];
  assert.ok(fn, '_showFarewellsThenReport が無い');
  assert.ok(/App\._seasonEndChainActive = false;[\s\S]{0,120}?refreshAll\(\);/.test(fn),
    '目印を下ろしたのに画面を更新していない。総括が出ない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (13 sections)');
