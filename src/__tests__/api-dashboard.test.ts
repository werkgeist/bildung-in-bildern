import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isAuthorized,
  handleDashboard,
  onRequestGet,
} from "../../functions/api/dashboard";
import type { DashboardResponse } from "../../functions/api/dashboard";

const SECRET = "test-dashboard-secret";

// ---- isAuthorized ----

describe("isAuthorized", () => {
  it("accepts valid Bearer header", () => {
    const req = new Request("http://localhost/api/dashboard", {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(isAuthorized(req, SECRET)).toBe(true);
  });

  it("accepts valid token query param", () => {
    const req = new Request(
      `http://localhost/api/dashboard?token=${SECRET}`
    );
    expect(isAuthorized(req, SECRET)).toBe(true);
  });

  it("rejects wrong Bearer token", () => {
    const req = new Request("http://localhost/api/dashboard", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(isAuthorized(req, SECRET)).toBe(false);
  });

  it("rejects wrong query param", () => {
    const req = new Request("http://localhost/api/dashboard?token=wrong");
    expect(isAuthorized(req, SECRET)).toBe(false);
  });

  it("rejects missing auth", () => {
    const req = new Request("http://localhost/api/dashboard");
    expect(isAuthorized(req, SECRET)).toBe(false);
  });
});

// ---- DB mock helpers ----

type MockRow = Record<string, unknown>;

function makeAllStmt(rows: MockRow[]) {
  return {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: rows }),
  };
}

function makeDb(rowSets: MockRow[][] = [[], [], [], [], []]) {
  let callCount = 0;
  const db = {
    prepare: vi.fn().mockImplementation(() => {
      const rows = rowSets[callCount] ?? [];
      callCount++;
      return makeAllStmt(rows);
    }),
  };
  return db;
}

function makeAuthorizedRequest() {
  return new Request("http://localhost/api/dashboard", {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
}

// ---- handleDashboard ----

describe("handleDashboard", () => {
  it("returns 401 without auth", async () => {
    const db = makeDb();
    const req = new Request("http://localhost/api/dashboard");
    const res = await handleDashboard(req, db as never, SECRET);
    expect(res.status).toBe(401);
    const json = await res.json() as { error: string };
    expect(json.error).toContain("Unauthorized");
  });

  it("returns 200 with empty users when no data", async () => {
    const db = makeDb();
    const res = await handleDashboard(makeAuthorizedRequest(), db as never, SECRET);
    expect(res.status).toBe(200);
    const json = await res.json() as DashboardResponse;
    expect(json.users).toEqual([]);
    expect(typeof json.generatedAt).toBe("string");
  });

  it("queries 5 times (users, lessons, quiz, questions, activity)", async () => {
    const db = makeDb();
    await handleDashboard(makeAuthorizedRequest(), db as never, SECRET);
    expect(db.prepare).toHaveBeenCalledTimes(5);
  });

  it("sets Content-Type and Cache-Control headers", async () => {
    const db = makeDb();
    const res = await handleDashboard(makeAuthorizedRequest(), db as never, SECRET);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("assembles user data with lessons and quiz scores", async () => {
    const userRows = [
      {
        username: "Kyrill",
        sessions: 3,
        total_events: 10,
        last_active: "2026-03-28T10:00:00",
      },
    ];
    const lessonRows = [
      {
        username: "Kyrill",
        lesson_id: "schmetterling",
        sessions: 2,
        last_played: "2026-03-28T10:00:00",
      },
    ];
    const quizRows = [
      {
        username: "Kyrill",
        lesson_id: "schmetterling",
        quiz_total: 4,
        quiz_correct: 3,
        avg_response_ms: 2500,
      },
    ];
    const questionRows = [
      {
        username: "Kyrill",
        lesson_id: "schmetterling",
        step_index: 0,
        total: 2,
        correct: 2,
        avg_response_ms: 2000,
      },
      {
        username: "Kyrill",
        lesson_id: "schmetterling",
        step_index: 1,
        total: 2,
        correct: 1,
        avg_response_ms: 3000,
      },
    ];
    const activityRows = [
      { username: "Kyrill", day: "2026-03-28", event_count: 5 },
    ];

    const db = makeDb([
      userRows,
      lessonRows,
      quizRows,
      questionRows,
      activityRows,
    ]);
    const res = await handleDashboard(makeAuthorizedRequest(), db as never, SECRET);
    const json = await res.json() as DashboardResponse;

    expect(json.users).toHaveLength(1);
    const user = json.users[0];
    expect(user.username).toBe("Kyrill");
    expect(user.sessions).toBe(3);
    expect(user.totalEvents).toBe(10);
    expect(user.lessons).toHaveLength(1);

    const lesson = user.lessons[0];
    expect(lesson.lessonId).toBe("schmetterling");
    expect(lesson.quizCorrect).toBe(3);
    expect(lesson.quizTotal).toBe(4);
    expect(lesson.avgResponseMs).toBe(2500);
    expect(lesson.questions).toHaveLength(2);
    expect(lesson.questions[0].stepIndex).toBe(0);
    expect(lesson.questions[1].stepIndex).toBe(1);

    expect(user.activityDays).toHaveLength(1);
    expect(user.activityDays[0].day).toBe("2026-03-28");
    expect(user.activityDays[0].eventCount).toBe(5);
  });

  it("fills missing quiz data with zeros", async () => {
    const userRows = [
      {
        username: "Anna",
        sessions: 1,
        total_events: 3,
        last_active: "2026-03-25T09:00:00",
      },
    ];
    const lessonRows = [
      {
        username: "Anna",
        lesson_id: "wasserkreislauf",
        sessions: 1,
        last_played: "2026-03-25T09:00:00",
      },
    ];
    // No quiz rows for this user/lesson
    const db = makeDb([userRows, lessonRows, [], [], []]);
    const res = await handleDashboard(makeAuthorizedRequest(), db as never, SECRET);
    const json = await res.json() as DashboardResponse;

    const lesson = json.users[0].lessons[0];
    expect(lesson.quizCorrect).toBe(0);
    expect(lesson.quizTotal).toBe(0);
    expect(lesson.avgResponseMs).toBeNull();
    expect(lesson.questions).toEqual([]);
  });

  it("handles multiple users independently", async () => {
    const userRows = [
      {
        username: "Kyrill",
        sessions: 2,
        total_events: 8,
        last_active: "2026-03-28T10:00:00",
      },
      {
        username: "Anna",
        sessions: 1,
        total_events: 3,
        last_active: "2026-03-27T08:00:00",
      },
    ];
    const db = makeDb([userRows, [], [], [], []]);
    const res = await handleDashboard(makeAuthorizedRequest(), db as never, SECRET);
    const json = await res.json() as DashboardResponse;
    expect(json.users).toHaveLength(2);
    expect(json.users[0].username).toBe("Kyrill");
    expect(json.users[1].username).toBe("Anna");
  });
});

// ---- onRequestGet ----

describe("onRequestGet", () => {
  it("returns 503 when DB binding is missing", async () => {
    const res = await onRequestGet({
      request: makeAuthorizedRequest(),
      env: {} as never,
    });
    expect(res.status).toBe(503);
    const json = await res.json() as { error: string };
    expect(json.error).toContain("Database");
  });

  it("returns 503 when DASHBOARD_TOKEN is not configured", async () => {
    const db = makeDb();
    const res = await onRequestGet({
      request: makeAuthorizedRequest(),
      env: { DB: db } as never,
    });
    expect(res.status).toBe(503);
    const json = await res.json() as { error: string };
    expect(json.error).toContain("not configured");
  });

  it("delegates to handleDashboard when configured", async () => {
    const db = makeDb();
    const res = await onRequestGet({
      request: makeAuthorizedRequest(),
      env: { DB: db, DASHBOARD_TOKEN: SECRET } as never,
    });
    expect(res.status).toBe(200);
  });
});
