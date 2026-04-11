"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getStoredUsername,
  storeUsername,
  normalizeUsername,
} from "@/lib/auth";
import { isDryrun } from "@/lib/analytics";

type GateState = "loading" | "username-prompt" | "ready";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const [usernameInput, setUsernameInput] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    isDryrun();
    setState(getStoredUsername() ? "ready" : "username-prompt");
  }, []);

  if (pathname.startsWith("/dashboard")) return <>{children}</>;

  if (state === "loading") return null;

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const name = normalizeUsername(usernameInput);
              if (!name) return;
              storeUsername(name);
              setState("ready");
            }
          }}
          placeholder="Dein Name"
          className="w-full max-w-sm text-xl border-2 border-gray-300 rounded-xl px-5 py-4 mb-6 outline-none focus:border-amber-500"
          autoFocus
        />
        <button
          onClick={() => {
            const name = normalizeUsername(usernameInput);
            if (!name) return;
            storeUsername(name);
            setState("ready");
          }}
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
