'use strict';

// 年間表彰式はオフシーズン第1週へ遷移した後に開く。背面の週送りがもう一度
// 発火すると dismissAllPopups → Engine.advanceWeek の順で式典を消し、第2週へ
// 飛ぶため、App/UI双方に進行ロックを置く。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const ui = read('src/ui-common.js');

function appMethod(name) {
  const needle = `  ${name}(`;
  const start = app.indexOf(needle);
  assert.ok(start >= 0, `${name} が見つからない`);
  const tail = app.slice(start + needle.length);
  const next = tail.search(/\n  [A-Za-z_$][\w$]*\([^\n]*\) \{/);
  assert.ok(next >= 0, `${name} の終端が見つからない`);
  return app.slice(start, start + needle.length + next);
}

function uiFunction(name) {
  const needle = `function ${name}(`;
  const start = ui.indexOf(needle);
  assert.ok(start >= 0, `${name} が見つからない`);
  const next = ui.indexOf('\nfunction ', start + needle.length);
  assert.ok(next > start, `${name} の終端が見つからない`);
  return ui.slice(start, next);
}

const activeCheck = appMethod('_isAwardsStageActive');
assert.ok(activeCheck.includes('App._annualAwardsCeremonyActive'),
  'DOM表示前のキュー待ちも守る transient フラグが無い');
assert.ok(activeCheck.includes('G?._annualAwardsCeremonyPending'),
  '式典途中で再読込したセーブを守る永続フラグが無い');
assert.ok(activeCheck.includes("document.getElementById('awardsOverlay')"),
  '実際に開いている awardsOverlay のフォールバック検出が無い');
assert.ok(activeCheck.includes("typeof window._awardsNext === 'function'"),
  '同じオーバーレイを別用途で誤検出しない進行ハンドラ確認が無い');

for (const name of ['advanceCurrentFlow', 'advanceFromWeekSummary', 'advanceWeek', 'processWeek']) {
  const body = appMethod(name);
  const guardAt = body.indexOf("App._guardAwardsStage?.('");
  const dismissAt = body.indexOf('dismissAllPopups()');
  const engineAt = body.indexOf('Engine.advanceWeek(G)');
  assert.ok(guardAt >= 0, `${name} に表彰式ロックが無い`);
  if (dismissAt >= 0) assert.ok(guardAt < dismissAt, `${name} はポップアップ消去より前に止める必要がある`);
  if (engineAt >= 0) assert.ok(guardAt < engineAt, `${name} は週更新より前に止める必要がある`);
}

const awards = appMethod('_checkAndShowAwards');
const lockAt = awards.indexOf('App._annualAwardsCeremonyActive = true;');
const showAt = awards.indexOf('showAwardsCeremony(pendingAwards, finishAwardsCeremony');
assert.ok(lockAt >= 0 && showAt > lockAt, '表彰式を開く前（キュー待ちを含む）にロックしていない');
assert.ok(/if \(awardsCeremonyFinished\) return;[\s\S]*?App\._annualAwardsCeremonyActive = false;/.test(awards),
  '完了処理の一回化、または完了時のロック解除が無い');
assert.ok(awards.includes('App._annualAwardsAdvanceBlockedUntil = Date.now() + 1000;'),
  '終了クリックが背面の第2週ボタンへ抜けるのを防ぐ終了直後シールドが無い');
assert.ok(awards.includes('_annualAwardsCeremonyPending:'),
  '式典の完走前に再開可能な状態を保存していない');
assert.ok(!awards.includes('const { pendingAwards: _, ...cleanG } = G;'),
  '式典を開く前にpendingAwardsを消しており、中断時に再開できない');
assert.ok(/pendingAwards: _finishedAwards,[\s\S]*?_annualAwardsCeremonyPending: _finishedStage,[\s\S]*?lastAwards: pendingAwards/.test(awards),
  'pendingAwardsと再開フラグを最終スライド完了時にだけ消していない');
assert.ok(/catch \(e\) \{[\s\S]*?App\._annualAwardsCeremonyActive = false;[\s\S]*?throw e;/.test(awards),
  '描画失敗時にロックを解除していない');

const ceremony = uiFunction('showAwardsCeremony');
assert.ok(/let finished = false;[\s\S]*?function nextSlide\(\) \{\s*if \(finished\) return;/.test(ceremony),
  '最終ボタン連打で onDone が二重発火する');
assert.ok(/function finishCeremony\([^)]*\) \{\s*if \(finished\) return;\s*finished = true;[\s\S]*?btnNext\.disabled = true;[\s\S]*?if \(inputGate\) inputGate\.dispose\(btnNext\);[\s\S]*?if \(onDone\) onDone\(\);/.test(ceremony),
  '終了コールバックより前にボタンを無効化していない');
assert.ok(ceremony.includes('inputGate = _awCreateInputGate'),
  '表彰式の次へボタンに連打・キーrepeat防止ゲートが接続されていない');
assert.ok(ceremony.includes("completionTimer = setTimeout(() => finishCeremony('timeout')"),
  '入力経路喪失時に年末進行を再開する時限保険がない');
const activeAt = ceremony.indexOf("overlay.classList.add('active');");
const focusAt = ceremony.indexOf('btnNext.focus({ preventScroll: true })');
assert.ok(activeAt >= 0 && focusAt > activeAt,
  '表彰式を開いた後、背面の週送りから「次へ」へフォーカスを移していない');
// #aw-btn-next は静的DOMの使い回しで、finishCeremony が disabled=true を残す。
// 開くときに解除しないと、セッション2年目以降の式典が押せない「✕ 閉じる」ボタンで
// 開いて進行不能になる(v1.31実機報告)。
assert.ok(ceremony.indexOf('btnNext.disabled = false;', activeAt) > activeAt,
  '式典を開くときに前回の式典が残した disabled を解除していない');
assert.ok(ceremony.indexOf("btnNext.classList.remove('disabled')", activeAt) > activeAt,
  '式典を開くときに .disabled クラスを剥がしていない');
assert.ok(/btnNext\.textContent = TOTAL === 1 \? '✕ 閉じる' : '次へ　→';/.test(ceremony.slice(activeAt)),
  '式典を開くときにボタン文言を初期スライド用に戻していない');

const showScreen = uiFunction('showScreen');
assert.ok(showScreen.indexOf("App._guardAwardsStage('showScreen:' + id)") < showScreen.indexOf('dismissAllPopups()'),
  '背面ナビが表彰式を消す前にブロックされていない');

const dismiss = uiFunction('dismissAllPopups');
assert.ok(dismiss.indexOf('App._isAwardsStageActive()') < dismiss.indexOf('_POPUP_OVERLAY_IDS.forEach'),
  '共通ポップアップ消去が進行中の表彰式を消せてしまう');

const resume = appMethod('_resumeInterruptedAnnualAwards');
assert.ok(resume.includes('G?.offWeek === 2 && !completedThisSeason'),
  '旧バグで第2週へ飛んだセーブを検出していない');
assert.ok(resume.includes('App._recoverPendingAwards()') && resume.includes('App._safeAwardsChain();'),
  '失われた表彰データを復元して式典へ戻す経路が無い');
const recover = appMethod('_recoverPendingAwards');
assert.ok(recover.includes('G.offWeek < 1 || G.offWeek > 2'),
  '復旧範囲が第1〜2週に限定されていない');

const resumeContext = {
  G: { offSeason:true, offWeek:2, season:7, lastAwards:{ season:6 } },
  window: {},
  document: { getElementById() { return null; } },
  Storage: { autoSave() {} },
};
let recovered = 0;
let resumed = 0;
resumeContext.App = {
  _annualAwardsCeremonyActive: false,
  _repairCompletedAnnualAwards() { return false; },
  _annualAwardsCompletedThrough(state) { return Number(state?.lastAwards?.season) || 0; },
  _recoverPendingAwards() {
    recovered += 1;
    resumeContext.G = { ...resumeContext.G, pendingAwards:{ season:7 } };
    return true;
  },
  _safeAwardsChain() { resumed += 1; },
};
const callableResume = vm.runInNewContext(
  `({${resume.trim().replace(/,$/, '')}})._resumeInterruptedAnnualAwards`, resumeContext
);
assert.strictEqual(callableResume.call(resumeContext.App, 'advanceWeek'), true,
  '第2週へ飛んだセーブから式典復旧を開始しない');
assert.strictEqual(recovered, 1, '失われたpendingAwardsを1回だけ復元していない');
assert.strictEqual(resumed, 1, '復元後の表彰チェーンを1回だけ開始していない');
assert.strictEqual(resumeContext.G._annualAwardsCeremonyPending.season, 7,
  '復旧した式典の永続進行フラグを保存していない');

// 静的な配線確認だけでは、実際のEnter repeatやsynthetic clickを再現できない。
// 純粋な入力ゲートを実行して、1ジェスチャーが必ず1枚以下になることを確認する。
const gateStart = ui.indexOf('function _awCreateInputGate(');
const gateEnd = ui.indexOf('\nfunction showAwardsCeremony(', gateStart);
assert.ok(gateStart >= 0 && gateEnd > gateStart, '_awCreateInputGate が見つからない');
const sandbox = {};
vm.runInNewContext(`${ui.slice(gateStart, gateEnd)}\nthis.makeGate = _awCreateInputGate;`, sandbox);
let clock = 0;
let advances = 0;
const gate = sandbox.makeGate(() => { advances += 1; }, { now: () => clock, minInterval: 320 });
const keyEvent = (repeat = false) => ({ key: 'Enter', repeat, preventDefault() {} });

gate.onKeyUp(keyEvent());
assert.strictEqual(advances, 0, '元画面で押したEnterのkeyupだけで1枚進んでしまう');
gate.onKeyDown(keyEvent());
gate.onKeyDown(keyEvent(true));
gate.onKeyDown(keyEvent(true));
assert.strictEqual(advances, 0, 'Enter長押しのrepeat中に進んでしまう');
gate.onKeyUp(keyEvent());
assert.strictEqual(advances, 1, 'Enterを1回離しても1枚進まない');
gate.onClick({ preventDefault() {} });
assert.strictEqual(advances, 1, 'keyup直後のsynthetic clickで二重に進む');
clock = 200;
gate.onClick({ preventDefault() {} });
assert.strictEqual(advances, 1, '短時間のダブルクリックで二重に進む');
clock = 321;
gate.onClick({ preventDefault() {} });
assert.strictEqual(advances, 2, '独立した次のクリックまで拒否している');

// フォーカス移動の途中で repeat 中の keydown から始まった場合(押下の追跡が無い)でも、
// keyup で抑止(Infinity)を必ず解くこと。解かないと以後のクリックが blur まで
// 恒久的に握り潰される(v1.31「閉じるが効かない」の副要因)。
clock = 1000;
gate.onKeyDown(keyEvent(true));
gate.onKeyUp(keyEvent());
assert.strictEqual(advances, 2, '追跡外のkeyupで進んでしまう');
clock = 1200;
gate.onClick({ preventDefault() {} });
assert.strictEqual(advances, 3, 'repeat開始のkeydown後、クリックが恒久的に握り潰される');

console.log('awards-ceremony-progression-lock-test: ok');
