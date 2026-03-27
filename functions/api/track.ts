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

export function validateBody(body: unknown): { error: string } | null {
  if (!body || typeof body !== "object") return { error: "Invalid body" };
  const b = body as Record<string, unknown>;

  if (!b.session_id || typeof b.session_id !== "string")
    return { error: "session_id required" };
  if (!b.lesson_id || typeof b.lesson_id !== "string")
    return { error: "lesson_id required" };
  if (b.step_type !== "sequence_view" && b.step_type !== "quiz_answer")
    return { error: "invalid step_type" };
  if (
    typeof b.step_index !== "number" ||
    !Number.isInteger(b.step_index) ||
    b.step_index < 0
  )
    return { error: "step_index must be non-negative integer" };

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
      b.is_dryrun ?? 0
    )
    .run();

  return new Response(null, { status: 201 });
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  return handleTrack(context.request, context.env.DB);
};
