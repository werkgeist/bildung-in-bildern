/**
 * Truth Judge — minimal validator for item contracts and position-invariance witnesses.
 *
 * Scoped to test/QA infrastructure (issue #53).
 * No production runtime dependency; import only from __tests__ and QA scripts.
 */

import type {
  ItemContract,
  WitnessPresentation,
} from "@/data/contracts/temperatur-einfach-q-1.contract";

export interface JudgeResult {
  passed: boolean;
  errors: string[];
}

/**
 * Validates one witness against its item contract.
 * Checks: stimulus, semantic truth (correctStepRef at correctIndex), option-set equality.
 */
export function validateWitnessAgainstContract(
  witness: WitnessPresentation,
  contract: ItemContract
): JudgeResult {
  const errors: string[] = [];

  // 1. Stimulus invariance
  if (witness.questionText !== contract.stimulus) {
    errors.push(
      `[${witness.name}] stimulus mismatch: expected "${contract.stimulus}", got "${witness.questionText}"`
    );
  }

  // 2. Semantic truth: option at correctIndex must be the contractual correct step
  const actualCorrect = witness.optionStepRefs[witness.correctIndex];
  if (actualCorrect !== contract.correctStepRef) {
    errors.push(
      `[${witness.name}] correctStepRef mismatch: expected "${contract.correctStepRef}" at index ${witness.correctIndex}, got "${actualCorrect ?? "(undefined)"}"`
    );
  }

  // 3. Option-set equality (order-insensitive)
  if (witness.optionStepRefs.length !== contract.optionStepRefs.length) {
    errors.push(
      `[${witness.name}] option count mismatch: expected ${contract.optionStepRefs.length}, got ${witness.optionStepRefs.length}`
    );
  } else {
    const contractSet = new Set(contract.optionStepRefs);
    const witnessSet = new Set(witness.optionStepRefs);
    for (const ref of witness.optionStepRefs) {
      if (!contractSet.has(ref)) {
        errors.push(
          `[${witness.name}] unexpected option stepRef "${ref}" not in contract`
        );
      }
    }
    for (const ref of contract.optionStepRefs) {
      if (!witnessSet.has(ref)) {
        errors.push(
          `[${witness.name}] missing option stepRef "${ref}" required by contract`
        );
      }
    }
  }

  return { passed: errors.length === 0, errors };
}

/**
 * Validates a witness pair for position invariance.
 * Both witnesses must individually satisfy the contract AND place the correct
 * option at different positions.
 */
export function validatePositionInvariance(
  wA: WitnessPresentation,
  wB: WitnessPresentation,
  contract: ItemContract
): JudgeResult {
  const errors: string[] = [];

  const resultA = validateWitnessAgainstContract(wA, contract);
  const resultB = validateWitnessAgainstContract(wB, contract);
  errors.push(...resultA.errors, ...resultB.errors);

  if (resultA.passed && resultB.passed) {
    if (wA.correctIndex === wB.correctIndex) {
      errors.push(
        `position invariance violated: both witnesses have correct option at index ${wA.correctIndex} — use a different position in one witness`
      );
    }
  }

  return { passed: errors.length === 0, errors };
}
