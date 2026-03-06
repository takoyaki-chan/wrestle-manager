export async function onRequest(context) {
  const CORRECT_PASSWORD = "wrestle2025";

  const cookie = context.request.headers.get("Cookie") || "";
  if (cookie.includes("wm_auth=ok")) {
    return context.next();
  }

  const url = new URL(context.request.url);

  if (context.request.method === "POST") {
    const formData = await context.request.formData();
    const password = formData.get("password");

    if (password === CORRECT_PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": url.origin + "/",
          ""Set - Cookie": "wm_auth = ok; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400"
        }
      });
    }
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
    <form method="POST">
      <input type="password" name="password" placeholder="Password" autofocus>
      <button type="submit">Enter</button>
    </form>
  </div>
</body></html>`, {
    status: 401,
    headers: { "Content-Type": "text/html;charset=utf-8" }
  });
}
