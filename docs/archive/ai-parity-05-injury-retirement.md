# AI団体パリティ #05: 怪我引退

## 概要
AI選手にも大怪我による引退（wearInjury / careerEnding）を適用する。
現状はAI選手の怪我判定（Engine.injury.check）自体は共通だが、引退判定パスが欠落している。

## 現状の問題
- プレイヤー団体: executeShow内でinjury.check→retireType判定→即時引退処理
- AI団体: processAIWeek内でinjury.check→怪我期間のみ適用、retireType無視
- wearシステムは共通（シーズン末にwear蓄積）なのに、怪我引退だけ免除は不自然
- AI選手はシーズン末のcheckRetirementでしか引退しない

## 変更方針

### 1. processAIWeek内の怪我処理拡張
- 現在のAI怪我処理（engine.js:3731-3736付近）にretireType判定を追加
- Engine.injury.checkの返却値にretireTypeが含まれる場合:
  - wearInjury: wear+25>80 の場合の強制引退
  - careerEnding: wear≥40で6.5%、<40で2.5%の確率
- 引退処理: ロスターから除外、applyDepartureTrustImpactで残留メンバーへの影響

### 2. 引退処理フロー
```
processAIWeek 興行実行後:
  各試合結果に対しEngine.injury.check()
  ↓ retireType !== null の場合
  roster から除外
  applyDepartureTrustImpact(roster, retiredId, relationships, {reason: 'AI怪我引退'})
  orgTimeline close
  careerHistory に「怪我引退」記録
  freeAgents には追加しない（引退）
  _newsInjuryRetirement フラグ蓄積
```

### 3. 殿堂入り判定との連携
- 怪我引退した選手もcheckNpcHallOfFameの対象にする
- 現在はprocessSeasonEnd内のaiRetireesにのみ適用されている
- シーズン中の怪我引退者を `aiData._midSeasonRetirees` に蓄積し、processSeasonEndでHOF判定

### 4. 新聞連携
- **既存priorityの活用**: `aiRetirement: 100` / `aiAceRetirement: 160`
- 怪我引退は通常引退より劇的なので**別priority追加**: `aiInjuryRetirement: 150`
- **ニュースフラグ**: `aiData._newsInjuryRetirement` に蓄積
  ```javascript
  {
    orgName, fighterId, fighterName, age, ovr,
    injuryType: 'wearInjury'|'careerEnding',
    careerSeasons, titleReigns,
  }
  ```
- **newspaper.generate()内で記事化**:
  - wearInjury: `{orgName}の{fighterName}（{age}歳）、度重なる怪我で引退——{careerSeasons}シーズンの現役生活に幕`
  - careerEnding: `{orgName}の{fighterName}（{age}歳）、壊滅的な怪我で緊急引退——リング上で悲劇`
  - careerEndingは特にドラマチックなbody（予期せぬ突然の幕切れを強調）
  - エース級（OVR75+）はpriority+20
- **clearAINewsFlags()に`_newsInjuryRetirement`追加**

## 影響範囲
- `engine.js`: processAIWeek(怪我引退パス追加), processSeasonEnd(midSeasonRetirees HOF判定), newspaper.generate, clearAINewsFlags
- aiOrgsに`_midSeasonRetirees`フィールド追加
- `app.js`: 変更なし
- `data.js`: 変更なし

## 注意点
- AI選手の怪我引退はシーズン中に発生するため、ロスター数が急減するリスク
- 最低ロスター数（例: 4名）を下回らないようガードが必要
- S/A tier団体のエースが怪我引退した場合のバランスインパクトを確認

## 検証
- auto-sim 500シーズンでvalidateGameState違反なし
- AI団体で怪我引退が発生し、残留メンバーのtrust/bondが正しく変動すること
- 怪我引退者がHOF判定対象になること
- AI団体のロスター数が最低ラインを下回らないこと
- 新聞に怪我引退記事が表示されること（特にcareerEndingの劇的な記事）
