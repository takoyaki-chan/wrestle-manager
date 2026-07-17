# Cloudflare版 Patreon 支援者限定アクセス — セットアップ手順

> 実装: `functions/_middleware.js` + `functions/auth/{login,callback}.js` + `functions/_lib/auth.js`(2026-07-17)
> **環境変数を設定するまでは従来のパスワードゲート(wrestle2025)のまま動く**。設定した瞬間からPatreonモードに切り替わる。

## 仕組み

1. 未ログインの訪問者には「Patreonでログイン」画面が出る
2. Patreon OAuth でログイン → あなたのキャンペーンの**有効な有料メンバーか**をPatreon APIで確認
3. OKなら署名付きクッキー(7日有効)を発行。7日ごとに再ログイン=支援状態の再確認
4. 支援していない/解約済みのアカウントは入れない(理由別のメッセージ表示)

## Keisuke がやること(1回だけ・約10分)

### 1. Patreon側: OAuthクライアント登録

1. https://www.patreon.com/portal/registration/register-clients を開く(クリエイターアカウントで)
2. 「Create Client」で新規作成:
   - App Name: Wrestle Manager など
   - Redirect URIs: `https://<CloudflareのドメインV>/auth/callback`(例: `https://wrestle-manager.pages.dev/auth/callback`。独自ドメインがあればそちらも改行で追加)
   - API Version: **2**
3. 作成後に表示される **Client ID** と **Client Secret** を控える

### 2. キャンペーンIDの確認

- ブラウザで https://www.patreon.com/api/oauth2/v2/campaigns を開く(ログイン状態で)か、
  自分のPatreonページのソースにある `campaign_id` を確認。数字のIDを控える

### 3. Cloudflare側: 環境変数の設定

Cloudflare ダッシュボード → Pages → wrestle-manager → **Settings → Environment variables**(Production)に以下を追加:

| 変数名 | 値 | 必須 |
|---|---|---|
| `PATREON_CLIENT_ID` | 手順1のClient ID | ✅ |
| `PATREON_CLIENT_SECRET` | 手順1のClient Secret(**Encrypt推奨**) | ✅ |
| `PATREON_CAMPAIGN_ID` | 手順2のキャンペーンID(数字) | ✅ |
| `COOKIE_SECRET` | 適当な長いランダム文字列(クッキー署名用。**Encrypt推奨**) | 推奨 |
| `ADMIN_PASSWORD` | 自分用バックドア(`?password=◯◯`で入れる)。不要なら未設定 | 任意 |
| `PATREON_MIN_CENTS` | 最低支援額(セント)。未設定=有料メンバーなら誰でも(1)。例: `300`=一定プラン以上 | 任意 |

4. 設定後に **Retry deployment**(環境変数はデプロイ時に反映)

## 動作確認

1. シークレットウィンドウでサイトを開く → 「Patreonでログイン」画面になればPatreonモードに切替済み
2. 支援者アカウントでログイン → ゲームに入れる
3. 非支援アカウント → 「有効な支援メンバーシップが確認できませんでした」で弾かれる
4. `https://<ドメイン>/?password=<ADMIN_PASSWORD>` で自分だけ即入場できる(設定した場合)

## 補足・注意

- **クリエイター本人のアカウントは自分のキャンペーンのメンバーではない**ため、Patreonログインでは入れないことがある → `ADMIN_PASSWORD` を自分用に設定しておくのが楽
- 旧パスワード(wrestle2025)は環境変数を設定した瞬間から無効
- 既存訪問者の旧クッキー(`wm_auth=ok`)は署名検証に通らないため、切替時に全員再ログインになる(意図どおり)
- 対象プランを変えたくなったら `PATREON_MIN_CENTS` を変更(例: $3プラン以上=300)
