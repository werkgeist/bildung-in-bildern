#!/usr/bin/env bash
# scripts/agents/_common.sh — Gemeinsame Hilfsfunktionen für alle Agent-Scripts
# Source this with: source "$(dirname "$0")/_common.sh"
#
# SECURITY: closed-trust-boundary — nur Repo-Maintainer können Issues erstellen.

set -euo pipefail

# ── Env ───────────────────────────────────────────────────────────────────────
ISSUE_NUMBER="${1:?Usage: $0 <issue_number> <item_id>}"
ITEM_ID="${2:?Usage: $0 <issue_number> <item_id>}"

REPO="${REPO:-werkgeist/bildung-in-bildern}"
WORKSPACE="${WORKSPACE:-/home/werkgeist/.openclaw/workspace/bildung-in-bildern}"
LOCK_LABEL="${LOCK_LABEL:-agent-working}"

# Load GH_TOKEN if not set
if [[ -z "${GH_TOKEN:-}" ]]; then
  GH_TOKEN=$(cat "${HOME}/.config/git-token")
  export GH_TOKEN
fi

# ── Logging (mit Datei) ────────────────────────────────────────────────────────
LOG_DIR="/tmp/bib-agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/${ISSUE_NUMBER}-$(date -u +%Y%m%d-%H%M%S).log"
log()  { echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE" >&2; }
die()  { log "FATAL: $*"; exit 1; }

# ── GitHub Helpers ────────────────────────────────────────────────────────────

# Post a comment to the issue
# Usage: gh_comment "**[Agent]** message"
gh_comment() {
  local body="$1"
  gh issue comment "$ISSUE_NUMBER" --body "$body" --repo "$REPO"
}

# Move item to a different board column
# Usage: gh_move_to "$STATUS_IN_PROGRESS"
gh_move_to() {
  local status_id="$1"
  gh api graphql -f query='
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' \
    -f projectId="$BOARD_ID" \
    -f itemId="$ITEM_ID" \
    -f fieldId="$STATUS_FIELD_ID" \
    -f optionId="$status_id"
}

# Remove the agent-working lock label
gh_unlock() {
  gh issue edit "$ISSUE_NUMBER" --remove-label "$LOCK_LABEL" --repo "$REPO" 2>/dev/null || true
}

# Get full issue body
gh_issue_body() {
  gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json body -q '.body'
}

# Get last N comments from issue
gh_issue_comments() {
  local n="${1:-10}"
  gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json comments \
    -q ".comments[-${n}:][] | \"\\(.author.login): \\(.body)\""
}

# Get issue title
gh_issue_title() {
  gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json title -q '.title'
}

# ── Workspace Safety Guard ────────────────────────────────────────────────────
#
# assert_workspace_safe [expected_branch]
#
# Prüft vor jedem destructiven Git-Vorgang (merge, reset):
#   1. WORKSPACE ist auf dem erwarteten Branch (Standard: main)
#   2. Working tree ist sauber (keine uncommitted changes)
#
# Bei Verletzung: GitHub-Kommentar posten, mit die() abbrechen.
# NIEMALS selbst resetten oder mergen — das ist Aufgabe des Aufrufers.
#
assert_workspace_safe() {
  local expected_branch="${1:-main}"

  # 1) Branch-Check
  local current_branch
  current_branch=$(git -C "$WORKSPACE" symbolic-ref --short HEAD 2>/dev/null || echo "DETACHED")

  if [[ "$current_branch" != "$expected_branch" ]]; then
    gh_comment "**[Pipeline-Guard]** Workspace-Sicherheitscheck fehlgeschlagen ⛔

**Erwarteter Branch:** \`${expected_branch}\`
**Aktueller Branch:** \`${current_branch}\`

Pipeline abgebrochen — **kein Reset, kein Merge, kein Datenverlust**.
Bitte WORKSPACE manuell auf \`${expected_branch}\` bringen und erneut triggern.

→ Issue bleibt in aktueller Stage."
    die "WORKSPACE ist auf Branch '${current_branch}', erwartet '${expected_branch}'. Abbruch ohne destructive Aktion."
  fi

  # 2) Dirty-Check
  local dirty
  dirty=$(git -C "$WORKSPACE" status --porcelain 2>/dev/null)

  if [[ -n "$dirty" ]]; then
    gh_comment "**[Pipeline-Guard]** Workspace-Sicherheitscheck fehlgeschlagen ⛔

**Workspace ist nicht sauber (dirty working tree):**
\`\`\`
$(echo "$dirty" | head -20)
\`\`\`

Pipeline abgebrochen — **kein Reset, kein Merge, kein Datenverlust**.
Bitte uncommitted changes manuell sichern/committen und erneut triggern.

→ Issue bleibt in aktueller Stage."
    die "WORKSPACE ist dirty. Abbruch ohne destructive Aktion."
  fi

  log "[Guard] WORKSPACE OK: Branch='${current_branch}', clean working tree."
}

# Trap: Log on exit, but do NOT unlock — lock stays until agent explicitly calls gh_unlock.
# This prevents the poller from re-dispatching on crash/error.
# The poller's lock-timeout mechanism (LOCK_TIMEOUT_MINUTES) will clean up stuck locks.
trap 'log "Agent-Prozess beendet (exit $?). Lock-Label bleibt bestehen bis explizit entfernt."' EXIT
