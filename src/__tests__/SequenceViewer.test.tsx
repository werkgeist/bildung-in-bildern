import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SequenceViewer from "@/components/SequenceViewer";
import type { LessonImage } from "@/types/lesson";

const sequence: LessonImage[] = [
  { id: "ei", src: "/images/01-ei.webp", label: "Das Ei", alt: "Ein Ei" },
  { id: "raupe", src: "/images/02-raupe.webp", label: "Die Raupe", alt: "Eine Raupe" },
  { id: "puppe", src: "/images/03-puppe.webp", label: "Die Puppe", alt: "Eine Puppe" },
];

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
});
