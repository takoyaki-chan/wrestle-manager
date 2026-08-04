# Wrestle-Manager 無料バトルデモ：GitHub / Cloudflare Pages 公開指示書

## 目的

既存の `takoyaki-chan/wrestle-manager` 製品版リポジトリとは分離し、
「Wrestle-Manager 無料バトルデモ」をCloudflare Pagesで一般公開できる状態にする。

デモはブラウザで1試合だけ遊べる静的Webアプリであり、製品版の全選手データ、未公開要素、製品版セーブデータを公開・参照してはならない。

## 採用する公開構成

以下の2リポジトリ構成を採用する。

```text
takoyaki-chan/wrestle-manager
  └─ 開発元。共有バトルエンジンとデモのビルド元。

takoyaki-chan/wrestle-manager-battle-demo
  └─ 公開専用。public/ にデモの静的ビルド成果物だけを置く。
       Cloudflare Pagesはこのリポジトリの main を公開する。
```

公開専用リポジトリに、製品版本体の `src/data.js`、全選手データ、セーブデータ、開発用ツール、ローカルパス、秘密情報を入れないこと。

公開専用リポジトリは「バトルエンジンを別管理するリポジトリ」ではない。正本は常に `wrestle-manager` 側とし、公開側には `npm run demo:build` が生成した静的成果物だけを同期する。

## 作業対象

現在の製品版作業ディレクトリ：

```text
C:\Users\nkmrk\Downloads\wrestle-manager
```

デモのビルド元：

```text
apps/battle-demo/
tools/build-battle-demo.js
tools/battle-demo-shared.js
test/battle-demo-test.js
```

ビルド結果：

```text
dist/battle-demo/
```

## 実施手順

1. 作業開始前に `git status --short` を確認する。
   - 既存の未コミット変更を削除、上書き、revert、resetしない。
   - 特に製品版の `src/app.js`、`src/index.html`、`release/manifest.json` にある既存変更へ触れない。

2. デモを再ビルドして検証する。

   ```powershell
   npm.cmd run test:demo
   npm.cmd run demo:build
   npm.cmd run demo:preview
   ```

   `http://127.0.0.1:4174/` で以下を確認する。

   - 橘玲美、井沢遥、米山杏里、宇田川里奈、菊池璃子、大馬越よし子の6名だけが表示される
   - 選手選択では上半身画像を使う
   - 試合は製品版の観戦画面、演出、SE、通常試合BGMで進行する
   - 勝利ゼリフが勝者ごとに表示される
   - 再戦と選手選択へ戻る操作が動く
   - URLを直接再読み込みしても表示できる

3. GitHub上に `takoyaki-chan/wrestle-manager-battle-demo` が存在しないことを確認する。
   - 既存リポジトリがある場合は、内容を上書きしない。ユーザーへ確認する。
   - 新規作成する場合は **public** リポジトリとして作成する。
   - GitHubリポジトリの作成は外部状態を変更する操作なので、未承認なら直前にユーザーへ確認する。

4. 新規リポジトリをローカルの別ディレクトリへcloneする。

   ```text
   C:\Users\nkmrk\Downloads\wrestle-manager-battle-demo
   ```

5. 新規リポジトリには、以下だけを置く。

   ```text
   public/             # dist/battle-demo の内容をそのままコピー
   README.md           # 更新手順・Cloudflare設定・販売URL設定を記載
   .gitignore
   ```

   - `dist/battle-demo` の中身を `public/` の直下へコピーする。
   - `public/_headers` と `public/_redirects` を必ず含める。
   - `.git`、`node_modules`、`src/`、製品版の `image/` 全体、`release/`、`test/`、開発用秘密情報をコピーしない。
   - `public/` に `image/full/` が存在しないことを確認する。
   - 6名以外の顔画像、上半身画像、全身画像を含めないこと。

6. 公開専用リポジトリで以下を確認し、初回コミット・pushを行う。

   ```powershell
   git status --short
   git add public README.md .gitignore
   git commit -m "Publish Wrestle-Manager free battle demo"
   git push -u origin main
   ```

   push前に、公開対象を一覧化して次を確認する。

   - `src/data.js` がない
   - 製品版セーブキー・localStorageの読み書きがない
   - APIキー、トークン、ローカルパス、個人情報がない
   - 6名以外の選手データ・画像がない
   - 販売リンクが未設定なら、販売ボタンが表示されない

7. Cloudflare Pagesで新しいプロジェクトを作成し、GitHubリポジトリを連携する。

   | 項目 | 値 |
   |---|---|
   | プロジェクト名 | `wrestle-manager-battle-demo` |
   | GitHubリポジトリ | `takoyaki-chan/wrestle-manager-battle-demo` |
   | 本番ブランチ | `main` |
   | フレームワークプリセット | None |
   | ルートディレクトリ | リポジトリルート |
   | ビルドコマンド | `exit 0` |
   | ビルド出力ディレクトリ | `public` |

   - Cloudflareアカウントへのログイン、GitHub連携の承認、Cloudflareプロジェクト作成、独自ドメイン設定は、ユーザーの承認または操作なしに勝手に実行しない。
   - GitHub連携後は、`main` へのpushでCloudflare Pagesが自動デプロイすることを確認する。
   - Cloudflare Pagesの公開URL（`*.pages.dev`）で実機確認する。

8. Cloudflare公開後に確認する。

   - PC幅と390px程度のスマートフォン幅で表示が崩れない
   - 選手選択後にBGM・SEが鳴る
   - 試合終了後、勝者・決まり手・試合時間・勝利ゼリフが表示される
   - `/demo/reload-check` のような直接URLを再読み込みしても404にならない
   - ページタイトル、description、OGP、Twitter Cardが設定されている
   - `public/assets/og-card.png` がOGP画像として参照される
   - 販売ページURLが未設定なら販売ボタンは出ない

## 販売ページURLの設定

公開専用リポジトリの `public/config.js` にある `productLinks` を編集して設定する。

```js
productLinks: {
  booth: 'https://…',
  dlsite: 'https://…',
  fanza: 'https://…',
}
```

未設定の項目は空文字のままにする。空欄の販売ボタンは表示されない。

## デモ更新時の手順

1. 製品版リポジトリでデモと共有バトルエンジンを更新する。
2. `npm.cmd run test:demo` と `npm.cmd run demo:build` を通す。
3. `dist/battle-demo/` の内容だけを公開専用リポジトリの `public/` へ同期する。
4. 公開専用リポジトリで差分確認・コミット・pushする。
5. Cloudflare Pagesのデプロイ結果を確認する。

## 完了報告に含めること

- 作成または使用したGitHubリポジトリURL
- Cloudflare Pagesプロジェクト名と公開URL
- 初回コミットSHA
- Cloudflareの設定値
- 公開されたファイル数と、公開対象を限定した確認結果
- 実施したビルド・テスト・ブラウザ確認結果
- 製品版本体へ加えた変更の有無
- 未実施の外部操作があれば、その理由
