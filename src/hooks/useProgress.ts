"use client";

const STORAGE_KEY = "bib-progress";

export type LessonStatus = "viewed" | "passed";

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  completedAt: string; // ISO timestamp
  score: number; // 0–1
  attempts: number;
  lastScore: number;
}

type ProgressStore = Record<string, LessonProgress>;

function readStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const store = JSON.parse(raw) as Record<string, unknown>;
    // Migrate entries without status (legacy "completed") → "viewed"
    for (const key of Object.keys(store)) {
      const entry = store[key] as Partial<LessonProgress>;
      if (!entry.status) {
        (entry as LessonProgress).status = "viewed";
      }
    }
    return store as ProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Mark lesson as viewed (sequence completed). Does not downgrade from "passed". */
export function markViewed(lessonId: string): void {
  const store = readStore();
  const existing = store[lessonId];
  if (existing?.status === "passed") return; // never downgrade
  store[lessonId] = {
    lessonId,
    status: "viewed",
    completedAt: existing?.completedAt ?? new Date().toISOString(),
    score: existing?.score ?? 0,
    attempts: existing?.attempts ?? 0,
    lastScore: existing?.lastScore ?? 0,
  };
  writeStore(store);
}

/** Mark lesson after quiz. Sets status "passed" if score ≥ 0.5, else "viewed". */
export function markComplete(lessonId: string, score: number): void {
  const store = readStore();
  const existing = store[lessonId];
  const status: LessonStatus = score >= 0.5 ? "passed" : "viewed";
  store[lessonId] = {
    lessonId,
    status,
    completedAt: new Date().toISOString(),
    score,
    attempts: (existing?.attempts ?? 0) + 1,
    lastScore: score,
  };
  writeStore(store);
}

export function getProgress(lessonId: string): LessonProgress | null {
  const store = readStore();
  return store[lessonId] ?? null;
}

export function getAllProgress(): ProgressStore {
  return readStore();
}

export function reset(lessonId?: string): void {
  if (lessonId === undefined) {
    writeStore({});
  } else {
    const store = readStore();
    delete store[lessonId];
    writeStore(store);
  }
}

export function useProgress() {
  return { markComplete, markViewed, getProgress, getAllProgress, reset };
}
