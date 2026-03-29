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

# Baue Implementierungs-Prompt
PROMPT="Du bist ein Senior TypeScript/React Entwickler für das Projekt 'Bildung in Bildern' (BiB).
Stack: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui.
Zielgruppe: Kyrill (22J, nonverbal, Autismus Level 2-3). Touch-only iPad-App.
Arbeitsverzeichnis: ${WORKSPACE}

Implementiere das folgende GitHub Issue vollständig:

Issue #${ISSUE_NUMBER}: ${TITLE}

Anforderungen:
${BODY}

Kontext aus vorherigen Kommentaren:
${COMMENTS}

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

IMPLEMENTATION_LOG=$(claude --permission-mode bypassPermissions --print "$PROMPT" 2>&1)
EXIT_CODE=$?

# Ermittle was sich geändert hat
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | head -20 || echo "(keine neuen Commits)")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "kein Commit")

if [[ $EXIT_CODE -eq 0 ]]; then
  gh_comment "**[Claude Code]** Implementierung abgeschlossen ✅

**Commit:** \`${LAST_COMMIT}\`

**Geänderte Dateien:**
\`\`\`
${CHANGED_FILES}
\`\`\`

→ Verschiebe nach _Code Review_."

  gh_move_to "$STATUS_CODE_REVIEW"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Code Review"
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
