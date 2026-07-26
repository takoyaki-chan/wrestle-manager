// stuck-screen-regression-test.js
//
// 2026-07-26 Keisuke 報告「秋の4団体勝ち残り対抗戦がこの画面で止まる」の再発防止。
// 原因は2つあり、どちらも独立して起きる。
//
//   (1) showScreen() が興行準備タブだけ再描画しない
//       → #showPrepContent は一度書かれると誰も上書きしないので、週が進んでも
//         前の週の内容が残る。特別興行週のブロック表示はボタンを持たないため、
//         古いまま残ると「進めなくなった」ように見える。
//
//   (2) 開発ツールの早送りが秋4団体対抗戦を実行せずに捨てる
//       → エンジンは _pendingAutumnWarReplay を立てて処理をUIに委ねるだけ。
//         フラグを消すと大会が丸ごと行われないまま週だけ進み、champion も results も
//         空のまま autumnWarPhase だけ 'result' になる。
//
// 数値やDOM構造は固定しない。**経路が消えていないこと**だけを守る。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const uiCommon = read('src/ui-common.js');
const devTools = read('src/dev-tools.js');
const uiRender = read('src/ui-render.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 画面が止まる問題の再発防止 ===\n');

// ─────────────────────────────────────────────────────────────
// (1) 興行準備タブの再描画
// ─────────────────────────────────────────────────────────────

const showScreenAt = uiCommon.indexOf('function showScreen(id, evt)');
const showScreenBody = showScreenAt >= 0 ? uiCommon.slice(showScreenAt, showScreenAt + 4000) : '';

section('1. showScreen が興行準備タブを再描画する', () => {
  assert.ok(showScreenAt > 0, 'showScreen が見つからない');
  assert.ok(/id === 'show'[\s\S]{0,200}renderShowPrep\(\)/.test(showScreenBody),
    "showScreen に id === 'show' で renderShowPrep() を呼ぶ分岐が無い。" +
    '無いと #showPrepContent が前の週のまま残り、進めなくなったように見える');
});

section('2. showExec 中は興行準備を再描画しない（進行中のUIを壊さない）', () => {
  const m = showScreenBody.match(/id === 'show'[\s\S]{0,300}?renderShowPrep\(\);/);
  assert.ok(m, '再描画分岐が取れない');
  assert.ok(/manage/.test(m[0]) && /showPrep/.test(m[0]),
    "weekPhase を manage/showPrep に限定していない。showExec 中に上書きすると興行進行が壊れる");
});

section('3. 他の主要タブの再描画が消えていない', () => {
  ['ranking', 'roster', 'database', 'shachoshitsu', 'week'].forEach(id => {
    assert.ok(new RegExp(`id === '${id}'`).test(showScreenBody), `${id} の再描画が消えている`);
  });
});

section('4. renderShowPrep は非興行週・非該当フェーズを自分で弾く', () => {
  const at = uiRender.indexOf('function renderShowPrep()');
  assert.ok(at > 0, 'renderShowPrep が見つからない');
  const body = uiRender.slice(at, at + 900);
  assert.ok(/isShowWeek\(G\.week\)/.test(body) && /'manage', 'showPrep'/.test(body),
    'renderShowPrep 側のガードが消えている。showScreen から無条件に呼べなくなる');
});

section('5. 特別興行週のブロック表示は3種とも残っている', () => {
  ['_stlBlockedShowPrepHtml', '_agwBlockedShowPrepHtml', '_jtBlockedShowPrepHtml'].forEach(fn => {
    assert.ok(uiRender.includes(`function ${fn}`), `${fn} が無い`);
    assert.ok(new RegExp(`${fn}\\(\\)`).test(uiRender), `${fn} の呼び出し元が無い`);
  });
});

// ─────────────────────────────────────────────────────────────
// (2) 開発ツールの早送りが大会を実行する
// ─────────────────────────────────────────────────────────────

section('6. 開発ツールに秋4団体戦のヘッドレス消化がある', () => {
  assert.ok(/function resolveAutumnWarHeadless/.test(devTools),
    'resolveAutumnWarHeadless が無い');
  assert.ok(/simulateNextBout/.test(devTools),
    '試合を1フォールずつ進める呼び出しが無い＝大会を実行していない');
  assert.ok(/Engine\.autumnWar\.apply\(/.test(devTools),
    'apply() を呼んでいない＝結果が state に反映されない');
});

section('7. フラグを「消すだけ」の旧実装に戻っていない', () => {
  assert.ok(!/delete next\._pendingAutumnWarReplay;\s*next = \{ \.\.\.next, autumnWarPhase: 'result'/.test(devTools),
    '旧実装（大会を実行せずフラグを捨てて result を騙る）に戻っている');
});

section('8. 早送りループが目標週の判定より前に消化する', () => {
  const at = devTools.indexOf('function advanceOneDefault');
  assert.ok(at > 0, 'advanceOneDefault が見つからない');
  const body = devTools.slice(at, at + 2600);
  assert.ok(/resolveAutumnWarHeadless\(\{ \.\.\.Engine\.advanceWeek/.test(body),
    'advanceWeek 直後に消化していない。目標週で停止するとフラグが残ったままになる');
});

section('9. 春タッグ・ジュニアの自動消化も残っている（同型の取りこぼし防止）', () => {
  assert.ok(/springTagLeague\.confirmPlayerTeam/.test(devTools), '春タッグの自動編成が消えている');
  assert.ok(/juniorTournament\.apply/.test(devTools), 'ジュニアの自動消化が消えている');
});

// ─────────────────────────────────────────────────────────────
// (3) エンジン側: 大会が実際に完走できることを実機で確かめる
// ─────────────────────────────────────────────────────────────

section('10. 秋4団体戦がヘッドレスで champion まで完走する', () => {
  global.window = { IS_TRIAL: false };
  const srcDir = path.join(root, 'src');
  const load = f => {
    let code = fs.readFileSync(path.join(srcDir, f), 'utf-8')
      .replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '')
      .replace(/^(const|let) /gm, 'var ');
    new vm.Script(code, { filename: f }).runInThisContext();
  };
  ['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
   'management.js', 'match-engine.js', 'relationships.js'].forEach(load);

  let G = Engine.createInitialState(12345, true); // skipDraft=true（auto-sim と同じ入口）
  let guard = 0;
  while (!(G.week === Engine.autumnWar.EVENT_WEEK && !G.offSeason) && guard++ < 60) {
    G = { ...Engine.tickWeek(G).state, gameLog: [] };
    G = { ...Engine.advanceWeek(G).state, gameLog: [] };
    if (G.weekPhase === 'gameover') break;
  }
  assert.ok(G.week === Engine.autumnWar.EVENT_WEEK, `Week${Engine.autumnWar.EVENT_WEEK} に到達できない (week=${G.week})`);

  G = { ...Engine.tickWeek(G).state, gameLog: [] };
  G = { ...Engine.advanceWeek(G).state, gameLog: [] };
  assert.ok(G._pendingAutumnWarReplay,
    'Week36 を越えても _pendingAutumnWarReplay が立たない。UI/開発ツールが大会を開く手掛かりを失う');

  if (G.autumnWar && !G.autumnWar.session) {
    const ids = Engine.autumnWar._selectMembers(G, 'player');
    if (ids.length === Engine.autumnWar.TEAM_SIZE) {
      G = Engine.autumnWar.confirmPlayerTeam(G, ids, Engine.autumnWar._defaultOrder(G, 'player', ids));
    }
    G = { ...G, autumnWar: { ...G.autumnWar, autoReorderFinal: true } };
    G = Engine.autumnWar.startSession(G);
  }
  let g2 = 0;
  while (G.autumnWar && G.autumnWar.session && G.autumnWar.session.phase !== 'complete' && g2++ < 20) {
    G = G.autumnWar.session.phase === 'finalOrder'
      ? Engine.autumnWar.reorderForFinal(G, Engine.autumnWar.suggestFinalOrder(G, 'player'))
      : Engine.autumnWar.simulateNextBout(G).state;
  }
  assert.ok(G.autumnWar && G.autumnWar.session && G.autumnWar.session.phase === 'complete',
    `20手以内に決着しない (phase=${G.autumnWar && G.autumnWar.session && G.autumnWar.session.phase})`);
  G = Engine.autumnWar.apply(G, Engine.autumnWar.getProgress(G)).state;
  assert.ok(G.autumnWar.champion, 'apply 後も champion が空');
  assert.ok((G.autumnWar.results || []).length >= 3, `results が少なすぎる (${(G.autumnWar.results || []).length})`);
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (10 sections)');
