import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const middlewarePath = resolve(__dirname, "../../functions/_middleware.ts");
const source = readFileSync(middlewarePath, "utf-8");

describe("Edge middleware source (#55)", () => {
  it("exists and exports onRequest", () => {
    expect(source).toContain("export async function onRequest");
  });

  it("validates against ACCESS_TOKEN (not NEXT_PUBLIC_)", () => {
    expect(source).toContain("ACCESS_TOKEN");
    expect(source).not.toContain("NEXT_PUBLIC_ACCESS_TOKEN");
  });

  it("sets HttpOnly cookie", () => {
    expect(source).toContain("HttpOnly");
  });

  it("sets Secure flag on cookie", () => {
    expect(source).toContain("Secure");
  });

  it("skips /dashboard routes", () => {
    expect(source).toContain("/dashboard");
  });

  it("skips /api/ routes", () => {
    expect(source).toContain("/api/");
  });

  it("returns 403 for unauthorized requests", () => {
    expect(source).toContain("403");
  });

  it("does not contain the old leaked token", () => {
    expect(source).not.toContain("dev-token-2026");
  });
});

describe("Edge middleware handler", async () => {
  const mod = await import("../../functions/_middleware");

  function makeContext(url: string, cookie?: string, token?: string) {
    const headers = new Headers();
    if (cookie) headers.set("Cookie", cookie);
    const request = new Request(url, { headers });
    return {
      request,
      env: { ACCESS_TOKEN: token },
      next: async () => new Response("OK", { status: 200 }),
    };
  }

  it("passes through when ACCESS_TOKEN is not configured", async () => {
    const ctx = makeContext("https://app.example.com/", undefined, undefined);
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(200);
  });

  it("returns 403 when no cookie and no ?token param", async () => {
    const ctx = makeContext("https://app.example.com/", undefined, "secret");
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(403);
    const html = await res.text();
    expect(html).toContain("Kein Zugang");
  });

  it("sets cookie and redirects on valid ?token param", async () => {
    const ctx = makeContext(
      "https://app.example.com/?token=secret",
      undefined,
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get("Set-Cookie")).toContain("bib-access-token");
    expect(res.headers.get("Set-Cookie")).toContain("HttpOnly");
    const location = res.headers.get("Location")!;
    expect(location).not.toContain("token=");
  });

  it("passes through with valid cookie", async () => {
    const ctx = makeContext(
      "https://app.example.com/",
      "bib-access-token=secret",
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(200);
  });

  it("returns 403 for wrong cookie value", async () => {
    const ctx = makeContext(
      "https://app.example.com/",
      "bib-access-token=wrong",
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(403);
  });

  it("returns 403 for wrong ?token param", async () => {
    const ctx = makeContext(
      "https://app.example.com/?token=wrong",
      undefined,
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(403);
  });

  it("skips /dashboard routes", async () => {
    const ctx = makeContext(
      "https://app.example.com/dashboard",
      undefined,
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(200);
  });

  it("skips /api/ routes", async () => {
    const ctx = makeContext(
      "https://app.example.com/api/track",
      undefined,
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(200);
  });

  it("skips static assets", async () => {
    const ctx = makeContext(
      "https://app.example.com/main.js",
      undefined,
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(200);
  });

  it("protects lesson routes", async () => {
    const ctx = makeContext(
      "https://app.example.com/lesson/butterfly/",
      undefined,
      "secret"
    );
    const res = await mod.onRequest(ctx);
    expect(res.status).toBe(403);
  });
});
