# バグ修正指示書 追補（Claude Code向け）

作成日: 2026-03-26
対象リポジトリ: `wrestle-manager`
位置づけ: 先に送付済みの修正指示書の追加分

## 目的

先の指示書に加えて、追加レビューで見つかった不具合を修正してください。
今回は主に「pending収入の消費漏れ」と「表示・参照の整合性ずれ」が対象です。

## 追加修正対象

### 4. `_pendingPromoIncomes` / `_pendingPromoGoods` も毎週重複計上される

- 症状
  - プロモ実行で発生した収入が settlement 後も残り、翌週以降も再計上される可能性がある。
- 主な確認箇所
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5562)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5590)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5602)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5855)
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L5860)
- 原因
  - `_pendingPromoIncomes` / `_pendingPromoGoods` が `processSettlement()` で収支に取り込まれている一方、消費後に state から除去されていない。
  - 構造的には `_pendingMediaIncomes` と同じ問題。
- 期待する修正
  - プロモ由来の pending 収入も settlement で一度だけ消費される transient データにすること。
  - `_pendingMediaIncomes` の修正と同じ設計で揃えること。
- 完了条件
  - プロモ週の settlement 後、翌週に同じ収入が再計上されない。

### 5. メディア功労賞の金額表示単位が壊れている

- 症状
  - 表彰画面のメディア功労賞で、収入表示が極端に小さくなる。多くのケースで `0万円` 近い表示になる。
- 主な確認箇所
  - [src/ui-common.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js#L1974)
- 原因
  - `totalRev` / `mediaRevSeason` / `talentRevSeason` は他の収支と同じ「万」単位で扱われているのに、表示時に `10000` で割っている。
- 期待する修正
  - 既存の資金・収支UIと同じ単位系で表示すること。
  - 不要な `10000` 除算を外し、必要なら `toLocaleString()` 等で見やすく整えること。
- 完了条件
  - 実際の内部値に対応した自然な「万円」表示になる。

### 6. ファン期待カードの古い参照がもう1箇所残っている

- 症状
  - 新聞やプレビューの経路によって、ファン期待カードが空のままになる可能性がある。
- 主な確認箇所
  - [src/engine.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/engine.js#L17317)
  - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js#L4648)
- 原因
  - `state.fanExpectation` / `G.fanExpectation` 前提の古い参照が複数箇所に残っている。
  - 一方だけ直しても、別経路ではまだ空表示が残る。
- 期待する修正
  - `Engine.fanExpect.generate(...)` ベースに統一すること。
  - 新聞生成と `App` 側 preview 組み立てで、同じルールから `fanExpect` を作ること。
- 完了条件
  - 期待カードが成立する状態で、関連プレビュー経路のどちらでも `fanExpect` が自然に埋まる。

## 追加の確認項目

- プロモ実行後の settlement を 2 週以上またいで確認し、同じ収入が再加算されないこと。
- メディア功労賞の表彰スライドで、総額・内訳が妥当な値で表示されること。
- 新聞プレビューと `App` 側 preview の両方で、ファン期待カードが表示されること。

## 補足

- pending 系の不具合は同系統なので、`_pendingMediaIncomes`、`_pendingPromoIncomes`、`_pendingPromoGoods` をまとめて「消費後に残さない」方針で整理すると安全です。
- 表示不具合はロジック修正後に初めて目立つ可能性があるため、表彰画面の確認も合わせて実施してください。
