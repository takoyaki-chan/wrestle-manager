# task-86 実施報告

- 日付: 2026-08-12
- ブランチ: `codex/task-86`
- 基点: `627548a`
- 状態: 実装・自動検証完了。Git worktree管理領域へのsandbox書き込み制約によりコミット不能

## 実施内容

### データ

- `src/data.js` に承認草案と一字一句同じ宣戦21本・応戦21本、計42本の `FACTION_IGNITE_LINES` を追加した。
- `EVENT_LINES_BY_KEY` に `factionIgniteProvoke` / `factionIgniteRespond` を登録し、Nodeエクスポートにも追加した。
- 既存セリフテーブルは変更していない。

### エンジン戻り値

- `src/factions.js` の `checkF02IgniteTrigger` の戻り値に `memberIdsA` / `memberIdsB` / `memberCountA` / `memberCountB` を追加した。
- 互換用の既存 `membersA` / `membersB` は残した。
- 発火判定、敵対度取得、`applyF02IgniteResult` は変更していない。

### UI / CSS

- `src/index.html` に `--accent-war` / `--accent-war-rgb` / `--accent-war-hi` を追加し、開戦画面だけで使用した。既存 `--accent-hostility` 定義は変更していない。
- F02開戦画面を承認済みモック案Aに合わせ、以下を実装した。
  - リーダー画像を梯子Lの150×224へ変更
  - 画像上の2行クランプ吹き出しと、archetype単軸の宣戦・応戦セリフ選択
  - 両方向の高い敵対度を既存 `getHostilityLabel` へ渡し、中央に段位ラベルと5段火ゲージを表示
  - `memberIds` から46×66のupperチップ隊列を表示し、画像がない生成選手はイニシャルへフォールバック
  - カード帯を「両派リーダー ・ 一騎打ち」へ変更
  - 数値ledgerを廃止し、確定した定性2行へ変更
- F06、F08、DB派閥タブの敵対度・内部イベント名露出を承認済み日本語ラベルへ統一した。
- F09開幕・結末ナレーション2箇所を `escHtml` 経由へ変更した。F09の画面構造は変更していない。

### テスト

- `test/faction-ignite-rework-test.js` を新設した。
  - 草案MDをパースし、42/42の全文一致を検査
  - 開戦モーダルに敵対度の生数値・`HOSTILITY` が出ないことを検査
  - ledger文言消滅を検査
  - `memberIds` 経由でN個のupperチップが出ることと、生成選手のイニシャルfallbackを検査
  - F09開幕・結末ナレーションのHTMLエスケープを振る舞いで検査
- 既存テストは、旧開戦数値表示のソース文字列固定をやめ、ラベル変換と実表示の振る舞い検査へ追随した。
- F08の既存U3安全網テストへ公開API `getHostilityLabel` の依存モックを追加した。

## 検証結果

- `node --check src/data.js`: PASS
- `node --check src/factions.js`: PASS
- `node --check src/ui-common.js`: PASS
- `node --check src/ui-render.js`: PASS
- 変更したテストJSの `node --check`: PASS
- `node test/faction-ignite-rework-test.js`: PASS
- 関連回帰テスト（hostility precision / F09 ending / F09 show flow / U3 group B）: PASS
- `npm.cmd test`: **226 passed / 0 failed / 0 timed out**
- 変更前 `WM_SOURCE_REF=HEAD node test/auto-sim.js 20 42`: `Total errors: 0`, fingerprint `fae2a4d1`
- 変更後 `node test/auto-sim.js 20 42`: `Total errors: 0`, fingerprint `fae2a4d1`
- `git diff --check`: PASS
- 禁止ファイル照合: `src/management.js` / `src/match-engine.js` / `src/relationships.js` / `src/app.js` は変更なし
- インタラクティブ視覚確認: ローカルURLへのブラウザアクセスが権限制約で拒否されたため未実施。迂回実行はしていない

## 不変条件の自己検算

### I-1: factionHostility・加算・減衰・発火条件・乱数消費

- `factionHostility` の値、更新処理、週次減衰、`applyF02IgniteResult(+12)` に差分なし。
- `checkF02IgniteTrigger` の判定部に差分なし。
- セリフ選択は `Engine.rng.derive()` から生成したローカルRNGだけを使用し、GameState不変を新規テストで確認した。
- 変更前後の同一シードauto-sim fingerprintはともに `fae2a4d1`。完全一致。
- 判定: PASS

### I-2: getHostilityLabel

- `src/factions.js` の `getHostilityLabel` 本体、閾値、文言に差分なし。
- UIは既存関数を呼び、複製・再実装していない。
- 判定: PASS

### I-3: F08選択肢の実挙動

- F08で変更したのはヘッダ、本文、選択肢Bヒントの表示文言とラベル取得だけ。
- 選択肢Bのdisabled条件、80/70の内部条件、A/Cの効果処理に差分なし。
- 全226テストPASS。
- 判定: PASS

### I-4: セリフ42本

- 草案MDの場面1・場面2をテストで直接パースし、`FACTION_IGNITE_LINES` と42/42全文一致。
- 宣戦21本、応戦21本、7 archetype×各3本を確認。
- 判定: PASS

### I-5: 人数バグ修正と発火判定

- `checkF02IgniteTrigger` の差分は、既存判定後のID配列コピー2行と戻り値4フィールドの追加だけ。
- 発火判定ロジック、既存戻り値、敵対度取得に差分なし。
- 新規テストで従来と同じリーダー同士のシングル戦が発火し、ID配列・件数・互換氏名配列が揃うことを確認。
- 判定: PASS

## Gitコミット不能の記録

指示書の3粒度（データ / エンジン戻り値 / UI+CSS+テスト）でコミットするため、最初に `git add -- src/data.js` を実行したところ、次のsandboxエラーで失敗した。

```text
fatal: Unable to create 'C:/Users/nkmrk/Downloads/wrestle-manager/.git/worktrees/wm-codex-task86/index.lock': Permission denied
```

mainフォルダへ触れない指示とsandbox制約を守るため、再試行、権限回避、別Git管理領域への操作は行っていない。変更はこの作業ツリーに未コミットのまま残している。

## 影響範囲

- 既存データ・セーブ形式への変更なし
- localStorageへの変更なし
- ゲームロジック・バランス・試合エンジンへの変更なし
- mainフォルダのプロジェクトファイルへの変更なし（Git worktreeのindex.lock作成試行は権限拒否され、作成されていない）
- 汎用ゲーム設計原則は「色の役割の一貫性」「数値内部名ではなく意味の分かる段位表示」「重要な節目だけのセレモニー演出」を採用し、プロジェクト固有仕様を優先した
