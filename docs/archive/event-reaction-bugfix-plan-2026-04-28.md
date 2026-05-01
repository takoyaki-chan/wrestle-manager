# イベント反応抜けバグ 修正計画メモ

作成日: 2026-04-28

## 目的

以下の報告を、実装修正とセリフ修正に切り分けて進める。

- 競り落としたときの感謝の言葉がない
- 突然のテレビ出演イベントで、選択後にキャラ反応がない
- ファンイベントの打診でも、選択後にキャラ反応がない
- 引き抜きオファーの結果の選手反応がない。イベントモーダルで見せたい
- オフシーズンで引退受諾したのにラストランがなかった
- ケガ発生モーダルで即特別治療しても選手反応がない

## 結論サマリ

### Claude Code に依頼すべきもの

1. `競り落としたときの感謝の言葉がない`
2. `テレビ出演 / ファンイベント後の反応が出ない`
3. `引き抜きオファー結果の反応がない`
4. `オフシーズンの引退受諾後にラストランがない`
5. `ケガ発生モーダルから特別治療した際の反応がない`

### セリフ調整だけで済む可能性が高いもの

1. `競り落としたときの感謝の言葉がない`

### 実装修正とセリフ確認の両方が必要なもの

1. `テレビ出演 / ファンイベント後の反応がない`
2. `引き抜きオファー結果の反応がない`
3. `ケガ発生モーダルから特別治療した際の反応がない`

### 実装不整合が本命で、セリフ修正は不要そうなもの

1. `オフシーズンの引退受諾後にラストランがない`

## 個別の切り分け

### 1. 競り落としたときの感謝の言葉がない

#### 現状確認

- 競合勝ち時の加入セリフは `src/victory-lines.js` の `SCOUT_SIGNING_LINES.competition_won` を使っている
- 呼び出し元は `src/app.js:3606`, `src/app.js:3730-3737`
- UI 側で加入ポップアップ自体は出しているため、反応が完全に欠落しているというより「文面の方向性」が問題の可能性が高い

#### 判断

- 第一候補はセリフ修正
- 実装側の欠落は薄い

#### Claude Code への依頼内容

- `SCOUT_SIGNING_LINES.competition_won` を確認し、全体として
  - 「競り勝ってくれてありがとう」
  - 「選んでくれたことへの感謝」
  - 「期待に応える」
  というニュアンスが弱いパターンを補強する
- 少なくとも各主要 personality/archetype で、無感情すぎる文や勝敗感だけで終わる文を減らす

#### セリフ担当向けメモ

- 対象ファイル: `src/victory-lines.js`
- 対象キー: `SCOUT_SIGNING_LINES.competition_won`
- 修正の方向:
  - 勝ち抜きへの言及
  - 加入先への感謝
  - 今後の意気込み
  を最低 2 要素は含める

### 2. 突然のテレビ出演イベント / ファンイベント打診で反応がない

#### 現状確認

- 大型イベント B4 の選択後リアクション表示は `src/app.js:8077-8088`
- 台詞データは既に存在
  - `src/data.js` の `LARGE_EVENT_DIALOGUES.B4`
  - `src/data.js` の `LARGE_EVENT_DIALOGUES.B4_cm`
  - `src/data.js` の `LARGE_EVENT_DIALOGUES.B4_variety`
  - `src/data.js` の `LARGE_EVENT_DIALOGUES.B4_fan`
  - その他 `B4_*`
- つまり「台詞データ未定義」より「表示のつなぎ込み漏れ / 表示条件ミス」の疑いが強い

#### 判断

- 主担当は実装修正
- ただし、実装修正後に文面の温度感チェックは必要

#### Claude Code への依頼内容

- `src/app.js:8077-8088` の B4 選択後リアクション表示を見直す
- 次を確認する
  - `choiceIdx > 0` 前提が妥当か
  - B4 の全サブタイプで必ず `showEventPopup` に到達するか
  - `App._applyLargeEventResult(result)` 後でも選択選手を正しく引けるか
  - 他ポップアップや `setTimeout` との競合で埋もれていないか
- 必要なら
  - 選択結果モーダルの直後に確実に 1 回だけ出す
  - B4 専用の「結果 + 一言」フローに寄せる

#### セリフ担当向けメモ

- 実装修正後に不足があれば `src/data.js` の `LARGE_EVENT_DIALOGUES.B4*` を微調整
- ただし現時点ではセリフ不足より表示導線の問題が本命

### 3. 引き抜きオファーの結果の選手反応がない。イベントモーダルで見せたい

#### 現状確認

- 移籍ウィンドウの引き抜き解決は `src/management.js:10155-10253`
- UI 側の解決処理は `src/ui-common.js:5352-5360` の `resolvePoach`
- 現状は state 更新と `refreshAll()` のみで、結果リアクション用ポップアップがない
- `pendingPoach` 自体の表示は `src/ui-render.js:1242-1268`

#### 判断

- これは実装追加が必要
- 反応文も新設または流用が必要

#### Claude Code への依頼内容

- `Engine.transfer.resolvePoach()` の返り値に、結果表示用データを追加する
  - 例: `resultPopup` or `reaction`
  - `fighterId`, `fighterName`, `outcome` (`accepted`, `defended`, `defense_failed`), `orgName`, `fee`, `retentionCost`
- `resolvePoach()` UI 側で、結果に応じた `showEventPopup` を出す
- 期待挙動
  - 承認して移籍: 移籍する選手の反応
  - 引き留め成功: 残留した選手の反応
  - 引き留め失敗: 去る選手の反応

#### セリフ担当向けメモ

- 新規セリフ置き場は未確定
- まずは Claude Code 側で以下どちらかに統一してもらう
  - `src/data.js` に引き抜き結果用辞書を追加
  - 既存加入/退団系辞書を流用できる形に整理
- 必要なキー
  - `poach_accept_player_release`
  - `poach_defended`
  - `poach_defense_failed`

### 4. オフシーズンで引退受諾したのにラストランがなかった

#### 現状確認

- 引退勧告受諾時に `lastRun: true` を付けている
  - `src/management.js:4015-4017`
- オフシーズン末の処理では `lastRun` 選手を期限切れ判定し、引退候補に積んでいる
  - `src/management.js:11918-11960`
- ここで `route = isLastRunExpired ? 'lastrun_expired' : 'season_end'` を作っている一方、
  `selectLine()` 呼び出しが `season_end` 固定になっている
  - `src/management.js:11955`
- さらに、オフシーズンで受諾した場合に「次の興行でラストランを組む」前に週進行だけで期限切れになる可能性がある

#### 判断

- 実装不整合が本命
- セリフの問題ではない

#### Claude Code への依頼内容

- まず仕様確認:
  - オフシーズン中の引退受諾は、翌シーズン最初の興行までラストランを持ち越すべきか
  - それともオフ中 4 週経過で自動引退が仕様か
- バグ報告の意図からは前者が自然
- 修正案
  - `lastRunWeek` のカウントをオフシーズン跨ぎで見直す
  - 少なくとも「オフシーズンで受諾した直後に試合を組めないまま期限切れ」は防ぐ
  - `selectLine()` 呼び出しにも `lastrun_expired` を正しく渡す

#### 受け入れ基準

- オフシーズンで引退受諾した選手が、次に実際に組める興行までラストラン状態を維持する
- ラストラン試合なしで自然消滅しない

### 5. ケガ発生モーダルで即特別治療しても選手反応がない

#### 現状確認

- 社長室からの特別治療は反応モーダルを出す設計
  - `src/app.js:8778-8798`
  - `Engine.shachoshitsu.getReactionText('special_treatment', fighter)` も存在
  - `src/data.js` に `CARE_REACTION_DIALOGUES.special_treatment` も存在
- しかしケガイベントモーダルからの特別治療は `src/app.js:8695-8713`
  - state 更新
  - `closeEventPopup()`
  - `showToast()`
  だけで終わっている

#### 判断

- 完全に実装接続漏れ
- セリフデータは既にある

#### Claude Code への依頼内容

- `src/app.js:8695-8713` の `executeSpecialTreatment(fighterId)` を、通常の社長室書類と同じ反応表示に寄せる
- `Engine.shachoshitsu.getReactionText('special_treatment', fighter)` を使って結果モーダルか eventPopup を出す
- 可能なら UI 一貫性のため `showDecisionResultModal` か既存ケアリアクション導線を再利用する

#### セリフ担当向けメモ

- セリフ追加は基本不要
- 実装修正後にテンポだけ確認

## 実装優先順位

1. `特別治療の反応表示`
2. `引き抜きオファー結果の反応表示`
3. `B4 テレビ出演 / ファンイベントの反応表示安定化`
4. `オフシーズン引退受諾のラストラン持ち越し修正`
5. `競り落とし時の文言調整`

## Claude Code 用の依頼テンプレート

以下をそのまま渡してよい。

```text
イベント反応抜けバグを修正してください。対象は以下です。

1. ケガイベントモーダルから特別治療した時、選手リアクションを表示する
2. 引き抜きオファー解決後、結果に応じた選手リアクションを event popup で表示する
3. B4(テレビ出演 / ファンイベント含む)の選択後、必ず選手リアクションが出るようにする
4. オフシーズンで引退受諾した選手が、試合を組む前にラストラン切れしないよう修正する
5. 競り落とし勝利時の加入セリフを「感謝が伝わる」方向に調整する

参考箇所:
- 特別治療: src/app.js 8695付近, src/management.js 16055付近, src/data.js CARE_REACTION_DIALOGUES.special_treatment
- 引き抜きオファー: src/management.js 10155付近, src/ui-common.js resolvePoach, src/ui-render.js pendingPoach
- B4: src/app.js 8077付近, src/management.js getLargeEventDialogue/applyLargeEventEffect, src/data.js LARGE_EVENT_DIALOGUES.B4*
- 引退ラストラン: src/management.js 4015付近, 11918付近
- 競り落とし文言: src/victory-lines.js SCOUT_SIGNING_LINES.competition_won

修正後は、各ケースの再現手順か確認観点もまとめてください。
```

## 検証観点

- B4 の `activityType = null/cm/variety/fan` で、選択直後に 1 回だけ反応が出る
- 引き抜きオファーで
  - 承認
  - 引き留め成功
  - 引き留め失敗
  の 3 パターンすべてで反応が出る
- ケガモーダルから特別治療した場合、トーストだけで終わらず本人の一言が出る
- オフシーズン引退受諾後、次の興行でラストラン対象として扱われる
- 競り落とし勝利時のセリフに感謝表現が含まれる
