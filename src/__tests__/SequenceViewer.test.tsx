import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SequenceViewer from "@/components/SequenceViewer";
import type { LessonImage } from "@/types/lesson";
import { trackEvent } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

const sequence: LessonImage[] = [
  { id: "ei", src: "/images/01-ei.webp", label: "Das Ei", alt: "Ein Ei" },
  { id: "raupe", src: "/images/02-raupe.webp", label: "Die Raupe", alt: "Eine Raupe" },
  { id: "puppe", src: "/images/03-puppe.webp", label: "Die Puppe", alt: "Eine Puppe" },
];

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
});

describe("SequenceViewer", () => {
  it("renders the first image and label", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    expect(screen.getByAltText("Ein Ei")).toBeDefined();
    expect(screen.getByText("Das Ei")).toBeDefined();
  });

  it("navigates forward on next button click", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    expect(screen.getByText("Die Raupe")).toBeDefined();
    expect(screen.getByAltText("Eine Raupe")).toBeDefined();
  });

  it("navigates back on previous button click", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Zurück"));
    expect(screen.getByText("Das Ei")).toBeDefined();
  });

  it("back button is disabled on first item", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    const backButton = screen.getByLabelText("Zurück") as HTMLButtonElement;
    expect(backButton.disabled).toBe(true);
  });

  it("calls onComplete when advancing past the last item", () => {
    const onComplete = vi.fn();
    render(<SequenceViewer sequence={sequence} onComplete={onComplete} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Quiz starten"));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("shows progress dots for each item", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  it("marks current dot as selected", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
  });

  it("calls trackEvent with sequence_view on mount when lessonId provided", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} lessonId="schmetterling" />);
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: "schmetterling",
        step_type: "sequence_view",
        step_index: 0,
      })
    );
  });

  it("calls trackEvent with updated step_index on navigation", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} lessonId="schmetterling" />);
    vi.mocked(trackEvent).mockClear();
    fireEvent.click(screen.getByLabelText("Weiter"));
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: "schmetterling",
        step_type: "sequence_view",
        step_index: 1,
      })
    );
  });

  it("does not call trackEvent when lessonId is not provided", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("shows progress counter on first item", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    expect(screen.getByText("Bild 1 von 3")).toBeDefined();
  });

  it("updates progress counter after navigating forward", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    expect(screen.getByText("Bild 2 von 3")).toBeDefined();
  });

  it("shows visible text on back button", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    expect(screen.getByText("Zurück")).toBeDefined();
  });

  it("shows visible text on next button", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    expect(screen.getByText("Weiter")).toBeDefined();
  });

  it("shows 'Quiz starten' text on last item", () => {
    render(<SequenceViewer sequence={sequence} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Weiter"));
    fireEvent.click(screen.getByLabelText("Weiter"));
    expect(screen.getAllByText("Quiz starten").length).toBeGreaterThan(0);
  });
});
