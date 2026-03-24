export interface LogEntry {
  timestamp: string;
  questionId: string;
  selectedOption: string;
  correct: boolean;
  responseTimeMs: number;
}

const STORAGE_KEY = "bildung-in-bildern-logs";

export function logAnswer(entry: LogEntry): void {
  if (typeof window === "undefined") return;
  const existing = getLogs();
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
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
