export const TOKEN_COOKIE = "bib-access-token";
export const USERNAME_COOKIE = "bib-username";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop()?.split(";").shift();
    return part ? decodeURIComponent(part) : null;
  }
  return null;
}

export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function normalizeUsername(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidToken(token: string | null): boolean {
  const expected = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
  if (!expected || !token) return false;
  return token === expected;
}

export function getStoredToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function storeToken(token: string): void {
  setCookie(TOKEN_COOKIE, token, 30);
}

export function getStoredUsername(): string | null {
  return getCookie(USERNAME_COOKIE);
}

export function storeUsername(name: string): void {
  setCookie(USERNAME_COOKIE, normalizeUsername(name), 365);
}
