# Lessons Learned

## Canvas 描画は innerHTML 設定後に実行すること
Canvas 要素は innerHTML に埋め込んだ後、`document.getElementById()` で取得して `drawRadarChart()` を呼ぶ。
HTML文字列内で描画は不可能。`showFighterPopup` では `buildPopup()` → `innerHTML = popupHtml` → `drawRadarChart(canvas, ...)` の順序が必須。

## サブタブ state はモジュールレベル変数で管理
`let _dbSubTab = 0` のようにファイルスコープ変数で状態管理。
onclick で `setDbSubTab(idx)` を呼び `renderDatabase()` を再呼び出しするパターン。

## `overlay.classList.add('active')` は複数箇所にあるため replace_all=false 時は一意な文脈が必要
ui-common.js の末尾追記では周囲のコードを十分含めて一意にすること。

## refreshAll() には新しいレンダラを追加すること
新しい画面を追加した場合は `refreshAll()` に `renderDatabase()` 等を追加。ただし常時呼ばれるため軽量に保つこと。

## Engine.database の getAllFighters は dormantPool 除外が必須
仕様書「dormantPool（出現待ち）は絶対に非表示」に従い、`state.dormantPool` は収集対象外。

## NPC の orgPop は state.aiOrgs[id].orgPop で取得（なければティアデフォルト値）
AI団体の orgPop は `state.aiOrgs?.[orgId]?.orgPop` に格納されている場合とない場合がある。
ない場合は tier に応じたデフォルト値（S=75, A=50, B=30）で代替。

## プレビュー検証時にユーザーのセーブデータを破壊しないこと
preview toolsでゲームを進行させるとautoSaveが発動し、ユーザーの実セーブデータを上書きする危険がある。
対策: 検証時は新規ゲームを開始し、ユーザーのセーブには触れない。または `localStorage` のバックアップを取ってから検証する。
発生事例: Phase1-7検証時にプレビューブラウザでゲームを5週間進行→ユーザーのセーブが巻き戻った。

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

## Engine.database.getAllFighters の AI団体名は rivalOrgNames から取得すること
RIVAL_ORGS[id].name は '' で初期化されており実際の団体名は state.rivalOrgNames に格納される。
getAllFighters で `_orgName` を設定する際は `state.rivalOrgNames?.[org.id] || org.name || org.id` を使うこと。

## セーブデータ互換: AI団体選手が freeAgents に混入する問題
旧セーブデータで aiOrgs が未初期化だった場合、本来AI団体に所属すべき選手が freeAgents に残ったまま移行されることがある。
対処: app.js の Storage.load() 内でセーブ読込後に `f.orgId && aiOrgIds.has(f.orgId)` な FA 選手を AI 団体ロスターに移動する整合性チェックを追加。
またプレイヤーロスターと FA の重複も同様にチェック・除去すること。

## ロードマップ・開発計画はリポジトリ内で管理すること（Notion禁止）
ロードマップや開発タスクをNotionページに書き込んではならない。
管理場所は `docs/game-system-roadmap.md` および `tasks/` ディレクトリ内のファイルに限定する。
Notionはゲーム設計書や世界観設定の参照元であり、開発管理ツールとして使わない。
発生事例: 古いv0.1設計書にフィードバック整理セクションを追記してしまった（2026-03-02）。
