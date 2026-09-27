# task-105 実装報告

## 概要

`docs/codex-tasks/task-105-survey-followups-20260927.md` の4項目を、項目ごとのスコープで実装した。バージョンは `1.37` のまま変更していない。Cloudflareへのデプロイは実施していない。

## 1. 自動休養ラインの設定

- 自動休養の判定ラインを保存データ `G.autoRestLine` で管理し、未設定時は従来値の60を使うようにした
- 設定値として50 / 60 / 70 / 80を選べるUI、説明、日本語・英語表示を追加した
- 体調30未満の強制休養は維持し、設定変更は次週の処理から反映する
- 回帰テストで既定値、設定値による休養、体調30未満の強制休養を確認した

変更ファイル:

- `src/app.js`
- `src/lang-en.js`
- `src/management.js`
- `src/ui-render.js`
- `test/auto-rest-line-test.js`

コミット: `39418a9f feat: 自動休養ラインを設定可能にする`

## 2. アンケート・フィードバックフォームへの導線

- タイトル画面下部の既存リンクを見やすくし、hover時の色も調整した
- ヘルプ画面末尾に同じGoogleフォームへのリンクと、不具合報告時に必要なバージョン番号・ブラウザ名の案内を追加した
- 導線がタイトルとヘルプの2か所だけであること、日本語・英語の文言を回帰テストで確認した

変更ファイル:

- `src/index.html`
- `src/lang-en.js`
- `test/feedback-link-test.js`

コミット: `a025d1c5 feat: フィードバックフォーム導線を追加する`

## 3. タイトル画面から見られる更新履歴

- v1.35 / v1.36 / v1.37の更新内容を日本語・英語で持つ `WM_CHANGELOG` を追加した
- タイトル画面に「更新履歴 / What's New」を追加し、現在のバージョンと更新内容をモーダル表示するようにした
- 配布対象へ `src/data-changelog.js` を追加し、データ構造、掲載バージョン、UI配線、manifest登録を回帰テストで確認した

変更ファイル:

- `release/manifest.json`
- `src/app.js`
- `src/data-changelog.js`
- `src/index.html`
- `src/lang-en.js`
- `test/changelog-test.js`

コミット: `ec113b8e feat(title): 更新履歴をタイトル画面から見られるようにする`

## 4. Cloudflareウェブ版の購入者用パスワード入口

- Patreonモードで `BUYER_PASSWORD` が設定されている場合だけ、購入者用パスワードによる入場を有効にした
- `?password=` での直接入場と、ログイン画面の入力欄からのGET送信に対応した
- 認証成功時は既存と同じ7日間の署名クッキーを発行する
- ログイン画面に指定の日本語・英語案内を追加した。`BUYER_PASSWORD` 未設定時は購入者用UIを出さず、従来の画面出力と認証動作を維持する
- 署名キーを設定中の `BUYER_PASSWORD` にも結び付け、パスワード変更後は既存セッションを無効にして全員が入り直すようにした
- Cloudflare Pagesでの環境変数の設定・変更・確認手順を追記した。実際のパスワードはコードにもドキュメントにも記載していない
- 回帰テストで購入者用入口、既存の管理者用入口、未設定時の無効化、日英案内、GETフォーム、署名クッキー、パスワード変更時のセッション無効化を確認した

変更ファイル:

- `functions/_middleware.js`
- `functions/_lib/auth.js`
- `docs/cloudflare-patreon-auth-setup.md`
- `test/buyer-password-gate-test.js`

コミット: `f4890a38 feat(auth): 購入者用パスワード入口を追加する`

## 検証

- `node test/run-all.js`: 325件すべてPASS、失敗0、タイムアウト0
- `node test/version-consistency-test.js`: PASS (`v1.37`)
- `node test/buyer-password-gate-test.js`: PASS
- `BUYER_PASSWORD` 未設定時のログイン画面を変更前とバイト単位で比較: 一致
- `git diff --check`: PASS

## 公開について

項目4は仕様どおりデプロイしていない。作者が実装内容を確認した後、別途Cloudflare Pagesの環境変数を設定して公開する。
