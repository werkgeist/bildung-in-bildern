/**
 * qa-checks.ts — QA Pre-Flight Checks für LessonSpec v2
 *
 * Deterministisch, ohne LLM. Läuft vor Deploy / CI.
 *
 * Checks:
 *   1. schema             — Zod-Validierung gegen LessonSpecSchema
 *   2. answer-uniqueness  — Genau 1 korrekte Antwort pro Frage, keine doppelten Labels
 *   3. asset-completeness — Alle stepRef zeigen auf existierende Steps; optionale Datei-Prüfung
 *   4. step-consistency   — conceptTags + mustInclude nicht leer, sequentielle order
 *   5. distractor-plausibility — testsConcepts überschneidet sich mit conceptTags der Lösung
 *
 * Erweiterung: Neue Check-Funktion exportieren + in ALL_CHECKS eintragen.
 *
 * Usage (TypeScript/Tests):
 *   import { runAllChecks } from "@/lib/qa-checks";
 *   const result = runAllChecks(spec);
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { LessonSpecSchema } from "@/lib/lesson-spec-schema";
import type { LessonSpec } from "@/types/lesson-spec";

// ─── Output Types ─────────────────────────────────────────────

export interface QAError {
  stepId?: string;
  questionId?: string;
  optionId?: string;
  path?: string;
  message: string;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  errors: QAError[];
}

export interface QAResult {
  passed: boolean;
  lessonId: string;
  checks: CheckResult[];
}

export interface QAOptions {
  /** Verzeichnis mit generierten Bildern — prüft Datei-Existenz pro Step-ID */
  assetDir?: string;
}

// ─── Check 1: Schema ──────────────────────────────────────────

export function checkSchema(spec: unknown): CheckResult {
  const result = LessonSpecSchema.safeParse(spec);
  if (result.success) {
    return { name: "schema", passed: true, errors: [] };
  }
  const errors: QAError[] = result.error.issues.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return { name: "schema", passed: false, errors };
}

// ─── Check 2: Antwort-Eindeutigkeit ──────────────────────────

export function checkAnswerUniqueness(spec: LessonSpec): CheckResult {
  const errors: QAError[] = [];

  for (const q of spec.questions) {
    if (q.type === "mc-image" || q.type === "mc-text") {
      const correctOpts = q.options.filter((o) => o.isCorrect);

      if (correctOpts.length === 0) {
        errors.push({
          questionId: q.id,
          message:
            "Keine korrekte Antwort (isCorrect=true muss bei genau 1 Option gesetzt sein)",
        });
      } else if (correctOpts.length > 1) {
        errors.push({
          questionId: q.id,
          message: `${correctOpts.length} Optionen mit isCorrect=true — genau 1 erwartet`,
        });
      }

      // Label-Duplikate
      const labels = q.options.map((o) => o.label.toLowerCase().trim());
      const labelSet = new Set(labels);
      if (labelSet.size < labels.length) {
        errors.push({
          questionId: q.id,
          message: "Doppelte Option-Labels in der Frage",
        });
      }

      // Distraktor-Label ≠ korrekte Label
      const correctLabel = correctOpts[0]?.label.toLowerCase().trim();
      if (correctLabel) {
        for (const opt of q.options) {
          if (!opt.isCorrect && opt.label.toLowerCase().trim() === correctLabel) {
            errors.push({
              questionId: q.id,
              optionId: opt.id,
              message: `Distraktor-Label identisch mit korrekter Antwort: "${opt.label}"`,
            });
          }
        }
      }
    } else if (q.type === "sequence") {
      if (!q.correctOrderStepRefs || q.correctOrderStepRefs.length < 2) {
        errors.push({
          questionId: q.id,
          message:
            "Sequence-Frage braucht mindestens 2 Einträge in correctOrderStepRefs",
        });
      } else {
        const refSet = new Set(q.correctOrderStepRefs);
        if (refSet.size < q.correctOrderStepRefs.length) {
          errors.push({
            questionId: q.id,
            message: "Duplikate in correctOrderStepRefs",
          });
        }
      }
    } else if (q.type === "matching") {
      const correctOpts = q.options.filter((o) => o.isCorrect);
      if (correctOpts.length === 0) {
        errors.push({
          questionId: q.id,
          message: "Matching-Frage hat keine korrekte Option",
        });
      }
    }
  }

  return { name: "answer-uniqueness", passed: errors.length === 0, errors };
}

// ─── Check 3: Asset-Vollständigkeit ──────────────────────────

export function checkAssetCompleteness(
  spec: LessonSpec,
  assetDir?: string
): CheckResult {
  const errors: QAError[] = [];
  const stepIds = new Set(spec.steps.map((s) => s.id));

  // Doppelte Step-IDs
  if (stepIds.size < spec.steps.length) {
    errors.push({ message: "Doppelte Step-IDs in spec.steps" });
  }

  // Doppelte Fragen-IDs
  const questionIds = new Set(spec.questions.map((q) => q.id));
  if (questionIds.size < spec.questions.length) {
    errors.push({ message: "Doppelte Fragen-IDs in spec.questions" });
  }

  for (const q of spec.questions) {
    // Doppelte Option-IDs innerhalb einer Frage
    const optionIds = new Set<string>();
    for (const opt of q.options) {
      if (optionIds.has(opt.id)) {
        errors.push({
          questionId: q.id,
          optionId: opt.id,
          message: `Doppelte Option-ID: "${opt.id}"`,
        });
      }
      optionIds.add(opt.id);

      // stepRef zeigt auf existierenden Step
      if (opt.stepRef && !stepIds.has(opt.stepRef)) {
        errors.push({
          questionId: q.id,
          optionId: opt.id,
          message: `stepRef "${opt.stepRef}" verweist auf nicht existierenden Step`,
        });
      }
    }

    // correctOrderStepRefs für sequence
    if (q.type === "sequence" && q.correctOrderStepRefs) {
      for (const ref of q.correctOrderStepRefs) {
        if (!stepIds.has(ref)) {
          errors.push({
            questionId: q.id,
            message: `correctOrderStepRef "${ref}" verweist auf nicht existierenden Step`,
          });
        }
      }
    }
  }

  // Datei-Existenz (nur wenn assetDir angegeben)
  if (assetDir) {
    const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".avif"];
    for (const step of spec.steps) {
      const found = IMAGE_EXTENSIONS.some((ext) =>
        existsSync(resolve(assetDir, `${step.id}${ext}`))
      );
      if (!found) {
        errors.push({
          stepId: step.id,
          message: `Kein Bild für Step "${step.id}" in "${assetDir}" (gesucht: ${IMAGE_EXTENSIONS.map((e) => step.id + e).join(", ")})`,
        });
      }
    }
  }

  return { name: "asset-completeness", passed: errors.length === 0, errors };
}

// ─── Check 4: Step-Konsistenz ────────────────────────────────

export function checkStepConsistency(spec: LessonSpec): CheckResult {
  const errors: QAError[] = [];

  // order muss 1..N sequentiell sein
  const orders = [...spec.steps.map((s) => s.order)].sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      errors.push({
        message: `Step-order nicht sequentiell: erwartet ${i + 1}, gefunden ${orders[i]}`,
      });
      break;
    }
  }

  for (const step of spec.steps) {
    if (!step.conceptTags || step.conceptTags.length === 0) {
      errors.push({
        stepId: step.id,
        message: "conceptTags ist leer — mindestens 1 Tag erforderlich",
      });
    }

    if (!step.mustInclude || step.mustInclude.length === 0) {
      errors.push({
        stepId: step.id,
        message: "mustInclude ist leer — mindestens 1 Bild-Anforderung erforderlich",
      });
    }

    if (!step.concept?.trim()) {
      errors.push({ stepId: step.id, message: "concept ist leer" });
    }

    if (!step.alt?.trim()) {
      errors.push({
        stepId: step.id,
        message: "alt ist leer (Barrierefreiheit!)",
      });
    }
  }

  return { name: "step-consistency", passed: errors.length === 0, errors };
}

// ─── Check 5: Distraktor-Plausibilität ───────────────────────

export function checkDistractorPlausibility(spec: LessonSpec): CheckResult {
  const errors: QAError[] = [];
  const stepById = Object.fromEntries(spec.steps.map((s) => [s.id, s]));

  for (const q of spec.questions) {
    if (q.type !== "mc-image" && q.type !== "mc-text") continue;

    const correctOpt = q.options.find((o) => o.isCorrect);
    if (!correctOpt) continue; // Bereits von Check 2 abgedeckt

    // testsConcepts überschneidet conceptTags der korrekten Antwort
    if (correctOpt.stepRef && q.testsConcepts.length > 0) {
      const correctStep = stepById[correctOpt.stepRef];
      if (correctStep) {
        const conceptSet = new Set(correctStep.conceptTags);
        const hasOverlap = q.testsConcepts.some((tag) => conceptSet.has(tag));
        if (!hasOverlap) {
          errors.push({
            questionId: q.id,
            message: `testsConcepts [${q.testsConcepts.join(", ")}] überschneidet sich nicht mit conceptTags der korrekten Antwort [${correctStep.conceptTags.join(", ")}]`,
          });
        }
      }
    }

    // Kein Distraktor zeigt auf denselben Step wie die korrekte Antwort
    for (const opt of q.options) {
      if (!opt.isCorrect && opt.stepRef && opt.stepRef === correctOpt.stepRef) {
        errors.push({
          questionId: q.id,
          optionId: opt.id,
          message: `Distraktor zeigt auf denselben Step wie korrekte Antwort: "${opt.stepRef}"`,
        });
      }
    }
  }

  return {
    name: "distractor-plausibility",
    passed: errors.length === 0,
    errors,
  };
}

// ─── Alle Checks zusammen ─────────────────────────────────────

export function runAllChecks(spec: unknown, options: QAOptions = {}): QAResult {
  const schemaCheck = checkSchema(spec);

  // Wenn Schema-Check fehlschlägt, restliche Checks überspringen
  if (!schemaCheck.passed) {
    return {
      passed: false,
      lessonId: (spec as { id?: string })?.id ?? "unknown",
      checks: [schemaCheck],
    };
  }

  const validSpec = spec as LessonSpec;
  const checks: CheckResult[] = [
    schemaCheck,
    checkAnswerUniqueness(validSpec),
    checkAssetCompleteness(validSpec, options.assetDir),
    checkStepConsistency(validSpec),
    checkDistractorPlausibility(validSpec),
  ];

  return {
    passed: checks.every((c) => c.passed),
    lessonId: validSpec.id,
    checks,
  };
}
