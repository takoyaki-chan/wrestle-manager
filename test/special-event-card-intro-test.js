// special-event-card-intro-test.js
//
// 左右に全身画像を並べる ppvmc-* の全カード紹介は、4年に3回の年度末PPV専用。
// 夏ジュニア・春タッグ・秋4団体戦・4年ごとの天頂戦は、それぞれの専用導入から
// 本編へ直接進み、この画面を共有しない。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const app = read('src/app.js');
const html = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 年度末PPV専用の全カード紹介 ===\n');

const coreSrc = (ui.match(/function _showPPVCardIntro[\s\S]*?\n\}/) || [])[0];
const ppvSrc = (ui.match(/function showPPVMatchCardIntro[\s\S]*?\n\}/) || [])[0];

section('1. PPV専用の描画部品だけが残る', () => {
  assert.ok(coreSrc, '_showPPVCardIntro が無い');
  assert.ok(/ppvmc-card/.test(coreSrc), 'PPV の既存カード枠を使っていない');
  assert.ok(!/function showSpecialEventCardIntro/.test(ui), '汎用特別興行の入口が残っている');
});

section('2. PPV用画面のCSSクラスは既存定義を使う', () => {
  const used = new Set();
  (coreSrc.match(/class="([^"$]+)"/g) || []).forEach(m => {
    m.slice(7, -1).replace(/\$\{[^}]*\}/g, '').trim().split(/\s+/).forEach(c => c && used.add(c));
  });
  const missing = [...used].filter(c => !html.includes('.' + c));
  assert.deepStrictEqual(missing, [], 'index.html に無いクラス: ' + missing.join(', '));
});

section('3. PPV以外のカード紹介アダプターは削除済み', () => {
  ['_showBracketCardIntro', '_showAutumnWarCardIntro', '_showSpringTagCardIntro'].forEach(fn => {
    assert.ok(!ui.includes(fn), `${fn} が ui-common.js に残っている`);
    assert.ok(!app.includes(fn), `${fn} の呼び出しが app.js に残っている`);
  });
});

section('4. ジュニアは専用導入から対戦表へ直接進む', () => {
  assert.ok(!app.includes('_jtOpenBracketWithCardIntro'), '旧カード紹介入口が残っている');
  assert.ok(/const toBoard = \(\) => renderJuniorTournamentBracket\(\);/.test(app),
    '招集後にジュニア対戦表へ直接進んでいない');
  assert.ok(/自団体の出場者ゼロでもトーナメント表は見せる\s*\n\s*renderJuniorTournamentBracket\(\);/.test(app),
    '自団体出場者ゼロの経路が対戦表へ直接進んでいない');
});

section('5. 秋4団体戦は会場入りから本編へ直接進む', () => {
  assert.ok(/const toBoard = \(\) => App\.initAutumnWarReplay\(\);/.test(app),
    '秋4団体戦が専用本編へ直接進んでいない');
  assert.ok(/showSpecialEventTravel\('autumnWar', G, party, toBoard\)/.test(app),
    '秋4団体戦の会場入り導線が消えている');
});

section('6. 春タッグと天頂戦にもPPV型紹介が無い', () => {
  assert.ok(!/_showSpringTagCardIntro\(stl/.test(app), '春タッグにPPV型紹介が混入している');
  assert.ok(/const toBracket = \(\) => renderTenchosenBracket\(\)/.test(app),
    '天頂戦が専用導入から対戦表へ直接進んでいない');
});

section('7. 年度末PPVだけがPPVカード描画を呼ぶ', () => {
  assert.ok(ppvSrc, 'showPPVMatchCardIntro が無い');
  assert.ok(/_showPPVCardIntro\(/.test(ppvSrc), 'PPVが専用カード描画を通っていない');
  assert.strictEqual((ui.match(/_showPPVCardIntro\(/g) || []).length, 2,
    'PPV専用描画の定義とPPV呼び出し以外に利用箇所がある');
  assert.strictEqual((app.match(/showPPVMatchCardIntro\(/g) || []).length, 1,
    '年度末PPV以外から showPPVMatchCardIntro が呼ばれている');
});

section('8. PPVの見え方と異常時の継続を維持', () => {
  assert.ok(/if \(!el \|\| !cards\.length\) \{ onStart\(\); return; \}/.test(coreSrc),
    'カードが空のとき本編へ進めない');
  assert.ok(/const zIdx = i \+ 1;/.test(coreSrc), '下段カードほど手前になる順序が崩れている');
  assert.ok(/for \(let di = total - 1; di >= 0; di--\)/.test(ppvSrc), 'メイン→前座の並び順が変わっている');
  assert.ok(/MAIN EVENT/.test(ppvSrc), 'MAIN EVENT 表記が消えている');
  assert.ok(/isSummit/.test(ppvSrc), 'サミット判定が落ちている');
  assert.ok(/FIRST MEETING/.test(ppvSrc), '初顔合わせ表記が消えている');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (8 sections)');
