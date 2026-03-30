interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DB: D1Database;
  DASHBOARD_TOKEN?: string;
}

// D1 row shapes
interface UserRow {
  username: string;
  sessions: number;
  total_events: number;
  last_active: string;
}

interface LessonRow {
  username: string;
  lesson_id: string;
  sessions: number;
  last_played: string;
}

interface QuizRow {
  username: string;
  lesson_id: string;
  quiz_total: number;
  quiz_correct: number;
  avg_response_ms: number | null;
}

interface QuestionRow {
  username: string;
  lesson_id: string;
  step_index: number;
  total: number;
  correct: number;
  avg_response_ms: number | null;
}

interface ActivityRow {
  username: string;
  day: string;
  event_count: number;
}

// Public response types
export interface QuestionData {
  stepIndex: number;
  correct: number;
  total: number;
  avgResponseMs: number | null;
}

export interface LessonData {
  lessonId: string;
  sessions: number;
  lastPlayed: string;
  quizCorrect: number;
  quizTotal: number;
  avgResponseMs: number | null;
  questions: QuestionData[];
}

export interface ActivityDay {
  day: string;
  eventCount: number;
}

export interface UserData {
  username: string;
  sessions: number;
  totalEvents: number;
  lastActive: string;
  lessons: LessonData[];
  activityDays: ActivityDay[];
}

export interface DashboardResponse {
  users: UserData[];
  generatedAt: string;
}

export function isAuthorized(request: Request, token: string): boolean {
  const auth = request.headers.get("Authorization");
  if (auth) return auth === `Bearer ${token}`;
  const url = new URL(request.url);
  return url.searchParams.get("token") === token;
}

export async function handleDashboard(
  request: Request,
  db: D1Database,
  dashboardToken: string
): Promise<Response> {
  if (!isAuthorized(request, dashboardToken)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [userRows, lessonRows, quizRows, questionRows, activityRows] =
    await Promise.all([
      db
        .prepare(
          `SELECT username,
              COUNT(DISTINCT session_id) AS sessions,
              COUNT(*) AS total_events,
              MAX(created_at) AS last_active
           FROM events
           WHERE is_dryrun = 0 AND username IS NOT NULL
           GROUP BY username
           ORDER BY last_active DESC`
        )
        .all<UserRow>(),
      db
        .prepare(
          `SELECT username, lesson_id,
              COUNT(DISTINCT session_id) AS sessions,
              MAX(created_at) AS last_played
           FROM events
           WHERE is_dryrun = 0 AND username IS NOT NULL
           GROUP BY username, lesson_id`
        )
        .all<LessonRow>(),
      db
        .prepare(
          `SELECT username, lesson_id,
              COUNT(*) AS quiz_total,
              SUM(correct) AS quiz_correct,
              ROUND(AVG(response_time_ms)) AS avg_response_ms
           FROM events
           WHERE step_type = 'quiz_answer'
             AND is_dryrun = 0
             AND username IS NOT NULL
           GROUP BY username, lesson_id`
        )
        .all<QuizRow>(),
      db
        .prepare(
          `SELECT username, lesson_id, step_index,
              COUNT(*) AS total,
              SUM(correct) AS correct,
              ROUND(AVG(response_time_ms)) AS avg_response_ms
           FROM events
           WHERE step_type = 'quiz_answer'
             AND is_dryrun = 0
             AND username IS NOT NULL
           GROUP BY username, lesson_id, step_index
           ORDER BY username, lesson_id, step_index`
        )
        .all<QuestionRow>(),
      db
        .prepare(
          `SELECT username, DATE(created_at) AS day, COUNT(*) AS event_count
           FROM events
           WHERE is_dryrun = 0 AND username IS NOT NULL
           GROUP BY username, day
           ORDER BY username, day DESC
           LIMIT 90`
        )
        .all<ActivityRow>(),
    ]);

  // Build lookup maps
  const lessonsByUser = new Map<string, LessonRow[]>();
  for (const row of lessonRows.results) {
    if (!lessonsByUser.has(row.username)) lessonsByUser.set(row.username, []);
    lessonsByUser.get(row.username)!.push(row);
  }

  const quizByKey = new Map<string, QuizRow>();
  for (const row of quizRows.results) {
    quizByKey.set(`${row.username}::${row.lesson_id}`, row);
  }

  const questionsByKey = new Map<string, QuestionRow[]>();
  for (const row of questionRows.results) {
    const key = `${row.username}::${row.lesson_id}`;
    if (!questionsByKey.has(key)) questionsByKey.set(key, []);
    questionsByKey.get(key)!.push(row);
  }

  const activityByUser = new Map<string, ActivityDay[]>();
  for (const row of activityRows.results) {
    if (!activityByUser.has(row.username)) activityByUser.set(row.username, []);
    activityByUser
      .get(row.username)!
      .push({ day: row.day, eventCount: row.event_count });
  }

  const users: UserData[] = userRows.results.map((user) => {
    const lessonRows2 = lessonsByUser.get(user.username) ?? [];
    const lessons: LessonData[] = lessonRows2.map((lr) => {
      const quiz = quizByKey.get(`${user.username}::${lr.lesson_id}`);
      const questions = (
        questionsByKey.get(`${user.username}::${lr.lesson_id}`) ?? []
      ).map((q) => ({
        stepIndex: q.step_index,
        correct: q.correct,
        total: q.total,
        avgResponseMs: q.avg_response_ms,
      }));
      return {
        lessonId: lr.lesson_id,
        sessions: lr.sessions,
        lastPlayed: lr.last_played,
        quizCorrect: quiz?.quiz_correct ?? 0,
        quizTotal: quiz?.quiz_total ?? 0,
        avgResponseMs: quiz?.avg_response_ms ?? null,
        questions,
      };
    });

    return {
      username: user.username,
      sessions: user.sessions,
      totalEvents: user.total_events,
      lastActive: user.last_active,
      lessons,
      activityDays: activityByUser.get(user.username) ?? [],
    };
  });

  const body: DashboardResponse = {
    users,
    generatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  if (!context.env?.DB) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = context.env.DASHBOARD_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Dashboard not configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return handleDashboard(context.request, context.env.DB, token);
};
