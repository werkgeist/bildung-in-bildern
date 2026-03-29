#!/usr/bin/env bash
# scripts/agents/refinement.sh
# Refinement Agent: Ready → prüft ob Issue implementierbar ist → In Progress oder bleibt in Ready
#
# Usage: bash scripts/agents/refinement.sh <issue_number> <item_id>

source "$(dirname "$0")/_common.sh"

AGENT_NAME="Refinement"
log "[$AGENT_NAME] Starte für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

TITLE=$(gh_issue_title)
BODY=$(gh_issue_body)
COMMENTS=$(gh_issue_comments 5)

# Baue Kontext für Claude
CONTEXT="Du bist ein Refinement-Agent für das Projekt 'Bildung in Bildern' (BiB).
Deine Aufgabe: Prüfe ob das folgende GitHub Issue bereit für die Implementierung ist.

Definition of Ready (DoR):
- [ ] Akzeptanzkriterien sind klar und testbar
- [ ] Technische Anforderungen sind verständlich
- [ ] Keine offenen Abhängigkeiten oder blockierende Fragen
- [ ] Scope ist klar abgegrenzt (nicht zu groß für einen Commit)

Issue #${ISSUE_NUMBER}: ${TITLE}

Body:
${BODY}

Letzte Kommentare:
${COMMENTS}

Antworte AUSSCHLIESSLICH in diesem Format (kein Markdown, kein Preamble):

DECISION: READY|NOT_READY
REASON: <ein Satz warum>
QUESTIONS: <nur bei NOT_READY: konkrete Rückfragen, eine pro Zeile mit '- ' Präfix>"

log "[$AGENT_NAME] Rufe Claude auf..."
RESPONSE=$(claude --permission-mode bypassPermissions --print "$CONTEXT" 2>/dev/null)

DECISION=$(echo "$RESPONSE" | grep '^DECISION:' | cut -d' ' -f2- | tr -d '[:space:]')
REASON=$(echo "$RESPONSE" | grep '^REASON:' | cut -d' ' -f2-)
QUESTIONS=$(echo "$RESPONSE" | awk '/^QUESTIONS:/{found=1; next} found{print}')

log "[$AGENT_NAME] Decision: $DECISION"

if [[ "$DECISION" == "READY" ]]; then
  gh_comment "**[Refinement]** Issue ist implementierbar ✅

**Begründung:** ${REASON}

→ Verschiebe nach _In Progress_."

  gh_move_to "$STATUS_IN_PROGRESS"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → In Progress"
else
  COMMENT="**[Refinement]** Issue noch nicht implementierbar ⚠️

**Begründung:** ${REASON}"

  if [[ -n "${QUESTIONS:-}" ]]; then
    COMMENT="${COMMENT}

**Rückfragen:**
${QUESTIONS}"
  fi

  gh_comment "$COMMENT"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER bleibt in Ready (Rückfragen gestellt)"
fi
