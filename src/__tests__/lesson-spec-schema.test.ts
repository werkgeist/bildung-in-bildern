import { describe, it, expect } from "vitest";
import { LessonSpecSchema } from "@/lib/lesson-spec-schema";
import schmetterlingSpec from "@/data/examples/schmetterling-spec.json";
import wasserkreislaufSpec from "@/data/examples/wasserkreislauf-spec.json";

describe("LessonSpecSchema", () => {
  it("validates schmetterling-spec.json successfully", () => {
    const result = LessonSpecSchema.safeParse(schmetterlingSpec);
    expect(result.success).toBe(true);
  });

  it("validates wasserkreislauf-spec.json successfully", () => {
    const result = LessonSpecSchema.safeParse(wasserkreislaufSpec);
    expect(result.success).toBe(true);
  });

  it("rejects spec with version !== 2", () => {
    const invalid = { ...schmetterlingSpec, version: 1 };
    const result = LessonSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects spec missing required id field", () => {
    const { id: _id, ...withoutId } = schmetterlingSpec;
    const result = LessonSpecSchema.safeParse(withoutId);
    expect(result.success).toBe(false);
  });

  it("rejects spec with empty steps array", () => {
    const invalid = { ...schmetterlingSpec, steps: [] };
    const result = LessonSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects spec with invalid difficulty (out of 1-3 range)", () => {
    const invalid = { ...schmetterlingSpec, difficulty: 5 };
    const result = LessonSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects spec with unknown question type", () => {
    const invalid = {
      ...schmetterlingSpec,
      questions: [
        {
          ...schmetterlingSpec.questions[0],
          type: "drag-drop",
        },
      ],
    };
    const result = LessonSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts spec with optional fields omitted", () => {
    const minimal = {
      id: "minimal-test",
      version: 2,
      locale: "de",
      title: "Minimal",
      description: "Minimal description",
      subject: "nature",
      difficulty: 1,
      learningGoals: ["Ziel 1"],
      steps: [
        {
          id: "minimal-test-step-1",
          order: 1,
          label: "Schritt",
          alt: "Alt text",
          concept: "Konzept",
          conceptTags: [],
          mustInclude: [],
        },
      ],
      questions: [
        {
          id: "minimal-test-q-1",
          type: "mc-image",
          testsConcepts: [],
          questionText: "Frage?",
          options: [{ id: "opt-1", label: "Option A", isCorrect: true }],
          difficulty: 1,
        },
      ],
      style: {
        artStyle: "flat-vector",
        background: "white",
      },
    };
    const result = LessonSpecSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});
