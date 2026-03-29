"use client";

import { useEffect, useState } from "react";
import {
  TOKEN_COOKIE,
  isValidToken,
  getCookie,
  deleteCookie,
  storeToken,
  storeUsername,
  getStoredUsername,
  normalizeUsername,
} from "@/lib/auth";
import { isDryrun } from "@/lib/analytics";

type AuthState = "loading" | "locked" | "username-prompt" | "authorized";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    isDryrun(); // persist ?dryrun=true to sessionStorage before any navigation

    let token = getCookie(TOKEN_COOKIE);

    if (!isValidToken(token)) {
      if (token !== null) deleteCookie(TOKEN_COOKIE);

      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");

      if (isValidToken(urlToken)) {
        storeToken(urlToken!);
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      } else {
        setState("locked");
        return;
      }
    }

    const username = getStoredUsername();
    setState(username ? "authorized" : "username-prompt");
  }, []);

  function handleUsernameSubmit() {
    const name = normalizeUsername(usernameInput);
    if (!name) return;
    storeUsername(name);
    setState("authorized");
  }

  if (state === "loading") return null;

  if (state === "locked") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Kein Zugang
        </h1>
        <p className="text-lg text-gray-600 max-w-sm">
          Diese Seite ist nur für eingeladene Nutzerinnen und Nutzer.
        </p>
      </div>
    );
  }

  if (state === "username-prompt") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <div className="text-6xl mb-6">👋</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Willkommen!
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">Wie heißt du?</p>
        <input
          type="text"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUsernameSubmit()}
          placeholder="Dein Name"
          className="w-full max-w-sm text-xl border-2 border-gray-300 rounded-xl px-5 py-4 mb-6 outline-none focus:border-amber-500"
          autoFocus
        />
        <button
          onClick={handleUsernameSubmit}
          disabled={!normalizeUsername(usernameInput)}
          className="w-full max-w-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xl font-bold rounded-xl px-8 py-5 min-h-[80px] transition-colors"
        >
          Weiter
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
