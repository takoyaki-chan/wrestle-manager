# Tag Match Prototype Codex

Wrestle Manager 本体を編集せず、タッグマッチ専用の進行層だけを外出しで試す独立プロトタイプです。

## 含めたもの

- 静的コピーした選手データ 26 名
- タッグ chemistry 算出
- セグメント制の自動試合進行
- タッチ判定の `したい / できる` 分離
- 孤立、ホットタグ、カットイン、ダブルチーム、見殺し、同士討ち
- タッグ専用 MQ
- 10 seeds x 10 matches の簡易安定性バッチ

## 含めていないもの

- Wrestle Manager 本体との接続
- アライメント由来の反則、場外乱闘、レフェリー死角
- ペア固定タッグフィニッシャー

## 使い方

1. `index.html` をブラウザで開く
2. 左右のチームを選ぶ
3. `Simulate Match` で単発試合
4. `Run Batch 10x10` で安定性チェック

## ファイル構成

- `index.html`: UI エントリ
- `src/tag-data.js`: 本体から抜き出した静的選手データ
- `src/tag-chemistry.js`: chemistry 算出とおすすめペア計算
- `src/tag-engine.js`: タッグ試合エンジン
- `src/tag-ui.js`: ブラウザ UI
