"use client";

import { useEffect, useState } from "react";
import type {
  DashboardResponse,
  UserData,
  LessonData,
} from "../../../functions/api/dashboard";

const DASHBOARD_COOKIE = "bib-dashboard-token";

function getDashboardCookie(): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${DASHBOARD_COOKIE}=`);
  if (parts.length === 2) {
    const part = parts.pop()?.split(";").shift();
    return part ? decodeURIComponent(part) : null;
  }
  return null;
}

function setDashboardCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DASHBOARD_COOKIE}=${encodeURIComponent(token)};path=/;SameSite=Lax`;
}

function clearDashboardCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DASHBOARD_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

function isValidDashboardToken(token: string | null): boolean {
  const expected = process.env.NEXT_PUBLIC_DASHBOARD_TOKEN;
  if (!expected || !token) return false;
  return token === expected;
}

function scoreColor(
  correct: number,
  total: number
): "green" | "yellow" | "red" | "gray" {
  if (total === 0) return "gray";
  const pct = correct / total;
  if (pct >= 0.8) return "green";
  if (pct >= 0.5) return "yellow";
  return "red";
}

function scoreLabel(correct: number, total: number): string {
  if (total === 0) return "Kein Quiz";
  return `${correct}/${total} richtig`;
}

function rtLabel(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 3000) return "schnell";
  if (ms < 8000) return "mittel";
  return "langsam";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TrafficDot({
  correct,
  total,
}: {
  correct: number;
  total: number;
}) {
  const color = scoreColor(correct, total);
  const classes: Record<typeof color, string> = {
    green: "bg-green-500",
    yellow: "bg-yellow-400",
    red: "bg-red-400",
    gray: "bg-gray-300",
  };
  const labels: Record<typeof color, string> = {
    green: "Gut",
    yellow: "Mittelmäßig",
    red: "Schwierig",
    gray: "Keine Daten",
  };
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${classes[color]}`}
      title={labels[color]}
      aria-label={labels[color]}
    />
  );
}

function ActivityDots({
  days,
}: {
  days: { day: string; eventCount: number }[];
}) {
  const today = new Date();
  const dots = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const found = days.find((a) => a.day === dayStr);
    return { day: dayStr, active: !!found, count: found?.eventCount ?? 0 };
  });

  return (
    <div
      className="flex gap-1 items-center"
      aria-label="Aktivität letzte 14 Tage"
    >
      {dots.map((dot, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${dot.active ? "bg-amber-400" : "bg-gray-200"}`}
          title={`${dot.day}: ${dot.count > 0 ? `${dot.count} Events` : "keine Aktivität"}`}
        />
      ))}
    </div>
  );
}

function QuestionRow({
  q,
}: {
  q: {
    stepIndex: number;
    correct: number;
    total: number;
    avgResponseMs: number | null;
  };
}) {
  const color = scoreColor(q.correct, q.total);
  const colorText: Record<typeof color, string> = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-600",
    gray: "text-gray-400",
  };
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <span className="text-gray-400 w-6 text-right flex-shrink-0">
        F{q.stepIndex + 1}
      </span>
      <TrafficDot correct={q.correct} total={q.total} />
      <span className={`${colorText[color]} font-medium`}>
        {scoreLabel(q.correct, q.total)}
      </span>
      {q.avgResponseMs !== null && (
        <span className="text-gray-400 text-xs ml-auto">
          {Math.round((q.avgResponseMs / 1000) * 10) / 10}s ·{" "}
          {rtLabel(q.avgResponseMs)}
        </span>
      )}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: LessonData }) {
  const [expanded, setExpanded] = useState(false);
  const hasQuiz = lesson.quizTotal > 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-expanded={expanded}
      >
        <TrafficDot correct={lesson.quizCorrect} total={lesson.quizTotal} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">
            {lesson.lessonId}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {scoreLabel(lesson.quizCorrect, lesson.quizTotal)}
            {lesson.avgResponseMs !== null &&
              ` · ${Math.round((lesson.avgResponseMs / 1000) * 10) / 10}s`}
            {" · "}
            {formatDate(lesson.lastPlayed)}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
          {hasQuiz ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2 pb-1">
                Fragen im Detail
              </p>
              {lesson.questions.map((q) => (
                <QuestionRow key={q.stepIndex} q={q} />
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-2">Keine Quiz-Daten</p>
          )}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: UserData }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
      aria-label={`Nutzerprofil ${user.username}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-expanded={expanded}
        aria-label={`${user.username} ein-/ausklappen`}
      >
        <div
          className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg flex-shrink-0"
          aria-hidden="true"
        >
          {user.username[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base">{user.username}</p>
          <p className="text-sm text-gray-500">
            Zuletzt aktiv: {formatDate(user.lastActive)} · {user.sessions}{" "}
            {user.sessions === 1 ? "Session" : "Sessions"}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M5 7.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="mt-3 mb-1">
            <ActivityDots days={user.activityDays} />
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Aktivität der letzten 14 Tage
          </p>

          {user.lessons.length === 0 ? (
            <p className="text-sm text-gray-400">
              Noch keine Lektionen gespielt.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {user.lessons.map((lesson) => (
                <LessonCard key={lesson.lessonId} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type PageState = "loading" | "auth" | "fetching" | "error" | "ready" | "disabled";

export default function DashboardPage() {
  const [state, setState] = useState<PageState>("loading");
  const [pinInput, setPinInput] = useState("");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const expected = process.env.NEXT_PUBLIC_DASHBOARD_TOKEN;
    if (!expected) {
      setState("disabled");
      return;
    }

    // Accept token via URL param ?dt=...
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("dt");
    if (urlToken && urlToken === expected) {
      setDashboardCookie(urlToken);
      const url = new URL(window.location.href);
      url.searchParams.delete("dt");
      window.history.replaceState({}, "", url.toString());
    }

    const stored = getDashboardCookie();
    if (isValidDashboardToken(stored)) {
      fetchData(stored!);
    } else {
      setState("auth");
    }
  }, []);

  function handlePinSubmit() {
    const expected = process.env.NEXT_PUBLIC_DASHBOARD_TOKEN;
    if (!expected || pinInput !== expected) {
      setErrorMsg("Falscher Zugangs-Code");
      return;
    }
    setDashboardCookie(pinInput);
    setErrorMsg("");
    fetchData(pinInput);
  }

  async function fetchData(token: string) {
    setState("fetching");
    try {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearDashboardCookie();
        setState("auth");
        setErrorMsg("Zugang verweigert");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DashboardResponse;
      setData(json);
      setState("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Fehler beim Laden");
      setState("error");
    }
  }

  function handleLogout() {
    clearDashboardCookie();
    setData(null);
    setPinInput("");
    setState("auth");
  }

  if (state === "loading") return null;

  if (state === "disabled") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <p className="text-gray-500">Dashboard nicht konfiguriert.</p>
      </main>
    );
  }

  if (state === "auth") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">
              📊
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lernweg-Dashboard
            </h1>
            <p className="text-gray-500 mt-2">Für Eltern und Betreuer</p>
          </div>
          <label
            htmlFor="dashboard-pin"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Zugangs-Code
          </label>
          <input
            id="dashboard-pin"
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            placeholder="Code eingeben"
            className="w-full text-xl border-2 border-gray-300 rounded-xl px-5 py-4 mb-2 outline-none focus:border-amber-500"
            autoFocus
          />
          {errorMsg && (
            <p className="text-red-500 text-sm mb-3" role="alert">
              {errorMsg}
            </p>
          )}
          <button
            onClick={handlePinSubmit}
            disabled={!pinInput}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-lg font-bold rounded-xl px-8 py-4 transition-colors motion-reduce:transition-none"
          >
            Öffnen
          </button>
        </div>
      </main>
    );
  }

  if (state === "fetching") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <div
          className="w-full max-w-lg flex flex-col gap-4"
          aria-busy="true"
          aria-label="Wird geladen"
        >
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-gray-100 animate-pulse motion-reduce:animate-none"
            />
          ))}
        </div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <p className="text-red-500 font-medium mb-4" role="alert">
          Fehler: {errorMsg}
        </p>
        <button
          onClick={() => {
            const token = getDashboardCookie();
            if (token) fetchData(token);
          }}
          className="text-amber-600 underline"
        >
          Erneut versuchen
        </button>
      </main>
    );
  }

  // state === "ready"
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lernweg-Übersicht
            </h1>
            {data?.generatedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Stand: {formatDate(data.generatedAt)}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg px-2 py-1"
            aria-label="Abmelden"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Abmelden
          </button>
        </div>

        {!data || data.users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Noch keine Daten</p>
            <p className="text-sm mt-2">
              Sobald Lektionen gespielt werden, erscheinen hier die Ergebnisse.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.users.map((user) => (
              <UserCard key={user.username} user={user} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
