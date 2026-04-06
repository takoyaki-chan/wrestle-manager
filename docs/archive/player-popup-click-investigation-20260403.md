# 選手名クリック不発 調査報告書

調査日: 2026-04-03

## 結論

選手名クリックで詳細が出ない主因は、`showFighterPopup(...)` の先頭で動いている「ポップアップ多重起動防止」のキュー処理です。

`src/ui-common.js` の `showFighterPopup` は、何らかのポップアップが開いている間は詳細をその場で開かず、無言でキューに積んで終了します。

該当箇所:

- [src/ui-common.js:2580](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L2580)
- [src/ui-common.js:2584](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L2584)
- [src/ui-common.js:29](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L29)
- [src/ui-common.js:37](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L37)

```js
function showFighterPopup(fighterId, source, _skipQueueCheck) {
  const c = findFighter(fighterId, source);
  if (!c) return;
  if (!_skipQueueCheck && _isPopupActive()) {
    _popupQueue.push(() => showFighterPopup(fighterId, source));
    return;
  }
```

このため、ユーザーから見ると「クリックできていない」のではなく、「クリックは受けているが、その場で何も表示しない」状態が多数発生します。

## 原因の特定

### 1. 何か1つでもオーバーレイが開いていると詳細表示を抑止する

`_isPopupActive()` は以下をポップアップ中と見なします。

- `fighterPopupOverlay`
- `showResultOverlay`
- `notifModalOverlay`
- `careModalOverlay`
- `newspaperOverlay`
- `eventPopupOverlay`
- `retirementPopupOverlay`
- `rivalryPopupOverlay`
- `coachTooltipOverlay`
- そのほか複数

根拠:

- [src/ui-common.js:29](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L29)
- [src/ui-common.js:39](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L39)

つまり、ユーザーが「表示中の別 UI を見ながらその場で別選手に飛びたい」と思っても、実装上は即時表示されません。

### 2. 既に選手詳細を開いている状態で、詳細内の別選手名を押しても即切替しない

これは再現性が高いです。

選手詳細ポップアップ内でも別選手へのリンクを出していますが、そのリンクは通常の `showFighterPopup(...)` を呼ぶだけで、キュー回避フラグを付けていません。

例:

- ライバル欄の別選手リンク
  - [src/ui-common.js:2851](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L2851)
- 汎用リンクヘルパ
  - [src/ui-common.js:3276](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L3276)
  - [src/ui-common.js:3284](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L3284)

この状態では `fighterPopupOverlay` 自体が active なので、クリックしても新しい選手詳細はその場で開かず、現在のポップアップを閉じるまで保留されます。

ユーザー体感としてはかなり自然に「押しても出ない」になります。

### 3. クリック導線が広い箇所と狭い箇所が混在している

画面によっては行全体がクリック対象ですが、画面によっては名前テキストだけです。

例:

- 行全体クリック
  - [src/ui-render.js:3070](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-render.js#L3070)
  - [src/ui-render.js:2852](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-render.js#L2852)
- 名前テキスト中心
  - [src/ui-common.js:3284](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L3284)
  - [src/ui-render.js:4](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-render.js#L4)

この差は「同じように見える名前なのに、押しやすさが画面ごとに違う」体感を生みます。ただし、今回の不具合の主因はここよりもキュー処理です。

## 状況の整理

### 高確率で不発に見える場面

1. 選手詳細ポップアップを開いた状態で、その中の別選手名を押す
2. 新聞、結果画面、通知モーダルなど別オーバーレイが出ている最中に選手名を押す
3. オーバーレイの閉じ際にすぐ別選手名を押す

### 低確率だが体感悪化に寄与する場面

1. 名前テキストだけがクリック対象の画面
2. テキスト周辺にバッジや別 UI が密集している画面

## 技術的評価

今回の挙動は「DOM がクリックを失っている」というより、アプリが意図的に即時表示を止めている設計上の問題です。

特に問題なのは以下です。

- ユーザー操作に対してフィードバックがない
- キュー送りされたことが UI 上わからない
- 既存ポップアップ内リンクでも同じ抑止ロジックが走る

そのため、バグの見え方は「クリック判定が壊れている」に近くなります。

## 優先度

高。

選手詳細はゲームの主要情報導線で、しかも複数画面から使われています。ポップアップ設計の共通部に原因があるため、影響範囲は広いです。

## 修正方針の候補

1. ユーザー起点の選手名クリックではキューを使わず、現在の選手詳細を即座に差し替える
2. 少なくとも `fighterPopupOverlay` が開いているときの選手名クリックは `_skipQueueCheck=true` で即切替する
3. 他オーバーレイ上の選手名クリックは、許可するものと禁止するものを整理する
4. 名前だけクリックの箇所は、可能なら行全体クリックに寄せてヒット領域を広げる

## 補足

今回はコード調査ベースで原因を特定しています。ブラウザ実機での操作確認は未実施ですが、少なくとも上記キュー処理は「押したのに出ない」症状を直接説明できる実装になっています。
