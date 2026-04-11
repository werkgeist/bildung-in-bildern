import { describe, it, expect, beforeEach } from "vitest";
import {
  getCookie,
  setCookie,
  deleteCookie,
  normalizeUsername,
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
