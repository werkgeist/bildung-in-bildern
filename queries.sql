-- Auswertungs-Queries für Bildung in Bildern
-- WICHTIG: Alle Auswertungen filtern is_dryrun = 0 (Testsessions ausschließen)

-- Antworten pro Lektion (Richtig/Falsch-Quote)
SELECT
  lesson_id,
  COUNT(*) AS total_answers,
  SUM(correct) AS correct_answers,
  ROUND(100.0 * SUM(correct) / COUNT(*), 1) AS correct_pct
FROM events
WHERE step_type = 'quiz_answer'
  AND is_dryrun = 0
GROUP BY lesson_id;

-- Durchschnittliche Antwortzeit pro Frage
SELECT
  lesson_id,
  step_index,
  ROUND(AVG(response_time_ms)) AS avg_response_ms,
  COUNT(*) AS n
FROM events
WHERE step_type = 'quiz_answer'
  AND response_time_ms IS NOT NULL
  AND is_dryrun = 0
GROUP BY lesson_id, step_index
ORDER BY lesson_id, step_index;

-- Aktivität pro Nutzerin
SELECT
  username,
  COUNT(DISTINCT session_id) AS sessions,
  COUNT(*) AS total_events,
  MAX(created_at) AS last_active
FROM events
WHERE is_dryrun = 0
GROUP BY username
ORDER BY last_active DESC;

-- Sequenz-Aufruf-Reihenfolge (Wie weit kommen Nutzer?)
SELECT
  lesson_id,
  step_index,
  COUNT(DISTINCT session_id) AS sessions_reached
FROM events
WHERE step_type = 'sequence_view'
  AND is_dryrun = 0
GROUP BY lesson_id, step_index
ORDER BY lesson_id, step_index;
