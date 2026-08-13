# task-90: タイトル画面「選手ファイル」新設 + タイトル配色リフレッシュ

**依頼先**: Codex
**作業場所**: 専用worktree `wm-codex-task90`(ブランチ `codex/task-90-fighter-file`。task-86〜88と同型。mainフォルダ `Downloads/wrestle-manager` はKeisukeがブラウザで直接開いてプレイ中のため絶対に触らない)
**マージ**: Fableがdiff全文レビュー+不変条件を1つずつ独立検算→コミット代行→mainへ
**依存**: なし(task-91がこのタスクの共通ヘルパーに依存する。先行して実施)

---

## 1. 目的

タイトル画面から開ける全選手名鑑「選手ファイル」を新設する(全127名の能力基準値+プロフィール。潜在は完全非表示)。同時にタイトル画面の配色を案2「会場の夜」へ差し替え、入口リンクを追加する。数値表記の共通ヘルパー(階調/枠越えバー/レーダー)もこのタスクで新設する(task-91が共用)。

## 2. 仕様の正(指示書内に仕様を二重記載しない)

- **画面仕様**: `docs/ui/03-screens/fighter-file.md`(データ前提・遷移・構成・確定文言・状態)
- **数値表記の法則**: `docs/ui/stat-notation-v1.0.md`(階調7帯・枠越えバー・レーダー軸色・glow=数値の100超のみ・バー非発光)
- **見た目の正**: `docs/ui/mockups/fighter-file-title-v0.7.html`(Keisuke承認済み。CSS値・構造はここから移植してよい)
- 横断規約: `docs/ui/01-foundations.md` / `docs/ui/mockup-baseline-v0.1.md`

## 3. 触ってよいファイル / 触ってはいけないファイル

**触ってよい**:
- `src/index.html` — タイトル画面ブロック(配色CSS・リンク追加)+選手ファイルオーバーレイのDOM/CSS新設
- `src/app.js` — 開閉・描画ロジック(`App.showFighterFile` 等)
- `src/ui-common.js` — **共通ヘルパー新設のみ**: `statTierStyle(kind, v)`(階調7帯+glow)/`barDispOver(v)`(枠越え圧縮式)/枠越えバー部品のHTML生成。既存関数の変更禁止
- `test/` — 新規 `test/fighter-file-guard-test.js`

**触ってはいけない**:
- `src/management.js` / `src/match-engine.js` / `src/relationships.js` / `src/data.js`(読み取りのみ。ALL_CHARS等のデータに一切手を入れない)
- `_scale6` / `_ovrColor` / `_statCell` など既存の塗り関数(task-91の領分。このタスクでは呼び出しも変更もしない)
- `release/manifest.json`(新規ファイルを作らないため更新不要。**新規JS/CSSファイルを作らないこと**)

## 4. 数値目標と不変条件(対で書く)

| # | 目標 | 不変条件(これを壊す実装は不合格) |
|---|---|---|
| I-1 | 選手ファイルがタイトルから開閉できる | **`G`を読み書きしない・乱数を1回も消費しない**。セーブ0件の環境で全機能が動く。開閉後の NEW GAME/CONTINUE/LOAD GAME/Credits の挙動が従来と完全同一 |
| I-2 | 全127名の基準値・プロフィール表示 | **pot/trainCap由来の値がDOM・生成HTML文字列のどこにも現れない**(開発率・ファジーラベル含む)。描画が参照してよいフィールドは fighter-file.md「データの前提」のホワイトリストのみ |
| I-3 | 機密注記の表示 | **確定文言と一字一句一致**(fighter-file.md 記載の3行。テストで固定) |
| I-4 | ソート・検索がゲーム内DBと同作法 | th再クリックで昇降トグル/別列は降順から/名前は `localeCompare('ja')`/デフォルトはOVR降順。**1クリック=1回の再描画**(二重描画・再入で壊れない) |
| I-5 | タイトル配色を案2へ | 変更は `.title-screen` 系の地色とグローのみ。**ロゴ・ボタンの金、ゲーム内Officeの暖茶(`--bg-dark`変数自体)は変えない**(タイトル画面のセレクタ内で上書きする。全画面共通変数の書き換え禁止) |
| I-6 | 共通ヘルパー新設 | stat-notation §1/§2の式・帯・閾値と一致(検算値: barDispOver(110)=103.6/(130)=110.8/(150)=118/(200)=118)。**選手ファイル内に塗り・バーの重複実装を作らない**(ヘルパー経由のみ) |

## 5. 検証手順

1. `node --check` 対象JS全部(フックも走る)
2. `node test/fighter-file-guard-test.js` — 新設。最低限: ①注記3行の一字一句一致 ②生成HTMLに pot/trainCap 値が非出現(全127名分を描画して検査) ③barDispOver/statTierStyle の検算値一致 ④ソート比較関数の昇降トグル
3. auto-sim: **不要**(app.js/index.html/ui-common追加のみ、エンジン非接触。CLAUDE.mdの「UIのみの変更→不要」に該当)。ただしフックがターン末に回した場合はALL CLEARであること
4. 手動確認はKeisukeの実機確認バックログへ委ねる(スクショ添付不要)

## 6. 完了条件

- diffが §3 の「触ってよい」4ファイルに閉じている
- コミット粒度: ①共通ヘルパー+テスト ②タイトル配色+リンク ③選手ファイル本体、の3粒度
- 完了報告に: 不変条件I-1〜I-6の自己チェック結果 / 触ったファイルと行数 / テスト結果全文
