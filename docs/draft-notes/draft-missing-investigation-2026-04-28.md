# ドラフト未発生調査メモと対応計画

作成日: 2026-04-28

## 結論

「ドラフトが起こらない年がある」件は、現時点では単一原因を断定できません。
ただし、コードと簡易シミュレーションから、優先度順に次の3系統が有力です。

1. ドラフト候補の若年プールが痩せる設計上の脆さ
2. ドラフトは発生しているが、交渉対象なしで即終了して見える導線
3. セーブ/ロード境界で `scoutEvent` 状態が壊れる可能性

## 調査結果

### 1. オフ第3週では毎年ドラフト候補生成が走る

- 候補生成の入口は [src/management.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/management.js:12146) - [src/management.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/management.js:12187)
- オフ第3週で `Engine.scout.generateScoutReport(..., 'offseason')` を必ず呼び、`weekPhase: 'scoutEvent'` に遷移している

つまり、設計上は「その年だけドラフト処理を丸ごと飛ばす」分岐は見当たりませんでした。

### 2. ただし候補生成元は 17-18 歳の `dormantPool` に強く依存している

- 候補抽出ロジックは [src/management.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/management.js:10861) - [src/management.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/management.js:10927)
- `generateScoutReport()` は `dormantPool` のうち 17-18 歳だけを `draftEligible` として使う
- その人数が少ないと、候補数は設定値 `[6,8]` まで届かず、そのまま少数開催になる

このため、若年層が尽きた年は「ドラフト縮小」または最悪「候補0」の潜在リスクがあります。

### 3. 実測では候補0年は再現しなかったが、若年層はかなり細る

簡易シミュレーションで 20 シーズン x 複数 seed を確認。

- seed `42, 7, 123, 999, 2026` ではオフドラフト候補数は毎年 `6-8` 名
- ただし残存若年プールはかなり薄くなり、seed `999` の `S5` 時点では「候補抽出後の残り 17-18 歳」が `0`

重要なのは、今回は「候補生成後の残り」が 0 だった点です。
つまり直ちに不具合再現ではないものの、供給余力はかなり小さいです。

### 4. ドラフトが「見た目上」発生しない経路がある

- 候補選択 UI は [src/ui-render.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-render.js:5161) - [src/ui-render.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-render.js:5174)
- 実際の交渉開始は [src/ui-common.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js:4642) - [src/ui-common.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js:4808)
- `uiQueue.length === 0` の場合は [src/ui-common.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js:4760) - [src/ui-common.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/ui-common.js:4767) で結果だけ作って即終了する

このため、ユーザー視点では次の2パターンが「ドラフトが起きなかった」に見えます。

- 候補一覧は出たが、星選択をせず交渉開始していない
- 選択内容と AI 参加状況の組み合わせで、交渉 UI を経ずに即結果確定した

### 5. セーブ/ロードまわりは要注意だが未再現

- ロード時の `scoutEvent` クリーンアップは [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js:2183) - [src/app.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/app.js:2185)
- `weekPhase !== 'scoutEvent'` のときにドラフト関連一時状態を消す

今回は直接の再現までは取れていません。
ただし、ドラフト前後の中間状態でロードが入ると、復元不全が体感不具合になる余地はあります。

## 原因仮説の優先順位

### A. 最優先: 若年プール供給の保証不足

根拠:

- 候補生成が 17-18 歳限定
- 年次補充は [src/management.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/management.js:12057) - [src/management.js](/C:/Users/nkmrk/Downloads/wrestle-manager/src/management.js:12099) の年間 cap 依存
- 若年人数そのものを直接保証していない

リスク:

- 長期プレイや特定 seed で候補不足
- 症状が「毎年ではない」「頻繁にある」に見えやすい

### B. 次点: 即時終了導線が体感上わかりにくい

根拠:

- `uiQueue` が空だと交渉演出なしで終了
- 候補一覧と交渉フェーズが分かれている

リスク:

- 内部的には正常でも、ユーザーには「今年はドラフトがなかった」に見える

### C. 三番手: ロード境界での状態欠落

根拠:

- `scoutEvent` 依存の一時状態が多い
- ロード時にクリーニングが入る

リスク:

- オートセーブ/手動ロード直後だけ再発

## 対応方針

### 方針1. ドラフト開催保証をコード上で明示する

候補生成時に「17-18 歳が足りないなら代替供給する」フォールバックを入れる。

候補:

- `dormantPool` の 19-20 歳まで一時的に候補対象へ広げる
- 年次補充の時点で 17-18 歳最低人数を保証する
- `generateScoutReport()` 側で不足分だけ retired returnees から補充する

推奨は「年次補充で若年最低数を保証」+「候補生成で最終フォールバック」の二段構え。

### 方針2. “ドラフトは起きたが即終了” を明示する

`uiQueue.length === 0` で即終了する場合でも、少なくとも次を出す。

- 明示ログ
- 結果ページの見出し強化
- 必要ならトースト/ポップアップ

これで体感不具合と本当の未発生を切り分けやすくする。

### 方針3. 再発時の観測性を上げる

再現が不定期なので、最低限の診断ログを仕込む。

候補:

- オフ第3週開始時の `dormantPool` 総数
- 17-18 歳数
- 生成候補数
- `uiQueue.length`
- 即終了理由

## 実装計画

### Step 1. 観測ログを追加

対象:

- `Engine.scout.generateScoutReport()`
- オフ第3週分岐
- `startDraftNegotiation()`
- `uiQueue.length === 0` 分岐

目的:

- 次回報告時に「候補不足」「即終了」「ロード復元不全」を識別できるようにする

### Step 2. 若年供給保証を追加

第一候補:

- オフ第1週の `dormantPool` 補充処理に「17-18歳最低人数」を追加

詳細案:

- `YOUTH_MIN_FOR_DRAFT` を定数化
- 年次補充後、17-18歳人数が閾値未満なら追加補充
- 追加元は retired returnees 優先

### Step 3. 候補生成フォールバックを追加

詳細案:

- `generateScoutReport()` 内で 17-18 歳が足りなければ 19 歳、20 歳の順に補完
- それでも不足ならログに warning を残す

これで「年によって候補数がゼロ」は実質防げます。

### Step 4. 即終了年の UI を改善

詳細案:

- `uiQueue.length === 0` のとき専用メッセージを結果ページへ追加
- 文言例:
  - 「今年の指名候補では交渉対象が発生しませんでした」
  - 「AI先行指名/単独確定のみでドラフトが終了しました」

### Step 5. セーブ/ロード確認テストを追加

観点:

- `scoutEvent` 開始直後に保存→ロード
- `_draftInterests` あり状態で保存→ロード
- `_draftNegotiation` 進行中の保存→ロード

## テスト計画

### 自動テスト

1. 長期シミュレーションで毎年オフドラフト候補数が 1 以上
2. 17-18 歳プールが閾値未満でも候補数が確保される
3. `uiQueue.length === 0` のとき結果メッセージが残る
4. `scoutEvent` セーブ/ロード後もドラフト継続可能

### 手動確認

1. オフ第3週で必ずドラフト導線が見える
2. 候補が少ない年でも完全無表示にならない
3. 交渉なし終了年でも理由が見える

## 実装時の注意

- 候補供給を増やしすぎるとドラフト価値が下がるため、まずは「開催保証」に留める
- 19-20 歳をフォールバック採用する場合は、若手ドラフト感を壊さないよう人数制限が必要
- save data 互換を崩さないよう、新定数追加で済ませる

## 今回の判断

実装に入るなら、次の順を推奨します。

1. 観測ログ
2. オフ第1週の若年補充保証
3. `generateScoutReport()` の最終フォールバック
4. 即終了時 UI メッセージ
5. セーブ/ロード回帰テスト
