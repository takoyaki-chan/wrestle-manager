'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function loadMiddleware(deps) {
  let source = fs.readFileSync(path.join(root, 'functions', '_middleware.js'), 'utf8');
  source = source
    .replace(/import \{[^}]+\} from "\.\/_lib\/auth\.js";/, 'const { patreonConfigured, verifyAuthCookie, makeAuthCookie, loginPage } = globalThis.__deps;')
    .replace('export async function onRequest', 'async function onRequest');
  source += '\nglobalThis.__onRequest = onRequest;';
  const context = vm.createContext({ URL, Response, __deps: deps });
  vm.runInContext(source, context, { filename: 'functions/_middleware.js' });
  return context.__onRequest;
}

function loadAuthHelpers() {
  let source = fs.readFileSync(path.join(root, 'functions', '_lib', 'auth.js'), 'utf8');
  source = source.replace(/export /g, '');
  source += '\nglobalThis.__auth = { makeAuthCookie, verifyAuthCookie, loginPage };';
  const context = vm.createContext({
    crypto: crypto.webcrypto,
    fetch,
    Request,
    Response,
    TextEncoder,
    URLSearchParams,
  });
  vm.runInContext(source, context, { filename: 'functions/_lib/auth.js' });
  return context.__auth;
}

function requestContext(url, env) {
  return {
    request: new Request(url),
    env,
    next: async () => new Response('next'),
  };
}

// 購入者用の入力欄は POST で送る(URLにパスワードを残さない)
function postContext(url, env, password) {
  const body = new URLSearchParams({ password });
  return {
    request: new Request(url, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } }),
    env,
    next: async () => new Response('next'),
  };
}

(async () => {
  const syntheticBuyerPassword = ['test', 'buyer', 'credential'].join('-');
  const syntheticAdminPassword = ['test', 'admin', 'credential'].join('-');
  const loginCalls = [];
  const onRequest = loadMiddleware({
    patreonConfigured: () => true,
    verifyAuthCookie: async () => false,
    makeAuthCookie: async () => 'wm_auth=signed-test-cookie; Max-Age=604800',
    loginPage: (...args) => {
      loginCalls.push(args);
      return new Response('login', { status: 401 });
    },
  });

  const buyerEnv = { BUYER_PASSWORD: syntheticBuyerPassword };
  const buyerResponse = await onRequest(requestContext(`https://example.test/?password=${encodeURIComponent(syntheticBuyerPassword)}`, buyerEnv));
  assert.strictEqual(buyerResponse.status, 302);
  assert.match(buyerResponse.headers.get('set-cookie'), /^wm_auth=signed-test-cookie/);

  const adminResponse = await onRequest(requestContext(`https://example.test/?password=${encodeURIComponent(syntheticAdminPassword)}`, {
    ADMIN_PASSWORD: syntheticAdminPassword,
  }));
  assert.strictEqual(adminResponse.status, 302, '既存の管理者用入口も維持する');

  const unsetResponse = await onRequest(requestContext(`https://example.test/?password=${encodeURIComponent(syntheticBuyerPassword)}`, {}));
  assert.strictEqual(unsetResponse.status, 401);
  assert.strictEqual(loginCalls.at(-1)[2], false, '未設定時は購入者用UIを有効にしない');

  const postResponse = await onRequest(postContext('https://example.test/', buyerEnv, syntheticBuyerPassword));
  assert.strictEqual(postResponse.status, 302, 'POST で送った購入者用パスワードでも入れる');
  assert.match(postResponse.headers.get('set-cookie'), /^wm_auth=signed-test-cookie/);

  const postBadResponse = await onRequest(postContext('https://example.test/', buyerEnv, 'wrong'));
  assert.strictEqual(postBadResponse.status, 401, 'POST で違うパスワードなら入れない');

  const badResponse = await onRequest(requestContext('https://example.test/?password=wrong', buyerEnv));
  assert.strictEqual(badResponse.status, 401);
  assert.strictEqual(loginCalls.at(-1)[2], true, '設定時は購入者用UIを有効にする');

  const auth = loadAuthHelpers();
  const hiddenPage = await auth.loginPage(new URL('https://example.test/')).text();
  assert.ok(!hiddenPage.includes('buyer-access'));
  assert.ok(!hiddenPage.includes('If you bought the download edition'));

  const buyerPage = await auth.loginPage(new URL('https://example.test/'), undefined, true).text();
  assert.ok(buyerPage.includes('ダウンロード版をご購入の方は、商品ページに記載のパスワードを入力してください。'));
  assert.ok(buyerPage.includes('If you bought the download edition, enter the password shown on the store page.'));
  assert.match(buyerPage, /<form method="POST" action="\/">[\s\S]*name="password"/);   // パスワードをURLに残さないため POST で送る

  const baseEnv = { COOKIE_SECRET: ['test', 'cookie', 'key'].join('-') };
  const firstEnv = { ...baseEnv, BUYER_PASSWORD: syntheticBuyerPassword };
  const changedEnv = { ...baseEnv, BUYER_PASSWORD: `${syntheticBuyerPassword}-changed` };
  const cookie = await auth.makeAuthCookie(firstEnv);
  assert.strictEqual(await auth.verifyAuthCookie(new Request('https://example.test/', { headers: { Cookie: cookie } }), firstEnv), true);
  assert.strictEqual(await auth.verifyAuthCookie(new Request('https://example.test/', { headers: { Cookie: cookie } }), changedEnv), false,
    '購入者用パスワード変更時は既存の署名クッキーを無効にする');

  const legacyCookie = await auth.makeAuthCookie(baseEnv);
  assert.strictEqual(await auth.verifyAuthCookie(new Request('https://example.test/', { headers: { Cookie: legacyCookie } }), baseEnv), true,
    'BUYER_PASSWORD 未設定時の署名検証を維持する');

  console.log('buyer-password-gate-test: PASS');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
