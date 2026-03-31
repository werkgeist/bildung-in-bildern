import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";

// Override the global useSearchParams mock to return ?mode=quiz for this file
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("mode=quiz"),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/logging", () => ({
  logAnswer: vi.fn(),
}));

vi.mock("@/hooks/useHaptic", () => ({
  useHaptic: () => ({ correct: vi.fn(), incorrect: vi.fn() }),
}));

describe("LessonFlow — Wiederholungs-Modus (?mode=quiz)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts directly at quiz phase, skipping the image sequence", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    expect(screen.getByText("Quiz")).toBeDefined();
    // Sequence description should not be visible
    expect(screen.queryByText("Vom Ei zum Schmetterling")).toBeNull();
  });

  it("shows the first quiz question immediately", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    expect(screen.getByText("Was kommt nach dem Ei?")).toBeDefined();
  });

  it("shows a back link to the lesson picker", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    const backLink = screen.getByRole("link", { name: "Zurück zur Lektionsauswahl" });
    expect(backLink.getAttribute("href")).toBe("/");
  });

  it("Nochmal button restarts at quiz phase, not the sequence", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(screen.getByText("Super gemacht!")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Lektion nochmal lernen" }));

    expect(screen.getByText("Quiz")).toBeDefined();
    expect(screen.queryByText("Vom Ei zum Schmetterling")).toBeNull();
  });

  it("completes quiz and shows correct result screen", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(screen.getByText("Super gemacht!")).toBeDefined();
    expect(screen.getByText("2 von 2 richtig")).toBeDefined();
  });

  it("saves progress after completing quiz in repeat mode", async () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    const { getProgress } = await import("@/hooks/useProgress");
    const progress = getProgress(schmetterlingsLesson.id);
    expect(progress).not.toBeNull();
    expect(progress?.score).toBe(1);
  });
});
