"use client";

import { allLessons } from "@/data/lessons";
import type { QuizQuestion } from "@/types/lesson";

const STORAGE_KEY = "bib-item-bank";

export type LeitnerBox = 1 | 2 | 3;

/** Intervals in days for each Leitner box */
const BOX_INTERVALS: Record<LeitnerBox, number> = { 1: 1, 2: 3, 3: 7 };

export interface ReviewItem {
  id: string; // `${lessonId}::${questionId}`
  lessonId: string;
  questionId: string;
  leitnerBox: LeitnerBox;
  lastShown: string | null; // ISO timestamp
  nextReviewDate: string; // ISO date YYYY-MM-DD
  timesShown: number;
  timesCorrect: number;
}

/** A ReviewItem enriched with the actual QuizQuestion for rendering */
export interface ReviewItemWithQuestion extends ReviewItem {
  question: QuizQuestion;
  lessonTitle: string;
}

type ItemBankStore = Record<string, ReviewItem>;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(days: number, from?: string): string {
  const base = from ? new Date(from) : new Date();
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function readStore(): ItemBankStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ItemBankStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ItemBankStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function itemId(lessonId: string, questionId: string): string {
  return `${lessonId}::${questionId}`;
}

/**
 * Records a quiz answer for a single item. Creates the item if it doesn't exist yet.
 * Correct → advance Leitner box (max 3). Incorrect → reset to box 1.
 */
export function recordAnswer(
  lessonId: string,
  questionId: string,
  correct: boolean
): void {
  const store = readStore();
  const id = itemId(lessonId, questionId);
  const existing = store[id];

  const timesShown = (existing?.timesShown ?? 0) + 1;
  const timesCorrect = (existing?.timesCorrect ?? 0) + (correct ? 1 : 0);

  let newBox: LeitnerBox;
  if (!existing) {
    newBox = correct ? 2 : 1;
  } else if (correct) {
    newBox = Math.min(existing.leitnerBox + 1, 3) as LeitnerBox;
  } else {
    newBox = 1;
  }

  store[id] = {
    id,
    lessonId,
    questionId,
    leitnerBox: newBox,
    lastShown: new Date().toISOString(),
    nextReviewDate: addDays(BOX_INTERVALS[newBox]),
    timesShown,
    timesCorrect,
  };
  writeStore(store);
}

/**
 * Returns all items whose nextReviewDate is today or in the past.
 * @param today - ISO date string for "today" (defaults to actual today, injectable for tests)
 */
export function getDueItems(today?: string): ReviewItem[] {
  const store = readStore();
  const reference = today ?? todayIso();
  return Object.values(store).filter((item) => item.nextReviewDate <= reference);
}

/** Returns count of reviewable (due) items */
export function getDueCount(today?: string): number {
  return getDueItems(today).length;
}

/** Returns all items in the bank */
export function getAllItems(): ReviewItem[] {
  return Object.values(readStore());
}

/**
 * Resolves due items to ReviewItemWithQuestion by looking up lesson data.
 * Returns up to `limit` items, shuffled. Items with unknown questions are skipped.
 */
export function getDueItemsWithQuestions(
  limit = 5,
  today?: string
): ReviewItemWithQuestion[] {
  const due = getDueItems(today);
  // Shuffle so we get a varied selection
  const shuffled = [...due].sort(() => Math.random() - 0.5);
  const result: ReviewItemWithQuestion[] = [];

  for (const item of shuffled) {
    if (result.length >= limit) break;
    const lesson = allLessons.find((l) => l.id === item.lessonId);
    if (!lesson) continue;
    const question = lesson.questions.find((q) => q.id === item.questionId);
    if (!question) continue;
    result.push({ ...item, question, lessonTitle: lesson.title });
  }
  return result;
}

/** Clears the entire item bank (for testing / reset). */
export function resetItemBank(): void {
  writeStore({});
}
