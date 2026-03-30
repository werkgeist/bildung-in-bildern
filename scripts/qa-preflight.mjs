#!/usr/bin/env node
/**
 * qa-preflight.mjs — QA Pre-Flight Pipeline für LessonSpec v2
 *
 * Prüft eine LessonSpec v2 JSON auf Qualitätskriterien, bevor sie deployed wird.
 *
 * Usage:
 *   node scripts/qa-preflight.mjs <lesson-spec.json> [--asset-dir <dir>]
 *
 * Exit codes:
 *   0 — alle Checks bestanden
 *   1 — mindestens ein Check fehlgeschlagen (Details als JSON auf stdout)
 *
 * Checks:
 *   1. schema             — Zod-Validierung gegen LessonSpec v2
 *   2. answer-uniqueness  — Genau 1 korrekte Antwort pro Frage
 *   3. asset-completeness — Referentielle Integrität aller stepRef; optional Datei-Prüfung
 *   4. step-consistency   — conceptTags + mustInclude nicht leer, sequentielle order
 *   5. distractor-plausibility — testsConcepts überschneidet conceptTags der Lösung
 *
 * Erweiterung:
 *   Neue Check-Funktion hinzufügen + in runAllChecks() eintragen.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// ─── Zod Schema (spiegelt src/lib/lesson-spec-schema.ts) ─────

const QuizOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  stepRef: z.string().optional(),
  isCorrect: z.boolean(),
  distractorReason: z.string().optional(),
});

const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["sequence", "matching", "mc-image", "mc-text"]),
  testsConcepts: z.array(z.string()),
  questionText: z.string().min(1),
  options: z.array(QuizOptionSchema).min(1),
  correctOrderStepRefs: z.array(z.string()).optional(),
  hint: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const LessonStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  label: z.string().min(1),
  alt: z.string().min(1),
  concept: z.string().min(1),
  conceptTags: z.array(z.string()),
  mustInclude: z.array(z.string()),
  mustAvoid: z.array(z.string()).optional(),
  composition: z.string().optional(),
  transitionType: z.string().optional(),
  shotType: z.string().optional(),
  cameraAngle: z.string().optional(),
  wordPictureRelation: z.string().optional(),
  panelSize: z.string().optional(),
});

const LessonSpecSchema = z.object({
  id: z.string().min(1),
  version: z.literal(2),
  locale: z.string().min(2),
  title: z.string().min(1),
  description: z.string().min(1),
  subject: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  learningGoals: z.array(z.string()).min(1),
  prerequisites: z.array(z.string()).optional(),
  steps: z.array(LessonStepSchema).min(1),
  questions: z.array(QuizQuestionSchema).min(1),
  style: z.object({
    artStyle: z.string().min(1),
    background: z.string().min(1),
    colorPalette: z.array(z.string()).optional(),
    negativePrompt: z.string().optional(),
    presetName: z.string().optional(),
    characterDNA: z.string().optional(),
    styleBible: z.string().optional(),
    spatialRules: z.object({ maintainLR: z.boolean() }).optional(),
  }),
  adaptation: z.unknown().optional(),
});

// ─── Check 1: Schema ──────────────────────────────────────────

export function checkSchema(spec) {
  const result = LessonSpecSchema.safeParse(spec);
  if (result.success) {
    return { name: "schema", passed: true, errors: [] };
  }
  const errors = result.error.issues.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return { name: "schema", passed: false, errors };
}

// ─── Check 2: Antwort-Eindeutigkeit ──────────────────────────

export function checkAnswerUniqueness(spec) {
  const errors = [];

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

export function checkAssetCompleteness(spec, assetDir = null) {
  const errors = [];
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
    const optionIds = new Set();
    for (const opt of q.options) {
      if (optionIds.has(opt.id)) {
        errors.push({
          questionId: q.id,
          optionId: opt.id,
          message: `Doppelte Option-ID: "${opt.id}"`,
        });
      }
      optionIds.add(opt.id);

      if (opt.stepRef && !stepIds.has(opt.stepRef)) {
        errors.push({
          questionId: q.id,
          optionId: opt.id,
          message: `stepRef "${opt.stepRef}" verweist auf nicht existierenden Step`,
        });
      }
    }

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

  // Datei-Existenz (nur wenn --asset-dir angegeben)
  if (assetDir) {
    const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".avif"];
    for (const step of spec.steps) {
      const found = IMAGE_EXTENSIONS.some((ext) =>
        existsSync(resolve(assetDir, `${step.id}${ext}`))
      );
      if (!found) {
        errors.push({
          stepId: step.id,
          message: `Kein Bild für Step "${step.id}" in "${assetDir}"`,
        });
      }
    }
  }

  return { name: "asset-completeness", passed: errors.length === 0, errors };
}

// ─── Check 4: Step-Konsistenz ────────────────────────────────

export function checkStepConsistency(spec) {
  const errors = [];

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

export function checkDistractorPlausibility(spec) {
  const errors = [];
  const stepById = Object.fromEntries(spec.steps.map((s) => [s.id, s]));

  for (const q of spec.questions) {
    if (q.type !== "mc-image" && q.type !== "mc-text") continue;

    const correctOpt = q.options.find((o) => o.isCorrect);
    if (!correctOpt) continue;

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

// ─── Alle Checks ──────────────────────────────────────────────

/**
 * @param {unknown} spec
 * @param {{ assetDir?: string }} [options]
 * @returns {{ passed: boolean, lessonId: string, checks: Array }}
 */
export function runAllChecks(spec, options = {}) {
  const { assetDir = null } = options;

  const schemaCheck = checkSchema(spec);

  // Wenn Schema ungültig, restliche Checks überspringen
  if (!schemaCheck.passed) {
    return {
      passed: false,
      lessonId: spec?.id ?? "unknown",
      checks: [schemaCheck],
    };
  }

  const checks = [
    schemaCheck,
    checkAnswerUniqueness(spec),
    checkAssetCompleteness(spec, assetDir),
    checkStepConsistency(spec),
    checkDistractorPlausibility(spec),
  ];

  return {
    passed: checks.every((c) => c.passed),
    lessonId: spec.id,
    checks,
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.error(
      [
        "Usage: node scripts/qa-preflight.mjs <lesson-spec.json> [--asset-dir <dir>]",
        "",
        "Checks:",
        "  1. schema             — Zod-Validierung",
        "  2. answer-uniqueness  — Genau 1 korrekte Antwort pro Frage",
        "  3. asset-completeness — Referentielle Integrität aller stepRef",
        "  4. step-consistency   — conceptTags + mustInclude nicht leer",
        "  5. distractor-plausibility — testsConcepts überschneidet conceptTags",
        "",
        "Exit 0 = alle Checks bestanden",
        "Exit 1 = Fehler (JSON mit Details auf stdout)",
      ].join("\n")
    );
    process.exit(0);
  }

  const specPath = args[0];
  const assetDirIdx = args.indexOf("--asset-dir");
  const assetDir = assetDirIdx !== -1 ? args[assetDirIdx + 1] : null;

  let spec;
  try {
    const raw = readFileSync(resolve(process.cwd(), specPath), "utf-8");
    spec = JSON.parse(raw);
  } catch (err) {
    console.error(`Fehler beim Lesen von "${specPath}": ${err.message}`);
    process.exit(1);
  }

  const result = runAllChecks(spec, { assetDir });
  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    process.exit(1);
  }
}
