interface Env {
  ACCESS_TOKEN?: string;
}

const COOKIE_NAME = "bib-access-token";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const SKIP_PREFIXES = ["/api/", "/dashboard", "/admin"];

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}

function getCookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function gateHTML(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bildung in Bildern — Zugang</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;padding:2rem}
.gate{text-align:center;max-width:24rem}
.icon{font-size:3.5rem;margin-bottom:1.5rem}
h1{font-size:1.5rem;color:#1f2937;margin-bottom:0.5rem}
p{font-size:1.125rem;color:#6b7280;margin-bottom:2rem}
</style>
</head>
<body>
<div class="gate">
<div class="icon">&#x1F512;</div>
<h1>Kein Zugang</h1>
<p>Diese Seite ist nur f&uuml;r eingeladene Nutzerinnen und Nutzer.</p>
</div>
</body>
</html>`;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  if (shouldSkip(url.pathname)) {
    return context.next();
  }

  const expectedToken = env.ACCESS_TOKEN;
  if (!expectedToken) {
    return new Response(gateHTML(), {
      status: 503,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }

  const urlToken = url.searchParams.get("token");
  if (urlToken && urlToken === expectedToken) {
    url.searchParams.delete("token");
    const response = new Response(null, {
      status: 302,
      headers: { Location: url.pathname + url.search },
    });
    response.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(urlToken)};Path=/;HttpOnly;Secure;SameSite=Lax;Max-Age=${COOKIE_MAX_AGE}`
    );
    return response;
  }

  const cookieToken = getCookieValue(request, COOKIE_NAME);
  if (cookieToken && cookieToken === expectedToken) {
    return context.next();
  }

  return new Response(gateHTML(), {
    status: 403,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
