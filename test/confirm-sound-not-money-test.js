// confirm-sound-not-money-test.js
//
// 2026-07-27: 「確定」「次へ」「閉じる」に**お金の音**を使わない。
//
// Keisuke「興行周りでの決定ボタンの中になんか『上昇』の音が入っているものがあって、
//          それがすごく気になりました」「上昇音がすごくいろんなところに聞こえていて、
//          変な感じがする」「むしろ上昇音のところはもう全部決定音にしてしまった方がいい」
//
// 正体は Audio.play('coin')（MG03 収入 = お金が入る上昇音）だった。
// 特別興行まわりの
//   ・チーム確定 / エントリー確定
//   ・次の試合へ / ボード送り
//   ・観戦を終えて結果へ / 結果画面を閉じる
// という**お金と何の関係もない操作**22箇所に付いていたため、進めるたびに鳴っていた。
//
// 守るもの:
//   1. coin(収入) は「お金が入る」場面だけ。確定・送り・閉じるでは鳴らさない
//   2. spend(支出) は「お金が出る」場面だけ
//   3. 決定音(UI01 = click / select)が確定・送りに使われている

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8').replace(/\r\n/g, '\n');
const lines = app.split('\n');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 確定・送り・閉じるにお金の音を使わない ===\n');

// その行の前後を見て「何をしている場面か」を推し量る手がかり
const CONTEXT = 6;
function around(i) {
  return lines.slice(Math.max(0, i - CONTEXT), i + 2).join('\n');
}

// お金が動いていることを示す語。これが近くにあれば coin/spend は妥当
const MONEY_HINT = /funds|cost|万\)|万`|prize|賞金|収入|支出|投資|報酬|払|revenue|amount/;
// 明らかに「進める・閉じる・確定する」操作であることを示す語
const FLOW_HINT = /phase\s*=|classList\.remove\('active'\)|currentWatching\s*=\s*-1|renderer|render[A-Z]|confirmPlayerTeam|EntryPicks|_mdlAClose|closeP|Advance|次へ/;

section('1. coin(収入) がお金と無関係な場所で鳴っていない', () => {
  const bad = [];
  lines.forEach((ln, i) => {
    if (!/Audio\.play\('coin'\)/.test(ln)) return;
    const ctx = around(i);
    if (!MONEY_HINT.test(ctx)) bad.push(`app.js:${i + 1}  ${ln.trim().slice(0, 60)}`);
  });
  assert.strictEqual(bad.length, 0,
    'お金が動いていない場所で収入音(coin)が鳴っている:\n        ' + bad.join('\n        '));
});

section('2. 観戦終了・結果表示・画面を閉じる操作で coin を鳴らさない', () => {
  const bad = [];
  lines.forEach((ln, i) => {
    if (!/Audio\.play\('coin'\)/.test(ln)) return;
    const ctx = around(i);
    if (/currentWatching\s*=\s*-1|phase\s*=\s*'matchResult'|classList\.remove\('active'\)/.test(ctx)) {
      bad.push(`app.js:${i + 1}  ${ln.trim().slice(0, 60)}`);
    }
  });
  assert.strictEqual(bad.length, 0,
    '観戦終了・結果表示・閉じる操作に収入音が戻っている:\n        ' + bad.join('\n        '));
});

section('3. チーム確定・エントリー確定は決定音で鳴る', () => {
  const targets = [
    ['confirmPlayerTeam(G, [...order], [...order])', '秋4団体対抗戦 チーム確定'],
    ['Engine.springTagLeague.confirmPlayerTeam(', '春のタッグリーグ チーム確定'],
    ['App._tcEntryPicks = null;', '天頂戦 エントリー確定'],
  ];
  for (const [needle, label] of targets) {
    const at = app.indexOf(needle);
    assert.ok(at > 0, `${label} の箇所が見つからない`);
    const chunk = app.slice(at, at + 400);
    assert.ok(/Audio\.play\('(select|click)'\)/.test(chunk),
      `${label}: 決定音(UI01)で鳴っていない`);
    assert.ok(!/Audio\.play\('coin'\)/.test(chunk),
      `${label}: 収入音に戻っている`);
  }
});

section('4. お金が出ていく場面で収入音を使っていない', () => {
  // コーチ枠拡張は「投資」。出ていく金なので支出(MG04)
  const at = app.indexOf('コーチ枠を${result.coachSlots}枠に拡張');
  assert.ok(at > 0, 'コーチ枠拡張の箇所が見つからない');
  const chunk = app.slice(at, at + 300);
  assert.ok(/Audio\.play\('spend'\)/.test(chunk),
    'コーチ枠拡張(投資)が支出音になっていない');
  assert.ok(!/Audio\.play\('coin'\)/.test(chunk),
    'コーチ枠拡張(投資)で収入音が鳴っている');
});

section('5. 台帳の対応が壊れていない（coin=収入 / spend=支出）', () => {
  const se = (app.match(/const SE_FILES = \{[\s\S]*?\n  \};/) || [''])[0];
  assert.ok(/coin:\s*'wm_se_mg03_v01\.ogg'/.test(se), 'coin が MG03(収入) を指していない');
  assert.ok(/spend:\s*'wm_se_mg04_v01\.ogg'/.test(se), 'spend が MG04(支出) を指していない');
  assert.ok(/click:\s*'wm_se_ui01_v01\.ogg'/.test(se), 'click が UI01(決定) を指していない');
  assert.ok(/select:\s*'wm_se_ui01_v01\.ogg'/.test(se), 'select が UI01(決定) を指していない');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
