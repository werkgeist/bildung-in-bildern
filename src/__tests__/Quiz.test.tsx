import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Quiz from "@/components/Quiz";
import type { QuizQuestion } from "@/types/lesson";

vi.mock("@/lib/logging", () => ({
  logAnswer: vi.fn(),
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

  it("handles correct answer selection", async () => {
    vi.useFakeTimers();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const correctBtn = screen.getByLabelText("Die Raupe");
    fireEvent.click(correctBtn);
    expect(correctBtn.getAttribute("aria-pressed")).toBe("true");
    vi.useRealTimers();
  });

  it("handles incorrect answer selection", () => {
    vi.useFakeTimers();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    const wrongBtn = screen.getByLabelText("Der Schmetterling");
    fireEvent.click(wrongBtn);
    expect(wrongBtn.getAttribute("aria-pressed")).toBe("true");
    vi.useRealTimers();
  });

  it("disables options after selection", () => {
    vi.useFakeTimers();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Die Raupe"));
    const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
    expect(buttons.every((b) => b.disabled)).toBe(true);
    vi.useRealTimers();
  });

  it("calls onComplete with score after all questions answered", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<Quiz questions={questions} onComplete={onComplete} />);

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    await act(async () => { vi.advanceTimersByTime(1200); });

    fireEvent.click(screen.getByLabelText("Die Puppe"));
    await act(async () => { vi.advanceTimersByTime(1200); });

    expect(onComplete).toHaveBeenCalledWith(2);
    vi.useRealTimers();
  });
});
