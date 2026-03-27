import { describe, it, expect, vi } from "vitest";
import { validateBody, handleTrack } from "../../functions/api/track";

const validBody = {
  session_id: "sess-abc123",
  username: "Anna",
  lesson_id: "schmetterling-lebenszyklus",
  step_type: "quiz_answer",
  step_index: 0,
  answer: "q1-raupe",
  correct: 1,
  response_time_ms: 1500,
  is_dryrun: 0,
};

// ----- validateBody -----

describe("validateBody", () => {
  it("returns null for valid quiz_answer input", () => {
    expect(validateBody(validBody)).toBeNull();
  });

  it("returns null for valid sequence_view input", () => {
    expect(
      validateBody({ session_id: "s1", lesson_id: "l1", step_type: "sequence_view", step_index: 0 })
    ).toBeNull();
  });

  it("accepts optional fields omitted", () => {
    const { username, answer, correct, response_time_ms, is_dryrun, ...minimal } = validBody;
    expect(validateBody(minimal)).toBeNull();
  });

  it("requires session_id", () => {
    const { session_id, ...rest } = validBody;
    expect(validateBody(rest)).toMatchObject({ error: expect.stringContaining("session_id") });
  });

  it("rejects empty session_id", () => {
    expect(validateBody({ ...validBody, session_id: "" })).toMatchObject({
      error: expect.stringContaining("session_id"),
    });
  });

  it("requires lesson_id", () => {
    const { lesson_id, ...rest } = validBody;
    expect(validateBody(rest)).toMatchObject({ error: expect.stringContaining("lesson_id") });
  });

  it("rejects empty lesson_id", () => {
    expect(validateBody({ ...validBody, lesson_id: "" })).toMatchObject({
      error: expect.stringContaining("lesson_id"),
    });
  });

  it("rejects invalid step_type", () => {
    expect(validateBody({ ...validBody, step_type: "unknown" })).toMatchObject({
      error: expect.stringContaining("step_type"),
    });
  });

  it("rejects missing step_type", () => {
    const { step_type, ...rest } = validBody;
    expect(validateBody(rest)).toMatchObject({ error: expect.stringContaining("step_type") });
  });

  it("rejects negative step_index", () => {
    expect(validateBody({ ...validBody, step_index: -1 })).toMatchObject({
      error: expect.stringContaining("step_index"),
    });
  });

  it("rejects non-integer step_index", () => {
    expect(validateBody({ ...validBody, step_index: 1.5 })).toMatchObject({
      error: expect.stringContaining("step_index"),
    });
  });

  it("rejects string step_index", () => {
    expect(validateBody({ ...validBody, step_index: "0" })).toMatchObject({
      error: expect.stringContaining("step_index"),
    });
  });

  it("rejects null body", () => {
    expect(validateBody(null)).toMatchObject({ error: expect.any(String) });
  });
});

// ----- handleTrack -----

function makeRequest(body: unknown, contentType = "application/json"): Request {
  return new Request("http://localhost/api/track", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

function makeDb() {
  const run = vi.fn().mockResolvedValue({});
  const boundStmt = { run };
  const stmt = { bind: vi.fn().mockReturnValue(boundStmt) };
  const db = { prepare: vi.fn().mockReturnValue(stmt) };
  return { db, stmt, run };
}

describe("handleTrack", () => {
  it("returns 201 for valid input", async () => {
    const { db } = makeDb();
    const res = await handleTrack(makeRequest(validBody), db as never);
    expect(res.status).toBe(201);
  });

  it("returns 400 for invalid JSON", async () => {
    const { db } = makeDb();
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: "not-json",
    });
    const res = await handleTrack(req, db as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when session_id is missing", async () => {
    const { db } = makeDb();
    const { session_id, ...rest } = validBody;
    const res = await handleTrack(makeRequest(rest), db as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when step_type is invalid", async () => {
    const { db } = makeDb();
    const res = await handleTrack(
      makeRequest({ ...validBody, step_type: "bad" }),
      db as never
    );
    expect(res.status).toBe(400);
  });

  it("calls db.prepare with INSERT statement", async () => {
    const { db } = makeDb();
    await handleTrack(makeRequest(validBody), db as never);
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events")
    );
  });

  it("binds correct values including nulls for missing optional fields", async () => {
    const { db, stmt } = makeDb();
    const minimal = {
      session_id: "s1",
      lesson_id: "l1",
      step_type: "sequence_view",
      step_index: 3,
    };
    await handleTrack(makeRequest(minimal), db as never);
    expect(stmt.bind).toHaveBeenCalledWith(
      "s1",    // session_id
      null,    // username
      "l1",    // lesson_id
      "sequence_view", // step_type
      3,       // step_index
      null,    // answer
      null,    // correct
      null,    // response_time_ms
      0        // is_dryrun
    );
  });

  it("passes is_dryrun: 1 when provided", async () => {
    const { db, stmt } = makeDb();
    await handleTrack(
      makeRequest({ ...validBody, is_dryrun: 1 }),
      db as never
    );
    const bindArgs = stmt.bind.mock.calls[0];
    expect(bindArgs[8]).toBe(1); // is_dryrun is 9th positional arg (index 8)
  });

  it("response body is empty for 201", async () => {
    const { db } = makeDb();
    const res = await handleTrack(makeRequest(validBody), db as never);
    const text = await res.text();
    expect(text).toBe("");
  });
});
