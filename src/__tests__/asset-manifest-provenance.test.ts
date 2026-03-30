import { describe, it, expect } from "vitest";
import { generateAssetManifest } from "@/lib/generate-prompts";
import { AssetManifestSchema, AssetEntrySchema } from "@/lib/lesson-spec-schema";
import type { LessonSpec } from "@/types/lesson-spec";
import schmetterlingSpec from "@/data/examples/schmetterling-spec.json";
import schmetterlingManifest from "@/data/examples/schmetterling-manifest.json";

// ─── generateAssetManifest — Provenance Fields ────────────────

describe("generateAssetManifest — provenance fields", () => {
  const manifest = generateAssetManifest(schmetterlingSpec as unknown as LessonSpec);

  it("each asset has negativePrompt string", () => {
    for (const asset of manifest.assets) {
      expect(typeof asset.negativePrompt).toBe("string");
    }
  });

  it("each asset has stepRef matching refId", () => {
    for (const asset of manifest.assets) {
      expect(asset.stepRef).toBe(asset.refId);
    }
  });

  it("each asset has role='story'", () => {
    for (const asset of manifest.assets) {
      expect(asset.role).toBe("story");
    }
  });

  it("each asset has model matching manifest model", () => {
    for (const asset of manifest.assets) {
      expect(asset.model).toBe(manifest.model);
    }
  });

  it("each asset has filePath as empty string (to be filled after generation)", () => {
    for (const asset of manifest.assets) {
      expect(asset.filePath).toBe("");
    }
  });

  it("negativePrompt contains mustAvoid items from spec", () => {
    // step 1: mustAvoid ["Raupe", "Schmetterling", "Puppe"]
    expect(manifest.assets[0].negativePrompt).toContain("Raupe");
    expect(manifest.assets[0].negativePrompt).toContain("Schmetterling");
  });

  it("negativePrompt is populated on custom model", () => {
    const m = generateAssetManifest(schmetterlingSpec as unknown as LessonSpec, "FLUX.1-schnell");
    for (const asset of m.assets) {
      expect(typeof asset.negativePrompt).toBe("string");
      expect(asset.model).toBe("FLUX.1-schnell");
    }
  });
});

// ─── AssetEntrySchema — Zod validation ───────────────────────

describe("AssetEntrySchema", () => {
  it("validates a minimal entry (old format, no provenance fields)", () => {
    const entry = {
      refId: "schmetterling-lebenszyklus-step-1",
      prompt: "A butterfly on a leaf",
      src: "",
    };
    expect(AssetEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("validates a full entry with all provenance fields", () => {
    const entry = {
      refId: "schmetterling-lebenszyklus-step-1",
      prompt: "A butterfly on a leaf",
      src: "public/images/step-1.png",
      size: "1024x1024",
      seed: 42,
      stepRef: "schmetterling-lebenszyklus-step-1",
      role: "story",
      filePath: "public/images/step-1.png",
      negativePrompt: "text, watermark",
      model: "FLUX.2-dev",
      steps: 4,
      generatedAt: "2026-03-30T10:00:00.000Z",
      checksum: "abc123def456",
    };
    expect(AssetEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("rejects invalid role value", () => {
    const entry = {
      refId: "step-1",
      prompt: "test",
      src: "",
      role: "main-image", // not a valid role
    };
    expect(AssetEntrySchema.safeParse(entry).success).toBe(false);
  });

  it("rejects entry missing required refId", () => {
    const entry = { prompt: "test", src: "" };
    expect(AssetEntrySchema.safeParse(entry).success).toBe(false);
  });

  it("accepts all valid role values", () => {
    for (const role of ["story", "quiz-correct", "quiz-distractor"] as const) {
      const entry = { refId: "x", prompt: "test", src: "", role };
      expect(AssetEntrySchema.safeParse(entry).success).toBe(true);
    }
  });
});

// ─── AssetManifestSchema — Zod validation ────────────────────

describe("AssetManifestSchema", () => {
  it("validates the generated schmetterling manifest", () => {
    const result = AssetManifestSchema.safeParse(schmetterlingManifest);
    expect(result.success).toBe(true);
  });

  it("validates a manifest with empty assets array", () => {
    const manifest = {
      lessonId: "test",
      generatedAt: "2026-03-30T10:00:00.000Z",
      model: "FLUX.2-dev",
      assets: [],
    };
    expect(AssetManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it("rejects manifest missing lessonId", () => {
    const manifest = {
      generatedAt: "2026-03-30T10:00:00.000Z",
      model: "FLUX.2-dev",
      assets: [],
    };
    expect(AssetManifestSchema.safeParse(manifest).success).toBe(false);
  });

  it("schmetterling manifest has 4 assets with full provenance", () => {
    const result = AssetManifestSchema.safeParse(schmetterlingManifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assets).toHaveLength(4);
      for (const asset of result.data.assets) {
        expect(asset.stepRef).toBeTruthy();
        expect(asset.role).toBe("story");
        expect(asset.model).toBe("FLUX.2-dev");
        expect(typeof asset.negativePrompt).toBe("string");
      }
    }
  });
});
