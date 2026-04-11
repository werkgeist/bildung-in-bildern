import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Root layout (#54)", () => {
  const layoutSource = readFileSync(
    resolve(__dirname, "../app/layout.tsx"),
    "utf-8",
  );

  it("does not import AuthGate", () => {
    expect(layoutSource).not.toContain("AuthGate");
  });

  it("renders children directly without an access gate wrapper", () => {
    expect(layoutSource).toContain("{children}");
  });
});
