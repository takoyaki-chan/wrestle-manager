// GET /auth/callback — Patreon からの戻り。コード交換→支援状態確認→クッキー発行
import { patreonConfigured, exchangeCode, checkMembership, makeAuthCookie, loginPage } from "../_lib/auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!patreonConfigured(env)) {
    return new Response(null, { status: 302, headers: { Location: url.origin + "/" } });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const stateOk = state && cookie.includes(`wm_oauth_state=${state}`);
  if (!code || !stateOk) {
    return loginPage(url, "ログインをやり直してください。");
  }

  const token = await exchangeCode(env, url, code);
  if (!token || !token.access_token) {
    return loginPage(url, "Patreon との接続に失敗しました。時間をおいてやり直してください。");
  }

  const membership = await checkMembership(env, token.access_token);
  if (!membership.ok) {
    const msg = membership.reason === "tier_too_low"
      ? "現在の支援プランでは先行プレイ版の対象外です。"
      : "有効な支援メンバーシップが確認できませんでした。Patreon で支援中のアカウントでログインしてください。";
    return loginPage(url, msg);
  }

  const authCookie = await makeAuthCookie(env);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.origin + "/",
      "Set-Cookie": authCookie,
    },
  });
}
