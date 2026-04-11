/**
 * Versioned item contract for temperatur-einfach-q-1.
 *
 * This file is the single source of truth for the item's invariants.
 * Bump CONTRACT_VERSION on any breaking change (stimulus, correctStepRef,
 * or option set). Additive changes (comments, name) do not require a bump.
 *
 * Related: GitHub #53 — Truth Judge slice, position-invariance gate.
 */

export const CONTRACT_VERSION = 1 as const;

/** Stable, version-tagged descriptor of one quiz item's invariants. */
export interface ItemContract {
  contractVersion: number;
  itemId: string;
  /** Question text shown to the learner — identical in every presentation. */
  stimulus: string;
  /** The step that is semantically correct. */
  correctStepRef: string;
  /** Complete set of option step-refs — order-insensitive. */
  optionStepRefs: string[];
}

/** A concrete, ordered presentation of the item for invariance testing. */
export interface WitnessPresentation {
  /** Human-readable label for debugging (e.g. "witness-a (correct@0)"). */
  name: string;
  questionText: string;
  /** Step-refs in the order they are presented, left-to-right / top-to-bottom. */
  optionStepRefs: string[];
  /** Zero-based index of the correct option in optionStepRefs. */
  correctIndex: number;
}

// ─── Contract ────────────────────────────────────────────────────────────────

export const temperaturEinfachQ1Contract: ItemContract = {
  contractVersion: CONTRACT_VERSION,
  itemId: "temperatur-einfach-q-1",
  stimulus: "Welches Bild zeigt warm?",
  correctStepRef: "temperatur-einfach-step-3", // Frühlingswiese mit Sonne und Blumen
  optionStepRefs: [
    "temperatur-einfach-step-3", // correct  — warm   (Frühling)
    "temperatur-einfach-step-1", // distractor — kalt  (Schnee)
    "temperatur-einfach-step-2", // distractor — kühl  (Herbst)
  ],
};

// ─── Witness pair (position-invariance counterprobe) ─────────────────────────

/** Witness A — correct option at position 0. */
export const witnessA: WitnessPresentation = {
  name: "witness-a (correct@0)",
  questionText: "Welches Bild zeigt warm?",
  optionStepRefs: [
    "temperatur-einfach-step-3", // position 0 — CORRECT (warm)
    "temperatur-einfach-step-1", // position 1 — distractor (kalt)
    "temperatur-einfach-step-2", // position 2 — distractor (kühl)
  ],
  correctIndex: 0,
};

/**
 * Witness B — correct option at position 2.
 * Same stimulus, same semantic truth, same option set as Witness A.
 * Only the correct-answer position differs → counterprobe for position invariance.
 */
export const witnessB: WitnessPresentation = {
  name: "witness-b (correct@2)",
  questionText: "Welches Bild zeigt warm?",
  optionStepRefs: [
    "temperatur-einfach-step-1", // position 0 — distractor (kalt)
    "temperatur-einfach-step-2", // position 1 — distractor (kühl)
    "temperatur-einfach-step-3", // position 2 — CORRECT (warm)
  ],
  correctIndex: 2,
};
