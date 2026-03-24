import { describe, it, expect } from "vitest";
import { schmetterlingsLesson } from "@/data/schmetterling";

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
