import { describe, it, expect } from "vitest";
import type {
  LessonSpec,
  LessonStep,
  StylePreset,
} from "@/types/lesson-spec";
import wasserkreislauf from "@/data/examples/wasserkreislauf-spec.json";
import schmetterling from "@/data/examples/schmetterling-spec.json";

const spec = wasserkreislauf as LessonSpec;

describe("LessonSpec Visual Director fields — TypeScript types", () => {
  it("LessonStep accepts all optional visual director fields", () => {
    const step: LessonStep = {
      id: "test-step-1",
      order: 1,
      label: "Test",
      alt: "Test alt",
      concept: "Test concept",
      conceptTags: ["test"],
      mustInclude: ["something"],
      transitionType: "action-to-action",
      shotType: "wide",
      cameraAngle: "eye-level",
      wordPictureRelation: "interdependent",
      panelSize: "large",
    };
    expect(step.transitionType).toBe("action-to-action");
    expect(step.shotType).toBe("wide");
    expect(step.cameraAngle).toBe("eye-level");
    expect(step.wordPictureRelation).toBe("interdependent");
    expect(step.panelSize).toBe("large");
  });

  it("LessonStep is valid without visual director fields (backward-compat)", () => {
    const step: LessonStep = {
      id: "test-step-2",
      order: 2,
      label: "Test",
      alt: "Test alt",
      concept: "Test concept",
      conceptTags: ["test"],
      mustInclude: ["something"],
    };
    expect(step.transitionType).toBeUndefined();
    expect(step.shotType).toBeUndefined();
    expect(step.cameraAngle).toBeUndefined();
    expect(step.wordPictureRelation).toBeUndefined();
    expect(step.panelSize).toBeUndefined();
  });

  it("StylePreset accepts characterDNA, styleBible, spatialRules", () => {
    const style: StylePreset = {
      artStyle: "flat-vector",
      background: "white",
      characterDNA: "Blue round water drops, yellow sun circle",
      styleBible: "Flat vector, warm pastels, friendly shapes",
      spatialRules: { maintainLR: true },
    };
    expect(style.characterDNA).toBeTruthy();
    expect(style.styleBible).toBeTruthy();
    expect(style.spatialRules?.maintainLR).toBe(true);
  });

  it("StylePreset is valid without new fields (backward-compat)", () => {
    const style: StylePreset = {
      artStyle: "flat-vector",
      background: "white",
    };
    expect(style.characterDNA).toBeUndefined();
    expect(style.styleBible).toBeUndefined();
    expect(style.spatialRules).toBeUndefined();
  });
});

describe("wasserkreislauf-spec — visual director fields", () => {
  it("has characterDNA and styleBible in style", () => {
    expect(spec.style.characterDNA).toBeTruthy();
    expect(spec.style.styleBible).toBeTruthy();
  });

  it("has spatialRules.maintainLR in style", () => {
    expect(spec.style.spatialRules?.maintainLR).toBe(true);
  });

  it("step 1 has shotType=wide (establishing shot)", () => {
    const step1 = spec.steps.find((s) => s.order === 1)!;
    expect(step1.shotType).toBe("wide");
  });

  it("step 1 has no transitionType (first panel)", () => {
    const step1 = spec.steps.find((s) => s.order === 1)!;
    expect(step1.transitionType).toBeUndefined();
  });

  it("steps 2-5 have transitionType set", () => {
    const laterSteps = spec.steps.filter((s) => s.order > 1);
    for (const step of laterSteps) {
      expect(step.transitionType).toBeDefined();
    }
  });

  it("all defined transitionTypes are valid enum values", () => {
    const valid = ["action-to-action", "subject-to-subject", "scene-to-scene", "aspect-to-aspect"];
    for (const step of spec.steps) {
      if (step.transitionType !== undefined) {
        expect(valid).toContain(step.transitionType);
      }
    }
  });

  it("all defined shotTypes are valid enum values", () => {
    const valid = ["wide", "medium", "close-up"];
    for (const step of spec.steps) {
      if (step.shotType !== undefined) {
        expect(valid).toContain(step.shotType);
      }
    }
  });

  it("all defined cameraAngles are valid enum values", () => {
    const valid = ["eye-level", "high", "low"];
    for (const step of spec.steps) {
      if (step.cameraAngle !== undefined) {
        expect(valid).toContain(step.cameraAngle);
      }
    }
  });

  it("all defined panelSizes are valid enum values", () => {
    const valid = ["small", "medium", "large"];
    for (const step of spec.steps) {
      if (step.panelSize !== undefined) {
        expect(valid).toContain(step.panelSize);
      }
    }
  });
});

describe("schmetterling-spec — backward-compat without visual director fields", () => {
  const butterflySpec = schmetterling as LessonSpec;

  it("loads as valid LessonSpec without visual director fields", () => {
    expect(butterflySpec.id).toBeTruthy();
    expect(butterflySpec.version).toBe(2);
  });

  it("steps have no transitionType (old spec)", () => {
    for (const step of butterflySpec.steps) {
      expect(step.transitionType).toBeUndefined();
    }
  });

  it("style has no characterDNA (old spec)", () => {
    expect(butterflySpec.style.characterDNA).toBeUndefined();
  });
});
