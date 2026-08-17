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
// カード編成ピッカー行(§4)は最新の実機報告を正とする:
// 「名前/行クリック=選択、顔クリック=選手詳細」。顔のラッパーだけが
// stopPropagation+showFighterPopup を持ち、名前は親行の選択へ伝播する。

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

// §4 カード編成ピッカー行(タッグ: App.setTagSlotFighter / シングル: _spSelectFighter)
// 最新裁定: 名前/行クリック=選択、顔クリック=詳細。
// 「顔ラッパーだけが詳細を開く」と「名前にonclickが無い」を対で検査する。
{
  const anchors = [
    [/onclick="App\.setTagSlotFighter\(/, 'タッグスロットピッカー行'],
    [/onclick="_spSelectFighter\(/, 'シングル戦ピッカー行'],
  ];
  for (const [anchor, label] of anchors) {
    const blocks = linesAround(uiRender, anchor, 0, 0, label);
    // 「✕ この選手を外す」行も同じ onclick を持つので、選手行(${c.name} を含む行)だけ見る
    const fighterRows = blocks.filter(b => b.includes('${c.name}'));
    assert.ok(fighterRows.length > 0,
      `${label}: 選手行(\${c.name} を含む行)が見つからない(検査が空振り=stale)。テンプレートが変わったなら本テストを新しい真実に合わせること`);
    for (const row of fighterRows) {
      assert.ok(!CLICKABLE_PORTRAIT.test(row),
        `${label}内の顔は専用ラッパーで操作を分ける。portraitImg自体へ第4引数を戻さないこと:\n${row}`);
      assert.ok(/class="sp-picker-face-detail"[^>]*onclick="event\.stopPropagation\(\);showFighterPopup/.test(row),
        `${label}の顔クリックが選手詳細に割り当てられていない:\n${row}`);
      assert.ok(!/<span[^>]*onclick=[^>]*>\$\{c\.name\}<\/span>/.test(row),
        `${label}の名前に詳細onclickが残っている。名前は親行へ伝播して選択する:\n${row}`);
    }
  }
}

console.log('selection-surface-portrait-guard-test: ok (一般選択面は全面選択／カード編成ピッカーは名前=選択・顔=詳細)');
