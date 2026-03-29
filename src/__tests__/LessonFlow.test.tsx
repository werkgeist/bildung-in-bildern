import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LessonFlow from "@/components/LessonFlow";
import { schmetterlingsLesson } from "@/data/schmetterling";

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

  it("transitions from quiz to result after all questions answered", async () => {
    vi.useFakeTimers();
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    await act(async () => { vi.advanceTimersByTime(1200); });

    fireEvent.click(screen.getByLabelText("Die Puppe"));
    await act(async () => { vi.advanceTimersByTime(1200); });

    expect(screen.getByText("Super gemacht!")).toBeDefined();
    expect(screen.getByText("2 von 2 richtig")).toBeDefined();
    vi.useRealTimers();
  });

  it("shows result with partial score when some answers are wrong", async () => {
    vi.useFakeTimers();
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    // Answer q1 wrong
    fireEvent.click(screen.getByLabelText("Der Schmetterling"));
    await act(async () => { vi.advanceTimersByTime(2000); });

    // Answer q2 correct
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    await act(async () => { vi.advanceTimersByTime(1200); });

    expect(screen.getByText("Gut gemacht!")).toBeDefined();
    expect(screen.getByText("1 von 2 richtig")).toBeDefined();
    vi.useRealTimers();
  });

  it("restarts lesson from result screen", async () => {
    vi.useFakeTimers();
    render(<LessonFlow lesson={schmetterlingsLesson} />);
    // Skip sequence
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));

    fireEvent.click(screen.getByLabelText("Die Raupe"));
    await act(async () => { vi.advanceTimersByTime(1200); });
    fireEvent.click(screen.getByLabelText("Die Puppe"));
    await act(async () => { vi.advanceTimersByTime(1200); });

    fireEvent.click(screen.getByText("Nochmal lernen"));
    expect(screen.getByText("Vom Ei zum Schmetterling")).toBeDefined();
    vi.useRealTimers();
  });
});
