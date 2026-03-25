# AI団体パリティ #03: AI団体間対抗戦（B3）

## 概要
AI団体同士でも対抗戦（B3）が発生するようにする。
現状はプレイヤー団体にのみ「他団体からの挑戦状」が届く。AI同士の対抗戦が存在しないため、battleWinsTotalがプレイヤー偏重になり、レガシーptの公平性に問題がある。

## 現状の問題
- B3はorgPop>20で抽選され、ランキング±1位の団体から挑戦が来る
- AI団体はB系が全てフォールバックされるためB3が発生しない
- battleWinsTotalはプレイヤー絡みの対抗戦でのみ加算
- AI団体のレガシーptが構造的に低くなる

## 変更方針

### 1. AI団体間対抗戦の生成
- processAIWeeklyEventのB3通過ではなく、**独立した仕組み**で生成する
- 理由: B3はUI操作（受諾/辞退/代表選出/観戦）が前提の設計。AI同士はUI不要で内部処理すべき
- **新関数 `processAIWar(rng, state)` をtickWeek内で呼ぶ**

### 2. processAIWar ロジック
```
発生条件:
- 4週に1回の判定（大型イベントと同じクールダウン感覚）
- aiData.lastWarWeek から4週以上経過
- orgPop > 20
- 2.5%/週の発生率（プレイヤーB3と同等）

対戦相手選定:
- ランキング±1位のAI団体（プレイヤー団体は除外）
- プレイヤー団体が挟まる場合はスキップ（プレイヤーの対抗戦と被らない）
- 相手団体も4週クールダウンを満たしていること

代表選出:
- 各団体OVRトップ3から1名をRNG選出
- チャンピオンなら50%で選出（エース対決の演出）

試合実行:
- simulateMatch(挑戦側, 受諾側, rng, matchTier=2)
- isWarMatch: true でapplyMatchResultを呼ぶ

結果適用:
- 勝者側: orgPop +2（逓減適用）、代表trust +3、battleWinsTotal +1
- 敗者側: orgPop -0.5（逓減適用）、代表trust -1
- 引き分け: 両orgPop +0.5
- Phase4 E-03関係性効果: rivalry +8~12（両方向）、チームメイト→代表 bond +2
```

### 3. battleWinsTotal統合
- 勝利した団体のbattleWinsTotalに+1
- AI同士の対抗戦でもレガシーptに反映（Math.floor(wins/5)）
- これによりプレイヤーとAIのレガシーpt格差が自然に解消

### 4. 新聞連携
- **新priority追加**: `aiWarResult: 135`（crossWarResult:140よりやや低い）
- **ニュースフラグ**: `aiData._newsAIWarResult` に蓄積（勝利側の団体に付与）
  ```javascript
  {
    challengerOrg, defenderOrg,
    challengerName, defenderName,    // 代表選手名
    challengerId, defenderId,
    winnerOrg, loserOrg,
    mq, isDraw,
  }
  ```
- **newspaper.generate()内で記事化**:
  - 勝利時: `⚔ {challengerOrg} vs {defenderOrg} 対抗戦——{winnerOrg}の{winnerName}が勝利`
  - 引き分け: `⚔ {org1} vs {org2} 対抗戦は痛み分け`
  - MQ80+なら「名勝負」トーン、MQ90+なら最高priority級に格上げ
  - body: 代表選手のOVR、MQ、勝利方法の要約
- **clearAINewsFlags()に`_newsAIWarResult`追加**

### 5. プレイヤーとの対抗戦との共存
- AI同士の対抗戦と、プレイヤーへの挑戦状（既存B3）は独立して発生
- AI団体がプレイヤーに挑戦するルートは既存B3のまま変更なし
- AI同士の対抗戦ではプレイヤー団体は対象外（プレイヤーの行動はB3で担保）

## 影響範囲
- `engine.js`: processAIWar新設, tickWeekに呼び出し追加, newspaper.generate, clearAINewsFlags
- aiOrgsに`lastWarWeek`フィールド追加
- battleWinsTotalの加算ロジック追加
- `app.js`: 変更なし
- `data.js`: 変更なし

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体間で対抗戦が適切な頻度で発生していることを確認
- battleWinsTotalがAI団体にも蓄積されることを確認
- レガシーptの団体間バランスが改善されることを確認
- 新聞にAI対抗戦記事が表示されることを確認
