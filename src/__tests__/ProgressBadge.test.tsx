import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBadge from "@/components/ProgressBadge";
import { markComplete, markViewed, reset } from "@/hooks/useProgress";

beforeEach(() => {
  localStorage.clear();
});

describe("ProgressBadge", () => {
  it("renders nothing when lesson is not started", () => {
    const { container } = render(<ProgressBadge lessonId="schmetterling" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Quiz-bestanden badge when lesson is passed", async () => {
    markComplete("schmetterling", 1);
    render(<ProgressBadge lessonId="schmetterling" />);
    expect(await screen.findByRole("img", { name: "Quiz bestanden" })).toBeInTheDocument();
  });

  it("renders Angesehen badge when lesson is viewed (failed quiz)", async () => {
    markComplete("schmetterling", 0);
    render(<ProgressBadge lessonId="schmetterling" />);
    expect(await screen.findByRole("img", { name: "Angesehen" })).toBeInTheDocument();
  });

  it("renders Angesehen badge after markViewed", async () => {
    markViewed("schmetterling");
    render(<ProgressBadge lessonId="schmetterling" />);
    expect(await screen.findByRole("img", { name: "Angesehen" })).toBeInTheDocument();
  });

  it("renders nothing for a different lesson that is not started", async () => {
    markComplete("wasserkreislauf", 1);
    const { container } = render(<ProgressBadge lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });

  it("shows Quiz-bestanden badge for score exactly 0.5", async () => {
    markComplete("temperatur", 0.5);
    render(<ProgressBadge lessonId="temperatur" />);
    expect(await screen.findByRole("img", { name: "Quiz bestanden" })).toBeInTheDocument();
  });

  it("shows badge after reset is reversed (re-completing)", async () => {
    markComplete("schmetterling", 1);
    reset("schmetterling");
    const { container } = render(<ProgressBadge lessonId="schmetterling" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });
});
