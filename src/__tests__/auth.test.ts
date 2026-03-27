import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCookie,
  setCookie,
  deleteCookie,
  normalizeUsername,
  isValidToken,
} from "@/lib/auth";

function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

describe("Cookie helpers", () => {
  beforeEach(() => {
    clearAllCookies();
  });

  it("sets and gets a cookie", () => {
    setCookie("test", "hello", 30);
    expect(getCookie("test")).toBe("hello");
  });

  it("returns null for missing cookie", () => {
    expect(getCookie("nonexistent")).toBeNull();
  });

  it("encodes and decodes unicode characters", () => {
    setCookie("test", "Иван Петров", 30);
    expect(getCookie("test")).toBe("Иван Петров");
  });

  it("deletes a cookie", () => {
    setCookie("test", "value", 30);
    deleteCookie("test");
    expect(getCookie("test")).toBeNull();
  });

  it("overwrites an existing cookie value", () => {
    setCookie("test", "first", 30);
    setCookie("test", "second", 30);
    expect(getCookie("test")).toBe("second");
  });
});

describe("normalizeUsername", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeUsername("  Anna  ")).toBe("Anna");
  });

  it("collapses multiple spaces to one", () => {
    expect(normalizeUsername("Anna  Maria")).toBe("Anna Maria");
  });

  it("preserves unicode characters", () => {
    expect(normalizeUsername("Иван")).toBe("Иван");
  });

  it("preserves mixed-script names", () => {
    expect(normalizeUsername("  Ana María  ")).toBe("Ana María");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeUsername("   ")).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeUsername("")).toBe("");
  });
});

describe("isValidToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for a matching token", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCESS_TOKEN", "secret123");
    expect(isValidToken("secret123")).toBe(true);
  });

  it("returns false for a wrong token", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCESS_TOKEN", "secret123");
    expect(isValidToken("wrong")).toBe(false);
  });

  it("returns false for null", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCESS_TOKEN", "secret123");
    expect(isValidToken(null)).toBe(false);
  });

  it("returns false when env var is empty string", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCESS_TOKEN", "");
    expect(isValidToken("anything")).toBe(false);
  });

  it("is case-sensitive", () => {
    vi.stubEnv("NEXT_PUBLIC_ACCESS_TOKEN", "Secret123");
    expect(isValidToken("secret123")).toBe(false);
    expect(isValidToken("Secret123")).toBe(true);
  });
});
