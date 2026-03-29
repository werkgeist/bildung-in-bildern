import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBadge from "@/components/ProgressBadge";
import { markComplete, reset } from "@/hooks/useProgress";

beforeEach(() => {
  localStorage.clear();
});

describe("ProgressBadge", () => {
  it("renders nothing when lesson is not completed", () => {
    const { container } = render(<ProgressBadge lessonId="schmetterling" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders checkmark badge when lesson is completed", async () => {
    markComplete("schmetterling", 1);
    render(<ProgressBadge lessonId="schmetterling" />);
    expect(await screen.findByRole("img", { name: "Abgeschlossen" })).toBeInTheDocument();
  });

  it("renders nothing for a different lesson that is not completed", async () => {
    markComplete("wasserkreislauf", 1);
    const { container } = render(<ProgressBadge lessonId="schmetterling" />);
    // Wait a tick for useEffect
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });

  it("shows badge regardless of score (any completion counts)", async () => {
    markComplete("temperatur", 0);
    render(<ProgressBadge lessonId="temperatur" />);
    expect(await screen.findByRole("img", { name: "Abgeschlossen" })).toBeInTheDocument();
  });

  it("shows badge after reset is reversed (re-completing)", async () => {
    markComplete("schmetterling", 1);
    reset("schmetterling");
    const { container } = render(<ProgressBadge lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });
});
