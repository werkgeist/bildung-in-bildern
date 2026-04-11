/**
 * Truth Judge gate for temperatur-einfach-q-1 (issue #53).
 *
 * Three test groups:
 *   1. Contract anchoring — contract is consistent with the live spec.
 *   2. Witness pair       — both witnesses satisfy the contract.
 *   3. Violation gates    — validator correctly rejects broken inputs.
 */

import { describe, it, expect } from "vitest";
import {
  temperaturEinfachQ1Contract,
  witnessA,
  witnessB,
  CONTRACT_VERSION,
} from "@/data/contracts/temperatur-einfach-q-1.contract";
import {
  validateWitnessAgainstContract,
  validatePositionInvariance,
} from "@/lib/truth-judge";
import temperaturSpec from "@/data/examples/temperatur-spec.json";

// ─── 1. Contract anchoring ────────────────────────────────────────────────────

describe("temperatur-einfach-q-1 contract — anchored to spec", () => {
  const q1 = temperaturSpec.questions.find(
    (q) => q.id === "temperatur-einfach-q-1"
  );

  it("contract has a positive version number", () => {
    expect(CONTRACT_VERSION).toBeGreaterThan(0);
    expect(temperaturEinfachQ1Contract.contractVersion).toBe(CONTRACT_VERSION);
  });

  it("itemId resolves to an existing question in the spec", () => {
    expect(q1).toBeDefined();
  });

  it("stimulus matches the spec questionText", () => {
    expect(temperaturEinfachQ1Contract.stimulus).toBe(q1!.questionText);
  });

  it("correctStepRef matches the spec's correct option", () => {
    const correctOpt = q1!.options.find((o) => o.isCorrect);
    expect(temperaturEinfachQ1Contract.correctStepRef).toBe(correctOpt?.stepRef);
  });

  it("optionStepRefs match the spec options (order-insensitive)", () => {
    const specRefs = q1!.options.map((o) => o.stepRef).sort();
    const contractRefs = [...temperaturEinfachQ1Contract.optionStepRefs].sort();
    expect(contractRefs).toEqual(specRefs);
  });

  it("optionStepRefs has no duplicates", () => {
    const refs = temperaturEinfachQ1Contract.optionStepRefs;
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("correctStepRef is in optionStepRefs", () => {
    expect(temperaturEinfachQ1Contract.optionStepRefs).toContain(
      temperaturEinfachQ1Contract.correctStepRef
    );
  });
});

// ─── 2. Witness pair ──────────────────────────────────────────────────────────

describe("temperatur-einfach-q-1 witness pair — position invariance", () => {
  it("witness A is valid against the contract", () => {
    const result = validateWitnessAgainstContract(
      witnessA,
      temperaturEinfachQ1Contract
    );
    if (!result.passed) console.error(result.errors);
    expect(result.passed).toBe(true);
  });

  it("witness B is valid against the contract", () => {
    const result = validateWitnessAgainstContract(
      witnessB,
      temperaturEinfachQ1Contract
    );
    if (!result.passed) console.error(result.errors);
    expect(result.passed).toBe(true);
  });

  it("witness pair passes position-invariance gate", () => {
    const result = validatePositionInvariance(
      witnessA,
      witnessB,
      temperaturEinfachQ1Contract
    );
    if (!result.passed) console.error(result.errors);
    expect(result.passed).toBe(true);
  });

  it("witnesses share the same stimulus", () => {
    expect(witnessA.questionText).toBe(witnessB.questionText);
  });

  it("witnesses share the same semantic truth (correctStepRef)", () => {
    expect(witnessA.optionStepRefs[witnessA.correctIndex]).toBe(
      witnessB.optionStepRefs[witnessB.correctIndex]
    );
  });

  it("witnesses place the correct option at different positions", () => {
    expect(witnessA.correctIndex).not.toBe(witnessB.correctIndex);
  });

  it("witnesses have the same option set (order-insensitive)", () => {
    const setA = [...witnessA.optionStepRefs].sort();
    const setB = [...witnessB.optionStepRefs].sort();
    expect(setA).toEqual(setB);
  });
});

// ─── 3. Violation gates ───────────────────────────────────────────────────────

describe("truth-judge — validator rejects violations", () => {
  it("fails when stimulus is mutated", () => {
    const mutated = { ...witnessA, questionText: "Was ist warm?" };
    const result = validateWitnessAgainstContract(
      mutated,
      temperaturEinfachQ1Contract
    );
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/stimulus mismatch/);
  });

  it("fails when correctIndex points to a distractor", () => {
    // correctIndex=1 but position 1 is the kalt distractor
    const mutated = { ...witnessA, correctIndex: 1 };
    const result = validateWitnessAgainstContract(
      mutated,
      temperaturEinfachQ1Contract
    );
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => /correctStepRef mismatch/.test(e))).toBe(
      true
    );
  });

  it("fails when an option is swapped for a foreign step", () => {
    const mutated = {
      ...witnessA,
      optionStepRefs: [
        "temperatur-einfach-step-3",
        "temperatur-einfach-step-1",
        "temperatur-einfach-step-4", // step-4 (heiß) not in contract
      ],
    };
    const result = validateWitnessAgainstContract(
      mutated,
      temperaturEinfachQ1Contract
    );
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => /unexpected option stepRef/.test(e))).toBe(
      true
    );
  });

  it("fails when option count differs from contract", () => {
    const mutated = {
      ...witnessA,
      optionStepRefs: [
        "temperatur-einfach-step-3",
        "temperatur-einfach-step-1",
      ],
    };
    const result = validateWitnessAgainstContract(
      mutated,
      temperaturEinfachQ1Contract
    );
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => /option count mismatch/.test(e))).toBe(
      true
    );
  });

  it("fails position invariance when both witnesses use the same correct index", () => {
    const samePosition = { ...witnessB, correctIndex: witnessA.correctIndex };
    // Adjust optionStepRefs so the (now-wrong) correctIndex still points to step-3
    const adjusted = {
      ...samePosition,
      optionStepRefs: [
        "temperatur-einfach-step-3", // index 0 matches witnessA.correctIndex=0
        "temperatur-einfach-step-1",
        "temperatur-einfach-step-2",
      ],
    };
    const result = validatePositionInvariance(
      witnessA,
      adjusted,
      temperaturEinfachQ1Contract
    );
    expect(result.passed).toBe(false);
    expect(
      result.errors.some((e) => /position invariance violated/.test(e))
    ).toBe(true);
  });
});
