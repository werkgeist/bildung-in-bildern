import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";
import { allLessons, lessonsById } from "@/data/lessons";

describe("allLessons registry", () => {
  it("contains at least 2 lessons", () => {
    expect(allLessons.length).toBeGreaterThanOrEqual(2);
  });

  it("all lessons are accessible by id", () => {
    allLessons.forEach((lesson) => {
      expect(lessonsById[lesson.id]).toBe(lesson);
    });
  });

  it("all lessons have difficulty set", () => {
    allLessons.forEach((lesson) => {
      expect(lesson.difficulty).toBeGreaterThanOrEqual(1);
      expect(lesson.difficulty).toBeLessThanOrEqual(3);
    });
  });

  it("contains at most 6 lessons (picker constraint)", () => {
    expect(allLessons.length).toBeLessThanOrEqual(6);
  });
});

describe("Home (LessonPicker)", () => {
  it("renders the app title", () => {
    render(<Home />);
    expect(screen.getByText("Bildung in Bildern")).toBeDefined();
  });

  it("renders a card for each lesson", () => {
    render(<Home />);
    allLessons.slice(0, 6).forEach((lesson) => {
      expect(screen.getByText(lesson.title)).toBeDefined();
    });
  });

  it("renders lesson links pointing to correct routes", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    allLessons.slice(0, 6).forEach((lesson) => {
      const link = links.find((el) => el.getAttribute("href") === `/lesson/${lesson.id}`);
      expect(link).toBeDefined();
    });
  });

  it("renders cover images for lessons with sequences", () => {
    render(<Home />);
    allLessons.slice(0, 6).forEach((lesson) => {
      if (lesson.sequence[0]) {
        const img = screen.getByAltText(lesson.sequence[0].alt);
        expect(img).toBeDefined();
      }
    });
  });
});

describe("LessonFlow back button", () => {
  it("shows Zurück link in sequence phase", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    const backLink = screen.getByRole("link");
    expect(backLink.getAttribute("href")).toBe("/");
    expect(backLink.textContent).toContain("Zurück");
  });
});
