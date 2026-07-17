// Cloudflare Pages 全体ゲート。
// Patreon 連携が構成済み(環境変数あり)なら「支援者のみアクセス可」、
// 未構成なら従来のパスワードゲートで動く(デプロイ順の事故防止)。
// セットアップ手順: docs/cloudflare-patreon-auth-setup.md
import { patreonConfigured, verifyAuthCookie, makeAuthCookie, loginPage } from "./_lib/auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 認証エンドポイントは素通し(それぞれのハンドラが処理)
  if (url.pathname.startsWith("/auth/")) {
    return context.next();
  }

  // ── Patreon モード(環境変数構成済み) ──────────────────────────
  if (patreonConfigured(env)) {
    if (await verifyAuthCookie(request, env)) {
      return context.next();
    }
    // 管理用バックドア(ADMIN_PASSWORD を設定した場合のみ有効)
    const password = url.searchParams.get("password");
    if (env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: { Location: url.origin + "/", "Set-Cookie": await makeAuthCookie(env) },
      });
    }
    return loginPage(url);
  }

  // ── レガシーモード(未構成時のフォールバック): 従来の共有パスワード ──
  const CORRECT_PASSWORD = "wrestle2025";
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("wm_auth=ok")) {
    return context.next();
  }
  const password = url.searchParams.get("password");
  if (password === CORRECT_PASSWORD) {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": url.origin + "/",
        "Set-Cookie": "wm_auth=ok; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400"
      }
    });
  }
  return new Response(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Wrestle Manager</title>
  <style>
    body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;font-family:sans-serif}
    .box{background:#16213e;padding:2rem;border-radius:12px;text-align:center}
    h2{margin-top:0}
    input{padding:.5rem 1rem;border:1px solid #555;border-radius:6px;background:#0f3460;color:#fff;font-size:1rem}
    button{padding:.5rem 1.5rem;border:none;border-radius:6px;background:#e94560;color:#fff;font-size:1rem;cursor:pointer;margin-left:.5rem}
    button:hover{background:#c73750}
  </style>
</head><body>
  <div class="box">
    <h2>Wrestle Manager</h2>
    <p>パスワードを入力してください</p>
    <form method="GET">
      <input type="password" name="password" placeholder="Password" autofocus>
      <button type="submit">Enter</button>
    </form>
  </div>
</body></html>`, {
    status: 401,
    headers: { "Content-Type": "text/html;charset=utf-8" }
  });
}
