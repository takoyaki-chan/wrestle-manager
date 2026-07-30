'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const mobile = fs.readFileSync(path.join(root, 'src', 'mobile.css'), 'utf8');

assert.match(html,
  /\.emr-layer\.is-spring \.emr-pair\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*width:min\(208px,100%\)[^}]*overflow:hidden/,
  '春タッグの結果画面は2人を1つの横長フレームに収める');
assert.match(html,
  /\.stl-final-side \.faces\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*width:152px[^}]*overflow:hidden/,
  '春タッグの試合前プレビューはチームごとの一体フレームを使う');
assert.match(html,
  /\.pb-fighter\.is-tag \.pb-tag-members\{[^}]*width:min\(178px,100%\)[^}]*overflow:hidden[^}]*border:2px solid/,
  '通常興行のタッグ結果もチームごとの一体フレームを使う');
assert.match(html,
  /\.emr-layer\.is-normal \.emr-pair\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*width:min\(208px,100%\)/,
  '通常興行のタッグ結果ポップアップもチームごとの一体フレームを使う');
assert.match(mobile,
  /\.stl-match-preview \.stl-final-side \.faces\s*\{\s*width:\s*96px;\s*height:\s*48px;/,
  'スマホの試合前チームフレームも2人が収まる比率を維持する');

console.log('spring-tag-team-frame-test: ok');
