# AI団体パリティ #02: 選手間対立（B2）

## 概要
AI団体でもB2（選手間の深刻対立）イベントを発生させる。
trust<40の選手が2人以上いる場合に抽選され、対立→試合or話し合いで解決する。

## 現状の問題
- プレイヤー団体ではtrust低下が蓄積すると選手間対立が発生し、bond/rivalry変動が起きる
- AI団体はtrust管理・applyMatchResultは共通だが、対立イベント自体が発生しない
- 人間関係ダイナミクスに差が出る

## 変更方針

### 1. processAIWeeklyEventのB2許可
- `engine.js:3457-3461` のBフォールバック処理でB2も通過させる
- B2が抽選された場合、AI自動判断で処理

### 2. AI自動判断ロジック
B2は3ステップのフロー（Step0→Step1→Step2）:

**Step 0（初手選択）**:
- Choice 0: 話し合い → both trust+5, morale+3
- Choice 1: 試合で決着 → Step1へ
- Choice 2: 放置 → both trust-8, morale-10

tier別自動選択:
- **S tier**: 60%話し合い、35%試合、5%放置（資金力で解決志向）
- **A tier**: 40%話し合い、45%試合、15%放置
- **B tier**: 20%話し合い、40%試合、40%放置（リソース不足で放置傾向）

**Step 1（試合時の介入選択）**:
- Choice 0/1: どちらかを支持 → OVR+5バフ
- Choice 2: 中立
- tier問わず50%中立、25%/25%でどちらか支持

**Step 2（試合実行+結果適用）**:
- `simulateMatch`で対立試合を実行（matchTier=1）
- 勝敗結果に基づくtrust/popularity変動を適用
- **Phase4 E-02の関係性効果**: applyToRosterでbond/rivalry変動

### 3. 試合シミュレーション
- AI内部でsimulateMatchを呼び出し（B2はUI不要）
- 既存applyLargeEventEffect Step2のロジックをそのまま適用
- matchResultをapplyMatchResultにも通す（h2h記録等）

### 4. 新聞連携
- **新priority追加**: `aiTeamConflict: 110`（aiRetirement:100より少し上）
- **ニュースフラグ**: `aiData._newsTeamConflict` に蓄積
  ```javascript
  {
    orgName, fighter1Id, fighter1Name, fighter2Id, fighter2Name,
    resolution: 'talk'|'match'|'ignore',
    matchWinner: name|null,   // 試合決着の場合
    matchMQ: number|null,
  }
  ```
- **newspaper.generate()内で記事化**:
  - 話し合い解決: `{orgName}で{f1}と{f2}の確執が浮上——話し合いで収束`
  - 試合決着: `{orgName}の{f1}と{f2}、リング上で決着！ {winner}が勝利（MQ{mq}）`
  - 放置: `{orgName}の{f1}と{f2}に亀裂——団体側は静観の構え`
  - 試合MQ70+なら「名勝負」トーンに格上げ
- **clearAINewsFlags()に`_newsTeamConflict`追加**

## 影響範囲
- `engine.js`: processAIWeeklyEvent, _applyAILargeEvent(B2分岐), newspaper.generate, clearAINewsFlags
- 関係性: applyMatchResult, applyToRoster（既存関数呼び出しのみ）
- `app.js`: 変更なし
- `data.js`: 変更なし

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体でB2発生→bond/rivalry変動が正常に起きることを確認
- trust<40が蓄積するAI団体（B tier等）で適切な頻度でB2が発生するか
- 新聞に対立記事が表示されることを確認
