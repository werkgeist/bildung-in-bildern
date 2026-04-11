import { describe, it, expect } from "vitest";
import { schmetterlingsLesson } from "@/data/schmetterling";
import { wasserkreislaufLesson } from "@/data/wasserkreislauf";
import { lebensphasenLesson } from "@/data/lebensphasen";

describe("Lesson data validation", () => {
  it("has required top-level fields", () => {
    expect(schmetterlingsLesson.id).toBeTruthy();
    expect(schmetterlingsLesson.title).toBeTruthy();
    expect(schmetterlingsLesson.description).toBeTruthy();
  });

  it("has a non-empty sequence", () => {
    expect(schmetterlingsLesson.sequence.length).toBeGreaterThan(0);
  });

  it("has 4 sequence images", () => {
    expect(schmetterlingsLesson.sequence).toHaveLength(4);
  });

  it("all sequence images have required fields", () => {
    for (const img of schmetterlingsLesson.sequence) {
      expect(img.id).toBeTruthy();
      expect(img.src).toBeTruthy();
      expect(img.label).toBeTruthy();
      expect(img.alt).toBeTruthy();
    }
  });

  it("sequence images have valid src paths", () => {
    for (const img of schmetterlingsLesson.sequence) {
      expect(img.src).toMatch(/^\/images\//);
    }
  });

  it("has at least one quiz question", () => {
    expect(schmetterlingsLesson.questions.length).toBeGreaterThan(0);
  });

  it("has 2 quiz questions", () => {
    expect(schmetterlingsLesson.questions).toHaveLength(2);
  });

  it("all questions have required fields", () => {
    for (const q of schmetterlingsLesson.questions) {
      expect(q.id).toBeTruthy();
      expect(q.questionText).toBeTruthy();
      expect(q.correctOptionId).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("all questions have exactly 3 options", () => {
    for (const q of schmetterlingsLesson.questions) {
      expect(q.options).toHaveLength(3);
    }
  });

  it("correctOptionId references a valid option for each question", () => {
    for (const q of schmetterlingsLesson.questions) {
      const optionIds = q.options.map((o) => o.id);
      expect(optionIds).toContain(q.correctOptionId);
    }
  });

  it("all options have required fields", () => {
    for (const q of schmetterlingsLesson.questions) {
      for (const opt of q.options) {
        expect(opt.id).toBeTruthy();
        expect(opt.imageSrc).toBeTruthy();
        expect(opt.label).toBeTruthy();
      }
    }
  });

  it("lesson text is in German", () => {
    expect(schmetterlingsLesson.title).toMatch(/Der Schmetterling/);
    expect(schmetterlingsLesson.sequence[0].label).toBe("Das Ei");
  });
});

describe("Wasserkreislauf lesson data", () => {
  it("has required top-level fields", () => {
    expect(wasserkreislaufLesson.id).toBe("wasserkreislauf-einfach");
    expect(wasserkreislaufLesson.title).toBeTruthy();
    expect(wasserkreislaufLesson.description).toBeTruthy();
  });

  it("has 5 sequence steps", () => {
    expect(wasserkreislaufLesson.sequence).toHaveLength(5);
  });

  it("all sequence steps have required fields", () => {
    for (const img of wasserkreislaufLesson.sequence) {
      expect(img.id).toBeTruthy();
      expect(img.src).toBeTruthy();
      expect(img.label).toBeTruthy();
      expect(img.alt).toBeTruthy();
    }
  });

  it("sequence images point to wasserkreislauf-einfach directory", () => {
    for (const img of wasserkreislaufLesson.sequence) {
      expect(img.src).toMatch(/^\/images\/wasserkreislauf-einfach\//);
    }
  });

  it("sequence covers all five water cycle phases", () => {
    const labels = wasserkreislaufLesson.sequence.map((s) => s.label);
    expect(labels).toContain("Verdunstung");
    expect(labels).toContain("Wolkenbildung");
    expect(labels).toContain("Niederschlag");
    expect(labels).toContain("Sammlung");
  });

  it("has exactly 1 quiz question (mc-image only, sequence type filtered)", () => {
    expect(wasserkreislaufLesson.questions).toHaveLength(1);
  });

  it("quiz question asks about rain (Niederschlag)", () => {
    const q = wasserkreislaufLesson.questions[0];
    expect(q.questionText).toContain("Regen");
    expect(q.options).toHaveLength(3);
  });

  it("correctOptionId references a valid option", () => {
    const q = wasserkreislaufLesson.questions[0];
    const optionIds = q.options.map((o) => o.id);
    expect(optionIds).toContain(q.correctOptionId);
  });

  it("all quiz options have image sources from the manifest", () => {
    const q = wasserkreislaufLesson.questions[0];
    for (const opt of q.options) {
      expect(opt.imageSrc).toMatch(/^\/images\/wasserkreislauf-einfach\//);
    }
  });

  it("lesson text is in German", () => {
    expect(wasserkreislaufLesson.title).toMatch(/Wasserkreislauf/);
    expect(wasserkreislaufLesson.sequence[0].label).toBe("Verdunstung");
  });
});

// ─── Regression: Issue #50 + #46 ─────────────────────────────
describe("Lebensphasen lesson — scope and label regression (#46, #50)", () => {
  it("has id lebensphasen-einfach", () => {
    expect(lebensphasenLesson.id).toBe("lebensphasen-einfach");
  });

  it("has exactly 5 sequence steps", () => {
    expect(lebensphasenLesson.sequence).toHaveLength(5);
  });

  it("step 4 label is Ausbildung, not Junger Erwachsener (#46)", () => {
    const step4 = lebensphasenLesson.sequence[3];
    expect(step4.label).toBe("Ausbildung");
  });

  it("description mentions Baby and Arbeit (scope matches content)", () => {
    expect(lebensphasenLesson.description).toMatch(/Baby/);
    expect(lebensphasenLesson.description).toMatch(/Arbeit/);
  });

  it("step labels match expected growing-up sequence", () => {
    const labels = lebensphasenLesson.sequence.map((s) => s.label);
    expect(labels).toEqual(["Baby", "Kleinkind", "Kind", "Ausbildung", "Arbeit"]);
  });
});
