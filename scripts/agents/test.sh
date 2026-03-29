#!/usr/bin/env bash
# scripts/agents/test.sh
# Test Agent: Testing → pnpm test + build → Done (Issue close) oder zurück In Progress
#
# Usage: bash scripts/agents/test.sh <issue_number> <item_id>

source "$(dirname "$0")/_common.sh"

AGENT_NAME="Test"
log "[$AGENT_NAME] Starte Tests für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

cd "$WORKSPACE"

TEST_OUTPUT=""
BUILD_OUTPUT=""
TEST_OK=false
BUILD_OK=false

# ── Unit Tests ────────────────────────────────────────────────────────────────
log "[$AGENT_NAME] Führe pnpm test aus..."
if TEST_OUTPUT=$(pnpm test 2>&1); then
  TEST_OK=true
  log "[$AGENT_NAME] Tests: ✅"
else
  log "[$AGENT_NAME] Tests: ❌"
fi

# ── Build ─────────────────────────────────────────────────────────────────────
log "[$AGENT_NAME] Führe pnpm build aus..."
if BUILD_OUTPUT=$(pnpm build 2>&1); then
  BUILD_OK=true
  log "[$AGENT_NAME] Build: ✅"
else
  log "[$AGENT_NAME] Build: ❌"
fi

# ── Ergebnis ──────────────────────────────────────────────────────────────────

if $TEST_OK && $BUILD_OK; then
  gh_comment "**[Test]** Alle Tests bestanden ✅

**pnpm test:** ✅ Grün
**pnpm build:** ✅ Erfolgreich

→ Verschiebe nach _Done_ + schließe Issue."

  gh_move_to "$STATUS_DONE"
  gh issue close "$ISSUE_NUMBER" --repo "$REPO" --comment "**[Test]** Automatisch geschlossen — alle Tests grün, Build erfolgreich."
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Done (geschlossen)"

else
  # Kürze Output auf relevante Fehler
  TEST_EXCERPT=$(echo "$TEST_OUTPUT" | grep -E 'FAIL|Error|✗|×|failed' | head -20 || echo "(kein Fehleroutput)")
  BUILD_EXCERPT=$(echo "$BUILD_OUTPUT" | grep -E 'error|Error|failed' | head -20 || echo "(kein Fehleroutput)")

  STATUS_ICONS=""
  $TEST_OK  && STATUS_ICONS+="**pnpm test:** ✅"$'\n' || STATUS_ICONS+="**pnpm test:** ❌"$'\n'
  $BUILD_OK && STATUS_ICONS+="**pnpm build:** ✅"$'\n' || STATUS_ICONS+="**pnpm build:** ❌"$'\n'

  COMMENT="**[Test]** Tests fehlgeschlagen ❌

${STATUS_ICONS}"

  if ! $TEST_OK; then
    COMMENT+="
**Test-Fehler:**
\`\`\`
${TEST_EXCERPT}
\`\`\`"
  fi

  if ! $BUILD_OK; then
    COMMENT+="
**Build-Fehler:**
\`\`\`
${BUILD_EXCERPT}
\`\`\`"
  fi

  COMMENT+="
→ Verschiebe zurück nach _In Progress_."

  gh_comment "$COMMENT"
  gh_move_to "$STATUS_IN_PROGRESS"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → In Progress (Tests/Build fehlgeschlagen)"
fi
