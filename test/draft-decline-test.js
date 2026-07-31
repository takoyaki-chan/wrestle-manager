'use strict';

// 自団体が指名しなくても、他団体のドラフトは走る (2026-07-31 Keisuke 指摘)
//
// 症状: 「自分の団体がドラフトに参加しないと、他の団体もドラフトに参加せず、人を取らない」
//
// 原因: 他団体の指名処理は startDraftNegotiation の中の
//       「非選択候補のバックグラウンド処理」ループにしか無い。ところが関数の入口に
//       `if (selections.length === 0) return;` があり、**プレイヤーが1人も選ばないと
//       ループごと実行されなかった**。加えて画面に「見送る」の出口が無く、
//       0名のときのボタンは押しても何も起きない飾りだった。
//
// 直し方: 入口の0名ガードを外し(非選択候補はループが全部処理する)、
//         0名のときは明示的な「指名を見送る」ボタンを出す(誤操作防止に確認を1枚挟む)。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
const stripComments = t => t.replace(/\/\/[^\n]*/g, '');

// ── 1. 0名ガードが復活していないこと ──
{
  const at = ui.indexOf('function startDraftNegotiation()');
  assert.ok(at > 0, 'startDraftNegotiation が無い');
  const body = stripComments(ui.slice(at, at + 1400));
  assert.ok(!/selections\.length === 0\)\s*return/.test(body),
    '0名ガードが復活している。プレイヤーが指名しない年に他団体の指名まで止まる');
}

// ── 2. 他団体の指名処理が同じ関数の中にあること(構造の前提を固定する) ──
{
  const at = ui.indexOf('function startDraftNegotiation()');
  const end = ui.indexOf('\n}', ui.indexOf('_showScreenNoBgm(\'scoutEvent\');', at));
  const body = ui.slice(at, end > at ? end : at + 12000);
  assert.ok(/!isSelected && aiParticipants\.length >= 2/.test(body),
    '非選択候補の自動セリがこの関数から消えている。'
    + '別の場所へ移したなら、そこがプレイヤーの参加と無関係に走ることを確かめて本テストを書き直すこと');
  assert.ok(/!isSelected && aiParticipants\.length === 1/.test(body),
    '非選択候補の単独落札がこの関数から消えている');
}

// ── 3. 見送りの出口があり、確認を挟むこと ──
{
  assert.ok(/function declineDraft\(\)/.test(ui), 'declineDraft が無い(見送る出口が無い)');
  const at = ui.indexOf('function declineDraft()');
  const body = ui.slice(at, ui.indexOf('\n}', at));
  assert.ok(/showConfirm\(/.test(body),
    '見送りに確認が無い。1年ぶんの指名を誤操作で捨てられてしまう');
  assert.ok(/startDraftNegotiation\(\)/.test(body),
    '見送りが startDraftNegotiation を呼んでいない。他団体の指名が走らない');
  assert.ok(/他団体の指名はこのまま進みます/.test(body),
    '確認文に「他団体の指名は進む」と書かれていない。'
    + 'プレイヤーが「全員フリーになる」と誤解する');
}

// ── 4. 画面の出口: 0名なら見送りボタン、1名以上なら交渉開始 ──
{
  assert.ok(/onclick="declineDraft\(\)"/.test(render),
    'ドラフト画面に見送りボタンが無い');
  assert.ok(/selections\.length > 0[\s\S]{0,400}?onclick="startDraftNegotiation\(\)"/.test(render),
    '1名以上のとき交渉開始へ進めない');
  assert.ok(!/★ 候補を選択してください'}<\/button>/.test(render),
    '押しても何も起きない飾りボタンが残っている');
}

console.log('draft-decline-test: ok');
