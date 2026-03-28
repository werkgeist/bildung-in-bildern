import type { LessonSpec, AssetManifest, LessonV1 } from "@/types/lesson-spec";

/**
 * Converts a LessonSpec v2 + AssetManifest into the legacy LessonV1 format
 * used by the runtime (SequenceViewer, Quiz).
 *
 * Only `mc-image` questions are converted — other types (sequence, matching,
 * mc-text) have no direct equivalent in the v1 format and are skipped.
 */
export function convertToV1(spec: LessonSpec, assets: AssetManifest): LessonV1 {
  const assetMap = new Map(assets.assets.map((a) => [a.refId, a.src]));

  const sequence = spec.steps.map((step) => ({
    id: step.id,
    src: assetMap.get(step.id) ?? "",
    label: step.label,
    alt: step.alt,
  }));

  const questions = spec.questions
    .filter((q) => q.type === "mc-image")
    .map((q) => {
      const correctOption = q.options.find((o) => o.isCorrect);
      return {
        id: q.id,
        questionText: q.questionText,
        options: q.options.map((opt) => ({
          id: opt.id,
          imageSrc: opt.stepRef ? (assetMap.get(opt.stepRef) ?? "") : "",
          label: opt.label,
        })),
        correctOptionId: correctOption?.id ?? "",
      };
    });

  return {
    id: spec.id,
    title: spec.title,
    description: spec.description,
    sequence,
    questions,
  };
}
