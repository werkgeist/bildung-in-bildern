import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";
import { allLessons } from "@/data/lessons";

vi.mock("@/lib/logging", () => ({
  logAnswer: vi.fn(),
}));

vi.mock("@/hooks/useHaptic", () => ({
  useHaptic: () => ({ correct: vi.fn(), incorrect: vi.fn() }),
}));

describe("LessonFlow", () => {
  it("starts in sequence phase showing lesson title", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    expect(screen.getByText("Der Schmetterling")).toBeDefined();
    expect(screen.getByText("Vom Ei zum Schmetterling")).toBeDefined();
  });

  it("shows first sequence image initially", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    expect(screen.getByAltText("Ein kleines Ei auf einem Blatt")).toBeDefined();
    expect(screen.getByText("Das Ei")).toBeDefined();
  });

  it("transitions from sequence to quiz after completing sequence", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Navigate through all 4 sequence images
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));
    expect(screen.getByText("Quiz")).toBeDefined();
    expect(screen.getByText("Was kommt nach dem Ei?")).toBeDefined();
  });

  it("transitions from quiz to result after all questions answered", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));

    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(screen.getByText("Super gemacht!")).toBeDefined();
    expect(screen.getByText("2 von 2 richtig")).toBeDefined();
  });

  it("shows result with partial score when some answers are wrong", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    // Answer q1 wrong
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    fireEvent.click(screen.getByText("Weiter →"));

    // Answer q2 correct
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(screen.getByText("Gut gemacht!")).toBeDefined();
    expect(screen.getByText("1 von 2 richtig")).toBeDefined();
  });

  it("shows retry message when all answers are wrong (0 correct)", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    // Answer both questions wrong
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    fireEvent.click(screen.getByText("Weiter →"));

    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(screen.getByText("Wir schauen uns das nochmal an")).toBeDefined();
    expect(screen.getByText("0 von 2 richtig")).toBeDefined();
    expect(screen.queryByText("Gut gemacht!")).toBeNull();
    expect(screen.queryByText("Super gemacht!")).toBeNull();
  });

  it("zeigt ⭐ (kein lektionsspezifisches Emoji) bei vollständig richtigem Quiz", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    const emojiDiv = document.querySelector("[aria-hidden]");
    expect(emojiDiv?.textContent).toBe("⭐");
    expect(emojiDiv?.textContent).not.toBe("🦋");
  });

  it("restarts lesson from result screen", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    fireEvent.click(screen.getByRole("button", { name: "Lektion nochmal lernen" }));
    expect(screen.getByText("Vom Ei zum Schmetterling")).toBeDefined();
  });

  it("shows Startseite and Nächste Lektion buttons on result screen", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(screen.getByRole("link", { name: "Zurück zur Startseite" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Lektion nochmal lernen" })).toBeDefined();
  });

  it("shows next lesson button when a next lesson exists", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    // schmetterling is first, so next lesson is wasserkreislauf
    const nextLesson = allLessons[1];
    expect(screen.getByRole("link", { name: `Nächste Lektion: ${nextLesson.title}` })).toBeDefined();
  });

  it("shows Quiz wiederholen button on result screen in normal mode", () => {
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    const quizRepeatLink = screen.getByRole("link", { name: "Quiz wiederholen" });
    expect(quizRepeatLink.getAttribute("href")).toBe(`/lesson/${schmetterlingsLesson.id}?mode=quiz`);
  });

  it("hides next lesson button for the last lesson", () => {
    const lastLesson = allLessons[allLessons.length - 1];
    render(<LessonFlow lesson={lastLesson} />);

    // Navigate through sequence
    for (let i = 0; i < lastLesson.sequence.length - 1; i++) {
      fireEvent.click(screen.getByLabelText("Weiter"));
    }
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    // Answer all questions (pick first option each time)
    for (const question of lastLesson.questions) {
      fireEvent.click(screen.getByLabelText(question.options[0].label));
      fireEvent.click(screen.getByText("Weiter →"));
    }

    expect(screen.queryByText("Nächste Lektion")).toBeNull();
  });
});
