import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import LessonFlow from "@/components/LessonFlow";
import type { Lesson } from "@/types/lesson";

// Override the global mock from vitest.setup.ts: return mode=quiz
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=quiz"),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/components/SequenceViewer", () => ({
  default: ({ onComplete }: { onComplete: () => void }) =>
    React.createElement(
      "div",
      { "data-testid": "sequence-viewer" },
      React.createElement("button", { onClick: onComplete }, "Sequenz fertig")
    ),
}));

vi.mock("@/components/Quiz", () => ({
  default: ({
    onComplete,
  }: {
    questions: unknown[];
    onComplete: (score: number) => void;
    lessonId?: string;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "quiz" },
      React.createElement("button", { onClick: () => onComplete(1) }, "Quiz fertig")
    ),
}));

vi.mock("@/hooks/useProgress", () => ({
  markComplete: vi.fn(),
  getProgress: vi.fn(() => null),
  getAllProgress: vi.fn(() => ({})),
  reset: vi.fn(),
  useProgress: vi.fn(() => ({
    markComplete: vi.fn(),
    getProgress: vi.fn(),
    getAllProgress: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock("@/data/lessons", () => ({
  allLessons: [],
  lessonsById: {},
}));

const mockLesson: Lesson = {
  id: "butterfly",
  title: "Der Schmetterling",
  description: "Lerne den Lebenszyklus",
  difficulty: 1,
  sequence: [
    { id: "img1", src: "/test/img1.webp", label: "Das Ei", alt: "Ein Ei" },
  ],
  questions: [
    {
      id: "q1",
      questionText: "Was ist das?",
      options: [
        { id: "a1", imageSrc: "/test/a1.webp", label: "Das Ei" },
        { id: "a2", imageSrc: "/test/a2.webp", label: "Die Raupe" },
      ],
      correctOptionId: "a1",
    },
  ],
};

describe("LessonFlow — Wiederholungs-Modus (?mode=quiz)", () => {
  it("startet direkt beim Quiz, überspringt die Bildsequenz", () => {
    render(<LessonFlow lesson={mockLesson} />);
    expect(screen.queryByTestId("sequence-viewer")).toBeNull();
    expect(screen.getByTestId("quiz")).toBeDefined();
  });

  it("zeigt den Quiz-Titel", () => {
    render(<LessonFlow lesson={mockLesson} />);
    expect(screen.getByText("Quiz")).toBeDefined();
  });

  it("zeigt einen Zurück-Link zur Startseite im Quiz", () => {
    render(<LessonFlow lesson={mockLesson} />);
    const backLink = screen.getByRole("link", { name: "Zurück zur Lektionsauswahl" });
    expect(backLink.getAttribute("href")).toBe("/");
  });

  it("zeigt den Ergebnis-Screen nach Quiz-Abschluss", () => {
    render(<LessonFlow lesson={mockLesson} />);
    fireEvent.click(screen.getByText("Quiz fertig"));
    // 1/1 richtig → "Super gemacht!" (allCorrect)
    expect(screen.getByText("Super gemacht!")).toBeDefined();
  });

  it("Nochmal kehrt zum Quiz zurück (nicht zur Sequenz)", () => {
    render(<LessonFlow lesson={mockLesson} />);
    fireEvent.click(screen.getByText("Quiz fertig"));
    fireEvent.click(screen.getByRole("button", { name: "Lektion nochmal lernen" }));
    expect(screen.getByTestId("quiz")).toBeDefined();
    expect(screen.queryByTestId("sequence-viewer")).toBeNull();
  });
});
