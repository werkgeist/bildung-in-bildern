#!/usr/bin/env bash
# scripts/agents/review.sh
# Review Agent: Code Review → Codex überprüft Diff → Testing oder zurück In Progress
#
# Usage: bash scripts/agents/review.sh <issue_number> <item_id>

source "$(dirname "$0")/_common.sh"

AGENT_NAME="Codex"
log "[$AGENT_NAME] Starte Code Review für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

TITLE=$(gh_issue_title)
BODY=$(gh_issue_body)

cd "$WORKSPACE"

# B3: Sauberen, aktuellen Stand sicherstellen
git fetch origin

# B3: Workspace-Isolation via git stash (Review ist read-only, kein Worktree nötig)
STASH_MSG=$(git stash --include-untracked 2>&1 || true)
if echo "$STASH_MSG" | grep -q "Saved"; then
  STASHED=1
else
  STASHED=0
fi

# M3: Trust Boundary — Issue-Body und Diff in Dateien schreiben, NICHT inline in Prompt.
# Attacker-controlled content wird als Datei übergeben, nicht als Prompt-Instruktion.
# Hinweis: Vollständige Prompt-Injection-Resistenz erfordert Output-Filtering; dies ist
# defensive Härtung (reduziert Angriffsfläche bei Modellen die Datei-Quellen anders gewichten).
REVIEW_SPEC_FILE="/tmp/review-spec-${ISSUE_NUMBER}.md"
REVIEW_DIFF_FILE="/tmp/review-diff-${ISSUE_NUMBER}.patch"

trap '[[ ${STASHED:-0} -eq 1 ]] && git -C "$WORKSPACE" stash pop 2>/dev/null || true; gh_unlock; rm -f "$REVIEW_SPEC_FILE" "$REVIEW_DIFF_FILE"' EXIT

# Ermittle den Diff seit main
DIFF=$(git diff origin/main...HEAD -- '*.ts' '*.tsx' '*.mjs' '*.mts' '*.css' '*.json' '*.config.*' 2>/dev/null | head -2000)
COMMIT_LOG=$(git log --oneline origin/main...HEAD 2>/dev/null | head -10)

if [[ -z "$DIFF" ]]; then
  log "[$AGENT_NAME] Kein Diff gefunden — nichts zu reviewen"
  gh_comment "**[Codex]** Kein Diff gegen \`origin/main\` gefunden.

Möglicherweise wurde noch kein Code gepusht. Bitte manuell prüfen.

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

log "[$AGENT_NAME] Rufe Codex auf..."
# B2: set +e damit EXIT_CODE korrekt erfasst wird
# M3: GH_TOKEN aus Agent-Env entfernen
set +e
REVIEW=$(timeout 1800 env -u GH_TOKEN codex exec --full-auto "$PROMPT" 2>/dev/null)
CODEX_EXIT=$?
set -e
if [[ $CODEX_EXIT -ne 0 ]]; then
  log "[$AGENT_NAME] Codex fehlgeschlagen oder nicht verfügbar — Fallback auf Claude."
  set +e
  REVIEW=$(timeout 1800 env -u GH_TOKEN claude --print "$PROMPT" 2>/dev/null)
  set -e
fi

DECISION=$(echo "$REVIEW" | grep '^DECISION:' | cut -d' ' -f2- | tr -d '[:space:]')
SUMMARY=$(echo "$REVIEW" | grep '^SUMMARY:' | cut -d' ' -f2-)
FINDINGS=$(echo "$REVIEW" | awk '/^FINDINGS:/{found=1; next} found && /^-/{print} found && !/^-/{if(NF>0) exit}')

log "[$AGENT_NAME] Decision: $DECISION"

if [[ "$DECISION" == "APPROVE" ]]; then
  gh_comment "**[Codex]** Code Review: Approved ✅

**Zusammenfassung:** ${SUMMARY}

${FINDINGS:+**Anmerkungen (non-blocking):**
${FINDINGS}}

→ Verschiebe nach _Testing_."

  gh_move_to "$STATUS_TESTING"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Testing"
else
  gh_comment "**[Codex]** Code Review: Changes Requested 🔄

**Zusammenfassung:** ${SUMMARY}

**Zu beheben:**
${FINDINGS}

→ Verschiebe zurück nach _In Progress_."

  gh_move_to "$STATUS_IN_PROGRESS"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → In Progress (Changes requested)"
fi
