'use strict';

// 年末表彰式: mockup-baseline-v0.8 §2 / §2-B / §3 / §4 の静的契約。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const css = read('src/index.html');
const app = read('src/app.js');

function fn(name) {
  const start = ui.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const next = ui.indexOf('\nfunction ', start + 1);
  return ui.slice(start, next >= 0 ? next : ui.length);
}

function before(source, first, second, message) {
  assert.ok(source.indexOf(first) >= 0 && source.indexOf(second) >= 0 && source.indexOf(first) < source.indexOf(second), message);
}

const winnerBlock = fn('_awWinnerBlock');
const eventAward = fn('_buildSeasonEventChampionAward');
const bestMatch = fn('_buildBestMatchAward');
const champions = fn('_buildChampionsAward');
const hall = fn('_buildHallOfFame');

// §3 / §4: 吹き出し本文だけを予約枠に入れ、画像より前に置く。
assert.ok(!/speech-speaker/.test(fn('_awSpeech')), '吹き出しに名前を入れない');
before(winnerBlock, '_awSpeechSlot(o.line)', 'class="${portraitClass}"', '単独受賞者は吹き出し→画像の順');
before(bestMatch, '${_awSpeechSlot(line1)}', 'class="portrait-sm"', 'ベストマッチ左は吹き出し→画像の順');
assert.ok(/\$\{_awSpeechSlot\(line2\)\}<div class="portrait-sm"/.test(bestMatch), 'ベストマッチ右は吹き出し→画像の順');
before(eventAward, '${_awSpeechSlot(lineFor(f))}', 'class="aw-team-portrait"', '大会優勝の隊列は吹き出し→画像の順');
before(champions, '${_awSpeechSlot(line)}', 'class="champ-portrait"', 'タイトル王者は吹き出し→画像の順');
before(hall, '${_awSpeechSlot(line)}', 'class="hof-portrait"', '殿堂入りは吹き出し→画像の順');
assert.ok(/\.aw-speech-slot\{height:52px/.test(css), 'XL〜M の吹き出し予約枠は52px');
assert.ok(/\.award-card \.speech-bubble::before\{[^}]*bottom:-8px[^}]*border-top-color/.test(css), '吹き出しの尻尾は画像へ向けて下向き');
assert.ok(/-webkit-line-clamp:2/.test(css), '吹き出し本文を2行で制限する');

// §2: upper画像は2:3梯子の XL / L / M を使う。
assert.ok(/\.portrait-main\{width:172px;height:258px/.test(css), '単独主役はXL 172×258');
assert.ok(/\.portrait-sm\{width:132px;height:194px/.test(css), 'ベストマッチはM 132×194');
assert.ok(/\.portrait-mvp\{width:172px;height:258px/.test(css), 'MVPはXL 172×258');
assert.ok(/\.hof-portrait\{width:172px;height:258px/.test(css), '殿堂入りはXL 172×258');
assert.ok(/\.aw-team-portrait\{width:150px;height:224px/.test(css), 'タッグの各選手はL 150×224');

// §2-B: タッグ/団体優勝を群として扱い、外枠は1つ、画像だけを18px重ねる。
assert.ok(eventAward.includes('class="aw-team-group"'), '大会優勝に群の外枠がある');
assert.ok(eventAward.includes('class="aw-team-portrait"'), '個別の portrait-main 枠を隊列に使わない');
assert.ok(/\.aw-team-group\{border:1px/.test(css), '群だけが額縁を持つ');
assert.ok(/\.aw-team-member \+ \.aw-team-member\{margin-left:-18px/.test(css), '隣接選手を18px重ねる');
assert.ok(/\.aw-team-portrait img\{[^}]*filter:drop-shadow\(/.test(css), '隊列の影はシルエットに沿うdrop-shadow');
assert.ok(/\.aw-team-portrait\{[^}]*border:/.test(css) === false, '個々の隊列画像に額縁を付けない');

// 大会優勝は新規文言ではなく既存 AWARD_LINES の champion プールを参照する。
assert.ok(eventAward.includes("const lineFor = f => _awardLine('champion', f.id);"), '大会優勝は既存のchampionセリフプールを使う');
['springTag', 'autumnWar', 'tenchosen', 'ppvFinal'].forEach(kind => {
  assert.ok(eventAward.includes(`${kind}:`), `${kind} の大会優勝スライドを維持する`);
});

// 総括は表彰式後、レポート週の今週画面を明示して表示する。
const reportFn = app.slice(app.indexOf('_showFarewellsThenReport() {'), app.indexOf('\n  },', app.indexOf('_showFarewellsThenReport() {')));
assert.ok(/G\.offSeason && G\.offWeek === 1/.test(reportFn), '総括表示はoffWeek 1に限定する');
assert.ok(/showScreen\('week'\)/.test(reportFn), '式典後に今週画面へ戻して総括を見せる');

console.log('awards-ceremony-layout-test: ok');
