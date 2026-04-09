/**
 * pipeline-guard.ts — Pure logic for pipeline marker validation
 *
 * Mirrors the REQUIRED_MARKERS check in scripts/poll-board.mjs.
 * Keep both in sync when adding new markers.
 *
 * Markers are HTML comments posted as GitHub issue comments by each agent stage.
 * A Done/closed issue MUST have all three before the guard allows it to stay closed.
 *
 * Rollout boundary: only issues >= GUARD_MIN_ISSUE are subject to the guard.
 * Issues below this threshold pre-date the pipeline and lack markers by design.
 */

/**
 * First issue number subject to the pipeline guard.
 * Issues with number < GUARD_MIN_ISSUE are exempt (historical, pre-pipeline).
 * Rationale: #52 introduced the guard; everything before it was closed without markers.
 */
export const GUARD_MIN_ISSUE = 52;

export interface MarkerResult {
  key: string;
  label: string;
  /** STATUS_* key into the bib-board.env config — used by poll-board.mjs */
  targetStatus: string;
  found: boolean;
}

/**
 * Ordered list of required pipeline markers.
 * Order matters: targetColumnForMissing() returns the earliest missing stage.
 */
export const REQUIRED_MARKERS: ReadonlyArray<{
  key: string;
  label: string;
  targetStatus: string;
  pattern: RegExp;
}> = [
  {
    key: 'dev',
    // Accept both agent:dev:v1 (new) and agent:implement:v1 (legacy, emitted before #52)
    pattern: /agent:(?:dev|implement):v1/,
    targetStatus: 'STATUS_IN_PROGRESS',
    label: 'Implementierung',
  },
  {
    key: 'review',
    pattern: /agent:review:v1/,
    targetStatus: 'STATUS_CODE_REVIEW',
    label: 'Code Review',
  },
  {
    key: 'test',
    pattern: /agent:test:v1/,
    targetStatus: 'STATUS_TESTING',
    label: 'Testing',
  },
] as const;

/**
 * Check which required markers are present in the concatenated comments text.
 * @param commentsText  Full text of all issue comments joined into one string.
 */
export function checkPipelineMarkers(commentsText: string): MarkerResult[] {
  return REQUIRED_MARKERS.map((m) => ({
    key: m.key,
    label: m.label,
    targetStatus: m.targetStatus,
    found: m.pattern.test(commentsText),
  }));
}

/**
 * Given marker check results, return the STATUS_* key for the earliest missing stage.
 * Returns null if all markers are present (issue may stay Done/closed).
 */
export function targetColumnForMissing(results: MarkerResult[]): string | null {
  for (const m of results) {
    if (!m.found) return m.targetStatus;
  }
  return null;
}

/**
 * Convenience: returns true if ANY required marker is missing.
 * Use this as the top-level guard predicate.
 */
export function needsGuard(commentsText: string): boolean {
  return checkPipelineMarkers(commentsText).some((m) => !m.found);
}

/**
 * Returns true if the issue is subject to the pipeline guard.
 * Issues below GUARD_MIN_ISSUE pre-date the pipeline and are always exempt.
 */
export function isGuardEligible(issueNumber: number): boolean {
  return issueNumber >= GUARD_MIN_ISSUE;
}
