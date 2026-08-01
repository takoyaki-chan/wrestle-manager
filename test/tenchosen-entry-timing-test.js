'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = file => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8').replace(/\r\n/g, '\n');
const management = read('management.js');
const uiRender = read('ui-render.js');
const app = read('app.js');

(function testTenchosenEntryIsOneWeekBeforeTheShow() {
  assert.match(management, /ENTRY_WEEK:\s*47\s*,/,
    '天頂戦のエントリーは第47週（第48週の開催1週前）にする');
  assert.match(management, /s\.week === Engine\.ppvTournament\.ENTRY_WEEK/,
    '受付開始は定数を参照し、開催時期の変更に追従する');
})();

(function testLegacyEarlyEntryCannotReopenTheModal() {
  const gate = "G.week < Engine.ppvTournament.ENTRY_WEEK";
  assert.ok(uiRender.includes(gate),
    '旧セーブの早期entry状態では管理画面の受付導線を隠す');
  assert.ok(app.includes(gate),
    '旧セーブの早期entry状態からモーダルを直接開けないようにする');
})();

console.log('tenchosen-entry-timing-test: ok');
