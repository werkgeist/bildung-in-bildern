# Pipeline Re-Review — commit 1494d7f vs 844a9b3

## Verdicts

### B1: `gh_issue_comments` jq query
**FIXED**

Evidence:
- `scripts/agents/_common.sh:64-68` now uses `.comments[-${n}:][]`, which is valid jq array slicing and iteration.
- The previous broken `last($n) | .[]` pattern is gone.

### B2: Implementation error handling (`set -e` bypass)
**NOT FIXED**

Evidence:
- `scripts/agents/_common.sh:5` still enables `set -euo pipefail`.
- `scripts/agents/implement.sh:46-47` still does:
  - `IMPLEMENTATION_LOG=$(timeout 1800 claude ... 2>&1)`
  - `EXIT_CODE=$?`
- In bash, a failing command substitution inside an assignment still aborts the shell under `set -e` before the next line runs. I verified this behavior directly with `bash -lc 'set -e; OUT=$(false); CODE=$?; echo after:$CODE'`, which exited with status 1 and printed nothing.
- Result: on `claude`/`timeout` failure, the script still exits before posting the intended diagnostic comment.

### B3: Workspace isolation (worktrees)
**NOT FIXED**

Evidence:
- All agents still `cd "$WORKSPACE"` and operate in the shared repo:
  - `scripts/agents/implement.sh:44`
  - `scripts/agents/review.sh:15`
  - `scripts/agents/test.sh:12`
- `_common.sh:12` still defines a single shared `WORKSPACE` path.
- There is still no issue-specific branch/worktree creation, no clean-tree guard, no reset to a known revision, and no fetch/checkout flow.
- `review.sh:18-19` and `test.sh:21-30` therefore still act on whatever state is currently in that shared checkout.

### M1: Atomic lock / persistent state
**PARTIALLY FIXED**

Evidence:
- Persistent state is improved:
  - `scripts/poll-board.mjs:57-58` moves state from `/tmp` into `${WORKSPACE}/.pipeline-state.json`.
  - `scripts/poll-board.mjs:180-185` no longer treats a missing local state entry as an immediate timeout after reboot.
- Same-host poller concurrency is improved:
  - `scripts/poll-board.mjs:22-36` adds a process-level `flock` mutex, which prevents two cron-triggered pollers on the same machine from running concurrently.
- But the GitHub issue lock is still not atomic / CAS-like:
  - `scripts/poll-board.mjs:299-316` still checks board state, then separately adds the label, then separately records local state.
  - `scripts/poll-board.mjs:217-219` uses `gh issue edit --add-label`, which is idempotent but not a compare-and-set against a fresh server-side read.
- Result: duplicate dispatch is reduced for one host, but not eliminated across multiple hosts/clones/manual invocations, and the lock itself is still non-atomic.

### M2: Pagination + field ID matching
**NOT FIXED**

Evidence:
- `scripts/poll-board.mjs:115` still queries `items(first: 50)` with no pagination.
- `scripts/poll-board.mjs:276-278` explicitly warns that pagination is still missing instead of implementing it.
- `scripts/poll-board.mjs:119` still limits `fieldValues(first: 8)`.
- `scripts/poll-board.mjs:167-170` still matches status by `fv.field?.name === 'Status'`.
- `STATUS_FIELD_ID` is still only used for writes in `_common.sh:49` / `poll-board.mjs:244`, not for poll-time field identification.

### M3: Prompt injection mitigation
**NOT FIXED**

Evidence:
- `scripts/agents/implement.sh:16-31` and `scripts/agents/refinement.sh:16-35` move issue text/comments into a temp file, but then explicitly instruct the agent to read that file.
- Moving untrusted text out of the inline prompt does not create a trust boundary; the model still consumes attacker-controlled instructions from the file.
- `scripts/agents/review.sh:37-48` still inlines the raw issue body and diff directly into the privileged review prompt.
- Agents are still run with elevated autonomy:
  - `implement.sh:46` uses `claude --permission-mode bypassPermissions`
  - `review.sh:67-68` uses `codex exec --full-auto` / `claude --permission-mode bypassPermissions`
- Net effect: the original prompt-injection risk remains.

### M4: Synchronous poller
**NOT FIXED**

Evidence:
- `scripts/poll-board.mjs:235-255` still dispatches agents with `spawnSync(...)`.
- `scripts/poll-board.mjs:233-234` now documents that agents run synchronously; this corrects the comment, but not the behavior.
- One long-running agent still blocks processing of later board items in the same poll run.

## Overall

Status summary:
- Fixed: B1
- Partially fixed: M1
- Not fixed: B2, B3, M2, M3, M4

The patch fixes the broken comment query and materially improves poller coordination on a single host, but the main unattended-operation risks remain: implementation failures still skip the intended error report, agents still share one mutable workspace, board polling is still truncated/brittle, prompt injection is still unmitigated, and dispatch is still synchronous.
