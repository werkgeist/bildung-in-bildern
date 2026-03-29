"use client";

const STORAGE_KEY = "bib-progress";

export interface LessonProgress {
  lessonId: string;
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
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function markComplete(lessonId: string, score: number): void {
  const store = readStore();
  const existing = store[lessonId];
  store[lessonId] = {
    lessonId,
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
  return { markComplete, getProgress, getAllProgress, reset };
}
