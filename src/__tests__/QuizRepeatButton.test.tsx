import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, findByRole } from "@testing-library/react";
import QuizRepeatButton from "@/components/QuizRepeatButton";
import * as progressModule from "@/hooks/useProgress";
import type { LessonProgress } from "@/hooks/useProgress";

const completedProgress: LessonProgress = {
  lessonId: "butterfly",
  completedAt: "2026-01-01T00:00:00Z",
  score: 1,
  attempts: 1,
  lastScore: 1,
};

describe("QuizRepeatButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when lesson has not been completed", () => {
    vi.spyOn(progressModule, "getProgress").mockReturnValue(null);
    const { container } = render(<QuizRepeatButton lessonId="butterfly" />);
    // Initially null, effect won't change it since getProgress returns null
    expect(container.firstChild).toBeNull();
  });

  it("renders quiz repeat link when lesson is completed", async () => {
    vi.spyOn(progressModule, "getProgress").mockReturnValue(completedProgress);
    render(<QuizRepeatButton lessonId="butterfly" />);
    const link = await screen.findByText("Quiz wiederholen");
    expect(link).toBeDefined();
  });

  it("links to the correct quiz mode URL", async () => {
    vi.spyOn(progressModule, "getProgress").mockReturnValue(completedProgress);
    render(<QuizRepeatButton lessonId="butterfly" />);
    const link = await screen.findByRole("link", { name: "Quiz wiederholen" });
    expect(link.getAttribute("href")).toBe("/lesson/butterfly?mode=quiz");
  });

  it("checks progress for the provided lessonId", async () => {
    const spy = vi.spyOn(progressModule, "getProgress").mockReturnValue(null);
    render(<QuizRepeatButton lessonId="schmetterling" />);
    expect(spy).toHaveBeenCalledWith("schmetterling");
  });
});
