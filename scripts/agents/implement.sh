#!/usr/bin/env bash
# scripts/agents/implement.sh
# Implementation Agent: In Progress → Claude Code implementiert → Code Review
#
# Usage: bash scripts/agents/implement.sh <issue_number> <item_id>

# SECURITY: closed-trust-boundary — nur Repo-Maintainer können Issues erstellen.
# Issue-Body/Kommentare werden in eine separate Datei ausgelagert, nicht inline
# im Prompt. Das reduziert Shell-Injection-Risiken, schützt aber nicht vollständig
# vor Prompt-Injection (der Agent liest die Datei). Risiko akzeptiert für closed repo.
source "$(dirname "$0")/_common.sh"

AGENT_NAME="Claude Code"
log "[$AGENT_NAME] Starte für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

TITLE=$(gh_issue_title)
BODY=$(gh_issue_body)
COMMENTS=$(gh_issue_comments 10)

# Dedup: skip if implementation already ran
# Accept both agent:dev:v1 (new, per pipeline-guard spec) and agent:implement:v1 (legacy)
MARKER="<!-- agent:dev:v1 -->"
if echo "$COMMENTS" | grep -qE "agent:(dev|implement):v1"; then
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER bereits implementiert (Marker gefunden)."
  # Issue nach Code Review verschieben falls noch in In Progress (verhindert Endlos-Re-Dispatch)
  gh_move_to "$STATUS_CODE_REVIEW"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Code Review (war stuck in In Progress)"
  gh_unlock
  exit 0
fi

# B3: Branch und Worktree-Pfad festlegen
BRANCH="issue-${ISSUE_NUMBER}"
WORKTREE="/tmp/bib-worktree-${ISSUE_NUMBER}"

# Issue-Body in Datei schreiben — verhindert Prompt-Injection via Issue-Inhalt
ISSUE_FILE="/tmp/issue-${ISSUE_NUMBER}.md"
{
  printf '# Issue #%s: %s\n\n' "$ISSUE_NUMBER" "$TITLE"
  printf '## Anforderungen\n\n%s\n\n' "$BODY"
  printf '## Kontext aus vorherigen Kommentaren\n\n%s\n' "$COMMENTS"
} > "$ISSUE_FILE"

# Cleanup: Worktree + Branch + Temp-Datei entfernen (Lock bleibt — wird nur bei Erfolg entfernt)
trap 'git -C "$WORKSPACE" worktree remove --force "$WORKTREE" 2>/dev/null || true; git -C "$WORKSPACE" branch -D "$BRANCH" 2>/dev/null || true; rm -f "$ISSUE_FILE"' EXIT

# Baue Implementierungs-Prompt (Issue-Body NICHT inline — kein Prompt-Injection-Risiko)
PROMPT="Du bist ein Senior TypeScript/React Entwickler für das Projekt 'Bildung in Bildern' (BiB).
Stack: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui.
Zielgruppe: Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only iPad-App.
Arbeitsverzeichnis: ${WORKTREE}

Lies die vollständige Aufgabenbeschreibung aus: ${ISSUE_FILE}

Wichtige Regeln:
- Conventional Commits: feat:, fix:, docs:, test:
- Führe 'pnpm test' aus bevor du committest
- Commitiere alle Änderungen (kein git push — das übernimmt das Deploy-Script)
- Bleibe im Scope des Issues — keine ungefragten Verbesserungen
- WCAG 2.2 AA — Touch-Targets min. 44×44px, prefers-reduced-motion respektieren
- Kommentiere deinen Plan kurz bevor du startest"

# B3: Isolierten Worktree erstellen (saubere Basis von origin/main)
log "[$AGENT_NAME] Erstelle isolierten Worktree für Branch $BRANCH..."
git -C "$WORKSPACE" fetch origin main
git -C "$WORKSPACE" worktree remove --force "$WORKTREE" 2>/dev/null || true
git -C "$WORKSPACE" branch -D "$BRANCH" 2>/dev/null || true
git -C "$WORKSPACE" worktree add -b "$BRANCH" "$WORKTREE" origin/main
cd "$WORKTREE"
pnpm install --frozen-lockfile 2>&1 | tail -5

HEAD_BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "")

log "[$AGENT_NAME] Starte Claude Code Implementierung..."
# B2: set +e damit EXIT_CODE korrekt erfasst wird — set -e würde Script beenden
# M3: GH_TOKEN aus Claude-Env entfernen (Shell-Wrapper brauchen es, nicht der Agent)
set +e
IMPLEMENTATION_LOG=$(timeout 1800 env -u GH_TOKEN claude --permission-mode bypassPermissions --print "$PROMPT" 2>&1)
EXIT_CODE=$?
set -e

HEAD_AFTER=$(git rev-parse HEAD 2>/dev/null || echo "")

# Ermittle was sich geändert hat
CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null | head -20 || echo "(keine neuen Commits)")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "kein Commit")

if [[ $EXIT_CODE -eq 0 ]] && [[ "$HEAD_AFTER" != "$HEAD_BEFORE" ]]; then
  # Merge Branch zurück in den Haupt-Workspace und push
  cd "$WORKSPACE"
  git merge "$BRANCH" --no-edit
  git push

  REMOTE_HEAD=$(git ls-remote origin HEAD 2>/dev/null | cut -f1 || echo "")
  LOCAL_HEAD=$(git rev-parse HEAD)
  if [[ -n "$REMOTE_HEAD" ]] && [[ "$REMOTE_HEAD" != "$LOCAL_HEAD" ]]; then
    log "[$AGENT_NAME] WARNUNG: git push scheint fehlgeschlagen (remote: ${REMOTE_HEAD:0:8}, lokal: ${LOCAL_HEAD:0:8})"
  fi

  gh_comment "${MARKER}
**[Claude Code]** Implementierung abgeschlossen ✅

**Commit:** \`${LAST_COMMIT}\`

**Geänderte Dateien:**
\`\`\`
${CHANGED_FILES}
\`\`\`

→ Verschiebe nach _Code Review_."

  gh_move_to "$STATUS_CODE_REVIEW"
  gh_unlock  # Erfolg → Lock entfernen
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Code Review"
elif [[ $EXIT_CODE -eq 0 ]] && [[ "$HEAD_AFTER" == "$HEAD_BEFORE" ]]; then
  gh_comment "${MARKER}
**[Claude Code]** Claude lief erfolgreich, hat aber keinen neuen Commit erstellt ⚠️

**Letzter Commit (unverändert):** \`${LAST_COMMIT}\`

→ Bleibt in _In Progress_ — manuelle Überprüfung erforderlich."

  gh_unlock  # Entscheidung getroffen → Lock entfernen
  log "[$AGENT_NAME] Kein neuer Commit nach Claude-Lauf — bleibt in In Progress"
else
  gh_comment "${MARKER}
**[Claude Code]** Implementierung fehlgeschlagen ❌

**Exit Code:** $EXIT_CODE

**Log (letzte 20 Zeilen):**
\`\`\`
$(echo "$IMPLEMENTATION_LOG" | tail -20)
\`\`\`

→ Bleibt in _In Progress_ — manuelle Überprüfung erforderlich."

  gh_unlock  # Fehler gemeldet → Lock entfernen, Issue bleibt In Progress
  log "[$AGENT_NAME] Implementierung fehlgeschlagen (exit $EXIT_CODE)"
fi
