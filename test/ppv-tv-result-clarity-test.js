'use strict';

// PPVテレビ中継の勝敗表現: 実装が再び「勝者だけ」の速報へ戻らないための契約テスト。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const css = read('src/index.html');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} の末尾が見つからない`);
}

const broadcast = extractFunction(ui, 'renderPPVTvBroadcast');

assert.ok(broadcast.includes('const loseF ='), '速報で敗者を特定している');
assert.ok(broadcast.includes('_resultSide(loseF, winF, \'loser\', \'s\', false)'),
  'アンダーカード速報が敗者の名前・upper画像を含む');
assert.ok(broadcast.includes("_face(fighter, `ptv-result-upper ptv-result-upper--${size}`)"),
  '各結果選手にupper画像を出す');
assert.ok(/\.ptv-result-fighter\.is-loser \.ptv-upper\{filter:grayscale\(\.9\) brightness\(\.72\)\}/.test(css),
  '敗者側だけを指定どおりグレースケールにする');
assert.ok(/\.ptv-result-upper--s\{width:108px;height:162px\}\.ptv-result-upper--m\{width:132px;height:194px\}/.test(css),
  '速報の勝者M 132×194 / 敗者S 108×162を別段にする');

assert.ok(broadcast.includes('const summitResultBlock ='), '頂上決戦の決着専用ブロックがある');
assert.ok(broadcast.includes('${vsBlock}\n        <div class="ptv-summit-result">両団体'),
  '対峙シーンだけがvsBlockを使う');
assert.ok(broadcast.includes('${summitResultBlock}\n        <div class="ptv-summit-result">${r.turns'),
  '決着シーンはvsBlockを使い回さない');
assert.ok(/\.ptv-result-upper--xl\{width:172px;height:258px\}/.test(css),
  '頂上決戦の勝者はXL 172×258');
assert.ok(broadcast.includes("'winner', 'xl', true") && broadcast.includes("'loser', 'm', false"),
  '頂上決戦も勝者XL・敗者Mと○×・WINの文法を使う');
assert.ok(!/LOSE/.test(broadcast), 'PPV中継の出力にLOSEという文言を使わない');

assert.ok(broadcast.includes("'draw', 'm', false") && broadcast.includes("'draw', 'xl', false"),
  '引き分けは各画面で両者を同じ段にする');
assert.ok(!/is-draw \.ptv-upper\{filter/.test(css), '引き分けにグレースケールを掛けない');
assert.ok(broadcast.includes('stopBgmBeforeSe: true') && broadcast.includes('Audio.bgm.stop()'),
  '最終戦のファンファーレ前にBGMを停止する');

console.log('ppv-tv-result-clarity-test: ok');
