# Wrestle-Manager 無料バトルデモ

製品版のバトル部分だけをブラウザで試せる、独立した静的Webアプリです。団体運営、育成、スカウト、シーズン進行、製品版セーブの読み込みは含みません。

## 構成

- 試合計算: 製品版と同じ `src/match-engine.js` をビルド時に共有
- 観戦画面: 製品版の `src/battle-engine.html`、`battle-engine-main.js`、共通CSS・演出・SEを共有
- デモデータ: 指定された6選手と、その5スタイルに必要な技だけを公開
- 表示: 選手選択と試合後の販売導線だけがデモ専用。試合中は製品版の観戦画面をiframeでそのまま表示
- 保存: localStorageを使用しない。製品版のセーブキーは読み書きしない
- 公開物: `dist/battle-demo/`。6選手の顔・上半身画像、リング背景、観戦用SE、製品版の通常試合BGMなど、ビルドスクリプトの許可リストにあるファイルだけを出力

製品版の `battle-engine.html` にある全選手画像対応表はそのまま公開せず、ビルド時にデモ6選手分へ縮小します。観戦用JS・CSSと通常試合BGMはコピー元とのハッシュ一致をテストし、製品版との表示・音響差分が生まれないようにしています。

## ローカル起動

```powershell
npm.cmd run demo:dev
```

ブラウザで `http://127.0.0.1:4173/` を開きます。最初から選手選択画面を表示し、共有バトル処理・観戦iframe・音声は「この対戦で試合開始」を押した後に初めて読み込まれます。

## 本番ビルドと確認

```powershell
npm.cmd run demo:build
npm.cmd run demo:preview
```

本番確認URLは `http://127.0.0.1:4174/`、公開対象ディレクトリは `dist/battle-demo` です。

## Cloudflare Pages

Git連携で次の値を設定します。

| 項目 | 設定値 |
|---|---|
| フレームワークプリセット | None |
| ルートディレクトリ | リポジトリルート |
| ビルドコマンド | `npm run demo:build` |
| ビルド出力ディレクトリ | `dist/battle-demo` |
| Node.js | 20以降 |

`_redirects` がすべてのパスを `index.html` へ戻し、`<base href="/">` がアセットをPagesルートから解決するため、URLを直接再読み込みしても404やアセット参照切れになりません。

OGP画像を絶対URLにする場合は、Pagesの環境変数 `DEMO_PUBLIC_URL` に公開サイトのオリジン（例: `https://demo.example.com`）を設定します。

## 販売ページURL

次のどちらかで設定できます。

1. Cloudflare Pagesの環境変数

   - `DEMO_PRODUCT_BOOTH_URL`
   - `DEMO_PRODUCT_DLSITE_URL`
   - `DEMO_PRODUCT_FANZA_URL`

2. `apps/battle-demo/config.js` の `productLinks`

空欄または不正なURLの販売ボタンは表示されません。

## OGP画像

`apps/battle-demo/assets/og-card.png` を同じファイル名で差し替えます。推奨サイズは1200×630pxです。

現在の画像はデモ採用6選手のゲーム内顔素材を組み合わせたものです。再生成する場合は次を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-battle-demo-og.ps1
```

## アクセス解析

`analytics.js` の `trackEvent()` は送信先未設定でも安全に動き、次のイベントを発火します。

- `demo_page_view`
- `battle_start`
- `battle_complete`
- `rematch`
- `product_link_click`

送信先を追加する場合は、読み込み前に `window.WM_DEMO_ANALYTICS_ADAPTER = (name, properties) => { ... }` を定義します。

## 公開前チェック

```powershell
npm.cmd run test:demo
```

共有エンジンでの全デモ対戦、販売リンクの初期非表示、localStorage未使用、公開ファイルの許可リスト、製品版観戦JS・CSSとのハッシュ一致、全選手データや秘密情報の非混入を検査します。
