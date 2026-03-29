#!/usr/bin/env bash
# scripts/agents/_common.sh — Gemeinsame Hilfsfunktionen für alle Agent-Scripts
# Source this with: source "$(dirname "$0")/_common.sh"

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

# ── Logging ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date -Iseconds)] $*" >&2; }
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
    -q ".comments | last($n) | .[] | \"\\(.author.login): \\(.body)\""
}

# Get issue title
gh_issue_title() {
  gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json title -q '.title'
}

# Trap: always unlock on exit
trap 'gh_unlock' EXIT
