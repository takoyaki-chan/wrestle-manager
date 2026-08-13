# task-94: UI自動走破ハーネス骨格(バグ捜索②・Wモード1季)

**依頼先**: Codex
**作業場所**: 専用worktree `wm-codex-task94`(ブランチ `codex/task-94-ui-walkthrough-harness`。mainフォルダ `Downloads/wrestle-manager` はKeisukeがブラウザで直接開いてプレイ中のため絶対に触らない)
**マージ**: Fableがdiff全文レビュー+不変条件を1つずつ独立検算→コミット代行→mainへ
**依存**: なし(task-92/93と並行可。触るファイルが交差しない)
**ネットワーク**: `npm i -D playwright` と `npx playwright install chromium` にネットワークが必要。サンドボックスで不可ならその時点で **BLOCKED** 報告(Fableが代行インストールする)

---

## 1. 目的

実ブラウザ・実クリックでゲームUIを自動走破し、無例外の進行停止(契約フリーズ型)・実行時例外・生の内部値露出を機械検出するハーネスの骨格を作る。初期マイルストーンは **Wモード(走破)で1季完走**。Mモード(モンキー)と D4(不可視検出)は後続タスクで、今回は作らない。

## 2. 仕様の正(指示書内に仕様を二重記載しない)

- **設計書**: `docs/ui-walkthrough-harness-design-v0.1.md`(§2構成/§3実行モード/§4検出器/§5決定論と速度/§6アーティファクト)
- 本タスクのスコープはそのうち: 静的サーバ / Wモードdriver / 検出器 **D1・D2・D3・D5** / アーティファクト出力 / fixtureセーブ。**Mモード・D4は含めない**(driverの構造は後で足せる形にしておく)
- 検証ミュート鉄則: 読み込み前に localStorage `wm_audio` へ muted を注入(MEMORY記載の既知の罠: `Audio.sfxMasterVol` 代入は読み取り専用で無効)

## 3. 触ってよいファイル / 触ってはいけないファイル

**触ってよい**:
- `test/ui-walkthrough/` — **新規ディレクトリ**。run.js / server.js / driver.js / detectors.js / fixtures/ / README.md(再現コマンドと使い方)
- `package.json` — `devDependencies` に playwright 追加+scripts に `"test:ui:walkthrough"` 追加のみ
- `package-lock.json` — npm installの結果
- `.gitignore` — `test/ui-walkthrough/artifacts/` と `node_modules`(未記載の場合)の追加のみ

**触ってはいけない**:
- **`src/` 配下すべて(1文字も変更禁止)**。この「製品コード無改変」がハーネスの設計上の核(設計書§0)
- `release/manifest.json` / 既存の `test/*` / `.claude/` / docs

## 4. 数値目標と不変条件(対で書く)

| # | 目標 | 不変条件(これを壊す実装は不合格) |
|---|---|---|
| I-1 | Wモードで1季完走(fixture開始週→翌季W1到達) | **`git diff` で src/ の変更ゼロ**。ゲームへの注入は page.addInitScript による localStorage(wm_audio ミュート+fixtureセーブ)のみ |
| I-2 | 進行は実UIクリックのみ | **page.evaluate で G を書き換えない・App/Engine の関数を直接呼んで進行させない**(evaluateは読み取り専用=検出器・ログ用途のみ)。例外: 設計書§5のとおり開発者モードの高速進行を「スキップ手段」として使うのは可。ただし検査対象区間(通常興行週・契約更改週・オフシーズン)は必ず実クリックで通す |
| I-3 | 検出器D1/D2/D3/D5が機能する | `fixtures/detector-sandbox.html`(既知バグを仕込んだ自作テストページ: ①clickでthrow ②押しても何も起きないボタン ③「undefined」「NaN」を表示するラベル)で**3種それぞれの検出をテストで固定**。かつクリーンな1季走破でFAIL 0件(ゲーム側の真バグで0にできない場合は修正せず、検出内容をそのまま報告=それが成果) |
| I-4 | 決定論 | 同一シード・同一fixtureで**2回実行し操作列ログのdiffが空**。乱数は自前シードPRNG(`Math.random`直呼び禁止)。fixtureは `test/make-save.js` 流用または headless Engine+`Storage.serialize` で生成し、生成スクリプトとシードを fixtures/ に残す |
| I-5 | 後始末 | 全体タイムアウト(既定15分)で必ず終了し**Chromium/サーバのプロセスを残さない**(ゾンビ禁止)。Playwrightは一時プロファイル起動でKeisukeの実ブラウザ・実localStorageと完全非干渉 |
| I-6 | 既存テスト体制に非干渉 | ファイル名に `*-test.js` を使わない(run-all.js の収集対象外を維持)。**既存 `npm test` が引き続き全緑** |

## 5. 検証手順

1. worktree内で `npm i -D playwright` → `npx playwright install chromium`(**フォアグラウンド実行・run_in_background禁止**)
2. `node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42` — **2回**実行(I-4の決定論確認)。1季の**所要実時間を計測して報告**(運用サイクル判断の材料になる)
3. サンドボックス検出テスト(I-3の3種が検出されること)
4. `npm test`(I-6)
5. FAIL/FREEZE を検出した場合: artifacts の内容(スクショ/操作列/G要約/console)と**再現コマンド1行**を完了報告に添付。**ゲーム側の修正はしない**(検出が成果物。修正は別タスク)

## 6. 完了条件

- diffが§3の「触ってよい」に閉じている(特に src/ 変更ゼロ)
- コミット粒度: ①package.json+server+run骨格 ②driver(Wモード) ③検出器+サンドボックス ④fixture+README、の4粒度目安
- 完了報告に: 不変条件I-1〜I-6の自己チェック結果 / 1季走破の所要時間 / 検出0件 or 検出一覧(allowlist候補の提案含む) / 特別対応が必要だった画面のリスト(汎用「主ボタン」方針で通らなかった箇所=driver保守の急所)
