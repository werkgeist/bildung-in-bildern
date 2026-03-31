import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";
import { allLessons, lessonsById } from "@/data/lessons";

// Re-export for testing — mirrors the unexported helper in page.tsx
function computeDifficulty(questionCount: number): 1 | 2 | 3 {
  if (questionCount <= 2) return 1;
  if (questionCount <= 4) return 2;
  return 3;
}

describe("allLessons registry", () => {
  it("contains at least 2 lessons", () => {
    expect(allLessons.length).toBeGreaterThanOrEqual(2);
  });

  it("all lessons are accessible by id", () => {
    allLessons.forEach((lesson) => {
      expect(lessonsById[lesson.id]).toBe(lesson);
    });
  });

  it("computed difficulty is always 1, 2 or 3", () => {
    allLessons.forEach((lesson) => {
      const level = computeDifficulty(lesson.questions.length);
      expect([1, 2, 3]).toContain(level);
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

describe("computeDifficulty", () => {
  it("returns 1 for 0-2 questions", () => {
    expect(computeDifficulty(0)).toBe(1);
    expect(computeDifficulty(1)).toBe(1);
    expect(computeDifficulty(2)).toBe(1);
  });

  it("returns 2 for 3-4 questions", () => {
    expect(computeDifficulty(3)).toBe(2);
    expect(computeDifficulty(4)).toBe(2);
  });

  it("returns 3 for 5+ questions", () => {
    expect(computeDifficulty(5)).toBe(3);
    expect(computeDifficulty(10)).toBe(3);
  });
});

describe("DifficultyStars rendering", () => {
  it("renders filled and empty stars matching the aria-label", () => {
    render(<Home />);
    // All rendered difficulty indicators share "von 3" in aria-label
    const diffEls = screen.getAllByLabelText(/Schwierigkeit: \d von 3/);
    expect(diffEls.length).toBeGreaterThan(0);
    // Each element must have exactly 3 star spans using ★ or ☆
    diffEls.forEach((el) => {
      const spans = Array.from(el.querySelectorAll("span"));
      expect(spans).toHaveLength(3);
      spans.forEach((s) => expect(["★", "☆"]).toContain(s.textContent));
    });
  });

  it("renders ★☆☆ for a lesson with 2 questions", () => {
    render(<Home />);
    // schmetterling has 2 questions → difficulty 1 → ★☆☆
    const diffEls = screen.getAllByLabelText("Schwierigkeit: 1 von 3");
    const el = diffEls[0];
    const spans = Array.from(el.querySelectorAll("span"));
    expect(spans[0].textContent).toBe("★");
    expect(spans[1].textContent).toBe("☆");
    expect(spans[2].textContent).toBe("☆");
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
