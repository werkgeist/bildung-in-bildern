import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";
import { markComplete, reset } from "@/hooks/useProgress";
import QuizRepeatButton from "@/components/QuizRepeatButton";

vi.mock("@/lib/logging", () => ({
  logAnswer: vi.fn(),
}));

vi.mock("@/hooks/useHaptic", () => ({
  useHaptic: () => ({ correct: vi.fn(), incorrect: vi.fn() }),
}));

// Override useSearchParams for quiz mode tests
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

beforeEach(() => {
  localStorage.clear();
  // Reset to no mode by default
  mockSearchParams.delete("mode");
});

describe("LessonFlow – quiz mode (?mode=quiz)", () => {
  it("starts directly in quiz phase, skipping sequence", () => {
    mockSearchParams.set("mode", "quiz");
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    expect(screen.getByText("Quiz")).toBeDefined();
    expect(screen.getByText("Was kommt nach dem Ei?")).toBeDefined();
    // Should NOT show sequence content
    expect(screen.queryByText("Vom Ei zum Schmetterling")).toBeNull();
  });

  it("shows Zurück link in quiz mode", () => {
    mockSearchParams.set("mode", "quiz");
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    const backLink = screen.getByRole("link", { name: "Zurück zur Lektionsauswahl" });
    expect(backLink.getAttribute("href")).toBe("/");
  });

  it("does NOT show Zurück link in normal mode (sequence phase handles it)", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // In normal mode, quiz phase has no back link
    // Navigate to quiz phase
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));
    expect(screen.queryByRole("link", { name: "Zurück zur Lektionsauswahl" })).toBeNull();
  });

  it("Nochmal button in quiz mode restarts quiz (not sequence)", () => {
    mockSearchParams.set("mode", "quiz");
    render(<LessonFlow lesson={schmetterlingsLesson} />);

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    // Now on result screen
    expect(screen.getByText("Super gemacht!")).toBeDefined();

    // Click Nochmal
    fireEvent.click(screen.getByRole("button", { name: "Lektion nochmal lernen" }));

    // Should restart quiz, not sequence
    expect(screen.getByText("Quiz")).toBeDefined();
    expect(screen.getByText("Was kommt nach dem Ei?")).toBeDefined();
    expect(screen.queryByText("Vom Ei zum Schmetterling")).toBeNull();
  });
});

describe("QuizRepeatButton", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when lesson is not completed", () => {
    const { container } = render(<QuizRepeatButton lessonId="schmetterling" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Quiz wiederholen link when lesson is completed", async () => {
    markComplete("schmetterling", 1);
    render(<QuizRepeatButton lessonId="schmetterling" />);
    const link = await screen.findByRole("link", { name: "Quiz wiederholen" });
    expect(link.getAttribute("href")).toBe("/lesson/schmetterling?mode=quiz");
  });

  it("renders nothing for different lesson not yet completed", async () => {
    markComplete("wasserkreislauf", 1);
    const { container } = render(<QuizRepeatButton lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });

  it("disappears after reset", async () => {
    markComplete("schmetterling", 0.5);
    reset("schmetterling");
    const { container } = render(<QuizRepeatButton lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });
});
