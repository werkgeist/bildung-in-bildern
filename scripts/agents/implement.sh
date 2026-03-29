#!/usr/bin/env bash
# scripts/agents/implement.sh
# Implementation Agent: In Progress → Claude Code implementiert → Code Review
#
# Usage: bash scripts/agents/implement.sh <issue_number> <item_id>

source "$(dirname "$0")/_common.sh"

AGENT_NAME="Claude Code"
log "[$AGENT_NAME] Starte für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

TITLE=$(gh_issue_title)
BODY=$(gh_issue_body)
COMMENTS=$(gh_issue_comments 10)

# Issue-Body in Datei schreiben — verhindert Prompt-Injection via Issue-Inhalt
ISSUE_FILE="/tmp/issue-${ISSUE_NUMBER}.md"
{
  printf '# Issue #%s: %s\n\n' "$ISSUE_NUMBER" "$TITLE"
  printf '## Anforderungen\n\n%s\n\n' "$BODY"
  printf '## Kontext aus vorherigen Kommentaren\n\n%s\n' "$COMMENTS"
} > "$ISSUE_FILE"
trap 'gh_unlock; rm -f "$ISSUE_FILE"' EXIT

# Baue Implementierungs-Prompt (Issue-Body NICHT inline — kein Prompt-Injection-Risiko)
PROMPT="Du bist ein Senior TypeScript/React Entwickler für das Projekt 'Bildung in Bildern' (BiB).
Stack: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui.
Zielgruppe: Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only iPad-App.
Arbeitsverzeichnis: ${WORKSPACE}

Lies die vollständige Aufgabenbeschreibung aus: ${ISSUE_FILE}

Wichtige Regeln:
- Conventional Commits: feat:, fix:, docs:, test:
- Führe 'pnpm test' aus bevor du committest
- Commitiere und pushe alle Änderungen
- Bleibe im Scope des Issues — keine ungefragten Verbesserungen
- WCAG 2.2 AA — Touch-Targets min. 44×44px, prefers-reduced-motion respektieren
- Kommentiere deinen Plan kurz bevor du startest

Führe 'git push' am Ende aus."

log "[$AGENT_NAME] Starte Claude Code Implementierung..."
cd "$WORKSPACE"

HEAD_BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "")

IMPLEMENTATION_LOG=$(timeout 1800 claude --permission-mode bypassPermissions --print "$PROMPT" 2>&1)
EXIT_CODE=$?

HEAD_AFTER=$(git rev-parse HEAD 2>/dev/null || echo "")

# Ermittle was sich geändert hat
CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null | head -20 || echo "(keine neuen Commits)")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "kein Commit")

# Prüfe ob Claude tatsächlich committet und gepusht hat
if [[ $EXIT_CODE -eq 0 ]] && [[ "$HEAD_AFTER" != "$HEAD_BEFORE" ]]; then
  # Verifiziere dass der Commit auch remote angekommen ist
  REMOTE_HEAD=$(git ls-remote origin HEAD 2>/dev/null | cut -f1 || echo "")
  if [[ -n "$REMOTE_HEAD" ]] && [[ "$REMOTE_HEAD" != "$HEAD_AFTER" ]]; then
    log "[$AGENT_NAME] WARNUNG: Commit lokal vorhanden, aber git push scheint fehlgeschlagen (remote HEAD: ${REMOTE_HEAD:0:8}, lokal: ${HEAD_AFTER:0:8})"
  fi

  gh_comment "**[Claude Code]** Implementierung abgeschlossen ✅

**Commit:** \`${LAST_COMMIT}\`

**Geänderte Dateien:**
\`\`\`
${CHANGED_FILES}
\`\`\`

→ Verschiebe nach _Code Review_."

  gh_move_to "$STATUS_CODE_REVIEW"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Code Review"
elif [[ $EXIT_CODE -eq 0 ]] && [[ "$HEAD_AFTER" == "$HEAD_BEFORE" ]]; then
  gh_comment "**[Claude Code]** Claude lief erfolgreich, hat aber keinen neuen Commit erstellt ⚠️

**Letzter Commit (unverändert):** \`${LAST_COMMIT}\`

→ Bleibt in _In Progress_ — manuelle Überprüfung erforderlich."

  log "[$AGENT_NAME] Kein neuer Commit nach Claude-Lauf — bleibt in In Progress"
else
  gh_comment "**[Claude Code]** Implementierung fehlgeschlagen ❌

**Exit Code:** $EXIT_CODE

**Log (letzte 20 Zeilen):**
\`\`\`
$(echo "$IMPLEMENTATION_LOG" | tail -20)
\`\`\`

→ Bleibt in _In Progress_ — manuelle Überprüfung erforderlich."

  log "[$AGENT_NAME] Implementierung fehlgeschlagen (exit $EXIT_CODE)"
fi
