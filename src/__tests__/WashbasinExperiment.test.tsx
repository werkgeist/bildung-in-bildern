import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WashbasinExperiment from "@/components/experiments/WashbasinExperiment";

let callbacks: Map<number, FrameRequestCallback>;
let clock: number;
let nextId: number;
let media: EventTarget & { matches: boolean };
function frame(ms = 100) {
  act(() => {
    clock += ms;
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach((callback) => callback(clock));
  });
}
function advance(seconds: number) {
  for (let i = 0; i < seconds * 10; i++) frame();
}
function changeMotion(reduced: boolean) {
  act(() => { media.matches = reduced; media.dispatchEvent(new Event("change")); });
}
function volume() { return Number(screen.getByTestId("basin-scene").getAttribute("data-volume")); }

beforeEach(() => {
  callbacks = new Map(); clock = 0; nextId = 0;
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callbacks.set(++nextId, callback); return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("washbasin scene", () => {
  it("offers one empty scene, stable controls and repeat-safe keyboard actions", () => {
    render(<WashbasinExperiment />);
    expect(screen.getByRole("heading", { name: "Das Waschbecken" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Pause" }).hasAttribute("disabled")).toBe(true);
    expect(volume()).toBe(0);
    const tap = screen.getByRole("button", { name: "Hahn öffnen" });
    tap.focus(); fireEvent.click(tap);
    expect(screen.getByRole("button", { name: "Hahn schließen" })).toBe(tap);
    expect(document.activeElement).toBe(tap);
    const repeat = new KeyboardEvent("keydown", { key: "Enter", repeat: true, bubbles: true, cancelable: true });
    tap.dispatchEvent(repeat);
    expect(repeat.defaultPrevented).toBe(true);
    expect(screen.getByRole("button", { name: "Hahn schließen" })).toBe(tap);
    frame(); advance(2);
    expect(volume()).toBeGreaterThan(0.15);
    fireEvent.click(screen.getByRole("button", { name: "Stöpsel herausnehmen" }));
    expect(screen.getByRole("button", { name: "Stöpsel einsetzen" })).toBeDefined();
    expect(screen.getByRole("link", { name: /Zur Auswahl/ }).getAttribute("href")).toBe("/");
  });

  it("pauses time, keeps changes paused, resumes without catch-up and resets", () => {
    render(<WashbasinExperiment />);
    fireEvent.click(screen.getByRole("button", { name: "Hahn öffnen" }));
    frame(); advance(2);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    const frozen = volume();
    expect(screen.getByRole("status").textContent).toContain("Versuch pausiert");
    fireEvent.click(screen.getByRole("button", { name: "Stöpsel herausnehmen" }));
    frame(20000);
    expect(volume()).toBe(frozen);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    frame(20000);
    expect(volume()).toBe(frozen);
    frame();
    expect(volume()).not.toBe(frozen);
    fireEvent.click(screen.getByRole("button", { name: "Neu anfangen" }));
    expect(volume()).toBe(0);
    expect(screen.getByRole("button", { name: "Hahn öffnen" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Stöpsel herausnehmen" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Pause" }).hasAttribute("disabled")).toBe(true);
  });

  it("pauses on hidden tab, pagehide and long frame gaps; never resumes itself", () => {
    render(<WashbasinExperiment />);
    fireEvent.click(screen.getByRole("button", { name: "Hahn öffnen" }));
    frame(); advance(1);
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDefined();
    const frozen = volume();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange"));
    frame(10000); expect(volume()).toBe(frozen);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    fireEvent(window, new Event("pagehide"));
    fireEvent(window, new Event("pageshow"));
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    fireEvent(window, Object.assign(new Event("pageshow"), { persisted: true }));
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    frame(); frame(5000);
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDefined();
    expect(volume()).toBe(frozen);
  });

  it("uses explicit two-second steps for reduced motion, with no clock or streams", () => {
    media.matches = true;
    render(<WashbasinExperiment />);
    fireEvent.click(screen.getByRole("button", { name: "Hahn öffnen" }));
    advance(5);
    expect(volume()).toBe(0);
    expect(callbacks.size).toBe(0);
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Wasser weiterlaufen lassen" }));
    expect(volume()).toBeCloseTo(1 / 6, 6);
    expect(screen.queryByTestId("tap-stream")).toBeNull();
    expect(screen.getByRole("status").textContent).not.toMatch(/steigt|sinkt/);
    changeMotion(false);
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDefined();
    const frozen = volume(); advance(5); expect(volume()).toBe(frozen);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    frame(); frame(); expect(volume()).toBeGreaterThan(frozen);
    changeMotion(true);
    expect(callbacks.size).toBe(0);
    changeMotion(false);
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDefined();
  });

  it("explains overflow from a manual reduced-motion step without a running clock", () => {
    media.matches = true;
    render(<WashbasinExperiment />);
    fireEvent.click(screen.getByRole("button", { name: "Hahn öffnen" }));
    for (let i = 0; i < 7; i++) fireEvent.click(screen.getByRole("button", { name: "Wasser weiterlaufen lassen" }));
    expect(volume()).toBe(1);
    expect(screen.getByText("Wasser ist durch diese Öffnung abgelaufen.")).toBeDefined();
    expect(screen.getByTestId("overflow-route")).toBeDefined();
    expect(callbacks.size).toBe(0);
    expect(screen.queryByTestId("tap-stream")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hahn schließen" }));
    expect(screen.queryByTestId("overflow-route")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Neu anfangen" }));
    expect(screen.queryByText("Wasser ist durch diese Öffnung abgelaufen.")).toBeNull();
  });

  it("describes actual flow at full, draining and empty levels without false motion claims", () => {
    render(<WashbasinExperiment />);
    fireEvent.click(screen.getByRole("button", { name: "Hahn öffnen" }));
    frame(); advance(14);
    expect(volume()).toBe(1);
    expect(callbacks.size).toBe(0);
    expect(screen.getByRole("status").textContent).toContain("Wasserstand bleibt gleich");
    expect(screen.getByText("Das Wasser läuft durch diese Öffnung ab.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Hahn schließen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stöpsel herausnehmen" }));
    expect(screen.getByRole("status").textContent).toContain("Wasser sinkt");
    advance(14);
    expect(volume()).toBe(0);
    expect(screen.getByRole("status").textContent).toContain("Becken ist leer");
    expect(screen.getByRole("button", { name: "Pause" }).hasAttribute("disabled")).toBe(false);
  });
});
