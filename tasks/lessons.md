# Lessons Learned

## Canvas 描画は innerHTML 設定後に実行すること
Canvas 要素は innerHTML に埋め込んだ後、`document.getElementById()` で取得して `drawRadarChart()` を呼ぶ。
HTML文字列内で描画は不可能。`showFighterPopup` では `buildPopup()` → `innerHTML = popupHtml` → `drawRadarChart(canvas, ...)` の順序が必須。

## サブタブ state はモジュールレベル変数で管理
`let _dbSubTab = 0` のようにファイルスコープ変数で状態管理。
onclick で `setDbSubTab(idx)` を呼び `renderDatabase()` を再呼び出しするパターン。

## refreshAll() には新しいレンダラを追加すること
新しい画面を追加した場合は `refreshAll()` に `renderDatabase()` 等を追加。ただし常時呼ばれるため軽量に保つこと。

## Engine.database の getAllFighters は dormantPool 除外が必須
仕様書「dormantPool（出現待ち）は絶対に非表示」に従い、`state.dormantPool` は収集対象外。

## getAllFighters の AI団体データ取得
- orgPop は `state.aiOrgs?.[orgId]?.orgPop` から取得。ない場合は tier デフォルト値（S=75, A=50, B=30）で代替。
- 団体名は `state.rivalOrgNames` から取得。`RIVAL_ORGS[id].name` は '' で初期化されており使えない。`state.rivalOrgNames?.[org.id] || org.name || org.id` を使うこと。

## processWeek と advanceWeek は交互呼び出しが必要
`processWeek()` は `weekPhase === 'manage'` のときのみ動作し、実行後 weekPhase が変わる。
連続して週を進めるには `processWeek()` → `advanceWeek()` を交互に呼ぶ必要がある。
`processWeek()` だけ繰り返し呼んでも週が進まない。

## tickWeek の transient フィールド転送を忘れずに
processManage で `result._pendingXxx` を設定しても、tickWeek で `manage._pendingXxx` をスプレッドしないとapp.js の processWeek に届かない。
発生事例: `_pendingTeamSpirit` が tickWeek で未転送のためチームスピリットトーストが一度も発火していなかった（Phase C+D実装時に発見・修正）。
新しい transient を追加したら必ず tickWeek の転送セクションも更新すること。

## システム廃止時は参照箇所を全て除去すること
FIXED_COSTS.facility を削除したが renderFinance() の `${FIXED_COSTS.facility}万/週` 参照が残り "undefined万/週" 表示になった。
定数削除・システム廃止時は grep で全参照を確認し、UI表示コードを含め全箇所を同時に修正すること。

## セーブデータ互換: AI団体選手が freeAgents に混入する問題
旧セーブデータで aiOrgs が未初期化だった場合、本来AI団体に所属すべき選手が freeAgents に残ったまま移行されることがある。
対処: app.js の Storage.load() 内でセーブ読込後に `f.orgId && aiOrgIds.has(f.orgId)` な FA 選手を AI 団体ロスターに移動する整合性チェックを追加。
またプレイヤーロスターと FA の重複も同様にチェック・除去すること。

## 設計書に定義済みの仕様は実装完了を必ず確認すること
設計書に記載されたメカニクスは、他の仕組みと連動して初めてバランスが取れる場合がある。実装漏れは単体の機能欠落ではなく、ゲームバランス全体の破綻に繋がる。
新機能の実装時は、関連する設計済みメカニクスが全て実装済みかを横断的に確認すること。

## ロードマップ・開発計画はリポジトリ内で管理すること（Notion禁止）
管理場所は `docs/game-system-roadmap.md` および `tasks/` ディレクトリ内のファイルに限定する。
Notionはゲーム設計書や世界観設定の参照元であり、開発管理ツールとして使わない。

## specs/ ファイルの命名規則と運用ルール
### 命名規則
- **形式**: `{topic}-spec-v{MAJOR}.{MINOR}.md`
- **区切り**: ハイフン `-`（アンダースコア不可）
- **バージョン**: ドット区切り（例: `v1.0`, `v2.1`）。マイナーなしの `v2` は不可
- **言語**: ファイル名は英数字のみ（日本語不可）
- **例**: `scout-system-spec-v1.0.md`, `mq-deduction-spec-v2.0.md`

### 運用ルール
- **master-spec.md が「現行仕様の正」**。個別specはmaster-specが要約しきれない深い技術詳細を持つ場合のみアクティブに残す
- **実装完了してmaster-specに吸収されたspecは `specs/archive/` に移動する**。削除はしない
- **新バージョンを作ったら旧バージョンは即archive移動**。同一specの複数バージョンをアクティブに残さない
- **[OUTDATED]注記は一時措置**。最終的にはarchive移動かmaster-specへの統合で解消する
- **docs/ との役割分離**: specs/ = 個別機能の詳細仕様、docs/ = 横断的な設計文書・ロードマップ・分析

## キャラクター生成パスではフィールドセットを統一すること
`makeAIFighter` に condition フィールドが無く、FA選手加入時に `condition: undefined` → NaN伝播が発生した。
`makeChar`（プレイヤー用）にはあったが `makeAIFighter`（AI/FA用）に無かった。
新しいキャラクター生成パスを追加する際は、makeChar と同じフィールドセットを持つか必ず確認する。
