# AI団体パリティ #07: 契約交渉

## 概要
AI団体でもシーズン末に契約交渉→退団/残留の判定を行う。
現状はAI選手はcheckRetirement（wear/age基準）でのみ引退し、trust不満による退団が存在しない。

## 現状の問題
- プレイヤー団体: offWeek4でEngine.contract.generateNegotiations→resolveNegotiation
  - trust閾値で自動残留/昇給交渉/移籍/突然退団の4パターン
  - 性格・特性による修正（忠誠心/反骨心/野心）
- AI団体: 契約交渉なし。選手はwear/ageによる引退以外でロスターを離れない
- AI団体のtrust管理は機能しているが、trustが低くても退団しないためtrust値の意味が薄い

## 変更方針

### 1. AI版契約処理 `processAIContracts` 新設
既存のEngine.contract.generateNegotiations/resolveNegotiationはUI前提（対話画面）のため直接使わない。
trust閾値ベースの退団判定ロジックを新設する。

### 2. 判定ロジック
```
processAIContracts(rng, roster, orgId, tier, relationships, state):

各選手に対して（怪我中・レンタルは除外）:

trust ≥ 60: 自動残留（交渉なし）
trust 40-59: 残留（条件なし）
trust 30-39:
  - 基本退団率: 15%
  - 特性補正: 忠誠心 ×0.5, 反骨心 +20%, 野心 +15%（ただしチャンピオンなら-30%）
  - tier補正: S tier -5%, A tier ±0%, B tier +5%
  - → 退団判定

trust 15-29:
  - 基本退団率: 40%
  - 同上の特性補正
  - → 退団判定

trust < 15:
  - 基本退団率: 70%
  - 同上の特性補正
  - → 退団判定

退団先決定:
  - 50%: 他AI団体へ移籍（ランダム選出、受入側のロスター上限チェック）
  - 30%: フリーエージェント化
  - 20%: 引退（age≥28の場合のみ、それ以外はFA）
```

### 3. 退団処理
```
退団時:
  applyDepartureTrustImpact(残留roster, departedId, relationships, {reason: 'AI契約不満退団'})
  orgTimeline close（Engine.orgTimeline.transfer）
  移籍先がAI団体なら:
    移籍先ロスターに追加
    orgTimeline open
    trust = 50（リセット）
    orgJoinWeek設定
  FA化なら:
    freeAgentsに追加
  引退なら:
    checkNpcHallOfFame対象に追加
```

### 4. タイミング
- processSeasonEnd内、checkRetirement判定の後に実行
- 引退→契約退団の順序（引退者は契約交渉対象外）
- 最低ロスター数ガード: 退団後にロスター<5になる場合はそれ以上の退団を阻止

### 5. 新聞連携
- **新priority追加**: `aiContractDeparture: 95`（aiRetirement:100よりやや低い）
- **ニュースフラグ**: `aiData._newsContractDepartures` に蓄積（配列）
  ```javascript
  [{
    orgName, fighterId, fighterName, age, ovr,
    destination: 'transfer'|'fa'|'retire',
    destOrgName: string|null,   // 移籍先がある場合
  }]
  ```
- **newspaper.generate()内で記事化**:
  - 移籍: `{orgName}の{fighterName}が契約満了——{destOrgName}に移籍`
    - body: trust不満は明示せず「新天地を求めて」等の婉曲表現
  - FA: `{orgName}の{fighterName}が退団、フリーエージェントに`
  - 引退: `{orgName}の{fighterName}が現役引退を決断`
  - 複数退団が同一団体で発生: まとめ記事「{orgName}で大量退団——{n}名が離脱」（priority +30）
  - エース級（OVR75+）はpriority +20
- **clearAINewsFlags()に`_newsContractDepartures`追加**

### 6. 移籍先AI団体への影響
- 移籍受入側: O-02（入団bond変動 -3~+3）を適用
- 既存のapplyFromRoster / applyRecontactEventsを呼ぶ（Phase3 O-10相当）
- 移籍受入側の`_newsTransferIn`フラグ蓄積（入団ニュース）

## 影響範囲
- `engine.js`: processAIContracts新設, processSeasonEnd内に呼び出し追加, newspaper.generate, clearAINewsFlags
- 関係性: applyDepartureTrustImpact, applyFromRoster, applyRecontactEvents（既存関数）
- orgTimeline: transfer（既存関数）
- `app.js`: 変更なし
- `data.js`: 変更なし

## 注意点
- 退団率が高すぎるとAI団体のロスターが崩壊する
- 特にB tier団体はtrust管理が弱い（processAICareの効果が低い）ため、退団連鎖のリスク
- 最低ロスター数ガード + aiSeasonReinforce（補充スカウト）で安全弁を確保
- #06（ケアアクション統一）との実装順序が重要: ケア改善→契約交渉の順が望ましい

## 実装順序の依存関係
- **#06（ケアアクション統一）を先に実装すべき**: ケアが改善されないままtrust退団を入れるとB tier崩壊
- **#05（怪我引退）と独立**: 怪我引退はシーズン中、契約退団はシーズン末なので競合しない
- **#02（B2対立）との相乗効果**: trust低下→B2発生→さらにtrust低下→契約退団、のドラマチックな連鎖が生まれる

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体でtrust低下→契約退団が適切な頻度で発生すること
- B tier団体でロスター崩壊しないこと（最低ロスター数を維持）
- 移籍先AI団体のロスターに正しく追加されること
- 退団→移籍→入団の関係性効果チェーンが正常に動作すること
- 新聞に契約退団記事が表示されること
