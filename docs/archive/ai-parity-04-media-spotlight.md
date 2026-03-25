# AI団体パリティ #04: メディア密着（B4）

## 概要
AI団体でもB4（メディア密着取材）イベントを発生させる。
メディア密着は選手のpopularity・orgPop・trustに影響する能力イベントであり、AI団体に存在しないのは成長シミュレーションの不公平。

## 現状の問題
- プレイヤー団体ではorgPop>25かつmediaSpotlight未稼働時にB4が抽選される
- 対象選手の3興行を追跡し、平均MQに応じてorgPop/popularity/trust報酬
- AI団体はB4が発生しないため、この成長経路が完全に閉ざされている
- 特に若手選手のpopularity成長ルートの格差

## 変更方針

### 1. processAIWeeklyEventのB4許可
- `engine.js:3457-3461` のBフォールバック処理でB4も通過させる

### 2. AI自動判断ロジック
B4は「対象選手を1名選ぶ」単一選択:

**対象選出（プレイヤーB4と同じsubType分類）**:
- youngStar: age≤22の若手（AI団体にとって育成対象）
- ace: チャンピオンまたはOVRトップ3
- veteran: age≥26またはcareerSeasons≥5

tier別傾向:
- **S tier**: 50%若手、30%エース、20%ベテラン（育成投資）
- **A tier**: 30%若手、50%エース、20%ベテラン
- **B tier**: 20%若手、30%エース、50%ベテラン（実績重視）

### 3. AI密着の追跡処理
- `aiData.mediaSpotlight` フィールドを新設（プレイヤーと同じ構造）
  ```javascript
  { fighterId, fighterName, remainingShows: 3, totalMQ: 0, matchCount: 0, outletName }
  ```
- processAIWeek内で興行実行後、mediaSpotlight対象選手が出場した場合にMQ蓄積
- remainingShows=0時に既存processMediaSpotlightと同等のロジックで報酬計算:
  - 平均MQ≥60: orgPop+3, popularity+5, trust+3
  - 平均MQ≥45: orgPop+1, popularity+2
  - 平均MQ<45: 変動なし
- Phase4 E-04関係性効果: 成功時にチームメイトとのbond+1~2, OVR近接者とのrivalry+1~3

### 4. 新聞連携
- **新priority追加**: `aiMediaSpotlight: 65`（aiShowHighlight:80より低め）
- **ニュースフラグ2種**:
  - 開始時: `aiData._newsMediaStart`
    ```javascript
    { orgName, fighterName, fighterId, outletName, subType }
    ```
  - 完了時: `aiData._newsMediaResult`
    ```javascript
    { orgName, fighterName, fighterId, outletName, avgMQ, success: bool }
    ```
- **newspaper.generate()内で記事化**:
  - 開始: `{outletName}が{orgName}の{fighterName}に密着取材開始`（priority: 45、控えめ）
  - 成功: `{orgName}の{fighterName}、密着取材で好評——人気急上昇`（priority: 65）
  - 失敗: 記事化しない（ニュースにならない）
- **clearAINewsFlags()に両フラグ追加**

## 影響範囲
- `engine.js`: processAIWeeklyEvent(B4許可), processAIWeek(密着追跡), newspaper.generate, clearAINewsFlags
- aiOrgsに`mediaSpotlight`フィールド追加
- `app.js`: 変更なし
- `data.js`: 変更なし（既存MEDIA_OUTLET_NAMES流用）

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体でmediaSpotlightが正常に3興行追跡→完了→報酬適用されることを確認
- popularity変動がプレイヤーと同等の水準であることを確認
- 新聞にメディア密着記事が表示されることを確認
