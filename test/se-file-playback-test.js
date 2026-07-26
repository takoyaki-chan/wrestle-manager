// se-file-playback-test.js
//
// U8: 効果音を合成音から**本番音源**へ移す土台。
//
// これまで、用意された46本のうちゲームで鳴っていたのは**1本だけ**だった
// （最高栄誉ジングル。しかも playJingle の中の一点物のハックで、汎用の仕組みではない）。
//
// 土台の要件は3つ:
//   1. **1本ずつ移せる**こと。`SE_FILES` に載せたキーだけファイル、残りは合成音のまま。
//      一括置換にすると、途中で音が消えたときに戻せない
//   2. **音源が読めなくても止まらない**こと。音は演出であって、無くてもゲームは進む
//   3. **結果音は重ならない**こと。RS01/RS02/CR03 は3〜5秒あり、
//      秋4団体戦のフォール連発だと前の音の上に次が乗って濁る
//
// あわせて A-3b:「あらゆる試合の試合後に音を付ける」。
// それまでは **勝者が誰であれ勝利音**だったので、自団体が負けても勝利音が鳴り、
// 他団体どうしの試合（ジュニア・天頂戦・PPVでは大半）でも勝利音が鳴っていた。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const ui = read('src/ui-common.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 効果音を本番音源へ（U8 土台 + A-3b）===\n');

const filesTable = (app.match(/const SE_FILES = \{[\s\S]*?\n  \};/) || [])[0];
const playerSrc = (app.match(/function _playFileSe[\s\S]*?\n  \}/) || [])[0];

// ─────────────────────────────────────────────────────────────
// A. 土台
// ─────────────────────────────────────────────────────────────

section('1. キーごとに音源を割り当てる表がある', () => {
  assert.ok(filesTable, 'SE_FILES が無い');
  assert.ok(playerSrc, '_playFileSe が無い');
});

section('2. 表に載せたキーだけファイルになる（1本ずつ移せる）', () => {
  const at = app.indexOf('    play(name) {');
  assert.ok(at > 0, 'Audio.play が見つからない');
  const body = app.slice(at, at + 500);
  assert.ok(/if \(SE_FILES\[name\] && _playFileSe\(name, SE_MIX\[name\]\)\) return;/.test(body),
    'ファイル優先の分岐が無い。全キー一括でしか切り替えられない');
  assert.ok(/if \(!SFX\[name\]\) return;/.test(body) && /SFX\[name\]\(\);/.test(body),
    '表に無いキーが合成音で鳴らなくなっている');
});

section('3. 音源が読めなくても止まらない', () => {
  assert.ok(/pool\.broken = true/.test(playerSrc), '読み込み失敗を記録していない');
  assert.ok(/if \(pool\.broken\) return false;/.test(playerSrc), '壊れた音源を鳴らし続ける');
  assert.ok(/catch \(_e\) \{[\s\S]{0,80}?return false;/.test(playerSrc), '例外で呼び出し元まで巻き込む');
  // false を返したら合成音へ落ちること（play 側の && で担保）
  const at = app.indexOf('    play(name) {');
  assert.ok(/_playFileSe\(name, SE_MIX\[name\]\)\) return;/.test(app.slice(at, at + 500)),
    'ファイル再生に失敗しても合成音へ落ちない');
});

section('4. 結果音は重ねない', () => {
  assert.ok(/const _SE_SOLO = new Set\(\['boutWin', 'boutLose', 'boutOther'\]\)/.test(app),
    '重ねない対象が指定されていない');
  assert.ok(/if \(_SE_SOLO\.has\(name\)\) \{[\s\S]{0,140}?e\.pause\(\)/.test(playerSrc),
    '前の結果音を止めずに次を鳴らしている。秋のフォール連発で濁る');
});

section('5. 音量はミキサーとマスターの両方を通す', () => {
  assert.ok(/_sfxMasterVol \* _sfxVol \* \(vol != null \? vol : 0\.5\)/.test(playerSrc),
    'ファイル音源だけ音量設定を無視している');
  ['boutWin', 'boutLose', 'boutOther'].forEach(k => {
    assert.ok(new RegExp(`${k}:\\.\\d+`).test(app), `${k} の音量が SE_MIX に無い`);
  });
});

section('6. 音源ファイルが実在する', () => {
  const files = [...filesTable.matchAll(/'(wm_se_[a-z0-9_]+\.ogg)'/g)].map(m => m[1]);
  assert.ok(files.length >= 3, `割り当てが ${files.length} 件。少なすぎる`);
  files.forEach(f => {
    assert.ok(fs.existsSync(path.join(root, 'bgm', 'production-ogg', f)),
      `${f} が bgm/production-ogg/ に無い`);
  });
});

section('7. 表に載せたキーには合成音の保険もある', () => {
  // 音源が読めない環境（配布ミス等）で無音にならないこと
  const keys = [...filesTable.matchAll(/^\s{4}([a-zA-Z0-9_]+):/gm)].map(m => m[1]);
  assert.ok(keys.length >= 3, 'キーを拾えていない');
  keys.forEach(k => {
    assert.ok(new RegExp(`^    ${k}\\(\\) \\{`, 'm').test(app),
      `${k}: 合成音の保険が無い。音源が読めないと無音になる`);
  });
});

// ─────────────────────────────────────────────────────────────
// B. A-3b: 試合後の音を「自団体から見て」決める
// ─────────────────────────────────────────────────────────────

const keySrc = (ui.match(/function _emrResultSeKey[\s\S]*?\n\}/) || [])[0];

section('8. 全大会の共通入口で鳴らす', () => {
  const at = ui.indexOf('function showEventMatchResultPopup(opts)');
  assert.ok(at > 0, 'showEventMatchResultPopup が見つからない');
  const body = ui.slice(at, at + 1400);
  assert.ok(/Audio\.play\(_emrResultSeKey\(opts, winnerSide\)\)/.test(body),
    '共通の入口で鳴らしていない。大会を足すたびに付け忘れる');
});

section('9. 勝者が誰であれ勝利音、には戻さない', () => {
  assert.ok(!/winnerSide === 'draw' \? 'boutDraw' : 'boutWin'/.test(ui),
    '自団体が負けても勝利音が鳴る実装に戻っている');
});

section('10. 自団体の勝ち／負け／それ以外を出し分ける', () => {
  assert.ok(keySrc, '_emrResultSeKey が無い');
  ['boutWin', 'boutLose', 'boutOther'].forEach(k => {
    assert.ok(keySrc.includes(`'${k}'`), `${k} を返す経路が無い`);
  });
  assert.ok(/lo === 'player' \? 'left' : ro === 'player' \? 'right' : null/.test(keySrc),
    '自団体がどちら側かを見ていない');
  assert.ok(/if \(!mine\) return 'boutOther';/.test(keySrc),
    '自団体が絡まない試合でも勝敗の音が鳴る');
  assert.ok(/winnerSide === mine \? 'boutWin' : 'boutLose'/.test(keySrc),
    '勝敗の向きを見ていない');
});

section('11. タッグでも自団体を判定できる', () => {
  assert.ok(/opts\.isTag/.test(keySrc) && /teamLeft/.test(keySrc),
    'タッグの所属を見ていない。春タッグと通常タッグで判定できない');
});

section('12. 所属が分からない画面でも落ちない', () => {
  assert.ok(/if \(lo == null && ro == null\)/.test(keySrc),
    '所属が無いとき例外になる');
});

section('13. 全大会が所属を渡している', () => {
  // 渡していない大会があると、その大会だけ判定が効かず常に同じ音になる。
  // left/right は呼び出しの手前で組まれていることがある（天頂戦がそう）ので、
  // **呼び出しの直前も含めて**見る。
  const calls = [...ui.matchAll(/showEventMatchResultPopup\(\{[\s\S]*?\n  \}\);/g)];
  assert.ok(calls.length >= 6, `呼び出しが ${calls.length} 件。少なすぎる`);
  const bad = calls.filter(m => {
    const scope = ui.slice(Math.max(0, m.index - 1800), m.index + m[0].length);
    return !/orgId/.test(scope);
  });
  assert.deepStrictEqual(bad.map(m => (m[0].match(/theme: '([a-z]+)'/) || [])[1]), [],
    '所属を渡していない大会がある');
});

section('14. 音源の長さを把握している（重ならない理由）', () => {
  // RS01 4.64秒 / RS02 4.70秒 / CR03 3.32秒（実測 2026-07-27）。
  // 1試合ごとに鳴るには長いので、同じキーは重ねない扱いにしてある。
  // 短い音に差し替えたら _SE_SOLO から外してよい
  assert.ok(/_SE_SOLO/.test(app), '重ねない扱いが消えている');
  const solo = (app.match(/const _SE_SOLO = new Set\(\[([^\]]*)\]\)/) || [])[1] || '';
  const files = [...filesTable.matchAll(/^\s{4}([a-zA-Z0-9_]+):/gm)].map(m => m[1]);
  files.forEach(k => {
    assert.ok(solo.includes(`'${k}'`),
      `${k}: 結果音なのに重ねない扱いになっていない。フォール連発で濁る`);
  });
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (14 sections)');
