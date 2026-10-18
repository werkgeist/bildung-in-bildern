export type Basin = {
  volume: number;
  tapOpen: boolean;
  plugged: boolean;
  phase: "ready" | "running" | "paused";
  reduced: boolean;
  lastManualFlow?: WaterStep;
};
export type WaterStep = { volume: number; inflow: number; drain: number; overflow: number };
export type Action =
  | { type: "tap" | "plug" | "pause" | "resume" | "reset" | "manual" }
  | { type: "tick"; seconds: number }
  | { type: "motion"; reduced: boolean };

export const FILL_RATE = 1 / 12;

export function initialBasin(): Basin {
  return { volume: 0, tapOpen: false, plugged: true, phase: "ready", reduced: false };
}

// Normalized quantities, not real-world litres. At full height the drain is
// twice the inlet: both open settle at (inlet / drain)^2 = 1/4.
// Bounded 1/240 s integration keeps 30–144 Hz differences below 0.0001.
export const DRAIN_RATE = 1 / 6;
export const MANUAL_SECONDS = 2;
const MAX_STEP = 1 / 240;

export function stepWater(basin: Basin, seconds: number): WaterStep {
  let volume = basin.volume, inflow = 0, drain = 0, overflow = 0;
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return { volume, inflow, drain, overflow };
  }
  const count = Math.ceil(seconds / MAX_STEP);
  const dt = seconds / count;
  for (let i = 0; i < count; i++) {
    const incoming = basin.tapOpen ? FILL_RATE * dt : 0;
    const outgoing = basin.plugged ? 0 : Math.min(volume + incoming, DRAIN_RATE * Math.sqrt(volume) * dt);
    const excess = Math.max(0, volume + incoming - outgoing - 1);
    volume = Math.max(0, volume + incoming - outgoing - excess);
    inflow += incoming;
    drain += outgoing;
    overflow += excess;
  }
  return { volume, inflow, drain, overflow };
}

export function transition(basin: Basin, action: Action): Basin {
  switch (action.type) {
    case "tap":
    case "plug":
      return {
        ...basin, lastManualFlow: undefined,
        ...(action.type === "tap" ? { tapOpen: !basin.tapOpen } : { plugged: !basin.plugged }),
        phase: basin.phase === "ready" && !basin.reduced ? "running" : basin.phase,
      };
    case "pause":
      return basin.phase === "running" ? { ...basin, phase: "paused" } : basin;
    case "resume":
      return !basin.reduced && basin.phase === "paused" ? { ...basin, phase: "running" } : basin;
    case "reset":
      return { ...initialBasin(), reduced: basin.reduced };
    case "motion":
      return action.reduced === basin.reduced ? basin : {
        ...basin, reduced: action.reduced, lastManualFlow: undefined,
        phase: basin.phase === "running" || !action.reduced ? "paused" : basin.phase,
      };
    case "manual": {
      if (!basin.reduced) return basin;
      const result = stepWater(basin, MANUAL_SECONDS);
      return { ...basin, volume: result.volume, lastManualFlow: result };
    }
    case "tick": {
      if (basin.reduced || basin.phase !== "running") return basin;
      const { volume } = stepWater(basin, action.seconds);
      return volume === basin.volume ? basin : { ...basin, volume };
    }
  }
}
