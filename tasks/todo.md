# バランス調整 v1.9 実装

## 変更C：AI団体成長バランス調整（data.js数値変更のみ）
- [x] RIVAL_ORGS: facilityMul を全て 1.00 に変更（3箇所）
- [x] AI_TIER_LIMITS: growthBonus を S:1.05, A:1.00, B:0.95 に変更

## 変更B：年齢カーブ型契約費用（engine.js）
- [x] ageMarketMultiplier 関数を追加
- [x] calcAssessedValue に ageMul 適用を組み込む

## 変更A：逸材特別交渉枠（engine.js + app.js + ui-render.js + ui-common.js）
- [x] engine.js: canNegotiate に context + state 引数追加、FA+eliteTicket 判定
- [x] engine.js: isEliteTicketRequired ヘルパー追加
- [x] engine.js: tickWeek で orgPop≥25 到達検知 → eliteTicket + _pendingEliteTicket 設定
- [x] app.js: signFighter で FA文脈canNegotiate + eliteTicket 消費ロジック
- [x] app.js: processWeek で _pendingEliteTicket 通知ポップアップ表示
- [x] ui-render.js: FA一覧で canNegotiate('fa', G) + 🎫特別交渉枠バッジ + 金枠ボーダー
- [x] ui-common.js: FAポップアップで canNegotiate('fa', G) + 使用確認メッセージ

## レビュー
- canNegotiate 全8呼び出し箇所を確認済み: FA文脈3箇所(fa,G) / スカウト文脈3箇所(引数省略) / engine定義2箇所
- スカウトではeliteTicket無効（context省略時はundefined → 'fa'チェック通過せず）
- 30歳以降の年齢倍率1.0 → 既存reassess(age30/age35plus)と二重適用なし
- _pendingEliteTicket transientフィールドはtickWeekで設定→processWeekで消費・表示のパターンに準拠
