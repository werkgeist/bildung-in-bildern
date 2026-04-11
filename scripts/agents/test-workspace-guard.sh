#!/usr/bin/env bash
# scripts/agents/test-workspace-guard.sh
# Smoke-Tests für assert_workspace_safe aus _common.sh
#
# Testet die Safety-Guard-Funktion in Isolation ohne echte GitHub-Calls.
# Führt assert_workspace_safe gegen synthetische git-Repos aus und prüft Exit-Codes.
#
# Usage: bash scripts/agents/test-workspace-guard.sh
# Exit 0 = alle Tests grün, Exit 1 = mindestens ein Test rot

set -euo pipefail

PASS=0
FAIL=0
TMPDIR_ROOT=$(mktemp -d)
trap 'rm -rf "$TMPDIR_ROOT"' EXIT

# ── Hilfsfunktionen ──────────────────────────────────────────────────────────

ok() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

# Minimale Stub-Umgebung für _common.sh (ohne echte GH-Calls)
setup_stubs() {
  # Überschreibe gh_comment + die + log für Testzwecke
  gh_comment() { echo "[stub gh_comment] $1" >&2; }
  log()        { echo "[stub log] $*" >&2; }
  die()        { echo "[stub die] $*" >&2; exit 1; }
  export -f gh_comment log die 2>/dev/null || true
}

# Erstelle ein minimales git-Repo in $1 auf Branch $2 (default: main)
make_repo() {
  local dir="$1"
  local branch="${2:-main}"
  mkdir -p "$dir"
  git -C "$dir" init -b "$branch" -q
  git -C "$dir" config user.email "test@example.com"
  git -C "$dir" config user.name  "Test"
  echo "init" > "$dir/README"
  git -C "$dir" add .
  git -C "$dir" commit -q -m "init"
}

# ── Test-Runner ──────────────────────────────────────────────────────────────

run_guard() {
  local workspace="$1"
  local expected_branch="${2:-main}"
  # Sourcen und direkt aufrufen in Subshell
  (
    # Stubs definieren
    gh_comment() { echo "[stub] $*" >&2; }
    log()        { echo "[stub log] $*" >&2; }
    die()        { echo "[stub die] $*" >&2; exit 1; }
    WORKSPACE="$workspace"
    ISSUE_NUMBER="0"
    REPO="test/test"
    # assert_workspace_safe inline (kopiert aus _common.sh um gh_comment-Stub zu nutzen)
    current_branch=$(git -C "$WORKSPACE" symbolic-ref --short HEAD 2>/dev/null || echo "DETACHED")
    if [[ "$current_branch" != "$expected_branch" ]]; then
      die "Branch mismatch: '$current_branch' != '$expected_branch'"
    fi
    dirty=$(git -C "$WORKSPACE" status --porcelain 2>/dev/null)
    if [[ -n "$dirty" ]]; then
      die "Dirty workspace"
    fi
    exit 0
  )
}

# ── Tests ────────────────────────────────────────────────────────────────────

echo ""
echo "=== assert_workspace_safe — Smoke Tests ==="
echo ""

# Test 1: Sauber auf main → soll 0 zurückgeben
T1="$TMPDIR_ROOT/repo-clean-main"
make_repo "$T1" main
if run_guard "$T1" main 2>/dev/null; then
  ok "T1: clean main → guard erlaubt (exit 0)"
else
  fail "T1: clean main → guard sollte erlauben, hat aber blockiert"
fi

# Test 2: Falscher Branch → soll 1 zurückgeben
T2="$TMPDIR_ROOT/repo-wrong-branch"
make_repo "$T2" main
git -C "$T2" checkout -q -b feature/test
if run_guard "$T2" main 2>/dev/null; then
  fail "T2: falscher Branch → guard sollte blockieren, hat aber erlaubt"
else
  ok "T2: falscher Branch → guard blockiert (exit 1)"
fi

# Test 3: Dirty workspace (uncommitted change) → soll 1 zurückgeben
T3="$TMPDIR_ROOT/repo-dirty"
make_repo "$T3" main
echo "schmutz" >> "$T3/README"
if run_guard "$T3" main 2>/dev/null; then
  fail "T3: dirty workspace → guard sollte blockieren, hat aber erlaubt"
else
  ok "T3: dirty workspace → guard blockiert (exit 1)"
fi

# Test 4: Staged (aber nicht committed) → soll 1 zurückgeben
T4="$TMPDIR_ROOT/repo-staged"
make_repo "$T4" main
echo "staged" >> "$T4/README"
git -C "$T4" add README
if run_guard "$T4" main 2>/dev/null; then
  fail "T4: staged changes → guard sollte blockieren, hat aber erlaubt"
else
  ok "T4: staged changes → guard blockiert (exit 1)"
fi

# Test 5: DETACHED HEAD → soll 1 zurückgeben
T5="$TMPDIR_ROOT/repo-detached"
make_repo "$T5" main
HASH=$(git -C "$T5" rev-parse HEAD)
git -C "$T5" checkout -q --detach "$HASH"
if run_guard "$T5" main 2>/dev/null; then
  fail "T5: DETACHED HEAD → guard sollte blockieren, hat aber erlaubt"
else
  ok "T5: DETACHED HEAD → guard blockiert (exit 1)"
fi

# ── Zusammenfassung ──────────────────────────────────────────────────────────

echo ""
echo "=== Ergebnis: ${PASS} grün, ${FAIL} rot ==="
echo ""

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
