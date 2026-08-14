#!/usr/bin/env node
'use strict';

// 選択サーフェス内の顔画像ガード (2026-08-14)
//
// バグ捜索体制③(レア画面強制点火カタログ)の初回実走で発見した型の再発防止。
// portraitImg の第4引数(clickable)を渡すと顔に
//   onclick="event.stopPropagation();showFighterPopup(...)"
// が付く。これが「クリック=選択」のサーフェス(大型イベントの選手ピック/
// 天頂戦エントリー行/通常PPVエントリー行)の内側にあると、選択リスナーが
// stopPropagation に飲み込まれ、顔を押しても選手を選べなくなる。
// 慣例の正: task-87 同行者選択(.crq-party-cand)=選択チップ内の顔は素の<img>で
// チップ全面がクリック=選択。
//
// 対象外(意図的に検査しない): カード編成ピッカー行(setTagSlotFighter /
// _spSelectFighter、24px顔)。同型だが毎週使う画面の操作感が変わるため
// Keisuke 裁定待ち(2026-08-14 報告済み)。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const uiCommon = readSource('src', 'ui-common.js');
const uiRender = readSource('src', 'ui-render.js');

// portraitImg(...) 呼び出しに第4引数(clickable)が付いているか
const CLICKABLE_PORTRAIT = /portraitImg\([^)]*,[^)]*,[^)]*,[^)]*\)/;

function linesAround(source, anchorRegex, before, after, label) {
  const lines = source.split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    if (anchorRegex.test(line)) {
      hits.push(lines.slice(Math.max(0, i - before), i + after + 1).join('\n'));
    }
  });
  assert.ok(hits.length > 0, `${label}: アンカー ${anchorRegex} がソースから消えた(検査が空振り=stale)。UIが変わったなら本テストを新しい真実に合わせること`);
  return hits;
}

// §1 大型イベントの選手ピックカード(2箇所: タレント活動/密着取材)
{
  const blocks = linesAround(uiCommon, /class="large-evt-fighter-pick" data-fighter-id/, 6, 0, '大型イベント選手ピック');
  assert.strictEqual(blocks.length, 2, `large-evt-fighter-pick のテンプレートは2箇所の想定(実際 ${blocks.length})。増減したら本テストの対象数を更新`);
  for (const block of blocks) {
    assert.ok(!CLICKABLE_PORTRAIT.test(block),
      `大型イベントの選手ピックカード内で portraitImg に第4引数(clickable)が渡されている。顔クリックが選択を飲み込む:\n${block}`);
  }
}

// §2 天頂戦エントリーの団体枠選択行(App.tcTogglePick)
{
  const blocks = linesAround(uiCommon, /onclick="App\.tcTogglePick\(/, 0, 8, '天頂戦エントリー選択行');
  for (const block of blocks) {
    assert.ok(!CLICKABLE_PORTRAIT.test(block),
      `天頂戦エントリー選択行内で portraitImg に第4引数が渡されている。顔クリックがトグルを飲み込む:\n${block}`);
  }
}

// §3 通常PPVエントリーの選択行(togglePPVPick)
{
  const blocks = linesAround(uiRender, /onclick="togglePPVPick\(/, 0, 8, '通常PPVエントリー選択行');
  for (const block of blocks) {
    assert.ok(!CLICKABLE_PORTRAIT.test(block),
      `通常PPVエントリー選択行内で portraitImg に第4引数が渡されている。顔クリックがトグルを飲み込む:\n${block}`);
  }
}

console.log('selection-surface-portrait-guard-test: ok (大型イベントピック2/天頂戦エントリー行/通常PPV行 — 選択面の顔は素通し)');
