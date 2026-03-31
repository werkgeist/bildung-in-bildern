import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Quiz from "@/components/Quiz";
import type { QuizQuestion } from "@/types/lesson";
import { trackEvent } from "@/lib/analytics";

vi.mock("@/lib/logging", () => ({
  logAnswer: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/useHaptic", () => ({
  useHaptic: () => ({ correct: vi.fn(), incorrect: vi.fn() }),
}));

const questions: QuizQuestion[] = [
  {
    id: "q1",
    questionText: "Was kommt nach dem Ei?",
    options: [
      { id: "q1-raupe", imageSrc: "/images/02-raupe.webp", label: "Die Raupe" },
      { id: "q1-schmetterling", imageSrc: "/images/04-schmetterling.webp", label: "Der Schmetterling" },
      { id: "q1-puppe", imageSrc: "/images/03-puppe.webp", label: "Die Puppe" },
    ],
    correctOptionId: "q1-raupe",
  },
  {
    id: "q2",
    questionText: "Was kommt nach der Raupe?",
    options: [
      { id: "q2-ei", imageSrc: "/images/01-ei.webp", label: "Das Ei" },
      { id: "q2-puppe", imageSrc: "/images/03-puppe.webp", label: "Die Puppe" },
      { id: "q2-schmetterling", imageSrc: "/images/04-schmetterling.webp", label: "Der Schmetterling" },
    ],
    correctOptionId: "q2-puppe",
  },
];

describe("Quiz", () => {
  it("renders the question text", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    expect(screen.getByText("Was kommt nach dem Ei?")).toBeDefined();
  });

  it("renders 3 image option buttons", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    expect(screen.getByLabelText("Die Raupe")).toBeDefined();
    expect(screen.getByLabelText("Der Schmetterling")).toBeDefined();
    expect(screen.getByLabelText("Die Puppe")).toBeDefined();
  });

  it("shows question counter", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    expect(screen.getByText("Frage 1 von 2")).toBeDefined();
  });

  it("handles correct answer selection", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const correctBtn = screen.getByLabelText("Die Raupe");
    fireEvent.click(correctBtn);
    expect(correctBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("handles incorrect answer selection", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const wrongBtn = screen.getByLabelText("Der Schmetterling");
    fireEvent.click(wrongBtn);
    expect(wrongBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("disables options after selection", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    const optionButtons = [
      screen.getByLabelText("Die Raupe"),
      screen.getByLabelText("Der Schmetterling"),
      screen.getByLabelText("Die Puppe"),
    ] as HTMLButtonElement[];
    expect(optionButtons.every((b) => b.disabled)).toBe(true);
  });

  it("correct answer button gets green border class", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const correctBtn = screen.getByLabelText("Die Raupe");
    fireEvent.click(correctBtn);
    expect(correctBtn.className).toContain("border-green-500");
  });

  it("incorrect answer button does not get red border class", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const wrongBtn = screen.getByLabelText("Der Schmetterling");
    fireEvent.click(wrongBtn);
    expect(wrongBtn.className).not.toContain("border-red");
  });

  it("incorrect answer button gets amber shadow (no red)", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const wrongBtn = screen.getByLabelText("Der Schmetterling");
    fireEvent.click(wrongBtn);
    expect(wrongBtn.className).toContain("shadow-[0_0_0_4px_rgba(251,191,36,0.7)]");
    expect(wrongBtn.className).not.toContain("red");
  });

  it("correct answer gets pulse animation when wrong answer selected", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    const correctBtn = screen.getByLabelText("Die Raupe");
    expect(correctBtn.className).toContain("animate-correct-pulse");
  });

  it("correct answer shown with green border when wrong answer selected", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    const correctBtn = screen.getByLabelText("Die Raupe");
    expect(correctBtn.className).toContain("border-green-500");
  });

  it("does not show Weiter button before an answer is selected", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    expect(screen.queryByText("Weiter →")).toBeNull();
  });

  it("shows Weiter button after an answer is selected", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    expect(screen.getByText("Weiter →")).toBeDefined();
  });

  it("advances to next question when Weiter button is clicked", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));
    expect(screen.getByText("Frage 2 von 2")).toBeDefined();
  });

  it("does not advance without clicking Weiter button", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    expect(screen.getByText("Frage 1 von 2")).toBeDefined();
  });

  it("incorrect answer button gets amber shadow (not red)", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const wrongBtn = screen.getByLabelText("Der Schmetterling");
    fireEvent.click(wrongBtn);
    expect(wrongBtn.className).toContain("shadow-[0_0_0_4px_rgba(251,191,36,0.7)]");
    expect(wrongBtn.className).not.toMatch(/red/);
  });

  it("correct answer shown with pulse animation when wrong answer selected", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    const correctBtn = screen.getByLabelText("Die Raupe");
    expect(correctBtn.className).toContain("animate-correct-pulse");
  });

  it("no red colors appear on any button after incorrect selection", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      // Check for red color utility classes, not substrings like "motion-reduce"
      expect(btn.className).not.toMatch(/(?:text|bg|border|ring|shadow)-red/);
    });
  });

  it("calls onComplete with score after all questions answered via Weiter button", () => {
    const onComplete = vi.fn();
    render(<Quiz questions={questions} onComplete={onComplete} />);

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    fireEvent.click(screen.getByText("Weiter →"));

    fireEvent.click(screen.getByLabelText("Die Puppe"));
    fireEvent.click(screen.getByText("Weiter →"));

    expect(onComplete).toHaveBeenCalledWith(2);
  });

  it("calls trackEvent with quiz_answer on correct selection when lessonId is provided", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} lessonId="test-lesson" />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: "test-lesson",
        step_type: "quiz_answer",
        step_index: 0,
        answer: "q1-raupe",
        correct: 1,
      })
    );
  });

  it("calls trackEvent with correct: 0 on wrong selection", () => {
    render(<Quiz questions={questions} onComplete={vi.fn()} lessonId="test-lesson" />);
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: "test-lesson",
        step_type: "quiz_answer",
        answer: "q1-schmetterling",
        correct: 0,
      })
    );
  });

  it("does not call trackEvent when lessonId is not provided", () => {
    vi.mocked(trackEvent).mockClear();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
