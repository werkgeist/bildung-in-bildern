/**
 * Witness Preflight — JSON-driven gate for item-contract + position-invariance checks.
 *
 * Loads witness_case.json files referenced by witness_preflight.json and validates
 * each case through the Truth Judge (issue #53). Fails fast on any violation.
 *
 * Related: GitHub #59
 */

import type {
  ItemContract,
  WitnessPresentation,
} from "@/data/contracts/temperatur-einfach-q-1.contract";
import {
  validateWitnessAgainstContract,
  validatePositionInvariance,
  type JudgeResult,
} from "@/lib/truth-judge";

// ─── JSON shapes ────────────────────────────────────────────────────────────

export interface WitnessCaseJson {
  caseId: string;
  contractVersion: number;
  contract: {
    itemId: string;
    stimulus: string;
    correctStepRef: string;
    optionStepRefs: string[];
  };
  witnesses: Array<{
    name: string;
    questionText: string;
    optionStepRefs: string[];
    correctIndex: number;
  }>;
}

export interface WitnessPreflightJson {
  description?: string;
  requiredCases: string[];
  casePaths: Record<string, string>;
}

// ─── Per-case result ────────────────────────────────────────────────────────

export interface CaseResult {
  caseId: string;
  passed: boolean;
  errors: string[];
}

export interface PreflightResult {
  passed: boolean;
  cases: CaseResult[];
}

// ─── Validate one witness case ──────────────────────────────────────────────

export function validateWitnessCase(wc: WitnessCaseJson): CaseResult {
  const errors: string[] = [];

  // Basic structural checks
  if (!wc.caseId) {
    errors.push("caseId is missing");
  }
  if (wc.contractVersion < 1) {
    errors.push(`contractVersion must be ≥ 1, got ${wc.contractVersion}`);
  }
  if (wc.witnesses.length < 2) {
    errors.push(
      `need ≥ 2 witnesses for position-invariance, got ${wc.witnesses.length}`
    );
  }

  if (errors.length > 0) {
    return { caseId: wc.caseId ?? "(unknown)", passed: false, errors };
  }

  // Map JSON to truth-judge types
  const contract: ItemContract = {
    contractVersion: wc.contractVersion,
    itemId: wc.contract.itemId,
    stimulus: wc.contract.stimulus,
    correctStepRef: wc.contract.correctStepRef,
    optionStepRefs: wc.contract.optionStepRefs,
  };

  const witnesses: WitnessPresentation[] = wc.witnesses.map((w) => ({
    name: w.name,
    questionText: w.questionText,
    optionStepRefs: w.optionStepRefs,
    correctIndex: w.correctIndex,
  }));

  // Validate each witness against contract
  for (const w of witnesses) {
    const r: JudgeResult = validateWitnessAgainstContract(w, contract);
    errors.push(...r.errors);
  }

  // Validate position invariance across consecutive witness pairs
  for (let i = 0; i < witnesses.length - 1; i++) {
    const r = validatePositionInvariance(
      witnesses[i],
      witnesses[i + 1],
      contract
    );
    // Filter out errors already captured by individual witness validation
    const pairOnly = r.errors.filter((e) =>
      /position invariance/.test(e)
    );
    errors.push(...pairOnly);
  }

  return { caseId: wc.caseId, passed: errors.length === 0, errors };
}

// ─── Run full preflight ─────────────────────────────────────────────────────

/**
 * Validates all witness cases listed in a preflight manifest.
 * Pass the already-loaded JSON objects — file I/O is the caller's concern.
 */
export function runWitnessPreflight(
  manifest: WitnessPreflightJson,
  loadedCases: Map<string, WitnessCaseJson>
): PreflightResult {
  const cases: CaseResult[] = [];

  for (const caseId of manifest.requiredCases) {
    const wc = loadedCases.get(caseId);
    if (!wc) {
      cases.push({
        caseId,
        passed: false,
        errors: [
          `witness case "${caseId}" listed in preflight but not loaded`,
        ],
      });
      continue;
    }
    cases.push(validateWitnessCase(wc));
  }

  return {
    passed: cases.every((c) => c.passed),
    cases,
  };
}
