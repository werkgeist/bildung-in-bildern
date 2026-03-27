import { getStoredUsername } from "./auth";

const SESSION_KEY = "bib-session-id";
const DRYRUN_KEY = "bib-dryrun";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return generateId();
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function isDryrun(): boolean {
  if (typeof window === "undefined") return false;
  const urlParam =
    new URLSearchParams(window.location.search).get("dryrun") === "true";
  if (urlParam) {
    sessionStorage.setItem(DRYRUN_KEY, "1");
  }
  return urlParam || sessionStorage.getItem(DRYRUN_KEY) === "1";
}

export interface TrackEventParams {
  lesson_id: string;
  step_type: "sequence_view" | "quiz_answer";
  step_index: number;
  answer?: string;
  correct?: 0 | 1;
  response_time_ms?: number;
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const username = getStoredUsername();
    const session_id = getSessionId();
    const is_dryrun = isDryrun() ? 1 : 0;
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, session_id, username, is_dryrun }),
    });
  } catch {
    // fail silently — never break the UX
  }
}
