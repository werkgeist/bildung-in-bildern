/**
 * generate-prompts.ts
 *
 * Prompt-Template-Engine: LessonSpec v2 → FLUX Bildgenerierungs-Prompts
 *
 * Template-Logik:
 *   [Character DNA] + [mustInclude als Szene] + [shotType keyword] + [cameraAngle keyword]
 *   + [Style Bible] + [Quality Tags]
 *   Negative: [Style negativePrompt] + [Step mustAvoid]
 *
 * Usage:
 *   import { generatePrompts } from "@/lib/generate-prompts";
 *   const prompts = generatePrompts(spec);
 */

import type { LessonSpec, LessonStep, StylePreset, AssetManifest } from "@/types/lesson-spec";

// ─── Output Types ─────────────────────────────────────────────

export interface ImagePrompt {
  stepId: string;
  order: number;
  label: string;
  prompt: string;
  negativePrompt: string;
}

// ─── Visual Director Keyword Maps ────────────────────────────

const SHOT_TYPE_KEYWORDS: Record<string, string> = {
  wide: "wide shot",
  medium: "medium shot",
  "close-up": "close-up shot",
};

const CAMERA_ANGLE_KEYWORDS: Record<string, string> = {
  "eye-level": "eye level",
  high: "high angle",
  low: "low angle",
};

// ─── Style Preset Fallbacks ───────────────────────────────────

/** Used when spec.style has no characterDNA */
const STYLE_PRESET_PREFIXES: Record<string, string> = {
  "kyrill-friendly":
    "Clean, simple vector illustration, warm colorful style, soft rounded shapes, thick outlines, no texture, high contrast, bold shapes, consistent visual elements",
  "flat-vector":
    "Flat vector style illustration, vibrant colors, clean lines, geometric shapes, minimalist design",
};

const QUALITY_TAGS =
  "centered composition, no text, no letters, no watermark, clear distinct elements";

// ─── Helpers ─────────────────────────────────────────────────

/** Remove duplicate comma-separated terms (case-insensitive). */
function dedup(str: string): string {
  const seen = new Set<string>();
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

// ─── Core Builder ────────────────────────────────────────────

function buildStepPrompt(
  step: LessonStep,
  style: StylePreset
): { prompt: string; negativePrompt: string } {
  const parts: string[] = [];

  // 1. Character DNA (or style preset prefix as fallback)
  if (style.characterDNA) {
    parts.push(style.characterDNA);
  } else {
    const fallback =
      STYLE_PRESET_PREFIXES[style.presetName ?? ""] ??
      STYLE_PRESET_PREFIXES["flat-vector"];
    parts.push(fallback);
  }

  // 2. Scene: mustInclude als Szene
  if (step.mustInclude.length > 0) {
    parts.push(step.mustInclude.join(", "));
  }

  // 3. Shot type keyword (Visual Director)
  if (step.shotType) {
    const kw = SHOT_TYPE_KEYWORDS[step.shotType];
    if (kw) parts.push(kw);
  }

  // 4. Camera angle keyword (Visual Director)
  if (step.cameraAngle) {
    const kw = CAMERA_ANGLE_KEYWORDS[step.cameraAngle];
    if (kw) parts.push(kw);
  }

  // 5. Style Bible (or artStyle as fallback)
  if (style.styleBible) {
    parts.push(style.styleBible);
  } else {
    parts.push(style.artStyle);
  }

  // 6. Quality tags
  parts.push(QUALITY_TAGS);

  const prompt = dedup(parts.join(", "));

  // Negative: global style negativePrompt + step mustAvoid
  const negParts: string[] = [];
  if (style.negativePrompt) negParts.push(style.negativePrompt);
  if (step.mustAvoid && step.mustAvoid.length > 0) {
    negParts.push(step.mustAvoid.join(", "));
  }
  const negativePrompt = dedup(negParts.join(", "));

  return { prompt, negativePrompt };
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Generate FLUX image prompts for every step in a LessonSpec.
 * Automatically prepends Character DNA and appends Style Bible + Quality Tags.
 */
export function generatePrompts(spec: LessonSpec): ImagePrompt[] {
  return spec.steps.map((step) => {
    const { prompt, negativePrompt } = buildStepPrompt(step, spec.style);
    return {
      stepId: step.id,
      order: step.order,
      label: step.label,
      prompt,
      negativePrompt,
    };
  });
}

/**
 * Wrap generatePrompts output into an AssetManifest structure.
 * src fields are empty strings — to be filled after image generation.
 */
export function generateAssetManifest(
  spec: LessonSpec,
  model = "FLUX.2-dev"
): AssetManifest {
  const prompts = generatePrompts(spec);
  return {
    lessonId: spec.id,
    generatedAt: new Date().toISOString(),
    model,
    assets: prompts.map((p) => ({
      refId: p.stepId,
      prompt: p.prompt,
      src: "",
      size: "1024x1024",
    })),
  };
}

// ─── Bonus: Together.ai Batch Generation ─────────────────────

export interface TogetherGenerateOptions {
  model?: string;
  steps?: number;
  width?: number;
  height?: number;
}

export interface TogetherAssetResult {
  stepId: string;
  order: number;
  label: string;
  prompt: string;
  negativePrompt: string;
  /** URL returned by Together.ai */
  url: string;
}

/**
 * Batch-generate images for all steps via Together.ai Images API.
 * Requires a valid TOGETHER_API_KEY.
 *
 * @returns Array of results with Together.ai image URLs
 */
export async function batchGenerateImages(
  spec: LessonSpec,
  apiKey: string,
  opts: TogetherGenerateOptions = {}
): Promise<TogetherAssetResult[]> {
  const {
    model = "black-forest-labs/FLUX.1-schnell",
    steps = 4,
    width = 1024,
    height = 1024,
  } = opts;

  const prompts = generatePrompts(spec);
  const results: TogetherAssetResult[] = [];

  for (const p of prompts) {
    const response = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: p.prompt,
        negative_prompt: p.negativePrompt,
        n: 1,
        steps,
        width,
        height,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Together.ai API error for step ${p.order}: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as { data: { url: string }[] };
    const url = data.data[0]?.url ?? "";

    results.push({ ...p, url });
  }

  return results;
}
