"use client";

export function useHaptic() {
  const vibrate = (pattern: number | number[]) => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    correct: () => vibrate(50),
    incorrect: () => vibrate([50, 30, 50]),
  };
}
