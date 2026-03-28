import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DryrunBanner from "@/components/DryrunBanner";

describe("DryrunBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("renders nothing when dryrun is not active", () => {
    const { container } = render(<DryrunBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders testmodus banner when sessionStorage dryrun flag is set", async () => {
    sessionStorage.setItem("bib-dryrun", "1");
    render(<DryrunBanner />);
    // useEffect runs after render — wait for state update
    await screen.findByText(/Testmodus/i);
    expect(screen.getByText(/Testmodus/i)).toBeDefined();
  });

  it("renders testmodus banner when URL has ?dryrun=true", async () => {
    window.history.pushState({}, "", "/?dryrun=true");
    render(<DryrunBanner />);
    await screen.findByText(/Testmodus/i);
    expect(screen.getByText(/Testmodus/i)).toBeDefined();
  });
});
