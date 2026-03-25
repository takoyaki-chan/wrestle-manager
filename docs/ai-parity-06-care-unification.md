# AI団体パリティ #06: ケアアクション統一

## 概要
現行のprocessAICare（tier別確率的trust加算のみ）を、プレイヤーのケアアクション体系に近づける。
bond/rivalry変動、condition回復、popularity変動などをAI団体にも適用する。

## 現状の問題

### processAICare（現行）
- trust加算のみ（bond/rivalry/condition/popularity変動なし）
- tier別の固定確率で発動（S:35%, A:20%, B:10%）
- 対象はtrust<60の最低trust2名 + 全体ケア
- コスト計算なし

### Engine.careActions.execute（プレイヤー用）
- 7種のアクション: 激励/衣装/合宿/パーティ/休暇/メディア/特別待遇
- 各アクションで異なるtrust/condition/popularity/bond変動
- Phase4 C系関係性効果（C-01~C-10）連動
- OVR傾斜（低OVRほど効果大）
- コスト・クールダウン管理

## 変更方針

### 1. processAICareの拡張（careActionsの直接呼び出しではない）
careActions.executeはUI前提（fundチェック・cooldown管理）なので直接呼ばない。
代わりに**ケア効果の本質部分をAIにも適用**する。

### 2. AI版ケアロジック
```
processAICare(rng, roster, tier, relationships, aiState):

個別ケア（trust<55の選手、最大2名）:
  - 対象選定: trust昇順ソート、怪我・レンタル除外
  - アクション自動選択（状況ベース）:
    - condition<50 → 休暇効果（condition+15, trust+2）
    - popularity>70 → メディア効果（popularity+1, trust+1.5, bond微増）
    - 連敗中(losses>=3) → 激励効果（trust+3, condition+5）
    - デフォルト → 合宿効果（trust+2.5, condition+8）
  - Phase4 C系関係性効果の簡易版:
    - 激励: 対象→全体 bond +0.5
    - 合宿: 参加者間 bond +1
    - パーティ: 全体 bond +0.5（チームケア時のみ）
  - OVR傾斜: careOvrMult = max(0.7, 1.2 - ovr/200)

チームケア（tier別確率で発動）:
  - S:15%, A:8%, B:4%
  - 全員trust + teamCareStrength × gainMult
  - 全員間 bond +0.3（パーティ相当の微小効果）

コスト:
  - _estimateAIFunds(tier) から概算引き落とし
  - S: -150万/回、A: -100万/回、B: -50万/回（実際の資金管理はしないが頻度制限として機能）
```

### 3. 関係性効果の反映
- 現行processAICareにはbond/rivalry変動が一切ない
- 新版では個別ケア時にC系効果の簡易版を適用:
  - C-01(激励): 対象→ロスター bond +0.5
  - C-03(合宿): 参加者間 bond +1.0
  - C-04(パーティ): 全体 bond +0.5
  - C-05(タイトル嫉妬): 特別待遇時、OVR近接者 rivalry +1~2
- Engine.relationships.applyAllPairs / applyToRoster を使用

### 4. 新聞連携
- ケア自体は日常的な管理行為なので**新聞記事化しない**
- ただし特別待遇（C-10相当）でエース級選手に適用した場合のみ記事化の余地あり
- **現時点では新聞連携なし**（日常行為のニュース化は過剰）
- 将来的に「{orgName}が{fighterName}をメディア露出強化」等の軽いティッカー追加は検討可

## 影響範囲
- `engine.js`: processAICare全面改修
- 関係性: applyAllPairs, applyToRoster（既存関数呼び出し）
- `app.js`: 変更なし
- `data.js`: 変更なし

## 注意点
- ケア効果が強すぎるとAI団体のtrust/bondが常に高止まりする
- プレイヤーはコスト・クールダウンで制限されるが、AIは自動なので頻度調整が重要
- tier別の発動確率を適切に設定し、B tier団体のtrust問題（B2発生源）とのバランスを取る

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体のtrust/bond分布がプレイヤー団体と同等の範囲に収まること
- B tier団体でもtrust崩壊→B2対立が適切な頻度で起きること（ケアが効きすぎない）
- bond変動が発生し、関係性ダイナミクスが活性化すること
