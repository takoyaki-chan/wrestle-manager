# Claude Code 指示書: 関係イベントの可視化追加

以下を実装してください。今回は「セリフ本文の作成」は後回しで構いません。先にイベント発火・モーダル登録・payload 整備・UI 接続までを行ってください。

## 目的

- すでに関係値だけは大きく動いているのに、プレイ中に「何が起きたか」が見えないケースを減らす
- 特に、引き抜き・引き留め失敗・BF/Heel 衝突・離脱/引退系の negative な関係変動を、モーダルまたは専用イベントとして認識できるようにする

## 今回の前提

- 既存で見えるイベント
  - 契約離脱の裏切り: `M-1`
  - 共闘ペア裏切り: `M-17`
  - 価値観の決裂: `M-18`
- 今回追加したいのは、未可視化の negative 関係イベント
- セリフ本文は仮テキストでもよい
- 実装優先度は `M-20` → `M-21` → `M-19` → `M-22` / `M-23`

## 未可視化の対象

### 1. BF×Heel 週次衝突

- 発生元
  - `src/relationships.js`
  - `N-03: Babyface×Heel 週次衝突`
- 現状
  - 関係値だけ変動しており、`_enqueueModal` がない
- 追加内容
  - 新規モーダル `M-19`
  - payload 例:
    - `{ fromId, toId, orgId, bondDelta, rivalryDelta }`
  - 発火制限:
    - 同一ペアで短期間に連打しない
    - 目安: 同一ペア `26週` に `1回` まで、または `1シーズン1回`

### 2. 引き抜き成立時の遺恨

- 発生元
  - `src/management.js`
  - `resolvePoach(... accepted=true ...)`
- 現状
  - 結果表示はあるが、関係イベントとしての専用モーダルがない
- 追加内容
  - 新規モーダル `M-20`
  - payload 例:
    - `{ fighterId, toOrgId, byIds, mode: 'poach' }`
  - 内容の方向性
    - `M-1` に近い
    - 残留者側が「引き抜かれた」「見捨てられた」と受け止める演出

### 3. 引き留め失敗で抜けた時の遺恨

- 発生元
  - `src/management.js`
  - `resolvePoach(... accepted=false, defense_failed ...)`
- 現状
  - `引き留め失敗` の結果表示だけ
  - 関係イベント専用モーダルがない
- 追加内容
  - 新規モーダル `M-21`
  - payload 例:
    - `{ fighterId, toOrgId, byIds, mode: 'defense_failed' }`
  - 内容の方向性
    - `M-20` より重い
    - 「引き止めたのに出ていった」ことが分かる見せ方にする

### 4. 引退・負傷引退・突然離脱による関係悪化

- 発生元
  - `src/management.js`
  - 引退
  - 負傷引退
  - 突然離脱
- 現状
  - 関係値は下がるが、残された側の emotional な反応が見えない
- 追加内容
  - 引退/負傷引退用: `M-22`
  - 突然離脱用: `M-23`
  - payload 例:
    - `M-22`: `{ fighterId, affectedIds, mode: 'retire' | 'injury_retire' }`
    - `M-23`: `{ fighterId, affectedIds, mode: 'sudden_departure' }`
  - 内容の方向性
    - 裏切りではなく喪失・不信・置き土産

## 実装方針

### A. relationships 側

- `Engine.relationships.flags._enqueueModal` の既存流儀に合わせる
- 新規 modal key を `M-19` `M-20` `M-21` `M-22` `M-23` として追加する
- 既存の `M-1` `M-17` `M-18` の payload 形式を参考にする

### B. ui-common 側

- `src/ui-common.js` の modal title 定義に `M-19` 以降を追加する
- tone / priority は以下を目安にする
  - `M-19`: `negative`, priority `3`
  - `M-20`: `negative`, priority `3`
  - `M-21`: `negative`, priority `4`
  - `M-22`: `negative` または空, priority `2`
  - `M-23`: `negative`, priority `3`

### C. flag-dialogue 側

- 今回は仮文言でよい
- personality ごとの量産は後回しでもよい
- 最低限 `normal` だけでも表示できるようにする
- 後でセリフ差し替えしやすい構造を崩さない

### D. 発火頻度の制御

- 週次衝突系は連打されると邪魔なので、抑制が必要
- 推奨:
  - `state.relationshipEventCooldowns` のような管理を追加する
  - 少なくとも `M-19` だけは同一ペアにクールダウンを入れる
- 引き抜き/引退系はイベント単位で 1 回だけなので特別なクールダウンは不要

## 優先順位

1. `M-20` 引き抜き成立時の遺恨
2. `M-21` 引き留め失敗の遺恨
3. `M-19` BF×Heel 衝突
4. `M-22` 引退/負傷引退
5. `M-23` 突然離脱

## 受け入れ条件

- 引き抜き成立時に、従来の結果表示に加えて `M-20` が出る
- 引き留め失敗時に、従来の結果表示に加えて `M-21` が出る
- BF×Heel 衝突時に、条件を満たせば `M-19` が出る
- 引退/負傷引退/突然離脱時に、少なくとも 1 件は対応するモーダルが出る
- 既存の `M-1` `M-17` `M-18` を壊さない
- セリフは仮でもよいが、UI 上で破綻しない

## 補足

- 今回は「イベントの見える化」が目的
- 関係値バランスの再調整は行わない
- セリフ強化は後続タスクで対応する
