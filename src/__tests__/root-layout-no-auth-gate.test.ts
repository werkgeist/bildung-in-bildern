import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Root layout (#55)", () => {
  const layoutSource = readFileSync(
    resolve(__dirname, "../app/layout.tsx"),
    "utf-8",
  );

  it("wraps children with AuthGate for the username prompt", () => {
    expect(layoutSource).toContain("AuthGate");
    expect(layoutSource).toContain("<AuthGate>");
  });

  it("does not reference NEXT_PUBLIC_ACCESS_TOKEN", () => {
    expect(layoutSource).not.toContain("NEXT_PUBLIC_ACCESS_TOKEN");
  });
});
