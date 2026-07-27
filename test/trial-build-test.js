'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');

const index = read('src', 'index.html');
const management = read('src', 'management.js');
const app = read('src', 'app.js');
const uiRender = read('src', 'ui-render.js');
const packageScript = read('release', 'package-release.ps1');
const verifyScript = read('release', 'verify-package.ps1');

assert.match(index, /window\.IS_TRIAL\s*=\s*false;/, '開発元は製品版フラグのままにする');
assert.match(index, /window\.TRIAL_MAX_SEASON\s*=\s*3;/, '体験版の上限は3シーズン');

assert.match(
  management,
  /window\.IS_TRIAL && s\.season >= \(window\.TRIAL_MAX_SEASON \|\| 3\)/,
  'シーズン3のオフシーズン終了時に体験版ゲートを発火する',
);
assert.match(management, /_trialEnd:\s*true/, '進行停止をアプリへ通知する');
assert.ok((app.match(/if \(G\._trialEnd\)/g) || []).length >= 2, '通常進行と特殊進行の両方で終了通知を処理する');
assert.match(uiRender, /const maxSlots = window\.IS_TRIAL \? 1 : SAVE_SLOTS;/, '体験版は手動セーブ1枠');

assert.match(packageScript, /\[switch\]\$Trial/, '梱包スクリプトに体験版モードがある');
assert.match(packageScript, /\$FileSuffix\s*=\s*"_Trial"/, '体験版ZIPを製品版と別名で出力する');
assert.match(packageScript, /window\\\.IS_TRIAL/, 'ステージングされたHTMLだけを書き換える');
assert.match(packageScript, /TRIAL_MAX_SEASON\\s\*=\\s\*3/, '梱包時に3シーズン制限を確認する');
assert.match(packageScript, /シーズン3終了までプレイできます/, '体験版READMEに制限を明記する');

assert.match(verifyScript, /\[switch\]\$ExpectedTrial/, '検証スクリプトに体験版確認モードがある');
assert.match(verifyScript, /window\\\.IS_TRIAL\\s\*=\\s\*true/, '体験版フラグを検証する');
assert.match(verifyScript, /TRIAL_MAX_SEASON\\s\*=\\s\*3/, '体験版の3シーズン制限を検証する');

console.log('trial-build-test: ok');
