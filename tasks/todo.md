# 引退勧告・引き留めシステム v1.1 + ロスター枠制限 v1.0

## 引退勧告・引き留めシステム v1.1
- [x] data.js: RETIRE_ACCEPT_LINES/REFUSE_LINES/RETAIN_LINES/COACH_RETIRE_ADVICE_TEXTS 追加
- [x] engine.js: Engine.retirement (canAdvise/calcAcceptance/calcRecentWinRate/selectAdviseLine/advise/selectRetainLine)
- [x] engine.js: Engine.coach.getRetireAdvice + _buildRetireAdviceText
- [x] engine.js: Pass2 MQ ラストラン+3/メイン+5/因縁+3or+5、proveMode+2
- [x] engine.js: processManage retireAdviceCooldown/proveMode デクリメント
- [x] engine.js: advanceWeek offWeek1 lastRun期限切れ処理 + canRetainフラグ
- [x] app.js: doRetireAdvise / doRetainFighter アクション
- [x] ui-common.js: showRetireAdviseResultPopup / _renderRetirementPopup引き留めボタン / Tab2引退セクション
- [x] ui-render.js: renderShowPrep ラストランバッジ+金枠
- [x] ui-common.js: ポップアップヘッダーに🌅ラストランバッジ

## ロスター枠制限 v1.0
- [x] engine.js: GameState初期化に rosterCap:6 / warWon:false 追加
- [x] data.js: AI_SCOUT_CFG.B.idealRoster 9→10
- [x] engine.js: aiScout need+1→need、aiInterTransfer idealRoster+2→idealRoster
- [x] engine.js: resolveNegotiation ロスター枠チェック追加
- [x] app.js: checkTitleEstablishment rosterCap→8
- [x] app.js: checkSurvivalUpdate rosterCap→10
- [x] app.js: finalizeInterPromoEvent warWon + rosterCap→12
- [x] app.js: checkRosterCapMilestones (ランキング1位) rosterCap→16
- [x] app.js: signFighter / scoutEventResolve キャップチェック
- [x] app.js: Storage.load() マイグレーション（旧セーブ互換）
- [x] ui-render.js: renderRoster「所属 N/M名」ヘッダー
- [x] ui-render.js: renderScout キャップ警告バナー
- [x] ui-common.js: showFighterPopup FA/scout獲得ボタン disabled

## レビュー
- 全Engine関数は純粋関数（DOM禁止）原則に準拠
- transientフィールド: _pendingRetireAdviseResult（tickWeek転送不要、App.doRetireAdvise内で即消費）
- canRetainフラグはadvanceWeek内で計算しpendingRetirementsに付与（UI再計算不要）
- ロスター枠チェックはisRental除外（レンタル別枠）
- マイグレーションは既存達成状況から逆算（超過状態は許容、新規獲得のみブロック）
