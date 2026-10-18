import { describe, expect, it } from "vitest";
import { initialBasin, stepWater, transition } from "@/lib/experiments/washbasin-model";

describe("washbasin lifecycle", () => {
  it("keeps settings and water on pause, allows paused changes, resumes and resets", () => {
    let state = transition(initialBasin(), { type: "plug" });
    expect(state).toMatchObject({ plugged: false, phase: "running", volume: 0 });
    state = transition(state, { type: "tap" });
    state = transition(state, { type: "tick", seconds: 2 });
    expect(state.volume).toBeGreaterThan(0);
    state = transition(state, { type: "pause" });
    const volume = state.volume;
    state = transition(state, { type: "plug" });
    state = transition(state, { type: "tap" });
    expect(state).toMatchObject({ volume, phase: "paused", plugged: true, tapOpen: false });
    expect(transition(state, { type: "tick", seconds: 100 })).toBe(state);
    state = transition(state, { type: "resume" });
    expect(state.phase).toBe("running");
    expect(transition(state, { type: "reset" })).toEqual(initialBasin());
    expect(transition(initialBasin(), { type: "pause" })).toEqual(initialBasin());
    expect(transition(state, { type: "tick", seconds: 0.1 })).toBe(state);
  });

  it("manual mode only advances on explicit steps and never auto-resumes on preference changes", () => {
    let state = transition(initialBasin(), { type: "motion", reduced: true });
    state = transition(state, { type: "tap" });
    expect(state).toMatchObject({ volume: 0, phase: "ready", reduced: true, tapOpen: true });
    expect(transition(state, { type: "tick", seconds: 2 })).toBe(state);
    state = transition(state, { type: "manual" });
    expect(state.volume).toBeCloseTo(1 / 6, 8);
    state = transition(state, { type: "motion", reduced: false });
    expect(state.phase).toBe("paused");
    expect(transition(state, { type: "tick", seconds: 2 })).toBe(state);
    state = transition(state, { type: "resume" });
    state = transition(state, { type: "motion", reduced: true });
    expect(state.phase).toBe("paused");
    expect(transition(state, { type: "reset" })).toMatchObject({ volume: 0, reduced: true, phase: "ready" });
  });
});

describe("washbasin water model", () => {
  it("conserves transported water across empty, draining, equilibrium and overflowing steps", () => {
    for (const volume of [0, 0.001, 0.5, 1]) {
      for (const tapOpen of [false, true]) {
        for (const plugged of [false, true]) {
          const result = stepWater({ ...initialBasin(), volume, tapOpen, plugged }, 20);
          expect(result.volume).toBeGreaterThanOrEqual(0);
          expect(result.volume).toBeLessThanOrEqual(1);
          expect(result.drain).toBeGreaterThanOrEqual(0);
          expect(result.overflow).toBeGreaterThanOrEqual(0);
          expect(volume + result.inflow).toBeCloseTo(result.volume + result.drain + result.overflow, 10);
        }
      }
    }
    const full = { ...initialBasin(), volume: 1, tapOpen: true };
    expect(stepWater(full, 3).overflow).toBeCloseTo(0.25, 10);
    expect(stepWater({ ...full, tapOpen: false, plugged: false }, 13).volume).toBe(0);
    const both = stepWater({ ...full, volume: 0, plugged: false }, 120);
    expect(both.volume).toBeCloseTo(0.25, 3);
    expect(both.drain).toBeGreaterThan(0);
    expect(both.overflow).toBe(0);
  });

  it("produces matching levels across frame rates and preserves long-run mass balance", () => {
    const simulate = (fps: number) => {
      let basin = { ...initialBasin(), volume: 0.8, tapOpen: true, plugged: false };
      let inflow = 0, drain = 0, overflow = 0;
      for (let i = 0; i < 30 * fps; i++) {
        const step = stepWater(basin, 1 / fps);
        basin = { ...basin, volume: step.volume };
        inflow += step.inflow; drain += step.drain; overflow += step.overflow;
      }
      expect(0.8 + inflow).toBeCloseTo(basin.volume + drain + overflow, 9);
      return basin.volume;
    };
    expect(simulate(30)).toBeCloseTo(simulate(144), 4);
  });
  it("starts empty and ready; opening the tap starts a twelve-second fill", () => {
    expect(initialBasin()).toMatchObject({ volume: 0, tapOpen: false, plugged: true, phase: "ready" });
    const running = transition(initialBasin(), { type: "tap" });
    expect(running.phase).toBe("running");
    const result = stepWater(running, 12);
    expect(result.volume).toBeCloseTo(1, 10);
    expect(result.inflow).toBeCloseTo(1, 10);
    expect(result.drain + result.overflow).toBeCloseTo(0, 10);
  });
});
