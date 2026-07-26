// special-event-card-intro-test.js
//
// 大会が始まる前に「これから何が始まるのか」を一枚で見せる（2026-07-27 Keisuke 選択）。
//
// PPV には前から入っていた演出（ppvmc-*）。**新しく作らず、これを5大会の共通口にした。**
// カードの枠は「左右が向かい合う」形で、5大会すべてこれに載る:
//
//   夏ジュニア・冬天頂戦   1回戦の全カード（＝出場者全員）
//   冬PPV                  当日の全カード（従来どおり）
//   秋4団体戦              準決勝2つ（団体 vs 団体・顔は大将・下段にメンバー3名）
//   春タッグ               第1節（チーム vs チーム・顔は1人目・下段に所属）
//
// 守りたいのは3つ:
//   1. 5大会すべてが**同じ部品**を通ること（別々に作ると必ず見た目がずれる）
//   2. バスの後・本編の前という**位置**（順番が入れ替わると意味が消える）
//   3. 経路が分かれる大会（ジュニア）で**片方だけ出ない**ことがないこと

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

console.log('=== 特別興行の開幕カード紹介 ===\n');

const coreSrc = (ui.match(/function showSpecialEventCardIntro[\s\S]*?\n\}/) || [])[0];

// ─────────────────────────────────────────────────────────────
// A. 部品がひとつか
// ─────────────────────────────────────────────────────────────

section('1. 共通の描画は1本', () => {
  assert.ok(coreSrc, 'showSpecialEventCardIntro が無い');
  assert.ok(/ppvmc-card/.test(coreSrc), 'PPV の既存カード枠を使っていない');
});

section('2. 新しいCSSクラスを作っていない', () => {
  const used = new Set();
  (coreSrc.match(/class="([^"$]+)"/g) || []).forEach(m => {
    m.slice(7, -1).replace(/\$\{[^}]*\}/g, '').trim().split(/\s+/).forEach(c => c && used.add(c));
  });
  const missing = [...used].filter(c => !html.includes('.' + c));
  assert.deepStrictEqual(missing, [], 'index.html に無いクラス: ' + missing.join(', '));
});

section('3. どの大会もカードHTMLを自前で組んでいない', () => {
  // 各大会がカードを手書きし始めると、PPV だけ直して他が古いままになる
  const adapters = ['_showBracketCardIntro', '_showAutumnWarCardIntro', '_showSpringTagCardIntro',
                    'showPPVMatchCardIntro'];
  adapters.forEach(fn => {
    const src = (ui.match(new RegExp(`function ${fn}[\\s\\S]*?\\n\\}`)) || [])[0];
    assert.ok(src, `${fn} が無い`);
    assert.ok(!/ppvmc-card/.test(src),
      `${fn} がカードHTMLを自前で組んでいる。showSpecialEventCardIntro にデータだけ渡すこと`);
    assert.ok(/showSpecialEventCardIntro\(/.test(src), `${fn} が共通描画を通っていない`);
  });
});

section('4. カードが1枚も無ければ、黙って先へ進む', () => {
  // 不開催や異常系で空の紹介画面を出さない
  assert.ok(/if \(!el \|\| !cards\.length\) \{ onStart\(\); return; \}/.test(coreSrc),
    'カードが空でも紹介画面を開いてしまう');
  ['_showBracketCardIntro', '_showAutumnWarCardIntro', '_showSpringTagCardIntro'].forEach(fn => {
    const src = (ui.match(new RegExp(`function ${fn}[\\s\\S]*?\\n\\}`)) || [])[0];
    assert.ok(/\{ onStart\(\); return; \}/.test(src), `${fn}: データが無いとき進めなくなる`);
  });
});

// ─────────────────────────────────────────────────────────────
// B. 5大会すべてに入っているか
// ─────────────────────────────────────────────────────────────

section('5. 5大会すべてで開幕カード紹介が出る', () => {
  const wired = {
    '夏ジュニア': /_showBracketCardIntro\(jt\.result\.rounds/,
    '冬天頂戦':   /_showBracketCardIntro\(t\.rounds/,
    '秋4団体戦':  /_showAutumnWarCardIntro\(res/,
    '春タッグ':   /_showSpringTagCardIntro\(stl/,
    '冬PPV':      /showPPVMatchCardIntro\(/,
  };
  Object.entries(wired).forEach(([name, re]) => {
    assert.ok(re.test(app), `${name} に開幕カード紹介が入っていない`);
  });
});

section('6. ジュニアは経路が2つあっても必ず1回だけ出る', () => {
  // 招集がある年と無い年で分岐する。片方だけ配線すると、ある年だけ紹介が出ない。
  // 逆に両方から呼ぶと2回出るので、フラグで1回に抑える
  assert.ok(/App\._jtOpenBracketWithCardIntro = function/.test(app),
    'ジュニアの対戦表を開く共通入口が無い');
  const calls = app.match(/App\._jtOpenBracketWithCardIntro\(\)/g) || [];
  assert.ok(calls.length >= 2,
    `共通入口の呼び出しが ${calls.length} 箇所。招集あり/なしの両経路から通すこと`);
  const src = (app.match(/App\._jtOpenBracketWithCardIntro = function[\s\S]*?\n\};/) || [])[0];
  assert.ok(/_cardIntroShown/.test(src), '2回目以降も紹介が出る');
});

// ─────────────────────────────────────────────────────────────
// C. 位置（バスの後・本編の前）
// ─────────────────────────────────────────────────────────────

section('7. 会場入り(バス)の後に出る', () => {
  // 「導入 → 選定 → バス → 開幕紹介 → 本編」。バスより前だと会場に着く前に紹介が始まる
  const blocks = {
    '秋4団体戦': /showSpecialEventTravel\('autumnWar', G, party, toBoard\)/,
    '春タッグ':   /showSpecialEventTravel\('springTagLeague', G, party, toBoard\)/,
    '夏ジュニア': /showSpecialEventTravel\('juniorTournament', G, jt\.myParticipants, toBoard\)/,
  };
  Object.entries(blocks).forEach(([name, re]) => {
    assert.ok(re.test(app), `${name}: バスの続きが開幕紹介になっていない`);
  });
  // 天頂戦は バス → toBracket、その toBracket が紹介を挟む
  const tc = (app.match(/const toBracket = \(\) => \{[\s\S]*?\n  \};/) || [])[0];
  assert.ok(tc && /_showBracketCardIntro\(/.test(tc), '天頂戦: バスの後に紹介が入っていない');
});

section('8. 本編は紹介を閉じた後に始まる', () => {
  // onStart に本編を渡す。先に本編を描くと紹介の裏で試合が進む
  assert.ok(/_showBracketCardIntro\(t\.rounds, \{[\s\S]{0,220}?\}, \(\) => renderTenchosenBracket\(\)\)/.test(app),
    '天頂戦: 対戦表が紹介の続きになっていない');
  assert.ok(/_showAutumnWarCardIntro\(res, \(\) => App\.initAutumnWarReplay\(\)\)/.test(app),
    '秋: 本編が紹介の続きになっていない');
  assert.ok(/_showSpringTagCardIntro\(stl, \(\) => renderSpringTagLeagueBoard\(\)\)/.test(app),
    '春: 本編が紹介の続きになっていない');
});

// ─────────────────────────────────────────────────────────────
// D. 中身
// ─────────────────────────────────────────────────────────────

section('9. 単発トーナメントは1回戦の全カードを見せる', () => {
  // 1回戦 = 出場者全員。ここを絞ると「全体像」でなくなる
  const src = (ui.match(/function _showBracketCardIntro[\s\S]*?\n\}/) || [])[0];
  assert.ok(/rounds\[0\]/.test(src), '1回戦を見ていない');
  assert.ok(/first\.matches\.map\(/.test(src), '1回戦の一部しか出していない');
});

section('10. 団体戦は顔とメンバーの両方が分かる', () => {
  const src = (ui.match(/function _showAutumnWarCardIntro[\s\S]*?\n\}/) || [])[0];
  assert.ok(/大将/.test(src), '顔を誰が背負うか決めていない');
  assert.ok(/names\.join\(/.test(src), 'メンバー名を出していない。団体名だけでは誰が出るか分からない');
});

section('11. PPV の見え方は変わっていない', () => {
  // 既存演出の作り替えなので、メインが上・前座が下・MAIN EVENT 表記は維持する
  const src = (ui.match(/function showPPVMatchCardIntro[\s\S]*?\n\}/) || [])[0];
  assert.ok(/for \(let di = total - 1; di >= 0; di--\)/.test(src), 'メイン→前座の並び順が変わっている');
  assert.ok(/MAIN EVENT/.test(src), 'MAIN EVENT 表記が消えている');
  assert.ok(/isSummit/.test(src), 'サミット判定が落ちている');
  assert.ok(/FIRST MEETING/.test(src), '初顔合わせ表記が消えている');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (11 sections)');
