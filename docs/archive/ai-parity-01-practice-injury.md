# AI団体パリティ #01: 練習怪我（B1）

## 概要
AI団体でもB1（練習中の怪我）イベントを発生させる。
現状はprocessAIWeeklyEventでB系が全てN/Eにフォールバックされており、AI選手は練習中に怪我をしない。

## 現状の問題
- プレイヤー団体ではcondition<50の選手がいるとB1が抽選される
- AI団体はcondition管理・怪我システム自体は共通だが、B1イベントだけ発生しない
- AI選手は試合中の怪我のみで、練習怪我による長期離脱がない不公平

## 変更方針

### 1. processAIWeeklyEventのB1許可
- `engine.js:3457-3461` のBフォールバック処理を修正
- B1のみ通過させ、B2/B3/B4は別途個別に対応
- B1が抽選された場合、AI自動判断で処理する

### 2. AI自動判断ロジック（_applyAILargeEvent新設）
- B1の3択（特別治療/通常治療/無理させる）をtier別に自動選択:
  - **S tier**: 80%特別治療、20%通常治療（資金豊富、選手大事）
  - **A tier**: 40%特別治療、50%通常治療、10%無理させる
  - **B tier**: 10%特別治療、60%通常治療、30%無理させる
- 既存の`applyLargeEventEffect`のB1ロジック（engine.js:11110-11157）をそのまま呼ぶ
- 結果（怪我期間・成長ペナルティ）をAIロスターに反映

### 3. 返却値の統合
- applyLargeEventEffectの返却値（roster, events等）をprocessAIWeekの返却に統合
- lockerRoomMorale変動があればaiData.lockerRoomMoraleに反映

### 4. 新聞連携
- **新priority追加**: `aiPracticeInjury: 55`（aiBreakthrough:60よりやや低い）
- **ニュースフラグ**: `aiData._newsPracticeInjury` に蓄積
  ```javascript
  { orgName, fighterId, fighterName, injuryType, weeksOut, treatmentType }
  ```
- **newspaper.generate()内で記事化**:
  - headline例: `{orgName}の{fighterName}、練習中に{injuryType}で{weeksOut}週離脱`
  - body例: `{orgName}の練習中に{fighterName}が負傷。{weeksOut}週間の離脱を余儀なくされる。`
  - エース級（OVR75+）なら priority +20 して目立たせる
- **clearAINewsFlags()に`_newsPracticeInjury`追加**

## 影響範囲
- `engine.js`: processAIWeeklyEvent, newspaper.generate, clearAINewsFlags
- `data.js`: 変更なし（既存B1テンプレ流用）
- `app.js`: 変更なし（AI処理はengine内で完結）

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体のinjury発生率がプレイヤーと同等であることを確認
- 新聞にAI練習怪我記事が適切な頻度で表示されることを確認
