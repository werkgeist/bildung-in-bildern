# Pipeline Review — commit 844a9b3

## Findings

### blocker: `gh_issue_comments()` is broken, so the `Ready` and `In Progress` agents exit before doing any work
- [`scripts/agents/_common.sh:64`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/_common.sh#L64 ) uses `-q ".comments | last($n) | .[] | ..."`. In jq/gojq, `last($n)` does not return the last `n` comments array; it returns a scalar, so `.[]` then errors.
- Both [`scripts/agents/refinement.sh:14`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/refinement.sh#L14 ) and [`scripts/agents/implement.sh:14`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/implement.sh#L14 ) call `COMMENTS=$(gh_issue_comments ...)` under `set -euo pipefail`, so the script aborts immediately on that jq failure.
- Operationally this means issues in `Ready` and `In Progress` never reach Claude at all. The lock label is removed by the EXIT trap, so the poller will keep retrying the same broken stage forever.

### blocker: implementation failures do not hit the intended error path; the script exits immediately and leaves no diagnostic comment
- [`scripts/agents/implement.sh:45`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/implement.sh#L45 ) captures the Claude run in `IMPLEMENTATION_LOG=$(...)` and only afterwards reads `$?`.
- With `set -e` inherited from [`scripts/agents/_common.sh:5`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/_common.sh#L5 ), a non-zero exit from `claude` terminates the script before `EXIT_CODE=$?` or the failure comment branch can run.
- In the unattended case, a crashed implementation agent silently unlocks the issue and leaves it in `In Progress`, so the next poll just retries without any human-readable failure context.

### blocker: there is no workspace isolation, so one issue can review/test/commit another issue's changes
- All agents operate directly in the single shared repo path from [`scripts/agents/_common.sh:12`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/_common.sh#L12 ) / [`scripts/bib-board.env:16`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/bib-board.env#L16 ) and only do `cd "$WORKSPACE"` before acting.
- There is no `git fetch`, no checkout of an issue-specific branch/worktree, no clean-tree check, and no reset to a known revision in [`scripts/agents/implement.sh:43`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/implement.sh#L43 ), [`scripts/agents/review.sh:15`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/review.sh#L15 ), or [`scripts/agents/test.sh:12`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/test.sh#L12 ).
- The poller can dispatch multiple issues from different columns in one run, so later agents may act on a dirty tree left by earlier issues. In an unattended pipeline, that makes review results, test results, and even commits non-attributable to a single issue.

### major: the lock is not atomic, and the timeout state is local-only, so duplicate agents are easy to trigger
- The poller checks the label from the board snapshot, then separately adds the label and dispatches the agent in [`scripts/poll-board.mjs:267-293`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L267 ). Two pollers starting close together can both observe "unlocked", both add the same label, and both dispatch the same issue.
- Timeout tracking is stored only in `/tmp/bib-poll-state.json` via [`scripts/poll-board.mjs:25`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L25 ) and [`scripts/poll-board.mjs:53-61`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L53 ). If the host reboots or `/tmp` is cleared, any existing `agent-working` label is treated as timed out immediately by [`scripts/poll-board.mjs:162-167`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L162 ), even if the original agent is still legitimately running elsewhere.
- For unattended automation, the lock needs to be derived from durable/shared state or made compare-and-set-like; this implementation can launch duplicate workers after normal operational events.

### major: board polling is incomplete and status detection is brittle
- The GraphQL query only fetches `items(first: 50)` in [`scripts/poll-board.mjs:97`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L97 ) and never paginates. Boards larger than 50 items are silently truncated.
- Status detection only inspects `fieldValues(first: 8)` and matches `fv.field?.name === 'Status'` in [`scripts/poll-board.mjs:101`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L101 ) and [`scripts/poll-board.mjs:149-153`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L149 ). The poller ignores the configured `STATUS_FIELD_ID`, so adding more project fields or renaming/localizing the field can make issues undispatchable without any explicit error.

### major: issue and comment text is passed straight into privileged autonomous agents without any trust boundary
- The raw issue body and recent comments are interpolated verbatim into the prompts in [`scripts/agents/refinement.sh:17-38`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/refinement.sh#L17 ), [`scripts/agents/implement.sh:17-40`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/implement.sh#L17 ), and [`scripts/agents/review.sh:31-64`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/review.sh#L31 ).
- Those agents are then run with `claude --permission-mode bypassPermissions` or `codex exec --full-auto`, and the environment also contains a GitHub PAT plus repo write access.
- Shell injection is avoided by quoting, but prompt injection is not. A malicious issue/comment can instruct the agent to exfiltrate secrets, mutate unrelated files, or post misleading review output. For an unattended pipeline, that is a real security boundary and should be treated as such.

### major: the poller is synchronous despite the design/docs claiming asynchronous dispatch, so one stuck agent blocks the whole board run
- [`scripts/poll-board.mjs:215-237`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/poll-board.mjs#L215 ) uses `spawnSync(...)` with `detached: false`, which waits for the agent script to finish.
- The comment says this is "Run agent in background" and the docs describe the poller as just dispatching agents, but in reality one long-running implementation/review blocks processing of every later board item in that poll cycle.
- That increases overlap between cron invocations and makes the duplicate-dispatch race above more likely.

### minor: `docs/PIPELINE.md` is not operationally accurate in several places
- The manual invocation example at [`docs/PIPELINE.md:52-59`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/docs/PIPELINE.md#L52 ) says `source scripts/bib-board.env` and then invoke the agent. Sourcing sets shell variables but does not export them to the child `bash` process, so variables such as `BOARD_ID` / `STATUS_FIELD_ID` are not available unless the user also exports them. Manual `gh_move_to` calls will fail.
- The lock section at [`docs/PIPELINE.md:145-167`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/docs/PIPELINE.md#L145 ) describes timeout recovery as the main crash path, but the scripts also remove the lock unconditionally on normal shell exit via [`scripts/agents/_common.sh:75-76`]( /home/werkgeist/.openclaw/workspace/bildung-in-bildern/scripts/agents/_common.sh#L75 ). Many failures therefore unlock immediately, not after timeout.
- The docs imply the poller merely dispatches agents and keeps moving, but the implementation blocks synchronously as noted above.

## Overall
This should not run unattended in its current form. The broken comment query already stops the first two stages, and even after fixing that, the shared-workspace model plus non-atomic lock would make cross-issue interference and duplicate execution likely.
