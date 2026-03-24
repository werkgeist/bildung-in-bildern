import { describe, it, expect, beforeEach } from "vitest";
import { logAnswer, getLogs, clearLogs } from "@/lib/logging";
import type { LogEntry } from "@/lib/logging";

const mockEntry: LogEntry = {
  timestamp: "2026-03-24T10:00:00.000Z",
  questionId: "q1",
  selectedOption: "q1-raupe",
  correct: true,
  responseTimeMs: 1234,
};

describe("RT Logging", () => {
  beforeEach(() => {
    clearLogs();
  });

  it("returns empty array when no logs stored", () => {
    expect(getLogs()).toEqual([]);
  });

  it("stores a log entry in localStorage", () => {
    logAnswer(mockEntry);
    const logs = getLogs();
    expect(logs).toHaveLength(1);
  });

  it("stores all required fields", () => {
    logAnswer(mockEntry);
    const [entry] = getLogs();
    expect(entry.timestamp).toBe("2026-03-24T10:00:00.000Z");
    expect(entry.questionId).toBe("q1");
    expect(entry.selectedOption).toBe("q1-raupe");
    expect(entry.correct).toBe(true);
    expect(entry.responseTimeMs).toBe(1234);
  });

  it("accumulates multiple entries", () => {
    logAnswer(mockEntry);
    logAnswer({ ...mockEntry, questionId: "q2", correct: false });
    const logs = getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].questionId).toBe("q1");
    expect(logs[1].questionId).toBe("q2");
  });

  it("correctly records correct/incorrect flag", () => {
    logAnswer({ ...mockEntry, correct: true });
    logAnswer({ ...mockEntry, correct: false });
    const logs = getLogs();
    expect(logs[0].correct).toBe(true);
    expect(logs[1].correct).toBe(false);
  });

  it("clears all logs", () => {
    logAnswer(mockEntry);
    clearLogs();
    expect(getLogs()).toHaveLength(0);
  });

  it("persists responseTimeMs as a number", () => {
    logAnswer({ ...mockEntry, responseTimeMs: 567 });
    const [entry] = getLogs();
    expect(typeof entry.responseTimeMs).toBe("number");
    expect(entry.responseTimeMs).toBe(567);
  });
});
