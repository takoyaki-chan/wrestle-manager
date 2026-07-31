// season-end-order-test.js
//
// シーズン末の演出の**順序**を守る。
//
//   引退（確定＋あいさつ） → 新聞 → エンディング判定 → 年末表彰式 → シーズン総括
//
// 2026-07-27 に三度直している。経緯を残す:
//
//   一度目: 「あいさつも表彰式の後に」というご要望で、引退の一枚を
//           「判断」と「あいさつ」の2段に割った。
//   二度目: **分ける必要はなかった**（Keisuke）。
//           「普通に表彰式の前に引退の挨拶を済ませてしまってよかったので、
//             引退の確定と引退の挨拶はもう続けてやるようにしましょう」
//           → 1枚に戻した。
//   三度目: 「相変わらずシーズンレポートの前に年末総括が出て興ざめします」
//           「年末表彰式の後に総括は出してほしいよ」（Keisuke）。
//           **一度目・二度目とも直っていなかった。** 演出の呼ぶ順序は正しく、
//           問題は**総括を描く週**にあった（下記3）。
//
// **動かせない線が3つある。**
//
//   1. 引退の確定は**表彰式より前**。
//      殿堂入りの判定は `retiredFighters`（引退が確定した選手）だけを見ている。
//      確定前に表彰式を作ると、**殿堂入りが静かに0件になる**。
//      実測（2026-07-27）: 殿堂入り相当36ポイントの選手で
//         引退を確定しない → 殿堂候補 0人 ／ 引退を確定した → 1人
//      例外は出ないので、壊れても気づけない。
//
//   2. シーズン総括は**レポートの週(offWeek 1)にだけ描く**。
//      年度末ブリッジのステッパーが レポート→ドラフト→移籍→開幕 と名付けているとおり。
//      `offW <= 1` で offWeek 0 にも描いていたため、表彰式が終わった直後の offWeek 0 に
//      総括が出て、ボタンは「シーズンレポートへ →」とこれから見せると言い、
//      翌週もう一度同じものが出ていた。
//
//   3. **演出フラグで総括を伏せない**。
//      App._seasonEndChainActive は advanceWeek のたびに立ち、演出チェーンが完走した
//      ときにしか下りない作りだった。チェーンがどこかで待ちに入ると下りないまま残り、
//      逆に**レポートの週で総括が出てこなくなる**（実機で再現）。週で決め打つ方が壊れない。

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

// 三度目の修正(2026-07-27)。「相変わらずシーズンレポートの前に年末総括が出て興ざめします」
// 「年末表彰式の後に総括は出してほしいよ」（Keisuke）。
//
// 実機で追ったところ、原因は演出の順序ではなく**総括を描く週**だった。
//   ・`offW <= 1` で offWeek 0 にも描いていた。offWeek 0 は引退・新聞・表彰式が走る週で、
//     表彰式が終わった直後にそこへ総括が出る。しかもボタンは「シーズンレポートへ →」と
//     これから見せると言っており、翌週もう一度同じものが出る
//   ・伏せ札 App._seasonEndChainActive は advanceWeek のたびに立ち、演出チェーンが
//     完走したときにしか下りない。チェーンが待ちに入ると**レポートの週で総括が消えた**
//
// 年度末ブリッジのステッパーが レポート→ドラフト→移籍→開幕 と名前を付けているとおり、
// 総括はレポートの週(offWeek 1)のもの。週で決め打つ。

section('10. 総括は「レポートの週」だけに描く', () => {
  assert.ok(/if \(offW === 1 && !G\.pendingAwards\) \{\n\s*const review = Engine\.seasonReview\.build\(G\);/.test(uiRender),
    'シーズン総括の描画がレポートの週(offWeek 1)に固定されていない');
  assert.ok(!/if \(offW <= 1/.test(uiRender),
    'offWeek 0 にも総括を描いている。表彰式の直後に出てしまい、翌週もう一度出る');
  // 2026-07-31: 週だけでは足りない。ブレイクスルー等のポップアップで表彰式が一手遅れると、
  // その間ずっと背面に総括が見えていた。表彰式が消費する pendingAwards で伏せる。
  // これは _seasonEndChainActive のような別立てフラグではないので、伏せっぱなしにならない。
  assert.ok(/!G\.pendingAwards/.test(uiRender),
    '年末表彰式が済むまで総括を伏せていない。ポップアップの背面に総括が先に見える');
});

section('11. 伏せ札方式に戻していない', () => {
  // advanceWeek のたびに立って完走時にしか下りないフラグは、
  // 逆にレポートの週で総括を消す事故を起こす
  assert.ok(!/App\._seasonEndChainActive\s*=/.test(app),
    '_seasonEndChainActive が復活している。演出チェーンが待ちに入ると総括が出なくなる');
  assert.ok(!/seasonEndBusy/.test(uiRender.replace(/\/\/[^\n]*/g, '')),
    '総括の描画が演出フラグに依存している');
});

section('12. 週が進んだら必ず画面を描き直す', () => {
  // 描き直しが演出チェーン頼みだったため、チェーンが待ちに入ると前の週の画面が残り、
  // ステッパーもボタンの文言も1つ前のままになっていた（実機で offWeek 1 なのに
  // 「0/4」「シーズンレポートへ →」が出たまま）
  // 週送りの締めくくり（AI成長アラートの分岐）の**直前**に描き直しがあること。
  // 窓を広く取ると引退分岐など別の refreshAll を拾ってしまい、消しても気づけない
  const at = app.indexOf('if (aiAlerts.length > 0) {');
  assert.ok(at > 0, '週送りの締めくくり（aiAlerts の分岐）が見つからない');
  const before = app.slice(Math.max(0, at - 120), at);
  assert.ok(/refreshAll\(\);\s*$/.test(before.trim() + '\n'.repeat(0)) || /refreshAll\(\);\s*$/.test(before.replace(/\s+$/, '')),
    '週送りの直後に画面を描き直していない。前の週の画面（ステッパー・ボタン）が残る');
});

section('13. 演出が終わったら描き直す', () => {
  const fn = (app.match(/_showFarewellsThenReport\(\) \{[\s\S]*?\n  \},/) || [])[0];
  assert.ok(fn, '_showFarewellsThenReport が無い');
  assert.ok(/refreshAll\(\);/.test(fn),
    '演出の締めくくりで画面を更新していない');
});

section('14. 年末表彰式は総括より前の週で走る', () => {
  // 表彰式チェーンは週送り(advanceWeek)の中で起動する。総括はその次の週に描かれるので、
  // 「表彰式 → 総括」の順序はこの2つが別の週にあることで担保される
  const advAt = app.indexOf('  advanceWeek() {');
  assert.ok(advAt > 0, 'advanceWeek が見つからない');
  const advBody = app.slice(advAt, advAt + 7000);
  assert.ok(/_safeAwardsChain\(\)/.test(advBody),
    '表彰式チェーンが週送りの中で起動していない');
  // 総括側は「レポートの週」に固定されている（項目10）ので、両者は必ず別の週になる
  assert.ok(/if \(offW === 1\)/.test(uiRender),
    '総括の週が固定されていない。表彰式と同じ週に出る余地が残る');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log(`ALL PASS (14 sections)`);
