import { describe, it, expect } from "vitest";
import { convertToV1 } from "@/lib/convert-lesson";
import type { LessonSpec, AssetManifest } from "@/types/lesson-spec";

const minimalSpec: LessonSpec = {
  id: "test-lesson",
  version: 2,
  locale: "de",
  title: "Test Lektion",
  description: "Eine Test-Beschreibung",
  subject: "nature",
  difficulty: 1,
  learningGoals: ["Lernziel 1"],
  steps: [
    {
      id: "test-lesson-step-1",
      order: 1,
      label: "Schritt 1",
      alt: "Beschreibung Schritt 1",
      concept: "Konzept 1",
      conceptTags: ["tag1"],
      mustInclude: ["Element 1"],
    },
    {
      id: "test-lesson-step-2",
      order: 2,
      label: "Schritt 2",
      alt: "Beschreibung Schritt 2",
      concept: "Konzept 2",
      conceptTags: ["tag2"],
      mustInclude: ["Element 2"],
    },
  ],
  questions: [
    {
      id: "test-lesson-q-1",
      type: "mc-image",
      testsConcepts: ["tag1", "tag2"],
      questionText: "Welches Bild zeigt Schritt 2?",
      options: [
        {
          id: "test-lesson-q-1-opt-1",
          label: "Schritt 1",
          stepRef: "test-lesson-step-1",
          isCorrect: false,
        },
        {
          id: "test-lesson-q-1-opt-2",
          label: "Schritt 2",
          stepRef: "test-lesson-step-2",
          isCorrect: true,
        },
      ],
      difficulty: 1,
    },
  ],
  style: {
    artStyle: "flat-vector",
    background: "white",
  },
};

const manifest: AssetManifest = {
  lessonId: "test-lesson",
  generatedAt: "2026-01-01T00:00:00Z",
  model: "FLUX.2-dev",
  assets: [
    { refId: "test-lesson-step-1", src: "/images/test/01.webp", prompt: "" },
    { refId: "test-lesson-step-2", src: "/images/test/02.webp", prompt: "" },
  ],
};

describe("convertToV1", () => {
  it("copies id, title, description from spec", () => {
    const v1 = convertToV1(minimalSpec, manifest);
    expect(v1.id).toBe("test-lesson");
    expect(v1.title).toBe("Test Lektion");
    expect(v1.description).toBe("Eine Test-Beschreibung");
  });

  it("maps all steps to sequence", () => {
    const v1 = convertToV1(minimalSpec, manifest);
    expect(v1.sequence).toHaveLength(2);
  });

  it("resolves step src from asset manifest", () => {
    const v1 = convertToV1(minimalSpec, manifest);
    expect(v1.sequence[0]).toEqual({
      id: "test-lesson-step-1",
      src: "/images/test/01.webp",
      label: "Schritt 1",
      alt: "Beschreibung Schritt 1",
    });
    expect(v1.sequence[1].src).toBe("/images/test/02.webp");
  });

  it("converts mc-image questions", () => {
    const v1 = convertToV1(minimalSpec, manifest);
    expect(v1.questions).toHaveLength(1);
    const q = v1.questions[0];
    expect(q.id).toBe("test-lesson-q-1");
    expect(q.questionText).toBe("Welches Bild zeigt Schritt 2?");
  });

  it("sets correctOptionId from the isCorrect option", () => {
    const v1 = convertToV1(minimalSpec, manifest);
    expect(v1.questions[0].correctOptionId).toBe("test-lesson-q-1-opt-2");
  });

  it("resolves option imageSrc via stepRef → asset manifest", () => {
    const v1 = convertToV1(minimalSpec, manifest);
    const opts = v1.questions[0].options;
    expect(opts[0].imageSrc).toBe("/images/test/01.webp");
    expect(opts[1].imageSrc).toBe("/images/test/02.webp");
  });

  it("skips non-mc-image questions (sequence type)", () => {
    const specWithSequenceQ: LessonSpec = {
      ...minimalSpec,
      questions: [
        ...minimalSpec.questions,
        {
          id: "test-lesson-q-2",
          type: "sequence",
          testsConcepts: ["tag1"],
          questionText: "Richtige Reihenfolge?",
          options: [
            { id: "test-lesson-q-2-opt-1", label: "Option A", isCorrect: true },
          ],
          correctOrderStepRefs: ["test-lesson-step-1", "test-lesson-step-2"],
          difficulty: 1,
        },
      ],
    };
    const v1 = convertToV1(specWithSequenceQ, manifest);
    expect(v1.questions).toHaveLength(1);
    expect(v1.questions[0].id).toBe("test-lesson-q-1");
  });

  it("falls back to empty string when asset is missing from manifest", () => {
    const emptyManifest: AssetManifest = {
      lessonId: "test-lesson",
      generatedAt: "2026-01-01T00:00:00Z",
      model: "FLUX.2-dev",
      assets: [],
    };
    const v1 = convertToV1(minimalSpec, emptyManifest);
    expect(v1.sequence[0].src).toBe("");
    expect(v1.questions[0].options[0].imageSrc).toBe("");
  });

  it("option without stepRef gets empty imageSrc", () => {
    const specWithNoStepRef: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          id: "test-lesson-q-3",
          type: "mc-image",
          testsConcepts: ["tag1"],
          questionText: "Frage ohne stepRef?",
          options: [
            { id: "test-lesson-q-3-opt-1", label: "Option A", isCorrect: true },
          ],
          difficulty: 1,
        },
      ],
    };
    const v1 = convertToV1(specWithNoStepRef, manifest);
    expect(v1.questions[0].options[0].imageSrc).toBe("");
  });
});
