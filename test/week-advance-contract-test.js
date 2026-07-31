'use strict';

// 「ボタンを2回押さないと進まない」再発防止 (2026-07-31)
//
// task-48(b33519b) で _tryAutoAdvance の契約が変わった:
//   旧: 条件つきで true を返し、**自分で** showScreen/refreshAll まで済ませていた
//       → 呼び出し側は `if (App._tryAutoAdvance()) return;` でよかった
//   新: 常に true を返し、weekPhase='weekSummary' を置くだけで**何も描かない**
//       → 呼び出し側は続けて App.advanceFromWeekSummary() を呼ぶ義務がある
//
// このとき processWeek だけが直され、closeShowResult は旧来の形のまま残った。
// 結果、**毎週の興行結果を閉じるたびに状態だけ進んで画面が前のまま**になり、
// プレイヤーには「押しても何も起きない」→ もう一度押す、という症状になった。
//
// 契約違反は目視では見つからないので、呼び出し側の形を機械的に縛る。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const lines = app.split('\n');

// ── 1. _tryAutoAdvance は「常に true・描画しない」ままか ──
{
  const start = app.indexOf('  _tryAutoAdvance() {');
  assert.ok(start >= 0, '_tryAutoAdvance が見つからない');
  const body = app.slice(start, app.indexOf('\n  },', start));
  assert.ok(/return true;/.test(body), '_tryAutoAdvance が true を返していない');
  assert.ok(!/return false;/.test(body),
    '_tryAutoAdvance が false を返す形に戻っている。契約が変わったなら本テストごと見直すこと');
  assert.ok(!/showScreen\(|refreshAll\(/.test(body),
    '_tryAutoAdvance が自分で描画している。描画するなら呼び出し側の義務と二重になる');
}

// ── 2. すべての呼び出し側が advanceFromWeekSummary へ繋いでいるか ──
{
  const callSites = [];
  lines.forEach((line, i) => {
    if (!/App\._tryAutoAdvance\(\)/.test(line)) return;
    if (/^\s*(\/\/|\*)/.test(line)) return;          // コメント内の言及は除く
    if (/_tryAutoAdvance\(\) \{/.test(line)) return; // 定義そのもの
    callSites.push(i);
  });

  assert.ok(callSites.length >= 2,
    `_tryAutoAdvance の呼び出しが ${callSites.length} 件しか無い。検出方法が壊れている可能性`);

  callSites.forEach(i => {
    // 呼び出し行から数行のうちに advanceFromWeekSummary が来ること。
    const window = lines.slice(i, i + 5).join('\n');
    assert.ok(/App\.advanceFromWeekSummary\(\)/.test(window),
      `src/app.js:${i + 1} — _tryAutoAdvance を呼んだのに advanceFromWeekSummary へ繋いでいない。`
      + '\n  状態だけ weekSummary へ進んで画面が前のまま残り、'
      + '\n  プレイヤーには「押しても何も起きない」ように見える。'
      + `\n  該当行: ${lines[i].trim()}`);
    assert.ok(!/_tryAutoAdvance\(\)\)\s*return;\s*$/.test(lines[i].trim()),
      `src/app.js:${i + 1} — 旧来の \`if (App._tryAutoAdvance()) return;\` が残っている`);
  });
}

// ── 3. 専用フローの出口が今週画面へ戻す道を持っているか ──
{
  assert.ok(/returnToWeekScreen\(\) \{/.test(app),
    'App.returnToWeekScreen が無い。専用フローから抜ける共通の出口が必要');
  const start = app.indexOf('  returnToWeekScreen() {');
  const body = app.slice(start, app.indexOf('\n  },', start))
    .replace(/\/\/[^\n]*/g, ''); // コメント内の言及(「showScreen は使わない」)を拾わない
  assert.ok(!/showScreen\(/.test(body),
    'returnToWeekScreen が showScreen を使っている。'
    + 'showScreen は dismissAllPopups() を呼ぶので、重ねた演出オーバーレイごと消えてしまう');

  const scout = app.slice(app.indexOf('  scoutEventFinish() {'));
  const scoutBody = scout.slice(0, scout.indexOf('\n  },'));
  assert.ok(/App\.returnToWeekScreen\(\)/.test(scoutBody),
    'scoutEventFinish が今週画面へ戻していない。ドラフト結果の画面が残り、二度押しになる');
}

// ── 4. 専用画面の取り残しを描き直しのたびに直しているか ──
{
  const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(/function _reconcileDedicatedScreen\(\)/.test(render),
    '_reconcileDedicatedScreen が無い。出口ごとの戻し忘れを機械的に潰す仕組みが必要');
  assert.ok(/function refreshAll\(\) \{\n\s*_reconcileDedicatedScreen\(\);/.test(render),
    'refreshAll の先頭で _reconcileDedicatedScreen を呼んでいない');
}

console.log('week-advance-contract-test: ok');
