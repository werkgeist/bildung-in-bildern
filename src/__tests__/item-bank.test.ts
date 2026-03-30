import { describe, it, expect, beforeEach } from "vitest";
import {
  recordAnswer,
  getDueItems,
  getDueCount,
  getAllItems,
  resetItemBank,
  getDueItemsWithQuestions,
} from "@/data/item-bank";
import { allLessons } from "@/data/lessons";

const STORAGE_KEY = "bib-item-bank";

beforeEach(() => {
  localStorage.clear();
});

// Helper: ISO date offset from today
function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

describe("recordAnswer – new item creation", () => {
  it("creates a new item when first answered correctly", () => {
    recordAnswer("schmetterling", "q1", true);
    const items = getAllItems();
    expect(items).toHaveLength(1);
    expect(items[0].lessonId).toBe("schmetterling");
    expect(items[0].questionId).toBe("q1");
    expect(items[0].timesShown).toBe(1);
    expect(items[0].timesCorrect).toBe(1);
  });

  it("creates a new item when first answered incorrectly", () => {
    recordAnswer("schmetterling", "q1", false);
    const items = getAllItems();
    expect(items).toHaveLength(1);
    expect(items[0].timesCorrect).toBe(0);
    expect(items[0].timesShown).toBe(1);
  });

  it("stores items with composite id `lessonId::questionId`", () => {
    recordAnswer("wasserkreislauf", "q-wk-1", true);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const store = JSON.parse(raw!);
    expect(store["wasserkreislauf::q-wk-1"]).toBeDefined();
  });
});

describe("recordAnswer – Leitner box advancement", () => {
  it("correct first answer starts at box 2", () => {
    recordAnswer("s", "q1", true);
    expect(getAllItems()[0].leitnerBox).toBe(2);
  });

  it("incorrect first answer starts at box 1", () => {
    recordAnswer("s", "q1", false);
    expect(getAllItems()[0].leitnerBox).toBe(1);
  });

  it("advances box on correct answer (box 1 → 2)", () => {
    recordAnswer("s", "q1", false); // box 1
    recordAnswer("s", "q1", true);  // box 2
    expect(getAllItems()[0].leitnerBox).toBe(2);
  });

  it("advances box on correct answer (box 2 → 3)", () => {
    recordAnswer("s", "q1", false); // box 1
    recordAnswer("s", "q1", true);  // box 2
    recordAnswer("s", "q1", true);  // box 3
    expect(getAllItems()[0].leitnerBox).toBe(3);
  });

  it("caps at box 3", () => {
    recordAnswer("s", "q1", true);  // box 2
    recordAnswer("s", "q1", true);  // box 3
    recordAnswer("s", "q1", true);  // stays 3
    expect(getAllItems()[0].leitnerBox).toBe(3);
  });

  it("resets to box 1 on incorrect answer", () => {
    recordAnswer("s", "q1", true);  // box 2
    recordAnswer("s", "q1", true);  // box 3
    recordAnswer("s", "q1", false); // back to 1
    expect(getAllItems()[0].leitnerBox).toBe(1);
  });
});

describe("recordAnswer – nextReviewDate intervals", () => {
  it("box 1 sets nextReviewDate to tomorrow (+1 day)", () => {
    recordAnswer("s", "q1", false); // box 1
    const item = getAllItems()[0];
    expect(item.nextReviewDate).toBe(isoDate(1));
  });

  it("box 2 sets nextReviewDate to +3 days", () => {
    recordAnswer("s", "q1", true); // box 2 (correct first = box 2)
    const item = getAllItems()[0];
    expect(item.nextReviewDate).toBe(isoDate(3));
  });

  it("box 3 sets nextReviewDate to +7 days", () => {
    recordAnswer("s", "q1", true);  // box 2
    recordAnswer("s", "q1", true);  // box 3
    const item = getAllItems()[0];
    expect(item.nextReviewDate).toBe(isoDate(7));
  });
});

describe("recordAnswer – timesShown and timesCorrect", () => {
  it("increments timesShown on each call", () => {
    recordAnswer("s", "q1", true);
    recordAnswer("s", "q1", false);
    recordAnswer("s", "q1", true);
    expect(getAllItems()[0].timesShown).toBe(3);
  });

  it("increments timesCorrect only on correct answers", () => {
    recordAnswer("s", "q1", true);
    recordAnswer("s", "q1", false);
    recordAnswer("s", "q1", true);
    expect(getAllItems()[0].timesCorrect).toBe(2);
  });
});

describe("getDueItems", () => {
  it("returns empty array when bank is empty", () => {
    expect(getDueItems()).toEqual([]);
  });

  it("returns item if nextReviewDate is today", () => {
    recordAnswer("s", "q1", false); // tomorrow in real time
    // Inject tomorrow as "today" to simulate due
    const tomorrow = isoDate(1);
    expect(getDueItems(tomorrow)).toHaveLength(1);
  });

  it("does not return item if nextReviewDate is in the future", () => {
    recordAnswer("s", "q1", false); // nextReviewDate = tomorrow
    expect(getDueItems(isoDate(0))).toHaveLength(0);
  });

  it("returns items from multiple lessons", () => {
    recordAnswer("schmetterling", "q1", false);
    recordAnswer("wasserkreislauf", "q2", false);
    expect(getDueItems(isoDate(1))).toHaveLength(2);
  });
});

describe("getDueCount", () => {
  it("returns 0 when nothing is due", () => {
    recordAnswer("s", "q1", false);
    expect(getDueCount(isoDate(0))).toBe(0);
  });

  it("returns count of due items", () => {
    recordAnswer("s", "q1", false);
    recordAnswer("s", "q2", false);
    expect(getDueCount(isoDate(1))).toBe(2);
  });
});

describe("getDueItemsWithQuestions", () => {
  it("returns empty array when no items due", () => {
    expect(getDueItemsWithQuestions(5)).toHaveLength(0);
  });

  it("resolves items from real lesson data", () => {
    const lesson = allLessons[0];
    const question = lesson.questions[0];
    recordAnswer(lesson.id, question.id, false);
    const due = getDueItemsWithQuestions(5, isoDate(1));
    expect(due).toHaveLength(1);
    expect(due[0].question.id).toBe(question.id);
    expect(due[0].lessonTitle).toBe(lesson.title);
  });

  it("respects the limit parameter", () => {
    // Add answers for all questions from all lessons
    allLessons.forEach((lesson) => {
      lesson.questions.forEach((q) => {
        recordAnswer(lesson.id, q.id, false);
      });
    });
    const due = getDueItemsWithQuestions(2, isoDate(1));
    expect(due.length).toBeLessThanOrEqual(2);
  });

  it("skips items with no matching lesson", () => {
    // Plant an orphan item directly in localStorage
    const store = { "ghost-lesson::q1": {
      id: "ghost-lesson::q1",
      lessonId: "ghost-lesson",
      questionId: "q1",
      leitnerBox: 1,
      lastShown: null,
      nextReviewDate: isoDate(-1),
      timesShown: 1,
      timesCorrect: 0,
    }};
    localStorage.setItem("bib-item-bank", JSON.stringify(store));
    expect(getDueItemsWithQuestions(5)).toHaveLength(0);
  });
});

describe("resetItemBank", () => {
  it("clears all items", () => {
    recordAnswer("s", "q1", true);
    recordAnswer("s", "q2", false);
    resetItemBank();
    expect(getAllItems()).toHaveLength(0);
  });
});

describe("localStorage persistence", () => {
  it("persists items across function calls", () => {
    recordAnswer("s", "q1", true);
    // Simulate separate call by reading directly
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Object.keys(parsed)).toHaveLength(1);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid{{{");
    expect(() => getAllItems()).not.toThrow();
    expect(getAllItems()).toEqual([]);
  });
});
