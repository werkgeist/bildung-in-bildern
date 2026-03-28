import { describe, it, expect } from "vitest";
import { generatePrompts, generateAssetManifest } from "@/lib/generate-prompts";
import type { LessonSpec } from "@/types/lesson-spec";
import schmetterlingSpec from "@/data/examples/schmetterling-spec.json";
import wasserkreislaufSpec from "@/data/examples/wasserkreislauf-spec.json";

// ─── Schmetterling (no Visual Director fields, no characterDNA) ──

describe("generatePrompts — Schmetterling", () => {
  const prompts = generatePrompts(schmetterlingSpec as unknown as LessonSpec);

  it("returns one prompt per step", () => {
    expect(prompts).toHaveLength(schmetterlingSpec.steps.length);
  });

  it("each prompt has all required fields", () => {
    for (const p of prompts) {
      expect(p.stepId).toBeTruthy();
      expect(typeof p.order).toBe("number");
      expect(p.label).toBeTruthy();
      expect(p.prompt.length).toBeGreaterThan(10);
      expect(typeof p.negativePrompt).toBe("string");
    }
  });

  it("stepIds match spec step ids in order", () => {
    for (let i = 0; i < prompts.length; i++) {
      expect(prompts[i].stepId).toBe(schmetterlingSpec.steps[i].id);
      expect(prompts[i].order).toBe(i + 1);
    }
  });

  it("prompt contains mustInclude items", () => {
    const step = schmetterlingSpec.steps[0];
    const p = prompts[0];
    for (const item of step.mustInclude) {
      expect(p.prompt).toContain(item);
    }
  });

  it("negativePrompt contains mustAvoid items", () => {
    const step = schmetterlingSpec.steps[0];
    const p = prompts[0];
    for (const item of step.mustAvoid ?? []) {
      expect(p.negativePrompt).toContain(item);
    }
  });

  it("negativePrompt contains the global style negativePrompt", () => {
    // schmetterling has negativePrompt: "text, letters, watermark, ..."
    expect(prompts[0].negativePrompt).toContain("text");
    expect(prompts[0].negativePrompt).toContain("watermark");
  });

  it("falls back to style preset prefix when no characterDNA", () => {
    // schmetterling has no characterDNA, presetName="kyrill-friendly"
    expect(prompts[0].prompt).toContain("Clean, simple vector illustration");
  });

  it("no duplicate comma-separated terms in any prompt", () => {
    for (const p of prompts) {
      const terms = p.prompt.split(",").map((t) => t.trim().toLowerCase());
      const unique = new Set(terms);
      expect(terms.length).toBe(unique.size);
    }
  });
});

// ─── Wasserkreislauf (with Visual Director + characterDNA/styleBible) ──

describe("generatePrompts — Wasserkreislauf (Visual Director fields)", () => {
  const prompts = generatePrompts(wasserkreislaufSpec as unknown as LessonSpec);

  it("returns one prompt per step", () => {
    expect(prompts).toHaveLength(wasserkreislaufSpec.steps.length);
  });

  it("includes characterDNA at the start of each prompt", () => {
    const dnaStart = wasserkreislaufSpec.style.characterDNA!.slice(0, 30);
    for (const p of prompts) {
      expect(p.prompt).toContain(dnaStart);
    }
  });

  it("includes styleBible content in each prompt", () => {
    // styleBible = "Flat-vector, soft gradients, ..."
    // After dedup it appears as separate terms: "Flat-vector" and "soft gradients"
    for (const p of prompts) {
      expect(p.prompt).toContain("soft gradients");
    }
  });

  it("includes shotType keyword for wide shot (step 1)", () => {
    expect(prompts[0].prompt).toContain("wide shot");
  });

  it("includes shotType keyword for medium shot (step 2)", () => {
    expect(prompts[1].prompt).toContain("medium shot");
  });

  it("includes cameraAngle keyword for high angle (step 4)", () => {
    // step 4: cameraAngle=high
    expect(prompts[3].prompt).toContain("high angle");
  });

  it("includes cameraAngle keyword for eye level (step 1)", () => {
    expect(prompts[0].prompt).toContain("eye level");
  });

  it("includes mustInclude items in each prompt", () => {
    for (let i = 0; i < prompts.length; i++) {
      const step = wasserkreislaufSpec.steps[i];
      for (const item of step.mustInclude) {
        expect(prompts[i].prompt).toContain(item);
      }
    }
  });

  it("negativePrompt contains mustAvoid items", () => {
    // step 1 mustAvoid: ["Wolken", "Regen", "Menschen", "Text"]
    expect(prompts[0].negativePrompt).toContain("Wolken");
    expect(prompts[0].negativePrompt).toContain("Regen");
  });

  it("no duplicate comma-separated terms in any prompt", () => {
    for (const p of prompts) {
      const terms = p.prompt.split(",").map((t) => t.trim().toLowerCase());
      const unique = new Set(terms);
      expect(terms.length).toBe(unique.size);
    }
  });

  it("prompts are compatible with Together.ai API (non-empty strings)", () => {
    for (const p of prompts) {
      expect(p.prompt.trim().length).toBeGreaterThan(20);
      // negativePrompt may be empty but must be a string
      expect(typeof p.negativePrompt).toBe("string");
    }
  });
});

// ─── generateAssetManifest ────────────────────────────────────

describe("generateAssetManifest", () => {
  it("returns correct AssetManifest structure for schmetterling", () => {
    const manifest = generateAssetManifest(schmetterlingSpec as unknown as LessonSpec);
    expect(manifest.lessonId).toBe("schmetterling-lebenszyklus");
    expect(typeof manifest.generatedAt).toBe("string");
    expect(manifest.model).toBe("FLUX.2-dev");
    expect(manifest.assets).toHaveLength(schmetterlingSpec.steps.length);
  });

  it("each asset has refId, prompt, src, size", () => {
    const manifest = generateAssetManifest(schmetterlingSpec as unknown as LessonSpec);
    for (const asset of manifest.assets) {
      expect(asset.refId).toBeTruthy();
      expect(asset.prompt.length).toBeGreaterThan(10);
      expect(typeof asset.src).toBe("string"); // empty string — filled after generation
      expect(asset.size).toBe("1024x1024");
    }
  });

  it("asset refIds match step ids", () => {
    const manifest = generateAssetManifest(schmetterlingSpec as unknown as LessonSpec);
    for (let i = 0; i < manifest.assets.length; i++) {
      expect(manifest.assets[i].refId).toBe(schmetterlingSpec.steps[i].id);
    }
  });

  it("accepts custom model parameter", () => {
    const manifest = generateAssetManifest(
      schmetterlingSpec as unknown as LessonSpec,
      "FLUX.1-schnell"
    );
    expect(manifest.model).toBe("FLUX.1-schnell");
  });

  it("generatedAt is a valid ISO timestamp", () => {
    const manifest = generateAssetManifest(schmetterlingSpec as unknown as LessonSpec);
    expect(() => new Date(manifest.generatedAt)).not.toThrow();
    expect(new Date(manifest.generatedAt).getFullYear()).toBeGreaterThan(2020);
  });

  it("works for wasserkreislauf (5 steps)", () => {
    const manifest = generateAssetManifest(wasserkreislaufSpec as unknown as LessonSpec);
    expect(manifest.lessonId).toBe("wasserkreislauf-einfach");
    expect(manifest.assets).toHaveLength(5);
  });
});
