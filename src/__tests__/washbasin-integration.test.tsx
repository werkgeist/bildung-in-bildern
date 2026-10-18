import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import WashbasinPage from "@/app/ausprobieren/waschbecken/page";
import { allLessons } from "@/data/lessons";

describe("experiment integration", () => {
  it("has a separate illustrated home card and leaves all lesson links intact", () => {
    render(<Home />);
    const section = screen.getByRole("region", { name: "Ausprobieren" });
    const link = within(section).getByRole("link", { name: /Waschbecken/ });
    expect(link.getAttribute("href")).toBe("/ausprobieren/waschbecken/");
    expect(link.querySelector("svg")).not.toBeNull();
    const lessons = screen.getByRole("list", { name: "Lektionen" });
    for (const lesson of allLessons.slice(0, 6)) {
      expect(within(lessons).getByRole("link", { name: `Lektion: ${lesson.title}` }).getAttribute("href")).toBe(`/lesson/${lesson.id}`);
    }
  });
  it("renders the native page without a lesson or quiz wrapper", () => {
    render(<WashbasinPage />);
    expect(screen.getByRole("heading", { name: "Das Waschbecken" })).toBeDefined();
    expect(screen.queryByText(/Frage|Punkte/)).toBeNull();
  });
  it("declares German and preserves the existing username gate", () => {
    const layout = readFileSync(resolve(__dirname, "../app/layout.tsx"), "utf8");
    expect(layout).toContain('lang="de"');
    expect(layout).toContain("<AuthGate>{children}</AuthGate>");
  });
});
