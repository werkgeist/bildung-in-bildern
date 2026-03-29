import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import QuizRepeatLink from "@/components/QuizRepeatLink";
import { markComplete, reset } from "@/hooks/useProgress";

beforeEach(() => {
  localStorage.clear();
});

describe("QuizRepeatLink", () => {
  it("renders nothing when lesson is not completed", async () => {
    const { container } = render(<QuizRepeatLink lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });

  it("renders link when lesson is completed", async () => {
    markComplete("schmetterling", 1);
    render(<QuizRepeatLink lessonId="schmetterling" />);
    const link = await screen.findByRole("link", { name: "Quiz wiederholen" });
    expect(link).toBeInTheDocument();
  });

  it("link points to correct URL with ?mode=quiz param", async () => {
    markComplete("schmetterling", 1);
    render(<QuizRepeatLink lessonId="schmetterling" />);
    const link = await screen.findByRole("link", { name: "Quiz wiederholen" });
    expect(link.getAttribute("href")).toBe("/lesson/schmetterling?mode=quiz");
  });

  it("uses lessonId in the URL for a different lesson", async () => {
    markComplete("wasserkreislauf", 0.5);
    render(<QuizRepeatLink lessonId="wasserkreislauf" />);
    const link = await screen.findByRole("link", { name: "Quiz wiederholen" });
    expect(link.getAttribute("href")).toBe("/lesson/wasserkreislauf?mode=quiz");
  });

  it("renders nothing for a lesson that differs from the completed one", async () => {
    markComplete("wasserkreislauf", 1);
    const { container } = render(<QuizRepeatLink lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing after progress is reset", async () => {
    markComplete("schmetterling", 1);
    reset("schmetterling");
    const { container } = render(<QuizRepeatLink lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });
});
