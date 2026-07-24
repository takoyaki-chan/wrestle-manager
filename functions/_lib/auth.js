// Patreon 認証まわりの共有ヘルパー(Cloudflare Pages Functions)
// "_" 始まりのディレクトリはルーティング対象外なので、ここは直接公開されない。

const COOKIE_NAME = "wm_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7日。期限切れで再ログイン=支援状態の再確認

/** 署名用キー(COOKIE_SECRET 優先、なければ client secret を流用) */
function signingKey(env) {
  return env.COOKIE_SECRET || env.PATREON_CLIENT_SECRET || "";
}

async function hmacHex(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/** 署名付き認証クッキー値を作る: "<期限unix秒>.<hmac>" */
export async function makeAuthCookie(env) {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const sig = await hmacHex(signingKey(env), String(exp));
  return `${COOKIE_NAME}=${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

/** リクエストの認証クッキーを検証する */
export async function verifyAuthCookie(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(`${COOKIE_NAME}=(\\d+)\\.([0-9a-f]+)`));
  if (!m) return false;
  const [, expStr, sig] = m;
  if (parseInt(expStr, 10) < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacHex(signingKey(env), expStr);
  return sig === expected;
}

/** Patreon 連携が構成済みか(未構成なら旧パスワードゲートで動く) */
export function patreonConfigured(env) {
  return !!(env.PATREON_CLIENT_ID && env.PATREON_CLIENT_SECRET && env.PATREON_CAMPAIGN_ID);
}

export function redirectUri(url) {
  return `${url.origin}/auth/callback`;
}

/** 認可コードをアクセストークンに交換する */
export async function exchangeCode(env, url, code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.PATREON_CLIENT_ID,
    client_secret: env.PATREON_CLIENT_SECRET,
    redirect_uri: redirectUri(url),
  });
  const res = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  return res.json(); // { access_token, ... }
}

/** ログインユーザーが対象キャンペーンの有効な有料メンバーかを判定する */
export async function checkMembership(env, accessToken) {
  const url = "https://www.patreon.com/api/oauth2/v2/identity"
    + "?include=memberships.campaign,campaign"
    + "&fields%5Bmember%5D=patron_status,currently_entitled_amount_cents";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return { ok: false, reason: "api_error" };
  const data = await res.json();
  const userId = data.data?.id || null;

  // クリエイター本人は自分のキャンペーンの「支援者」ではないため、所有キャンペーン一致で通す
  const ownCampaignId = data.data?.relationships?.campaign?.data?.id;
  if (ownCampaignId && ownCampaignId === env.PATREON_CAMPAIGN_ID) {
    return { ok: true, creator: true };
  }

  // 手動許可リスト(カンマ区切りのPatreonユーザーID。テスターや campaigns スコープ不調時の保険)
  const allowIds = (env.PATREON_ALLOW_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (userId && allowIds.includes(userId)) {
    return { ok: true, allowlisted: true };
  }

  const minCents = parseInt(env.PATREON_MIN_CENTS || "1", 10); // 🔧 最低支援額(セント)。既定=有料メンバーなら誰でも
  const members = (data.included || []).filter(x => x.type === "member");
  for (const mem of members) {
    const campaignId = mem.relationships?.campaign?.data?.id;
    if (campaignId !== env.PATREON_CAMPAIGN_ID) continue;
    const status = mem.attributes?.patron_status;
    const cents = mem.attributes?.currently_entitled_amount_cents || 0;
    if (status === "active_patron" && cents >= minCents) return { ok: true };
    return { ok: false, reason: status === "active_patron" ? "tier_too_low" : "not_active", userId };
  }
  return { ok: false, reason: "not_member", userId };
}

/** ログイン画面(Patreonボタン)を返す */
export function loginPage(url, message) {
  const note = message ? `<p class="err">${message}</p>` : "";
  return new Response(`<!DOCTYPE html>
<html lang="ja"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Wrestle Manager</title>
  <style>
    body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;font-family:sans-serif}
    .box{background:#16213e;padding:2.4rem 2.8rem;border-radius:12px;text-align:center;max-width:420px}
    h2{margin-top:0}
    p{color:#c8c4bc;font-size:.92rem;line-height:1.7}
    .err{color:#ff8b9e}
    a.btn{display:inline-block;margin-top:.6rem;padding:.7rem 1.8rem;border-radius:8px;background:#e94560;color:#fff;font-size:1rem;text-decoration:none;font-weight:700}
    a.btn:hover{background:#c73750}
  </style>
</head><body>
  <div class="box">
    <h2>Wrestle Manager</h2>
    <p>このページは Patreon 支援者向けの先行プレイ版です。<br>Patreon アカウントでログインしてください。</p>
    ${note}
    <a class="btn" href="/auth/login">Patreon でログイン</a>
  </div>
</body></html>`, { status: 401, headers: { "Content-Type": "text/html;charset=utf-8" } });
}
