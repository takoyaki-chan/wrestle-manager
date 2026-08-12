'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const mobile = fs.readFileSync(path.join(root, 'src', 'mobile.css'), 'utf8');

// faceout-audit v0.2 (2026-08-12): 分割グリッド枠(境界線あり・104×152)は§2-B不適合(監査07-31)のため、
// 全プロファイル共通の「群の外枠1つ+S 108×162+18px重ね」(.ch-duoと同型)へ変更した。
assert.match(html,
  /\.emr-pair\{[^}]*border:1px solid rgba\(var\(--emr-accent-rgb\),\.3\)[^}]*border-bottom:3px solid var\(--emr-accent\)[^}]*\}/,
  'タッグ結果の隊列は群の外枠1つで囲む(mockup-baseline §2-B)');
assert.match(html,
  /\.emr-pair \.emr-upper\{[^}]*width:108px[^}]*height:162px[^}]*border:0/,
  'タッグ結果の隊列メンバーは梯子S 108×162・個別額縁なし');
assert.match(html,
  /\.emr-pair \.emr-upper\+\.emr-upper\{margin-left:-18px\}/,
  'タッグ結果の隊列は18px重ね');
assert.match(html,
  /\.stl-final-side \.faces\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*width:152px[^}]*overflow:hidden/,
  '春タッグの試合前プレビューはチームごとの一体フレームを使う');
assert.match(html,
  /\.pb-fighter\.is-tag \.pb-tag-members\{[^}]*width:min\(178px,100%\)[^}]*overflow:hidden[^}]*border:2px solid/,
  '通常興行のタッグ結果もチームごとの一体フレームを使う');
// (旧: is-spring/is-normal 個別の一体フレーム定義。v0.2で共通 .emr-pair に統合したため、
//  プロファイル別の上書きが復活していないことを負の検査で保証する)
assert.ok(!/\.emr-layer\.is-(spring|normal) \.emr-pair\{/.test(html),
  'タッグ結果の隊列はプロファイル別に分岐しない(共通 .emr-pair 一本)');
assert.match(mobile,
  /\.stl-match-preview \.stl-final-side \.faces\s*\{\s*width:\s*96px;\s*height:\s*48px;/,
  'スマホの試合前チームフレームも2人が収まる比率を維持する');

console.log('spring-tag-team-frame-test: ok');
