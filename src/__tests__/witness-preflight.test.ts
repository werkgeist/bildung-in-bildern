/**
 * Witness Preflight gate tests (issue #59).
 *
 * Three groups:
 *   1. JSON witness case — temperatur-einfach-q-1 loads and validates.
 *   2. Preflight runner  — manifest drives validation of all required cases.
 *   3. Rejection gates   — broken inputs are caught.
 */

import { describe, it, expect } from "vitest";
import {
  validateWitnessCase,
  runWitnessPreflight,
  type WitnessCaseJson,
  type WitnessPreflightJson,
} from "@/lib/witness-preflight";
import witnessCaseJson from "@/data/contracts/temperatur-einfach-q-1.witness_case.json";
import preflightJson from "@/data/contracts/witness_preflight.json";

// ─── 1. JSON witness case validates ─────────────────────────────────────────

describe("witness_case.json — temperatur-einfach-q-1", () => {
  const wc = witnessCaseJson as WitnessCaseJson;

  it("caseId matches the item contract", () => {
    expect(wc.caseId).toBe("temperatur-einfach-q-1");
  });

  it("has contractVersion ≥ 1", () => {
    expect(wc.contractVersion).toBeGreaterThanOrEqual(1);
  });

  it("has at least 2 witnesses for position invariance", () => {
    expect(wc.witnesses.length).toBeGreaterThanOrEqual(2);
  });

  it("witnesses place correctIndex at different positions", () => {
    const indices = wc.witnesses.map((w) => w.correctIndex);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("all witnesses share the same stimulus as the contract", () => {
    for (const w of wc.witnesses) {
      expect(w.questionText).toBe(wc.contract.stimulus);
    }
  });

  it("passes full validation through truth-judge", () => {
    const result = validateWitnessCase(wc);
    if (!result.passed) console.error(result.errors);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── 2. Preflight runner ────────────────────────────────────────────────────

describe("witness_preflight.json — gate runner", () => {
  const manifest = preflightJson as WitnessPreflightJson;
  const cases = new Map<string, WitnessCaseJson>([
    ["temperatur-einfach-q-1", witnessCaseJson as WitnessCaseJson],
  ]);

  it("manifest lists temperatur-einfach-q-1 as required", () => {
    expect(manifest.requiredCases).toContain("temperatur-einfach-q-1");
  });

  it("all required cases pass preflight", () => {
    const result = runWitnessPreflight(manifest, cases);
    if (!result.passed) {
      for (const c of result.cases) {
        if (!c.passed) console.error(c.caseId, c.errors);
      }
    }
    expect(result.passed).toBe(true);
  });

  it("each case result includes the caseId", () => {
    const result = runWitnessPreflight(manifest, cases);
    for (const c of result.cases) {
      expect(c.caseId).toBeTruthy();
    }
  });
});

// ─── 3. Rejection gates ─────────────────────────────────────────────────────

describe("witness preflight — rejection gates", () => {
  it("fails when a required case is missing from loadedCases", () => {
    const manifest: WitnessPreflightJson = {
      requiredCases: ["does-not-exist"],
      casePaths: { "does-not-exist": "./nope.json" },
    };
    const result = runWitnessPreflight(manifest, new Map());
    expect(result.passed).toBe(false);
    expect(result.cases[0].errors[0]).toMatch(/not loaded/);
  });

  it("fails when witness case has < 2 witnesses", () => {
    const broken: WitnessCaseJson = {
      caseId: "broken",
      contractVersion: 1,
      contract: {
        itemId: "broken",
        stimulus: "Test?",
        correctStepRef: "step-1",
        optionStepRefs: ["step-1", "step-2"],
      },
      witnesses: [
        {
          name: "only-one",
          questionText: "Test?",
          optionStepRefs: ["step-1", "step-2"],
          correctIndex: 0,
        },
      ],
    };
    const result = validateWitnessCase(broken);
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/≥ 2 witnesses/);
  });

  it("fails when contractVersion < 1", () => {
    const broken: WitnessCaseJson = {
      caseId: "v0",
      contractVersion: 0,
      contract: {
        itemId: "v0",
        stimulus: "Test?",
        correctStepRef: "step-1",
        optionStepRefs: ["step-1", "step-2"],
      },
      witnesses: [
        {
          name: "a",
          questionText: "Test?",
          optionStepRefs: ["step-1", "step-2"],
          correctIndex: 0,
        },
        {
          name: "b",
          questionText: "Test?",
          optionStepRefs: ["step-2", "step-1"],
          correctIndex: 1,
        },
      ],
    };
    const result = validateWitnessCase(broken);
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/contractVersion/);
  });

  it("fails when witness stimulus differs from contract", () => {
    const broken: WitnessCaseJson = {
      caseId: "bad-stimulus",
      contractVersion: 1,
      contract: {
        itemId: "bad-stimulus",
        stimulus: "Original?",
        correctStepRef: "step-1",
        optionStepRefs: ["step-1", "step-2"],
      },
      witnesses: [
        {
          name: "a",
          questionText: "Mutated?",
          optionStepRefs: ["step-1", "step-2"],
          correctIndex: 0,
        },
        {
          name: "b",
          questionText: "Original?",
          optionStepRefs: ["step-2", "step-1"],
          correctIndex: 1,
        },
      ],
    };
    const result = validateWitnessCase(broken);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => /stimulus mismatch/.test(e))).toBe(true);
  });

  it("fails when both witnesses have same correctIndex", () => {
    const broken: WitnessCaseJson = {
      caseId: "same-pos",
      contractVersion: 1,
      contract: {
        itemId: "same-pos",
        stimulus: "Q?",
        correctStepRef: "step-1",
        optionStepRefs: ["step-1", "step-2"],
      },
      witnesses: [
        {
          name: "a",
          questionText: "Q?",
          optionStepRefs: ["step-1", "step-2"],
          correctIndex: 0,
        },
        {
          name: "b",
          questionText: "Q?",
          optionStepRefs: ["step-1", "step-2"],
          correctIndex: 0,
        },
      ],
    };
    const result = validateWitnessCase(broken);
    expect(result.passed).toBe(false);
    expect(
      result.errors.some((e) => /position invariance/.test(e))
    ).toBe(true);
  });
});
