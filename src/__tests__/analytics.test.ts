import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSessionId, isDryrun, trackEvent } from "@/lib/analytics";

describe("getSessionId", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("generates a session ID if none exists", () => {
    const id = getSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns the same ID on subsequent calls", () => {
    const id1 = getSessionId();
    const id2 = getSessionId();
    expect(id1).toBe(id2);
  });

  it("generates a new ID after sessionStorage is cleared", () => {
    const id1 = getSessionId();
    sessionStorage.clear();
    const id2 = getSessionId();
    expect(id1).not.toBe(id2);
  });

  it("persists the ID in sessionStorage", () => {
    const id = getSessionId();
    expect(sessionStorage.getItem("bib-session-id")).toBe(id);
  });
});

describe("isDryrun", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    // Reset URL to plain path after any URL-manipulation tests
    window.history.pushState({}, "", "/");
  });

  it("returns false when no dryrun indicators", () => {
    expect(isDryrun()).toBe(false);
  });

  it("returns true when sessionStorage has dryrun flag", () => {
    sessionStorage.setItem("bib-dryrun", "1");
    expect(isDryrun()).toBe(true);
  });

  it("returns false when sessionStorage has a different value", () => {
    sessionStorage.setItem("bib-dryrun", "0");
    expect(isDryrun()).toBe(false);
  });

  it("returns true when URL has ?dryrun=true and saves to sessionStorage", () => {
    window.history.pushState({}, "", "/?dryrun=true");
    expect(isDryrun()).toBe(true);
    expect(sessionStorage.getItem("bib-dryrun")).toBe("1");
  });

  it("persists dryrun across URL change once set via URL param", () => {
    window.history.pushState({}, "", "/?dryrun=true");
    isDryrun(); // saves to sessionStorage
    window.history.pushState({}, "", "/"); // URL no longer has param
    expect(isDryrun()).toBe(true); // still active via sessionStorage
  });
});

describe("trackEvent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 201 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/track", async () => {
    await trackEvent({ lesson_id: "test-lesson", step_type: "sequence_view", step_index: 0 });
    expect(fetch).toHaveBeenCalledWith(
      "/api/track",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("includes session_id and is_dryrun in the payload", async () => {
    await trackEvent({ lesson_id: "test-lesson", step_type: "sequence_view", step_index: 0 });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(typeof body.session_id).toBe("string");
    expect(body.session_id.length).toBeGreaterThan(0);
    expect(typeof body.is_dryrun).toBe("number");
  });

  it("sets is_dryrun: 1 when dryrun flag is in sessionStorage", async () => {
    sessionStorage.setItem("bib-dryrun", "1");
    await trackEvent({ lesson_id: "test-lesson", step_type: "quiz_answer", step_index: 1 });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.is_dryrun).toBe(1);
  });

  it("sets is_dryrun: 0 when dryrun is not active", async () => {
    await trackEvent({ lesson_id: "test-lesson", step_type: "sequence_view", step_index: 0 });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.is_dryrun).toBe(0);
  });

  it("includes all event fields in the payload", async () => {
    await trackEvent({
      lesson_id: "lesson-1",
      step_type: "quiz_answer",
      step_index: 2,
      answer: "q1-raupe",
      correct: 1,
      response_time_ms: 1500,
    });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.lesson_id).toBe("lesson-1");
    expect(body.step_type).toBe("quiz_answer");
    expect(body.step_index).toBe(2);
    expect(body.answer).toBe("q1-raupe");
    expect(body.correct).toBe(1);
    expect(body.response_time_ms).toBe(1500);
  });

  it("fails silently on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    await expect(
      trackEvent({ lesson_id: "test", step_type: "sequence_view", step_index: 0 })
    ).resolves.toBeUndefined();
  });

  it("uses the same session_id across multiple calls", async () => {
    await trackEvent({ lesson_id: "l1", step_type: "sequence_view", step_index: 0 });
    await trackEvent({ lesson_id: "l1", step_type: "sequence_view", step_index: 1 });
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
    const id1 = JSON.parse(calls[0][1].body).session_id;
    const id2 = JSON.parse(calls[1][1].body).session_id;
    expect(id1).toBe(id2);
  });
});
