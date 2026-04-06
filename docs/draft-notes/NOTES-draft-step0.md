# Draft Negotiation Step 0: 把握と差分分析

## spec §13 フローと既存コードのギャップ

### 1. 処理順序の逆転（最大の構造変更）

**spec §3.1**: generateScoutReport → 関心マーク決定 → 一覧表示 → 交渉 → EMPRESS安全網 → 流札処理

**現行コード** (management.js:9287-9315): aiScout() → aiSeasonReinforce() → generateScoutReport() → プレイヤー指名 → resolveCompetition()

- AI先取り(aiScout)がスカウト候補生成の前に実行され、dormantPoolから選手を抜いている
- specではAI先取りを完全廃止し、全団体が同じプールで対等にセリする

### 2. 廃止対象の関数・定数

| 対象 | 現在地 | spec指示 |
|---|---|---|
| Engine.rival.aiScout() | management.js:5116-5167 | 完全削除 |
| Engine.rival.aiSeasonReinforce() | management.js:5168-5237 | §6安全網に書き換え（タイミング: セリ前→セリ後、max 5→2） |
| Engine.scout.resolveCompetition() | management.js:8133-8155 | 完全削除→セリエンジンに置換 |
| Engine.scout.resolveLostCandidate() | management.js:8157-8167 | ロジック変更（流札→フリー市場のみ） |
| AI_SCOUT_CFG | data.js:3136-3140 | 完全廃止 |
| SCOUT_EVENT_CFG.offseason.count/maxPicks | data.js:3019-3023 | 値変更: count [8,10]→[14,18]、maxPicks 3→4 |
| SCOUT_EVENT_CFG.midseason.count | data.js:3020 | 値変更: [4,6]→[8,10] |

### 3. 新規実装が必要なもの

- セリエンジン全体（§4: 複利価格上昇、降り判定式、タイプA/B/C分岐）
- 執着スコア計算（assessedValue × 若さボーナス × ロスター充足度 × ランダムブレ）
- マーク算出 + 表示ノイズ（80/10/10）
- ティア別参加率テーブル（3団体×5ティア）
- 性格別降り率（EMPRESS/NOVA/CRESCENT）
- ヒートゲージ（5段階）
- ナレーション文言（10-20パターン）
- AI同士のセリ観戦UI
- 候補一覧UI（週刊グラップル「ドラフト速報」面）
- 交渉画面UI（会場バナー+入札カード4枚+ナレーション+アクションボタン）
- SFX 7トリガー / BGM切替

### 4. 既存ロジック流用・温存

- Engine.scout.calcAssessedValue() → 流用OK
- Engine.scout.TIERS → 5ティア（superElite/elite/promising/raw/material）= specの5ティアと完全対応
- Engine.scout.canNegotiate() → orgPop要件温存
- Engine.scout.generateScoutReport() → プール抽出は流用、count値拡張＋competitionフラグ削除
- generateDraftConfig() → ゲーム開始ドラフト用。影響なし

### 5. tickWeek offWeek===3 の書き換え

現行:
```
1. aiScout(rng, s)              ← 削除
2. aiSeasonReinforce(rng, s)    ← 削除（セリ後に移動）
3. generateScoutReport(rng, s)  ← 拡張サイズに変更
4. return weekPhase:'scoutEvent'
```

新フロー:
```
1. generateScoutReport(拡張サイズ)
2. 各候補の関心マーク・執着スコア・タイプA/B/C算出
3. weekPhaseを「ドラフト速報」表示に遷移
4. プレイヤー「交渉開始」→ セリ本番（1候補ずつ）
5. 全セリ後: EMPRESS安全網判定
6. 流札→フリー市場
```

### 6. midseason(week 29) も同様の書き換え必要

### 7. generateScoutReport 内の競合フラグ付与廃止

L8121-8127 の _hasCompetition / _compMultiplier / _bidWin → セリエンジンでは不要

### 8. TIERS フィールドと spec の対応差

現行 compRate/compMul/bidWin → 廃止。新パラメータ（参加率テーブル §5.2）は団体×ティアのマトリクスなので別定数テーブルが必要

### 9. leagueElevated 対応

既にフラグ存在。spec §5.7 の降り率変化・参加率底上げは新規追加。getEffectiveTierLimits() パターン踏襲可能

### 10. UI側

- scoutEvent weekPhaseの処理を「ドラフト速報」→「セリ本番」の2段階UIに全面書き換え
- モックアップ2種のHTML/CSSをゲーム内に移植
