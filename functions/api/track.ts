interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DB: D1Database;
}

const MAX_SESSION_ID = 128;
const MAX_LESSON_ID = 128;
const MAX_ANSWER = 256;

export function validateBody(body: unknown): { error: string } | null {
  if (!body || typeof body !== "object") return { error: "Invalid body" };
  const b = body as Record<string, unknown>;

  if (!b.session_id || typeof b.session_id !== "string")
    return { error: "session_id required" };
  if (b.session_id.length > MAX_SESSION_ID)
    return { error: `session_id max ${MAX_SESSION_ID} chars` };
  if (!b.lesson_id || typeof b.lesson_id !== "string")
    return { error: "lesson_id required" };
  if (b.lesson_id.length > MAX_LESSON_ID)
    return { error: `lesson_id max ${MAX_LESSON_ID} chars` };
  if (b.step_type !== "sequence_view" && b.step_type !== "quiz_answer")
    return { error: "invalid step_type" };
  if (
    typeof b.step_index !== "number" ||
    !Number.isInteger(b.step_index) ||
    b.step_index < 0
  )
    return { error: "step_index must be non-negative integer" };

  if (b.answer !== undefined) {
    if (typeof b.answer !== "string")
      return { error: "answer must be a string" };
    if (b.answer.length > MAX_ANSWER)
      return { error: `answer max ${MAX_ANSWER} chars` };
  }

  if (b.response_time_ms !== undefined) {
    if (typeof b.response_time_ms !== "number" || b.response_time_ms < 0)
      return { error: "response_time_ms must be non-negative number" };
  }

  return null;
}

export async function handleTrack(
  request: Request,
  db: D1Database
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationError = validateBody(body);
  if (validationError) {
    return new Response(JSON.stringify(validationError), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const b = body as Record<string, unknown>;

  // Dryrun: event is validated but intentionally not written to DB
  // NOTE: is_dryrun is client-controlled; server-side auth is tracked in #2
  if (b.is_dryrun === 1) {
    return new Response(null, { status: 201 });
  }

  await db
    .prepare(
      `INSERT INTO events (session_id, username, lesson_id, step_type, step_index, answer, correct, response_time_ms, is_dryrun)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      b.session_id,
      b.username ?? null,
      b.lesson_id,
      b.step_type,
      b.step_index,
      b.answer ?? null,
      b.correct ?? null,
      b.response_time_ms ?? null,
      0
    )
    .run();

  return new Response(null, { status: 201 });
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  if (!context.env?.DB) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  return handleTrack(context.request, context.env.DB);
};
