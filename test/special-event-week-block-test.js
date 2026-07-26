// special-event-week-block-test.js
//
// 特別興行の週に、**通常興行が二重に起きない**ことを守る。
//
// 2026-07-27 Keisuke 報告:
//   「天頂戦の後に通常興行が必ず行われて発火する。しかもその時だけ通常興行の題名がPPVになる」
//
// 原因は1つの取りこぼし。通常興行を塞ぐ判定が
//   春タッグ / 秋4団体戦 / 夏ジュニア  の3つしか無く、**天頂戦だけ抜けていた**。
//
//   const specialEventBlocked = stlBlocked || agwBlocked || jtBlocked;   // ← 天頂戦が無い
//
// 天頂戦の年の Week48 は、エンジン側が weekPhase を 'manage' に戻すので、
// 塞がないと通常の興行週として残る。さらに `isPPV(w)` は**週番号だけ**を見るため
// Week48 で無条件に true になり、その通常興行の見出しが「🏆 PPV」になっていた。
//
// 特別興行は5つある(冬は天頂戦とPPVの2種)。**1つ足すたびに3箇所を直す**構造なので、
// ここで「4大会が同じ扱いか」を機械的に見る。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const uiRender = read('src/ui-render.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

// 通常興行を奪う4大会。春(W12) / 夏(W24) / 秋(W36) / 冬・天頂戦(W48)
const EVENTS = [
  { name: '春タッグ',    guard: '_stlIsLeagueWeek', flag: 'stlBlocked', panel: '_stlBlockedShowPrepHtml' },
  { name: '秋4団体戦',   guard: '_agwIsEventWeek',  flag: 'agwBlocked', panel: '_agwBlockedShowPrepHtml' },
  { name: '夏ジュニア',  guard: '_jtIsEventWeek',   flag: 'jtBlocked',  panel: '_jtBlockedShowPrepHtml' },
  { name: '冬天頂戦',    guard: '_tcIsEventWeek',   flag: 'tcBlocked',  panel: '_tcBlockedShowPrepHtml' },
];

console.log('=== 特別興行の週に通常興行が二重に起きない ===\n');

section('1. 4大会すべてに週判定がある', () => {
  EVENTS.forEach(e => {
    assert.ok(new RegExp(`function ${e.guard}\\(`).test(uiRender),
      `${e.name}: ${e.guard} が無い。通常興行を塞げない`);
  });
});

section('2. 4大会すべてが「通常興行を奪う」一覧に入っている', () => {
  const line = uiRender.split('\n').find(l => l.includes('const specialEventBlocked ='));
  assert.ok(line, 'specialEventBlocked の行が見つからない');
  EVENTS.forEach(e => {
    assert.ok(line.includes(e.flag),
      `${e.name} が specialEventBlocked に入っていない。大会のあとに通常興行がもう一度起きる`);
  });
});

section('3. 4大会すべてが興行準備の画面も塞ぐ', () => {
  // 週の見出しだけ直しても、興行準備タブからカードを組めてしまう
  const at = uiRender.indexOf('function renderShowPrep()');
  assert.ok(at > 0, 'renderShowPrep が見つからない');
  const body = uiRender.slice(at, at + 3000);
  EVENTS.forEach(e => {
    assert.ok(new RegExp(`if \\(${e.guard}\\(\\)\\) \\{`).test(body),
      `${e.name}: 興行準備が塞がれていない`);
    assert.ok(new RegExp(`${e.panel}\\(\\)`).test(body),
      `${e.name}: 代わりに出す案内が無い`);
  });
});

section('4. 4大会すべてに「今週は◯◯」の案内がある', () => {
  EVENTS.forEach(e => {
    assert.ok(new RegExp(`function ${e.panel}\\(`).test(uiRender),
      `${e.name}: ${e.panel} が無い`);
  });
});

section('5. 週の見出しが4大会ぶん出し分かる', () => {
  const line = uiRender.split('\n').find(l => l.includes('let typeLabel ='));
  assert.ok(line, 'typeLabel の行が見つからない');
  EVENTS.forEach(e => {
    assert.ok(line.includes(e.flag + ' ?'),
      `${e.name}: 週の見出しが出ない。通常興行の見出しのままになる`);
  });
});

// ─────────────────────────────────────────────────────────────
// 天頂戦の年の Week48 は PPV ではない
// ─────────────────────────────────────────────────────────────

section('6. 天頂戦の年に「PPV」と表示しない', () => {
  // isPPV(w) は週番号だけを見るので、天頂戦の年でも Week48 で true になる。
  // これが今回「通常興行の題名がPPVになる」の正体だった
  const line = uiRender.split('\n').find(l => /const ppv = isPPV\(/.test(l));
  assert.ok(line, 'ppv 判定の行が見つからない');
  assert.ok(/!tcBlocked/.test(line),
    '天頂戦の年でも週番号だけで PPV と判定している。見出しが「🏆 PPV」になる');
});

section('7. 天頂戦の週判定はシーズンも見る', () => {
  // Week48 は毎年ある。4年に一度の年だけ塞ぐこと(毎年塞ぐと PPV が消える)
  const src = (uiRender.match(/function _tcIsEventWeek[\s\S]*?\n\}/) || [])[0];
  assert.ok(src, '_tcIsEventWeek が無い');
  assert.ok(/isTournamentSeason\(G\.season\)/.test(src),
    'シーズンを見ていない。天頂戦でない年まで PPV が塞がれる');
  assert.ok(/SHOW_WEEK/.test(src), '週番号を直書きしている');
  assert.ok(/!G\.ppvTournament\.cancelled|cancelled/.test(src),
    '不開催(選手不足)の年まで塞いでいる。通常興行に戻せなくなる');
});

section('8. 週番号を直書きしていない', () => {
  // 大会週が動いたときに、片方だけ古い数字が残るのを防ぐ
  EVENTS.forEach(e => {
    const src = (uiRender.match(new RegExp(`function ${e.guard}[\\s\\S]*?\\n\\}`)) || [])[0] || '';
    assert.ok(!/G\.week === (12|24|36|48)\b/.test(src),
      `${e.name}: 週番号が直書きされている`);
  });
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (8 sections)');
