import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useHaptic } from "@/hooks/useHaptic";

describe("useHaptic", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("correct() calls navigator.vibrate(50)", () => {
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    const { correct } = useHaptic();
    correct();
    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  it("incorrect() calls navigator.vibrate([50, 30, 50])", () => {
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    const { incorrect } = useHaptic();
    incorrect();
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 50]);
  });

  it("correct() skips vibration when prefers-reduced-motion is set", () => {
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    const { correct } = useHaptic();
    correct();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("incorrect() skips vibration when prefers-reduced-motion is set", () => {
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    const { incorrect } = useHaptic();
    incorrect();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("does not throw when navigator.vibrate is unavailable", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    const { correct, incorrect } = useHaptic();
    expect(() => correct()).not.toThrow();
    expect(() => incorrect()).not.toThrow();
  });
});
