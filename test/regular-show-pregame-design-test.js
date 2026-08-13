'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

const start = ui.indexOf('function renderMatchPreview()');
const end = ui.indexOf('// ── Show Result Renderer', start);
assert(start >= 0 && end > start, '定期興行試合前画面のレンダラーが必要');
const preview = ui.slice(start, end);

assert(preview.includes('show-pregame-a'), '試合前画面はA案で固定する');
assert(preview.includes("const cardStateClass = isResolved ? ' is-resolved' : isNext ? ' is-next' : ' is-waiting'"), 'A案カードへ進行状態クラスを付与する');
assert(!preview.includes('const cardBg ='), '旧インライン背景色を残さない');
assert(!preview.includes('const borderColor ='), '旧インライン枠色を残さない');
assert(!preview.includes('border-color:rgba(52,152,219,0.4)') && !preview.includes('border-color:rgba(231,76,60,0.4)'), '左右キャラ枠へ旧青赤色をインライン指定しない');

// DB全選手一覧(task-91系 faf4e8c)に続き、試合前画面のOVRも共通7帯階調(stat-notation-v1.0)へ統一済み。
// シングル左右+タッグ+遠征変種(task-95)の4箇所すべてが statTierStyle('ovr') を使う
const ovrStyleCalls = preview.match(/statTierStyle\('ovr'/g) || [];
assert(ovrStyleCalls.length >= 4, 'シングル左右・タッグ・遠征のOVRへ共通7帯階調を使う');
assert(!preview.includes('_scale6Style(_ovrColor('), '試合前画面のOVRに旧6段階調を残さない');
assert(render.includes("statTierStyle('ovr'"), 'データベース側も同じ7帯階調基準を使うこと');

assert(css.includes('Regular show pre-match — Pattern A / dark platinum cards'), 'A案のスタイル定義が必要');
assert(css.includes('.show-pregame-a .match-card{background:linear-gradient(145deg,#101318,#0b0e12)'), 'カード背景を暗色にする');
assert(css.includes('.show-pregame-a .match-card.is-next{border-color:rgba(207,196,162,.56)'), '次戦カード外枠を結果画面と同じ白金系にする');
assert(css.includes('border-bottom:3px solid #cfc4a2'), 'キャラ枠を結果画面と同じ白金系アクセントにする');
assert(css.includes('.show-pregame-a .smc-stat-fill,.show-pregame-a .smc-tag-sfill{background:linear-gradient(90deg,#bd8b18,#f0c75e)!important'), '能力バーを黄色系単色言語へ統一する');
assert(css.includes('.show-result-overlay.active:has(.show-pregame-a)'), '試合前画面を全画面ステージとして扱う');

console.log('regular-show-pregame-design-test: ok');
