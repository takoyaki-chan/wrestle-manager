'use strict';

// awards-ceremony-polish-test.js
//
// task-53: 年間表彰式の是正3件(吹き出しのはみ出し / 団体名 / 選手詳細)。
// 物差しは docs/ui/mockup-baseline-v0.1.md §2 / §2-B / §3 / §4。
// 書き方は test/u7-roster-list-safety-net-test.js / test/awards-ceremony-layout-test.js に倣う。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const css = read('src/index.html');

let failed = 0;
function section(name, run) {
  try { run(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

/** 関数名からソースを粗く切り出す(次の "\nfunction " まで)。既存テストと同じ手法。 */
function fn(name) {
  const start = ui.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const next = ui.indexOf('\nfunction ', start + 1);
  return ui.slice(start, next >= 0 ? next : ui.length);
}

console.log('=== task-53 年間表彰式 是正3件 ===\n');

// ─────────────────────────────────────────────────────────────
// A. 複数人受賞で吹き出しが破綻しない
//    (_buildSeasonEventChampionAward の fighters.length >= 2 経路。
//     春タッグ/4団体勝ち残り対抗戦/天頂戦/PPV GRAND FINAL が同じ関数を通る)
// ─────────────────────────────────────────────────────────────

section('A1. 隊列の吹き出しは2行で切り捨てない(スコープを絞った上書き)', () => {
  assert.ok(
    /\.aw-team-member \.speech-text\{[^}]*-webkit-line-clamp:none/.test(css),
    '.aw-team-member .speech-text に line-clamp 解除の上書きが無い(隊列の吹き出しがまだ2行で切れる)'
  );
  assert.ok(
    /\.aw-team-member \.aw-speech-slot\{height:auto;min-height:52px\}/.test(css),
    '隊列の予約枠が固定 height のままだと、吹き出しが伸びても枠がついてこず画像と重なる'
  );
  // 単独/対置(ベストマッチ・タイトル王者)向けの基準ルールはそのまま残す(他のテストが見ている)。
  assert.ok(/-webkit-line-clamp:2/.test(css), '基準の2行制限そのものは残っている(単独/対置には掛かったまま)');
});

section('A2. 隣り合う吹き出しは重ならない(画像は18pxのまま重ねる)', () => {
  assert.ok(
    /\.aw-team-member \+ \.aw-team-member\{margin-left:-18px/.test(css),
    '画像の隊列は18px重ねたまま(§2-B)であるべきなのに崩れている'
  );
  assert.ok(
    css.includes('.aw-team-lineup .aw-team-member .speech-bubble{width:calc(100% - 2 * var(--space-lg))}'),
    '吹き出しを画像より狭くする上書きが無い(隣と重なって1つの白い箱に見える不具合が直っていない)'
  );
});

section('A3. 吹き出しは画像より前(上)に出力され、margin-topで下に付いていない', () => {
  const body = fn('_buildSeasonEventChampionAward');
  const speechAt = body.indexOf('_awSpeechSlot(lineFor(f))');
  const portraitAt = body.indexOf('class="aw-team-portrait"');
  assert.ok(speechAt >= 0 && portraitAt >= 0, '吹き出し/画像の出力箇所が見つからない');
  assert.ok(speechAt < portraitAt, '隊列は吹き出し→画像の順になっていない');
  assert.ok(
    !/\.aw-speech-slot\{[^}]*margin-top/.test(css) && !/\.aw-team-member \.aw-speech-slot\{[^}]*margin-top/.test(css),
    '吹き出しの予約枠を margin-top で下に付けている(§3: 位置はキャラ画像の上)'
  );
});

section('A4. 吹き出しの中に選手名・団体名を入れていない', () => {
  const speechFn = fn('_awSpeech');
  assert.ok(!/speech-speaker/.test(speechFn), '吹き出しに名前用の要素を入れている');
  assert.ok(!/f\.name|c\.name|d\.name|orgName/.test(speechFn), '吹き出しの中身にセリフ以外(名前・所属)を混ぜている');
});

section('A5. 3人以上(is-many)でも同じ仕組みのまま破綻しない', () => {
  const body = fn('_buildSeasonEventChampionAward');
  assert.ok(body.includes('const many = fighters.length >= 3'), '3人判定が見当たらない(4団体勝ち残り対抗戦は3名制)');
  assert.ok(
    !/\.is-many[^{]*\.speech-bubble/.test(css),
    'is-many 専用の吹き出し上書きを作っている(2人と3人で仕組みが分かれると破綻しやすい。共通の1ルールで足りる)'
  );
  assert.ok(
    /\.aw-team-lineup\.is-many \.aw-team-member:not\(\.is-center\) \.aw-team-portrait\{width:132px;height:194px/.test(css),
    '3人時の脇の画像サイズ(132×194)が維持されていない'
  );
});

// ─────────────────────────────────────────────────────────────
// B. タイトル王者に団体名を大きく入れる
// ─────────────────────────────────────────────────────────────

section('B1. タイトル王者カードに団体名のテキストが入っている(エンブレムは残す)', () => {
  const body = fn('_buildChampionsAward');
  assert.ok(body.includes('champ-orgname'), '団体名のテキスト要素が無い');
  assert.ok(body.includes('${c.orgName}'), '団体名の値を出力していない');
  assert.ok(body.includes('_awOrgEmblem('), 'エンブレム画像を消してしまっている');
});

section('B2. 1位は2位・3位より団体名が一段大きい', () => {
  assert.ok(/\.champ-orgname\{[^}]*font-size:15px/.test(css), '既定(2位/3位)は選手名(champ-name 15px)と同格のはず');
  assert.ok(/\.rank-1 \.champ-orgname\{font-size:18px\}/.test(css), '1位が一段大きい指定になっていない');
});

section('B3. 自団体は既存の --gold トークンで区別する(新規16進カラーを増やさない)', () => {
  const body = fn('_buildChampionsAward');
  // コメントではなく実際の <span class="champ-orgname"...> の出力箇所を見る
  const at = body.indexOf('class="champ-orgname"');
  assert.ok(at >= 0, 'class="champ-orgname" が見つからない');
  const around = body.slice(Math.max(0, at - 20), at + 140);
  assert.ok(/isPlayer/.test(around), '自団体判定(isPlayer)を使っていない');
  assert.ok(/var\(--gold\)/.test(around), '--gold トークンで強調していない');
});

// ─────────────────────────────────────────────────────────────
// C. 表彰式の選手名・選手画像から詳細を開ける
// ─────────────────────────────────────────────────────────────

section('C0. _awOpenAttr は canOpenFighterPopup で守り、進行を壊さない', () => {
  const body = fn('_awOpenAttr');
  assert.ok(/canOpenFighterPopup\(/.test(body), 'findFighter で実在を確かめていない(押しても無反応の相手にリンクを付けてしまう)');
  assert.ok(/event\.stopPropagation\(\)/.test(body), 'stopPropagation が無い(クリックが背後の進行ハンドラへ抜ける)');
  assert.ok(/showFighterPopup\(/.test(body), '既存の showFighterPopup を使っていない(この画面専用の開き方を発明している)');
});

const OPEN_BLOCKS = [
  ['_awWinnerBlock(メディア功労賞/新人王/大会優勝1名/MVP が共通で通る)', '_awWinnerBlock',
    ['class="${portraitClass}"${openAttr}', 'class="${nameClass}"${nameStyle}${openAttr}']],
  ['_buildSeasonEventChampionAward(複数人の隊列)', '_buildSeasonEventChampionAward',
    ['class="aw-team-portrait"${openAttr}', 'class="aw-team-name"${openAttr}']],
  ['_buildBestMatchAward(両サイド)', '_buildBestMatchAward',
    ['class="portrait-sm"${open1Attr}', 'class="fighter-name"${open1Attr}',
     'class="portrait-sm"${open2Attr}', 'class="fighter-name"${open2Attr}']],
  ['_buildChampionsAward', '_buildChampionsAward',
    ['class="champ-portrait"${openAttr}', 'class="champ-name"${openAttr}']],
  ['_buildHallOfFame', '_buildHallOfFame',
    ['class="hof-portrait"${openAttr}', 'class="hof-name"${openAttr}']],
];

OPEN_BLOCKS.forEach(([label, fnName, needles]) => {
  section(`C. ${label} は選手名・選手画像の両方から詳細を開ける`, () => {
    const body = fn(fnName);
    needles.forEach(n => assert.ok(body.includes(n), `${n} が見つからない`));
  });
});

section('C-ID. IDが無い相手(JT優勝の決勝対戦相手)にはリンクを付けない', () => {
  const body = fn('_buildJTChampionAward');
  assert.ok(body.includes('d.runnerUp'), 'runnerUp の扱いが変わっている(前提が崩れている可能性)');
  assert.ok(
    !/runnerUp[\s\S]{0,80}(showFighterPopup|_awOpenAttr)/.test(body),
    'id が無い決勝相手にクリックを付けている(押しても無反応=一番悪いパターンになる)'
  );
});

// ─────────────────────────────────────────────────────────────
// 不変条件: 表彰式の進行を壊していない(スライド構成・「次へ」は既存のまま)
// ─────────────────────────────────────────────────────────────

section('不変条件1. スライドの進行ロジック(goToSlide/nextSlide)に手を入れていない', () => {
  assert.ok(ui.includes('function nextSlide()'), 'nextSlide が見当たらない');
  assert.ok(ui.includes('window._awardsNext = nextSlide;'), '進行の入口が変わっている');
});

section('不変条件2. 選手詳細は式典(400)より手前(500)に出る(z-index)', () => {
  assert.ok(/\.awards-overlay\{[^}]*z-index:400/.test(css), '式典オーバーレイの階層が変わっている');
  assert.ok(/\.fighter-popup-overlay\{[^}]*z-index:500/.test(css), '選手詳細の階層が変わっている');
});

console.log('');
if (failed > 0) {
  console.log(`awards-ceremony-polish-test: ${failed} FAILED`);
  process.exit(1);
}
console.log('awards-ceremony-polish-test: ok');
