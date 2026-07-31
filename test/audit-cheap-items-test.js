'use strict';

// task-58: 「2回押さないと進まない」監査(two-click-audit-v0.1.md)の「残り(未確認・低優先)」
// のうち、判断の要らない5件だけを潰した回。ソーステキストを機械的に検査する
// (week-advance-contract-test.js と同じ流儀: DOM/ブラウザ無しで静的に縛る)。
//
// 対象:
//   1. App.skipAllMatches の到達不能コード( if(false) とその外側のガード)を削除
//   2. App.stlAdvance に想定外phase用のelseを追加(エラー音+console.warn、進行不能にしない)
//   3. showTravelScene の正常系に時限の保険を追加(§5-D鉄則1)
//   4. renderTenchosenPreEvent の早期returnがキューを流すように修正
//   5. 動的オーバーレイ(war-victory-overlay/db-hof-detail-overlay/cerem-overlay)の
//      close経路すべてで _drainPopupQueue() を呼ぶように修正

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appSrc = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const uiSrc = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const renderSrc = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');

// ── ヘルパー: メソッド本体を切り出す( `  name() {` 〜 対応する `\n  },` ) ──
function sliceMethodBody(src, startAnchor, label) {
  const start = src.indexOf(startAnchor);
  assert.ok(start >= 0, `${label}: アンカーが見つからない (${startAnchor})`);
  const end = src.indexOf('\n  },', start);
  assert.ok(end >= 0, `${label}: メソッド終端 (\\n  },) が見つからない`);
  return src.slice(start, end);
}

// ── ヘルパー: トップレベル関数本体を切り出す( `function name(...) {` 〜 次の `\nfunction `直前 ) ──
function sliceTopLevelFunction(src, startIndexOrAnchor, label) {
  const start = typeof startIndexOrAnchor === 'number' ? startIndexOrAnchor : src.indexOf(startIndexOrAnchor);
  assert.ok(start >= 0, `${label}: アンカーが見つからない`);
  const rel = src.slice(start + 10).search(/\nfunction /);
  const end = rel >= 0 ? start + 10 + rel : src.length;
  return src.slice(start, end);
}

// ═══════════════════════════════════════════════════════════
// 1. App.skipAllMatches — 到達不能コードが残っていないこと
// ═══════════════════════════════════════════════════════════
{
  const body = sliceMethodBody(appSrc, '  skipAllMatches() {', 'skipAllMatches');
  // コメント(旧コードを引用して説明している行)を除いた「実コード」だけを検査対象にする。
  // week-advance-contract-test.js と同じ流儀(行コメントを丸ごと落として構文だけ見る)。
  const code = body.replace(/\/\/[^\n]*/g, '');
  assert.ok(!/if\s*\(\s*false\s*\)/.test(code),
    'skipAllMatches に到達不能な if (false) が実コードとして残っている');
  assert.ok(!/sp\.results\.some\(\s*r\s*=>\s*r\s*===\s*null\s*\)/.test(code),
    'skipAllMatches に到達不能な `sp.results.some(r => r === null)` ガードが実コードとして残っている'
    + '(sp.results は new Array(validMatches.length).fill(null) で作られ、'
    + '直前のforEachが全indexを埋め切るため、このガードは常にfalseにしかならない)');
  assert.ok(/App\.finalizeShow\(\);/.test(body),
    'skipAllMatches が finalizeShow を呼ばなくなっている(削除で正常系を壊した疑い)');
  assert.ok(/Audio\.play\('bellx3'\)/.test(body),
    'skipAllMatches の全試合終了サウンドが消えている(削除で正常系を壊した疑い)');
}

// ═══════════════════════════════════════════════════════════
// 2. App.stlAdvance — 想定外phase用のelseがあること
// ═══════════════════════════════════════════════════════════
{
  const body = sliceMethodBody(appSrc, '  stlAdvance() {', 'stlAdvance');
  assert.ok(/\}\s*else\s*\{/.test(body),
    'stlAdvance に table/finalReady/finalResult 以外を受ける else 分岐が無い'
    + '(想定外phaseで呼ばれると無言で何もしないまま)');
  // else節の中身だけを取り出して、エラー可視化+警告があることを確認する
  const elseStart = body.search(/\}\s*else\s*\{/);
  const elseBody = body.slice(elseStart);
  assert.ok(/Audio\.play\('error'\)/.test(elseBody),
    'stlAdvance の想定外phase分岐がエラー音を鳴らしていない(無言で落ちる)');
  assert.ok(/console\.warn\(/.test(elseBody),
    'stlAdvance の想定外phase分岐が console.warn していない(原因調査の手掛かりが残らない)');
  // 既存の正常系3分岐は変えていないことも確認
  assert.ok(/p\.phase === 'table'/.test(body) && /p\.phase === 'finalReady'/.test(body)
    && /p\.phase === 'finalResult'/.test(body),
    'stlAdvance の既存3分岐(table/finalReady/finalResult)の判定文が変わっている');
}

// ═══════════════════════════════════════════════════════════
// 3. showTravelScene — 正常系に時限の保険 + 二重発火防止フラグ
// ═══════════════════════════════════════════════════════════
{
  const body = sliceTopLevelFunction(uiSrc, 'function showTravelScene(opts, onDone) {', 'showTravelScene');
  assert.ok(/let\s+done\s*=\s*false;/.test(body),
    'showTravelScene に二重発火防止フラグ(done)が無い');
  assert.ok(/const\s+finish\s*=\s*\(\)\s*=>\s*\{\s*\n\s*if\s*\(done\)\s*return;/.test(body),
    'showTravelScene の finish() が done フラグで二重発火を防いでいない');
  // anim.onfinish = finish; の直後(正常系のtryブロック内)に時限の保険が無ければ検出
  const onfinishIdx = body.indexOf('anim.onfinish = finish;');
  assert.ok(onfinishIdx >= 0, 'showTravelScene から anim.onfinish = finish; が消えている');
  const afterOnfinish = body.slice(onfinishIdx, onfinishIdx + 600);
  assert.ok(/setTimeout\(/.test(afterOnfinish),
    'showTravelScene の正常系(anim.onfinish の直後)に setTimeout の保険が無い'
    + '(mockup-baseline-v0.1.md §5-D 鉄則1: 待ちには必ず時限の保険を掛ける)');
  assert.ok(/if\s*\(done\)\s*return;/.test(afterOnfinish),
    'showTravelScene の保険タイマーが done フラグを見ていない(二重発火の恐れ)');
  assert.ok(/console\.warn\(/.test(afterOnfinish),
    'showTravelScene の保険タイマーが console.warn していない(保険が作動したと分からない)');
  // 保険の時限がアニメーション所要時間(dur)に連動していること(固定の絶対値だけに頼っていない)
  assert.ok(/dur\s*\+\s*\d+/.test(afterOnfinish),
    'showTravelScene の保険タイマーが dur(実際のアニメーション所要時間)に連動していない');
}

// ═══════════════════════════════════════════════════════════
// 4. renderTenchosenPreEvent — 早期returnがキューを流すこと
// ═══════════════════════════════════════════════════════════
{
  const body = sliceTopLevelFunction(uiSrc, 'function renderTenchosenPreEvent() {', 'renderTenchosenPreEvent');
  assert.ok(/if\s*\(\s*!tp\s*\)\s*\{\s*_drainPopupQueue\(\);\s*return;\s*\}/.test(body),
    'renderTenchosenPreEvent の `if (!tp) return;` が _drainPopupQueue() を呼ぶ形になっていない。'
    + 'キューから取り出された後にデータが無いと、オーバーレイも開かずキューも流れず、'
    + '後ろに積まれた他のポップアップが止まる');
}

// ═══════════════════════════════════════════════════════════
// 5. 動的オーバーレイの close が _drainPopupQueue() を呼ぶこと
// ═══════════════════════════════════════════════════════════

// 5-a. war-victory-overlay 系(ui-common.js): 生きている4箇所
//   - _showWarVictoryChain の close(▶ボタン、次の勝利者セリフへ連鎖)
//   - _showWarEnemyAceStatement の close(敵エース一言、onDoneへ)
//   - showB3OpponentAftermath の close(mojibake版を上書きした「生きている」定義のみ。
//     文字化けした最初の定義は関数再宣言で完全にシャドウされ絶対に実行されないため対象外)
//   - _showJTImpressionChain の close(▶ボタン、次のコメントへ連鎖)
{
  const a = sliceTopLevelFunction(uiSrc, 'function _showWarVictoryChain(list, idx, onDone) {', '_showWarVictoryChain');
  assert.ok(/overlay\.remove\(\);[\s\S]*?_drainPopupQueue\(\);/.test(a),
    '_showWarVictoryChain の close ハンドラが overlay.remove() の後に _drainPopupQueue() を呼んでいない');

  const b = sliceTopLevelFunction(uiSrc, 'function _showWarEnemyAceStatement(onDone) {', '_showWarEnemyAceStatement');
  assert.ok(/overlay\.remove\(\);[\s\S]*?_drainPopupQueue\(\);/.test(b),
    '_showWarEnemyAceStatement の close ハンドラが overlay.remove() の後に _drainPopupQueue() を呼んでいない');

  const marker = uiSrc.indexOf('// Re-declare the B3 aftermath renderers');
  assert.ok(marker >= 0, 'showB3OpponentAftermath の再宣言マーカーコメントが見つからない'
    + '(コメント文言が変わったならこのテストのアンカーも合わせて直すこと)');
  const liveStart = uiSrc.indexOf('function showB3OpponentAftermath', marker);
  assert.ok(liveStart >= 0, '再宣言マーカーの後に showB3OpponentAftermath の定義が見つからない');
  const c = sliceTopLevelFunction(uiSrc, liveStart, 'showB3OpponentAftermath(live)');
  assert.ok(/overlay\.remove\(\);[\s\S]*?_drainPopupQueue\(\);/.test(c),
    '(生きている方の)showB3OpponentAftermath の close ハンドラが overlay.remove() の後に '
    + '_drainPopupQueue() を呼んでいない');

  const d = sliceTopLevelFunction(uiSrc, 'function _showJTImpressionChain(list, idx, onDone) {', '_showJTImpressionChain');
  assert.ok(/overlay\.remove\(\);[\s\S]*?_drainPopupQueue\(\);/.test(d),
    '_showJTImpressionChain の close ハンドラが overlay.remove() の後に _drainPopupQueue() を呼んでいない');
}

// 5-b. db-hof-detail-overlay 系: 背景クリック / ×ボタン / 閉じるボタン(ui-render.js) +
//      ESC共通ハンドラ(ui-common.js)。openChronicleForFighter は showScreen() 側の
//      dismissAllPopups() で既にキューが握り潰されるため必須ではないが、統一のため追加した。
{
  assert.ok(/modal\.onclick = e => \{ if \(e\.target === modal\) \{ modal\.remove\(\); _drainPopupQueue\(\); \} \};/.test(renderSrc),
    'showHofDetail の背景クリック close が _drainPopupQueue() を呼んでいない');

  const closeButtons = renderSrc.match(/this\.closest\('\.db-hof-detail-overlay'\)\.remove\(\);_drainPopupQueue\(\)/g) || [];
  assert.strictEqual(closeButtons.length, 2,
    `showHofDetail の ×/閉じる ボタン close が _drainPopupQueue() を呼んでいる箇所が${closeButtons.length}件`
    + '(期待2件: ×ボタン・閉じるボタン)');

  const chronicleBody = sliceTopLevelFunction(renderSrc, 'function openChronicleForFighter(fighterId) {', 'openChronicleForFighter');
  assert.ok(/overlay\.remove\(\);\s*_drainPopupQueue\(\);/.test(chronicleBody),
    'openChronicleForFighter の overlay.remove() が _drainPopupQueue() を呼んでいない');

  const escAnchorIdx = uiSrc.indexOf("const hofDetail = document.querySelector('.db-hof-detail-overlay');");
  assert.ok(escAnchorIdx >= 0, '_handleInfoOverlayEscClose の hofDetail 取得行が見つからない');
  const escWindow = uiSrc.slice(escAnchorIdx, escAnchorIdx + 150);
  assert.ok(/hofDetail\.remove\(\);\s*_drainPopupQueue\(\);/.test(escWindow),
    '_handleInfoOverlayEscClose の hofDetail.remove() が _drainPopupQueue() を呼んでいない'
    + '(ESCで閉じた場合だけキューが流れない抜け穴になる)');
}

// 5-c. cerem-overlay(showCeremonyEvent の closeCeremony): war-victory/db-hofと同型の
//      動的オーバーレイであり、詰まる経路は未確認だが保険として同じ扱いにした
{
  const start = appSrc.indexOf('function closeCeremony() {');
  assert.ok(start >= 0, 'closeCeremony が見つからない');
  const body = appSrc.slice(start, start + 400);
  assert.ok(/overlay\.remove\(\);[\s\S]*?_drainPopupQueue\(\);[\s\S]*?onContinue\(\);/.test(body),
    'closeCeremony が overlay.remove() → _drainPopupQueue() → onContinue() の順になっていない');
}

console.log('audit-cheap-items-test: ok');
