#!/usr/bin/env bash
# scripts/agents/test.sh
# Test Agent: Testing → pnpm test + build → Done (Issue close) oder zurück In Progress
#
# Usage: bash scripts/agents/test.sh <issue_number> <item_id>

# SECURITY: closed-trust-boundary — nur Repo-Maintainer können Issues erstellen.
source "$(dirname "$0")/_common.sh"

AGENT_NAME="Test"
log "[$AGENT_NAME] Starte Tests für Issue #$ISSUE_NUMBER (Item: $ITEM_ID)"

# Dedup: skip if test already ran
MARKER="<!-- agent:test:v1 -->"
COMMENTS=$(gh_issue_comments 5)
if echo "$COMMENTS" | grep -q "agent:test:v1"; then
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER bereits getestet (Marker gefunden)."
  gh_move_to "$STATUS_DONE"
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Done (war stuck nach vorherigem Lauf)"
  gh issue close "$ISSUE_NUMBER" --repo "$REPO" 2>/dev/null || true
  gh_unlock
  exit 0
fi

# B3: Sicherheitscheck vor git-Operationen — kein Reset bei dirty/falschem Branch
assert_workspace_safe "main"
cd "$WORKSPACE"
git fetch origin main --quiet 2>/dev/null || true
git merge --ff-only origin/main

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

  # ── Production Build mit Access Token ───────────────────────────────────────
  DEPLOY_OK=false
  DEPLOY_URL=""
  DEPLOY_OUTPUT=""
  DEPLOY_WARNING=""

  BIB_TOKEN_FILE="$HOME/.config/cloudflare/bib-access-token"
  CF_TOKEN_FILE="$HOME/.config/cloudflare/api-token"

  if [[ -f "$BIB_TOKEN_FILE" && -f "$CF_TOKEN_FILE" ]]; then
    log "[$AGENT_NAME] Production Build mit NEXT_PUBLIC_ACCESS_TOKEN..."
    BIB_TOKEN=$(cat "$BIB_TOKEN_FILE")
    CF_TOKEN=$(cat "$CF_TOKEN_FILE")

    if PROD_BUILD_OUTPUT=$(NEXT_PUBLIC_ACCESS_TOKEN="$BIB_TOKEN" pnpm build 2>&1); then
      log "[$AGENT_NAME] Production Build: ✅"

      # ── Deploy ──────────────────────────────────────────────────────────────
      log "[$AGENT_NAME] Deploy via wrangler pages deploy..."
      if DEPLOY_OUTPUT=$(CLOUDFLARE_API_TOKEN="$CF_TOKEN" npx wrangler pages deploy out \
          --project-name bildung-in-bildern \
          --branch main \
          --commit-dirty=true 2>&1); then
        DEPLOY_OK=true
        # Extrahiere Deploy-URL aus wrangler Output
        DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9._-]+\.pages\.dev[^ ]*' | tail -1 || true)
        log "[$AGENT_NAME] Deploy: ✅ ${DEPLOY_URL}"
      else
        DEPLOY_WARNING="Deploy fehlgeschlagen — Code ist korrekt, manuelles Deploy erforderlich."
        log "[$AGENT_NAME] Deploy: ❌ (Warnung, kein Blocker)"
      fi
    else
      DEPLOY_WARNING="Production Build fehlgeschlagen — Code ist korrekt, manuelles Deploy erforderlich."
      log "[$AGENT_NAME] Production Build: ❌ (Warnung, kein Blocker)"
    fi
  else
    DEPLOY_WARNING="Token-Dateien nicht gefunden ($BIB_TOKEN_FILE / $CF_TOKEN_FILE) — manuelles Deploy erforderlich."
    log "[$AGENT_NAME] Deploy übersprungen: Token-Dateien fehlen"
  fi

  # ── GitHub Kommentar ─────────────────────────────────────────────────────────
  DEPLOY_SECTION=""
  if $DEPLOY_OK; then
    DEPLOY_SECTION="**Deploy:** ✅ Erfolgreich"
    if [[ -n "$DEPLOY_URL" ]]; then
      DEPLOY_SECTION+=$'\n'"**URL:** $DEPLOY_URL"
    fi
  else
    DEPLOY_SECTION="**Deploy:** ⚠️ ${DEPLOY_WARNING}"
  fi

  gh_comment "${MARKER}
**[Test]** Alle Tests bestanden ✅

**pnpm test:** ✅ Grün
**pnpm build:** ✅ Erfolgreich
${DEPLOY_SECTION}

→ Verschiebe nach _Done_ + schließe Issue."

  gh_move_to "$STATUS_DONE"
  gh issue close "$ISSUE_NUMBER" --repo "$REPO" --comment "**[Test]** Automatisch geschlossen — alle Tests grün, Build erfolgreich."
  gh_unlock  # Erfolg → Lock entfernen
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → Done (geschlossen)"

else
  # Kürze Output auf relevante Fehler
  TEST_EXCERPT=$(echo "$TEST_OUTPUT" | grep -E 'FAIL|Error|✗|×|failed' | head -20 || echo "(kein Fehleroutput)")
  BUILD_EXCERPT=$(echo "$BUILD_OUTPUT" | grep -E 'error|Error|failed' | head -20 || echo "(kein Fehleroutput)")

  STATUS_ICONS=""
  $TEST_OK  && STATUS_ICONS+="**pnpm test:** ✅"$'\n' || STATUS_ICONS+="**pnpm test:** ❌"$'\n'
  $BUILD_OK && STATUS_ICONS+="**pnpm build:** ✅"$'\n' || STATUS_ICONS+="**pnpm build:** ❌"$'\n'

  COMMENT="${MARKER}
**[Test]** Tests fehlgeschlagen ❌

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
  gh_unlock  # Entscheidung getroffen → Lock entfernen
  log "[$AGENT_NAME] Issue #$ISSUE_NUMBER → In Progress (Tests/Build fehlgeschlagen)"
fi
