# バグ修正指示書（Claude Code向け）

作成日: 2026-03-26
対象リポジトリ: `wrestle-manager`
優先度: 高

## 目的

直近の大型更新後レビューで見つかった、挙動不良につながる3件の不具合を修正してください。
今回の主眼は「表彰ロジックの破綻」「収入の重複計上」「新聞プレビューの機能不全」の解消です。

## 修正対象

### 1. メディア功労賞が選出されない

- 症状
  - 年末表彰で `mediaAward` が実質的に発生しない。
- 主な確認箇所
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L8710)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L8866)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L9977)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L11480)
- 原因
  - オフシーズン1週目で `Engine.growth.applySeasonEnd()` を先に実行し、その中で `mediaRevSeason` / `talentRevSeason` / `talentCountSeason` を 0 に戻してから `pendingAwards` を生成している。
  - そのため `Engine.awards.selectMediaAward()` が参照する年間実績が消えた状態で表彰選出が走っている。
- 期待する修正
  - 表彰選出時点では、当該シーズンの `mediaRevSeason` / `talentRevSeason` / `talentCountSeason` が保持されていること。
  - 実績のリセットは「表彰生成後」にずらすか、表彰用スナップショットを先に確保してからリセットすること。
  - 他の賞やシーズン切替処理への副作用が出ないこと。
- 完了条件
  - 該当シーズンでメディア収入やタレント収入を積んだ選手がいれば、`pendingAwards.mediaAward` が適切に生成される。
  - 新シーズン開始時には年間カウンタが正しく 0 に戻っている。

### 2. `_pendingMediaIncomes` が消えず、メディア収入が毎週重複計上される

- 症状
  - PPV / JT / 対抗戦 / 挑戦状などで積まれた `_pendingMediaIncomes` が settlement 後も残り、翌週以降も繰り返し収入に加算される。
- 主な確認箇所
  - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js#L6028)
  - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js#L6619)
  - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js#L6961)
  - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js#L7477)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5632)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5623)
- 原因
  - `Engine.season.processSettlement()` では `_pendingMediaIncomes` を読み取って `details` に加算しているが、消費済みとしてクリアしていない。
  - そのまま次状態へ引き継がれるため、同じ pending データが複数週で再利用される。
- 期待する修正
  - `_pendingMediaIncomes` は settlement で一度だけ消費される transient データにすること。
  - 既存の `_pendingPromoIncomes` / `_pendingPromoGoods` などと同じく、「その週の収支に反映後は残らない」状態にすること。
  - クリア方法は、`processSettlement()` の返却値側で除去する方法でも、呼び出し元で settlement 後に明示除去する方法でもよいが、重複計上が確実に防げること。
- 完了条件
  - `_pendingMediaIncomes` を持つ週の settlement 直後に、次 state からそのデータが消えている。
  - 翌週に同じメディア収入が再計上されない。

### 3. 新聞「次回展望」のファン期待カードが表示されない

- 症状
  - 新聞プレビューの `fanExpect` セクションが実質空になる。
- 主な確認箇所
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L17317)
  - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js#L4648)
  - [src/ui-render.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-render.js#L3811)
- 原因
  - プレビュー生成が `state.fanExpectation` / `G.fanExpectation` を参照しているが、現行の期待カード系ロジックは `Engine.fanExpect.generate(state)` を都度使う構成になっている。
  - そのため preview 生成時に参照元が存在せず、`fanExpect` が空になっている。
- 期待する修正
  - プレビュー生成は保存フィールド前提ではなく、現行ロジックに合わせて `Engine.fanExpect.generate(...)` から構築すること。
  - `Engine.newspaper.buildPreview()` と、必要なら `App` 側の新聞データ組み立ても同じ基準に揃えること。
  - 既存 UI の `pv.fanExpect` 形式は壊さないこと。
- 完了条件
  - 条件を満たす状態では、新聞の次回展望にファン期待カードが表示される。
  - 期待カードがない場合のみ空表示になる。

## 修正順の推奨

1. `mediaAward` 問題を直す
2. `_pendingMediaIncomes` の消費漏れを直す
3. 新聞プレビューの `fanExpect` 参照を現行仕様に合わせる
4. 影響範囲を軽く通し確認する

## 実装時の注意

- 既存セーブデータとの互換性を壊さないこと。
- `pendingAwards` や `_pendingMediaIncomes` は transient な性質が強いので、保存タイミングと復旧フローも意識すること。
- 年末処理はオフシーズン進行、新聞生成、表彰演出、殿堂入り処理と密結合なので、局所修正でも前後フローを確認すること。
- 既存の未関連変更は巻き戻さないこと。

## 最低限の確認項目

- メディア実績を積んだ選手がいる状態でオフシーズン1週目に入り、`pendingAwards.mediaAward` が入ること。
- その後、新シーズンでは `mediaRevSeason` / `talentRevSeason` / `talentCountSeason` がリセットされていること。
- `_pendingMediaIncomes` を持つ状態で settlement を通し、翌週に再加算されないこと。
- 新聞生成時に `preview.fanExpect` が埋まるケースと空になるケースの両方が自然であること。
- 可能なら `node test/mq-analysis.js` を再実行し、少なくとも致命的な例外が出ないこと。

## 期待する成果物

- 上記3件を修正したコード
- 必要なら最小限の補助コメント
- 変更後の確認結果メモ
