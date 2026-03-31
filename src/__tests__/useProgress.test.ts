import { describe, it, expect, beforeEach } from "vitest";
import {
  markComplete,
  markViewed,
  getProgress,
  getAllProgress,
  reset,
} from "@/hooks/useProgress";

const STORAGE_KEY = "bib-progress";

beforeEach(() => {
  localStorage.clear();
});

describe("markComplete", () => {
  it("saves progress for a lesson", () => {
    markComplete("schmetterling", 1);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const store = JSON.parse(raw!);
    expect(store.schmetterling).toBeDefined();
    expect(store.schmetterling.lessonId).toBe("schmetterling");
    expect(store.schmetterling.score).toBe(1);
    expect(store.schmetterling.lastScore).toBe(1);
    expect(store.schmetterling.attempts).toBe(1);
    expect(store.schmetterling.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("sets status 'passed' when score >= 0.5", () => {
    markComplete("schmetterling", 0.5);
    expect(getProgress("schmetterling")!.status).toBe("passed");
    markComplete("wasserkreislauf", 1);
    expect(getProgress("wasserkreislauf")!.status).toBe("passed");
  });

  it("sets status 'viewed' when score < 0.5", () => {
    markComplete("schmetterling", 0);
    expect(getProgress("schmetterling")!.status).toBe("viewed");
    markComplete("wasserkreislauf", 0.49);
    expect(getProgress("wasserkreislauf")!.status).toBe("viewed");
  });

  it("increments attempts on repeated calls", () => {
    markComplete("schmetterling", 0.5);
    markComplete("schmetterling", 1);
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(store.schmetterling.attempts).toBe(2);
  });

  it("updates lastScore and completedAt on repeated calls", () => {
    markComplete("schmetterling", 0.5);
    markComplete("schmetterling", 1);
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(store.schmetterling.lastScore).toBe(1);
    expect(store.schmetterling.score).toBe(1);
  });

  it("saves independent progress for multiple lessons", () => {
    markComplete("schmetterling", 1);
    markComplete("wasserkreislauf", 0.5);
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(store.schmetterling).toBeDefined();
    expect(store.wasserkreislauf).toBeDefined();
    expect(store.wasserkreislauf.score).toBe(0.5);
  });

  it("stores score as 0–1 float", () => {
    markComplete("temperatur", 0.75);
    const p = getProgress("temperatur");
    expect(p?.score).toBe(0.75);
  });
});

describe("markViewed", () => {
  it("saves progress with status 'viewed'", () => {
    markViewed("schmetterling");
    const p = getProgress("schmetterling");
    expect(p).not.toBeNull();
    expect(p!.status).toBe("viewed");
    expect(p!.lessonId).toBe("schmetterling");
  });

  it("does not downgrade from 'passed' to 'viewed'", () => {
    markComplete("schmetterling", 1);
    markViewed("schmetterling");
    expect(getProgress("schmetterling")!.status).toBe("passed");
  });

  it("does not increment attempts", () => {
    markViewed("schmetterling");
    expect(getProgress("schmetterling")!.attempts).toBe(0);
  });

  it("does not overwrite existing viewed entry", () => {
    markViewed("schmetterling");
    const firstTime = getProgress("schmetterling")!.completedAt;
    markViewed("schmetterling");
    expect(getProgress("schmetterling")!.completedAt).toBe(firstTime);
  });
});

describe("migration: legacy entries without status", () => {
  it("migrates entries without status to 'viewed'", () => {
    const legacyStore = {
      schmetterling: {
        lessonId: "schmetterling",
        completedAt: "2026-01-01T00:00:00.000Z",
        score: 1,
        attempts: 1,
        lastScore: 1,
        // no 'status' field
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyStore));
    const p = getProgress("schmetterling");
    expect(p!.status).toBe("viewed");
  });
});

describe("getProgress", () => {
  it("returns null for unknown lesson", () => {
    expect(getProgress("unknown")).toBeNull();
  });

  it("returns progress for a saved lesson", () => {
    markComplete("schmetterling", 0.8);
    const p = getProgress("schmetterling");
    expect(p).not.toBeNull();
    expect(p!.lessonId).toBe("schmetterling");
    expect(p!.score).toBe(0.8);
    expect(p!.attempts).toBe(1);
  });

  it("returns null when localStorage is empty", () => {
    expect(getProgress("schmetterling")).toBeNull();
  });
});

describe("getAllProgress", () => {
  it("returns empty object when nothing saved", () => {
    expect(getAllProgress()).toEqual({});
  });

  it("returns all saved lessons", () => {
    markComplete("schmetterling", 1);
    markComplete("wasserkreislauf", 0.6);
    const all = getAllProgress();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all.schmetterling.score).toBe(1);
    expect(all.wasserkreislauf.score).toBe(0.6);
  });
});

describe("reset", () => {
  it("clears a specific lesson", () => {
    markComplete("schmetterling", 1);
    markComplete("wasserkreislauf", 1);
    reset("schmetterling");
    expect(getProgress("schmetterling")).toBeNull();
    expect(getProgress("wasserkreislauf")).not.toBeNull();
  });

  it("clears all progress when called without argument", () => {
    markComplete("schmetterling", 1);
    markComplete("wasserkreislauf", 1);
    reset();
    expect(getAllProgress()).toEqual({});
  });

  it("is a no-op for non-existent lesson", () => {
    markComplete("schmetterling", 1);
    reset("nonexistent");
    expect(getProgress("schmetterling")).not.toBeNull();
  });
});

describe("edge cases", () => {
  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(() => getProgress("schmetterling")).not.toThrow();
    expect(getProgress("schmetterling")).toBeNull();
  });

  it("attempts starts at 1 for first completion", () => {
    markComplete("schmetterling", 1);
    expect(getProgress("schmetterling")!.attempts).toBe(1);
  });
});
