import { trackEvent } from "./analytics";

export interface LogEntry {
  timestamp: string;
  questionId: string;
  selectedOption: string;
  correct: boolean;
  responseTimeMs: number;
  lessonId?: string;
  stepIndex?: number;
}

const STORAGE_KEY = "bildung-in-bildern-logs";

export function logAnswer(entry: LogEntry): void {
  if (typeof window === "undefined") return;
  const existing = getLogs();
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  if (entry.lessonId !== undefined && entry.stepIndex !== undefined) {
    void trackEvent({
      lesson_id: entry.lessonId,
      step_type: "quiz_answer",
      step_index: entry.stepIndex,
      answer: entry.selectedOption,
      correct: entry.correct ? 1 : 0,
      response_time_ms: entry.responseTimeMs,
    });
  }
}

export function getLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
