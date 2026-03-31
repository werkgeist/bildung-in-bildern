#!/usr/bin/env bash
# scripts/agents/review.sh
# Review Agent: Code Review → Codex überprüft Diff → Testing oder zurück In Progress
#
# Usage: bash scripts/agents/review.sh <issue_number> <item_id>

# SECURITY: closed-trust-boundary — nur Repo-Maintainer können Issues erstellen.
# Issue-Body und Diff werden in den Prompt eingebettet (kein --yolo).
# Risiko akzeptiert für closed repo.
source "$(dirname "$0")/_common.sh"

AGENT_NAME="Codex"
log "[$AGENT_NAME] Starte Code Review für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

TITLE=$(gh_issue_title)
BODY=$(gh_issue_body)
COMMENTS=$(gh_issue_comments 5)

# Dedup: skip if review already ran
MARKER="<!-- agent:review:v1 -->"
if echo "$COMMENTS" | grep -q "agent:review:v1"; then
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER bereits reviewed (Marker gefunden)."
  gh_move_to "$STATUS_TESTING"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Testing (war stuck nach vorherigem Lauf)"
  gh_unlock
  exit 0
fi

# B3: Nach worktree-merge im clean main arbeiten
cd "$WORKSPACE"
git fetch origin main --quiet 2>/dev/null || true
git merge --ff-only origin/main 2>/dev/null || git reset --hard origin/main

REVIEW_SPEC_FILE="/tmp/review-spec-${ISSUE_NUMBER}.md"
REVIEW_DIFF_FILE="/tmp/review-diff-${ISSUE_NUMBER}.patch"

trap 'rm -f "$REVIEW_SPEC_FILE" "$REVIEW_DIFF_FILE"' EXIT  # Lock bleibt — wird nur bei Erfolg entfernt

# Ermittle Diff: zuerst origin/main...HEAD (Branch-Workflow).
# Fallback auf HEAD~1..HEAD bei main-only Workflow (implement pushed direkt auf main,
# daher origin/main == HEAD nach dem Merge → Branch-Diff leer).
DIFF=$(git diff origin/main...HEAD -- '*.ts' '*.tsx' '*.mjs' '*.mts' '*.css' '*.json' '*.config.*' 2>/dev/null | head -2000)
COMMIT_LOG=$(git log --oneline origin/main...HEAD 2>/dev/null | head -10)

if [[ -z "$DIFF" ]]; then
  log "[$AGENT_NAME] Kein Branch-Diff — Fallback auf HEAD~1..HEAD (main-only Workflow)"
  DIFF=$(git diff HEAD~1..HEAD -- '*.ts' '*.tsx' '*.mjs' '*.mts' '*.css' '*.json' '*.config.*' 2>/dev/null | head -2000)
  COMMIT_LOG=$(git log --oneline -5 2>/dev/null | head -10)
fi

if [[ -z "$DIFF" ]]; then
  log "[$AGENT_NAME] Kein Diff gefunden — nichts zu reviewen"
  gh_comment "**[Codex]** Kein Diff gefunden (weder Branch-Diff noch HEAD~1..HEAD).

Möglicherweise wurde noch kein Code gepusht oder der letzte Commit war leer. Bitte manuell prüfen.

→ Bleibt in _Code Review_."
  exit 0
fi

# Issue-Spec und Diff in Dateien schreiben (M3: kein inline-untrusted content im Prompt)
{
  printf '# Issue #%s: %s\n\n' "$ISSUE_NUMBER" "$TITLE"
  printf '## Anforderungen (Spec)\n\n%s\n' "$BODY"
} > "$REVIEW_SPEC_FILE"
printf '%s\n' "$DIFF" > "$REVIEW_DIFF_FILE"

PROMPT="Du bist ein unabhängiger Code-Reviewer für das Projekt 'Bildung in Bildern'.
Stack: Next.js 16, TypeScript, Tailwind CSS v4.
Zielgruppe: Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only iPad-App.

Reviewe den Code auf Korrektheit, Sicherheit und Spec-Compliance.

Issue #${ISSUE_NUMBER}: ${TITLE}
Commits: ${COMMIT_LOG}

Lies die Spec (Anforderungen) aus: ${REVIEW_SPEC_FILE}
Lies den Diff aus: ${REVIEW_DIFF_FILE}

Review-Kriterien:
1. Implementiert der Code was das Issue verlangt?
2. Gibt es Bugs, Typen-Fehler oder Sicherheitsprobleme?
3. WCAG 2.2 AA: Touch-Targets, Kontrast, prefers-reduced-motion?
4. Performance: next/image korrekt, keine unnötigen Client Components?
5. Conventional Commits eingehalten?

Antworte AUSSCHLIESSLICH in diesem Format:

DECISION: APPROVE|REQUEST_CHANGES
SUMMARY: <ein Satz Zusammenfassung>
FINDINGS:
- <Befund 1>
- <Befund 2>
(leer wenn keine Befunde)"

# M3: kein --full-auto / --yolo — Review-Agent gibt nur strukturierte Empfehlung zurück,
# führt keine autonomen Datei-Änderungen durch. GH_TOKEN nicht im Agent-Env.
log "[$AGENT_NAME] Rufe Claude auf..."
set +e
REVIEW=$(timeout 1800 env -u GH_TOKEN claude --permission-mode bypassPermissions --print "$PROMPT" 2>/dev/null)
set -e

DECISION=$(echo "$REVIEW" | grep '^DECISION:' | cut -d' ' -f2- | tr -d '[:space:]')
SUMMARY=$(echo "$REVIEW" | grep '^SUMMARY:' | cut -d' ' -f2-)
FINDINGS=$(echo "$REVIEW" | awk '/^FINDINGS:/{found=1; next} found && /^-/{print} found && !/^-/{if(NF>0) exit}')

log "[$AGENT_NAME] Decision: $DECISION"

if [[ "$DECISION" == "APPROVE" ]]; then
  gh_comment "${MARKER}
**[Codex]** Code Review: Approved ✅

**Zusammenfassung:** ${SUMMARY}

${FINDINGS:+**Anmerkungen (non-blocking):**
${FINDINGS}}

→ Verschiebe nach _Testing_."

  gh_move_to "$STATUS_TESTING"
  gh_unlock  # Erfolg → Lock entfernen
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Testing"
else
  gh_comment "${MARKER}
**[Codex]** Code Review: Changes Requested 🔄

**Zusammenfassung:** ${SUMMARY}

**Zu beheben:**
${FINDINGS}

→ Verschiebe zurück nach _In Progress_."

  gh_move_to "$STATUS_IN_PROGRESS"
  gh_unlock  # Entscheidung getroffen → Lock entfernen
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → In Progress (Changes requested)"
fi
