/**
 * generate-prompts.ts
 *
 * Liest eine LessonSpec v2 JSON und erzeugt Bildgenerierungs-Prompts
 * für jeden Step. Output: JSON-Array mit Prompt + Step-Referenz.
 *
 * Usage: npx tsx scripts/generate-prompts.ts src/data/examples/wasserkreislauf-spec.json
 */

import { readFileSync, writeFileSync } from "fs";

interface LessonSpec {
  id: string;
  style: {
    artStyle: string;
    background: string;
    colorPalette?: string[];
    negativePrompt?: string;
  };
  steps: {
    id: string;
    order: number;
    label: string;
    alt: string;
    concept: string;
    mustInclude: string[];
    mustAvoid?: string[];
    composition?: string;
  }[];
}

interface PromptEntry {
  stepId: string;
  order: number;
  label: string;
  prompt: string;
  negativePrompt: string;
}

// ─── Style Presets ───────────────────────────────────────────

const STYLE_TEMPLATES: Record<string, string> = {
  "flat-vector":
    "flat vector style illustration, clean lines, minimalist, simple geometric shapes, smooth areas of solid color, no texture",
  watercolor:
    "soft watercolor illustration, gentle washes of color, organic shapes, slightly transparent layers",
  "photo-realistic":
    "photorealistic, natural lighting, high detail, sharp focus",
};

const BACKGROUND_TEMPLATES: Record<string, string> = {
  white: "solid white background, lots of negative space",
  "light-gradient-sky":
    "light gradient sky background, soft blue to white, minimal details",
  "scene-appropriate": "appropriate background for the scene, not distracting",
};

// ─── Prompt Builder ──────────────────────────────────────────

/**
 * Translate mustInclude items to English scene description.
 * For MVP: uses a simple mapping approach. Future: LLM translation.
 */
function buildSceneDescription(mustInclude: string[], alt: string): string {
  // Use alt text as base scene description (already descriptive)
  // mustInclude items add specific requirements
  return `${alt}. Key elements: ${mustInclude.join(", ")}`;
}

function buildPrompt(step: LessonSpec["steps"][0], style: LessonSpec["style"]): string {
  const parts: string[] = [];

  // 1. Style
  const styleStr = STYLE_TEMPLATES[style.artStyle] || style.artStyle;
  parts.push(styleStr);

  // 2. Background
  const bgStr = BACKGROUND_TEMPLATES[style.background] || style.background;
  parts.push(bgStr);

  // 3. Scene description from alt + mustInclude
  parts.push(buildSceneDescription(step.mustInclude, step.alt));

  // 4. Composition hint
  if (step.composition) {
    parts.push(`composition: ${step.composition}`);
  }

  // 5. Color palette hint
  if (style.colorPalette && style.colorPalette.length > 0) {
    parts.push(`limited color palette: ${style.colorPalette.join(", ")}`);
  }

  // 6. Standard quality tokens for educational illustrations
  parts.push("centered subject, educational illustration, clear and simple, no text or labels");

  return parts.join(". ");
}

function buildNegativePrompt(
  step: LessonSpec["steps"][0],
  style: LessonSpec["style"]
): string {
  const parts: string[] = [];

  // Global negatives
  if (style.negativePrompt) {
    parts.push(style.negativePrompt);
  }

  // Step-specific mustAvoid
  if (step.mustAvoid && step.mustAvoid.length > 0) {
    parts.push(step.mustAvoid.join(", "));
  }

  return parts.join(", ");
}

// ─── Main ────────────────────────────────────────────────────

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npx tsx scripts/generate-prompts.ts <lesson-spec.json>");
    process.exit(1);
  }

  const raw = readFileSync(inputPath, "utf-8");
  const spec: LessonSpec = JSON.parse(raw);

  const prompts: PromptEntry[] = spec.steps.map((step) => ({
    stepId: step.id,
    order: step.order,
    label: step.label,
    prompt: buildPrompt(step, spec.style),
    negativePrompt: buildNegativePrompt(step, spec.style),
  }));

  // Output
  const outputPath = inputPath.replace(".json", "-prompts.json");
  writeFileSync(outputPath, JSON.stringify(prompts, null, 2));
  console.log(`✅ Generated ${prompts.length} prompts → ${outputPath}`);

  // Also print to stdout for review
  for (const p of prompts) {
    console.log(`\n--- Step ${p.order}: ${p.label} ---`);
    console.log(`Prompt: ${p.prompt}`);
    if (p.negativePrompt) {
      console.log(`Negative: ${p.negativePrompt}`);
    }
  }
}

main();
