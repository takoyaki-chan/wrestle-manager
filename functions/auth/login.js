// GET /auth/login — Patreon の認可画面へリダイレクトする
import { patreonConfigured, redirectUri } from "../_lib/auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!patreonConfigured(env)) {
    return new Response(null, { status: 302, headers: { Location: url.origin + "/" } });
  }
  // CSRF対策のstateを短命クッキーに保存
  const state = crypto.randomUUID();
  const authorize = "https://www.patreon.com/oauth2/authorize"
    + "?response_type=code"
    + `&client_id=${encodeURIComponent(env.PATREON_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri(url))}`
    + `&scope=${encodeURIComponent("identity identity.memberships")}`
    + `&state=${state}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize,
      "Set-Cookie": `wm_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
