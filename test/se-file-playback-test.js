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

section('4. 長い音を重ねない仕組みがある', () => {
  // どのキーを対象にするかは項目14が**秒数から**検査する。ここは仕組みの有無だけ
  assert.ok(/const _SE_SOLO = new Set\(\[/.test(app), '重ねない対象の指定が無い');
  assert.ok(/if \(_SE_SOLO\.has\(name\)\) \{[\s\S]{0,140}?e\.pause\(\)/.test(playerSrc),
    '前の音を止めずに次を鳴らしている。秋のフォール連発で濁る');
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

section('14. 長い音だけ重ねない扱いにする', () => {
  // 秒数は ogg のヘッダから実測できる。**音源を差し替えたらこの検査が追随する**ので、
  // 短い音に替えたのに重ねない扱いが残っている、という取り残しに気づける。
  const ogg = f => {
    const b = fs.readFileSync(path.join(root, 'bgm', 'production-ogg', f));
    const vi = b.indexOf(Buffer.from([0x01,0x76,0x6f,0x72,0x62,0x69,0x73]));
    if (vi < 0) return 0;
    const rate = b.readUInt32LE(vi + 12);
    for (let k = b.length - 27; k >= 0; k--) {
      if (b[k] === 0x4f && b[k+1] === 0x67 && b[k+2] === 0x67 && b[k+3] === 0x53 && b[k+4] === 0x00) {
        return Number(b.readBigUInt64LE(k + 6)) / rate;
      }
    }
    return 0;
  };
  const solo = (app.match(/const _SE_SOLO = new Set\(\[([\s\S]*?)\]\)/) || [])[1] || '';
  const pairs = [...filesTable.matchAll(/^\s{4}([a-zA-Z0-9_]+): *'(wm_se_[a-z0-9_]+\.ogg)'/gm)];
  assert.ok(pairs.length >= 15, `割り当てが ${pairs.length} 件。少なすぎる`);
  const LONG = 2.0;   // これを超えたら重ねない
  const wrong = [];
  pairs.forEach(m => {
    const [, key, file] = m;
    const sec = ogg(file);
    assert.ok(sec > 0, `${file}: 長さを読めない`);
    const isSolo = solo.includes(`'${key}'`);
    if (sec > LONG && !isSolo) wrong.push(`${key} (${sec.toFixed(2)}s) は重ねない扱いが要る`);
    if (sec <= 0.8 && isSolo) wrong.push(`${key} (${sec.toFixed(2)}s) は短いので重ねてよい`);
  });
  assert.deepStrictEqual(wrong, [], wrong.join(' / '));
});

section('15. 高頻度のキーには短い音を当てる', () => {
  // click は92箇所、error は59箇所で鳴る。1秒を超える音を当てると操作が重くなる
  const ogg = f => {
    const b = fs.readFileSync(path.join(root, 'bgm', 'production-ogg', f));
    const vi = b.indexOf(Buffer.from([0x01,0x76,0x6f,0x72,0x62,0x69,0x73]));
    const rate = b.readUInt32LE(vi + 12);
    for (let k = b.length - 27; k >= 0; k--) {
      if (b[k] === 0x4f && b[k+1] === 0x67 && b[k+2] === 0x67 && b[k+3] === 0x53 && b[k+4] === 0x00) {
        return Number(b.readBigUInt64LE(k + 6)) / rate;
      }
    }
    return 0;
  };
  const table = Object.fromEntries(
    [...filesTable.matchAll(/^\s{4}([a-zA-Z0-9_]+): *'(wm_se_[a-z0-9_]+\.ogg)'/gm)].map(m => [m[1], m[2]]));
  ['click', 'select', 'deselect', 'error', 'notify', 'tick', 'save'].forEach(k => {
    if (!table[k]) return;   // まだ載せていないキーは対象外
    const sec = ogg(table[k]);
    assert.ok(sec <= 0.6,
      `${k}: ${sec.toFixed(2)}s は押した瞬間に返る音として長い（0.6秒以内に）`);
  });
});
section('16. 同じ団体どうしの試合は、どちらが勝っても勝ち', () => {
  // 通常興行はほとんどこれ。左が勝つと勝利音・右が勝つと敗北音、では嘘になる
  //（2026-07-27 Keisuke 報告）
  assert.ok(/if \(lo === 'player' && ro === 'player'\)/.test(keySrc),
    '同団体どうしを区別していない。右の選手が勝つと敗北音が鳴る');
  assert.ok(/winnerSide === 'draw' \? 'boutOther' : 'boutWin'/.test(keySrc),
    '同団体どうしで敗北音が鳴る経路が残っている');
});

section('17. 興行準備の操作に音がある', () => {
  // 「反応のあるボタンと反応のないボタンがあるのは気持ちが悪い」（2026-07-27 Keisuke）。
  // 失敗時の error だけ鳴って**成功時が無音**、という手当が各所に残っていた。
  const uiRender = read('src/ui-render.js');
  const handlers = ['removeTagSlot', 'setShowVenue', 'clearShowCard',
                    'mergeToTagSlot', 'setTagSlotFighter', 'setShowCardSlot'];
  handlers.forEach(fn => {
    const at = app.indexOf(`\n  ${fn}(`);
    assert.ok(at > 0, `${fn} が見つからない`);
    const end = app.indexOf('\n  },', at);
    const body = app.slice(at, end);
    const sounds = (body.match(/Audio\.play\('([a-zA-Z]+)'\)/g) || []);
    assert.ok(sounds.some(x => !/'error'/.test(x)),
      `${fn}: 失敗時の error しか鳴っていない。成功したのに無音`);
  });
  // 枠を開く・閉じる操作
  ['_spOpenPicker', '_spOpenTagPicker', '_spClosePicker'].forEach(fn => {
    const at = uiRender.indexOf(`function ${fn}(`);
    assert.ok(at > 0, `${fn} が見つからない`);
    const body = uiRender.slice(at, uiRender.indexOf('\n}', at));
    assert.ok(/Audio\.play\(/.test(body), `${fn}: 無音`);
  });
  // おまかせ編成3種
  ['autoFillCard', 'autoFillCardByAppeal', 'autoFillCardByDraw'].forEach(fn => {
    assert.ok(uiRender.includes(`Audio.play('cardComplete');${fn}()`),
      `${fn}: おまかせボタンが無音`);
  });
});

section('18. おまかせ・確定は「決定」の音（「移動」ではない）', () => {
  // select は おまかせ／確定／タイトル操作 に使われる。UI03「移動」は合わない
  assert.ok(/select: *'wm_se_ui01_v01\.ogg'/.test(app),
    'おまかせ・確定が「移動」の音のまま');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (18 sections)');
